from __future__ import annotations

from .base import AdapterResult, PublicDataAdapter


class OpenSkyStubAdapter(PublicDataAdapter):
    source_name = "OpenSky Network"

    def fetch(self) -> AdapterResult:
        return AdapterResult(
            source_name=self.source_name,
            available=False,
            mode="DEGRADED",
            payload={"status": "UNAVAILABLE/STALE/CACHED-ONLY", "records": []},
            message="Stub adapter only in Phase 1. Integrate OpenSky public trajectories in next phase.",
        )
