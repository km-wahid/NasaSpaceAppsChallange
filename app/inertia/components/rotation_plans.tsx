import { useState } from 'react'
import Icon from './icon'

export type RotationPlan = {
  id: string
  label: string
  waterDemand: 'low' | 'medium' | 'high'
  fit: string
  crops: Array<{
    id: number
    name: string
    plantingDate: string
    harvestDate: string
    waterNeed: 'low' | 'medium' | 'high'
    condition: string
    reason: string
    nextCrop: string
  }>
  reasons: Array<{ kind: string; title: string; text: string }>
  tradeoffs: Array<{ kind: string; text: string }>
}
const waterLabels = { low: 'Low', medium: 'Medium', high: 'High' }
const monthNumber = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export default function RotationPlans({ plans }: { plans: RotationPlan[] }) {
  const [planIndex, setPlanIndex] = useState(0)
  const [cropIndex, setCropIndex] = useState(0)
  const plan = plans[planIndex] ?? plans[0]
  if (!plan) return null
  const crop = plan.crops[cropIndex] ?? plan.crops[0]
  const first = Math.min(...plan.crops.map((item) => monthNumber(item.plantingDate)))
  const last = Math.max(...plan.crops.map((item) => monthNumber(item.harvestDate)))
  const months = Array.from({ length: last - first + 1 }, (_, offset) => {
    const date = new Date(Date.UTC(Math.floor((first + offset) / 12), (first + offset) % 12, 1))
    return {
      label: date.toLocaleDateString('en', { month: 'short', timeZone: 'UTC' }),
      year: date.getUTCFullYear(),
    }
  })
  return (
    <section id="crop-plans" className="space-y-6" aria-label="Crop rotation plans">
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-6 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Your growing calendar</p>
              <h2 className="mt-1 text-2xl font-semibold">{plan.label} · Crop rotation</h2>
            </div>
            <span className="badge badge-success badge-outline">{plan.fit}</span>
          </div>
          <p className="text-sm text-base-content/75">
            Tap a crop to explore it. Planting and harvest months come from the farm’s scheduled
            plan, including time for land preparation.
          </p>
          <div
            className="overflow-x-auto rounded-xl border border-base-300 p-4"
            tabIndex={0}
            aria-label="Growing calendar, scroll horizontally on small screens"
          >
            <div className="min-w-[680px] space-y-3">
              <div
                className="grid gap-1 text-center text-xs font-medium text-base-content/70"
                style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
              >
                {months.map((month, i) => (
                  <span key={i}>
                    {month.label}
                    <span className="block text-[10px]">
                      {i === 0 || month.label === 'Jan' ? month.year : '\u00a0'}
                    </span>
                  </span>
                ))}
              </div>
              {plan.crops.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
                >
                  <button
                    type="button"
                    className={`btn h-auto min-h-14 justify-start whitespace-normal text-left ${i === cropIndex ? 'btn-primary' : 'btn-soft btn-primary'}`}
                    style={{
                      gridColumn: `${monthNumber(item.plantingDate) - first + 1} / ${monthNumber(item.harvestDate) - first + 2}`,
                    }}
                    onClick={() => setCropIndex(i)}
                    aria-pressed={i === cropIndex}
                    aria-label={`${item.name}, ${monthLabel(item.plantingDate)} to ${monthLabel(item.harvestDate)}`}
                  >
                    <Icon name="leaf" />
                    <span>
                      {item.name}
                      <span className="block text-xs font-normal">
                        {monthLabel(item.plantingDate)} → {monthLabel(item.harvestDate)}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
          {crop && (
            <div className="rounded-xl bg-base-200 p-5" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <Icon name="leaf" />
                  {crop.name}
                </h3>
                <span className="badge badge-outline">{crop.condition}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-base-content/65">Growing period</p>
                  <p className="mt-1 font-medium">
                    {monthLabel(crop.plantingDate)} → {monthLabel(crop.harvestDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/65">Water need</p>
                  <p className="mt-1 font-medium">{waterLabels[crop.waterNeed]}</p>
                  <progress
                    className="progress progress-info mt-2 w-full max-w-32"
                    value={{ low: 30, medium: 60, high: 90 }[crop.waterNeed]}
                    max={100}
                    aria-label={`${crop.name} water need: ${waterLabels[crop.waterNeed]}`}
                    aria-valuetext={waterLabels[crop.waterNeed]}
                  />
                </div>
                <div>
                  <p className="text-xs text-base-content/65">Next crop</p>
                  <p className="mt-1 font-medium">{crop.nextCrop}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-base-content/80">{crop.reason}</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body p-6">
            <h2 className="text-xl font-semibold">Crop water demand</h2>
            <p className="text-sm text-base-content/65">
              Relative demand across the returned plans, not an irrigation estimate.
            </p>
            <div className="mt-3 space-y-5">
              {plan.crops.map((item, i) => (
                <div key={i}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{waterLabels[item.waterNeed]}</span>
                  </div>
                  <progress
                    className="progress progress-info w-full"
                    value={{ low: 30, medium: 60, high: 90 }[item.waterNeed]}
                    max={100}
                      aria-label={`${item.name}: ${waterLabels[item.waterNeed]} water demand`}
                      aria-valuetext={waterLabels[item.waterNeed]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body p-6">
            <h2 className="text-xl font-semibold">Why this rotation?</h2>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {plan.reasons.map((reason) => (
                <div key={reason.kind} className="rounded-xl bg-base-200 p-4">
                  <span className="text-primary">
                    <Icon
                      name={
                        reason.kind === 'water'
                          ? 'water'
                          : reason.kind === 'climate'
                            ? 'sun'
                            : 'leaf'
                      }
                    />
                  </span>
                  <h3 className="mt-2 font-semibold">{reason.title}</h3>
                  <p className="mt-1 text-sm text-base-content/75">{reason.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {plan.tradeoffs.filter((item) => item.kind !== 'reason').length > 0 && (
        <div className="alert alert-warning alert-soft items-start">
          <Icon name="info" />
          <div>
            <h3 className="font-semibold">Keep in mind</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              {plan.tradeoffs
                .filter((item) => item.kind !== 'reason')
                .map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
            </ul>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold">Explore other rotation plans</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Compare trade-offs under your saved priorities. No plan is universally best.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={i === planIndex}
              onClick={() => {
                setPlanIndex(i)
                setCropIndex(0)
              }}
              className={`card border-2 p-5 text-left text-base-content transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${i === planIndex ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-100'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{item.label}</span>
                {i === planIndex && (
                  <span className="text-primary">
                    <Icon name="check" />
                  </span>
                )}
              </div>
              <p className="my-4 text-lg font-medium">
                {item.crops.map((itemCrop) => itemCrop.name).join(' → ')}
              </p>
              <span className="badge badge-info badge-outline">
                {waterLabels[item.waterDemand]} water demand
              </span>
              <span className="mt-3 text-sm text-base-content/70">{item.fit}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
