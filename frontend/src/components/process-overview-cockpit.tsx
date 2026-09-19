"use client";

import { useMemo, useState } from "react";

import type { RippleEdge, RiskMapPoint, SourceStatus, SourcedValue } from "@/lib/types";

const AIRPORT_NAMES: Record<string, string> = {
  ATL: "Atlanta",
  BOS: "Boston Logan",
  DEN: "Denver",
  DFW: "Dallas/Fort Worth",
  HOU: "Houston Hobby",
  IAD: "Washington Dulles",
  JFK: "New York JFK",
  LAX: "Los Angeles",
  MIA: "Miami",
  ORD: "Chicago O'Hare",
  PHX: "Phoenix Sky Harbor",
  SEA: "Seattle-Tacoma",
  SLC: "Salt Lake City",
};

type ParsedFlight = {
  flightId: string;
  route: string;
  riskScore: number;
  carrierDelayProxyMinutes: number;
  arrDelayMinutes: number;
  operation: string;
};

function getString(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function getNumber(record: Record<string, unknown>, key: string, fallback = 0): number {
  const value = record[key];
  return typeof value === "number" ? value : fallback;
}

function formatRoute(route: string): string {
  const [origin, destination] = route.split("-");
  if (!origin || !destination) return route;
  const originName = AIRPORT_NAMES[origin] ?? origin;
  const destinationName = AIRPORT_NAMES[destination] ?? destination;
  return `${originName} (${origin}) → ${destinationName} (${destination})`;
}

function questionAnswer(question: string, flights: ParsedFlight[], edges: RippleEdge[], horizon: SourcedValue[]): string {
  if (flights.length === 0) return "No cached benchmark rows are loaded yet.";

  if (question === "What is the earliest credible constraint?") {
    const top = [...flights].sort((a, b) => b.riskScore - a.riskScore)[0];
    return `Earliest constraint: ${top.flightId} on ${formatRoute(top.route)} with risk ${Math.round(top.riskScore * 100)}% and arrival delay ${top.arrDelayMinutes} minutes.`;
  }

  if (question === "Which downstream services are exposed within one hour?") {
    const exposed = edges
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((edge) => `${edge.target_flight} (${Math.round(edge.score * 100)}% propagation risk)`);
    return exposed.length > 0 ? `Most exposed within one hour: ${exposed.join("; ")}.` : "No inferred downstream propagation edges are available.";
  }

  if (question === "What paths explain the p95 delay increase?") {
    const p95 = horizon.find((item) => item.label.includes("P95"));
    const topEdge = edges.sort((a, b) => b.score - a.score)[0];
    return `P95 indicator: ${p95?.value ?? "UNAVAILABLE"} ${p95?.units ?? ""}. Strongest observed leading path: ${topEdge ? `${topEdge.source_flight} → ${topEdge.target_flight}` : "not available"} with inferred public-data dependency confidence.`;
  }

  return "Review baseline, source freshness, and confidence before acting on inferred risk dependencies.";
}

export function ProcessOverviewCockpit({
  airport,
  generatedAt,
  points,
  edges,
  flights,
  sourceStatus,
  overviewMetrics,
  probabilityHorizon,
}: {
  airport: string;
  generatedAt: string;
  points: RiskMapPoint[];
  edges: RippleEdge[];
  flights: Array<Record<string, unknown>>;
  sourceStatus: SourceStatus[];
  overviewMetrics: SourcedValue[];
  probabilityHorizon: SourcedValue[];
}) {
  const [selectedQuestion, setSelectedQuestion] = useState("What is the earliest credible constraint?");

  const parsedFlights = useMemo<ParsedFlight[]>(
    () =>
      flights.slice(0, 10).map((flight) => ({
        flightId: getString(flight, "flight_id", "UNKNOWN"),
        route: getString(flight, "route", "UNKNOWN-UNKNOWN"),
        riskScore: getNumber(flight, "risk_score", 0),
        carrierDelayProxyMinutes: getNumber(flight, "carrier_delay_proxy_minutes", 0),
        arrDelayMinutes: getNumber(flight, "arr_delay_minutes", 0),
        operation: getString(flight, "operation", "all"),
      })),
    [flights],
  );

  const graphNodes = useMemo(() => {
    return parsedFlights.map((flight, index) => {
      const column = flight.operation === "inbound" ? 0 : 1;
      const row = Math.floor(index / 2);
      return {
        ...flight,
        x: 90 + column * 280,
        y: 70 + row * 70,
        color: flight.riskScore >= 0.75 ? "#f43f5e" : flight.riskScore >= 0.55 ? "#fb923c" : "#60a5fa",
        size: 14 + Math.round(flight.carrierDelayProxyMinutes / 8),
      };
    });
  }, [parsedFlights]);

  const nodeById = useMemo(() => new Map(graphNodes.map((node) => [node.flightId, node])), [graphNodes]);

  const validEdges = useMemo(
    () => edges.filter((edge) => nodeById.has(edge.source_flight) && nodeById.has(edge.target_flight)).slice(0, 12),
    [edges, nodeById],
  );

  const healthScore = Math.max(
    0,
    100 -
      Math.round(
        parsedFlights.reduce((total, flight) => total + flight.riskScore * 18 + flight.arrDelayMinutes * 0.2, 0) /
          Math.max(parsedFlights.length, 1),
      ),
  );

  const questions = [
    "What is the earliest credible constraint?",
    "Which downstream services are exposed within one hour?",
    "What paths explain the p95 delay increase?",
  ];

  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Operational Intelligence Cockpit</h2>
          <p className="text-xs text-zinc-400">
            {airport} dependency graph with inferred public-data propagation, evidence log, and trend context.
          </p>
        </div>
        <p className="text-xs text-zinc-500">Updated {new Date(generatedAt).toLocaleString()}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
          <h3 className="mb-2 text-xs font-semibold text-zinc-300">Network Context (clustered dependency graph)</h3>
          <svg viewBox="0 0 460 330" className="h-80 w-full rounded border border-zinc-800 bg-zinc-950">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#facc15" />
              </marker>
            </defs>

            <rect x="20" y="24" width="190" height="280" rx="10" fill="rgba(56,189,248,0.08)" stroke="#1e293b" />
            <rect x="250" y="24" width="190" height="280" rx="10" fill="rgba(148,163,184,0.07)" stroke="#1e293b" />
            <text x="30" y="42" fill="#bae6fd" fontSize="11">
              Inbound pressure cluster
            </text>
            <text x="260" y="42" fill="#cbd5e1" fontSize="11">
              Outbound impact cluster
            </text>

            {validEdges.map((edge) => {
              const source = nodeById.get(edge.source_flight);
              const target = nodeById.get(edge.target_flight);
              if (!source || !target) return null;
              return (
                <g key={`${edge.source_flight}-${edge.target_flight}`}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edge.score >= 0.7 ? "#f43f5e" : "#facc15"}
                    strokeWidth={1 + edge.score * 4}
                    strokeOpacity={Math.max(edge.provenance.confidence, 0.35)}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}

            {graphNodes.map((node) => (
              <g key={node.flightId}>
                <circle cx={node.x} cy={node.y} r={Math.min(node.size, 24)} fill={node.color} fillOpacity={0.92} />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#020617" fontSize="10" fontWeight="700">
                  {node.flightId}
                </text>
              </g>
            ))}
          </svg>
          <p className="mt-2 text-xs text-zinc-500">
            Node size = carrier-delay-proxy load; edge thickness = inferred impact magnitude; opacity = confidence/freshness.
          </p>
        </article>

        <div className="space-y-3">
          <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <h3 className="mb-2 text-xs font-semibold text-zinc-300">Ask the Graph</h3>
            <div className="space-y-2">
              {questions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setSelectedQuestion(question)}
                  className={`w-full rounded border px-2 py-1 text-left text-xs ${selectedQuestion === question ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}
                >
                  {question}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-300">
              {questionAnswer(selectedQuestion, parsedFlights, edges, probabilityHorizon)}
            </p>
          </article>

          <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <h3 className="mb-2 text-xs font-semibold text-zinc-300">Cluster Health</h3>
            <p className="text-lg font-semibold">{healthScore} / 100</p>
            <p className="text-xs text-zinc-400">Trend uses synthetic + imputed public-data indicators with explicit confidence.</p>
          </article>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
          <h3 className="mb-2 text-xs font-semibold text-zinc-300">Streaming Evidence Log</h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {sourceStatus.slice(0, 4).map((source) => (
              <li key={source.source_name}>
                <span className="font-semibold">{source.source_name}</span>: {source.status_label} · confidence{" "}
                {Math.round(source.provenance.confidence * 100)}%
              </li>
            ))}
            <li>Risk-map sample windows: {points.length}</li>
            {parsedFlights.slice(0, 2).map((flight) => (
              <li key={`${flight.flightId}-route`}>{flight.flightId}: {formatRoute(flight.route)}</li>
            ))}
          </ul>
        </article>

        <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
          <h3 className="mb-2 text-xs font-semibold text-zinc-300">Trend + KPI Context</h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {overviewMetrics.slice(0, 3).map((metric) => (
              <li key={metric.label}>
                <span className="font-semibold">{metric.label}</span>: {metric.value ?? "UNAVAILABLE"} {metric.units ?? ""}
              </li>
            ))}
            {probabilityHorizon.slice(0, 2).map((metric) => (
              <li key={metric.label}>
                {metric.label}: {metric.value ?? "UNAVAILABLE"} {metric.units ?? ""}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded border border-zinc-800 bg-zinc-900 p-3">
          <h3 className="mb-2 text-xs font-semibold text-zinc-300">Most Exposed Paths</h3>
          <ul className="space-y-2 text-xs text-zinc-300">
            {validEdges.length === 0 ? (
              <li>No inferred propagation path available.</li>
            ) : (
              validEdges.slice(0, 4).map((edge) => (
                <li key={`${edge.source_flight}-${edge.target_flight}`}>
                  {edge.source_flight} → {edge.target_flight}: {Math.round(edge.score * 100)}% risk dependency
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
