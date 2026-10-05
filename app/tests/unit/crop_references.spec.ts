import { test } from '@japa/runner'
import {
  bangladeshCrops,
  referenceSources,
} from '../../database/reference_data/bangladesh_crops.js'
import { recommendRotations, type Candidate } from '#services/rotation_engine'

test.group('source-backed starter crop references', () => {
  test('enumerates actual reference calendars for all three start seasons without inventing costs or water', ({
    assert,
  }) => {
    const cycle = ['Kharif 2', 'Rabi', 'Kharif 1']
    for (let start = 0; start < cycle.length; start++) {
      let year = 2026
      let previousMonth = 0
      const slots = Array.from({ length: 3 }, (_, offset) => {
        const season = cycle[(start + offset) % 3]
        const references = bangladeshCrops.filter((crop) => crop.season === season)
        const month = Math.min(...references.map((crop) => crop.start[0]))
        if (previousMonth && month < previousMonth) year++
        previousMonth = month
        const date = (m: number, d: number) =>
          `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const candidates: Candidate[] = references.map((reference) => ({
          id: bangladeshCrops.indexOf(reference) + 1,
          name: reference.name,
          family: reference.family,
          windowStart: date(reference.start[0], reference.start[1]),
          windowEnd: date(reference.end[0], reference.end[1]),
          durationDays: Math.round((reference.duration[0] + reference.duration[1]) / 2),
          waterRequirementMm: reference.water,
          profitPerHa: null,
          nutrientRequirements: { n: null, p: null, k: null },
          scores: {
            climate: 50,
            water: 50,
            soil: reference.legume ? 60 : 50,
            resilience: 50,
            economic: 50,
          },
        }))
        return { season, candidates }
      })
      const input = {
        slots,
        weights: { climate: 15, water: 20, soil: 25, resilience: 10, economic: 30 },
        availableWaterMm: [null, null, null],
        farmAreaHa: null,
        minimumTurnaroundDays: 10,
        minimumDistinctCrops: 2,
        allowAdjacentRepeat: false,
        history: [],
        rules: [],
      }
      const result = recommendRotations(input)
      assert.lengthOf(result.recommendations, 3)
      assert.deepEqual(result, recommendRotations(input))
      for (const plan of result.recommendations) {
        assert.isNull(plan.totalProfit)
        assert.isNull(plan.totalWaterRequirementMm)
        assert.equal(plan.scores.economic, 50)
        for (let i = 1; i < plan.crops.length; i++)
          assert.isAtLeast(
            (Date.parse(plan.plantingDates[i]) - Date.parse(plan.harvestDates[i - 1])) / 86400000,
            10
          )
      }
    }
    for (const source of Object.values(referenceSources)) {
      assert.isTrue(source.url.startsWith('https://'))
      assert.isAbove(source.citation.length, 20)
    }
  })
})
