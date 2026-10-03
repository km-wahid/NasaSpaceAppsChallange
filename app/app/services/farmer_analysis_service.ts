import type { RotationResult } from '#services/rotation_engine'

export type WaterLevel = 'low' | 'medium' | 'high'
const labels = ['Low', 'Moderate', 'High'] as const
const ordinal = { low: 0, medium: 1, high: 2 }
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
  choice: WaterLevel,
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
    const outlook = relativeRain === null ? null : Math.round((relativeRain + ordinal[choice]) / 2)
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
    label: labels[ordinal[choice]],
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
    waterStress: choice === 'low' ? 'High' : choice === 'medium' ? 'Medium' : 'Low',
    soilStress: 'Needs a farm soil test',
  }
}

/** Uses scheduled dates and calculated components from the existing deterministic engine. */
export function presentRotationPlans(rotations: RotationResult[], runId: string | number) {
  const needs = rotations.flatMap((rotation) =>
    rotation.crops.map((crop) => crop.waterRequirementMm)
  )
  const min = needs.length ? Math.min(...needs) : 0
  const max = needs.length ? Math.max(...needs) : 0
  const demand = (water: number): WaterLevel =>
    max === min
      ? 'medium'
      : water <= min + (max - min) / 3
        ? 'low'
        : water <= min + (2 * (max - min)) / 3
          ? 'medium'
          : 'high'
  return rotations.map((rotation, index) => ({
    id: `${runId}-${index}`,
    label: `Plan ${String.fromCharCode(65 + index)}`,
    waterDemand: demand(rotation.totalWaterRequirementMm / rotation.crops.length),
    fit: scoreLabel(rotation.scores.overall),
    crops: rotation.crops.map((crop, position) => ({
      id: crop.id,
      name: crop.name,
      plantingDate: rotation.plantingDates[position],
      harvestDate: rotation.harvestDates[position],
      waterNeed: demand(crop.waterRequirementMm),
      condition: scoreLabel((crop.scores.water + crop.scores.climate) / 2),
      reason:
        crop.scores.water >= 70
          ? 'Fits the planting window, with favorable water checks for the saved farm inputs.'
          : 'Fits the planting window. Its water needs require careful planning.',
      nextCrop:
        rotation.crops[position + 1]?.name ?? 'Return to the first crop after land preparation',
    })),
    reasons: [
      {
        kind: 'water',
        title: 'Water fit',
        text:
          rotation.scores.water >= 70
            ? 'Water checks are favorable for your saved supply and these crops.'
            : 'Water fit has trade-offs. Confirm irrigation before planting.',
      },
      {
        kind: 'soil',
        title: 'Soil fit',
        text:
          rotation.scores.soil >= 70
            ? 'Your saved soil measurements fit the crop requirements well.'
            : 'Soil fit has trade-offs. Check nutrient needs with local advice.',
      },
      {
        kind: 'climate',
        title: 'Seasonal fit',
        text:
          rotation.scores.climate >= 70
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
