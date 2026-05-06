/**
 * Chrome (CSS + JS) shared by every catalogue page.
 *
 * Aesthetic: Swagger-/Stripe-style dense rows. Inter sans throughout, JetBrains
 * Mono for paths and code. Method-colored left border on each endpoint row.
 * Neutral zinc-based palette in both light (default) and dark.
 */

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

const CSS = `
:root[data-theme="light"] {
  --bg:           #ffffff;
  --panel:        #fafafa;
  --panel-soft:   #f4f4f5;
  --panel-strong: #e4e4e7;
  --ink:          #18181b;
  --ink-soft:     #3f3f46;
  --ink-faint:    #71717a;
  --rule:         #e4e4e7;
  --rule-soft:    #f1f1f3;
  --rule-strong:  #d4d4d8;
  --accent:       #2563eb;
  --accent-soft:  rgba(37,99,235,0.08);
  --accent-ink:   #1d4ed8;
  --warn:         #b45309;
  --warn-soft:    rgba(180,83,9,0.08);
  --get:    #0284c7; --get-bg:    rgba(2,132,199,0.08);
  --post:   #059669; --post-bg:   rgba(5,150,105,0.08);
  --put:    #d97706; --put-bg:    rgba(217,119,6,0.08);
  --patch:  #7c3aed; --patch-bg:  rgba(124,58,237,0.08);
  --delete: #dc2626; --delete-bg: rgba(220,38,38,0.08);
  --shadow: 0 1px 2px rgba(0,0,0,0.04);
  --hover-bg: rgba(0,0,0,0.025);
  --selection: rgba(37,99,235,0.18);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --bg:           #09090b;
  --panel:        #131317;
  --panel-soft:   #18181b;
  --panel-strong: #27272a;
  --ink:          #fafafa;
  --ink-soft:     #d4d4d8;
  --ink-faint:    #a1a1aa;
  --rule:         #27272a;
  --rule-soft:    #1c1c1f;
  --rule-strong:  #3f3f46;
  --accent:       #60a5fa;
  --accent-soft:  rgba(96,165,250,0.12);
  --accent-ink:   #93c5fd;
  --warn:         #f59e0b;
  --warn-soft:    rgba(245,158,11,0.10);
  --get:    #38bdf8; --get-bg:    rgba(56,189,248,0.12);
  --post:   #34d399; --post-bg:   rgba(52,211,153,0.12);
  --put:    #fbbf24; --put-bg:    rgba(251,191,36,0.12);
  --patch:  #a78bfa; --patch-bg:  rgba(167,139,250,0.12);
  --delete: #f87171; --delete-bg: rgba(248,113,113,0.12);
  --shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
  --hover-bg: rgba(255,255,255,0.025);
  --selection: rgba(96,165,250,0.30);
  color-scheme: dark;
}

* { box-sizing: border-box; }
::selection { background: var(--selection); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
html, body { margin: 0; padding: 0; }
html { scroll-behavior: smooth; scroll-padding-top: 76px; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px; line-height: 1.55;
  font-feature-settings: "ss01", "cv02", "cv11";
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  transition: background-color 200ms ease, color 200ms ease;
}

code, kbd, pre, .mono {
  font-family: 'JetBrains Mono', ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: .92em; font-feature-settings: "ss02", "ss19";
}
code {
  background: var(--panel-soft);
  border: 1px solid var(--rule-soft);
  padding: .5px 5px; border-radius: 3px;
  font-size: .86em; color: var(--ink);
}
pre {
  background: var(--panel-soft);
  border: 1px solid var(--rule);
  padding: 12px 14px; border-radius: 6px;
  overflow-x: auto; margin: 8px 0;
  font-size: 12.5px; line-height: 1.6;
  color: var(--ink);
}
pre code { background: none; border: none; padding: 0; }

a { color: var(--accent-ink); text-decoration: none;
    transition: color 120ms ease; }
a:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
hr { border: none; border-top: 1px solid var(--rule); margin: 24px 0; }

/* ============================== APP BAR ============================== */

.appbar {
  position: sticky; top: 0; z-index: 50;
  height: 52px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 20px 0 24px;
  gap: 20px;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--rule);
}

/* Top-level navigation in the appbar */
.topnav {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px;
  overflow-x: auto;
  scrollbar-width: none;
  height: 100%;
  min-width: 0;
}
.topnav::-webkit-scrollbar { display: none; }
.topnav a, .topnav .services-menu summary {
  position: relative;
  display: inline-flex; align-items: center; height: 32px;
  padding: 0 11px;
  color: var(--ink-soft);
  border-radius: 5px;
  white-space: nowrap;
  text-decoration: none !important;
  cursor: pointer;
  user-select: none;
  transition: background-color 120ms ease, color 120ms ease;
}
.topnav a:hover, .topnav .services-menu summary:hover {
  color: var(--ink); background: var(--panel-soft);
}
.topnav a.is-current,
.topnav a[aria-current="page"] {
  color: var(--accent-ink);
  background: var(--accent-soft);
  font-weight: 500;
}
.topnav a .nv-count, .topnav .services-menu summary .nv-count {
  margin-left: 6px; font-size: 10.5px; color: var(--ink-faint);
  padding: 1px 5px; border: 1px solid var(--rule); border-radius: 99px;
  font-family: 'JetBrains Mono', monospace;
}
.topnav a.is-current .nv-count, .topnav a[aria-current="page"] .nv-count {
  color: var(--accent-ink); border-color: var(--accent);
}
.topnav .nv-sep {
  display: inline-block; width: 1px; height: 18px;
  background: var(--rule); margin: 0 6px;
}

/* Services dropdown */
.services-menu { position: relative; }
.services-menu summary {
  list-style: none;
}
.services-menu summary::-webkit-details-marker { display: none; }
.services-menu summary::after {
  content: "▾"; margin-left: 5px; font-size: 9px; color: var(--ink-faint);
  transition: transform 120ms ease;
}
.services-menu[open] summary::after { transform: rotate(180deg); }
.services-menu[open] summary {
  background: var(--panel-soft);
  color: var(--ink);
}
.services-menu .menu-panel {
  position: fixed;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 6px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.04);
  padding: 6px;
  min-width: 240px;
  z-index: 60;
}
.services-menu .menu-panel a {
  display: flex; align-items: baseline; justify-content: space-between;
  padding: 7px 10px; height: auto; gap: 12px;
  color: var(--ink-soft);
  font-size: 13px;
  border-radius: 4px;
}
.services-menu .menu-panel a:hover {
  background: var(--panel-soft); color: var(--ink);
}
.services-menu .menu-panel a.is-current {
  background: var(--accent-soft); color: var(--accent-ink);
}
.services-menu .menu-panel .ms-svc { font-weight: 500; }
.services-menu .menu-panel .ms-count { color: var(--ink-faint); font-size: 11px; font-family: 'JetBrains Mono', monospace; }

/* Hide the actions panel's search trigger label below 920px */
@media (max-width: 920px) {
  .topnav { gap: 0; font-size: 12px; }
  .topnav a, .topnav .services-menu summary { padding: 0 8px; }
  .topnav .nv-sep { margin: 0 2px; }
}
.appbar .brand {
  display: flex; align-items: center; gap: 10px;
  font-weight: 600; font-size: 14px; color: var(--ink);
  letter-spacing: -.01em;
}
.appbar .brand a { color: inherit; }
.appbar .brand a:hover { text-decoration: none; color: var(--accent); }
.appbar .brand .dot {
  width: 8px; height: 8px; border-radius: 2px; background: var(--accent);
  flex-shrink: 0;
}
.appbar .brand em {
  font-style: normal; font-weight: 400;
  color: var(--ink-faint); margin-left: 2px;
}
.appbar .crumbs {
  font-size: 12px; color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace; letter-spacing: -.02em;
}
.appbar .actions { display: flex; align-items: center; gap: 8px; }
.search-trigger {
  display: inline-flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 6px 0 10px; min-width: 280px;
  background: var(--panel-soft);
  border: 1px solid var(--rule); border-radius: 6px;
  color: var(--ink-faint); font-size: 12.5px;
  font-family: inherit; cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
}
.search-trigger:hover { border-color: var(--rule-strong); color: var(--ink-soft); }
.search-trigger svg { opacity: .7; flex-shrink: 0; }
.search-trigger .label { flex: 1; text-align: left; }
.search-trigger .kbd {
  display: inline-flex; gap: 2px;
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  background: var(--bg); color: var(--ink-faint);
  padding: 2px 5px; border-radius: 3px;
  border: 1px solid var(--rule);
}
.icon-btn {
  height: 32px; width: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--rule); border-radius: 6px;
  color: var(--ink-soft); cursor: pointer;
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
}
.icon-btn:hover { color: var(--ink); border-color: var(--rule-strong); background: var(--panel-soft); }

/* ============================== LAYOUT ============================== */

.shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 220px;
  max-width: 1440px; margin: 0 auto;
  padding: 0 24px; gap: 36px;
}
nav.rail {
  position: sticky; top: 52px; align-self: start;
  height: calc(100vh - 52px); overflow-y: auto;
  padding: 24px 0 80px;
  border-right: 1px solid var(--rule);
  margin-right: -36px; padding-right: 16px;
  scrollbar-width: thin; scrollbar-color: var(--rule-strong) transparent;
}
nav.rail::-webkit-scrollbar { width: 5px; }
nav.rail::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
main.doc { min-width: 0; padding: 36px 8px 100px; max-width: 880px; justify-self: start; }
aside.toc {
  position: sticky; top: 52px; align-self: start;
  height: calc(100vh - 52px); overflow-y: auto;
  padding: 36px 0 80px;
  scrollbar-width: none;
}
aside.toc::-webkit-scrollbar { display: none; }

@media (max-width: 1100px) {
  .shell { grid-template-columns: 240px minmax(0, 1fr); gap: 28px; }
  aside.toc { display: none; }
  nav.rail { margin-right: -28px; }
}
@media (max-width: 820px) {
  .shell { grid-template-columns: 1fr; padding: 0 16px; }
  nav.rail {
    position: static; height: auto; padding: 14px 0 18px;
    border-right: none; border-bottom: 1px solid var(--rule);
    margin-right: 0; padding-right: 0;
  }
  .appbar { grid-template-columns: 1fr auto; padding: 0 14px; }
  .appbar .crumbs { display: none; }
  .search-trigger { min-width: 0; }
  .search-trigger .label { display: none; }
  .search-trigger .kbd { display: none; }
  main.doc { padding: 22px 0 60px; max-width: 100%; }
}

/* ============================== LEFT RAIL ============================== */

.rail .group { margin-bottom: 18px; }
.rail .group-label {
  font-size: 10.5px; font-weight: 600; letter-spacing: .08em;
  text-transform: uppercase; color: var(--ink-faint);
  padding: 0 10px; margin: 0 0 6px;
}
.rail ul { list-style: none; margin: 0; padding: 0; }
.rail a {
  display: block; padding: 4px 10px;
  color: var(--ink-soft); font-size: 13px;
  border-radius: 4px; letter-spacing: -.005em;
  transition: color 100ms ease, background-color 100ms ease;
}
.rail a:hover { color: var(--ink); background: var(--panel-soft); text-decoration: none; }

.rail a.svc-link {
  display: flex; justify-content: space-between; align-items: center;
  font-weight: 400;
}
.rail a.svc-link .count {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: var(--ink-faint);
}
.rail a.svc-link.is-current {
  color: var(--accent-ink); background: var(--accent-soft);
  font-weight: 500;
}
.rail a.svc-link.is-current .count { color: var(--accent); }

.rail a.area-link {
  font-weight: 500; color: var(--ink); margin-top: 4px;
  display: flex; justify-content: space-between; align-items: center;
}
.rail a.area-link .count {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: var(--ink-faint);
}
.rail a.area-link.is-active { color: var(--accent-ink); }
.rail a.area-link.is-active .count { color: var(--accent); }

.rail a.ep-link {
  display: grid; grid-template-columns: 38px 1fr;
  gap: 8px; align-items: center;
  padding: 2px 10px 2px 18px;
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
  color: var(--ink-faint);
}
.rail a.ep-link .verb-mini {
  font-size: 9px; font-weight: 600; letter-spacing: .04em;
  padding: 1px 0; border-radius: 2px;
  text-align: center; width: 100%;
}
.rail a.ep-link .ep-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rail a.ep-link:hover { color: var(--accent-ink); background: transparent; }
.rail a.ep-link.is-active { color: var(--accent-ink); }

.rail .verb-mini.GET    { color: var(--get);    background: var(--get-bg); }
.rail .verb-mini.POST   { color: var(--post);   background: var(--post-bg); }
.rail .verb-mini.PUT    { color: var(--put);    background: var(--put-bg); }
.rail .verb-mini.PATCH  { color: var(--patch);  background: var(--patch-bg); }
.rail .verb-mini.DELETE { color: var(--delete); background: var(--delete-bg); }

/* ============================== HERO ============================== */

.hero { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--rule); }
.hero .eyebrow {
  display: flex; align-items: center; gap: 8px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--ink-faint); margin-bottom: 10px;
  letter-spacing: -.01em;
}
.hero .eyebrow .sep { color: var(--rule-strong); }
.hero h1 {
  font-size: 28px; font-weight: 700; margin: 0 0 6px;
  letter-spacing: -.025em; color: var(--ink);
  line-height: 1.15;
}
.hero .lede {
  font-size: 14.5px; color: var(--ink-soft);
  max-width: 680px; margin: 0 0 16px; line-height: 1.55;
}
.hero .stat-row {
  display: flex; flex-wrap: wrap; gap: 18px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: var(--ink-faint);
}
.hero .stat-row .stat { display: flex; gap: 6px; align-items: baseline; }
.hero .stat-row .stat b { color: var(--ink); font-weight: 600; }

/* ============================== SECTIONS ============================== */

h2.section {
  font-size: 12.5px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-faint);
  margin: 32px 0 12px;
  scroll-margin-top: 70px;
  display: flex; align-items: center; gap: 12px;
}
h2.section::after {
  content: ""; flex: 1; height: 1px;
  background: var(--rule);
}
h2.section .num {
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent); font-weight: 500;
  font-size: 11px;
}
.expand-all-btn {
  font-size: 11px; font-weight: 500; font-family: inherit;
  padding: 2px 10px; border-radius: 5px; cursor: pointer;
  background: var(--panel); border: 1px solid var(--rule);
  color: var(--ink-faint); text-transform: none; letter-spacing: 0;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  margin-left: 4px;
}
.expand-all-btn:hover { background: var(--panel-soft); color: var(--ink); border-color: var(--rule-strong); }
.section-intro {
  color: var(--ink-soft); margin: 0 0 14px;
  max-width: 760px; font-size: 13.5px;
}
h3 {
  font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-faint); margin: 18px 0 8px;
}
h4 {
  font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--ink-faint); margin: 14px 0 6px;
}
p { margin: 8px 0; color: var(--ink); }
ul.tight { margin: 6px 0 6px 0; padding-left: 18px; color: var(--ink); }
ul.tight li { margin: 3px 0; font-size: 13.5px; }
ul.tight li::marker { color: var(--ink-faint); }

/* foundations cards */
.found-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px; margin: 14px 0 12px;
}
.found-card {
  background: var(--panel); border: 1px solid var(--rule);
  border-radius: 6px; padding: 14px 16px;
}
.found-card h4 { margin-top: 0; }
.found-card p, .found-card ul { font-size: 13px; }
.found-card ul.tight li { font-size: 13px; }

.dl-grid {
  display: grid; grid-template-columns: 140px 1fr;
  gap: 6px 20px; margin: 12px 0;
  font-size: 13.5px;
}
.dl-grid dt {
  font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--ink-faint); font-weight: 500;
}
.dl-grid dd { margin: 0; color: var(--ink); }

/* tables */
table.t {
  width: 100%; border-collapse: collapse;
  margin: 8px 0 12px; font-size: 13px;
}
table.t th {
  text-align: left; font-weight: 600;
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--ink-faint);
  padding: 7px 10px 6px;
  border-bottom: 1px solid var(--rule);
  background: transparent;
}
table.t td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--rule-soft);
  vertical-align: top; color: var(--ink);
}
table.t td:first-child {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: var(--ink); white-space: nowrap;
}
table.t td:nth-child(2) {
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
  color: var(--ink-soft); white-space: nowrap;
}

/* ============================== AREA + ENDPOINT ROWS ============================== */

.area {
  margin: 22px 0 28px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  overflow: hidden;
  background: var(--panel);
}
.area-head {
  display: flex; align-items: baseline; gap: 14px;
  padding: 12px 16px;
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule);
  scroll-margin-top: 70px;
}
.area-head .area-name {
  font-weight: 600; font-size: 14px; color: var(--ink);
  letter-spacing: -.01em;
}
.area-head .area-meta {
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
  color: var(--ink-faint);
}
.area-head .area-meta b { color: var(--ink-soft); font-weight: 500; }
.area-head .area-source {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--ink-faint); margin-left: auto;
}

.endpoint {
  margin: 0; border: none; background: transparent;
  scroll-margin-top: 70px;
  border-top: 1px solid var(--rule-soft);
}
.endpoint:first-of-type { border-top: none; }
.endpoint > summary {
  list-style: none; cursor: pointer;
  display: grid;
  grid-template-columns: 4px 70px 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 9px 14px 9px 0;
  user-select: none;
  background: var(--panel);
  transition: background 100ms ease;
}
.endpoint > summary:hover { background: var(--hover-bg); }
.endpoint > summary::-webkit-details-marker { display: none; }
.endpoint .verb-band {
  height: 28px; width: 4px; border-radius: 0 2px 2px 0;
  align-self: center;
}
.endpoint .verb-band.GET    { background: var(--get); }
.endpoint .verb-band.POST   { background: var(--post); }
.endpoint .verb-band.PUT    { background: var(--put); }
.endpoint .verb-band.PATCH  { background: var(--patch); }
.endpoint .verb-band.DELETE { background: var(--delete); }
.endpoint .verb {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 600; letter-spacing: .04em;
  text-align: center;
  padding: 2px 0;
  border-radius: 3px;
  text-transform: uppercase;
}
.endpoint .verb.GET    { color: var(--get);    background: var(--get-bg); }
.endpoint .verb.POST   { color: var(--post);   background: var(--post-bg); }
.endpoint .verb.PUT    { color: var(--put);    background: var(--put-bg); }
.endpoint .verb.PATCH  { color: var(--patch);  background: var(--patch-bg); }
.endpoint .verb.DELETE { color: var(--delete); background: var(--delete-bg); }
.endpoint .e-path {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; font-weight: 500; color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: -.005em;
}
.endpoint .e-path .ph { color: var(--accent); }
.endpoint .e-summary {
  font-size: 12.5px; color: var(--ink-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 38ch;
}
.endpoint .copy-path {
  background: transparent; border: 1px solid transparent;
  color: var(--ink-faint); border-radius: 4px;
  padding: 2px 7px; font-size: 10.5px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer; opacity: 0;
  transition: opacity 120ms ease, color 120ms ease, border-color 120ms ease;
}
.endpoint > summary:hover .copy-path { opacity: 1; }
.endpoint .copy-path:hover { color: var(--ink); border-color: var(--rule-strong); }
.endpoint .copy-path.copied { color: var(--post); border-color: var(--post); opacity: 1; }
.ep-badges { display: flex; gap: 6px; align-items: center; }
.ep-used-badge {
  font-size: 10.5px; font-weight: 500; padding: 1px 7px; border-radius: 10px;
  background: var(--accent-soft); color: var(--accent-ink);
  font-family: 'JetBrains Mono', monospace; flex-shrink: 0;
  white-space: nowrap;
}
.endpoint .body {
  padding: 14px 18px 18px 86px;
  background: var(--panel-soft);
  border-top: 1px solid var(--rule-soft);
}
.endpoint .body > *:first-child { margin-top: 0; }
.endpoint[open] > summary { background: var(--panel-soft); }
.endpoint .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

/* tags */
.tag {
  display: inline-flex; align-items: center;
  font-size: 10.5px; font-weight: 500; letter-spacing: .02em;
  padding: 1px 7px; border-radius: 3px;
  background: var(--panel-strong); color: var(--ink-soft);
  border: 1px solid var(--rule);
  text-transform: uppercase;
}
.tag.tag--paginated { color: var(--get);    border-color: color-mix(in srgb,var(--get) 30%,transparent); background: var(--get-bg); }
.tag.tag--export    { color: var(--accent); border-color: color-mix(in srgb,var(--accent) 30%,transparent); background: var(--accent-soft); }
.tag.tag--summary   { color: var(--ink-soft); }
.tag.tag--header    { color: var(--warn);   border-color: color-mix(in srgb,var(--warn) 30%,transparent); background: var(--warn-soft); }
.tag.tag--lookup    { color: var(--ink-soft); }
.tag.tag--post,
.tag.tag--put,
.tag.tag--delete,
.tag.tag--patch { background: var(--panel-strong); color: var(--ink-soft); }

/* callouts */
.callout, .note {
  position: relative;
  margin: 12px 0; padding: 10px 14px 10px 38px;
  border-radius: 6px; font-size: 13px;
  color: var(--ink);
  border: 1px solid var(--rule);
}
.callout { background: var(--warn-soft); border-color: color-mix(in srgb,var(--warn) 25%,transparent); }
.callout::before { content: "!"; position: absolute; left: 14px; top: 9px; color: var(--warn); font-weight: 700; font-family: 'JetBrains Mono', monospace; }
.callout strong { color: var(--warn); font-weight: 600; }
.note { background: var(--accent-soft); border-color: color-mix(in srgb,var(--accent) 25%,transparent); }
.note::before { content: "i"; position: absolute; left: 14px; top: 9px; color: var(--accent); font-weight: 700; font-family: 'JetBrains Mono', monospace; font-style: italic; }
.note strong { color: var(--accent-ink); font-weight: 600; }

/* ============================== RIGHT TOC ============================== */

aside.toc .toc-label {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em;
  color: var(--ink-faint); margin: 0 0 10px;
  padding-left: 10px; font-weight: 600;
}
aside.toc ul { list-style: none; padding: 0; margin: 0; }
aside.toc a {
  display: block; font-size: 12.5px; color: var(--ink-faint);
  padding: 4px 0 4px 11px;
  border-left: 1px solid var(--rule);
  transition: color 100ms ease, border-left-color 100ms ease;
}
aside.toc a:hover { color: var(--ink-soft); border-left-color: var(--rule-strong); text-decoration: none; }
aside.toc a.active {
  color: var(--accent-ink); border-left-color: var(--accent);
  background: transparent;
}

/* ============================== COMMAND PALETTE ============================== */

.palette-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.4);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 150ms ease;
}
:root[data-theme="dark"] .palette-backdrop { background: rgba(0,0,0,0.6); }
.palette-backdrop.is-open { opacity: 1; pointer-events: auto; }
.palette {
  position: fixed; top: 12vh; left: 50%;
  transform: translateX(-50%) translateY(-6px);
  width: min(680px, calc(100vw - 32px));
  max-height: 70vh;
  background: var(--bg);
  border: 1px solid var(--rule-strong); border-radius: 10px;
  z-index: 101;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 60px -16px rgba(0,0,0,0.30);
  opacity: 0; pointer-events: none;
  transition: opacity 150ms ease, transform 220ms cubic-bezier(.2,.8,.2,1);
  overflow: hidden;
}
.palette.is-open { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.palette-input-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid var(--rule);
}
.palette-input-row svg { opacity: .5; flex-shrink: 0; }
.palette input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--ink); font-family: inherit; font-size: 15px;
}
.palette input:focus { outline: none; }
.palette input::placeholder { color: var(--ink-faint); }
.palette-results {
  overflow-y: auto; padding: 6px;
  scrollbar-width: thin; scrollbar-color: var(--rule-strong) transparent;
}
.palette-results::-webkit-scrollbar { width: 5px; }
.palette-results::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
.p-result {
  display: grid;
  grid-template-columns: 70px auto auto 1fr;
  gap: 10px; align-items: center;
  padding: 8px 10px; border-radius: 6px;
  cursor: pointer; transition: background 100ms ease;
}
.p-result:hover, .p-result.is-active { background: var(--accent-soft); }
.p-result .p-method {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600;
  letter-spacing: .04em; padding: 2px 0; border-radius: 3px;
  text-align: center; text-transform: uppercase; width: 60px;
}
.p-result .p-method.GET    { color: var(--get);    background: var(--get-bg); }
.p-result .p-method.POST   { color: var(--post);   background: var(--post-bg); }
.p-result .p-method.PUT    { color: var(--put);    background: var(--put-bg); }
.p-result .p-method.PATCH  { color: var(--patch);  background: var(--patch-bg); }
.p-result .p-method.DELETE { color: var(--delete); background: var(--delete-bg); }
.p-result .p-method.PAGE   { color: var(--ink-soft); background: var(--panel-strong); }
.p-result .p-svc {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--accent-ink); border: 1px solid color-mix(in srgb,var(--accent) 30%,transparent);
  padding: 1px 5px; border-radius: 3px; font-weight: 500; white-space: nowrap;
  background: var(--accent-soft);
}
.p-result .p-area {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--ink-faint); border: 1px solid var(--rule);
  padding: 1px 5px; border-radius: 3px; font-weight: 500; white-space: nowrap;
}
.p-result .p-main { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.p-result .p-path {
  font-family: 'JetBrains Mono', monospace; font-size: 12.5px;
  color: var(--ink); font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.p-result.is-active .p-path { color: var(--accent-ink); }
.p-result .p-summary {
  font-size: 11.5px; color: var(--ink-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.p-result mark {
  background: color-mix(in srgb,var(--accent) 30%,transparent);
  color: var(--accent-ink);
  padding: 0 2px; border-radius: 2px;
}
.palette-empty { text-align: center; padding: 28px 16px; color: var(--ink-faint); font-size: 13px; }
.palette-foot {
  border-top: 1px solid var(--rule); padding: 7px 14px;
  font-size: 11px; color: var(--ink-faint);
  display: flex; justify-content: space-between; align-items: center;
  background: var(--panel-soft);
}
.palette-foot .key {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  background: var(--bg); border: 1px solid var(--rule);
  padding: 1px 5px; border-radius: 3px; margin-right: 3px;
}
.palette-foot span + span { margin-left: 12px; }

/* ============================== USED-BY BLOCK ============================== */

.used-by {
  margin-top: 14px;
  border-top: 1px solid var(--rule-soft);
  padding-top: 12px;
}
.used-by h4 { margin-top: 0; }
.used-by .ub-meta {
  font-size: 11.5px; color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
}
.used-by ul.ub-list {
  list-style: none; padding: 0; margin: 6px 0 0;
  max-height: 220px; overflow-y: auto;
  border: 1px solid var(--rule-soft); border-radius: 4px;
  background: var(--bg);
}
.used-by ul.ub-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px; align-items: center;
  padding: 4px 10px;
  border-bottom: 1px solid var(--rule-soft);
  font-size: 12.5px;
}
.used-by ul.ub-list li:last-child { border-bottom: none; }
.used-by ul.ub-list li:hover { background: var(--hover-bg); }
.used-by ul.ub-list .ub-route {
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.used-by ul.ub-list .ub-route a { color: var(--ink); }
.used-by ul.ub-list .ub-route a:hover { color: var(--accent); }
.used-by ul.ub-list .ub-via {
  font-size: 10.5px; color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}
.used-by .ub-empty {
  font-size: 12px; color: var(--ink-faint);
  font-style: italic;
  padding: 6px 0;
}

/* ============================== PAGES PAGE ============================== */

.pages-group {
  margin: 22px 0 28px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--panel);
  overflow: hidden;
}
.pages-group-head {
  padding: 12px 16px;
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule);
  display: flex; align-items: baseline; gap: 12px;
  scroll-margin-top: 70px;
}
.pages-group-head .pg-name {
  font-weight: 600; font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink); letter-spacing: -.005em;
}
.pages-group-head .pg-count {
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
  color: var(--ink-faint);
}
.pages-group-head .pg-count b { color: var(--ink-soft); }

details.page {
  margin: 0; border: none; background: transparent;
  scroll-margin-top: 70px;
  border-top: 1px solid var(--rule-soft);
}
details.page:first-of-type { border-top: none; }
details.page > summary {
  list-style: none; cursor: pointer;
  display: grid;
  grid-template-columns: 4px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 9px 14px 9px 0;
  background: var(--panel);
  transition: background 100ms ease;
}
details.page > summary:hover { background: var(--hover-bg); }
details.page > summary::-webkit-details-marker { display: none; }
details.page[open] > summary { background: var(--panel-soft); }
details.page .page-band {
  height: 28px; width: 4px;
  background: var(--accent); border-radius: 0 2px 2px 0;
  align-self: center;
}
details.page .page-route {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: var(--ink); font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
details.page .page-title {
  font-size: 12.5px; color: var(--ink-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 28ch;
}
details.page .page-callcount {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: var(--ink-faint);
  border: 1px solid var(--rule);
  padding: 1px 6px; border-radius: 3px;
}
details.page .page-body {
  padding: 14px 18px 18px 22px;
  background: var(--panel-soft);
  border-top: 1px solid var(--rule-soft);
}
details.page .page-meta {
  display: flex; flex-wrap: wrap; gap: 18px;
  font-size: 12px; color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 12px;
}
details.page .page-meta span b { color: var(--ink-soft); }
details.page .api-row {
  display: grid;
  grid-template-columns: 60px 90px minmax(0, 1fr) auto;
  gap: 10px; align-items: center;
  padding: 5px 10px;
  font-size: 12.5px;
  border-bottom: 1px solid var(--rule-soft);
  text-decoration: none; color: inherit;
}
details.page .api-row:last-child { border-bottom: none; }
details.page .api-row:hover { background: var(--hover-bg); }
details.page .api-row .ar-method {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  font-weight: 600; letter-spacing: .04em;
  text-align: center; padding: 2px 0;
  border-radius: 3px; text-transform: uppercase;
}
details.page .api-row .ar-method.GET    { color: var(--get);    background: var(--get-bg); }
details.page .api-row .ar-method.POST   { color: var(--post);   background: var(--post-bg); }
details.page .api-row .ar-method.PUT    { color: var(--put);    background: var(--put-bg); }
details.page .api-row .ar-method.PATCH  { color: var(--patch);  background: var(--patch-bg); }
details.page .api-row .ar-method.DELETE { color: var(--delete); background: var(--delete-bg); }
details.page .api-row .ar-svc {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em;
  padding: 1px 6px; border-radius: 3px;
  border: 1px solid var(--rule); color: var(--ink-faint);
  text-align: center;
}
details.page .api-row .ar-svc.is-orphan { color: var(--warn); border-color: color-mix(in srgb,var(--warn) 30%,transparent); }
details.page .api-row .ar-path {
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--ink);
}
details.page .api-row .ar-via {
  font-size: 10.5px; color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

/* ============================== INDEX (LANDING) PAGE ============================== */

.svc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px; margin: 18px 0;
}
.svc-card {
  display: block; padding: 18px;
  background: var(--panel); border: 1px solid var(--rule);
  border-radius: 8px; text-decoration: none; color: var(--ink);
  transition: border-color 150ms ease, transform 150ms ease, background 150ms ease;
}
.svc-card:hover {
  border-color: var(--accent); background: var(--bg);
  text-decoration: none;
  transform: translateY(-1px);
}
.svc-card .svc-name {
  font-weight: 600; font-size: 16px; letter-spacing: -.012em;
  color: var(--ink); margin-bottom: 2px;
}
.svc-card .svc-art {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--ink-faint); margin-bottom: 12px;
}
.svc-card .svc-blurb { color: var(--ink-soft); font-size: 13px; line-height: 1.5; min-height: 38px; }
.svc-card .svc-stats {
  display: flex; gap: 14px; margin-top: 12px;
  padding-top: 10px; border-top: 1px solid var(--rule-soft);
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-faint);
}
.svc-card .svc-stats b { color: var(--accent); font-weight: 600; }

/* ============================== FOOTER ============================== */

footer.colophon {
  margin-top: 60px; padding: 24px 0;
  border-top: 1px solid var(--rule);
  font-size: 12px; color: var(--ink-faint);
  display: flex; flex-wrap: wrap; gap: 16px;
  justify-content: space-between; align-items: baseline;
}
footer.colophon .meta { font-family: 'JetBrains Mono', monospace; font-size: 11px; }

/* ============================== JSON CARD ============================== */
.json-card {
  position: relative;
  background: var(--panel-soft);
  border: 1px solid var(--rule);
  border-radius: 6px;
  margin: 8px 0 14px;
  overflow: hidden;
}
.json-card .json-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px 6px 12px;
  border-bottom: 1px solid var(--rule);
  background: var(--panel);
  font-size: 11.5px;
  color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  gap: 10px;
}
.json-card .json-head .json-title {
  display: inline-flex; gap: 8px; align-items: center;
  flex-wrap: wrap; min-width: 0;
}
.json-card .json-head .json-label { color: var(--ink-soft); font-weight: 500; }
.json-card .json-head .json-type {
  color: var(--ink); font-weight: 500; padding: 1px 6px;
  background: var(--panel-soft); border: 1px solid var(--rule); border-radius: 3px;
  white-space: nowrap;
}
.json-card .json-head .json-tag {
  font-size: 10.5px; color: var(--ink-faint); background: var(--panel-soft);
  padding: 1px 6px; border: 1px solid var(--rule); border-radius: 3px;
}
.json-card pre.json-body {
  margin: 0; border: none; border-radius: 0;
  padding: 12px 14px;
  background: transparent;
  font-size: 12.5px;
  max-height: 480px; overflow: auto;
  white-space: pre;
}
.json-card .copy-json {
  cursor: pointer;
  border: 1px solid var(--rule);
  background: var(--panel-soft);
  color: var(--ink-faint);
  padding: 2px 8px; border-radius: 3px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  transition: color 120ms ease, background-color 120ms ease, border-color 120ms ease;
  flex-shrink: 0;
}
.json-card .copy-json:hover { color: var(--ink); background: var(--panel-strong); }
.json-card .copy-json.copied { color: var(--accent); border-color: var(--accent); }

.json-card.is-empty { background: var(--panel); }
.json-card.is-empty .json-empty {
  padding: 14px;
  font-size: 12.5px; color: var(--ink-faint);
}
.json-card.is-empty .json-empty code { color: var(--ink); }

.j-key   { color: var(--accent-ink); }
.j-str   { color: var(--post); }
.j-num   { color: var(--warn); }
.j-bool  { color: var(--patch); }
.j-null  { color: var(--ink-faint); font-style: italic; }

/* ============================== SCHEMA TABLE ============================== */
.schema-card {
  border: 1px solid var(--rule);
  border-radius: 6px;
  background: var(--panel);
  margin: 4px 0 14px;
  overflow: hidden;
}
.schema-card > summary {
  cursor: pointer;
  list-style: none;
  padding: 7px 12px;
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule);
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--ink-soft);
  user-select: none;
}
.schema-card > summary::-webkit-details-marker { display: none; }
.schema-card > summary::before {
  content: "▸"; color: var(--ink-faint);
  font-size: 10px; transition: transform 150ms ease;
  display: inline-block;
}
.schema-card[open] > summary::before { transform: rotate(90deg); }
.schema-card > summary > .sc-name {
  color: var(--ink); font-family: 'JetBrains Mono', monospace; font-weight: 500;
}
.schema-card > summary > .sc-meta {
  margin-left: auto; color: var(--ink-faint); font-size: 11px;
}
.schema-card > summary > .sc-tag {
  font-size: 10.5px; color: var(--ink-faint); background: var(--panel);
  padding: 1px 6px; border: 1px solid var(--rule); border-radius: 3px;
}
.schema-card .schema-rows { padding: 0; }
.schema-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.36fr) minmax(160px, 0.5fr) auto 1fr;
  gap: 12px;
  padding: 7px 14px;
  border-bottom: 1px solid var(--rule-soft);
  font-size: 12.5px;
  align-items: baseline;
}
.schema-row:last-child { border-bottom: none; }
.schema-row > .sr-name {
  font-family: 'JetBrains Mono', monospace; font-weight: 500;
  color: var(--ink); word-break: break-word;
}
.schema-row > .sr-name .sr-cycle { color: var(--warn); font-size: 10px; padding-left: 4px; }
.schema-row > .sr-type {
  font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--ink-soft);
  word-break: break-word;
}
.schema-row > .sr-flags {
  color: var(--ink-faint); font-size: 11px; white-space: nowrap;
}
.schema-row > .sr-flags .req { color: var(--delete); font-weight: 600; }
.schema-row > .sr-notes { color: var(--ink-faint); font-size: 12px; }
.schema-row > .sr-notes code { font-size: .92em; }
.schema-row.is-nested-1 { padding-left: 30px; background: var(--panel-soft); }
.schema-row.is-nested-1 > .sr-name::before { content: "↳ "; color: var(--ink-faint); font-weight: 400; }
.schema-empty { padding: 14px; color: var(--ink-faint); font-size: 12px; text-align: center; }
.schema-deeper {
  padding: 8px 14px; font-size: 11.5px; color: var(--ink-faint);
  background: var(--panel-soft);
  border-top: 1px solid var(--rule-soft);
}

/* ============================== HOME / CATEGORY ============================== */

.shell--home { display: block; max-width: 1200px; margin: 0 auto; padding: 24px 28px 48px; }
main.doc.home { display: block; }

.home-hero {
  padding: 32px 0 24px;
}
.home-hero h1 { font-size: 38px; line-height: 1.1; letter-spacing: -0.02em; margin: 8px 0 12px; }
.home-hero .lede { max-width: 640px; font-size: 15px; color: var(--ink-soft); margin-bottom: 22px; }
.hero-search {
  display: flex; align-items: center; gap: 10px;
  width: 100%; max-width: 640px;
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 14px 18px;
  font-size: 14px;
  color: var(--ink-faint);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.hero-search:hover {
  border-color: var(--rule-strong);
  box-shadow: var(--shadow);
}
.hero-search > svg { color: var(--ink-faint); flex-shrink: 0; }
.hero-search > span:not(.kbd) { flex: 1; text-align: left; }
.hero-search .kbd {
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid var(--rule);
  background: var(--bg);
  padding: 2px 6px; border-radius: 3px;
  font-size: 11px; color: var(--ink-soft);
}

.cat-tiles { margin-top: 12px; }
.cat-grid {
  display: grid; gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: 14px;
}
.cat-tile {
  display: flex; flex-direction: column; gap: 8px;
  padding: 18px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--panel);
  text-decoration: none !important;
  color: var(--ink);
  transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  position: relative;
  overflow: hidden;
}
.cat-tile:hover {
  border-color: var(--rule-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
.cat-tile::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: var(--accent);
}
.cat-tile[data-cat="pre-login"]::before     { background: var(--get); }
.cat-tile[data-cat="dashboard"]::before     { background: var(--post); }
.cat-tile[data-cat="admin"]::before         { background: var(--put); }
.cat-tile[data-cat="my-team-space"]::before { background: var(--patch); }
.ct-head { display: flex; justify-content: space-between; align-items: baseline; }
.ct-label { font-size: 16px; font-weight: 600; }
.ct-count {
  font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600;
  color: var(--ink); letter-spacing: -0.02em;
}
.ct-desc { font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; min-height: 36px; }
.ct-tops { font-size: 11.5px; color: var(--ink-faint); line-height: 1.7; }
.ct-tops a { color: var(--ink-soft); }
.ct-tops a:hover { color: var(--accent-ink); }
.ct-svc-count {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: var(--ink-faint); padding: 0 4px;
  background: var(--panel-soft); border-radius: 3px;
}
.ct-cta { font-size: 12px; color: var(--accent-ink); margin-top: 4px; font-weight: 500; }
.cat-uncat-note { margin-top: 14px; font-size: 12px; color: var(--ink-faint); padding-left: 4px; }

/* coverage panel */
.coverage {
  margin: 36px 0 12px;
  padding: 22px 24px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--panel);
}
.coverage h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
.coverage-intro { margin: 0 0 18px; font-size: 12.5px; color: var(--ink-faint); }
.cov-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 2fr minmax(140px, auto);
  gap: 14px; align-items: center;
  padding: 6px 0;
}
.cov-label { font-size: 13px; color: var(--ink-soft); }
.cov-bar {
  height: 8px; border-radius: 99px;
  background: var(--panel-soft); border: 1px solid var(--rule-soft);
  overflow: hidden;
}
.cov-fill {
  display: block; height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--post));
  transition: width 480ms ease;
}
.cov-pct { font-size: 12px; color: var(--ink-faint); text-align: right; }
.cov-pct b { font-family: 'JetBrains Mono', monospace; color: var(--ink); margin-right: 8px; font-size: 14px; font-weight: 600; }

/* richer service cards */
.svc-card { padding: 18px; gap: 10px; }
.svc-card.svc-card--pages { grid-column: span 1; }
.svc-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.svc-art { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.svc-methods { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.svc-method {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 7px; border-radius: 3px;
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  border: 1px solid var(--rule);
  color: var(--ink-soft);
}
.svc-method-label { font-weight: 600; font-size: 10px; letter-spacing: 0.02em; }
.svc-method--GET    { color: var(--get);    border-color: color-mix(in srgb, var(--get) 30%, var(--rule)); }
.svc-method--POST   { color: var(--post);   border-color: color-mix(in srgb, var(--post) 30%, var(--rule)); }
.svc-method--PUT    { color: var(--put);    border-color: color-mix(in srgb, var(--put) 30%, var(--rule)); }
.svc-method--PATCH  { color: var(--patch);  border-color: color-mix(in srgb, var(--patch) 30%, var(--rule)); }
.svc-method--DELETE { color: var(--delete); border-color: color-mix(in srgb, var(--delete) 30%, var(--rule)); }

.svc-areas { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font-size: 11.5px; color: var(--ink-faint); margin-top: 4px; }
.svc-areas-label { color: var(--ink-faint); margin-right: 2px; }
.svc-area { color: var(--ink-soft); padding: 0 1px; }
.svc-cat-row { display: flex; gap: 4px; margin-top: 8px; align-items: center; }
.svc-cat-dot {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 18px;
  padding: 0 5px; font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid var(--rule); border-radius: 3px;
  color: var(--ink-faint); background: var(--panel-soft);
}
.svc-cat-dot.has { color: var(--ink); background: var(--bg); }
.svc-cat-dot.cat-pre-login.has     { border-color: color-mix(in srgb, var(--get) 30%, var(--rule)); color: var(--get); }
.svc-cat-dot.cat-dashboard.has     { border-color: color-mix(in srgb, var(--post) 30%, var(--rule)); color: var(--post); }
.svc-cat-dot.cat-admin.has         { border-color: color-mix(in srgb, var(--put) 30%, var(--rule)); color: var(--put); }
.svc-cat-dot.cat-my-team-space.has { border-color: color-mix(in srgb, var(--patch) 30%, var(--rule)); color: var(--patch); }

/* category page */
.cat-hero {
  padding: 32px 0 22px;
  border-bottom: 1px solid var(--rule);
}
.cat-hero h1 { font-size: 32px; margin: 6px 0 10px; letter-spacing: -0.02em; }
.cat-hero .lede { max-width: 720px; }

.cat-filters {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  padding: 16px 0;
  position: sticky; top: 52px; z-index: 30;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--rule);
  margin-bottom: 16px;
}
.cat-text {
  flex: 1 1 240px;
  min-width: 240px; max-width: 480px;
  height: 32px; padding: 0 12px;
  font-size: 13px; font-family: inherit; color: var(--ink);
  background: var(--panel); border: 1px solid var(--rule); border-radius: 5px;
}
.cat-text:focus { outline: 1px solid var(--accent); outline-offset: -1px; border-color: var(--accent); }
.cat-chip-row { display: flex; gap: 4px; flex-wrap: wrap; }
.cat-mchip, .cat-svcchip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  font-family: inherit; font-size: 12px;
  background: var(--panel); border: 1px solid var(--rule); border-radius: 4px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.cat-mchip span, .cat-svcchip span { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-faint); }
.cat-mchip:hover, .cat-svcchip:hover { background: var(--panel-soft); }
.cat-mchip.is-active, .cat-svcchip.is-active {
  background: var(--accent-soft); border-color: var(--accent); color: var(--accent-ink);
}
.cat-clear {
  height: 28px; padding: 0 10px;
  background: transparent; border: 1px solid transparent;
  color: var(--ink-faint); cursor: pointer; font-family: inherit; font-size: 12px;
  border-radius: 4px;
  opacity: 0; pointer-events: none;
  transition: opacity 120ms ease, background-color 120ms ease, color 120ms ease;
}
.cat-clear.is-active { opacity: 1; pointer-events: auto; }
.cat-clear:hover { color: var(--ink); border-color: var(--rule); background: var(--panel-soft); }

.cat-svc { margin: 24px 0 32px; }
.cat-svc-head {
  display: flex; align-items: baseline; gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rule-soft);
  margin-bottom: 8px;
}
.cat-svc-name { font-size: 17px; font-weight: 600; }
.cat-svc-meta { font-size: 12px; color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; }

.cat-area { margin: 12px 0; }
.cat-area-label {
  font-size: 11.5px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.04em;
  font-weight: 500; padding: 4px 0;
}
.cat-ep {
  display: grid;
  grid-template-columns: 4px 56px minmax(200px, 0.6fr) 1fr auto;
  gap: 12px; align-items: center;
  padding: 7px 12px;
  border: 1px solid var(--rule-soft); border-radius: 5px;
  margin: 3px 0;
  background: var(--panel);
  text-decoration: none !important;
  color: var(--ink);
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease;
}
.cat-ep:hover { border-color: var(--rule-strong); background: var(--bg); }
.cat-ep .verb-band { width: 4px; height: 18px; border-radius: 2px; }
.cat-ep .verb-band.GET    { background: var(--get); }
.cat-ep .verb-band.POST   { background: var(--post); }
.cat-ep .verb-band.PUT    { background: var(--put); }
.cat-ep .verb-band.PATCH  { background: var(--patch); }
.cat-ep .verb-band.DELETE { background: var(--delete); }
.cat-ep .verb {
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600;
  text-align: center; padding: 1px 0;
  border-radius: 3px;
}
.cat-ep .verb.GET    { color: var(--get);    background: var(--get-bg); }
.cat-ep .verb.POST   { color: var(--post);   background: var(--post-bg); }
.cat-ep .verb.PUT    { color: var(--put);    background: var(--put-bg); }
.cat-ep .verb.PATCH  { color: var(--patch);  background: var(--patch-bg); }
.cat-ep .verb.DELETE { color: var(--delete); background: var(--delete-bg); }
.cat-ep-path { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--ink); word-break: break-all; }
.cat-ep-path .ph { color: var(--ink-faint); font-style: italic; }
.cat-ep-summary { font-size: 12.5px; color: var(--ink-soft); }
.cat-ep-meta { display: inline-flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.cat-ep-auth, .cat-ep-tag {
  font-size: 10.5px; padding: 1px 6px; border-radius: 3px;
  border: 1px solid var(--rule);
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint); background: var(--panel-soft);
}
.cat-ep-auth { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 30%, var(--rule)); }
.cat-ep[hidden] { display: none; }
.cat-empty { padding: 30px 16px; text-align: center; color: var(--ink-faint); font-size: 13px; }

.cat-view-toggle { display: flex; gap: 4px; margin: 12px 0 0; }
.cat-view-btn {
  padding: 4px 14px; font-size: 12.5px; font-weight: 500; border-radius: 6px;
  border: 1px solid var(--rule); background: var(--panel); color: var(--ink-faint); cursor: pointer;
  font-family: inherit;
}
.cat-view-btn.is-active { background: var(--accent); color: #fff; border-color: var(--accent); }
.cat-view-btn:hover:not(.is-active) { background: var(--panel-soft); color: var(--ink); }

.screen-section { margin: 24px 0; }
.screen-section--none { opacity: .65; }
.screen-section[hidden] { display: none; }
.screen-section-head {
  display: flex; align-items: baseline; gap: 12px;
  padding: 8px 0; border-bottom: 1px solid var(--rule); margin-bottom: 8px;
}
.screen-section-label { font-weight: 600; font-size: 14px; color: var(--ink); }
.screen-section-route { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-faint); }

.screen-page { border: 1px solid var(--rule); border-radius: 8px; margin: 6px 0; overflow: hidden; }
.screen-page[hidden] { display: none; }
.screen-page-head {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; cursor: pointer; background: var(--panel); list-style: none;
}
.screen-page-head::-webkit-details-marker { display: none; }
.screen-page-title { font-weight: 500; font-size: 13px; color: var(--ink); }
.screen-page-route { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--ink-faint); }
.screen-page-count { margin-left: auto; font-size: 11.5px; color: var(--ink-faint); }
.screen-page .cat-ep { border-top: 1px solid var(--rule-soft); border-radius: 0; border-left: none; border-right: none; border-bottom: none; margin: 0; }
.screen-page .cat-ep:last-child { border-bottom: none; }

@media (max-width: 720px) {
  .cat-ep { grid-template-columns: 4px 48px 1fr; }
  .cat-ep-summary, .cat-ep-meta { display: none; }
}

/* endpoint body two-column layout (main + Used-by aside on wide viewports) */
.body--with-aside {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 24px;
  align-items: start;
}
.body--with-aside > .body-main { min-width: 0; }
.body--with-aside > .body-aside {
  position: sticky; top: 76px;
  font-size: 12px;
}
.body--with-aside .used-by {
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 12px 14px;
  background: var(--panel);
  max-height: 60vh;
  overflow-y: auto;
}
.body--with-aside .used-by h4 { margin: 0 0 8px; font-size: 12px; }
.body--with-aside .used-by .ub-meta { color: var(--ink-faint); font-weight: 400; }
.body--with-aside .used-by .ub-list { padding: 0; margin: 0; list-style: none; }
.body--with-aside .used-by .ub-list li {
  font-size: 11.5px;
  padding: 6px 0;
  border-bottom: 1px solid var(--rule-soft);
  display: flex; flex-direction: column; gap: 2px;
}
.body--with-aside .used-by .ub-list li:last-child { border-bottom: none; }
.body--with-aside .used-by .ub-route a {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  word-break: break-word;
}
.body--with-aside .used-by .ub-via { color: var(--ink-faint); font-size: 10.5px; }
.body--with-aside .used-by .ub-empty {
  color: var(--ink-faint); font-size: 11.5px;
  padding: 4px 0;
}
@media (max-width: 920px) {
  .body--with-aside { grid-template-columns: 1fr; }
  .body--with-aside > .body-aside { position: static; }
}

/* category badge on endpoint summary */
.ep-cat-badge {
  display: inline-block;
  margin-left: auto;
  margin-right: 36px; /* keep clear of the copy button */
  padding: 1px 8px;
  font-size: 10.5px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid var(--rule);
  border-radius: 99px;
  color: var(--ink-faint);
  background: var(--panel-soft);
  text-decoration: none !important;
  white-space: nowrap;
  flex-shrink: 0;
}
.ep-cat-badge:hover {
  color: var(--ink); background: var(--bg);
}
.ep-cat-badge.cat-pre-login     { color: var(--get);    border-color: color-mix(in srgb, var(--get) 30%, var(--rule)); }
.ep-cat-badge.cat-dashboard     { color: var(--post);   border-color: color-mix(in srgb, var(--post) 30%, var(--rule)); }
.ep-cat-badge.cat-admin         { color: var(--put);    border-color: color-mix(in srgb, var(--put) 30%, var(--rule)); }
.ep-cat-badge.cat-my-team-space { color: var(--patch);  border-color: color-mix(in srgb, var(--patch) 30%, var(--rule)); }

/* envelope card showing the wrapper around the data slot */
.envelope-card {
  border: 1px dashed var(--rule-strong);
  border-radius: 6px;
  padding: 9px 12px;
  margin: 4px 0 8px;
  background: var(--panel);
  font-size: 12px;
  color: var(--ink-faint);
  display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap;
}
.envelope-card .env-title {
  color: var(--ink); font-family: 'JetBrains Mono', monospace; font-weight: 600;
}
.envelope-card code.slot {
  color: var(--accent-ink); background: var(--accent-soft); border: none;
  padding: 1px 6px; font-weight: 500;
}
.envelope-card .env-fields {
  color: var(--ink-faint); font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
}
`;

/**
 * APPBAR options:
 *   title, brandSub, indexHref       — brand
 *   nav: {
 *     activeCategory: string|null,
 *     activeService:  string|null,
 *     activePages:    boolean,
 *     activeIndex:    boolean,
 *     categories: [{ id, label, count, href }],
 *     services:   [{ id, displayName, count, href }],
 *     pagesHref:  string,
 *     pagesCount: number
 *   }
 */
const APPBAR = ({ title, brandSub, indexHref, nav }) => {
  const n = nav || { categories: [], services: [], pagesHref: 'pages.html', pagesCount: 0 };
  const cur = (test) => test ? ' is-current' : '';
  const aria = (test) => test ? ' aria-current="page"' : '';
  const catLinks = (n.categories || []).map(c =>
    `<a class="nv-link${cur(n.activeCategory === c.id)}" href="${escapeAttr(c.href)}"${aria(n.activeCategory === c.id)}>${escapeHtml(c.label)}<span class="nv-count">${c.count != null ? c.count : '·'}</span></a>`
  ).join('');
  const svcMenu = (n.services && n.services.length) ? `
    <details class="services-menu">
      <summary>Services <span class="nv-count">${n.services.length}</span></summary>
      <div class="menu-panel">
        ${n.services.map(s =>
          `<a href="${escapeAttr(s.href)}" class="${n.activeService === s.id ? 'is-current' : ''}"><span class="ms-svc">${escapeHtml(s.displayName)}</span><span class="ms-count">${s.count != null ? s.count : '—'}</span></a>`
        ).join('')}
      </div>
    </details>` : '';
  const pagesLink = n.pagesHref ? `<a class="nv-link${cur(n.activePages)}" href="${escapeAttr(n.pagesHref)}"${aria(n.activePages)}>UI Pages<span class="nv-count">${n.pagesCount || 0}</span></a>` : '';
  return `
<header class="appbar">
  <div class="brand">
    <span class="dot" aria-hidden="true"></span>
    <a href="${escapeAttr(indexHref)}">${escapeHtml(title)}</a>
    <em>${escapeHtml(brandSub)}</em>
  </div>
  <nav class="topnav" aria-label="Primary">
    <a class="nv-link${cur(n.activeIndex)}" href="${escapeAttr(indexHref)}"${aria(n.activeIndex)}>Home</a>
    ${catLinks ? `<span class="nv-sep" aria-hidden="true"></span>${catLinks}` : ''}
    ${svcMenu ? `<span class="nv-sep" aria-hidden="true"></span>${svcMenu}` : ''}
    ${pagesLink ? `<span class="nv-sep" aria-hidden="true"></span>${pagesLink}` : ''}
  </nav>
  <div class="actions">
    <button class="search-trigger" id="search-trigger" aria-label="Open search">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/></svg>
      <span class="label">Search…</span>
      <span class="kbd"><span id="kbd-meta">⌘</span>K</span>
    </button>
    <button class="icon-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme">
      <svg id="theme-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"></svg>
    </button>
  </div>
</header>`;
};

const PALETTE = `
<div class="palette-backdrop" id="palette-backdrop"></div>
<div class="palette" id="palette" role="dialog" aria-label="Search endpoints">
  <div class="palette-input-row">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
      <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/>
    </svg>
    <input id="palette-input" type="text" placeholder="Search across every service by URL or summary…" autocomplete="off" spellcheck="false">
    <span class="kbd" style="border:1px solid var(--rule); background: var(--panel-soft); padding: 2px 6px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-faint);">esc</span>
  </div>
  <div class="palette-results" id="palette-results"></div>
  <div class="palette-foot">
    <span><span class="key">↑</span><span class="key">↓</span> navigate</span>
    <span><span class="key">↵</span> jump to endpoint</span>
    <span><span class="key">esc</span> close</span>
  </div>
</div>`;

const SCRIPT = `
(() => {
  const G = window.__GLOBAL_INDEX__ || [];

  // Theme
  const themeBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const moonSVG = '<path d="M11.8 8.6A4.6 4.6 0 0 1 7.2 4a4 4 0 0 0-1 .1 5.5 5.5 0 1 0 5.7 5.6 4 4 0 0 0-.1-1.1z" fill="currentColor"/>';
  const sunSVG = '<circle cx="8" cy="8" r="3.2"/><line x1="8" y1="1.2" x2="8" y2="2.6" stroke-linecap="round"/><line x1="8" y1="13.4" x2="8" y2="14.8" stroke-linecap="round"/><line x1="1.2" y1="8" x2="2.6" y2="8" stroke-linecap="round"/><line x1="13.4" y1="8" x2="14.8" y2="8" stroke-linecap="round"/><line x1="3.1" y1="3.1" x2="4.1" y2="4.1" stroke-linecap="round"/><line x1="11.9" y1="11.9" x2="12.9" y2="12.9" stroke-linecap="round"/><line x1="3.1" y1="12.9" x2="4.1" y2="11.9" stroke-linecap="round"/><line x1="11.9" y1="4.1" x2="12.9" y2="3.1" stroke-linecap="round"/>';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (themeIcon) themeIcon.innerHTML = t === 'dark' ? sunSVG : moonSVG;
    try { localStorage.setItem('phx-theme', t); } catch(e) {}
  }
  let initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  try { const saved = localStorage.getItem('phx-theme'); if (saved === 'light' || saved === 'dark') initialTheme = saved; } catch(e) {}
  applyTheme(initialTheme);
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  const isMac = /Mac|iP(hone|od|ad)/.test(navigator.platform || '');
  const kbdMeta = document.getElementById('kbd-meta');
  if (kbdMeta) kbdMeta.textContent = isMac ? '⌘' : 'Ctrl';

  // Palette
  const palette = document.getElementById('palette');
  const backdrop = document.getElementById('palette-backdrop');
  const input = document.getElementById('palette-input');
  const results = document.getElementById('palette-results');
  const trigger = document.getElementById('search-trigger');
  let open = false, activeIdx = 0, current = [];

  function escHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function highlight(text, tokens) {
    let html = escHTML(text);
    tokens.forEach(t => { if (!t) return; const re = new RegExp('('+t.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+')','ig'); html = html.replace(re, '<mark>$1</mark>'); });
    return html;
  }
  function score(ep, tokens) {
    let s = 0; const path = ep.path.toLowerCase(); const summ = (ep.summary||'').toLowerCase(); const area = (ep.area||'').toLowerCase(); const svc = (ep.svcName||'').toLowerCase();
    for (const t of tokens) { if (!t) continue;
      const ip = path.indexOf(t), is = summ.indexOf(t), ia = area.indexOf(t), iv = svc.indexOf(t);
      if (ip<0 && is<0 && ia<0 && iv<0) return -1;
      if (ip>=0) s += 100 - ip;
      if (is>=0) s += 30 - Math.min(is,30);
      if (ia>=0) s += 10;
      if (iv>=0) s += 8;
    }
    return s;
  }
  function render(q) {
    const tokens = q.toLowerCase().split(/\\s+/).filter(Boolean);
    let scored;
    if (!tokens.length) scored = G.slice(0,80).map(ep=>({ep,s:0}));
    else scored = G.map(ep=>({ep,s:score(ep,tokens)})).filter(x=>x.s>=0).sort((a,b)=>b.s-a.s).slice(0,120);
    current = scored.map(x=>x.ep); activeIdx = 0;
    if (!current.length) { results.innerHTML = '<div class="palette-empty">No endpoints match <code>'+escHTML(q)+'</code></div>'; return; }
    results.innerHTML = current.map((ep,i)=>(
      '<div class="p-result '+(i===0?'is-active':'')+'" data-idx="'+i+'" data-href="'+escHTML(ep.href)+'">'
      + '<span class="p-method '+ep.method+'">'+ep.method+'</span>'
      + '<span class="p-svc">'+escHTML(ep.svcName)+'</span>'
      + '<span class="p-area">'+escHTML(ep.area)+'</span>'
      + '<div class="p-main">'
      + '<div class="p-path">'+highlight(ep.path,tokens)+'</div>'
      + '<div class="p-summary">'+highlight(ep.summary||'',tokens)+'</div>'
      + '</div></div>'
    )).join('');
    results.scrollTop = 0;
  }
  function setActive(i){ if(!current.length) return; activeIdx = (i+current.length)%current.length;
    const items = results.querySelectorAll('.p-result'); items.forEach(el=>el.classList.remove('is-active'));
    const t = items[activeIdx]; if (t){ t.classList.add('is-active'); t.scrollIntoView({block:'center'}); } }
  function jumpTo(href){ closeP(); if (!href) return; window.location.href = href; }
  function openP(){ open=true; palette.classList.add('is-open'); backdrop.classList.add('is-open'); input.value=''; render(''); setTimeout(()=>input.focus(),50); }
  function closeP(){ open=false; palette.classList.remove('is-open'); backdrop.classList.remove('is-open'); }
  if (trigger) trigger.addEventListener('click', openP);
  if (backdrop) backdrop.addEventListener('click', closeP);
  if (input) input.addEventListener('input', e => render(e.target.value));
  if (results) {
    results.addEventListener('click', e => { const it=e.target.closest('.p-result'); if (it) jumpTo(it.dataset.href); });
    results.addEventListener('mousemove', e => { const it=e.target.closest('.p-result'); if (!it) return; const i=parseInt(it.dataset.idx,10); if (!isNaN(i)&&i!==activeIdx) setActive(i); });
  }
  document.addEventListener('keydown', e => {
    const isMod = isMac ? e.metaKey : e.ctrlKey;
    if (isMod && (e.key==='k' || e.key==='K')) { e.preventDefault(); open?closeP():openP(); return; }
    if (!open && e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); openP(); return; }
    if (!open) return;
    if (e.key==='Escape') { e.preventDefault(); closeP(); }
    else if (e.key==='ArrowDown') { e.preventDefault(); setActive(activeIdx+1); }
    else if (e.key==='ArrowUp')   { e.preventDefault(); setActive(activeIdx-1); }
    else if (e.key==='Enter') { e.preventDefault(); const ep=current[activeIdx]; if (ep) jumpTo(ep.href); }
  });

  // JSON syntax-highlight (one regex pass per pre.json-body)
  function highlightJson(s) {
    const esc = String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    return esc.replace(
      /("(?:[^"\\\\]|\\\\.)*"\\s*:)|("(?:[^"\\\\]|\\\\.)*")|\\b(true|false|null)\\b|(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)/g,
      function (m, key, str, lit, num) {
        if (key) return '<span class="j-key">' + key + '</span>';
        if (str) return '<span class="j-str">' + str + '</span>';
        if (lit) return '<span class="j-' + (lit === 'null' ? 'null' : 'bool') + '">' + lit + '</span>';
        if (num) return '<span class="j-num">' + num + '</span>';
        return m;
      }
    );
  }
  document.querySelectorAll('pre.json-body').forEach(pre => {
    pre.innerHTML = highlightJson(pre.textContent);
  });
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-json'); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const card = btn.closest('.json-card'); if (!card) return;
    const pre = card.querySelector('pre.json-body'); if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard?.writeText(text).then(() => {
      btn.classList.add('copied');
      btn.textContent = '✓ copied';
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'copy'; }, 1400);
    });
  });

  // Copy-path buttons
  document.querySelectorAll('details.endpoint').forEach(d => {
    const summary = d.querySelector('summary');
    const pathEl = summary.querySelector('.e-path');
    const path = pathEl ? pathEl.textContent.trim() : '';
    const btn = document.createElement('button');
    btn.className = 'copy-path'; btn.title = 'Copy path';
    btn.innerHTML = 'copy';
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard?.writeText(path).then(()=>{
        btn.classList.add('copied'); btn.innerHTML = '✓ copied';
        setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='copy'; },1400);
      });
    });
    summary.appendChild(btn);
  });

  // TOC scroll-spy
  const tocLinks = Array.from(document.querySelectorAll('aside.toc a[data-toc]'));
  const tocTargets = tocLinks.map(a => document.getElementById(a.dataset.toc)).filter(Boolean);
  function updateActiveToc() {
    if (!tocTargets.length) return;
    const sy = window.scrollY + 100;
    let activeId = tocTargets[0].id;
    for (const t of tocTargets) { if (t.offsetTop <= sy) activeId = t.id; else break; }
    tocLinks.forEach(a => a.classList.toggle('active', a.dataset.toc === activeId));
    document.querySelectorAll('nav.rail a.area-link').forEach(a => a.classList.remove('is-active'));
    const ra = document.querySelector('nav.rail a.area-link[href="#'+activeId+'"]'); if (ra) ra.classList.add('is-active');
  }
  let rp = false;
  window.addEventListener('scroll', () => { if (!rp) { rp = true; requestAnimationFrame(()=>{ updateActiveToc(); rp = false; }); } }, { passive:true });
  updateActiveToc();

  function expandAnchor() {
    const h = location.hash.slice(1); if (!h) return;
    const t = document.getElementById(h);
    if (t && t.tagName.toLowerCase() === 'details') t.open = true;
  }
  window.addEventListener('hashchange', expandAnchor); expandAnchor();

  // Hero search trigger on the home page opens the same palette
  const heroBtn = document.getElementById('hero-search-trigger');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => openP());
    const km = heroBtn.querySelector('.kbd-meta-2');
    if (km) km.textContent = isMac ? '⌘' : 'Ctrl';
  }

  // Category-page filters
  const catFilters = document.getElementById('cat-filters');
  if (catFilters) {
    const text = document.getElementById('cat-text');
    const clear = document.getElementById('cat-clear');
    const mchips = Array.from(catFilters.querySelectorAll('.cat-mchip'));
    const schips = Array.from(catFilters.querySelectorAll('.cat-svcchip'));
    const eps = Array.from(document.querySelectorAll('.cat-ep'));
    const svcSections = Array.from(document.querySelectorAll('.cat-svc'));
    const screenSections = Array.from(document.querySelectorAll('.screen-section'));
    const screenPages = Array.from(document.querySelectorAll('.screen-page'));
    let activeMethod = null;
    let activeSvcs = new Set();
    let q = '';
    function apply() {
      for (const ep of eps) {
        const m = ep.dataset.method;
        const s = ep.dataset.svc;
        const h = ep.dataset.haystack || '';
        let show = true;
        if (activeMethod && m !== activeMethod) show = false;
        if (show && activeSvcs.size && !activeSvcs.has(s)) show = false;
        if (show && q && !h.includes(q)) show = false;
        ep.hidden = !show;
      }
      // Hide empty service sections
      for (const sec of svcSections) {
        const visible = sec.querySelectorAll('.cat-ep:not([hidden])').length;
        sec.hidden = !visible;
      }
      // Hide empty screen pages and sections
      for (const pg of screenPages) {
        const visible = pg.querySelectorAll('.cat-ep:not([hidden])').length;
        pg.hidden = !visible;
      }
      for (const sec of screenSections) {
        const visible = sec.querySelectorAll('.screen-page:not([hidden])').length;
        sec.hidden = !visible;
      }
      // Show clear button only when a filter is active
      const hasFilter = !!(activeMethod || activeSvcs.size || q);
      clear.classList.toggle('is-active', hasFilter);
    }
    text.addEventListener('input', e => { q = e.target.value.toLowerCase().trim(); apply(); });
    mchips.forEach(c => c.addEventListener('click', () => {
      const m = c.dataset.method;
      activeMethod = (activeMethod === m) ? null : m;
      mchips.forEach(x => x.classList.toggle('is-active', x.dataset.method === activeMethod));
      apply();
    }));
    schips.forEach(c => c.addEventListener('click', () => {
      const s = c.dataset.svc;
      if (activeSvcs.has(s)) activeSvcs.delete(s); else activeSvcs.add(s);
      schips.forEach(x => x.classList.toggle('is-active', activeSvcs.has(x.dataset.svc)));
      apply();
    }));
    clear.addEventListener('click', () => {
      activeMethod = null; activeSvcs.clear(); q = ''; text.value = '';
      mchips.forEach(x => x.classList.remove('is-active'));
      schips.forEach(x => x.classList.remove('is-active'));
      apply();
    });

    // View toggle (By Service / By Screen) with sessionStorage persistence
    const serviceView = document.getElementById('service-view');
    const screenView  = document.getElementById('screen-view');
    const viewBtns    = Array.from(document.querySelectorAll('.cat-view-btn'));
    function applyView(v) {
      viewBtns.forEach(b => b.classList.toggle('is-active', b.dataset.view === v));
      if (serviceView) serviceView.style.display = v === 'service' ? '' : 'none';
      if (screenView)  screenView.style.display  = v === 'screen'  ? '' : 'none';
      try { sessionStorage.setItem('cat-view', v); } catch(e) {}
      apply();
    }
    viewBtns.forEach(btn => btn.addEventListener('click', () => applyView(btn.dataset.view)));
    // Restore last-used view
    try { const saved = sessionStorage.getItem('cat-view'); if (saved === 'screen') applyView('screen'); } catch(e) {}
  }

  if ('IntersectionObserver' in window) {
    const eps = Array.from(document.querySelectorAll('details.endpoint'));
    const map = new Map(Array.from(document.querySelectorAll('nav.rail a.ep-link')).map(a=>[a.getAttribute('href').slice(1),a]));
    const obs = new IntersectionObserver(es => es.forEach(en => { const l = map.get(en.target.id); if (!l) return; if (en.isIntersecting) l.classList.add('is-active'); else l.classList.remove('is-active'); }), { rootMargin:'-30% 0px -55% 0px' });
    eps.forEach(el => obs.observe(el));
  }

  // Expand all / Collapse all on service pages
  const expandAllBtn = document.getElementById('expand-all');
  if (expandAllBtn) {
    const allEndpoints = Array.from(document.querySelectorAll('details.endpoint'));
    let allExpanded = false;
    expandAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      allEndpoints.forEach(d => { d.open = allExpanded; });
      expandAllBtn.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    });
  }

  // Position services dropdown panel (fixed, escapes topnav overflow clipping)
  document.querySelectorAll('details.services-menu').forEach(el => {
    el.addEventListener('toggle', () => {
      if (!el.open) return;
      const s = el.querySelector('summary');
      const p = el.querySelector('.menu-panel');
      if (!s || !p) return;
      const r = s.getBoundingClientRect();
      p.style.top = (r.bottom + 6) + 'px';
      p.style.left = r.left + 'px';
    });
  });
})();
`;

function escapeHtml(s) { return String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function escapeAttr(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = { FONTS, CSS, SCRIPT, APPBAR, PALETTE, escapeHtml, escapeAttr };
