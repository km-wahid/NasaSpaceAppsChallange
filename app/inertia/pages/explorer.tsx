import { Head } from '@inertiajs/react'
import { useState } from 'react'
import ClimateHistoryExplorer from '../components/climate_history_explorer'
import { useLocale } from '../lib/i18n'
import { detectUserLocation, type UserLocation } from '../lib/location'
import { usePublicCatalog } from '../lib/use_public_catalog'
import { Navigation, AlertCircle } from 'lucide-react'

export default function Explorer() {
  const { t } = useLocale()
  const { catalog, districtId, setDistrictId, loading, error, retry } = usePublicCatalog()
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const useMyLocation = async () => {
    setLocating(true)
    setLocationError('')
    try {
      const location = await detectUserLocation()
      setUserLocation(location)
      if (location.districtId) setDistrictId(location.districtId)
    } catch (reason) {
      setLocationError(reason instanceof Error ? reason.message : (t('locationFallback') || 'Location unavailable.'))
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-6 py-6 pb-36 md:pb-12 overflow-x-hidden">
      <Head title={t('explorerTitle') || 'EO Explorer - OrbitAgro'} />

      {/* Minimal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-base-300/60">
        <div>
          <span className="nasa-subtitle mb-1">
            <span className="nasa-subtitle-dot" />
            EARTH OBSERVATION EXPLORER
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
            Bangladesh Climate & Satellite Explorer
          </h1>
          <p className="text-xs text-base-content/70 mt-1">
            Ten years of NASA POWER climate history & MODIS reflectance imagery.
          </p>
        </div>

        {catalog && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* District Selector */}
            <div className="relative">
              <select
                className="select select-bordered select-sm rounded-xl text-xs font-semibold pr-8 bg-base-100"
                value={districtId}
                onChange={(event) => {
                  setUserLocation(null)
                  setLocationError('')
                  setDistrictId(event.target.value)
                }}
                aria-label="Select Bangladesh District"
              >
                {catalog.districts.map((district) => (
                  <option key={district.district_id} value={district.district_id}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS Location Button */}
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-xl text-xs font-semibold gap-1.5"
              onClick={useMyLocation}
              disabled={locating}
              aria-label="Detect GPS Location"
            >
              {locating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-success" />
              )}
              <span className="hidden sm:inline">{locating ? 'Detecting…' : 'My Location'}</span>
            </button>
          </div>
        )}
      </div>

      {locationError && (
        <div className="p-3 mb-6 rounded-xl bg-warning/15 text-warning-content border border-warning/30 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="skeleton-solid w-16 h-16 rounded-full mx-auto" />
          <div className="text-xs font-mono text-base-content/60">Loading district climate catalog…</div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-error/15 text-error-content border border-error/30 flex items-center justify-between text-xs">
          <span>{error}</span>
          <button className="btn btn-xs btn-outline" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {catalog && (
        <ClimateHistoryExplorer
          districtId={districtId}
          districtName={userLocation?.district || catalog.district.district_name}
          latitude={userLocation ? userLocation.latitude : null}
          longitude={userLocation ? userLocation.longitude : null}
        />
      )}
    </div>
  )
}
