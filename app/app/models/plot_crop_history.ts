import { PlotCropHistorySchema } from '#database/schema'
import AgriculturalPlot from '#models/agricultural_plot'
import Crop from '#models/crop'
import Season from '#models/season'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PlotCropHistory extends PlotCropHistorySchema {
  static table = 'plot_crop_history'

  @belongsTo(() => AgriculturalPlot)
  declare plot: BelongsTo<typeof AgriculturalPlot>

  @belongsTo(() => Crop)
  declare crop: BelongsTo<typeof Crop>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>
}
