import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import BangladeshGisMap, { type RegionalClimatePoint } from '../components/bangladesh_gis_map'
import Icon from '../components/icon'
import { api } from '../lib/api'
import { useLocale } from '../lib/i18n'
import { detectUserLocation, type UserLocation } from '../lib/location'
import { usePublicCatalog } from '../lib/use_public_catalog'

type LayerKey = 'vegetation' | 'moisture' | 'heat'
type ClimateLayer = 'temperature' | 'rainfall' | 'satellite'
type RegionalClimateMap = { months: string[]; points: RegionalClimatePoint[] }

export default function ExplorerMap() {
  const { t } = useLocale()
  const { catalog, districtId, setDistrictId, loading, error, retry } = usePublicCatalog()
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    vegetation: true,
    moisture: true,
    heat: false,
  })
  const [opacity, setOpacity] = useState(76)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')
  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - 9
  const [selectedYear, setSelectedYear] = useState(endYear)
  const [selectedMonth, setSelectedMonth] = useState(11)
  const [playing, setPlaying] = useState(false)
  const [climateLayer, setClimateLayer] = useState<ClimateLayer>('temperature')
  const [regional, setRegional] = useState<RegionalClimateMap | null>(null)
  const [regionalError, setRegionalError] = useState('')
  const toggle = (layer: LayerKey) =>
    setLayers((current) => ({ ...current, [layer]: !current[layer] }))
  const soilMoisture = catalog?.soil?.soil_organic_carbon_percent ?? '—'
  const meanRain = catalog?.climate.length
    ? Math.round(
        catalog.climate.reduce((sum, row) => sum + (Number(row.rainfall_mm) || 0), 0) /
          catalog.climate.length
      )
    : null
  const showMyLocation = async () => {
    setLocating(true)
    setLocationError('')
    try {
      const location = await detectUserLocation()
      setUserLocation(location)
      if (location.districtId) setDistrictId(location.districtId)
    } catch {
      setLocationError(t('locationFallback'))
    } finally {
      setLocating(false)
    }
  }
  const latitude = userLocation?.latitude ?? Number(catalog?.district.latitude)
  const longitude = userLocation?.longitude ?? Number(catalog?.district.longitude)
  const mapDistrict = userLocation?.district ?? catalog?.district.district_name ?? ''
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSelectedMonth((month) => {
        if (month < 12) return month + 1
        setSelectedYear((year) => (year >= endYear ? startYear : year + 1))
        return 1
      })
    }, 900)
    return () => window.clearInterval(timer)
  }, [endYear, playing, startYear])
  useEffect(() => {
    const controller = new AbortController()
    api<RegionalClimateMap>('/api/v1/regional-climate-map', 'GET', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRegional(data)
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setRegionalError(reason instanceof Error ? reason.message : 'Climate map unavailable.')
      })
    return () => controller.abort()
  }, [])
  const climateKey = `${selectedYear}${String(selectedMonth).padStart(2, '0')}`

  return (
    <div className="oa-gis-page">
      <Head title={t('mapTitle')} />
      <div className="oa-gis-toolbar">
        <div>
          <span className="status status-success" />
          <h1>{t('mapTitle')}</h1>
          <span className="badge badge-success badge-outline">
            NASA · {String(selectedMonth).padStart(2, '0')}/{selectedYear}
          </span>
        </div>
        {catalog && (
          <div className="oa-gis-location-controls">
            <select
              className="select select-sm border-neutral-content/20 bg-neutral text-neutral-content"
              value={districtId}
              onChange={(event) => {
                setUserLocation(null)
                setLocationError('')
                setDistrictId(event.target.value)
              }}
              aria-label={t('selectDistrict')}
            >
              {catalog.districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={showMyLocation}
              disabled={locating}
            >
              {locating ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Icon name="navigation" />
              )}
              {locating ? t('locating') : t('useMyLocation')}
            </button>
          </div>
        )}
      </div>
      {loading && (
        <div className="oa-gis-loading" role="status">
          <span className="loading loading-ring loading-lg" />
          {t('loading')}
        </div>
      )}
      {error && (
        <div className="alert alert-error oa-gis-error" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm" onClick={retry}>
            {t('tryAgain')}
          </button>
        </div>
      )}
      {locationError && (
        <div className="alert alert-warning oa-gis-location-error" role="alert">
          <Icon name="warning" />
          <span>{locationError}</span>
        </div>
      )}
      {catalog && !loading && !error && (
        <div className="oa-gis-canvas">
          <BangladeshGisMap
            latitude={latitude}
            longitude={longitude}
            district={mapDistrict}
            accuracy={userLocation?.accuracy}
            layers={layers}
            opacity={opacity}
            satellite={climateLayer === 'satellite'}
            satelliteDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`}
            climateGrid={climateLayer === 'satellite' ? undefined : regional?.points}
            climateMetric={climateLayer === 'rainfall' ? 'rainfall' : 'temperature'}
            climateIndex={regional?.months.indexOf(climateKey) ?? -1}
          />

          <aside className="oa-gis-layers card">
            <div className="card-body">
              <div className="oa-card-top">
                <h1 className="card-title">Climate layer</h1>
                <span className="badge badge-success badge-outline">NASA</span>
              </div>
              <div className="oa-map-layer-switch" role="tablist" aria-label="Climate map layer">
                {(
                  [
                    ['temperature', 'sun', 'Temperature'],
                    ['rainfall', 'rain', 'Rainfall'],
                    ['satellite', 'satellite', 'Satellite'],
                  ] as const
                ).map(([key, icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={climateLayer === key}
                    className={`btn btn-sm ${climateLayer === key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setClimateLayer(key)}
                  >
                    <Icon name={icon} size={15} /> {label}
                  </button>
                ))}
              </div>
              {regionalError && (
                <div className="alert alert-warning alert-soft">
                  <Icon name="warning" size={16} /> {regionalError}
                </div>
              )}
              <h2 className="oa-context-title">Optional context</h2>
              {(
                [
                  ['vegetation', 'Crop records', 'Illustrative district context'],
                  ['moisture', 'Soil reference', 'District organic-carbon context'],
                  ['heat', t('temperature'), 'NASA POWER climate context'],
                ] as const
              ).map(([key, label, note]) => (
                <label className="oa-layer-row" key={key}>
                  <input
                    className="checkbox checkbox-sm checkbox-primary"
                    type="checkbox"
                    checked={layers[key]}
                    onChange={() => toggle(key)}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{note}</small>
                  </span>
                </label>
              ))}
              <label className="oa-opacity">
                <span>
                  Layer opacity <strong>{opacity}%</strong>
                </span>
                <input
                  className="range range-primary range-xs"
                  type="range"
                  min="20"
                  max="100"
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                />
              </label>
              <p className="oa-model-note">
                <Icon name="info" size={17} /> The MODIS true-colour imagery is visual context only.
                The circles are illustrative overlays from stored district references, not NDVI,
                soil-moisture or field measurements.
              </p>
              <Link className="btn btn-outline btn-sm" href="/explorer">
                View 10-year climate history
              </Link>
            </div>
          </aside>

          <aside className="oa-gis-diagnostic">
            <header>
              <span className="status status-success" />
              <div>
                <strong>{t('diagnostic')}</strong>
                <small>{mapDistrict}</small>
              </div>
            </header>
            {userLocation?.accuracy && (
              <p className="oa-gis-accuracy">
                <Icon name="navigation" size={16} /> {t('locationAccuracy')} ±
                {Math.round(userLocation.accuracy)} m
              </p>
            )}
            <div className="oa-diagnostic-grid">
              <article>
                <Icon name="leaf" />
                <span>Crop records</span>
                <strong>{catalog.statistics.length || '—'}</strong>
              </article>
              <article>
                <Icon name="water" />
                <span>Soil organic carbon</span>
                <strong>{soilMoisture === '—' ? soilMoisture : `${soilMoisture}%`}</strong>
              </article>
              <article>
                <Icon name="rain" />
                <span>{t('rain')}</span>
                <strong>{meanRain === null ? '—' : `${meanRain} mm`}</strong>
              </article>
              <article>
                <Icon name="warning" />
                <span>Drought</span>
                <strong>{catalog.risk?.drought_risk ?? '—'}</strong>
              </article>
            </div>
            <div className="alert alert-info alert-soft">
              <Icon name="info" />
              <span>{t('mapBody')}</span>
            </div>
          </aside>

          <div className="oa-gis-timeline">
            <button
              className="btn btn-primary btn-circle"
              aria-label={playing ? 'Pause climate history animation' : 'Play climate history animation'}
              onClick={() => setPlaying((value) => !value)}
            >
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
            </button>
            <div>
              <strong>
                Climate history · {String(selectedMonth).padStart(2, '0')}/{selectedYear}
              </strong>
              <input
                className="range range-primary range-xs"
                type="range"
                min={startYear}
                max={endYear}
                value={selectedYear}
                onChange={(event) => {
                  setPlaying(false)
                  setSelectedYear(Number(event.target.value))
                }}
              />
              <div>
                <span>{startYear}</span>
                <select
                  className="select select-xs"
                  aria-label="Map month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setPlaying(false)
                    setSelectedMonth(Number(event.target.value))
                  }}
                >
                  {[
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
                  ].map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <span>{endYear}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
