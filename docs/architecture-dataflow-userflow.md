# Architecture, Data Flow, User Flow

## Architecture (Phase 1)
- `frontend/` Next.js TypeScript dashboard
- `backend/` FastAPI source adapters + API
- `shared/` canonical TypeScript model + adapter interface
- `backend/data/public_cache.db` SQLite cache

## Data Flow
1. Frontend requests `/api/v1/dashboard`.
2. Backend adapters collect NOAA live data + BTS cache + stubs.
3. Backend computes rules-based risk placeholders and provenance-decorated response.
4. Frontend renders data-mode badge, risk map stub, source console, and notices.

## User Flow
1. User opens dashboard.
2. User filters operation and horizon.
3. User reviews probabilistic placeholders, high-risk rows, and source health.
4. User reads mandatory limitation notices in footer.
