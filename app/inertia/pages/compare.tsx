import { Head } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { useEffect, useState, type CSSProperties } from 'react'
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

export default function Compare() {
  const { t } = useLocale()
  const [data, setData] = useState<RecommendationRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState('')

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
        if (!controller.signal.aborted) setData(result)
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
          <section className="oa-strategy-cards">
            {data.recommendations.map((plan, index) => (
              <article
                className={`card card-border ${index === 0 ? 'oa-recommended-strategy' : ''}`}
                key={plan.recommendation_id}
              >
                <div className="card-body">
                  <div className="oa-card-top">
                    <span className="badge badge-neutral">#{plan.rank}</span>
                    {index === 0 && (
                      <span className="badge badge-success badge-soft">RECOMMENDED</span>
                    )}
                  </div>
                  <h2 className="card-title">
                    {plan.items
                      .map((item) => item.farming_system_name || item.crop_name)
                      .join(' → ')}
                  </h2>
                  <div
                    className="radial-progress text-primary"
                    style={
                      { '--value': score(plan.overall_score), '--size': '5rem' } as CSSProperties
                    }
                    role="progressbar"
                    aria-valuenow={score(plan.overall_score)}
                  >
                    {score(plan.overall_score)}
                  </div>
                  <div className="oa-strategy-facts">
                    <span>
                      <small>Water</small>
                      <strong>{plan.total_water_requirement_mm ?? '—'} mm</strong>
                    </span>
                    <span>
                      <small>Profit</small>
                      <strong>
                        {plan.total_profit_bdt
                          ? `৳${Number(plan.total_profit_bdt).toLocaleString()}`
                          : '—'}
                      </strong>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <section className="card card-border oa-comparison-table">
            <div className="card-body">
              <h2 className="card-title">Score matrix</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Overall</th>
                      <th>Water</th>
                      <th>Soil</th>
                      <th>Climate</th>
                      <th>Resilience</th>
                      <th>Economics</th>
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
              <h2 className="card-title">365-day crop calendar</h2>
              {data.recommendations.map((plan) => (
                <div className="oa-calendar-row" key={plan.recommendation_id}>
                  <strong>#{plan.rank}</strong>
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
