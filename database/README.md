# Local agriculture relational database

The working database is stored locally at `database/agriculture.sqlite`. It is a
single SQLite file, so it needs no server, password, or administrator access.
The source is `Project_dataset.xlsx`.

## Build or rebuild

```sh
python3 database/build_sqlite_database.py
```

The command validates the workbook, rebuilds the database atomically, checks all
foreign keys, and reconciles the expected record counts. Rebuilding replaces the
whole local file, including manually added future observations.

## Populated tables

| Table | Full meaning | Rows |
|---|---|---:|
| `divisions` | Bangladesh administrative divisions | 8 |
| `districts` | District identity, coordinates, division, and agro-ecological zone | 64 |
| `seasons` | Rabi, Kharif 1, and Kharif 2 growing seasons | 3 |
| `crops` | Crop properties, water need, tolerances, and resilience scores | 72 |
| `crop_temperature_requirements` | Preferred crop temperature and humidity requirements | 72 |
| `district_soil_profiles` | Baseline soil texture, pH, organic carbon, and nitrogen status by district | 64 |
| `district_risk_assessments` | Salinity, drought, and flood risk by district | 64 |
| `district_season_climate` | Seasonal rainfall, solar radiation, wind speed, and evapotranspiration | 192 |
| `district_crop_statistics` | District-crop season, transplant period, area, production, yield, and quality status | 4,607 |
| `crop_climate_windows` | Climate during pre-transplant, transplant, and post-transplant stages | 13,821 |
| `import_batches` | Source filename, checksum, time, and imported row count | 1 |

`pH` means potential of hydrogen (soil acidity or alkalinity). `Organic carbon
percent` is the share of soil made up of organic carbon. `Evapotranspiration` is
water transferred from soil and plants to the atmosphere. `MT/ha` means metric
tonnes per hectare. `mm` means millimetres.

## Empty tables ready for future data

- `extreme_weather_events`: dated floods, droughts, cyclones, heatwaves, and salinity events.
- `soil_tests`: repeated soil measurements used to detect declining soil health.
- `agricultural_plots`: individual farms or plots inside a district.
- `plot_crop_history`: crop rotation history by plot, year, and season.
- `crop_rotation_rules`: allowed or recommended next crops.

These tables are deliberately empty because the workbook does not contain the
dated or plot-level observations needed to populate them truthfully.

## Analytical views

- `district_crop_water_balance`: seasonal rainfall minus estimated crop water need.
- `district_portfolio_summary`: area, production, calculated yield, and water balance for each district.
- `soil_health_change`: change in organic carbon between consecutive soil tests.

## Load into the root Docker PostgreSQL service

The AdonisJS app uses PostgreSQL from the root `docker.yml`. From the repository
root, load or refresh the generated records with:

```sh
docker compose -f docker.yml up -d
docker compose -f docker.yml exec -T postgres psql -v ON_ERROR_STOP=1 -U nasaweb -d nasaweb -f /imports/load_postgres.sql
```

The import is repeatable: it refreshes the populated source tables and leaves
the empty future-data tables ready for application writes.
