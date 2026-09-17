# DFW Probabilistic Operations Explorer (Phase 1)

Public-data-only foundation for probabilistic DFW delay/ripple analytics.

## Repository Structure
- `frontend/`: Next.js 16 + TypeScript + Tailwind dashboard
- `backend/`: FastAPI adapters and API
- `shared/`: canonical TypeScript data model and adapter interface
- `docs/`: source catalog, data dictionary, model card, lineage, architecture, coverage, backlog

## Quick Start

### Backend
```bash
cd /home/runner/work/dfw-probabilistic-ops-explorer/dfw-probabilistic-ops-explorer/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd /home/runner/work/dfw-probabilistic-ops-explorer/dfw-probabilistic-ops-explorer/frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

### Load BTS cache data
```bash
cd /home/runner/work/dfw-probabilistic-ops-explorer/dfw-probabilistic-ops-explorer
python scripts/load_bts_cache.py /absolute/path/to/public_bts_export.csv
```

## Data Transparency and Limits
- Every rendered data object includes provenance fields (`source_system`, `source_url`, `timestamp`, `cache_age`, `data_mode`, `confidence`).
- `CarrierDelay` is displayed as **Carrier-controllable delay proxy**.
- Ripple edges are labeled **Inferred public-data dependency**.
- Dashboard never claims access to maintenance, crew, gate, turnaround, passenger, or safety data.
- Degraded sources show `UNAVAILABLE/STALE/CACHED-ONLY` state.

## Deployment
- Docker Compose config is included (`docker-compose.yml`).
- Frontend/Backend Dockerfiles are included for public hosting platforms.
