import db from '@adonisjs/lucid/services/db'

const systemTypes = new Set([
  'intercrop',
  'relay_crop',
  'border_crop',
  'crop_aquaculture',
  'crop_livestock',
  'agroforestry',
  'crop_pollinator',
  'silvopasture',
])
const componentTypes = new Set(['fish', 'livestock', 'tree', 'pollinator'])
const timingPatterns = new Set(['simultaneous', 'relay', 'overlapping', 'sequential'])
const spatialPatterns = new Set([
  'mixed',
  'alternate_rows',
  'strip',
  'border',
  'understorey',
  'shared_water',
])

export type ImportDocument = {
  sources: Array<Record<string, any>>
  companions?: Array<Record<string, any>>
  systems: Array<Record<string, any>>
}

const requiredText = (value: unknown, label: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`)
  return value.trim()
}

const nonNegative = (value: unknown, label: string) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be non-negative`)
  return number
}

export function validateIntegratedFarmingImport(document: ImportDocument) {
  if (!Array.isArray(document.sources) || !Array.isArray(document.systems))
    throw new Error('The import needs sources and systems arrays')
  const sourceKeys = new Set<string>()
  for (const source of document.sources) {
    const key = requiredText(source.key, 'source.key')
    if (sourceKeys.has(key)) throw new Error(`Duplicate source key: ${key}`)
    sourceKeys.add(key)
    requiredText(source.name, `${key}.name`)
    requiredText(source.organization, `${key}.organization`)
    requiredText(source.citation, `${key}.citation`)
  }
  const companionKeys = new Set<string>()
  for (const companion of document.companions ?? []) {
    const key = requiredText(companion.key, 'companion.key')
    if (companionKeys.has(key)) throw new Error(`Duplicate companion key: ${key}`)
    companionKeys.add(key)
    if (!componentTypes.has(companion.type))
      throw new Error(`Unsupported companion type: ${companion.type}`)
    requiredText(companion.name, `${key}.name`)
    if (!sourceKeys.has(companion.source)) throw new Error(`Unknown source: ${companion.source}`)
    requiredText(companion.reviewedAt, `${key}.reviewedAt`)
  }
  for (const system of document.systems) {
    requiredText(system.name, 'system.name')
    if (!systemTypes.has(system.type)) throw new Error(`Unsupported system type: ${system.type}`)
    if (!timingPatterns.has(system.timingPattern))
      throw new Error(`Unsupported timing pattern: ${system.timingPattern}`)
    if (!spatialPatterns.has(system.spatialPattern))
      throw new Error(`Unsupported spatial pattern: ${system.spatialPattern}`)
    if (!sourceKeys.has(system.source)) throw new Error(`Unknown source: ${system.source}`)
    if (
      !Array.isArray(system.components) ||
      system.components.length < 2 ||
      system.components.length > 3
    )
      throw new Error(`${system.name} must have two or three components`)
    if (
      system.components.filter((component: Record<string, any>) => component.role === 'primary')
        .length !== 1
    )
      throw new Error(`${system.name} must have exactly one primary component`)
    for (const component of system.components) {
      if (Boolean(component.cropName) === Boolean(component.companion))
        throw new Error(`${system.name} components need exactly one cropName or companion`)
      if (component.companion && !companionKeys.has(component.companion))
        throw new Error(`Unknown companion: ${component.companion}`)
      requiredText(component.outputUnit, `${system.name}.component.outputUnit`)
      nonNegative(component.expectedOutputPerHa, `${system.name}.component.expectedOutputPerHa`)
      nonNegative(component.marketPriceBdtPerUnit, `${system.name}.component.marketPriceBdtPerUnit`)
      nonNegative(component.variableCostBdtPerHa, `${system.name}.component.variableCostBdtPerHa`)
      nonNegative(
        component.annualizedSetupCostBdtPerHa,
        `${system.name}.component.annualizedSetupCostBdtPerHa`
      )
      if (!sourceKeys.has(component.economicSource))
        throw new Error(`Unknown economic source: ${component.economicSource}`)
    }
    for (const requirement of system.requirements ?? []) {
      requiredText(requirement.metric, `${system.name}.requirement.metric`)
      if (!['minimum', 'maximum', 'equals'].includes(requirement.comparator))
        throw new Error(`Unsupported requirement comparator: ${requirement.comparator}`)
      if (!sourceKeys.has(requirement.source))
        throw new Error(`Unknown requirement source: ${requirement.source}`)
      const values = [
        requirement.numberValue,
        requirement.booleanValue,
        requirement.textValue,
      ].filter((value) => value !== undefined && value !== null)
      if (values.length !== 1) throw new Error(`${system.name} requirements need exactly one value`)
    }
  }
}

export async function importIntegratedFarming(document: ImportDocument) {
  validateIntegratedFarmingImport(document)
  return db.transaction(async (trx) => {
    const sources = new Map<string, number>()
    for (const source of document.sources) {
      let row = source.url
        ? await trx.from('data_sources').where('url', source.url).first()
        : await trx
            .from('data_sources')
            .where({ name: source.name, organization: source.organization })
            .first()
      if (!row)
        [row] = await trx
          .table('data_sources')
          .insert({
            name: source.name,
            organization: source.organization,
            document_title: source.documentTitle,
            publication_date: source.publicationDate,
            url: source.url,
            citation: source.citation,
            page_or_table: source.pageOrTable,
            notes: source.notes,
          })
          .returning('*')
      sources.set(source.key, Number(row.source_id))
    }
    const companions = new Map<string, number>()
    for (const companion of document.companions ?? []) {
      const [row] = await trx
        .table('companion_components')
        .insert({
          component_type: companion.type,
          name: companion.name,
          output_unit: companion.outputUnit,
          source_id: sources.get(companion.source),
          reviewed_at: companion.reviewedAt,
        })
        .onConflict(['component_type', 'name'])
        .merge()
        .returning('*')
      companions.set(companion.key, Number(row.companion_component_id))
    }
    for (const system of document.systems) {
      const season = system.season
        ? await trx.from('seasons').where('season_name', system.season).first()
        : null
      const district = system.district
        ? await trx.from('districts').where('district_name', system.district).first()
        : null
      if (system.season && !season) throw new Error(`Unknown season: ${system.season}`)
      if (system.district && !district) throw new Error(`Unknown district: ${system.district}`)
      const cropNames = system.components.flatMap((component: Record<string, any>) =>
        component.cropName ? [component.cropName] : []
      )
      const cropRows = cropNames.length
        ? await trx.from('crops').whereIn('crop_name', cropNames)
        : []
      if (cropRows.length !== new Set(cropNames).size)
        throw new Error(`${system.name} references an unknown crop`)
      const cropIds = new Map(cropRows.map((crop) => [crop.crop_name, Number(crop.crop_id)]))
      const primary = system.components.find(
        (component: Record<string, any>) => component.role === 'primary'
      )
      if (!primary.cropName) throw new Error(`${system.name} primary component must be a crop`)
      const scope = {
        name: system.name,
        season_id: season?.season_id ?? null,
        district_id: district?.district_id ?? null,
      }
      let saved = await trx.from('farming_systems').where(scope).first()
      const values = {
        ...scope,
        system_type: system.type,
        timing_pattern: system.timingPattern,
        spatial_pattern: system.spatialPattern,
        primary_crop_id: cropIds.get(primary.cropName),
        source_id: sources.get(system.source),
        reviewed_at: system.reviewedAt,
        valid_from: system.validFrom,
        valid_to: system.validTo,
        management_note: requiredText(system.managementNote, `${system.name}.managementNote`),
      }
      if (saved)
        [saved] = await trx
          .from('farming_systems')
          .where('farming_system_id', saved.farming_system_id)
          .update(values)
          .returning('*')
      else [saved] = await trx.table('farming_systems').insert(values).returning('*')
      await trx
        .from('farming_system_components')
        .where('farming_system_id', saved.farming_system_id)
        .delete()
      await trx
        .from('farming_system_requirements')
        .where('farming_system_id', saved.farming_system_id)
        .delete()
      await trx.table('farming_system_components').multiInsert(
        system.components.map((component: Record<string, any>) => ({
          farming_system_id: saved.farming_system_id,
          crop_id: component.cropName ? cropIds.get(component.cropName) : null,
          companion_component_id: component.companion ? companions.get(component.companion) : null,
          role: component.role,
          start_offset_days: component.startOffsetDays ?? 0,
          duration_days: component.durationDays,
          area_share_percent: component.areaSharePercent,
          expected_output_per_hectare: component.expectedOutputPerHa,
          output_unit: component.outputUnit,
          market_price_bdt_per_unit: component.marketPriceBdtPerUnit,
          variable_cost_bdt_per_hectare: component.variableCostBdtPerHa,
          annualized_setup_cost_bdt_per_hectare: component.annualizedSetupCostBdtPerHa,
          economic_source_id: sources.get(component.economicSource),
          uncertainty_note: component.uncertaintyNote,
        }))
      )
      if (system.requirements?.length)
        await trx.table('farming_system_requirements').multiInsert(
          system.requirements.map((requirement: Record<string, any>) => ({
            farming_system_id: saved.farming_system_id,
            metric_key: requirement.metric,
            comparator: requirement.comparator,
            number_value: requirement.numberValue,
            boolean_value: requirement.booleanValue,
            text_value: requirement.textValue,
            unit: requirement.unit,
            mandatory: requirement.mandatory ?? true,
            source_id: sources.get(requirement.source),
          }))
        )
    }
    return { sources: sources.size, companions: companions.size, systems: document.systems.length }
  })
}
