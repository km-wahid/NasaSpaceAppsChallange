import type { Candidate } from '#services/rotation_engine'
import db from '@adonisjs/lucid/services/db'

export type EvidenceStatus = 'eligible' | 'conditional' | 'ineligible'

export type SystemAssessment = {
  systemId: number
  name: string
  systemType: string
  status: EvidenceStatus
  reasons: string[]
  missingEvidence: string[]
}

export type ResearchIdea = {
  name: string
  systemType: string
  components: string[]
  missingEvidence: string[]
}

const numericMetrics = new Set([
  'rainMedianMm',
  'rainP25Mm',
  'rainP75Mm',
  'rainfallCoefficientOfVariation',
  'longestDrySpellP90Days',
  'maximumThreeDayRainP95Mm',
  'meanTemperatureC',
  'minimumTemperatureC',
  'maximumTemperatureC',
  'temperatureP05C',
  'temperatureP95C',
  'coveragePercent',
  'soil_ph',
  'irrigation_mm',
])

function requirementValue(
  metric: string,
  feature: Record<string, unknown> | null,
  farm: Record<string, any>,
  soil: Record<string, any> | null,
  capabilities: Map<string, unknown>
) {
  if (metric.startsWith('capability.')) return capabilities.get(metric.slice('capability.'.length))
  if (metric === 'soil_ph')
    return soil?.ph === null || soil?.ph === undefined ? undefined : Number(soil.ph)
  if (metric === 'irrigation_mm')
    return farm.irrigation_available_mm_per_season === null
      ? undefined
      : Number(farm.irrigation_available_mm_per_season)
  if (numericMetrics.has(metric) && feature?.[metric] !== null && feature?.[metric] !== undefined)
    return Number(feature[metric])
  return undefined
}

function requirementPasses(requirement: Record<string, any>, actual: unknown) {
  const expected =
    requirement.number_value !== null
      ? Number(requirement.number_value)
      : requirement.boolean_value !== null
        ? Boolean(requirement.boolean_value)
        : requirement.text_value
  if (actual === undefined) return null
  if (requirement.comparator === 'minimum') return Number(actual) >= Number(expected)
  if (requirement.comparator === 'maximum') return Number(actual) <= Number(expected)
  return actual === expected
}

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export async function integratedCandidatesForSlot(input: {
  farm: Record<string, any>
  soil: Record<string, any> | null
  seasonId: number
  feature: Record<string, unknown> | null
  environmentCoverageMinimumPercent: number
  baseCandidates: Candidate[]
}) {
  const capabilityRows = await db.from('farm_capabilities').where('farm_id', input.farm.farm_id)
  const capabilities = new Map<string, unknown>(
    capabilityRows.map((row) => [
      row.capability_key,
      row.boolean_value ?? row.number_value ?? row.text_value,
    ])
  )
  const farmerInterest = capabilities.get('integrated_farming_interest')
  if (farmerInterest === false)
    return { enabled: false, candidates: [] as Candidate[], assessments: [] as SystemAssessment[] }

  const baseById = new Map(input.baseCandidates.map((candidate) => [candidate.id, candidate]))
  const systems = await db
    .from('farming_systems')
    .where((query) => query.where('season_id', input.seasonId).orWhereNull('season_id'))
    .where((query) => query.where('district_id', input.farm.district_id).orWhereNull('district_id'))
    .where((query) =>
      query.whereNull('valid_from').orWhere('valid_from', '<=', db.knexRawQuery('current_date'))
    )
    .where((query) =>
      query.whereNull('valid_to').orWhere('valid_to', '>=', db.knexRawQuery('current_date'))
    )
    .whereIn('primary_crop_id', [...baseById.keys()])

  const candidates: Candidate[] = []
  const assessments: SystemAssessment[] = []
  for (const system of systems) {
    const [componentRows, requirements] = await Promise.all([
      db
        .from('farming_system_components as member')
        .leftJoin('crops as crop', 'crop.crop_id', 'member.crop_id')
        .leftJoin(
          'crop_requirements as crop_requirement',
          'crop_requirement.crop_id',
          'member.crop_id'
        )
        .leftJoin(
          'companion_components as companion',
          'companion.companion_component_id',
          'member.companion_component_id'
        )
        .where('member.farming_system_id', system.farming_system_id)
        .select(
          'member.*',
          'crop.crop_name',
          'crop_requirement.botanical_family',
          'companion.name as companion_name',
          'companion.component_type'
        ),
      db.from('farming_system_requirements').where('farming_system_id', system.farming_system_id),
    ])
    const reasons: string[] = []
    const missingEvidence: string[] = []
    let failed = false
    if (farmerInterest !== true) missingEvidence.push('farmer interest confirmation')
    if (
      !input.feature ||
      Number(input.feature.coveragePercent ?? 0) < input.environmentCoverageMinimumPercent
    )
      missingEvidence.push(
        `NASA POWER seasonal coverage of at least ${input.environmentCoverageMinimumPercent}%`
      )
    for (const requirement of requirements) {
      const actual = requirementValue(
        requirement.metric_key,
        input.feature,
        input.farm,
        input.soil,
        capabilities
      )
      const passes = requirementPasses(requirement, actual)
      if (passes === null && requirement.mandatory)
        missingEvidence.push(requirement.metric_key.replace('capability.', 'farm capability: '))
      else if (passes === false && requirement.mandatory) {
        failed = true
        reasons.push(`${requirement.metric_key} does not meet the reviewed requirement.`)
      }
    }
    const economicComplete =
      componentRows.length >= 2 &&
      componentRows.every(
        (row) =>
          row.expected_output_per_hectare !== null &&
          row.output_unit &&
          row.market_price_bdt_per_unit !== null &&
          row.variable_cost_bdt_per_hectare !== null &&
          row.annualized_setup_cost_bdt_per_hectare !== null &&
          row.economic_source_id !== null
      )
    if (!economicComplete)
      missingEvidence.push('complete component output, price and cost evidence')
    const status: EvidenceStatus = failed
      ? 'ineligible'
      : missingEvidence.length
        ? 'conditional'
        : 'eligible'
    assessments.push({
      systemId: Number(system.farming_system_id),
      name: system.name,
      systemType: system.system_type,
      status,
      reasons,
      missingEvidence: [...new Set(missingEvidence)],
    })
    if (status !== 'eligible') continue

    const primary = baseById.get(Number(system.primary_crop_id))!
    const components = componentRows.map((row) => {
      const outputPerHa = Number(row.expected_output_per_hectare)
      const revenuePerHa = outputPerHa * Number(row.market_price_bdt_per_unit)
      const costPerHa =
        Number(row.variable_cost_bdt_per_hectare) +
        Number(row.annualized_setup_cost_bdt_per_hectare)
      return {
        type: row.crop_id ? 'crop' : row.component_type,
        name: row.crop_name ?? row.companion_name,
        cropId: row.crop_id ? Number(row.crop_id) : undefined,
        role: row.role,
        startOffsetDays: Number(row.start_offset_days),
        durationDays: Number(row.duration_days ?? primary.durationDays),
        outputPerHa,
        outputUnit: row.output_unit,
        revenuePerHa,
        costPerHa,
      }
    })
    const cropIds = components.flatMap((component) =>
      component.cropId === undefined ? [] : [component.cropId]
    )
    const extraDuration = Math.max(
      primary.durationDays,
      ...components.map((component) => component.startOffsetDays + component.durationDays)
    )
    const profitPerHa = components.reduce(
      (sum, component) => sum + component.revenuePerHa - component.costPerHa,
      0
    )
    candidates.push({
      ...primary,
      key: `system:${system.farming_system_id}`,
      name: system.name,
      cropIds,
      cropFamilies: [
        ...new Set(
          componentRows.flatMap((row) => (row.botanical_family ? [row.botanical_family] : []))
        ),
      ],
      durationDays: extraDuration,
      profitPerHa,
      farmingSystem: {
        id: Number(system.farming_system_id),
        type: system.system_type,
        timingPattern: system.timing_pattern,
        spatialPattern: system.spatial_pattern,
        evidenceStatus: 'eligible',
        managementNote: system.management_note,
        components,
      },
    })
  }
  return { enabled: true, candidates, assessments }
}

export async function generateResearchIdeas(baseCandidates: Candidate[], limit = 20) {
  const ideas: ResearchIdea[] = []
  const crops = [...new Map(baseCandidates.map((candidate) => [candidate.id, candidate])).values()]
  for (let first = 0; first < crops.length && ideas.length < limit; first++)
    for (let second = first + 1; second < crops.length && ideas.length < limit; second++)
      ideas.push({
        name: `${crops[first].name} + ${crops[second].name}`,
        systemType: 'intercrop',
        components: [crops[first].name, crops[second].name],
        missingEvidence: [
          'reviewed compatibility and layout',
          'interaction yield evidence',
          'current local component economics',
        ],
      })

  const companions = await db
    .from('companion_components')
    .select('name', 'component_type')
    .orderBy('companion_component_id')
  const systemType: Record<string, string> = {
    fish: 'crop_aquaculture',
    livestock: 'crop_livestock',
    tree: 'agroforestry',
    pollinator: 'crop_pollinator',
  }
  for (const crop of crops)
    for (const companion of companions) {
      if (ideas.length >= limit) break
      ideas.push({
        name: `${crop.name} + ${companion.name}`,
        systemType: systemType[companion.component_type],
        components: [crop.name, companion.name],
        missingEvidence: [
          'reviewed compatibility and management requirements',
          'location-specific output evidence',
          'current local component economics',
        ],
      })
    }
  return ideas
}

export function componentDates(candidate: Candidate, plantingDate: string) {
  return (candidate.farmingSystem?.components ?? []).map((component) => {
    const startDate = addDays(plantingDate, component.startOffsetDays)
    return {
      ...component,
      startDate,
      endDate: addDays(startDate, component.durationDays),
    }
  })
}
