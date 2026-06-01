export type Severity = "critical" | "high" | "medium" | "low";

export interface ChokepointProperties {
  id: string;
  name: string;
  region: string;
  severity: Severity;
  delay_hours: number;
  throughput_pct: number;
  primary_commodity: string;
  operator: string;
  incidents_30d: number;
  daily_cars: number;
  pct_above_avg: number;
  description: string;
}

export interface GeoJsonFeature<T = Record<string, unknown>> {
  type: "Feature";
  geometry: { type: string; coordinates: number[] | number[][] };
  properties: T;
}

export interface FeatureCollection<T = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJsonFeature<T>[];
}

export interface CommodityDatum {
  name: string;
  total_cars_daily: number;
  avg_delay_hours: number;
  bottleneck_count: number;
  trend_pct: number;
}

export interface DelaySimulation {
  source_chokepoint: string;
  base_delay_hours: number;
  total_affected_cars: number;
  estimated_economic_impact_usd: number;
  downstream_impact: { node: string; delay_hours: number; affected_cars: number }[];
}

export interface Metrics {
  total_chokepoints: number;
  critical_count: number;
  high_count: number;
  avg_network_delay_hours: number;
  total_daily_cars: number;
  worst_chokepoint: string;
  most_affected_commodity: string;
  network_utilization_pct: number;
  incidents_30d_total: number;
  avg_pct_above_regional_avg: number;
  data_source: string;
}
