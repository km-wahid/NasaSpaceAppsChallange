import { validateIntegratedFarmingImport } from '#services/integrated_farming_import_service'
import { boguraMaizePotatoPilot } from '../../database/reference_data/bogura_maize_potato.js'
import { test } from '@japa/runner'

const source = {
  key: 'review',
  name: 'Reviewed trial',
  organization: 'Research organization',
  citation: 'Complete citation',
}
const component = (cropName: string, role: string) => ({
  cropName,
  role,
  outputUnit: 'tonnes',
  expectedOutputPerHa: 1,
  marketPriceBdtPerUnit: 10,
  variableCostBdtPerHa: 2,
  annualizedSetupCostBdtPerHa: 0,
  economicSource: 'review',
})

test.group('integrated farming evidence import', () => {
  test('accepts a complete sourced two-component system', ({ assert }) => {
    assert.doesNotThrow(() =>
      validateIntegratedFarmingImport({
        sources: [source],
        systems: [
          {
            name: 'Reviewed crop pair',
            type: 'intercrop',
            timingPattern: 'simultaneous',
            spatialPattern: 'alternate_rows',
            source: 'review',
            managementNote: 'Follow the reviewed row arrangement.',
            components: [component('Aman', 'primary'), component('Lentil', 'companion')],
          },
        ],
      })
    )
  })

  test('rejects incomplete economics and unsupported free-form combinations', ({ assert }) => {
    assert.throws(
      () =>
        validateIntegratedFarmingImport({
          sources: [source],
          systems: [
            {
              name: 'Unreviewed mix',
              type: 'anything_goes',
              timingPattern: 'simultaneous',
              spatialPattern: 'mixed',
              source: 'review',
              components: [component('Aman', 'primary'), component('Lentil', 'companion')],
            },
          ],
        }),
      'Unsupported system type'
    )
  })

  test('accepts the source-controlled Bogura maize-potato pilot', ({ assert }) => {
    assert.doesNotThrow(() => validateIntegratedFarmingImport(boguraMaizePotatoPilot))
    assert.equal(boguraMaizePotatoPilot.systems[0].components.length, 2)
    assert.equal(
      boguraMaizePotatoPilot.systems[0].components.reduce(
        (total, member) => total + member.variableCostBdtPerHa,
        0
      ),
      110100
    )
  })
})
