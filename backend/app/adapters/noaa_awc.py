from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import httpx

from ..config import get_settings
from ..db import age_minutes, get_connection
from .base import AdapterResult, PublicDataAdapter


class NoaaAwcAdapter(PublicDataAdapter):
    source_name = "NOAA AWC"

    def __init__(self, client: httpx.Client | None = None):
        self.client = client or httpx.Client(timeout=10.0)

    def _fetch_live(self, airport: str) -> dict[str, Any]:
        settings = get_settings()
        metar_url = f"{settings.awc_base_url}/metar?ids={airport}&format=json&hours=2"
        taf_url = f"{settings.awc_base_url}/taf?ids={airport}&format=json"

        metar_resp = self.client.get(metar_url)
        metar_resp.raise_for_status()
        taf_resp = self.client.get(taf_url)
        taf_resp.raise_for_status()

        metar_data = metar_resp.json()
        taf_data = taf_resp.json()

        now_iso = datetime.now(timezone.utc).isoformat()
        with get_connection() as conn:
            for product_type, url, payload in (
                ("METAR", metar_url, metar_data),
                ("TAF", taf_url, taf_data),
            ):
                obs_time = None
                if isinstance(payload, list) and payload:
                    obs_time = payload[0].get("obsTime") or payload[0].get("issueTime")
                conn.execute(
                    """
                    INSERT OR REPLACE INTO weather_observations
                    (airport_icao, product_type, observation_time, raw_json, source_system, source_url, cache_timestamp, confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        airport,
                        product_type,
                        obs_time,
                        json.dumps(payload),
                        self.source_name,
                        url,
                        now_iso,
                        0.9,
                    ),
                )
            conn.commit()

        return {
            "airport": airport,
            "metar": metar_data,
            "taf": taf_data,
            "data_mode": "LIVE PUBLIC DATA",
            "source_urls": {"metar": metar_url, "taf": taf_url},
            "cache_timestamp": now_iso,
            "source_timestamp": (
                (metar_data[0].get("obsTime") if isinstance(metar_data, list) and metar_data else None)
                or (taf_data[0].get("issueTime") if isinstance(taf_data, list) and taf_data else None)
            ),
        }

    def _fetch_cached(self, airport: str) -> dict[str, Any] | None:
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT product_type, raw_json, source_url, cache_timestamp
                FROM weather_observations
                WHERE airport_icao = ?
                ORDER BY cache_timestamp DESC
                """,
                (airport,),
            ).fetchall()

        if not rows:
            return None

        grouped: dict[str, dict[str, Any]] = {}
        for row in rows:
            pt = row["product_type"]
            if pt not in grouped:
                grouped[pt] = {
                    "raw_json": json.loads(row["raw_json"]),
                    "source_url": row["source_url"],
                    "cache_timestamp": row["cache_timestamp"],
                }

        if "METAR" not in grouped and "TAF" not in grouped:
            return None

        cache_timestamps = [
            grouped.get("METAR", {}).get("cache_timestamp"),
            grouped.get("TAF", {}).get("cache_timestamp"),
        ]
        newest_ts = max((ts for ts in cache_timestamps if ts), default=None)
        return {
            "airport": airport,
            "metar": grouped.get("METAR", {}).get("raw_json", []),
            "taf": grouped.get("TAF", {}).get("raw_json", []),
            "data_mode": "CACHED PUBLIC DATA",
            "source_urls": {
                "metar": grouped.get("METAR", {}).get("source_url", "https://aviationweather.gov/"),
                "taf": grouped.get("TAF", {}).get("source_url", "https://aviationweather.gov/"),
            },
            "cache_timestamp": newest_ts,
            "cache_age_minutes": age_minutes(newest_ts),
            "source_timestamp": newest_ts,
        }

    def fetch(self, airport: str) -> AdapterResult:
        try:
            payload = self._fetch_live(airport)
            return AdapterResult(
                source_name=self.source_name,
                available=True,
                mode="LIVE PUBLIC DATA",
                payload=payload,
                message="Live public weather observation and forecast fetched.",
                source_url=payload["source_urls"]["metar"],
                source_timestamp=payload.get("source_timestamp"),
                cache_timestamp=payload.get("cache_timestamp"),
                cache_age_minutes=0.0,
                confidence=0.9,
            )
        except Exception as exc:
            cached = self._fetch_cached(airport)
            if cached:
                return AdapterResult(
                    source_name=self.source_name,
                    available=True,
                    mode="CACHED PUBLIC DATA",
                    payload=cached,
                    message=f"Live NOAA AWC unavailable, using cached fallback: {exc}",
                    source_url=cached["source_urls"]["metar"],
                    source_timestamp=cached.get("source_timestamp"),
                    cache_timestamp=cached.get("cache_timestamp"),
                    cache_age_minutes=cached.get("cache_age_minutes"),
                    confidence=0.75,
                )
            return AdapterResult(
                source_name=self.source_name,
                available=False,
                mode="DEGRADED",
                payload={"airport": airport, "metar": [], "taf": [], "data_mode": "DEGRADED"},
                message=f"NOAA AWC unavailable and no cache present: {exc}",
                source_url="https://aviationweather.gov/",
                confidence=0.2,
            )
