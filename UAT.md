# UAT Checklist – Real Rails Intelligence Dashboard

## Project Information

**Project:** Rail Freight Bottleneck Map

**POC Number:** 30

**Application Type:** Real Rails Intelligence Dashboard

**Tester:** Pillai Anjita

**Test Date:** June 2026

---

## Objective

This User Acceptance Testing (UAT) checklist validates that all required functionality, dashboard interactions, visualizations, intelligence panels, and export capabilities operate as expected.

---

## Dashboard Validation

| Test Case          | Expected Result                                    | Status |
| ------------------ | -------------------------------------------------- | ------ |
| Dashboard Loads    | Dashboard renders without errors                   | PASS   |
| Obsidian Theme     | Background uses #030712 theme                      | PASS   |
| 70/30 Layout       | Main stage and sidebar render correctly            | PASS   |
| Responsive Layout  | Dashboard remains usable on different screen sizes | PASS   |
| Sidebar Visibility | Intelligence sidebar remains visible               | PASS   |

---

## API Validation

| Test Case                | Expected Result                                      | Status |
| ------------------------ | ---------------------------------------------------- | ------ |
| Health API               | Health check responds successfully                   | PASS   |
| Network API              | Rail network data loads successfully                 | PASS   |
| Chokepoint API           | Chokepoint data loads successfully                   | PASS   |
| Commodities API          | Commodity overlay summary loads                      | PASS   |
| Delay Simulation API     | Delay ripple simulation returns results              | PASS   |
| Export Sample Data API   | CSV sample data endpoint downloads correctly         | PASS   |

---

## Visualization Validation

| Test Case            | Expected Result                                  | Status |
| -------------------- | ------------------------------------------------ | ------ |
| Map Renders          | Lines and chokepoints visible                     | PASS   |
| Marker Tooltips      | Chokepoint popups display details                 | PASS   |
| Color Encoding       | Severity and utilization colors are visible       | PASS   |
| Chart Rendering      | Commodity chart displays correctly                | PASS   |
| Delay Simulator      | Delay simulator updates when chokepoint selected  | PASS   |

---

## Interaction Validation

| Test Case               | Expected Result                                         | Status |
| ----------------------- | ------------------------------------------------------- | ------ |
| Chokepoint Selection    | Sidebar updates with selected chokepoint details        | PASS   |
| Filter Updates          | Filters update the map without full page reload         | PASS   |
| Chokepoint Ranking      | Ranking list updates and responds to selection          | PASS   |
| Sidebar Panel Visibility| Intelligence sidebar remains visible and usable        | PASS   |

---

## Export Validation

| Test Case              | Expected Result                                    | Status |
| ---------------------- | -------------------------------------------------- | ------ |
| Download PNG           | Map snapshot downloads successfully                 | PASS   |
| Export CSV             | Sample CSV download works from API endpoint         | PASS   |
| Export Data Accuracy   | Downloaded CSV matches displayed mock data          | PASS   |

---

## Repository Validation

| Test Case           | Expected Result                                                 | Status |
| ------------------- | --------------------------------------------------------------- | ------ |
| .gitignore Present  | Root `.gitignore` excludes generated and local files            | PASS   |
| Clean Commit State  | `git status` shows only source/documentation changes            | PASS   |
| README Accuracy     | README matches current project structure and behavior           | PASS   |
| VAR Report Exists   | `VAR report.md` documents cleanup and status                    | PASS   |
| UAT Document Ready  | UAT checklist present and signed off                            | PASS   |

---

## Final Acceptance Summary

### Acceptance Criteria

* All required APIs operational
* Dashboard visualizations functional
* Filters working correctly
* Chokepoint interactions validated
* Export functionality verified
* Intelligence sidebar functioning correctly
* Repository cleanup and git hygiene confirmed

### Result

**Overall UAT Status:** PASS

The Real Rails Intelligence Dashboard satisfies the functional requirements defined for POC #30 and is approved for submission.

---

## Sign-off

**Tester:** Pillai Anjita

**Status:** APPROVED

**Ready for Submission:** YES
