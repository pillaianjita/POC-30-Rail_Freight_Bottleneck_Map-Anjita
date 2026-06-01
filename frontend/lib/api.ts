import type {
  ChokepointProperties,
  CommodityDatum,
  DelaySimulation,
  FeatureCollection,
  Metrics,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API request failed for ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function getMetrics() {
  return fetchJson<Metrics>("/api/metrics");
}

export async function getNetwork(params: URLSearchParams) {
  return fetchJson<FeatureCollection>(`/api/network?${params.toString()}`);
}

export async function getChokepoints(params: URLSearchParams) {
  return fetchJson<FeatureCollection<ChokepointProperties>>(`/api/chokepoints?${params.toString()}`);
}

export async function getCommodities() {
  const payload = await fetchJson<{ commodities: CommodityDatum[] }>("/api/commodities");
  return payload.commodities;
}

export async function getDelaySimulation(chokepointId: string, multiplier: number) {
  return fetchJson<DelaySimulation>(
    `/api/delay-simulation?chokepoint_id=${encodeURIComponent(chokepointId)}&severity_multiplier=${multiplier}`,
  );
}

export function getExportUrl() {
  return `${API_BASE}/api/export/sample-data`;
}
