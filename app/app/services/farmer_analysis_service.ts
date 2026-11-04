import type { RotationResult } from '#services/rotation_engine'
import { componentDates } from '#services/integrated_farming_service'

export type WaterLevel = 'low' | 'medium' | 'high'
const labels = ['Low', 'Moderate', 'High'] as const
const ordinal = { low: 0, medium: 1, high: 2 }
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const seasonOrder = ['Kharif 2', 'Rabi', 'Kharif 1']

export type DistrictPreviewRow = {
  crop_id: string | number
  crop_name: string
  botanical_family: string
  season_name: string
  sowing_start_month: string | number
  sowing_start_day: string | number
  duration_min_days: string | number
  duration_max_days: string | number
  water_requirement_mm: string | number | null
  crop_soil_effect_points: string | number | null
  soil_effect_source_id: string | number
  reference_details: { soilNote?: string } | string | null
  area_acres?: string | number | null
  reported_yield_metric_tonnes_per_hectare?: string | number | null
}

/** Plan from the next full configured season, not a planting window already in progress. */
export function nextPlanningSeason(seasonMonths: Record<string, number[]>, now = new Date()) {
  const month = now.getUTCMonth() + 1
  const year = now.getUTCFullYear()
  return Object.entries(seasonMonths)
    .map(([name, assigned]) => {
      const start = assigned.find((m) => !assigned.includes(m === 1 ? 12 : m - 1))
      return start ? { name, month: start, year: year + (start <= month ? 1 : 0) } : null
    })
    .filter((season): season is { name: string; month: number; year: number } => season !== null)
    .sort((a, b) => a.year - b.year || a.month - b.month)[0]
}

const isoDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10)
const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

/** A location-level preview from reviewed national calendars plus this district's crop records. */
export function presentDistrictRotationPreviews(
  rows: DistrictPreviewRow[],
  districtName: string,
  start: { name: string; year: number }
) {
  const bySeason = new Map(
    seasonOrder.map((season) => [season, rows.filter((row) => row.season_name === season)])
  )
  if (seasonOrder.some((season) => !bySeason.get(season)?.length)) return []
  const rabi = [...(bySeason.get('Rabi') ?? [])]
    .sort(
      (a, b) =>
        Number(b.area_acres ?? -1) - Number(a.area_acres ?? -1) ||
        Number(b.reported_yield_metric_tonnes_per_hectare ?? -1) -
          Number(a.reported_yield_metric_tonnes_per_hectare ?? -1) ||
        a.crop_name.localeCompare(b.crop_name)
    )
    .slice(0, 3)
  const startIndex = seasonOrder.indexOf(start.name)
  if (startIndex < 0) return []
  const orderedSeasons = Array.from(
    { length: seasonOrder.length },
    (_, index) => seasonOrder[(startIndex + index) % seasonOrder.length]
  )

  return rabi.map((rabiCrop, planIndex) => {
    let year = start.year
    let priorMonth = 0
    const selected = orderedSeasons.map((season) =>
      season === 'Rabi' ? rabiCrop : bySeason.get(season)![0]
    )
    const crops = selected.map((row, position) => {
      const month = Number(row.sowing_start_month)
      if (priorMonth && month < priorMonth) year++
      priorMonth = month
      const plantingDate = isoDate(year, month, Number(row.sowing_start_day))
      const duration = Math.round(
        (Number(row.duration_min_days) + Number(row.duration_max_days)) / 2
      )
      const soilPoints =
        row.crop_soil_effect_points === null ? null : Number(row.crop_soil_effect_points)
      const reference =
        typeof row.reference_details === 'string'
          ? JSON.parse(row.reference_details)
          : row.reference_details
      return {
        id: Number(row.crop_id),
        name: row.crop_name,
        plantingDate,
        harvestDate: addDays(plantingDate, duration),
        waterNeed:
          row.water_requirement_mm === null
            ? ('unknown' as const)
            : Number(row.water_requirement_mm) >= 560
              ? ('high' as const)
              : Number(row.water_requirement_mm) >= 400
                ? ('medium' as const)
                : ('low' as const),
        condition: 'District preview',
        reason:
          position === orderedSeasons.indexOf('Rabi')
            ? `Ranked from ${districtName} crop records and placed in its reviewed national planting window.`
            : 'Placed in its reviewed national planting window to complete the seasonal sequence.',
        nextCrop: selected[position + 1]?.crop_name ?? selected[0].crop_name,
        soilContribution:
          soilPoints === null
            ? 'Soil evidence unavailable'
            : soilPoints > 0
              ? 'Potential soil support'
              : soilPoints < 0
                ? 'Potential soil pressure'
                : 'Neutral reference effect',
        soilSourceId: String(row.soil_effect_source_id),
        soilNote: reference?.soilNote,
      }
    })
    const area = Number(rabiCrop.area_acres)
    const localArea = Number.isFinite(area)
      ? `${Math.round(area).toLocaleString('en')} recorded acres`
      : 'local acreage unavailable'
    const yieldValue = Number(rabiCrop.reported_yield_metric_tonnes_per_hectare)
    const localYield = Number.isFinite(yieldValue)
      ? `${yieldValue.toFixed(2)} t/ha reported yield`
      : 'local yield unavailable'
    return {
      id: `district-${districtName}-${planIndex}`,
      preview: true,
      label: `Local Plan ${String.fromCharCode(65 + planIndex)}`,
      waterDemand: crops.some((crop) => crop.waterNeed === 'unknown')
        ? ('unknown' as const)
        : crops.some((crop) => crop.waterNeed === 'high')
          ? ('high' as const)
          : ('medium' as const),
      fit: `${districtName} preview`,
      soilHealth: crops.some((crop) => crop.soilContribution === 'Potential soil support')
        ? 'Includes a soil-supporting legume slot'
        : 'Soil evidence is incomplete',
      soilNote: 'Potential reference effects, not a measured improvement in your field.',
      combinedGrossMarginBdt: null,
      crops,
      reasons: [
        {
          kind: 'local',
          title: `${rabiCrop.crop_name} in ${districtName}`,
          text: `${localArea} · ${localYield}. This ranks the local preview; it does not predict your harvest.`,
        },
        {
          kind: 'season',
          title: 'Reviewed growing windows',
          text: 'Each crop is placed in a published Bangladesh planting window.',
        },
      ],
      tradeoffs: [
        {
          kind: 'warning',
          text: 'Farm soil, irrigation, crop history and current prices are not checked in this district preview.',
        },
      ],
    }
  })
}
const value = (input: unknown) =>
  input === null || input === undefined
    ? null
    : Number.isFinite(Number(input))
      ? Number(input)
      : null
export const scoreLabel = (score: number) =>
  score >= 70 ? 'Good fit' : score >= 40 ? 'Some trade-offs' : 'Needs care'
const riskLabel = (input: unknown) =>
  typeof input === 'string'
    ? ({ 'Very Low': 'Low', 'Very High': 'High', 'Moderate': 'Medium' }[input] ?? input)
    : 'Not available'

/** Ordinal presentation only. This does not estimate irrigation or replace engine water constraints. */
export function buildWaterOutlook(
  rows: Array<{ season_name: string; rainfall_mm: unknown }>,
  choice: WaterLevel | null,
  seasonMonths: Record<string, number[]>,
  risk: { drought_risk?: unknown; flood_risk?: unknown } | null,
  soil: { soil_nitrogen_status?: unknown } | null
) {
  const rainfall = rows
    .map((row) => value(row.rainfall_mm))
    .filter((n): n is number => n !== null && n >= 0)
  const minimum = rainfall.length ? Math.min(...rainfall) : null
  const maximum = rainfall.length ? Math.max(...rainfall) : null
  const series = months.map((month, index) => {
    const season = rows.find((row) => seasonMonths[row.season_name]?.includes(index + 1))
    const rain = value(season?.rainfall_mm)
    const relativeRain =
      rain === null || rain < 0 || minimum === null || maximum === null
        ? null
        : maximum === minimum
          ? 1
          : Math.min(2, Math.floor((3 * (rain - minimum)) / (maximum - minimum)))
    const outlook =
      relativeRain === null || choice === null
        ? null
        : Math.round((relativeRain + ordinal[choice]) / 2)
    return {
      month,
      level: outlook === null ? 'Not available' : labels[outlook],
      index: outlook,
      rainfall: relativeRain === null ? 'Not available' : labels[relativeRain],
      season: season?.season_name ?? null,
    }
  })
  return {
    level: choice,
    label: choice === null ? 'Not provided' : labels[ordinal[choice]],
    source: 'Farmer-reported water availability with historical seasonal rainfall context',
    chartNote:
      'Season-level patterns shown across their months. This is a planning guide, not a monthly measurement or forecast.',
    series,
    rainfall: rainfall.length ? 'Seasonal' : 'Not available',
    soil:
      typeof soil?.soil_nitrogen_status === 'string'
        ? `${soil.soil_nitrogen_status} nitrogen`
        : 'Not available',
    dryPeriodRisk: riskLabel(risk?.drought_risk),
    heavyRainRisk: riskLabel(risk?.flood_risk),
    waterStress:
      choice === null
        ? 'Not available'
        : choice === 'low'
          ? 'High'
          : choice === 'medium'
            ? 'Medium'
            : 'Low',
    soilStress: 'Needs a farm soil test',
  }
}

/** Uses scheduled dates and calculated components from the existing deterministic engine. */
export function presentRotationPlans(
  rotations: RotationResult[],
  runId: string | number,
  missingChecks: string[] = []
) {
  const soilMissing = missingChecks.some(
    (check) => check.includes('soil test') || check.includes('crop soil requirements')
  )
  const climateMissing = missingChecks.some(
    (check) => check.includes('environmental profile') || check.includes('climate requirements')
  )
  const waterMissing =
    climateMissing ||
    missingChecks.some(
      (check) => check.includes('irrigation') || check.includes('crop water requirements')
    )
  const needs = rotations
    .flatMap((rotation) => rotation.crops.map((crop) => crop.waterRequirementMm))
    .filter((need): need is number => need !== null)
  const min = needs.length ? Math.min(...needs) : 0
  const max = needs.length ? Math.max(...needs) : 0
  const demand = (water: number | null): WaterLevel | 'unknown' =>
    water === null
      ? 'unknown'
      : max === min
        ? 'medium'
        : water <= min + (max - min) / 3
          ? 'low'
          : water <= min + (2 * (max - min)) / 3
            ? 'medium'
            : 'high'
  return rotations.map((rotation, index) => ({
    id: `${runId}-${index}`,
    runId: String(runId),
    rank: index + 1,
    label: `Plan ${String.fromCharCode(65 + index)}`,
    waterDemand: demand(
      rotation.totalWaterRequirementMm === null
        ? null
        : rotation.totalWaterRequirementMm / rotation.crops.length
    ),
    fit: missingChecks.length ? 'Season-based guidance' : scoreLabel(rotation.scores.overall),
    soilHealth: rotation.crops.some((crop) => (crop.soilEffectPoints ?? 0) > 0)
      ? 'Includes potential nitrogen support'
      : rotation.crops.some((crop) => crop.soilEffectPoints === undefined)
        ? 'Soil evidence unavailable'
        : rotation.scores.soil >= 70
          ? 'More soil-supportive'
          : rotation.scores.soil < 40
            ? 'More nutrient pressure'
            : 'Mixed soil effects',
    soilNote:
      'Potential effects from documented crop traits and sequence rules, not a measured improvement in your field.',
    combinedGrossMarginBdt: rotation.totalProfit,
    crops: rotation.crops.map((crop, position) => ({
      id: crop.id,
      name: crop.name,
      plantingDate: rotation.plantingDates[position],
      harvestDate: rotation.harvestDates[position],
      waterNeed: demand(crop.waterRequirementMm),
      condition: missingChecks.length
        ? 'Confirm farm suitability'
        : scoreLabel((crop.scores.water + crop.scores.climate) / 2),
      soilContribution:
        crop.soilEffectPoints === undefined
          ? 'Soil evidence unavailable'
          : crop.soilEffectPoints > 0
            ? 'Potential soil support'
            : crop.soilEffectPoints < 0
              ? 'Potential soil pressure'
              : 'Neutral reference effect',
      soilSourceId: crop.soilEffectSourceId,
      soilNote: crop.soilNote,
      reason: waterMissing
        ? 'Fits the published planting window. Farm water supply has not been checked.'
        : crop.scores.water >= 70
          ? 'Fits the planting window, with favorable water checks for the saved farm inputs.'
          : 'Fits the planting window. Its water needs require careful planning.',
      nextCrop:
        rotation.crops[position + 1]?.name ?? 'Return to the first crop after land preparation',
      system: crop.farmingSystem
        ? {
            id: crop.farmingSystem.id,
            type: crop.farmingSystem.type,
            timingPattern: crop.farmingSystem.timingPattern,
            spatialPattern: crop.farmingSystem.spatialPattern,
            evidenceStatus: crop.farmingSystem.evidenceStatus,
            managementNote: crop.farmingSystem.managementNote,
            components: componentDates(crop, rotation.plantingDates[position]).map((component) => ({
              type: component.type,
              name: component.name,
              role: component.role,
              startDate: component.startDate,
              endDate: component.endDate,
              outputPerHa: component.outputPerHa,
              outputUnit: component.outputUnit,
              grossMarginPerHa: component.revenuePerHa - component.costPerHa,
            })),
          }
        : undefined,
    })),
    reasons: [
      {
        kind: 'water',
        title: 'Water fit',
        text: waterMissing
          ? 'Compared by crop water demand; add irrigation and environmental details to check supply.'
          : rotation.scores.water >= 70
            ? 'Water checks are favorable for your saved supply and these crops.'
            : 'Water fit has trade-offs. Confirm irrigation before planting.',
      },
      {
        kind: 'soil',
        title: 'Soil fit',
        text: soilMissing
          ? 'Uses documented crop effects and rotation rules. Your soil pH and nutrient levels have not been checked.'
          : rotation.scores.soil >= 70
            ? 'Your saved soil measurements fit the crop requirements well.'
            : 'Soil fit has trade-offs. Check nutrient needs with local advice.',
      },
      {
        kind: 'climate',
        title: 'Seasonal fit',
        text: climateMissing
          ? 'Uses published planting windows. Local temperature suitability has not been checked.'
          : rotation.scores.climate >= 70
            ? 'The saved climate context fits these crops well.'
            : 'Climate fit has trade-offs despite passing feasibility checks.',
      },
      {
        kind: 'diversity',
        title: 'Crop diversity',
        text:
          new Set(rotation.crops.map((crop) => crop.family)).size > 1
            ? 'This sequence includes more than one crop family.'
            : 'This sequence has limited crop-family diversity.',
      },
    ],
    tradeoffs: rotation.explanations.map((item) => ({
      kind: item.kind,
      text:
        item.code === 'UNKNOWN_TRANSITION'
          ? 'Some crop-to-crop guidance is still unreviewed.'
          : item.code === 'REPEAT_PENALTY'
            ? 'Repeated crops reduce diversity in this plan.'
            : item.code === 'NUTRIENT_DEPLETION'
              ? 'Some crop transitions add nutrient pressure; review fertilizer needs.'
              : item.message,
    })),
  }))
}
