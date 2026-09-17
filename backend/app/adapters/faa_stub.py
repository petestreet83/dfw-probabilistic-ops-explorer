from __future__ import annotations

from .base import AdapterResult, PublicDataAdapter


class FaaAspmStubAdapter(PublicDataAdapter):
    source_name = "FAA ASPM/OPSNET"

    def fetch(self) -> AdapterResult:
        return AdapterResult(
            source_name=self.source_name,
            available=False,
            mode="DEGRADED",
            payload={"status": "UNAVAILABLE/STALE/CACHED-ONLY", "records": []},
            message="Stub adapter only in Phase 1. Integrate FAA public feed in next phase.",
        )
