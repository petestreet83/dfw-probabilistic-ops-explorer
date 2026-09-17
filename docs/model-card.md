# Model Card (Phase 1)

## Scope
Phase 1 ships a **rules-based probabilistic placeholder**, not a trained CatBoost/XGBoost model.

## Inputs
- NOAA AWC METAR/TAF observations and forecasts
- BTS cached historical delay fields

## Outputs
- Risk score (0-1) for ranking only
- P50/P80/P95/P99 placeholder horizon estimates from historical benchmark values

## Limitations
- Not causal and not safety-critical
- No maintenance, crew, gate, turnaround, passenger, or proprietary airline operations data
- Degrades to cached-only or unavailable when public feeds fail
