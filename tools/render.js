#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Render a single self-contained HTML page from a service spec + global index.
 *
 *   renderService(spec, services, currentServiceId) → string
 *   renderIndex(servicesWithSpecs, totals)          → string
 */

const { FONTS, CSS, SCRIPT, APPBAR, PALETTE, ICONS, TOAST, SHORTCUTS_SHEET, escapeHtml, escapeAttr } = require('./template');

function pathHTML(p) { return escapeHtml(p).replace(/\{([^}]+)\}/g, '<span class="ph">{$1}</span>'); }
function tagSlug(t)  { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

/** Synthesize a copy-pasteable cURL command for an endpoint.
 * Uses the catalogue host as a base placeholder; users can swap in their environment. */
function synthesizeCurl(e) {
  const lines = [];
  const method = e.method;
  // Resolve sample path values for {placeholders} so the cURL is runnable as-is.
  let path = e.path.replace(/\{([^}]+)\}/g, (_, name) => {
    const lc = name.toLowerCase();
    if (/(id|uuid)$/i.test(name))   return ':' + name;
    if (/page/i.test(name))         return '0';
    if (/size/i.test(name))         return '20';
    return ':' + name;
  });
  const qs = (e.queryParams || []).filter(p => p.required).slice(0, 3).map(p => p.name + '=:' + p.name);
  if (qs.length) path += (path.includes('?') ? '&' : '?') + qs.join('&');
  lines.push('curl --request ' + method + ' \\\n  --url "https://api.medlern.example' + path + '"');
  // Headers
  for (const h of (e.headers || [])) {
    if (!h.name) continue;
    if (/auth/i.test(h.name)) lines.push('  --header "' + h.name + ': Bearer $TOKEN"');
    else lines.push('  --header "' + h.name + ': ' + (h.default || ':' + h.name) + '"');
  }
  if (e.requestBody && e.requestBody.sample) {
    lines.push('  --header "Content-Type: application/json"');
    lines.push("  --data '" + JSON.stringify(e.requestBody.sample, null, 2).replace(/'/g, "'\\''") + "'");
  }
  return lines.join(' \\\n');
}

function renderEndpointActions(e, curl) {
  const enc = encodeURIComponent(curl || '');
  return `<div class="ep-actions" onclick="event.stopPropagation()">
    <button class="ep-action" data-action="copy-path" data-path="${escapeAttr(e.path)}" type="button" aria-label="Copy path">
      <svg class="i"><use href="#i-copy"/></svg><span>path</span>
    </button>
    <button class="ep-action" data-action="copy-permalink" type="button" aria-label="Copy permalink">
      <svg class="i"><use href="#i-link"/></svg><span>link</span>
    </button>
    <button class="ep-action" data-action="copy-curl" data-curl="${escapeAttr(enc)}" type="button" aria-label="Copy as cURL">
      <svg class="i"><use href="#i-terminal"/></svg><span>curl</span>
    </button>
  </div>`;
}

function renderCurlCard(curl) {
  if (!curl) return '';
  const colored = escapeHtml(curl)
    .replace(/(curl) /g, '<span class="c-flag">$1</span> ')
    .replace(/(--request|--url|--header|--data) /g, '<span class="c-flag">$1</span> ')
    .replace(/(GET|POST|PUT|PATCH|DELETE)/g, '<span class="c-method">$1</span>')
    .replace(/(&quot;https:[^&]+&quot;)/, '<span class="c-url">$1</span>');
  return `<div class="curl-card">
    <button class="curl-copy" type="button" data-curl-source>copy</button>
    <pre style="margin:0;color:inherit;background:none;border:none;padding:0;font-size:inherit;line-height:inherit;font-family:inherit;white-space:pre">${colored}</pre>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────
// JSON viewer + schema table
// ─────────────────────────────────────────────────────────────────────────

function typeLabel(schema) {
  if (!schema) return '';
  switch (schema.kind) {
    case 'object':    return schema.name || 'object';
    case 'array':     return 'array<' + typeLabel(schema.of) + '>';
    case 'map':       return 'map<' + typeLabel(schema.key) + ', ' + typeLabel(schema.value) + '>';
    case 'page':      return 'page<' + typeLabel(schema.of) + '>';
    case 'enum':      return (schema.name || 'enum') + ' (enum)';
    case 'primitive': return schema.name || 'primitive';
    case 'cycle':     return '↺ ' + (schema.name || '');
    case 'truncated': return '… ' + (schema.name || '');
    case 'unknown':   return schema.name || 'unknown';
    default:          return schema.name || schema.kind || '';
  }
}

/** Render a JSON example card with a header (label, type chip, tags) and a syntax-highlighted body. */
function renderJsonCard(label, schema, sample, opts) {
  opts = opts || {};
  if (sample === undefined || sample === null) {
    return `<div class="json-card is-empty">
      <div class="json-head">
        <span class="json-title"><span class="json-label">${escapeHtml(label)}</span>${opts.note ? '' : ''}</span>
      </div>
      <div class="json-empty">${escapeHtml(opts.emptyMessage || 'No example available — see source.')}</div>
    </div>`;
  }
  const json = JSON.stringify(sample, null, 2);
  const tagHtmls = [];
  if (opts.paginated) tagHtmls.push('<span class="json-tag">paginated</span>');
  if (opts.contentType) tagHtmls.push(`<span class="json-tag">${escapeHtml(opts.contentType)}</span>`);
  if (opts.note) tagHtmls.push(`<span class="json-tag">${escapeHtml(opts.note)}</span>`);
  const typeChip = schema && schema.kind && schema.kind !== 'unknown'
    ? `<span class="json-type">${escapeHtml(typeLabel(schema))}</span>`
    : '';
  return `<div class="json-card">
    <div class="json-head">
      <span class="json-title"><span class="json-label">${escapeHtml(label)}</span>${typeChip}${tagHtmls.join('')}</span>
      <button class="copy-json" type="button">copy</button>
    </div>
    <pre class="json-body">${escapeHtml(json)}</pre>
  </div>`;
}

function objectFromSchema(schema) {
  // Walk wrappers (array/page/map) until we hit the object payload, if any.
  let s = schema;
  let trail = '';
  for (let i = 0; i < 6 && s; i++) {
    if (s.kind === 'object')   return { schema: s, trail };
    if (s.kind === 'array')    { trail += '[]';        s = s.of;    continue; }
    if (s.kind === 'page')     { trail += '.content[]'; s = s.of;   continue; }
    if (s.kind === 'map')      { trail += '[<key>]';   s = s.value; continue; }
    return null;
  }
  return null;
}

function renderSchemaField(field, depth) {
  const flags = [];
  if (field.required) flags.push('<span class="req">required</span>');
  for (const v of (field.validations || [])) {
    if (v.name === 'NotNull' || v.name === 'NotBlank' || v.name === 'NotEmpty') continue;
    let label = v.name;
    if (v.min != null) label += ` ≥ ${v.min}`;
    if (v.max != null) label += ` ≤ ${v.max}`;
    if (v.value && !v.min && !v.max) label += ` "${v.value}"`;
    flags.push(escapeHtml(label));
  }
  const notes = [];
  if (field.format) notes.push(`format <code>${escapeHtml(field.format)}</code>`);
  if (field.description) notes.push(escapeHtml(field.description));
  const cycle = field.schema && field.schema.kind === 'cycle' ? '<span class="sr-cycle">↺ cycle</span>' : '';
  const truncated = field.schema && field.schema.kind === 'truncated' ? '<span class="sr-cycle">… truncated</span>' : '';
  const cls = depth > 0 ? `is-nested-${Math.min(depth, 1)}` : '';
  const row = `<div class="schema-row ${cls}">
    <span class="sr-name">${escapeHtml(field.name)}${cycle}${truncated}</span>
    <span class="sr-type">${escapeHtml(typeLabel(field.schema))}</span>
    <span class="sr-flags">${flags.join(' · ')}</span>
    <span class="sr-notes">${notes.join(' · ')}</span>
  </div>`;

  // Only inline-expand one level deep; deeper objects are visible in the JSON example.
  if (depth >= 1) return row;
  const inner = objectFromSchema(field.schema);
  if (!inner) return row;
  if (!inner.schema.fields || inner.schema.fields.length === 0) return row;
  if (inner.schema.fields.length > 6) return row; // skip mega-objects — they remain visible in the JSON example
  return row + '\n' + inner.schema.fields.map(f => renderSchemaField(f, depth + 1)).join('\n');
}

function renderSchemaTable(schema, rootLabel) {
  const inner = objectFromSchema(schema);
  if (!inner) return '';
  const s = inner.schema;
  if (!s.fields || s.fields.length === 0) return '';
  const tag = inner.trail ? `<span class="sc-tag">${escapeHtml(inner.trail)}</span>` : '';
  return `<details class="schema-card" open>
    <summary>
      <span class="sc-name">${escapeHtml(rootLabel || s.name || 'Schema')}</span>
      ${tag}
      <span class="sc-meta">${s.fields.length} field${s.fields.length === 1 ? '' : 's'}</span>
    </summary>
    <div class="schema-rows">
      ${s.fields.map(f => renderSchemaField(f, 0)).join('\n')}
    </div>
  </details>`;
}

function renderEnvelope(envelope, dataTypeLabel) {
  if (!envelope || envelope.kind !== 'object' || !envelope.fields) return '';
  const fieldTokens = envelope.fields.map(f => {
    if (f.name === 'data') return `<code class="slot">data</code>`;
    return `<code>${escapeHtml(f.name)}</code>`;
  }).join(' · ');
  return `<div class="envelope-card">
    <span><span class="env-title">${escapeHtml(envelope.name || 'Wrapper')}</span> envelopes a <code class="slot">data</code> slot of <code>${escapeHtml(dataTypeLabel || 'data')}</code>.</span>
    <span class="env-fields">${fieldTokens}</span>
  </div>`;
}

function buildGlobalIndex(services, xref) {
  const out = [];
  for (const s of services) {
    if (!s.spec) continue;
    for (const a of s.spec.areas) {
      for (const e of a.endpoints) {
        out.push({
          svcId:   s.id, svcName: s.displayName,
          area:    a.name, method: e.method,
          path:    e.path, summary: e.summary,
          href:    `${s.id}.html#${e.id}`
        });
      }
    }
  }
  if (xref && xref.pages) {
    for (const p of xref.pages) {
      const group = topLevelGroup(p.route);
      out.push({
        svcId:   'pages',
        svcName: 'Pages',
        area:    group,
        method:  'PAGE',
        path:    p.route,
        summary: p.title || p.component,
        href:    `pages.html#${p.id}`
      });
    }
  }
  // Category pages — let Cmd+K jump to them too
  for (const cat of CATEGORY_ORDER) {
    out.push({
      svcId:   'category',
      svcName: 'Category',
      area:    'Browse',
      method:  'CAT',
      path:    `/category/${cat}`,
      summary: CATEGORY_LABELS[cat] + ' — every endpoint in this category',
      href:    categoryHref(cat)
    });
  }
  // New first-class views
  out.push(
    { svcId: 'view', svcName: 'View', area: 'Browse', method: 'CAT', path: '/orphans',       summary: 'Endpoints with no Angular page consumer',  href: 'orphans.html' },
    { svcId: 'view', svcName: 'View', area: 'Browse', method: 'CAT', path: '/auth-coverage', summary: 'Authorization matrix — services × auth type', href: 'auth-coverage.html' },
    { svcId: 'view', svcName: 'View', area: 'Browse', method: 'CAT', path: '/tags',          summary: 'Browse by behavioural tag — paginated, export, lookup', href: 'tags.html' }
  );
  return out;
}

function buildEpXref(xref) {
  if (!xref || !xref.endpointUsage) return {};
  const out = {};
  for (const [epId, usages] of Object.entries(xref.endpointUsage)) {
    out[epId] = usages.map(u => ({ pageId: u.pageId, route: u.route, title: u.title || null, via: u.viaService }));
  }
  return out;
}

function buildPageXref(xref) {
  if (!xref || !xref.pages) return [];
  return xref.pages
    .map(p => {
      const calls = (p.apiCalls || []).filter(c => c.endpointId)
        .map(c => ({ endpointId: c.endpointId, verb: c.verb, path: c.path, area: c.area, svc: c.service }));
      return calls.length ? { id: p.id, route: p.route, title: p.title || p.component || '', calls } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.route.localeCompare(b.route));
}

function topLevelGroup(route) {
  const m = route.match(/^\/([^/]+)/);
  return m ? '/' + m[1] : '/';
}

function railServiceList(services, currentId, includePages) {
  const items = services.map(s => {
    const cur = s.id === currentId;
    const count = s.spec ? s.spec.totalEndpoints : '–';
    const href = s.id === '__index__' ? 'index.html' : `${s.id}.html`;
    return `<li><a class="svc-link${cur ? ' is-current' : ''}" href="${escapeAttr(href)}">${escapeHtml(s.displayName)} <span class="count">${count}</span></a></li>`;
  });
  if (includePages) {
    const cur = currentId === 'pages';
    items.push(`<li><a class="svc-link${cur ? ' is-current' : ''}" href="pages.html">Pages <span class="count">${includePages}</span></a></li>`);
  }
  return items.join('\n      ');
}

// ────── endpoint rendering ──────

function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return `<div class="tag-row">${tags.map(t => `<span class="tag tag--${tagSlug(t)}">${escapeHtml(t)}</span>`).join('')}</div>`;
}

function renderParamTable(rows, columns) {
  if (!rows || !rows.length) return '';
  const head = `<tr>${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr>`;
  const body = rows.map(r =>
    `<tr>${columns.map(c => `<td>${c.html ? c.html(r) : escapeHtml(r[c.key] ?? '')}</td>`).join('')}</tr>`
  ).join('\n');
  return `<table class="t"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function dedupeUsageByRoute(usage) {
  const dedup = new Map();
  for (const u of usage || []) {
    const k = u.route;
    if (!dedup.has(k)) dedup.set(k, { route: u.route, title: u.title, vias: new Set([u.viaService]), pageId: u.pageId });
    else dedup.get(k).vias.add(u.viaService);
  }
  return Array.from(dedup.values()).sort((a, b) => a.route.localeCompare(b.route));
}

function twinUsagePageCount(twins) {
  const seen = new Set();
  for (const t of twins || []) {
    for (const p of t.pages || []) seen.add(p.pageId || p.route);
  }
  return seen.size;
}

function renderTwinSummary(twins) {
  if (!twins || twins.length === 0) return '';
  return `<div class="ub-twins">
    <div class="ub-twin-title">Also implemented in</div>
    ${twins.map(t => {
      const count = twinUsagePageCount([t]);
      return `<a class="ub-twin" href="${escapeAttr(t.service)}.html#${escapeAttr(t.endpointId)}">
        <span>${escapeHtml(t.serviceName || t.service)}</span>
        <span>${escapeHtml(t.area || '')}${count ? ` · ${count} UI page${count === 1 ? '' : 's'}` : ' · no direct UI pages'}</span>
      </a>`;
    }).join('\n    ')}
  </div>`;
}

function renderUsedBy(usage, twins) {
  const entries = dedupeUsageByRoute(usage);
  const siblingEntries = [];
  for (const t of twins || []) {
    for (const e of dedupeUsageByRoute(t.pages || [])) {
      siblingEntries.push({ ...e, twin: t });
    }
  }
  siblingEntries.sort((a, b) => a.route.localeCompare(b.route) || a.twin.service.localeCompare(b.twin.service));
  const twinSummary = renderTwinSummary(twins);

  if (entries.length === 0 && siblingEntries.length === 0) {
    return `<div class="used-by"><h4>Used by</h4><div class="ub-empty">No UI pages found in the Angular theme that consume this endpoint directly.</div>${twinSummary}</div>`;
  }

  if (entries.length === 0) {
    const siblingPageCount = twinUsagePageCount(twins);
    return `<div class="used-by">
  <h4>Used by · <span class="ub-meta">${siblingPageCount} UI page${siblingPageCount === 1 ? '' : 's'} via same method/path</span></h4>
  <div class="ub-empty">No direct UI route targets this service endpoint; these pages call a sibling implementation with the same method and path.</div>
  <ul class="ub-list">
    ${siblingEntries.map(e => `<li>
      <span class="ub-route"><a href="pages.html#${escapeAttr(e.pageId)}">${escapeHtml(e.route)}</a>${e.title ? ` <span style="color:var(--ink-faint)">· ${escapeHtml(e.title)}</span>` : ''}</span>
      <span class="ub-via">via <a href="${escapeAttr(e.twin.service)}.html#${escapeAttr(e.twin.endpointId)}">${escapeHtml(e.twin.serviceName || e.twin.service)}</a> · ${escapeHtml(Array.from(e.vias).join(', '))}</span>
    </li>`).join('\n    ')}
  </ul>
  ${twinSummary}
</div>`;
  }

  return `<div class="used-by">
  <h4>Used by · <span class="ub-meta">${entries.length} UI page${entries.length === 1 ? '' : 's'}</span></h4>
  <ul class="ub-list">
    ${entries.map(e => `<li>
      <span class="ub-route"><a href="pages.html#${escapeAttr(e.pageId)}">${escapeHtml(e.route)}</a>${e.title ? ` <span style="color:var(--ink-faint)">· ${escapeHtml(e.title)}</span>` : ''}</span>
      <span class="ub-via">via ${escapeHtml(Array.from(e.vias).join(', '))}</span>
    </li>`).join('\n    ')}
  </ul>
  ${twinSummary}
</div>`;
}

function renderEndpoint(e, hasPaginationSection, usage, twins) {
  const path = pathHTML(e.path);
  const summary = escapeHtml(e.summary || '');

  const pathTable = renderParamTable(e.pathParams, [
    { label: 'Name', key: 'name' },
    { label: 'Type', key: 'type' },
    { label: 'Notes', html: r => escapeHtml(r.notes || '') },
  ]);
  const headerTable = renderParamTable(e.headers, [
    { label: 'Name',     key: 'name' },
    { label: 'Required', html: r => r.required ? 'yes' : 'no' },
    { label: 'Default · notes', html: r => {
        const parts = [];
        if (r.default != null) parts.push(`Default <code>${escapeHtml(r.default)}</code>`);
        if (r.notes) parts.push(escapeHtml(r.notes));
        return parts.join(' · ');
    } },
  ]);
  const queryTable = renderParamTable(e.queryParams, [
    { label: 'Name', key: 'name' },
    { label: 'Type', key: 'type' },
    { label: 'Notes', html: r => {
        const parts = [];
        if (r.required === false) parts.push('optional');
        if (r.default != null) parts.push(`default <code>${escapeHtml(r.default)}</code>`);
        if (r.notes) parts.push(r.notes);
        return parts.join(' · ');
    } },
  ]);
  const sections = [];

  if (e.auth && e.auth !== 'isValidInstitutionUser') {
    sections.push(`<div class="note"><strong>Auth · </strong>${escapeHtml(e.auth)}</div>`);
  }

  if (e.pathParams.length)  sections.push('<h4>Path parameters</h4>'    + pathTable);
  if (e.headers.length)     sections.push('<h4>Request headers</h4>'    + headerTable);
  if (e.queryParams.length) {
    sections.push('<h4>Query parameters</h4>' + queryTable);
    if (e.hasPageable && hasPaginationSection)
      sections.push(`<p style="font-size:12.5px;color:var(--ink-faint)">Plus the common pagination parameters &mdash; see <a href="#pagination">Pagination</a>.</p>`);
  } else if (e.hasPageable && hasPaginationSection) {
    sections.push(`<h4>Query parameters</h4><p style="font-size:13px">Common pagination only &mdash; see <a href="#pagination">Pagination</a>.</p>`);
  }

  if (e.requestBody) {
    sections.push('<h4>Request body</h4>');
    const rb = e.requestBody;
    const reqContentType = (e.consumes && e.consumes[0]) || null;
    if (rb.resolved && rb.sample !== undefined && rb.sample !== null) {
      sections.push(renderJsonCard('Example', rb.resolved, rb.sample, { contentType: reqContentType }));
      const tbl = renderSchemaTable(rb.resolved, rb.resolved.name || rb.type);
      if (tbl) sections.push(tbl);
    } else if (rb.resolved && rb.resolved.kind === 'unknown') {
      sections.push(renderJsonCard('Example', null, null, {
        emptyMessage: `Type ${rb.type} could not be resolved from source — see the controller for details.`
      }));
    } else {
      sections.push(`<p style="font-size:13px;color:var(--ink-faint)">Bound type: <code>${escapeHtml(rb.type)}</code></p>`);
    }
  }

  if (e.response && (e.response.resolved || e.response.shape)) {
    sections.push('<h4>Response <code>data</code></h4>');
    const r = e.response;
    const respContentType = (e.produces && e.produces[0]) || null;
    if (r.envelope && r.type) {
      sections.push(renderEnvelope(r.envelope, r.type));
    }
    if (r.resolved && r.sample !== undefined && r.sample !== null) {
      sections.push(renderJsonCard('Example', r.resolved, r.sample, {
        contentType: respContentType,
        paginated: r.paginated,
        note: r.wrapper ? `inside ${r.wrapper}.data` : null
      }));
      const tbl = renderSchemaTable(r.resolved, r.type || (r.resolved && r.resolved.name));
      if (tbl) sections.push(tbl);
    } else {
      sections.push(`<p style="font-size:13px;color:var(--ink-faint)">Detected expression: <code>${escapeHtml(r.shape || '?')}</code> &mdash; could not resolve to a concrete type.</p>`);
    }
  }

  if (sections.length === 0) {
    sections.push('<p style="color:var(--ink-faint);font-size:13px">No additional parameters.</p>');
  }

  const usedBy = renderUsedBy(usage, twins);
  const categoryBadge = e.category && e.category !== 'uncategorized'
    ? `<a class="ep-cat-badge cat-${e.category}" href="${escapeAttr(categoryHref(e.category))}" title="${escapeAttr(e.categoryReason || '')}" onclick="event.stopPropagation()">${escapeHtml(CATEGORY_LABELS[e.category])}</a>`
    : '';
  const usageCount = (usage || []).length;
  const siblingUsageCount = usageCount > 0 ? 0 : twinUsagePageCount(twins);
  const usageBadge = usageCount > 0
    ? `<span class="ep-used-badge" title="Consumed by ${usageCount} UI page${usageCount === 1 ? '' : 's'}">${usageCount} page${usageCount === 1 ? '' : 's'}</span>`
    : siblingUsageCount > 0
      ? `<span class="ep-used-badge ep-used-badge--twin" title="Same method/path is consumed through another service">${siblingUsageCount} sibling page${siblingUsageCount === 1 ? '' : 's'}</span>`
    : '';

  // ── Build tabbed body ─────────────────────────────────────────────────
  const overviewSections = sections.filter(s =>
    !/<h4>Request body<\/h4>/.test(s) &&
    !/<h4>Response /.test(s) &&
    !/<div class="json-card/.test(s) &&
    !/<details class="schema-card/.test(s) &&
    !/<div class="envelope-card/.test(s)
  );
  const schemaSections = [];
  const exampleSections = [];

  // Re-derive request and response sections, this time splitting them
  if (e.requestBody) {
    const rb = e.requestBody;
    const reqContentType = (e.consumes && e.consumes[0]) || null;
    if (rb.resolved && rb.sample !== undefined && rb.sample !== null) {
      exampleSections.push('<h4>Request body</h4>' + renderJsonCard('Example', rb.resolved, rb.sample, { contentType: reqContentType }));
      const tbl = renderSchemaTable(rb.resolved, rb.resolved.name || rb.type);
      if (tbl) schemaSections.push('<h4>Request body</h4>' + tbl);
    } else if (rb.resolved && rb.resolved.kind === 'unknown') {
      schemaSections.push('<h4>Request body</h4>' + renderJsonCard('Example', null, null, {
        emptyMessage: `Type ${rb.type} could not be resolved from source — see the controller for details.`
      }));
    } else {
      schemaSections.push(`<h4>Request body</h4><p style="font-size:13px;color:var(--ink-faint)">Bound type: <code>${escapeHtml(rb.type)}</code></p>`);
    }
  }
  if (e.response && (e.response.resolved || e.response.shape)) {
    const r = e.response;
    const respContentType = (e.produces && e.produces[0]) || null;
    if (r.envelope && r.type) {
      schemaSections.push(renderEnvelope(r.envelope, r.type));
    }
    if (r.resolved && r.sample !== undefined && r.sample !== null) {
      exampleSections.push('<h4>Response <code>data</code></h4>' + renderJsonCard('Example', r.resolved, r.sample, {
        contentType: respContentType,
        paginated: r.paginated,
        note: r.wrapper ? `inside ${r.wrapper}.data` : null
      }));
      const tbl = renderSchemaTable(r.resolved, r.type || (r.resolved && r.resolved.name));
      if (tbl) schemaSections.push('<h4>Response <code>data</code></h4>' + tbl);
    } else {
      schemaSections.push(`<h4>Response <code>data</code></h4><p style="font-size:13px;color:var(--ink-faint)">Detected expression: <code>${escapeHtml(r.shape || '?')}</code> &mdash; could not resolve to a concrete type.</p>`);
    }
  }

  const curl = synthesizeCurl(e);
  const hasSchema  = schemaSections.length > 0;
  const hasExample = exampleSections.length > 0;
  const tabsHTML = `<div class="ep-tabs" role="tablist">
    <button class="ep-tab is-active" data-tab="overview" type="button"><svg class="i"><use href="#i-info"/></svg><span>Overview</span></button>
    ${hasSchema  ? `<button class="ep-tab" data-tab="schema" type="button"><svg class="i"><use href="#i-layers"/></svg><span>Schema</span></button>` : ''}
    ${hasExample ? `<button class="ep-tab" data-tab="example" type="button"><svg class="i"><use href="#i-code"/></svg><span>Example</span></button>` : ''}
    <button class="ep-tab" data-tab="curl" type="button"><svg class="i"><use href="#i-terminal"/></svg><span>cURL</span></button>
  </div>`;

  const overviewPanel = `<div class="ep-tab-panel is-active" data-tab="overview">
    ${renderTags(e.tags)}
    ${overviewSections.join('\n      ')}
  </div>`;
  const schemaPanel = hasSchema ? `<div class="ep-tab-panel" data-tab="schema">
    ${schemaSections.join('\n      ')}
  </div>` : '';
  const examplePanel = hasExample ? `<div class="ep-tab-panel" data-tab="example">
    ${exampleSections.join('\n      ')}
  </div>` : '';
  const curlPanel = `<div class="ep-tab-panel" data-tab="curl">
    <p style="font-size:13px;color:var(--ink-faint);margin:0 0 8px">A runnable cURL skeleton. Replace <code>:placeholder</code> values and <code>$TOKEN</code> with your environment.</p>
    ${renderCurlCard(curl)}
  </div>`;

  return `<details class="endpoint" id="${escapeAttr(e.id)}">
  <summary>
    <span class="verb-band ${e.method}" aria-hidden="true"></span>
    <span class="verb ${e.method}">${e.method}</span>
    <span class="e-path tt" data-tip="${escapeAttr(e.path)}">${path}</span>
    <span class="e-summary">${summary}</span>
    <span class="ep-badges">${categoryBadge}${usageBadge}</span>
    ${renderEndpointActions(e, curl)}
  </summary>
  <div class="body body--with-aside">
    <div class="body-main">
      ${tabsHTML}
      ${overviewPanel}
      ${schemaPanel}
      ${examplePanel}
      ${curlPanel}
    </div>
    <aside class="body-aside">
      ${usedBy}
    </aside>
  </div>
</details>`;
}

function renderArea(area, hasPagination, endpointUsage, endpointTwins) {
  const slug = `area-${tagSlug(area.name)}`;
  const areaDisplayName = area.name || area.sourceClass || 'Uncategorized';
  return `
<section class="area" id="${slug}">
  <header class="area-head">
    <span class="area-name">${escapeHtml(areaDisplayName)}</span>
    <span class="area-meta"><b>${area.endpoints.length}</b> endpoint${area.endpoints.length === 1 ? '' : 's'}</span>
    <span class="area-source">${escapeHtml(area.sourceClass)}</span>
  </header>
  ${area.endpoints.map(e => renderEndpoint(e, hasPagination, endpointUsage[e.id], endpointTwins[e.id])).join('\n')}
</section>`;
}

function renderRailNav(spec, services, currentId, pageCount) {
  const areas = spec.areas;
  const areaItems = areas.map(a => {
    const slug = `area-${tagSlug(a.name)}`;
    const epLinks = a.endpoints.map(e =>
      `<li><a class="ep-link" href="#${escapeAttr(e.id)}"><span class="verb-mini ${e.method}">${e.method}</span><span class="ep-text">${escapeHtml(e.path)}</span></a></li>`
    ).join('\n      ');
    return `<li><a class="area-link" href="#${slug}">${escapeHtml(a.name)} <span class="count">${a.endpoints.length}</span></a></li>\n      ${epLinks}`;
  }).join('\n      ');

  return `
<div class="group">
  <div class="group-label">Services</div>
  <ul>
    ${railServiceList(services, currentId, pageCount)}
  </ul>
</div>

<div class="group">
  <div class="group-label">Foundations</div>
  <ul>
    <li><a href="#overview">Overview</a></li>
    ${spec._hasAuth       ? '<li><a href="#authorization">Authorization</a></li>' : ''}
    ${spec._hasPagination ? '<li><a href="#pagination">Pagination</a></li>'        : ''}
    <li><a href="#envelope">Response envelope</a></li>
  </ul>
</div>

<div class="group">
  <div class="group-label">Endpoints</div>
  <ul>
    ${areaItems}
  </ul>
</div>`;
}

function renderRightToc(spec) {
  const items = [
    `<li><a href="#overview" data-toc="overview">Overview</a></li>`,
    spec._hasAuth       ? `<li><a href="#authorization" data-toc="authorization">Authorization</a></li>` : '',
    spec._hasPagination ? `<li><a href="#pagination" data-toc="pagination">Pagination</a></li>` : '',
    `<li><a href="#envelope" data-toc="envelope">Response envelope</a></li>`,
    ...spec.areas.map(a => {
      const slug = `area-${tagSlug(a.name)}`;
      return `<li><a href="#${slug}" data-toc="${slug}">${escapeHtml(a.name)}</a></li>`;
    })
  ].filter(Boolean);
  return `
<aside class="toc" aria-label="Table of contents">
  <div class="toc-label">On this page</div>
  <ul id="toc-list">
    ${items.join('\n    ')}
  </ul>
</aside>`;
}

function authSummary(spec) {
  const counts = new Map(); let total = 0;
  for (const a of spec.areas) for (const e of a.endpoints) {
    total++;
    const k = e.auth || '(no explicit gate)';
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  if (total === 0) return null;
  return { counts: Array.from(counts.entries()).sort((a, b) => b[1] - a[1]), total };
}

function paginatedEndpoints(spec) {
  const list = [];
  for (const a of spec.areas) for (const e of a.endpoints) if (e.hasPageable) list.push(e);
  return list;
}

// ────── page assembly ──────

function pageShell({ title, body, brandTitle, brandSub, indexHref, nav }) {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
${FONTS}
<style>${CSS}</style>
</head>
<body>
${ICONS}
${APPBAR({ title: brandTitle, brandSub, indexHref, nav })}
${body}
${PALETTE}
${SHORTCUTS_SHEET}
${TOAST}
<script>window.__GLOBAL_INDEX__ = null;</script>
<script>${SCRIPT}</script>
</body>
</html>`;
}

const CATEGORY_LABELS = {
  'pre-login':     'Pre-login',
  'dashboard':     'Dashboard',
  'admin':         'Admin',
  'my-team-space': 'My Team',
  'uncategorized': 'Other'
};
const CATEGORY_ORDER = ['pre-login', 'dashboard', 'admin', 'my-team-space'];

function categoryHref(catId) { return `category-${catId}.html`; }

/** Build the appbar nav config from services + totals. */
function buildNav({ services, currentServiceId, currentCategory, isIndex, isPages, totals, xref }) {
  const counts = (totals && totals.categories) || {};
  const categories = CATEGORY_ORDER.map(id => ({
    id,
    label: CATEGORY_LABELS[id],
    count: counts[id] || 0,
    href:  categoryHref(id)
  }));
  const svcEntries = (services || []).filter(s => s.id !== '__index__').map(s => ({
    id: s.id,
    displayName: s.displayName,
    count: s.spec ? s.spec.totalEndpoints : null,
    href:  `${s.id}.html`
  }));
  const pagesCount = (xref && xref.pages) ? xref.pages.length : 0;
  return {
    activeCategory: currentCategory || null,
    activeService:  currentServiceId || null,
    activePages:    !!isPages,
    activeIndex:    !!isIndex,
    categories,
    services:   svcEntries,
    pagesHref:  pagesCount ? 'pages.html' : null,
    pagesCount
  };
}

function renderService(spec, services, currentServiceId, xref, totals) {
  const svcCfg = services.find(s => s.id === currentServiceId);
  const auth = authSummary(spec);
  const paginated = paginatedEndpoints(spec);
  spec._hasAuth = !!auth;
  spec._hasPagination = paginated.length > 0;

  const endpointUsage = (xref && xref.endpointUsage) || {};
  const endpointTwins = (xref && xref.endpointTwins) || {};
  const totalPages = xref && xref.pages ? xref.pages.length : 0;
  const railHTML = renderRailNav(spec, services, currentServiceId, totalPages);
  const tocHTML  = renderRightToc(spec);

  // Hero
  const eyebrowParts = [
    spec.artifactId ? escapeHtml(spec.artifactId) : null,
    spec.javaVersion ? `Java ${escapeHtml(spec.javaVersion)}` : null,
    spec.springBoot ? `Spring Boot ${escapeHtml(spec.springBoot)}` : null
  ].filter(Boolean);

  const hero = `
<section class="hero">
  <div class="eyebrow">${eyebrowParts.join(' <span class="sep">·</span> ')}</div>
  <h1>${escapeHtml(svcCfg.displayName)} <span style="color:var(--ink-faint);font-weight:400">API</span></h1>
  <p class="lede">${escapeHtml(svcCfg.blurb || spec.description || `API surface for the ${svcCfg.displayName} service.`)}</p>
  <div class="stat-row">
    <span class="stat"><b>${spec.totalEndpoints}</b> endpoints</span>
    <span class="stat"><b>${spec.totalAreas}</b> areas</span>
    ${spec._hasPagination ? `<span class="stat"><b>${paginated.length}</b> paginated</span>` : ''}
  </div>
</section>`;

  // Foundations as compact cards
  const foundCards = [];
  foundCards.push(`
<div class="found-card" id="overview">
  <h4>Overview</h4>
  <dl class="dl-grid" style="border-top:none;padding-top:0;margin:6px 0 0">
    <dt>Service</dt><dd><strong>${escapeHtml(svcCfg.displayName)}</strong></dd>
    <dt>Artifact</dt><dd><code>${escapeHtml(spec.artifactId || '—')}</code></dd>
    ${spec.description ? `<dt>Description</dt><dd>${escapeHtml(spec.description)}</dd>` : ''}
    <dt>Surface</dt><dd>${spec.totalEndpoints} endpoints across ${spec.totalAreas} areas</dd>
  </dl>
</div>`);

  if (auth) {
    foundCards.push(`
<div class="found-card" id="authorization">
  <h4>Authorization</h4>
  <ul class="tight">
${auth.counts.map(([k, n]) => {
  const pct = ((n / auth.total) * 100).toFixed(0);
  return `    <li><code>${escapeHtml(k)}</code> &mdash; ${n} of ${auth.total} (${pct}%)</li>`;
}).join('\n')}
  </ul>
</div>`);
  }

  if (paginated.length) {
    foundCards.push(`
<div class="found-card" id="pagination">
  <h4>Pagination</h4>
  <p style="font-size:13px">Endpoints binding Spring <code>Pageable</code> accept the standard <code>page</code>, <code>size</code>, and <code>sort</code> query parameters.</p>
  <p style="font-size:12px;color:var(--ink-faint)">${paginated.length} endpoint${paginated.length === 1 ? '' : 's'}: ${paginated.slice(0, 6).map(e => `<code>${escapeHtml(e.path)}</code>`).join(', ')}${paginated.length > 6 ? ', …' : ''}</p>
</div>`);
  }

  foundCards.push(`
<div class="found-card" id="envelope">
  <h4>Response envelope</h4>
  <p style="font-size:13px;margin:4px 0">Most handlers return <code>ResponseEntity&lt;APIResponse&gt;</code>. Endpoint detail describes the inner <code>data</code> payload.</p>
  <pre style="font-size:11.5px;margin-top:8px">{
  "status":  &lt;int&gt;,
  "error":   { ... } | null,
  "data":    &lt;object&gt; | null,
  "traceId": "..."
}</pre>
</div>`);

  const subnav = `<nav class="subnav" aria-label="Section">
    <a href="#foundations"><svg class="i"><use href="#i-info"/></svg>Foundations</a>
    <a href="#endpoints"><svg class="i"><use href="#i-list"/></svg>Endpoints</a>
    ${spec._hasAuth ? `<a href="#authorization"><svg class="i"><use href="#i-shield"/></svg>Authorization</a>` : ''}
    ${spec._hasPagination ? `<a href="#pagination"><svg class="i"><use href="#i-layers"/></svg>Pagination</a>` : ''}
  </nav>`;

  const main = `<main class="doc">
${hero}
${subnav}

<h2 class="section" id="foundations"><span class="num">§</span>Foundations</h2>
<div class="found-grid">
${foundCards.join('\n')}
</div>

<h2 class="section" id="endpoints"><span class="num">§</span>Endpoints by area<button class="expand-all-btn" id="expand-all" type="button">Expand all</button></h2>
${spec.areas.map(a => renderArea(a, !!paginated.length, endpointUsage, endpointTwins)).join('\n')}

<footer class="colophon">
  <div>Generated from source · <code>${escapeHtml(spec.serviceDir)}</code></div>
  <div class="meta">${spec.totalEndpoints}&nbsp;endpoints · ${spec.totalAreas}&nbsp;areas</div>
</footer>
</main>`;

  const body = `
<div class="shell">
<nav class="rail" aria-label="Catalogue navigation">${railHTML}</nav>
${main}
${tocHTML}
</div>`;

  return pageShell({
    title:       `${svcCfg.displayName} · API`,
    body,
    brandTitle:  'Medlern',
    brandSub:    '/ ' + svcCfg.displayName,
    indexHref:   'index.html',
    nav: buildNav({ services, currentServiceId, totals, xref })
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Pages (UI route catalogue)
// ─────────────────────────────────────────────────────────────────────────

function renderPages(xref, services, totals) {
  const pages = (xref && xref.pages) || [];
  // Group pages by top-level route segment
  const groups = new Map();
  for (const p of pages) {
    const g = topLevelGroup(p.route);
    const list = groups.get(g) || [];
    list.push(p);
    groups.set(g, list);
  }
  // Sort each group's pages by route, sort groups alphabetically
  for (const arr of groups.values()) arr.sort((a, b) => a.route.localeCompare(b.route));
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Stats
  const totalPages = pages.length;
  const totalApiCalls = pages.reduce((n, p) => n + p.apiCalls.length, 0);
  const resolvedCalls = pages.reduce((n, p) => n + p.apiCalls.filter(c => c.endpointId).length, 0);
  const servicesTouched = new Set();
  for (const p of pages) for (const c of p.apiCalls) if (c.service) servicesTouched.add(c.service);

  // Left rail: groups + the page list per group
  const railGroups = sortedGroups.map(([group, gp]) => {
    const items = gp.slice(0, 50).map(p =>
      `<li><a class="ep-link" href="#${escapeAttr(p.id)}"><span class="verb-mini" style="background:var(--panel-strong);color:var(--ink-faint)">PG</span><span class="ep-text">${escapeHtml(p.route)}</span></a></li>`
    ).join('\n      ');
    return `<li><a class="area-link" href="#group-${tagSlug(group)}">${escapeHtml(group)} <span class="count">${gp.length}</span></a></li>\n      ${items}`;
  }).join('\n      ');

  const railHTML = `
<div class="group">
  <div class="group-label">Services</div>
  <ul>
    ${railServiceList([{id:'__index__', displayName:'All services', spec:{ totalEndpoints: services.reduce((n,s)=>n+(s.spec?.totalEndpoints??0),0)} }, ...services], 'pages', totalPages)}
  </ul>
</div>

<div class="group">
  <div class="group-label">Route groups</div>
  <ul>
    ${railGroups}
  </ul>
</div>`;

  const tocHTML = `
<aside class="toc" aria-label="Table of contents">
  <div class="toc-label">On this page</div>
  <ul id="toc-list">
    ${sortedGroups.map(([g]) => `<li><a href="#group-${tagSlug(g)}" data-toc="group-${tagSlug(g)}">${escapeHtml(g)}</a></li>`).join('\n    ')}
  </ul>
</aside>`;

  // Per-page rendering
  function pageRowHTML(p) {
    const calls = p.apiCalls.slice().sort((a, b) => (a.path || a.urlPath || '').localeCompare(b.path || b.urlPath || ''));
    const callRows = calls.map(c => {
      if (c.endpointId) {
        return `<a class="api-row" href="${escapeAttr(c.service)}.html#${escapeAttr(c.endpointId)}">
          <span class="ar-method ${c.verb}">${c.verb}</span>
          <span class="ar-svc">${escapeHtml(c.service.replace(/-service$/, ''))}</span>
          <span class="ar-path">${escapeHtml(c.path)}</span>
          <span class="ar-via">via ${escapeHtml(c.via)}</span>
        </a>`;
      } else {
        const tag = c.unrouted ? 'unrouted' : 'no match';
        return `<div class="api-row" title="${escapeAttr(tag)}">
          <span class="ar-method ${c.verb}">${c.verb}</span>
          <span class="ar-svc is-orphan">${escapeHtml(tag)}</span>
          <span class="ar-path">${escapeHtml(c.urlPath || c.key || '')}</span>
          <span class="ar-via">via ${escapeHtml(c.via)}</span>
        </div>`;
      }
    }).join('\n  ');

    const guards = (p.guards || []).join(', ') || '—';
    const apiCount = p.apiCalls.length;
    return `<details class="page" id="${escapeAttr(p.id)}">
  <summary>
    <span class="page-band" aria-hidden="true"></span>
    <span class="page-route">${escapeHtml(p.route)}</span>
    <span class="page-title">${escapeHtml(p.title || p.component)}</span>
    <span class="page-callcount">${apiCount} API${apiCount === 1 ? '' : 's'}</span>
  </summary>
  <div class="page-body">
    <div class="page-meta">
      <span><b>component</b> ${escapeHtml(p.component)}</span>
      ${p.componentFile ? `<span><b>file</b> ${escapeHtml(p.componentFile)}</span>` : ''}
      <span><b>guards</b> ${escapeHtml(guards)}</span>
      <span><b>injects</b> ${p.injects.length} service${p.injects.length === 1 ? '' : 's'}</span>
    </div>
    ${callRows || '<p style="font-size:13px;color:var(--ink-faint)">No API calls detected. The component injects no API-calling services.</p>'}
  </div>
</details>`;
  }

  const groupSections = sortedGroups.map(([group, gp]) => `
<section class="pages-group" id="group-${tagSlug(group)}">
  <header class="pages-group-head">
    <span class="pg-name">${escapeHtml(group)}</span>
    <span class="pg-count"><b>${gp.length}</b> page${gp.length === 1 ? '' : 's'}</span>
  </header>
  ${gp.map(pageRowHTML).join('\n')}
</section>`).join('\n');

  const hero = `
<section class="hero">
  <div class="eyebrow">UI catalogue <span class="sep">·</span> Angular theme</div>
  <h1>UI <span style="color:var(--ink-faint);font-weight:400">pages</span></h1>
  <p class="lede">Every Angular route in the theme, with the backend APIs each page consumes — discoverable in both directions. Click any API row to jump to the matching endpoint card. Click any endpoint's "Used by" list elsewhere to land back here.</p>
  <div class="stat-row">
    <span class="stat"><b>${totalPages}</b> pages</span>
    <span class="stat"><b>${sortedGroups.length}</b> route groups</span>
    <span class="stat"><b>${totalApiCalls}</b> API references</span>
    <span class="stat"><b>${resolvedCalls}</b> resolved</span>
    <span class="stat"><b>${servicesTouched.size}</b> services touched</span>
  </div>
</section>`;

  const main = `<main class="doc">
${hero}
<h2 class="section" id="groups"><span class="num">§</span>Routes by section</h2>
<p class="section-intro">Pages are grouped by their top-level URL segment. <code>⌘K</code> from anywhere finds a page or an endpoint by URL or summary across the entire estate.</p>
${groupSections}
<footer class="colophon">
  <div>Generated from <code>medlern-enduser-solution-theme-blackdog</code> · join via <code>tools/xref.js</code> against the per-service catalogues</div>
  <div class="meta">${totalPages}&nbsp;pages · ${totalApiCalls}&nbsp;API references</div>
</footer>
</main>`;

  const body = `
<div class="shell">
<nav class="rail" aria-label="Catalogue navigation">${railHTML}</nav>
${main}
${tocHTML}
</div>`;

  return pageShell({
    title:      'Medlern · UI pages',
    body,
    brandTitle: 'Medlern',
    brandSub:   '/ pages',
    indexHref:  'index.html',
    nav: buildNav({ services, isPages: true, totals, xref })
  });
}

function methodBreakdown(spec) {
  const counts = {};
  for (const a of (spec.areas || [])) for (const e of a.endpoints) counts[e.method] = (counts[e.method] || 0) + 1;
  const order = ['GET','POST','PUT','PATCH','DELETE'];
  return order.filter(m => counts[m]).map(m => ({ method: m, count: counts[m] }));
}

function renderIndex(services, totals, xref) {
  const totalPages = (xref && xref.pages) ? xref.pages.length : 0;

  // ── HERO ────────────────────────────────────────────────────────────
  const hero = `
<section class="h2-hero">
  <div class="h2-hero-grid">
    <div class="h2-hero-main">
      <span class="h2-eyebrow"><span class="pulse" aria-hidden="true"></span>Medlern platform · live from source</span>
      <h1>One catalogue.<br>Every <span class="accent">API</span>.</h1>
      <p class="h2-lede">Find the backend endpoint behind any feature, and the UI page behind any endpoint. Generated from <code>${services.length}</code> Spring services and the Angular theme — no manual upkeep.</p>
      <button class="h2-search-btn" id="hero-search-btn" type="button" aria-label="Search APIs and pages">
        <svg class="i"><use href="#i-search"/></svg>
        <span class="h2-search-btn-text">Search APIs and pages…</span>
        <span class="kbd"><span id="kbd-meta-hero">⌘</span>K</span>
      </button>
      <div class="h2-hero-quick">
        <span class="h2-hero-quick-label">Try</span>
        <button class="h2-hero-chip" data-search-seed="institution" type="button">institution</button>
        <button class="h2-hero-chip" data-search-seed="login" type="button">login</button>
        <button class="h2-hero-chip" data-search-seed="report" type="button">report</button>
        <button class="h2-hero-chip" data-search-seed="course" type="button">course</button>
        <button class="h2-hero-chip" data-search-seed="export" type="button">export</button>
      </div>
    </div>
    <div class="h2-snap" aria-label="Catalogue snapshot">
      <a class="h2-snap-cell is-link" href="#services">
        <span class="sn-label"><svg class="i"><use href="#i-server"/></svg>Services</span>
        <span class="sn-num">${services.length}</span>
        <span class="sn-sub">microservices</span>
      </a>
      <a class="h2-snap-cell is-link" href="#services">
        <span class="sn-label"><svg class="i"><use href="#i-layers"/></svg>Endpoints</span>
        <span class="sn-num">${totals.endpoints.toLocaleString()}</span>
        <span class="sn-sub">${totals.areas} areas</span>
      </a>
      <a class="h2-snap-cell is-link" href="pages.html">
        <span class="sn-label"><svg class="i"><use href="#i-page"/></svg>UI pages</span>
        <span class="sn-num">${totalPages.toLocaleString()}</span>
        <span class="sn-sub">${xref && xref.stats ? xref.stats.resolvedCalls + ' xref calls' : 'angular routes'}</span>
      </a>
    </div>
  </div>
</section>`;

  // ── SERVICES DIRECTORY ─────────────────────────────────────────────
  const directoryRows = services.map(s => {
    const sp = s.spec;
    const eps   = sp ? sp.totalEndpoints : 0;
    const areas = sp ? sp.totalAreas : 0;
    const blurb = s.blurb || sp?.description || '';
    const initial = s.displayName.charAt(0);
    const total = eps || 1;
    const methods = sp ? methodBreakdown(sp) : [];
    const segs = methods.map(m =>
      `<span class="dr-method-seg ${m.method}" style="width:${(m.count / total * 100).toFixed(1)}%" title="${m.method} ${m.count}"></span>`
    ).join('');
    return `<a class="h2-dir-row" href="${escapeAttr(s.id)}.html">
      <span class="dr-mark">${escapeHtml(initial)}</span>
      <span class="dr-name">
        <span class="nm">${escapeHtml(s.displayName)}</span>
        <span class="art">${escapeHtml(sp?.artifactId || s.dir)}</span>
      </span>
      <span class="dr-blurb">${escapeHtml(blurb)}</span>
      <span class="dr-methods" aria-label="Method breakdown">${segs}</span>
      <span class="dr-stats"><b>${eps}</b>&nbsp;endpoints<span>${areas} areas</span></span>
      <svg class="i dr-go"><use href="#i-arrow-right"/></svg>
    </a>`;
  }).join('');

  const directory = `
<section class="h2-section" id="services">
  <div class="h2-section-head">
    <h2>Services</h2>
    <span class="h2-section-meta">${services.length} services · ${totals.endpoints} endpoints</span>
  </div>
  <div class="h2-dir">
    ${directoryRows}
  </div>
</section>`;

  const main = `<main class="doc home">
${hero}
${directory}
<div class="h2-foot">
  <div>Generated from source by <code>tools/build.js</code></div>
  <div>${totals.endpoints}&nbsp;endpoints · ${totals.areas}&nbsp;areas · ${services.length}&nbsp;services</div>
</div>
<script>window.__EP_XREF__ = null; window.__PAGE_XREF__ = null;</script>
</main>`;

  const body = `<div class="shell shell--home">${main}</div>`;

  return pageShell({
    title:       'Medlern · API catalogue',
    body,
    brandTitle:  'Medlern',
    brandSub:    '/ catalogue',
    indexHref:   'index.html',
    nav: buildNav({ services, isIndex: true, totals, xref })
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Category page (one HTML per category)
// ─────────────────────────────────────────────────────────────────────────

function renderCategoryPage(categoryId, services, xref, totals) {
  const label = CATEGORY_LABELS[categoryId] || categoryId;
  const description = (totals && totals.categoryDescriptions && totals.categoryDescriptions[categoryId]) || '';

  // ── By Service view data ─────────────────────────────────────────────────
  const serviceBlocks = [];
  let totalEndpoints = 0;
  const methodCounts = {};
  for (const s of services) {
    if (!s.spec) continue;
    const areaBlocks = [];
    for (const a of s.spec.areas) {
      const eps = a.endpoints.filter(e => (e.category || 'uncategorized') === categoryId);
      if (!eps.length) continue;
      eps.forEach(e => { methodCounts[e.method] = (methodCounts[e.method] || 0) + 1; totalEndpoints++; });
      areaBlocks.push({ area: a, endpoints: eps });
    }
    if (areaBlocks.length) serviceBlocks.push({ svc: s, areaBlocks });
  }

  // ── By Screen view data ──────────────────────────────────────────────────
  const endpointById = new Map();
  const endpointCategorySet = new Set();
  for (const s of services) {
    if (!s.spec) continue;
    for (const a of s.spec.areas) {
      for (const e of a.endpoints) {
        endpointById.set(e.id, { endpoint: e, svc: s, area: a });
        if ((e.category || 'uncategorized') === categoryId) endpointCategorySet.add(e.id);
      }
    }
  }

  const routeTitleMap = {};
  for (const p of (xref && xref.pages || [])) {
    if (p.title && !routeTitleMap[p.route]) routeTitleMap[p.route] = p.title;
  }

  function sectionOf(route) {
    const parts = route.split('/').filter(Boolean);
    if (parts.length < 2) return { key: '/' + (parts[0] || ''), slug: parts[0] || route };
    return { key: '/' + parts[0] + '/' + parts[1], slug: parts[1] };
  }

  function toTitleCase(slug) {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const sectionMap = new Map();
  for (const page of (xref && xref.pages || [])) {
    const seenIds = new Set();
    const relevantItems = (page.apiCalls || [])
      .filter(c => c.endpointId && endpointCategorySet.has(c.endpointId) && !seenIds.has(c.endpointId) && seenIds.add(c.endpointId))
      .map(c => endpointById.get(c.endpointId))
      .filter(Boolean);
    if (!relevantItems.length) continue;
    const { key, slug } = sectionOf(page.route);
    const label2 = routeTitleMap[key] || toTitleCase(slug) || key;
    if (!sectionMap.has(key)) sectionMap.set(key, { label: label2, key, pages: [] });
    sectionMap.get(key).pages.push({
      pageId: page.id, route: page.route,
      title: page.title || page.route,
      items: relevantItems
    });
  }

  const consumedIds = new Set();
  for (const sec of sectionMap.values())
    for (const pg of sec.pages)
      for (const item of pg.items) consumedIds.add(item.endpoint.id);
  const unclaimed = [];
  for (const [id, item] of endpointById)
    if (endpointCategorySet.has(id) && !consumedIds.has(id)) unclaimed.push(item);

  // ── Render helpers ────────────────────────────────────────────────────────
  function epLink(e, svc, area, extraHaystack) {
    const auth = e.auth ? `<span class="cat-ep-auth">${escapeHtml(e.auth)}</span>` : '';
    const tags = (e.tags || []).slice(0, 4).map(t => `<span class="cat-ep-tag">${escapeHtml(t)}</span>`).join('');
    const haystack = escapeAttr((e.path + ' ' + (e.summary || '') + ' ' + area.name + (extraHaystack ? ' ' + extraHaystack : '')).toLowerCase());
    return `<a class="cat-ep" href="${escapeAttr(svc.id)}.html#${escapeAttr(e.id)}" data-method="${e.method}" data-svc="${escapeAttr(svc.id)}" data-haystack="${haystack}">
          <span class="verb-band ${e.method}" aria-hidden="true"></span>
          <span class="verb ${e.method}">${e.method}</span>
          <span class="cat-ep-path">${pathHTML(e.path)}</span>
          <span class="cat-ep-summary">${escapeHtml(e.summary || '')}</span>
          <span class="cat-ep-meta">${auth}${tags}</span>
        </a>`;
  }

  // ── By Service HTML ───────────────────────────────────────────────────────
  const sections = serviceBlocks.map(({ svc, areaBlocks }) => `
<section class="cat-svc" data-svc="${escapeAttr(svc.id)}">
  <header class="cat-svc-head">
    <a class="cat-svc-name" href="${escapeAttr(svc.id)}.html">${escapeHtml(svc.displayName)}</a>
    <span class="cat-svc-meta">${areaBlocks.reduce((n,b) => n + b.endpoints.length, 0)} endpoint${areaBlocks.reduce((n,b) => n + b.endpoints.length, 0) === 1 ? '' : 's'}</span>
  </header>
  ${areaBlocks.map(b => `
    <div class="cat-area">
      <div class="cat-area-label">${escapeHtml(b.area.name || b.area.sourceClass || 'Uncategorized')}</div>
      ${b.endpoints.map(e => epLink(e, svc, b.area, '')).join('')}
    </div>`).join('')}
</section>`).join('\n');

  // ── By Screen HTML ────────────────────────────────────────────────────────
  const screenSectionsHtml = [...sectionMap.values()].map(sec => `
<section class="screen-section">
  <header class="screen-section-head">
    <span class="screen-section-label">${escapeHtml(sec.label)}</span>
    <span class="screen-section-route">${escapeHtml(sec.key)}</span>
  </header>
  ${sec.pages.map(pg => `
  <details class="screen-page">
    <summary class="screen-page-head">
      <span class="screen-page-title">${escapeHtml(pg.title)}</span>
      <span class="screen-page-route">${escapeHtml(pg.route)}</span>
      <span class="screen-page-count">${pg.items.length} API${pg.items.length === 1 ? '' : 's'}</span>
    </summary>
    ${pg.items.map(({ endpoint: e, svc: s, area: a }) => epLink(e, s, a, pg.title + ' ' + pg.route)).join('')}
  </details>`).join('')}
</section>`).join('\n');

  const unclaimedHtml = unclaimed.length ? `
<section class="screen-section screen-section--none">
  <header class="screen-section-head">
    <span class="screen-section-label">No UI consumer</span>
    <span class="screen-section-route">${unclaimed.length} endpoint${unclaimed.length === 1 ? '' : 's'} not linked to any page</span>
  </header>
  <details class="screen-page" open>
    <summary class="screen-page-head">
      <span class="screen-page-title">Unclaimed endpoints</span>
      <span class="screen-page-count">${unclaimed.length}</span>
    </summary>
    ${unclaimed.map(({ endpoint: e, svc: s, area: a }) => epLink(e, s, a, '')).join('')}
  </details>
</section>` : '';

  // ── Chrome ────────────────────────────────────────────────────────────────
  const methodChips = ['GET','POST','PUT','PATCH','DELETE']
    .filter(m => methodCounts[m])
    .map(m => `<button class="cat-mchip" data-method="${m}"><span class="verb-mini ${m}">${m}</span><span>${methodCounts[m]}</span></button>`)
    .join('');

  const serviceFilters = serviceBlocks.map(({ svc, areaBlocks }) => {
    const cnt = areaBlocks.reduce((n, b) => n + b.endpoints.length, 0);
    return `<button class="cat-svcchip" data-svc="${escapeAttr(svc.id)}" type="button">${escapeHtml(svc.displayName)} <span>${cnt}</span></button>`;
  }).join('');

  const hero = `
<section class="cat-hero">
  <div class="eyebrow">Category</div>
  <h1>${escapeHtml(label)}</h1>
  <p class="lede">${escapeHtml(description)}</p>
  <div class="stat-row">
    <span class="stat"><b>${totalEndpoints}</b> endpoints</span>
    <span class="stat"><b>${serviceBlocks.length}</b> services</span>
    ${Object.keys(methodCounts).length ? `<span class="stat"><b>${Object.keys(methodCounts).length}</b> methods</span>` : ''}
  </div>
</section>`;

  const filterBar = `
<div class="cat-filters" id="cat-filters">
  <input type="text" class="cat-text" id="cat-text" placeholder="Filter by URL, summary, or area…" autocomplete="off">
  <div class="cat-chip-row">${methodChips}</div>
  <div class="cat-chip-row">${serviceFilters}</div>
  <button class="cat-clear" type="button" id="cat-clear">Clear filters</button>
</div>`;

  const viewToggle = `
<div class="cat-view-toggle">
  <button class="cat-view-btn is-active" data-view="service">By Service</button>
  <button class="cat-view-btn" data-view="screen">By Screen</button>
</div>`;

  const emptyMsg = '<p class="cat-empty">No endpoints found in this category yet. Tighten heuristics in <code>tools/categories.json</code>.</p>';
  const screenEmptyMsg = '<p class="cat-empty">No UI pages linked to endpoints in this category.</p>';

  const main = `<main class="doc category">
${hero}
${filterBar}
${viewToggle}
<div id="service-view">${sections || emptyMsg}</div>
<div id="screen-view" style="display:none">${screenSectionsHtml || screenEmptyMsg}${unclaimedHtml}</div>
<footer class="colophon">
  <div>Filter is client-side. <code>⌘K</code> searches across every category.</div>
  <div class="meta">${totalEndpoints}&nbsp;endpoints in this category</div>
</footer>
</main>`;

  const body = `<div class="shell shell--home">${main}</div>`;

  return pageShell({
    title:      `Medlern · ${label}`,
    body,
    brandTitle: 'Medlern',
    brandSub:   '/ ' + label.toLowerCase(),
    indexHref:  'index.html',
    nav: buildNav({ services, currentCategory: categoryId, totals, xref })
  });
}

// ─────────────────────────────────────────────────────────────────────────
// New first-class views: orphans, auth-coverage, tags
// All three reuse the same compact endpoint-link component as category pages.
// ─────────────────────────────────────────────────────────────────────────

function compactEpLink(e, svc, area, extraHaystack) {
  const auth = e.auth ? `<span class="cat-ep-auth">${escapeHtml(e.auth)}</span>` : '';
  const tags = (e.tags || []).slice(0, 4).map(t => `<span class="cat-ep-tag">${escapeHtml(t)}</span>`).join('');
  const haystack = escapeAttr((e.path + ' ' + (e.summary || '') + ' ' + (area && area.name || '') + (extraHaystack ? ' ' + extraHaystack : '')).toLowerCase());
  return `<a class="cat-ep" href="${escapeAttr(svc.id)}.html#${escapeAttr(e.id)}" data-method="${e.method}" data-svc="${escapeAttr(svc.id)}" data-haystack="${haystack}">
    <span class="verb-band ${e.method}" aria-hidden="true"></span>
    <span class="verb ${e.method}">${e.method}</span>
    <span class="cat-ep-path">${pathHTML(e.path)}</span>
    <span class="cat-ep-summary">${escapeHtml(e.summary || '')}</span>
    <span class="cat-ep-meta">${auth}${tags}</span>
  </a>`;
}

function emptyState(iconId, title, body) {
  return `<div class="empty">
    <svg class="i"><use href="#${iconId}"/></svg>
    <div class="empty-title">${escapeHtml(title)}</div>
    <div>${escapeHtml(body)}</div>
  </div>`;
}

function renderOrphans(services, xref, totals) {
  const used = (xref && xref.endpointUsage) || {};
  const blocks = [];
  let total = 0;
  for (const s of services) {
    if (!s.spec) continue;
    const orphans = [];
    for (const a of s.spec.areas) {
      const eps = a.endpoints.filter(e => !(used[e.id] && used[e.id].length));
      if (eps.length) orphans.push({ area: a, eps });
    }
    if (!orphans.length) continue;
    const cnt = orphans.reduce((n, x) => n + x.eps.length, 0);
    total += cnt;
    blocks.push(`<section class="cat-svc" data-svc="${escapeAttr(s.id)}">
      <header class="cat-svc-head">
        <a class="cat-svc-name" href="${escapeAttr(s.id)}.html">${escapeHtml(s.displayName)}</a>
        <span class="cat-svc-meta">${cnt} endpoint${cnt === 1 ? '' : 's'}</span>
      </header>
      ${orphans.map(o => `
        <div class="cat-area">
          <div class="cat-area-label">${escapeHtml(o.area.name || o.area.sourceClass || 'Uncategorized')}</div>
          ${o.eps.map(e => compactEpLink(e, s, o.area, '')).join('')}
        </div>`).join('')}
    </section>`);
  }
  const main = `<main class="doc category">
    <section class="cat-hero">
      <div class="eyebrow"><svg class="i"><use href="#i-orphan"/></svg> Coverage gap</div>
      <h1>Orphan endpoints</h1>
      <p class="lede">Backend endpoints with no Angular page in our index that calls them. Either the consumer lives outside the catalogued theme, the endpoint is dead code, or the cross-reference missed the call site (see <code>_data/xref-report.md</code>).</p>
      <div class="stat-row">
        <span class="stat"><b>${total}</b> orphaned</span>
        <span class="stat"><b>${blocks.length}</b> service${blocks.length === 1 ? '' : 's'} affected</span>
        <span class="stat"><b>${totals.endpoints}</b> total endpoints</span>
      </div>
    </section>
    ${blocks.length ? blocks.join('\n') : emptyState('i-check-circle', 'No orphans', 'Every endpoint in the catalogue has at least one UI page that consumes it.')}
    <footer class="colophon">
      <div>Computed against <code>_data/xref.json</code>'s <code>endpointUsage</code> reverse index.</div>
      <div class="meta">${total}&nbsp;orphan endpoints</div>
    </footer>
  </main>`;
  const body = `<div class="shell shell--home">${main}</div>`;
  return pageShell({
    title:      'Medlern · Orphan endpoints',
    body,
    brandTitle: 'Medlern',
    brandSub:   '/ orphans',
    indexHref:  'index.html',
    nav: buildNav({ services, totals, xref })
  });
}

function renderAuthCoverage(services, xref, totals) {
  // Build matrix: rows = services, cols = auth types (canonicalised)
  const canonical = (auth) => {
    if (!auth) return 'none';
    const a = auth.toLowerCase();
    if (a.includes('preauthorize') || a.includes('hasrole') || a.includes('hasauthority')) return 'role';
    if (a.includes('isvalid') || a.includes('institution') || a.includes('roster')) return 'session';
    if (a === 'custom') return 'custom';
    return 'custom';
  };
  const labels = { session: 'Session', role: 'Role / Authority', custom: 'Custom', none: 'No gate' };
  const cols = ['session', 'role', 'custom', 'none'];
  const rows = [];
  let totalEp = 0;
  const colTotals = { session: 0, role: 0, custom: 0, none: 0 };
  for (const s of services) {
    if (!s.spec) continue;
    const counts = { session: 0, role: 0, custom: 0, none: 0 };
    let svcTotal = 0;
    for (const a of s.spec.areas) for (const e of a.endpoints) {
      const k = canonical(e.auth);
      counts[k]++; colTotals[k]++; svcTotal++; totalEp++;
    }
    rows.push({ svc: s, counts, total: svcTotal });
  }
  const heatClass = (n, max) => {
    if (!n) return '';
    const pct = max ? n / max : 0;
    if (pct > 0.5) return ' heat--hi';
    if (pct > 0.2) return ' heat--md';
    return ' heat--lo';
  };
  const maxCell = rows.reduce((m, r) => Math.max(m, ...cols.map(c => r.counts[c])), 0) || 1;
  const tableHTML = `<table class="matrix">
    <thead><tr>
      <th>Service</th>
      ${cols.map(c => `<th style="text-align:center">${labels[c]}</th>`).join('')}
      <th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `<tr>
        <td><a href="${escapeAttr(r.svc.id)}.html">${escapeHtml(r.svc.displayName)}</a></td>
        ${cols.map(c => `<td class="cell">${r.counts[c]
          ? `<a class="heat${heatClass(r.counts[c], maxCell)}" href="${escapeAttr(r.svc.id)}.html" title="${r.counts[c]} endpoint${r.counts[c]===1?'':'s'}">${r.counts[c]}</a>`
          : '<span class="heat" style="opacity:.4">·</span>'}</td>`).join('')}
        <td style="text-align:right;font-family:'JetBrains Mono',monospace;color:var(--ink-faint)">${r.total}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot>
      <tr>
        <td style="font-weight:600">All services</td>
        ${cols.map(c => `<td class="cell" style="font-family:'JetBrains Mono',monospace;color:var(--ink-soft);font-weight:600">${colTotals[c]}</td>`).join('')}
        <td style="text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600">${totalEp}</td>
      </tr>
    </tfoot>
  </table>`;
  const main = `<main class="doc category">
    <section class="cat-hero">
      <div class="eyebrow"><svg class="i"><use href="#i-shield"/></svg> Authorization</div>
      <h1>Auth coverage matrix</h1>
      <p class="lede">How each service gates its endpoints. <strong>Session</strong> = <code>requestMeta.isValid*(...)</code>. <strong>Role</strong> = Spring <code>@PreAuthorize</code>, <code>hasRole</code>, or <code>hasAuthority</code>. <strong>Custom</strong> = bespoke matchers. <strong>No gate</strong> = no detected auth check (review carefully — many are pre-login, some are mistakes).</p>
      <div class="stat-row">
        <span class="stat"><b>${totalEp}</b> endpoints</span>
        <span class="stat"><b>${colTotals.none}</b> with no detected gate</span>
        <span class="stat"><b>${colTotals.session + colTotals.role + colTotals.custom}</b> gated</span>
      </div>
    </section>
    <div class="matrix-card">${tableHTML}</div>
    <p style="font-size:12.5px;color:var(--ink-faint);margin-top:var(--s-4)">Detection lives in <code>parse.js:detectAuth</code>. The "No gate" column is a shortcut for "the parser couldn't find a check" — read the source before assuming the endpoint is genuinely public.</p>
    <footer class="colophon">
      <div>Heat shading is relative to the largest cell in the matrix.</div>
      <div class="meta">${rows.length}&nbsp;services · ${totalEp}&nbsp;endpoints</div>
    </footer>
  </main>`;
  const body = `<div class="shell shell--home">${main}</div>`;
  return pageShell({
    title:      'Medlern · Auth coverage',
    body,
    brandTitle: 'Medlern',
    brandSub:   '/ auth coverage',
    indexHref:  'index.html',
    nav: buildNav({ services, totals, xref })
  });
}

function renderTagsView(services, xref, totals) {
  // Inventory of every tag → list of endpoints
  const tagMap = new Map();
  for (const s of services) {
    if (!s.spec) continue;
    for (const a of s.spec.areas) for (const e of a.endpoints) {
      for (const t of (e.tags || [])) {
        if (!tagMap.has(t)) tagMap.set(t, []);
        tagMap.get(t).push({ e, svc: s, area: a });
      }
    }
  }
  const tagEntries = Array.from(tagMap.entries()).sort((a, b) => b[1].length - a[1].length);
  const facets = tagEntries.map(([tag, list]) =>
    `<a class="facet" href="#tag-${tagSlug(tag)}"><span>${escapeHtml(tag)}</span><span class="facet-count">${list.length}</span></a>`
  ).join('');
  const sections = tagEntries.map(([tag, list]) => `
    <section class="cat-svc" id="tag-${tagSlug(tag)}">
      <header class="cat-svc-head">
        <span class="cat-svc-name"><svg class="i"><use href="#i-tag"/></svg> ${escapeHtml(tag)}</span>
        <span class="cat-svc-meta">${list.length} endpoint${list.length === 1 ? '' : 's'}</span>
      </header>
      <div class="cat-area">
        ${list.map(({ e, svc, area }) => compactEpLink(e, svc, area, tag)).join('')}
      </div>
    </section>`).join('\n');
  const main = `<main class="doc category">
    <section class="cat-hero">
      <div class="eyebrow"><svg class="i"><use href="#i-tag"/></svg> Tag facets</div>
      <h1>Browse by tag</h1>
      <p class="lede">Every behavioural tag inferred during parsing — paginated, export, lookup, time-zone-header — across all services. Click a chip to jump to its section.</p>
      <div class="stat-row">
        <span class="stat"><b>${tagEntries.length}</b> tags</span>
        <span class="stat"><b>${totals.endpoints}</b> total endpoints</span>
      </div>
    </section>
    <div class="facet-grid">${facets}</div>
    ${sections.length ? sections : emptyState('i-tag', 'No tags', 'No endpoints have tags yet.')}
    <footer class="colophon">
      <div>Tags are inferred from path/method/parameters in <code>parse.js:inferTags</code>.</div>
      <div class="meta">${tagEntries.length}&nbsp;tags</div>
    </footer>
  </main>`;
  const body = `<div class="shell shell--home">${main}</div>`;
  return pageShell({
    title:      'Medlern · Tags',
    body,
    brandTitle: 'Medlern',
    brandSub:   '/ tags',
    indexHref:  'index.html',
    nav: buildNav({ services, totals, xref })
  });
}

module.exports = { renderService, renderIndex, renderPages, renderCategoryPage, renderOrphans, renderAuthCoverage, renderTagsView, buildGlobalIndex, buildEpXref, buildPageXref };
