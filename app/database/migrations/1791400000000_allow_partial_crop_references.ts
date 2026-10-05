import { BaseSchema } from '@adonisjs/lucid/schema'
import { createHash } from 'node:crypto'

export default class extends BaseSchema {
  async up() {
    // Do not fill missing scientific measurements with invented defaults.
    for (const column of [
      'rainfall_min_mm',
      'rainfall_max_mm',
      'water_requirement_mm',
      'ph_min',
      'ph_max',
      'nitrogen_requirement',
      'phosphorus_requirement',
      'potassium_requirement',
      'nitrogen_contribution_level',
      'heat_tolerance',
      'drought_tolerance',
      'flood_tolerance',
      'salinity_tolerance',
      'crop_soil_effect_points',
    ])
      await this.db.rawQuery(`ALTER TABLE crop_requirements ALTER COLUMN ${column} DROP NOT NULL`)
    await this.db.rawQuery(
      "ALTER TABLE crop_requirements ADD COLUMN reference_details jsonb NOT NULL DEFAULT '{}'::jsonb; ALTER TABLE rotation_recommendations ALTER COLUMN total_water_requirement_mm DROP NOT NULL"
    )
    const previous = await this.db.from('engine_versions').where('is_active', true).firstOrFail()
    const config = {
      ...previous.scoring_config,
      starterReferences: {
        version: 'bangladesh-screening-v1',
        missingReferenceScore: 50,
        economics: 'neutral-for-entire-search-if-any-candidate-is-missing',
        legumeSoilEffectPoints: 20,
        soilPolicy: 'potential-nitrogen-fixation-opportunity-not-measured-soil-gain',
        previousEngineVersionId: previous.engine_version_id,
      },
    }
    await this.db.from('engine_versions').where('is_active', true).update({ is_active: false })
    await this.db.table('engine_versions').insert({
      version: `${previous.version}-references-v1`,
      scoring_config: config,
      config_checksum: createHash('sha256').update(JSON.stringify(config)).digest('hex'),
      is_active: true,
    })
  }

  async down() {
    throw new Error(
      'Partial references contain unknown values. Preserve these records and use a forward migration instead of fabricating measurements during rollback.'
    )
  }
}
