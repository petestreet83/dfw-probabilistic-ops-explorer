export type DataMode = "LIVE PUBLIC DATA" | "CACHED PUBLIC DATA" | "MIXED" | "DEGRADED";

export type SourceKind =
  | "Live public weather observation"
  | "Public forecast model output"
  | "Historical public-data benchmark"
  | "Inferred public-data dependency";

export interface Provenance {
  source_system: string;
  source_url: string;
  source_timestamp: string | null;
  cache_timestamp: string | null;
  cache_age_minutes: number | null;
  data_mode: DataMode;
  confidence: number;
  source_kind: SourceKind;
}

export interface SourcedValue {
  label: string;
  value: number | string | null;
  units?: string | null;
  note?: string | null;
  provenance: Provenance;
}

export interface SourceStatus {
  source_name: string;
  available: boolean;
  mode: DataMode;
  status_label: string;
  last_success_at: string | null;
  message: string;
  provenance: Provenance;
}

export interface RiskMapPoint {
  id: string;
  operation: string;
  pca_x: number;
  pca_y: number;
  delay_minutes: number;
  tail_flag: boolean;
  provenance: Provenance;
}

export interface RippleEdge {
  source_flight: string;
  target_flight: string;
  score: number;
  note: "Inferred public-data dependency";
  provenance: Provenance;
}

export interface DashboardResponse {
  generated_at: string;
  airport: string;
  data_mode: DataMode;
  operation_filter: "all" | "inbound" | "outbound";
  horizon_filter: "now" | "2h" | "6h" | "12h" | "24h";
  overview_metrics: SourcedValue[];
  probability_horizon: SourcedValue[];
  risk_map_points: RiskMapPoint[];
  high_risk_flights: Array<Record<string, unknown>>;
  ripple_edges: RippleEdge[];
  source_status: SourceStatus[];
  limitations: string[];
}
