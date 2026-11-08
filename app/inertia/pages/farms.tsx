import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Catalog } from '../components/data_browser'
import FarmWorkspace from '../components/farm_workspace'
import FarmScene from '../components/farm_scene'
import Icon from '../components/icon'

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
    <div className="oa-app-page farms-page">
      <Head title="My farms" />
      <div className="oa-page-header workspace-page-banner">
        <div className="farms-hero-copy">
          <p className="oa-kicker">
            <Icon name="barn" size={18} /> MY FARMS
          </p>
          <h1>Your farm workspace</h1>
          <p>Select a farm, check what is ready, and move straight into your seasonal plan.</p>
          {catalog && (
            <div className="farms-district-control">
              <label htmlFor="farm-district">
                <span>New farm location</span>
                <select
                  id="farm-district"
                  className="select select-bordered"
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
              </label>
              <p>Used only when you add a new farm.</p>
            </div>
          )}
        </div>
        <div className="farms-hero-scene" aria-hidden="true">
          <FarmScene scene="farm" />
          <span className="badge badge-lg">Farm overview</span>
        </div>
      </div>
      {loading && (
        <p role="status" className="flex items-center gap-3 py-6">
          <span className="loading loading-spinner" />
          Loading your farm workspace…
        </p>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      )}
      {catalog && !loading && !error && <FarmWorkspace catalog={catalog} />}
    </div>
  )
}
