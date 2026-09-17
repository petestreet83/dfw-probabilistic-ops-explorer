import type { DataMode } from "@/lib/types";

const modeClasses: Record<DataMode, string> = {
  "LIVE PUBLIC DATA": "bg-emerald-700",
  "CACHED PUBLIC DATA": "bg-sky-700",
  MIXED: "bg-amber-700",
  DEGRADED: "bg-rose-700",
};

export function DataModeBadge({ mode }: { mode: DataMode | undefined }) {
  if (!mode) {
    return <span className="rounded px-2 py-1 text-xs font-semibold bg-zinc-700">DEGRADED</span>;
  }

  return <span className={`rounded px-2 py-1 text-xs font-semibold ${modeClasses[mode]}`}>{mode}</span>;
}
