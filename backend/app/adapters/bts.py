from __future__ import annotations

from datetime import datetime, timezone

from ..db import get_connection
from .base import AdapterResult, PublicDataAdapter


class BtsHistoricalAdapter(PublicDataAdapter):
    source_name = "BTS"

    def fetch(self, operation: str = "all") -> AdapterResult:
        where = ""
        params: tuple[str, ...] = ()
        if operation in {"inbound", "outbound"}:
            where = "WHERE operation_type = ?"
            params = (operation,)

        with get_connection() as conn:
            rows = conn.execute(
                f"""
                SELECT carrier, flight_number, origin, destination, operation_type,
                       COALESCE(arr_delay_minutes, 0) AS arr_delay_minutes,
                       COALESCE(dep_delay_minutes, 0) AS dep_delay_minutes,
                       COALESCE(carrier_delay_minutes, 0) AS carrier_delay_minutes,
                       COALESCE(weather_delay_minutes, 0) AS weather_delay_minutes,
                       COALESCE(nas_delay_minutes, 0) AS nas_delay_minutes,
                       cache_timestamp, source_url
                FROM bts_flights
                {where}
                ORDER BY flight_date DESC
                LIMIT 200
                """,
                params,
            ).fetchall()

        if not rows:
            return AdapterResult(
                source_name=self.source_name,
                available=False,
                mode="DEGRADED",
                payload={"records": [], "high_risk": [], "risk_map_points": []},
                message="No cached BTS historical data loaded yet.",
            )

        records = []
        for row in rows:
            total_public_delay = row["arr_delay_minutes"] + row["dep_delay_minutes"]
            risk_score = min(
                1.0,
                (total_public_delay + row["weather_delay_minutes"] + row["nas_delay_minutes"] * 1.1) / 180.0,
            )
            records.append(
                {
                    "flight_id": f"{row['carrier']}{row['flight_number']}",
                    "route": f"{row['origin']}-{row['destination']}",
                    "operation": row["operation_type"],
                    "arr_delay_minutes": row["arr_delay_minutes"],
                    "dep_delay_minutes": row["dep_delay_minutes"],
                    "carrier_delay_proxy_minutes": row["carrier_delay_minutes"],
                    "weather_delay_minutes": row["weather_delay_minutes"],
                    "nas_delay_minutes": row["nas_delay_minutes"],
                    "risk_score": round(risk_score, 3),
                    "cache_timestamp": row["cache_timestamp"],
                    "source_url": row["source_url"],
                }
            )

        high_risk = sorted(records, key=lambda x: x["risk_score"], reverse=True)[:10]
        risk_map_points = [
            {
                "id": rec["flight_id"],
                "operation": rec["operation"],
                "pca_x": round((rec["arr_delay_minutes"] - rec["dep_delay_minutes"]) / 30, 3),
                "pca_y": round((rec["weather_delay_minutes"] + rec["nas_delay_minutes"]) / 25, 3),
                "delay_minutes": rec["arr_delay_minutes"] + rec["dep_delay_minutes"],
                "tail_flag": rec["risk_score"] >= 0.8,
                "cache_timestamp": rec["cache_timestamp"],
                "source_url": rec["source_url"],
            }
            for rec in records
        ]

        return AdapterResult(
            source_name=self.source_name,
            available=True,
            mode="CACHED PUBLIC DATA",
            payload={
                "records": records,
                "high_risk": high_risk,
                "risk_map_points": risk_map_points,
                "source_timestamp": datetime.now(timezone.utc).isoformat(),
            },
            message="Historical public-data benchmark loaded from cache.",
        )
