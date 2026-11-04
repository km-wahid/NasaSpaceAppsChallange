import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

const parameters = ['T2M', 'T2M_MAX', 'PRECTOTCORR'] as const

type Parameter = (typeof parameters)[number]
type PowerResponse = {
  properties?: { parameter?: Partial<Record<Parameter, Record<string, number>>> }
  header?: { api?: { version?: string }; sources?: string[]; fill_value?: number }
}

export type ClimateMonth = {
  year: number
  month: number
  meanTemperatureC: number | null
  maximumTemperatureC: number | null
  rainfallMm: number | null
}

export type ClimateYear = {
  year: number
  meanTemperatureC: number | null
  maximumTemperatureC: number | null
  rainfallMm: number | null
}

export type ClimateHistory = {
  latitude: number
  longitude: number
  startYear: number
  endYear: number
  months: ClimateMonth[]
  years: ClimateYear[]
  warmingCPerDecade: number | null
  source: {
    name: 'NASA POWER'
    temporalResolution: 'monthly'
    retrievedAt: string
    apiVersion: string | null
  }
}

const round = (value: number, places = 2) => Number(value.toFixed(places))
const valid = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > -900
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

export function warmingTrendPerDecade(years: ClimateYear[]) {
  const points = years.filter(
    (row): row is ClimateYear & { meanTemperatureC: number } => row.meanTemperatureC !== null
  )
  if (points.length < 2) return null
  const meanYear = points.reduce((sum, row) => sum + row.year, 0) / points.length
  const meanTemperature = points.reduce((sum, row) => sum + row.meanTemperatureC, 0) / points.length
  const denominator = points.reduce((sum, row) => sum + (row.year - meanYear) ** 2, 0)
  if (!denominator) return null
  const slope =
    points.reduce(
      (sum, row) => sum + (row.year - meanYear) * (row.meanTemperatureC - meanTemperature),
      0
    ) / denominator
  return round(slope * 10, 2)
}

export function buildClimateHistory(
  body: PowerResponse,
  latitude: number,
  longitude: number,
  startYear: number,
  endYear: number,
  retrievedAt = new Date()
): ClimateHistory {
  const values = body.properties?.parameter
  if (!values?.T2M || !values.PRECTOTCORR) throw new Error('NASA_POWER_INVALID_RESPONSE')

  const months: ClimateMonth[] = []
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const key = `${year}${String(month).padStart(2, '0')}`
      const mean = values.T2M[key]
      const maximum = values.T2M_MAX?.[key]
      const rainfallPerDay = values.PRECTOTCORR[key]
      months.push({
        year,
        month,
        meanTemperatureC: valid(mean) ? round(mean) : null,
        maximumTemperatureC: valid(maximum) ? round(maximum) : null,
        rainfallMm: valid(rainfallPerDay)
          ? round(rainfallPerDay * daysInMonth(year, month), 1)
          : null,
      })
    }
  }

  const years: ClimateYear[] = []
  for (let year = startYear; year <= endYear; year++) {
    const annualMonths = months.filter((row) => row.year === year)
    const temperatureMonths = annualMonths.filter(
      (row): row is ClimateMonth & { meanTemperatureC: number } => row.meanTemperatureC !== null
    )
    const rainfallMonths = annualMonths.filter(
      (row): row is ClimateMonth & { rainfallMm: number } => row.rainfallMm !== null
    )
    const annualMaximum = values.T2M_MAX?.[`${year}13`]
    years.push({
      year,
      meanTemperatureC:
        temperatureMonths.length === 12
          ? round(
              temperatureMonths.reduce(
                (sum, row) => sum + row.meanTemperatureC * daysInMonth(year, row.month),
                0
              ) / temperatureMonths.reduce((sum, row) => sum + daysInMonth(year, row.month), 0)
            )
          : null,
      maximumTemperatureC: valid(annualMaximum) ? round(annualMaximum) : null,
      rainfallMm:
        rainfallMonths.length === 12
          ? round(
              rainfallMonths.reduce((sum, row) => sum + row.rainfallMm, 0),
              1
            )
          : null,
    })
  }

  return {
    latitude,
    longitude,
    startYear,
    endYear,
    months,
    years,
    warmingCPerDecade: warmingTrendPerDecade(years),
    source: {
      name: 'NASA POWER',
      temporalResolution: 'monthly',
      retrievedAt: retrievedAt.toISOString(),
      apiVersion: body.header?.api?.version ?? null,
    },
  }
}

export async function getPublicClimateHistory(latitude: number, longitude: number) {
  const roundedLatitude = Number(latitude.toFixed(3))
  const roundedLongitude = Number(longitude.toFixed(3))
  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - 9
  const key = `${roundedLatitude}:${roundedLongitude}:${startYear}:${endYear}:${parameters.join(',')}`
  const requestHash = createHash('sha256').update(key).digest('hex')
  const cached = await db
    .from('public_climate_histories')
    .where('request_hash', requestHash)
    .first()
  if (cached) return cached.payload as ClimateHistory

  const baseUrl = env.get('NASA_POWER_BASE_URL', 'https://power.larc.nasa.gov/api')
  const url = new URL(`${baseUrl}/temporal/monthly/point`)
  url.search = new URLSearchParams({
    community: 'AG',
    format: 'JSON',
    parameters: parameters.join(','),
    latitude: String(roundedLatitude),
    longitude: String(roundedLongitude),
    start: String(startYear),
    end: String(endYear),
  }).toString()
  const response = await fetch(url, {
    signal: AbortSignal.timeout(env.get('NASA_POWER_TIMEOUT_MS', 30_000)),
  })
  if (!response.ok) throw new Error(`NASA_POWER_${response.status}`)
  const retrievedAt = new Date()
  const history = buildClimateHistory(
    (await response.json()) as PowerResponse,
    roundedLatitude,
    roundedLongitude,
    startYear,
    endYear,
    retrievedAt
  )
  await db
    .table('public_climate_histories')
    .insert({
      request_hash: requestHash,
      latitude: roundedLatitude,
      longitude: roundedLongitude,
      start_year: startYear,
      end_year: endYear,
      payload: JSON.stringify(history),
      retrieved_at: retrievedAt,
    })
    .onConflict('request_hash')
    .merge({ payload: JSON.stringify(history), retrieved_at: retrievedAt })
  return history
}
