#!/usr/bin/env python3
"""Turn the reviewed workbook aggregates into the Data report snapshot."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SUMMARY_PATH = ROOT / "analysis" / "analysis_summary.json"
OUTPUT = ROOT / "analysis" / "report_snapshot.json"
REPORT_DATA = ROOT / "reports" / "agriculture_portfolio_report" / "src" / "data.json"


def source(label: str, grain: str, methods: list[str], component_ids: list[str]) -> dict:
    return {
        "label": label,
        "files": ["Project_dataset.xlsx"],
        "filters": [f"Sheet1; {grain}", "All 4,607 workbook records included unless the component states otherwise."],
        "evidenceFlow": [
            {"title": "Workbook read", "detail": "Sheet1 from Project_dataset.xlsx was parsed from the XLSX Open XML package."},
            {"title": "Quality checks", "detail": "Checked missingness, exact duplicates, district-crop uniqueness, key coverage, and derived-field reconciliation."},
            {"title": "Aggregation", "detail": "Area-weighted averages and additive area/production totals were calculated with scripts/analyze_dataset.py."},
        ],
        "metricDefinitions": [
            {
                "label": "Area",
                "definition": "Recorded cultivated area in acres. Hectares use 1 acre = 0.40468564224 hectares.",
                "componentIds": component_ids,
                "sourceLineage": [{"files": ["Project_dataset.xlsx"]}],
            },
            {
                "label": "Production",
                "definition": "Recorded crop production in metric tonnes.",
                "componentIds": component_ids,
                "sourceLineage": [{"files": ["Project_dataset.xlsx"]}],
            },
            {
                "label": "Portfolio yield",
                "definition": "Production divided by converted cultivated area; expressed as metric tonnes per hectare.",
                "formula": "production_mt / (area_acres * 0.40468564224)",
                "componentIds": component_ids,
                "sourceLineage": [{"files": ["Project_dataset.xlsx"]}],
            },
            {
                "label": "Rainfall balance",
                "definition": "Seasonal rainfall minus estimated crop water need. Negative values indicate a modeled deficit, not measured irrigation demand.",
                "formula": "Seasonal_Rainfall_total_mm - Estimated_Water_Need_mm",
                "componentIds": component_ids,
                "sourceLineage": [{"files": ["Project_dataset.xlsx"]}],
            },
        ],
        "methods": [{"language": "python", "code": method} for method in methods],
    }


def main() -> None:
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
    portfolio = summary["portfolio"]
    crops = summary["by_crop"]
    divisions = summary["by_division"]
    categories = summary["by_category"]
    districts = summary["by_district"]
    district_summary = summary["district_summary"]

    risk_rows = []
    for risk, levels in summary["risks"].items():
        shares = {row["level"]: row["area_share_pct"] for row in levels}
        risk_rows.append({
            "risk": risk.title(),
            "highOrVeryHighSharePct": round(shares.get("High", 0) + shares.get("Very High", 0), 2),
            "moderateSharePct": shares.get("Moderate", 0),
            "lowOrNonRiskSharePct": round(shares.get("Low", 0) + shares.get("Non-Saline", 0), 2),
        })

    quality = summary["quality"]
    quality_rows = [
        {"check": "Missing cells", "result": sum(quality["missing_cells_by_field"].values()), "status": "Pass", "note": "No blank cells across 4,607 × 54 data cells."},
        {"check": "Exact duplicate rows", "result": quality["exact_duplicate_rows"], "status": "Pass", "note": "No exact duplicate records."},
        {"check": "Duplicate district-crop keys", "result": quality["duplicate_district_crop_keys"], "status": "Pass", "note": "The observed district-crop grain is unique."},
        {"check": "Missing district-crop combinations", "result": len(quality["missing_district_crop_pairs"]), "status": "Review", "note": "Barguna × Wood Apple is absent from the otherwise complete 64 × 72 grid."},
        {"check": "Zero area with positive production", "result": quality["zero_area_positive_production_count"], "status": "Review", "note": "Seven records conflict; together they account for only 64 metric tonnes."},
        {"check": "Freshness fields", "result": 0, "status": "Limited", "note": "No year, date, or extraction timestamp is available."},
    ]

    shared_components = [
        "report-summary", "report-glossary", "metric-production", "metric-area", "metric-yield", "metric-deficit",
        "crop-production", "crop-water", "division-performance", "risk-exposure", "category-scores",
        "district-count", "district-deficit-count", "district-deficit-production", "district-multi-risk",
        "district-production", "district-yield-production", "district-rainfall", "district-table",
        "district-analysis", "district-risk", "quality-checks", "recommendations", "limitations",
    ]
    snapshot = {
        "title": "Bangladesh’s crop portfolio is productive—but concentrated and water-stressed",
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "status": "reviewed",
        "filters": [],
        "report": {},
        "queries": {
            "portfolio_summary": {
                "rows": [portfolio],
                "source": source(
                    "Project_dataset.xlsx — portfolio totals",
                    "one portfolio-level aggregate",
                    ["Sum Area and Production; convert acres to hectares; calculate weighted yield and deficit shares."],
                    shared_components,
                ),
            },
            "crop_performance": {
                "rows": crops,
                "source": source(
                    "Project_dataset.xlsx — crop aggregates",
                    "one row per crop (72 crops)",
                    ["Group by Crop Name; sum additive measures; calculate area-weighted rain balance, water need, and supplied scores."],
                    ["crop-production", "crop-water", "recommendations", "limitations"],
                ),
            },
            "division_performance": {
                "rows": divisions,
                "source": source(
                    "Project_dataset.xlsx — division aggregates",
                    "one row per division (8 divisions)",
                    ["Group by Division; sum area and production; calculate converted-area yield and area-weighted conditions."],
                    ["division-performance", "recommendations", "limitations"],
                ),
            },
            "district_profiles": {
                "rows": districts,
                "source": source(
                    "Project_dataset.xlsx — district profiles",
                    "one row per district (64 districts)",
                    [
                        "Group by District; sum area and production; derive yield after converting acres to hectares.",
                        "Use cultivated area to weight rainfall balance, water need, and supplied resilience scores.",
                        "Retain one reviewed value per district for soil, AEZ, coordinates, and risk fields; retain one rainfall value per district-season.",
                    ],
                    [
                        "district-count", "district-deficit-count", "district-deficit-production", "district-multi-risk",
                        "district-production", "district-yield-production", "district-rainfall", "district-table",
                        "district-analysis", "district-risk", "recommendations", "limitations",
                    ],
                ),
            },
            "category_performance": {
                "rows": categories,
                "source": source(
                    "Project_dataset.xlsx — crop-category aggregates",
                    "one row per supplied crop category (17 categories)",
                    ["Group by Crop_Category; use cultivated area as the weight for rainfall, water need, and supplied score averages."],
                    ["category-scores", "recommendations", "limitations"],
                ),
            },
            "risk_exposure": {
                "rows": risk_rows,
                "source": source(
                    "Project_dataset.xlsx — area exposure by supplied risk level",
                    "one row per risk dimension",
                    ["Group recorded acres by Drought_Risk, Flood_Risk, and Salinity_Risk; divide each group by portfolio acres."],
                    ["risk-exposure", "recommendations", "limitations"],
                ),
            },
            "quality_checks": {
                "rows": quality_rows,
                "source": source(
                    "Project_dataset.xlsx — structural quality checks",
                    "one row per quality check",
                    ["Profile all cells and validate the district-crop grid, key uniqueness, derived formulas, and time metadata."],
                    ["quality-checks", "limitations"],
                ),
            },
        },
        "districtSummary": district_summary,
    }
    for query in snapshot["queries"].values():
        query["methods"] = query["source"].pop("methods")
    OUTPUT.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    assert len(snapshot["queries"]["crop_performance"]["rows"]) == 72
    assert len(snapshot["queries"]["division_performance"]["rows"]) == 8
    assert len(snapshot["queries"]["district_profiles"]["rows"]) == 64
    if REPORT_DATA.exists():
        existing = json.loads(REPORT_DATA.read_text(encoding="utf-8"))
        report_snapshot = {**existing, **snapshot, "id": existing["id"], "surface": "report", "buildStatus": "updating"}
        REPORT_DATA.write_text(json.dumps(report_snapshot, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
