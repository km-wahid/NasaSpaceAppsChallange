import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(
      `ALTER TABLE user_locations ADD COLUMN water_availability text CHECK (water_availability IN ('low','medium','high'))`
    )
  }
  async down() {
    this.schema.alterTable('user_locations', (table) => table.dropColumn('water_availability'))
  }
}
