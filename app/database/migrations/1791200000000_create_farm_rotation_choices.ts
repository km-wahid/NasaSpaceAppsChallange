import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('farm_rotation_choices', (table) => {
      table
        .bigInteger('farm_id')
        .primary()
        .references('farm_id')
        .inTable('farms')
        .onDelete('CASCADE')
      table
        .bigInteger('recommendation_id')
        .notNullable()
        .references('recommendation_id')
        .inTable('rotation_recommendations')
        .onDelete('CASCADE')
      table.timestamp('selected_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('farm_rotation_choices')
  }
}
