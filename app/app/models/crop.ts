import { CropSchema } from '#database/schema'
import CropRotationRule from '#models/crop_rotation_rule'
import CropTemperatureRequirement from '#models/crop_temperature_requirement'
import CropStatistic from '#models/district_crop_statistic'
import PlotCropHistory from '#models/plot_crop_history'
import { hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'

export default class Crop extends CropSchema {
  @hasOne(() => CropTemperatureRequirement)
  declare temperatureRequirement: HasOne<typeof CropTemperatureRequirement>

  @hasMany(() => CropStatistic)
  declare districtStatistics: HasMany<typeof CropStatistic>

  @hasMany(() => PlotCropHistory)
  declare plotHistories: HasMany<typeof PlotCropHistory>

  @hasMany(() => CropRotationRule, { foreignKey: 'currentCropId' })
  declare rotationRules: HasMany<typeof CropRotationRule>

  @hasMany(() => CropRotationRule, { foreignKey: 'recommendedNextCropId' })
  declare recommendedByRules: HasMany<typeof CropRotationRule>
}
