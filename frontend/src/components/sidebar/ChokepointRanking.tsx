"use client";

import type { ChokepointProperties } from "@/types";
import { cn } from "@/lib/utils";

interface ChokepointRankingProps {
  chokepoints: ChokepointProperties[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const severityBadge: Record<string, string> = {
  critical: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function ChokepointRanking({ chokepoints, selectedId, onSelect }: ChokepointRankingProps) {
  if (chokepoints.length === 0) {
    return (
      <div className="glass-card rounded-lg p-3">
        <p className="mb-2 text-sm font-medium text-cyan-accent">Chokepoint Ranking</p>
        <p className="text-xs text-slate-500">No chokepoints match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-3">
      <p className="mb-2 text-sm font-medium text-cyan-accent">Chokepoint Ranking</p>
      <div className="space-y-2">
        {chokepoints.slice(0, 6).map((point, index) => (
          <button
            key={point.id}
            className={cn(
              "glow-cyan w-full rounded-md border px-2.5 py-2 text-left transition-colors",
              selectedId === point.id
                ? "border-cyan-accent/50 bg-cyan-accent/5"
                : "border-slate-border bg-surface/50 hover:bg-surface-raised/60",
            )}
            onClick={() => onSelect(point.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-100">
                  {index + 1}. {point.name}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {point.region} · {point.primary_commodity}
                </p>
              </div>
              <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] capitalize", severityBadge[point.severity])}>
                {point.severity}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-rose-300">+{point.pct_above_avg}% above regional avg</span>
              <span className="font-medium text-slate-300">{point.delay_hours}h delay</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
