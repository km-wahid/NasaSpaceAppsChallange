#!/usr/bin/env python3
"""Convert the source XLSX into validated relational CSV imports."""

from __future__ import annotations

import csv
import hashlib
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from analyze_dataset import read_xlsx  # noqa: E402


SOURCE = ROOT / "Project_dataset.xlsx"
OUTPUT = ROOT / "database" / "generated"
BATCH_ID = 1


def one_value(rows: list[dict[str, object]], field: str) -> object:
    values = {row[field] for row in rows}
    if len(values) != 1:
        raise ValueError(f"Expected one {field} value, found {len(values)}")
    return next(iter(values))


def write_csv(name: str, headers: list[str], rows: list[list[object]]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with (OUTPUT / name).open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(headers)
        writer.writerows(rows)


def main() -> None:
    _, records = read_xlsx(SOURCE)
    divisions = sorted({str(row["Division"]) for row in records})
    districts = sorted({str(row["District"]) for row in records})
    crops = sorted({str(row["Crop Name"]) for row in records})
    division_ids = {name: index for index, name in enumerate(divisions, 1)}
    district_ids = {name: index for index, name in enumerate(districts, 1)}
    crop_ids = {name: index for index, name in enumerate(crops, 1)}
    season_ids = {"Rabi": 1, "Kharif 1": 2, "Kharif 2": 3}

    by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    by_crop: dict[str, list[dict[str, object]]] = defaultdict(list)
    by_district_season: dict[tuple[str, str], list[dict[str, object]]] = defaultdict(list)
    for row in records:
        by_district[str(row["District"])].append(row)
        by_crop[str(row["Crop Name"])].append(row)
        by_district_season[(str(row["District"]), str(row["Season"]))].append(row)

    source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    write_csv("import_batches.csv", ["batch_id", "source_filename", "source_sha256", "source_row_count", "reporting_year", "imported_at", "notes"], [[
        BATCH_ID, SOURCE.name, source_hash, len(records), "", datetime.now(timezone.utc).isoformat(),
        "The workbook contains no reporting year; temperature and humidity are treated as crop requirements.",
    ]])
    write_csv("divisions.csv", ["division_id", "division_name"], [[division_ids[name], name] for name in divisions])
    write_csv("seasons.csv", ["season_id", "season_name", "description"], [
        [1, "Rabi", "Dry or winter growing season"],
        [2, "Kharif 1", "Pre-monsoon growing season"],
        [3, "Kharif 2", "Main monsoon growing season"],
    ])

    district_rows = []
    soil_rows = []
    risk_rows = []
    for name in districts:
        group = by_district[name]
        district_id = district_ids[name]
        division = str(one_value(group, "Division"))
        district_rows.append([
            district_id, division_ids[division], name, one_value(group, "Latitude"), one_value(group, "Longitude"),
            one_value(group, "AEZ_Name"),
        ])
        soil_rows.append([
            BATCH_ID, district_id, one_value(group, "Soil_Texture"), one_value(group, "Soil_pH_Baseline"),
            one_value(group, "Soil_Organic_Carbon_pct"), one_value(group, "Soil_Nitrogen_Status"),
        ])
        risk_rows.append([
            BATCH_ID, district_id, one_value(group, "Salinity_Risk"), one_value(group, "Drought_Risk"),
            one_value(group, "Flood_Risk"),
        ])
    write_csv("districts.csv", ["district_id", "division_id", "district_name", "latitude", "longitude", "agro_ecological_zone"], district_rows)
    write_csv("district_soil_profiles.csv", ["batch_id", "district_id", "soil_texture", "soil_ph", "soil_organic_carbon_percent", "soil_nitrogen_status"], soil_rows)
    write_csv("district_risk_assessments.csv", ["batch_id", "district_id", "salinity_risk", "drought_risk", "flood_risk"], risk_rows)

    crop_rows = []
    temperature_rows = []
    crop_fields = [
        "Crop_Category", "Growth", "Harvest", "Soil_Health_Role", "Recommended_Rotation_Role",
        "Biological_N_Fixation_kg_ha", "Water_Demand_Category", "Estimated_Water_Need_mm", "Rooting_Depth",
        "Drought_Tolerance", "Salinity_Tolerance", "Flood_Tolerance", "Score_Soil_Health",
        "Score_Water_Conservation", "Score_Economic_Resilience",
    ]
    for name in crops:
        group = by_crop[name]
        crop_id = crop_ids[name]
        values = [one_value(group, field) for field in crop_fields]
        crop_rows.append([crop_id, name, *values])
        temperature_rows.append([
            crop_id, one_value(group, "Avg Temp"), one_value(group, "Max Temp"), one_value(group, "Min Temp"),
            one_value(group, "Avg Humidity"),
        ])
    write_csv("crops.csv", [
        "crop_id", "crop_name", "crop_category", "growth_period", "harvest_period",
        "soil_health_role", "recommended_rotation_role", "biological_nitrogen_fixation_kg_ha",
        "water_demand_category", "estimated_water_need_mm", "rooting_depth", "drought_tolerance",
        "salinity_tolerance", "flood_tolerance", "soil_health_score", "water_conservation_score",
        "economic_resilience_score",
    ], crop_rows)
    write_csv("crop_temperature_requirements.csv", [
        "crop_id", "preferred_average_temperature_c", "maximum_temperature_c", "minimum_temperature_c",
        "preferred_humidity_percent",
    ], temperature_rows)

    climate_rows = []
    for (district, season), group in sorted(by_district_season.items()):
        climate_rows.append([
            BATCH_ID, district_ids[district], season_ids[season], one_value(group, "Seasonal_Rainfall_total_mm"),
            one_value(group, "Seasonal_Solar_Radiation_avg"), one_value(group, "Seasonal_Wind_Speed_avg"),
            one_value(group, "Seasonal_Evapotranspiration_avg"),
        ])
    write_csv("district_season_climate.csv", [
        "batch_id", "district_id", "season_id", "rainfall_mm", "average_solar_radiation",
        "average_wind_speed", "average_evapotranspiration",
    ], climate_rows)

    statistic_rows = []
    window_rows = []
    phases = [
        ("pre_transplant", "pre_trans_month_Rainfall", "pre_trans_month_Solar_Radiation", "pre_trans_month_Wind_Speed", "pre_trans_month_Evapotranspiration"),
        ("transplant", "transplant_month_Rainfall", "transplant_month_Solar_Radiation", "transplant_month_Wind_Speed", "transplant_month_Evapotranspiration"),
        ("post_transplant", "post_trans_month_Rainfall", "post_trans_month_Solar_Radiation", "post_trans_month_Wind_Speed", "post_trans_month_Evapotranspiration"),
    ]
    for statistic_id, (source_row_number, row) in enumerate(enumerate(records, 2), 1):
        area = float(row["Area"])
        production = float(row["Production"])
        quality = "area_missing_for_positive_production" if area == 0 and production > 0 else "structural_zero" if area == 0 else "ok"
        statistic_rows.append([
            statistic_id, BATCH_ID, district_ids[str(row["District"])], crop_ids[str(row["Crop Name"])],
            season_ids[str(row["Season"])], row["Transplant"], area, production, row["Yield_MT_ha"],
            source_row_number, quality,
        ])
        for phase, rainfall, solar, wind, evapotranspiration in phases:
            window_rows.append([statistic_id, phase, row[rainfall], row[solar], row[wind], row[evapotranspiration]])
    write_csv("district_crop_statistics.csv", [
        "statistic_id", "batch_id", "district_id", "crop_id", "season_id", "transplant_period", "area_acres",
        "production_metric_tonnes", "reported_yield_metric_tonnes_per_hectare", "source_row_number",
        "data_quality_status",
    ], statistic_rows)
    write_csv("crop_climate_windows.csv", [
        "statistic_id", "phase", "rainfall_mm", "solar_radiation", "wind_speed", "evapotranspiration",
    ], window_rows)

    expected = {
        "divisions": (len(divisions), 8), "districts": (len(districts), 64), "crops": (len(crops), 72),
        "district-season climate rows": (len(climate_rows), 192), "statistics": (len(statistic_rows), 4607),
        "climate windows": (len(window_rows), 13821),
    }
    for label, (actual, wanted) in expected.items():
        if actual != wanted:
            raise ValueError(f"{label}: expected {wanted}, found {actual}")
    print(f"Prepared {len(records):,} records in {OUTPUT}")


if __name__ == "__main__":
    main()
