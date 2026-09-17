import type { SourceStatus } from "@/lib/types";

export function SourceStatusConsole({ sources }: { sources: SourceStatus[] }) {
  return (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="mb-3 text-sm font-semibold">Source Status & Data Quality Console</h2>
      <div className="space-y-2">
        {sources.map((source) => (
          <article
            key={source.source_name}
            className={`rounded border p-3 text-sm ${source.available ? "border-zinc-700 bg-zinc-900" : "border-zinc-700 bg-[repeating-linear-gradient(45deg,#3f3f46,#3f3f46_10px,#18181b_10px,#18181b_20px)]"}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{source.source_name}</p>
              <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{source.status_label}</span>
            </div>
            <p className="text-xs text-zinc-300">{source.message}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {source.provenance.source_system} · {source.provenance.data_mode} · confidence {source.provenance.confidence}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
