import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import type { HttpContext } from '@adonisjs/core/http'
import LocationController from '#controllers/location_controller'

test.group('saved user location', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('persists detected coordinates and manual district changes only for the session user', async ({
    assert,
  }) => {
    const [first, second] = await db
      .table('users')
      .multiInsert([
        { email: 'location-first@example.invalid', password: 'test', created_at: new Date() },
        { email: 'location-second@example.invalid', password: 'test', created_at: new Date() },
      ])
      .returning('id')
    const [division] = await db
      .table('divisions')
      .insert({ division_name: 'Location Test Division' })
      .returning('division_id')
    const [district] = await db
      .table('districts')
      .insert({
        division_id: division.division_id,
        district_name: 'Location Test District',
        latitude: 23.8,
        longitude: 90.4,
        agro_ecological_zone: 'Test',
      })
      .returning('district_id')
    let payload: unknown
    let status = 200
    const context = (userId: number | null, input: Record<string, unknown> = {}) =>
      ({
        auth: { user: userId === null ? undefined : { id: userId } },
        request: { input: (key: string) => input[key], only: () => input },
        response: {
          header: () => {},
          ok: (value: unknown) => {
            payload = value
            return value
          },
          unprocessableEntity: (value: unknown) => {
            status = 422
            payload = value
          },
          notFound: (value: unknown) => {
            status = 404
            payload = value
          },
        },
      }) as unknown as HttpContext
    const controller = new LocationController()
    const originalFetch = globalThis.fetch
    let lookups = 0
    globalThis.fetch = async () => {
      lookups++
      return new Response(
        JSON.stringify({
          address: { county: 'Location Test District', country_code: 'bd', country: 'Bangladesh' },
        })
      )
    }
    try {
      await controller.show(context(second.id))
      assert.isNull(payload)
      await controller.reverse(
        context(first.id, { latitude: 23.8001, longitude: 90.4001, userId: second.id })
      )
      await controller.show(context(first.id))
      assert.properties(payload, ['districtId', 'latitude', 'longitude'])
      assert.equal((payload as any).latitude, 23.8001)
      assert.equal((payload as any).districtId, String(district.district_id))
      assert.equal(lookups, 1)
      await controller.show(context(second.id))
      assert.isNull(payload)
      await controller.update(
        context(second.id, { districtId: district.district_id, userId: first.id })
      )
      await controller.show(context(second.id))
      assert.isNull((payload as any).latitude)
      assert.equal((payload as any).district, 'Location Test District')
      await controller.show(context(first.id))
      assert.equal((payload as any).latitude, 23.8001)
      await controller.update(context(first.id, { districtId: district.district_id }))
      await controller.show(context(first.id))
      assert.isNull((payload as any).latitude)
      assert.equal(lookups, 1)
      await controller.update(context(first.id, { districtId: 'invalid' }))
      assert.equal(status, 422)
      // Guest detection can reuse a cached result but must not write account preferences.
      await controller.reverse(context(null, { latitude: 23.8001, longitude: 90.4001 }))
      const count = await db
        .from('user_locations')
        .whereIn('user_id', [first.id, second.id])
        .count('* as total')
        .first()
      assert.equal(Number(count.total), 2)
      await db.from('users').where('id', first.id).delete()
      assert.isNull(await db.from('user_locations').where('user_id', first.id).first())
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
