from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import json
import io
import csv
from data_adapters import (
    get_rail_network_geojson,
    get_chokepoints,
    get_commodity_overlays,
    get_delay_simulation,
    get_summary_metrics,
    get_regional_stats,
)

app = FastAPI(title="Rail Freight Bottleneck API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Rail Freight Bottleneck API"}

@app.get("/api/network")
def network_geojson(
    commodity: str = Query(None),
    min_utilization: float = Query(0),
    region: str = Query(None),
):
    data = get_rail_network_geojson(
        commodity=commodity,
        min_utilization=min_utilization,
        region=region,
    )
    return JSONResponse(content=data)

@app.get("/api/chokepoints")
def chokepoints(
    commodity: str = Query(None),
    region: str = Query(None),
    severity: str = Query(None),
):
    data = get_chokepoints(commodity=commodity, region=region, severity=severity)
    return JSONResponse(content=data)

@app.get("/api/commodities")
def commodities(
    commodity: str = Query(None),
    region: str = Query(None),
    severity: str = Query(None),
):
    data = get_commodity_overlays(commodity=commodity, region=region, severity=severity)
    return JSONResponse(content=data)

@app.get("/api/delay-simulation")
def delay_simulation(chokepoint_id: str = Query(None), severity_multiplier: float = Query(1.0)):
    data = get_delay_simulation(chokepoint_id=chokepoint_id, severity_multiplier=severity_multiplier)
    return JSONResponse(content=data)

@app.get("/api/metrics")
def metrics(
    commodity: str = Query(None),
    region: str = Query(None),
    severity: str = Query(None),
):
    data = get_summary_metrics(commodity=commodity, region=region, severity=severity)
    return JSONResponse(content=data)

@app.get("/api/regional-stats")
def regional_stats():
    data = get_regional_stats()
    return JSONResponse(content=data)

@app.get("/api/export/sample-data")
def export_sample_data():
    chokepoints = get_chokepoints()["features"]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "name", "region", "lat", "lon",
        "severity", "delay_hours", "throughput_pct",
        "primary_commodity", "operator", "incidents_30d"
    ])
    for f in chokepoints:
        p = f["properties"]
        coords = f["geometry"]["coordinates"]
        writer.writerow([
            p["id"], p["name"], p["region"], coords[1], coords[0],
            p["severity"], p["delay_hours"], p["throughput_pct"],
            p["primary_commodity"], p["operator"], p["incidents_30d"]
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rail_freight_bottleneck_sample.csv"}
    )