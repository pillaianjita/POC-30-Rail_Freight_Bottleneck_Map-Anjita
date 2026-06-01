"""
Data adapters for Real Rails POC 30.

Guardrail behavior:
- Try live sources where reasonable (Overpass API for railway nodes).
- If live fetch fails or is rate-limited, automatically fall back to local mock data.
"""

from __future__ import annotations

import json
import os
import random
from pathlib import Path
from typing import Any, Optional

import httpx

BASE_DIR = Path(__file__).resolve().parent
MOCK_DATA_PATH = BASE_DIR / "mock_data.json"

OVERPASS_API_URL = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")

COMMODITIES = ["Coal", "Grain", "Chemicals", "Automotive", "Intermodal", "Crude Oil"]

_DATASET_CACHE: tuple[dict[str, Any], str] | None = None


def _stable_value(key: str, low: float, high: float) -> float:
    seed = sum(ord(char) for char in key)
    span = high - low
    return round(low + (seed * 17 % 100) / 100 * span, 1)


def _stable_int(key: str, low: int, high: int) -> int:
    seed = sum(ord(char) for char in key)
    return low + (seed * 13 % (high - low + 1))


def _default_mock_data() -> dict[str, Any]:
    return {
        "chokepoints": [
            {
                "id": "cp-001",
                "name": "Chicago Classification Yard",
                "region": "Midwest",
                "lat": 41.8827,
                "lon": -87.6233,
                "severity": "critical",
                "delay_hours": 18.4,
                "throughput_pct": 42,
                "primary_commodity": "Intermodal",
                "operator": "BNSF Railway",
                "incidents_30d": 34,
                "daily_cars": 9200,
                "pct_above_avg": 87,
                "description": "Largest US rail hub with multi-operator congestion risk.",
            },
            {
                "id": "cp-002",
                "name": "Memphis Gateway Junction",
                "region": "Southeast",
                "lat": 35.1495,
                "lon": -90.0490,
                "severity": "high",
                "delay_hours": 9.1,
                "throughput_pct": 61,
                "primary_commodity": "Grain",
                "operator": "Union Pacific",
                "incidents_30d": 18,
                "daily_cars": 4800,
                "pct_above_avg": 44,
                "description": "Critical river-rail transfer junction for agricultural exports.",
            },
            {
                "id": "cp-003",
                "name": "Donner Pass Corridor",
                "region": "West",
                "lat": 39.3220,
                "lon": -120.3272,
                "severity": "critical",
                "delay_hours": 14.7,
                "throughput_pct": 38,
                "primary_commodity": "Intermodal",
                "operator": "Union Pacific",
                "incidents_30d": 27,
                "daily_cars": 3600,
                "pct_above_avg": 73,
                "description": "Mountain pass constraints create recurring network slowdown.",
            },
            {
                "id": "cp-004",
                "name": "Houston Port Rail Nexus",
                "region": "Southwest",
                "lat": 29.7604,
                "lon": -95.3698,
                "severity": "high",
                "delay_hours": 7.3,
                "throughput_pct": 55,
                "primary_commodity": "Crude Oil",
                "operator": "BNSF Railway",
                "incidents_30d": 14,
                "daily_cars": 6100,
                "pct_above_avg": 38,
                "description": "Port-linked energy corridor with high incident sensitivity.",
            },
            {
                "id": "cp-005",
                "name": "Kansas City Flat Yard",
                "region": "Plains",
                "lat": 39.0997,
                "lon": -94.5786,
                "severity": "medium",
                "delay_hours": 4.8,
                "throughput_pct": 72,
                "primary_commodity": "Grain",
                "operator": "Kansas City Southern",
                "incidents_30d": 9,
                "daily_cars": 5400,
                "pct_above_avg": 18,
                "description": "Cross-country interchange with growing utilization pressure.",
            },
        ],
        "rail_lines": [
            {
                "id": "rl-001",
                "name": "Transcontinental Main",
                "operator": "BNSF Railway",
                "commodity": "Intermodal",
                "region": "West",
                "coords": [[-118.2, 34.0], [-111.6, 35.2], [-101.8, 35.5], [-94.5, 39.1], [-87.6, 41.8]],
            },
            {
                "id": "rl-002",
                "name": "Central Corridor",
                "operator": "Union Pacific",
                "commodity": "Grain",
                "region": "Midwest",
                "coords": [[-120.3, 39.3], [-104.9, 38.8], [-97.3, 37.7], [-90.0, 35.1], [-90.0, 29.9]],
            },
            {
                "id": "rl-003",
                "name": "Eastern Network",
                "operator": "CSX Transportation",
                "commodity": "Chemicals",
                "region": "Northeast",
                "coords": [[-73.8, 42.5], [-75.1, 39.9], [-80.7, 40.0], [-84.3, 33.7], [-90.0, 35.1]],
            },
        ],
    }


def _read_or_create_mock_data() -> dict[str, Any]:
    if not MOCK_DATA_PATH.exists():
        default_data = _default_mock_data()
        MOCK_DATA_PATH.write_text(json.dumps(default_data, indent=2), encoding="utf-8")
        return default_data
    with MOCK_DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _fetch_live_overpass_nodes() -> Optional[list[dict[str, Any]]]:
    query = """
    [out:json][timeout:20];
    (
      node["railway"="station"](24,-125,50,-66);
    );
    out body 25;
    """
    try:
        response = httpx.post(
            OVERPASS_API_URL,
            data={"data": query},
            timeout=3.0,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("elements", [])
    except Exception:
        return None


def _get_dataset() -> tuple[dict[str, Any], str]:
    global _DATASET_CACHE
    if _DATASET_CACHE is not None:
        return _DATASET_CACHE

    mock_data = _read_or_create_mock_data()
    live_nodes = _fetch_live_overpass_nodes()
    if not live_nodes:
        _DATASET_CACHE = (mock_data, "Demo dataset")
        return _DATASET_CACHE

    live_chokepoints: list[dict[str, Any]] = []
    for idx, node in enumerate(live_nodes[:5], start=1):
        live_chokepoints.append(
            {
                "id": f"cp-live-{idx:03d}",
                "name": node.get("tags", {}).get("name", f"OSM Rail Node {idx}"),
                "region": "US Network",
                "lat": node["lat"],
                "lon": node["lon"],
                "severity": random.choice(["medium", "high"]),
                "delay_hours": round(random.uniform(2.5, 10.0), 1),
                "throughput_pct": random.randint(45, 85),
                "primary_commodity": random.choice(COMMODITIES),
                "operator": "Multi-operator",
                "incidents_30d": random.randint(3, 20),
                "daily_cars": random.randint(1500, 6500),
                "pct_above_avg": random.randint(8, 55),
                "description": "Live node from OpenStreetMap/Overpass enriched with synthetic operations metrics.",
            }
        )
    merged = dict(mock_data)
    merged["chokepoints"] = live_chokepoints + mock_data["chokepoints"]
    _DATASET_CACHE = (merged, "Live locations · demo metrics")
    return _DATASET_CACHE


def get_rail_network_geojson(
    commodity: Optional[str] = None,
    min_utilization: float = 0,
    region: Optional[str] = None,
) -> dict[str, Any]:
    dataset, _ = _get_dataset()
    lines = dataset["rail_lines"]
    if commodity:
        lines = [line for line in lines if line["commodity"].lower() == commodity.lower()]
    if region:
        lines = [line for line in lines if line["region"].lower() == region.lower()]

    features = []
    for line in lines:
        utilization = line.get("utilization_pct")
        if utilization is None:
            utilization = _stable_value(line["id"], 45, 98)
        if utilization < min_utilization:
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": line["coords"]},
                "properties": {
                    "id": line["id"],
                    "name": line["name"],
                    "operator": line["operator"],
                    "commodity": line["commodity"],
                    "region": line["region"],
                    "utilization_pct": utilization,
                    "daily_trains": _stable_int(line["id"], 20, 80),
                    "avg_speed_mph": _stable_value(line["id"], 18, 42),
                    "on_time_pct": _stable_value(line["id"], 52, 89),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


def _filter_chokepoints(
    points: list[dict[str, Any]],
    commodity: Optional[str] = None,
    region: Optional[str] = None,
    severity: Optional[str] = None,
) -> list[dict[str, Any]]:
    filtered = points
    if commodity:
        filtered = [point for point in filtered if point["primary_commodity"].lower() == commodity.lower()]
    if region:
        filtered = [point for point in filtered if point["region"].lower() == region.lower()]
    if severity:
        filtered = [point for point in filtered if point["severity"].lower() == severity.lower()]
    return filtered


def get_chokepoints(
    commodity: Optional[str] = None,
    region: Optional[str] = None,
    severity: Optional[str] = None,
) -> dict[str, Any]:
    dataset, _ = _get_dataset()
    points = _filter_chokepoints(dataset["chokepoints"], commodity, region, severity)

    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [point["lon"], point["lat"]]},
            "properties": point,
        }
        for point in points
    ]
    features.sort(key=lambda feature: feature["properties"]["delay_hours"], reverse=True)
    return {"type": "FeatureCollection", "features": features}


def get_commodity_overlays(
    commodity: Optional[str] = None,
    region: Optional[str] = None,
    severity: Optional[str] = None,
) -> dict[str, Any]:
    dataset, _ = _get_dataset()
    points = _filter_chokepoints(dataset["chokepoints"], commodity=None, region=region, severity=severity)

    aggregated: dict[str, dict[str, Any]] = {}
    for point in points:
        name = point["primary_commodity"]
        if name not in aggregated:
            aggregated[name] = {"delays": [], "cars": 0, "count": 0, "incidents": 0}
        aggregated[name]["delays"].append(point["delay_hours"])
        aggregated[name]["cars"] += point["daily_cars"]
        aggregated[name]["count"] += 1
        aggregated[name]["incidents"] += point["incidents_30d"]

    commodities = []
    for name in COMMODITIES:
        if commodity and name.lower() != commodity.lower():
            continue
        stats = aggregated.get(name)
        if stats:
            avg_delay = round(sum(stats["delays"]) / len(stats["delays"]), 1)
            trend = round(_stable_value(f"{name}-trend", -8, 18), 1)
            commodities.append(
                {
                    "name": name,
                    "total_cars_daily": stats["cars"],
                    "avg_delay_hours": avg_delay,
                    "bottleneck_count": stats["count"],
                    "trend_pct": trend,
                }
            )
        elif not region and not severity:
            commodities.append(
                {
                    "name": name,
                    "total_cars_daily": _stable_int(name, 4200, 14200),
                    "avg_delay_hours": _stable_value(name, 4.0, 16.0),
                    "bottleneck_count": _stable_int(f"{name}-bn", 2, 8),
                    "trend_pct": _stable_value(f"{name}-tr", -8, 18),
                }
            )

    return {"commodities": commodities}


def get_delay_simulation(chokepoint_id: Optional[str] = None, severity_multiplier: float = 1.0) -> dict[str, Any]:
    dataset, _ = _get_dataset()
    points = dataset["chokepoints"]
    selected = next((point for point in points if point["id"] == chokepoint_id), points[0])
    base_delay = selected["delay_hours"] * severity_multiplier

    downstream_impact = []
    downstream_names = [
        f"{selected['region']} interchange",
        f"{selected['primary_commodity']} corridor relay",
        "Regional classification yard",
        "Port / industrial spur",
        "Last-mile delivery node",
    ]
    for index, node_name in enumerate(downstream_names):
        downstream_impact.append(
            {
                "node": node_name,
                "delay_hours": round(base_delay * (0.85**index), 1),
                "affected_cars": int(selected["daily_cars"] * (0.7**index)),
            }
        )

    return {
        "source_chokepoint": selected["name"],
        "base_delay_hours": round(base_delay, 1),
        "total_affected_cars": selected["daily_cars"],
        "estimated_economic_impact_usd": int(base_delay * selected["daily_cars"] * 87),
        "downstream_impact": downstream_impact,
    }


def get_summary_metrics(
    commodity: Optional[str] = None,
    region: Optional[str] = None,
    severity: Optional[str] = None,
) -> dict[str, Any]:
    dataset, source_label = _get_dataset()
    points = _filter_chokepoints(dataset["chokepoints"], commodity, region, severity)
    if not points:
        return {
            "total_chokepoints": 0,
            "critical_count": 0,
            "high_count": 0,
            "avg_network_delay_hours": 0,
            "total_daily_cars": 0,
            "worst_chokepoint": "—",
            "most_affected_commodity": "—",
            "network_utilization_pct": 0,
            "incidents_30d_total": 0,
            "avg_pct_above_regional_avg": 0,
            "data_source": source_label,
        }

    commodity_counts: dict[str, int] = {}
    for point in points:
        commodity_counts[point["primary_commodity"]] = commodity_counts.get(point["primary_commodity"], 0) + 1

    return {
        "total_chokepoints": len(points),
        "critical_count": sum(1 for point in points if point["severity"] == "critical"),
        "high_count": sum(1 for point in points if point["severity"] == "high"),
        "avg_network_delay_hours": round(sum(point["delay_hours"] for point in points) / len(points), 1),
        "total_daily_cars": sum(point["daily_cars"] for point in points),
        "worst_chokepoint": max(points, key=lambda point: point["delay_hours"])["name"],
        "most_affected_commodity": max(commodity_counts, key=commodity_counts.get),
        "network_utilization_pct": round(sum(point["throughput_pct"] for point in points) / len(points), 1),
        "incidents_30d_total": sum(point["incidents_30d"] for point in points),
        "avg_pct_above_regional_avg": round(sum(point["pct_above_avg"] for point in points) / len(points), 1),
        "data_source": source_label,
    }


def get_regional_stats() -> dict[str, Any]:
    dataset, _ = _get_dataset()
    points = dataset["chokepoints"]
    regional: dict[str, dict[str, Any]] = {}
    for point in points:
        region = point["region"]
        if region not in regional:
            regional[region] = {"region": region, "chokepoints": 0, "avg_delay": 0.0, "total_incidents": 0}
        regional[region]["chokepoints"] += 1
        regional[region]["avg_delay"] += point["delay_hours"]
        regional[region]["total_incidents"] += point["incidents_30d"]

    for region_data in regional.values():
        region_data["avg_delay"] = round(region_data["avg_delay"] / region_data["chokepoints"], 1)
    return {"regions": list(regional.values())}
