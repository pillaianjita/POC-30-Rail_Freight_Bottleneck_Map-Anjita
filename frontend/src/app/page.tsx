"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChokepoints, getCommodities, getDelaySimulation, getExportUrl, getMetrics, getNetwork } from "@/lib/api";
import type { ChokepointProperties, CommodityDatum, DelaySimulation, FeatureCollection, Metrics } from "@/types";
import type { RailMapHandle } from "@/components/ui/map/RailMap";
import MapPanel from "@/components/ui/map/MapPanel";
import { TopBar } from "@/components/ui/TopBar";
import { IntelligenceSidebar } from "@/components/sidebar/IntelligenceSidebar";

const emptyCollection: FeatureCollection = { type: "FeatureCollection", features: [] };
const emptyChokepoints: FeatureCollection<ChokepointProperties> = { type: "FeatureCollection", features: [] };

function buildFilterParams(commodity: string, region: string, severity: string, minUtilization: number) {
  const params = new URLSearchParams();
  if (commodity) params.set("commodity", commodity);
  if (region) params.set("region", region);
  if (severity) params.set("severity", severity);
  params.set("min_utilization", String(minUtilization));
  return params;
}

export default function HomePage() {
  const mapRef = useRef<RailMapHandle>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [network, setNetwork] = useState<FeatureCollection>(emptyCollection);
  const [chokepoints, setChokepoints] = useState<FeatureCollection<ChokepointProperties>>(emptyChokepoints);
  const [commodities, setCommodities] = useState<CommodityDatum[]>([]);
  const [delaySimulation, setDelaySimulation] = useState<DelaySimulation | null>(null);
  const [selectedChokepointId, setSelectedChokepointId] = useState<string>("");
  const [commodity, setCommodity] = useState("");
  const [region, setRegion] = useState("");
  const [severity, setSeverity] = useState("");
  const [minUtilization, setMinUtilization] = useState(0);
  const [debouncedMinUtilization, setDebouncedMinUtilization] = useState(0);
  const [exportingMap, setExportingMap] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMinUtilization(minUtilization), 250);
    return () => clearTimeout(timer);
  }, [minUtilization]);

  const filterParams = useMemo(
    () => buildFilterParams(commodity, region, severity, debouncedMinUtilization),
    [commodity, region, severity, debouncedMinUtilization],
  );

  const insightParams = useMemo(
    () => buildFilterParams(commodity, region, severity, 0),
    [commodity, region, severity],
  );

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      const [m, n, c, cm] = await Promise.all([
        getMetrics(insightParams),
        getNetwork(filterParams),
        getChokepoints(insightParams),
        getCommodities(insightParams),
      ]);
      if (cancelled) return;

      setMetrics(m);
      setNetwork(n);
      setChokepoints(c);
      setCommodities(cm);

      setSelectedChokepointId((current) => {
        if (c.features.some((f) => f.properties.id === current)) return current;
        return c.features[0]?.properties.id ?? "";
      });
    };

    loadDashboard().catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, [filterParams, insightParams]);

  useEffect(() => {
    if (!selectedChokepointId) {
      setDelaySimulation(null);
      return;
    }
    getDelaySimulation(selectedChokepointId, 1).then(setDelaySimulation).catch((error) => console.error(error));
  }, [selectedChokepointId]);

  const handleSelectChokepoint = useCallback((id: string) => {
    setSelectedChokepointId(id);
  }, []);

  const handleExportMap = useCallback(async () => {
    if (!mapRef.current) {
      setExportError("Map is still loading. Try again in a moment.");
      return;
    }
    setExportingMap(true);
    setExportError(null);
    try {
      await mapRef.current.exportSnapshot();
    } catch (error) {
      console.error(error);
      setExportError(error instanceof Error ? error.message : "Map export failed. Please try again.");
    } finally {
      setExportingMap(false);
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setCommodity("");
    setRegion("");
    setSeverity("");
    setMinUtilization(0);
  }, []);

  if (!metrics) {
    return (
      <main className="flex h-screen items-center justify-center bg-obsidian text-slate-300">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="h-screen bg-obsidian p-4">
      <TopBar
        title="REAL RAILS — Rail Freight Bottleneck Map"
        subtitle="Data & Intelligence terminal for everyday viewers, builders, and allocators"
        dataSource={metrics.data_source}
      />
      <div className="flex h-[calc(100vh-92px)]">
        <section className="pr-3" style={{ width: "70%" }}>
          <MapPanel
            ref={mapRef}
            network={network}
            chokepoints={chokepoints}
            selectedChokepointId={selectedChokepointId}
            onSelectChokepoint={handleSelectChokepoint}
          />
        </section>
        <IntelligenceSidebar
          metrics={metrics}
          chokepoints={chokepoints.features.map((f) => f.properties)}
          commodities={commodities}
          delaySimulation={delaySimulation}
          selectedChokepointId={selectedChokepointId}
          onSelectChokepoint={handleSelectChokepoint}
          exportUrl={getExportUrl()}
          onExportMap={handleExportMap}
          exportingMap={exportingMap}
          exportError={exportError}
          commodity={commodity}
          region={region}
          severity={severity}
          minUtilization={minUtilization}
          railLineCount={network.features.length}
          onFilterChange={(key, value) => {
            if (key === "commodity") setCommodity(value);
            if (key === "region") setRegion(value);
            if (key === "severity") setSeverity(value);
          }}
          onMinUtilizationChange={setMinUtilization}
          onClearFilters={handleClearFilters}
        />
      </div>
    </main>
  );
}
