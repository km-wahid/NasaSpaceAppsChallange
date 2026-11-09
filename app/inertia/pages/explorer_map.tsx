import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import BangladeshGisMap, { type RegionalClimatePoint } from '../components/bangladesh_gis_map'
import { api } from '../lib/api'
import { useLocale } from '../lib/i18n'
import { detectUserLocation, type UserLocation } from '../lib/location'
import { usePublicCatalog } from '../lib/use_public_catalog'
import {
  Layers,
  ChevronUp,
  ArrowLeft,
  Navigation,
  Play,
  Pause,
  Sun,
  CloudRain,
  Satellite as SatelliteIcon,
  Sliders,
  X,
} from 'lucide-react'

type LayerKey = 'vegetation' | 'moisture' | 'heat'
type ClimateLayer = 'temperature' | 'rainfall' | 'satellite'
type RegionalClimateMap = { months: string[]; points: RegionalClimatePoint[] }

export default function ExplorerMap() {
  const { t } = useLocale()
  const { catalog, districtId, setDistrictId, loading, error } = usePublicCatalog()
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    vegetation: true,
    moisture: true,
    heat: false,
  })
  const [opacity, setOpacity] = useState(76)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locating, setLocating] = useState(false)
  const [layerPanelOpen, setLayerPanelOpen] = useState(true)
  const [legendOpen, setLegendOpen] = useState(false)

  const endYear = new Date().getUTCFullYear() - 1
  const startYear = endYear - 9
  const [selectedYear, setSelectedYear] = useState(endYear)
  const [selectedMonth, setSelectedMonth] = useState(11)
  const [playing, setPlaying] = useState(false)
  const [climateLayer, setClimateLayer] = useState<ClimateLayer>('temperature')
  const [regional, setRegional] = useState<RegionalClimateMap | null>(null)

  const toggle = (layer: LayerKey) =>
    setLayers((current) => ({ ...current, [layer]: !current[layer] }))

  const showMyLocation = async () => {
    setLocating(true)
    try {
      const location = await detectUserLocation()
      setUserLocation(location)
      if (location.districtId) setDistrictId(location.districtId)
    } catch {}
    setLocating(false)
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
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const climateKey = `${selectedYear}${String(selectedMonth).padStart(2, '0')}`

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  return (
    <div className="relative w-full h-[calc(100vh-56px)] md:h-screen overflow-hidden bg-base-300">
      <Head title={t('mapTitle') || 'GIS Satellite View - OrbitAgro'} />

      {/* Full-Screen Map Component */}
      {catalog && !loading && !error && (
        <div className="absolute inset-0 w-full h-full">
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
        </div>
      )}

      {/* Floating Top Header Bar */}
      <div className="absolute top-3 inset-x-3 md:inset-x-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Back Link & District selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            href="/explorer"
            className="btn btn-sm btn-circle bg-base-100/90 backdrop-blur border border-base-300 shadow-sm hover:bg-base-100"
            aria-label="Back to Explorer"
          >
            <ArrowLeft className="w-4 h-4 text-base-content" />
          </Link>

          {catalog && (
            <div className="flex items-center gap-1.5 bg-base-100/90 backdrop-blur p-1 rounded-xl border border-base-300 shadow-sm">
              <select
                className="select select-bordered select-xs rounded-lg text-xs font-semibold bg-transparent"
                value={districtId}
                onChange={(e) => {
                  setUserLocation(null)
                  setDistrictId(e.target.value)
                }}
                aria-label="Select District"
              >
                {catalog.districts.map((d) => (
                  <option key={d.district_id} value={d.district_id}>
                    {d.district_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={showMyLocation}
                disabled={locating}
                className="btn btn-ghost btn-xs btn-square"
                title="Locate me"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin text-success' : 'text-base-content/70'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Center/Right: Coordinates in JetBrains Mono font */}
        <div className="pointer-events-auto bg-base-100/90 backdrop-blur px-3 py-1 rounded-xl border border-base-300 shadow-sm text-xs font-mono text-base-content/80 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span>
            {latitude ? latitude.toFixed(3) : '—'}°N, {longitude ? longitude.toFixed(3) : '—'}°E
          </span>
        </div>
      </div>

      {/* Floating Collapsible Layer Panel (Top Right) */}
      <aside className="absolute top-14 right-3 md:right-6 z-30 pointer-events-auto max-w-xs w-full sm:w-72">
        {layerPanelOpen ? (
          <div className="card-modern p-4 bg-base-100/95 backdrop-blur shadow-xl border border-base-300 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-base-300/60">
              <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-success" />
                Map Layers
              </span>
              <button
                type="button"
                onClick={() => setLayerPanelOpen(false)}
                className="p-1 text-base-content/50 hover:text-base-content rounded-md"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Layer Switch */}
            <div className="grid grid-cols-3 gap-1 bg-base-200/70 p-1 rounded-xl text-center">
              {[
                { id: 'temperature' as const, label: 'Temp', icon: Sun },
                { id: 'rainfall' as const, label: 'Rain', icon: CloudRain },
                { id: 'satellite' as const, label: 'Sat', icon: SatelliteIcon },
              ].map((item) => {
                const Icon = item.icon
                const active = climateLayer === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClimateLayer(item.id)}
                    className={`py-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      active ? 'bg-success text-white shadow-xs' : 'text-base-content/70 hover:text-base-content'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Optional Context Checkboxes */}
            <div className="space-y-1.5 pt-1 text-xs">
              {(
                [
                  ['vegetation', 'Vegetation (NDVI)'],
                  ['moisture', 'Soil Organic Carbon'],
                  ['heat', 'Heat Stress Buffer'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs checkbox-success rounded"
                    checked={layers[k]}
                    onChange={() => toggle(k)}
                  />
                  <span className="text-base-content/80 text-[11px] font-medium">{label}</span>
                </label>
              ))}
            </div>

            {/* Opacity Range */}
            <div className="pt-2 border-t border-base-300/40">
              <div className="flex items-center justify-between text-[11px] font-mono text-base-content/60 mb-1">
                <span>Opacity</span>
                <span>{opacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="range range-xs range-success"
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLayerPanelOpen(true)}
            className="ml-auto btn btn-sm bg-base-100/90 backdrop-blur border border-base-300 rounded-full shadow-md gap-1.5 text-xs font-semibold text-base-content flex items-center"
          >
            <Sliders className="w-3.5 h-3.5 text-success" />
            <span>Layers</span>
          </button>
        )}
      </aside>

      {/* Floating Collapsible Mini Legend (Bottom Left) */}
      <div className="absolute bottom-20 left-3 md:left-6 z-30 pointer-events-auto">
        {legendOpen ? (
          <div className="card-modern p-3 bg-base-100/95 backdrop-blur shadow-lg border border-base-300 w-52 space-y-2 animate-fade-in text-[11px]">
            <div className="flex items-center justify-between pb-1 border-b border-base-300/60 font-semibold text-base-content">
              <span>{climateLayer === 'rainfall' ? 'Rainfall Scale (mm)' : 'Temperature Scale (°C)'}</span>
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                className="text-base-content/50 hover:text-base-content"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-base-content/70">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
            <div className="h-2 rounded-full w-full bg-linear-to-r from-emerald-500 via-amber-400 to-rose-500" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLegendOpen(true)}
            className="btn btn-xs bg-base-100/90 backdrop-blur border border-base-300 rounded-full shadow-sm text-[11px] font-semibold text-base-content/80"
          >
            Legend
          </button>
        )}
      </div>

      {/* Floating Bottom Timeline Scrubber */}
      <div className="absolute bottom-3 inset-x-3 md:inset-x-6 z-30 pointer-events-auto">
        <div className="card-modern p-2.5 bg-base-100/95 backdrop-blur border border-base-300 shadow-xl flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center flex-shrink-0 active:scale-95"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <select
            className="select select-bordered select-xs rounded-lg font-mono text-xs"
            value={selectedMonth}
            onChange={(e) => {
              setPlaying(false)
              setSelectedMonth(Number(e.target.value))
            }}
          >
            {monthNames.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <span className="font-mono font-bold text-xs text-base-content w-10 text-center">
            {selectedYear}
          </span>

          <input
            type="range"
            min={startYear}
            max={endYear}
            value={selectedYear}
            onChange={(e) => {
              setPlaying(false)
              setSelectedYear(Number(e.target.value))
            }}
            className="range range-xs range-success flex-1"
          />
        </div>
      </div>
    </div>
  )
}
