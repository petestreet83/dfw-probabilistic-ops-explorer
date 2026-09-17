from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DataMode(str, Enum):
    LIVE = "LIVE PUBLIC DATA"
    CACHED = "CACHED PUBLIC DATA"
    MIXED = "MIXED"
    DEGRADED = "DEGRADED"


class SourceKind(str, Enum):
    OBSERVATION = "Live public weather observation"
    FORECAST = "Public forecast model output"
    HISTORICAL = "Historical public-data benchmark"
    INFERRED = "Inferred public-data dependency"


class Provenance(BaseModel):
    source_system: str
    source_url: str
    source_timestamp: datetime | None = None
    cache_timestamp: datetime | None = None
    cache_age_minutes: float | None = None
    data_mode: DataMode
    confidence: float = Field(ge=0.0, le=1.0)
    source_kind: SourceKind


class SourcedValue(BaseModel):
    label: str
    value: float | str | None
    units: str | None = None
    note: str | None = None
    provenance: Provenance


class SourceStatus(BaseModel):
    source_name: str
    available: bool
    mode: DataMode
    status_label: str
    last_success_at: datetime | None = None
    message: str
    provenance: Provenance


class RiskMapPoint(BaseModel):
    id: str
    operation: str
    pca_x: float
    pca_y: float
    delay_minutes: float
    tail_flag: bool
    provenance: Provenance


class RippleEdge(BaseModel):
    source_flight: str
    target_flight: str
    score: float
    note: str = "Inferred public-data dependency"
    provenance: Provenance


class DashboardResponse(BaseModel):
    generated_at: datetime
    airport: str
    data_mode: DataMode
    operation_filter: str
    horizon_filter: str
    overview_metrics: list[SourcedValue]
    probability_horizon: list[SourcedValue]
    risk_map_points: list[RiskMapPoint]
    high_risk_flights: list[dict[str, Any]]
    ripple_edges: list[RippleEdge]
    source_status: list[SourceStatus]
    limitations: list[str]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
