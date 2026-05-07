#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Orchestrator. Reads tools/services.json, parses every service into
 * _data/<id>.spec.json, parses the Angular theme into _data/frontend.json,
 * joins them via xref.js into _data/xref.json, then renders <id>.html for
 * each plus the index.html and pages.html.
 *
 *   node build.js                  # parse + xref + render everything
 *   node build.js --no-parse       # skip backend parse (uses cached specs)
 *   node build.js --no-frontend    # skip frontend parse + xref
 *   node build.js --service=<id>   # parse + render just one backend service
 */

const fs   = require('fs');
const path = require('path');
const { parseService, buildRegistry, walkJava }           = require('./parse');
const { parseTheme }                                      = require('./parse-frontend');
const { buildXref, renderReport }                         = require('./xref');
const { renderService, renderIndex, renderPages, renderCategoryPage, renderOrphans, renderAuthCoverage, renderTagsView, buildGlobalIndex, buildEpXref, buildPageXref } = require('./render');
const { categorizeAll }                                   = require('./categorize');

const ROOT      = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..');
const DATA_DIR  = path.join(ROOT, '_data');
const OUT_DIR   = ROOT;
const THEME_DIR = path.resolve(REPO_ROOT, 'medlern-enduser-solution-theme-blackdog');

const args = process.argv.slice(2);
const noParse    = args.includes('--no-parse');
const noFrontend = args.includes('--no-frontend');
const onlyArg    = args.find(a => a.startsWith('--service='));
const onlyId     = onlyArg ? onlyArg.split('=')[1] : null;

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));
const services = cfg.services;

fs.mkdirSync(DATA_DIR, { recursive: true });

function specPath(id)   { return path.join(DATA_DIR, `${id}.spec.json`); }
function frontendPath() { return path.join(DATA_DIR, 'frontend.json'); }
function xrefPath()     { return path.join(DATA_DIR, 'xref.json'); }
function reportPath()   { return path.join(DATA_DIR, 'xref-report.md'); }
function dtosPath()     { return path.join(DATA_DIR, 'dtos.json'); }

function buildGlobalRegistry() {
  const allFiles = [];
  for (const s of services) {
    const sourceDir = path.join(REPO_ROOT, s.dir);
    const javaRoot  = path.join(sourceDir, 'src', 'main', 'java');
    if (!fs.existsSync(javaRoot)) continue;
    allFiles.push(...walkJava(javaRoot));
  }
  const t0 = Date.now();
  const registry = buildRegistry(allFiles);
  console.log(`[registry] ${registry.byFqn.size} types from ${allFiles.length} java files · ${Date.now() - t0}ms`);
  return registry;
}

function writeDtosJson(registry) {
  // Plain-JSON view of the registry (Maps don't serialize). Renderer/debug tooling can read this.
  const byFqn = {};
  for (const [fqn, rec] of registry.byFqn.entries()) {
    byFqn[fqn] = {
      fqn:         rec.fqn,
      simpleName:  rec.simpleName,
      pkg:         rec.pkg,
      kind:        rec.kind,
      typeParams:  rec.typeParams,
      extendsName: rec.extendsName,
      enumValues:  rec.enumValues,
      fields:      (rec.fields || []).map(f => ({
        name: f.name, rawType: f.rawType, format: f.format || null,
        jsonName: f.jsonName || null, ignored: !!f.ignored,
        validations: f.validations || [], description: f.description || null
      }))
    };
  }
  fs.writeFileSync(dtosPath(), JSON.stringify({
    counts: {
      total: registry.byFqn.size,
      enums: Array.from(registry.byFqn.values()).filter(r => r.kind === 'enum').length,
      records: Array.from(registry.byFqn.values()).filter(r => r.kind === 'record').length,
      classes: Array.from(registry.byFqn.values()).filter(r => r.kind === 'class').length
    },
    byFqn
  }, null, 2));
}

function parseAll(registry) {
  for (const s of services) {
    if (onlyId && s.id !== onlyId) continue;
    const sourceDir = path.join(REPO_ROOT, s.dir);
    if (!fs.existsSync(sourceDir)) {
      console.warn(`[skip] ${s.id}: ${sourceDir} not found`);
      continue;
    }
    const t0 = Date.now();
    const spec = parseService(sourceDir, s.id, registry);
    // Coverage stats per service
    let withReq = 0, totalReq = 0, withResp = 0, totalEp = 0;
    for (const a of spec.areas) {
      for (const e of a.endpoints) {
        totalEp++;
        if (e.requestBody) {
          totalReq++;
          if (e.requestBody.resolved && e.requestBody.resolved.kind && e.requestBody.resolved.kind !== 'unknown') withReq++;
        }
        if (e.response && e.response.resolved && e.response.resolved.kind && e.response.resolved.kind !== 'unknown') withResp++;
      }
    }
    spec.coverage = { totalEndpoints: totalEp, totalRequestBodies: totalReq, resolvedRequest: withReq, resolvedResponse: withResp };
    fs.writeFileSync(specPath(s.id), JSON.stringify(spec, null, 2));
    const reqPct  = totalReq ? Math.round((withReq / totalReq) * 100) : 0;
    const respPct = totalEp ? Math.round((withResp / totalEp) * 100) : 0;
    console.log(`[parse] ${s.id.padEnd(22)} ${spec.totalEndpoints.toString().padStart(4)} endpoints · ${spec.totalAreas.toString().padStart(3)} areas · req ${reqPct}% · resp ${respPct}% · ${Date.now() - t0}ms`);
  }
}

function parseFrontendStep() {
  if (!fs.existsSync(THEME_DIR)) {
    console.warn(`[skip] frontend: ${THEME_DIR} not found`);
    return false;
  }
  const t0 = Date.now();
  const result = parseTheme(THEME_DIR);
  fs.writeFileSync(frontendPath(), JSON.stringify(result, null, 2));
  const stats = {
    endpoints: Object.keys(result.endpoints.map).length,
    services:  result.services.length,
    httpCalls: result.services.reduce((n, s) => n + s.classes.reduce((m, c) => m + c.calls.length, 0), 0),
    components: result.components.length,
    routes: result.routes.length
  };
  console.log(`[frontend] ${stats.endpoints} keys · ${stats.services} services · ${stats.httpCalls} calls · ${stats.components} components · ${stats.routes} routes · ${Date.now() - t0}ms`);
  return true;
}

function xrefStep() {
  const t0 = Date.now();
  const result = buildXref();
  fs.writeFileSync(xrefPath(), JSON.stringify(result.xref, null, 2));
  fs.writeFileSync(reportPath(), renderReport(result));
  console.log(`[xref]    ${result.xref.stats.totalPages} pages · ${result.xref.stats.totalCalls} calls · ${result.xref.stats.matchRate}% routed (${result.xref.stats.resolvedCalls} resolved) · ${Date.now() - t0}ms`);
  return result.xref;
}

function loadSpecs() {
  for (const s of services) {
    try { s.spec = JSON.parse(fs.readFileSync(specPath(s.id), 'utf8')); }
    catch { s.spec = null; }
  }
}

function renderAll(xref) {
  loadSpecs();
  const catSummary = categorizeAll(services, xref, __dirname);
  const total = Object.values(catSummary.counts).reduce((a, b) => a + b, 0);
  const fmt = c => `${c}=${catSummary.counts[c] || 0}`;
  console.log(`[categorize] ${total} endpoints · ` + ['pre-login','dashboard','admin','my-team-space','uncategorized'].map(fmt).join(' · '));
  const globalIndex = buildGlobalIndex(services, xref);
  const epXref      = xref ? buildEpXref(xref)   : {};
  const pageXref    = xref ? buildPageXref(xref)  : [];
  const totals = {
    endpoints: services.reduce((n, s) => n + (s.spec?.totalEndpoints ?? 0), 0),
    areas:     services.reduce((n, s) => n + (s.spec?.totalAreas ?? 0), 0),
    categories: catSummary.counts,
    categoryDescriptions: catSummary.descriptions
  };
  const replaceIndex = html =>
    html.replace('window.__GLOBAL_INDEX__ = null;', `window.__GLOBAL_INDEX__ = ${JSON.stringify(globalIndex)};`);
  const replaceHomeData = html =>
    html
      .replace('window.__EP_XREF__ = null;',   `window.__EP_XREF__ = ${JSON.stringify(epXref)};`)
      .replace('window.__PAGE_XREF__ = null;',  `window.__PAGE_XREF__ = ${JSON.stringify(pageXref)};`);

  // Per-service pages
  for (const s of services) {
    if (onlyId && s.id !== onlyId) continue;
    if (!s.spec) { console.warn(`[skip] ${s.id}: no spec`); continue; }
    const html = replaceIndex(renderService(s.spec, services, s.id, xref, totals));
    fs.writeFileSync(path.join(OUT_DIR, `${s.id}.html`), html);
    console.log(`[render]  ${s.id}.html · ${(html.length/1024).toFixed(1)}KB`);
  }

  if (onlyId) return;

  // Pages page (only if xref data is available)
  if (xref) {
    const html = replaceIndex(renderPages(xref, services, totals));
    fs.writeFileSync(path.join(OUT_DIR, 'pages.html'), html);
    console.log(`[render]  pages.html · ${(html.length/1024).toFixed(1)}KB · ${xref.pages.length} pages`);
  }

  // Category pages (one per category)
  for (const cat of ['pre-login', 'dashboard', 'admin', 'my-team-space']) {
    const html = replaceIndex(renderCategoryPage(cat, services, xref, totals));
    fs.writeFileSync(path.join(OUT_DIR, `category-${cat}.html`), html);
    console.log(`[render]  category-${cat}.html · ${(html.length/1024).toFixed(1)}KB · ${totals.categories[cat] || 0} endpoints`);
  }

  // New first-class views (require xref for orphans; the others gracefully degrade)
  if (xref) {
    const orphansHtml = replaceIndex(renderOrphans(services, xref, totals));
    fs.writeFileSync(path.join(OUT_DIR, 'orphans.html'), orphansHtml);
    console.log(`[render]  orphans.html · ${(orphansHtml.length/1024).toFixed(1)}KB`);
  }
  const authHtml = replaceIndex(renderAuthCoverage(services, xref, totals));
  fs.writeFileSync(path.join(OUT_DIR, 'auth-coverage.html'), authHtml);
  console.log(`[render]  auth-coverage.html · ${(authHtml.length/1024).toFixed(1)}KB`);

  const tagsHtml = replaceIndex(renderTagsView(services, xref, totals));
  fs.writeFileSync(path.join(OUT_DIR, 'tags.html'), tagsHtml);
  console.log(`[render]  tags.html · ${(tagsHtml.length/1024).toFixed(1)}KB`);

  // Index
  const html = replaceHomeData(replaceIndex(renderIndex(services, totals, xref)));
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
  console.log(`[render]  index.html · ${(html.length/1024).toFixed(1)}KB · ${globalIndex.length} entries in global index`);
}

// ─────────────────────────────────────────────────────────────────────────

let registry = null;
if (!noParse) {
  registry = buildGlobalRegistry();
  writeDtosJson(registry);
  parseAll(registry);
}
let xref = null;
if (!noFrontend && !onlyId) {
  if (parseFrontendStep()) {
    xref = xrefStep();
  }
} else {
  // try to load cached xref
  try { xref = JSON.parse(fs.readFileSync(xrefPath(), 'utf8')); } catch {}
}
renderAll(xref);
