#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Assign each backend endpoint to one of:
 *   pre-login | dashboard | admin | my-team-space | uncategorized
 *
 * Heuristic order (first match wins):
 *   1. Hand-edited override in tools/categories.json
 *   2. Pre-login: auth-free + path/area looks like an auth flow
 *   3. Admin: any consuming UI page has a route under /admin/, OR area name hits the admin pattern
 *   4. My-team-space: any consuming UI page has a /privileging-/competency-reportees/etc. route
 *   5. Dashboard: any consuming UI page has a learner-facing route
 *   6. Else: uncategorized
 *
 * Mutates each endpoint object on each spec to add { category, categoryReason }.
 */

const fs   = require('fs');
const path = require('path');

const CATEGORIES = ['pre-login', 'dashboard', 'admin', 'my-team-space', 'uncategorized'];

function loadConfig(toolsDir) {
  const p = path.join(toolsDir, 'categories.json');
  if (!fs.existsSync(p)) return { overrides: {}, routePrefixes: {} };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.warn('[categorize] failed to read categories.json:', e.message); return { overrides: {}, routePrefixes: {} }; }
}

function compileMatchers(cfg) {
  return {
    overrides: cfg.overrides || {},
    admin: (cfg.routePrefixes && cfg.routePrefixes.admin)
      ? cfg.routePrefixes.admin.map(s => routeMatcher(s))
      : [routeMatcher('/admin/')],
    team: (cfg.routePrefixes && cfg.routePrefixes['my-team-space'])
      ? cfg.routePrefixes['my-team-space'].map(s => routeMatcher(s))
      : [],
    dashboard: (cfg.routePrefixes && cfg.routePrefixes.dashboard)
      ? cfg.routePrefixes.dashboard.map(s => routeMatcher(s))
      : [],
    preLogin: cfg.preLoginPathPattern ? new RegExp(cfg.preLoginPathPattern, 'i') : null,
    preLoginAreas: new Set((cfg.preLoginAreas || []).map(s => s.toLowerCase())),
    adminPath:     cfg.adminPathPattern ? new RegExp(cfg.adminPathPattern, 'i') : null,
    adminArea:     cfg.adminAreaPattern ? new RegExp(cfg.adminAreaPattern, 'i') : null,
    adminAreas:    new Set((cfg.adminAreas || []).map(s => s.toLowerCase())),
    dashboardAreas:new Set((cfg.dashboardAreas || []).map(s => s.toLowerCase()))
  };
}

function routeMatcher(prefix) {
  // e.g. "/admin/" matches anything starting with "/admin/", with or without trailing slash variations
  const norm = prefix.endsWith('/') ? prefix : prefix + (prefix.includes('/') ? '/' : '');
  // also match "/admin" exactly when prefix is "/admin/"
  return route => {
    if (!route) return false;
    if (route === prefix.replace(/\/$/, '')) return true;
    return route.startsWith(prefix);
  };
}

function consumingPages(endpointId, xref) {
  if (!xref || !xref.endpointUsage) return [];
  return xref.endpointUsage[endpointId] || [];
}

function categorizeEndpoint(endpoint, areaName, serviceId, xref, M) {
  const key = `${serviceId}:${endpoint.method}:${endpoint.path}`;
  if (M.overrides[key]) {
    const v = M.overrides[key];
    if (v === 'none') return { category: 'uncategorized', reason: 'override: forced uncategorized' };
    if (CATEGORIES.includes(v)) return { category: v, reason: `override: ${key}` };
  }

  // Pre-login: auth-free + path-or-area looks like auth flow
  if (endpoint.auth == null) {
    if (M.preLogin && M.preLogin.test(endpoint.path)) {
      return { category: 'pre-login', reason: `path matches pre-login pattern` };
    }
    if (areaName && M.preLoginAreas.has(areaName.toLowerCase())) {
      return { category: 'pre-login', reason: `area "${areaName}" is a pre-login area` };
    }
  }

  const pages = consumingPages(endpoint.id, xref);
  const areaLc = (areaName || '').toLowerCase();

  // Admin: route prefix on a consuming page → strongest signal
  if (pages.some(p => M.admin.some(m => m(p.route)))) {
    return { category: 'admin', reason: 'used by /admin/* page' };
  }

  // My-team-space
  if (M.team.length && pages.some(p => M.team.some(m => m(p.route)))) {
    return { category: 'my-team-space', reason: 'used by team-space page' };
  }

  // Dashboard from UI consumer
  if (M.dashboard.length && pages.some(p => M.dashboard.some(m => m(p.route)))) {
    return { category: 'dashboard', reason: 'used by dashboard/learner page' };
  }

  // Path-based admin signal (catches internal admin endpoints not consumed by /admin pages)
  if (M.adminPath && M.adminPath.test(endpoint.path)) {
    return { category: 'admin', reason: 'admin path pattern' };
  }

  // Area-based admin
  if (M.adminAreas.has(areaLc)) {
    return { category: 'admin', reason: `area "${areaName}" is administrative` };
  }
  if (M.adminArea && areaName && M.adminArea.test(areaName)) {
    return { category: 'admin', reason: `area "${areaName}" matches admin pattern` };
  }

  // Area-based dashboard
  if (M.dashboardAreas.has(areaLc)) {
    return { category: 'dashboard', reason: `area "${areaName}" is dashboard-facing` };
  }

  // Final fallback: if there's at least one consumer (any route), call it dashboard.
  // It's behind a logged-in UI even if the route prefix isn't explicit.
  if (pages.length) {
    return { category: 'dashboard', reason: 'consumed by an authenticated UI page (no specific prefix)' };
  }

  return { category: 'uncategorized', reason: 'no UI consumer and no path/area signal' };
}

function categorizeAll(services, xref, toolsDir) {
  const cfg = loadConfig(toolsDir);
  const M = compileMatchers(cfg);
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
  const overrideHits = new Set();

  for (const s of services) {
    if (!s.spec) continue;
    for (const a of s.spec.areas) {
      for (const e of a.endpoints) {
        const { category, reason } = categorizeEndpoint(e, a.name, s.id, xref, M);
        e.category = category;
        e.categoryReason = reason;
        counts[category]++;
        if (reason.startsWith('override:')) overrideHits.add(`${s.id}:${e.method}:${e.path}`);
      }
    }
  }

  // Warn about override keys that match no endpoint
  for (const k of Object.keys(M.overrides)) {
    if (!overrideHits.has(k)) {
      console.warn(`[categorize] WARN: override key "${k}" matched no endpoint`);
    }
  }

  return {
    counts,
    descriptions: cfg.categoryDescriptions || {}
  };
}

module.exports = { categorizeAll, CATEGORIES };
