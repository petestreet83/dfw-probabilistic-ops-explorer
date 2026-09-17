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


class PublicDataAdapter:
    source_name: str

    def fetch(self, *args: Any, **kwargs: Any) -> AdapterResult:
        raise NotImplementedError
