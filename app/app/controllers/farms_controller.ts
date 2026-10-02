import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'

export default class FarmsController {
  async inputs({ auth, params, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const [soil, history, preferences] = await Promise.all([
      db.from('farm_soil_profiles').where({ farm_id: params.id, is_current: true }).first(),
      db
        .from('farm_crop_history')
        .where('farm_id', params.id)
        .orderBy('crop_year', 'desc')
        .orderBy('season_id', 'desc'),
      db
        .from('farmer_preferences')
        .where('farm_id', params.id)
        .orderBy('preference_id', 'desc')
        .first(),
    ])
    const measurements = soil
      ? await db.from('farm_soil_measurements').where('soil_profile_id', soil.soil_profile_id)
      : []
    return response.ok({
      soil: soil ?? null,
      measurements,
      history,
      preferences: preferences ?? null,
    })
  }

  async index({ auth, response }: HttpContext) {
    return response.ok(
      await db.from('farms').where('user_id', auth.user!.id).orderBy('created_at', 'desc')
    )
  }

  async store({ auth, request, response }: HttpContext) {
    const input = request.only([
      'districtId',
      'name',
      'areaHectares',
      'latitude',
      'longitude',
      'irrigationAvailableMmPerSeason',
      'waterSource',
      'minimumTurnaroundDays',
    ])
    if (!input.name || !input.districtId || Number(input.areaHectares) <= 0)
      return response.unprocessableEntity({ error: 'INVALID_FARM' })
    const [farm] = await db
      .table('farms')
      .insert({
        user_id: auth.user!.id,
        district_id: input.districtId,
        name: input.name,
        area_hectares: input.areaHectares,
        latitude: input.latitude,
        longitude: input.longitude,
        irrigation_available_mm_per_season: input.irrigationAvailableMmPerSeason ?? 0,
        water_source: input.waterSource,
        minimum_turnaround_days: input.minimumTurnaroundDays ?? 10,
      })
      .returning('*')
    return response.created(farm)
  }

  async show({ auth, params, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    return farm ? response.ok(farm) : response.notFound({ error: 'FARM_NOT_FOUND' })
  }

  async preferences({ auth, params, request, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const values = request.only([
      'climateWeight',
      'waterWeight',
      'soilWeight',
      'resilienceWeight',
      'economicWeight',
    ])
    const weights = Object.values(values).map(Number)
    if (
      weights.length !== 5 ||
      weights.some((value) => value < 0) ||
      weights.reduce((a, b) => a + b, 0) !== 100
    )
      return response.unprocessableEntity({ error: 'WEIGHTS_MUST_TOTAL_100' })
    const [row] = await db
      .table('farmer_preferences')
      .insert({
        farm_id: params.id,
        climate_weight_bp: Number(values.climateWeight) * 100,
        water_weight_bp: Number(values.waterWeight) * 100,
        soil_weight_bp: Number(values.soilWeight) * 100,
        resilience_weight_bp: Number(values.resilienceWeight) * 100,
        economic_weight_bp: Number(values.economicWeight) * 100,
      })
      .returning('*')
    return response.ok(row)
  }

  async soil({ auth, params, request, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const input = request.only([
      'sampledAt',
      'ph',
      'organicMatterPercent',
      'texture',
      'sourceType',
      'laboratoryName',
      'notes',
      'nutrients',
    ])
    if (
      Number(input.ph) < 0 ||
      Number(input.ph) > 14 ||
      !Array.isArray(input.nutrients) ||
      input.nutrients.length !== 3
    )
      return response.unprocessableEntity({ error: 'INVALID_SOIL_PROFILE' })
    const normalized: Array<{
      nutrient: string
      value: number
      unit: string
      analyticalMethod: string
      thresholdSetId: number
      status: string
    }> = []
    for (const item of input.nutrients) {
      const thresholdSet = await db
        .from('soil_nutrient_threshold_sets')
        .where({
          threshold_set_id: item.thresholdSetId,
          analytical_method: item.analyticalMethod,
          unit: item.unit,
        })
        .first()
      if (!thresholdSet)
        return response.unprocessableEntity({
          error: 'NUTRIENT_METHOD_OR_UNIT_MISMATCH',
          nutrient: item.nutrient,
        })
      const threshold = await db
        .from('soil_nutrient_thresholds')
        .where({ threshold_set_id: item.thresholdSetId, nutrient: item.nutrient })
        .where((query) =>
          query.whereNull('minimum_value').orWhere('minimum_value', '<=', item.value)
        )
        .where((query) =>
          query.whereNull('maximum_value').orWhere('maximum_value', '>', item.value)
        )
        .first()
      if (!threshold)
        return response.unprocessableEntity({
          error: 'NUTRIENT_THRESHOLD_NOT_FOUND',
          nutrient: item.nutrient,
        })
      normalized.push({ ...item, status: threshold.status })
    }
    const profile = await db.transaction(async (trx) => {
      await trx
        .from('farm_soil_profiles')
        .where({ farm_id: params.id, is_current: true })
        .update({ is_current: false })
      const [created] = await trx
        .table('farm_soil_profiles')
        .insert({
          farm_id: params.id,
          sampled_at: input.sampledAt,
          ph: input.ph,
          organic_matter_percent: input.organicMatterPercent,
          texture: input.texture,
          source_type: input.sourceType,
          laboratory_name: input.laboratoryName,
          notes: input.notes,
          is_current: true,
        })
        .returning('*')
      await trx.table('farm_soil_measurements').multiInsert(
        normalized.map((item) => ({
          soil_profile_id: created.soil_profile_id,
          nutrient: item.nutrient,
          raw_value: item.value,
          unit: item.unit,
          analytical_method: item.analyticalMethod,
          normalized_status: item.status,
          threshold_set_id: item.thresholdSetId,
        }))
      )
      return created
    })
    return response.ok({ ...profile, nutrients: normalized })
  }

  async history({ auth, params, request, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const entries = request.input('entries')
    if (!Array.isArray(entries) || entries.length < 2)
      return response.unprocessableEntity({ error: 'AT_LEAST_TWO_HISTORY_SLOTS_REQUIRED' })
    await db.transaction(async (trx) => {
      for (const entry of entries) {
        await trx.rawQuery(
          `INSERT INTO farm_crop_history(farm_id,crop_id,season_id,crop_year,land_use_type,planting_date,harvest_date,yield_tonnes,notes) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(farm_id,crop_year,season_id) DO UPDATE SET crop_id=excluded.crop_id,land_use_type=excluded.land_use_type,planting_date=excluded.planting_date,harvest_date=excluded.harvest_date,yield_tonnes=excluded.yield_tonnes,notes=excluded.notes`,
          [
            params.id,
            entry.cropId ?? null,
            entry.seasonId,
            entry.cropYear,
            entry.landUseType,
            entry.plantingDate ?? null,
            entry.harvestDate ?? null,
            entry.yieldTonnes ?? null,
            entry.notes ?? null,
          ]
        )
      }
    })
    return response.ok(
      await db.from('farm_crop_history').where('farm_id', params.id).orderBy('crop_year', 'desc')
    )
  }

  async crops({ auth, params, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    return response.ok(
      await db
        .from('crops as crop')
        .join('crop_requirements as requirement', 'requirement.crop_id', 'crop.crop_id')
        .select('crop.crop_id', 'crop.crop_name', 'crop.crop_category', 'requirement.*')
        .orderBy('crop.crop_name')
    )
  }
}
