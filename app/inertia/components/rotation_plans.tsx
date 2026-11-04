import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Icon from './icon'

export type RotationPlan = {
  id: string
  demo?: boolean
  preview?: boolean
  runId?: string
  rank?: number
  label: string
  waterDemand: 'low' | 'medium' | 'high' | 'unknown'
  fit: string
  soilHealth?: string
  soilNote?: string
  combinedGrossMarginBdt?: number | null
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
    system?: {
      id: number
      type: string
      timingPattern: string
      spatialPattern: string
      evidenceStatus: 'eligible'
      managementNote: string
      components: Array<{
        type: string
        name: string
        role: string
        startDate: string
        endDate: string
        outputPerHa: number
        outputUnit: string
        grossMarginPerHa: number
      }>
    }
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
const dayLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en', {
    day: 'numeric',
    month: 'short',
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
        : plan.preview
          ? 'DISTRICT CROP ROTATION PREVIEW — FARM CONDITIONS NOT YET CHECKED'
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
        ...(item.system
          ? [
              `Integrated system: ${item.system.type.replaceAll('_', ' ')} (${item.system.spatialPattern.replaceAll('_', ' ')}, ${item.system.timingPattern.replaceAll('_', ' ')})`,
              ...item.system.components.map(
                (component) =>
                  `${component.name}: ${component.startDate} to ${component.endDate}; ${component.outputPerHa} ${component.outputUnit}/ha; BDT ${component.grossMarginPerHa}/ha gross margin`
              ),
              `Management: ${item.system.managementNote}`,
            ]
          : []),
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
    link.download = plan.demo
      ? 'sample-crop-rotation.txt'
      : plan.preview
        ? 'district-crop-preview.txt'
        : 'crop-rotation-plan.txt'
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
            {plan.demo
              ? 'EXPLORE CROP ROTATIONS'
              : plan.preview
                ? 'YOUR DISTRICT CROP PREVIEWS'
                : 'YOUR CROP ROTATION RECOMMENDATIONS'}
          </p>
          {plan.demo && <span className="badge badge-ghost badge-sm">Sample plan</span>}
          {plan.preview && (
            <span className="badge badge-info badge-outline">Local data preview</span>
          )}
          <h2 className="text-2xl font-semibold">
            {plans.length} rotation {plans.length === 1 ? 'plan' : 'plans'} to explore
          </h2>
          <p className="text-sm text-base-content/75">
            {plan.demo
              ? 'Explore growing months, water needs and soil-health notes.'
              : plan.preview
                ? 'Ranked with the selected district’s crop records and reviewed seasonal calendars. Add a farm for field-level checks.'
                : 'Compared using your saved priorities. Review the calendar and trade-offs, then choose a rotation for your farm.'}
          </p>
          <div className="plan-snapshot" aria-label="Rotation at a glance">
            <div>
              <span className="text-info">
                <Icon name="water" size={23} />
              </span>
              <small>Water</small>
              <strong>{waterLabels[plan.waterDemand]}</strong>
            </div>
            <div>
              <span className="text-primary">
                <Icon name="soil" size={23} />
              </span>
              <small>Soil</small>
              <strong>{plan.soilHealth ?? 'Review needed'}</strong>
            </div>
            <div>
              <span className="text-warning">
                <Icon name="calendar" size={23} />
              </span>
              <small>Seasons</small>
              <strong>{plan.crops.length} crops</strong>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {plan.demo ? (
              <a className="btn btn-primary min-h-12" href="/planner">
                Plan for my district <Icon name="arrow" />
              </a>
            ) : plan.preview ? (
              <a className="btn btn-primary min-h-12" href="/farms">
                Personalize with my farm <Icon name="arrow" />
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-primary min-h-12"
                disabled={!farmId || !plan.runId || saving || isSaved}
                onClick={() => void useRotation()}
              >
                <Icon name={isSaved ? 'check' : 'leaf'} />
                {saving
                  ? 'Saving your rotation…'
                  : isSaved
                    ? 'Rotation saved to your farm'
                    : `Use this rotation · ${plan.label}`}
              </button>
            )}
          </div>
          <details className="collapse collapse-arrow plan-actions border border-base-300 bg-base-200">
            <summary className="collapse-title font-semibold">More plan actions</summary>
            <div className="collapse-content flex flex-wrap gap-3">
              <a
                className="btn btn-outline min-h-12"
                href={
                  farmId && plan.runId
                    ? `/compare?farmId=${farmId}&runId=${plan.runId}`
                    : '#rotation-alternatives'
                }
              >
                Compare rotations
              </a>
              <button type="button" className="btn btn-ghost min-h-12" onClick={downloadPlan}>
                Download guide <Icon name="arrow" />
              </button>
            </div>
          </details>
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
          <div className="rotation-calendar-heading">
            <div>
              <p className="agri-eyebrow text-primary">
                <Icon name="calendar" size={16} /> YOUR GROWING CALENDAR
              </p>
              <h2
                className="mt-1 text-2xl font-semibold"
                aria-label={`${plan.label} · Crop rotation`}
              >
                {plan.label}
              </h2>
            </div>
            <span className="badge badge-success badge-outline">
              {plan.demo ? 'Seasonal preview' : plan.fit}
            </span>
          </div>
          <p className="text-sm text-base-content/75">
            {plan.demo
              ? 'Choose a crop to see its season, water need and place in the rotation.'
              : 'Choose a crop to see its scheduled season, water need and place in the rotation.'}
          </p>
          {plan.crops.length > 1 && (
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
                    <Icon name="sprout" size={22} />
                  </span>
                  <span>
                    <small>SEASON {i + 1}</small>
                    <strong>{item.name}</strong>
                    <small>
                      {monthLabel(item.plantingDate)} → {monthLabel(item.harvestDate)}
                    </small>
                  </span>
                  {i < plan.crops.length - 1 && <Icon name="arrow" size={16} />}
                </button>
              ))}
            </div>
          )}
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
              <div className="crop-detail-heading">
                <span className="rotation-crop-icon">
                  <Icon name="sprout" size={24} />
                </span>
                <div>
                  <p>Selected crop</p>
                  <h3>{crop.name}</h3>
                </div>
                <span className="badge badge-outline">{crop.condition}</span>
              </div>
              <div className="crop-fact-grid">
                <div className="crop-fact">
                  <span>
                    <Icon name="calendar" />
                  </span>
                  <div>
                    <p>Growing season</p>
                    <strong>
                      {monthLabel(crop.plantingDate)} → {monthLabel(crop.harvestDate)}
                    </strong>
                  </div>
                </div>
                <div className="crop-fact">
                  <span>
                    <Icon name="water" />
                  </span>
                  <div>
                    <p>Water need</p>
                    <strong>{waterLabels[crop.waterNeed]}</strong>
                    {crop.waterNeed !== 'unknown' && (
                      <progress
                        className="progress progress-info mt-2 w-full"
                        value={{ low: 30, medium: 60, high: 90 }[crop.waterNeed]}
                        max={100}
                        aria-label={`${crop.name} water need: ${waterLabels[crop.waterNeed]}`}
                        aria-valuetext={waterLabels[crop.waterNeed]}
                      />
                    )}
                  </div>
                </div>
                <div className="crop-fact">
                  <span>
                    <Icon name="arrow" />
                  </span>
                  <div>
                    <p>Next crop</p>
                    <strong>{crop.nextCrop}</strong>
                  </div>
                </div>
              </div>
              <p className="crop-selection-reason mt-4 text-sm text-base-content/80">
                <Icon name="info" size={18} />
                {crop.reason}
              </p>
              {crop.system && (
                <div className="card card-border mt-4 bg-base-100">
                  <div className="card-body gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="card-title text-base">Integrated farming system</h4>
                      <span className="badge badge-success badge-outline">Source-backed</span>
                    </div>
                    <p className="text-sm text-base-content/75">
                      {crop.system.spatialPattern.replaceAll('_', ' ')} ·{' '}
                      {crop.system.timingPattern.replaceAll('_', ' ')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {crop.system.components.map((component) => (
                        <div
                          key={`${component.type}-${component.name}`}
                          className="rounded-box border border-base-300 p-3"
                        >
                          <p className="font-semibold">{component.name}</p>
                          <p className="text-xs text-base-content/65">
                            {component.role} · {component.startDate} to {component.endDate}
                          </p>
                          <p className="mt-2 text-sm">
                            Expected output: {component.outputPerHa.toLocaleString()}{' '}
                            {component.outputUnit}/ha
                          </p>
                          <p className="text-sm">
                            Gross margin: BDT {component.grossMarginPerHa.toLocaleString()}/ha
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-base-content/70">{crop.system.managementNote}</p>
                  </div>
                </div>
              )}
              <details className="collapse collapse-arrow crop-evidence">
                <summary className="collapse-title">
                  <span>
                    <Icon name="soil" size={18} /> Soil role
                  </span>
                  <strong>{crop.soilContribution ?? 'Evidence unavailable'}</strong>
                </summary>
                <div className="collapse-content">
                  <div className="crop-date-route" aria-label="Exact growing dates">
                    <span>
                      <small>Plant</small>
                      <strong>{dayLabel(crop.plantingDate)}</strong>
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      <small>Harvest</small>
                      <strong>{dayLabel(crop.harvestDate)}</strong>
                    </span>
                  </div>
                  <p>
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
              </details>
            </div>
          )}
        </div>
      </div>
      <details className="collapse collapse-arrow plan-explanation border border-base-300 bg-base-100">
        <summary className="collapse-title">
          <span className="flex items-center gap-3 font-semibold">
            <Icon name="info" /> Why this plan fits
          </span>
          <span className="block text-sm font-normal text-base-content/65">
            Water, soil and trade-offs
          </span>
        </summary>
        <div className="collapse-content grid gap-6 lg:grid-cols-2">
          <div className="crop-demand-card rounded-box bg-base-200">
            <div className="p-6">
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
          <div className="rotation-reasons-card rounded-box bg-base-200">
            <div className="p-6">
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
          {plan.tradeoffs.filter((item) => item.kind !== 'reason').length > 0 && (
            <div className="alert alert-warning alert-soft items-start lg:col-span-2">
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
        </div>
      </details>
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
              <span className="rotation-alternative-facts">
                {item.crops.map((listedCrop, position) => (
                  <span key={`${listedCrop.id}-${position}`}>
                    <strong>{listedCrop.name}</strong>
                    <small>
                      {monthLabel(listedCrop.plantingDate)} → {monthLabel(listedCrop.harvestDate)}
                    </small>
                    <small>{listedCrop.soilContribution ?? 'Soil evidence unavailable'}</small>
                  </span>
                ))}
              </span>
              <span className="mt-3 text-sm text-base-content/70">
                {item.crops.length} crops · {item.fit}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
