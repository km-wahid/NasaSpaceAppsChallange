import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import Icon from './icon'
import {
  evaluatePlan,
  lookupCropMeta,
  enforceLegumeInPlan,
  type FarmerPriority,
  type PlanEvaluation,
} from '../lib/rotation_rules_engine'

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

interface RotationPlansProps {
  plans: RotationPlan[]
  farmId?: string
  waterAvailability?: 'low' | 'medium' | 'high' | null
  districtRainfallMm?: number
}

const priorityOptions: Array<{
  id: FarmerPriority
  label: string
  icon: 'leaf' | 'water' | 'sun' | 'shield'
  desc: string
}> = [
  { id: 'profit', label: 'Income', icon: 'shield', desc: 'Prioritize market returns.' },
  { id: 'water', label: 'Save water', icon: 'water', desc: 'Match crops to rainfall.' },
  { id: 'soil', label: 'Soil health', icon: 'leaf', desc: 'Support soil fertility.' },
  { id: 'yield', label: 'Yield', icon: 'sun', desc: 'Prioritize harvest volume.' },
]

export default function RotationPlans({
  plans,
  farmId = '',
  waterAvailability = 'medium',
  districtRainfallMm = 800,
}: RotationPlansProps) {
  const [priority, setPriority] = useState<FarmerPriority>('profit')
  const [planIndex, setPlanIndex] = useState(0)
  const [cropIndex, setCropIndex] = useState(0)
  const [saved, setSaved] = useState<SavedRotation | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Enforce rotation rules and calculate priority scores
  const evaluatedPlans = useMemo(() => {
    return plans.map((rawPlan) => {
      const planWithLegume = enforceLegumeInPlan(rawPlan)
      const evaluation = evaluatePlan(planWithLegume, priority, waterAvailability, districtRainfallMm)
      return {
        ...planWithLegume,
        evaluation,
      }
    }).sort((a, b) => b.evaluation.score - a.evaluation.score)
  }, [plans, priority, waterAvailability, districtRainfallMm])

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

  const plan = evaluatedPlans[planIndex] ?? evaluatedPlans[0]
  if (!plan) return null

  const crop = plan.crops[cropIndex] ?? plan.crops[0]
  const isSaved = Boolean(saved && saved.runId === plan.runId && saved.rank === plan.rank)
  const evaluation: PlanEvaluation = plan.evaluation

  // Audio Read-out for Farmer in English
  function speakPlanAdvice() {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const cropList = plan.crops.map((c) => c.name).join(', followed by ')
    const textToSpeak = `This rotation plan includes ${cropList}. It includes a dedicated legume crop to replenish soil nitrogen and reduce synthetic fertilizer costs. To protect against erratic rain or dry spells, keep field drainage channels clear and prepare backup supplementary irrigation.`

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

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
      `${plan.label} — Overall Score: ${evaluation.score}/100 (${evaluation.rankBadge})`,
      'A decision-support guide, not a yield guarantee.',
      '',
      '=== CROP SEQUENCE ===',
      ...plan.crops.flatMap((item, i) => [
        `${i + 1}. ${item.name}`,
        `   Planting: ${item.plantingDate.slice(0, 10)} | Harvest: ${item.harvestDate.slice(0, 10)}`,
        `   Water need: ${waterLabels[item.waterNeed]} | Fit: ${item.condition}`,
        `   Soil contribution: ${item.soilContribution ?? 'Organic soil support'}`,
        `   Why: ${item.reason}`,
        '',
      ]),
      '=== ROTATION RULES COMPLIANCE ===',
      `1. Consecutive same crop prevented: ${evaluation.ruleValidation.noConsecutiveSameCrop ? 'PASS' : 'FLAGGED'}`,
      `2. Legume crop included: PASS (${evaluation.ruleValidation.legumeCropNames.join(', ') || 'Legume Slot'})`,
      `3. Water-Rain Match Score: ${evaluation.ruleValidation.waterRainMatchScore}%`,
      `4. Farmer Priority: ${priority.toUpperCase()}`,
      '',
      '=== KEY REASONS TO CHOOSE THIS PLAN ===',
      ...evaluation.reasons.map((r) => `* ${r.title}: ${r.text}`),
      '',
      '=== DOUBTS & UNCERTAINTIES (RISKS & ACTION) ===',
      ...evaluation.doubts.map(
        (d) => `* [${d.riskLevel.toUpperCase()}] ${d.title}: ${d.text} -> Farmer Action: ${d.mitigation}`
      ),
      '',
      'Before planting: confirm local weather forecasts and seed varieties with your local agricultural extension service.',
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
    <section id="crop-plans" className="rotation-workspace space-y-6" aria-label="Crop rotation plans">
      {/* 1. Farmer Priority Selector (Rule 4: Give more points to what the farmer cares about most) */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-base-content">
                What matters most?
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-2">
            {priorityOptions.map((opt) => {
              const active = priority === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPriority(opt.id)}
                  className={`card text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-slate-900 shadow-md scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-extrabold ${active ? 'text-emerald-950' : 'text-slate-900'}`}>
                      {opt.label}
                    </span>
                    {active && (
                      <span className="bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded-full shadow-xs">
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 mt-2 leading-relaxed font-medium">
                    {opt.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Rotation Header Card */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="agri-eyebrow text-primary">
                {plan.demo ? 'SAMPLE CROP ROTATION' : 'RECOMMENDED ROTATION PLAN'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 mt-1 text-base-content">
                <span>{plan.label}</span>
                <span className="badge bg-emerald-700 text-white text-sm py-3 px-3.5 font-extrabold shadow-sm">
                  Score: {evaluation.score}/100
                </span>
                <span className="badge bg-amber-200 text-amber-950 border border-amber-400 font-bold text-xs px-3 py-1">
                  {evaluation.rankBadge}
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${isSpeaking ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-outline border-primary text-primary hover:bg-primary hover:text-white'} font-semibold gap-2 rounded-lg transition-all`}
                onClick={speakPlanAdvice}
                aria-label="Listen to rotation advice"
              >
                <Icon name="volume" size={16} />
                {isSpeaking ? 'Stop Audio' : 'Listen Advice'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-100 border border-slate-300 p-3 shadow-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-extrabold text-sm shrink-0">
                ✓
              </span>
              <div>
                <strong className="block text-slate-900 text-sm font-bold">No repeated crop</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-100 border border-emerald-300 p-3 shadow-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200 text-emerald-950 font-extrabold text-sm shrink-0">
                ✓
              </span>
              <div>
                <strong className="block text-emerald-950 text-sm font-bold">Legume included</strong>
                <span className="text-emerald-900 text-sm font-semibold">
                  {evaluation.ruleValidation.legumeCropNames.join(', ') || 'Legume Nitrogen Fixer'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-sky-100 border border-sky-300 p-3 shadow-xs">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-200 text-sky-950 font-extrabold text-sm shrink-0">
                💧
              </span>
              <div>
                <strong className="block text-sky-950 text-sm font-bold">Water match</strong>
                <span className="text-sky-900 text-sm font-semibold">
                  {evaluation.ruleValidation.waterRainMatchScore}% seasonal alignment
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-2">
            <button
              type="button"
              className="btn btn-primary min-h-12 text-base font-semibold shadow-sm"
              disabled={plan.demo || !farmId || !plan.runId || saving || isSaved}
              onClick={() => void useRotation()}
            >
              <Icon name={isSaved ? 'check' : 'leaf'} />
              {plan.demo
                ? 'Sample preview · cannot apply'
                : saving
                  ? 'Saving your rotation…'
                  : isSaved
                    ? 'Saved to your farm ✓'
                    : `Use this rotation · ${plan.label}`}
            </button>
            <a className="btn btn-outline min-h-12 border-base-300 text-base-content hover:bg-base-200 font-semibold" href="#rotation-alternatives">
              Compare plans
            </a>
            <button type="button" className="btn btn-ghost min-h-12 text-base-content font-medium" onClick={downloadPlan}>
              <Icon name="arrow" />
              Download guide
            </button>
          </div>

          {saveError && (
            <p role="alert" className="text-sm text-red-700 font-bold bg-red-100 border border-red-300 rounded-lg p-2.5">
              {saveError}
            </p>
          )}

          {saved && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm" role="status">
              <p className="font-bold text-emerald-950">
                Your saved rotation: {saved.crops.map((item) => item.name).join(' → ')}
              </p>
              <p className="mt-1 text-xs text-emerald-900 font-medium">
                Saved as your farm planning selection. You can replace this by choosing any other plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Growing Calendar & Timeline */}
      <div className="card rotation-calendar border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-5 p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-base-content">Growing calendar</h2>
            </div>
            <span className="badge bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold text-xs px-3 py-1">
              {plan.fit}
            </span>
          </div>

          {/* Sequence buttons */}
          <div className="rotation-sequence" aria-label="Crop sequence">
            {plan.crops.map((item, i) => {
              const meta = lookupCropMeta(item.name)
              return (
                <button
                  key={`${item.id}-${i}`}
                  type="button"
                  className={`btn btn-ghost rotation-sequence-crop ${meta.isLegume ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950' : 'text-base-content'}`}
                  data-tone={i % 3}
                  aria-pressed={i === cropIndex}
                  onClick={() => setCropIndex(i)}
                >
                  <span className="rotation-crop-icon">
                    <Icon name={meta.isLegume ? 'leaf' : 'sun'} size={22} />
                  </span>
                  <span>
                    <small className="font-bold">SEASON {i + 1} {meta.isLegume && '• LEGUME'}</small>
                    <strong className="text-sm">{item.name}</strong>
                    <small>
                      {monthLabel(item.plantingDate)} → {monthLabel(item.harvestDate)}
                    </small>
                    <small className={meta.isLegume ? 'text-emerald-800 font-extrabold' : 'text-base-content/75'}>
                      {item.soilContribution ?? 'Soil nutrient support'}
                    </small>
                  </span>
                  {i < plan.crops.length - 1 && <Icon name="arrow" size={16} />}
                </button>
              )
            })}
          </div>

          {/* Month grid bar */}
          <div
            className="rotation-month-grid overflow-x-auto rounded-xl border border-base-300 p-4"
            tabIndex={0}
            aria-label="Growing calendar"
          >
            <div className="min-w-[680px] space-y-3">
              <div
                className="grid gap-1 text-center text-xs font-semibold text-base-content/80"
                style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
              >
                {months.map((month, i) => (
                  <span key={i}>
                    {month.label}
                    <span className="block text-[10px] text-base-content/60">
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
                    className="btn rotation-season-bar h-auto min-h-14 justify-start whitespace-normal text-left shadow-xs"
                    data-tone={i % 3}
                    style={{
                      gridColumn: `${monthNumber(item.plantingDate) - first + 1} / ${monthNumber(item.harvestDate) - first + 2}`,
                    }}
                    onClick={() => setCropIndex(i)}
                    aria-pressed={i === cropIndex}
                  >
                    <Icon name="leaf" />
                    <span>
                      <strong className="text-sm">{item.name}</strong>
                      <span className="block text-xs font-normal">
                        {monthLabel(item.plantingDate)} → {monthLabel(item.harvestDate)}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Crop Detail */}
          {crop && (
            <div className="rotation-crop-detail rounded-2xl bg-base-100 p-6 border border-base-300 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-extrabold text-base-content">
                  <Icon name="leaf" />
                  {crop.name}
                </h3>
                <span className="badge bg-slate-200 text-slate-900 border border-slate-300 font-bold text-xs px-3 py-1">
                  {crop.condition}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Growing Window</p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    {monthLabel(crop.plantingDate)} → {monthLabel(crop.harvestDate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    Plant: {crop.plantingDate.slice(0, 10)} | Harvest: {crop.harvestDate.slice(0, 10)}
                  </p>
                </div>
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                  <p className="text-xs text-sky-700 font-bold uppercase tracking-wider">Water Need</p>
                  <p className="mt-1 font-bold text-sm text-sky-950">
                    {waterLabels[crop.waterNeed]}
                  </p>
                  {crop.waterNeed !== 'unknown' && (
                    <progress
                      className="progress progress-info mt-2 w-full max-w-32 h-2"
                      value={{ low: 30, medium: 60, high: 90 }[crop.waterNeed]}
                      max={100}
                    />
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Subsequent Crop</p>
                  <p className="mt-1 font-bold text-sm text-slate-900">{crop.nextCrop}</p>
                </div>
              </div>
              <p className="crop-selection-reason mt-4 text-sm text-base-content/90 font-medium flex items-start gap-2 leading-relaxed">
                <Icon name="info" size={18} />
                <span>{crop.reason}</span>
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-950 bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
                <span>🌱 Soil Contribution:</span>
                <span>{crop.soilContribution ?? 'Natural organic soil protection'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. REASONS & DOUBTS DUAL SECTION (Feature 3: Show reasons and uncertainties for each plan) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* REASONS */}
        <div className="card border-2 border-emerald-400 bg-base-100 shadow-sm rounded-2xl">
          <div className="card-body p-6 gap-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                  <Icon name="leaf" size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-base-content">Why this plan?</h3>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {evaluation.reasons.map((reason, idx) => (
                <div key={idx} className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                      ✓ {reason.title}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    {reason.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DOUBTS & UNCERTAINTIES */}
        <div className="card border-2 border-amber-400 bg-base-100 shadow-sm rounded-2xl">
          <div className="card-body p-6 gap-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shrink-0">
                  <Icon name="alert" size={22} />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-base-content">Risks</h3>
                </div>
              </div>
              <span className={`badge font-bold text-xs px-3 py-1 ${
                evaluation.overallUncertainty === 'elevated'
                  ? 'bg-red-700 text-white'
                  : 'bg-amber-300 text-amber-950 border border-amber-500'
              }`}>
                Risk: {evaluation.overallUncertainty === 'elevated' ? 'Elevated' : 'Moderate'}
              </span>
            </div>

            <div className="space-y-3">
              {evaluation.doubts.map((doubt, idx) => (
                <div key={idx} className="rounded-xl bg-amber-50 border border-amber-300 p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                      <Icon name="alert" size={16} /> {doubt.title}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                    {doubt.text}
                  </p>
                  <div className="mt-3 rounded-xl bg-white border border-amber-300 p-3 text-xs shadow-xs">
                    <strong className="text-emerald-900 font-extrabold flex items-center gap-1 text-sm">
                      Action:
                    </strong>
                    <p className="mt-1 font-bold text-slate-900 text-xs leading-relaxed">
                      {doubt.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Alternative Plans */}
      <div id="rotation-alternatives" className="rotation-alternatives scroll-mt-32">
        <h2 className="text-2xl font-bold text-base-content">Other rotations</h2>
        <p className="mt-1 text-base text-base-content">
          Priority: <span className="font-bold text-primary">{priority.toUpperCase()}</span>
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {evaluatedPlans.map((item, i) => {
            const isSelected = i === planIndex
            const itemEval = item.evaluation
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setPlanIndex(i)
                  setCropIndex(0)
                }}
                className={`card rotation-plan-card border-2 p-5 text-left text-base-content rounded-2xl transition-all hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md scale-[1.01]'
                    : 'border-base-300 bg-base-100 hover:bg-base-200/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-2 text-base-content">
                    <span className="badge bg-primary text-white font-bold badge-sm">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </span>
                  <span className="badge bg-emerald-700 text-white font-extrabold text-xs px-2.5 py-1">
                    Score: {itemEval.score}
                  </span>
                </div>

                <p className="my-3 text-base font-extrabold text-primary">
                  {item.crops.map((c) => c.name).join(' → ')}
                </p>

                <div className="flex flex-wrap gap-1.5 my-2">
                  <span className="badge bg-sky-100 text-sky-950 border border-sky-300 text-[11px] font-bold">
                    {waterLabels[item.waterDemand]} Water
                  </span>
                  <span className="badge bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-bold">
                    {itemEval.ruleValidation.legumeCropNames.length > 0 ? 'Legume Verified ✓' : 'Legume Slot'}
                  </span>
                </div>

                <div className="mt-3 space-y-2 border-t border-base-200 pt-3">
                  {item.crops.map((listedCrop, pos) => (
                    <div key={`${listedCrop.id}-${pos}`} className="border-l-2 border-primary/40 pl-2.5 text-xs">
                      <strong className="block text-slate-900 font-bold">{listedCrop.name}</strong>
                      <span className="text-slate-600 font-medium">
                        {monthLabel(listedCrop.plantingDate)} → {monthLabel(listedCrop.harvestDate)}
                      </span>
                    </div>
                  ))}
                </div>

                <span className="mt-3 block text-xs font-extrabold text-amber-900">
                  {itemEval.rankBadge}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
