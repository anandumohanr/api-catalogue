# UI ↔ API cross-reference build report

Generated: 2026-05-07 09:10

## Headline numbers

- Pages: **219**
- Total API call references across all pages: **5298**
- Resolved to a catalogued endpoint: **5065** (95.6%)
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
| `/notification/v1` | 1 | NO — no catalogued service uses this prefix |
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
- `/notification/v1/userDeviceInstances`  · 2 references

## Heaviest API consumers (top service classes by call count)

| Service class | Calls | Resolved |
|---|---:|---:|
| UserService | 75 | 60 |
| TrainingReportsCommonService | 66 | 59 |
| SchedulerService | 64 | 64 |
| CompetencyManagementV2Service | 48 | 25 |
| TrainingReportsService | 46 | 36 |
| DashboardService | 36 | 35 |
| CompetencyManagementService | 35 | 35 |
| QualityManagementService | 26 | 26 |
| UploadService | 24 | 24 |
| EvaluationService | 24 | 24 |
| CompetencyV2Service | 18 | 2 |
| AuditManagementService | 18 | 18 |
| PrivilegingReporteesService | 16 | 15 |
| SkillAuditService | 16 | 16 |
| SessionsListingService | 16 | 16 |

## Path-match misses (key in endpoints.ts but no matching catalogue path)

- `register` → `/account/v1/register` (would be routed to `account-service`)
- `homepageSections` → `/catalog/v2/homepageSections` (would be routed to `catalog-service`)
- `showCases` → `/catalog/v1/showcases` (would be routed to `catalog-service`)
- `institutionsTransferUnit` → `/account/v1/institutionTransfer` (would be routed to `account-service`)
- `traininghoursSummary` → `/catalog/v1/trainingSummary` (would be routed to `catalog-service`)
- `traininghoursSummaryForUserServc` → `/catalog/v1/trainingSummary` (would be routed to `catalog-service`)
- `userList` → `/catalog/v1/users` (would be routed to `catalog-service`)
- `assignments` → `/catalog/v1/assignments/` (would be routed to `catalog-service`)
- `usageStatsExports` → `/account/v1/activeUsers:export` (would be routed to `account-service`)
- `exportsHistoryExam` → `/account/v1/exportHistory` (would be routed to `account-service`)
- `certificatesUsers` → `/catalog/v1/users` (would be routed to `catalog-service`)
- `launchToken` → `/account/v1/launchToken/` (would be routed to `account-service`)
- `continueTopics` → `/exam/v1/users/` (would be routed to `exam-service`)
- `adminStats` → `/catalog/v1/adminStats` (would be routed to `catalog-service`)
- `userCompetency` → `/account/v1/userCompetency/` (would be routed to `account-service`)
- `kpiAllExport` → `/catalog/v1/adminReport:export` (would be routed to `catalog-service`)
- `levelCompleteStatus` → `/account/v1/user/#/checklist` (would be routed to `account-service`)
- `departmentUsers` → `/account/v2/groupedUserIds` (would be routed to `account-service`)
- `reportHistory` → `/catalog/v1/reportHistory` (would be routed to `catalog-service`)
- `postV2Assessment` → `/assessment/v1/assessment` (would be routed to `assessment-service`)
- `getFrequencyReviewers` → `/assessment/v1/frequency` (would be routed to `assessment-service`)
- `importSkills` → `/assessment/v1/imports` (would be routed to `assessment-service`)
- `deleteSubSkills` → `/assessment/v1/subskills` (would be routed to `assessment-service`)
- `assessmentUsers` → `/assessment/v1/assessmentUsers` (would be routed to `assessment-service`)
- `userAssessment` → `/assessment/v1/users` (would be routed to `assessment-service`)
- `assessmentReport` → `/assessment/v1/assessmentUser` (would be routed to `assessment-service`)
- `institutionAssessment` → `/assessment/v1/institution` (would be routed to `assessment-service`)

## Same METHOD + path implemented more than once

Found 37 duplicate method/path groups. These are kept as direct-service matches, but the rendered endpoint cards show sibling usage so near-identical implementations are not mistaken for parser misses.

- `GET /tenantSettings`
  - `exam-service` · `exam-service-ep-87` · 0 UI pages
  - `account-service` · `account-service-ep-308` · 116 UI pages
  - `catalog-service` · `catalog-service-ep-560` · 10 UI pages
- `GET /imports`
  - `exam-service` · `exam-service-ep-11` · 17 UI pages
  - `account-service` · `account-service-ep-224` · 17 UI pages
  - `catalog-service` · `catalog-service-ep-190` · 20 UI pages
- `GET /learnerComplianceReport`
  - `reports-service` · `reports-service-ep-7` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-159` · 25 UI pages
- `GET /sessionProgressionReport`
  - `reports-service` · `reports-service-ep-4` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-168` · 25 UI pages
- `GET /sessionReportSummary`
  - `reports-service` · `reports-service-ep-6` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-165` · 25 UI pages
- `GET /leaderboards`
  - `account-service` · `account-service-ep-385` · 10 UI pages
  - `catalog-service` · `catalog-service-ep-509` · 34 UI pages
- `GET /assignmentReports:export`
  - `reports-service` · `reports-service-ep-14` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-506` · 42 UI pages
- `GET /assessments`
  - `assessment-service` · `assessment-service-ep-17` · 37 UI pages
  - `catalog-service` · `catalog-service-ep-238` · 0 UI pages
- `GET /assignmentReports`
  - `reports-service` · `reports-service-ep-12` · 25 UI pages
  - `catalog-service` · `catalog-service-ep-502` · 9 UI pages
- `POST /questionsImport`
  - `exam-service` · `exam-service-ep-12` · 17 UI pages
  - `catalog-service` · `catalog-service-ep-193` · 17 UI pages
- `GET /audits`
  - `indicator-service` · `indicator-service-ep-45` · 12 UI pages
  - `account-service` · `account-service-ep-1` · 16 UI pages
- `GET /reportHistory/{reportHistoryId}`
  - `exam-service` · `exam-service-ep-84` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-160` · 25 UI pages
- `GET /trainingReports`
  - `reports-service` · `reports-service-ep-2` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-166` · 25 UI pages
- `GET /trainingStatusSummary`
  - `reports-service` · `reports-service-ep-1` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-156` · 25 UI pages
- `GET /exports`
  - `reports-service` · `reports-service-ep-10` · 0 UI pages
  - `exam-service` · `exam-service-ep-5` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-55` · 0 UI pages
  - `account-service` · `account-service-ep-220` · 12 UI pages
  - `catalog-service` · `catalog-service-ep-388` · 12 UI pages
- `DELETE /institutions`
  - `account-service` · `account-service-ep-248` · 11 UI pages
  - `catalog-service` · `catalog-service-ep-288` · 8 UI pages
- `GET /products/{id}/competencies`
  - `account-service` · `account-service-ep-120` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-232` · 12 UI pages
- `POST /products/{id}/competencies`
  - `account-service` · `account-service-ep-119` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-231` · 11 UI pages
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
  - `catalog-service` · `catalog-service-ep-357` · 1 UI page
- `DELETE /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-57` · 0 UI pages
  - `account-service` · `account-service-ep-5` · 0 UI pages
- `GET /`
  - `exam-service` · `exam-service-ep-108` · 0 UI pages
  - `exam-service` · `exam-service-ep-111` · 0 UI pages
  - `exam-service` · `exam-service-ep-114` · 0 UI pages
- `GET /audits/{auditId}`
  - `indicator-service` · `indicator-service-ep-49` · 0 UI pages
  - `account-service` · `account-service-ep-6` · 0 UI pages
- `GET /audits/{auditId}/auditors`
  - `indicator-service` · `indicator-service-ep-54` · 0 UI pages
  - `account-service` · `account-service-ep-3` · 0 UI pages
- `GET /batchUploadDimensions`
  - `account-service` · `account-service-ep-80` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-387` · 0 UI pages
- `GET /exports/{id}/files`
  - `reports-service` · `reports-service-ep-9` · 0 UI pages
  - `exam-service` · `exam-service-ep-7` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-56` · 0 UI pages
  - `account-service` · `account-service-ep-221` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-389` · 0 UI pages
- `GET /imports/{importId}`
  - `exam-service` · `exam-service-ep-13` · 0 UI pages
  - `assessment-service` · `assessment-service-ep-33` · 0 UI pages
  - `account-service` · `account-service-ep-225` · 0 UI pages
- `GET /imports/{importId}/files`
  - `exam-service` · `exam-service-ep-14` · 0 UI pages
  - `account-service` · `account-service-ep-223` · 0 UI pages
  - `catalog-service` · `catalog-service-ep-191` · 0 UI pages