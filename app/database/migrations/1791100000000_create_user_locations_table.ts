import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      CREATE TABLE user_locations (
        user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        district_id bigint REFERENCES districts(district_id) ON DELETE SET NULL,
        latitude double precision CHECK (latitude BETWEEN -90 AND 90),
        longitude double precision CHECK (longitude BETWEEN -180 AND 180),
        district text,
        division text,
        country text,
        country_code text,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((latitude IS NULL) = (longitude IS NULL))
      );
    `)
  }

  async down() {
    this.schema.dropTable('user_locations')
  }
}
