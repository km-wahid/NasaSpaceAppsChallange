import { DivisionSchema } from '#database/schema'
import District from '#models/district'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Division extends DivisionSchema {
  @hasMany(() => District)
  declare districts: HasMany<typeof District>
}
