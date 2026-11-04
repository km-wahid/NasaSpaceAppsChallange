import { buildRegionalClimateMap } from '#services/regional_climate_service'
import { test } from '@japa/runner'

test.group('NASA POWER regional climate map', () => {
  test('joins matching grid points and converts rainfall rate to a monthly total', ({ assert }) => {
    const result = buildRegionalClimateMap(
      {
        features: [
          {
            geometry: { coordinates: [90, 24, 3] },
            properties: { parameter: { T2M: { '202401': 22.345, '202413': 26 } } },
          },
        ],
      },
      {
        features: [
          {
            geometry: { coordinates: [90, 24, 3] },
            properties: { parameter: { PRECTOTCORR: { '202401': 2, '202413': 5 } } },
          },
        ],
      },
      2024,
      2024,
      new Date('2026-01-01T00:00:00Z')
    )

    assert.deepEqual(result.points[0], {
      longitude: 90,
      latitude: 24,
      temperatureC: [22.34, ...Array(11).fill(null)],
      rainfallMm: [62, ...Array(11).fill(null)],
    })
    assert.equal(result.months[0], '202401')
    assert.equal(result.source.grid, '0.5° × 0.625°')
  })
})
