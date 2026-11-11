import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Icon from '../components/icon'
import { useLocale } from '../lib/i18n'

type RawRecommendation = {
  recommendation_id: number
  rank: number
  overall_score: number | string
  climate_score: number | string
  water_score: number | string
  soil_score: number | string
  resilience_score: number | string
  economic_score: number | string
  total_water_requirement_mm: number | string | null
  total_profit_bdt: number | string | null
  items: Array<{
    crop_name: string
    farming_system_name?: string | null
    planting_date: string
    harvest_date: string
  }>
  explanations: Array<{ explanation_text?: string; message?: string; code?: string }>
}

type RecommendationRun = {
  run: { recommendation_run_id: number; farm_id: number }
  recommendations: RawRecommendation[]
}

const sampleRecommendationRun: RecommendationRun = {
  run: { recommendation_run_id: 0, farm_id: 0 },
  recommendations: [
    {
      recommendation_id: 9001,
      rank: 1,
      overall_score: 86,
      climate_score: 88,
      water_score: 79,
      soil_score: 92,
      resilience_score: 89,
      economic_score: 82,
      total_water_requirement_mm: 1240,
      total_profit_bdt: 286000,
      items: [
        {
          crop_name: 'Aman rice',
          planting_date: '2027-06-15',
          harvest_date: '2027-11-05',
        },
        { crop_name: 'Lentil', planting_date: '2027-11-20', harvest_date: '2028-03-05' },
        {
          crop_name: 'Mung bean',
          planting_date: '2028-03-20',
          harvest_date: '2028-06-05',
        },
      ],
      explanations: [],
    },
    {
      recommendation_id: 9002,
      rank: 2,
      overall_score: 81,
      climate_score: 83,
      water_score: 70,
      soil_score: 80,
      resilience_score: 84,
      economic_score: 91,
      total_water_requirement_mm: 1510,
      total_profit_bdt: 338000,
      items: [
        { crop_name: 'Maize', planting_date: '2027-11-10', harvest_date: '2028-03-18' },
        { crop_name: 'Potato', planting_date: '2028-11-18', harvest_date: '2029-02-25' },
        { crop_name: 'Sesame', planting_date: '2029-03-12', harvest_date: '2029-06-20' },
      ],
      explanations: [],
    },
    {
      recommendation_id: 9003,
      rank: 3,
      overall_score: 77,
      climate_score: 78,
      water_score: 88,
      soil_score: 76,
      resilience_score: 80,
      economic_score: 65,
      total_water_requirement_mm: 930,
      total_profit_bdt: 214000,
      items: [
        { crop_name: 'Jute', planting_date: '2027-03-18', harvest_date: '2027-07-22' },
        {
          crop_name: 'Transplanted Aman rice',
          planting_date: '2027-08-05',
          harvest_date: '2027-12-02',
        },
        { crop_name: 'Mustard', planting_date: '2027-12-15', harvest_date: '2028-03-12' },
      ],
      explanations: [],
    },
  ],
}

const score = (value: number | string) => Math.round(Number(value) || 0)
const planName = (plan: RawRecommendation) =>
  plan.items.map((item) => item.farming_system_name || item.crop_name).join(' → ')

const radarDimensions = [
  ['climate_score', 'climate'],
  ['water_score', 'water'],
  ['soil_score', 'soil'],
  ['resilience_score', 'resilience'],
  ['economic_score', 'economics'],
] as const

function RadarChart({ plans, selectedId }: { plans: RawRecommendation[]; selectedId: number }) {
  const { t } = useLocale()
  const center = 160
  const radius = 108
  const visiblePlans = plans.slice(0, 3).map((plan, planIndex) => ({ plan, planIndex }))
  const chartPlans = [...visiblePlans].sort(
    (first, second) =>
      Number(first.plan.recommendation_id === selectedId) -
      Number(second.plan.recommendation_id === selectedId)
  )
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / radarDimensions.length
    const distance = (radius * value) / 100
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance]
  }
  const polygon = (value: number) =>
    radarDimensions.map((_, index) => point(index, value).join(',')).join(' ')

  return (
    <figure className="oa-radar-card card card-border" aria-labelledby="score-profile-title">
      <div className="card-body">
        <div className="oa-chart-heading">
          <div>
            <p className="oa-kicker">
              <Icon name="grid" size={16} /> FIVE DECISION SIGNALS
            </p>
            <h2 id="score-profile-title" className="card-title">
              {t('scoreProfile')}
            </h2>
            <p>Each axis is an independent score from 0 to 100—not a time trend.</p>
          </div>
          <span className="badge badge-success badge-soft">{t('historicalNotForecast')}</span>
        </div>
        <div className="oa-radar-layout">
          <svg viewBox="0 0 320 320" role="img" aria-labelledby="radar-title radar-description">
            <title id="radar-title">{t('scoreProfile')}</title>
            <desc id="radar-description">
              Climate, water, soil, resilience and economics scores for each rotation plan.
            </desc>
            {[20, 40, 60, 80, 100].map((value) => (
              <g key={value}>
                <polygon className="oa-radar-ring" points={polygon(value)} />
                <text
                  className="oa-radar-scale"
                  x={center + 5}
                  y={center - (radius * value) / 100 + 4}
                >
                  {value}
                </text>
              </g>
            ))}
            {radarDimensions.map(([, label], index) => {
              const [x, y] = point(index, 100)
              const [labelX, labelY] = point(index, 122)
              return (
                <g key={label}>
                  <line className="oa-radar-axis" x1={center} y1={center} x2={x} y2={y} />
                  <text className="oa-radar-label" x={labelX} y={labelY} textAnchor="middle">
                    {t(label)}
                  </text>
                </g>
              )
            })}
            {chartPlans.map(({ plan, planIndex }) => {
              const values = radarDimensions.map(([key]) => score(plan[key]))
              const points = values.map((value, index) => point(index, value))
              return (
                <g
                  key={plan.recommendation_id}
                  className="oa-radar-series"
                  data-plan={planIndex}
                  data-selected={selectedId === plan.recommendation_id}
                >
                  <polygon points={points.map((item) => item.join(',')).join(' ')} />
                  {points.map(([x, y], index) =>
                    planIndex === 0 ? (
                      <circle key={index} cx={x} cy={y} r="5" />
                    ) : planIndex === 1 ? (
                      <rect key={index} x={x - 4.5} y={y - 4.5} width="9" height="9" />
                    ) : (
                      <path
                        key={index}
                        d={`M ${x} ${y - 6} L ${x + 6} ${y + 5} L ${x - 6} ${y + 5} Z`}
                      />
                    )
                  )}
                </g>
              )
            })}
          </svg>
          <div className="oa-radar-values" aria-label="Exact strategy scores">
            {visiblePlans.map(({ plan, planIndex }) => (
              <article
                key={plan.recommendation_id}
                data-plan={planIndex}
                data-selected={selectedId === plan.recommendation_id}
                aria-current={selectedId === plan.recommendation_id ? 'true' : undefined}
              >
                <div>
                  <span className="oa-plan-marker" aria-hidden="true" />
                  <strong>
                    #{plan.rank} {planName(plan)}
                  </strong>
                  {selectedId === plan.recommendation_id && (
                    <span className="oa-radar-selected-label">Selected</span>
                  )}
                </div>
                <dl>
                  {radarDimensions.map(([key, label]) => (
                    <div key={key}>
                      <dt>{t(label)}</dt>
                      <dd>{score(plan[key])}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}

const planColors = ['#1f7a55', '#2677a8', '#a76518'] as const

function ScoreShareDonut({ plans }: { plans: RawRecommendation[] }) {
  const displayedPlans = plans.slice(0, 3)
  const values = displayedPlans.map((plan) => Math.max(0, score(plan.overall_score)))
  const total = values.reduce((sum, value) => sum + value, 0)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  let runningOffset = 0

  const segments = displayedPlans.map((plan, index) => {
    const length = total > 0 ? (values[index] / total) * circumference : 0
    const segment = { plan, index, length, offset: runningOffset }
    runningOffset += length
    return segment
  })

  return (
    <figure className="card card-border oa-score-share-card">
      <div className="card-body">
        <div>
          <p className="oa-kicker">PLAN SCORE SHARE</p>
          <h2 className="card-title">Overall score mix</h2>
          <p className="oa-score-share-note">
            Each color shows one plan&apos;s share of the three scores. Use the exact values for
            decisions.
          </p>
        </div>
        <div className="oa-score-share-layout">
          <svg
            className="oa-score-donut"
            viewBox="0 0 200 200"
            role="img"
            aria-labelledby="score-share-title score-share-description"
          >
            <title id="score-share-title">Overall score comparison</title>
            <desc id="score-share-description">
              {displayedPlans
                .map((plan, index) => `Plan ${plan.rank} has an overall score of ${values[index]}`)
                .join('. ')}
            </desc>
            <circle className="oa-score-donut-track" cx="100" cy="100" r={radius} />
            {segments.map(({ plan, index, length, offset }) => (
              <circle
                className="oa-score-donut-segment"
                cx="100"
                cy="100"
                r={radius}
                key={plan.recommendation_id}
                style={{
                  stroke: planColors[index],
                  strokeDasharray: `${length} ${circumference - length}`,
                  strokeDashoffset: -offset,
                }}
              />
            ))}
            <text className="oa-score-donut-count" x="100" y="96" textAnchor="middle">
              {displayedPlans.length}
            </text>
            <text className="oa-score-donut-label" x="100" y="116" textAnchor="middle">
              PLANS
            </text>
          </svg>
          <div className="oa-score-share-legend" aria-label="Overall score values">
            {displayedPlans.map((plan, index) => (
              <article key={plan.recommendation_id} data-plan={index}>
                <span
                  className="oa-score-share-swatch"
                  style={{ backgroundColor: planColors[index] }}
                  aria-hidden="true"
                />
                <span>
                  <strong>Plan #{plan.rank}</strong>
                  <small>{planName(plan)}</small>
                </span>
                <b>{values[index]}</b>
              </article>
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}

function MetricBarComparisons({ plans }: { plans: RawRecommendation[] }) {
  const { t } = useLocale()
  const groups = [
    {
      key: 'water',
      title: t('waterRequirement'),
      unit: 'mm · complete displayed rotation',
      value: (plan: RawRecommendation) => plan.total_water_requirement_mm,
    },
    {
      key: 'margin',
      title: t('grossMargin'),
      unit: 'BDT · same farm area and rotation period',
      value: (plan: RawRecommendation) => plan.total_profit_bdt,
    },
  ] as const

  return (
    <section className="oa-metric-comparisons" aria-label="Plan scale comparisons">
      {groups.map((group) => {
        const values = plans.slice(0, 3).map((plan) => {
          const raw = group.value(plan)
          return raw === null || raw === undefined || !Number.isFinite(Number(raw))
            ? null
            : Math.max(0, Number(raw))
        })
        const maximum = Math.max(0, ...values.map((value) => value ?? 0))

        return (
          <figure className="card card-border" key={group.key}>
            <div className="card-body">
              <h2 className="card-title">{group.title}</h2>
              <p>{group.unit}</p>
              <svg
                className="oa-metric-bars"
                viewBox="0 0 680 236"
                role="img"
                aria-labelledby={`${group.key}-chart-title ${group.key}-chart-description`}
              >
                <title id={`${group.key}-chart-title`}>{group.title}</title>
                <desc id={`${group.key}-chart-description`}>
                  Horizontal bars comparing all three plans. Longer bars indicate larger values.
                </desc>
                {plans.slice(0, 3).map((plan, index) => {
                  const value = values[index]
                  const barWidth = value !== null && maximum > 0 ? (value / maximum) * 390 : 0
                  const y = 30 + index * 68
                  const formattedValue =
                    value === null
                      ? t('noData')
                      : group.key === 'margin'
                        ? `৳${value.toLocaleString()}`
                        : `${value.toLocaleString()} mm`

                  return (
                    <g key={plan.recommendation_id} data-plan={index}>
                      <text className="oa-metric-plan-label" x="8" y={y + 25}>
                        PLAN #{plan.rank}
                      </text>
                      <rect
                        className="oa-metric-bar-track"
                        x="104"
                        y={y}
                        width="390"
                        height="38"
                        rx="9"
                      />
                      <rect
                        className="oa-metric-bar-value"
                        x="104"
                        y={y}
                        width={barWidth}
                        height="38"
                        rx="9"
                        style={{ fill: planColors[index] }}
                      />
                      <text className="oa-metric-value-label" x="515" y={y + 25}>
                        {formattedValue}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </figure>
        )
      })}
    </section>
  )
}

const dateValue = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`)

function CalendarTimeline({ plans }: { plans: RawRecommendation[] }) {
  const { locale, t } = useLocale()
  const displayedPlans = plans.slice(0, 3)
  const timestamps = displayedPlans.flatMap((plan) =>
    plan.items.flatMap((item) => [dateValue(item.planting_date), dateValue(item.harvest_date)])
  )
  const validTimestamps = timestamps.filter(Number.isFinite)

  if (!validTimestamps.length) return null

  const firstDate = new Date(Math.min(...validTimestamps))
  const lastDate = new Date(Math.max(...validTimestamps))
  const rangeStart = Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1)
  const rangeEnd = Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() + 1, 1)
  const monthTicks: number[] = []

  for (let tick = rangeStart; tick <= rangeEnd;) {
    monthTicks.push(tick)
    const date = new Date(tick)
    tick = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
  }

  const width = 1200
  const left = 122
  const right = 24
  const top = 58
  const rowHeight = 78
  const height = top + displayedPlans.length * rowHeight + 28
  const timelineWidth = width - left - right
  const xForDate = (timestamp: number) =>
    left + ((timestamp - rangeStart) / (rangeEnd - rangeStart)) * timelineWidth
  const monthFormatter = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })

  return (
    <section className="card card-border oa-calendar-compare">
      <div className="card-body">
        <div className="oa-chart-heading">
          <div>
            <p className="oa-kicker">
              <Icon name="calendar" size={16} /> PLANTING WINDOWS
            </p>
            <h2 className="card-title">{t('cropCalendar')}</h2>
            <p>Actual planting and harvest dates on one shared calendar scale.</p>
          </div>
          <span className="oa-calendar-swipe-note">Scroll sideways for later months</span>
        </div>
        <div className="oa-calendar-timeline-scroll" tabIndex={0}>
          <svg
            className="oa-calendar-timeline-svg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-labelledby="calendar-timeline-title calendar-timeline-description"
          >
            <title id="calendar-timeline-title">Crop planting and harvest timeline</title>
            <desc id="calendar-timeline-description">
              {displayedPlans
                .flatMap((plan) =>
                  plan.items.map(
                    (item) =>
                      `Plan ${plan.rank}, ${item.farming_system_name || item.crop_name}, ${String(item.planting_date).slice(0, 10)} to ${String(item.harvest_date).slice(0, 10)}`
                  )
                )
                .join('. ')}
            </desc>

            {monthTicks.map((tick, index) => {
              const x = xForDate(tick)
              return (
                <g key={tick}>
                  <line
                    className="oa-calendar-month-line"
                    x1={x}
                    y1={top - 14}
                    x2={x}
                    y2={height - 18}
                  />
                  {index % 2 === 0 && (
                    <text className="oa-calendar-month-label" x={x + 5} y="24">
                      {monthFormatter.format(new Date(tick))}
                    </text>
                  )}
                </g>
              )
            })}

            {displayedPlans.map((plan, planIndex) => {
              const y = top + planIndex * rowHeight
              return (
                <g key={plan.recommendation_id} data-plan={planIndex}>
                  <rect
                    className="oa-calendar-row-bg"
                    x={left}
                    y={y}
                    width={timelineWidth}
                    height="52"
                    rx="10"
                  />
                  <text className="oa-calendar-plan-label" x="10" y={y + 31}>
                    PLAN #{plan.rank}
                  </text>
                  {plan.items.map((item) => {
                    const start = dateValue(item.planting_date)
                    const end = dateValue(item.harvest_date)
                    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
                    const x = xForDate(start)
                    const itemWidth = Math.max(4, xForDate(end) - x)
                    const label = item.farming_system_name || item.crop_name

                    return (
                      <g key={`${plan.recommendation_id}-${item.planting_date}`}>
                        <rect
                          className="oa-calendar-crop-block"
                          x={x}
                          y={y + 5}
                          width={itemWidth}
                          height="42"
                          rx="7"
                          style={{ fill: planColors[planIndex] }}
                        />
                        {itemWidth >= 72 && (
                          <text className="oa-calendar-crop-label" x={x + 8} y={y + 24}>
                            {label.length > 20 ? `${label.slice(0, 18)}…` : label}
                          </text>
                        )}
                        {itemWidth >= 118 && (
                          <text className="oa-calendar-date-label" x={x + 8} y={y + 39}>
                            {String(item.planting_date).slice(0, 10)} →{' '}
                            {String(item.harvest_date).slice(0, 10)}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="oa-calendar-details" aria-label="Exact crop dates">
          {displayedPlans.map((plan, planIndex) => (
            <article key={plan.recommendation_id} data-plan={planIndex}>
              <strong>Plan #{plan.rank}</strong>
              {plan.items.map((item) => (
                <span key={`${plan.recommendation_id}-${item.planting_date}`}>
                  <b>{item.farming_system_name || item.crop_name}</b>
                  <small>
                    {String(item.planting_date).slice(0, 10)} →{' '}
                    {String(item.harvest_date).slice(0, 10)}
                  </small>
                </span>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Compare() {
  const { t } = useLocale()
  const [data, setData] = useState<RecommendationRun | null>(sampleRecommendationRun)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState('')
  const [selectedId, setSelectedId] = useState(
    sampleRecommendationRun.recommendations[0].recommendation_id
  )
  const [usingSample, setUsingSample] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const farmId = params.get('farmId')
    const runId = params.get('runId')
    if (!farmId || !runId) return
    const key = `${farmId}:${runId}`
    setRequestKey(key)
    setUsingSample(false)
    setData(null)
    const controller = new AbortController()
    setLoading(true)
    api<RecommendationRun>(
      `/api/v1/farms/${farmId}/recommendations/${runId}`,
      'GET',
      undefined,
      controller.signal
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
          setSelectedId(result.recommendations[0]?.recommendation_id ?? 0)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'RECOMMENDATION_UNAVAILABLE')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="oa-app-page oa-compare-page">
      <Head title={t('compareTitle')} />
      <header className="oa-page-header">
        <div>
          <p className="oa-kicker">
            <Icon name="layers" size={18} /> {t('navCompare')}
          </p>
          <h1>{t('compareTitle')}</h1>
          <p>{t('compareBody')}</p>
        </div>
        {data && (
          <span className="badge badge-info badge-outline">
            {usingSample ? 'SAMPLE DATA' : `RUN #${data.run.recommendation_run_id}`}
          </span>
        )}
      </header>
      {usingSample && (
        <div className="alert alert-info alert-soft" role="alert">
          <Icon name="layers" />
          <span>Demo rotations and values for UI preview only—not farm or NASA observations.</span>
        </div>
      )}
      {loading && (
        <div className="oa-loading" role="status">
          <span className="loading loading-ring loading-lg" />
          {t('loading')}
        </div>
      )}
      {error && (
        <div className="alert alert-error alert-soft" role="alert">
          <Icon name="warning" />
          <span>{error}</span>
        </div>
      )}
      {!data && !requestKey && !loading && (
        <div className="oa-empty card card-border">
          <div className="card-body items-center text-center">
            <Icon name="layers" size={42} />
            <h2 className="card-title">{t('compareEmpty')}</h2>
            <p>{t('compareBody')}</p>
            <div className="card-actions">
              <Link className="btn btn-primary" href="/dashboard">
                {t('compareAction')} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </div>
      )}
      {data && (
        <>
          <section className="oa-score-overview" aria-label="Strategy score overview">
            <ScoreShareDonut plans={data.recommendations} />
            <div className="oa-plan-selector" aria-label="Choose a rotation to inspect">
              {data.recommendations.map((plan, index) => (
                <button
                  type="button"
                  className="card card-border"
                  data-plan={index}
                  aria-pressed={selectedId === plan.recommendation_id}
                  onClick={() => setSelectedId(plan.recommendation_id)}
                  key={plan.recommendation_id}
                >
                  <div className="card-body">
                    <div className="oa-card-top">
                      <span className="oa-plan-marker" aria-hidden="true" />
                      <span className="badge badge-neutral">PLAN #{plan.rank}</span>
                      {index === 0 && (
                        <span className="badge badge-success badge-soft">
                          {t('recommendedPlan')}
                        </span>
                      )}
                    </div>
                    <h2 className="card-title">{planName(plan)}</h2>
                    <span className="oa-selector-score">
                      <strong>{score(plan.overall_score)}</strong>
                      <small>{t('overallScore')}</small>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <div className="stats stats-vertical lg:stats-horizontal oa-compare-kpis">
            {(() => {
              const selected =
                data.recommendations.find((plan) => plan.recommendation_id === selectedId) ??
                data.recommendations[0]
              return selected ? (
                <>
                  <div className="stat">
                    <div className="stat-title">{t('overallScore')}</div>
                    <div className="stat-value">{score(selected.overall_score)}</div>
                    <div className="stat-desc">Plan #{selected.rank}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">{t('waterRequirement')}</div>
                    <div className="stat-value">
                      {selected.total_water_requirement_mm ?? t('noData')}
                    </div>
                    <div className="stat-desc">
                      {selected.total_water_requirement_mm === null ? '' : 'mm · full rotation'}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">{t('grossMargin')}</div>
                    <div className="stat-value">
                      {selected.total_profit_bdt === null
                        ? t('noData')
                        : `৳${Number(selected.total_profit_bdt).toLocaleString()}`}
                    </div>
                    <div className="stat-desc">Same farm area and rotation period</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">{t('cropCalendar')}</div>
                    <div className="stat-value">{selected.items.length}</div>
                    <div className="stat-desc">Planting windows</div>
                  </div>
                </>
              ) : null
            })()}
          </div>
          <RadarChart plans={data.recommendations} selectedId={selectedId} />
          <MetricBarComparisons plans={data.recommendations} />
          <section className="card card-border oa-comparison-table">
            <div className="card-body">
              <h2 className="card-title">Exact score matrix</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>{t('overallScore')}</th>
                      <th>{t('water')}</th>
                      <th>{t('soil')}</th>
                      <th>{t('climate')}</th>
                      <th>{t('resilience')}</th>
                      <th>{t('economics')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recommendations.map((plan) => (
                      <tr key={plan.recommendation_id}>
                        <th>#{plan.rank}</th>
                        {[
                          plan.overall_score,
                          plan.water_score,
                          plan.soil_score,
                          plan.climate_score,
                          plan.resilience_score,
                          plan.economic_score,
                        ].map((value, index) => (
                          <td key={index}>
                            <span className="oa-score-cell">{score(value)}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <CalendarTimeline plans={data.recommendations} />
        </>
      )}
    </div>
  )
}
