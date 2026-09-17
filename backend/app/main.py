from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .adapters.bts import BtsHistoricalAdapter
from .adapters.faa_stub import FaaAspmStubAdapter
from .adapters.noaa_awc import NoaaAwcAdapter
from .adapters.opensky_stub import OpenSkyStubAdapter
from .config import get_settings
from .db import age_minutes, initialize_db
from .models import DataMode, DashboardResponse, Provenance, RiskMapPoint, RippleEdge, SourceKind, SourceStatus, SourcedValue, now_utc

app = FastAPI(title="DFW Probabilistic Operations Explorer API", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/dashboard", response_model=DashboardResponse)
def dashboard(
    operation: str = Query("all", pattern="^(all|inbound|outbound)$"),
    horizon: str = Query("now", pattern="^(now|2h|6h|12h|24h)$"),
):
    awc = NoaaAwcAdapter().fetch(settings.default_airport)
    bts = BtsHistoricalAdapter().fetch(operation)
    faa = FaaAspmStubAdapter().fetch()
    opensky = OpenSkyStubAdapter().fetch()

    modes = {awc.mode, bts.mode, faa.mode, opensky.mode}
    if modes == {"LIVE PUBLIC DATA"}:
        global_mode = DataMode.LIVE
    elif "LIVE PUBLIC DATA" in modes and "CACHED PUBLIC DATA" in modes:
        global_mode = DataMode.MIXED
    elif "CACHED PUBLIC DATA" in modes and "LIVE PUBLIC DATA" not in modes:
        global_mode = DataMode.CACHED
    else:
        global_mode = DataMode.DEGRADED

    now = now_utc()
    weather_obs_count = len(awc.payload.get("metar", []))
    taf_count = len(awc.payload.get("taf", []))
    high_risk = bts.payload.get("high_risk", [])

    weather_prov = Provenance(
        source_system="NOAA AWC",
        source_url=awc.payload.get("source_urls", {}).get("metar", "https://aviationweather.gov/"),
        source_timestamp=now,
        cache_timestamp=now,
        cache_age_minutes=awc.payload.get("cache_age_minutes"),
        data_mode=DataMode(awc.mode),
        confidence=0.9 if awc.available else 0.2,
        source_kind=SourceKind.OBSERVATION,
    )
    bts_url = high_risk[0]["source_url"] if high_risk else "https://www.transtats.bts.gov/"
    bts_cache_ts = high_risk[0]["cache_timestamp"] if high_risk else None
    bts_prov = Provenance(
        source_system="BTS",
        source_url=bts_url,
        source_timestamp=now,
        cache_timestamp=bts_cache_ts,
        cache_age_minutes=age_minutes(bts_cache_ts),
        data_mode=DataMode(bts.mode),
        confidence=0.75 if bts.available else 0.2,
        source_kind=SourceKind.HISTORICAL,
    )

    overview_metrics = [
        SourcedValue(
            label="Live METAR observations",
            value=weather_obs_count,
            units="records",
            note="Live public weather observation",
            provenance=weather_prov,
        ),
        SourcedValue(
            label="Active TAF forecasts",
            value=taf_count,
            units="records",
            note="Public forecast model output",
            provenance=weather_prov.model_copy(update={"source_kind": SourceKind.FORECAST}),
        ),
        SourcedValue(
            label="Top flight risk score",
            value=high_risk[0]["risk_score"] if high_risk else None,
            units="0-1",
            note="Rules-based score (not a trained prediction)",
            provenance=bts_prov,
        ),
    ]

    probability_horizon = []
    pcts = {"P50": 0.5, "P80": 0.8, "P95": 0.95, "P99": 0.99}
    base = high_risk[0]["arr_delay_minutes"] if high_risk else None
    for label, factor in pcts.items():
        probability_horizon.append(
            SourcedValue(
                label=f"{horizon.upper()} {label}",
                value=round(base * factor, 2) if base is not None else None,
                units="minutes",
                note="Historical public-data benchmark placeholder",
                provenance=bts_prov,
            )
        )

    risk_map_points = [
        RiskMapPoint(
            id=point["id"],
            operation=point["operation"],
            pca_x=point["pca_x"],
            pca_y=point["pca_y"],
            delay_minutes=point["delay_minutes"],
            tail_flag=point["tail_flag"],
            provenance=bts_prov.model_copy(update={"source_url": point["source_url"], "cache_timestamp": point["cache_timestamp"]}),
        )
        for point in bts.payload.get("risk_map_points", [])
    ]

    ripple_edges = []
    if len(high_risk) > 1:
        first = high_risk[0]
        second = high_risk[1]
        ripple_edges.append(
            RippleEdge(
                source_flight=first["flight_id"],
                target_flight=second["flight_id"],
                score=min(1.0, (first["risk_score"] + second["risk_score"]) / 2),
                provenance=bts_prov.model_copy(update={"source_kind": SourceKind.INFERRED}),
            )
        )

    status = [
        _status_from_result(awc, "https://aviationweather.gov/", SourceKind.OBSERVATION),
        _status_from_result(bts, "https://www.transtats.bts.gov/", SourceKind.HISTORICAL),
        _status_from_result(faa, "https://aspm.faa.gov/", SourceKind.HISTORICAL),
        _status_from_result(opensky, "https://opensky-network.org/", SourceKind.OBSERVATION),
    ]

    return DashboardResponse(
        generated_at=now,
        airport=settings.default_airport,
        data_mode=global_mode,
        operation_filter=operation,
        horizon_filter=horizon,
        overview_metrics=overview_metrics,
        probability_horizon=probability_horizon,
        risk_map_points=risk_map_points,
        high_risk_flights=high_risk,
        ripple_edges=ripple_edges,
        source_status=status,
        limitations=[
            "This release uses only public aviation/weather data with explicit provenance.",
            "No maintenance, crew, gate, turnaround, passenger, or safety-system data is used.",
            "CarrierDelay is displayed as a Carrier-controllable delay proxy.",
            "Inferred graph edges are public-data dependency inferences and not causal proof.",
        ],
    )


def _status_from_result(result, source_url: str, source_kind: SourceKind) -> SourceStatus:
    mode = DataMode(result.mode)
    return SourceStatus(
        source_name=result.source_name,
        available=result.available,
        mode=mode,
        status_label="OK" if result.available else "UNAVAILABLE/STALE/CACHED-ONLY",
        last_success_at=now_utc() if result.available else None,
        message=result.message,
        provenance=Provenance(
            source_system=result.source_name,
            source_url=source_url,
            source_timestamp=now_utc(),
            cache_timestamp=now_utc() if result.available else None,
            cache_age_minutes=0.0 if result.available else None,
            data_mode=mode,
            confidence=0.85 if result.available else 0.2,
            source_kind=source_kind,
        ),
    )
