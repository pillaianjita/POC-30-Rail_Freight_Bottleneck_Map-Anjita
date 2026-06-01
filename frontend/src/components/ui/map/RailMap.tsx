"use client";

import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import type { ChokepointProperties, FeatureCollection } from "@/types";

export interface RailMapHandle {
  exportSnapshot: () => Promise<void>;
}

interface RailMapProps {
  network: FeatureCollection;
  chokepoints: FeatureCollection<ChokepointProperties>;
  selectedChokepointId?: string;
  onSelectChokepoint: (id: string) => void;
}

const severityColor: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#22C55E",
};

const severityRadius: Record<string, number> = {
  critical: 14,
  high: 12,
  medium: 10,
  low: 8,
};

function createGlowIcon(color: string, severity: string, selected: boolean) {
  const size = severityRadius[severity] ?? 10;
  const pulse = severity === "critical" || severity === "high" ? " glow-marker-pulse" : "";
  const selectedRing = selected ? " glow-marker-selected" : "";

  return L.divIcon({
    className: "glow-marker-leaflet",
    html: `<div class="glow-marker${pulse}${selectedRing}" style="--glow-color:${color};--glow-size:${size}px">
      <span class="glow-marker-halo"></span>
      <span class="glow-marker-ring"></span>
      <span class="glow-marker-core"></span>
    </div>`,
    iconSize: [size * 2.8, size * 2.8],
    iconAnchor: [size * 1.4, size * 1.4],
  });
}

function MapInstanceBridge({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

async function waitForTiles(map: LeafletMap) {
  await new Promise<void>((resolve) => {
    map.whenReady(() => resolve());
  });
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    map.once("load", done);
    setTimeout(done, 800);
  });
}

function downloadBlob(blob: Blob, filename: string, mime?: string) {
  // Ensure the blob has an explicit MIME when the filename implies an image.
  const finalBlob = mime ? new Blob([blob], { type: mime }) : blob;
  const url = URL.createObjectURL(finalBlob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after a short delay to avoid revoking before the browser starts the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportViaLeafletCanvas(
  map: LeafletMap,
  network: FeatureCollection,
  chokepoints: FeatureCollection<ChokepointProperties>,
): Promise<Blob> {
  const size = map.getSize();
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = size.x * scale;
  canvas.height = size.y * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.scale(scale, scale);
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, size.x, size.y);

  const mapContainer = map.getContainer();
  const mapRect = mapContainer.getBoundingClientRect();
  mapContainer.querySelectorAll(".leaflet-tile-pane img").forEach((node) => {
    const img = node as HTMLImageElement;
    if (!img.complete || !img.naturalWidth) return;
    try {
      const rect = img.getBoundingClientRect();
      ctx.drawImage(img, rect.left - mapRect.left, rect.top - mapRect.top, rect.width, rect.height);
    } catch {
      // Skip cross-origin tiles that cannot be painted.
    }
  });

  for (const feature of network.features) {
    const coords = feature.geometry.coordinates as number[][];
    const utilization = Number(feature.properties.utilization_pct ?? 50);
    ctx.strokeStyle = utilization > 75 ? "#38BDF8" : utilization > 55 ? "#818CF8" : "#64748B";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    coords.forEach(([lon, lat], index) => {
      const point = map.latLngToContainerPoint([lat, lon]);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  for (const feature of chokepoints.features) {
    const [lon, lat] = feature.geometry.coordinates as number[];
    const point = map.latLngToContainerPoint([lat, lon]);
    const color = severityColor[feature.properties.severity] ?? "#38BDF8";
    const radius = severityRadius[feature.properties.severity] ?? 10;

    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not generate PNG from map canvas."));
    }, "image/png");
  });
}

const RailMapComponent = forwardRef<RailMapHandle, RailMapProps>(function RailMapComponent(
  { network, chokepoints, selectedChokepointId, onSelectChokepoint },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useImperativeHandle(ref, () => ({
    async exportSnapshot() {
      const container = containerRef.current;
      const map = mapRef.current;
      if (!container || !map) {
        throw new Error("Map is not ready yet. Wait for the map to finish loading.");
      }

      map.closePopup();
      map.invalidateSize(false);
      await waitForTiles(map);

      const filename = `rail-bottleneck-map-${Date.now()}.png`;

      try {
        const html2canvas = (await import("html2canvas")).default;
        // Prefer capturing the Leaflet map container directly with explicit dimensions to
        // avoid html2canvas cropping issues and tile seams caused by document offsets.
        const mapContainer = map.getContainer();
        const size = map.getSize();
        const canvas = await html2canvas(mapContainer, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#030712",
          scale: 2,
          logging: false,
          foreignObjectRendering: false,
          width: size.x,
          height: size.y,
          onclone: (clonedDocument) => {
            clonedDocument.querySelectorAll(".leaflet-tile-pane img").forEach((img) => {
              const image = img as HTMLImageElement;
              image.crossOrigin = "anonymous";
            });
          },
        });

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/png");
        });

        if (blob) {
          downloadBlob(blob, filename, "image/png");
          return;
        }
      } catch {
        // Fall through to Leaflet canvas export.
      }

      const fallbackBlob = await exportViaLeafletCanvas(map, network, chokepoints);
      downloadBlob(fallbackBlob, filename, "image/png");
    },
  }), [network, chokepoints]);

  const networkLines = useMemo(
    () =>
      network.features.map((feature) => {
        const coords = feature.geometry.coordinates as number[][];
        const latLngs = coords.map(([lon, lat]) => [lat, lon] as [number, number]);
        const utilization = Number(feature.properties.utilization_pct ?? 50);
        const color = utilization > 75 ? "#38BDF8" : utilization > 55 ? "#818CF8" : "#64748B";
        return { id: String(feature.properties.id), latLngs, color };
      }),
    [network],
  );

  const markers = useMemo(
    () =>
      chokepoints.features.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates as number[];
        const point = feature.properties;
        const color = severityColor[point.severity] ?? "#38BDF8";
        const selected = point.id === selectedChokepointId;
        return {
          id: point.id,
          lat,
          lon,
          point,
          icon: createGlowIcon(color, point.severity, selected),
        };
      }),
    [chokepoints, selectedChokepointId],
  );

  return (
    <div ref={containerRef} className="glass-card relative h-full overflow-hidden rounded-lg" data-map-export-root>
      <MapContainer center={[39.5, -98.35]} zoom={4} className="h-full w-full" preferCanvas>
        <MapInstanceBridge mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          crossOrigin="anonymous"
        />
        {networkLines.map((line) => (
          <Polyline key={line.id} positions={line.latLngs} color={line.color} weight={3} opacity={0.85} />
        ))}
        {markers.map(({ id, lat, lon, point, icon }) => (
          <Marker key={id} position={[lat, lon]} icon={icon} eventHandlers={{ click: () => onSelectChokepoint(id) }}>
            <Popup>
              <div className="space-y-1.5 text-xs">
                <p className="font-semibold text-cyan-accent">{point.name}</p>
                <p className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-rose-300">
                  +{point.pct_above_avg}% above regional average delay
                </p>
                <p>
                  <span className="text-slate-400">Severity:</span>{" "}
                  <span className="capitalize text-slate-100">{point.severity}</span>
                </p>
                <p>
                  <span className="text-slate-400">Delay:</span> {point.delay_hours}h
                </p>
                <p>
                  <span className="text-slate-400">Throughput:</span> {point.throughput_pct}% capacity
                </p>
                <p>
                  <span className="text-slate-400">Commodity:</span> {point.primary_commodity}
                </p>
                <p>
                  <span className="text-slate-400">Operator:</span> {point.operator}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-border bg-surface/90 px-3 py-2 text-[10px] text-slate-400 backdrop-blur-sm">
        <p>
          <span className="inline-block h-2 w-4 rounded-sm bg-[#38BDF8]" /> High utilization (&gt;75%)
        </p>
        <p className="mt-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-[#818CF8]" /> Moderate (55–75%)
        </p>
      </div>
    </div>
  );
});

RailMapComponent.displayName = "RailMap";
export const RailMap = memo(RailMapComponent);
