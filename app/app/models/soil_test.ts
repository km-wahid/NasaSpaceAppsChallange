import { SoilTestSchema } from '#database/schema'
import District from '#models/district'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class SoilTest extends SoilTestSchema {
  @belongsTo(() => District)
  declare district: BelongsTo<typeof District>
}
