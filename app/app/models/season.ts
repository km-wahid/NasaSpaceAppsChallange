import { SeasonSchema } from '#database/schema'
import CropStatistic from '#models/district_crop_statistic'
import SeasonClimate from '#models/district_season_climate'
import PlotCropHistory from '#models/plot_crop_history'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Season extends SeasonSchema {
  @hasMany(() => SeasonClimate)
  declare districtClimates: HasMany<typeof SeasonClimate>

  @hasMany(() => CropStatistic)
  declare cropStatistics: HasMany<typeof CropStatistic>

  @hasMany(() => PlotCropHistory)
  declare plotCropHistories: HasMany<typeof PlotCropHistory>
}
