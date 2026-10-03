import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { HttpContext } from '@adonisjs/core/http'
import FarmerAnalysisController from '#controllers/farmer_analysis_controller'
import LocationController from '#controllers/location_controller'

test.group('farmer analysis endpoint', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  test('reads stored patterns, saves only this user’s water choice, and guards farm ownership', async ({
    assert,
  }) => {
    const [division] = await db
      .table('divisions')
      .insert({ division_name: 'Analysis fixture division' })
      .returning('division_id')
    const [district] = await db
      .table('districts')
      .insert({
        division_id: division.division_id,
        district_name: 'Analysis fixture district',
        latitude: 25.7,
        longitude: 89.3,
        agro_ecological_zone: 'Fixture',
      })
      .returning('district_id')
    const [batch] = await db
      .table('import_batches')
      .insert({
        source_filename: 'test-fixture-only',
        source_sha256: 'f'.repeat(64),
        source_row_count: 1,
        reporting_year: 2025,
      })
      .returning('batch_id')
    const existingSeason = await db.from('seasons').where('season_name', 'Kharif 2').first()
    let season = existingSeason
    if (!season) {
      const [created] = await db
        .table('seasons')
        .insert({ season_name: 'Kharif 2', description: 'Test fixture only' })
        .returning('season_id')
      season = created
    }
    await db.table('district_season_climate').insert({
      batch_id: batch.batch_id,
      district_id: district.district_id,
      season_id: season.season_id,
      rainfall_mm: 900,
      average_solar_radiation: 4,
      average_wind_speed: 2,
      average_evapotranspiration: 3,
    })
    const [first, second] = await db
      .table('users')
      .multiInsert([
        { email: 'analysis-first@example.invalid', password: 'test', created_at: new Date() },
        { email: 'analysis-second@example.invalid', password: 'test', created_at: new Date() },
      ])
      .returning('id')
    const [farm] = await db
      .table('farms')
      .insert({
        user_id: first.id,
        district_id: district.district_id,
        name: 'Test farm',
        area_hectares: 1,
        latitude: 25.7,
        longitude: 89.3,
        irrigation_available_mm_per_season: 180,
      })
      .returning('farm_id')
    let status = 200
    let payload: any
    const send = (code: number, data: unknown) => {
      status = code
      payload = data
      return data
    }
    const context = (userId: number | null, input: Record<string, unknown>) =>
      ({
        auth: { user: userId === null ? undefined : { id: userId } },
        request: { only: () => ({ ...input }), input: (key: string) => input[key] },
        response: {
          header: () => {},
          ok: (data: unknown) => send(200, data),
          unprocessableEntity: (data: unknown) => send(422, data),
          notFound: (data: unknown) => send(404, data),
          unauthorized: (data: unknown) => send(401, data),
        },
      }) as unknown as HttpContext
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () => {
      throw new Error('Analyze must not refresh NASA data or geocode a selected district')
    }
    try {
      const controller = new FarmerAnalysisController()
      await controller.analyze(
        context(null, { districtId: district.district_id, waterAvailability: 'medium' })
      )
      assert.equal(status, 200)
      assert.equal(payload.water.label, 'Moderate')
      assert.equal(payload.water.series[6].level, 'Moderate')
      assert.isNull(payload.water.series[0].index)
      assert.deepEqual(payload.plans, [])
      assert.equal(payload.planning.status, 'needs-farm')
      await new LocationController().update(context(first.id, { districtId: district.district_id }))
      await new LocationController().update(
        context(second.id, { districtId: district.district_id })
      )
      await controller.analyze(
        context(first.id, {
          districtId: district.district_id,
          waterAvailability: 'low',
          userId: second.id,
        })
      )
      const savedFirst = await db.from('user_locations').where('user_id', first.id).first()
      const savedSecond = await db.from('user_locations').where('user_id', second.id).first()
      assert.equal(savedFirst.water_availability, 'low')
      assert.isNull(savedSecond.water_availability)
      await controller.analyze(
        context(first.id, {
          districtId: district.district_id,
          waterAvailability: 'low',
          farmId: farm.farm_id,
        })
      )
      assert.equal(payload.planning.status, 'environment_profile_missing')
      assert.deepEqual(payload.plans, [])
      const savedFarm = await db.from('farms').where('farm_id', farm.farm_id).first()
      assert.equal(Number(savedFarm.irrigation_available_mm_per_season), 180)
      await controller.analyze(
        context(second.id, {
          districtId: district.district_id,
          waterAvailability: 'medium',
          farmId: farm.farm_id,
        })
      )
      assert.equal(status, 404)
      await controller.analyze(
        context(null, {
          districtId: district.district_id,
          waterAvailability: 'medium',
          farmId: farm.farm_id,
        })
      )
      assert.equal(status, 401)
      await controller.analyze(
        context(first.id, { districtId: district.district_id, waterAvailability: 'bogus' })
      )
      assert.equal(status, 422)
      await controller.analyze(
        context(first.id, {
          districtId: district.district_id,
          waterAvailability: 'low',
          latitude: 100,
          longitude: 89,
        })
      )
      assert.equal(status, 422)
      await new LocationController().update(context(first.id, { districtId: district.district_id }))
      const changedLocation = await db.from('user_locations').where('user_id', first.id).first()
      assert.isNull(changedLocation.water_availability)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
