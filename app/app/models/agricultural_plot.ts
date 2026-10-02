import { AgriculturalPlotSchema } from '#database/schema'
import District from '#models/district'
import PlotCropHistory from '#models/plot_crop_history'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class AgriculturalPlot extends AgriculturalPlotSchema {
  @belongsTo(() => District)
  declare district: BelongsTo<typeof District>

  @hasMany(() => PlotCropHistory)
  declare cropHistory: HasMany<typeof PlotCropHistory>
}
