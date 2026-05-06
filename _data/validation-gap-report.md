# API Catalogue Validation Report

Generated: 2026-05-06

---

## Executive Summary

| Metric | Before Fix | After Fix |
|--------|-----------|-----------|
| Total backend endpoints | 1,318 | 1,318 |
| Total frontend endpoint keys | 397 | 397 |
| Frontend unresolved HTTP calls | 2 | **0** |
| Resolved UI→API calls | 4,653 (95.2% routed) | 4,653 (95.2% routed) |
| Fully-resolved (no verb mismatch) | 4,191 (85.8%) | 4,191 (85.8%) |
| Verb mismatches | 165 | 165 |
| No-path-match calls | 297 | 297 |
| Unrouted calls (no service prefix) | 233 | 233 |
| Backend endpoints with no UI consumer | 1,012 / 1,318 (76.8%) | 1,012 / 1,318 (76.8%) |
| Angular pages with zero resolved calls | 45 / 219 | 45 / 219 |

> **Note on match rate:** The xref report headline "95.2% routed" counts all calls that were
> dispatched to a service (including verb mismatches and no-path-matches). Of those dispatched
> calls, 85.8% fully resolved to an endpoint with a matching verb. The remaining 14.2% are
> classified below as TRUE GAPS.

---

## Fixed in This Run

### Fix 1 — `tools/parse-frontend.js`: parent-scope variable resolution

**What was wrong:** Two HTTP calls in `quality-management.service.ts` were marked `unresolved`
because the URL variable (`const url = environment.apiEndPoint.indicatorInventory + '/' + id + '/indicatorSettings'`)
was declared in the method body but the `this.http.post(url)` / `this.http.put(url)` calls were
inside an inner `if/else` block. The smallest enclosing `{}` for those calls was the `if` block,
so `collectLocalAssignments` never saw the outer declaration.

**What was changed:** Added a parent-scope lookup in step 2 of the URL resolver (lines ~176–184
of `parse-frontend.js`). When a bare identifier fails to resolve in the immediate enclosing block,
the resolver now walks one level up to the parent `{}` and re-tries `collectLocalAssignments`.

**Which calls it resolved:** Both `QualityManagementService.POST url` (line 215) and
`QualityManagementService.PUT url` (line 222) now resolve to endpoint key `indicatorInventory`
(`/indicator/v1/indicators`). These were the only two unresolved calls in the entire Angular
theme (0 remain).

---

## TRUE GAPS (Not Fixable Without Source Changes)

### 1. UI Calls With No Matching Backend Endpoint (noPathMatch)

These frontend endpoint keys route to the correct service but no path in that service's spec
matches the URL path. Most are collection-base URLs (`/foo`) when the backend only exposes
item-level routes (`/foo/{id}/...`). The difference is always a segment-count mismatch, not a
placeholder-format issue (`{id}` vs `#` vs `:param` are already handled by `xref.js`).

| Frontend Key | URL Path | HTTP Verb | Service | Root Cause | Affected Pages (calls) |
|---|---|---|---|---|---:|
| `adminStats` | `/catalog/v1/adminStats` | GET | catalog-service | TRULY MISSING — no `/adminStats` endpoint in catalog spec | 41 |
| `kpiAllExport` | `/catalog/v1/adminReport:export` | POST | catalog-service | TRULY MISSING — spec has `/adminReports` (GET) not `/adminReport:export` (POST) | 41 |
| `traininghoursSummary` | `/catalog/v1/trainingSummary` | GET | catalog-service | TRULY MISSING — no `/trainingSummary` in catalog (closest: `/trainingStatusSummary`) | 17 |
| `traininghoursSummaryForUserServc` | `/catalog/v1/trainingSummary` | GET | catalog-service | TRULY MISSING — same as above, second reference | 14 |
| `reportHistory` | `/catalog/v1/reportHistory` | GET | catalog-service | PATH_DIVERGED — backend has `/reportHistory/{reportHistoryId}` (requires ID) | 27 |
| `assignments` | `/catalog/v1/assignments/` | GET | catalog-service | PATH_DIVERGED — backend has `/assignments/{id}` only, no collection GET | 21 |
| `userList` | `/catalog/v1/users` | GET | catalog-service | PATH_DIVERGED — no plain `/users` in catalog; closest `/users/{userId}/...` (min 2 segs) | 14 |
| `homepageSections` | `/catalog/v2/homepageSections` | GET | catalog-service | PATH_DIVERGED — backend has `/homepageSections/{sectionId}` only | 7 |
| `showCases` | `/catalog/v1/showcases` | GET | catalog-service | PATH_DIVERGED — backend has `/showcases/{name}/products` (2 sub-segs) | — |
| `certificatesUsers` | `/catalog/v1/users` | GET | catalog-service | PATH_DIVERGED — same as `userList` | — |
| `levelCompleteStatus` | `/account/v1/user/#/checklist` | GET | account-service | PATH_DIVERGED — backend has `/user/{userId}/checklist/{checklistId}/approverSignOffDetails` (5 segs vs 3) | 4 |
| `postV2Assessment` | `/assessment/v1/assessment` | POST | assessment-service | PATH_DIVERGED — backend has `/assessment/{id}/...` only, no root POST `/assessment` | 37 |
| `getFrequencyReviewers` | `/assessment/v1/frequency` | GET | assessment-service | PATH_DIVERGED — backend has `/frequency/{id}/reviewers` only | 18 |
| `importSkills` | `/assessment/v1/imports` | GET | assessment-service | PATH_DIVERGED — backend has `/imports/{importId}` only | 9 |
| `deleteSubSkills` | `/assessment/v1/subskills` | DELETE | assessment-service | PATH_DIVERGED — backend has `/subskills/{id}` only | 9 |
| `assessmentUsers` | `/assessment/v1/assessmentUsers` | GET | assessment-service | PATH_DIVERGED — backend has `/assessmentUsers/{id}/...` only | 12 |
| `assessmentReport` | `/assessment/v1/assessmentUser` | GET | assessment-service | PATH_DIVERGED — backend has `/assessmentUser/{id}/...` only | 14 |
| `userAssessment` | `/assessment/v1/users` | GET | assessment-service | PATH_DIVERGED — backend has `/users/{userId}/assessments` only | 2 |
| `institutionAssessment` | `/assessment/v1/institution` | GET | assessment-service | PATH_DIVERGED — backend has `/institution/{id}/ratingScale` only | 10 |

**Total noPathMatch calls: 297** (across all page references to the above keys)

The pattern is consistent: the Angular theme calls collection-base paths (`/foo`) that the backend
either never exposed at that level or renamed. Most likely these APIs exist in the backend with
slightly different paths, or the frontend URLs are stale (pointing to a former API contract that
was refactored to require an ID in the path).

---

### 2. Backend Endpoints Never Called From UI

Endpoints present in the spec files with no entry in `endpointUsage`. These may be:
- Admin/ops tooling not surfaced in the Angular theme
- Internal service-to-service calls (no direct UI consumer expected)
- Deprecated endpoints not yet removed

| Service | Uncalled | Total | % Uncalled | Sample Uncalled Paths |
|---|---:|---:|---:|---|
| reports-service | 6 | 14 | 43% | `GET /assignmentReports:export`, `GET /exports`, `GET /exports/{id}/files` |
| report-gen-service | 5 | 9 | 56% | `POST /schema-discover`, `GET /schema`, `POST /schema` |
| reports-etl-service | 3 | 3 | 100% | `POST /triggerBackfill`, `POST /enrichments`, `POST /triggerEtl` |
| indicator-service | 42 | 63 | 67% | `GET /auditors/{auditorId}/audits`, `POST /audits/{auditId}:publish`, `GET /indicators/{id}/dataReviewers` |
| exam-service | 104 | 120 | 87% | `POST /examReports`, `POST /itemReports`, `GET /items`, `DELETE /assets` |
| assessment-service | 47 | 56 | 84% | `POST /assessment/{id}/bulkSkills`, `GET /assessment/{id}/frequencies`, `POST /skills` |
| account-service | 350 | 433 | 81% | `GET /auditEntities`, `PATCH /externalTools/{id}`, `GET /candidates` |
| catalog-service | 455 | 620 | 73% | `GET /adminProducts:export`, `GET /adminProducts`, `GET /trainingCalendarAssignments` |
| **Total** | **1,012** | **1,318** | **77%** | |

The exam-service and assessment-service have particularly high uncalled rates (87%/84%), suggesting
that many of their endpoints are consumed programmatically (scheduled jobs, service-to-service
calls) rather than through the Angular UI.

---

### 3. Unrouted Prefixes (Services Not Catalogued)

Frontend calls that hit a URL prefix not registered in `tools/services.json`.

| URL Prefix | Call Count | Status | Likely Service | Repo on Disk? |
|---|---:|---|---|---|
| `/reader/v1` | 130 | In `$unmappedPrefixes` | External reader/SCORM service | No |
| `/analytics/v1` | 91 | In `$unmappedPrefixes` | Analytics/KPI service | No |
| `/trainingProgramReports` | 10 | **NOT in `$unmappedPrefixes`** | catalog-service (endpoint exists at this path, but no `/catalog/v1` prefix in frontend URL) | N/A — wrong frontend URL |
| `/notification/v1` | 2 | In `$unmappedPrefixes` | Notification service | No |

**Finding:** The `/trainingProgramReports` calls are a special case. The endpoint `GET /trainingProgramReports`
**does exist** in catalog-service, and the frontend also references it correctly as
`trainingProgramList: '/catalog/v1/trainingProgramReports'`. However a second key
`trainingProgramReports: '/trainingProgramReports'` (no version prefix) exists in `endpoints.ts`
and is used by `DashboardService`. This appears to be a stale legacy frontend URL that predates
the `/catalog/v1` prefix. The fix is a frontend change: update `trainingProgramReports` in
`endpoints.ts` to `/catalog/v1/trainingProgramReports`, making it an alias of `trainingProgramList`.

---

### 4. Schema Resolution Failures

The build-time response coverage rates (from `node build.js` output) are:

| Service | Req Schema Coverage | Resp Schema Coverage | Unresolved Response Shapes |
|---|---:|---:|---:|
| reports-service | 0% (no POST/PUT) | 100% | 0 |
| report-gen-service | 0% (no POST/PUT) | 67% | ~3 |
| reports-etl-service | 0% (no POST/PUT) | 100% | 0 |
| indicator-service | 100% | 100% | 0 |
| exam-service | 100% | 76% | ~29 |
| assessment-service | 100% | 100% | 0 |
| account-service | 99% | 78% | **25** |
| catalog-service | 100% | 83% | ~105 |

**account-service — 25 unresolved response shapes** (most impactful):

The parser could not resolve the response type because these methods return
`Collections.singletonMap(key, dto)` — a raw `Map<String, Object>` with no type parameter. The
service-trace fallback also fails because no service interface declares the return type explicitly.
Representative examples:

| Method | Path | Unresolved Shape |
|---|---|---|
| PATCH | `/externalTools/{id}` | `Collections.singletonMap(Constants.External_TOOLS, externalToolDTO)` |
| POST | `/institutions/{institutionId}/commonUsers` | `Collections.singletonMap("commonUsers", responseData)` |
| PATCH | `/competency` | `Collections.singletonMap(Constants.COMPETENCY.LABELS.COMPETENCY, responseDTO)` |
| GET | `/candidates` | `externalUserService.getCandidates(...)` (deep service chain) |
| GET | `/institutionDetails` | `service.getInstitutionUsersByUserIds(userIds)` (deep service chain) |

These require either annotating the wrapper methods or adding a resolution override in the parser.

---

### 5. Angular Pages With No Resolved API Calls (Data Pages)

45 of 219 Angular pages have zero fully-resolved API calls. Most are structural/layout shells
or authentication pages (expected). The following **10 data pages** appear to fetch data but
have no resolved calls, likely because they delegate to child route components (the route
component itself has no injected services; all HTTP calls happen in lazily-loaded children):

| Route | Component | Injected Services | Why Flagged |
|---|---|---|---|
| `/admin/unit-management` | UnitManagementComponent | (none) | Admin data-management page with no service injection — calls likely in child components |
| `/admin/department-management` | DepartmentManagementComponent | (none) | Same pattern |
| `/admin/user-mgmt/users` | UserManagementComponent | (none) | Large admin CRUD page — injected services absent from routing component |
| `/admin/competency-mgmt` | CompetencyManagementComponent | (none) | Competency tree management — child-injected |
| `/admin/competency-management-v2` | CompetencyManagementV2Component | (none) | V2 variant of above |
| `/admin/quality-mgmt` | QualityManagementComponent | (none) | QualityManagementService calls happen in a child tab component |
| `/admin/indicator-audit-mgmt` | AuditManagementComponent | (none) | Audit data page — child-delegated |
| `/dashboard/product-details/:id` | DashboardProductDetailsComponent | (none) | Product detail view — no direct injection at route level |
| `/notification` | NotificationListingComponent | (none) | Notification list — service injection absent at route level |
| `/` | SurveyFeedbackManagementComponent | (none) | Root route resolution conflict — duplicate `'/'` with `ExploreComponent` |

The root cause for all of these is the same: the Angular theme uses lazy-loaded feature modules
where the routing component is a thin shell with no direct `HttpClient` service injection. The
xref join only follows one level of component→service injection. These are **not true gaps**
in API coverage; they are a structural limitation of the current xref strategy.

---

### 6. Verb Mismatches (165 calls)

Calls where the frontend HTTP verb differs from the matched endpoint's verb. Most common patterns:

| Frontend Key | Frontend Verb | Backend Verb | Backend Path | Note |
|---|---|---|---|---|
| `users` | REQUEST | GET | `/{id}` (account-service) | Generic `request()` call — maps to GET semantically |
| `getAttendanceFile` | DELETE | — | `/sessions` | Likely wrong endpoint matched (path too broad) |
| `deleteProduct` | POST | — | `/institutions` | DELETE via POST body — non-REST pattern |
| `publishProduct` | PATCH | — | `/institutionSubscriptions` | Verb mismatch on publish action |
| `competencyV2Assessment` | DELETE/PUT/POST | — | `/assessments` | Multiple verbs on same key; backend has PATCH |
| `subSkillsAssessment` | PUT/DELETE | — | `/skills` | Verb mismatch; backend likely uses PATCH |
| `continueTopics` | PATCH/POST | — | `/{feedBackId}` (exam-service) | Both verbs in conditional branch; one is wrong |

Verb mismatches are not resolvable at the catalogue level — they require frontend or backend
source fixes. Most appear to be intentional (using POST for destructive actions, REQUEST for GET)
or are multi-verb methods where the xref matched the wrong candidate.

---

## Backend Annotation Count vs Spec Count

| Service | @*Mapping annotations in Java | Spec endpoint count | Delta | Explanation |
|---|---:|---:|---:|---|
| reports-service | 14 | 14 | 0 | Perfect match |
| report-gen-service | 9 | 9 | 0 | Perfect match |
| reports-etl-service | 3 | 3 | 0 | Perfect match |
| indicator-service | 63 | 63 | 0 | Perfect match |
| exam-service | 126 | 120 | +6 | 6 class-level `@RequestMapping` (base-path annotations counted by grep) |
| assessment-service | 56 | 56 | 0 | Perfect match |
| account-service | 438 | 433 | +5 | 5 class-level `@RequestMapping` in 5 controller files |
| catalog-service | 629 | 620 | +9 | 9 class-level `@RequestMapping` across 9 controller files |

**Conclusion:** No handler methods are missing from any spec. All deltas are class-level
`@RequestMapping` annotations (which declare the controller base path, not individual handler
methods) counted by the raw grep. The parser correctly excludes these.

---

## Recommendations

Ordered by impact:

1. **Fix stale frontend URL `/trainingProgramReports` (10 unrouted calls, easy)**
   In `medlern-enduser-solution-theme-blackdog/src/environments/endpoints.ts`, change
   `trainingProgramReports: '/trainingProgramReports'` to `/catalog/v1/trainingProgramReports`.
   This immediately resolves 10 calls currently unrouted.

2. **Add collection-level endpoints to assessment-service (297 noPathMatch calls)**
   The Angular theme calls `/assessment/v1/assessment`, `/assessment/v1/assessmentUsers`, etc.
   as collection roots. The assessment-service only exposes item-level routes. Either:
   (a) Add collection GET endpoints to the backend, or
   (b) Update the frontend to use the correct item-level paths with IDs.
   This is the single biggest source of unresolved UI→API mappings.

3. **Fix `/catalog/v1/adminStats` and `/catalog/v1/adminReport:export` (82 calls, truly missing)**
   These endpoints do not exist in catalog-service at all. If they are deprecated, the
   frontend calls should be removed. If they are planned, the backend needs to implement them.

4. **Fix `/catalog/v1/trainingSummary` (31 calls)**
   No `/trainingSummary` endpoint exists in catalog-service. The closest is `/trainingStatusSummary`.
   This is likely a URL that was renamed in the backend but not updated in the frontend.

5. **Resolve account-service `Collections.singletonMap` response shapes (25 endpoints)**
   Change the 25 affected account-service handlers to return a typed DTO instead of a raw
   `singletonMap`, or add `@Schema` annotations to help the parser resolve the type.

6. **Deepen the xref component-injection traversal for lazy-loaded modules**
   The 10 data pages with zero calls are shells that delegate to child components. Extending
   `xref.js` to follow the component tree one additional level would surface these calls.
   This is a significant change (>30 lines) and should be treated as a future enhancement.

7. **Register `/analytics/v1` and `/reader/v1` services or formally document them**
   These prefixes account for 221 unrouted calls. If the analytics and reader services are not
   going to be catalogued, document them explicitly in `services.json:$unmappedPrefixes`
   (they are already listed there, but their call volume warrants explicit team acknowledgment).
