import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  Filter,
  Network,
  Radar,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";

import { ContextGraph } from "@/components/context-graph";
import { TrendStrip } from "@/components/trend-strip";
import { demoDataset } from "@/data/demo-context";
import { useCommandCenterStore } from "@/store/use-command-center-store";
import type { GraphNodeRecord, MetricCard } from "@/types";

const METRIC_ICONS = {
  cyan: Network,
  violet: BrainCircuit,
  amber: Radar,
  rose: ShieldAlert,
} satisfies Record<MetricCard["tone"], typeof Activity>;

function toneClasses(tone: MetricCard["tone"]) {
  switch (tone) {
    case "cyan":
      return "border-cyan-400/20 bg-cyan-400/8 text-cyan-100";
    case "violet":
      return "border-violet-400/20 bg-violet-400/8 text-violet-100";
    case "amber":
      return "border-amber-400/20 bg-amber-400/8 text-amber-100";
    case "rose":
      return "border-rose-400/20 bg-rose-400/8 text-rose-100";
  }
}

function severityClasses(severity: "nominal" | "watch" | "alert") {
  switch (severity) {
    case "nominal":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "watch":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "alert":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }
}

function statusClasses(status: string) {
  if (status === "running" || status === "LIVE PUBLIC DATA" || status === "fresh") {
    return "text-emerald-200 border-emerald-400/20 bg-emerald-400/10";
  }

  if (status === "queued" || status === "watch" || status === "warm" || status === "MIXED") {
    return "text-amber-200 border-amber-400/20 bg-amber-400/10";
  }

  if (status === "DEGRADED" || status === "elevated") {
    return "text-rose-200 border-rose-400/20 bg-rose-400/10";
  }

  return "text-slate-200 border-white/10 bg-white/5";
}

function provenanceLine(node: GraphNodeRecord) {
  return `${node.provenance.sourceSystem} · ${node.provenance.dataMode} · confidence ${Math.round(node.provenance.confidence * 100)}%`;
}

export default function App() {
  const selectedNodeId = useCommandCenterStore((state) => state.selectedNodeId);
  const selectedCommunityId = useCommandCenterStore((state) => state.selectedCommunityId);
  const selectedQueryId = useCommandCenterStore((state) => state.selectedQueryId);
  const searchTerm = useCommandCenterStore((state) => state.searchTerm);
  const setSelectedNodeId = useCommandCenterStore((state) => state.setSelectedNodeId);
  const setSelectedCommunityId = useCommandCenterStore((state) => state.setSelectedCommunityId);
  const setSelectedQueryId = useCommandCenterStore((state) => state.setSelectedQueryId);
  const setSearchTerm = useCommandCenterStore((state) => state.setSearchTerm);
  const resetSelections = useCommandCenterStore((state) => state.resetSelections);

  const selectedQuery = useMemo(
    () => demoDataset.queries.find((query) => query.id === selectedQueryId) ?? demoDataset.queries[0],
    [selectedQueryId],
  );

  const selectedNode = useMemo(
    () => demoDataset.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedNodeId],
  );

  const selectedCommunity = useMemo(
    () => demoDataset.communities.find((community) => community.id === selectedCommunityId) ?? null,
    [selectedCommunityId],
  );

  const visiblePaths = useMemo(() => {
    const pathIds = new Set(selectedQuery.evidencePathIds);
    return demoDataset.evidencePaths.filter((path) => pathIds.has(path.id));
  }, [selectedQuery]);

  const nodeNeighbors = useMemo(() => {
    if (!selectedNode) return [];

    return demoDataset.edges
      .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
      .map((edge) => {
        const neighborId = edge.source === selectedNode.id ? edge.target : edge.source;
        return demoDataset.nodes.find((node) => node.id === neighborId);
      })
      .filter((node): node is GraphNodeRecord => Boolean(node));
  }, [selectedNode]);

  const filteredNodes = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return demoDataset.nodes;

    return demoDataset.nodes.filter(
      (node) => node.label.toLowerCase().includes(needle) || node.summary.toLowerCase().includes(needle),
    );
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_22%),linear-gradient(180deg,#020617_0%,#020617_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/85 p-6 shadow-[0_24px_90px_rgba(2,6,23,0.65)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">Static demo</span>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1">Cloudflare-ready</span>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1">Public-data provenance</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{demoDataset.headline}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">{demoDataset.subheadline}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:min-w-[540px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Generated</p>
                <p className="mt-2 text-lg font-semibold text-white">{new Date(demoDataset.generatedAt).toLocaleString()}</p>
                <p className="mt-2 text-xs text-slate-400">Refresh window for all synthetic graph events and demo provenance labels.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Active query</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedQuery.title}</p>
                <p className="mt-2 text-xs text-slate-400">{selectedQuery.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Focus state</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedCommunity?.title ?? "All communities"}</p>
                <p className="mt-2 text-xs text-slate-400">{selectedNode ? `Node: ${selectedNode.label}` : "Select a node or cluster to tighten the graph narrative."}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {demoDataset.metrics.map((metric) => {
            const Icon = METRIC_ICONS[metric.tone];
            return (
              <article key={metric.id} className={`rounded-3xl border p-4 shadow-[0_12px_50px_rgba(15,23,42,0.45)] ${toneClasses(metric.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] opacity-75">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <span className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-white/85">
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-200/90">{metric.detail}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300/80">
                  <span>{metric.delta}</span>
                  <span>{metric.provenance.dataMode}</span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Graph querying</p>
                  <h2 className="text-lg font-semibold text-white">Ask the graph</h2>
                </div>
                <Sparkles className="size-5 text-cyan-300" />
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">
                  <Search className="size-4 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search nodes, communities, evidence"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-400">Preset queries drive the highlighted graph path; search broadens visible node labels.</p>
              </div>
              <div className="mt-4 space-y-3">
                {demoDataset.queries.map((query) => (
                  <button
                    key={query.id}
                    type="button"
                    onClick={() => setSelectedQueryId(query.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedQuery.id === query.id ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}
                  >
                    <p className="text-sm font-semibold text-white">{query.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{query.prompt}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-violet-300/70">Communities</p>
                  <h2 className="text-lg font-semibold text-white">Cluster filters</h2>
                </div>
                <Filter className="size-5 text-violet-200" />
              </div>
              <div className="mt-4 space-y-3">
                {demoDataset.communities.map((community) => (
                  <button
                    key={community.id}
                    type="button"
                    onClick={() =>
                      setSelectedCommunityId(selectedCommunityId === community.id ? null : community.id)
                    }
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedCommunityId === community.id ? "border-violet-400/40 bg-violet-400/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}
                  >
                    <p className="text-sm font-semibold text-white">{community.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{community.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {community.metrics.map((metric) => (
                        <span key={metric.label} className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[11px] text-slate-300">
                          {metric.label}: {metric.value}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <ContextGraph
            nodes={demoDataset.nodes}
            edges={demoDataset.edges}
            queries={demoDataset.queries}
            communities={demoDataset.communities}
          />

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Evidence paths</p>
                  <h2 className="text-lg font-semibold text-white">Explainability deck</h2>
                </div>
                <ArrowRight className="size-5 text-emerald-200" />
              </div>
              <div className="mt-4 space-y-3">
                {visiblePaths.map((path) => (
                  <article key={path.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{path.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{path.summary}</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200">
                        {Math.round(path.confidence * 100)}%
                      </span>
                    </div>
                    <ol className="mt-3 space-y-2">
                      {path.steps.map((step) => (
                        <li key={step.label} className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{step.label}</p>
                          <p className="mt-1 text-sm text-slate-200">{step.explanation}</p>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Selected node</p>
                  <h2 className="text-lg font-semibold text-white">Inspector</h2>
                </div>
                <Bot className="size-5 text-cyan-200" />
              </div>
              {selectedNode ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{selectedNode.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{selectedNode.summary}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClasses(selectedNode.status)}`}>
                        {selectedNode.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{provenanceLine(selectedNode)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Adjacent nodes</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nodeNeighbors.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                        >
                          {node.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-400">
                  Click a graph node to inspect its evidence, provenance, and neighboring path structure.
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <TrendStrip trends={demoDataset.trends} />

          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Agent activity</p>
                <h2 className="text-lg font-semibold text-white">Construction + query event stream</h2>
              </div>
              <Activity className="size-5 text-cyan-200" />
            </div>
            <div className="mt-4 space-y-3">
              {demoDataset.activities.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{activity.agent}</p>
                      <p className="text-xs text-slate-400">{activity.action}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClasses(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                    <span>{activity.latencyMs} ms</span>
                    <span>{activity.tokens} tokens</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/70">Graph construction events</p>
                <h2 className="text-lg font-semibold text-white">Timeline and operational context</h2>
              </div>
              <Radar className="size-5 text-amber-200" />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {demoDataset.timeline.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${severityClasses(event.severity)}`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{event.timestamp}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{event.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-300/70">Source status</p>
                <h2 className="text-lg font-semibold text-white">Provenance + limits</h2>
              </div>
              <ShieldAlert className="size-5 text-violet-200" />
            </div>
            <div className="mt-4 space-y-3">
              {demoDataset.sources.map((source) => (
                <article key={source.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{source.label}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClasses(source.status)}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{source.detail}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {source.provenance.sourceSystem} · {source.freshness} · confidence {Math.round(source.provenance.confidence * 100)}%
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mandatory limitation notices</p>
              {demoDataset.limitations.map((notice) => (
                <article key={notice.title}>
                  <p className="text-sm font-semibold text-white">{notice.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{notice.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Node directory</p>
              <h2 className="text-lg font-semibold text-white">Searchable graph entities</h2>
              <p className="mt-2 text-sm text-slate-400">Use search or direct selection to jump around the knowledge graph without leaving the dashboard.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetSelections}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/8"
              >
                Reset selections
              </button>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
                {filteredNodes.length} matching nodes
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`rounded-2xl border p-3 text-left transition ${selectedNodeId === node.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{node.label}</p>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusClasses(node.status)}`}>
                    {node.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{node.summary}</p>
                <p className="mt-3 text-xs text-slate-500">{provenanceLine(node)}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
