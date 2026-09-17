# Frontend: DFW Probabilistic Operations Explorer

Next.js dashboard for the Phase 1 public-data-only release.

## Prerequisites
- Node.js 22+
- Backend API running at `http://localhost:8000` (or set `NEXT_PUBLIC_API_BASE_URL`)

## Run locally
```bash
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## Validate
```bash
npm run lint
npm run build
```

## Notes
- UI includes data-mode badge (`LIVE PUBLIC DATA`, `CACHED PUBLIC DATA`, `MIXED`, `DEGRADED`).
- Source status cards show explicit `UNAVAILABLE/STALE/CACHED-ONLY` states when degraded.
- Footer shows mandatory public-data limitation notices.
