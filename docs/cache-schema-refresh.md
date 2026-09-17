# Cache Schema and Refresh

## SQLite Schema
- `source_cache_log`: source-level ingest status/provenance
- `weather_observations`: cached METAR/TAF payloads
- `bts_flights`: cached historical delay rows
- `source_status`: availability snapshots

Schema file: `backend/app/cache_schema.sql`

## Refresh Process
- NOAA AWC: fetch live each dashboard request; if successful overwrite cache rows.
- BTS: batch-load from archived public CSV using `scripts/load_bts_cache.py`.
- Stubs: FAA/OpenSky remain unavailable in Phase 1 with explicit degraded labels.
