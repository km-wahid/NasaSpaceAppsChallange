import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Catalog } from '../components/data_browser'
import FarmWorkspace from '../components/farm_workspace'
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
      <header className="fw-hero">
        <img className="fw-hero-img" src="/media/home-field-sunset.jpg" alt="" />
        <div className="fw-hero-shade" />
        <div className="fw-hero-body">
          <p className="fw-kicker">MY FARM</p>
          <h1>Welcome to your farm</h1>
          <p>See your land, care for it, and choose what to do next.</p>
          <div className="fw-chips" aria-label="What you can manage here">
            <span>
              <Icon name="sprout" size={16} /> Crops
            </span>
            <span>
              <Icon name="water" size={16} /> Water
            </span>
            <span>
              <Icon name="soil" size={16} /> Soil
            </span>
            <span>
              <Icon name="sun" size={16} /> Weather
            </span>
          </div>
        </div>
        {catalog && (
          <label className="fw-district" htmlFor="farm-district">
            <span>
              <Icon name="pin" size={16} /> New farm location
            </span>
            <select
              id="farm-district"
              className="select select-sm"
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
            <small>Used only when you add another farm.</small>
          </label>
        )}
      </header>
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