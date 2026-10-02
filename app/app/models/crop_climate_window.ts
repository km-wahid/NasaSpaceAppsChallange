import { CropClimateWindowSchema } from '#database/schema'
import DistrictCropStatistic from '#models/district_crop_statistic'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CropClimateWindow extends CropClimateWindowSchema {
  @belongsTo(() => DistrictCropStatistic)
  declare statistic: BelongsTo<typeof DistrictCropStatistic>
}
