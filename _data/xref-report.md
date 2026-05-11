# UI ↔ API cross-reference build report

Generated: 2026-05-11 16:39

## Headline numbers

- Pages: **219**
- Total API call references across all pages: **6094**
- Resolved to a catalogued endpoint: **5853** (96.0%)
- Endpoint keys in endpoints.ts: 397

## Per-prefix routing

| Prefix | Endpoint keys | Routed? |
|---|---:|---|
| `/account/v1` | 110 | yes |
| `/account/v2` | 1 | yes |
| `/analytics/v1` | 4 | NO — no catalogued service uses this prefix |
| `/assessment/v1` | 16 | yes |
| `/catalog/v1` | 198 | yes |
| `/catalog/v2` | 11 | yes |
| `/exam/v1` | 23 | yes |
| `/indicator/v1` | 15 | yes |
| `/notification/v1` | 1 | yes |
| `/reader/v1` | 2 | NO — no catalogued service uses this prefix |
| `/report-gen/v1` | 6 | yes |
| `/reports/v1` | 8 | yes |
| `/site/v1` | 1 | NO — no catalogued service uses this prefix |
| `/trainingProgramReports` | 1 | NO — no catalogued service uses this prefix |

## Top unrouted endpoint URLs (frontend uses, no catalogued service)

- `/reader/v1/ip`  · 119 references
- `/analytics/v1/kpiUsers`  · 59 references
- `/analytics/v1/kpiSessionSummary`  · 42 references
- `/reader/v1/scormReports`  · 14 references
- `/trainingProgramReports`  · 10 references
- `/analytics/v1/kpiActiveUsersByUserIds`  · 6 references
- `/analytics/v1/kpiActiveUsers`  · 3 references

## Heaviest API consumers (top service classes by call count)

| Service class | Calls | Resolved |
|---|---:|---:|
| UserService | 77 | 76 |
| TrainingReportsCommonService | 69 | 67 |
| SchedulerService | 67 | 67 |
| CompetencyManagementV2Service | 49 | 48 |
| TrainingReportsService | 46 | 43 |
| DashboardService | 38 | 37 |
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

- `GET /assessment/v1/assessmentUsers/{assessmentUserId}/self-rating-comments` · 10 UI references · keys: `assessmentUsers` · routed service: `assessment-service`

## Same METHOD + path implemented more than once

Found 39 duplicate method/path groups. These are kept as direct-service matches, but the rendered endpoint cards show sibling usage so near-identical implementations are not mistaken for parser misses.

- `GET /tenantSettings`
  - `exam-service` · `exam-service-ep-87` · 0 UI pages
  - `account-service` · `account-service-ep-321` · 116 UI pages
  - `catalog-service` · `catalog-service-ep-592` · 10 UI pages
- `GET /imports/{importId}/files`
  - `exam-service` · `exam-service-ep-14` · 17 UI pages
  - `account-service` · `account-service-ep-236` · 17 UI pages
  - `catalog-service` · `catalog-service-ep-196` · 20 UI pages
- `GET /learnerComplianceReport`
  - `reports-service` · `reports-service-ep-7` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-163` · 25 UI pages
- `GET /sessionProgressionReport`
  - `reports-service` · `reports-service-ep-4` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-172` · 25 UI pages
- `GET /sessionReportSummary`
  - `reports-service` · `reports-service-ep-6` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-169` · 25 UI pages
- `GET /leaderboards`
  - `account-service` · `account-service-ep-398` · 10 UI pages
  - `catalog-service` · `catalog-service-ep-541` · 34 UI pages
- `GET /imports/{importId}`
  - `exam-service` · `exam-service-ep-13` · 17 UI pages
  - `assessment-service` · `assessment-service-ep-36` · 9 UI pages
  - `account-service` · `account-service-ep-238` · 17 UI pages
- `GET /assignmentReports:export`
  - `reports-service` · `reports-service-ep-14` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-538` · 42 UI pages
- `POST /questionsImport`
  - `exam-service` · `exam-service-ep-12` · 17 UI pages
  - `catalog-service` · `catalog-service-ep-198` · 17 UI pages
- `GET /assignmentReports`
  - `reports-service` · `reports-service-ep-12` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-534` · 0 UI pages
- `GET /reportHistory/{reportHistoryId}`
  - `exam-service` · `exam-service-ep-84` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-164` · 25 UI pages
- `GET /trainingReports`
  - `reports-service` · `reports-service-ep-2` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-170` · 25 UI pages
- `GET /trainingStatusSummary`
  - `reports-service` · `reports-service-ep-1` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-160` · 25 UI pages
- `GET /exports`
  - `reports-service` · `reports-service-ep-10` · 12 UI pages
  - `exam-service` · `exam-service-ep-5` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-58` · 0 UI pages
  - `account-service` · `account-service-ep-233` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-420` · 12 UI pages
- `GET /imports`
  - `exam-service` · `exam-service-ep-11` · 1 UI page
  - `account-service` · `account-service-ep-237` · 2 UI pages
  - `catalog-service` · `catalog-service-ep-195` · 20 UI pages
- `DELETE /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-57` · 10 UI pages
  - `account-service` · `account-service-ep-5` · 6 UI pages
- `GET /audits`
  - `indicator-service` · `indicator-service-ep-45` · 7 UI pages
  - `account-service` · `account-service-ep-1` · 8 UI pages
- `GET /products/{id}/competencies`
  - `account-service` · `account-service-ep-120` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-237` · 12 UI pages
- `GET /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-49` · 5 UI pages
  - `account-service` · `account-service-ep-6` · 6 UI pages
- `GET /audits/{auditId}/auditors`
  - `indicator-service` · `indicator-service-ep-54` · 5 UI pages
  - `account-service` · `account-service-ep-3` · 6 UI pages
- `POST /products/{id}/competencies`
  - `account-service` · `account-service-ep-119` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-236` · 11 UI pages
- `GET /assessments`
  - `assessment-service` · `assessment-service-ep-20` · 9 UI pages
  - `catalog-service` · `catalog-service-ep-243` · 0 UI pages
- `DELETE /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-62` · 5 UI pages
  - `account-service` · `account-service-ep-16` · 3 UI pages
- `GET /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-47` · 5 UI pages
  - `account-service` · `account-service-ep-15` · 3 UI pages
- `PUT /audit/{auditId}/question`
  - `indicator-service` · `indicator-service-ep-46` · 5 UI pages
  - `account-service` · `account-service-ep-13` · 3 UI pages
- `DELETE /assets`
  - `exam-service` · `exam-service-ep-1` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-389` · 1 UI page
- `GET /health`
  - `report-gen-service` · `report-gen-service-ep-9` · 1 UI page
  - `notification-service` · `notification-service-ep-3` · 0 UI pages
- `DELETE /institutions`
  - `account-service` · `account-service-ep-261` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-314` · 0 UI pages
- `GET /`
  - `exam-service` · `exam-service-ep-108` · 0 UI pages
  - `exam-service` · `exam-service-ep-111` · 0 UI pages
  - `exam-service` · `exam-service-ep-114` · 0 UI pages
- `GET /batchUploadDimensions`
  - `account-service` · `account-service-ep-80` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-419` · 0 UI pages