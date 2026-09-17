from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .adapters.bts import BtsHistoricalAdapter
from .adapters.faa_stub import FaaAspmStubAdapter
from .adapters.noaa_awc import NoaaAwcAdapter
from .adapters.opensky_stub import OpenSkyStubAdapter
from .config import get_settings
from .db import age_minutes, initialize_db, iso_to_dt
from .models import DataMode, DashboardResponse, Provenance, RiskMapPoint, RippleEdge, SourceKind, SourceStatus, SourcedValue, now_utc

app = FastAPI(title="DFW Probabilistic Operations Explorer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=False,
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
    settings = get_settings()
    awc = NoaaAwcAdapter().fetch(settings.default_airport)
    bts = BtsHistoricalAdapter().fetch(operation)
    faa = FaaAspmStubAdapter().fetch()
    opensky = OpenSkyStubAdapter().fetch()

    source_modes = {result.mode for result in (awc, bts, faa, opensky)}
    if "DEGRADED" in source_modes:
        global_mode = DataMode.DEGRADED
    elif source_modes == {"LIVE PUBLIC DATA"}:
        global_mode = DataMode.LIVE
    elif "LIVE PUBLIC DATA" in source_modes and "CACHED PUBLIC DATA" in source_modes:
        global_mode = DataMode.MIXED
    elif source_modes == {"CACHED PUBLIC DATA"}:
        global_mode = DataMode.CACHED
    else:
        global_mode = DataMode.DEGRADED

    now = now_utc()
    weather_obs_count = len(awc.payload.get("metar", []))
    taf_count = len(awc.payload.get("taf", []))
    high_risk = bts.payload.get("high_risk", [])

    weather_prov = _provenance_from_adapter(awc, SourceKind.OBSERVATION)
    bts_prov = _provenance_from_adapter(bts, SourceKind.HISTORICAL)

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
    provenance = _provenance_from_adapter(result, source_kind)
    return SourceStatus(
        source_name=result.source_name,
        available=result.available,
        mode=provenance.data_mode,
        status_label="OK" if result.available else "UNAVAILABLE/STALE/CACHED-ONLY",
        last_success_at=provenance.cache_timestamp if result.available else None,
        message=result.message,
        provenance=provenance.model_copy(update={"source_url": source_url or provenance.source_url}),
    )


def _provenance_from_adapter(result, source_kind: SourceKind) -> Provenance:
    mode = DataMode(result.mode)
    return Provenance(
        source_system=result.source_name,
        source_url=result.source_url,
        source_timestamp=iso_to_dt(result.source_timestamp),
        cache_timestamp=iso_to_dt(result.cache_timestamp),
        cache_age_minutes=result.cache_age_minutes if result.cache_age_minutes is not None else age_minutes(result.cache_timestamp),
        data_mode=mode,
        confidence=result.confidence,
        source_kind=source_kind,
    )
