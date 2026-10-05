import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Icon from './icon'

export type RotationPlan = {
  id: string
  demo?: boolean
  runId?: string
  rank?: number
  label: string
  waterDemand: 'low' | 'medium' | 'high' | 'unknown'
  fit: string
  soilHealth?: string
  soilNote?: string
  crops: Array<{
    id: number
    name: string
    plantingDate: string
    harvestDate: string
    waterNeed: 'low' | 'medium' | 'high' | 'unknown'
    condition: string
    reason: string
    nextCrop: string
    soilContribution?: string
    soilSourceId?: string
    soilNote?: string
  }>
  reasons: Array<{ kind: string; title: string; text: string }>
  tradeoffs: Array<{ kind: string; text: string }>
}
const waterLabels = { low: 'Low', medium: 'Medium', high: 'High', unknown: 'Not yet reviewed' }
const monthNumber = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
const monthLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

type SavedRotation = {
  runId: string
  rank: number
  selectedAt: string
  crops: Array<{ name: string; plantingDate: string; harvestDate: string }>
}

export default function RotationPlans({
  plans,
  farmId = '',
}: {
  plans: RotationPlan[]
  farmId?: string
}) {
  const [planIndex, setPlanIndex] = useState(0)
  const [cropIndex, setCropIndex] = useState(0)
  const [saved, setSaved] = useState<SavedRotation | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    if (!farmId) return
    const controller = new AbortController()
    api<SavedRotation | null>(
      `/api/v1/farms/${farmId}/rotation-choice`,
      'GET',
      undefined,
      controller.signal
    )
      .then((choice) => {
        if (!controller.signal.aborted) setSaved(choice)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSaveError(error.message)
      })
    return () => controller.abort()
  }, [farmId])
  const plan = plans[planIndex] ?? plans[0]
  if (!plan) return null
  const crop = plan.crops[cropIndex] ?? plan.crops[0]
  const isSaved = Boolean(saved && saved.runId === plan.runId && saved.rank === plan.rank)
  async function useRotation() {
    if (plan.demo || !farmId || !plan.runId) return
    setSaving(true)
    setSaveError('')
    try {
      setSaved(
        await api<SavedRotation>(`/api/v1/farms/${farmId}/rotation-choice`, 'PUT', {
          runId: plan.runId,
          rank: plan.rank,
        })
      )
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Your plan could not be saved. Try again.'
      )
    } finally {
      setSaving(false)
    }
  }
  function downloadPlan() {
    const text = [
      plan.demo
        ? 'DEMO ONLY — SAMPLE CROP ROTATION, NOT PLANTING ADVICE'
        : 'CROP ROTATION PLANNING GUIDE',
      plan.label,
      'A decision-support plan, not a yield guarantee or record of crops planted.',
      '',
      ...plan.crops.flatMap((item, i) => [
        `${i + 1}. ${item.name}`,
        `Plant: ${item.plantingDate.slice(0, 10)} | Harvest: ${item.harvestDate.slice(0, 10)}`,
        `Water need: ${waterLabels[item.waterNeed]} | Fit: ${item.condition}`,
        `Soil: ${item.soilContribution ?? 'Soil evidence unavailable'}`,
        `Why: ${item.reason}`,
        `Next: ${item.nextCrop}`,
        '',
      ]),
      'WHY THIS ROTATION',
      ...plan.reasons.map((reason) => `${reason.title}: ${reason.text}`),
      '',
      'TRADE-OFFS',
      ...plan.tradeoffs.filter((item) => item.kind !== 'reason').map((item) => item.text),
      '',
      'Before planting: confirm water access, local conditions and planting dates with local agricultural advice.',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = plan.demo ? 'sample-crop-rotation.txt' : 'crop-rotation-plan.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
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
    <section
      id="crop-plans"
      className="rotation-workspace space-y-6"
      aria-label="Crop rotation plans"
    >
      <div className="card border-2 border-primary/25 bg-base-100">
        <div className="card-body gap-4 p-5 sm:p-7">
          <p className="agri-eyebrow text-primary">
            {plan.demo ? 'EXPLORE CROP ROTATIONS' : 'YOUR CROP ROTATION RECOMMENDATIONS'}
          </p>
          {plan.demo && <span className="badge badge-ghost badge-sm">Sample plan</span>}
          <h2 className="text-2xl font-semibold">
            {plans.length} rotation {plans.length === 1 ? 'plan' : 'plans'} to explore
          </h2>
          <p className="text-sm text-base-content/75">
            {plan.demo
              ? 'Explore growing months, water needs and soil-health notes.'
              : 'Compared using your saved priorities. Review the calendar and trade-offs, then choose a rotation for your farm.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-primary min-h-12"
              disabled={plan.demo || !farmId || !plan.runId || saving || isSaved}
              onClick={() => void useRotation()}
            >
              <Icon name={isSaved ? 'check' : 'leaf'} />
              {plan.demo
                ? 'Sample only · cannot apply'
                : saving
                  ? 'Saving your rotation…'
                  : isSaved
                    ? 'Rotation saved to your farm'
                    : `Use this rotation · ${plan.label}`}
            </button>
            <a className="btn btn-outline min-h-12" href="#rotation-alternatives">
              Compare rotation plans
            </a>
            <button type="button" className="btn btn-ghost min-h-12" onClick={downloadPlan}>
              {plan.demo ? 'Download sample preview' : 'Download planting guide'}
              <Icon name="arrow" />
            </button>
          </div>
          {!farmId && !plan.demo && (
            <p className="text-xs text-base-content/65">
              Sign in and generate plans for a saved farm to save your choice.
            </p>
          )}
          {saveError && (
            <p role="alert" className="text-sm text-error">
              {saveError}
            </p>
          )}
          {saved && (
            <div
              className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
              role="status"
            >
              <p className="font-semibold">
                Your saved rotation: {saved.crops.map((item) => item.name).join(' → ')}
              </p>
              <p className="mt-2 text-base-content/75">
                Saved as your planning choice. This does not change your crop history or confirm
                planting. You can replace it by choosing another plan.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="card rotation-calendar border border-base-300 bg-base-100">
        <div className="card-body gap-6 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="agri-eyebrow text-primary">
                <Icon name="leaf" size={16} /> YOUR GROWING CALENDAR
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{plan.label} · Crop rotation</h2>
            </div>
            <span className="badge badge-success badge-outline">{plan.fit}</span>
          </div>
          <p className="text-sm text-base-content/75">
            {plan.demo
              ? 'Tap a crop to explore its growing period, water needs and soil contribution.'
              : 'Tap a crop to explore it. Planting and harvest months come from the farm’s scheduled plan, including time for land preparation.'}
          </p>
          <div className="rotation-sequence" aria-label="Crop sequence">
            {plan.crops.map((item, i) => (
              <button
                key={`${item.id}-${i}`}
                type="button"
                className="btn btn-ghost rotation-sequence-crop"
                data-tone={i % 3}
                aria-pressed={i === cropIndex}
                onClick={() => setCropIndex(i)}
              >
                <span className="rotation-crop-icon">
                  <Icon name="leaf" size={22} />
                </span>
                <span>
                  <small>SEASON {i + 1}</small>
                  <strong>{item.name}</strong>
                  <small>
                    {monthLabel(item.plantingDate)} → {monthLabel(item.harvestDate)}
                  </small>
                  <small>{item.soilContribution ?? 'Soil evidence unavailable'}</small>
                </span>
                {i < plan.crops.length - 1 && <Icon name="arrow" size={16} />}
              </button>
            ))}
          </div>
          <div
            className="rotation-month-grid overflow-x-auto rounded-xl border border-base-300 p-4"
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
                    className="btn rotation-season-bar h-auto min-h-14 justify-start whitespace-normal text-left"
                    data-tone={i % 3}
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
            <div className="rotation-crop-detail rounded-xl bg-base-200 p-5" aria-live="polite">
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
                  <p className="mt-2 text-xs text-base-content/70">
                    Plant: {crop.plantingDate.slice(0, 10)}
                    <br />
                    Harvest: {crop.harvestDate.slice(0, 10)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-base-content/65">Water need</p>
                  <p className="mt-1 font-medium">{waterLabels[crop.waterNeed]}</p>
                  {crop.waterNeed !== 'unknown' && (
                    <progress
                      className="progress progress-info mt-2 w-full max-w-32"
                      value={{ low: 30, medium: 60, high: 90 }[crop.waterNeed]}
                      max={100}
                      aria-label={`${crop.name} water need: ${waterLabels[crop.waterNeed]}`}
                      aria-valuetext={waterLabels[crop.waterNeed]}
                    />
                  )}
                </div>
                <div>
                  <p className="text-xs text-base-content/65">Next crop</p>
                  <p className="mt-1 font-medium">{crop.nextCrop}</p>
                </div>
              </div>
              <p className="crop-selection-reason mt-4 text-sm text-base-content/80">
                <Icon name="info" size={18} />
                {crop.reason}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">
                Soil contribution: {crop.soilContribution ?? 'Soil evidence unavailable'}
              </p>
              <p className="mt-1 text-xs text-base-content/70">
                {crop.soilNote ??
                  'Potential reference effect, not a guarantee of improved field soil.'}
                {crop.soilSourceId && (
                  <>
                    {' '}
                    <a className="link" href="/sources">
                      View agricultural sources
                    </a>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card crop-demand-card border border-base-300 bg-base-100">
          <div className="card-body p-6">
            <span className="agri-icon-box">
              <Icon name="water" size={24} />
            </span>
            <h2 className="text-xl font-semibold">Crop water demand</h2>
            <p className="text-sm text-base-content/65">
              Relative demand for this rotation, not an irrigation estimate.
            </p>
            <div className="mt-3 space-y-5">
              {plan.crops.map((item, i) => (
                <div key={i}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{waterLabels[item.waterNeed]}</span>
                  </div>
                  {item.waterNeed !== 'unknown' && (
                    <progress
                      className="progress progress-info w-full"
                      value={{ low: 30, medium: 60, high: 90 }[item.waterNeed]}
                      max={100}
                      aria-label={`${item.name}: ${waterLabels[item.waterNeed]} water demand`}
                      aria-valuetext={waterLabels[item.waterNeed]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card rotation-reasons-card border border-base-300 bg-base-100">
          <div className="card-body p-6">
            <h2 className="text-xl font-semibold">Why this rotation?</h2>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {plan.reasons.map((reason) => (
                <div key={reason.kind} className="rotation-reason rounded-xl bg-base-200 p-4">
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
      <div id="rotation-alternatives" className="rotation-alternatives scroll-mt-32">
        <p className="agri-eyebrow text-primary mb-2">YOUR FARM. MORE THAN ONE PATH.</p>
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
              className={`card rotation-plan-card border-2 p-5 text-left text-base-content transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${i === planIndex ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-100'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-3">
                  <span className="rotation-plan-number">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </span>
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
              <span className="mt-2 text-sm font-semibold text-primary">
                Soil: {item.soilHealth ?? 'Soil evidence unavailable'}
              </span>
              {item.soilNote && (
                <span className="mt-1 text-xs text-base-content/70">{item.soilNote}</span>
              )}
              <span className="my-4 space-y-3">
                {item.crops.map((listedCrop, position) => (
                  <span
                    key={`${listedCrop.id}-${position}`}
                    className="block border-l-2 border-primary/30 pl-3"
                  >
                    <strong className="block text-sm">{listedCrop.name}</strong>
                    <span className="block text-sm text-base-content/75">
                      {monthLabel(listedCrop.plantingDate)} → {monthLabel(listedCrop.harvestDate)}
                    </span>
                    <span className="block text-xs text-primary">
                      {listedCrop.soilContribution ?? 'Soil evidence unavailable'}
                    </span>
                  </span>
                ))}
              </span>
              <span className="mt-3 text-sm text-base-content/70">{item.fit}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
