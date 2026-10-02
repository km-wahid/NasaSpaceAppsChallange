CREATE OR REPLACE VIEW district_crop_water_balance AS
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

CREATE OR REPLACE VIEW district_portfolio_summary AS
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

CREATE OR REPLACE VIEW soil_health_change AS
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
