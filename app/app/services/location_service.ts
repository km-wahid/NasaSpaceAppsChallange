import env from '#start/env'

type District = { district_id: string | number; district_name: string }
const aliases: Record<string, string> = {
  bogra: 'bogura',
  chittagong: 'chattogram',
  comilla: 'cumilla',
  jessore: 'jashore',
  barisal: 'barishal',
}
function normalize(name: string) {
  const value = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(district|zilla|zila)\b/g, '')
    .replace(/[^a-z]/g, '')
  return aliases[value] ?? value
}

export function extractLocation(data: unknown, districts: District[]) {
  if (
    !data ||
    typeof data !== 'object' ||
    !('address' in data) ||
    !data.address ||
    typeof data.address !== 'object'
  ) {
    throw new Error('INVALID_GEOCODING_RESPONSE')
  }
  const address = data.address as Record<string, unknown>
  const text = (key: string) =>
    typeof address[key] === 'string' ? (address[key] as string).trim() || null : null
  const countryCode = text('country_code')?.toLowerCase() ?? null
  const candidates = ['county', 'state_district', 'city', 'town', 'municipality']
    .map(text)
    .filter((value): value is string => Boolean(value))
  // A county may be an upazila. Only catalog district names may select Bangladesh records.
  const match =
    countryCode === 'bd'
      ? candidates
          .map((name) => districts.find((row) => normalize(row.district_name) === normalize(name)))
          .find(Boolean)
      : undefined
  return {
    district: countryCode === 'bd' ? (match?.district_name ?? null) : (candidates[0] ?? null),
    districtId: match ? String(match.district_id) : null,
    division: text('state') ?? text('region'),
    country: text('country'),
    countryCode,
  }
}

export function validCoordinates(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export class LocationError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

// ponytail: one app process in Compose. Use a shared limiter/cache or a dedicated provider before scaling replicas.
const cache = new Map<string, { expires: number; data: unknown }>()
let nextRequestAt = 0
let inFlight = false

export async function reverseGeocode(latitude: number, longitude: number) {
  if (!validCoordinates(latitude, longitude))
    throw new LocationError(422, 'INVALID_COORDINATES', 'Enter valid latitude and longitude.')
  const key = `${latitude},${longitude}`
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return cached.data
  cache.delete(key)
  if (inFlight || Date.now() < nextRequestAt) {
    throw new LocationError(
      429,
      'LOCATION_BUSY',
      'Location lookup is busy. Please retry in a few seconds.'
    )
  }
  inFlight = true
  nextRequestAt = Date.now() + 1100
  try {
    const url = new URL(
      'reverse',
      env.get('NOMINATIM_BASE_URL', 'https://nominatim.openstreetmap.org/').replace(/\/?$/, '/')
    )
    url.search = new URLSearchParams({
      'lat': String(latitude),
      'lon': String(longitude),
      'format': 'jsonv2',
      'addressdetails': '1',
      'accept-language': 'en',
    }).toString()
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent':
          'ORBIT-Crop-Rotation/1.0 (+https://github.com/km-wahid/NasaSpaceAppsChallange)',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 429) {
      const retry = response.headers.get('retry-after')
      const delay =
        retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry ?? '') - Date.now()
      nextRequestAt = Date.now() + Math.max(60000, Number.isFinite(delay) ? delay : 0)
      throw new LocationError(
        429,
        'LOCATION_BUSY',
        'Location service is busy. Try again in a minute or select your district.'
      )
    }
    if (!response.ok && response.status !== 404) throw new Error('NOMINATIM_UNAVAILABLE')
    const data: unknown = response.status === 404 ? { address: {} } : await response.json()
    extractLocation(data, []) // Validate upstream structure before caching it.
    if (cache.size >= 256) cache.delete(cache.keys().next().value!)
    cache.set(key, { expires: Date.now() + 10 * 60 * 1000, data })
    return data
  } catch (error) {
    if (error instanceof LocationError) throw error
    throw new LocationError(
      502,
      'GEOCODING_FAILED',
      'Could not look up your location. Please retry or select your district manually.'
    )
  } finally {
    inFlight = false
  }
}
