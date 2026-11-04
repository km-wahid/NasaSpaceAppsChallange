import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('regional_climate_maps', (table) => {
      table.bigIncrements('map_id')
      table.string('request_hash', 64).notNullable().unique()
      table.integer('start_year').notNullable()
      table.integer('end_year').notNullable()
      table.jsonb('payload').notNullable()
      table.timestamp('retrieved_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('regional_climate_maps')
  }
}
