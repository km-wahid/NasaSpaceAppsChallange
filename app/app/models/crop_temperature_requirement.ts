import { CropTemperatureRequirementSchema } from '#database/schema'
import Crop from '#models/crop'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CropTemperatureRequirement extends CropTemperatureRequirementSchema {
  @belongsTo(() => Crop)
  declare crop: BelongsTo<typeof Crop>
}
