import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TrendPoint } from "@/types";

export function TrendStrip({ trends }: { trends: TrendPoint[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.5)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-violet-300/70">Live-style metrics</p>
          <h2 className="text-lg font-semibold text-white">Agent throughput, graph density, and explainability coverage</h2>
        </div>
        <p className="max-w-sm text-right text-xs text-slate-400">
          Synthetic streaming values update the dashboard feel without needing a backend during the initial demo.
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="coverageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis dataKey="minute" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={38} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid rgba(148, 163, 184, 0.15)",
                borderRadius: "16px",
                color: "#e2e8f0",
              }}
            />
            <Area type="monotone" dataKey="graphDensity" stroke="#22d3ee" fill="url(#densityFill)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="evidenceCoverage" stroke="#a78bfa" fill="url(#coverageFill)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="activeAgents" stroke="#f59e0b" fill="transparent" strokeWidth={2.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
