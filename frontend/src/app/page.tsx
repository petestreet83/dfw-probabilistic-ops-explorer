"use client";

import { useQuery } from "@tanstack/react-query";

import { DataModeBadge } from "@/components/data-mode-badge";
import { HighRiskTable } from "@/components/high-risk-table";
import { ProbabilityHorizon } from "@/components/probability-horizon";
import { RiskMapStub } from "@/components/risk-map-stub";
import { SourceStatusConsole } from "@/components/source-status-console";
import { TransparencyFooter } from "@/components/transparency-footer";
import { fetchDashboard } from "@/lib/api";
import { useFilterStore } from "@/lib/store";

export default function Home() {
  const { operation, horizon, setOperation, setHorizon } = useFilterStore();

  const dashboard = useQuery({
    queryKey: ["dashboard", operation, horizon],
    queryFn: () => fetchDashboard(operation, horizon),
    retry: 1,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4">
      <header className="rounded border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">DFW Probabilistic Operations Explorer</h1>
            <p className="text-sm text-zinc-400">Phase 1 foundation — public data only</p>
          </div>
          <DataModeBadge mode={dashboard.data?.data_mode} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm">
            Operation
            <select
              className="ml-2 rounded border border-zinc-700 bg-zinc-900 p-1"
              value={operation}
              onChange={(event) => setOperation(event.target.value as "all" | "inbound" | "outbound")}
            >
              <option value="all">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </label>
          <label className="text-sm">
            Horizon
            <select
              className="ml-2 rounded border border-zinc-700 bg-zinc-900 p-1"
              value={horizon}
              onChange={(event) => setHorizon(event.target.value as "now" | "2h" | "6h" | "12h" | "24h")}
            >
              <option value="now">Now</option>
              <option value="2h">+2h</option>
              <option value="6h">+6h</option>
              <option value="12h">+12h</option>
              <option value="24h">+24h</option>
            </select>
          </label>
        </div>
      </header>

      {dashboard.isError ? (
        <section className="rounded border border-rose-700 bg-rose-950/20 p-4 text-sm">
          Unable to load backend data. Start FastAPI (`uvicorn app.main:app`) and set NEXT_PUBLIC_API_BASE_URL.
        </section>
      ) : null}

      <ProbabilityHorizon values={dashboard.data?.probability_horizon ?? []} />

      <section className="grid gap-4 lg:grid-cols-2">
        <RiskMapStub points={dashboard.data?.risk_map_points ?? []} />
        <SourceStatusConsole sources={dashboard.data?.source_status ?? []} />
      </section>

      <HighRiskTable flights={dashboard.data?.high_risk_flights ?? []} />
      <TransparencyFooter limitations={dashboard.data?.limitations ?? []} />
    </main>
  );
}
