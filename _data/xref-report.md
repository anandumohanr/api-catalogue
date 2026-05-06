# UI ↔ API cross-reference build report

Generated: 2026-05-06 07:04

## Headline numbers

- Pages: **219**
- Total API call references across all pages: **4886**
- Resolved to a catalogued endpoint: **4653** (95.2%)
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
| UserService | 75 | 71 |
| TrainingReportsCommonService | 66 | 60 |
| SchedulerService | 64 | 64 |
| CompetencyManagementV2Service | 48 | 25 |
| TrainingReportsService | 46 | 39 |
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

- `homepageSections` → `/catalog/v2/homepageSections` (would be routed to `catalog-service`)
- `showCases` → `/catalog/v1/showcases` (would be routed to `catalog-service`)
- `traininghoursSummary` → `/catalog/v1/trainingSummary` (would be routed to `catalog-service`)
- `traininghoursSummaryForUserServc` → `/catalog/v1/trainingSummary` (would be routed to `catalog-service`)
- `userList` → `/catalog/v1/users` (would be routed to `catalog-service`)
- `assignments` → `/catalog/v1/assignments/` (would be routed to `catalog-service`)
- `certificatesUsers` → `/catalog/v1/users` (would be routed to `catalog-service`)
- `adminStats` → `/catalog/v1/adminStats` (would be routed to `catalog-service`)
- `kpiAllExport` → `/catalog/v1/adminReport:export` (would be routed to `catalog-service`)
- `levelCompleteStatus` → `/account/v1/user/#/checklist` (would be routed to `account-service`)
- `reportHistory` → `/catalog/v1/reportHistory` (would be routed to `catalog-service`)
- `postV2Assessment` → `/assessment/v1/assessment` (would be routed to `assessment-service`)
- `getFrequencyReviewers` → `/assessment/v1/frequency` (would be routed to `assessment-service`)
- `importSkills` → `/assessment/v1/imports` (would be routed to `assessment-service`)
- `deleteSubSkills` → `/assessment/v1/subskills` (would be routed to `assessment-service`)
- `assessmentUsers` → `/assessment/v1/assessmentUsers` (would be routed to `assessment-service`)
- `userAssessment` → `/assessment/v1/users` (would be routed to `assessment-service`)
- `assessmentReport` → `/assessment/v1/assessmentUser` (would be routed to `assessment-service`)
- `institutionAssessment` → `/assessment/v1/institution` (would be routed to `assessment-service`)