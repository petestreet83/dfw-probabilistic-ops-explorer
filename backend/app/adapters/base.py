from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class AdapterResult:
    source_name: str
    available: bool
    mode: str
    payload: dict[str, Any]
    message: str
    source_url: str
    source_timestamp: str | None = None
    cache_timestamp: str | None = None
    cache_age_minutes: float | None = None
    confidence: float = 0.5


class PublicDataAdapter:
    source_name: str

    def fetch(self, *args: Any, **kwargs: Any) -> AdapterResult:
        raise NotImplementedError
