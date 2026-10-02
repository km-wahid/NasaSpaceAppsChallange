PRAGMA foreign_keys = ON;

CREATE TABLE import_batches (
  batch_id INTEGER PRIMARY KEY,
  source_filename TEXT NOT NULL,
  source_sha256 TEXT NOT NULL UNIQUE CHECK (length(source_sha256) = 64),
  source_row_count INTEGER NOT NULL CHECK (source_row_count >= 0),
  reporting_year INTEGER,
  imported_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE divisions (
  division_id INTEGER PRIMARY KEY,
  division_name TEXT NOT NULL UNIQUE
);

CREATE TABLE seasons (
  season_id INTEGER PRIMARY KEY,
  season_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE districts (
  district_id INTEGER PRIMARY KEY,
  division_id INTEGER NOT NULL REFERENCES divisions(division_id),
  district_name TEXT NOT NULL UNIQUE,
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  agro_ecological_zone TEXT NOT NULL
);

CREATE TABLE district_soil_profiles (
  batch_id INTEGER NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(district_id) ON DELETE CASCADE,
  soil_texture TEXT NOT NULL,
  soil_ph REAL NOT NULL CHECK (soil_ph BETWEEN 0 AND 14),
  soil_organic_carbon_percent REAL NOT NULL CHECK (soil_organic_carbon_percent >= 0),
  soil_nitrogen_status TEXT NOT NULL CHECK (soil_nitrogen_status IN ('Very Low', 'Low', 'Medium', 'High', 'Very High')),
  PRIMARY KEY (batch_id, district_id)
);

CREATE TABLE district_risk_assessments (
  batch_id INTEGER NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(district_id) ON DELETE CASCADE,
  salinity_risk TEXT NOT NULL CHECK (salinity_risk IN ('Non-Saline', 'Low', 'Moderate', 'High', 'Very High')),
  drought_risk TEXT NOT NULL CHECK (drought_risk IN ('Low', 'Moderate', 'High', 'Very High')),
  flood_risk TEXT NOT NULL CHECK (flood_risk IN ('Low', 'Moderate', 'High', 'Very High')),
  PRIMARY KEY (batch_id, district_id)
);

CREATE TABLE crops (
  crop_id INTEGER PRIMARY KEY,
  crop_name TEXT NOT NULL UNIQUE,
  crop_category TEXT NOT NULL,
  growth_period TEXT NOT NULL,
  harvest_period TEXT NOT NULL,
  soil_health_role TEXT NOT NULL,
  recommended_rotation_role TEXT NOT NULL,
  biological_nitrogen_fixation_kg_ha REAL NOT NULL CHECK (biological_nitrogen_fixation_kg_ha >= 0),
  water_demand_category TEXT NOT NULL,
  estimated_water_need_mm REAL NOT NULL CHECK (estimated_water_need_mm >= 0),
  rooting_depth TEXT NOT NULL,
  drought_tolerance TEXT NOT NULL,
  salinity_tolerance TEXT NOT NULL,
  flood_tolerance TEXT NOT NULL,
  soil_health_score REAL NOT NULL CHECK (soil_health_score BETWEEN 0 AND 10),
  water_conservation_score REAL NOT NULL CHECK (water_conservation_score BETWEEN 0 AND 10),
  economic_resilience_score REAL NOT NULL CHECK (economic_resilience_score BETWEEN 0 AND 10)
);

CREATE TABLE crop_temperature_requirements (
  crop_id INTEGER PRIMARY KEY REFERENCES crops(crop_id) ON DELETE CASCADE,
  preferred_average_temperature_c REAL NOT NULL,
  maximum_temperature_c REAL NOT NULL,
  minimum_temperature_c REAL NOT NULL,
  preferred_humidity_percent REAL NOT NULL CHECK (preferred_humidity_percent BETWEEN 0 AND 100),
  CHECK (minimum_temperature_c <= preferred_average_temperature_c),
  CHECK (preferred_average_temperature_c <= maximum_temperature_c)
);

CREATE TABLE district_season_climate (
  batch_id INTEGER NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(district_id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(season_id),
  rainfall_mm REAL NOT NULL CHECK (rainfall_mm >= 0),
  average_solar_radiation REAL NOT NULL,
  average_wind_speed REAL NOT NULL CHECK (average_wind_speed >= 0),
  average_evapotranspiration REAL NOT NULL CHECK (average_evapotranspiration >= 0),
  PRIMARY KEY (batch_id, district_id, season_id)
);

CREATE TABLE district_crop_statistics (
  statistic_id INTEGER PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES import_batches(batch_id) ON DELETE CASCADE,
  district_id INTEGER NOT NULL REFERENCES districts(district_id) ON DELETE CASCADE,
  crop_id INTEGER NOT NULL REFERENCES crops(crop_id),
  season_id INTEGER NOT NULL REFERENCES seasons(season_id),
  transplant_period TEXT NOT NULL,
  area_acres REAL NOT NULL CHECK (area_acres >= 0),
  production_metric_tonnes REAL NOT NULL CHECK (production_metric_tonnes >= 0),
  reported_yield_metric_tonnes_per_hectare REAL NOT NULL CHECK (reported_yield_metric_tonnes_per_hectare >= 0),
  source_row_number INTEGER NOT NULL CHECK (source_row_number >= 2),
  data_quality_status TEXT NOT NULL CHECK (data_quality_status IN ('ok', 'structural_zero', 'area_missing_for_positive_production')),
  UNIQUE (batch_id, district_id, crop_id)
);

CREATE TABLE crop_climate_windows (
  statistic_id INTEGER NOT NULL REFERENCES district_crop_statistics(statistic_id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('pre_transplant', 'transplant', 'post_transplant')),
  rainfall_mm REAL NOT NULL CHECK (rainfall_mm >= 0),
  solar_radiation REAL NOT NULL,
  wind_speed REAL NOT NULL CHECK (wind_speed >= 0),
  evapotranspiration REAL NOT NULL CHECK (evapotranspiration >= 0),
  PRIMARY KEY (statistic_id, phase)
);

CREATE TABLE extreme_weather_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_id INTEGER NOT NULL REFERENCES districts(district_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('flood', 'drought', 'cyclone', 'heatwave', 'salinity_intrusion', 'other')),
  event_start_date TEXT NOT NULL,
  event_end_date TEXT,
  severity TEXT,
  rainfall_mm REAL,
  affected_area_acres REAL,
  estimated_crop_loss_metric_tonnes REAL,
  notes TEXT,
  CHECK (event_end_date IS NULL OR event_end_date >= event_start_date)
);

CREATE TABLE soil_tests (
  soil_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_id INTEGER NOT NULL REFERENCES districts(district_id),
  sample_date TEXT NOT NULL,
  soil_ph REAL CHECK (soil_ph BETWEEN 0 AND 14),
  soil_organic_carbon_percent REAL CHECK (soil_organic_carbon_percent >= 0),
  nitrogen_status TEXT,
  salinity_level REAL,
  source TEXT,
  UNIQUE (district_id, sample_date, source)
);

CREATE TABLE agricultural_plots (
  plot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_id INTEGER NOT NULL REFERENCES districts(district_id),
  plot_name TEXT NOT NULL,
  area_acres REAL CHECK (area_acres > 0),
  UNIQUE (district_id, plot_name)
);

CREATE TABLE plot_crop_history (
  plot_id INTEGER NOT NULL REFERENCES agricultural_plots(plot_id) ON DELETE CASCADE,
  crop_id INTEGER NOT NULL REFERENCES crops(crop_id),
  season_id INTEGER NOT NULL REFERENCES seasons(season_id),
  crop_year INTEGER NOT NULL,
  production_metric_tonnes REAL,
  PRIMARY KEY (plot_id, crop_year, season_id)
);

CREATE TABLE crop_rotation_rules (
  current_crop_id INTEGER NOT NULL REFERENCES crops(crop_id) ON DELETE CASCADE,
  recommended_next_crop_id INTEGER NOT NULL REFERENCES crops(crop_id) ON DELETE CASCADE,
  recommendation_reason TEXT NOT NULL,
  minimum_break_seasons INTEGER NOT NULL DEFAULT 0 CHECK (minimum_break_seasons >= 0),
  PRIMARY KEY (current_crop_id, recommended_next_crop_id),
  CHECK (current_crop_id <> recommended_next_crop_id)
);

CREATE INDEX district_crop_statistics_district_idx ON district_crop_statistics (district_id);
CREATE INDEX district_crop_statistics_crop_idx ON district_crop_statistics (crop_id);
CREATE INDEX district_crop_statistics_season_idx ON district_crop_statistics (season_id);
CREATE INDEX extreme_weather_events_district_date_idx ON extreme_weather_events (district_id, event_start_date);
CREATE INDEX soil_tests_district_date_idx ON soil_tests (district_id, sample_date);

CREATE VIEW district_crop_water_balance AS
SELECT
  statistics.statistic_id,
  statistics.batch_id,
  districts.district_name,
  crops.crop_name,
  seasons.season_name,
  climate.rainfall_mm AS seasonal_rainfall_mm,
  crops.estimated_water_need_mm,
  climate.rainfall_mm - crops.estimated_water_need_mm AS water_balance_mm,
  statistics.area_acres,
  statistics.production_metric_tonnes,
  statistics.reported_yield_metric_tonnes_per_hectare
FROM district_crop_statistics AS statistics
JOIN districts USING (district_id)
JOIN crops USING (crop_id)
JOIN seasons USING (season_id)
JOIN district_season_climate AS climate
  ON climate.batch_id = statistics.batch_id
 AND climate.district_id = statistics.district_id
 AND climate.season_id = statistics.season_id;

CREATE VIEW district_portfolio_summary AS
SELECT
  statistics.batch_id,
  districts.district_id,
  districts.district_name,
  divisions.division_name,
  SUM(statistics.area_acres) AS area_acres,
  SUM(statistics.production_metric_tonnes) AS production_metric_tonnes,
  SUM(statistics.production_metric_tonnes)
    / NULLIF(SUM(statistics.area_acres) * 0.40468564224, 0)
    AS calculated_yield_metric_tonnes_per_hectare,
  SUM(water.water_balance_mm * statistics.area_acres)
    / NULLIF(SUM(statistics.area_acres), 0) AS area_weighted_water_balance_mm
FROM district_crop_statistics AS statistics
JOIN districts USING (district_id)
JOIN divisions USING (division_id)
JOIN district_crop_water_balance AS water USING (statistic_id)
GROUP BY statistics.batch_id, districts.district_id, districts.district_name, divisions.division_name;

CREATE VIEW soil_health_change AS
SELECT
  soil_test_id,
  district_id,
  sample_date,
  soil_ph,
  soil_organic_carbon_percent,
  soil_organic_carbon_percent
    - LAG(soil_organic_carbon_percent) OVER (PARTITION BY district_id ORDER BY sample_date)
    AS organic_carbon_change_percent,
  nitrogen_status,
  salinity_level
FROM soil_tests;
