import {
  recommendRotations,
  type Candidate,
  type Scores,
  type TransitionRule,
} from '#services/rotation_engine'
import type { HttpContext } from '@adonisjs/core/http'
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

export default class RecommendationsController {
  async store({ auth, params, request, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })

    const profile = await db
      .from('farm_environment_profiles')
      .where('farm_id', farm.farm_id)
      .orderBy('calculated_at', 'desc')
      .first()
    if (!profile) return response.serviceUnavailable({ error: 'ENVIRONMENT_PROFILE_MISSING' })
    if (Date.now() - new Date(profile.calculated_at).getTime() > 30 * 86_400_000)
      return response.serviceUnavailable({ error: 'ENVIRONMENT_PROFILE_STALE' })
    const soil = await db
      .from('farm_soil_profiles')
      .where({ farm_id: farm.farm_id, is_current: true })
      .first()
    if (!soil) return response.unprocessableEntity({ error: 'SOIL_PROFILE_MISSING' })
    const measurements = await db
      .from('farm_soil_measurements')
      .where('soil_profile_id', soil.soil_profile_id)
    if (measurements.length < 3)
      return response.unprocessableEntity({ error: 'SOIL_NUTRIENTS_INCOMPLETE' })
    const preference = await db
      .from('farmer_preferences')
      .where('farm_id', farm.farm_id)
      .orderBy('created_at', 'desc')
      .first()
    if (!preference) return response.unprocessableEntity({ error: 'PREFERENCES_MISSING' })
    const version = await db.from('engine_versions').where('is_active', true).first()
    if (!version) return response.internalServerError({ error: 'ENGINE_VERSION_MISSING' })

    const startSeasonId = Number(request.input('startSeasonId'))
    const allSeasons = await db.from('seasons').select('season_id', 'season_name')
    const orderedNames = ['Kharif 2', 'Rabi', 'Kharif 1']
    const startSeason = allSeasons.find((season) => Number(season.season_id) === startSeasonId)
    if (!startSeason || !orderedNames.includes(startSeason.season_name))
      return response.unprocessableEntity({ error: 'INVALID_START_SEASON' })
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
    if (histories.length < 2 || histories.some((entry) => entry.land_use_type === 'unknown'))
      return response.unprocessableEntity({ error: 'HISTORY_INCOMPLETE' })

    const rows = await db
      .from('crop_requirements as requirement')
      .join('crops as crop', 'crop.crop_id', 'requirement.crop_id')
      .join('crop_temperature_requirements as temperature', 'temperature.crop_id', 'crop.crop_id')
      .join('crop_calendar_windows as calendar', 'calendar.crop_id', 'crop.crop_id')
      .join('crop_economic_data as economics', function () {
        this.on('economics.crop_id', '=', 'crop.crop_id').andOn(
          'economics.season_id',
          '=',
          'calendar.season_id'
        )
      })
      .whereIn(
        'calendar.season_id',
        slots.map((slot) => slot.season_id)
      )
      .where((query) =>
        query.where('calendar.district_id', farm.district_id).orWhereNull('calendar.district_id')
      )
      .where((query) =>
        query.where('economics.district_id', farm.district_id).orWhereNull('economics.district_id')
      )
      .where('economics.valid_from', '<=', db.raw('current_date'))
      .where('economics.valid_to', '>=', db.raw('current_date'))
      .select('crop.*', 'requirement.*', 'temperature.*', 'calendar.*', 'economics.*')
    if (!rows.length) return response.unprocessableEntity({ error: 'CURATED_CROP_DATA_MISSING' })

    const districtRisk = await db
      .from('district_risk_assessments')
      .where('district_id', farm.district_id)
      .orderBy('batch_id', 'desc')
      .first()
    const nutrient = Object.fromEntries(
      measurements.map((row) => [row.nutrient, levels[row.normalized_status]])
    )
    const features =
      typeof profile.feature_values === 'string'
        ? JSON.parse(profile.feature_values)
        : profile.feature_values
    const baseYear = new Date().getUTCFullYear()
    let calendarYear = baseYear
    let priorMonth = 0
    const candidateSlots: Array<{ season: string; candidates: Candidate[] }> = []
    const rejectionCounts: Record<string, number> = {}

    for (const slot of slots) {
      const feature = features[String(slot.season_id)]
      if (!feature)
        return response.unprocessableEntity({
          error: 'ENVIRONMENT_SEASON_MISSING',
          season: slot.season_name,
        })
      const slotRows = rows.filter((row) => Number(row.season_id) === Number(slot.season_id))
      const firstMonth = Math.min(...slotRows.map((row) => Number(row.sowing_start_month)))
      if (priorMonth && firstMonth < priorMonth) calendarYear++
      priorMonth = firstMonth
      const profits = slotRows.map(
        (row) =>
          Number(row.expected_yield_tonnes_per_hectare) * Number(row.market_price_bdt_per_tonne) -
          Number(row.production_cost_bdt_per_hectare)
      )
      const minProfit = Math.min(...profits)
      const maxProfit = Math.max(...profits)
      const waterNeeds = slotRows.map((row) => Number(row.water_requirement_mm))
      const minWater = Math.min(...waterNeeds)
      const maxWater = Math.max(...waterNeeds)
      const candidates: Candidate[] = []

      for (const row of slotRows) {
        const waterNeed = Number(row.water_requirement_mm)
        const availableWater =
          Number(feature.rainP25Mm) + Number(farm.irrigation_available_mm_per_season)
        const coverage = availableWater / waterNeed
        const temperatureScore = rangeFit(
          Number(feature.meanTemperatureC),
          Number(row.minimum_temperature_c),
          Number(row.maximum_temperature_c)
        )
        if (
          coverage < Number(version.scoring_config.waterCoverageMinimum) ||
          temperatureScore < Number(version.scoring_config.temperatureFitMinimum) ||
          Number(soil.ph) < Number(row.ph_min) ||
          Number(soil.ph) > Number(row.ph_max)
        ) {
          const code =
            coverage < Number(version.scoring_config.waterCoverageMinimum)
              ? 'WATER_COVERAGE'
              : temperatureScore < Number(version.scoring_config.temperatureFitMinimum)
                ? 'TEMPERATURE'
                : 'SOIL_PH'
          rejectionCounts[code] = (rejectionCounts[code] ?? 0) + 1
          continue
        }
        const profit =
          Number(row.expected_yield_tonnes_per_hectare) * Number(row.market_price_bdt_per_tonne) -
          Number(row.production_cost_bdt_per_hectare)
        const nutrientAdequacy =
          (Math.min(1, nutrient.nitrogen / requirements[row.nitrogen_requirement]) +
            Math.min(1, nutrient.phosphorus / requirements[row.phosphorus_requirement]) +
            Math.min(1, nutrient.potassium / requirements[row.potassium_requirement])) /
          3
        const cropEffect = (Number(row.crop_soil_effect_points) + 100) / 2
        const relativeEfficiency = 1 - (waterNeed - minWater) / Math.max(maxWater - minWater, 1)
        const scores: Scores = {
          climate:
            0.65 * temperatureScore +
            0.35 *
              rangeFit(
                Number(feature.rainMedianMm),
                Number(row.rainfall_min_mm),
                Number(row.rainfall_max_mm)
              ),
          water: 100 * (0.75 * Math.min(1, coverage) + 0.25 * relativeEfficiency),
          soil:
            0.35 * rangeFit(Number(soil.ph), Number(row.ph_min), Number(row.ph_max)) +
            0.3 * 100 * nutrientAdequacy +
            0.35 * cropEffect,
          resilience:
            0.35 *
              hazardScore(risk[districtRisk?.drought_risk] ?? 0, tolerance[row.drought_tolerance]) +
            0.35 *
              hazardScore(risk[districtRisk?.flood_risk] ?? 0, tolerance[row.flood_tolerance]) +
            0.3 *
              hazardScore(
                Math.max(0, (Number(feature.meanTemperatureC) - 30) / 10),
                tolerance[row.heat_tolerance]
              ),
          economic:
            maxProfit === minProfit ? 50 : (100 * (profit - minProfit)) / (maxProfit - minProfit),
        }
        let endYear = calendarYear
        if (Number(row.sowing_end_month) < Number(row.sowing_start_month)) endYear++
        candidates.push({
          id: Number(row.crop_id),
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
          nutrientRequirements: {
            n: row.nitrogen_requirement,
            p: row.phosphorus_requirement,
            k: row.potassium_requirement,
          },
          nutrientContributions:
            row.nitrogen_contribution_level === 'none'
              ? {}
              : { n: row.nitrogen_contribution_level },
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
      return response.unprocessableEntity({ error: 'NO_FEASIBLE_ROTATION', rejectionCounts })
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
      availableWaterMm: slots.map(
        (slot) =>
          Number(features[String(slot.season_id)].rainP25Mm) +
          Number(farm.irrigation_available_mm_per_season)
      ),
      farmAreaHa: Number(farm.area_hectares),
      minimumTurnaroundDays: farm.minimum_turnaround_days,
      minimumDistinctCrops: Number(request.input('constraints.minimumDistinctCrops', 2)),
      allowAdjacentRepeat: Boolean(request.input('constraints.allowAdjacentRepeat', false)),
      history: histories.map((row) => ({
        cropId: row.crop_id ? Number(row.crop_id) : null,
        landUse: row.land_use_type,
        harvestDate: row.harvest_date,
      })),
      rules,
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
            evidence_completeness_percent: recommendation.explanations.some(
              (item) => item.code === 'UNKNOWN_TRANSITION'
            )
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
    return response.created({
      runId: run.recommendation_run_id,
      ...result,
      prefilterRejections: rejectionCounts,
      profileType: 'historical seasonal context, not a forecast',
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const run = await db
      .from('recommendation_runs as run')
      .join('farms as farm', 'farm.farm_id', 'run.farm_id')
      .where({ 'run.recommendation_run_id': params.runId, 'farm.user_id': auth.user!.id })
      .select('run.*')
      .first()
    if (!run) return response.notFound({ error: 'RECOMMENDATION_NOT_FOUND' })
    const recommendations = await db
      .from('rotation_recommendations')
      .where('recommendation_run_id', run.recommendation_run_id)
      .orderBy('rank')
    for (const recommendation of recommendations) {
      recommendation.items = await db
        .from('rotation_recommendation_items as item')
        .join('crops as crop', 'crop.crop_id', 'item.crop_id')
        .join('seasons as season', 'season.season_id', 'item.season_id')
        .where('item.recommendation_id', recommendation.recommendation_id)
        .select('item.*', 'crop.crop_name', 'season.season_name')
        .orderBy('position')
      recommendation.explanations = await db
        .from('recommendation_explanations')
        .where('recommendation_id', recommendation.recommendation_id)
        .orderBy('sort_order')
    }
    return response.ok({ run, recommendations })
  }
}
