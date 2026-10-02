import { DistrictRiskAssessmentSchema } from '#database/schema'
import District from '#models/district'
import ImportBatch from '#models/import_batch'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DistrictRiskAssessment extends DistrictRiskAssessmentSchema {
  @belongsTo(() => ImportBatch)
  declare batch: BelongsTo<typeof ImportBatch>

  @belongsTo(() => District)
  declare district: BelongsTo<typeof District>
}
