import type { SourcedValue } from "@/lib/types";

export function ProbabilityHorizon({ values }: { values: SourcedValue[] }) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-3 text-sm font-semibold">Dynamic Probability Horizon (P50/P80/P95/P99)</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {values.map((value) => (
          <article key={value.label} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs text-zinc-400">{value.label}</p>
            <p className="text-lg font-semibold">{value.value ?? "UNAVAILABLE"}</p>
            <p className="text-xs text-zinc-500">{value.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
