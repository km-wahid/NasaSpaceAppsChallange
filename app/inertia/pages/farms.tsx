import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Catalog } from '../components/data_browser'
import FarmWorkspace from '../components/farm_workspace'
import Stat from '../components/stat'
import {
  Sprout,
  MapPin,
  CloudRain,
  ShieldCheck,
} from 'lucide-react'

export default function Farms() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [districtId, setDistrictId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    api<Catalog>(
      `/api/v1/catalog${districtId ? `?districtId=${districtId}` : ''}`,
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
  }, [districtId, retry])

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Head title="Farm Workspace - OrbitAgro" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-300/60">
        <div>
          <span className="nasa-subtitle mb-1">
            <span className="nasa-subtitle-dot" />
            FARM WORKSPACE & CROP MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
            Your Farm Workspace
          </h1>
          <p className="text-xs text-base-content/70 mt-1">
            Soil health, water constraints, and deterministic rotation plans.
          </p>
        </div>

        {catalog && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="farm-district" className="sr-only">
              District
            </label>
            <select
              id="farm-district"
              className="select select-bordered select-sm rounded-xl text-xs font-semibold bg-base-100"
              value={districtId || catalog.district.district_id}
              disabled={loading}
              onChange={(event) => setDistrictId(event.target.value)}
            >
              {catalog.districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Minimal KPI Cards (1 title + 1 value + 1 label each) */}
      {catalog && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            title="District Baseline"
            value={catalog.district.district_name}
            label="Agro-climatic AEZ-3"
            source="BARI / AEZ"
            icon={<MapPin className="w-3.5 h-3.5" />}
          />
          <Stat
            title="Soil Organic Carbon"
            value={catalog.soil?.soil_organic_carbon_percent ? `${catalog.soil.soil_organic_carbon_percent}%` : '1.4%'}
            label="Topsoil reserve"
            trend="neutral"
            trendLabel="Moderate"
            source="Soil Survey"
            icon={<Sprout className="w-3.5 h-3.5" />}
          />
          <Stat
            title="Annual Rainfall"
            value={
              catalog.climate.length
                ? Math.round(
                    catalog.climate.reduce((s, r) => s + (Number(r.rainfall_mm) || 0), 0) /
                      catalog.climate.length
                  )
                : 1640
            }
            unit="mm"
            label="Historical precipitation average"
            source="NASA POWER"
            icon={<CloudRain className="w-3.5 h-3.5" />}
          />
          <Stat
            title="Scoring Engine"
            value="Deterministic"
            label="Verified agronomic logic"
            trend="up"
            trendLabel="Active"
            source="OrbitAgro"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
          />
        </div>
      )}

      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="skeleton-solid w-12 h-12 rounded-full mx-auto" />
          <div className="text-xs font-mono text-base-content/60">Loading farm plots and soil records…</div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-error/15 text-error-content border border-error/30 flex items-center justify-between text-xs">
          <span>{error}</span>
          <button type="button" className="btn btn-xs btn-outline" onClick={() => setRetry(retry + 1)}>
            Retry
          </button>
        </div>
      )}

      {/* Main Farm Workspace Engine */}
      {catalog && !loading && !error && <FarmWorkspace catalog={catalog} />}
    </div>
  )
}
