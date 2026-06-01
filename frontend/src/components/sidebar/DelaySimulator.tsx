"use client";

import type { DelaySimulation } from "@/types";

export function DelaySimulator({ data }: { data: DelaySimulation | null }) {
  if (!data) {
    return (
      <div className="glass-card rounded-lg p-3">
        <p className="mb-2 text-sm font-medium text-cyan-accent">Delay Simulator</p>
        <p className="text-xs text-slate-500">Select a chokepoint on the map or ranking list to simulate downstream ripple effects.</p>
      </div>
    );
  }

  const maxDelay = Math.max(data.base_delay_hours, ...data.downstream_impact.map((n) => n.delay_hours));

  return (
    <div className="glass-card rounded-lg p-3">
      <p className="mb-2 text-sm font-medium text-cyan-accent">Delay Simulator</p>
      <div className="mb-3 rounded-md border border-slate-border bg-surface/60 p-2.5">
        <p className="text-xs font-medium text-slate-100">{data.source_chokepoint}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <p className="text-slate-500">Base delay</p>
            <p className="font-medium text-rose-300">{data.base_delay_hours}h</p>
          </div>
          <div>
            <p className="text-slate-500">Affected cars</p>
            <p className="font-medium text-slate-200">{data.total_affected_cars.toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Est. economic impact</p>
            <p className="font-medium text-cyan-accent">${data.estimated_economic_impact_usd.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Downstream cascade</p>
      <div className="space-y-2">
        {data.downstream_impact.map((node, index) => (
          <div key={`${node.node}-${index}`} className="rounded-md border border-slate-border/80 bg-obsidian/40 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="truncate text-slate-300">{node.node}</span>
              <span className="shrink-0 text-rose-300">{node.delay_hours}h</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
                style={{ width: `${Math.max(8, (node.delay_hours / maxDelay) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{node.affected_cars.toLocaleString()} cars impacted</p>
          </div>
        ))}
      </div>
    </div>
  );
}
