# API Catalogue Validation Report

Generated: 2026-05-11

Assessment service source revision: `af35159` (`Merged in revert-new-designation`)

---

## Executive Summary

| Metric | Current |
|---|---:|
| Backend endpoints parsed | 1,380 |
| Assessment-service endpoints parsed | 59 |
| Frontend endpoint keys | 397 |
| Angular pages | 219 |
| UI API call references across pages | 6,094 |
| Resolved to catalogued endpoints | 5,853 |
| Routed match rate | 96.0% |
| Compatible-service/no-backend-path misses | 1 unique path / 10 UI references |
| Unrouted calls with no local service prefix | 231 |
| Backend endpoints with no direct UI consumer | 914 / 1,380 |

The previous catalog false positives are fixed. The catalogue now contains and maps:

| Frontend URL | Backend endpoint | UI references |
|---|---|---:|
| `/catalog/v1/adminStats` | `GET /adminStats` (`catalog-service-ep-276`) | 41 |
| `/catalog/v1/adminReport:export` | `POST /adminReport:export` (`catalog-service-ep-284`) | 41 |
| `/catalog/v1/trainingSummary` | `GET /trainingSummary` (`catalog-service-ep-275`) | 31 |

## Remaining Path Match Miss

Only one frontend call routes to a known local service but has no compatible backend path:

| Frontend URL | Verb | Service | UI references | Status |
|---|---|---|---:|---|
| `/assessment/v1/assessmentUsers/{assessmentUserId}/self-rating-comments` | GET | assessment-service | 10 | Backend route not present in latest local source |

Frontend call sites:

| File | Line | URL |
|---|---:|---|
| `src/app/competency-v2/competency-v2.service.ts` | 123 | `${environment.apiEndPoint.assessmentUsers}/${assessmentUserId}/self-rating-comments` |
| `src/app/admin/competency-management-v2/competency-management-v2.service.ts` | 625 | `${environment.apiEndPoint.assessmentUsers}/${assessmentUserId}/self-rating-comments` |

Affected UI routes:

| Route |
|---|
| `/admin/competency-management-v2/form-setup` |
| `/admin/competency-management-v2/new-competency` |
| `/admin/competency-management-v2/edit-competency` |
| `/admin/competency-management-v2/search-assessments` |
| `/admin/competency-management-v2/listing-assessments` |
| `/admin/competency-management-v2/view-details` |
| `/admin/competency-management-v2/reports` |
| `/admin/competency-management-v2/reports-summary` |
| `/my-competency-v2` |
| `/competency-reportees` |

Assessment-service exposes these related routes, but none is path-compatible with the UI call:

| Backend endpoint | Endpoint id | Notes |
|---|---|---|
| `GET /assessmentUser/{assessmentUserId}/assessmentUserSkill/{assessmentUserSkillId}/comments` | `assessment-service-ep-46` | Requires `assessmentUserSkillId`; singular `assessmentUser` base |
| `POST /assessmentUser/{assessmentUserId}/assessmentUserSkill/{assessmentUserSkillId}/comments` | `assessment-service-ep-47` | Requires `assessmentUserSkillId`; singular `assessmentUser` base |
| `GET /assessmentUsers/{assessmentUserId}/remarks` | `assessment-service-ep-10` | Different resource |
| `PATCH /assessmentUsers/{assessmentUserId}/remarks` | `assessment-service-ep-8` | Different resource |

Workspace-wide Java search found no `self-rating-comments` route in the local service repos. This is therefore not a catalogue parser miss; either the frontend call is stale or the backend endpoint is not present in the checked-out assessment-service revision.

## Unrouted Prefixes

These calls point to service prefixes not registered in `tools/services.json` or not present as local service source:

| URL | UI references | Likely reason |
|---|---:|---|
| `/reader/v1/ip` | 116 | reader service source is not present locally |
| `/analytics/v1/kpiSessionSummary` | 41 | analytics service source is not present locally |
| `/analytics/v1/kpiUsers` | 41 | analytics service source is not present locally |
| `/reader/v1/scormReports` | 14 | reader service source is not present locally |
| `/trainingProgramReports` | 10 | frontend URL lacks a catalog prefix |
| `/analytics/v1/kpiActiveUsersByUserIds` | 6 | analytics service source is not present locally |
| `/analytics/v1/kpiActiveUsers` | 3 | analytics service source is not present locally |

`/notification/v1/userDeviceInstances` and `/notification/v1/userDeviceInstances/{token}` are no longer
unrouted. `medlern-notification-service` is now registered and parsed with the Express-route parser.

## Backend Endpoints With No Direct UI Consumer

| Service | Uncalled | Total | Uncalled % |
|---|---:|---:|---:|
| account-service | 303 | 446 | 68% |
| assessment-service | 9 | 59 | 15% |
| catalog-service | 461 | 652 | 71% |
| exam-service | 94 | 120 | 78% |
| indicator-service | 23 | 63 | 37% |
| notification-service | 12 | 14 | 86% |
| report-gen-service | 5 | 9 | 56% |
| reports-etl-service | 3 | 3 | 100% |
| reports-service | 4 | 14 | 29% |
| **Total** | **914** | **1,380** | **66%** |

## Validation Commands Run

- `node tools/build.js`
- `node -c tools/parse.js && node -c tools/parse-frontend.js && node -c tools/parse-express.js && node -c tools/xref.js && node -c tools/build.js`
- Cross-reference scan over `_data/xref.json`
- Assessment-service route scan over `../medlern-assessment-service/src/main/java`
- Workspace-wide Java scan for `self-rating-comments`
