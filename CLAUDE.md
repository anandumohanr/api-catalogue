# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Node-only static-site generator that produces a self-contained HTML catalogue of the Medlern platform. It parses Java Spring controllers across several sibling backend repos plus the Angular theme, joins them by URL, classifies each endpoint by which UI screen consumes it, and renders one HTML page per service plus an index, a pages page, and per-category pages.

There is no server, no framework, no bundler. The output `*.html` files at the repo root are the product — open them in a browser. CSS, theme tokens, Cmd-K palette JS and JSON syntax highlighting are all string-concatenated inline.

The whole pipeline reads source from sibling repos and writes all derived data into `_data/` and HTML into the repo root. It does not write to any of the backend or frontend source trees.

## Repository layout

```
api-catalogue/
├── tools/                        ← all the generator code lives here
│   ├── build.js                  ← orchestrator (single entry point)
│   ├── parse.js                  ← Java/Spring backend parser
│   ├── parse-frontend.js         ← Angular/TypeScript theme parser
│   ├── xref.js                   ← URL-based join of frontend ↔ backend
│   ├── categorize.js             ← endpoint → UI-category classifier
│   ├── render.js                 ← HTML composition (per-service + index pages)
│   ├── template.js               ← shared CSS + client-side JS, plus FONTS/PALETTE/APPBAR chrome
│   ├── services.json             ← which backends to scan, with frontend URL prefixes
│   ├── categories.json           ← classification overrides, route prefixes, regex patterns
│   ├── package.json              ← only dep is java-parser (currently unused on hot path)
│   └── node_modules/
├── _data/                        ← all generated intermediates (committed)
│   ├── dtos.json                 ← global Java type registry, FQN-keyed
│   ├── <serviceId>.spec.json     ← one per backend; the canonical endpoint catalogue
│   ├── frontend.json             ← endpointMap + services[] + components[] + routes[]
│   ├── xref.json                 ← pages[] with apiCalls + endpointUsage reverse index
│   └── xref-report.md            ← human-readable build summary
└── *.html                        ← rendered output (one per service + index + pages + 4 category pages)
```

The whole repo is purely generated content + the generator code. Don't add a build system, framework, or test runner unless explicitly asked.

## Sibling-repo dependency

`build.js` resolves data sources two levels up from `tools/`:

```
<parent>/
├── api-catalogue/                              ← this repo (cwd is here)
├── medlern-account-service/                    ← Java services (per services.json)
├── medlern-catalog-service/
├── medlern-exam-service/
├── medlern-assessment-service/
├── medlern-indicator-service/
├── medlern-report-gen-service/
├── medlern-reports-etl-service/
├── medlern_reports_service/
└── medlern-enduser-solution-theme-blackdog/    ← Angular theme (frontend xref)
```

Service dirs (and the theme dir) must be checked out as siblings of `api-catalogue/`. Missing dirs print `[skip] <id>: <path> not found` and continue rather than failing — this is intentional so partial checkouts still produce useful output.

## Commands

```bash
cd tools
npm install                              # one-time

node build.js                            # full pipeline: parse + xref + categorise + render
node build.js --no-parse                 # skip Java parsing; reuse cached _data/*.spec.json
node build.js --no-frontend              # skip Angular parse + xref; render only (loads cached xref.json if present)
node build.js --service=catalog-service  # parse + render one backend; does not regenerate index/pages/category pages
```

There is no test suite, no linter config, no formatter. `package.json`'s `test` script intentionally errors. There is no CI. Open the resulting `index.html` (or any `<service>.html`) in a browser to verify changes.

## Deploying to the live site

The catalogue is hosted on GitHub Pages at `https://anandumohanr.github.io/api-catalogue/`.

After rebuilding (running `node build.js` in `tools/`), push the updated HTML to make it live:

```bash
git add -u
git commit -m "Rebuild"
git push
```

Run this from the repo root (`api-catalogue/`), not from `tools/`. GitHub Pages updates within a minute or two of the push. When the user says "push the changes to live" or similar, run these three commands.

## Maintenance

When asked to **"Maintain the API catalogue"**, run this procedure in order:

### 1. Detect new services

List all sibling directories that could be new backend services:

```bash
ls ../../ | grep medlern-
```

Compare against the `dir` values in `tools/services.json`. Any directory that is not already registered AND contains `src/main/java` (Java) or `src/` with `.ts` files (Node/Express) is a candidate new service. For each:
- Open a controller file to infer the base URL path (`@RequestMapping` or Express `router.get/post`)
- Add an entry to `tools/services.json` with `id`, `dir`, `displayName`, `blurb`, `frontendPrefix`
- Use lowercase kebab-case for `id` — it becomes the HTML filename and endpoint ID prefix (`<id>-ep-N`)

### 2. Run the build

```bash
cd tools && node build.js
```

`[skip] <id>: <path> not found` lines are expected for repos not checked out — not errors. Watch for:
- `[categorize] ... uncategorized=N` — if N > 0, needs category config work (step 4)
- `[xref] ... % routed` — if below 95%, check for unrouted prefixes

### 3. Analyse _data/xref-report.md

**Unrouted prefixes** (rows showing `NO` in "Per-prefix routing"):
- In `tools/services.json:$unmappedPrefixes` → already acknowledged, no action
- Otherwise → add a `frontendPrefix` to the right service entry, or add to `$unmappedPrefixes`

**Path-match misses**: do NOT auto-fix — flag each one to the developer. These indicate stale frontend constants or renamed backend routes that need a human decision.

**Duplicate method+path groups**: informational only, no action needed.

### 4. Fix uncategorized endpoints

If `uncategorized > 0`:
- Find affected endpoints in `_data/<serviceId>.spec.json` and group by area name and path prefix
- Determine category: `auth == null` + login/register paths → `preLoginAreas`; `/admin/` paths → `adminAreas`; learner-facing → `dashboardAreas`
- Add to `tools/categories.json` (prefer area lists and regex patterns over `overrides`)
- Fast re-render: `cd tools && node build.js --no-parse --no-frontend`

### 5. Rebuild if config changed

If `services.json` was modified: `cd tools && node build.js` (full rebuild)
If only `categories.json` changed: `cd tools && node build.js --no-parse --no-frontend`

### 6. Commit and push

From the repo root:
```bash
git add -u
git commit -m "Rebuild"
git push
```

### Edge cases — flag to developer, do not auto-fix

- **Service removed**: if a `dir` in `services.json` no longer exists as a sibling, flag it — the entry may need removing, but confirm first (it might just not be checked out locally)
- **Service renamed**: if a new sibling looks like a rename of an existing entry, flag both rather than silently adding a duplicate
- **Path-match misses**: always flag, never silently fix

## End-to-end pipeline

`build.js` runs six stages sequentially. Each writes to `_data/`; later stages read from earlier stages, so they can be skipped via flags once intermediates are cached.

### 1. Global Java type registry — `parse.js: buildRegistry(allFiles)`

Walks every `src/main/java` across all configured services into a single FQN-keyed map of classes/records/enums and their field declarations. Cross-service DTO references resolve against this. Output:

- In-memory: `{ byFqn: Map<string, TypeRecord>, bySimpleName: Map<string, string[]>, javaFiles }`
- `_data/dtos.json` — JSON-serialisable view (Maps don't serialise, so it's flattened to `{ counts, byFqn }`).

A `TypeRecord` contains `{ fqn, simpleName, pkg, kind: 'class'|'record'|'enum'|'interface', typeParams, extendsName, file, fields[], enumValues[] }`. Fields carry `{ name, rawType, format, jsonName, ignored, validations[], description }` extracted from Bean Validation, Jackson and `@Schema` annotations.

### 2. Per-service backend parse — `parse.js: parseService(serviceDir, serviceId, registry)`

Per service:
1. Walks `src/main/java`, finds files containing `@RestController` / `@Controller`.
2. For each controller: extracts class-level `@RequestMapping` (base path), `@Tag` (area name + description), and the controller's package + imports (used to resolve simple-name DTO references).
3. Captures controller-level fields (`extractClassFields`) so response analysis can trace `<svc>.<method>(...)` calls.
4. For each handler method (`findHandlers`):
   - Extract mapping (`@GetMapping`, `@PostMapping`, …, `@RequestMapping(method=…)`) → `{ method, path, consumes, produces }`.
   - Parse parameter list with `parseParam`. Each parameter is classified by its annotations: `@PathVariable`, `@RequestHeader`, `@RequestParam`, `@RequestBody`, `Pageable`/`Sort` (sets `hasPageable`), or "filter DTO" — a non-annotated POJO with a name matching `(DTO|Dto|Filter|Request|Form|Params|Criteria|Query|Body)$` or `Request$`. For filter DTOs, the parser opens the DTO source and reads field declarations (`readDtoFields`/`lookupDto`) to expand them into individual query params.
   - Resolve `@RequestBody` types into a normalised schema (`resolveSchema`) and synthesise an example JSON (`synthesizeSample`).
   - Analyse the response (`analyzeResponse`):
     - Unwrap `ResponseEntity<T>`, `Mono<T>`, `Flux<T>`, `Optional<T>`, `Callable/Future/CompletableFuture<T>` (one layer).
     - Detect `Page<T>` / `Slice<T>` at the top level → set `paginated: true`.
     - If the result is a known wrapper (`ApiResponse`, `APIResponse`, `BaseResponse`, `Response`, `ResponseData`, `ResponseDTO`, or anything matching `Response(Data|DTO|Dto)?$`), drill into its first type arg.
     - If the wrapper is raw (no type arg), sniff the method body for `.setData(<expr>)` (`detectResponseDataType`) and infer the static type of `<expr>` from `new Foo(...)` or a local declaration in the method body.
     - If still unresolved, follow `<svc>.<method>(...)` calls into the service interface/impl (`traceThroughService`): the interface's parametric return type wins, otherwise repeat the `.setData` sniff inside the impl method body. Method bodies are parsed lazily and cached in `_METHOD_BODY_CACHE`.
     - Resolve to a schema and synthesise a sample.
   - Detect auth (`detectAuth`): `@PreAuthorize("...")`, `requestMeta.isValid*(...)` calls, or pattern-match `validateInstitutionScope|validateRosterScope|hasRole|hasAuthority` → `'custom'`. Else `null` (treated as "auth-free" by the categoriser).
   - Infer tags (`inferTags`): `paginated`, `export`, `summary`, `time-zone header`, lowercase verb, `lookup`.
5. Reads `pom.xml` (`readPomMeta`) for `artifactId`, `description`, `javaVersion`, and Spring Boot parent version.
6. Output: `_data/<serviceId>.spec.json` with `{ service, serviceDir, artifactId, description, javaVersion, springBoot, totalEndpoints, totalAreas, areas[] }`. Areas are sorted alphabetically; endpoints inside each area are sorted by `path + method`. Each endpoint has a stable `id` of the form `<serviceId>-ep-<n>`. After the build's render step, `coverage` stats are added to the spec.

### Schema resolution — `parse.js: resolveSchema(rawType, registry, ctx, depth, seen, subs)`

Used by both request-body and response analysis. Returns nodes shaped:

```
{ kind: 'object'|'array'|'map'|'enum'|'primitive'|'unknown'|'cycle'|'truncated'|'page',
  name, of?, key?, value?, fields?, values?, format?, validations?, fqn?, paginated? }
```

Behaviour:
- `Optional/Mono/Flux/ResponseEntity/Callable/Future/CompletableFuture<T>` unwrap one layer.
- `Page/Slice/PageImpl<T>` → `{ kind: 'page', of: <T> }`.
- Arrays `T[]` → `{ kind: 'array', of: <T> }`.
- `Map/HashMap/LinkedHashMap/TreeMap/ConcurrentHashMap<K,V>` → `{ kind: 'map', key, value }`.
- Collections (`List/Set/Collection/Iterable/Queue/Deque` + `Array`/`LinkedHash`/`Hash`/`Tree` variants) → `{ kind: 'array' }`.
- Type-param substitution: when expanding `Foo<T>` the resolver maintains a `subs` map and substitutes `T` recursively. Inherited fields from `extends` chains are collected with their own substitution chain (single inheritance).
- Cycle detection via `seen` set; depth cap `MAX_SCHEMA_DEPTH = 6`. Hits → `{ kind: 'cycle' | 'truncated' }`.
- Field metadata: `@NotNull/@NotBlank/@NotEmpty` → `required: true`; `@Size/@Pattern/@Email/@Min/@Max/@Decimal*/@Digits/@Positive*/@Negative*/@Past*/@Future*` collected verbatim; `@JsonProperty(value)` rewrites the JSON name; `@JsonIgnore` drops the field; `@DateTimeFormat`/`@JsonFormat` capture pattern; `@Schema(description, example)` populate doc text.
- Spring infrastructure types (`Pageable, Sort, MultipartFile, HttpServletRequest, …, Authentication, Principal, …`) resolve to `{ kind: 'unknown', name, note: 'spring' }` rather than recursing.
- Primitives and JSR-310 date types (`LocalDate`, `Instant`, `OffsetDateTime`, …) have hand-coded `{ jsonType, sample, format }` in `PRIMITIVE_INFO`. Sample dates are pinned to `2026-05-05` so output is deterministic.
- Sample synthesis (`synthesizeSample`) walks the schema and emits a `data`-shaped JSON example. Pages emit `{ content: [...], pageable, totalElements, totalPages, last, first, numberOfElements, size, number }`.

### 3. Frontend parse — `parse-frontend.js: parseTheme(themeDir)`

Walks `<theme>/src/**/*.ts` (skipping `*.spec.ts` and `node_modules`) and produces `_data/frontend.json` with four sections:

- **`endpoints`** — `{ file, map }`. `parseEndpointsTs` reads `src/environments/endpoints.ts` and pulls every `key: '/path'` literal whose value starts with `/`, ignoring `apiEndPoint` and `serverUrl`. First definition wins on duplicates.
- **`services[]`** — every `*.service.ts` containing `this.http.<verb>(…)`. Each is `{ file, classes: [{ class, calls: [{ verb, endpointKey?, transforms?, line, literalUrl?, expr?, unresolved? }] }] }`.
  - URL resolution attempts three strategies in order:
    1. Inline references in the call's first argument (`environment.apiEndPoint.<key>`, including `${…}` template literals — note the special-case template-literal preservation in `stripComments`).
    2. If the first arg is a bare identifier, walk the smallest enclosing `{...}` block (`findEnclosingBlock`) and resolve to a local `const|let|var <name> = …` or `this.<field> = …` assignment containing endpoint refs.
    3. Fallback: any endpoint refs anywhere in the enclosing scope (deliberately permissive — accepts overcounting for multi-call methods).
  - Calls that don't resolve fall through with `unresolved: true` and the literal URL (or the first 120 chars of the expression) for diagnosis.
  - `transforms[]` records `'replace'` (`.replace('#', val)`), `'concat'` (`+`), or `'template'` (`${…}`) — purely informational.
- **`components[]`** — every `*.component.ts`, `*.guard.ts`, `*.resolver.ts`. For each class with a `constructor(...)`, the constructor params are matched against `knownServices` (the set of class names from the services step). Output is `{ file, classes: [{ class, injects: [serviceClassName] }] }`.
- **`routes[]`** — flat list. Starts at `src/app/app-routing.module.ts`, recursively follows `loadChildren` (string form `"app/admin/admin.module#AdminModule"` and the import-syntax `() => import('…').then(m => m.X)`), and parses every `Routes = [...]` / `Route.withShell([...])` array (`parseRouteObject`). Lazy-loaded modules resolve via `resolveLoadChildren`/`findRoutingSibling` (looks for `*-routing.module.ts` siblings). Any `*-routing` files not reached via the lazy chain get folded in afterwards and flagged `_orphan: true`. Each route is `{ path, title, component, guards, file }` with `path` already prefix-joined to its parent route.

The TypeScript parser uses the same regex-not-AST playbook as the Java parser, with one notable extra: `stripComments` preserves template-literal `${…}` expressions verbatim so endpoint refs inside template strings remain visible.

### 4. Cross-reference — `xref.js: buildXref()`

Joins `_data/frontend.json` to every `_data/<svc>.spec.json` via the `frontendPrefix` declared in `services.json` (longest-prefix wins). Path matching is **placeholder-tolerant and segment-aware**: `splitPath` splits on `/` (keeping colon-verbs like `/foo:export` attached to the trailing segment), and `pathMatches` allows any segment that is a placeholder (`{id}` on the catalogue side, `{x}` or `#` on the frontend side) to match any literal — but requires equal segment counts.

For every endpoint key in `endpoints.ts`:
- Try each service's prefixes; on match, look up the path tail in the service's `buildPathIndex` (bucketed by segment count).
- Record `{ service, urlPath, candidates: [...] }` with all template matches, or `noPathMatch: true` if no matches in the right bucket.
- If no service prefix matches at all → `{ unrouted: true, urlPath, prefix }`. The known unrouted prefixes (`/analytics/v1`, `/reader/v1`, `/notification/v1`, `/site/v1`) are also listed in `services.json:$unmappedPrefixes` for visibility.

For every page in `frontend.routes`:
- Look up the route's `component` in the `componentToServices` map → list of injected services.
- For each injected service, expand its calls to the resolved endpoint candidates. Pick the candidate whose verb matches the call's verb; if none match, take the first candidate and flag `verbMismatch: true`.
- Dedup by `endpointId|verb` so a page injecting multiple services that all hit the same endpoint shows it once.
- Build the reverse index `endpointUsage`: `endpointId → [{ pageId, route, title, viaService }]`. The renderer's "Used by" section reads this directly.

Output `_data/xref.json` shape:
```
{
  pages: [{ id: 'page-N', route, title, component, componentFile, guards[],
            apiCalls: [{ via, verb, service, endpointId, path, area, key, verbMismatch }
                      | { via, verb, key, urlPath, unrouted: true }
                      | { via, verb, service, urlPath, key, noPathMatch: true }],
            injects: [serviceClass] }],
  endpointUsage: { endpointId: [{ pageId, route, title, viaService }] },
  stats: { totalPages, totalCalls, resolvedCalls, matchRate, totalEndpointKeys }
}
```

`renderReport(result)` writes `_data/xref-report.md` with headline numbers, per-prefix routing status, top unrouted URLs, heaviest service classes, and path-match misses. **Read this file first when debugging** — it surfaces nearly every "missing endpoint" / "missing UI consumer" problem in one place.

### 5. Categorise — `categorize.js: categorizeAll(services, xref, toolsDir)`

Assigns every endpoint to one of `pre-login | dashboard | admin | my-team-space | uncategorized`. Mutates each `endpoint` object in memory with `{ category, categoryReason }` — does **not** rewrite spec files, so categorisation re-runs cheaply on every build.

Heuristic order (first match wins, see `categorizeEndpoint`):

1. **Override** in `tools/categories.json:overrides` (key `<serviceId>:<METHOD>:<path>`, value any category, or `'none'` to force `uncategorized`).
2. **Pre-login** when `endpoint.auth == null` AND (path matches `preLoginPathPattern` OR area name is in `preLoginAreas`).
3. **Admin** when any consuming UI page's route matches a prefix in `routePrefixes.admin`.
4. **My-team-space** when any consuming UI page's route matches a prefix in `routePrefixes.my-team-space`.
5. **Dashboard** when any consuming UI page's route matches a prefix in `routePrefixes.dashboard`.
6. **Admin** when path matches `adminPathPattern` (catches internal admin endpoints not consumed by any `/admin/*` page).
7. **Admin** when area is in `adminAreas` or matches `adminAreaPattern`.
8. **Dashboard** when area is in `dashboardAreas`.
9. **Dashboard** fallback when there's at least one UI consumer (any route).
10. **Uncategorized** otherwise.

Override keys that match no endpoint print `[categorize] WARN`. The summary used by the renderer is `{ counts, descriptions }`. Edit `categories.json` and rerun with `--no-parse --no-frontend` for fast iteration.

### 6. Render — `render.js` + `template.js`

All output is plain string concatenation. There is no templating engine; do not introduce one.

Per build:
- `buildGlobalIndex(services, xref)` — flat array of every endpoint + every page + every category, used by the Cmd-K palette across all pages. Each output HTML embeds it via the placeholder swap in `build.js: renderAll`:
  ```js
  html.replace('window.__GLOBAL_INDEX__ = null;', 'window.__GLOBAL_INDEX__ = ' + JSON.stringify(globalIndex) + ';')
  ```
- `renderService(spec, services, currentServiceId, xref, totals)` — one HTML per backend service.
- `renderPages(xref, services, totals)` — `pages.html`, every Angular route grouped by top-level URL segment with the API calls each consumes.
- `renderCategoryPage(cat, services, xref, totals)` — one per category, with client-side text+method+service filtering.
- `renderIndex(services, totals, xref)` — landing page with hero search trigger, service cards (method breakdown, top areas, category coverage dots), category tiles, coverage panel.

`template.js` exports `{ FONTS, CSS, SCRIPT, APPBAR, PALETTE, escapeHtml, escapeAttr }`. The Cmd-K palette, theme toggle (light/dark, persisted in `localStorage` under `phx-theme`), JSON syntax highlighting, and copy-JSON buttons are all in `SCRIPT`. The aesthetic is Swagger/Stripe-style dense rows: Inter sans, JetBrains Mono for paths/code, method-coloured left border on each endpoint row.

`render.js` also computes coverage (`computeCoverage`): % of endpoints with a body that resolved to a request schema, % with a resolved response schema, % consumed by at least one UI page.

## Configuration files

### `tools/services.json`

Registers each backend. Order = sidebar order on the index page.

```json
{ "id": "<serviceId>",                // becomes file name <id>.html and id prefix <id>-ep-<n>
  "dir": "<sibling-dir-name>",        // resolved as ../<dir> from api-catalogue/
  "displayName": "<human name>",
  "blurb": "<one-line>",
  "frontendPrefix": ["/foo/v1", ...]  // prefixes to strip from endpoints.ts URLs (longest match wins);
                                      // empty array = ETL-only services with no UI footprint
}
```

`$unmappedPrefixes` is a list of frontend prefixes known to point at services not catalogued here (`/analytics/v1`, `/reader/v1`, `/notification/v1`, `/site/v1`). Acknowledged debt — not consumed by code.

### `tools/categories.json`

All categorisation knobs. Top-level keys:
- `overrides` — exact `<serviceId>:<METHOD>:<path>` → category. Use sparingly for one-offs.
- `routePrefixes.{admin,my-team-space,dashboard}` — UI route prefixes that imply each category.
- `preLoginPathPattern` — regex on endpoint path for auth-free endpoints.
- `preLoginAreas` — area names that imply pre-login.
- `adminPathPattern` — regex on endpoint path.
- `adminAreaPattern` — regex on area name.
- `adminAreas`, `dashboardAreas` — exact area-name matches.
- `categoryDescriptions` — human descriptions used on category tiles and category pages.

Prefer adjusting prefixes/regex over adding overrides. Re-run with `--no-parse --no-frontend` to iterate.

## Conventions baked into the parsers

These are deliberate choices — don't change them without a strong reason:

- **Regex over AST.** Both `parse.js` and `parse-frontend.js` use regex + balanced-bracket walks rather than full ASTs. Spring annotations and Angular decorators are predictable enough that AST parsing buys little for substantial complexity. When a pattern doesn't match, the parser degrades to "see source" / `kind: 'unknown'` rather than failing the build. `java-parser` is in `package.json` but is not used on the hot path; it's a leftover dep that can be deleted if no future feature lands.
- **Comment stripping preserves length.** Both parsers' `stripComments` replaces stripped chars with spaces (and template-literal expressions are kept verbatim) so byte offsets remain valid against the original source for line-number reporting and balanced-paren walks.
- **Filter DTOs are bound by getters.** A non-annotated POJO param in a Spring handler signature is treated as a query-param bag; `lookupDto` opens the DTO file and reads field declarations (Lombok `@Getter`/`@Setter` assumed). The DTO file is located by import-FQN match → same-package match → `<pkg>.dto.<simpleName>` → any same-name file in the registry.
- **Path matching is segment-aware.** `xref.js: pathMatches` allows placeholder ↔ literal substitution per segment but requires equal segment counts. Colon-verb suffixes (`/foo:export`) stay attached to the trailing segment.
- **Stable, deterministic output.** Areas sort alphabetically, endpoints sort by `path + method`, sample dates are pinned to `2026-05-05`. This keeps diffs tight when regenerating.
- **No dot-files or hidden inputs.** All inputs are explicit: source repos as siblings, `services.json`, `categories.json`. There are no environment variables.

## Common debugging routes

When something doesn't appear in the output, in order of likelihood:

1. **Service repo not checked out as a sibling.** Look for `[skip] <id>: <path> not found` in the build log.
2. **Unmatched frontend prefix.** Open `_data/xref-report.md` "Per-prefix routing" section. If a prefix shows `NO — no catalogued service uses this prefix`, either add a `frontendPrefix` to `services.json` (and check out the service) or accept it as an unmapped prefix (already in `$unmappedPrefixes` for the well-known ones).
3. **Path divergence between frontend and backend.** Same report, "Path-match misses" section, lists every endpoint key that routed to a service but found no path match — usually means a frontend constant is stale or a backend route was renamed.
4. **Endpoint mis-categorised.** `[categorize] <total> · pre-login=N · dashboard=N · admin=N · my-team-space=N · uncategorized=N` is logged each build. Adjust `tools/categories.json` (prefer prefixes/regex; use overrides for true one-offs) and rerun with `--no-parse --no-frontend` for a fast render-only iteration.
5. **DTO field missing or wrong.** Check `_data/dtos.json` for the type — if `fields` is empty, the field-extraction regex didn't pick it up. Common causes: the field is declared without an explicit visibility modifier, has annotations spread over multiple lines in an unusual shape, or the type is generic in a way the schema resolver caps at depth 6 (`{ kind: 'truncated' }`) or detects as a cycle (`{ kind: 'cycle' }`).
6. **Response type unresolved.** Look at `_data/<service>.spec.json` for the endpoint's `response.shape`. If it's a string like `someService.someMethod(...)` rather than a concrete type, the controller's `.setData(...)` sniff and the service-trace fallback both failed. Either annotate the wrapper differently in source or accept the unresolved state.

## What NOT to do

- Don't rewrite the parsers to use a real AST without a concrete win to justify the complexity. The current approach is well-tuned to this codebase.
- Don't introduce a templating engine, build system, or framework. The HTML output is intentionally self-contained, vanilla, and zero-runtime.
- Don't add tests as cosmetic infrastructure. The pipeline is its own integration test — the build either produces sensible output for thousands of endpoints or it doesn't.
- Don't write to backend or frontend source dirs. The catalogue is read-only with respect to its inputs.
- Don't change `_data/*.spec.json` ID schemes (`<serviceId>-ep-<n>`) — the per-endpoint anchors in HTML and the `endpointUsage` reverse index depend on stability.
