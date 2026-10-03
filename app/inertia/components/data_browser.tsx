import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { UserLocation } from '../lib/location'
import LocationExperience from './location_experience'
import FarmerDashboard from './farmer_dashboard'

export type Catalog = {
  districts: Array<{
    district_id: string
    district_name: string
    division_id: string
    latitude: string
    longitude: string
  }>
  district: Catalog['districts'][number]
  divisions: Array<{ division_id: string; division_name: string }>
  crops: Array<{ crop_id: string; crop_name: string }>
  seasons: Array<{ season_id: string; season_name: string }>
  thresholds: Array<{
    threshold_set_id: string
    name: string
    unit: string
    analytical_method: string
    nutrient: string
  }>
  statistics: Array<{
    crop_id: string
    crop_name: string
    crop_category: string
    season_name: string
    estimated_water_need_mm: string
    reported_yield_metric_tonnes_per_hectare: string
    area_acres: string
    production_metric_tonnes: string
    data_quality_status: string
  }>
  soil: {
    soil_ph: string
    soil_texture: string
    soil_organic_carbon_percent: string
    soil_nitrogen_status: string
  } | null
  risk: { drought_risk: string; flood_risk: string; salinity_risk: string } | null
  climate: Array<{ season_name: string; rainfall_mm: string }>
  source: { filename: string; reportingYear: number | null; importedAt: string } | null
  readiness: {
    requirements: number
    calendars: number
    economics: number
    nutrient_thresholds: number
  }
}

export default function DataBrowser({ signedIn }: { signedIn: boolean }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const [selectionId, setSelectionId] = useState(0)
  const continueWithLocation = useCallback((next: UserLocation) => {
    setLocation(next)
    setSelectionId((current) => current + 1)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api<Catalog>(
      `/api/v1/catalog${location?.districtId ? `?districtId=${location.districtId}` : ''}`,
      'GET',
      undefined,
      controller.signal
    )
      .then((data) => {
        if (!controller.signal.aborted) setCatalog(data)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [location?.districtId, retry])
  return (
    <div id="overview" className="farmer-flow space-y-6">
      {catalog && (
        <LocationExperience
          signedIn={signedIn}
          districts={catalog.districts}
          divisions={catalog.divisions}
          onContinue={continueWithLocation}
        />
      )}
      {loading && (
        <div className="card border border-base-300 bg-base-100 p-6" role="status">
          <span className="loading loading-spinner text-primary" />
          <p className="mt-3 text-sm">Preparing your local growing guide…</p>
        </div>
      )}
      {error && (
        <div className="alert alert-error alert-soft" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {location && catalog && !loading && !error && (
        <FarmerDashboard
          key={`${selectionId}-${location.districtId}-${location.latitude}-${location.longitude}`}
          location={location}
          catalog={catalog}
          signedIn={signedIn}
        />
      )}
      <details
        id="data-sources"
        className="collapse collapse-arrow border border-base-300 bg-base-100"
      >
        <summary className="collapse-title font-semibold">
          Where do these insights come from?
        </summary>
        <div className="collapse-content space-y-3 text-sm text-base-content/75">
          <p>
            Your water choice is combined with stored district rainfall references for a simple
            seasonal outlook. It is a planning guide, not a forecast.
          </p>
          <p>
            Crop plans use cached NASA environmental information, your saved farm measurements and
            priorities, and reviewed crop guidance. Missing information stays missing.
          </p>
          <p>
            Location and map data:{' '}
            <a
              className="link"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap contributors
            </a>
            . Native browser location is requested only when you click.
          </p>
        </div>
      </details>
    </div>
  )
}
