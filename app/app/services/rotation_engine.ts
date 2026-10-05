export type Scores = {
  climate: number
  water: number
  soil: number
  resilience: number
  economic: number
}

export type Weights = Scores
export type NutrientLevel = 'low' | 'medium' | 'high'

export type Candidate = {
  id: number
  name: string
  family: string
  windowStart: string
  windowEnd: string
  durationDays: number
  turnaroundDays?: number
  waterRequirementMm: number | null
  profitPerHa: number | null
  scores: Scores
  soilEffectPoints?: number
  soilEffectSourceId?: string
  soilNote?: string
  nutrientRequirements: Record<'n' | 'p' | 'k', NutrientLevel | null>
  nutrientContributions?: Partial<Record<'n' | 'p' | 'k', NutrientLevel>>
}

export type TransitionRule = {
  fromCropId: number
  toCropId: number
  type: 'allowed' | 'discouraged' | 'forbidden'
  compatibility: number
  soilAdjustment: number
  minimumBreakSeasons: number
  turnaroundDays?: number
  reason: string
}

export type EngineInput = {
  slots: Array<{ season: string; candidates: Candidate[] }>
  weights: Weights
  availableWaterMm: Array<number | null>
  farmAreaHa: number | null
  minimumTurnaroundDays: number
  minimumDistinctCrops: number
  allowAdjacentRepeat: boolean
  /** Most recent season first. */
  history: Array<{
    cropId: number | null
    landUse: 'crop' | 'fallow' | 'unknown'
    harvestDate?: string | null
  }>
  rules: TransitionRule[]
  limit?: number
}

export type Explanation = {
  code: string
  kind: 'reason' | 'tradeoff' | 'warning' | 'rejection'
  message: string
  impactPoints?: number
}

export type RotationResult = {
  crops: Candidate[]
  plantingDates: string[]
  harvestDates: string[]
  scores: Scores & { compatibility: number; diversity: number; overall: number }
  totalWaterRequirementMm: number | null
  totalProfit: number | null
  explanations: Explanation[]
}

export type EngineResult = {
  recommendations: RotationResult[]
  evaluatedCount: number
  rejectedCount: number
  rejectionCounts: Record<string, number>
}

const dayMs = 86_400_000
const clamp = (value: number) => Math.min(100, Math.max(0, value))
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * dayMs)
const iso = (date: Date) => date.toISOString().slice(0, 10)

export function weightedScore(scores: Scores, weights: Weights) {
  return (
    (scores.climate * weights.climate +
      scores.water * weights.water +
      scores.soil * weights.soil +
      scores.resilience * weights.resilience +
      scores.economic * weights.economic) /
    100
  )
}

export function cropSoilEffectScore(points: number) {
  if (points < -100 || points > 100)
    throw new Error('crop soil effect must be between -100 and 100')
  return (points + 100) / 2
}

function transitionKey(from: number, to: number) {
  return `${from}:${to}`
}

function nextYear(date: Date) {
  const result = new Date(date)
  result.setUTCFullYear(result.getUTCFullYear() + 1)
  return result
}

function nutrientPenalty(from: Candidate, to: Candidate) {
  return (['n', 'p', 'k'] as const).reduce((penalty, nutrient) => {
    const contributes = from.nutrientContributions?.[nutrient]
    return (
      penalty +
      (from.nutrientRequirements[nutrient] === 'high' &&
      to.nutrientRequirements[nutrient] === 'high' &&
      (!contributes || contributes === 'low')
        ? 2
        : 0)
    )
  }, 0)
}

function schedule(
  crops: Candidate[],
  ruleMap: Map<string, TransitionRule>,
  defaultTurnaround: number,
  previous?: EngineInput['history'][number]
) {
  const plantingDates: string[] = []
  const harvestDates: string[] = []
  let previousHarvest = previous?.harvestDate
    ? new Date(`${previous.harvestDate}T00:00:00Z`)
    : undefined

  for (let index = 0; index < crops.length; index++) {
    const crop = crops[index]
    const start = new Date(`${crop.windowStart}T00:00:00Z`)
    const end = new Date(`${crop.windowEnd}T00:00:00Z`)
    const previousCrop = crops[index - 1]
    const previousCropId = previousCrop?.id ?? previous?.cropId
    const rule = previousCropId ? ruleMap.get(transitionKey(previousCropId, crop.id)) : undefined
    const turnaround = rule?.turnaroundDays ?? crop.turnaroundDays ?? defaultTurnaround
    const ready = previousHarvest ? addDays(previousHarvest, turnaround) : start
    const planting = ready > start ? ready : start
    if (planting > end) return { error: 'TURNAROUND_WINDOW' as const }
    const harvest = addDays(planting, crop.durationDays)
    plantingDates.push(iso(planting))
    harvestDates.push(iso(harvest))
    previousHarvest = harvest
  }

  const first = crops[0]
  const last = crops.at(-1)!
  const wrapRule = ruleMap.get(transitionKey(last.id, first.id))
  const wrapTurnaround = wrapRule?.turnaroundDays ?? first.turnaroundDays ?? defaultTurnaround
  const nextWindowEnd = nextYear(new Date(`${first.windowEnd}T00:00:00Z`))
  if (addDays(previousHarvest!, wrapTurnaround) > nextWindowEnd) {
    return { error: 'WRAP_AROUND_WINDOW' as const }
  }

  return { plantingDates, harvestDates }
}

function violatesMinimumBreak(
  crops: Candidate[],
  history: EngineInput['history'],
  rules: TransitionRule[]
) {
  const timeline = [...history]
    .reverse()
    .map((entry) => entry.cropId)
    .concat(
      crops.map((crop) => crop.id),
      crops[0].id
    )
  return rules.some((rule) => {
    if (!rule.minimumBreakSeasons) return false
    for (let from = 0; from < timeline.length; from++) {
      if (timeline[from] !== rule.fromCropId) continue
      for (let to = from + 1; to < timeline.length; to++) {
        if (timeline[to] === rule.toCropId && to - from - 1 < rule.minimumBreakSeasons) return true
      }
    }
    return false
  })
}

function combinations(slots: EngineInput['slots']) {
  return slots.reduce<Candidate[][]>(
    (rows, slot) => rows.flatMap((row) => slot.candidates.map((candidate) => [...row, candidate])),
    [[]]
  )
}

export function recommendRotations(input: EngineInput): EngineResult {
  if (input.slots.length < 2) throw new Error('at least two seasonal slots are required')
  const weightTotal = Object.values(input.weights).reduce((sum, weight) => sum + weight, 0)
  if (Math.abs(weightTotal - 100) > 0.0001) throw new Error('weights must total 100')
  if (input.history.some((entry) => entry.landUse === 'unknown'))
    throw new Error('HISTORY_INCOMPLETE')

  const ruleMap = new Map(
    input.rules.map((rule) => [transitionKey(rule.fromCropId, rule.toCropId), rule])
  )
  const rejectionCounts: Record<string, number> = {}
  const rejected = (code: string) => (rejectionCounts[code] = (rejectionCounts[code] ?? 0) + 1)
  const feasible: Array<
    Omit<RotationResult, 'scores'> & {
      rawScores: Scores
      compatibility: number
      diversity: number
      repeatPenalty: number
    }
  > = []
  const rows = combinations(input.slots)

  for (const crops of rows) {
    const transitions = crops.map(
      (crop, index) => [crop, crops[(index + 1) % crops.length]] as const
    )
    if (!input.allowAdjacentRepeat && transitions.some(([from, to]) => from.id === to.id)) {
      rejected('ADJACENT_REPEAT')
      continue
    }
    const distinctCrops = new Set(crops.map((crop) => crop.id)).size
    if (distinctCrops < input.minimumDistinctCrops) {
      rejected('MINIMUM_DIVERSITY')
      continue
    }
    const rules = transitions.map(([from, to]) => ruleMap.get(transitionKey(from.id, to.id)))
    const previousCropId = input.history[0]?.cropId
    const previousRule = previousCropId
      ? ruleMap.get(transitionKey(previousCropId, crops[0].id))
      : undefined
    if (rules.some((rule) => rule?.type === 'forbidden') || previousRule?.type === 'forbidden') {
      rejected('FORBIDDEN_TRANSITION')
      continue
    }
    if (violatesMinimumBreak(crops, input.history, input.rules)) {
      rejected('MINIMUM_BREAK')
      continue
    }
    const scheduled = schedule(crops, ruleMap, input.minimumTurnaroundDays, input.history[0])
    if ('error' in scheduled && scheduled.error) {
      rejected(scheduled.error)
      continue
    }

    const climate = mean(crops.map((crop) => crop.scores.climate))
    const totalWater = crops.some((crop) => crop.waterRequirementMm === null)
      ? null
      : crops.reduce((sum, crop) => sum + crop.waterRequirementMm!, 0)
    const totalAvailableWater = input.availableWaterMm.some((value) => value === null)
      ? null
      : input.availableWaterMm.reduce<number>((sum, value) => sum + value!, 0)
    const water =
      totalAvailableWater === null || totalWater === null
        ? mean(crops.map((crop) => crop.scores.water))
        : 0.7 * mean(crops.map((crop) => crop.scores.water)) +
          0.3 * Math.min(100, (100 * totalAvailableWater) / totalWater)
    const transitionSoil = transitions.reduce((sum, [from, to], index) => {
      return sum + (rules[index]?.soilAdjustment ?? 0) - nutrientPenalty(from, to)
    }, 0)
    const soil = clamp(mean(crops.map((crop) => crop.scores.soil)) + transitionSoil)
    const resilience = mean(crops.map((crop) => crop.scores.resilience))
    const economic = mean(crops.map((crop) => crop.scores.economic))
    const compatibility = mean(rules.map((rule) => rule?.compatibility ?? 50))
    const diversity =
      (100 * (new Set(crops.map((crop) => crop.family)).size - 1)) / (crops.length - 1)
    const repeatPenalty = crops.length - distinctCrops > 0 ? 4 * (crops.length - distinctCrops) : 0
    const explanations: Explanation[] = []
    if (rules.some((rule) => !rule))
      explanations.push({
        code: 'UNKNOWN_TRANSITION',
        kind: 'warning',
        message: 'A transition has no reviewed rule; neutral compatibility was used.',
      })
    if (repeatPenalty)
      explanations.push({
        code: 'REPEAT_PENALTY',
        kind: 'tradeoff',
        impactPoints: -repeatPenalty,
        message: `Repeated crops reduced the score by ${repeatPenalty} points.`,
      })
    if (transitionSoil < 0)
      explanations.push({
        code: 'NUTRIENT_DEPLETION',
        kind: 'tradeoff',
        impactPoints: transitionSoil,
        message: `Transition soil effects reduced the soil score by ${Math.abs(transitionSoil)} points.`,
      })

    feasible.push({
      crops,
      plantingDates: scheduled.plantingDates,
      harvestDates: scheduled.harvestDates,
      rawScores: { climate, water, soil, resilience, economic },
      compatibility,
      diversity,
      repeatPenalty,
      totalWaterRequirementMm: totalWater,
      totalProfit:
        input.farmAreaHa === null || crops.some((crop) => crop.profitPerHa === null)
          ? null
          : crops.reduce((sum, crop) => sum + crop.profitPerHa! * input.farmAreaHa!, 0),
      explanations,
    })
  }

  const recommendations = feasible
    .map((rotation) => {
      const overall = clamp(
        weightedScore(rotation.rawScores, input.weights) +
          0.1 * (rotation.compatibility - 50) +
          0.05 * (rotation.diversity - 50) -
          rotation.repeatPenalty
      )
      return {
        ...rotation,
        scores: {
          ...rotation.rawScores,
          compatibility: rotation.compatibility,
          diversity: rotation.diversity,
          overall,
        },
      }
    })
    .sort(
      (a, b) =>
        b.scores.overall - a.scores.overall ||
        b.scores.soil - a.scores.soil ||
        (a.totalWaterRequirementMm !== null && b.totalWaterRequirementMm !== null
          ? a.totalWaterRequirementMm - b.totalWaterRequirementMm
          : 0) ||
        a.crops
          .map((crop) => crop.id)
          .join(',')
          .localeCompare(b.crops.map((crop) => crop.id).join(','))
    )
    .slice(0, input.limit ?? 3)
    .map(
      ({ rawScores: _, compatibility: _c, diversity: _d, repeatPenalty: _r, ...rotation }) =>
        rotation
    )

  return {
    recommendations,
    evaluatedCount: rows.length,
    rejectedCount: rows.length - feasible.length,
    rejectionCounts,
  }
}
