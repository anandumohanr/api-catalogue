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

/** Split a segment into [base, colonSuffix] so `{auditId}:publish` → ['{auditId}', ':publish']. */
function segmentParts(seg) {
  const i = seg.indexOf(':');
  if (i < 0) return [seg, ''];
  return [seg.slice(0, i), seg.slice(i)];
}

/** True if a frontend path is compatible with a catalogue path under template matching. */
function pathMatches(frontendSegs, catalogueSegs) {
  if (frontendSegs.length !== catalogueSegs.length) return false;
  for (let i = 0; i < frontendSegs.length; i++) {
    const [fBase, fSuffix] = segmentParts(frontendSegs[i]);
    const [cBase, cSuffix] = segmentParts(catalogueSegs[i]);
    // Colon-verb suffix (`:export`, `:publish`, …) must match exactly on both sides —
    // otherwise `/audits/{id}` would incorrectly match `/audits/{auditId}:publish`.
    if (fSuffix !== cSuffix) return false;
    if (isPlaceholder(cBase) || isPlaceholder(fBase)) continue;
    if (fBase === cBase) continue;
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

function joinPath(base, sub) {
  if (!sub || sub === '/') return base || '/';
  if (!base || base === '/') return sub.startsWith('/') ? sub : '/' + sub;
  return (base.replace(/\/+$/, '') + '/' + sub.replace(/^\/+/, '')).replace(/\/{2,}/g, '/');
}

function prefixMatches(url, prefix) {
  return url === prefix || url.startsWith(prefix + '/') || url.startsWith(prefix + ':');
}

function tailCandidatesForPrefix(url, prefix) {
  if (!prefixMatches(url, prefix)) return [];
  const tail = url.slice(prefix.length) || '/';
  const out = [];
  // Exact-match case: URL has no suffix after the prefix (e.g. /trainingProgramReports with
  // prefix /trainingProgramReports). The tail is '/' which won't match the endpoint — also
  // try the full url so root-level endpoints without a class @RequestMapping resolve correctly.
  if (url === prefix) out.push(url);
  const m = prefix.match(/^(\/[^/]+)(\/v\d+)$/);
  const versionedTail = m ? joinPath(m[2], tail) : null;

  // Most v1 controllers expose unversioned service-local paths. v2 controllers in this
  // codebase often keep `/v2` in the Spring class mapping, so try the versioned tail first.
  if (versionedTail && m[2] !== '/v1') out.push(versionedTail);
  out.push(tail);
  if (versionedTail && m[2] === '/v1') out.push(versionedTail);

  return [...new Set(out)];
}

function serviceRootFromPrefix(prefix) {
  const m = String(prefix || '').match(/^(\/[^/]+)/);
  return m ? m[1] : null;
}

function expandUrlForService(url, svc) {
  const out = [url];
  const m = String(url || '').match(/^\/\{[^}]+\}(\/v\d+(?:\/.*)?|\/.*)$/);
  if (m) {
    for (const p of svc.frontendPrefix || []) {
      const root = serviceRootFromPrefix(p);
      if (root) out.push(root + m[1]);
    }
  }
  return [...new Set(out)];
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

function buildEndpointGroups(svcIndexes) {
  const byMethodPath = new Map();
  for (const [svcId, { svc, spec }] of svcIndexes) {
    for (const a of spec.areas || []) {
      for (const e of a.endpoints || []) {
        const rec = {
          service: svcId,
          serviceName: svc.displayName || svcId,
          endpointId: e.id,
          method: e.method,
          path: e.path,
          area: a.name || null,
          summary: e.summary || null
        };
        const key = `${e.method} ${e.path}`;
        const group = byMethodPath.get(key) || [];
        group.push(rec);
        byMethodPath.set(key, group);
      }
    }
  }
  return { byMethodPath };
}

function usagePageCount(pages) {
  const seen = new Set();
  for (const p of pages || []) seen.add(p.route || p.pageId);
  return seen.size;
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
  const endpointGroups = buildEndpointGroups(svcIndexes);

  function resolveUrl(urlPath) {
    let firstRouted = null;
    for (const [svcId, { svc, idx }] of svcIndexes) {
      for (const urlVariant of expandUrlForService(urlPath, svc)) {
        for (const prefix of svc.frontendPrefix || []) {
          for (const tail of tailCandidatesForPrefix(urlVariant, prefix)) {
            if (!firstRouted) firstRouted = { service: svcId, urlPath, candidates: [], noPathMatch: true, prefix };
            const matches = lookupPath(idx, tail);
            if (matches.length) {
              return { service: svcId, urlPath, candidates: matches, prefix, matchedUrl: urlVariant, matchedTail: tail };
            }
          }
        }
      }
    }
    if (firstRouted) return firstRouted;

    const m = String(urlPath || '').match(/^(\/[^/]+\/v\d+)/);
    const pref = m ? m[1] : String(urlPath || '').split('/').slice(0, 2).join('/');
    return { unrouted: true, urlPath, prefix: pref };
  }

  // For each endpoint key in endpoints.ts, resolve to (service, endpointId) if possible.
  // Some keys may match no service (e.g. /analytics/v1) — record under "unrouted".
  const keyResolution = {};       // key → { service, method?, endpointId, urlPath } or { unrouted: true, urlPath, prefix }
  let unmappedPrefixCounts = {};
  let mappedPrefixCounts   = {};

  for (const [key, urlPath] of Object.entries(endpointMap)) {
    const r = resolveUrl(urlPath);
    keyResolution[key] = r;
    if (r.unrouted) {
      unmappedPrefixCounts[r.prefix] = (unmappedPrefixCounts[r.prefix] || 0) + 1;
    } else {
      mappedPrefixCounts[r.prefix] = (mappedPrefixCounts[r.prefix] || 0) + 1;
    }
  }

  function resolveFrontendCall(call) {
    if (!call.endpointKey) {
      return { verb: call.verb, unresolved: true, line: call.line, expr: call.expr || call.literalUrl, method: call.method || null };
    }
    const r = call.urlPattern ? resolveUrl(call.urlPattern) : keyResolution[call.endpointKey];
    if (!r || r.unrouted) {
      return { verb: call.verb, key: call.endpointKey, urlPath: r?.urlPath, unrouted: true, method: call.method || null };
    }
    // Pick the matching method+path from candidates
    const match = r.candidates.find(cand => cand.method === call.verb)
               || r.candidates[0];
    if (!match) {
      return { verb: call.verb, key: call.endpointKey, urlPath: r.urlPath, service: r.service, noPathMatch: true, method: call.method || null };
    }
    return {
      verb: call.verb,
      key: call.endpointKey,
      urlPath: r.urlPath,
      service: r.service,
      endpointId: match.id,
      cataloguePath: match.path,
      area: match.area,
      verbMismatch: match.method !== call.verb,
      method: call.method || null,
      line: call.line || null
    };
  }

  // Build serviceClass → calls indexes. The page join uses the method index so a
  // page only inherits endpoints from service methods it actually calls.
  const serviceClassToCalls = new Map();       // ServiceClass → [{ verb, key, endpointId? }]
  const serviceClassToMethodCalls = new Map(); // ServiceClass → Map<methodName, calls[]>
  for (const s of frontend.services) {
    for (const c of s.classes) {
      const arr = [];
      const methodMap = new Map();
      for (const call of c.calls) {
        const resolved = resolveFrontendCall(call);
        arr.push(resolved);
        if (resolved.method) {
          const byMethod = methodMap.get(resolved.method) || [];
          byMethod.push(resolved);
          methodMap.set(resolved.method, byMethod);
        }
      }
      serviceClassToCalls.set(c.class, arr);
      serviceClassToMethodCalls.set(c.class, methodMap);
    }
  }

  // Build component → service method calls + template child components.
  const componentToInfo = new Map();
  const selectorToComponent = new Map();
  for (const c of frontend.components) {
    for (const cls of c.classes) {
      const info = {
        injects: cls.injects || [],
        serviceVars: cls.serviceVars || [],
        serviceCalls: cls.serviceCalls || [],
        selector: cls.selector || null,
        childSelectors: cls.childSelectors || [],
        childComponents: [],
        file: c.file
      };
      componentToInfo.set(cls.class, info);
      if (info.selector) selectorToComponent.set(info.selector, cls.class);
    }
  }
  for (const info of componentToInfo.values()) {
    info.childComponents = (info.childSelectors || [])
      .map(sel => selectorToComponent.get(sel))
      .filter(Boolean);
  }

  const componentCallCache = new Map();
  const componentMemberCache = new Map();

  function annotateCall(call, svcCall, componentName) {
    return {
      ...call,
      viaService: svcCall.serviceClass,
      viaMethod: svcCall.method,
      viaComponent: componentName,
      viaVar: svcCall.serviceVar,
      sourceLine: svcCall.line || null
    };
  }

  function componentCalls(componentName, visiting = new Set()) {
    if (componentCallCache.has(componentName)) return componentCallCache.get(componentName);
    if (visiting.has(componentName)) return [];
    visiting.add(componentName);
    const info = componentToInfo.get(componentName);
    const out = [];
    if (info) {
      for (const svcCall of info.serviceCalls || []) {
        const methodCalls = serviceClassToMethodCalls.get(svcCall.serviceClass)?.get(svcCall.method) || [];
        for (const call of methodCalls) out.push(annotateCall(call, svcCall, componentName));
      }
      for (const child of info.childComponents || []) {
        out.push(...componentCalls(child, visiting));
      }
    }
    visiting.delete(componentName);
    componentCallCache.set(componentName, out);
    return out;
  }

  function componentMembers(componentName, visiting = new Set()) {
    if (componentMemberCache.has(componentName)) return componentMemberCache.get(componentName);
    if (visiting.has(componentName)) return [];
    visiting.add(componentName);
    const info = componentToInfo.get(componentName);
    const out = [];
    if (info) {
      out.push(componentName);
      for (const child of info.childComponents || []) out.push(...componentMembers(child, visiting));
    }
    visiting.delete(componentName);
    const deduped = [...new Set(out)];
    componentMemberCache.set(componentName, deduped);
    return deduped;
  }

  function viaLabel(call) {
    return call.viaMethod ? `${call.viaService}.${call.viaMethod}` : call.viaService;
  }

  function mergePageCall(map, key, rec, label) {
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...rec, via: label, vias: [label] });
      return;
    }
    if (label && !existing.vias.includes(label)) existing.vias.push(label);
    existing.via = existing.vias.join(', ');
  }

  function addEndpointUsage(endpointUsage, usageSeen, endpointId, rec) {
    const usageKey = `${endpointId}|${rec.pageId}|${rec.viaService || ''}|${rec.viaMethod || ''}|${rec.viaComponent || ''}`;
    if (usageSeen.has(usageKey)) return;
    usageSeen.add(usageKey);
    const lst = endpointUsage.get(endpointId) || [];
    lst.push(rec);
    endpointUsage.set(endpointId, lst);
  }

  // Build pages: route → active route components + template children → called service methods → endpoint calls.
  const pages = [];
  const endpointUsage = new Map();     // endpointId → [{ pageId, route, title }]
  const unroutedUsage = new Map();     // urlPath → count

  let pageIdSeq = 0;
  for (const r of frontend.routes) {
    const pageId = 'page-' + (++pageIdSeq);
    const activeComponents = [...new Set([...(r.componentChain || []), r.component, ...(r.guards || [])].filter(Boolean))];
    const componentFile = componentToInfo.get(r.component)?.file || null;
    const pageComponents = [...new Set(activeComponents.flatMap(c => componentMembers(c)))];
    const injects = [...new Set(pageComponents.flatMap(c => componentToInfo.get(c)?.injects || []))];

    const apiByKey = new Map();
    const usageSeen = new Set();

    for (const componentName of activeComponents) {
      for (const call of componentCalls(componentName)) {
        if (call.unresolved) continue;
        const label = viaLabel(call);
        if (call.unrouted) {
          unroutedUsage.set(call.urlPath, (unroutedUsage.get(call.urlPath) || 0) + 1);
          mergePageCall(apiByKey, `unrouted|${call.verb}|${call.urlPath}`, {
            verb: call.verb,
            urlPath: call.urlPath,
            key: call.key,
            unrouted: true,
            viaService: call.viaService,
            viaMethod: call.viaMethod,
            viaComponent: call.viaComponent
          }, label);
          continue;
        }
        if (call.noPathMatch || !call.endpointId) {
          // Routed to a known service but path doesn't match any catalogued endpoint
          // (likely stale frontend entry or recently-removed backend route).
          mergePageCall(apiByKey, `nopath|${call.verb}|${call.urlPath}`, {
            verb: call.verb,
            service: call.service,
            urlPath: call.urlPath,
            key: call.key,
            noPathMatch: true,
            viaService: call.viaService,
            viaMethod: call.viaMethod,
            viaComponent: call.viaComponent
          }, label);
          continue;
        }
        mergePageCall(apiByKey, `${call.endpointId}|${call.verb}`, {
          verb: call.verb,
          service: call.service,
          endpointId: call.endpointId,
          path: call.cataloguePath,
          area: call.area,
          key: call.key,
          verbMismatch: call.verbMismatch || false,
          viaService: call.viaService,
          viaMethod: call.viaMethod,
          viaComponent: call.viaComponent
        }, label);
        addEndpointUsage(endpointUsage, usageSeen, call.endpointId, {
          pageId,
          route: r.path,
          title: r.title,
          viaService: call.viaService,
          viaMethod: call.viaMethod,
          viaComponent: call.viaComponent
        });
      }
    }
    const apiCalls = Array.from(apiByKey.values());

    pages.push({
      id: pageId,
      route: r.path,
      title: r.title || null,
      component: r.component,
      componentChain: r.componentChain || (r.component ? [r.component] : []),
      pageComponents,
      componentFile,
      guards: r.guards || [],
      apiCalls,
      injects
    });
  }

  // Compute summary stats
  const totalPages = pages.length;
  const totalCalls = pages.reduce((n, p) => n + p.apiCalls.length, 0);
  const resolvedCalls = pages.reduce((n, p) => n + p.apiCalls.filter(c => c.endpointId).length, 0);
  const matchRate = totalCalls ? (resolvedCalls / totalCalls * 100).toFixed(1) : '–';

  const endpointUsageObj = Object.fromEntries(endpointUsage);
  const endpointTwins = {};
  const duplicateGroups = [];
  for (const [key, group] of endpointGroups.byMethodPath) {
    if (group.length <= 1) continue;
    const entries = group.map(g => ({
      ...g,
      pages: endpointUsageObj[g.endpointId] || []
    }));
    duplicateGroups.push({
      key,
      method: entries[0].method,
      path: entries[0].path,
      endpoints: entries.map(e => ({
        service: e.service,
        serviceName: e.serviceName,
        endpointId: e.endpointId,
        area: e.area,
        summary: e.summary,
        pageCount: usagePageCount(e.pages)
      }))
    });
    for (const e of entries) {
      endpointTwins[e.endpointId] = entries
        .filter(other => other.endpointId !== e.endpointId)
        .map(other => ({
          service: other.service,
          serviceName: other.serviceName,
          endpointId: other.endpointId,
          method: other.method,
          path: other.path,
          area: other.area,
          summary: other.summary,
          pages: other.pages
        }));
    }
  }
  duplicateGroups.sort((a, b) => {
    const au = a.endpoints.reduce((n, e) => n + e.pageCount, 0);
    const bu = b.endpoints.reduce((n, e) => n + e.pageCount, 0);
    return bu - au || a.key.localeCompare(b.key);
  });

  return {
    xref: {
      pages,
      endpointUsage: endpointUsageObj,
      endpointTwins,
      stats: { totalPages, totalCalls, resolvedCalls, matchRate, totalEndpointKeys: Object.keys(endpointMap).length }
    },
    keyResolution,
    diagnostics: {
      unmappedPrefixCounts,
      mappedPrefixCounts,
      unroutedUsageTopN: Array.from(unroutedUsage.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 30),
      serviceCalls: Array.from(serviceClassToCalls.entries()).map(([cls, arr]) => ({ class: cls, calls: arr.length, resolved: arr.filter(a => a.endpointId).length })).sort((a,b)=>b.calls-a.calls).slice(0,15),
      duplicateGroups
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
  const pageMisses = new Map();
  for (const p of xref.pages || []) {
    for (const c of p.apiCalls || []) {
      if (!c.noPathMatch) continue;
      const rec = pageMisses.get(c.urlPath) || { count: 0, verbs: new Set(), services: new Set(), keys: new Set() };
      rec.count++;
      if (c.verb) rec.verbs.add(c.verb);
      if (c.service) rec.services.add(c.service);
      if (c.key) rec.keys.add(c.key);
      pageMisses.set(c.urlPath, rec);
    }
  }
  const noMatch = Array.from(pageMisses.entries()).sort((a, b) => b[1].count - a[1].count);
  if (noMatch.length === 0) lines.push('_None._');
  else for (const [url, rec] of noMatch.slice(0, 30)) {
    lines.push(`- \`${Array.from(rec.verbs).join('/') || '?'} ${url}\` · ${rec.count} UI reference${rec.count === 1 ? '' : 's'} · keys: ${Array.from(rec.keys).map(k => `\`${k}\``).join(', ') || 'unknown'} · routed service: ${Array.from(rec.services).map(s => `\`${s}\``).join(', ') || 'unknown'}`);
  }
  lines.push('');
  lines.push('## Same METHOD + path implemented more than once');
  lines.push('');
  const dupes = diagnostics.duplicateGroups || [];
  if (dupes.length === 0) lines.push('_None._');
  else {
    lines.push(`Found ${dupes.length} duplicate method/path group${dupes.length === 1 ? '' : 's'}. These are kept as direct-service matches, but the rendered endpoint cards show sibling usage so near-identical implementations are not mistaken for parser misses.`);
    lines.push('');
    for (const d of dupes.slice(0, 30)) {
      lines.push(`- \`${d.key}\``);
      for (const e of d.endpoints) {
        lines.push(`  - \`${e.service}\` · \`${e.endpointId}\` · ${e.pageCount} UI page${e.pageCount === 1 ? '' : 's'}`);
      }
    }
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
