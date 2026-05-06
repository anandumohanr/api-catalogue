#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Cross-reference joiner.
 *
 * Inputs:
 *   - _data/frontend.json           (from parse-frontend.js)
 *   - _data/<svc>.spec.json × N     (from parse.js, per service)
 *   - tools/services.json           (with frontendPrefix per service)
 *
 * Output:
 *   - _data/xref.json
 *   - _data/xref-report.md          (human-readable build summary)
 *
 * Usage:  node xref.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '_data');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));
const services = cfg.services;

// ─────────────────────────────────────────────────────────────────────────
// Path-pattern matching
// ─────────────────────────────────────────────────────────────────────────

/** Split a path into a (count, segs[]) pair, treating `:verb` as a separate segment. */
function splitPath(p) {
  if (!p || p === '/') return { count: 0, segs: [] };
  // `/foo:export` — keep the colon-verb attached to the last segment as-is.
  // `/foo/{x}/bar` — split normally.
  const segs = p.replace(/^\/+/, '').replace(/\/+$/, '').split('/');
  return { count: segs.length, segs };
}

/** Is this segment a placeholder? (catalogue `{job}`, frontend `{id}`, or bare `#`.) */
function isPlaceholder(seg) {
  if (!seg) return false;
  if (seg === '#') return true;
  if (seg.startsWith('{') && seg.endsWith('}')) return true;
  return false;
}

/** True if a frontend path is compatible with a catalogue path under template matching. */
function pathMatches(frontendSegs, catalogueSegs) {
  if (frontendSegs.length !== catalogueSegs.length) return false;
  for (let i = 0; i < frontendSegs.length; i++) {
    const f = frontendSegs[i];
    const c = catalogueSegs[i];
    if (isPlaceholder(c) || isPlaceholder(f)) continue;
    if (f === c) continue;
    // Some catalogue paths have colon-verb suffix like `/foo:export`. The frontend may
    // also encode an enum value or a placeholder mid-path. We allow exact-string match
    // only when neither side is a placeholder.
    return false;
  }
  return true;
}

/** Strip a frontend prefix (longest match wins). Returns the path tail or null. */
function stripPrefix(url, prefixes) {
  let best = null;
  for (const p of prefixes) {
    if (url === p || url.startsWith(p + '/') || url.startsWith(p + ':')) {
      if (!best || p.length > best.length) best = p;
    }
  }
  return best == null ? null : url.slice(best.length);
}

// ─────────────────────────────────────────────────────────────────────────
// Build per-service path → endpointId index from the API catalogue specs
// ─────────────────────────────────────────────────────────────────────────

function loadServiceCatalogue(svc) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${svc.id}.spec.json`), 'utf8'));
  } catch { return null; }
}

function buildPathIndex(spec) {
  // Bucket by segment count for cheap lookup, then template-match within bucket.
  const buckets = new Map();   // count → [{ method, path, segs, id, area, summary }]
  for (const a of spec.areas || []) {
    for (const e of a.endpoints || []) {
      const { count, segs } = splitPath(e.path);
      const list = buckets.get(count) || [];
      list.push({ method: e.method, path: e.path, segs, id: e.id, area: a.name, summary: e.summary });
      buckets.set(count, list);
    }
  }
  return buckets;
}

function lookupPath(buckets, frontendTail) {
  const { count, segs } = splitPath(frontendTail || '/');
  const bucket = buckets.get(count) || [];
  return bucket.filter(c => pathMatches(segs, c.segs));
}

// ─────────────────────────────────────────────────────────────────────────
// Main join
// ─────────────────────────────────────────────────────────────────────────

function buildXref() {
  const frontend = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'frontend.json'), 'utf8'));
  const endpointMap = frontend.endpoints.map;

  // Per-service path index
  const svcIndexes = new Map();
  for (const s of services) {
    const spec = loadServiceCatalogue(s);
    if (!spec) continue;
    svcIndexes.set(s.id, { svc: s, spec, idx: buildPathIndex(spec) });
  }

  // For each endpoint key in endpoints.ts, resolve to (service, endpointId) if possible.
  // Some keys may match no service (e.g. /analytics/v1) — record under "unrouted".
  const keyResolution = {};       // key → { service, method?, endpointId, urlPath } or { unrouted: true, urlPath, prefix }
  let unmappedPrefixCounts = {};
  let mappedPrefixCounts   = {};

  for (const [key, urlPath] of Object.entries(endpointMap)) {
    let routed = false;
    for (const [svcId, { svc, idx }] of svcIndexes) {
      const tail = stripPrefix(urlPath, svc.frontendPrefix || []);
      if (tail == null) continue;
      const matches = lookupPath(idx, tail);
      keyResolution[key] = matches.length
        ? { service: svcId, urlPath, candidates: matches }
        : { service: svcId, urlPath, candidates: [], noPathMatch: true };
      mappedPrefixCounts[svc.frontendPrefix.find(p => urlPath.startsWith(p))] =
        (mappedPrefixCounts[svc.frontendPrefix.find(p => urlPath.startsWith(p))] || 0) + 1;
      routed = true;
      break;
    }
    if (!routed) {
      // record the prefix for diagnosis
      const m = urlPath.match(/^(\/[^/]+\/v\d+)/);
      const pref = m ? m[1] : urlPath.split('/').slice(0, 2).join('/');
      unmappedPrefixCounts[pref] = (unmappedPrefixCounts[pref] || 0) + 1;
      keyResolution[key] = { unrouted: true, urlPath, prefix: pref };
    }
  }

  // Build serviceClass → calls index
  const serviceClassToCalls = new Map();   // ServiceClass → [{ verb, key, endpointId? }]
  for (const s of frontend.services) {
    for (const c of s.classes) {
      const arr = [];
      for (const call of c.calls) {
        if (!call.endpointKey) {
          arr.push({ verb: call.verb, unresolved: true, line: call.line, expr: call.expr || call.literalUrl });
          continue;
        }
        const r = keyResolution[call.endpointKey];
        if (!r || r.unrouted) {
          arr.push({ verb: call.verb, key: call.endpointKey, urlPath: r?.urlPath, unrouted: true });
          continue;
        }
        // Pick the matching method+path from candidates
        const match = r.candidates.find(cand => cand.method === call.verb)
                   || r.candidates[0];
        if (!match) {
          arr.push({ verb: call.verb, key: call.endpointKey, urlPath: r.urlPath, noPathMatch: true });
        } else {
          arr.push({
            verb: call.verb,
            key: call.endpointKey,
            urlPath: r.urlPath,
            service: r.service,
            endpointId: match.id,
            cataloguePath: match.path,
            area: match.area,
            verbMismatch: match.method !== call.verb
          });
        }
      }
      serviceClassToCalls.set(c.class, arr);
    }
  }

  // Build component → set of services it injects
  const componentToServices = new Map();
  for (const c of frontend.components) {
    for (const cls of c.classes) {
      componentToServices.set(cls.class, { injects: cls.injects, file: c.file });
    }
  }

  // Build pages: route → component → injects → calls (deduped & merged)
  const pages = [];
  const endpointUsage = new Map();     // endpointId → [{ pageId, route, title }]
  const unroutedUsage = new Map();     // urlPath → count

  let pageIdSeq = 0;
  for (const r of frontend.routes) {
    const pageId = 'page-' + (++pageIdSeq);
    const compInfo = componentToServices.get(r.component);
    const injects = compInfo ? compInfo.injects : [];
    const componentFile = compInfo ? compInfo.file : null;

    const apiCalls = [];
    const seen = new Set();
    const unresolvedLocal = [];

    for (const svcCls of injects) {
      const calls = serviceClassToCalls.get(svcCls) || [];
      for (const call of calls) {
        if (call.unresolved) continue;
        if (call.unrouted) {
          unroutedUsage.set(call.urlPath, (unroutedUsage.get(call.urlPath) || 0) + 1);
          const key = `unrouted|${call.verb}|${call.urlPath}`;
          if (!seen.has(key)) {
            seen.add(key);
            apiCalls.push({ via: svcCls, verb: call.verb, urlPath: call.urlPath, key: call.key, unrouted: true });
          }
          continue;
        }
        if (call.noPathMatch || !call.endpointId) {
          // Routed to a known service but path doesn't match any catalogued endpoint
          // (likely stale frontend entry or recently-removed backend route).
          const key = `nopath|${call.verb}|${call.urlPath}`;
          if (!seen.has(key)) {
            seen.add(key);
            apiCalls.push({ via: svcCls, verb: call.verb, service: call.service, urlPath: call.urlPath, key: call.key, noPathMatch: true });
          }
          continue;
        }
        const key = `${call.endpointId}|${call.verb}`;
        if (seen.has(key)) continue;
        seen.add(key);
        apiCalls.push({
          via: svcCls,
          verb: call.verb,
          service: call.service,
          endpointId: call.endpointId,
          path: call.cataloguePath,
          area: call.area,
          key: call.key,
          verbMismatch: call.verbMismatch || false
        });
        // reverse index
        const lst = endpointUsage.get(call.endpointId) || [];
        lst.push({ pageId, route: r.path, title: r.title, viaService: svcCls });
        endpointUsage.set(call.endpointId, lst);
      }
    }

    pages.push({
      id: pageId,
      route: r.path,
      title: r.title || null,
      component: r.component,
      componentFile,
      guards: r.guards || [],
      apiCalls,
      injects
    });
  }

  // Compute summary stats
  const totalPages = pages.length;
  const totalCalls = pages.reduce((n, p) => n + p.apiCalls.length, 0);
  const resolvedCalls = pages.reduce((n, p) => n + p.apiCalls.filter(c => !c.unrouted).length, 0);
  const matchRate = totalCalls ? (resolvedCalls / totalCalls * 100).toFixed(1) : '–';

  return {
    xref: {
      pages,
      endpointUsage: Object.fromEntries(endpointUsage),
      stats: { totalPages, totalCalls, resolvedCalls, matchRate, totalEndpointKeys: Object.keys(endpointMap).length }
    },
    keyResolution,
    diagnostics: {
      unmappedPrefixCounts,
      mappedPrefixCounts,
      unroutedUsageTopN: Array.from(unroutedUsage.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 30),
      serviceCalls: Array.from(serviceClassToCalls.entries()).map(([cls, arr]) => ({ class: cls, calls: arr.length, resolved: arr.filter(a => a.endpointId).length })).sort((a,b)=>b.calls-a.calls).slice(0,15)
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────

function renderReport(result) {
  const { xref, keyResolution, diagnostics } = result;
  const lines = [];
  lines.push('# UI ↔ API cross-reference build report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().slice(0,16).replace('T',' ')}`);
  lines.push('');
  lines.push('## Headline numbers');
  lines.push('');
  lines.push(`- Pages: **${xref.stats.totalPages}**`);
  lines.push(`- Total API call references across all pages: **${xref.stats.totalCalls}**`);
  lines.push(`- Resolved to a catalogued endpoint: **${xref.stats.resolvedCalls}** (${xref.stats.matchRate}%)`);
  lines.push(`- Endpoint keys in endpoints.ts: ${xref.stats.totalEndpointKeys}`);
  lines.push('');
  lines.push('## Per-prefix routing');
  lines.push('');
  lines.push('| Prefix | Endpoint keys | Routed? |');
  lines.push('|---|---:|---|');
  const allPrefixes = new Set([...Object.keys(diagnostics.mappedPrefixCounts), ...Object.keys(diagnostics.unmappedPrefixCounts)]);
  for (const pref of [...allPrefixes].sort()) {
    const mapped = diagnostics.mappedPrefixCounts[pref] || 0;
    const unmapped = diagnostics.unmappedPrefixCounts[pref] || 0;
    lines.push(`| \`${pref}\` | ${mapped + unmapped} | ${unmapped ? 'NO — no catalogued service uses this prefix' : 'yes'} |`);
  }
  lines.push('');
  if (diagnostics.unroutedUsageTopN.length) {
    lines.push('## Top unrouted endpoint URLs (frontend uses, no catalogued service)');
    lines.push('');
    for (const [url, count] of diagnostics.unroutedUsageTopN) {
      lines.push(`- \`${url}\`  · ${count} reference${count === 1 ? '' : 's'}`);
    }
    lines.push('');
  }
  lines.push('## Heaviest API consumers (top service classes by call count)');
  lines.push('');
  lines.push('| Service class | Calls | Resolved |');
  lines.push('|---|---:|---:|');
  for (const r of diagnostics.serviceCalls) {
    lines.push(`| ${r.class} | ${r.calls} | ${r.resolved} |`);
  }
  lines.push('');
  lines.push('## Path-match misses (key in endpoints.ts but no matching catalogue path)');
  lines.push('');
  const noMatch = Object.entries(keyResolution).filter(([_, v]) => v.noPathMatch);
  if (noMatch.length === 0) lines.push('_None._');
  else for (const [k, v] of noMatch.slice(0, 30)) {
    lines.push(`- \`${k}\` → \`${v.urlPath}\` (would be routed to \`${v.service}\`)`);
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const t0 = Date.now();
  const result = buildXref();
  fs.writeFileSync(path.join(DATA_DIR, 'xref.json'), JSON.stringify(result.xref, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'xref-report.md'), renderReport(result));
  console.log(`[xref] ${result.xref.stats.totalPages} pages · ${result.xref.stats.totalCalls} calls · ${result.xref.stats.matchRate}% resolved · ${Date.now() - t0}ms`);
  console.log(`[xref] wrote _data/xref.json + xref-report.md`);
}

module.exports = { buildXref, renderReport };
