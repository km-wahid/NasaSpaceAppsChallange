import { test } from '@japa/runner'
import {
  buildWaterOutlook,
  presentRotationPlans,
  nextPlanningSeason,
} from '#services/farmer_analysis_service'
import { recommendRotations, type Candidate } from '#services/rotation_engine'

const calendar = { 'Rabi': [11, 12, 1, 2, 3], 'Kharif 1': [4, 5, 6], 'Kharif 2': [7, 8, 9, 10] }
test.group('farmer-facing analysis', () => {
  test('starts with the next full season, including the next-year boundary', ({ assert }) => {
    assert.deepEqual(nextPlanningSeason(calendar, new Date('2026-10-03')), {
      name: 'Rabi',
      month: 11,
      year: 2026,
    })
    assert.deepEqual(nextPlanningSeason(calendar, new Date('2026-12-03')), {
      name: 'Kharif 1',
      month: 4,
      year: 2027,
    })
    assert.deepEqual(nextPlanningSeason(calendar, new Date('2026-04-03')), {
      name: 'Kharif 2',
      month: 7,
      year: 2026,
    })
    assert.isUndefined(nextPlanningSeason({}))
  })
  test('uses stored seasonal context, preserves gaps and does not invent measured supply', ({
    assert,
  }) => {
    const water = buildWaterOutlook(
      [
        { season_name: 'Rabi', rainfall_mm: '0' },
        { season_name: 'Kharif 2', rainfall_mm: '900' },
      ],
      'low',
      calendar,
      { drought_risk: 'Very High', flood_risk: 'Very Low' },
      null
    )
    assert.equal(water.label, 'Low')
    assert.equal(water.series[0].index, 0)
    assert.equal(water.series[6].index, 1)
    assert.equal(water.series[6].rainfall, 'High')
    assert.isNull(water.series[3].index)
    assert.equal(water.series[3].level, 'Not available')
    assert.equal(water.dryPeriodRisk, 'High')
    assert.equal(water.heavyRainRisk, 'Low')
    assert.notProperty(water, 'availableWaterMm')
    assert.equal(water.soil, 'Not available')
  })

  test('treats invalid rainfall as missing, handles equal values and remains deterministic', ({
    assert,
  }) => {
    const rows = [
      { season_name: 'Rabi', rainfall_mm: '100' },
      { season_name: 'Kharif 1', rainfall_mm: '100' },
      { season_name: 'Kharif 2', rainfall_mm: '-1' },
    ]
    const result = buildWaterOutlook(rows, 'medium', calendar, null, null)
    assert.equal(result.series[0].level, 'Moderate')
    assert.isNull(result.series[6].index)
    assert.deepEqual(result, buildWaterOutlook(rows, 'medium', calendar, null, null))
    assert.isTrue(
      buildWaterOutlook([], 'high', calendar, null, null).series.every(
        (point) => point.index === null
      )
    )
  })

  test('presents actual scheduled dates and calculated trade-offs from the engine', ({
    assert,
  }) => {
    const candidate = (id: number, date: string, water: number): Candidate => ({
      id,
      name: `Fixture crop ${id}`,
      family: `Family ${id}`,
      windowStart: date,
      windowEnd: date,
      durationDays: 70,
      waterRequirementMm: water,
      profitPerHa: 100,
      nutrientRequirements: { n: 'low', p: 'low', k: 'low' },
      scores: { water: 80, climate: 80, soil: 80, resilience: 80, economic: 80 },
    })
    const result = recommendRotations({
      slots: [
        { season: 'Kharif 2', candidates: [candidate(1, '2026-07-01', 600)] },
        { season: 'Rabi', candidates: [candidate(2, '2026-11-01', 100)] },
        { season: 'Kharif 1', candidates: [candidate(3, '2027-04-01', 300)] },
      ],
      availableWaterMm: [800, 400, 600],
      farmAreaHa: 1,
      weights: { water: 20, climate: 20, soil: 20, resilience: 20, economic: 20 },
      minimumTurnaroundDays: 10,
      minimumDistinctCrops: 2,
      allowAdjacentRepeat: false,
      history: [{ landUse: 'fallow', cropId: null }],
      rules: [],
    })
    const plans = presentRotationPlans(result.recommendations, 12)
    assert.lengthOf(plans, 1)
    assert.deepEqual(
      plans[0].crops.map((crop) => crop.plantingDate),
      result.recommendations[0].plantingDates
    )
    assert.deepEqual(
      plans[0].crops.map((crop) => crop.harvestDate),
      result.recommendations[0].harvestDates
    )
    assert.equal(plans[0].crops[0].waterNeed, 'high')
    assert.equal(plans[0].crops[1].waterNeed, 'low')
    assert.equal(plans[0].crops[0].nextCrop, 'Fixture crop 2')
    assert.isTrue(plans[0].tradeoffs.some((item) => item.text.includes('unreviewed')))
    assert.notProperty(plans[0], 'scores')
    assert.deepEqual(presentRotationPlans([], 12), [])
    const equalDemand = structuredClone(result.recommendations)
    equalDemand[0].crops.forEach((crop) => {
      crop.waterRequirementMm = 300
    })
    equalDemand[0].totalWaterRequirementMm = 900
    assert.isTrue(
      presentRotationPlans(equalDemand, 13)[0].crops.every((crop) => crop.waterNeed === 'medium')
    )
  })
})
