import {
  cropSoilEffectScore,
  recommendRotations,
  weightedScore,
  type Candidate,
} from '#services/rotation_engine'
import { test } from '@japa/runner'

const crop = (
  id: number,
  start: string,
  end: string,
  overrides: Partial<Candidate> = {}
): Candidate => ({
  id,
  name: `Crop ${id}`,
  family: `Family ${id}`,
  windowStart: start,
  windowEnd: end,
  durationDays: 70,
  waterRequirementMm: 300,
  profitPerHa: 100,
  scores: { climate: 80, water: 80, soil: 80, resilience: 80, economic: 80 },
  nutrientRequirements: { n: 'low', p: 'low', k: 'low' },
  ...overrides,
})

test.group('rotation engine', () => {
  test('calculates the documented weighted score', ({ assert }) => {
    assert.equal(
      weightedScore(
        { climate: 85, water: 75, soil: 90, resilience: 70, economic: 80 },
        { climate: 15, water: 20, soil: 25, resilience: 10, economic: 30 }
      ),
      81.25
    )
  })

  test('normalizes the full crop soil effect range', ({ assert }) => {
    assert.equal(cropSoilEffectScore(-100), 0)
    assert.equal(cropSoilEffectScore(0), 50)
    assert.equal(cropSoilEffectScore(100), 100)
  })

  test('checks turnaround and the repeating wrap-around transition', ({ assert }) => {
    const result = recommendRotations({
      slots: [
        {
          season: 'Kharif 2',
          candidates: [crop(1, '2026-07-01', '2026-07-15', { durationDays: 130 })],
        },
        { season: 'Rabi', candidates: [crop(2, '2026-11-01', '2026-11-10')] },
        {
          season: 'Kharif 1',
          candidates: [crop(3, '2027-03-01', '2027-03-20', { durationDays: 100 })],
        },
      ],
      weights: { climate: 20, water: 20, soil: 20, resilience: 20, economic: 20 },
      availableWaterMm: [600, 300, 500],
      farmAreaHa: 1,
      minimumTurnaroundDays: 10,
      minimumDistinctCrops: 2,
      allowAdjacentRepeat: false,
      history: [{ cropId: null, landUse: 'fallow' }],
      rules: [],
    })
    assert.equal(result.recommendations.length, 0)
    assert.equal(result.rejectionCounts.TURNAROUND_WINDOW, 1)
  })

  test('rejects unknown crop history', ({ assert }) => {
    assert.throws(
      () =>
        recommendRotations({
          slots: [
            { season: 'A', candidates: [] },
            { season: 'B', candidates: [] },
          ],
          weights: { climate: 20, water: 20, soil: 20, resilience: 20, economic: 20 },
          availableWaterMm: [1, 1],
          farmAreaHa: 1,
          minimumTurnaroundDays: 10,
          minimumDistinctCrops: 1,
          allowAdjacentRepeat: false,
          history: [{ cropId: null, landUse: 'unknown' }],
          rules: [],
        }),
      'HISTORY_INCOMPLETE'
    )
  })

  test('enforces minimum breaks against farm history', ({ assert }) => {
    const result = recommendRotations({
      slots: [
        { season: 'Rabi', candidates: [crop(2, '2026-11-01', '2026-11-20')] },
        { season: 'Kharif 1', candidates: [crop(3, '2027-03-01', '2027-03-20')] },
      ],
      weights: { climate: 20, water: 20, soil: 20, resilience: 20, economic: 20 },
      availableWaterMm: [500, 500],
      farmAreaHa: 1,
      minimumTurnaroundDays: 5,
      minimumDistinctCrops: 2,
      allowAdjacentRepeat: false,
      history: [{ cropId: 1, landUse: 'crop', harvestDate: '2026-09-01' }],
      rules: [
        {
          fromCropId: 1,
          toCropId: 2,
          type: 'allowed',
          compatibility: 60,
          soilAdjustment: 0,
          minimumBreakSeasons: 1,
          reason: 'break required',
        },
      ],
    })
    assert.equal(result.rejectionCounts.MINIMUM_BREAK, 1)
  })
})
