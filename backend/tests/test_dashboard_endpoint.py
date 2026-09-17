from fastapi.testclient import TestClient

from app.adapters.base import AdapterResult
from app.main import app


def test_dashboard_provenance_and_mode(monkeypatch, tmp_path):
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "dash.db"))

    monkeypatch.setattr(
        "app.main.NoaaAwcAdapter.fetch",
        lambda self, _airport: AdapterResult(
            source_name="NOAA AWC",
            available=True,
            mode="LIVE PUBLIC DATA",
            payload={"metar": [{"rawOb": "KDFW"}], "taf": []},
            message="ok",
            source_url="https://aviationweather.gov/api/data/metar",
            source_timestamp="2026-01-01T00:00:00Z",
            cache_timestamp="2026-01-01T00:05:00Z",
            cache_age_minutes=5.0,
            confidence=0.9,
        ),
    )
    monkeypatch.setattr(
        "app.main.BtsHistoricalAdapter.fetch",
        lambda self, _operation="all": AdapterResult(
            source_name="BTS",
            available=True,
            mode="CACHED PUBLIC DATA",
            payload={"high_risk": [], "risk_map_points": []},
            message="ok",
            source_url="https://www.transtats.bts.gov/",
            source_timestamp="2025-12-31T00:00:00Z",
            cache_timestamp="2026-01-01T00:10:00Z",
            cache_age_minutes=10.0,
            confidence=0.75,
        ),
    )
    monkeypatch.setattr(
        "app.main.FaaAspmStubAdapter.fetch",
        lambda self: AdapterResult(
            source_name="FAA ASPM/OPSNET",
            available=False,
            mode="DEGRADED",
            payload={"records": []},
            message="unavailable",
            source_url="https://aspm.faa.gov/",
            confidence=0.2,
        ),
    )
    monkeypatch.setattr(
        "app.main.OpenSkyStubAdapter.fetch",
        lambda self: AdapterResult(
            source_name="OpenSky Network",
            available=False,
            mode="DEGRADED",
            payload={"records": []},
            message="unavailable",
            source_url="https://opensky-network.org/",
            confidence=0.2,
        ),
    )

    response = TestClient(app).get("/api/v1/dashboard?operation=all&horizon=now")
    assert response.status_code == 200
    payload = response.json()

    assert payload["data_mode"] == "DEGRADED"
    assert payload["overview_metrics"][0]["provenance"]["source_timestamp"] == "2026-01-01T00:00:00Z"
    assert payload["overview_metrics"][0]["provenance"]["cache_timestamp"] == "2026-01-01T00:05:00Z"
    assert payload["source_status"][0]["provenance"]["source_url"] == "https://aviationweather.gov/"
