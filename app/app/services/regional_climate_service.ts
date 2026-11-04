import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

type Metric = 'T2M' | 'PRECTOTCORR'
type RegionalResponse = {
  features?: Array<{
    geometry?: { coordinates?: number[] }
    properties?: { parameter?: Partial<Record<Metric, Record<string, number>>> }
  }>
  header?: { api?: { version?: string } }
}

export type RegionalClimateMap = {
  startYear: number
  endYear: number
  months: string[]
  points: Array<{
    latitude: number
    longitude: number
    temperatureC: Array<number | null>
    rainfallMm: Array<number | null>
  }>
  source: { name: 'NASA POWER'; grid: '0.5° × 0.625°'; retrievedAt: string }
}

const valid = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > -900
const daysInMonth = (key: string) =>
  new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)), 0)).getUTCDate()

export function buildRegionalClimateMap(
  temperature: RegionalResponse,
  rainfall: RegionalResponse,
  startYear: number,
  endYear: number,
  retrievedAt = new Date()
): RegionalClimateMap {
  const rainByCoordinate = new Map(
    (rainfall.features ?? []).map((feature) => [
      feature.geometry?.coordinates?.slice(0, 2).join(':'),
      feature.properties?.parameter?.PRECTOTCORR ?? {},
    ])
  )
  const months = Array.from({ length: (endYear - startYear + 1) * 12 }, (_, index) => {
    const year = startYear + Math.floor(index / 12)
    return `${year}${String((index % 12) + 1).padStart(2, '0')}`
  })
  const points = (temperature.features ?? []).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates
    const values = feature.properties?.parameter?.T2M
    if (!coordinates || coordinates.length < 2 || !values) return []
    const rain = rainByCoordinate.get(coordinates.slice(0, 2).join(':')) ?? {}
    const temperatureC = months.map((key) =>
      valid(values[key]) ? Number(values[key].toFixed(2)) : null
    )
    const rainfallMm = months.map((key) =>
      valid(rain[key]) ? Number((rain[key] * daysInMonth(key)).toFixed(1)) : null
    )
    return [
      {
        longitude: coordinates[0],
        latitude: coordinates[1],
        temperatureC,
        rainfallMm,
      },
    ]
  })
  if (!points.length) throw new Error('NASA_POWER_INVALID_REGIONAL_RESPONSE')
  return {
    startYear,
    endYear,
    months,
    points,
    source: {
      name: 'NASA POWER',
      grid: '0.5° × 0.625°',
      retrievedAt: retrievedAt.toISOString(),
    },
  }
}

export async function getRegionalClimateMap() {
  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - 9
  const requestHash = createHash('sha256')
    .update(`bangladesh:${startYear}:${endYear}:T2M:PRECTOTCORR:v2`)
    .digest('hex')
  const cached = await db.from('regional_climate_maps').where('request_hash', requestHash).first()
  if (cached) return cached.payload as RegionalClimateMap

  const baseUrl = env.get('NASA_POWER_BASE_URL', 'https://power.larc.nasa.gov/api')
  const request = async (parameter: Metric) => {
    const url = new URL(`${baseUrl}/temporal/monthly/regional`)
    url.search = new URLSearchParams({
      'community': 'AG',
      'format': 'JSON',
      'parameters': parameter,
      'latitude-min': '20.3',
      'latitude-max': '26.8',
      'longitude-min': '87.7',
      'longitude-max': '93.1',
      'start': String(startYear),
      'end': String(endYear),
    }).toString()
    const response = await fetch(url, {
      signal: AbortSignal.timeout(env.get('NASA_POWER_TIMEOUT_MS', 30_000)),
    })
    if (!response.ok) throw new Error(`NASA_POWER_${parameter}_${response.status}`)
    return (await response.json()) as RegionalResponse
  }
  const [temperature, rainfall] = await Promise.all([request('T2M'), request('PRECTOTCORR')])
  const retrievedAt = new Date()
  const map = buildRegionalClimateMap(temperature, rainfall, startYear, endYear, retrievedAt)
  await db
    .table('regional_climate_maps')
    .insert({
      request_hash: requestHash,
      start_year: startYear,
      end_year: endYear,
      payload: JSON.stringify(map),
      retrieved_at: retrievedAt,
    })
    .onConflict('request_hash')
    .merge({ payload: JSON.stringify(map), retrieved_at: retrievedAt })
  return map
}
