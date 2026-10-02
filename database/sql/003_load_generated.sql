BEGIN;

TRUNCATE TABLE import_batches, divisions, seasons, districts, crops RESTART IDENTITY CASCADE;

COPY import_batches (batch_id, source_filename, source_sha256, source_row_count, reporting_year, imported_at, notes)
FROM '/imports/import_batches.csv' WITH (FORMAT csv, HEADER true);
COPY divisions FROM '/imports/divisions.csv' WITH (FORMAT csv, HEADER true);
COPY seasons FROM '/imports/seasons.csv' WITH (FORMAT csv, HEADER true);
COPY districts FROM '/imports/districts.csv' WITH (FORMAT csv, HEADER true);
COPY district_soil_profiles FROM '/imports/district_soil_profiles.csv' WITH (FORMAT csv, HEADER true);
COPY district_risk_assessments FROM '/imports/district_risk_assessments.csv' WITH (FORMAT csv, HEADER true);
COPY crops FROM '/imports/crops.csv' WITH (FORMAT csv, HEADER true);
COPY crop_temperature_requirements FROM '/imports/crop_temperature_requirements.csv' WITH (FORMAT csv, HEADER true);
COPY district_season_climate FROM '/imports/district_season_climate.csv' WITH (FORMAT csv, HEADER true);
COPY district_crop_statistics FROM '/imports/district_crop_statistics.csv' WITH (FORMAT csv, HEADER true);
COPY crop_climate_windows FROM '/imports/crop_climate_windows.csv' WITH (FORMAT csv, HEADER true);

SELECT setval(pg_get_serial_sequence('import_batches', 'batch_id'), MAX(batch_id), true) FROM import_batches;
SELECT setval(pg_get_serial_sequence('divisions', 'division_id'), MAX(division_id), true) FROM divisions;
SELECT setval(pg_get_serial_sequence('seasons', 'season_id'), MAX(season_id), true) FROM seasons;
SELECT setval(pg_get_serial_sequence('districts', 'district_id'), MAX(district_id), true) FROM districts;
SELECT setval(pg_get_serial_sequence('crops', 'crop_id'), MAX(crop_id), true) FROM crops;
SELECT setval(pg_get_serial_sequence('district_crop_statistics', 'statistic_id'), MAX(statistic_id), true) FROM district_crop_statistics;

COMMIT;
