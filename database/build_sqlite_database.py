#!/usr/bin/env python3
"""Build the local SQLite database from the validated workbook extracts."""

from __future__ import annotations

import csv
import sqlite3
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATABASE_DIR = ROOT / "database"
GENERATED = DATABASE_DIR / "generated"
DATABASE = DATABASE_DIR / "agriculture.sqlite"
TEMP_DATABASE = DATABASE.with_suffix(".sqlite.tmp")
SCHEMA = DATABASE_DIR / "sql" / "001_sqlite_schema.sql"

TABLES = [
    "import_batches",
    "divisions",
    "seasons",
    "districts",
    "district_soil_profiles",
    "district_risk_assessments",
    "crops",
    "crop_temperature_requirements",
    "district_season_climate",
    "district_crop_statistics",
    "crop_climate_windows",
]

EXPECTED_COUNTS = {
    "divisions": 8,
    "districts": 64,
    "seasons": 3,
    "crops": 72,
    "district_soil_profiles": 64,
    "district_risk_assessments": 64,
    "crop_temperature_requirements": 72,
    "district_season_climate": 192,
    "district_crop_statistics": 4607,
    "crop_climate_windows": 13821,
}


def load_csv(connection: sqlite3.Connection, table: str) -> None:
    with (GENERATED / f"{table}.csv").open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        columns = next(reader)
        rows = [[None if value == "" else value for value in row] for row in reader]
    column_sql = ", ".join(f'"{column}"' for column in columns)
    placeholders = ", ".join("?" for _ in columns)
    connection.executemany(
        f'INSERT INTO "{table}" ({column_sql}) VALUES ({placeholders})', rows
    )


def validate(connection: sqlite3.Connection) -> None:
    if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        raise RuntimeError("SQLite integrity check failed")
    foreign_key_errors = connection.execute("PRAGMA foreign_key_check").fetchall()
    if foreign_key_errors:
        raise RuntimeError(f"Foreign key errors: {foreign_key_errors[:5]}")
    for table, expected in EXPECTED_COUNTS.items():
        actual = connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
        if actual != expected:
            raise RuntimeError(f"{table}: expected {expected:,} rows, found {actual:,}")
    district_view_rows = connection.execute(
        "SELECT COUNT(*) FROM district_portfolio_summary"
    ).fetchone()[0]
    if district_view_rows != 64:
        raise RuntimeError(f"district_portfolio_summary: expected 64 rows, found {district_view_rows}")


def main() -> None:
    subprocess.run([sys.executable, str(DATABASE_DIR / "prepare_import.py")], check=True)
    TEMP_DATABASE.unlink(missing_ok=True)
    connection = sqlite3.connect(TEMP_DATABASE)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(SCHEMA.read_text(encoding="utf-8"))
        with connection:
            for table in TABLES:
                load_csv(connection, table)
        validate(connection)
    finally:
        connection.close()
    TEMP_DATABASE.replace(DATABASE)
    print(f"Created {DATABASE}")
    print("Loaded 64 districts, 72 crops, and 4,607 district-crop records")


if __name__ == "__main__":
    main()
