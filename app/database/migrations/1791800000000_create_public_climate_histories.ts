import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('public_climate_histories', (table) => {
      table.bigIncrements('history_id')
      table.string('request_hash', 64).notNullable().unique()
      table.decimal('latitude', 8, 5).notNullable()
      table.decimal('longitude', 8, 5).notNullable()
      table.integer('start_year').notNullable()
      table.integer('end_year').notNullable()
      table.jsonb('payload').notNullable()
      table.timestamp('retrieved_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('public_climate_histories')
  }
}
