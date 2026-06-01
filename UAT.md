# User Acceptance Testing (UAT)

## Purpose
This document describes the acceptance criteria for the Rail Freight Bottleneck Map POC, the tests performed, and the current verification status.

## Scope
The UAT covers:
- frontend application behavior
- backend API availability
- data source and export behavior
- repository hygiene and developer workflow

## Environment
- OS: Windows
- Node.js: installed and used for frontend
- Python: installed and used for backend
- Backend server: `uvicorn main:app --reload --port 8000`
- Frontend dev server: `npm run dev`

## Acceptance criteria

### 1. App startup
- [ ] Backend starts with no runtime errors
- [ ] Frontend starts with no missing package errors
- [ ] Frontend build succeeds with `npm run build`

### 2. Dashboard functionality
- [ ] Map loads and displays rail lines and chokepoint markers
- [ ] Sidebar renders with filters, charts, ranking, and simulator
- [ ] Filters update the map without a full refresh
- [ ] Clicking a chokepoint selects it and updates sidebar details

### 3. Export and data behavior
- [ ] The map export button produces a PNG snapshot
- [ ] Sample data download endpoint returns CSV
- [ ] Mock data is the active data source for the demo
- [ ] Overpass/OSM fallback exists in the backend but is not required for demo mode

### 4. Repository and Git hygiene
- [ ] Root `.gitignore` exists and excludes generated files
- [ ] `node_modules`, `.next`, and local env files are not tracked
- [ ] README reflects actual project behavior and structure
- [ ] VAR report exists and documents recent cleanup activity

## Test cases

### Test case 1: Backend health
- Run backend:
  ```bash
  cd backend
  uvicorn main:app --reload --port 8000
  ```
- Open `http://localhost:8000/api/health`
- Expected result: `{"status":"ok"}`

### Test case 2: Frontend install and build
- Run frontend install:
  ```bash
  cd frontend
  npm install
  ```
- Build the app:
  ```bash
  npm run build
  ```
- Expected result: build completes successfully and `.next` is generated

### Test case 3: Frontend run
- Start frontend:
  ```bash
  npm run dev
  ```
- Open `http://localhost:3000`
- Expected result: dashboard loads without runtime errors

### Test case 4: Map interaction
- Verify rail lines and chokepoint markers are visible
- Click a chokepoint marker
- Expected result: sidebar updates with selected chokepoint details

### Test case 5: Export behavior
- Trigger the PNG export action in the UI
- Expected result: browser downloads a PNG file

### Test case 6: Sample CSV endpoint
- Call `http://localhost:8000/api/export/sample-data`
- Expected result: browser downloads CSV content

### Test case 7: Git clean state
- Run `git status --short`
- Expected result: only real source/documentation changes are shown, not generated files

## Verification status
- [x] `.gitignore` was added and validated
- [x] frontend dependencies were reinstalled successfully
- [x] `npm run build` succeeded after dependency restore
- [x] README was updated to reflect actual repo contents
- [x] `VAR report.md` was created

## Notes
- The app currently runs on synthetic mock data from `backend/mock_data.json`.
- US Census integration is noted as future enhancement and is not active in the current demo.
- If additional automated test coverage is required, add separate frontend and backend test scripts.

## Sign-off
- Tester: Pillai Anjita
- Date: 2026-06-01
