import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      INSERT INTO capability_definitions(capability_key,label,value_type,unit,help_text,sort_order)
      VALUES
        ('field_soil_test_reviewed','Field soil test reviewed','boolean',NULL,'A current field soil test has been reviewed for both components; regional maps are not a substitute.',15),
        ('three_rabi_irrigations_available','Three Rabi irrigations available','boolean',NULL,'Water can be supplied near the establishment, vegetative and tuber-development stages when locally required.',16),
        ('current_local_economics_reviewed','Current local prices and costs reviewed','boolean',NULL,'Current input costs and expected selling prices have been checked locally; historical trial values are not treated as a forecast.',17),
        ('local_extension_review','Local extension review completed','boolean',NULL,'A local DAE or qualified agronomy adviser has reviewed transfer of the evidence package to this field.',18)
      ON CONFLICT (capability_key) DO UPDATE SET
        label = EXCLUDED.label,
        value_type = EXCLUDED.value_type,
        unit = EXCLUDED.unit,
        help_text = EXCLUDED.help_text,
        sort_order = EXCLUDED.sort_order;
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DELETE FROM capability_definitions
      WHERE capability_key IN (
        'field_soil_test_reviewed',
        'three_rabi_irrigations_available',
        'current_local_economics_reviewed',
        'local_extension_review'
      )
      AND NOT EXISTS (
        SELECT 1 FROM farm_capabilities
        WHERE farm_capabilities.capability_key = capability_definitions.capability_key
      );
    `)
  }
}
