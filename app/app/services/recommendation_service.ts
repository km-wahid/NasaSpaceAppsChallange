import {
  recommendRotations,
  type Candidate,
  type Scores,
  type TransitionRule,
} from '#services/rotation_engine'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

const clamp = (value: number) => Math.min(100, Math.max(0, value))
const rangeFit = (value: number, minimum: number, maximum: number) =>
  value < minimum
    ? clamp((100 * value) / minimum)
    : value > maximum
      ? clamp((100 * maximum) / value)
      : 100
const levels: Record<string, number> = {
  very_low: 0.1,
  low: 0.3,
  medium: 0.6,
  high: 0.85,
  very_high: 1,
}
const requirements: Record<string, number> = { low: 0.33, medium: 0.67, high: 1 }
const tolerance: Record<string, number> = { low: 0.33, medium: 0.67, high: 1 }
const risk: Record<string, number> = { 'Low': 0.33, 'Moderate': 0.67, 'High': 0.85, 'Very High': 1 }
const hazardScore = (hazard: number, cropTolerance: number) =>
  100 * (1 - hazard * (1 - cropTolerance))
const datePart = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, child]) => [key, canonical(child)])
        )
      : value

export class RecommendationError extends Error {
  constructor(
    public status: number,
    public details: { error: string; [key: string]: unknown }
  ) {
    super(details.error)
  }
}

export async function generateFarmRecommendations(
  userId: number,
  farmId: number,
  input: {
    startSeasonId: number
    startYear?: number
    minimumDistinctCrops?: number
    allowAdjacentRepeat?: boolean
    allowIncompleteFarm?: boolean
  }
) {
  const farm = await db.from('farms').where({ farm_id: farmId, user_id: userId }).first()
  if (!farm) throw new RecommendationError(404, { error: 'FARM_NOT_FOUND' })

  const profile = await db
    .from('farm_environment_profiles')
    .where('farm_id', farm.farm_id)
    .orderBy('calculated_at', 'desc')
    .first()
  const environmentUsable =
    profile &&
    !profile.feature_values?.invalidatedForLocationChange &&
    Date.now() - new Date(profile.calculated_at).getTime() <= 30 * 86_400_000
  if (!profile && !input.allowIncompleteFarm)
    throw new RecommendationError(503, { error: 'ENVIRONMENT_PROFILE_MISSING' })
  if (profile && !environmentUsable && !input.allowIncompleteFarm)
    throw new RecommendationError(503, { error: 'ENVIRONMENT_PROFILE_STALE' })
  const soil = await db
    .from('farm_soil_profiles')
    .where({ farm_id: farm.farm_id, is_current: true })
    .first()
  if (!soil && !input.allowIncompleteFarm)
    throw new RecommendationError(422, { error: 'SOIL_PROFILE_MISSING' })
  const measurements = soil
    ? await db.from('farm_soil_measurements').where('soil_profile_id', soil.soil_profile_id)
    : []
  if (measurements.length < 3 && !input.allowIncompleteFarm)
    throw new RecommendationError(422, { error: 'SOIL_NUTRIENTS_INCOMPLETE' })
  const preference = await db
    .from('farmer_preferences')
    .where('farm_id', farm.farm_id)
    .orderBy('created_at', 'desc')
    .first()
  if (!preference) throw new RecommendationError(422, { error: 'PREFERENCES_MISSING' })
  const version = await db.from('engine_versions').where('is_active', true).first()
  if (!version) throw new RecommendationError(500, { error: 'ENGINE_VERSION_MISSING' })

  const startSeasonId = Number(input.startSeasonId)
  const allSeasons = await db.from('seasons').select('season_id', 'season_name')
  const orderedNames = ['Kharif 2', 'Rabi', 'Kharif 1']
  const startSeason = allSeasons.find((season) => Number(season.season_id) === startSeasonId)
  if (!startSeason || !orderedNames.includes(startSeason.season_name))
    throw new RecommendationError(422, { error: 'INVALID_START_SEASON' })
  const startIndex = orderedNames.indexOf(startSeason.season_name)
  const slots = Array.from({ length: 3 }, (_, index) =>
    allSeasons.find((season) => season.season_name === orderedNames[(startIndex + index) % 3])!
  )
  const histories = await db
    .from('farm_crop_history')
    .where('farm_id', farm.farm_id)
    .orderBy('crop_year', 'desc')
    .orderBy('season_id', 'desc')
    .limit(3)
  const historyComplete =
    histories.length >= 2 && !histories.some((entry) => entry.land_use_type === 'unknown')
  if (!historyComplete && !input.allowIncompleteFarm)
    throw new RecommendationError(422, { error: 'HISTORY_INCOMPLETE' })

  const rows = await db
    .from('crop_requirements as requirement')
    .join('crops as crop', 'crop.crop_id', 'requirement.crop_id')
    .leftJoin('crop_temperature_requirements as temperature', 'temperature.crop_id', 'crop.crop_id')
    .join('crop_calendar_windows as calendar', 'calendar.crop_id', 'crop.crop_id')
    .leftJoin('crop_economic_data as economics', function () {
      this.on('economics.crop_id', '=', 'crop.crop_id').andOn(
        'economics.season_id',
        '=',
        'calendar.season_id'
      )
      this.andOn(function () {
        this.on('economics.district_id', '=', db.knexRawQuery('?', [farm.district_id])).orOnNull(
          'economics.district_id'
        )
      })
        .andOn('economics.valid_from', '<=', db.knexRawQuery('current_date'))
        .andOn('economics.valid_to', '>=', db.knexRawQuery('current_date'))
    })
    .whereIn(
      'calendar.season_id',
      slots.map((slot) => slot.season_id)
    )
    .where((query) =>
      query.where('calendar.district_id', farm.district_id).orWhereNull('calendar.district_id')
    )
    .select(
      'crop.*',
      'requirement.*',
      'temperature.*',
      'calendar.*',
      'economics.*',
      'requirement.source_id as soil_effect_source_id',
      'requirement.crop_id as reference_crop_id',
      'calendar.season_id as season_id'
    )
  if (!rows.length) throw new RecommendationError(422, { error: 'CURATED_CROP_DATA_MISSING' })
  const economicsComplete = rows.every((row) => row.economic_data_id !== null)
  if (!economicsComplete && !input.allowIncompleteFarm)
    throw new RecommendationError(422, { error: 'CROP_ECONOMICS_MISSING' })

  const districtRisk = await db
    .from('district_risk_assessments')
    .where('district_id', farm.district_id)
    .orderBy('batch_id', 'desc')
    .first()
  const nutrient = Object.fromEntries(
    measurements.map((row) => [row.nutrient, levels[row.normalized_status]])
  )
  const features = !environmentUsable
    ? {}
    : typeof profile.feature_values === 'string'
      ? JSON.parse(profile.feature_values)
      : profile.feature_values
  const baseYear = input.startYear ?? new Date().getUTCFullYear()
  let calendarYear = baseYear
  let priorMonth = 0
  const candidateSlots: Array<{ season: string; candidates: Candidate[] }> = []
  const rejectionCounts: Record<string, number> = {}

  for (const slot of slots) {
    const feature = features[String(slot.season_id)]
    if (!feature && !input.allowIncompleteFarm)
      throw new RecommendationError(422, {
        error: 'ENVIRONMENT_SEASON_MISSING',
        season: slot.season_name,
      })
    const slotRows = rows.filter((row) => Number(row.season_id) === Number(slot.season_id))
    const firstMonth = Math.min(...slotRows.map((row) => Number(row.sowing_start_month)))
    if (priorMonth && firstMonth < priorMonth) calendarYear++
    priorMonth = firstMonth
    const profits = slotRows
      .filter((row) => row.economic_data_id !== null)
      .map(
        (row) =>
          Number(row.expected_yield_tonnes_per_hectare) * Number(row.market_price_bdt_per_tonne) -
          Number(row.production_cost_bdt_per_hectare)
      )
    const minProfit = Math.min(...profits)
    const maxProfit = Math.max(...profits)
    const waterNeeds = slotRows
      .filter((row) => row.water_requirement_mm !== null)
      .map((row) => Number(row.water_requirement_mm))
    const minWater = Math.min(...waterNeeds)
    const maxWater = Math.max(...waterNeeds)
    const candidates: Candidate[] = []

    for (const row of slotRows) {
      const waterNeed = row.water_requirement_mm === null ? null : Number(row.water_requirement_mm)
      const availableWater =
        feature && farm.irrigation_available_mm_per_season !== null
          ? Number(feature.rainP25Mm) + Number(farm.irrigation_available_mm_per_season)
          : null
      const coverage =
        availableWater === null || waterNeed === null ? null : availableWater / waterNeed
      const temperatureRange = row.reference_details?.dataset
        ? row.reference_details.temperatureRange
        : row.minimum_temperature_c !== null && row.maximum_temperature_c !== null
          ? [Number(row.minimum_temperature_c), Number(row.maximum_temperature_c)]
          : null
      const temperatureScore =
        feature && temperatureRange
          ? rangeFit(Number(feature.meanTemperatureC), temperatureRange[0], temperatureRange[1])
          : 50
      if (
        (coverage !== null && coverage < Number(version.scoring_config.waterCoverageMinimum)) ||
        (feature &&
          temperatureRange &&
          temperatureScore < Number(version.scoring_config.temperatureFitMinimum)) ||
        (soil &&
          row.ph_min !== null &&
          row.ph_max !== null &&
          (Number(soil.ph) < Number(row.ph_min) || Number(soil.ph) > Number(row.ph_max)))
      ) {
        const code =
          coverage !== null && coverage < Number(version.scoring_config.waterCoverageMinimum)
            ? 'WATER_COVERAGE'
            : temperatureScore < Number(version.scoring_config.temperatureFitMinimum)
              ? 'TEMPERATURE'
              : 'SOIL_PH'
        rejectionCounts[code] = (rejectionCounts[code] ?? 0) + 1
        continue
      }
      const profit =
        row.economic_data_id === null
          ? null
          : Number(row.expected_yield_tonnes_per_hectare) * Number(row.market_price_bdt_per_tonne) -
            Number(row.production_cost_bdt_per_hectare)
      const nutrientKnown =
        row.nitrogen_requirement !== null &&
        row.phosphorus_requirement !== null &&
        row.potassium_requirement !== null
      const nutrientAdequacy =
        measurements.length < 3 || !nutrientKnown
          ? 0
          : (Math.min(1, nutrient.nitrogen / requirements[row.nitrogen_requirement]) +
              Math.min(1, nutrient.phosphorus / requirements[row.phosphorus_requirement]) +
              Math.min(1, nutrient.potassium / requirements[row.potassium_requirement])) /
            3
      const cropEffect =
        row.crop_soil_effect_points === null ? 50 : (Number(row.crop_soil_effect_points) + 100) / 2
      const relativeEfficiency =
        waterNeed === null ? 0.5 : 1 - (waterNeed - minWater) / Math.max(maxWater - minWater, 1)
      const scores: Scores = {
        climate: !feature
          ? 50
          : 0.65 * temperatureScore +
            0.35 *
              (row.rainfall_min_mm === null || row.rainfall_max_mm === null
                ? 50
                : rangeFit(
                    Number(feature.rainMedianMm),
                    Number(row.rainfall_min_mm),
                    Number(row.rainfall_max_mm)
                  )),
        water:
          waterNeed === null
            ? 50
            : coverage === null
              ? maxWater === minWater
                ? 50
                : 100 * relativeEfficiency
              : 100 * (0.75 * Math.min(1, coverage) + 0.25 * relativeEfficiency),
        soil:
          !soil ||
          measurements.length < 3 ||
          !nutrientKnown ||
          row.ph_min === null ||
          row.ph_max === null
            ? cropEffect
            : 0.35 * rangeFit(Number(soil.ph), Number(row.ph_min), Number(row.ph_max)) +
              0.3 * 100 * nutrientAdequacy +
              0.35 * cropEffect,
        resilience:
          0.35 *
            (districtRisk && row.drought_tolerance !== null
              ? hazardScore(risk[districtRisk?.drought_risk] ?? 0, tolerance[row.drought_tolerance])
              : 50) +
          0.35 *
            (districtRisk && row.flood_tolerance !== null
              ? hazardScore(risk[districtRisk?.flood_risk] ?? 0, tolerance[row.flood_tolerance])
              : 50) +
          0.3 *
            (feature && row.heat_tolerance !== null
              ? hazardScore(
                  Math.max(0, (Number(feature.meanTemperatureC) - 30) / 10),
                  tolerance[row.heat_tolerance]
                )
              : 50),
        economic:
          !economicsComplete || profit === null || maxProfit === minProfit
            ? 50
            : (100 * (profit - minProfit)) / (maxProfit - minProfit),
      }
      let endYear = calendarYear
      if (Number(row.sowing_end_month) < Number(row.sowing_start_month)) endYear++
      candidates.push({
        id: Number(row.reference_crop_id),
        name: row.crop_name,
        family: row.botanical_family,
        windowStart: datePart(calendarYear, row.sowing_start_month, row.sowing_start_day),
        windowEnd: datePart(endYear, row.sowing_end_month, row.sowing_end_day),
        durationDays: Math.round(
          (Number(row.duration_min_days) + Number(row.duration_max_days)) / 2
        ),
        waterRequirementMm: waterNeed,
        profitPerHa: profit,
        scores,
        soilEffectPoints:
          row.crop_soil_effect_points === null ? undefined : Number(row.crop_soil_effect_points),
        soilEffectSourceId: String(row.soil_effect_source_id),
        soilNote: row.reference_details?.soilNote,
        nutrientRequirements: {
          n: row.nitrogen_requirement,
          p: row.phosphorus_requirement,
          k: row.potassium_requirement,
        },
        nutrientContributions:
          row.nitrogen_contribution_level === 'none' ? {} : { n: row.nitrogen_contribution_level },
      })
    }
    candidateSlots.push({
      season: slot.season_name,
      candidates: candidates
        .sort((a, b) => b.scores.climate - a.scores.climate)
        .slice(0, Number(version.scoring_config.maxCandidatesPerSlot)),
    })
  }

  if (candidateSlots.some((slot) => !slot.candidates.length))
    throw new RecommendationError(422, { error: 'NO_FEASIBLE_ROTATION', rejectionCounts })
  const ruleRows = await db.from('crop_rotation_rules')
  const rules: TransitionRule[] = ruleRows.map((row) => ({
    fromCropId: Number(row.current_crop_id),
    toCropId: Number(row.recommended_next_crop_id),
    type: row.rule_type,
    compatibility: row.compatibility_score,
    soilAdjustment: row.soil_adjustment_points,
    minimumBreakSeasons: row.minimum_break_seasons,
    turnaroundDays: row.turnaround_days_override ?? undefined,
    reason: row.recommendation_reason,
  }))
  const weights = {
    climate: preference.climate_weight_bp / 100,
    water: preference.water_weight_bp / 100,
    soil: preference.soil_weight_bp / 100,
    resilience: preference.resilience_weight_bp / 100,
    economic: preference.economic_weight_bp / 100,
  }
  const inputSnapshot = canonical({
    engineConfig: version.scoring_config,
    farm,
    soilProfile: { ...soil, measurements },
    environmentProfile: profile,
    districtRisk,
    environmentUsable: Boolean(environmentUsable),
    planningMode: input.allowIncompleteFarm ? 'optional-details' : 'full-farm-checks',
    preferences: weights,
    history: histories,
    cropRequirementsAndEconomics: rows,
    rotationRules: ruleRows,
    slots: candidateSlots,
  })
  const snapshotJson = JSON.stringify(inputSnapshot)
  const result = recommendRotations({
    slots: candidateSlots,
    weights,
    availableWaterMm: slots.map((slot) =>
      features[String(slot.season_id)] && farm.irrigation_available_mm_per_season !== null
        ? Number(features[String(slot.season_id)].rainP25Mm) +
          Number(farm.irrigation_available_mm_per_season)
        : null
    ),
    farmAreaHa: farm.area_hectares === null ? null : Number(farm.area_hectares),
    minimumTurnaroundDays: farm.minimum_turnaround_days,
    minimumDistinctCrops: Number(input.minimumDistinctCrops ?? 2),
    allowAdjacentRepeat: Boolean(input.allowAdjacentRepeat ?? false),
    history: (historyComplete ? histories : []).map((row) => ({
      cropId: row.crop_id ? Number(row.crop_id) : null,
      landUse: row.land_use_type,
      harvestDate: row.harvest_date,
    })),
    rules,
  })

  const missingChecks = [
    ...(rows.some(
      (row) => row.rainfall_min_mm === null || row.reference_details?.temperatureRange === null
    )
      ? [
          'some crop climate requirements (neutral missing components; annual rainfall is not treated as seasonal rainfall)',
        ]
      : []),
    ...(!economicsComplete
      ? [
          'crop prices, yields and costs (income comparison unavailable; neutral economic score for all candidates)',
        ]
      : []),
    ...(rows.some((row) => row.water_requirement_mm === null)
      ? [
          'some crop water requirements (neutral water score where unknown; total demand unavailable)',
        ]
      : []),
    ...(rows.some(
      (row) =>
        row.nitrogen_requirement === null ||
        row.heat_tolerance === null ||
        row.crop_soil_effect_points === null ||
        row.ph_min === null
    )
      ? [
          'some crop soil requirements and hazard tolerances (unknown checks skipped, neutral scores where missing)',
        ]
      : []),
    ...new Set(rows.map((row) => row.reference_details?.scopeNote).filter(Boolean)),
    ...(!districtRisk
      ? ['district hazard assessment (neutral drought and flood scores used)']
      : []),
    ...(!environmentUsable || slots.some((slot) => !features[String(slot.season_id)])
      ? ['complete cached environmental profile (neutral climate score used where missing)']
      : []),
    ...(!soil || measurements.length < 3
      ? ['farm soil test (soil score uses documented crop effects only)']
      : []),
    ...(!historyComplete
      ? ['previous crop history (earlier crop breaks and harvest timing unchecked)']
      : []),
    ...(farm.irrigation_available_mm_per_season === null
      ? ['measured irrigation (water score compares crop demand only)']
      : []),
    ...(farm.area_hectares === null
      ? ['farm size (farm-total profit unavailable; economics compared per hectare)']
      : []),
  ]
  if (missingChecks.length)
    for (const rotation of result.recommendations)
      rotation.explanations.push({
        code: 'OPTIONAL_DETAILS_MISSING',
        kind: 'warning',
        message: `Season-based guidance only. Not checked: ${missingChecks.join('; ')}.`,
      })

  const run = await db.transaction(async (trx) => {
    const [createdRun] = await trx
      .table('recommendation_runs')
      .insert({
        farm_id: farm.farm_id,
        preference_id: preference.preference_id,
        engine_version_id: version.engine_version_id,
        start_season_id: startSeasonId,
        status: 'completed',
        search_mode: rows.length > 25 ? 'bounded' : 'exhaustive',
        candidate_count: candidateSlots.reduce((sum, slot) => sum + slot.candidates.length, 0),
        evaluated_count: result.evaluatedCount,
        rejected_count: result.rejectedCount,
        input_snapshot: snapshotJson,
        input_checksum: createHash('sha256').update(snapshotJson).digest('hex'),
        completed_at: new Date(),
      })
      .returning('*')
    for (const [index, recommendation] of result.recommendations.entries()) {
      const [saved] = await trx
        .table('rotation_recommendations')
        .insert({
          recommendation_run_id: createdRun.recommendation_run_id,
          rank: index + 1,
          overall_score: recommendation.scores.overall,
          climate_score: recommendation.scores.climate,
          water_score: recommendation.scores.water,
          soil_score: recommendation.scores.soil,
          resilience_score: recommendation.scores.resilience,
          economic_score: recommendation.scores.economic,
          compatibility_score: recommendation.scores.compatibility,
          diversity_score: recommendation.scores.diversity,
          total_water_requirement_mm: recommendation.totalWaterRequirementMm,
          total_profit_bdt: recommendation.totalProfit,
          evidence_completeness_percent: missingChecks.length
            ? 0
            : recommendation.explanations.some((item) => item.code === 'UNKNOWN_TRANSITION')
              ? 80
              : 100,
        })
        .returning('*')
      for (const [position, crop] of recommendation.crops.entries())
        await trx.table('rotation_recommendation_items').insert({
          recommendation_id: saved.recommendation_id,
          position: position + 1,
          season_id: slots[position].season_id,
          crop_id: crop.id,
          planting_date: recommendation.plantingDates[position],
          harvest_date: recommendation.harvestDates[position],
          climate_score: crop.scores.climate,
          water_score: crop.scores.water,
          soil_score: crop.scores.soil,
          resilience_score: crop.scores.resilience,
          economic_score: crop.scores.economic,
          weighted_crop_score:
            (crop.scores.climate * weights.climate) / 100 +
            (crop.scores.water * weights.water) / 100 +
            (crop.scores.soil * weights.soil) / 100 +
            (crop.scores.resilience * weights.resilience) / 100 +
            (crop.scores.economic * weights.economic) / 100,
          calculation_trace: JSON.stringify({
            scores: crop.scores,
            waterRequirementMm: crop.waterRequirementMm,
            profitPerHa: crop.profitPerHa,
          }),
        })
      for (const [order, explanation] of recommendation.explanations.entries())
        await trx.table('recommendation_explanations').insert({
          recommendation_id: saved.recommendation_id,
          kind: explanation.kind,
          component: 'rotation',
          explanation_code: explanation.code,
          impact_points: explanation.impactPoints,
          rendered_message: explanation.message,
          evidence: '{}',
          sort_order: order,
        })
    }
    return createdRun
  })
  return {
    runId: run.recommendation_run_id,
    ...result,
    prefilterRejections: rejectionCounts,
    profileType: 'historical seasonal context, not a forecast',
    missingChecks,
  }
}
