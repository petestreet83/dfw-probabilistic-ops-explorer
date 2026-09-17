"""Load cached BTS CSV records into SQLite cache.

Usage:
python scripts/load_bts_cache.py /path/to/bts.csv
"""

from __future__ import annotations

import csv
import sys
from datetime import datetime, timezone

from backend.app.db import get_connection, initialize_db


def main(csv_path: str) -> None:
    initialize_db()
    now = datetime.now(timezone.utc).isoformat()

    with open(csv_path, newline="", encoding="utf-8") as file_handle, get_connection() as conn:
        reader = csv.DictReader(file_handle)
        for row in reader:
            conn.execute(
                """
                INSERT OR REPLACE INTO bts_flights (
                  flight_date, carrier, flight_number, origin, destination, operation_type,
                  dep_delay_minutes, arr_delay_minutes, carrier_delay_minutes, weather_delay_minutes,
                  nas_delay_minutes, late_aircraft_delay_minutes, cancelled, diverted, source_system,
                  source_url, source_timestamp, cache_timestamp, confidence, license
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row["flight_date"],
                    row["carrier"],
                    row["flight_number"],
                    row["origin"],
                    row["destination"],
                    row["operation_type"],
                    float(row.get("dep_delay_minutes") or 0),
                    float(row.get("arr_delay_minutes") or 0),
                    float(row.get("carrier_delay_minutes") or 0),
                    float(row.get("weather_delay_minutes") or 0),
                    float(row.get("nas_delay_minutes") or 0),
                    float(row.get("late_aircraft_delay_minutes") or 0),
                    int(row.get("cancelled") or 0),
                    int(row.get("diverted") or 0),
                    "BTS",
                    row.get("source_url") or "https://www.transtats.bts.gov/",
                    row.get("source_timestamp") or now,
                    now,
                    float(row.get("confidence") or 0.75),
                    row.get("license") or "Public Domain",
                ),
            )
        conn.commit()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/load_bts_cache.py /path/to/bts.csv")
    main(sys.argv[1])
