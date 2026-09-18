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
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

### Load BTS cache data
```bash
# from repository root
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

## Standalone HTML Prototype (No Backend / No Build)
- File: `prototype.html`
- Live URL (GitHub Pages): `https://petestreet83.github.io/dfw-probabilistic-ops-explorer/prototype.html`

### Share Options
1. **Direct file sharing**
   - Download `prototype.html` from this repository.
   - Send the single file to any user/device.
   - Open it directly in a modern browser (Chrome, Edge, Safari, Firefox).
2. **GitHub Pages link sharing**
   - Share `https://petestreet83.github.io/dfw-probabilistic-ops-explorer/prototype.html`
   - No installation, backend, or build step is required.
