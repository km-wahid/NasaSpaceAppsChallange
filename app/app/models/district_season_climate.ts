import { DistrictSeasonClimateSchema } from '#database/schema'
import District from '#models/district'
import ImportBatch from '#models/import_batch'
import Season from '#models/season'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DistrictSeasonClimate extends DistrictSeasonClimateSchema {
  static table = 'district_season_climate'

  @belongsTo(() => ImportBatch)
  declare batch: BelongsTo<typeof ImportBatch>

  @belongsTo(() => District)
  declare district: BelongsTo<typeof District>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>
}
