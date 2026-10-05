import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { HttpContext } from '@adonisjs/core/http'
import FarmerAnalysisController from '#controllers/farmer_analysis_controller'
import LocationController from '#controllers/location_controller'
import RecommendationsController from '#controllers/recommendations_controller'
import FarmsController from '#controllers/farms_controller'
import BangladeshCropSeeder from '../../database/seeders/bangladesh_crop_seeder.js'

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
        params: { id: farm.farm_id },
        auth: { user: userId === null ? undefined : { id: userId } },
        request: { only: () => ({ ...input }), input: (key: string) => input[key] },
        response: {
          header: () => {},
          ok: (data: unknown) => send(200, data),
          created: (data: unknown) => send(201, data),
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
      assert.equal(payload.planning.status, 'preferences_missing')
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

      await new FarmsController().store(
        context(first.id, {
          districtId: district.district_id,
          priorities: {
            climateWeight: 15,
            waterWeight: 20,
            soilWeight: 25,
            resilienceWeight: 10,
            economicWeight: 30,
          },
        })
      )
      assert.equal(status, 201)
      const minimalFarm = payload
      assert.isNull(minimalFarm.area_hectares)
      assert.isNull(minimalFarm.latitude)
      assert.isNull(minimalFarm.longitude)
      assert.isNull(minimalFarm.irrigation_available_mm_per_season)
      assert.equal(minimalFarm.minimum_turnaround_days, 10)
      const minimalPreferences = await db
        .from('farmer_preferences')
        .where('farm_id', minimalFarm.farm_id)
        .firstOrFail()
      assert.equal(minimalPreferences.soil_weight_bp, 2500)
      await controller.analyze(
        context(first.id, { districtId: district.district_id, farmId: minimalFarm.farm_id })
      )
      assert.equal(status, 200)
      assert.equal(payload.water.label, 'Not provided')
      assert.equal(payload.planning.status, 'ready')
      assert.lengthOf(payload.plans, 3)
      assert.isTrue(payload.plans.every((plan: any) => plan.fit === 'Season-based guidance'))
      assert.isTrue(
        payload.plans.some((plan: any) =>
          plan.crops.some(
            (crop: any) => crop.name === 'Mug' && crop.soilContribution === 'Potential soil support'
          )
        )
      )
      const countsBefore = await db.from('crop_calendar_windows').count('* as count').first()
      await new BangladeshCropSeeder(db.connection()).run()
      await new BangladeshCropSeeder(db.connection()).run()
      const countsAfter = await db.from('crop_calendar_windows').count('* as count').first()
      assert.equal(countsAfter!.count, countsBefore!.count)
      await new FarmsController().details(context(second.id, { areaHectares: 2 }))
      assert.equal(status, 404)
      await new FarmsController().details(context(first.id, { longitude: null }))
      assert.equal(status, 422)
      await new FarmsController().details(
        context(first.id, { areaHectares: 2, irrigationAvailableMmPerSeason: 0 })
      )
      assert.equal(status, 200)
      assert.equal(Number(payload.area_hectares), 2)
      assert.equal(Number(payload.irrigation_available_mm_per_season), 0)

      // Test-only records roll back with this transaction. Never mark a selection as planted.
      const version = await db.from('engine_versions').where('is_active', true).firstOrFail()
      const [preference] = await db
        .table('farmer_preferences')
        .insert({
          farm_id: farm.farm_id,
          climate_weight_bp: 2000,
          water_weight_bp: 2000,
          soil_weight_bp: 2000,
          resilience_weight_bp: 2000,
          economic_weight_bp: 2000,
        })
        .returning('preference_id')
      const [run] = await db
        .table('recommendation_runs')
        .insert({
          farm_id: farm.farm_id,
          preference_id: preference.preference_id,
          engine_version_id: version.engine_version_id,
          start_season_id: season.season_id,
          status: 'completed',
          input_snapshot: '{}',
          input_checksum: 'a'.repeat(64),
        })
        .returning('recommendation_run_id')
      for (const rank of [1, 2])
        await db.table('rotation_recommendations').insert({
          recommendation_run_id: run.recommendation_run_id,
          rank,
          overall_score: 50,
          climate_score: 50,
          water_score: 50,
          soil_score: 50,
          resilience_score: 50,
          economic_score: 50,
          compatibility_score: 50,
          diversity_score: 50,
          total_water_requirement_mm: 0,
          total_profit_bdt: 0,
          evidence_completeness_percent: 0,
        })
      const recommendations = new RecommendationsController()
      await recommendations.choice(context(first.id, {}))
      assert.isNull(payload)
      await recommendations.choose(context(first.id, { runId: run.recommendation_run_id, rank: 1 }))
      assert.equal(status, 200)
      assert.equal(payload.rank, 1)
      await recommendations.choose(
        context(second.id, { runId: run.recommendation_run_id, rank: 2 })
      )
      assert.equal(status, 404)
      await recommendations.choice(context(second.id, {}))
      assert.equal(status, 404)
      await recommendations.choose(context(first.id, { runId: run.recommendation_run_id, rank: 2 }))
      assert.equal(status, 200)
      await recommendations.choice(context(first.id, {}))
      assert.equal(payload.rank, 2)
      assert.equal(String(payload.runId), String(run.recommendation_run_id))
      assert.lengthOf(await db.from('farm_rotation_choices').where('farm_id', farm.farm_id), 1)
      await recommendations.choose(context(first.id, { runId: run.recommendation_run_id, rank: 4 }))
      assert.equal(status, 422)
      assert.lengthOf(await db.from('farm_crop_history').where('farm_id', farm.farm_id), 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
