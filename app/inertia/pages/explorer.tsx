import { Head } from '@inertiajs/react'
import { useState } from 'react'
import Icon from '../components/icon'
import ClimateHistoryExplorer from '../components/climate_history_explorer'
import { useLocale } from '../lib/i18n'
import { detectUserLocation, type UserLocation } from '../lib/location'
import { usePublicCatalog } from '../lib/use_public_catalog'

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
      setLocationError(reason instanceof Error ? reason.message : t('locationFallback'))
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="oa-explorer-page">
      <Head title={t('explorerTitle')} />
      <header className="oa-page-header">
        <div>
          <p className="oa-kicker">
            <Icon name="satellite" size={18} /> {t('explorerEyebrow')}
          </p>
          <h1>Bangladesh climate & satellite explorer</h1>
          <p>
            Explore ten complete years of temperature, warming and rainfall history for a district
            or your current location.
          </p>
        </div>
        {catalog && (
          <div className="oa-explorer-location">
            <label>
              <span>{t('selectDistrict')}</span>
              <select
                className="select"
                value={districtId}
                onChange={(event) => {
                  setUserLocation(null)
                  setLocationError('')
                  setDistrictId(event.target.value)
                }}
              >
                {catalog.districts.map((district) => (
                  <option key={district.district_id} value={district.district_id}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-primary"
              type="button"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Icon name="navigation" size={18} />
              )}
              {locating ? t('locating') : t('useMyLocation')}
            </button>
          </div>
        )}
      </header>

      {locationError && (
        <div className="alert alert-warning oa-explorer-location-error" role="alert">
          <Icon name="warning" />
          <span>{locationError}</span>
        </div>
      )}

      {loading && (
        <div className="oa-loading" role="status">
          <span className="loading loading-ring loading-lg" />
          <span>{t('loading')}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error alert-soft" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {catalog && !loading && !error && (
        <ClimateHistoryExplorer
          districtId={districtId}
          districtName={catalog.district.district_name}
          latitude={userLocation?.latitude}
          longitude={userLocation?.longitude}
        />
      )}
    </div>
  )
}
