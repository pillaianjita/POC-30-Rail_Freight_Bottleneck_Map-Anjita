"use client";

import { Camera, Download, RotateCcw } from "lucide-react";
import type { ChokepointProperties, CommodityDatum, DelaySimulation, Metrics } from "@/types";
import { FilterTooltip } from "@/components/ui/FilterTooltip";
import { cn } from "@/lib/utils";
import { ChokepointRanking } from "./ChokepointRanking";
import { CommodityChart } from "./CommodityChart";
import { DelaySimulator } from "./DelaySimulator";

interface Props {
  metrics: Metrics;
  chokepoints: ChokepointProperties[];
  commodities: CommodityDatum[];
  delaySimulation: DelaySimulation | null;
  selectedChokepointId: string;
  onSelectChokepoint: (id: string) => void;
  exportUrl: string;
  onExportMap: () => void;
  exportingMap: boolean;
  exportError?: string | null;
  commodity: string;
  region: string;
  severity: string;
  minUtilization: number;
  railLineCount: number;
  onFilterChange: (key: "commodity" | "region" | "severity", value: string) => void;
  onMinUtilizationChange: (value: number) => void;
  onClearFilters: () => void;
}

const selectClass =
  "glow-cyan w-full rounded-md border border-slate-border bg-surface px-2.5 py-2 text-xs text-slate-200 outline-none transition-colors focus:border-cyan-accent/50";

function KpiCard({ label, value, insight }: { label: string; value: string; insight?: string }) {
  return (
    <div className="rounded-md border border-slate-border bg-surface/60 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-100">{value}</p>
      {insight ? <p className="mt-0.5 text-[10px] text-cyan-accent/80">{insight}</p> : null}
    </div>
  );
}

export function IntelligenceSidebar({
  metrics,
  chokepoints,
  commodities,
  delaySimulation,
  selectedChokepointId,
  onSelectChokepoint,
  exportUrl,
  onExportMap,
  exportingMap,
  exportError,
  commodity,
  region,
  severity,
  minUtilization,
  railLineCount,
  onFilterChange,
  onMinUtilizationChange,
  onClearFilters,
}: Props) {
  const activeFilterCount = [commodity, region, severity, minUtilization > 0].filter(Boolean).length;

  return (
    <aside className="h-full space-y-3 overflow-y-auto pl-3" style={{ width: "30%" }}>
      <section className="glass-card rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Section A</p>
        <h2 className="mt-1 text-sm font-semibold text-cyan-accent">Rail Freight Bottleneck Intelligence</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <KpiCard label="Chokepoints" value={String(metrics.total_chokepoints)} insight={`${metrics.critical_count} critical`} />
          <KpiCard label="Avg delay" value={`${metrics.avg_network_delay_hours}h`} insight={`+${metrics.avg_pct_above_regional_avg ?? 0}% vs regional avg`} />
          <KpiCard label="Daily cars" value={metrics.total_daily_cars.toLocaleString()} insight={metrics.most_affected_commodity} />
          <KpiCard label="Incidents (30d)" value={String(metrics.incidents_30d_total)} insight={`${railLineCount} rail corridors visible`} />
        </div>
      </section>

      <section className="glass-card rounded-lg p-3 text-xs leading-relaxed text-slate-300">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Section B — Why This Matters</p>
        Good &ldquo;real rails&rdquo; metaphor because it is literal and economic — bottlenecks are physical pressure
        points where freight delay converts directly into inventory risk, delivery speed, and regional price instability.
      </section>

      <section className="glass-card rounded-lg p-3 text-xs leading-relaxed text-slate-300">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Section C — Who Controls The Rail</p>
        Freight movement is heavily influenced by a small number of rail operators and high-traffic junctions, where
        disruptions at key chokepoints can impact shipment flow, delivery speed, and regional supply chains across the
        network.
      </section>

      <section className="glass-card space-y-3 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Section D — Filters</p>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="glow-cyan flex items-center gap-1 text-[10px] text-cyan-accent"
            >
              <RotateCcw size={10} /> Clear ({activeFilterCount})
            </button>
          ) : null}
        </div>

        <div className="rounded-md border border-cyan-accent/20 bg-cyan-accent/5 px-2.5 py-2 text-[10px] text-slate-300">
          Showing <span className="font-medium text-cyan-accent">{chokepoints.length}</span> chokepoints and{" "}
          <span className="font-medium text-cyan-accent">{railLineCount}</span> rail corridors
        </div>

        <FilterTooltip label="Commodity" hint="Filters chokepoints and rail lines by primary freight type. The commodity chart updates to match.">
          <select className={selectClass} value={commodity} onChange={(e) => onFilterChange("commodity", e.target.value)}>
            <option value="">All commodities</option>
            <option value="Intermodal">Intermodal</option>
            <option value="Grain">Grain</option>
            <option value="Chemicals">Chemicals</option>
            <option value="Automotive">Automotive</option>
            <option value="Coal">Coal</option>
            <option value="Crude Oil">Crude Oil</option>
          </select>
        </FilterTooltip>

        <FilterTooltip label="Region" hint="Limits the map to chokepoints and corridors in a US freight region.">
          <select className={selectClass} value={region} onChange={(e) => onFilterChange("region", e.target.value)}>
            <option value="">All regions</option>
            <option value="Midwest">Midwest</option>
            <option value="Southeast">Southeast</option>
            <option value="West">West</option>
            <option value="Northeast">Northeast</option>
            <option value="Southwest">Southwest</option>
            <option value="Plains">Plains</option>
          </select>
        </FilterTooltip>

        <FilterTooltip label="Severity" hint="Shows only chokepoints at the selected congestion level. Rail lines are not filtered by severity.">
          <select className={selectClass} value={severity} onChange={(e) => onFilterChange("severity", e.target.value)}>
            <option value="">All severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </FilterTooltip>

        <FilterTooltip label="Min utilization" hint="Hides rail corridors below this utilization %. Chokepoint dots are not affected — use this to focus on the busiest lines.">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Quiet lines hidden below</span>
              <span className="font-medium text-cyan-accent">{minUtilization}%</span>
            </div>
            <input
              className="glow-cyan w-full accent-cyan-accent"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minUtilization}
              onChange={(e) => onMinUtilizationChange(Number(e.target.value))}
            />
          </div>
        </FilterTooltip>
      </section>

      <ChokepointRanking chokepoints={chokepoints} selectedId={selectedChokepointId} onSelect={onSelectChokepoint} />
      <CommodityChart data={commodities} highlightCommodity={commodity || undefined} />
      <DelaySimulator data={delaySimulation} />

      <section className="glass-card rounded-lg p-3">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Section E — Export</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onExportMap}
            disabled={exportingMap}
            className={cn(
              "glow-cyan flex items-center justify-center gap-2 rounded-md border border-slate-border px-3 py-2 text-xs text-cyan-accent transition-colors hover:bg-cyan-accent/5",
              exportingMap && "cursor-wait opacity-60",
            )}
          >
            <Camera size={14} />
            {exportingMap ? "Capturing map…" : "Export Map Snapshot (PNG)"}
          </button>
          {exportError ? (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[10px] text-rose-300">
              {exportError}
            </p>
          ) : null}
          <a
            href={exportUrl}
            className="glow-cyan flex items-center justify-center gap-2 rounded-md border border-slate-border px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-surface-raised/60"
          >
            <Download size={14} />
            Download Sample Data (CSV)
          </a>
        </div>
      </section>
    </aside>
  );
}
