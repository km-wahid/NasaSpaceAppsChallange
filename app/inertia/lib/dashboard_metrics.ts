export type ClimateMonthInput = {
  month: number
  meanTemperatureC: number | null
  rainfallMm: number | null
}

export type DashboardCropInput = {
  name: string
  plantingDate: string
  harvestDate: string
  waterNeed: string
  profitPerHa: number | null
  yieldTonnesPerHa: number | null
  yieldKind: 'expected' | 'reported' | null
  soilScore: number | null
  soilMetric: 'farm-fit' | 'reference-effect'
}

export type DashboardPlanInput = {
  rank?: number
  label: string
  crops: DashboardCropInput[]
}

const average = (values: number[]) =>
  values.length
    ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
    : null

export function monthlyClimateAverages(months: ClimateMonthInput[]) {
  return Array.from({ length: 12 }, (_, index) => {
    const rows = months.filter((row) => row.month === index + 1)
    const rainfall = rows
      .map((row) => row.rainfallMm)
      .filter((value): value is number => value !== null && Number.isFinite(value))
    const temperature = rows
      .map((row) => row.meanTemperatureC)
      .filter((value): value is number => value !== null && Number.isFinite(value))
    return {
      month: index + 1,
      rainfallMm: average(rainfall),
      temperatureC: average(temperature),
    }
  })
}

export function dashboardCrops(plans: DashboardPlanInput[], limit = 6) {
  const seen = new Set<string>()
  return [...plans]
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .flatMap((plan) => plan.crops.map((crop) => ({ ...crop, planLabel: plan.label })))
    .filter((crop) => {
      const key = crop.name.trim().toLocaleLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)
}

export function cropEconomicMode(crops: ReturnType<typeof dashboardCrops>) {
  return crops.length > 0 && crops.every((crop) => typeof crop.profitPerHa === 'number')
    ? ('profit' as const)
    : ('yield' as const)
}
