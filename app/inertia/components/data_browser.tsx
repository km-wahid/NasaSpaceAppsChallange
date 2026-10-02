import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import FarmWorkspace from './farm_workspace'
import Icon from './icon'

export type Catalog = {
  districts: Array<{
    district_id: string
    district_name: string
    latitude: string
    longitude: string
  }>
  district: Catalog['districts'][number]
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
  const readinessLabels: Record<string, string> = {
    requirements: 'Crop requirements',
    calendars: 'Growing calendars',
    economics: 'Economic references',
    nutrient_thresholds: 'Soil thresholds',
  }
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [districtId, setDistrictId] = useState('')
  const [season, setSeason] = useState('')
  const [search, setSearch] = useState('')
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
      .then(setCatalog)
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [districtId, retry])
  const rows =
    catalog?.statistics.filter(
      (row) =>
        (!season || row.season_name === season) &&
        row.crop_name.toLowerCase().includes(search.toLowerCase())
    ) ?? []
  const number = (value: string) =>
    Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
  return (
    <div className="farm-dashboard">
      <section className="dashboard-intro" id="overview">
        <div>
          <p className="eyebrow">YOUR AGRICULTURAL OVERVIEW</p>
          <h1>Good decisions grow here.</h1>
          <p>Explore local conditions and plan the next chapter for your farm.</p>
        </div>
        <span className="location-pill">
          <Icon name="pin" size={16} />
          {catalog?.district.district_name ?? 'Bangladesh'}, Bangladesh
        </span>
      </section>
      <section className="insight-banner">
        <div className="banner-content">
          <span className="banner-badge">
            <span className="status-dot" />
            EARTH DATA. LOCAL INSIGHT.
          </span>
          <h2>
            A little more insight.
            <br />A more resilient harvest.
          </h2>
          <p>
            Bring your soil, water and priorities together to explore what your next seasons could
            look like.
          </p>
          <a className="banner-action" href={signedIn ? '#farm-workspace' : '/login'}>
            {signedIn ? 'Open your farm workspace' : 'Start planning your farm'}
            <Icon name="arrow" size={18} />
          </a>
        </div>
        <svg className="field-art" viewBox="0 0 480 300" fill="none" aria-hidden="true">
          <defs>
            <pattern
              id="field-lines"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-30)"
            >
              <path d="M0 0v18" stroke="#80b68c" strokeWidth="2" />
            </pattern>
            <linearGradient id="field-fade" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#afdc79" />
              <stop offset="1" stopColor="#4a9168" />
            </linearGradient>
          </defs>
          <ellipse cx="290" cy="155" rx="190" ry="125" stroke="#7ea486" strokeOpacity=".22" />
          <ellipse cx="290" cy="155" rx="230" ry="160" stroke="#7ea486" strokeOpacity=".14" />
          <g transform="translate(260 155) rotate(-28)">
            <rect
              x="-125"
              y="-85"
              width="250"
              height="170"
              rx="12"
              fill="#235b46"
              stroke="#74a87d"
            />
            <rect x="-116" y="-76" width="112" height="65" rx="5" fill="url(#field-lines)" />
            <rect
              x="7"
              y="-76"
              width="108"
              height="65"
              rx="5"
              fill="url(#field-fade)"
              opacity=".85"
            />
            <rect x="-116" y="0" width="112" height="76" rx="5" fill="#9abb69" opacity=".8" />
            <rect x="7" y="0" width="108" height="76" rx="5" fill="url(#field-lines)" />
            <path d="M-1-84V84M-123-6H123" stroke="#d7e8b9" strokeWidth="4" />
          </g>
          <circle cx="283" cy="103" r="17" fill="#d7f0b0" />
          <path d="m276 102 5 5 9-10" stroke="#205a42" strokeWidth="2" />
          <circle cx="149" cy="221" r="5" fill="#c7e59b" />
          <path d="M154 221h56" stroke="#c7e59b" strokeDasharray="3 4" />
        </svg>
        <span className="banner-footnote">
          <Icon name="shield" size={14} />
          Rule-based. Explainable. Built around you.
        </span>
      </section>
      {error && (
        <div role="alert" className="data-warning">
          Could not load district data: {error}{' '}
          <button onClick={() => setRetry(retry + 1)}>Retry</button>
        </div>
      )}
      {loading && <p role="status">Loading district records…</p>}
      {catalog && (
        <>
          <section className="data-panel" aria-busy={loading}>
            <div className="data-toolbar">
              <div>
                <span className="eyebrow">REGIONAL CONTEXT</span>
                <h2>District agriculture records</h2>
              </div>
              <label>
                District
                <select
                  aria-label="District"
                  value={districtId || catalog.district.district_id}
                  onChange={(event) => setDistrictId(event.target.value)}
                >
                  {catalog.districts.map((district) => (
                    <option key={district.district_id} value={district.district_id}>
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="catalog-summary">
              <span>
                <Icon name="leaf" size={15} />
                {catalog.crops.length} crops
              </span>
              <span>
                <Icon name="pin" size={15} />
                {catalog.districts.length} districts
              </span>
              <span className="reference-badge">Imported reference data</span>
            </div>
            <div className="data-metrics">
              <article className="condition-card soil-card">
                <div className="condition-title">
                  <h3>Soil reference</h3>
                  <span className="condition-icon">
                    <Icon name="layers" />
                  </span>
                </div>
                {catalog.soil ? (
                  <>
                    <div className="metric-value">
                      {number(catalog.soil.soil_ph)}
                      <span>pH</span>
                    </div>
                    <p>{catalog.soil.soil_texture}</p>
                    <div className="metric-footer">
                      <span>
                        Organic carbon <b>{number(catalog.soil.soil_organic_carbon_percent)}%</b>
                      </span>
                      <span>
                        Nitrogen <b>{catalog.soil.soil_nitrogen_status}</b>
                      </span>
                    </div>
                  </>
                ) : (
                  <p>No soil reference available.</p>
                )}
              </article>
              <article className="condition-card risk-card">
                <div className="condition-title">
                  <h3>District risks</h3>
                  <span className="condition-icon">
                    <Icon name="shield" />
                  </span>
                </div>
                {catalog.risk ? (
                  <>
                    <div className="risk-row">
                      <span>Drought</span>
                      <span className="risk-pill">{catalog.risk.drought_risk}</span>
                    </div>
                    <div className="risk-row">
                      <span>Flood</span>
                      <span className="risk-pill">{catalog.risk.flood_risk}</span>
                    </div>
                    <div className="risk-row">
                      <span>Salinity</span>
                      <span className="risk-pill">{catalog.risk.salinity_risk}</span>
                    </div>
                  </>
                ) : (
                  <p>No risk assessment available.</p>
                )}
              </article>
              <article className="condition-card rain-card">
                <div className="condition-title">
                  <h3>Seasonal rainfall</h3>
                  <span className="condition-icon">
                    <Icon name="water" />
                  </span>
                </div>
                {catalog.climate.map((item) => (
                  <div className="rain-row" key={item.season_name}>
                    <div>
                      <span>{item.season_name}</span>
                      <strong>
                        {number(item.rainfall_mm)} <small>mm</small>
                      </strong>
                    </div>
                    <div className="rain-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${(100 * Number(item.rainfall_mm)) / Math.max(1, ...catalog.climate.map((climate) => Number(climate.rainfall_mm)))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </article>
            </div>
            <div className="table-heading" id="crop-library">
              <div>
                <h2>
                  Explore the crop library{' '}
                  <span className="count-badge">{catalog.statistics.length}</span>
                </h2>
                <p>Crop characteristics reported for {catalog.district.district_name}.</p>
              </div>
              <Icon name="leaf" />
            </div>
            <div className="data-toolbar table-filters">
              <label>
                Search crops
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rice, wheat, lentil…"
                />
              </label>
              <label>
                Season
                <select
                  aria-label="Season filter"
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
                >
                  <option value="">All seasons</option>
                  {catalog.seasons.map((item) => (
                    <option key={item.season_id}>{item.season_name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="data-table-scroll">
              <table>
                <caption>
                  {rows.length} matching crop records — seasons and values as imported
                </caption>
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Season</th>
                    <th>Water need (mm)</th>
                    <th>Reported yield (t/ha)</th>
                    <th>Area (acres)</th>
                    <th>Data status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.crop_id}>
                      <td>
                        <div className="crop-cell">
                          <span className="crop-symbol">
                            <Icon name="leaf" size={18} />
                          </span>
                          <span>
                            <strong>{row.crop_name}</strong>
                            <small>{row.crop_category.replaceAll('_', ' ')}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`season-pill season-${row.season_name.replaceAll(' ', '-').toLowerCase()}`}
                        >
                          {row.season_name}
                        </span>
                      </td>
                      <td>{number(row.estimated_water_need_mm)}</td>
                      <td>{number(row.reported_yield_metric_tonnes_per_hectare)}</td>
                      <td>{number(row.area_acres)}</td>
                      <td>
                        <span
                          className={`quality-pill ${row.data_quality_status === 'ok' ? 'quality-ok' : 'quality-review'}`}
                        >
                          {row.data_quality_status === 'ok'
                            ? 'Imported'
                            : row.data_quality_status.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && <p>No crop records match these filters.</p>}
            <p className="data-caption">
              <Icon name="info" size={15} />
              Source: {catalog.source?.filename ?? 'No import found'} · Reporting year:{' '}
              {catalog.source?.reportingYear ?? 'not provided'}. District references are not live
              NASA observations or farm measurements.
            </p>
            <details className="endpoint-details">
              <summary>View data endpoint</summary>
              <a href={`/api/v1/catalog?districtId=${catalog.district.district_id}`}>
                Open this district’s JSON response
              </a>
            </details>
          </section>
          <section className="readiness-panel" id="data-sources">
            <div className="readiness-title">
              <span className="condition-icon">
                <Icon name="layers" />
              </span>
              <div>
                <h2>Recommendation data readiness</h2>
                <p>The reference data behind your next rotation.</p>
              </div>
              <span className="reference-badge">
                {Object.values(catalog.readiness).filter((count) => count > 0).length} / 4
                categories available
              </span>
            </div>
            <div className="readiness-grid">
              {Object.entries(catalog.readiness).map(([key, count]) => (
                <div key={key}>
                  <span className={`readiness-dot ${count > 0 ? 'ready' : ''}`} />
                  {readinessLabels[key]}
                  <strong>{count > 0 ? `${count} records` : 'Pending review'}</strong>
                </div>
              ))}
            </div>
            {Object.values(catalog.readiness).some((count) => count === 0) && (
              <p>
                Some reviewed reference data is missing. You can browse district records and save
                farm inputs, but full rotation recommendations are not yet available. Existing
                imported values have not been validated for scoring.
              </p>
            )}
          </section>
          {signedIn && <FarmWorkspace catalog={catalog} />}
        </>
      )}
    </div>
  )
}
