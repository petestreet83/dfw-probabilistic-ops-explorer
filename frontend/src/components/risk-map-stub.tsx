"use client";

import type { RiskMapPoint } from "@/lib/types";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

export function RiskMapStub({ points }: { points: RiskMapPoint[] }) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-3 text-sm font-semibold">DFW Probabilistic Risk Map (PCA Stub)</h2>
      {points.length === 0 ? (
        <p className="text-sm text-zinc-400">UNAVAILABLE/STALE/CACHED-ONLY: no historical benchmark points loaded.</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="pca_x" name="PCA-1" />
              <YAxis type="number" dataKey="pca_y" name="PCA-2" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={points} fill="#60a5fa" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-500">Rules-based PCA placeholder for Phase 1.</p>
    </section>
  );
}
