# Keeping the API Catalogue Current

The catalogue is a generated static site — its HTML reflects the source repos at the moment of the last build. It does not update itself. Run a maintenance pass any time the catalogue might be stale.

## When to run maintenance

- A new backend microservice is added to the platform
- Significant new endpoints are added to an existing service
- The Angular theme wires up new API calls or removes old ones
- The catalogue looks out of date and you're not sure what changed

Minor endpoint additions in a service you already have checked out don't need a full pass — just rebuild:

```bash
cd tools && node build.js
```

## How to run a full maintenance pass

Open [Claude Code](https://claude.ai/code) in the `api-catalogue/` directory and paste this prompt:

```
Maintain the API catalogue.
```

Claude knows the full procedure from project memory and will handle everything end-to-end: pull latest code, detect new services, rebuild, fix config issues, and push to GitHub Pages.

## Prerequisites

All backend service repos and the Angular theme must be checked out as siblings of `api-catalogue/`:

```
<parent>/
├── api-catalogue/                              ← you are here
├── medlern-account-service/
├── medlern-catalog-service/
├── medlern-exam-service/
├── medlern-assessment-service/
├── medlern-indicator-service/
├── medlern-report-gen-service/
├── medlern-reports-etl-service/
├── medlern_reports_service/
├── medlern-analytics-service/
├── medlern-reader-service/
├── medlern-notification-service/
└── medlern-enduser-solution-theme-blackdog/
```

Before running maintenance, pull the latest from each sibling repo manually. Missing repos are skipped with a `[skip]` log line rather than failing the build, so partial checkouts still produce useful output for the services that are present.

## Manual rebuild (no Claude)

If you just want to regenerate HTML from already-cached data:

```bash
cd tools
node build.js --no-parse --no-frontend   # render only, reuse cached _data/
node build.js --no-parse                  # re-run xref + render, skip Java parsing
node build.js                             # full pipeline
```

Then commit and push from the repo root:

```bash
git add -u && git commit -m "Rebuild" && git push
```
