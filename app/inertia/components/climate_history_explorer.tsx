import { useEffect, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import BangladeshGisMap, { type RegionalClimatePoint } from './bangladesh_gis_map'
import Stat from './stat'
import Tooltip from './tooltip'
import SourceChip from './source_chip'
import { api } from '../lib/api'
import {
  Sun,
  CloudRain,
  Satellite as SatelliteIcon,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react'

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
    grid: string
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
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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
        if (!controller.signal.aborted) {
          console.error('NASA climate history fetch error:', reason)
          setError(reason instanceof Error ? reason.message : 'Climate history unavailable.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [districtId, latitude, longitude, retry])

  useEffect(() => {
    const controller = new AbortController()
    setRegionalLoading(true)
    api<RegionalClimateMap>('/api/v1/regional-climate-map', 'GET', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRegional(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setRegionalLoading(false)
      })
    return () => controller.abort()
  }, [retry])

  // Play animation through 10 years month-by-month
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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="skeleton-solid w-12 h-12 rounded-full mx-auto" />
        <div className="text-xs font-mono text-base-content/60">
          Syncing NASA POWER agro-meteorology records…
        </div>
      </div>
    )
  }

  if (error || !history) {
    return (
      <div className="p-4 rounded-xl bg-warning/15 text-warning-content border border-warning/30 flex items-center justify-between text-xs">
        <span>{error || 'Climate history unavailable.'}</span>
        <button className="btn btn-xs btn-outline" onClick={() => setRetry((v) => v + 1)}>
          Retry
        </button>
      </div>
    )
  }

  const selectedMonthAtLocation = history.months.find(
    (row) => row.year === selectedYear && row.month === selectedMonth
  )
  const selectedYearObj = history.years.find((row) => row.year === selectedYear)
  const climateKey = `${selectedYear}${String(selectedMonth).padStart(2, '0')}`
  const satelliteDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`
  const climateIndex = regional?.months.indexOf(climateKey) ?? -1

  // 10-year Mean Temp
  const validYears = history.years.filter((row) => row.meanTemperatureC !== null)
  const tenYearMean = validYears.length
    ? (validYears.reduce((sum, row) => sum + (row.meanTemperatureC ?? 0), 0) / validYears.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* 4 Minimal KPI Cards (1 title + 1 value + 1 label each) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          title="Location"
          value={districtName}
          label={`${history.latitude.toFixed(2)}°N, ${history.longitude.toFixed(2)}°E`}
          source="NASA POWER"
          icon={<MapPin className="w-3.5 h-3.5" />}
        />
        <Stat
          title="10-Year Mean"
          value={tenYearMean}
          unit="°C"
          label={`${history.startYear}–${history.endYear} baseline`}
          source="NASA POWER"
          icon={<Sun className="w-3.5 h-3.5" />}
        />
        <Stat
          title="Decadal Warming"
          value={
            history.warmingCPerDecade !== null
              ? `${history.warmingCPerDecade > 0 ? '+' : ''}${history.warmingCPerDecade}`
              : '—'
          }
          unit="°C / dec"
          label="Linear temperature trend"
          trend={(history.warmingCPerDecade ?? 0) > 0 ? 'up' : 'neutral'}
          trendLabel="Warming"
          source="NASA POWER"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
        />
        <Stat
          title={`${selectedYear} Rainfall`}
          value={selectedYearObj?.rainfallMm ? Math.round(selectedYearObj.rainfallMm) : '—'}
          unit="mm"
          label="Annual precipitation total"
          source="NASA POWER"
          icon={<CloudRain className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Main Map Stage + Side Card */}
      <div className="card-modern overflow-hidden">
        {/* Top Control Bar: Segmented Switch */}
        <div className="p-3 bg-base-200/50 border-b border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-base-100 p-1 rounded-xl border border-base-300/80">
            {[
              { id: 'temperature' as const, label: 'Temperature', icon: Sun },
              { id: 'rainfall' as const, label: 'Rainfall', icon: CloudRain },
              { id: 'satellite' as const, label: 'Satellite', icon: SatelliteIcon },
            ].map((tab) => {
              const Icon = tab.icon
              const active = view === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                    active
                      ? 'bg-success text-success-content shadow-xs'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <Link
            href="/explorer/map"
            className="text-xs font-semibold text-success hover:underline flex items-center gap-1 self-end sm:self-auto"
          >
            <span>Open Fullscreen GIS View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Map Stage & Minimal Side Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
          {/* Main Map (Primary element) */}
          <div className="lg:col-span-8 relative min-h-[380px] bg-base-200">
            {regionalLoading && (
              <div className="absolute top-3 left-3 z-20 px-2 py-1 rounded-md bg-base-100/90 text-[10px] font-mono border border-base-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                Calibrating spatial grid…
              </div>
            )}

            {view === 'satellite' ? (
              <BangladeshGisMap
                latitude={history.latitude}
                longitude={history.longitude}
                district={districtName}
                compact
                satellite
                satelliteDate={satelliteDate}
              />
            ) : (
              <BangladeshGisMap
                latitude={history.latitude}
                longitude={history.longitude}
                district={districtName}
                compact
                climateGrid={regional?.points}
                climateMetric={view}
                climateIndex={climateIndex}
              />
            )}
          </div>

          {/* Side Card: Strictly 1 Title + 1 Selected Value + 1 Label + 'i' Tooltip */}
          <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-base-100 border-t lg:border-t-0 lg:border-l border-base-300">
            <div className="space-y-4">
              {/* Title with 'i' Tooltip */}
              <div className="flex items-center justify-between pb-3 border-b border-base-300/60">
                <span className="text-xs font-bold text-base-content">
                  {view === 'temperature'
                    ? 'Monthly Air Temperature'
                    : view === 'rainfall'
                    ? 'Monthly Precipitation'
                    : 'MODIS Reflectance'}
                </span>
                <Tooltip
                  title="NASA POWER Calibration"
                  content={
                    view === 'satellite'
                      ? 'True-colour MODIS Terra surface reflectance imagery for the exact mid-month coordinate.'
                      : 'Spatial meteorology derived from satellite solar radiance and meteorological assimilation models.'
                  }
                />
              </div>

              {/* 1 Key Value (Prominent, Mono font) */}
              <div className="my-2">
                <span className="text-3xl font-bold font-mono-data text-base-content tracking-tight">
                  {view === 'temperature'
                    ? selectedMonthAtLocation?.meanTemperatureC !== null && selectedMonthAtLocation?.meanTemperatureC !== undefined
                      ? `${selectedMonthAtLocation.meanTemperatureC.toFixed(1)}°C`
                      : 'No data'
                    : view === 'rainfall'
                    ? selectedMonthAtLocation?.rainfallMm !== null && selectedMonthAtLocation?.rainfallMm !== undefined
                      ? `${Math.round(selectedMonthAtLocation.rainfallMm)} mm`
                      : 'No data'
                    : '250m Res'}
                </span>
              </div>

              {/* 1 Small Label: Date & District */}
              <div className="text-xs text-base-content/70 flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-success" />
                <span>
                  {monthNames[selectedMonth - 1]} {selectedYear} · {districtName}
                </span>
              </div>
            </div>

            {/* Bottom Meta & Source */}
            <div className="pt-4 border-t border-base-300/50 flex items-center justify-between">
              <span className="text-[10px] text-base-content/50 font-mono">
                Lat: {history.latitude.toFixed(2)} Lon: {history.longitude.toFixed(2)}
              </span>
              <SourceChip source={view === 'satellite' ? 'NASA MODIS' : 'NASA POWER'} />
            </div>
          </div>
        </div>

        {/* Timeline Slider at Bottom */}
        <div className="p-4 bg-base-200/40 border-t border-base-300 flex flex-col sm:flex-row items-center gap-4">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="w-10 h-10 rounded-full bg-success text-success-content flex items-center justify-center flex-shrink-0 hover:bg-success/90 shadow-sm active:scale-95 transition-transform"
            aria-label={playing ? 'Pause' : 'Play Timeline'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              className="select select-bordered select-xs rounded-lg font-mono text-xs"
              value={selectedMonth}
              onChange={(e) => {
                setPlaying(false)
                setSelectedMonth(Number(e.target.value))
              }}
              aria-label="Select Month"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <span className="font-mono font-bold text-sm text-base-content w-12 text-center">
              {selectedYear}
            </span>
          </div>

          {/* Range Slider */}
          <div className="flex-1 w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-base-content/50">{history.startYear}</span>
            <input
              type="range"
              min={history.startYear}
              max={history.endYear}
              step="1"
              value={selectedYear}
              onChange={(e) => {
                setPlaying(false)
                setSelectedYear(Number(e.target.value))
              }}
              className="range range-xs range-success flex-1"
              aria-label="Timeline Year Slider"
            />
            <span className="text-[10px] font-mono text-base-content/50">{history.endYear}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
