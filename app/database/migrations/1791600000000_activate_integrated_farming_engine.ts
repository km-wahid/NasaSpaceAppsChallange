import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      UPDATE engine_versions SET is_active = false WHERE is_active;
      INSERT INTO engine_versions(version, scoring_config, config_checksum, is_active)
      VALUES (
        '2.0.0',
        '{"temperatureFitMinimum":65,"waterCoverageMinimum":0.5,"maxCandidatesPerSlot":25,"profileMaxAgeDays":30,"environmentCoverageMinimumPercent":90,"dryDayThresholdMm":1,"maxIntegratedComponents":3,"seasonMonths":{"Rabi":[11,12,1,2,3],"Kharif 1":[4,5,6],"Kharif 2":[7,8,9,10]}}'::jsonb,
        '0000000000000000000000000000000000000000000000000000000000000002',
        true
      )
      ON CONFLICT (version) DO UPDATE SET is_active = true;
    `)
  }

  async down() {
    await this.db.rawQuery(`
      UPDATE engine_versions SET is_active = false WHERE version = '2.0.0';
      UPDATE engine_versions SET is_active = true WHERE version = '1.0.0';
    `)
  }
}
