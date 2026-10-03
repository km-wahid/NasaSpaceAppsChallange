import { api } from './api'

export type UserLocation = {
  latitude: number | null
  longitude: number | null
  district: string | null
  districtId: string | null
  division: string | null
  country: string | null
  countryCode: string | null
  waterAvailability?: 'low' | 'medium' | 'high' | null
}

export type LocationProgress = 'requesting-permission' | 'detecting' | 'reverse-geocoding'
export class LocationDetectionError extends Error {
  constructor(
    public state: 'permission-denied' | 'location-unavailable' | 'geocoding-error',
    message: string
  ) {
    super(message)
  }
}

/** Call from a user click, never on page load. No IP-based fallback. */
export async function detectUserLocation(
  signal?: AbortSignal,
  onProgress?: (state: LocationProgress) => void
): Promise<UserLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new LocationDetectionError(
      'location-unavailable',
      'Your browser does not support location detection. Please select your district.'
    )
  }
  if (!window.isSecureContext)
    throw new LocationDetectionError(
      'location-unavailable',
      'Location detection requires HTTPS or localhost. Please select your district.'
    )
  signal?.throwIfAborted()
  onProgress?.('requesting-permission')
  const coordinates = await new Promise<GeolocationCoordinates>((resolve, reject) => {
    let active = true
    let permission: PermissionStatus | undefined
    const cleanup = () => {
      active = false
      if (permission) permission.onchange = null
      signal?.removeEventListener('abort', cancel)
    }
    const cancel = () => {
      cleanup()
      reject(signal?.reason ?? new Error('Location detection cancelled.'))
    }
    signal?.addEventListener('abort', cancel, { once: true })
    void navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (!active) return
        permission = result
        const update = () => {
          if (active && result.state === 'granted') onProgress?.('detecting')
        }
        result.onchange = update
        update()
      })
      .catch(() => {})
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        cleanup()
        resolve(coords)
      },
      (error) => {
        cleanup()
        reject(
          new LocationDetectionError(
            error.code === 1 ? 'permission-denied' : 'location-unavailable',
            error.code === 1
              ? 'Location permission was denied. Enable it in your browser or select your district.'
              : error.code === 3
                ? 'Location detection timed out. Please retry or select your district.'
                : 'Your device could not determine its location. Please retry or select your district.'
          )
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  })
  signal?.throwIfAborted()
  onProgress?.('reverse-geocoding')
  const timeout = AbortSignal.timeout(12000)
  try {
    return await api<UserLocation>(
      '/api/v1/location/reverse',
      'POST',
      {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
      signal ? AbortSignal.any([signal, timeout]) : timeout
    )
  } catch (error) {
    if (signal?.aborted) throw error
    throw new LocationDetectionError(
      'geocoding-error',
      timeout.aborted
        ? 'District lookup timed out. Please retry or select your district.'
        : error instanceof Error && error.name !== 'TypeError'
          ? error.message
          : 'Could not reach the location service. Please select your district or retry.'
    )
  }
}
