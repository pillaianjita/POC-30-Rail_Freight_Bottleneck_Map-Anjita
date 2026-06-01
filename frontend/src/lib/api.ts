import type {
  ChokepointProperties,
  CommodityDatum,
  DelaySimulation,
  FeatureCollection,
  Metrics,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function fetchWithFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[api] falling back to mock for ${path}`, error);
    return fallback;
  }
}

function toQuery(params?: URLSearchParams): string {
  if (!params || [...params.keys()].length === 0) return "";
  return `?${params.toString()}`;
}

function filterChokepoints(
  points: ChokepointProperties[],
  params?: URLSearchParams,
): ChokepointProperties[] {
  let filtered = [...points];
  const commodity = params?.get("commodity");
  const region = params?.get("region");
  const severity = params?.get("severity");

  if (commodity) {
    filtered = filtered.filter((p) => p.primary_commodity.toLowerCase() === commodity.toLowerCase());
  }
  if (region) {
    filtered = filtered.filter((p) => p.region.toLowerCase() === region.toLowerCase());
  }
  if (severity) {
    filtered = filtered.filter((p) => p.severity.toLowerCase() === severity.toLowerCase());
  }

  return filtered.sort((a, b) => b.delay_hours - a.delay_hours);
}

function mockMetricsFromPoints(points: ChokepointProperties[]): Metrics {
  if (points.length === 0) {
    return {
      total_chokepoints: 0,
      critical_count: 0,
      high_count: 0,
      avg_network_delay_hours: 0,
      total_daily_cars: 0,
      worst_chokepoint: "—",
      most_affected_commodity: "—",
      network_utilization_pct: 0,
      incidents_30d_total: 0,
      avg_pct_above_regional_avg: 0,
      data_source: "Demo dataset",
    };
  }

  const commodityCounts: Record<string, number> = {};
  for (const point of points) {
    commodityCounts[point.primary_commodity] = (commodityCounts[point.primary_commodity] ?? 0) + 1;
  }

  return {
    total_chokepoints: points.length,
    critical_count: points.filter((p) => p.severity === "critical").length,
    high_count: points.filter((p) => p.severity === "high").length,
    avg_network_delay_hours: round1(points.reduce((s, p) => s + p.delay_hours, 0) / points.length),
    total_daily_cars: points.reduce((s, p) => s + p.daily_cars, 0),
    worst_chokepoint: points.reduce((a, b) => (a.delay_hours > b.delay_hours ? a : b)).name,
    most_affected_commodity: Object.entries(commodityCounts).sort((a, b) => b[1] - a[1])[0][0],
    network_utilization_pct: round1(points.reduce((s, p) => s + p.throughput_pct, 0) / points.length),
    incidents_30d_total: points.reduce((s, p) => s + p.incidents_30d, 0),
    avg_pct_above_regional_avg: round1(points.reduce((s, p) => s + p.pct_above_avg, 0) / points.length),
    data_source: "Demo dataset",
  };
}

function mockCommoditiesFromPoints(points: ChokepointProperties[], params?: URLSearchParams): CommodityDatum[] {
  const commodity = params?.get("commodity");
  const grouped: Record<string, ChokepointProperties[]> = {};
  for (const point of points) {
    if (!grouped[point.primary_commodity]) grouped[point.primary_commodity] = [];
    grouped[point.primary_commodity].push(point);
  }

  return Object.entries(grouped)
    .filter(([name]) => !commodity || name.toLowerCase() === commodity.toLowerCase())
    .map(([name, items]) => ({
      name,
      total_cars_daily: items.reduce((s, p) => s + p.daily_cars, 0),
      avg_delay_hours: round1(items.reduce((s, p) => s + p.delay_hours, 0) / items.length),
      bottleneck_count: items.length,
      trend_pct: round1(items.reduce((s, p) => s + p.pct_above_avg, 0) / items.length / 10),
    }));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Minimal fallback set — live backend mock_data.json has the full 20-point dataset
const MOCK_CHOKEPOINTS: ChokepointProperties[] = [
  {
    id: "cp-001",
    name: "Chicago Classification Yard",
    region: "Midwest",
    severity: "critical",
    delay_hours: 22.4,
    throughput_pct: 42,
    primary_commodity: "Intermodal",
    operator: "BNSF Railway",
    incidents_30d: 48,
    daily_cars: 12400,
    pct_above_avg: 92,
    description: "Largest US rail hub with multi-operator congestion risk.",
  },
  {
    id: "cp-002",
    name: "Memphis Gateway Junction",
    region: "Southeast",
    severity: "high",
    delay_hours: 14.1,
    throughput_pct: 61,
    primary_commodity: "Grain",
    operator: "Union Pacific",
    incidents_30d: 31,
    daily_cars: 7800,
    pct_above_avg: 58,
    description: "Critical river-rail transfer junction for agricultural exports.",
  },
  {
    id: "cp-003",
    name: "Donner Pass Corridor",
    region: "West",
    severity: "critical",
    delay_hours: 19.7,
    throughput_pct: 38,
    primary_commodity: "Intermodal",
    operator: "Union Pacific",
    incidents_30d: 42,
    daily_cars: 5600,
    pct_above_avg: 81,
    description: "Mountain pass constraints create recurring network slowdown.",
  },
  {
    id: "cp-006",
    name: "Atlanta Inman Yard",
    region: "Southeast",
    severity: "critical",
    delay_hours: 17.2,
    throughput_pct: 49,
    primary_commodity: "Intermodal",
    operator: "Norfolk Southern",
    incidents_30d: 36,
    daily_cars: 10200,
    pct_above_avg: 76,
    description: "Southeast intermodal hub with persistent yard congestion.",
  },
];

const MOCK_COORDS: Record<string, [number, number]> = {
  "cp-001": [41.8827, -87.6233],
  "cp-002": [35.1495, -90.049],
  "cp-003": [39.322, -120.3272],
  "cp-006": [33.749, -84.388],
};

function mockChokepoints(params?: URLSearchParams): FeatureCollection<ChokepointProperties> {
  const features = filterChokepoints(MOCK_CHOKEPOINTS, params).map((point) => {
    const [lat, lon] = MOCK_COORDS[point.id] ?? [39.5, -98.35];
    return {
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: point,
    };
  });
  return { type: "FeatureCollection", features };
}

function mockNetwork(params?: URLSearchParams): FeatureCollection {
  const minUtilization = Number(params?.get("min_utilization") ?? 0);
  const commodity = params?.get("commodity");
  const region = params?.get("region");

  const lines = [
    {
      id: "rl-001",
      name: "Transcontinental Main",
      commodity: "Intermodal",
      region: "West",
      utilization_pct: 88,
      coords: [
        [-118.2, 34.0],
        [-111.6, 35.2],
        [-101.8, 35.5],
        [-94.5, 39.1],
        [-87.6, 41.8],
      ],
    },
    {
      id: "rl-002",
      name: "Central Corridor",
      commodity: "Grain",
      region: "Midwest",
      utilization_pct: 79,
      coords: [
        [-120.3, 39.3],
        [-104.9, 38.8],
        [-97.3, 37.7],
        [-90.0, 35.1],
        [-90.0, 29.9],
      ],
    },
    {
      id: "rl-004",
      name: "Southern Crescent Line",
      commodity: "Automotive",
      region: "Southeast",
      utilization_pct: 84,
      coords: [
        [-84.39, 33.75],
        [-82.4, 34.0],
        [-80.8, 35.2],
        [-78.6, 36.0],
        [-76.6, 39.3],
      ],
    },
  ];

  const features = lines
    .filter((line) => !commodity || line.commodity.toLowerCase() === commodity.toLowerCase())
    .filter((line) => !region || line.region.toLowerCase() === region.toLowerCase())
    .filter((line) => line.utilization_pct >= minUtilization)
    .map((line) => ({
      type: "Feature" as const,
      geometry: { type: "LineString", coordinates: line.coords },
      properties: {
        id: line.id,
        name: line.name,
        commodity: line.commodity,
        region: line.region,
        utilization_pct: line.utilization_pct,
        daily_trains: 48,
        avg_speed_mph: 32,
        on_time_pct: 71,
      },
    }));

  return { type: "FeatureCollection", features };
}

function mockDelaySimulation(chokepointId: string): DelaySimulation {
  const selected = MOCK_CHOKEPOINTS.find((point) => point.id === chokepointId) ?? MOCK_CHOKEPOINTS[0];
  const base = selected.delay_hours;

  return {
    source_chokepoint: selected.name,
    base_delay_hours: base,
    total_affected_cars: selected.daily_cars,
    estimated_economic_impact_usd: Math.round(base * selected.daily_cars * 87),
    downstream_impact: [
      { node: `${selected.region} interchange`, delay_hours: round1(base * 0.85), affected_cars: Math.round(selected.daily_cars * 0.7) },
      { node: `${selected.primary_commodity} corridor relay`, delay_hours: round1(base * 0.72), affected_cars: Math.round(selected.daily_cars * 0.49) },
      { node: "Regional classification yard", delay_hours: round1(base * 0.61), affected_cars: Math.round(selected.daily_cars * 0.34) },
      { node: "Port / industrial spur", delay_hours: round1(base * 0.52), affected_cars: Math.round(selected.daily_cars * 0.24) },
      { node: "Last-mile delivery node", delay_hours: round1(base * 0.44), affected_cars: Math.round(selected.daily_cars * 0.17) },
    ],
  };
}

export async function getMetrics(params?: URLSearchParams): Promise<Metrics> {
  const filtered = filterChokepoints(MOCK_CHOKEPOINTS, params);
  return fetchWithFallback(`/api/metrics${toQuery(params)}`, mockMetricsFromPoints(filtered));
}

export async function getNetwork(params?: URLSearchParams): Promise<FeatureCollection> {
  return fetchWithFallback(`/api/network${toQuery(params)}`, mockNetwork(params));
}

export async function getChokepoints(
  params?: URLSearchParams,
): Promise<FeatureCollection<ChokepointProperties>> {
  return fetchWithFallback(`/api/chokepoints${toQuery(params)}`, mockChokepoints(params));
}

export async function getCommodities(params?: URLSearchParams): Promise<CommodityDatum[]> {
  const filtered = filterChokepoints(MOCK_CHOKEPOINTS, params);
  const data = await fetchWithFallback<{ commodities: CommodityDatum[] }>(
    `/api/commodities${toQuery(params)}`,
    { commodities: mockCommoditiesFromPoints(filtered, params) },
  );
  return data.commodities;
}

export async function getDelaySimulation(
  chokepointId: string,
  severityMultiplier = 1,
): Promise<DelaySimulation> {
  const query = new URLSearchParams({
    chokepoint_id: chokepointId,
    severity_multiplier: String(severityMultiplier),
  });
  return fetchWithFallback(
    `/api/delay-simulation?${query.toString()}`,
    mockDelaySimulation(chokepointId),
  );
}

export function getExportUrl(): string {
  return `${API_BASE}/api/export/sample-data`;
}
