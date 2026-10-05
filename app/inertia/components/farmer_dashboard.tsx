import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import type { UserLocation } from '../lib/location'
import type { Catalog } from './data_browser'
import FarmWorkspace from './farm_workspace'
import Icon from './icon'
import LocationMap from './location_map'
import RotationPlans, { type RotationPlan } from './rotation_plans'
import { demoRotations } from '../lib/demo_rotations'

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
    series: Array<{
      month: string
      index: number | null
      level: string
      rainfall: string
      season?: string | null
    }>
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
  const [selected, setSelected] = useState(new Date().getMonth())
  const month = water.series[selected] ?? water.series[0]
  const hasData = water.series.some((point) => point.index !== null)
  return (
    <div className="card seasonal-water-chart border border-base-300 bg-base-100">
      <div className="card-body gap-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="agri-eyebrow mb-2 text-info">PLAN THROUGH THE YEAR</p>
            <h2 className="text-2xl font-semibold">Seasonal water outlook</h2>
            <p className="mt-2 text-sm text-base-content/70">
              See when water may be easier to plan for. Tap a month to explore.
            </p>
          </div>
          <span className="badge badge-outline gap-2">
            <Icon name="water" size={15} />
            Planning guide
          </span>
        </div>
        {!hasData && (
          <p className="rounded-xl bg-base-200 p-4 text-sm">
            A combined water outlook needs local rainfall context and your optional water choice.
            Missing information is shown as unavailable, not estimated.
          </p>
        )}
        <div
          className="water-calendar"
          role="group"
          aria-label="Explore water availability by month"
        >
          {water.series.map((item, i) => (
            <button
              key={item.month}
              type="button"
              className="water-month"
              aria-label={`${item.month}: ${item.index === null ? 'No data' : item.level} water availability`}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              data-level={item.index === null ? 'unknown' : item.level.toLowerCase()}
            >
              <span className="water-month-track" aria-hidden="true">
                {item.index === null ? (
                  <span className="water-month-missing">—</span>
                ) : (
                  <span
                    className="water-month-fill"
                    style={{ height: `${[25, 60, 100][item.index]}%` }}
                  />
                )}
              </span>
              <strong>{item.month}</strong>
              <span className="water-month-label">
                {item.index === null ? 'No data' : item.level}
              </span>
            </button>
          ))}
        </div>
        {month && (
          <div className="water-month-detail" aria-live="polite" aria-atomic="true">
            <div>
              <span className="text-sm text-base-content/65">Selected month</span>
              <h3 className="mt-1 text-xl font-semibold">
                {month.month}
                {month.season ? ` · ${month.season}` : ''}
              </h3>
            </div>
            <div>
              <span className="text-sm text-base-content/65">Water outlook</span>
              <p className="mt-1 font-semibold">
                {month.index === null ? 'Not available' : month.level}
              </p>
            </div>
            <div>
              <span className="text-sm text-base-content/65">Seasonal rainfall</span>
              <p className="mt-1 font-semibold">{month.rainfall}</p>
            </div>
            <p className="water-month-tip text-sm text-base-content/75">
              {month.index === null
                ? 'No local pattern is available for this month. Do not treat missing data as low water.'
                : month.level === 'Low'
                  ? 'Water may be tighter in this period. Review irrigation options before choosing water-intensive crops.'
                  : month.level === 'High'
                    ? 'The combined outlook is higher in this period. Confirm actual farm water before planting.'
                    : 'Some water is indicated in this period. Plan irrigation around your crop’s needs.'}
            </p>
          </div>
        )}
        <p className="flex items-start gap-2 text-xs leading-relaxed text-base-content/65">
          <Icon name="info" size={16} />
          <span>
            {water.chartNote} Bar heights show Low / Moderate / High categories, not water
            quantities.
          </span>
        </p>
      </div>
    </div>
  )
}

function SeasonalRisks({ water }: { water: Analysis['water'] }) {
  const risks = [
    {
      icon: 'water' as const,
      title: 'Heavy rain & flooding',
      value: water.heavyRainRisk,
      source: 'Historical district pattern',
      tips: [
        'Lower historical risk. Still check local weather before field work.',
        'Keep an eye on heavy-rain alerts and field drainage.',
        'Review drainage and local flood alerts before planting.',
      ],
    },
    {
      icon: 'sun' as const,
      title: 'Dry spells',
      value: water.dryPeriodRisk,
      source: 'Historical district pattern',
      tips: [
        'Lower historical risk. Keep checking rainfall and crop needs.',
        'Plan a backup water source for dry periods.',
        'Review irrigation access and lower-water crop options.',
      ],
    },
    {
      icon: 'shield' as const,
      title: 'Irrigation planning',
      value: water.waterStress,
      source: 'Based on your water selection',
      tips: [
        'Your water choice suggests less planning pressure. Confirm access when needed.',
        'Your water is limited. Plan when irrigation will be available.',
        'Your water is scarce. Compare lower-water rotations and irrigation options.',
      ],
    },
  ]
  return (
    <section className="seasonal-risks" aria-labelledby="seasonal-risks-title">
      <div className="mb-5">
        <p className="agri-eyebrow mb-2 text-primary">A LITTLE PLANNING GOES A LONG WAY</p>
        <h2 id="seasonal-risks-title" className="text-2xl font-semibold">
          What to watch this season
        </h2>
        <p className="mt-2 text-sm text-base-content/70">
          Understand the signals. Know what to check next.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {risks.map((risk) => {
          const level = ['Low', 'Medium', 'High'].indexOf(risk.value)
          const tone =
            level === 0 ? 'success' : level === 1 ? 'warning' : level === 2 ? 'error' : 'unknown'
          return (
            <article
              key={risk.title}
              className="card seasonal-signal border border-base-300 bg-base-100"
              data-tone={tone}
            >
              <div className="card-body gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="signal-icon">
                    <Icon name={risk.icon} size={23} />
                  </span>
                  <span
                    className={`badge badge-soft ${level === 0 ? 'badge-success' : level === 1 ? 'badge-warning' : level === 2 ? 'badge-error' : 'badge-neutral'}`}
                  >
                    {level < 0
                      ? 'No data'
                      : `${risk.value} ${risk.icon === 'shield' ? 'pressure' : 'risk'}`}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{risk.title}</h3>
                <div className="signal-meter" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} data-active={level >= i} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-base-content/80">
                  {level < 0
                    ? 'Local information is missing. Check local conditions rather than assuming the risk is low.'
                    : risk.tips[level]}
                </p>
                <p className="mt-auto pt-3 text-xs text-base-content/60">{risk.source}</p>
              </div>
            </article>
          )
        })}
        <article
          className="card seasonal-signal border border-base-300 bg-base-100"
          data-tone="unknown"
        >
          <div className="card-body gap-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="signal-icon">
                <Icon name="leaf" size={23} />
              </span>
              <span className="badge badge-outline">Next step</span>
            </div>
            <h3 className="text-lg font-semibold">Know your soil</h3>
            <p className="text-base font-medium">A farm soil test is needed</p>
            <p className="text-sm leading-relaxed text-base-content/80">
              District data cannot tell us your field’s soil health. Add a local soil test to guide
              your rotation.
            </p>
            <p className="mt-auto pt-3 text-xs text-base-content/60">
              Farm-specific information required
            </p>
          </div>
        </article>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-base-content/65">
        <Icon name="info" size={16} />
        <span>
          These are planning signals, not live warnings. Rain and dry-spell risks come from district
          history. Irrigation pressure comes from your selection, not a measured water-stress
          reading.
        </span>
      </p>
    </section>
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
  const farmDetails = useRef<HTMLDetailsElement>(null)
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
  async function analyze(level: WaterLevel | null) {
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
          ...(level ? { waterAvailability: level } : {}),
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
        if (!controller.signal.aborted) {
          const local = rows.filter((row) => String(row.district_id) === location.districtId)
          setFarms(local)
          setFarmId((current) =>
            local.some((farm) => String(farm.farm_id) === current)
              ? current
              : local.length === 1
                ? String(local[0].farm_id)
                : ''
          )
        }
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
    <div className="farmer-flow farmer-dashboard farmer-dashboard-enter space-y-6 pb-8 text-base-content">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="card local-guide-intro border border-base-300 bg-base-100">
          <div className="card-body justify-center p-6 sm:p-8">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Icon name="pin" />
              Your crop rotation guide
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              What will you grow next?
            </h1>
            <p className="mt-2 max-w-xl text-base-content/75">
              Choose a farm, generate rotations, then compare planting dates, water needs and
              trade-offs.
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
          <div className="card location-map-card overflow-hidden border border-base-300 bg-base-100">
            <LocationMap
              key={`${latitude}:${longitude}`}
              latitude={latitude}
              longitude={longitude}
              district={location.district ?? catalog.district.district_name}
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
                © OpenStreetMap contributors
              </a>
            </p>
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        className="modal farm-water-dialog"
        aria-labelledby="water-title"
        aria-describedby="water-description"
      >
        <div className="modal-box w-[calc(100%-2rem)] max-w-2xl rounded-2xl p-6 sm:p-8">
          <p className="agri-eyebrow text-info mb-3">A LITTLE KNOWLEDGE FROM YOUR FIELD</p>
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
                className={`card water-choice cursor-pointer border-2 p-4 transition-colors hover:border-info ${choice === item.level ? 'border-info bg-info/5' : 'border-base-300 bg-base-100'}`}
                data-selected={choice === item.level}
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
                <span className="water-choice-meter" aria-hidden="true">
                  {[0, 1, 2].map((index) => (
                    <i
                      key={index}
                      data-filled={index < { low: 1, medium: 2, high: 3 }[item.level]}
                    />
                  ))}
                </span>
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
        <div id="rotation-setup" className="card border-2 border-primary/30 bg-base-100">
          <div className="px-5 pt-5">
            <h2 className="text-xl font-semibold">Generate your crop rotations</h2>
            <p className="mt-2 text-sm text-base-content/70">
              Set your priorities to explore crops and growing months. Add soil, irrigation and
              previous crops only if you want more detailed farm checks.
            </p>
          </div>
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
                  {farmsLoading ? 'Loading your farms…' : 'Select a farm to generate rotations'}
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
              disabled={busy || !farmId}
              onClick={() => void analyze(choice)}
            >
              Generate crop rotations
              <Icon name="arrow" />
            </button>
          </div>
          {!farmsLoading && !farms.length && (
            <p className="px-5 pb-4 text-sm">
              No farm is saved in this district yet.{' '}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => {
                  if (farmDetails.current) {
                    farmDetails.current.open = true
                    farmDetails.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                Add my farm
              </button>
            </p>
          )}
          {!choice && (
            <p className="px-5 pb-4 text-sm text-base-content/70">
              Water availability is optional. You can add it later for the water outlook.
            </p>
          )}
          {farmsError && (
            <p className="px-5 pb-4 text-sm text-error" role="alert">
              {farmsError}
            </p>
          )}
        </div>
      )}
      {catalog.readiness.requirements > 0 &&
        catalog.readiness.calendars > 0 &&
        !catalog.readiness.economics && (
          <div className="alert alert-info alert-soft items-start" role="status">
            <Icon name="info" />
            <div>
              <h2 className="font-semibold">Season-based crop planning is available</h2>
              <p className="mt-1 text-sm">
                Compare crops, growing months and documented soil contributions. Local prices and
                costs are not available, so these plans do not compare profit. Confirm variety and
                planting dates with local agricultural advice.
              </p>
              <a className="link mt-2 inline-block text-sm" href="/sources">
                View crop references and limitations
              </a>
            </div>
          </div>
        )}
      {!busy && !analysis?.plans.length && (
        <RotationPlans key="demo-preview" plans={demoRotations} />
      )}
      {busy && (
        <div
          className="card outlook-processing border border-base-300 bg-base-100"
          role="status"
          aria-live="polite"
        >
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
        <div className="flex flex-col gap-6">
          <section
            className="card water-outlook order-2 border border-info/20 bg-base-100"
            aria-label="Water outlook"
          >
            <div className="card-body gap-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-info">
                    <Icon name="water" />
                    Water outlook
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {water.label === 'Not provided'
                      ? 'Add water details anytime'
                      : `${water.label} water availability`}
                  </h2>
                  <p className="mt-2 text-sm text-base-content/70">
                    {water.label === 'Not provided'
                      ? 'Optional · crop planning can continue without this'
                      : 'Your reported farm availability'}
                  </p>
                </div>
                <span className="badge badge-info badge-soft">{location.district}</span>
              </div>
              {water.label !== 'Not provided' && (
                <progress
                  className="progress progress-info h-3 w-full sm:max-w-md"
                  value={{ Low: 25, Moderate: 60, High: 90 }[water.label]}
                  max={100}
                  aria-label={`${water.label} water availability, farmer reported`}
                  aria-valuetext={`${water.label}, farmer reported`}
                />
              )}
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
                  <div key={item.label} className="outlook-metric rounded-xl bg-base-200 p-4">
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
            <div className="order-0 space-y-4">
              <p className="px-1 text-sm text-base-content/75">
                {analysis.planning.message} The water choice above does not change measured
                irrigation in your farm record.
              </p>
              <RotationPlans
                key={analysis.plans.map((plan) => plan.id).join(',')}
                plans={analysis.plans}
                farmId={signedIn ? farmId : ''}
              />
            </div>
          ) : (
            <div
              id="farm-plan-setup"
              className="card crop-plan-empty order-0 border-2 border-primary/25 bg-base-200 p-7 items-start"
            >
              <Icon name="leaf" />
              <div>
                <h2 className="font-semibold">
                  {analysis.planning.status === 'no-feasible-plans' ||
                  analysis.planning.status === 'no_feasible_rotation'
                    ? 'No suitable rotation found'
                    : 'Let’s prepare your crop plan'}
                </h2>
                <p className="mt-1 text-sm">{analysis.planning.message}</p>
                <ol className="mt-4 space-y-2 text-sm text-base-content/75">
                  <li>1. Save your farm with your priorities.</li>
                  <li>2. Add extra farm details only if you want more tailored checks.</li>
                  <li>3. Select your farm above and generate crop rotations.</li>
                </ol>
                {!signedIn && (
                  <a className="btn btn-primary btn-sm mt-3" href="/login">
                    Sign in to plan your farm
                  </a>
                )}
                {signedIn && (
                  <button
                    type="button"
                    className="btn btn-primary mt-4"
                    onClick={() => {
                      if (farmDetails.current) {
                        farmDetails.current.open = true
                        farmDetails.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                  >
                    Set farm priorities
                    <Icon name="arrow" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="order-3">
            <WaterChart water={water} />
          </div>
          <div className="order-4">
            <SeasonalRisks water={water} />
          </div>
        </div>
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
          ref={farmDetails}
          id="farm-details"
          className="collapse collapse-arrow border border-base-300 bg-base-100"
        >
          <summary className="collapse-title text-lg font-semibold">
            Set priorities · extra details are optional
          </summary>
          <div className="collapse-content">
            <p className="mb-4 text-sm text-base-content/70">
              Only priorities are required. Open “Add extra details” if you want to include
              irrigation, soil tests or previous crops. Then refresh your farms and generate
              rotations above.
            </p>
            <FarmWorkspace catalog={catalog} />
          </div>
        </details>
      )}
    </div>
  )
}
