import { deriveSeasonFeatures, hasCurrentSeasonFeatures } from '#services/nasa_power_service'
import { test } from '@japa/runner'

test.group('NASA POWER seasonal features', () => {
  test('derives rainfall, dry-spell and temperature evidence without treating missing rain as zero', ({
    assert,
  }) => {
    const observations = [
      ['2025-07-01', 27, 22, 32, 0],
      ['2025-07-02', 28, 23, 34, 0.5],
      ['2025-07-03', 29, 24, 35, 10],
      ['2025-07-04', 30, 25, 36, null],
      ['2026-07-01', 26, 21, 31, 2],
      ['2026-07-02', 27, 22, 33, 3],
      ['2026-07-03', 28, 23, 34, 4],
    ].map(([observation_date, t2m_c, t2m_min_c, t2m_max_c, precipitation_mm]) => ({
      observation_date: String(observation_date),
      t2m_c: Number(t2m_c),
      t2m_min_c: Number(t2m_min_c),
      t2m_max_c: Number(t2m_max_c),
      precipitation_mm: precipitation_mm === null ? null : Number(precipitation_mm),
    }))

    const result = deriveSeasonFeatures(observations, [7], 'Kharif 2')!

    assert.equal(result.featureMethodVersion, 'power-seasonal-v2')
    assert.equal(result.longestDrySpellP90Days, 1.8)
    assert.equal(result.maximumThreeDayRainP95Mm, 10.425)
    assert.equal(result.minimumTemperatureC, 21)
    assert.equal(result.maximumTemperatureC, 36)
    assert.equal(result.observationCount, 6)
  })

  test('refreshes cached profiles created by an older feature method', ({ assert }) => {
    assert.isFalse(
      hasCurrentSeasonFeatures(
        { 1: { rainMedianMm: 100 }, 2: { featureMethodVersion: 'power-seasonal-v2' } },
        [1, 2]
      )
    )
    assert.isTrue(
      hasCurrentSeasonFeatures(
        {
          1: { featureMethodVersion: 'power-seasonal-v2' },
          2: { featureMethodVersion: 'power-seasonal-v2' },
        },
        [1, 2]
      )
    )
  })

  test('accepts database Date objects when deriving cached observations', ({ assert }) => {
    const result = deriveSeasonFeatures(
      [
        {
          observation_date: new Date('2025-11-01T00:00:00Z'),
          t2m_c: 22,
          t2m_min_c: 16,
          t2m_max_c: 29,
          precipitation_mm: 4,
        },
      ],
      [11],
      'Rabi'
    )
    assert.equal(result?.observationCount, 1)
  })
})
