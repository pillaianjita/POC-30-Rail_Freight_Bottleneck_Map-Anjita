"use client";

import { type Ref } from "react";
import { RailMap, type RailMapHandle } from "./RailMap";
import type { ChokepointProperties, FeatureCollection } from "@/types";

interface MapPanelProps {
  network: FeatureCollection;
  chokepoints: FeatureCollection<ChokepointProperties>;
  selectedChokepointId?: string;
  onSelectChokepoint: (id: string) => void;
  // Accept a prop-based ref because this component is often loaded dynamically.
  mapRef?: Ref<RailMapHandle>;
}

export default function MapPanel({ mapRef, ...props }: MapPanelProps) {
  return <RailMap ref={mapRef as any} {...(props as any)} />;
}
