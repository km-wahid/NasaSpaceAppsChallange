import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import { createHash } from 'node:crypto'

const parameters = [
  'T2M',
  'T2M_MIN',
  'T2M_MAX',
  'PRECTOTCORR',
  'RH2M',
  'ALLSKY_SFC_SW_DWN',
  'WS10M',
] as const
const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

type PowerResponse = {
  properties: { parameter: Record<(typeof parameters)[number], Record<string, number>> }
  header?: Record<string, unknown>
  geometry?: Record<string, unknown>
}

export async function refreshNasaProfile(farmId: number, userId: number) {
  const farm = await db.from('farms').where({ farm_id: farmId, user_id: userId }).first()
  if (!farm) throw new Error('FARM_NOT_FOUND')
  if (farm.latitude === null || farm.longitude === null)
    throw new Error('Add farm coordinates in optional details before refreshing NASA observations.')
  const version = await db.from('engine_versions').where('is_active', true).first()
  if (!version) throw new Error('ENGINE_VERSION_MISSING')
  const seasons = await db.from('seasons').select('season_id', 'season_name')
  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - 9
  const start = `${startYear}0101`
  const end = `${endYear}1231`
  const baseUrl = env.get('NASA_POWER_BASE_URL', 'https://power.larc.nasa.gov/api')
  const url = new URL(`${baseUrl}/temporal/daily/point`)
  url.search = new URLSearchParams({
    'community': 'AG',
    'format': 'JSON',
    'time-standard': 'LST',
    'parameters': parameters.join(','),
    'latitude': String(farm.latitude),
    'longitude': String(farm.longitude),
    start,
    end,
  }).toString()
  const hash = createHash('sha256').update(url.toString()).digest('hex')
  const cached = await db
    .from('environmental_fetches')
    .where({ request_hash: hash, status: 'succeeded' })
    .first()
  if (cached) {
    const profile = await db
      .from('farm_environment_profiles')
      .whereRaw('? = ANY (SELECT jsonb_array_elements_text(source_fetch_ids)::bigint)', [
        cached.fetch_id,
      ])
      .orderBy('calculated_at', 'desc')
      .first()
    if (profile) return profile
  }

  const [fetchRow] = await db
    .table('environmental_fetches')
    .insert({
      farm_id: farmId,
      request_hash: hash,
      endpoint: '/temporal/daily/point',
      parameters: [...parameters],
      latitude: farm.latitude,
      longitude: farm.longitude,
      start_date: `${startYear}-01-01`,
      end_date: `${endYear}-12-31`,
      status: 'pending',
      source_url: url.toString(),
    })
    .returning('*')

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(env.get('NASA_POWER_TIMEOUT_MS', 30_000)),
    })
    if (!response.ok) throw new Error(`NASA_POWER_${response.status}`)
    const body = (await response.json()) as PowerResponse
    const t2m = body.properties?.parameter?.T2M
    if (!t2m) throw new Error('NASA_POWER_INVALID_RESPONSE')
    const observations = Object.keys(t2m).flatMap((key) => {
      const value = (parameter: (typeof parameters)[number]) => {
        const found = body.properties.parameter[parameter]?.[key]
        return found === undefined || found <= -999 ? null : found
      }
      return value('T2M') === null
        ? []
        : [
            {
              fetch_id: fetchRow.fetch_id,
              observation_date: `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`,
              t2m_c: value('T2M'),
              t2m_min_c: value('T2M_MIN'),
              t2m_max_c: value('T2M_MAX'),
              precipitation_mm: value('PRECTOTCORR'),
              relative_humidity_percent: value('RH2M'),
              solar_radiation: value('ALLSKY_SFC_SW_DWN'),
              wind_speed_m_s: value('WS10M'),
            },
          ]
    })
    await db.transaction(async (trx) => {
      for (let index = 0; index < observations.length; index += 500)
        await trx
          .table('environmental_observations')
          .multiInsert(observations.slice(index, index + 500))
      await trx
        .from('environmental_fetches')
        .where('fetch_id', fetchRow.fetch_id)
        .update({
          status: 'succeeded',
          http_status: 200,
          retrieved_at: new Date(),
          raw_metadata: JSON.stringify({ header: body.header, geometry: body.geometry }),
        })
    })

    const seasonMonths = version.scoring_config.seasonMonths as Record<string, number[]>
    const features: Record<string, unknown> = {}
    for (const season of seasons) {
      const months = seasonMonths[season.season_name]
      if (!months) continue
      const yearly = new Map<number, { rain: number; temperatures: number[] }>()
      for (const observation of observations) {
        const date = new Date(`${observation.observation_date}T00:00:00Z`)
        const month = date.getUTCMonth() + 1
        if (!months.includes(month)) continue
        const seasonYear =
          season.season_name === 'Rabi' && month <= 3
            ? date.getUTCFullYear() - 1
            : date.getUTCFullYear()
        const row = yearly.get(seasonYear) ?? { rain: 0, temperatures: [] }
        row.rain += Number(observation.precipitation_mm ?? 0)
        row.temperatures.push(Number(observation.t2m_c))
        yearly.set(seasonYear, row)
      }
      const rows = [...yearly.values()].filter((row) => row.temperatures.length)
      const rains = rows.map((row) => row.rain)
      const temperatures = rows.flatMap((row) => row.temperatures)
      features[season.season_id] = {
        seasonName: season.season_name,
        rainP25Mm: percentile(rains, 0.25),
        rainMedianMm: percentile(rains, 0.5),
        rainP75Mm: percentile(rains, 0.75),
        meanTemperatureC: temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length,
      }
    }
    const coverage = (100 * observations.length) / ((endYear - startYear + 1) * 365 + 2)
    const [profile] = await db
      .table('farm_environment_profiles')
      .insert({
        farm_id: farmId,
        baseline_start_year: startYear,
        baseline_end_year: endYear,
        data_coverage_percent: Math.min(100, coverage),
        feature_values: JSON.stringify(features),
        source_fetch_ids: JSON.stringify([fetchRow.fetch_id]),
      })
      .returning('*')
    return profile
  } catch (error) {
    await db
      .from('environmental_fetches')
      .where('fetch_id', fetchRow.fetch_id)
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        retrieved_at: new Date(),
      })
    throw error
  }
}
