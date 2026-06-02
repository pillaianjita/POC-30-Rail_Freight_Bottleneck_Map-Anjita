# Rail Freight Bottleneck Map — POC #30
**Real Rails Intelligence Library · Data & Intelligence Category**

Production-style dark dashboard for U.S. freight rail chokepoint intelligence.

---

## What this project shows

- An interactive freight rail map with chokepoints and route utilization.
- A 70/30 split layout: map on the left, intelligence sidebar on the right.
- Filter controls for commodity, region, severity, and minimum utilization.
- Chokepoint ranking, commodity overlay, and delay simulation.
- Export features: map snapshot PNG and sample CSV download.

The app uses synthetic mock rail data in `backend/mock_data.json`, with Overpass/OSM as the primary live data source and fallback to mock when unavailable.

---

## Tech Stack

### Frontend
- **Next.js 14+** — React framework with App Router
- **TypeScript** — Type-safe code
- **Tailwind CSS** — Utility-first styling
- **Leaflet + react-leaflet** — Interactive map rendering
- **html2canvas** — Map snapshot export to PNG
- **Recharts** — Analytics charts and visualizations
- **Radix UI** — Accessible UI components (selects, tooltips, sliders)
- **Lucide React** — Icon library

### Backend
- **FastAPI** — Python web framework for API
- **Uvicorn** — ASGI server
- **httpx** — HTTP client for Overpass API calls
- **python-dotenv** — Environment variable management
- **csv / io** — CSV export generation

### Data Sources
- **Overpass API / OpenStreetMap** — Primary source for live railway data (stations, rail ways)
- **Mock Data** — Fallback dataset with synthetic rail metrics (delays, throughput, incidents)

---

## File structure

```
POC-30-Rail_Freight_Bottleneck_Map-Anjita/
├── backend/
│   ├── main.py              # FastAPI app + API endpoints
│   ├── data_adapters.py     # Data layer: mock data + Overpass/OSM fallback
│   ├── mock_data.json       # Synthetic dataset for demo mode
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Copy to .env and fill API keys
│   └── .env                 # Local secrets (git-ignored)
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local.example   # Copy to .env.local
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── sidebar/
│   │   │   │   ├── IntelligenceSidebar.tsx
│   │   │   │   ├── ChokepointRanking.tsx
│   │   │   │   ├── CommodityChart.tsx
│   │   │   │   └── DelaySimulator.tsx
│   │   │   └── ui/
│   │   │       └── TopBar.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
└── README.md
```

---

## Setup & run

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git or terminal access

---

### Backend

```bash
cd backend
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
# Windows cmd
venv\Scripts\activate.bat
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Verify: browse to `http://localhost:8000/api/health`

---

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Verify: browse to `http://localhost:3000`

---

## How to use the dashboard

- The map shows routes and chokepoints together.
- Filters update the map instantly without a full page refresh.
- Select a chokepoint to view metrics and run the delay simulator.
- Export a PNG snapshot or download sample CSV data.

---

## Environment variables

### Backend (`backend/.env`)
```
MAPBOX_TOKEN=           # Optional — future Mapbox/Mapbox GL use
OVERPASS_API_URL=       # Default: https://overpass-api.de/api/interpreter
CENSUS_API_KEY=         # Optional placeholder; not currently used in active metrics
ENVIRONMENT=development
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_MAPBOX_TOKEN=   # Optional
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## Notes on data sources

- Primary source: Overpass API / OpenStreetMap — fetches live railway stations and rail ways
- Fallback: `backend/mock_data.json` — used if Overpass is unavailable or rate-limited
- Metrics enrichment: Synthetic values for delays, throughput, incidents, and commodities (both sources)
- Future: US Census API integration planned for demographic and economic context

---

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/network` | Rail network GeoJSON |
| `GET /api/chokepoints` | Chokepoint GeoJSON |
| `GET /api/commodities` | Commodity overlay summary |
| `GET /api/metrics` | Dashboard KPI metrics |
| `GET /api/delay-simulation` | Simulated delay ripple impact |
| `GET /api/export/sample-data` | Download sample CSV data |

All endpoints support filter query params such as `commodity`, `region`, `severity`, and `min_utilization`.
