import { useState } from 'react'
import Icon from './icon'
import type { RotationPlan } from './rotation_plans'
import {
  cropEconomicMode,
  dashboardCrops,
  monthlyClimateAverages,
} from '../lib/dashboard_metrics'

type ClimateHistory = {
  startYear: number
  endYear: number
  months: Array<{
    month: number
    meanTemperatureC: number | null
    rainfallMm: number | null
  }>
  source: { name: string; grid: string }
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dateLabel = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

function MonthlyClimateChart({ climate }: { climate: ClimateHistory }) {
  const values = monthlyClimateAverages(climate.months)
  const rainMax = Math.max(1, ...values.map((point) => point.rainfallMm ?? 0))
  const temperatures = values
    .map((point) => point.temperatureC)
    .filter((value): value is number => value !== null)
  const tempMin = temperatures.length ? Math.floor(Math.min(...temperatures) - 1) : 0
  const tempMax = temperatures.length ? Math.ceil(Math.max(...temperatures) + 1) : 1
  const chartLeft = 58
  const chartTop = 22
  const chartWidth = 720
  const chartHeight = 190
  const slot = chartWidth / 12
  const temperaturePoints = values
    .map((point, index) => {
      if (point.temperatureC === null) return null
      const x = chartLeft + slot * index + slot / 2
      const y =
        chartTop + chartHeight - ((point.temperatureC - tempMin) / (tempMax - tempMin)) * chartHeight
      return `${x},${y}`
    })
    .filter((point): point is string => point !== null)
    .join(' ')

  return (
    <figure className="card local-month-chart" aria-labelledby="local-month-chart-title">
      <div className="card-body gap-4">
        <div className="local-dashboard-card-heading">
          <div>
            <p>NASA POWER · 10-YEAR MONTHLY AVERAGE</p>
            <h3 id="local-month-chart-title" className="card-title">
              Rainfall and temperature through the year
            </h3>
          </div>
          <div className="local-chart-legend" aria-label="Chart legend">
            <span><i data-series="rain" /> Rainfall · mm</span>
            <span><i data-series="temperature" /> Temperature · °C</span>
          </div>
        </div>
        <svg viewBox="0 0 840 250" role="img" aria-labelledby="climate-title climate-desc">
          <title id="climate-title">Average monthly rainfall and temperature</title>
          <desc id="climate-desc">
            Rainfall bars and a temperature line from January through December, averaged from
            {climate.startYear} to {climate.endYear}.
          </desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartTop + chartHeight - ratio * chartHeight
            return (
              <g key={ratio}>
                <line className="local-chart-grid" x1={chartLeft} y1={y} x2={chartLeft + chartWidth} y2={y} />
                <text className="local-chart-axis" x={chartLeft - 10} y={y + 4} textAnchor="end">
                  {Math.round(rainMax * ratio)}
                </text>
                <text className="local-chart-axis" x={chartLeft + chartWidth + 10} y={y + 4}>
                  {Math.round(tempMin + (tempMax - tempMin) * ratio)}°
                </text>
              </g>
            )
          })}
          {values.map((point, index) => {
            const height = point.rainfallMm === null ? 0 : (point.rainfallMm / rainMax) * chartHeight
            const x = chartLeft + slot * index
            return (
              <g key={point.month}>
                <rect
                  className="local-rain-bar"
                  x={x + slot * 0.23}
                  y={chartTop + chartHeight - height}
                  width={slot * 0.54}
                  height={height}
                  rx="5"
                />
                <text className="local-chart-month" x={x + slot / 2} y={238} textAnchor="middle">
                  {monthNames[index]}
                </text>
              </g>
            )
          })}
          {temperaturePoints && <polyline className="local-temperature-line" points={temperaturePoints} />}
          {values.map((point, index) => {
            if (point.temperatureC === null) return null
            const x = chartLeft + slot * index + slot / 2
            const y =
              chartTop + chartHeight - ((point.temperatureC - tempMin) / (tempMax - tempMin)) * chartHeight
            return <circle className="local-temperature-point" key={point.month} cx={x} cy={y} r="4" />
          })}
        </svg>
      </div>
    </figure>
  )
}

function CropBars({
  title,
  description,
  crops,
  value,
  format,
}: {
  title: string
  description: string
  crops: ReturnType<typeof dashboardCrops>
  value: (crop: ReturnType<typeof dashboardCrops>[number]) => number | null
  format: (value: number | null) => string
}) {
  const maximum = Math.max(1, ...crops.map((crop) => value(crop) ?? 0))
  return (
    <section className="card local-crop-chart" aria-label={title}>
      <div className="card-body gap-5">
        <div className="local-dashboard-card-heading">
          <div>
            <h3 className="card-title">{title}</h3>
            <p>{description}</p>
          </div>
        </div>
        <div className="local-crop-bars">
          {crops.map((crop) => {
            const amount = value(crop)
            const height = amount === null ? 4 : Math.max(8, (amount / maximum) * 100)
            return (
              <div className="local-crop-bar-item" key={crop.name}>
                <strong>{format(amount)}</strong>
                <span className="local-crop-bar-track" aria-hidden="true">
                  <i style={{ height: `${height}%` }} data-missing={amount === null} />
                </span>
                <span>{crop.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function LocalDecisionDashboard({
  plans,
  climate,
  climateLoading,
  climateError,
  district,
  waterLabel,
  onRetryClimate,
  onEditField,
}: {
  plans: RotationPlan[]
  climate: ClimateHistory | null
  climateLoading: boolean
  climateError: string
  district: string
  waterLabel: string
  onRetryClimate: () => void
  onEditField: () => void
}) {
  const crops = dashboardCrops(plans)
  const economicMode = cropEconomicMode(crops)
  const variations = [...plans]
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 4)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const selectedPlan = variations.find((plan) => plan.id === selectedPlanId) ?? variations[0]
  return (
    <section className="local-decision-dashboard" aria-labelledby="local-dashboard-title">
      <header className="local-dashboard-header">
        <div>
          <p>LOCAL DECISION PANEL · {district}</p>
          <h2 id="local-dashboard-title">Your recommended crop rotation</h2>
        </div>
        <button className="btn btn-sm" type="button" onClick={onEditField}>
          <Icon name="water" size={16} /> Edit field details
        </button>
      </header>

      <div className="local-dashboard-top-grid">
        {climate && !climateLoading ? (
          <MonthlyClimateChart climate={climate} />
        ) : (
          <div className="card local-month-chart">
            <div className="card-body items-center justify-center text-center">
              {climateLoading ? (
                <><span className="loading loading-ring loading-lg" /><p>Reading NASA POWER history…</p></>
              ) : (
                <>
                  <Icon name="warning" />
                  <p>
                    NASA climate history is temporarily unavailable
                    {climateError ? ` (${climateError})` : ''}.
                  </p>
                  <button className="btn btn-sm" onClick={onRetryClimate}>
                    Try again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        <aside className="card local-plan-summary">
          <div className="card-body">
            <p>RECOMMENDED FIRST · {variations.length} VARIATIONS</p>
            {variations.length > 1 && (
              <div className="tabs tabs-box tabs-sm local-plan-tabs" role="tablist" aria-label="Rotation variations">
                {variations.map((plan) => (
                  <button
                    className={`tab ${plan === selectedPlan ? 'tab-active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={plan === selectedPlan}
                    onClick={() => setSelectedPlanId(plan.id)}
                    key={plan.id}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>
            )}
            {selectedPlan ? (
              <ul
                className="steps steps-vertical local-rotation-graph"
                aria-label={`${selectedPlan.label} crop sequence`}
              >
                {selectedPlan.crops.map((crop, index) => (
                  <li className="step step-success" data-content={index + 1} key={crop.name}>
                    <span>
                      <strong>{crop.name}</strong>
                      <small>
                        {dateLabel(crop.plantingDate)}–{dateLabel(crop.harvestDate)}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <strong>Add farm details</strong>
            )}
            <div className="local-plan-signal-grid">
              <article>
                <span><Icon name="water" size={16} /> Water outlook</span>
                <strong>{waterLabel}</strong>
                <div className="local-signal-meter" data-level={waterLabel.toLowerCase()} aria-hidden="true">
                  <i /><i /><i />
                </div>
              </article>
              <article>
                <span><Icon name="leaf" size={16} /> Soil signal</span>
                <strong>{selectedPlan?.soilHealth ?? 'Unavailable'}</strong>
              </article>
              <article>
                <span><Icon name="satellite" size={16} /> NASA period</span>
                <strong>{climate ? `${climate.startYear}–${climate.endYear}` : 'Unavailable'}</strong>
                <div className="local-period-line" aria-hidden="true"><i /></div>
              </article>
              <article>
                <span><Icon name="grid" size={16} /> Source grid</span>
                <strong>{climate?.source.grid ?? 'Unavailable'}</strong>
              </article>
            </div>
          </div>
        </aside>
      </div>

      {crops.length ? <div className="local-dashboard-crop-grid">
        <CropBars
          title={economicMode === 'profit' ? 'Verified profit by crop' : 'Yield proxy by crop'}
          description={economicMode === 'profit' ? 'Current reviewed economics · BDT per hectare' : 'Profit is unavailable; showing reported or expected yield instead · tonnes per hectare'}
          crops={crops}
          value={(crop) => economicMode === 'profit' ? crop.profitPerHa : crop.yieldTonnesPerHa}
          format={(value) => value === null ? 'No data' : economicMode === 'profit' ? `৳${Math.round(value).toLocaleString()}` : `${value.toFixed(1)} t/ha`}
        />
        <CropBars
          title="Soil support by crop"
          description="Potential soil fit or documented reference effect · score out of 100"
          crops={crops}
          value={(crop) => crop.soilScore}
          format={(value) => value === null ? 'No data' : `${Math.round(value)}/100`}
        />
      </div> : (
        <div className="alert local-dashboard-empty" role="status">
          <Icon name="leaf" />
          <span>No ranked crops are available yet. Save a farm and generate rotations to compare crops.</span>
        </div>
      )}

      <section className="card local-crop-table-card">
        <div className="card-body gap-4">
          <div className="local-dashboard-card-heading">
            <div><h3 className="card-title">Recommended crops</h3><p>Plan A crops appear first, followed by unique alternatives from the other ranked plans.</p></div>
            <span className="badge badge-success badge-soft">{crops.length} crops</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr><th>Crop</th><th>Plan</th><th>Growing window</th><th>Water</th><th>{economicMode === 'profit' ? 'Profit/ha' : 'Yield proxy'}</th><th>Soil</th></tr></thead>
              <tbody>
                {crops.map((crop, index) => (
                  <tr key={crop.name}>
                    <th><span className="local-crop-key" data-crop={index} />{crop.name}</th>
                    <td>{crop.planLabel}</td><td>{dateLabel(crop.plantingDate)}–{dateLabel(crop.harvestDate)}</td><td>{crop.waterNeed}</td>
                    <td>{economicMode === 'profit' ? (crop.profitPerHa === null ? 'Unavailable' : `৳${Math.round(crop.profitPerHa).toLocaleString()}`) : (crop.yieldTonnesPerHa === null ? 'Unavailable' : `${crop.yieldTonnesPerHa.toFixed(1)} t/ha`)}</td>
                    <td>{crop.soilScore === null ? 'Unavailable' : `${Math.round(crop.soilScore)}/100`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  )
}
