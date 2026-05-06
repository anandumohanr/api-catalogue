#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Render a single self-contained HTML page from a service spec + global index.
 *
 *   renderService(spec, services, currentServiceId) → string
 *   renderIndex(servicesWithSpecs, totals)          → string
 */

const { FONTS, CSS, SCRIPT, APPBAR, PALETTE, escapeHtml, escapeAttr } = require('./template');

function pathHTML(p) { return escapeHtml(p).replace(/\{([^}]+)\}/g, '<span class="ph">{$1}</span>'); }
function tagSlug(t)  { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

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
  return out;
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

function renderUsedBy(usage) {
  if (!usage || usage.length === 0) {
    return `<div class="used-by"><h4>Used by</h4><div class="ub-empty">No UI pages found in the Angular theme that consume this endpoint.</div></div>`;
  }
  // Dedup by route so a page injecting two services that both use this endpoint shows once
  const dedup = new Map();
  for (const u of usage) {
    const k = u.route;
    if (!dedup.has(k)) dedup.set(k, { route: u.route, title: u.title, vias: new Set([u.viaService]), pageId: u.pageId });
    else dedup.get(k).vias.add(u.viaService);
  }
  const entries = Array.from(dedup.values()).sort((a, b) => a.route.localeCompare(b.route));
  return `<div class="used-by">
  <h4>Used by · <span class="ub-meta">${entries.length} UI page${entries.length === 1 ? '' : 's'}</span></h4>
  <ul class="ub-list">
    ${entries.map(e => `<li>
      <span class="ub-route"><a href="pages.html#${escapeAttr(e.pageId)}">${escapeHtml(e.route)}</a>${e.title ? ` <span style="color:var(--ink-faint)">· ${escapeHtml(e.title)}</span>` : ''}</span>
      <span class="ub-via">via ${escapeHtml(Array.from(e.vias).join(', '))}</span>
    </li>`).join('\n    ')}
  </ul>
</div>`;
}

function renderEndpoint(e, hasPaginationSection, usage) {
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

  const usedBy = renderUsedBy(usage);
  const categoryBadge = e.category && e.category !== 'uncategorized'
    ? `<a class="ep-cat-badge cat-${e.category}" href="${escapeAttr(categoryHref(e.category))}" title="${escapeAttr(e.categoryReason || '')}" onclick="event.stopPropagation()">${escapeHtml(CATEGORY_LABELS[e.category])}</a>`
    : '';
  const usageCount = (usage || []).length;
  const usageBadge = usageCount > 0
    ? `<span class="ep-used-badge" title="Consumed by ${usageCount} UI page${usageCount === 1 ? '' : 's'}">${usageCount} page${usageCount === 1 ? '' : 's'}</span>`
    : '';

  return `<details class="endpoint" id="${escapeAttr(e.id)}">
  <summary>
    <span class="verb-band ${e.method}" aria-hidden="true"></span>
    <span class="verb ${e.method}">${e.method}</span>
    <span class="e-path">${path}</span>
    <span class="e-summary">${summary}</span>
    <span class="ep-badges">${categoryBadge}${usageBadge}</span>
  </summary>
  <div class="body body--with-aside">
    <div class="body-main">
      ${renderTags(e.tags)}
      ${sections.join('\n      ')}
    </div>
    <aside class="body-aside">
      ${usedBy}
    </aside>
  </div>
</details>`;
}

function renderArea(area, hasPagination, endpointUsage) {
  const slug = `area-${tagSlug(area.name)}`;
  const areaDisplayName = area.name || area.sourceClass || 'Uncategorized';
  return `
<section class="area" id="${slug}">
  <header class="area-head">
    <span class="area-name">${escapeHtml(areaDisplayName)}</span>
    <span class="area-meta"><b>${area.endpoints.length}</b> endpoint${area.endpoints.length === 1 ? '' : 's'}</span>
    <span class="area-source">${escapeHtml(area.sourceClass)}</span>
  </header>
  ${area.endpoints.map(e => renderEndpoint(e, hasPagination, endpointUsage[e.id])).join('\n')}
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
${APPBAR({ title: brandTitle, brandSub, indexHref, nav })}
${body}
${PALETTE}
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

  const main = `<main class="doc">
${hero}

<h2 class="section" id="foundations"><span class="num">§</span>Foundations</h2>
<div class="found-grid">
${foundCards.join('\n')}
</div>

<h2 class="section" id="endpoints"><span class="num">§</span>Endpoints by area<button class="expand-all-btn" id="expand-all" type="button">Expand all</button></h2>
${spec.areas.map(a => renderArea(a, !!paginated.length, endpointUsage)).join('\n')}

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

/** Compute aggregate coverage stats across all loaded specs. */
function computeCoverage(services, xref) {
  let totalEp = 0, withReqBody = 0, resolvedReq = 0, resolvedResp = 0;
  for (const s of services) {
    if (!s.spec) continue;
    for (const a of s.spec.areas) for (const e of a.endpoints) {
      totalEp++;
      if (e.requestBody) {
        withReqBody++;
        if (e.requestBody.resolved && e.requestBody.resolved.kind && e.requestBody.resolved.kind !== 'unknown') resolvedReq++;
      }
      if (e.response && e.response.resolved && e.response.resolved.kind && e.response.resolved.kind !== 'unknown') resolvedResp++;
    }
  }
  const consumed = (xref && xref.endpointUsage) ? Object.keys(xref.endpointUsage).length : 0;
  return {
    totalEp,
    withReqBody,
    resolvedReq,
    resolvedResp,
    consumed,
    pctReq:      withReqBody ? Math.round((resolvedReq  / withReqBody) * 100) : 0,
    pctResp:     totalEp     ? Math.round((resolvedResp / totalEp)     * 100) : 0,
    pctConsumed: totalEp     ? Math.round((consumed     / totalEp)     * 100) : 0
  };
}

function methodBreakdown(spec) {
  const counts = {};
  for (const a of (spec.areas || [])) for (const e of a.endpoints) counts[e.method] = (counts[e.method] || 0) + 1;
  const order = ['GET','POST','PUT','PATCH','DELETE'];
  return order.filter(m => counts[m]).map(m => ({ method: m, count: counts[m] }));
}

function topAreas(spec, n) {
  return (spec.areas || []).slice().sort((a, b) => b.endpoints.length - a.endpoints.length).slice(0, n);
}

/** Per-service breakdown of category coverage. */
function svcCategoryBreakdown(spec) {
  const counts = {};
  for (const a of (spec.areas || [])) for (const e of a.endpoints) {
    counts[e.category || 'uncategorized'] = (counts[e.category || 'uncategorized'] || 0) + 1;
  }
  return counts;
}

function renderCategoryTile(catId, count, services) {
  const label = CATEGORY_LABELS[catId];
  const desc = (services && services._descriptions && services._descriptions[catId]) || '';
  const topSvcs = (services || []).filter(s => s.spec).map(s => {
    const c = svcCategoryBreakdown(s.spec)[catId] || 0;
    return { id: s.id, name: s.displayName, count: c };
  }).filter(x => x.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  const topHtml = topSvcs.length
    ? topSvcs.map(t => `<span><a href="${escapeAttr(t.id)}.html">${escapeHtml(t.name)}</a> <span class="ct-svc-count">${t.count}</span></span>`).join(' · ')
    : '<span style="color:var(--ink-faint)">none yet</span>';
  return `<a class="cat-tile" href="${escapeAttr(categoryHref(catId))}" data-cat="${catId}">
    <div class="ct-head">
      <span class="ct-label">${escapeHtml(label)}</span>
      <span class="ct-count">${count}</span>
    </div>
    <div class="ct-desc">${escapeHtml(desc)}</div>
    <div class="ct-tops">${topHtml}</div>
    <div class="ct-cta">Browse →</div>
  </a>`;
}

function renderCoveragePanel(cov) {
  const bar = (pct, label, sub) => `
    <div class="cov-row">
      <div class="cov-label">${escapeHtml(label)}</div>
      <div class="cov-bar"><span class="cov-fill" style="width:${pct}%"></span></div>
      <div class="cov-pct"><b>${pct}%</b><span>${escapeHtml(sub)}</span></div>
    </div>`;
  return `<section class="coverage">
    <h3>What's covered</h3>
    <p class="coverage-intro">The build extracts schemas from source. These bars show how complete the introspection is.</p>
    ${bar(cov.pctReq,      'Resolved request schemas',  `${cov.resolvedReq} / ${cov.withReqBody} endpoints with a body`)}
    ${bar(cov.pctResp,     'Resolved response schemas', `${cov.resolvedResp} / ${cov.totalEp} endpoints`)}
    ${bar(cov.pctConsumed, 'Endpoints used by the UI',  `${cov.consumed} / ${cov.totalEp} endpoints have a frontend consumer`)}
  </section>`;
}

function renderRichServiceCard(s) {
  const sp = s.spec;
  const eps   = sp ? sp.totalEndpoints : '—';
  const areas = sp ? sp.totalAreas : '—';
  const blurb = s.blurb || sp?.description || '';
  if (!sp) {
    return `<a class="svc-card" href="${escapeAttr(s.id)}.html">
      <div class="svc-head"><span class="svc-name">${escapeHtml(s.displayName)}</span></div>
      <div class="svc-blurb">${escapeHtml(blurb)}</div>
    </a>`;
  }
  const methods = methodBreakdown(sp);
  const tops = topAreas(sp, 3);
  const cats = svcCategoryBreakdown(sp);
  const catDots = CATEGORY_ORDER.map(c => {
    const has = (cats[c] || 0) > 0;
    return `<span class="svc-cat-dot ${has ? 'has' : ''} cat-${c}" title="${escapeAttr(CATEGORY_LABELS[c] + ': ' + (cats[c] || 0))}">${cats[c] || 0}</span>`;
  }).join('');
  return `<a class="svc-card" href="${escapeAttr(s.id)}.html">
    <div class="svc-head">
      <span class="svc-name">${escapeHtml(s.displayName)}</span>
      <span class="svc-art">${escapeHtml(sp.artifactId || s.dir)}</span>
    </div>
    <div class="svc-blurb">${escapeHtml(blurb)}</div>
    <div class="svc-methods">${methods.map(m => `<span class="svc-method svc-method--${m.method}"><span class="svc-method-label">${m.method}</span><span class="svc-method-count">${m.count}</span></span>`).join('')}</div>
    <div class="svc-areas">
      <span class="svc-areas-label">Top areas:</span>
      ${tops.map(a => `<span class="svc-area">${escapeHtml(a.name)} <span class="ct-svc-count">${a.endpoints.length}</span></span>`).join('')}
    </div>
    <div class="svc-stats">
      <span><b>${eps}</b> endpoints</span>
      <span><b>${areas}</b> areas</span>
      ${sp.springBoot ? `<span>SB ${escapeHtml(sp.springBoot)}</span>` : ''}
    </div>
    <div class="svc-cat-row" title="Category coverage in this service">${catDots}</div>
  </a>`;
}

function renderIndex(services, totals, xref) {
  const totalPages = (xref && xref.pages) ? xref.pages.length : 0;
  const cov = computeCoverage(services, xref);
  const cats = totals.categories || {};
  const descriptions = totals.categoryDescriptions || {};
  const taggedServices = Object.assign([], services, { _descriptions: descriptions });

  const heroSearch = `
<section class="home-hero">
  <div class="eyebrow">Medlern platform <span class="sep">·</span> ${services.length} services <span class="sep">·</span> ${totals.endpoints} endpoints${totalPages ? ` <span class="sep">·</span> ${totalPages} UI pages` : ''}</div>
  <h1>API <span style="color:var(--ink-faint);font-weight:400">catalogue</span></h1>
  <p class="lede">Discover any backend endpoint and the UI page that calls it. Schemas, examples, auth, and cross-references — all generated from source.</p>
  <button class="hero-search" id="hero-search-trigger">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/></svg>
    <span>Search every endpoint by URL, summary, or service…</span>
    <span class="kbd"><span class="kbd-meta-2">⌘</span>K</span>
  </button>
  <div class="stat-row">
    <span class="stat"><b>${services.length}</b> services</span>
    <span class="stat"><b>${totals.areas}</b> areas</span>
    <span class="stat"><b>${totals.endpoints}</b> endpoints</span>
    ${totalPages ? `<span class="stat"><b>${totalPages}</b> UI pages</span>` : ''}
  </div>
</section>`;

  const tiles = `
<section class="cat-tiles">
  <h2 class="section" id="categories"><span class="num">§</span>Browse by category</h2>
  <p class="section-intro">Every endpoint is tagged based on auth, path, and the UI screens that consume it. Click into a category to filter across all services.</p>
  <div class="cat-grid">
    ${CATEGORY_ORDER.map(id => renderCategoryTile(id, cats[id] || 0, taggedServices)).join('\n')}
  </div>
  ${cats.uncategorized ? `<p class="cat-uncat-note">${cats.uncategorized} endpoint${cats.uncategorized === 1 ? '' : 's'} are not categorized — internal/utility endpoints with no UI consumer. Browse those by service.</p>` : ''}
</section>`;

  const coverage = renderCoveragePanel(cov);

  const cards = services.map(renderRichServiceCard).join('\n');
  const pagesCard = totalPages ? `
<a class="svc-card svc-card--pages" href="pages.html">
  <div class="svc-head">
    <span class="svc-name">UI Pages</span>
    <span class="svc-art">Angular theme</span>
  </div>
  <div class="svc-blurb">Every Angular route, with the backend APIs each page consumes. Cross-linked into every endpoint card.</div>
  <div class="svc-stats">
    <span><b>${totalPages}</b> pages</span>
    ${xref?.stats ? `<span><b>${xref.stats.resolvedCalls}</b> resolved API references</span>` : ''}
  </div>
</a>` : '';

  const main = `<main class="doc home">
${heroSearch}
${tiles}
${coverage}
<h2 class="section" id="services"><span class="num">§</span>Services</h2>
<p class="section-intro">Eight microservices share the platform. Cards show the method breakdown, top areas, and category coverage at a glance.</p>
<div class="svc-grid">
${cards}
${pagesCard}
</div>
<footer class="colophon">
  <div>Generated from source by <code>tools/build.js</code> · <code>${escapeHtml('node tools/build.js')}</code> rebuilds the entire estate.</div>
  <div class="meta">${totals.endpoints}&nbsp;endpoints · ${totals.areas}&nbsp;areas · ${services.length}&nbsp;services</div>
</footer>
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

module.exports = { renderService, renderIndex, renderPages, renderCategoryPage, buildGlobalIndex };
