"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommodityDatum } from "@/types";

interface CommodityChartProps {
  data: CommodityDatum[];
  highlightCommodity?: string;
}

export function CommodityChart({ data, highlightCommodity }: CommodityChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-lg p-3">
        <p className="mb-2 text-sm font-medium text-cyan-accent">Commodity Overlay</p>
        <p className="text-xs text-slate-500">No commodity data for current filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-3">
      <p className="mb-1 text-sm font-medium text-cyan-accent">Commodity Overlay</p>
      <p className="mb-2 text-[10px] text-slate-500">Avg delay hours by commodity (filtered view)</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#0B1117",
                border: "1px solid #1F2937",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => {
                if (name === "avg_delay_hours") return [`${value}h`, "Avg delay"];
                return [value, name];
              }}
            />
            <Bar dataKey="avg_delay_hours" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={highlightCommodity && entry.name === highlightCommodity ? "#38BDF8" : "#818CF8"}
                  opacity={highlightCommodity && entry.name !== highlightCommodity ? 0.45 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
