BEGIN;

TRUNCATE TABLE
  crop_climate_windows,
  district_crop_statistics,
  district_season_climate,
  crop_temperature_requirements,
  district_risk_assessments,
  district_soil_profiles,
  districts,
  crops,
  seasons,
  divisions,
  import_batches
RESTART IDENTITY CASCADE;

\copy import_batches (batch_id, source_filename, source_sha256, source_row_count, reporting_year, imported_at, notes) FROM '/imports/generated/import_batches.csv' WITH (FORMAT csv, HEADER true)
\copy divisions (division_id, division_name) FROM '/imports/generated/divisions.csv' WITH (FORMAT csv, HEADER true)
\copy seasons (season_id, season_name, description) FROM '/imports/generated/seasons.csv' WITH (FORMAT csv, HEADER true)
\copy districts (district_id, division_id, district_name, latitude, longitude, agro_ecological_zone) FROM '/imports/generated/districts.csv' WITH (FORMAT csv, HEADER true)
\copy district_soil_profiles (batch_id, district_id, soil_texture, soil_ph, soil_organic_carbon_percent, soil_nitrogen_status) FROM '/imports/generated/district_soil_profiles.csv' WITH (FORMAT csv, HEADER true)
\copy district_risk_assessments (batch_id, district_id, salinity_risk, drought_risk, flood_risk) FROM '/imports/generated/district_risk_assessments.csv' WITH (FORMAT csv, HEADER true)
\copy crops (crop_id, crop_name, crop_category, growth_period, harvest_period, soil_health_role, recommended_rotation_role, biological_nitrogen_fixation_kg_ha, water_demand_category, estimated_water_need_mm, rooting_depth, drought_tolerance, salinity_tolerance, flood_tolerance, soil_health_score, water_conservation_score, economic_resilience_score) FROM '/imports/generated/crops.csv' WITH (FORMAT csv, HEADER true)
\copy crop_temperature_requirements (crop_id, preferred_average_temperature_c, maximum_temperature_c, minimum_temperature_c, preferred_humidity_percent) FROM '/imports/generated/crop_temperature_requirements.csv' WITH (FORMAT csv, HEADER true)
\copy district_season_climate (batch_id, district_id, season_id, rainfall_mm, average_solar_radiation, average_wind_speed, average_evapotranspiration) FROM '/imports/generated/district_season_climate.csv' WITH (FORMAT csv, HEADER true)
\copy district_crop_statistics (statistic_id, batch_id, district_id, crop_id, season_id, transplant_period, area_acres, production_metric_tonnes, reported_yield_metric_tonnes_per_hectare, source_row_number, data_quality_status) FROM '/imports/generated/district_crop_statistics.csv' WITH (FORMAT csv, HEADER true)
\copy crop_climate_windows (statistic_id, phase, rainfall_mm, solar_radiation, wind_speed, evapotranspiration) FROM '/imports/generated/crop_climate_windows.csv' WITH (FORMAT csv, HEADER true)

SELECT setval(pg_get_serial_sequence('import_batches', 'batch_id'), COALESCE(MAX(batch_id), 1), MAX(batch_id) IS NOT NULL) FROM import_batches;
SELECT setval(pg_get_serial_sequence('divisions', 'division_id'), COALESCE(MAX(division_id), 1), MAX(division_id) IS NOT NULL) FROM divisions;
SELECT setval(pg_get_serial_sequence('seasons', 'season_id'), COALESCE(MAX(season_id), 1), MAX(season_id) IS NOT NULL) FROM seasons;
SELECT setval(pg_get_serial_sequence('districts', 'district_id'), COALESCE(MAX(district_id), 1), MAX(district_id) IS NOT NULL) FROM districts;
SELECT setval(pg_get_serial_sequence('crops', 'crop_id'), COALESCE(MAX(crop_id), 1), MAX(crop_id) IS NOT NULL) FROM crops;
SELECT setval(pg_get_serial_sequence('district_crop_statistics', 'statistic_id'), COALESCE(MAX(statistic_id), 1), MAX(statistic_id) IS NOT NULL) FROM district_crop_statistics;

COMMIT;
