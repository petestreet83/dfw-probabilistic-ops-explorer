from datetime import datetime, timezone

from app.adapters.noaa_awc import NoaaAwcAdapter
from app.db import get_connection, initialize_db


class BrokenClient:
    def get(self, *_args, **_kwargs):
        raise RuntimeError("network unavailable")


class SuccessResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class SuccessClient:
    def get(self, url, *_args, **_kwargs):
        if "metar" in url:
            return SuccessResponse([{"obsTime": "2026-01-01T00:00:00Z", "rawOb": "KDFW ..."}])
        return SuccessResponse([{"issueTime": "2026-01-01T00:00:00Z", "rawTAF": "TAF KDFW ..."}])


def test_noaa_uses_cache_on_failure(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "weather.db"))
    initialize_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO weather_observations
            (airport_icao, product_type, observation_time, raw_json, source_system, source_url, cache_timestamp, confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("KDFW", "METAR", now_iso, "[]", "NOAA AWC", "https://aviationweather.gov/api/data/metar", now_iso, 0.9),
        )
        conn.commit()

    result = NoaaAwcAdapter(client=BrokenClient()).fetch("KDFW")
    assert result.available is True
    assert result.mode == "CACHED PUBLIC DATA"


def test_noaa_fetches_live(tmp_path, monkeypatch):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "weather-live.db"))
    initialize_db()

    result = NoaaAwcAdapter(client=SuccessClient()).fetch("KDFW")
    assert result.available is True
    assert result.mode == "LIVE PUBLIC DATA"
    assert len(result.payload["metar"]) == 1
