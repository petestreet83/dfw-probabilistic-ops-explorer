from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .config import get_settings


def get_connection() -> sqlite3.Connection:
    settings = get_settings()
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.sqlite_path)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_db() -> None:
    schema_path = Path(__file__).with_name("cache_schema.sql")
    with schema_path.open("r", encoding="utf-8") as schema_file:
        schema_sql = schema_file.read()

    with get_connection() as conn:
        conn.executescript(schema_sql)
        conn.commit()


def iso_to_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def age_minutes(iso_ts: str | None) -> float | None:
    dt = iso_to_dt(iso_ts)
    if dt is None:
        return None
    return (datetime.now(timezone.utc) - dt).total_seconds() / 60
