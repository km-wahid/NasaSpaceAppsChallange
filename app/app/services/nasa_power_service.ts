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
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

type DailyObservation = {
  observation_date: string | Date | { toISODate?: () => string | null }
  t2m_c: number | string | null
  t2m_min_c: number | string | null
  t2m_max_c: number | string | null
  precipitation_mm: number | string | null
}

/** Historical screening features only; none of these values is a field measurement or forecast. */
export function deriveSeasonFeatures(
  observations: DailyObservation[],
  months: number[],
  seasonName: string,
  dryDayThresholdMm = 1
) {
  const byYear = new Map<
    number,
    { rain: Array<number | null>; mean: number[]; minimum: number[]; maximum: number[] }
  >()
  for (const observation of observations) {
    const rawDate = observation.observation_date
    const isoDate =
      rawDate instanceof Date
        ? rawDate.toISOString().slice(0, 10)
        : typeof rawDate === 'object'
          ? rawDate.toISODate?.()
          : String(rawDate).slice(0, 10)
    const date = new Date(`${isoDate}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) continue
    const month = date.getUTCMonth() + 1
    if (!months.includes(month)) continue
    const seasonYear =
      seasonName === 'Rabi' && month <= 3 ? date.getUTCFullYear() - 1 : date.getUTCFullYear()
    const row = byYear.get(seasonYear) ?? { rain: [], mean: [], minimum: [], maximum: [] }
    row.rain.push(
      observation.precipitation_mm === null ? null : Number(observation.precipitation_mm)
    )
    if (observation.t2m_c !== null) row.mean.push(Number(observation.t2m_c))
    if (observation.t2m_min_c !== null) row.minimum.push(Number(observation.t2m_min_c))
    if (observation.t2m_max_c !== null) row.maximum.push(Number(observation.t2m_max_c))
    byYear.set(seasonYear, row)
  }
  const completeYears = [...byYear.values()].filter(
    (row) => row.rain.some((value) => value !== null) && row.mean.length
  )
  if (!completeYears.length) return null
  const rainTotals = completeYears.map((row) =>
    row.rain.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  )
  const drySpells = completeYears.map((row) => {
    let longest = 0
    let current = 0
    for (const rain of row.rain) {
      current = rain !== null && rain < dryDayThresholdMm ? current + 1 : 0
      longest = Math.max(longest, current)
    }
    return longest
  })
  const maximumThreeDayRain = completeYears.map((row) => {
    let maximum = 0
    for (let index = 0; index < row.rain.length; index++) {
      const window = row.rain.slice(index, index + 3)
      if (window.length === 3 && window.every((value) => value !== null))
        maximum = Math.max(
          maximum,
          window.reduce<number>((sum, value) => sum + value!, 0)
        )
    }
    return maximum
  })
  const temperatures = completeYears.flatMap((row) => row.mean)
  const minimumTemperatures = completeYears.flatMap((row) => row.minimum)
  const maximumTemperatures = completeYears.flatMap((row) => row.maximum)
  const rainMean = rainTotals.reduce((sum, value) => sum + value, 0) / rainTotals.length
  const rainDeviation = Math.sqrt(
    rainTotals.reduce((sum, value) => sum + (value - rainMean) ** 2, 0) / rainTotals.length
  )
  const observedDays = completeYears.reduce(
    (sum, row) => sum + row.rain.filter((value) => value !== null).length,
    0
  )

  return {
    rainP25Mm: percentile(rainTotals, 0.25),
    rainMedianMm: percentile(rainTotals, 0.5),
    rainP75Mm: percentile(rainTotals, 0.75),
    rainfallCoefficientOfVariation: rainMean ? rainDeviation / rainMean : null,
    longestDrySpellP90Days: percentile(drySpells, 0.9),
    maximumThreeDayRainP95Mm: percentile(maximumThreeDayRain, 0.95),
    meanTemperatureC: temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length,
    minimumTemperatureC: minimumTemperatures.length ? Math.min(...minimumTemperatures) : null,
    maximumTemperatureC: maximumTemperatures.length ? Math.max(...maximumTemperatures) : null,
    temperatureP05C: percentile(temperatures, 0.05),
    temperatureP95C: percentile(temperatures, 0.95),
    observationCount: observedDays,
    coveragePercent: Math.min(
      100,
      (100 * observedDays) / (completeYears.length * months.length * 30.4375)
    ),
    featureMethodVersion: 'power-seasonal-v2',
    dryDayThresholdMm,
  }
}

type PowerResponse = {
  properties: { parameter: Record<(typeof parameters)[number], Record<string, number>> }
  header?: Record<string, unknown>
  geometry?: Record<string, unknown>
}

const deriveAllSeasonFeatures = (
  observations: DailyObservation[],
  seasons: Array<{ season_id: number | string; season_name: string }>,
  seasonMonths: Record<string, number[]>,
  dryDayThresholdMm: number
) =>
  Object.fromEntries(
    seasons.flatMap((season) => {
      const months = seasonMonths[season.season_name]
      if (!months) return []
      const derived = deriveSeasonFeatures(
        observations,
        months,
        season.season_name,
        dryDayThresholdMm
      )
      return derived
        ? [[season.season_id, { seasonName: season.season_name, ...derived }] as const]
        : []
    })
  )

export const hasCurrentSeasonFeatures = (
  features: Record<string, any> | null | undefined,
  seasonIds: Array<number | string>
) =>
  seasonIds.every(
    (seasonId) => features?.[String(seasonId)]?.featureMethodVersion === 'power-seasonal-v2'
  )

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
    const storedFeatures =
      profile && typeof profile.feature_values === 'string'
        ? JSON.parse(profile.feature_values)
        : profile?.feature_values
    if (
      profile &&
      hasCurrentSeasonFeatures(
        storedFeatures,
        seasons.map((season) => season.season_id)
      )
    )
      return profile

    const cachedObservations = await db
      .from('environmental_observations')
      .where('fetch_id', cached.fetch_id)
      .select('observation_date', 't2m_c', 't2m_min_c', 't2m_max_c', 'precipitation_mm')
    if (cachedObservations.length) {
      const features = deriveAllSeasonFeatures(
        cachedObservations,
        seasons,
        version.scoring_config.seasonMonths as Record<string, number[]>,
        Number(version.scoring_config.dryDayThresholdMm ?? 1)
      )
      const [refreshed] = await db
        .table('farm_environment_profiles')
        .insert({
          farm_id: farmId,
          baseline_start_year: new Date(cached.start_date).getUTCFullYear(),
          baseline_end_year: new Date(cached.end_date).getUTCFullYear(),
          data_coverage_percent: Math.min(
            100,
            (100 * cachedObservations.length) /
              ((new Date(cached.end_date).getUTCFullYear() -
                new Date(cached.start_date).getUTCFullYear() +
                1) *
                365 +
                2)
          ),
          feature_values: JSON.stringify(features),
          source_fetch_ids: JSON.stringify([cached.fetch_id]),
        })
        .returning('*')
      return refreshed
    }
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

    const features = deriveAllSeasonFeatures(
      observations,
      seasons,
      version.scoring_config.seasonMonths as Record<string, number[]>,
      Number(version.scoring_config.dryDayThresholdMm ?? 1)
    )
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
