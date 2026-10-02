#!/usr/bin/env python3
"""Profile Project_dataset.xlsx with only the Python standard library."""

from __future__ import annotations

import json
import math
import re
import statistics
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Project_dataset.xlsx"
OUTPUT = ROOT / "analysis" / "analysis_summary.json"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
ACRE_TO_HECTARE = 0.40468564224


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref).group(0)
    value = 0
    for char in letters:
        value = value * 26 + ord(char) - 64
    return value - 1


def read_xlsx(path: Path) -> tuple[list[str], list[dict[str, object]]]:
    with zipfile.ZipFile(path) as archive:
        strings_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in item.iter(NS + "t")) for item in strings_root.findall(NS + "si")]
        rows: list[list[object]] = []
        with archive.open("xl/worksheets/sheet1.xml") as sheet:
            for _, element in ET.iterparse(sheet, events=("end",)):
                if element.tag != NS + "row":
                    continue
                values: list[object] = []
                for cell in element.findall(NS + "c"):
                    index = column_index(cell.get("r", "A1"))
                    while len(values) <= index:
                        values.append(None)
                    value_element = cell.find(NS + "v")
                    value: object = None if value_element is None else value_element.text
                    if cell.get("t") == "s" and value is not None:
                        value = shared[int(value)]
                    elif cell.get("t") == "inlineStr":
                        inline = cell.find(NS + "is")
                        value = "".join(t.text or "" for t in inline.iter(NS + "t")) if inline is not None else ""
                    values[index] = value
                rows.append(values)
                element.clear()

    headers = [str(value) for value in rows[0]]
    records = []
    for row in rows[1:]:
        row += [None] * (len(headers) - len(row))
        record: dict[str, object] = {}
        for header, value in zip(headers, row):
            if value is None or value == "":
                record[header] = None
                continue
            try:
                record[header] = float(value)
            except (TypeError, ValueError):
                record[header] = str(value).strip()
        records.append(record)
    return headers, records


def weighted_average(rows: list[dict[str, object]], field: str, weight: str = "Area") -> float:
    total_weight = sum(float(row[weight]) for row in rows if row[field] is not None and row[weight] is not None)
    return sum(float(row[field]) * float(row[weight]) for row in rows if row[field] is not None and row[weight] is not None) / total_weight


def group_summary(rows: list[dict[str, object]], field: str) -> list[dict[str, object]]:
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        grouped[str(row[field])].append(row)
    output = []
    for name, group in grouped.items():
        area_acres = sum(float(row["Area"]) for row in group)
        production = sum(float(row["Production"]) for row in group)
        output.append(
            {
                field: name,
                "records": len(group),
                "area_acres": round(area_acres, 2),
                "production_mt": round(production, 2),
                "yield_mt_ha": round(production / (area_acres * ACRE_TO_HECTARE), 3) if area_acres else None,
                "rain_balance_mm": round(weighted_average(group, "Rainfall_Deficit_Surplus_mm"), 1),
                "water_need_mm": round(weighted_average(group, "Estimated_Water_Need_mm"), 1),
                "soil_score": round(weighted_average(group, "Score_Soil_Health"), 2),
                "water_score": round(weighted_average(group, "Score_Water_Conservation"), 2),
                "economic_score": round(weighted_average(group, "Score_Economic_Resilience"), 2),
            }
        )
    return output


def risk_summary(rows: list[dict[str, object]], field: str) -> list[dict[str, object]]:
    total = sum(float(row["Area"]) for row in rows)
    area_by_level: Counter[str] = Counter()
    for row in rows:
        area_by_level[str(row[field])] += float(row["Area"])
    order = {"Non-Saline": 0, "Low": 1, "Moderate": 2, "High": 3, "Very High": 4}
    return [
        {"level": level, "area_acres": round(area, 2), "area_share_pct": round(area / total * 100, 2)}
        for level, area in sorted(area_by_level.items(), key=lambda item: order.get(item[0], 99))
    ]


def pearson(pairs: list[tuple[float, float]]) -> float | None:
    if len(pairs) < 3:
        return None
    xs, ys = zip(*pairs)
    mean_x, mean_y = statistics.fmean(xs), statistics.fmean(ys)
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
    denominator = math.sqrt(sum((x - mean_x) ** 2 for x in xs) * sum((y - mean_y) ** 2 for y in ys))
    return numerator / denominator if denominator else None


def main() -> None:
    headers, rows = read_xlsx(SOURCE)
    numeric_fields = [header for header in headers if all(row[header] is None or isinstance(row[header], float) for row in rows)]
    missing = {header: sum(row[header] is None for row in rows) for header in headers}
    exact_duplicates = len(rows) - len({tuple(row[header] for header in headers) for row in rows})
    keys = Counter((row["District"], row["Crop Name"]) for row in rows)
    duplicate_keys = sum(count - 1 for count in keys.values() if count > 1)

    districts = sorted({str(row["District"]) for row in rows})
    crops = sorted({str(row["Crop Name"]) for row in rows})
    missing_pairs = [
        {"district": district, "crop": crop}
        for district in districts
        for crop in crops
        if (district, crop) not in keys
    ]

    yield_errors = []
    zero_area_rows = []
    rain_errors = []
    for row in rows:
        if float(row["Area"]) > 0:
            calculated_yield = float(row["Production"]) / (float(row["Area"]) * ACRE_TO_HECTARE)
            yield_errors.append(abs(calculated_yield - float(row["Yield_MT_ha"])))
        else:
            zero_area_rows.append({
                "district": row["District"],
                "crop": row["Crop Name"],
                "production_mt": row["Production"],
                "yield_mt_ha": row["Yield_MT_ha"],
            })
        calculated_balance = float(row["Seasonal_Rainfall_total_mm"]) - float(row["Estimated_Water_Need_mm"])
        rain_errors.append(abs(calculated_balance - float(row["Rainfall_Deficit_Surplus_mm"])))

    total_area = sum(float(row["Area"]) for row in rows)
    total_production = sum(float(row["Production"]) for row in rows)
    deficit_area = sum(float(row["Area"]) for row in rows if float(row["Rainfall_Deficit_Surplus_mm"]) < 0)
    deficit_production = sum(float(row["Production"]) for row in rows if float(row["Rainfall_Deficit_Surplus_mm"]) < 0)

    crop_rows = group_summary(rows, "Crop Name")
    division_rows = group_summary(rows, "Division")
    category_rows = group_summary(rows, "Crop_Category")
    district_rows = group_summary(rows, "District")
    for collection in (crop_rows, division_rows, category_rows, district_rows):
        for item in collection:
            item["area_share_pct"] = round(float(item["area_acres"]) / total_area * 100, 2)
            item["production_share_pct"] = round(float(item["production_mt"]) / total_production * 100, 2)

    rows_by_district: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        rows_by_district[str(row["District"])].append(row)
    district_by_name = {str(row["District"]): row for row in district_rows}
    fixed_district_fields = [
        "Division", "Latitude", "Longitude", "AEZ_Name", "Soil_Texture", "Soil_pH_Baseline",
        "Soil_Organic_Carbon_pct", "Soil_Nitrogen_Status", "Salinity_Risk", "Drought_Risk", "Flood_Risk",
    ]
    district_field_violations = []
    for district, district_group in rows_by_district.items():
        profile = district_by_name[district]
        for field in fixed_district_fields:
            values = {row[field] for row in district_group}
            if len(values) != 1:
                district_field_violations.append({"district": district, "field": field, "distinct_values": len(values)})
            else:
                profile[field] = next(iter(values))
        for season, alias in (("Rabi", "rabi_rainfall_mm"), ("Kharif 1", "kharif1_rainfall_mm"), ("Kharif 2", "kharif2_rainfall_mm")):
            values = {float(row["Seasonal_Rainfall_total_mm"]) for row in district_group if row["Season"] == season}
            if len(values) != 1:
                district_field_violations.append({"district": district, "field": alias, "distinct_values": len(values)})
            else:
                profile[alias] = round(next(iter(values)), 1)
        leaders = sorted(district_group, key=lambda row: float(row["Production"]), reverse=True)[:3]
        profile["leading_crops"] = ", ".join(str(row["Crop Name"]) for row in leaders)

    crop_means: dict[str, tuple[float, float]] = {}
    for crop in crops:
        crop_group = [row for row in rows if row["Crop Name"] == crop]
        crop_means[crop] = (
            statistics.fmean(float(row["Rainfall_Deficit_Surplus_mm"]) for row in crop_group),
            statistics.fmean(float(row["Yield_MT_ha"]) for row in crop_group),
        )
    within_crop_pairs = [
        (
            float(row["Rainfall_Deficit_Surplus_mm"]) - crop_means[str(row["Crop Name"])][0],
            float(row["Yield_MT_ha"]) - crop_means[str(row["Crop Name"])][1],
        )
        for row in rows
    ]

    result = {
        "source": {
            "file": str(SOURCE.relative_to(ROOT)),
            "sheet": "Sheet1",
            "rows": len(rows),
            "columns": len(headers),
            "headers": headers,
            "numeric_fields": numeric_fields,
        },
        "quality": {
            "missing_cells_by_field": missing,
            "exact_duplicate_rows": exact_duplicates,
            "duplicate_district_crop_keys": duplicate_keys,
            "zero_area_row_count": len(zero_area_rows),
            "zero_area_positive_production_count": sum(float(row["production_mt"]) > 0 for row in zero_area_rows),
            "zero_area_positive_production_examples": [
                row for row in zero_area_rows if float(row["production_mt"]) > 0
            ][:10],
            "district_count": len(districts),
            "crop_count": len(crops),
            "expected_district_crop_pairs": len(districts) * len(crops),
            "missing_district_crop_pairs": missing_pairs,
            "yield_formula": "Production_MT / (Area_acres * 0.40468564224)",
            "yield_max_absolute_error": max(yield_errors),
            "yield_mean_absolute_error": statistics.fmean(yield_errors),
            "rain_balance_formula": "Seasonal_Rainfall_total_mm - Estimated_Water_Need_mm",
            "rain_balance_max_absolute_error": max(rain_errors),
            "district_field_violations": district_field_violations,
            "district_temperature_distinct_counts": {
                field: sorted({len({row[field] for row in group}) for group in rows_by_district.values()})
                for field in ("Avg Temp", "Max Temp", "Min Temp", "Avg Humidity")
            },
            "freshness": "Not assessable: the workbook has no year, date, or extraction timestamp field.",
        },
        "portfolio": {
            "area_acres": round(total_area, 2),
            "area_hectares": round(total_area * ACRE_TO_HECTARE, 2),
            "production_mt": round(total_production, 2),
            "weighted_yield_mt_ha": round(total_production / (total_area * ACRE_TO_HECTARE), 3),
            "deficit_area_acres": round(deficit_area, 2),
            "deficit_area_share_pct": round(deficit_area / total_area * 100, 2),
            "deficit_production_mt": round(deficit_production, 2),
            "deficit_production_share_pct": round(deficit_production / total_production * 100, 2),
            "area_weighted_rain_balance_mm": round(weighted_average(rows, "Rainfall_Deficit_Surplus_mm"), 1),
            "within_crop_rain_balance_yield_correlation": round(pearson(within_crop_pairs), 4),
        },
        "by_crop": sorted(crop_rows, key=lambda row: row["production_mt"], reverse=True),
        "by_division": sorted(division_rows, key=lambda row: row["production_mt"], reverse=True),
        "by_category": sorted(category_rows, key=lambda row: row["production_mt"], reverse=True),
        "by_district": sorted(district_rows, key=lambda row: row["production_mt"], reverse=True),
        "district_summary": {
            "district_count": len(district_rows),
            "deficit_district_count": sum(float(row["rain_balance_mm"]) < 0 for row in district_rows),
            "deficit_district_area_share_pct": round(
                sum(float(row["area_acres"]) for row in district_rows if float(row["rain_balance_mm"]) < 0) / total_area * 100, 2
            ),
            "deficit_district_production_share_pct": round(
                sum(float(row["production_mt"]) for row in district_rows if float(row["rain_balance_mm"]) < 0) / total_production * 100, 2
            ),
            "high_or_very_high_drought_count": sum(row["Drought_Risk"] in ("High", "Very High") for row in district_rows),
            "high_or_very_high_flood_count": sum(row["Flood_Risk"] in ("High", "Very High") for row in district_rows),
            "high_salinity_count": sum(row["Salinity_Risk"] == "High" for row in district_rows),
            "multiple_high_risk_districts": sorted(
                str(row["District"]) for row in district_rows
                if sum(row[field] in ("High", "Very High") for field in ("Drought_Risk", "Flood_Risk", "Salinity_Risk")) >= 2
            ),
        },
        "risks": {
            "drought": risk_summary(rows, "Drought_Risk"),
            "flood": risk_summary(rows, "Flood_Risk"),
            "salinity": risk_summary(rows, "Salinity_Risk"),
        },
    }

    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(json.dumps(result, indent=2), encoding="utf-8")

    assert len(rows) == 4607 and len(headers) == 54
    assert exact_duplicates == 0 and duplicate_keys == 0
    assert not district_field_violations
    assert len(district_rows) == 64
    assert max(rain_errors) <= 0.051  # workbook balance is stored to one decimal place
    print(json.dumps({
        "output": str(OUTPUT),
        "rows": len(rows),
        "districts": len(districts),
        "crops": len(crops),
        "missing_pairs": missing_pairs,
        "portfolio": result["portfolio"],
        "yield_max_error": max(yield_errors),
    }, indent=2))


if __name__ == "__main__":
    main()
