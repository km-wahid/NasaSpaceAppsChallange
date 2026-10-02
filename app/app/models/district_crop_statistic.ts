import { DistrictCropStatisticSchema } from '#database/schema'
import Crop from '#models/crop'
import CropClimateWindow from '#models/crop_climate_window'
import District from '#models/district'
import ImportBatch from '#models/import_batch'
import Season from '#models/season'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class DistrictCropStatistic extends DistrictCropStatisticSchema {
  @belongsTo(() => ImportBatch)
  declare batch: BelongsTo<typeof ImportBatch>

  @belongsTo(() => District)
  declare district: BelongsTo<typeof District>

  @belongsTo(() => Crop)
  declare crop: BelongsTo<typeof Crop>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>

  @hasMany(() => CropClimateWindow)
  declare climateWindows: HasMany<typeof CropClimateWindow>
}
