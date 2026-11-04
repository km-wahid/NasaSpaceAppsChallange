import { buildClimateHistory, warmingTrendPerDecade } from '#services/public_climate_service'
import { test } from '@japa/runner'

test.group('Public NASA climate history', () => {
  test('converts monthly rainfall rates into totals and keeps missing values honest', ({
    assert,
  }) => {
    const t2m: Record<string, number> = {}
    const maximum: Record<string, number> = {}
    const rain: Record<string, number> = {}
    for (let month = 1; month <= 12; month++) {
      const key = `2024${String(month).padStart(2, '0')}`
      t2m[key] = 20 + month
      maximum[key] = 30 + month
      rain[key] = 2
    }
    maximum['202413'] = 44
    rain['202402'] = -999
    const result = buildClimateHistory(
      { properties: { parameter: { T2M: t2m, T2M_MAX: maximum, PRECTOTCORR: rain } } },
      24.85,
      89.37,
      2024,
      2024,
      new Date('2026-01-01T00:00:00Z')
    )

    assert.equal(result.months[0].rainfallMm, 62)
    assert.isNull(result.months[1].rainfallMm)
    assert.isNull(result.years[0].rainfallMm)
    assert.equal(result.years[0].maximumTemperatureC, 44)
  })

  test('calculates a deterministic temperature trend per decade', ({ assert }) => {
    const years = [2021, 2022, 2023, 2024].map((year, index) => ({
      year,
      meanTemperatureC: 24 + index * 0.1,
      maximumTemperatureC: null,
      rainfallMm: null,
    }))
    assert.equal(warmingTrendPerDecade(years), 1)
  })
})
