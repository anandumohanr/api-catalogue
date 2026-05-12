# API Catalogue Validation Report — Deployment Sign-off

Generated: 2026-05-12

## Executive Summary

| Metric | Current |
|---|---:|
| Backend endpoints parsed | 1,380 |
| Backend completeness vs source | 100% (1366 Java + 14 Express) |
| Frontend endpoint keys | 397 |
| Angular pages | 219 |
| UI API call references across pages | 6,103 |
| Resolved to catalogued endpoints | 5,862 (96.1%) |
| verbMismatch flags (resolved with verb fallback) | 0 |
| Path-match misses (routed service, no matching path) | 10 references / 1 unique URL |
| Unrouted calls (no catalogued service for prefix) | 231 references / 7 unique URLs |
| Endpoints with at least one UI consumer | 472 / 1,380 |

## Verdict: READY FOR DEPLOYMENT

All three validation axes pass:

1. **Backend completeness — 100%.** Per-service ground-truth count via `@(Get|Post|Put|Delete|Patch)Mapping` + `@RequestMapping(method=...)` regex over `src/main/java` matches the spec totals exactly for every service:

   | Service | Source | Spec |
   |---|---:|---:|
   | reports-service | 14 | 14 |
   | report-gen-service | 9 | 9 |
   | reports-etl-service | 3 | 3 |
   | indicator-service | 63 | 63 |
   | exam-service | 120 | 120 |
   | assessment-service | 59 | 59 |
   | notification-service (Express) | 14 | 14 |
   | account-service | 446 | 446 |
   | catalog-service | 652 | 652 |
   | **Total** | **1,380** | **1,380** |

2. **API ↔ UI page mapping — accurate.** Spot-checked 10+ endpoints across high-traffic and edge-case scenarios. Reverse `endpointUsage` index correctly attributes pages via component → injected service → http call → URL resolution. Duplicate-path endpoints (39 method/path groups across services) are correctly routed via longest-prefix service match.

3. **UI grouping in `pages.html` — accurate.** All 219 routes catalogued, grouped by top-level URL segment matching the live app's URL structure. All 130 `loadChildren` declarations resolved. No phantom routes.

## Parser Fixes Applied During This Validation

Three narrow parser bugs were identified and fixed before sign-off:

1. **`pathMatches` did not handle `{placeholder}:verb` segments** (`tools/xref.js`).
   Segments like `{auditId}:publish` weren't recognised as placeholders (`isPlaceholder` required `}` at end). This caused two symmetric defects:
   - Frontend `{id}` would over-match catalogue `{auditId}:publish` (one side placeholder treated as wildcard against any literal).
   - Frontend `{id}:publish` would under-match catalogue `{auditId}:publish` (neither side recognised as placeholder).

   Fix: split each segment into `base` + `:suffix`, require exact suffix match, apply placeholder rule only to the base.

   Recovered correct Used-By for 6 backend endpoints (POST `/audits/{auditId}:publish` in 2 services, GET `/audits/{auditId}:history`, GET `/audits/{auditId}:summary`, PATCH `/checklists/{checklistId}:publish`, GET `/reportHistory/{reportHistoryId}:export`) and eliminated 5 over-matches.

2. **`http.request(verb, url, options)` was recorded with verb `REQUEST`** (`tools/parse-frontend.js`).
   When the Angular code uses `this.http.request('delete', url, { body })` instead of `this.http.delete(url, { body })`, the parser captured the wrong verb. The catalogue's resolved candidate then needed `verbMismatch` fallback.

   Fix: when the first arg is a string literal, treat it as the verb and re-derive the URL expression from the second arg.

   Affected 2 known call sites — `CandidatesService.deleteCandidate` and `UserService.deleteUsers` (both DELETE `/users`). DELETE `/users` (`account-service-ep-385`) now correctly lists 17 UI consumer pages.

3. **`<localUrl> + <expr>` concat at call site** (`tools/parse-frontend.js`).
   When a service builds a URL via `let url = environment.apiEndPoint.X.replace('#', sessionId); this.http.delete(url + panelistId)`, the resulting URL has more path segments than the endpoint key registered in `endpoints.ts`. The parser previously fell through to a less precise scope-based ref capture, mis-matching `/sessions/{sessionId}/zoomWebinar` (PATCH) instead of `/sessions/{sessionId}/zoomWebinar/{panelistId}` (DELETE).

   Fix: when the call expression is `<identifier> + <expr>` and `<identifier>` maps to a known local URL pattern, append the tail expression (resolved via `partToPattern` for each `+`-separated chunk) to that pattern.

   Recovered correct Used-By for `DELETE /sessions/{sessionId}/zoomWebinar/{panelistId}` (`catalog-service-ep-69`) — now 12 UI consumer pages.

After these fixes, the verbMismatch list is empty and the overall resolved match rate held steady at 96.1% with the previously-misattributed pages migrating to the correct endpoint.

## Remaining Known Limitations (Not Catalogue Bugs)

### Single path-match miss

| Frontend URL | Verb | UI references | Status |
|---|---|---:|---|
| `/assessment/v1/assessmentUsers/{assessmentUserId}/self-rating-comments` | GET | 10 | Backend route not present in latest local source |

Frontend call sites:

| File | Line |
|---|---:|
| `src/app/competency-v2/competency-v2.service.ts` | 123 |
| `src/app/admin/competency-management-v2/competency-management-v2.service.ts` | 625 |

Either the frontend call is stale, or the backend endpoint is not present in the checked-out `assessment-service` revision (`af35159`). Either way, the catalogue accurately reflects the source — this is not a parser miss.

### Unrouted prefixes (external services)

| URL | UI references | Reason |
|---|---:|---|
| `/reader/v1/ip` | 116 | reader service source not present locally |
| `/analytics/v1/kpiUsers` | 41 | analytics service source not present locally |
| `/analytics/v1/kpiSessionSummary` | 41 | analytics service source not present locally |
| `/reader/v1/scormReports` | 14 | reader service source not present locally |
| `/trainingProgramReports` | 10 | URL lacks a catalogue prefix |
| `/analytics/v1/kpiActiveUsersByUserIds` | 6 | analytics service source not present locally |
| `/analytics/v1/kpiActiveUsers` | 3 | analytics service source not present locally |

Documented in `tools/services.json:$unmappedPrefixes` — these belong to services not registered for catalogue scanning.

## Coverage By Service

| Service | Endpoints with >=1 UI consumer | Total | Coverage |
|---|---:|---:|---:|
| assessment-service | 50 | 59 | 84% |
| reports-service | 11 | 14 | 78% |
| indicator-service | 42 | 63 | 66% |
| report-gen-service | 4 | 9 | 44% |
| account-service | 146 | 446 | 33% |
| catalog-service | 191 | 652 | 29% |
| exam-service | 26 | 120 | 21% |
| notification-service | 2 | 14 | 14% |
| reports-etl-service | 0 | 3 | 0% |

Lower percentages reflect internal/admin/scheduler endpoints with no direct UI footprint, not catalogue defects.

## Sign-off

Catalogue data is consistent with source, mapping is accurate, and UI grouping matches the live app. Cleared for live release.
