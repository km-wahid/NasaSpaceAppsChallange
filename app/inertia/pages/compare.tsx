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
              <polygon key={value} className="oa-radar-ring" points={polygon(value)} />
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
            {plans.slice(0, 3).map((plan, planIndex) => {
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
            {plans.slice(0, 3).map((plan, planIndex) => (
              <article key={plan.recommendation_id} data-plan={planIndex}>
                <div>
                  <span className="oa-plan-marker" aria-hidden="true" />
                  <strong>
                    #{plan.rank} {planName(plan)}
                  </strong>
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

function ProportionalCircles({ plans }: { plans: RawRecommendation[] }) {
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
    <section className="oa-circle-comparisons" aria-label="Plan scale comparisons">
      {groups.map((group) => {
        const values = plans.slice(0, 3).map((plan) => {
          const raw = group.value(plan)
          return raw === null || raw === undefined || !Number.isFinite(Number(raw))
            ? null
            : Math.max(0, Number(raw))
        })
        const maximum = Math.max(0, ...values.map((value) => value ?? 0))
        return (
          <article className="card card-border" key={group.key}>
            <div className="card-body">
              <h2 className="card-title">{group.title}</h2>
              <p>{group.unit}</p>
              <div className="oa-circle-stage">
                {plans.slice(0, 3).map((plan, index) => {
                  const value = values[index]
                  const diameter =
                    value !== null && maximum > 0
                      ? Math.max(46, 126 * Math.sqrt(value / maximum))
                      : 46
                  return (
                    <div key={plan.recommendation_id} className="oa-circle-item" data-plan={index}>
                      <span
                        className="oa-proportional-circle"
                        data-missing={value === null}
                        style={{ width: diameter, height: diameter }}
                        aria-hidden="true"
                      />
                      <strong>#{plan.rank}</strong>
                      <span>
                        {value === null
                          ? t('noData')
                          : group.key === 'margin'
                            ? `৳${value.toLocaleString()}`
                            : `${value.toLocaleString()} mm`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default function Compare() {
  const { t } = useLocale()
  const [data, setData] = useState<RecommendationRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState('')
  const [selectedId, setSelectedId] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const farmId = params.get('farmId')
    const runId = params.get('runId')
    if (!farmId || !runId) return
    const key = `${farmId}:${runId}`
    setRequestKey(key)
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
            RUN #{data.run.recommendation_run_id}
          </span>
        )}
      </header>
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
      {!requestKey && !loading && (
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
          <section className="oa-plan-selector" aria-label="Choose a rotation to inspect">
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
                      <span className="badge badge-success badge-soft">{t('recommendedPlan')}</span>
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
          <ProportionalCircles plans={data.recommendations} />
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
          <section className="card card-border oa-calendar-compare">
            <div className="card-body">
              <div className="oa-chart-heading">
                <div>
                  <p className="oa-kicker">
                    <Icon name="calendar" size={16} /> PLANTING WINDOWS
                  </p>
                  <h2 className="card-title">{t('cropCalendar')}</h2>
                  <p>Compare the complete displayed rotation period using actual saved dates.</p>
                </div>
              </div>
              {data.recommendations.map((plan, planIndex) => (
                <div className="oa-calendar-row" data-plan={planIndex} key={plan.recommendation_id}>
                  <strong>
                    <span className="oa-plan-marker" aria-hidden="true" /> #{plan.rank}
                  </strong>
                  <div>
                    {plan.items.map((item) => (
                      <span key={`${plan.recommendation_id}-${item.planting_date}`}>
                        <b>{item.farming_system_name || item.crop_name}</b>
                        <small>
                          {String(item.planting_date).slice(0, 10)} →{' '}
                          {String(item.harvest_date).slice(0, 10)}
                        </small>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
