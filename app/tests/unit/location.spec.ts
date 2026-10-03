import { test } from '@japa/runner'
import { extractLocation, validCoordinates } from '#services/location_service'

const districts = [
  { district_id: 1, district_name: 'Dhaka' },
  { district_id: 2, district_name: 'Bogura' },
  { district_id: 3, district_name: 'Chattogram' },
]

test('location parser handles Bangladesh address variants without assuming county is a district', ({
  assert,
}) => {
  for (const key of ['county', 'state_district', 'city', 'town', 'municipality']) {
    const parsed = extractLocation(
      {
        address: {
          [key]: 'Dhaka District',
          country_code: 'bd',
          country: 'Bangladesh',
          state: 'Dhaka Division',
        },
      },
      districts
    )
    assert.equal(parsed.district, 'Dhaka')
    assert.equal(parsed.districtId, '1')
    assert.equal(parsed.division, 'Dhaka Division')
    assert.equal(parsed.country, 'Bangladesh')
  }
  assert.equal(
    extractLocation(
      {
        address: { county: 'Savar Upazila', state_district: 'Dhaka District', country_code: 'bd' },
      },
      districts
    ).district,
    'Dhaka'
  )
  assert.equal(
    extractLocation({ address: { county: 'Bogra Zila', country_code: 'bd' } }, districts).district,
    'Bogura'
  )
  assert.equal(
    extractLocation({ address: { city: 'Chittagong', country_code: 'bd' } }, districts).district,
    'Chattogram'
  )
  assert.isNull(
    extractLocation({ address: { state: 'Dhaka', country_code: 'bd' } }, districts).district
  )
  assert.isNull(
    extractLocation({ address: { town: 'Savar', country_code: 'bd' } }, districts).district
  )
  assert.isNull(
    extractLocation({ address: { city: 'Dhaka', country_code: 'in' } }, districts).districtId
  )
  assert.isNull(extractLocation({ address: {} }, districts).district)
  assert.throws(() => extractLocation(null, districts), 'INVALID_GEOCODING_RESPONSE')
})

test('location coordinates reject missing, non-numeric and out-of-range input', ({ assert }) => {
  assert.isTrue(validCoordinates(23.8, 90.4))
  assert.isTrue(validCoordinates(0, 0))
  for (const [lat, lon] of [
    [null, 90],
    ['', 90],
    ['23', 90],
    [Number.NaN, 90],
    [91, 0],
    [0, -181],
    [Infinity, 0],
  ]) {
    assert.isFalse(validCoordinates(lat, lon))
  }
})

test('Nominatim proxy caches, limits starts, identifies itself and handles failure/backoff', async ({
  assert,
}) => {
  // A separate module instance keeps the virtual-clock cooldown out of later integration tests.
  const { reverseGeocode, LocationError } = await import(
    new URL('../../app/services/location_service.ts?proxy-unit-test', import.meta.url).href
  )
  const originalFetch = globalThis.fetch
  const originalNow = Date.now
  let now = originalNow()
  let calls = 0
  let status = 200
  let fail = false
  Date.now = () => now
  globalThis.fetch = async (input, options) => {
    calls++
    const url = new URL(String(input))
    assert.equal(url.pathname, '/reverse')
    assert.equal(url.searchParams.get('format'), 'jsonv2')
    assert.equal(url.searchParams.get('accept-language'), 'en')
    assert.include(new Headers(options?.headers).get('User-Agent')!, 'ORBIT-Crop-Rotation')
    if (fail) throw new Error('simulated network failure')
    return new Response(
      JSON.stringify({ address: { county: 'Dhaka District', country_code: 'bd' } }),
      {
        status,
        headers: { 'Retry-After': '120' },
      }
    )
  }
  const expectError = async (lat: number, code: string) => {
    try {
      await reverseGeocode(lat, 90)
      assert.fail('Expected location error')
    } catch (error) {
      assert.instanceOf(error, LocationError)
      assert.equal((error as { code: string }).code, code)
    }
  }
  try {
    await reverseGeocode(23, 90)
    await reverseGeocode(23, 90)
    assert.equal(calls, 1)
    await expectError(24, 'LOCATION_BUSY')
    now += 1200
    fail = true
    await expectError(24, 'GEOCODING_FAILED')
    now += 1200
    fail = false
    status = 429
    await expectError(24, 'LOCATION_BUSY')
    now += 61000
    const before = calls
    await expectError(24, 'LOCATION_BUSY')
    assert.equal(calls, before)
    now += 60000
    status = 404
    assert.deepEqual(await reverseGeocode(24, 90), { address: {} })
    await reverseGeocode(24, 90)
    assert.equal(calls, before + 1)
    await expectError(91, 'INVALID_COORDINATES')
  } finally {
    globalThis.fetch = originalFetch
    Date.now = originalNow
  }
})
