import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      CREATE TABLE data_sources (
        source_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL,
        organization text NOT NULL,
        document_title text,
        edition text,
        publication_date date,
        url text,
        citation text NOT NULL,
        page_or_table text,
        accessed_at date NOT NULL DEFAULT current_date,
        notes text
      );

      CREATE TABLE farms (
        farm_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        district_id bigint NOT NULL REFERENCES districts(district_id),
        name text NOT NULL,
        area_hectares numeric(12,3) NOT NULL CHECK (area_hectares > 0),
        latitude numeric(8,5) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
        longitude numeric(8,5) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
        irrigation_available_mm_per_season numeric(10,2) NOT NULL DEFAULT 0 CHECK (irrigation_available_mm_per_season >= 0),
        water_source text,
        minimum_turnaround_days integer NOT NULL DEFAULT 10 CHECK (minimum_turnaround_days BETWEEN 0 AND 45),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, name)
      );

      CREATE TABLE farm_crop_history (
        history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        crop_id bigint REFERENCES crops(crop_id),
        season_id bigint NOT NULL REFERENCES seasons(season_id),
        crop_year integer NOT NULL,
        land_use_type text NOT NULL CHECK (land_use_type IN ('crop','fallow','unknown')),
        planting_date date,
        harvest_date date,
        yield_tonnes numeric(12,3),
        notes text,
        UNIQUE (farm_id, crop_year, season_id),
        CHECK ((land_use_type = 'crop' AND crop_id IS NOT NULL) OR (land_use_type <> 'crop' AND crop_id IS NULL)),
        CHECK (harvest_date IS NULL OR planting_date IS NULL OR harvest_date >= planting_date)
      );

      CREATE TABLE soil_nutrient_threshold_sets (
        threshold_set_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL,
        country text NOT NULL DEFAULT 'Bangladesh',
        region text,
        soil_texture text,
        analytical_method text NOT NULL,
        unit text NOT NULL CHECK (unit IN ('ppm','mg_kg','percent')),
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        valid_from date,
        valid_to date,
        reviewed_at date NOT NULL
      );

      CREATE TABLE soil_nutrient_thresholds (
        threshold_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        threshold_set_id bigint NOT NULL REFERENCES soil_nutrient_threshold_sets(threshold_set_id) ON DELETE CASCADE,
        nutrient text NOT NULL CHECK (nutrient IN ('nitrogen','phosphorus','potassium')),
        status text NOT NULL CHECK (status IN ('very_low','low','medium','high','very_high')),
        minimum_value numeric(14,4),
        maximum_value numeric(14,4),
        UNIQUE (threshold_set_id, nutrient, status),
        CHECK (minimum_value IS NULL OR maximum_value IS NULL OR minimum_value < maximum_value)
      );

      CREATE TABLE farm_soil_profiles (
        soil_profile_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        sampled_at date NOT NULL,
        ph numeric(4,2) NOT NULL CHECK (ph BETWEEN 0 AND 14),
        organic_matter_percent numeric(7,3),
        texture text,
        source_type text NOT NULL CHECK (source_type IN ('laboratory','farmer_test','district_reference')),
        laboratory_name text,
        notes text,
        is_current boolean NOT NULL DEFAULT true
      );
      CREATE UNIQUE INDEX farm_current_soil_idx ON farm_soil_profiles(farm_id) WHERE is_current;

      CREATE TABLE farm_soil_measurements (
        measurement_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        soil_profile_id bigint NOT NULL REFERENCES farm_soil_profiles(soil_profile_id) ON DELETE CASCADE,
        nutrient text NOT NULL CHECK (nutrient IN ('nitrogen','phosphorus','potassium')),
        raw_value numeric(14,4) NOT NULL,
        unit text NOT NULL CHECK (unit IN ('ppm','mg_kg','percent')),
        analytical_method text NOT NULL,
        normalized_status text NOT NULL CHECK (normalized_status IN ('very_low','low','medium','high','very_high')),
        threshold_set_id bigint NOT NULL REFERENCES soil_nutrient_threshold_sets(threshold_set_id),
        UNIQUE (soil_profile_id, nutrient)
      );

      CREATE TABLE crop_requirements (
        crop_id bigint PRIMARY KEY REFERENCES crops(crop_id) ON DELETE CASCADE,
        botanical_family text NOT NULL,
        rainfall_min_mm numeric(10,2) NOT NULL,
        rainfall_max_mm numeric(10,2) NOT NULL,
        water_requirement_mm numeric(10,2) NOT NULL CHECK (water_requirement_mm > 0),
        ph_min numeric(4,2) NOT NULL CHECK (ph_min BETWEEN 0 AND 14),
        ph_max numeric(4,2) NOT NULL CHECK (ph_max BETWEEN 0 AND 14),
        nitrogen_requirement text NOT NULL CHECK (nitrogen_requirement IN ('low','medium','high')),
        phosphorus_requirement text NOT NULL CHECK (phosphorus_requirement IN ('low','medium','high')),
        potassium_requirement text NOT NULL CHECK (potassium_requirement IN ('low','medium','high')),
        nitrogen_contribution_level text NOT NULL DEFAULT 'none' CHECK (nitrogen_contribution_level IN ('none','low','medium','high')),
        heat_tolerance text NOT NULL CHECK (heat_tolerance IN ('low','medium','high')),
        drought_tolerance text NOT NULL CHECK (drought_tolerance IN ('low','medium','high')),
        flood_tolerance text NOT NULL CHECK (flood_tolerance IN ('low','medium','high')),
        salinity_tolerance text NOT NULL CHECK (salinity_tolerance IN ('low','medium','high')),
        crop_soil_effect_points integer NOT NULL CHECK (crop_soil_effect_points BETWEEN -100 AND 100),
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        reviewed_at date NOT NULL,
        CHECK (rainfall_min_mm <= rainfall_max_mm),
        CHECK (ph_min <= ph_max)
      );

      CREATE TABLE crop_calendar_windows (
        calendar_window_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        crop_id bigint NOT NULL REFERENCES crops(crop_id) ON DELETE CASCADE,
        season_id bigint NOT NULL REFERENCES seasons(season_id),
        district_id bigint REFERENCES districts(district_id),
        sowing_start_month integer NOT NULL CHECK (sowing_start_month BETWEEN 1 AND 12),
        sowing_start_day integer NOT NULL CHECK (sowing_start_day BETWEEN 1 AND 31),
        sowing_end_month integer NOT NULL CHECK (sowing_end_month BETWEEN 1 AND 12),
        sowing_end_day integer NOT NULL CHECK (sowing_end_day BETWEEN 1 AND 31),
        duration_min_days integer NOT NULL CHECK (duration_min_days > 0),
        duration_max_days integer NOT NULL CHECK (duration_max_days >= duration_min_days),
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        reviewed_at date NOT NULL
      );
      CREATE UNIQUE INDEX crop_calendar_scope_idx ON crop_calendar_windows(crop_id, season_id, COALESCE(district_id, 0));

      CREATE TABLE crop_economic_data (
        economic_data_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        crop_id bigint NOT NULL REFERENCES crops(crop_id),
        district_id bigint REFERENCES districts(district_id),
        season_id bigint NOT NULL REFERENCES seasons(season_id),
        valid_from date NOT NULL,
        valid_to date NOT NULL,
        expected_yield_tonnes_per_hectare numeric(12,4) NOT NULL CHECK (expected_yield_tonnes_per_hectare >= 0),
        market_price_bdt_per_tonne numeric(14,2) NOT NULL CHECK (market_price_bdt_per_tonne >= 0),
        production_cost_bdt_per_hectare numeric(14,2) NOT NULL CHECK (production_cost_bdt_per_hectare >= 0),
        source_type text NOT NULL CHECK (source_type IN ('official','farmer_entered','regional_reference')),
        source_id bigint NOT NULL REFERENCES data_sources(source_id),
        uncertainty_note text,
        reviewed_at date NOT NULL,
        CHECK (valid_to >= valid_from)
      );

      ALTER TABLE crop_rotation_rules
        ADD COLUMN rule_type text NOT NULL DEFAULT 'allowed',
        ADD COLUMN compatibility_score integer NOT NULL DEFAULT 50,
        ADD COLUMN soil_adjustment_points integer NOT NULL DEFAULT 0,
        ADD COLUMN turnaround_days_override integer,
        ADD COLUMN source_id bigint REFERENCES data_sources(source_id),
        ADD COLUMN reviewed_at date,
        ADD CONSTRAINT rotation_rule_type_check CHECK (rule_type IN ('allowed','discouraged','forbidden')),
        ADD CONSTRAINT rotation_compatibility_check CHECK (compatibility_score BETWEEN 0 AND 100),
        ADD CONSTRAINT rotation_soil_adjustment_check CHECK (soil_adjustment_points BETWEEN -20 AND 20),
        ADD CONSTRAINT rotation_turnaround_check CHECK (turnaround_days_override IS NULL OR turnaround_days_override BETWEEN 0 AND 90),
        ADD CONSTRAINT rotation_rule_consistency_check CHECK (
          (rule_type='forbidden' AND compatibility_score=0) OR
          (rule_type='discouraged' AND compatibility_score BETWEEN 1 AND 49) OR
          (rule_type='allowed' AND compatibility_score BETWEEN 50 AND 100)
        );

      CREATE TABLE environmental_fetches (
        fetch_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        request_hash char(64) NOT NULL UNIQUE,
        provider text NOT NULL DEFAULT 'NASA POWER',
        endpoint text NOT NULL,
        parameters text[] NOT NULL,
        latitude numeric(8,5) NOT NULL,
        longitude numeric(8,5) NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        status text NOT NULL CHECK (status IN ('pending','succeeded','failed')),
        http_status integer,
        source_url text NOT NULL,
        retrieved_at timestamptz,
        error_message text,
        raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE environmental_observations (
        observation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        fetch_id bigint NOT NULL REFERENCES environmental_fetches(fetch_id) ON DELETE CASCADE,
        observation_date date NOT NULL,
        t2m_c numeric(7,3), t2m_min_c numeric(7,3), t2m_max_c numeric(7,3),
        precipitation_mm numeric(10,3), relative_humidity_percent numeric(7,3),
        solar_radiation numeric(12,5), wind_speed_m_s numeric(10,4),
        UNIQUE (fetch_id, observation_date)
      );

      CREATE TABLE farm_environment_profiles (
        environment_profile_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        baseline_start_year integer NOT NULL,
        baseline_end_year integer NOT NULL,
        calculated_at timestamptz NOT NULL DEFAULT now(),
        data_coverage_percent numeric(5,2) NOT NULL CHECK (data_coverage_percent BETWEEN 0 AND 100),
        feature_values jsonb NOT NULL,
        source_fetch_ids jsonb NOT NULL,
        CHECK (baseline_end_year >= baseline_start_year)
      );

      CREATE TABLE engine_versions (
        engine_version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        version text NOT NULL UNIQUE,
        scoring_config jsonb NOT NULL,
        config_checksum char(64) NOT NULL UNIQUE,
        activated_at timestamptz NOT NULL DEFAULT now(),
        is_active boolean NOT NULL DEFAULT false
      );
      CREATE UNIQUE INDEX one_active_engine_version_idx ON engine_versions(is_active) WHERE is_active;
      INSERT INTO engine_versions(version, scoring_config, config_checksum, is_active)
      VALUES (
        '1.0.0',
        '{"temperatureFitMinimum":65,"waterCoverageMinimum":0.5,"maxCandidatesPerSlot":25,"profileMaxAgeDays":30,"seasonMonths":{"Rabi":[11,12,1,2,3],"Kharif 1":[4,5,6],"Kharif 2":[7,8,9,10]}}'::jsonb,
        '0000000000000000000000000000000000000000000000000000000000000001',
        true
      );

      CREATE TABLE farmer_preferences (
        preference_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        climate_weight_bp integer NOT NULL, water_weight_bp integer NOT NULL,
        soil_weight_bp integer NOT NULL, resilience_weight_bp integer NOT NULL,
        economic_weight_bp integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (climate_weight_bp + water_weight_bp + soil_weight_bp + resilience_weight_bp + economic_weight_bp = 10000)
      );

      CREATE TABLE recommendation_runs (
        recommendation_run_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        farm_id bigint NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
        preference_id bigint NOT NULL REFERENCES farmer_preferences(preference_id),
        engine_version_id bigint NOT NULL REFERENCES engine_versions(engine_version_id),
        start_season_id bigint NOT NULL REFERENCES seasons(season_id),
        horizon integer NOT NULL DEFAULT 3 CHECK (horizon = 3),
        status text NOT NULL CHECK (status IN ('pending','completed','failed')),
        search_mode text CHECK (search_mode IN ('exhaustive','bounded')),
        candidate_count integer, evaluated_count integer, rejected_count integer,
        input_snapshot jsonb NOT NULL,
        input_checksum char(64) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        failure_reason text
      );

      CREATE TABLE rotation_recommendations (
        recommendation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        recommendation_run_id bigint NOT NULL REFERENCES recommendation_runs(recommendation_run_id) ON DELETE CASCADE,
        rank integer NOT NULL CHECK (rank BETWEEN 1 AND 3),
        overall_score numeric(6,3) NOT NULL, climate_score numeric(6,3) NOT NULL,
        water_score numeric(6,3) NOT NULL, soil_score numeric(6,3) NOT NULL,
        resilience_score numeric(6,3) NOT NULL, economic_score numeric(6,3) NOT NULL,
        compatibility_score numeric(6,3) NOT NULL, diversity_score numeric(6,3) NOT NULL,
        total_water_requirement_mm numeric(12,3) NOT NULL,
        total_profit_bdt numeric(16,2) NOT NULL,
        evidence_completeness_percent numeric(5,2) NOT NULL,
        UNIQUE (recommendation_run_id, rank)
      );

      CREATE TABLE rotation_recommendation_items (
        recommendation_item_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        recommendation_id bigint NOT NULL REFERENCES rotation_recommendations(recommendation_id) ON DELETE CASCADE,
        position integer NOT NULL, season_id bigint NOT NULL REFERENCES seasons(season_id), crop_id bigint NOT NULL REFERENCES crops(crop_id),
        planting_date date NOT NULL, harvest_date date NOT NULL,
        climate_score numeric(6,3) NOT NULL, water_score numeric(6,3) NOT NULL,
        soil_score numeric(6,3) NOT NULL, resilience_score numeric(6,3) NOT NULL,
        economic_score numeric(6,3) NOT NULL, weighted_crop_score numeric(6,3) NOT NULL,
        calculation_trace jsonb NOT NULL,
        UNIQUE (recommendation_id, position)
      );

      CREATE TABLE recommendation_explanations (
        explanation_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        recommendation_id bigint NOT NULL REFERENCES rotation_recommendations(recommendation_id) ON DELETE CASCADE,
        recommendation_item_id bigint REFERENCES rotation_recommendation_items(recommendation_item_id) ON DELETE CASCADE,
        kind text NOT NULL CHECK (kind IN ('reason','tradeoff','warning','rejection')),
        component text NOT NULL, explanation_code text NOT NULL,
        impact_points numeric(7,3), rendered_message text NOT NULL,
        evidence jsonb NOT NULL, sort_order integer NOT NULL
      );

      CREATE INDEX farms_user_idx ON farms(user_id);
      CREATE INDEX farm_history_lookup_idx ON farm_crop_history(farm_id, crop_year DESC, season_id);
      CREATE INDEX environmental_profile_farm_idx ON farm_environment_profiles(farm_id, calculated_at DESC);
      CREATE INDEX recommendation_runs_farm_idx ON recommendation_runs(farm_id, created_at DESC);
    `)
  }

  async down() {
    await this.db.rawQuery(`
      DROP TABLE IF EXISTS recommendation_explanations, rotation_recommendation_items, rotation_recommendations,
        recommendation_runs, farmer_preferences, engine_versions, farm_environment_profiles,
        environmental_observations, environmental_fetches CASCADE;
      ALTER TABLE crop_rotation_rules DROP COLUMN IF EXISTS rule_type, DROP COLUMN IF EXISTS compatibility_score,
        DROP COLUMN IF EXISTS soil_adjustment_points, DROP COLUMN IF EXISTS turnaround_days_override,
        DROP COLUMN IF EXISTS source_id, DROP COLUMN IF EXISTS reviewed_at;
      DROP TABLE IF EXISTS crop_economic_data, crop_calendar_windows, crop_requirements,
        farm_soil_measurements, farm_soil_profiles, soil_nutrient_thresholds,
        soil_nutrient_threshold_sets, farm_crop_history, farms, data_sources CASCADE;
    `)
  }
}
