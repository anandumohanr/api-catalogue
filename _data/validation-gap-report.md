# API Catalogue Validation Report

Generated: 2026-05-12

## Executive Summary

| Metric | Current |
|---|---:|
| Backend endpoints parsed | 1,380 |
| Backend completeness vs source | 100% (1366 Java + 14 Express) |
| Frontend endpoint keys | 397 |
| Angular pages | 219 |
| UI API call references across pages | 1,464 |
| Resolved to catalogued endpoints | 1,445 (98.7%) |
| verbMismatch flags | 0 |
| Path-match misses | 0 |
| Unrouted calls (no catalogued service for prefix) | 22 references / 6 unique URLs |
| Endpoints with at least one UI consumer | 403 / 1,380 |

## Verdict

The previous `Used by` logic was too broad: it treated every endpoint in an injected Angular service as used by the page. That inflated shared-service endpoints such as `GET /sessions`.

This has been corrected. `Used by` now requires a concrete chain:

`route -> active component/template child -> service method call -> HttpClient call -> catalogued endpoint`

This keeps shared components in scope, including `app-report-filter-modal`, but removes pages that merely inject the same service class without calling the relevant method.

## `/sessions` Revalidation

`GET /sessions` (`catalog-service-ep-566`) now shows **26 UI pages**, not 43.

The previous 43-page list included false positives from broad service injection, for example pages that injected `TrainingReportsService` or `TrainingReportsCommonService` but did not call the specific `/sessions` method.

The retained pages are backed by these actual frontend methods:

| Method | Why included |
|---|---|
| `TrainingReportsService.getSessionListing` | Direct old training-report session listing |
| `SessionsListingService.getSessionsList` | Session list page |
| `EvaluationListingService.getEvaluationList` | Evaluation listing page |
| `TrainingReportsCommonService.getSessionsList` | Used by `app-report-filter-modal`, which is present in the listed report pages |

## Parser Fixes Applied

1. **Service method attribution** (`tools/parse-frontend.js`)

   Every parsed `HttpClient` call now records the owning service method. This prevents a component call to one method from inheriting all other endpoints in the same service class.

2. **Component service-call attribution** (`tools/parse-frontend.js`, `tools/xref.js`)

   Components now record calls such as `this.trcService.getSessionsList(...)`. The xref join maps only those called methods to endpoint usage.

3. **Template child propagation** (`tools/parse-frontend.js`, `tools/xref.js`)

   Component templates are scanned for known Angular selectors. If a route component renders a child component that calls an API, the route correctly inherits that API usage.

4. **Route component-chain propagation** (`tools/parse-frontend.js`, `tools/xref.js`)

   Nested Angular routes now keep parent route components in the active page chain, so layout-level API calls are not lost.

5. **Unique route counting** (`tools/render.js`, `tools/xref.js`)

   `Used by` counts are now deduped by route, so duplicate route/component declarations do not inflate page totals.

## Remaining Known Limitations

### Unrouted prefixes

These calls point to services not registered in `tools/services.json`, so they cannot resolve to a catalogued backend endpoint here:

| URL | References | Reason |
|---|---:|---|
| `/analytics/v1/kpiUsers` | 8 | analytics service source not registered |
| `/reader/v1/scormReports` | 5 | reader service source not registered |
| `/analytics/v1/kpiSessionSummary` | 3 | analytics service source not registered |
| `/analytics/v1/kpiActiveUsersByUserIds` | 3 | analytics service source not registered |
| `/analytics/v1/kpiActiveUsers` | 2 | analytics service source not registered |
| `/reader/v1/ip` | 1 | reader service source not registered |

## Coverage By Service

| Service | Endpoints with >=1 UI consumer | Total | Coverage |
|---|---:|---:|---:|
| assessment-service | 47 | 59 | 80% |
| reports-service | 11 | 14 | 79% |
| report-gen-service | 6 | 9 | 67% |
| indicator-service | 38 | 63 | 60% |
| account-service | 127 | 446 | 28% |
| catalog-service | 152 | 652 | 23% |
| exam-service | 22 | 120 | 18% |
| notification-service | 0 | 14 | 0% |
| reports-etl-service | 0 | 3 | 0% |

Lower percentages reflect endpoints with no direct Angular route/component consumer in the scanned frontend source.
