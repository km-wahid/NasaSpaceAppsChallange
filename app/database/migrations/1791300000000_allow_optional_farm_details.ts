import { BaseSchema } from '@adonisjs/lucid/schema'
import { createHash } from 'node:crypto'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      ALTER TABLE farms ALTER COLUMN area_hectares DROP NOT NULL,
        ALTER COLUMN latitude DROP NOT NULL, ALTER COLUMN longitude DROP NOT NULL,
        ALTER COLUMN irrigation_available_mm_per_season DROP NOT NULL,
        ALTER COLUMN irrigation_available_mm_per_season DROP DEFAULT;
      ALTER TABLE rotation_recommendations ALTER COLUMN total_profit_bdt DROP NOT NULL;
    `)
    const previous = await this.db.from('engine_versions').where('is_active', true).firstOrFail()
    const config = {
      ...previous.scoring_config,
      optionalDetails: {
        previousEngineVersionId: previous.engine_version_id,
        missingClimateScore: 50,
        missingResilienceScore: 50,
        missingSoil: 'documented-crop-effects-only',
        missingWater: 'relative-crop-demand-only',
        missingHistory: 'skip-prior-crop-checks-with-warning',
        missingArea: 'profit-per-hectare-only',
      },
    }
    await this.db.from('engine_versions').where('is_active', true).update({ is_active: false })
    await this.db.table('engine_versions').insert({
      version: `${previous.version}-optional-details-v1`,
      scoring_config: config,
      config_checksum: createHash('sha256').update(JSON.stringify(config)).digest('hex'),
      is_active: true,
    })
  }

  async down() {
    // Preserve unknown values: rolling back must not invent measurements or delete farms.
    await this.db.rawQuery(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM farms WHERE area_hectares IS NULL OR latitude IS NULL OR longitude IS NULL OR irrigation_available_mm_per_season IS NULL)
        OR EXISTS (SELECT 1 FROM rotation_recommendations WHERE total_profit_bdt IS NULL)
      THEN RAISE EXCEPTION 'Complete optional farm details before rolling back'; END IF;
    END $$;
    ALTER TABLE farms ALTER COLUMN area_hectares SET NOT NULL,
      ALTER COLUMN latitude SET NOT NULL, ALTER COLUMN longitude SET NOT NULL,
      ALTER COLUMN irrigation_available_mm_per_season SET NOT NULL,
      ALTER COLUMN irrigation_available_mm_per_season SET DEFAULT 0;
    ALTER TABLE rotation_recommendations ALTER COLUMN total_profit_bdt SET NOT NULL;`)
    const current = await this.db.from('engine_versions').where('is_active', true).firstOrFail()
    const previousId = current.scoring_config?.optionalDetails?.previousEngineVersionId
    if (previousId) {
      await this.db
        .from('engine_versions')
        .where('engine_version_id', current.engine_version_id)
        .update({ is_active: false })
      await this.db
        .from('engine_versions')
        .where('engine_version_id', previousId)
        .update({ is_active: true })
    }
  }
}
