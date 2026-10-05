import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Catalog } from '../components/data_browser'
import FarmWorkspace from '../components/farm_workspace'
import landscape from '../assets/farm-landscape.jpg'

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
    <div className="site-page farms-page">
      <Head title="My farms" />
      <div className="site-page-heading workspace-page-banner">
        <img src={landscape} alt="" />
        <p className="agri-eyebrow text-primary">ROOTED IN REAL INFORMATION</p>
        <h1>A home for your farm.</h1>
        <p>
          Keep your field information together: soil, water, crop history and growing priorities.
        </p>
      </div>
      {catalog && (
        <div className="card border border-base-300 bg-base-100 mb-6 p-6">
          <label htmlFor="farm-district" className="mb-2 font-semibold">
            District for new farms
          </label>
          <select
            id="farm-district"
            className="select w-full sm:max-w-md"
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
          <p className="mt-2 text-sm text-base-content/70">
            This selection is used when creating a new farm. It does not relocate existing farms.
          </p>
        </div>
      )}
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
