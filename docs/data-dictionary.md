# Data Dictionary (Phase 1)

## Provenance Fields (mandatory on output objects)
- `source_system`
- `source_url`
- `source_timestamp`
- `cache_timestamp`
- `cache_age_minutes`
- `data_mode` (`LIVE PUBLIC DATA`, `CACHED PUBLIC DATA`, `MIXED`, `DEGRADED`)
- `confidence`
- `source_kind`

## Delay and Risk Fields
- `carrier_delay_proxy_minutes`: BTS CarrierDelay, displayed as **Carrier-controllable delay proxy**.
- `risk_score`: rules-based score from public delays/weather/NAS columns (Phase 1 placeholder, not trained model).
- `tail_flag`: true for high-tail public delay observations.

## Transparency Labels
- Live weather rows use `Live public weather observation`.
- Forecast rows use `Public forecast model output`.
- Historical rows use `Historical public-data benchmark`.
- Ripple edges use `Inferred public-data dependency`.
