"use client";

import { forwardRef } from "react";
import { RailMap, type RailMapHandle } from "./RailMap";
import type { ChokepointProperties, FeatureCollection } from "@/types";

interface MapPanelProps {
  network: FeatureCollection;
  chokepoints: FeatureCollection<ChokepointProperties>;
  selectedChokepointId?: string;
  onSelectChokepoint: (id: string) => void;
}

const MapPanel = forwardRef<RailMapHandle, MapPanelProps>(function MapPanel(props, ref) {
  return <RailMap ref={ref} {...props} />;
});

export default MapPanel;
