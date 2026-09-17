from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "DFW Probabilistic Operations Explorer API"
    sqlite_path: Path = Field(default=Path(__file__).resolve().parents[1] / "data/public_cache.db")
    awc_base_url: str = "https://aviationweather.gov/api/data"
    default_airport: str = "KDFW"
    cors_origins: list[str] = Field(default=["http://localhost:3000"])


@lru_cache
def get_settings() -> Settings:
    return Settings()
