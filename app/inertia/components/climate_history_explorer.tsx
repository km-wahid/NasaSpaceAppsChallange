import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import BangladeshGisMap, { type RegionalClimatePoint } from './bangladesh_gis_map'
import Icon from './icon'
import { api } from '../lib/api'

export type ClimateHistory = {
  locationName: string
  latitude: number
  longitude: number
  startYear: number
  endYear: number
  warmingCPerDecade: number | null
  months: Array<{
    year: number
    month: number
    meanTemperatureC: number | null
    maximumTemperatureC: number | null
    rainfallMm: number | null
  }>
  years: Array<{
    year: number
    meanTemperatureC: number | null
    maximumTemperatureC: number | null
    rainfallMm: number | null
  }>
  source: {
    name: string
    temporalResolution: string
    retrievedAt: string
    apiVersion: string | null
  }
}

type View = 'temperature' | 'rainfall' | 'satellite'
type RegionalClimateMap = {
  startYear: number
  endYear: number
  months: string[]
  points: RegionalClimatePoint[]
  source: { name: string; grid: string; retrievedAt: string }
}
type Props = {
  districtId: string
  districtName: string
  latitude?: number | null
  longitude?: number | null
}

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
export default function ClimateHistoryExplorer({
  districtId,
  districtName,
  latitude,
  longitude,
}: Props) {
  const [history, setHistory] = useState<ClimateHistory | null>(null)
  const [view, setView] = useState<View>('temperature')
  const [selectedYear, setSelectedYear] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(11)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [regional, setRegional] = useState<RegionalClimateMap | null>(null)
  const [regionalError, setRegionalError] = useState('')
  const [regionalLoading, setRegionalLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const query =
      latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null
        ? `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
        : `districtId=${encodeURIComponent(districtId)}`
    setLoading(true)
    setError('')
    api<ClimateHistory>(`/api/v1/climate-history?${query}`, 'GET', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setHistory(data)
          setSelectedYear(data.endYear)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Climate history is unavailable.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [districtId, latitude, longitude, retry])

  useEffect(() => {
    const controller = new AbortController()
    setRegionalLoading(true)
    setRegionalError('')
    api<RegionalClimateMap>('/api/v1/regional-climate-map', 'GET', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRegional(data)
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setRegionalError(
            reason instanceof Error ? reason.message : 'Regional climate map is unavailable.'
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setRegionalLoading(false)
      })
    return () => controller.abort()
  }, [retry])

  useEffect(() => {
    if (!playing || !history) return
    const timer = window.setInterval(() => {
      setSelectedMonth((month) => {
        if (month < 12) return month + 1
        setSelectedYear((year) => (year >= history.endYear ? history.startYear : year + 1))
        return 1
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [history, playing])

  const selected = history?.years.find((row) => row.year === selectedYear)
  const selectedMonthAtLocation = history?.months.find(
    (row) => row.year === selectedYear && row.month === selectedMonth
  )

  if (loading)
    return (
      <div className="oa-climate-loading" role="status">
        <span className="loading loading-ring loading-lg" />
        <div>
          <strong>Reading 10 years of climate history</strong>
          <span>NASA POWER · selected Bangladesh location</span>
        </div>
      </div>
    )

  if (error || !history)
    return (
      <div className="alert alert-warning oa-climate-error" role="alert">
        <Icon name="warning" />
        <span>{error || 'Climate history is unavailable.'}</span>
        <button className="btn btn-sm" type="button" onClick={() => setRetry((value) => value + 1)}>
          Try again
        </button>
      </div>
    )

  const climateKey = `${selectedYear}${String(selectedMonth).padStart(2, '0')}`
  const satelliteDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`
  const climateIndex = regional?.months.indexOf(climateKey) ?? -1
  const mapPanel = (metric: 'temperature' | 'rainfall') => {
    const temperature = metric === 'temperature'
    const value = temperature
      ? selectedMonthAtLocation?.meanTemperatureC
      : selectedMonthAtLocation?.rainfallMm
    return (
      <div className="oa-climate-map-view">
        <div className="oa-climate-map-stage">
          {regionalLoading && (
            <div className="oa-climate-map-loading" role="status">
              <span className="loading loading-ring loading-lg" /> Loading Bangladesh grid
            </div>
          )}
          {regionalError && (
            <div className="alert alert-warning oa-climate-map-error" role="alert">
              <Icon name="warning" /> {regionalError}
            </div>
          )}
          {regional && (
            <BangladeshGisMap
              latitude={history.latitude}
              longitude={history.longitude}
              district={districtName}
              compact
              climateGrid={regional.points}
              climateMetric={metric}
              climateIndex={climateIndex}
            />
          )}
        </div>
        <div className="oa-climate-map-copy">
          <span className={`badge ${temperature ? 'badge-warning' : 'badge-info'} badge-outline`}>
            NASA POWER GRID
          </span>
          <h2>{temperature ? 'Temperature across Bangladesh' : 'Rainfall across Bangladesh'}</h2>
          <p>
            Each district is coloured using the nearest NASA climate grid estimate for{' '}
            {temperature ? 'monthly mean air temperature' : 'monthly rainfall'}.
          </p>
          <div className="oa-map-reading">
            <span>
              {districtName} · {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <strong>
              {value === null || value === undefined
                ? 'No data'
                : `${value.toFixed(1)}${temperature ? '°C' : ' mm'}`}
            </strong>
            <small>Selected-location estimate</small>
          </div>
          <ul>
            <li>Tap or hover a district to inspect its mapped value.</li>
            <li>Use the controls below to animate month by month.</li>
            <li>Grid estimate—not a weather station or field measurement.</li>
          </ul>
        </div>
      </div>
    )
  }
  return (
    <section className="oa-climate-explorer" aria-label="Earth observation climate explorer">
      <div className="oa-climate-summary">
        <article>
          <span>Location</span>
          <strong>{latitude ? 'Your location' : districtName}</strong>
          <small>
            {history.latitude.toFixed(3)}°, {history.longitude.toFixed(3)}°
          </small>
        </article>
        <article>
          <span>10-year mean</span>
          <strong>
            {history.years.filter((row) => row.meanTemperatureC !== null).length
              ? `${(history.years.reduce((sum, row) => sum + (row.meanTemperatureC ?? 0), 0) / history.years.filter((row) => row.meanTemperatureC !== null).length).toFixed(1)}°C`
              : '—'}
          </strong>
          <small>
            {history.startYear}–{history.endYear}
          </small>
        </article>
        <article>
          <span>Warming trend</span>
          <strong className={(history.warmingCPerDecade ?? 0) > 0 ? 'oa-warming-positive' : ''}>
            {history.warmingCPerDecade === null
              ? '—'
              : `${history.warmingCPerDecade > 0 ? '+' : ''}${history.warmingCPerDecade}°C`}
          </strong>
          <small>per decade · linear trend</small>
        </article>
        <article>
          <span>{selectedYear} rainfall</span>
          <strong>
            {selected?.rainfallMm === null || selected?.rainfallMm === undefined
              ? '—'
              : `${Math.round(selected.rainfallMm)} mm`}
          </strong>
          <small>monthly estimates combined</small>
        </article>
      </div>

      <div role="tablist" className="tabs tabs-box oa-climate-tabs" aria-label="Observation type">
        {(
          [
            ['temperature', 'sun', 'Temperature map'],
            ['rainfall', 'rain', 'Rainfall map'],
            ['satellite', 'satellite', 'Satellite imagery'],
          ] as const
        ).map(([key, icon, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            className={`tab ${view === key ? 'tab-active' : ''}`}
            aria-selected={view === key}
            onClick={() => setView(key)}
          >
            <Icon name={icon} size={17} /> {label}
          </button>
        ))}
      </div>

      <div className="oa-climate-panel">
        {view === 'temperature' && mapPanel('temperature')}

        {view === 'rainfall' && mapPanel('rainfall')}

        {view === 'satellite' && (
          <div className="oa-satellite-view">
            <BangladeshGisMap
              latitude={history.latitude}
              longitude={history.longitude}
              district={districtName}
              compact
              satellite
              satelliteDate={satelliteDate}
            />
            <div className="oa-satellite-copy">
              <span className="badge badge-success">NASA GIBS</span>
              <h2>True-colour Earth observation</h2>
              <p>
                Compare the same part of the year across the decade. Clouds and haze are visible
                because this is real MODIS Terra imagery, not an illustrated map.
              </p>
              <dl>
                <div>
                  <dt>Image date</dt>
                  <dd>{satelliteDate}</dd>
                </div>
                <div>
                  <dt>Product</dt>
                  <dd>MODIS Terra corrected reflectance</dd>
                </div>
                <div>
                  <dt>Climate point</dt>
                  <dd>
                    {history.latitude.toFixed(3)}°, {history.longitude.toFixed(3)}°
                  </dd>
                </div>
              </dl>
              <Link className="btn btn-primary" href="/explorer/map">
                Open full map <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="oa-year-player">
        <button
          className="btn btn-primary btn-circle"
          type="button"
          aria-label={playing ? 'Pause climate animation' : 'Play climate animation'}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <span aria-hidden="true">Ⅱ</span> : <span aria-hidden="true">▶</span>}
        </button>
        <label>
          <span>
            <strong>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </strong>
            <small>Move through 10 years month by month</small>
          </span>
          <div className="oa-date-controls">
            <select
              className="select select-sm"
              aria-label="Climate month"
              value={selectedMonth}
              onChange={(event) => {
                setPlaying(false)
                setSelectedMonth(Number(event.target.value))
              }}
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
            <input
              className="range range-primary range-sm"
              aria-label="Climate year"
              type="range"
              min={history.startYear}
              max={history.endYear}
              step="1"
              value={selectedYear}
              onChange={(event) => {
                setPlaying(false)
                setSelectedYear(Number(event.target.value))
              }}
            />
          </div>
        </label>
        <small>Source: NASA POWER monthly meteorology · Satellite: NASA GIBS</small>
      </div>
    </section>
  )
}
