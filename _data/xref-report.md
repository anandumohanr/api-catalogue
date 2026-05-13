# UI ↔ API cross-reference build report

Generated: 2026-05-13 03:42

## Headline numbers

- Pages: **219**
- Total API call references across all pages: **1497**
- Resolved to a catalogued endpoint: **1497** (100.0%)
- Endpoint keys in endpoints.ts: 397

## Per-prefix routing

| Prefix | Endpoint keys | Routed? |
|---|---:|---|
| `/account/v1` | 110 | yes |
| `/account/v2` | 1 | yes |
| `/analytics/v1` | 4 | yes |
| `/assessment/v1` | 16 | yes |
| `/catalog/v1` | 198 | yes |
| `/catalog/v2` | 11 | yes |
| `/exam/v1` | 23 | yes |
| `/indicator/v1` | 15 | yes |
| `/notification/v1` | 1 | yes |
| `/reader/v1` | 2 | yes |
| `/report-gen/v1` | 6 | yes |
| `/reports/v1` | 8 | yes |
| `/site/v1` | 1 | NO — no catalogued service uses this prefix |
| `/trainingProgramReports` | 1 | yes |

## Heaviest API consumers (top service classes by call count)

| Service class | Calls | Resolved |
|---|---:|---:|
| UserService | 77 | 77 |
| TrainingReportsCommonService | 69 | 69 |
| SchedulerService | 67 | 67 |
| CompetencyManagementV2Service | 49 | 48 |
| TrainingReportsService | 46 | 46 |
| DashboardService | 38 | 38 |
| CompetencyManagementService | 35 | 35 |
| UploadService | 28 | 28 |
| QualityManagementService | 26 | 26 |
| EvaluationService | 25 | 25 |
| CompetencyV2Service | 20 | 19 |
| AuditManagementService | 18 | 18 |
| PrivilegingReporteesService | 16 | 16 |
| SkillAuditService | 16 | 16 |
| SessionsListingService | 16 | 16 |

## Path-match misses (key in endpoints.ts but no matching catalogue path)

_None._

## Same METHOD + path implemented more than once

Found 113 duplicate method/path groups. These are kept as direct-service matches, but the rendered endpoint cards show sibling usage so near-identical implementations are not mistaken for parser misses.

- `GET /tenantSettings`
  - `exam-service` · `exam-service-ep-87` · 0 UI pages
  - `account-service` · `account-service-ep-321` · 26 UI pages
  - `catalog-service` · `catalog-service-ep-592` · 1 UI page
- `GET /imports/{importId}/files`
  - `exam-service` · `exam-service-ep-14` · 7 UI pages
  - `account-service` · `account-service-ep-236` · 8 UI pages
  - `catalog-service` · `catalog-service-ep-196` · 10 UI pages
- `GET /exports/{id}/files`
  - `reports-service` · `reports-service-ep-9` · 13 UI pages
  - `exam-service` · `exam-service-ep-7` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-59` · 0 UI pages
  - `account-service` · `account-service-ep-234` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-421` · 0 UI pages
- `GET /reportHistory/{reportHistoryId}`
  - `exam-service` · `exam-service-ep-84` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-164` · 12 UI pages
- `GET /imports/{importId}`
  - `exam-service` · `exam-service-ep-13` · 1 UI page
  - `assessment-service` · `assessment-service-ep-36` · 2 UI pages
  - `account-service` · `account-service-ep-238` · 6 UI pages
- `GET /leaderboards`
  - `account-service` · `account-service-ep-398` · 2 UI pages
  - `catalog-service` · `catalog-service-ep-541` · 6 UI pages
- `GET /exports`
  - `reports-service` · `reports-service-ep-10` · 7 UI pages
  - `exam-service` · `exam-service-ep-5` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-58` · 0 UI pages
  - `account-service` · `account-service-ep-233` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-420` · 0 UI pages
- `GET /audits`
  - `indicator-service` · `indicator-service-ep-45` · 3 UI pages
  - `account-service` · `account-service-ep-1` · 3 UI pages
- `GET /imports`
  - `exam-service` · `exam-service-ep-11` · 1 UI page
  - `account-service` · `account-service-ep-237` · 2 UI pages
  - `catalog-service` · `catalog-service-ep-195` · 3 UI pages
- `GET /assessments`
  - `assessment-service` · `assessment-service-ep-20` · 5 UI pages
  - `catalog-service` · `catalog-service-ep-243` · 0 UI pages
- `GET /audits/{auditId}/auditors`
  - `indicator-service` · `indicator-service-ep-54` · 2 UI pages
  - `account-service` · `account-service-ep-3` · 3 UI pages
- `GET /v1/kpiUsers`
  - `analytics-service` · `analytics-service-ep-135` · 5 UI pages
  - `analytics-service` · `analytics-service-ep-136` · 0 UI pages
- `GET /assignmentReports:export`
  - `reports-service` · `reports-service-ep-14` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-538` · 4 UI pages
- `GET /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-47` · 2 UI pages
  - `account-service` · `account-service-ep-15` · 2 UI pages
- `DELETE /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-62` · 2 UI pages
  - `account-service` · `account-service-ep-16` · 1 UI page
- `DELETE /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-57` · 2 UI pages
  - `account-service` · `account-service-ep-5` · 1 UI page
- `GET /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-49` · 0 UI pages
  - `account-service` · `account-service-ep-6` · 3 UI pages
- `GET /v1/kpiSessionSummary`
  - `analytics-service` · `analytics-service-ep-153` · 3 UI pages
  - `analytics-service` · `analytics-service-ep-154` · 0 UI pages
- `POST /audits/{auditId}:publish`
  - `indicator-service` · `indicator-service-ep-56` · 2 UI pages
  - `account-service` · `account-service-ep-7` · 1 UI page
- `POST /v1/kpiActiveUsersByUserIds`
  - `analytics-service` · `analytics-service-ep-139` · 3 UI pages
  - `analytics-service` · `analytics-service-ep-140` · 0 UI pages
- `PUT /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-46` · 2 UI pages
  - `account-service` · `account-service-ep-13` · 1 UI page
- `GET /products/{id}/competencies`
  - `account-service` · `account-service-ep-120` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-237` · 2 UI pages
- `GET /v1/kpiActiveUsers`
  - `analytics-service` · `analytics-service-ep-137` · 2 UI pages
  - `analytics-service` · `analytics-service-ep-138` · 0 UI pages
- `POST /questionsImport`
  - `exam-service` · `exam-service-ep-12` · 1 UI page
  - `catalog-service` · `catalog-service-ep-198` · 1 UI page
- `GET /assignmentReports`
  - `reports-service` · `reports-service-ep-12` · 1 UI page
  - `catalog-service` · `catalog-service-ep-534` · 0 UI pages
- `GET /health`
  - `report-gen-service` · `report-gen-service-ep-9` · 1 UI page
  - `notification-service` · `notification-service-ep-3` · 0 UI pages
- `GET /learnerComplianceReport`
  - `reports-service` · `reports-service-ep-7` · 1 UI page
  - `catalog-service` · `catalog-service-ep-163` · 0 UI pages
- `GET /sessionProgressionReport`
  - `reports-service` · `reports-service-ep-4` · 1 UI page
  - `catalog-service` · `catalog-service-ep-172` · 0 UI pages
- `GET /sessionReportSummary`
  - `reports-service` · `reports-service-ep-6` · 1 UI page
  - `catalog-service` · `catalog-service-ep-169` · 0 UI pages
- `GET /trainingReports`
  - `reports-service` · `reports-service-ep-2` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-170` · 1 UI page