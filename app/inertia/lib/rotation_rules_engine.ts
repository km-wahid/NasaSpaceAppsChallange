import type { RotationPlan } from '../components/rotation_plans'

export type FarmerPriority = 'profit' | 'water' | 'soil' | 'yield'

export type CropCategory = 'cereal' | 'legume' | 'oilseed' | 'cash_crop' | 'vegetable' | 'fiber'

export interface CropMetadata {
  family: CropCategory
  displayName: string
  waterNeedMm: number
  nitrogenFixationKgPerHa: number
  profitIndex: number
  yieldIndex: number
  isLegume: boolean
}

export const cropDirectory: Record<string, CropMetadata> = {
  'aman rice': {
    family: 'cereal',
    displayName: 'Aman Rice',
    waterNeedMm: 1100,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 78,
    yieldIndex: 88,
    isLegume: false,
  },
  'boro rice': {
    family: 'cereal',
    displayName: 'Boro Rice',
    waterNeedMm: 1300,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 75,
    yieldIndex: 95,
    isLegume: false,
  },
  'aus rice': {
    family: 'cereal',
    displayName: 'Aus Rice',
    waterNeedMm: 650,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 70,
    yieldIndex: 72,
    isLegume: false,
  },
  'wheat': {
    family: 'cereal',
    displayName: 'Wheat',
    waterNeedMm: 400,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 72,
    yieldIndex: 80,
    isLegume: false,
  },
  'maize': {
    family: 'cereal',
    displayName: 'Maize',
    waterNeedMm: 550,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 82,
    yieldIndex: 92,
    isLegume: false,
  },
  'lentil': {
    family: 'legume',
    displayName: 'Lentil',
    waterNeedMm: 250,
    nitrogenFixationKgPerHa: 38,
    profitIndex: 88,
    yieldIndex: 68,
    isLegume: true,
  },
  'mungbean': {
    family: 'legume',
    displayName: 'Mungbean',
    waterNeedMm: 280,
    nitrogenFixationKgPerHa: 42,
    profitIndex: 85,
    yieldIndex: 70,
    isLegume: true,
  },
  'blackgram': {
    family: 'legume',
    displayName: 'Blackgram',
    waterNeedMm: 270,
    nitrogenFixationKgPerHa: 35,
    profitIndex: 80,
    yieldIndex: 65,
    isLegume: true,
  },
  'chickpea': {
    family: 'legume',
    displayName: 'Chickpea',
    waterNeedMm: 300,
    nitrogenFixationKgPerHa: 40,
    profitIndex: 84,
    yieldIndex: 68,
    isLegume: true,
  },
  'grasspea': {
    family: 'legume',
    displayName: 'Grasspea (Khesari)',
    waterNeedMm: 220,
    nitrogenFixationKgPerHa: 32,
    profitIndex: 74,
    yieldIndex: 62,
    isLegume: true,
  },
  'mustard': {
    family: 'oilseed',
    displayName: 'Mustard',
    waterNeedMm: 320,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 86,
    yieldIndex: 74,
    isLegume: false,
  },
  'sesame': {
    family: 'oilseed',
    displayName: 'Sesame',
    waterNeedMm: 300,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 82,
    yieldIndex: 70,
    isLegume: false,
  },
  'potato': {
    family: 'vegetable',
    displayName: 'Potato',
    waterNeedMm: 500,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 89,
    yieldIndex: 94,
    isLegume: false,
  },
  'jute': {
    family: 'fiber',
    displayName: 'Jute',
    waterNeedMm: 600,
    nitrogenFixationKgPerHa: 10,
    profitIndex: 75,
    yieldIndex: 76,
    isLegume: false,
  },
}

export function lookupCropMeta(cropName: string): CropMetadata {
  const normalized = cropName.trim().toLowerCase()
  for (const [key, meta] of Object.entries(cropDirectory)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return meta
    }
  }
  // Fallback
  if (
    normalized.includes('pulse') ||
    normalized.includes('dal') ||
    normalized.includes('bean') ||
    normalized.includes('pea')
  ) {
    return {
      family: 'legume',
      displayName: cropName,
      waterNeedMm: 280,
      nitrogenFixationKgPerHa: 35,
      profitIndex: 82,
      yieldIndex: 70,
      isLegume: true,
    }
  }
  if (normalized.includes('rice') || normalized.includes('paddy')) {
    return {
      family: 'cereal',
      displayName: cropName,
      waterNeedMm: 1100,
      nitrogenFixationKgPerHa: 0,
      profitIndex: 75,
      yieldIndex: 85,
      isLegume: false,
    }
  }
  return {
    family: 'cereal',
    displayName: cropName,
    waterNeedMm: 450,
    nitrogenFixationKgPerHa: 0,
    profitIndex: 75,
    yieldIndex: 75,
    isLegume: false,
  }
}

export interface RuleValidationResult {
  noConsecutiveSameCrop: boolean
  consecutiveViolationDetail?: string
  hasLegume: boolean
  legumeCropNames: string[]
  waterRainMatchScore: number // 0 to 100
  waterMatchAnalysis: string
}

export interface PlanEvaluation {
  planId: string
  ruleValidation: RuleValidationResult
  score: number // Total score (0-100) based on priority
  scoreBreakdown: {
    ruleCompliance: number // out of 25
    waterEfficiency: number // out of 25
    soilHealthScore: number // out of 25
    economicReturn: number // out of 25
  }
  farmerPriority: FarmerPriority
  rankBadge: string
  reasons: Array<{
    title: string
    text: string
    type: 'soil' | 'water' | 'economic' | 'rotation'
  }>
  doubts: Array<{
    title: string
    text: string
    riskLevel: 'low' | 'moderate' | 'elevated'
    mitigation: string
  }>
  overallUncertainty: 'low' | 'moderate' | 'elevated'
}

/**
 * Validates the core rotation rules:
 * Rule 1: Do not plant the same type of crop two times in a row.
 * Rule 2: Add one legume crop in every plan.
 * Rule 3: Pick crops that need the same amount of water as the rain.
 */
export function validateRotationRules(
  crops: RotationPlan['crops'],
  districtRainfallMm: number = 800,
  waterAvailability: 'low' | 'medium' | 'high' | null = 'medium'
): RuleValidationResult {
  // Rule 1: No consecutive same crop family
  let noConsecutiveSameCrop = true
  let consecutiveViolationDetail: string | undefined

  for (let i = 0; i < crops.length - 1; i++) {
    const metaA = lookupCropMeta(crops[i].name)
    const metaB = lookupCropMeta(crops[i + 1].name)

    if (
      metaA.family === metaB.family ||
      crops[i].name.toLowerCase() === crops[i + 1].name.toLowerCase()
    ) {
      noConsecutiveSameCrop = false
      consecutiveViolationDetail = `Consecutive planting of ${metaA.family} family crops (${crops[i].name} → ${crops[i + 1].name}) breaks natural pest suppression cycles.`
      break
    }
  }

  // Rule 2: Mandatory Legume in every plan
  const legumeCrops: string[] = []
  for (const crop of crops) {
    const meta = lookupCropMeta(crop.name)
    if (meta.isLegume) {
      legumeCrops.push(crop.name)
    }
  }
  const hasLegume = legumeCrops.length > 0

  // Rule 3: Match crop water need with rainfall / available water
  const effectiveWaterSupply =
    waterAvailability === 'low'
      ? 450
      : waterAvailability === 'high'
        ? 1200
        : districtRainfallMm || 750

  let totalMatchDelta = 0
  for (const crop of crops) {
    const meta = lookupCropMeta(crop.name)
    const delta = Math.abs(meta.waterNeedMm - effectiveWaterSupply / crops.length)
    totalMatchDelta += delta
  }

  const avgDelta = totalMatchDelta / Math.max(1, crops.length)
  const waterRainMatchScore = Math.max(45, Math.min(98, Math.round(100 - avgDelta / 15)))

  let waterMatchAnalysis = 'Crop water requirements align well with natural seasonal rainfall.'
  if (waterRainMatchScore < 70) {
    waterMatchAnalysis =
      'Some crops require supplemental irrigation beyond district seasonal rainfall.'
  }

  return {
    noConsecutiveSameCrop,
    consecutiveViolationDetail,
    hasLegume,
    legumeCropNames: legumeCrops,
    waterRainMatchScore,
    waterMatchAnalysis,
  }
}

/**
 * Ensures Rule 2 is strictly fulfilled by inserting a legume slot if missing.
 */
export function enforceLegumeInPlan(plan: RotationPlan): RotationPlan {
  const hasLegume = plan.crops.some((c) => lookupCropMeta(c.name).isLegume)
  if (hasLegume) return plan

  // Replace or augment with a strategic legume
  const updatedCrops = [...plan.crops]
  if (updatedCrops.length >= 2) {
    // Replace the 2nd crop with Mungbean (short-duration 65-day legume)
    updatedCrops[1] = {
      ...updatedCrops[1],
      name: 'Mungbean',
      waterNeed: 'low',
      condition: 'Mandatory Legume Slot',
      reason: 'Included to satisfy Rule #2: fix atmospheric nitrogen and restore soil fertility.',
      soilContribution: 'Legume slot — adds ~40 kg/ha nitrogen',
    }
  } else {
    // Add Mungbean as next crop
    updatedCrops.push({
      id: 999,
      name: 'Mungbean',
      plantingDate: '2027-04-01',
      harvestDate: '2027-06-10',
      waterNeed: 'low',
      condition: 'Mandatory Legume Slot',
      reason: 'Enforced legume rule for soil biological restoration.',
      nextCrop: 'Aman rice',
      soilContribution: 'Legume slot — atmospheric nitrogen fixer',
    })
  }

  return {
    ...plan,
    crops: updatedCrops,
  }
}

/**
 * Calculates priority-weighted score and generates transparent reasons & doubts for each plan.
 */
export function evaluatePlan(
  plan: RotationPlan,
  priority: FarmerPriority = 'yield',
  waterAvailability: 'low' | 'medium' | 'high' | null = 'medium',
  districtRainfallMm: number = 800
): PlanEvaluation {
  // Ensure legume rule
  const enforcedPlan = enforceLegumeInPlan(plan)
  const validation = validateRotationRules(
    enforcedPlan.crops,
    districtRainfallMm,
    waterAvailability
  )

  // Compute components:
  // 1. Rule compliance (up to 25 pts)
  let ruleCompliance = 25
  if (!validation.noConsecutiveSameCrop) ruleCompliance -= 12
  if (!validation.hasLegume) ruleCompliance -= 13

  // 2. Water efficiency & Rain matching (up to 25 pts)
  const waterEfficiency = Math.round((validation.waterRainMatchScore / 100) * 25)

  // 3. Soil health score (up to 25 pts)
  let soilHealthScore = validation.hasLegume ? 23 : 10
  if (enforcedPlan.crops.length >= 3) soilHealthScore += 2

  // 4. Economic & yield return (up to 25 pts)
  let avgProfit = 0
  let avgYield = 0
  for (const crop of enforcedPlan.crops) {
    const meta = lookupCropMeta(crop.name)
    avgProfit += meta.profitIndex
    avgYield += meta.yieldIndex
  }
  avgProfit /= Math.max(1, enforcedPlan.crops.length)
  avgYield /= Math.max(1, enforcedPlan.crops.length)

  const economicReturn = Math.round((avgProfit / 100) * 25)
  const yieldReturn = Math.round((avgYield / 100) * 25)

  // Apply Priority Weighting (Rule 4: Give more points to what the farmer cares about most)
  let finalScore = 0
  let rankBadge = 'Recommended Plan'

  if (priority === 'profit') {
    finalScore = Math.round(
      ruleCompliance * 0.8 + waterEfficiency * 0.8 + soilHealthScore * 0.8 + economicReturn * 1.6
    )
    rankBadge = 'Top Profit Earner 💰'
  } else if (priority === 'water') {
    finalScore = Math.round(
      ruleCompliance * 0.8 + waterEfficiency * 1.7 + soilHealthScore * 0.8 + economicReturn * 0.7
    )
    rankBadge = 'Highest Water Saver 💧'
  } else if (priority === 'soil') {
    finalScore = Math.round(
      ruleCompliance * 0.8 + waterEfficiency * 0.8 + soilHealthScore * 1.7 + economicReturn * 0.7
    )
    rankBadge = 'Best Soil Builder 🌱'
  } else {
    finalScore = Math.round(
      ruleCompliance * 0.8 + waterEfficiency * 0.8 + soilHealthScore * 0.7 + yieldReturn * 1.7
    )
    rankBadge = 'Highest Yielding 🌾'
  }

  finalScore = Math.min(99, Math.max(55, finalScore))

  // Generate detailed Reasons
  const reasons: PlanEvaluation['reasons'] = [
    {
      title: 'Biodiversity & Pest Defense',
      text: validation.noConsecutiveSameCrop
        ? 'Rotates crop families to break insect pest lifecycles without chemical build-up.'
        : 'Rotational diversity prevents persistent fungal pathogens in topsoil.',
      type: 'rotation',
    },
    {
      title: 'Legume Soil Nitrogen Enrichment',
      text: `Includes ${validation.legumeCropNames.join(', ') || 'Legume'}, naturally infusing 35-45 kg/ha nitrogen into your field and reducing synthetic fertilizer costs.`,
      type: 'soil',
    },
    {
      title: 'Rainfall & Irrigation Fit',
      text: validation.waterMatchAnalysis,
      type: 'water',
    },
    {
      title: 'Farmer Priority Alignment',
      text: `Optimized specifically for your designated priority on ${priority.toUpperCase()}.`,
      type: 'economic',
    },
  ]

  // Generate Doubts & Uncertainties
  const doubts: PlanEvaluation['doubts'] = [
    {
      title: 'Erratic Rainfall & Flash Storms',
      text: 'Pre-monsoon or late monsoon heavy rains can waterlog ripening crops or delay sowing.',
      riskLevel: 'moderate',
      mitigation:
        'Prepare raised beds and ensure clean boundary drainage trenches before planting.',
    },
    {
      title: 'Winter Warm Spells (Shortened Rabi Window)',
      text: 'Premature high temperatures in February may speed up pod maturation and reduce mustard or pulse grain weight.',
      riskLevel: 'moderate',
      mitigation: 'Sow winter crops without delay by mid-November right after the Aman harvest.',
    },
  ]

  // Water deficit doubt if applicable
  if (waterAvailability === 'low' || validation.waterRainMatchScore < 75) {
    doubts.push({
      title: 'Dry Spell Moisture Stress',
      text: 'If dry spells exceed 14 consecutive days during flowering, supplementary irrigation will be needed.',
      riskLevel: 'elevated',
      mitigation:
        'Keep a backup shallow pump arrangement ready and apply straw mulching to preserve topsoil moisture.',
    })
  }

  const overallUncertainty = doubts.some((d) => d.riskLevel === 'elevated')
    ? 'elevated'
    : doubts.length > 1
      ? 'moderate'
      : 'low'

  return {
    planId: enforcedPlan.id,
    ruleValidation: validation,
    score: finalScore,
    scoreBreakdown: {
      ruleCompliance,
      waterEfficiency,
      soilHealthScore,
      economicReturn,
    },
    farmerPriority: priority,
    rankBadge,
    reasons,
    doubts,
    overallUncertainty,
  }
}
