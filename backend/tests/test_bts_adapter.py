from datetime import datetime, timezone

from app.adapters.bts import BtsHistoricalAdapter
from app.db import get_connection, initialize_db


def test_bts_adapter_returns_high_risk(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "bts.db"))
    initialize_db()

    now_iso = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO bts_flights (
              flight_date, carrier, flight_number, origin, destination, operation_type,
              dep_delay_minutes, arr_delay_minutes, carrier_delay_minutes, weather_delay_minutes, nas_delay_minutes,
              late_aircraft_delay_minutes, cancelled, diverted, source_system, source_url,
              source_timestamp, cache_timestamp, confidence, license
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "2026-01-01",
                "AA",
                "100",
                "LAX",
                "DFW",
                "inbound",
                20,
                40,
                5,
                10,
                8,
                0,
                0,
                0,
                "BTS",
                "https://www.transtats.bts.gov/",
                now_iso,
                now_iso,
                0.8,
                "Public Domain",
            ),
        )
        conn.commit()

    result = BtsHistoricalAdapter().fetch("inbound")
    assert result.available is True
    assert result.payload["high_risk"][0]["flight_id"] == "AA100"
    assert result.payload["high_risk"][0]["carrier_delay_proxy_minutes"] == 5
