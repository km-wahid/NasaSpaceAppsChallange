import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      CREATE TABLE companion_components (
        companion_component_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        component_type text NOT NULL CHECK (component_type IN ('fish','livestock','tree','pollinator')),
        name text NOT NULL,
        output_unit text,
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        reviewed_at date NOT NULL,
        UNIQUE (component_type, name)
      );

      CREATE TABLE farming_systems (
        farming_system_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL,
        system_type text NOT NULL CHECK (system_type IN ('intercrop','relay_crop','border_crop','crop_aquaculture','crop_livestock','agroforestry','crop_pollinator','silvopasture')),
        timing_pattern text NOT NULL CHECK (timing_pattern IN ('simultaneous','relay','overlapping','sequential')),
        spatial_pattern text NOT NULL CHECK (spatial_pattern IN ('mixed','alternate_rows','strip','border','understorey','shared_water')),
        primary_crop_id bigint REFERENCES crops(crop_id),
        season_id bigint REFERENCES seasons(season_id),
        district_id bigint REFERENCES districts(district_id),
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        reviewed_at date NOT NULL,
        valid_from date,
        valid_to date,
        management_note text NOT NULL,
        CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
      );

      CREATE TABLE farming_system_components (
        farming_system_component_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farming_system_id bigint NOT NULL REFERENCES farming_systems(farming_system_id) ON DELETE CASCADE,
        crop_id bigint REFERENCES crops(crop_id),
        companion_component_id bigint REFERENCES companion_components(companion_component_id),
        role text NOT NULL CHECK (role IN ('primary','companion','border','understorey','refuge')),
        start_offset_days integer NOT NULL DEFAULT 0 CHECK (start_offset_days BETWEEN -365 AND 365),
        duration_days integer CHECK (duration_days > 0),
        area_share_percent numeric(5,2) CHECK (area_share_percent > 0 AND area_share_percent <= 100),
        expected_output_per_hectare numeric(14,4),
        output_unit text,
        market_price_bdt_per_unit numeric(14,2),
        variable_cost_bdt_per_hectare numeric(14,2),
        annualized_setup_cost_bdt_per_hectare numeric(14,2),
        economic_source_id bigint REFERENCES data_sources(source_id),
        uncertainty_note text,
        CHECK ((crop_id IS NOT NULL)::integer + (companion_component_id IS NOT NULL)::integer = 1),
        CHECK (expected_output_per_hectare IS NULL OR expected_output_per_hectare >= 0),
        CHECK (market_price_bdt_per_unit IS NULL OR market_price_bdt_per_unit >= 0),
        CHECK (variable_cost_bdt_per_hectare IS NULL OR variable_cost_bdt_per_hectare >= 0),
        CHECK (annualized_setup_cost_bdt_per_hectare IS NULL OR annualized_setup_cost_bdt_per_hectare >= 0)
      );

      CREATE TABLE capability_definitions (
        capability_key text PRIMARY KEY,
        label text NOT NULL,
        value_type text NOT NULL CHECK (value_type IN ('boolean','number','text')),
        unit text,
        help_text text NOT NULL,
        sort_order integer NOT NULL
      );

      INSERT INTO capability_definitions(capability_key,label,value_type,unit,help_text,sort_order) VALUES
        ('integrated_farming_interest','Consider integrated farming','boolean',NULL,'Allow reviewed multi-component systems to be compared with crop-only plans.',1),
        ('water_retention','Field retains managed water','boolean',NULL,'The field can hold water for the required production period.',2),
        ('controlled_inlet_outlet','Controlled water inlet and outlet','boolean',NULL,'Water entering and leaving the field can be managed.',3),
        ('raised_bunds','Raised field boundaries','boolean',NULL,'Raised boundaries can safely retain water or separate components.',4),
        ('refuge_available','Refuge trench or connected pond','boolean',NULL,'A refuge area is available where an aquatic component requires it.',5),
        ('fish_safe_pest_management','Fish-safe pest management','boolean',NULL,'The farmer can follow a locally reviewed fish-safe pest-management plan.',6),
        ('fenced_area','Protected or fenced area','boolean',NULL,'Animals can be separated from vulnerable crops when required.',7),
        ('livestock_shelter','Livestock shelter available','boolean',NULL,'Suitable shelter and waste management are available.',8),
        ('tree_space','Permanent tree space available','boolean',NULL,'The plot can retain the required tree spacing for the full system life.',9),
        ('pollinator_safe_management','Pollinator-safe management','boolean',NULL,'The farmer can follow locally reviewed pollinator-safe practices.',10),
        ('water_depth_cm','Managed water depth','number','cm','Measured or reliably managed standing-water depth.',11),
        ('water_ph','Water pH','number','pH','A current field water measurement, not a soil or satellite estimate.',12),
        ('dissolved_oxygen_mg_l','Dissolved oxygen','number','mg/L','A current field water measurement.',13),
        ('water_salinity_ppt','Water salinity','number','ppt','A current field water measurement.',14);

      CREATE TABLE farm_capabilities (
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        capability_key text NOT NULL REFERENCES capability_definitions(capability_key),
        boolean_value boolean,
        number_value numeric(14,4),
        text_value text,
        observed_at date,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (farm_id, capability_key),
        CHECK ((boolean_value IS NOT NULL)::integer + (number_value IS NOT NULL)::integer + (text_value IS NOT NULL)::integer = 1)
      );

      CREATE TABLE farming_system_requirements (
        farming_system_requirement_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farming_system_id bigint NOT NULL REFERENCES farming_systems(farming_system_id) ON DELETE CASCADE,
        metric_key text NOT NULL,
        comparator text NOT NULL CHECK (comparator IN ('minimum','maximum','equals')),
        number_value numeric(14,4),
        boolean_value boolean,
        text_value text,
        unit text,
        mandatory boolean NOT NULL DEFAULT true,
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        CHECK ((number_value IS NOT NULL)::integer + (boolean_value IS NOT NULL)::integer + (text_value IS NOT NULL)::integer = 1),
        UNIQUE (farming_system_id, metric_key, comparator)
      );

      CREATE TABLE farm_history_components (
        history_id bigint NOT NULL REFERENCES farm_crop_history(history_id) ON DELETE CASCADE,
        crop_id bigint NOT NULL REFERENCES crops(crop_id),
        PRIMARY KEY (history_id, crop_id)
      );
      INSERT INTO farm_history_components(history_id,crop_id)
      SELECT history_id,crop_id FROM farm_crop_history WHERE crop_id IS NOT NULL;

      ALTER TABLE rotation_recommendation_items
        ADD COLUMN farming_system_id bigint REFERENCES farming_systems(farming_system_id);

      CREATE TABLE rotation_recommendation_item_components (
        recommendation_item_component_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        recommendation_item_id bigint NOT NULL REFERENCES rotation_recommendation_items(recommendation_item_id) ON DELETE CASCADE,
        component_type text NOT NULL,
        name text NOT NULL,
        crop_id bigint REFERENCES crops(crop_id),
        planting_or_start_date date NOT NULL,
        harvest_or_end_date date NOT NULL,
        output_quantity numeric(14,4),
        output_unit text,
        revenue_bdt numeric(16,2),
        cost_bdt numeric(16,2),
        calculation_trace jsonb NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE INDEX farming_system_lookup_idx ON farming_systems (season_id, district_id, valid_from, valid_to);
      CREATE INDEX farm_capabilities_farm_idx ON farm_capabilities (farm_id);
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DROP TABLE IF EXISTS rotation_recommendation_item_components;
      ALTER TABLE rotation_recommendation_items DROP COLUMN IF EXISTS farming_system_id;
      DROP TABLE IF EXISTS farm_history_components, farming_system_requirements, farm_capabilities,
        capability_definitions, farming_system_components, farming_systems, companion_components CASCADE;
    `)
  }
}
