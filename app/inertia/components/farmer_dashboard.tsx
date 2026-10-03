import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { UserLocation } from '../lib/location'
import type { Catalog } from './data_browser'
import FarmWorkspace from './farm_workspace'
import Icon from './icon'
import RotationPlans, { type RotationPlan } from './rotation_plans'

type WaterLevel = 'low' | 'medium' | 'high'
type Farm = { farm_id: string; name: string; district_id: string }
type Analysis = {
  water: {
    label: string
    source: string
    chartNote: string
    rainfall: string
    soil: string
    dryPeriodRisk: string
    heavyRainRisk: string
    waterStress: string
    soilStress: string
    series: Array<{ month: string; index: number | null; level: string; rainfall: string }>
  }
  plans: RotationPlan[]
  planning: { status: string; message: string }
  contextNote: string
  source: { reportingYear: number | null } | null
}
const choices = [
  { level: 'high', title: 'High', text: 'Plenty of water. Irrigation is easily available.' },
  {
    level: 'medium',
    title: 'Medium',
    text: 'Water is available but limited. Irrigation needs planning.',
  },
  { level: 'low', title: 'Low', text: 'Water is scarce. Conservation matters most.' },
] as const
const phases = [
  'Analyzing local water patterns…',
  'Understanding seasonal water availability…',
  'Building suitable crop rotations…',
]

function WaterChart({ water }: { water: Analysis['water'] }) {
  // Keep gaps: unavailable months must not look like measured low water.
  const groups: Array<Array<{ x: number; y: number }>> = [[]]
  water.series.forEach((point, i) => {
    if (point.index === null) {
      if (groups.at(-1)!.length) groups.push([])
      return
    }
    groups.at(-1)!.push({ x: 70 + i * 44, y: 155 - point.index * 57 })
  })
  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Seasonal water outlook</h2>
        <p className="text-sm text-base-content/70">Your water choice + local rainfall patterns</p>
        {water.series.every((point) => point.index === null) && (
          <p className="rounded-xl bg-base-200 p-4 text-sm">
            Seasonal rainfall information is not available for this location yet. Your reported
            water availability is still shown above.
          </p>
        )}
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 600 205"
            className="mt-4 min-w-[480px] text-info"
            role="img"
            aria-labelledby="water-chart-title water-chart-description"
          >
            <title id="water-chart-title">Qualitative seasonal water availability</title>
            <desc id="water-chart-description">
              {water.series.map((item) => `${item.month}: ${item.level}`).join('. ')}.{' '}
              {water.chartNote}
            </desc>
            {[41, 98, 155].map((y, i) => (
              <g key={y}>
                <line x1="65" x2="566" y1={y} y2={y} stroke="currentColor" opacity=".12" />
                <text x="5" y={y + 4} fontSize="12" fill="currentColor">
                  {['High', 'Moderate', 'Low'][i]}
                </text>
              </g>
            ))}
            {groups
              .filter((group) => group.length)
              .map((group, i) => (
                <g key={i}>
                  <path
                    d={`M ${group[0].x} 165 L ${group.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${group.at(-1)!.x} 165 Z`}
                    fill="currentColor"
                    opacity=".1"
                  />
                  <polyline
                    points={group.map((point) => `${point.x},${point.y}`).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {group.map((point, j) => (
                    <circle key={j} cx={point.x} cy={point.y} r="3" fill="currentColor" />
                  ))}
                </g>
              ))}
            {water.series.map((item, i) => (
              <text
                key={item.month}
                x={70 + i * 44}
                y="192"
                fontSize="11"
                textAnchor="middle"
                fill="currentColor"
              >
                {item.month}
              </text>
            ))}
          </svg>
        </div>
        <p className="text-xs leading-relaxed text-base-content/65">{water.chartNote}</p>
      </div>
    </div>
  )
}

export default function FarmerDashboard({
  location,
  catalog,
  signedIn,
}: {
  location: UserLocation
  catalog: Catalog
  signedIn: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRef<AbortController | null>(null)
  const [choice, setChoice] = useState<WaterLevel | null>(location.waterAvailability ?? null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState(0)
  const [error, setError] = useState('')
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmId, setFarmId] = useState('')
  const [farmsError, setFarmsError] = useState('')
  const [farmsLoading, setFarmsLoading] = useState(false)
  const [farmRefresh, setFarmRefresh] = useState(0)
  async function analyze(level: WaterLevel) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setPhase(0)
    setError('')
    setAnalysis(null)
    dialog.current?.close()
    try {
      const data = await api<Analysis>(
        '/api/v1/crop-rotation/analyze',
        'POST',
        {
          districtId: location.districtId,
          waterAvailability: level,
          ...(location.latitude !== null && location.longitude !== null
            ? { latitude: location.latitude, longitude: location.longitude }
            : {}),
          ...(farmId ? { farmId: Number(farmId) } : {}),
        },
        controller.signal
      )
      if (!controller.signal.aborted) setAnalysis(data)
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'We could not load your outlook. Please try again.'
        )
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  useEffect(() => {
    if (location.waterAvailability) void analyze(location.waterAvailability)
    else dialog.current?.showModal()
    return () => request.current?.abort()
  }, [])
  useEffect(() => {
    if (!signedIn) return
    const controller = new AbortController()
    setFarmsLoading(true)
    setFarmsError('')
    api<Farm[]>('/api/v1/farms', 'GET', undefined, controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted)
          setFarms(rows.filter((row) => String(row.district_id) === location.districtId))
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setFarmsError(reason.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setFarmsLoading(false)
      })
    return () => controller.abort()
  }, [signedIn, location.districtId, farmRefresh])
  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(
      () => setPhase((current) => Math.min(current + 1, phases.length - 1)),
      1400
    )
    return () => window.clearInterval(timer)
  }, [busy])
  const latitude = location.latitude ?? Number(catalog.district.latitude)
  const longitude = location.longitude ?? Number(catalog.district.longitude)
  const canMap =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  const water = analysis?.water
  const currentRain = water?.series[new Date().getMonth()]?.rainfall ?? 'Not available'
  return (
    <div className="farmer-flow farmer-dashboard-enter space-y-6 pb-8 text-base-content">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body justify-center p-6 sm:p-8">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Icon name="pin" />
              Your local growing guide
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Make room for a resilient harvest.
            </h1>
            <p className="mt-2 max-w-xl text-base-content/75">
              Explore crops that fit your seasons, your water and what matters to your farm.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="badge badge-info badge-soft">
                {location.district}, {location.country}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline btn-primary"
                onClick={() => dialog.current?.showModal()}
                disabled={busy}
              >
                <Icon name="water" />
                {choice ? 'Change water availability' : 'Choose water availability'}
              </button>
            </div>
          </div>
        </div>
        {canMap && (
          <div className="card overflow-hidden border border-base-300 bg-base-100">
            <iframe
              title={`Map preview of ${location.district}`}
              className="h-44 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.08}%2C${latitude - 0.05}%2C${longitude + 0.08}%2C${latitude + 0.05}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            />
            <p className="px-4 py-2 text-xs text-base-content/70">
              {location.latitude === null
                ? 'Selected district reference point'
                : 'Your detected location'}{' '}
              ·{' '}
              <a
                className="link"
                target="_blank"
                rel="noreferrer"
                href="https://www.openstreetmap.org/copyright"
              >
                © OpenStreetMap
              </a>
            </p>
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="water-title"
        aria-describedby="water-description"
      >
        <div className="modal-box w-[calc(100%-2rem)] max-w-2xl rounded-2xl p-6 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info">
            <Icon name="water" size={26} />
          </span>
          <h2 id="water-title" className="text-2xl font-semibold">
            How is water availability on your farm?
          </h2>
          <p id="water-description" className="mt-2 text-base-content/70">
            Choose what feels closest. You can change this later.
          </p>
          <fieldset className="my-6 grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Farm water availability</legend>
            {choices.map((item) => (
              <label
                key={item.level}
                className={`card cursor-pointer border-2 p-4 transition-colors hover:border-info ${choice === item.level ? 'border-info bg-info/5' : 'border-base-300 bg-base-100'}`}
              >
                <span className="mb-4 flex items-center justify-between text-info">
                  <Icon name="water" size={30} />
                  <input
                    type="radio"
                    name="water-availability"
                    value={item.level}
                    checked={choice === item.level}
                    onChange={() => setChoice(item.level)}
                    className="radio radio-info size-6 min-h-6 shrink-0 p-0"
                  />
                </span>
                <span className="text-lg font-semibold">{item.title}</span>
                <span className="mt-2 text-sm font-normal text-base-content/75">{item.text}</span>
              </label>
            ))}
          </fieldset>
          <button
            className="btn btn-primary min-h-12 w-full"
            type="button"
            disabled={!choice}
            onClick={() => choice && void analyze(choice)}
          >
            Continue
            <Icon name="arrow" />
          </button>
          <form method="dialog" className="mt-2">
            <button className="btn btn-ghost min-h-12 w-full">Not now</button>
          </form>
          <p className="mt-3 text-center text-xs text-base-content/65">
            Your choice is a planning preference, not a measured water supply.
          </p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button
            className="rounded-none border-0 bg-transparent p-0 text-transparent shadow-none hover:bg-transparent hover:shadow-none"
            aria-label="Close water selection"
          >
            Close water selection
          </button>
        </form>
      </dialog>
      {signedIn && (
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body gap-3 p-5 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-sm font-medium">
                Use a saved farm for crop planning
              </span>
              <select
                className="select w-full"
                value={farmId}
                disabled={busy || farmsLoading}
                onChange={(event) => {
                  setFarmId(event.target.value)
                  setAnalysis(null)
                }}
              >
                <option value="">
                  {farmsLoading ? 'Loading your farms…' : 'District water outlook only'}
                </option>
                {farms.map((farm) => (
                  <option key={farm.farm_id} value={farm.farm_id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              className="btn btn-ghost"
              onClick={() => setFarmRefresh((value) => value + 1)}
            >
              Refresh farms
            </button>
            <button
              type="button"
              className="btn btn-primary min-h-12"
              disabled={busy || !choice}
              onClick={() => choice && void analyze(choice)}
            >
              Build my outlook
              <Icon name="arrow" />
            </button>
          </div>
          {farmsError && (
            <p className="px-5 pb-4 text-sm text-error" role="alert">
              {farmsError}
            </p>
          )}
        </div>
      )}
      {busy && (
        <div className="card border border-base-300 bg-base-100" role="status" aria-live="polite">
          <div className="card-body items-center py-12 text-center">
            <span className="loading loading-ring loading-lg text-info" />
            <h2 className="mt-3 text-xl font-semibold">
              {phase === 2 && !farmId ? 'Preparing your local outlook…' : phases[phase]}
            </h2>
            <p className="text-sm text-base-content/65">
              Checking stored information for {location.district}.
            </p>
            <ul className="steps steps-horizontal mt-4 text-xs">
              {['Local patterns', 'Seasonal outlook', 'Crop plans'].map((label, i) => (
                <li key={label} className={`step ${i <= phase ? 'step-primary' : ''}`}>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-error alert-soft" role="alert">
          <Icon name="info" />
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => choice && void analyze(choice)}
          >
            Try again
          </button>
        </div>
      )}
      {analysis && water && (
        <>
          <section className="card border border-info/20 bg-base-100" aria-label="Water outlook">
            <div className="card-body gap-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-info">
                    <Icon name="water" />
                    Water outlook
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">{water.label} water availability</h2>
                  <p className="mt-2 text-sm text-base-content/70">
                    Your reported farm availability
                  </p>
                </div>
                <span className="badge badge-info badge-soft">{location.district}</span>
              </div>
              <progress
                className="progress progress-info h-3 w-full sm:max-w-md"
                value={{ Low: 25, Moderate: 60, High: 90 }[water.label]}
                max={100}
              aria-label={`${water.label} water availability, farmer reported`}
              aria-valuetext={`${water.label}, farmer reported`}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: 'water' as const,
                    label: 'Rainfall pattern this season',
                    value: currentRain,
                  },
                  { icon: 'leaf' as const, label: 'Local soil reference', value: water.soil },
                  { icon: 'sun' as const, label: 'Dry-period risk', value: water.dryPeriodRisk },
                  {
                    icon: 'shield' as const,
                    label: 'Water planning pressure',
                    value: water.waterStress,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-base-200 p-4">
                    <span className="text-info">
                      <Icon name={item.icon} />
                    </span>
                    <p className="mt-3 text-xs text-base-content/70">{item.label}</p>
                    <p className="mt-1 font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-base-content/65">
                {analysis.contextNote}
                {analysis.source?.reportingYear
                  ? ` District references: ${analysis.source.reportingYear}.`
                  : ''}
              </p>
            </div>
          </section>
          {analysis.plans.length ? (
            <>
              <p className="px-1 text-sm text-base-content/75">
                {analysis.planning.message} The water choice above does not change measured
                irrigation in your farm record.
              </p>
              <RotationPlans
                key={analysis.plans.map((plan) => plan.id).join(',')}
                plans={analysis.plans}
              />
            </>
          ) : (
            <div id="crop-plans" className="alert alert-info alert-soft items-start">
              <Icon name="leaf" />
              <div>
                <h2 className="font-semibold">
                  {analysis.planning.status === 'no-feasible-plans' ||
                  analysis.planning.status === 'no_feasible_rotation'
                    ? 'No suitable rotation found'
                    : 'Let’s prepare your crop plan'}
                </h2>
                <p className="mt-1 text-sm">{analysis.planning.message}</p>
                {!signedIn && (
                  <a className="btn btn-primary btn-sm mt-3" href="/login">
                    Sign in to plan your farm
                  </a>
                )}
                {signedIn && (
                  <a className="link mt-3 inline-block text-sm" href="#farm-details">
                    Review farm details
                  </a>
                )}
              </div>
            </div>
          )}
          <WaterChart water={water} />
          <section>
            <h2 className="mb-4 text-xl font-semibold">What to watch this season</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: 'water' as const,
                  label: 'Heavy rain / flood risk',
                  value: water.heavyRainRisk,
                },
                { icon: 'sun' as const, label: 'Dry-period risk', value: water.dryPeriodRisk },
                {
                  icon: 'shield' as const,
                  label: 'Water planning pressure',
                  value: water.waterStress,
                },
                { icon: 'leaf' as const, label: 'Soil planning', value: water.soilStress },
              ].map((risk) => (
                <div key={risk.label} className="card border border-base-300 bg-base-100 p-5">
                  <span className={risk.value === 'High' ? 'text-warning' : 'text-primary'}>
                    <Icon name={risk.icon} />
                  </span>
                  <h3 className="mt-3 text-sm text-base-content/75">{risk.label}</h3>
                  <span
                    className={`badge mt-2 ${risk.value === 'High' ? 'badge-warning badge-soft' : 'badge-outline'}`}
                  >
                    {risk.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-base-content/65">
              District risks are historical context. Water planning pressure reflects your
              selection; it is not measured water stress.
            </p>
          </section>
        </>
      )}
      {!busy && !analysis && !error && (
        <div className="card border border-dashed border-base-300 bg-base-100 p-8 text-center">
          <h2 className="text-xl font-semibold">Start with your farm’s water</h2>
          <p className="my-3 text-base-content/70">
            A quick choice helps you explore the local seasonal outlook.
          </p>
          <button
            type="button"
            className="btn btn-primary mx-auto"
            onClick={() => dialog.current?.showModal()}
          >
            Choose water availability
          </button>
        </div>
      )}
      {signedIn && (
        <details
          id="farm-details"
          className="collapse collapse-arrow border border-base-300 bg-base-100"
        >
          <summary className="collapse-title text-lg font-semibold">
            Add or update your farm details
          </summary>
          <div className="collapse-content">
            <p className="mb-4 text-sm text-base-content/70">
              Save real irrigation, soil tests, previous crops and priorities here. Then refresh
              your farms and build your outlook above.
            </p>
            <FarmWorkspace catalog={catalog} />
          </div>
        </details>
      )}
    </div>
  )
}
