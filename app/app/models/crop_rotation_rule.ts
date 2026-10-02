import { CropRotationRuleSchema } from '#database/schema'
import Crop from '#models/crop'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CropRotationRule extends CropRotationRuleSchema {
  @belongsTo(() => Crop, { foreignKey: 'currentCropId' })
  declare currentCrop: BelongsTo<typeof Crop>

  @belongsTo(() => Crop, { foreignKey: 'recommendedNextCropId' })
  declare recommendedNextCrop: BelongsTo<typeof Crop>
}
