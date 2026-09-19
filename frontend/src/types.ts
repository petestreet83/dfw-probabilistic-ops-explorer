export type DataMode =
  "LIVE PUBLIC DATA" | "CACHED PUBLIC DATA" | "MIXED" | "DEGRADED";

export type SourceKind =
  | "Live public weather observation"
  | "Historical public-data benchmark"
  | "Inferred public-data dependency"
  | "Synthetic scenario composite";

export interface Provenance {
  sourceSystem: string;
  sourceUrl: string;
  sourceTimestamp: string;
  cacheAgeMinutes: number;
  dataMode: DataMode;
  confidence: number;
  sourceKind: SourceKind;
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: "cyan" | "violet" | "amber" | "rose";
  detail: string;
  provenance: Provenance;
}

export interface TrendPoint {
  minute: string;
  activeAgents: number;
  graphDensity: number;
  queryLatency: number;
  evidenceCoverage: number;
}

export interface GraphNodeRecord {
  id: string;
  label: string;
  kind: "agent" | "source" | "community" | "evidence" | "query" | "signal";
  clusterId: string;
  status: string;
  summary: string;
  size: number;
  color: string;
  score: number;
  x: number;
  y: number;
  provenance: Provenance;
}

export interface GraphEdgeRecord {
  id: string;
  source: string;
  target: string;
  weight: number;
  confidence: number;
  kind: "construction" | "handoff" | "evidence" | "query";
  summary: string;
}

export interface CommunitySummary {
  id: string;
  title: string;
  summary: string;
  nodeIds: string[];
  edgeIds: string[];
  metrics: Array<{ label: string; value: string }>;
}

export interface QueryPreset {
  id: string;
  title: string;
  prompt: string;
  summary: string;
  nodeIds: string[];
  edgeIds: string[];
  evidencePathIds: string[];
}

export interface EvidencePath {
  id: string;
  title: string;
  confidence: number;
  summary: string;
  nodeIds: string[];
  steps: Array<{
    label: string;
    explanation: string;
  }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  severity: "nominal" | "watch" | "alert";
  nodeIds: string[];
}

export interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: "running" | "queued" | "complete";
  latencyMs: number;
  tokens: number;
  focusNodeId: string;
  timestamp: string;
}

export interface SourceStatus {
  id: string;
  label: string;
  status: string;
  freshness: string;
  detail: string;
  provenance: Provenance;
}

export interface LimitationNotice {
  title: string;
  detail: string;
}

export interface DemoDataset {
  generatedAt: string;
  headline: string;
  subheadline: string;
  metrics: MetricCard[];
  trends: TrendPoint[];
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  communities: CommunitySummary[];
  queries: QueryPreset[];
  evidencePaths: EvidencePath[];
  timeline: TimelineEvent[];
  activities: AgentActivity[];
  sources: SourceStatus[];
  limitations: LimitationNotice[];
}
