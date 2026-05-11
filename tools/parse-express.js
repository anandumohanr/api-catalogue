#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Lightweight Express route parser for Node services that use:
 *   app.use(`${BASE_PATH}resource`, require('./v1/resource'));
 *   router.get('/path', ...)
 *
 * It intentionally extracts route shape only. Request/response schemas are not
 * inferred from handler bodies.
 */

const fs = require('fs');
const path = require('path');

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function titleCase(s) {
  return String(s || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function actionFor(method) {
  switch (method) {
    case 'GET': return 'get';
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return method.toLowerCase();
  }
}

function joinPath(base, child) {
  const b = normalizePath(base);
  const c = normalizePath(child);
  if (!c || c === '/') return b || '/';
  if (!b || b === '/') return c;
  return `${b.replace(/\/+$/, '')}/${c.replace(/^\/+/, '')}`;
}

function normalizePath(p) {
  let out = String(p || '').trim();
  if (!out || out === '/') return '/';
  out = out.replace(/`/g, '');
  if (!out.startsWith('/')) out = `/${out}`;
  out = out.replace(/\/+/g, '/');
  return out.length > 1 ? out.replace(/\/+$/, '') : out;
}

function expressPathToTemplate(p) {
  return normalizePath(p)
    .replace(/:([A-Za-z_]\w*)(\([^)]*\))?/g, '{$1}')
    .replace(/\{([A-Za-z_]\w*)\}\([^)]*\)/g, '{$1}');
}

function pathParams(routePath) {
  const params = [];
  const seen = new Set();
  routePath.replace(/\{([^}]+)\}/g, (_, name) => {
    if (!seen.has(name)) {
      seen.add(name);
      params.push({ name, type: 'string', notes: 'Express route parameter.' });
    }
    return _;
  });
  return params;
}

function inferTags(method, routePath) {
  const tags = [];
  if (method === 'DELETE') tags.push('delete');
  if (method === 'POST') tags.push('create');
  if (method === 'PUT' || method === 'PATCH') tags.push('update');
  if (/\bunread\b/i.test(routePath)) tags.push('status');
  if (/\bhealth\b/i.test(routePath)) tags.push('health');
  return tags;
}

function parseMounts(sourceDir) {
  const routesFile = path.join(sourceDir, 'api', 'handler', 'routes.js');
  if (!fs.existsSync(routesFile)) return [];
  const text = fs.readFileSync(routesFile, 'utf8');
  const routesDir = path.dirname(routesFile);
  const mounts = [];
  const re = /app\.use\(\s*(?:`?\$\{BASE_PATH\}([^`'"]+)`?|['"]\/?([^'"]+)['"])\s*,\s*require\(['"]([^'"]+)['"]\)\s*\)/g;
  let m;
  while ((m = re.exec(text))) {
    const mount = m[1] || m[2] || '';
    const req = m[3];
    const file = path.resolve(routesDir, req.endsWith('.js') ? req : `${req}.js`);
    mounts.push({ mount: normalizePath(mount), file });
  }
  return mounts;
}

function parseRouterFile(file, mountPath, serviceId, indexStart) {
  if (!fs.existsSync(file)) return { area: null, nextIndex: indexStart };
  const text = fs.readFileSync(file, 'utf8');
  const fileName = path.basename(file);
  const areaName = titleCase(mountPath.replace(/^\//, '') || fileName.replace(/\.js$/, ''));
  const auth = /validateTenant/.test(text) ? 'validateTenant' : null;
  const endpoints = [];
  const re = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]*)\2/g;
  let m;
  let idx = indexStart;
  while ((m = re.exec(text))) {
    const method = m[1].toUpperCase();
    if (!HTTP_METHODS.has(m[1])) continue;
    const child = expressPathToTemplate(m[3]);
    const routePath = expressPathToTemplate(joinPath(mountPath, child));
    const summary = `${actionFor(method)} ${areaName}`;
    const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
    endpoints.push({
      id: `${serviceId}-ep-${idx++}`,
      method,
      path: routePath,
      summary,
      tags: inferTags(method, routePath),
      pathParams: pathParams(routePath),
      headers: [],
      queryParams: [],
      requestBody: hasBody ? {
        type: 'object',
        sample: {},
        resolved: { kind: 'unknown', type: 'object', reason: 'Express route parser does not infer request schema.' }
      } : null,
      hasPageable: false,
      auth,
      consumes: null,
      produces: null,
      returnType: 'Express response',
      response: {
        shape: 'res.json(...)',
        rawExpr: null,
        type: 'object',
        resolved: { kind: 'unknown', type: 'object', reason: 'Express route parser does not infer response schema.' }
      },
      source: {
        file: path.relative(sourceDirFor(file), file),
        line: lineForOffset(text, m.index)
      }
    });
  }

  if (!endpoints.length) return { area: null, nextIndex: idx };
  return {
    area: {
      name: areaName,
      summary: null,
      sourceClass: fileName,
      file: path.relative(sourceDirFor(file), file),
      endpoints
    },
    nextIndex: idx
  };
}

function sourceDirFor(file) {
  const marker = `${path.sep}api${path.sep}handler${path.sep}`;
  const i = file.indexOf(marker);
  return i >= 0 ? file.slice(0, i) : path.dirname(file);
}

function lineForOffset(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

function parseExpressService(sourceDir, serviceId) {
  const pkg = readJson(path.join(sourceDir, 'package.json')) || {};
  const areas = [];
  let idx = 1;
  for (const mount of parseMounts(sourceDir)) {
    const parsed = parseRouterFile(mount.file, mount.mount, serviceId, idx);
    idx = parsed.nextIndex;
    if (parsed.area) areas.push(parsed.area);
  }
  const totalEndpoints = areas.reduce((n, a) => n + a.endpoints.length, 0);
  return {
    service: serviceId,
    serviceDir: path.basename(sourceDir),
    artifactId: pkg.name || serviceId,
    description: pkg.description || 'Express service',
    javaVersion: null,
    springBoot: null,
    runtime: 'node',
    framework: 'express',
    totalEndpoints,
    totalAreas: areas.length,
    areas
  };
}

module.exports = { parseExpressService };

if (require.main === module) {
  const [, , sourceDir, serviceId = path.basename(sourceDir || '')] = process.argv;
  if (!sourceDir) {
    console.error('Usage: parse-express.js <service-dir> [service-id]');
    process.exit(2);
  }
  console.log(JSON.stringify(parseExpressService(path.resolve(sourceDir), serviceId), null, 2));
}
