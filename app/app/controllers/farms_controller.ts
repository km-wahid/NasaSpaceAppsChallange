import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'

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
      'priorities',
    ])
    const keys = [
      'climateWeight',
      'waterWeight',
      'soilWeight',
      'resilienceWeight',
      'economicWeight',
    ] as const
    const weights = keys.map((key) => Number(input.priorities?.[key]))
    if (weights.reduce((sum, weight) => sum + Math.round(weight * 100), 0) !== 10000)
      return response.unprocessableEntity({
        error: 'Use priorities with at most two decimal places, totaling 100%.',
      })
    if (
      weights.some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 100) ||
      weights.reduce((a, b) => a + b, 0) !== 100
    )
      return response.unprocessableEntity({ error: 'Please set priorities totaling 100%.' })
    if (!/^\d+$/.test(String(input.districtId)) || !Number.isSafeInteger(Number(input.districtId)))
      return response.unprocessableEntity({ error: 'INVALID_FARM' })
    const district = await db.from('districts').where('district_id', input.districtId).first()
    if (!district) return response.unprocessableEntity({ error: 'Select a supported district.' })
    for (const [key, min, max] of [
      ['areaHectares', 0.001, 1000000],
      ['latitude', -90, 90],
      ['longitude', -180, 180],
      ['irrigationAvailableMmPerSeason', 0, 100000],
      ['minimumTurnaroundDays', 0, 45],
    ] as const) {
      if (
        input[key] !== undefined &&
        input[key] !== null &&
        (!Number.isFinite(Number(input[key])) ||
          Number(input[key]) < min ||
          Number(input[key]) > max)
      )
        return response.unprocessableEntity({ error: `Invalid ${key}. Leave it blank if unknown.` })
    }
    if (
      (input.latitude === null || input.latitude === undefined) !==
      (input.longitude === null || input.longitude === undefined)
    )
      return response.unprocessableEntity({
        error: 'Provide both coordinates or leave both blank.',
      })
    if (
      input.minimumTurnaroundDays !== null &&
      input.minimumTurnaroundDays !== undefined &&
      !Number.isInteger(Number(input.minimumTurnaroundDays))
    )
      return response.unprocessableEntity({
        error: 'Land preparation days must be a whole number.',
      })
    if (input.name !== undefined && (typeof input.name !== 'string' || input.name.length > 100))
      return response.unprocessableEntity({ error: 'Farm name must be at most 100 characters.' })
    const farm = await db.transaction(async (trx) => {
      const [created] = await trx
        .table('farms')
        .insert({
          user_id: auth.user!.id,
          district_id: input.districtId,
          name:
            input.name?.trim() || `${district.district_name} farm · ${randomUUID().slice(0, 8)}`,
          area_hectares: input.areaHectares ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          irrigation_available_mm_per_season: input.irrigationAvailableMmPerSeason ?? null,
          water_source: input.waterSource,
          minimum_turnaround_days: input.minimumTurnaroundDays ?? 10,
        })
        .returning('*')
      await trx.table('farmer_preferences').insert({
        farm_id: created.farm_id,
        ...Object.fromEntries(
          keys.map((key, i) => [
            `${key.replace('Weight', '')}_weight_bp`,
            Math.round(weights[i] * 100),
          ])
        ),
      })
      return created
    })
    return response.created(farm)
  }

  async show({ auth, params, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    return farm ? response.ok(farm) : response.notFound({ error: 'FARM_NOT_FOUND' })
  }

  async details({ auth, params, request, response }: HttpContext) {
    const farm = await db
      .from('farms')
      .where({ farm_id: params.id, user_id: auth.user!.id })
      .first()
    if (!farm) return response.notFound({ error: 'FARM_NOT_FOUND' })
    const fields = {
      areaHectares: ['area_hectares', 0.001, 1000000],
      latitude: ['latitude', -90, 90],
      longitude: ['longitude', -180, 180],
      irrigationAvailableMmPerSeason: ['irrigation_available_mm_per_season', 0, 100000],
    } as const
    const input = request.only(Object.keys(fields))
    const update: Record<string, number | null> = {}
    for (const [key, [column, min, max]] of Object.entries(fields)) {
      if (input[key] === undefined) continue
      const value = input[key] === null ? null : Number(input[key])
      if (
        value !== null &&
        (input[key] === '' || !Number.isFinite(value) || value < min || value > max)
      )
        return response.unprocessableEntity({ error: `Invalid ${key}. Leave it blank if unknown.` })
      update[column] = value
    }
    if (!Object.keys(update).length)
      return response.unprocessableEntity({ error: 'No farm details provided.' })
    const latitude = Object.hasOwn(update, 'latitude') ? update.latitude : farm.latitude
    const longitude = Object.hasOwn(update, 'longitude') ? update.longitude : farm.longitude
    if ((latitude === null) !== (longitude === null))
      return response.unprocessableEntity({
        error: 'Provide both coordinates or leave both blank.',
      })
    const updated = await db.transaction(async (trx) => {
      const [row] = await trx
        .from('farms')
        .where('farm_id', farm.farm_id)
        .update(update)
        .returning('*')
      if (
        String(latitude) !== String(farm.latitude) ||
        String(longitude) !== String(farm.longitude)
      )
        await trx
          .from('farm_environment_profiles')
          .where('farm_id', farm.farm_id)
          .update({
            feature_values: trx.raw(
              'feature_values || \'{"invalidatedForLocationChange":true}\'::jsonb'
            ),
          })
      return row
    })
    return response.ok(updated)
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
