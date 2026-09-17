# Data Lineage Specification

1. Fetch source payload from public URL.
2. Store raw payload with `source_system`, `source_url`, `source_timestamp`, `cache_timestamp`, `confidence`, and `license`.
3. Every API response object embeds provenance fields.
4. Frontend renders provenance-sensitive badges and limitation notices.
5. If source unavailable, mode transitions to `CACHED PUBLIC DATA` or `DEGRADED` with explicit badge/status.
