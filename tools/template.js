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
/* ============================== DESIGN TOKENS ==============================
 * Phoenix v2 — calm developer-portal aesthetic.
 * Spacing, radii, shadows, type, motion, z-index follow a real scale (no magic numbers below).
 * Re-tuned dark mode for AAA contrast at 12px+ body text.
 * ========================================================================== */
:root {
  /* Spacing — base 4 */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-7: 28px; --s-8: 32px;
  --s-10: 40px; --s-12: 48px; --s-16: 64px; --s-20: 80px;

  /* Radius */
  --r-1: 4px; --r-2: 6px; --r-3: 10px; --r-4: 14px; --r-pill: 999px;

  /* Type scale */
  --t-2xs: 10.5px; --t-xs: 11px; --t-sm: 12px; --t-base: 13px;
  --t-md: 14px; --t-lg: 16px; --t-xl: 18px; --t-2xl: 22px;
  --t-3xl: 28px; --t-4xl: 36px; --t-5xl: 44px;

  /* Z-index */
  --z-dropdown: 30; --z-appbar: 40; --z-overlay: 50;
  --z-palette: 60; --z-toast: 70;

  /* Motion */
  --d-fast: 120ms; --d-base: 180ms; --d-slow: 260ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* App chrome */
  --appbar-h: 52px;
}
@media (max-width: 820px) {
  :root { --appbar-h: 92px; }
}

:root[data-theme="light"] {
  --bg:           #ffffff;
  --panel:        #fbfbfc;
  --panel-soft:   #f5f5f7;
  --panel-strong: #e7e7ea;
  --ink:          #0f0f12;
  --ink-soft:     #2a2a30;
  --ink-faint:    #5b5b66;
  --rule:         #e6e6ea;
  --rule-soft:    #f0f0f3;
  --rule-strong:  #cfcfd5;
  --accent:       #2354e6;
  --accent-soft:  rgba(35,84,230,0.08);
  --accent-ink:   #1a3fb8;
  --warn:         #a35200;
  --warn-soft:    rgba(163,82,0,0.08);
  --get:    #0277b8; --get-bg:    rgba(2,119,184,0.09);
  --post:   #057a4d; --post-bg:   rgba(5,122,77,0.09);
  --put:    #b45e00; --put-bg:    rgba(180,94,0,0.09);
  --patch:  #6929c4; --patch-bg:  rgba(105,41,196,0.09);
  --delete: #c1272d; --delete-bg: rgba(193,39,45,0.09);
  --cat-pre-login:     #0277b8;
  --cat-dashboard:     #2354e6;
  --cat-admin:         #b45e00;
  --cat-my-team-space: #6929c4;
  --shadow-1: 0 1px 2px rgba(15,23,42,.05);
  --shadow-2: 0 2px 6px -1px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04);
  --shadow-3: 0 8px 24px -6px rgba(15,23,42,.10), 0 2px 4px rgba(15,23,42,.04);
  --shadow-4: 0 20px 50px -10px rgba(15,23,42,.16);
  --shadow: var(--shadow-1);
  --hover-bg: rgba(15,15,18,0.025);
  --selection: rgba(35,84,230,0.18);
  --hero-tint: linear-gradient(180deg, rgba(35,84,230,0.04) 0%, rgba(35,84,230,0) 80%);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --bg:           #08080a;
  --panel:        #111114;
  --panel-soft:   #17171b;
  --panel-strong: #25252b;
  --ink:          #fafafa;
  --ink-soft:     #e4e4e8;
  --ink-faint:    #b4b4be;
  --rule:         #2a2a30;
  --rule-soft:    #1c1c20;
  --rule-strong:  #45454d;
  --accent:       #6ea8ff;
  --accent-soft:  rgba(110,168,255,0.14);
  --accent-ink:   #a8c5ff;
  --warn:         #fbbf24;
  --warn-soft:    rgba(251,191,36,0.12);
  --get:    #5cc4f5; --get-bg:    rgba(92,196,245,0.14);
  --post:   #4fd6a0; --post-bg:   rgba(79,214,160,0.14);
  --put:    #fbbf24; --put-bg:    rgba(251,191,36,0.14);
  --patch:  #b495f7; --patch-bg:  rgba(180,149,247,0.14);
  --delete: #f87171; --delete-bg: rgba(248,113,113,0.14);
  --cat-pre-login:     #5cc4f5;
  --cat-dashboard:     #6ea8ff;
  --cat-admin:         #fbbf24;
  --cat-my-team-space: #b495f7;
  --shadow-1: 0 1px 0 rgba(255,255,255,0.04) inset;
  --shadow-2: 0 2px 8px rgba(0,0,0,0.30);
  --shadow-3: 0 12px 28px -6px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.04) inset;
  --shadow-4: 0 24px 64px -12px rgba(0,0,0,0.55);
  --shadow: var(--shadow-1);
  --hover-bg: rgba(255,255,255,0.04);
  --selection: rgba(110,168,255,0.30);
  --hero-tint: linear-gradient(180deg, rgba(110,168,255,0.06) 0%, rgba(110,168,255,0) 80%);
  color-scheme: dark;
}

* { box-sizing: border-box; }
::selection { background: var(--selection); }
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--r-1);
}
html, body { margin: 0; padding: 0; overflow-x: hidden; }
html {
  scroll-behavior: smooth;
  scroll-padding-top: calc(var(--appbar-h) + var(--s-6));
}
body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: var(--t-md); line-height: 1.55;
  font-feature-settings: "ss01", "cv02", "cv11";
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  transition: background-color var(--d-base) var(--ease-out), color var(--d-base) var(--ease-out);
}

/* Inline icon sprite — single source of truth for every icon used by chrome,
 * spotlight, endpoint cards, and new views. Reference via <svg class="i"><use href="#i-X"/></svg> */
.i { width: 14px; height: 14px; flex-shrink: 0; vertical-align: -2px; }
.i--sm { width: 12px; height: 12px; }
.i--lg { width: 16px; height: 16px; }
.i--xl { width: 20px; height: 20px; }
.i-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }

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
.topnav a[aria-current="page"],
.topnav .services-menu summary.is-current {
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
  grid-template-columns: 260px minmax(0, 1fr);
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
nav.rail .rail-toggle { display: none; }
main.doc { min-width: 0; padding: 36px 8px 100px; max-width: 1040px; justify-self: start; }
aside.toc {
  position: sticky; top: 52px; align-self: start;
  height: calc(100vh - 52px); overflow-y: auto;
  padding: 36px 0 80px;
  scrollbar-width: none;
}
aside.toc::-webkit-scrollbar { display: none; }

@media (max-width: 1100px) {
  .shell { grid-template-columns: 240px minmax(0, 1fr); gap: 28px; }
  nav.rail { margin-right: -28px; }
}
@media (max-width: 820px) {
  .shell { grid-template-columns: 1fr; padding: 0 16px; }
  nav.rail {
    position: sticky; top: var(--appbar-h); z-index: var(--z-dropdown);
    height: auto; max-height: 46px; overflow: hidden;
    padding: 0; background: var(--bg);
    border-right: none; border-bottom: 1px solid var(--rule);
    margin-right: 0; padding-right: 0;
  }
  nav.rail.is-open {
    max-height: calc(100vh - var(--appbar-h));
    overflow-y: auto;
    padding-bottom: 18px;
  }
  nav.rail .rail-toggle {
    width: 100%; height: 46px;
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--s-2);
    padding: 0 var(--s-2);
    background: var(--bg);
    border: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--t-sm);
    cursor: pointer;
  }
  nav.rail .rail-toggle .count {
    color: var(--ink-faint);
    font-family: 'JetBrains Mono', monospace;
    font-size: var(--t-xs);
  }
  .appbar {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "brand actions" "nav nav";
    height: auto; min-height: var(--appbar-h);
    padding: 6px 14px 0;
    gap: 0 10px;
  }
  .appbar .brand { grid-area: brand; min-width: 0; }
  .appbar .brand em { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .appbar .actions { grid-area: actions; }
  .topnav { grid-area: nav; width: 100%; height: 34px; }
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
/* Per-method color tokens — inherited by children, used for expanded state theming */
.endpoint[data-method="GET"]    { --m-color: var(--get);    --m-bg: var(--get-bg); }
.endpoint[data-method="POST"]   { --m-color: var(--post);   --m-bg: var(--post-bg); }
.endpoint[data-method="PUT"]    { --m-color: var(--put);    --m-bg: var(--put-bg); }
.endpoint[data-method="PATCH"]  { --m-color: var(--patch);  --m-bg: var(--patch-bg); }
.endpoint[data-method="DELETE"] { --m-color: var(--delete); --m-bg: var(--delete-bg); }
.ep-badges { display: flex; gap: 6px; align-items: center; }
.ep-used-badge {
  font-size: 10.5px; font-weight: 500; padding: 1px 7px; border-radius: 10px;
  background: var(--accent-soft); color: var(--accent-ink);
  font-family: 'JetBrains Mono', monospace; flex-shrink: 0;
  white-space: nowrap;
}
.ep-used-badge--twin {
  background: var(--warn-soft);
  color: var(--warn);
}
.endpoint .body {
  padding: 14px 18px 18px 86px;
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 5%, var(--bg));
  border-top: 1px solid color-mix(in srgb, var(--m-color, var(--rule-soft)) 15%, var(--rule-soft));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--m-color, var(--rule-strong)) 40%, transparent);
}
.endpoint-loading {
  display: none;
  padding: var(--s-3) var(--s-4) var(--s-3) 86px;
  border-top: 1px solid color-mix(in srgb, var(--m-color, var(--rule-soft)) 15%, var(--rule-soft));
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 4%, var(--bg));
  color: var(--ink-faint);
  font-size: var(--t-sm);
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--m-color, var(--rule-strong)) 35%, transparent);
}
.endpoint[open] > .endpoint-loading { display: block; }
.endpoint .body > *:first-child { margin-top: 0; }
.endpoint[open] > summary {
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 8%, var(--panel-soft));
}
.endpoint[open] {
  margin-bottom: 2px;
  box-shadow: 0 3px 10px -3px rgba(0,0,0,0.08);
}
/* Dark mode: use panel-soft as base for more visible tinting (bg is near-black) */
:root[data-theme="dark"] .endpoint[open] {
  box-shadow: 0 3px 14px -3px rgba(0,0,0,0.45);
}
:root[data-theme="dark"] .endpoint .body {
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 11%, var(--panel));
  box-shadow: inset 3px 0 0 color-mix(in srgb, var(--m-color, var(--rule-strong)) 55%, transparent);
}
:root[data-theme="dark"] .endpoint-loading {
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 9%, var(--panel));
}
:root[data-theme="dark"] .endpoint[open] > summary {
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 15%, var(--panel-soft));
}
/* Section headings inside expanded panels — method-accented left marker */
.endpoint .body h4 {
  display: flex; align-items: center; gap: 7px;
}
.endpoint .body h4::before {
  content: ''; width: 3px; height: 11px;
  background: color-mix(in srgb, var(--m-color, var(--rule-strong)) 75%, transparent);
  border-radius: 2px; flex-shrink: 0;
}
/* Active tab inherits method color */
.endpoint[open] .ep-tab.is-active { color: var(--m-color, var(--ink)); }
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
  position: fixed; top: 10vh; left: 50%;
  transform: translateX(-50%) translateY(-6px);
  width: min(880px, calc(100vw - 32px));
  max-height: 78vh;
  background: var(--bg);
  border: 1px solid var(--rule-strong); border-radius: var(--r-3);
  z-index: 101;
  display: flex; flex-direction: column;
  box-shadow: 0 32px 80px -20px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent);
  opacity: 0; pointer-events: none;
  transition: opacity 150ms ease, transform 220ms cubic-bezier(.2,.8,.2,1);
  overflow: hidden;
}
:root[data-theme="dark"] .palette { box-shadow: 0 32px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent); }
.palette.is-open { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.palette-input-row {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--rule);
}
.palette-input-row svg { opacity: .55; flex-shrink: 0; color: var(--ink-soft); }
.palette input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--ink); font-family: inherit; font-size: 16px; letter-spacing: -0.005em;
}
.palette input:focus { outline: none; }
.palette input::placeholder { color: var(--ink-faint); }
.palette-esc {
  border: 1px solid var(--rule); background: var(--panel-soft);
  padding: 3px 8px; border-radius: var(--r-1);
  font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  color: var(--ink-faint); letter-spacing: 0.04em;
}
.palette-tabs {
  display: flex; gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule);
  background: var(--panel-soft);
}
.palette-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-2);
  font-family: inherit;
  font-size: var(--t-sm); font-weight: 500;
  color: var(--ink-faint);
  cursor: pointer;
  transition: background var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out);
}
.palette-tab:hover { color: var(--ink); }
.palette-tab.is-active {
  background: var(--bg); color: var(--ink);
  border-color: var(--rule);
  box-shadow: var(--shadow-1);
}
.palette-tab .i { width: 13px; height: 13px; color: currentColor; }
.palette-tab-count {
  font-family: 'JetBrains Mono', monospace; font-size: var(--t-2xs);
  color: var(--ink-faint);
  padding: 1px 6px; border-radius: var(--r-1);
  background: var(--panel-soft);
  min-width: 22px; text-align: center;
}
.palette-tab.is-active .palette-tab-count { background: var(--accent-soft); color: var(--accent-ink); }
.palette-results {
  overflow-y: auto; padding: 6px;
  scrollbar-width: thin; scrollbar-color: var(--rule-strong) transparent;
}
.palette-results::-webkit-scrollbar { width: 5px; }
.palette-results::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 4px; }
.p-result {
  display: grid;
  grid-template-columns: 64px auto auto minmax(0, 1fr) auto;
  gap: 12px; align-items: center;
  padding: 10px 12px; border-radius: var(--r-2);
  cursor: pointer; transition: background 100ms ease;
}
.p-svc.p-svc--page {
  background: var(--panel-soft);
  border-color: var(--rule);
  color: var(--ink-soft);
}
.p-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px; color: var(--ink-faint);
  white-space: nowrap;
  background: var(--panel-soft); border: 1px solid var(--rule);
  padding: 2px 8px; border-radius: var(--r-1);
}
.p-count.is-zero { opacity: .45; }
.p-result.is-active .p-count {
  background: var(--bg);
  border-color: color-mix(in srgb, var(--accent) 25%, var(--rule));
  color: var(--accent-ink);
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
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--rule-soft);
}
.ub-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.ub-title {
  font-size: var(--t-base);
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -.01em;
}
.ub-count {
  font-size: var(--t-2xs);
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint);
}
.ub-none {
  font-size: var(--t-sm);
  color: var(--ink-faint);
  font-style: italic;
  margin: 4px 0 0;
}
.ub-list-head {
  display: grid;
  grid-template-columns: minmax(140px, 2fr) minmax(0, 3fr) minmax(0, 1.5fr);
  gap: 0 12px;
  padding: 4px 12px;
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--ink-faint);
}
.ub-list {
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  overflow: hidden;
  margin-bottom: 4px;
}
a.ub-row {
  display: grid;
  grid-template-columns: minmax(140px, 2fr) minmax(0, 3fr) minmax(0, 1.5fr);
  gap: 0 12px;
  align-items: baseline;
  padding: 6px 12px;
  border-bottom: 1px solid var(--rule-soft);
  text-decoration: none;
  color: inherit;
  transition: background var(--d-fast) var(--ease-out);
}
a.ub-row:last-of-type { border-bottom: none; }
a.ub-row:hover { background: var(--accent-soft); text-decoration: none; }
.ub-row-route {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
  font-weight: 500;
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ub-row-title {
  font-size: var(--t-xs);
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ub-row-via {
  font-size: 10.5px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}
.ub-more {
  display: block;
  width: 100%;
  padding: 6px 12px;
  background: var(--panel-soft);
  border: none;
  border-top: 1px solid var(--rule-soft);
  font-size: var(--t-xs);
  color: var(--accent);
  cursor: pointer;
  text-align: left;
}
.ub-more:hover { background: var(--accent-soft); }
.ub-sibling-note {
  font-size: var(--t-xs);
  color: var(--ink-faint);
  font-style: italic;
  padding: 6px 12px;
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule-soft);
}
.ub-twin-link { color: inherit; text-decoration: underline; text-decoration-color: var(--rule-strong); }
.ub-twin-link:hover { color: var(--accent); }
.ub-twins { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--rule-soft); }
.ub-twin-title {
  font-size: var(--t-2xs);
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 6px;
}
.ub-twin {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  color: var(--ink-soft);
  font-size: var(--t-xs);
  text-decoration: none;
}
.ub-twin span:last-child {
  color: var(--ink-faint);
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
}
.ub-twin:hover { color: var(--accent); text-decoration: none; }
@media (max-width: 600px) {
  a.ub-row { grid-template-columns: 1fr; }
  .ub-row-title, .ub-row-via { display: none; }
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

/* ============================== CATEGORY PAGE ============================== */

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

.triage-block {
  margin: var(--s-6) 0;
}
.triage-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--s-4);
  padding: var(--s-4);
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  background: var(--panel);
  margin-bottom: var(--s-4);
}
.triage-head b {
  display: block;
  color: var(--ink);
  font-size: var(--t-lg);
}
.triage-head em {
  display: block;
  margin-top: var(--s-1);
  color: var(--ink-faint);
  font-style: normal;
  font-size: var(--t-sm);
}
.triage-head strong {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-2xl);
  line-height: 1;
  color: var(--accent);
}

@media (max-width: 720px) {
  .cat-ep { grid-template-columns: 4px 48px 1fr; }
  .cat-ep-summary, .cat-ep-meta { display: none; }
}

/* endpoint body two-column layout (main + Used-by aside on wide viewports) */
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

/* ============================== HOME — BIG SWING ==============================
 * The home page is the lobby of the catalogue. It needs to feel like a
 * control surface — confident hero, scannable KPIs, focused search, and a
 * varied below-the-fold rhythm.
 * ============================================================================ */

.shell--home {
  display: block;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0;
}
main.doc.home { display: block; padding: 0; max-width: 100%; }

/* ── HERO ───────────────────────────────────────────────────────────────── */
.h2-hero {
  position: relative;
  padding: var(--s-12) var(--s-8) var(--s-10);
  margin: 0 0 var(--s-8);
  overflow: hidden;
  isolation: isolate;
  border-bottom: 1px solid var(--rule);
}
.h2-hero::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(900px 500px at 85% -20%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 65%),
    radial-gradient(700px 400px at 10% 110%, color-mix(in srgb, var(--patch) 8%, transparent), transparent 60%);
  z-index: -2;
  pointer-events: none;
}
.h2-hero::after {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right,  color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--ink) 4%, transparent) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: -1px -1px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  z-index: -1;
  pointer-events: none;
  opacity: .6;
}
:root[data-theme="dark"] .h2-hero::after { opacity: .35; }

.h2-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: var(--s-10);
  align-items: center;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--s-2);
}
.h2-hero-main { min-width: 0; }
@media (max-width: 880px) {
  .h2-hero { padding: var(--s-8) var(--s-5) var(--s-6); }
  .h2-hero-grid { grid-template-columns: 1fr; gap: var(--s-6); }
}

.h2-eyebrow {
  display: inline-flex; align-items: center; gap: var(--s-2);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  margin-bottom: var(--s-4);
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: var(--s-1) var(--s-3);
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.h2-eyebrow .pulse {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--post);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--post) 60%, transparent);
  animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--post) 60%, transparent); }
  50%       { box-shadow: 0 0 0 6px color-mix(in srgb, var(--post) 0%, transparent); }
}

.h2-hero h1 {
  font-size: clamp(38px, 5.4vw, 64px);
  line-height: 1.0;
  letter-spacing: -0.035em;
  font-weight: 700;
  margin: 0 0 var(--s-4);
  color: var(--ink);
}
.h2-hero h1 .accent {
  background: linear-gradient(115deg, var(--accent) 0%, var(--patch) 90%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}
.h2-hero .h2-lede {
  font-size: var(--t-xl);
  color: var(--ink-soft);
  margin: 0 0 var(--s-6);
  line-height: 1.5;
  max-width: 520px;
}
.h2-search-btn {
  display: flex; align-items: center; gap: var(--s-3);
  width: 100%; max-width: 600px;
  height: 60px;
  padding: 0 var(--s-3) 0 var(--s-5);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  font-family: inherit; text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: border-color var(--d-fast) var(--ease-out),
              background var(--d-fast) var(--ease-out),
              transform var(--d-fast) var(--ease-out),
              box-shadow var(--d-base) var(--ease-out);
}
.h2-primary-link {
  display: inline-flex; align-items: center; gap: var(--s-2);
  height: 42px;
  padding: 0 var(--s-4);
  margin: 0 0 var(--s-3);
  border-radius: var(--r-2);
  background: var(--ink);
  color: var(--bg);
  font-weight: 600;
  text-decoration: none !important;
  box-shadow: var(--shadow-2);
  transition: transform var(--d-fast) var(--ease-out), box-shadow var(--d-base) var(--ease-out);
}
.h2-primary-link:hover {
  color: var(--bg);
  transform: translateY(-1px);
  box-shadow: var(--shadow-3);
}
.h2-primary-link .i:last-child {
  transition: transform var(--d-fast) var(--ease-out);
}
.h2-primary-link:hover .i:last-child { transform: translateX(2px); }
.h2-search-btn:hover {
  border-color: color-mix(in srgb, var(--accent) 60%, var(--rule-strong));
  background: var(--bg);
  transform: translateY(-1px);
  box-shadow: 0 12px 32px -12px color-mix(in srgb, var(--accent) 32%, transparent), var(--shadow-1);
}
.h2-search-btn:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.h2-search-btn > .i {
  width: 20px; height: 20px;
  color: var(--ink-faint);
  flex-shrink: 0;
  transition: color var(--d-fast) var(--ease-out);
}
.h2-search-btn:hover > .i { color: var(--accent); }
.h2-search-btn-text {
  flex: 1;
  color: var(--ink-faint);
  font-size: var(--t-md);
  letter-spacing: -0.005em;
}
.h2-search-btn .kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs); font-weight: 500;
  padding: 5px 10px;
  border-radius: var(--r-1);
  background: var(--panel-soft);
  border: 1px solid var(--rule);
  color: var(--ink-faint);
  letter-spacing: 0.02em;
}

.h2-hero-quick {
  display: flex; align-items: center; gap: var(--s-2);
  flex-wrap: wrap;
  margin-top: var(--s-4);
  max-width: 600px;
}
.h2-hero-quick-label {
  font-size: var(--t-xs); text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--ink-faint); font-weight: 600;
  margin-right: var(--s-1);
}
.h2-hero-chip {
  display: inline-flex; align-items: center;
  height: 28px; padding: 0 var(--s-3);
  background: transparent;
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  font-family: inherit;
  font-size: var(--t-sm);
  color: var(--ink-soft);
  cursor: pointer;
  transition: background var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.h2-hero-chip:hover {
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 50%, var(--rule));
  color: var(--accent-ink);
}

/* ── SNAPSHOT CLUSTER (right side of hero) ─────────────────────────────── */
.h2-snap {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--s-3);
  padding: var(--s-4);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  box-shadow: var(--shadow-2);
}
@media (min-width: 1280px) { .h2-snap { padding: var(--s-5); gap: var(--s-3); } }
@media (max-width: 880px)  { .h2-snap { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px)  { .h2-snap { grid-template-columns: 1fr; } }

.h2-snap-cell {
  padding: var(--s-4) var(--s-4);
  border-radius: var(--r-2);
  background: var(--panel-soft);
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'label num sub';
  align-items: center;
  gap: var(--s-2) var(--s-3);
  position: relative;
  overflow: hidden;
  transition: background var(--d-fast) var(--ease-out), transform var(--d-fast) var(--ease-out);
}
.h2-snap-cell:hover { background: var(--panel-strong); transform: translateX(2px); }
@media (max-width: 880px) {
  .h2-snap-cell {
    grid-template-columns: 1fr;
    grid-template-areas: 'label' 'num' 'sub';
    text-align: left;
  }
}
.h2-snap-cell.is-link { text-decoration: none !important; color: inherit; }
.h2-snap-cell .sn-label {
  grid-area: label;
  font-size: var(--t-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  font-weight: 600;
  display: inline-flex; align-items: center; gap: var(--s-2);
  white-space: nowrap;
}
.h2-snap-cell .sn-label .i { width: 12px; height: 12px; color: var(--ink-faint); }
.h2-snap-cell .sn-num {
  grid-area: num;
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(var(--t-3xl), 2.6vw, var(--t-4xl));
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--ink);
  line-height: 1;
  text-align: right;
}
.h2-snap-cell .sn-sub {
  grid-area: sub;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
  white-space: nowrap;
}
@media (max-width: 880px) {
  .h2-snap-cell .sn-num,
  .h2-snap-cell .sn-sub { text-align: left; }
}

/* ── SECTIONS ──────────────────────────────────────────────────────────── */
.h2-section { max-width: 1600px; margin: 0 auto var(--s-10); padding: 0 var(--s-8); }
@media (max-width: 880px) { .h2-section { padding: 0 var(--s-4); margin-bottom: var(--s-8); } }
.h2-section-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
}
.h2-section-head h2 {
  margin: 0;
  font-size: var(--t-2xl);
  font-weight: 600;
  letter-spacing: -0.015em;
}
.h2-section-head .h2-section-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.h2-section-link {
  display: inline-flex; align-items: center; gap: var(--s-1);
  color: var(--ink-faint);
  font-size: var(--t-sm);
  text-decoration: none !important;
}
.h2-section-link:hover { color: var(--accent); }

/* ── SERVICES DIRECTORY ───────────────────────────────────────────────── */
.h2-dir {
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  background: var(--panel);
  overflow: hidden;
}
.h2-dir-row {
  display: grid;
  grid-template-columns: 36px minmax(160px, 1.3fr) minmax(180px, 1fr) minmax(160px, 1fr) minmax(120px, 0.8fr) auto;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--rule-soft);
  text-decoration: none !important;
  color: var(--ink);
  background: var(--panel);
  transition: background var(--d-fast) var(--ease-out);
}
.h2-dir-row:first-child { border-top: none; }
.h2-dir-row:hover { background: var(--panel-soft); }
.h2-dir-row .dr-mark {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--r-2);
  background: var(--accent-soft);
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-md); font-weight: 700;
  letter-spacing: -0.02em;
}
.h2-dir-row .dr-name {
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.h2-dir-row .dr-name .nm {
  font-weight: 600; font-size: var(--t-md); color: var(--ink); letter-spacing: -0.01em;
}
.h2-dir-row .dr-name .art {
  font-family: 'JetBrains Mono', monospace; font-size: var(--t-xs); color: var(--ink-faint);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.h2-dir-row .dr-blurb {
  font-size: var(--t-sm); color: var(--ink-soft); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.h2-dir-row .dr-methods {
  display: flex; gap: 3px; align-items: center; height: 8px;
  background: var(--panel-soft); border-radius: var(--r-pill); overflow: hidden;
  min-width: 100px;
}
.h2-dir-row .dr-method-seg { height: 100%; }
.h2-dir-row .dr-method-seg.GET    { background: var(--get); }
.h2-dir-row .dr-method-seg.POST   { background: var(--post); }
.h2-dir-row .dr-method-seg.PUT    { background: var(--put); }
.h2-dir-row .dr-method-seg.PATCH  { background: var(--patch); }
.h2-dir-row .dr-method-seg.DELETE { background: var(--delete); }
.h2-dir-row .dr-stats {
  display: flex; flex-direction: column; gap: 2px;
  font-family: 'JetBrains Mono', monospace; font-size: var(--t-xs);
  color: var(--ink-faint);
  white-space: nowrap;
}
.h2-dir-row .dr-stats b { color: var(--ink); font-weight: 600; }
.h2-dir-row .dr-go {
  color: var(--ink-faint);
  transition: transform var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.h2-dir-row:hover .dr-go { color: var(--accent); transform: translateX(3px); }

@media (max-width: 1080px) {
  .h2-dir-row {
    grid-template-columns: 36px minmax(140px, 1fr) minmax(120px, 1fr) auto;
  }
  .h2-dir-row .dr-blurb, .h2-dir-row .dr-methods { display: none; }
}
@media (max-width: 600px) {
  .h2-dir-row { grid-template-columns: 36px 1fr auto; }
  .h2-dir-row .dr-stats { display: none; }
}

/* ── FOOTER STRIP ───────────────────────────────────────────────────── */
.h2-foot {
  max-width: 1600px;
  margin: var(--s-10) auto 0;
  padding: var(--s-6) var(--s-8);
  border-top: 1px solid var(--rule);
  font-size: var(--t-xs);
  color: var(--ink-faint);
  display: flex; flex-wrap: wrap; gap: var(--s-4);
  justify-content: space-between; align-items: baseline;
  font-family: 'JetBrains Mono', monospace;
}

/* ============================== TOAST ============================== */
.toast-stack {
  position: fixed;
  right: var(--s-5); bottom: var(--s-5);
  display: flex; flex-direction: column; gap: var(--s-2);
  z-index: var(--z-toast);
  pointer-events: none;
}
.toast {
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: var(--s-2) var(--s-3) var(--s-2) var(--s-3);
  background: var(--ink);
  color: var(--bg);
  border-radius: var(--r-2);
  font-size: var(--t-sm);
  box-shadow: var(--shadow-3);
  pointer-events: auto;
  animation: toast-in 220ms var(--ease-out) both;
  max-width: 360px;
}
.toast.is-leaving { animation: toast-out 180ms var(--ease-out) both; }
.toast .i { color: var(--post); }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(8px); }
}

/* ============================== TOOLTIP ============================== */
.tt {
  position: relative;
  display: inline-flex;
  cursor: help;
}
.tt[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(2px);
  background: var(--ink);
  color: var(--bg);
  padding: 4px 8px;
  border-radius: var(--r-1);
  font-size: var(--t-xs);
  font-family: 'Inter', ui-sans-serif, sans-serif;
  font-weight: 400;
  letter-spacing: 0;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--d-fast) var(--ease-out), transform var(--d-fast) var(--ease-out);
  z-index: var(--z-overlay);
  max-width: 280px;
  white-space: normal;
  text-align: center;
  width: max-content;
  max-width: 240px;
}
.tt:hover::after, .tt:focus-visible::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ============================== SHORTCUTS SHEET ============================== */
.sheet-backdrop {
  position: fixed; inset: 0; z-index: var(--z-overlay);
  background: rgba(0,0,0,0.4);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity var(--d-base) var(--ease-out);
}
:root[data-theme="dark"] .sheet-backdrop { background: rgba(0,0,0,0.6); }
.sheet-backdrop.is-open { opacity: 1; pointer-events: auto; }
.sheet {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -46%);
  width: min(560px, calc(100vw - 32px));
  max-height: 80vh;
  background: var(--bg);
  border: 1px solid var(--rule-strong);
  border-radius: var(--r-3);
  z-index: calc(var(--z-overlay) + 1);
  opacity: 0; pointer-events: none;
  transition: opacity var(--d-base) var(--ease-out), transform var(--d-slow) var(--ease-out);
  overflow: hidden;
  box-shadow: var(--shadow-4);
  display: flex; flex-direction: column;
}
.sheet.is-open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.sheet-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--rule);
}
.sheet-head h3 { margin: 0; font-size: var(--t-lg); font-weight: 600; }
.sheet-close {
  background: transparent; border: none; cursor: pointer;
  color: var(--ink-faint);
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--r-1);
  transition: background var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.sheet-close:hover { background: var(--panel-soft); color: var(--ink); }
.sheet-body {
  padding: var(--s-4) var(--s-5);
  overflow-y: auto;
}
.sheet-section { margin-bottom: var(--s-4); }
.sheet-section:last-child { margin-bottom: 0; }
.sheet-section h4 {
  font-size: var(--t-xs); text-transform: uppercase; letter-spacing: .08em;
  color: var(--ink-faint); margin: 0 0 var(--s-2);
  font-weight: 600;
}
.sheet-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--s-3);
  padding: var(--s-2) 0;
  border-bottom: 1px solid var(--rule-soft);
  font-size: var(--t-base);
  align-items: center;
}
.sheet-row:last-child { border-bottom: none; }
.sheet-row .sk-label { color: var(--ink-soft); }
.sheet-row .sk-keys { display: inline-flex; gap: var(--s-1); }
.sheet-row .sk-keys kbd, .palette-foot .key {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-2xs);
  background: var(--panel-soft);
  border: 1px solid var(--rule);
  border-bottom-width: 2px;
  padding: 2px 6px; border-radius: var(--r-1);
  color: var(--ink-soft);
  min-width: 20px; text-align: center;
}

/* ============================== HELP ICON-BTN IN APPBAR ============================== */
.help-btn { /* same as .icon-btn but reuses tokens */ }

/* ============================== ENDPOINT CARD — TABS + ACTIONS ============================== */
.ep-tabs {
  display: flex; gap: 2px;
  margin: 0 0 var(--s-3);
  padding: var(--s-1);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  width: fit-content;
}
.ep-tab {
  display: inline-flex; align-items: center; gap: var(--s-1);
  padding: var(--s-1) var(--s-3);
  font: inherit; font-size: var(--t-sm); font-weight: 500;
  background: transparent;
  color: var(--ink-faint);
  border: none; border-radius: var(--r-1);
  cursor: pointer;
  transition: background var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.ep-tab:hover { color: var(--ink); }
.ep-tab.is-active {
  background: var(--bg);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}
.ep-tab .i { color: currentColor; }
.ep-tab-panel { display: none; }
.ep-tab-panel.is-active { display: block; animation: fade-in var(--d-base) var(--ease-out); }
@keyframes fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

.ep-actions {
  display: flex; gap: var(--s-1); align-items: center;
  margin-left: auto;
}
.ep-action {
  display: inline-flex; align-items: center; gap: var(--s-1);
  padding: 3px var(--s-2);
  height: 24px;
  font: inherit; font-size: var(--t-2xs);
  font-family: 'JetBrains Mono', monospace;
  background: transparent;
  color: var(--ink-faint);
  border: 1px solid transparent;
  border-radius: var(--r-1);
  cursor: pointer;
  transition: background var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out);
  white-space: nowrap;
  flex-shrink: 0;
}
.endpoint > summary:hover .ep-action { border-color: var(--rule); }
.ep-action:hover { color: var(--ink); border-color: var(--rule-strong) !important; background: var(--panel); }
.ep-action.is-copied { color: var(--post); border-color: var(--post) !important; }
.ep-action .i { width: 11px; height: 11px; }

/* When the endpoint summary has the new actions cluster */
.endpoint > summary {
  grid-template-columns: 4px 70px minmax(120px, 1fr) minmax(0, 28ch) auto auto;
  padding-right: var(--s-3);
}
.endpoint > summary .ep-actions { opacity: 0; transition: opacity var(--d-fast) var(--ease-out); }
.endpoint > summary:hover .ep-actions,
.endpoint[open] > summary .ep-actions { opacity: 1; }

/* ============================== SCHEMA / EXAMPLE PANE ============================== */
.ep-pane {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
}
@media (min-width: 1200px) {
  .ep-pane.ep-pane--split {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.ep-pane > * { min-width: 0; }
.curl-card {
  background: var(--ink);
  color: #f5f5f7;
  border-radius: var(--r-2);
  padding: var(--s-3) var(--s-4);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-sm);
  position: relative;
  overflow-x: auto;
  margin: var(--s-2) 0;
  line-height: 1.6;
}
:root[data-theme="dark"] .curl-card {
  background: var(--panel-soft);
  color: var(--ink);
  border: 1px solid var(--rule);
}
.curl-card .curl-copy {
  position: absolute; top: var(--s-2); right: var(--s-2);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.10);
  padding: 2px 8px;
  border-radius: var(--r-1);
  cursor: pointer;
  font-size: var(--t-2xs);
  font-family: inherit;
}
:root[data-theme="dark"] .curl-card .curl-copy {
  background: var(--panel);
  color: var(--ink-faint);
  border-color: var(--rule);
}
.curl-card .curl-copy:hover { color: #fff; }
:root[data-theme="dark"] .curl-card .curl-copy:hover { color: var(--ink); background: var(--panel-soft); }
.curl-card .c-flag { color: #6ea8ff; }
.curl-card .c-method { color: #fbbf24; }
.curl-card .c-url { color: #4fd6a0; }
.curl-card .c-str { color: #f87171; }

/* ============================== INDEX HERO + EXPLORE ROW ============================== */
.index-hero {
  background: var(--hero-tint);
  border-radius: var(--r-3);
  padding: var(--s-10) var(--s-8) var(--s-8);
  margin: var(--s-6) 0 var(--s-6);
  position: relative;
  overflow: hidden;
}
.index-hero h1 {
  font-size: var(--t-5xl); line-height: 1.05; letter-spacing: -0.025em;
  font-weight: 700;
  margin: var(--s-2) 0 var(--s-3);
}
.index-hero h1 em {
  color: var(--accent);
  font-style: normal;
  background: linear-gradient(120deg, var(--accent), var(--patch));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.index-hero .lede {
  font-size: var(--t-lg);
  color: var(--ink-soft);
  max-width: 620px;
  margin: 0 0 var(--s-6);
  line-height: 1.55;
}
.explore-row {
  display: flex; gap: var(--s-2); flex-wrap: wrap;
  margin: var(--s-4) 0 var(--s-2);
  align-items: center;
}
.explore-label {
  font-size: var(--t-xs);
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-right: var(--s-2);
  font-weight: 600;
}
.explore-chip {
  display: inline-flex; align-items: center; gap: var(--s-1);
  height: 30px;
  padding: 0 var(--s-3);
  background: var(--panel);
  color: var(--ink-soft);
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  font-size: var(--t-sm);
  font-family: inherit;
  text-decoration: none !important;
  cursor: pointer;
  transition: background var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.explore-chip:hover {
  border-color: var(--rule-strong);
  background: var(--panel-soft);
  color: var(--ink);
}
.explore-chip .i { color: var(--ink-faint); }
.explore-chip:hover .i { color: var(--accent); }

/* ============================== HEALTH GAUGES ============================== */
.health-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--s-4);
  padding: var(--s-6);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  margin: var(--s-4) 0;
}
.gauge {
  display: flex; flex-direction: column; gap: var(--s-2);
  padding: var(--s-3);
  border-radius: var(--r-2);
  background: var(--bg);
  border: 1px solid var(--rule-soft);
}
.gauge-title {
  font-size: var(--t-xs); text-transform: uppercase; letter-spacing: .06em;
  color: var(--ink-faint); font-weight: 600;
}
.gauge-num {
  font-size: var(--t-3xl); font-weight: 700; letter-spacing: -0.02em;
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
.gauge-num em {
  font-size: var(--t-base); color: var(--ink-faint);
  font-style: normal; font-weight: 500;
  margin-left: var(--s-1);
}
.gauge-bar {
  height: 4px; border-radius: var(--r-pill);
  background: var(--panel-soft);
  overflow: hidden;
}
.gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--post));
  border-radius: var(--r-pill);
  transition: width var(--d-slow) var(--ease-out);
}
.gauge-sub {
  font-size: var(--t-xs); color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
}

/* ============================== AUTH BAR (mini stacked) ============================== */
.auth-bar {
  display: flex; height: 6px;
  border-radius: var(--r-pill);
  overflow: hidden;
  background: var(--panel-soft);
  border: 1px solid var(--rule-soft);
  margin: var(--s-2) 0 var(--s-3);
}
.auth-bar-seg { height: 100%; }
.auth-bar-seg--bearer { background: var(--get); }
.auth-bar-seg--custom { background: var(--patch); }
.auth-bar-seg--null { background: var(--ink-faint); opacity: .55; }
.auth-bar-legend {
  display: flex; gap: var(--s-3); flex-wrap: wrap;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: var(--s-3);
}
.auth-bar-legend .alg { display: inline-flex; align-items: center; gap: var(--s-1); }
.auth-bar-legend .alg::before {
  content: ''; width: 8px; height: 8px;
  border-radius: 2px;
  background: var(--ink-faint);
}
.auth-bar-legend .alg.alg--bearer::before { background: var(--get); }
.auth-bar-legend .alg.alg--custom::before { background: var(--patch); }
.auth-bar-legend .alg.alg--null::before { background: var(--ink-faint); opacity: .55; }

/* ============================== STICKY SECTION SUBNAV ============================== */
.subnav {
  position: sticky;
  top: var(--appbar-h);
  z-index: var(--z-dropdown);
  display: flex; gap: var(--s-1);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--rule);
  padding: var(--s-2) 0;
  margin-bottom: var(--s-4);
}
.subnav a {
  display: inline-flex; align-items: center; gap: var(--s-1);
  height: 28px; padding: 0 var(--s-3);
  font-size: var(--t-sm); color: var(--ink-faint);
  border-radius: var(--r-1);
  text-decoration: none !important;
}
.subnav a:hover { background: var(--panel-soft); color: var(--ink); }
.subnav a.is-active {
  background: var(--accent-soft); color: var(--accent-ink); font-weight: 500;
}

/* ============================== EMPTY STATE ============================== */
.empty {
  text-align: center;
  padding: var(--s-10) var(--s-6);
  color: var(--ink-faint);
  font-size: var(--t-base);
  border: 1px dashed var(--rule);
  border-radius: var(--r-2);
  background: var(--panel);
}
.empty .i {
  width: 28px; height: 28px;
  color: var(--ink-faint);
  margin-bottom: var(--s-2);
  display: block; margin-left: auto; margin-right: auto;
}
.empty-title { color: var(--ink); font-weight: 600; margin-bottom: var(--s-1); }

/* ============================== AUTH-COVERAGE MATRIX ============================== */
.matrix-card {
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  background: var(--panel);
  overflow: hidden;
  margin: var(--s-4) 0;
}
.matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--t-base);
}
.matrix th, .matrix td {
  padding: var(--s-2) var(--s-3);
  border-bottom: 1px solid var(--rule-soft);
  text-align: left;
}
.matrix th {
  background: var(--panel-soft);
  font-size: var(--t-xs);
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--ink-faint);
  font-weight: 600;
  position: sticky; top: 0;
}
.matrix td.cell {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}
.matrix td.cell .heat {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 36px; height: 24px;
  padding: 0 var(--s-2);
  border-radius: var(--r-1);
  background: var(--panel-soft);
  color: var(--ink-faint);
  font-size: var(--t-sm);
  text-decoration: none !important;
}
.matrix td.cell .heat.heat--lo  { background: var(--accent-soft); color: var(--accent-ink); }
.matrix td.cell .heat.heat--md  { background: color-mix(in srgb, var(--accent) 22%, transparent); color: var(--accent-ink); }
.matrix td.cell .heat.heat--hi  { background: color-mix(in srgb, var(--accent) 36%, transparent); color: var(--accent-ink); font-weight: 600; }
.matrix td.cell .heat:hover { background: color-mix(in srgb, var(--accent) 50%, transparent); color: #fff; }
.matrix td:first-child {
  font-weight: 500;
  color: var(--ink);
}

/* ============================== TAG / FACET CHIPS (new views) ============================== */
.facet-grid {
  display: flex; gap: var(--s-2); flex-wrap: wrap;
  margin: var(--s-3) 0 var(--s-5);
}
.facet {
  display: inline-flex; align-items: center; gap: var(--s-1);
  padding: var(--s-2) var(--s-3);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  font-size: var(--t-sm);
  color: var(--ink-soft);
  text-decoration: none !important;
  transition: background var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.facet:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-ink);
}
.facet-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  background: var(--panel-soft);
  padding: 1px 6px;
  border-radius: var(--r-pill);
}
.facet:hover .facet-count {
  background: var(--bg);
  color: var(--accent-ink);
}

/* ============================== V2 API EXPLORER ============================== */
main.doc.explorer, main.doc.health {
  display: block;
  max-width: 1320px;
  margin: 0 auto;
  padding-left: var(--s-8);
  padding-right: var(--s-8);
}
.explorer-hero {
  padding-top: var(--s-10);
}
.explorer-toolbar {
  position: sticky;
  top: var(--appbar-h);
  z-index: var(--z-dropdown);
  display: grid;
  grid-template-columns: minmax(260px, 1.1fr) minmax(0, 1.6fr) auto;
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-3) 0;
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  -webkit-backdrop-filter: saturate(140%) blur(8px);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom: 1px solid var(--rule);
}
.explorer-search {
  height: 36px;
  display: flex; align-items: center; gap: var(--s-2);
  padding: 0 var(--s-3);
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  background: var(--panel);
}
.explorer-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: var(--t-base);
}
.explorer-selects {
  display: flex; gap: var(--s-2); flex-wrap: wrap;
}
.explorer-selects select {
  height: 36px;
  min-width: 132px;
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  background: var(--panel);
  color: var(--ink-soft);
  padding: 0 var(--s-3);
  font: inherit;
  font-size: var(--t-sm);
}
.explorer-actions {
  display: flex; gap: var(--s-2); align-items: center;
}
.explorer-health-link {
  height: 36px;
  display: inline-flex; align-items: center; gap: var(--s-1);
  padding: 0 var(--s-3);
  border-radius: var(--r-2);
  border: 1px solid var(--rule);
  color: var(--ink-soft);
  background: var(--panel);
  text-decoration: none !important;
  white-space: nowrap;
}
.explorer-health-link:hover { color: var(--accent); border-color: var(--rule-strong); }
.explorer-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-3);
  margin: var(--s-4) 0;
}
.summary-tile {
  border: 1px solid var(--rule);
  border-radius: var(--r-2);
  padding: var(--s-3);
  background: var(--panel);
}
.summary-tile span {
  display: block;
  font-size: var(--t-xs);
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: .06em;
  font-weight: 600;
}
.summary-tile b {
  display: block;
  margin-top: var(--s-1);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-2xl);
  color: var(--ink);
  line-height: 1;
}
.api-table {
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  overflow: hidden;
  background: var(--panel);
}
.api-table-head, .api-result {
  display: grid;
  grid-template-columns: 72px minmax(260px, 1.4fr) minmax(120px, .55fr) minmax(110px, .5fr) minmax(160px, .7fr) 90px;
  gap: var(--s-3);
  align-items: center;
}
.api-table-head {
  padding: var(--s-2) var(--s-4);
  background: var(--panel-soft);
  border-bottom: 1px solid var(--rule);
  font-size: var(--t-xs);
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: .06em;
  font-weight: 600;
}
.api-result {
  padding: var(--s-3) var(--s-4);
  border-bottom: 1px solid var(--rule-soft);
  text-decoration: none !important;
  color: var(--ink);
}
.api-result:last-child { border-bottom: none; }
.api-result:hover { background: var(--hover-bg); }
.api-result .api-path {
  min-width: 0;
}
.api-result .api-path code {
  background: transparent;
  border: none;
  padding: 0;
  font-size: var(--t-base);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.api-result .api-summary {
  color: var(--ink-faint);
  font-size: var(--t-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.api-chip {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: var(--r-1);
  border: 1px solid var(--rule);
  background: var(--panel-soft);
  color: var(--ink-faint);
  font-size: var(--t-xs);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}
.api-chip.GET    { color: var(--get);    background: var(--get-bg); }
.api-chip.POST   { color: var(--post);   background: var(--post-bg); }
.api-chip.PUT    { color: var(--put);    background: var(--put-bg); }
.api-chip.PATCH  { color: var(--patch);  background: var(--patch-bg); }
.api-chip.DELETE { color: var(--delete); background: var(--delete-bg); }
.api-health {
  display: flex; gap: var(--s-1); flex-wrap: wrap;
}
.api-chip.is-ok { color: var(--post); border-color: color-mix(in srgb, var(--post) 35%, var(--rule)); background: var(--post-bg); }
.api-chip.is-warn { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 35%, var(--rule)); background: var(--warn-soft); }
.api-chip.is-muted { opacity: .7; }
.api-more {
  padding: var(--s-4);
  text-align: center;
  color: var(--ink-faint);
  font-size: var(--t-sm);
  border-top: 1px solid var(--rule-soft);
}
@media (max-width: 980px) {
  .explorer-toolbar { grid-template-columns: 1fr; }
  .explorer-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .api-table-head { display: none; }
  .api-result {
    grid-template-columns: 64px minmax(0, 1fr) auto;
    grid-template-areas:
      "method path ui"
      "service path health"
      "category path health";
  }
  .api-result .api-chip:first-child { grid-area: method; }
  .api-result .api-path { grid-area: path; }
  .api-result .api-service { grid-area: service; justify-self: start; }
  .api-result .api-category { grid-area: category; justify-self: start; }
  .api-result .api-health { grid-area: health; justify-content: flex-end; }
  .api-result .api-used { grid-area: ui; justify-self: end; }
}
@media (max-width: 620px) {
  main.doc.explorer, main.doc.health { padding-left: var(--s-4); padding-right: var(--s-4); }
  .explorer-summary { grid-template-columns: 1fr; }
  .api-result { grid-template-columns: 56px minmax(0, 1fr); grid-template-areas: "method path" "service path" "category path" "ui health"; }
  .api-result .api-health { justify-content: flex-start; }
  .explorer-selects select { min-width: calc(50% - var(--s-1)); flex: 1; }
}

/* ============================== V2 HEALTH DASHBOARD ============================== */
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-4);
  margin: var(--s-5) 0;
}
.gauge--link {
  color: inherit;
  text-decoration: none !important;
}
.gauge--link:hover {
  border-color: var(--rule-strong);
  background: var(--panel-soft);
}
.gauge-fill--warn {
  background: linear-gradient(90deg, var(--warn), var(--delete));
}
.health-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-4);
  margin: var(--s-5) 0;
}
.health-panel {
  border: 1px solid var(--rule);
  border-radius: var(--r-3);
  background: var(--panel);
  padding: var(--s-5);
  margin: var(--s-5) 0;
}
.health-panel h2 {
  margin: 0 0 var(--s-2);
  font-size: var(--t-xl);
  letter-spacing: -0.01em;
}
.health-panel p {
  color: var(--ink-faint);
  font-size: var(--t-sm);
  margin: 0 0 var(--s-4);
}
.health-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.health-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-3);
  padding: var(--s-2) 0;
  border-bottom: 1px solid var(--rule-soft);
  align-items: center;
}
.health-list li:last-child { border-bottom: none; }
.health-list code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: transparent;
  border: none;
  padding: 0;
}
.health-list span:last-child {
  color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
}
.health-pills {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}
.health-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  border: 1px solid var(--rule);
  border-radius: var(--r-pill);
  color: var(--ink-soft);
  background: var(--bg);
  text-decoration: none !important;
}
.health-pill b {
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink);
}
.health-dup {
  border-top: 1px solid var(--rule-soft);
  padding: var(--s-2) 0;
}
.health-dup:first-of-type { border-top: none; }
.health-dup summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-3);
  cursor: pointer;
  list-style: none;
}
.health-dup summary::-webkit-details-marker { display: none; }
.health-dup summary span {
  color: var(--ink-faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: var(--t-xs);
}
.health-dup a {
  display: grid;
  grid-template-columns: minmax(140px, .5fr) minmax(0, 1fr) auto;
  gap: var(--s-3);
  padding: var(--s-2) var(--s-3);
  margin-top: var(--s-1);
  border-radius: var(--r-1);
  background: var(--panel-soft);
  color: var(--ink-soft);
  text-decoration: none !important;
}
.health-dup a b {
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint);
}
@media (max-width: 820px) {
  .health-grid, .health-columns { grid-template-columns: 1fr; }
}

/* ============================== BUILD STAMP ============================== */
.build-stamp {
  text-align: right;
  font-size: var(--t-xs);
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint);
  padding: var(--s-2) var(--s-8) var(--s-3);
  border-top: 1px solid var(--rule-soft);
  background: var(--bg);
}

/* ============================== RAIL COLLAPSIBLE AREAS ============================== */
.area-item > .area-eps { display: none; list-style: none; padding: 0; margin: 0; }
.area-item.is-open > .area-eps { display: block; }
.rail a.area-link { cursor: pointer; }

/* ============================== SERVICE PAGE FILTER ============================== */
.svc-filter {
  display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap;
  padding: var(--s-3) 0 var(--s-4);
  border-bottom: 1px solid var(--rule);
  margin-bottom: var(--s-4);
}
.svc-filter input[type="search"] {
  height: 32px; flex: 1 1 220px; min-width: 160px;
  border: 1px solid var(--rule); border-radius: var(--r-2);
  background: var(--panel); color: var(--ink);
  padding: 0 var(--s-3); font: inherit; font-size: var(--t-sm);
  -webkit-appearance: none;
}
.svc-filter input[type="search"]:focus { outline: none; border-color: var(--accent); }
.svc-filter-methods { display: flex; gap: var(--s-1); flex-shrink: 0; }
.svc-mchip {
  height: 28px; padding: 0 var(--s-2);
  border: 1px solid var(--rule); border-radius: var(--r-1);
  background: var(--panel); cursor: pointer;
  font-size: var(--t-xs); font-family: 'JetBrains Mono', monospace; font-weight: 600;
  color: var(--ink-faint);
  transition: background var(--d-fast) var(--ease-out), border-color var(--d-fast) var(--ease-out), color var(--d-fast) var(--ease-out);
}
.svc-mchip:hover { border-color: var(--rule-strong); color: var(--ink); }
.svc-mchip.GET.is-active    { color: var(--get);    background: var(--get-bg);    border-color: var(--get); }
.svc-mchip.POST.is-active   { color: var(--post);   background: var(--post-bg);   border-color: var(--post); }
.svc-mchip.PUT.is-active    { color: var(--put);    background: var(--put-bg);    border-color: var(--put); }
.svc-mchip.PATCH.is-active  { color: var(--patch);  background: var(--patch-bg);  border-color: var(--patch); }
.svc-mchip.DELETE.is-active { color: var(--delete); background: var(--delete-bg); border-color: var(--delete); }
.svc-filter-count {
  font-size: var(--t-xs); font-family: 'JetBrains Mono', monospace;
  color: var(--ink-faint); margin-left: auto; flex-shrink: 0;
}
.svc-filter-clear {
  height: 28px; padding: 0 var(--s-3);
  border: 1px solid transparent; border-radius: var(--r-1);
  background: transparent; cursor: pointer;
  font-size: var(--t-xs); color: var(--ink-faint); display: none;
}
.svc-filter-clear.is-active { display: block; }
.svc-filter-clear:hover { color: var(--accent); border-color: var(--rule); }
`;

/* Inline SVG sprite — every icon used by chrome, spotlight, endpoint cards, and new views.
 * One <symbol> per icon. Reference via <svg class="i"><use href="#i-search"/></svg>. */
const ICONS = `<svg class="i-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <symbol id="i-search" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/></symbol>
  <symbol id="i-command" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5h6v6H5zM5 5V3.5A1.5 1.5 0 1 0 3.5 5H5zm6 0h1.5A1.5 1.5 0 1 0 11 3.5V5zm0 6v1.5a1.5 1.5 0 1 0 1.5-1.5H11zm-6 0H3.5A1.5 1.5 0 1 0 5 12.5V11z"/></symbol>
  <symbol id="i-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="6 4 10 8 6 12" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-chevron-down" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="4 6 8 10 12 6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-copy" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></symbol>
  <symbol id="i-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 8 7 12 13 4" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-check-circle" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><polyline points="5 8 7.5 10.5 11.5 5.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-alert" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.8 14.5 13.5h-13z"/><line x1="8" y1="6" x2="8" y2="9.5" stroke-linecap="round"/><circle cx="8" cy="11.4" r=".7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-info" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="7" x2="8" y2="11.5" stroke-linecap="round"/><circle cx="8" cy="4.6" r=".7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-warning" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><line x1="8" y1="4.8" x2="8" y2="8.5" stroke-linecap="round"/><circle cx="8" cy="11" r=".7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></symbol>
  <symbol id="i-unlock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 5.5-1.6"/></symbol>
  <symbol id="i-layers" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><polygon points="8 2 14 5 8 8 2 5 8 2"/><polyline points="2 8 8 11 14 8"/><polyline points="2 11 8 14 14 11"/></symbol>
  <symbol id="i-grid" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></symbol>
  <symbol id="i-list" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="5" y1="4" x2="14" y2="4" stroke-linecap="round"/><line x1="5" y1="8" x2="14" y2="8" stroke-linecap="round"/><line x1="5" y1="12" x2="14" y2="12" stroke-linecap="round"/><circle cx="2.5" cy="4" r=".7" fill="currentColor" stroke="none"/><circle cx="2.5" cy="8" r=".7" fill="currentColor" stroke="none"/><circle cx="2.5" cy="12" r=".7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="3.2"/><line x1="8" y1="1.2" x2="8" y2="2.6" stroke-linecap="round"/><line x1="8" y1="13.4" x2="8" y2="14.8" stroke-linecap="round"/><line x1="1.2" y1="8" x2="2.6" y2="8" stroke-linecap="round"/><line x1="13.4" y1="8" x2="14.8" y2="8" stroke-linecap="round"/><line x1="3.1" y1="3.1" x2="4.1" y2="4.1" stroke-linecap="round"/><line x1="11.9" y1="11.9" x2="12.9" y2="12.9" stroke-linecap="round"/><line x1="3.1" y1="12.9" x2="4.1" y2="11.9" stroke-linecap="round"/><line x1="11.9" y1="4.1" x2="12.9" y2="3.1" stroke-linecap="round"/></symbol>
  <symbol id="i-moon" viewBox="0 0 16 16"><path d="M11.8 8.6A4.6 4.6 0 0 1 7.2 4a4 4 0 0 0-1 .1 5.5 5.5 0 1 0 5.7 5.6 4 4 0 0 0-.1-1.1z" fill="currentColor"/></symbol>
  <symbol id="i-filter" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><polygon points="2 3 14 3 10 8 10 13 6 11 6 8 2 3" stroke-linejoin="round"/></symbol>
  <symbol id="i-x" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="4" y1="4" x2="12" y2="12" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke-linecap="round"/></symbol>
  <symbol id="i-arrow-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="3" y1="8" x2="13" y2="8" stroke-linecap="round"/><polyline points="9 4 13 8 9 12" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-hash" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="6" y1="2" x2="4" y2="14" stroke-linecap="round"/><line x1="12" y1="2" x2="10" y2="14" stroke-linecap="round"/><line x1="2.4" y1="6" x2="13.6" y2="6" stroke-linecap="round"/><line x1="2.4" y1="10" x2="13.6" y2="10" stroke-linecap="round"/></symbol>
  <symbol id="i-link" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 4l1.5-1.5a2.8 2.8 0 0 1 4 4L13 8M7 12l-1.5 1.5a2.8 2.8 0 0 1-4-4L3 8"/><line x1="6" y1="10" x2="10" y2="6" stroke-linecap="round"/></symbol>
  <symbol id="i-code" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><polyline points="6 4 2 8 6 12" stroke-linecap="round" stroke-linejoin="round"/><polyline points="10 4 14 8 10 12" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-terminal" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="3" width="12" height="10" rx="1.5"/><polyline points="5 7 7 9 5 11" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="11" x2="12" y2="11" stroke-linecap="round"/></symbol>
  <symbol id="i-route" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="3.5" cy="3.5" r="1.5"/><circle cx="12.5" cy="12.5" r="1.5"/><path d="M3.5 5v3a3 3 0 0 0 3 3h3a3 3 0 0 1 3 3"/></symbol>
  <symbol id="i-tag" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 8.5V3a.5.5 0 0 1 .5-.5h5.5L14 7.5l-5.5 5.5L2.5 8.5z" stroke-linejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/></symbol>
  <symbol id="i-sitemap" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="6" y="1.5" width="4" height="3" rx=".5"/><rect x="1.5" y="11.5" width="4" height="3" rx=".5"/><rect x="10.5" y="11.5" width="4" height="3" rx=".5"/><path d="M8 4.5v3M3.5 11.5V8h9v3.5" stroke-linecap="round"/></symbol>
  <symbol id="i-sparkles" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 2.5l1 2.5 2.5 1-2.5 1L5 9.5 4 7 1.5 6 4 5z" stroke-linejoin="round"/><path d="M11.5 8l.7 1.8L14 10.5l-1.8.7-.7 1.8-.7-1.8L9 10.5l1.8-.7z" stroke-linejoin="round"/></symbol>
  <symbol id="i-pulse" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><polyline points="1.5 8.5 4.5 8.5 6 4 9 12 10.8 8.5 14.5 8.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-server" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2.5" width="12" height="5" rx="1"/><rect x="2" y="8.5" width="12" height="5" rx="1"/><circle cx="4.5" cy="5" r=".7" fill="currentColor"/><circle cx="4.5" cy="11" r=".7" fill="currentColor"/></symbol>
  <symbol id="i-shield" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 1.5 13.5 4v4.5c0 3-2.4 5.5-5.5 6-3.1-.5-5.5-3-5.5-6V4z" stroke-linejoin="round"/><polyline points="5.5 8 7.5 10 10.5 6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-help" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5"/><path d="M6 6.2A2 2 0 1 1 8.4 9c-.4.2-.4.5-.4.9v.4" stroke-linecap="round"/><circle cx="8" cy="12" r=".7" fill="currentColor" stroke="none"/></symbol>
  <symbol id="i-page" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 1.5h6L13 5v9.5h-9.5z" stroke-linejoin="round"/><line x1="6" y1="8" x2="11" y2="8" stroke-linecap="round"/><line x1="6" y1="11" x2="9" y2="11" stroke-linecap="round"/></symbol>
  <symbol id="i-orphan" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.5" stroke-dasharray="2 2"/><line x1="5" y1="8" x2="11" y2="8" stroke-linecap="round"/></symbol>
</svg>`;

const TOAST = `<div class="toast-stack" id="toast-stack" aria-live="polite" aria-atomic="true"></div>`;

const SHORTCUTS_SHEET = `
<div class="sheet-backdrop" id="sheet-backdrop"></div>
<div class="sheet" id="shortcuts-sheet" role="dialog" aria-label="Keyboard shortcuts">
  <div class="sheet-head">
    <h3>Keyboard shortcuts</h3>
    <button class="sheet-close" id="sheet-close" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button>
  </div>
  <div class="sheet-body">
    <div class="sheet-section">
      <h4>Spotlight</h4>
      <div class="sheet-row"><span class="sk-label">Open spotlight</span><span class="sk-keys"><kbd id="kbd-meta-3">⌘</kbd><kbd>K</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Open spotlight (alt)</span><span class="sk-keys"><kbd>/</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Navigate results</span><span class="sk-keys"><kbd>↑</kbd><kbd>↓</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Jump to selected</span><span class="sk-keys"><kbd>↵</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Close any overlay</span><span class="sk-keys"><kbd>esc</kbd></span></div>
    </div>
    <div class="sheet-section">
      <h4>Page</h4>
      <div class="sheet-row"><span class="sk-label">Toggle theme</span><span class="sk-keys"><kbd>t</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Show this sheet</span><span class="sk-keys"><kbd>?</kbd></span></div>
      <div class="sheet-row"><span class="sk-label">Expand all endpoints</span><span class="sk-keys"><kbd>e</kbd></span></div>
    </div>
  </div>
</div>`;

/**
 * APPBAR options:
 *   title, brandSub, indexHref       — brand
 *   nav: {
 *     activeCategory: string|null,
 *     activeService:  string|null,
 *     activePages:    boolean,
 *     activeExplorer: boolean,
 *     activeHealth:   boolean,
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
  const explorerLink = `<a class="nv-link${cur(n.activeExplorer)}" href="apis.html"${aria(n.activeExplorer)}>API Explorer</a>`;
  const healthLink = `<a class="nv-link${cur(n.activeHealth)}" href="health.html"${aria(n.activeHealth)}>Health</a>`;
  const anyInsight = n.activeHealth || n.activeAuthCoverage || n.activeTags || n.activeOrphans;
  const insightsMenu = `
    <details class="services-menu">
      <summary class="${anyInsight ? 'is-current' : ''}">Insights</summary>
      <div class="menu-panel">
        <a href="health.html" class="${n.activeHealth ? 'is-current' : ''}"><span class="ms-svc">Health dashboard</span></a>
        <a href="auth-coverage.html" class="${n.activeAuthCoverage ? 'is-current' : ''}"><span class="ms-svc">Auth coverage</span></a>
        <a href="tags.html" class="${n.activeTags ? 'is-current' : ''}"><span class="ms-svc">Tags</span></a>
        <a href="orphans.html" class="${n.activeOrphans ? 'is-current' : ''}"><span class="ms-svc">Orphans</span></a>
      </div>
    </details>`;
  return `
<header class="appbar">
  <div class="brand">
    <span class="dot" aria-hidden="true"></span>
    <a href="${escapeAttr(indexHref)}">${escapeHtml(title)}</a>
    <em>${escapeHtml(brandSub)}</em>
  </div>
  <nav class="topnav" aria-label="Primary">
    <a class="nv-link${cur(n.activeIndex)}" href="${escapeAttr(indexHref)}"${aria(n.activeIndex)}>Home</a>
    <span class="nv-sep" aria-hidden="true"></span>${explorerLink}${healthLink}
    ${catLinks ? `<span class="nv-sep" aria-hidden="true"></span>${catLinks}` : ''}
    ${svcMenu ? `<span class="nv-sep" aria-hidden="true"></span>${svcMenu}` : ''}
    ${pagesLink ? `<span class="nv-sep" aria-hidden="true"></span>${pagesLink}` : ''}
    <span class="nv-sep" aria-hidden="true"></span>${insightsMenu}
  </nav>
  <div class="actions">
    <button class="search-trigger" id="search-trigger" aria-label="Open search">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/></svg>
      <span class="label">Search…</span>
      <span class="kbd"><span id="kbd-meta">⌘</span>K</span>
    </button>
    <button class="icon-btn" id="help-btn" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
      <svg class="i"><use href="#i-help"/></svg>
    </button>
    <button class="icon-btn" id="theme-toggle" aria-label="Toggle theme" title="Toggle theme (t)">
      <svg id="theme-icon" class="i"></svg>
    </button>
  </div>
</header>`;
};

const PALETTE = `
<div class="palette-backdrop" id="palette-backdrop"></div>
<div class="palette" id="palette" role="dialog" aria-label="Search APIs and pages">
  <div class="palette-input-row">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
      <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14" stroke-linecap="round"/>
    </svg>
    <input id="palette-input" type="text" placeholder="Search APIs and pages…" autocomplete="off" spellcheck="false">
    <span class="kbd palette-esc">esc</span>
  </div>
  <div class="palette-tabs" role="tablist">
    <button class="palette-tab is-active" data-palette-tab="api" role="tab" type="button">
      <svg class="i"><use href="#i-code"/></svg>
      <span>APIs</span>
      <span class="palette-tab-count" id="palette-count-api">0</span>
    </button>
    <button class="palette-tab" data-palette-tab="page" role="tab" type="button">
      <svg class="i"><use href="#i-page"/></svg>
      <span>UI Pages</span>
      <span class="palette-tab-count" id="palette-count-page">0</span>
    </button>
  </div>
  <div class="palette-results" id="palette-results"></div>
  <div class="palette-foot">
    <span><span class="key">↑</span><span class="key">↓</span> navigate</span>
    <span><span class="key">↵</span> open</span>
    <span><span class="key">⇥</span> switch tab</span>
    <span><span class="key">esc</span> close</span>
  </div>
</div>`;

const SCRIPT = `
(() => {
  const G = window.__GLOBAL_INDEX__ || [];

  // Theme
  const themeBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    if (themeIcon) themeIcon.innerHTML = t === 'dark' ? '<use href="#i-sun"/>' : '<use href="#i-moon"/>';
    try { localStorage.setItem('phx-theme', t); } catch(e) {}
  }
  let initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
  try { const saved = localStorage.getItem('phx-theme'); if (saved === 'light' || saved === 'dark') initialTheme = saved; } catch(e) {}
  applyTheme(initialTheme);
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const isMac = /Mac|iP(hone|od|ad)/.test(navigator.platform || '');
  document.querySelectorAll('#kbd-meta, #kbd-meta-2, #kbd-meta-3').forEach(el => { el.textContent = isMac ? '⌘' : 'Ctrl'; });

  // ─── TOAST ──────────────────────────────────────────────────────────────
  const toastStack = document.getElementById('toast-stack');
  function toast(message, opts) {
    if (!toastStack) return;
    opts = opts || {};
    const el = document.createElement('div');
    el.className = 'toast';
    const iconId = opts.icon || 'i-check-circle';
    el.innerHTML = '<svg class="i"><use href="#' + iconId + '"/></svg><span>' + escHTMLearly(message) + '</span>';
    toastStack.appendChild(el);
    const t = setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
    }, opts.duration || 2400);
    el.addEventListener('click', () => { clearTimeout(t); el.remove(); });
  }
  // Light escape used before the rest of the script is set up.
  function escHTMLearly(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  // Share with later code via a window prop (no-op if anyone else defines it).
  window.__phx_toast = toast;

  // ─── SHORTCUTS SHEET ────────────────────────────────────────────────────
  const sheet = document.getElementById('shortcuts-sheet');
  const sheetBackdrop = document.getElementById('sheet-backdrop');
  const sheetClose = document.getElementById('sheet-close');
  const helpBtn = document.getElementById('help-btn');
  function openSheet()  { if (sheet) { sheet.classList.add('is-open'); sheetBackdrop.classList.add('is-open'); } }
  function closeSheet() { if (sheet) { sheet.classList.remove('is-open'); sheetBackdrop.classList.remove('is-open'); } }
  if (helpBtn) helpBtn.addEventListener('click', openSheet);
  if (sheetClose) sheetClose.addEventListener('click', closeSheet);
  if (sheetBackdrop) sheetBackdrop.addEventListener('click', closeSheet);

  // ─── DUAL-TAB PALETTE ──────────────────────────────────────────────────────
  const palette  = document.getElementById('palette');
  const backdrop = document.getElementById('palette-backdrop');
  const input    = document.getElementById('palette-input');
  const results  = document.getElementById('palette-results');
  const trigger  = document.getElementById('search-trigger');
  const heroBtn  = document.getElementById('hero-search-btn');
  const paletteTabs = palette ? Array.from(palette.querySelectorAll('.palette-tab')) : [];
  const countApi  = document.getElementById('palette-count-api');
  const countPage = document.getElementById('palette-count-page');

  let open = false, activeIdx = 0, current = [], currentTab = 'api';

  const EP_XREF   = window.__EP_XREF__   || {};
  const PAGE_XREF = window.__PAGE_XREF__ || [];
  const EP_LIST   = G.filter(e => e.svcId !== 'pages' && e.svcId !== 'category' && e.svcId !== 'view');

  function escHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function highlight(text, tokens) {
    let html = escHTML(text);
    tokens.forEach(t => { if (!t) return; const re = new RegExp('('+t.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&')+')','ig'); html = html.replace(re, '<mark>$1</mark>'); });
    return html;
  }
  function tokenize(q) {
    return q.toLowerCase().split(/\\s+/).filter(Boolean).map(t => t.charAt(0) === '/' ? t.slice(1) : t);
  }
  function parsePaletteQuery(q) {
    const filters = {};
    const terms = [];
    tokenize(q).forEach(t => {
      const m = t.match(/^([a-z]+):(.*)$/);
      if (m) filters[m[1]] = m[2];
      else if (/^(get|post|put|patch|delete)$/.test(t)) filters.method = t.toUpperCase();
      else terms.push(t);
    });
    return { terms, filters };
  }
  function filterEp(ep, filters) {
    if (filters.method && ep.method !== filters.method) return false;
    if (filters.service && !(ep.svcId || '').toLowerCase().includes(filters.service)) return false;
    if (filters.category && !(ep.category || '').toLowerCase().includes(filters.category)) return false;
    if (filters.auth && ep.auth !== filters.auth) return false;
    if (filters.schema && ep.schema !== filters.schema) return false;
    if (filters.used === '0' && Number(ep.used || 0) !== 0) return false;
    if (filters.used && filters.used !== '0' && Number(ep.used || 0) === 0) return false;
    return true;
  }
  function scoreEp(ep, tokens) {
    let s = 0;
    const path = ep.path.toLowerCase();
    const segs = path.split('/').filter(Boolean);
    const summ = (ep.summary || '').toLowerCase();
    const area = (ep.area    || '').toLowerCase();
    const svc  = (ep.svcName || '').toLowerCase();
    let anyPath = false;
    for (const t of tokens) {
      if (!t) continue;
      const exactIdx  = segs.findIndex(seg => seg === t);
      const prefixIdx = exactIdx >= 0 ? exactIdx : segs.findIndex(seg => seg.startsWith(t));
      const is = summ.indexOf(t), ia = area.indexOf(t), iv = svc.indexOf(t);
      if (prefixIdx < 0 && is < 0 && ia < 0 && iv < 0) return -1;
      if (prefixIdx >= 0) { anyPath = true; s += exactIdx >= 0 ? 200 - exactIdx * 30 : 80 - prefixIdx * 10; }
      if (is >= 0) s += 20 - Math.min(is, 20);
      if (ia >= 0) s += 6;
      if (iv >= 0) s += 5;
    }
    if (!anyPath) s = Math.min(s, 15);
    return s;
  }
  function scorePg(pg, tokens) {
    let s = 0;
    const r = pg.route.toLowerCase();
    const segs = r.split('/').filter(Boolean);
    const titleL = (pg.title || '').toLowerCase();
    for (const t of tokens) {
      if (!t) continue;
      const exactIdx  = segs.findIndex(seg => seg === t);
      const prefixIdx = exactIdx >= 0 ? exactIdx : segs.findIndex(seg => seg.startsWith(t));
      const it = titleL.indexOf(t);
      if (prefixIdx < 0 && it < 0) return -1;
      if (prefixIdx >= 0) s += exactIdx >= 0 ? 200 - exactIdx * 30 : 80 - prefixIdx * 10;
      if (it >= 0) s += 20 - Math.min(it, 20);
    }
    return s;
  }
  function buildApiItems(parsed) {
    const tokens = parsed.terms || [];
    const filters = parsed.filters || {};
    let hits;
    const base = EP_LIST.filter(ep => filterEp(ep, filters));
    if (!tokens.length) hits = base.slice().sort((a, b) => Number(b.used || 0) - Number(a.used || 0)).slice(0, 80).map(ep => ({ ep, s: 0 }));
    else hits = base.map(ep => ({ ep, s: scoreEp(ep, tokens) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 120);
    return hits.map(({ ep }) => {
      const epId = ep.href.split('#')[1] || '';
      const usage = (EP_XREF[epId] || []).length;
      return {
        href: ep.href,
        html:
          '<span class="p-method ' + ep.method + '">' + ep.method + '</span>'
          + '<span class="p-svc">' + escHTML(ep.svcName || '') + '</span>'
          + '<span class="p-area">' + escHTML(ep.area || '') + '</span>'
          + '<div class="p-main">'
          +   '<div class="p-path">' + highlight(ep.path, tokens) + '</div>'
          +   '<div class="p-summary">' + (ep.summary ? highlight(ep.summary, tokens) : '<span style="opacity:.6">' + (ep.area || '') + '</span>') + '</div>'
          + '</div>'
          + '<span class="p-count' + (usage === 0 ? ' is-zero' : '') + '">' + usage + ' page' + (usage === 1 ? '' : 's') + (ep.schema === 'missing' ? ' · schema' : '') + '</span>'
      };
    });
  }
  function buildPageItems(tokens) {
    let hits;
    if (!tokens.length) hits = PAGE_XREF.slice(0, 80).map(pg => ({ pg, s: 0 }));
    else hits = PAGE_XREF.map(pg => ({ pg, s: scorePg(pg, tokens) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 120);
    return hits.map(({ pg }) => {
      const count = (pg.calls || []).length;
      const tail = (pg.component || '').replace(/Component$/, '') || (pg.guards && pg.guards[0]) || '';
      return {
        href: 'pages.html#' + pg.id,
        html:
          '<span class="p-method PAGE">PAGE</span>'
          + '<span class="p-svc p-svc--page">UI</span>'
          + '<span class="p-area">' + escHTML(tail) + '</span>'
          + '<div class="p-main">'
          +   '<div class="p-path">' + highlight(pg.route, tokens) + '</div>'
          +   '<div class="p-summary">' + (pg.title ? highlight(pg.title, tokens) : '<span style="opacity:.6">no title</span>') + '</div>'
          + '</div>'
          + '<span class="p-count' + (count === 0 ? ' is-zero' : '') + '">' + count + ' API' + (count === 1 ? '' : 's') + '</span>'
      };
    });
  }
  function render(q) {
    const parsed = parsePaletteQuery(q);
    const tokens = parsed.terms;
    const items = currentTab === 'api' ? buildApiItems(parsed) : buildPageItems(tokens);
    current = items; activeIdx = 0;
    if (!items.length) {
      results.innerHTML = '<div class="palette-empty">No '
        + (currentTab === 'api' ? 'endpoints' : 'pages')
        + ' match <code>' + escHTML(q) + '</code></div>';
    } else {
      results.innerHTML = items.map((it, i) =>
        '<div class="p-result' + (i === 0 ? ' is-active' : '') + '" data-idx="' + i + '" data-href="' + escHTML(it.href) + '">' + it.html + '</div>'
      ).join('');
      results.scrollTop = 0;
    }
    if (countApi)  countApi.textContent  = (currentTab === 'api'  ? items.length : EP_LIST.length).toLocaleString();
    if (countPage) countPage.textContent = (currentTab === 'page' ? items.length : PAGE_XREF.length).toLocaleString();
  }
  function setActive(i) {
    if (!current.length) return;
    activeIdx = (i + current.length) % current.length;
    const els = results.querySelectorAll('.p-result');
    els.forEach(el => el.classList.remove('is-active'));
    const t = els[activeIdx];
    if (t) { t.classList.add('is-active'); t.scrollIntoView({ block: 'nearest' }); }
  }
  function jumpTo(href) { closeP(); if (!href) return; window.location.href = href; }
  function setTab(k) {
    if (k !== 'api' && k !== 'page') return;
    currentTab = k;
    paletteTabs.forEach(t => t.classList.toggle('is-active', t.dataset.paletteTab === k));
    render(input ? input.value : '');
    if (input) setTimeout(() => input.focus(), 30);
  }
  function openP(seed) {
    if (!palette) return;
    open = true;
    palette.classList.add('is-open'); backdrop.classList.add('is-open');
    input.value = (typeof seed === 'string') ? seed : '';
    render(input.value);
    setTimeout(() => input.focus(), 50);
  }
  function closeP() {
    open = false;
    if (palette)  palette.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
  }

  if (trigger)  trigger.addEventListener('click', () => openP());
  if (heroBtn)  heroBtn.addEventListener('click', () => openP());
  if (backdrop) backdrop.addEventListener('click', closeP);
  if (input)    input.addEventListener('input', e => render(e.target.value));
  if (results) {
    results.addEventListener('click', e => { const it = e.target.closest('.p-result'); if (it) jumpTo(it.dataset.href); });
    results.addEventListener('mousemove', e => {
      const it = e.target.closest('.p-result'); if (!it) return;
      const i = parseInt(it.dataset.idx, 10);
      if (!isNaN(i) && i !== activeIdx) setActive(i);
    });
  }
  paletteTabs.forEach(t => t.addEventListener('click', () => setTab(t.dataset.paletteTab)));

  // Initial counts (visible before first open)
  if (countApi)  countApi.textContent  = EP_LIST.length.toLocaleString();
  if (countPage) countPage.textContent = PAGE_XREF.length.toLocaleString();

  function isTypingTarget() {
    const t = document.activeElement; if (!t) return false;
    return ['INPUT','TEXTAREA','SELECT'].includes(t.tagName) || t.isContentEditable;
  }
  document.addEventListener('keydown', e => {
    const isMod = isMac ? e.metaKey : e.ctrlKey;
    if (isMod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open ? closeP() : openP(); return; }
    if (!open && !isTypingTarget()) {
      if (e.key === '/') { e.preventDefault(); openP(); return; }
      if (e.key === '?') { e.preventDefault(); openSheet(); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); toggleTheme(); return; }
      if (e.key === 'e' || e.key === 'E') {
        const expandBtn = document.getElementById('expand-all');
        if (expandBtn) { e.preventDefault(); expandBtn.click(); return; }
      }
    }
    if (e.key === 'Escape') {
      if (sheet && sheet.classList.contains('is-open')) { closeSheet(); return; }
      if (open) { e.preventDefault(); closeP(); return; }
    }
    if (!open) return;
    if (e.key === 'ArrowDown')   { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Tab')       { e.preventDefault(); setTab(currentTab === 'api' ? 'page' : 'api'); }
    else if (e.key === 'Enter')     { e.preventDefault(); const it = current[activeIdx]; if (it) jumpTo(it.href); }
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

  function highlightJsonBlocks(root) {
    (root || document).querySelectorAll('pre.json-body').forEach(pre => {
      if (pre.dataset.highlighted === '1') return;
      pre.innerHTML = highlightJson(pre.textContent);
      pre.dataset.highlighted = '1';
    });
  }

  let endpointDetailsPromise = null;
  function loadEndpointDetails() {
    if (window.__ENDPOINT_DETAILS__) return Promise.resolve(window.__ENDPOINT_DETAILS__);
    if (!window.__ENDPOINT_DETAIL_SRC__) return Promise.resolve(null);
    if (endpointDetailsPromise) return endpointDetailsPromise;
    endpointDetailsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = window.__ENDPOINT_DETAIL_SRC__;
      s.onload = () => resolve(window.__ENDPOINT_DETAILS__ || null);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return endpointDetailsPromise;
  }

  function appendEndpointDetail(d, html) {
    const loading = d.querySelector(':scope > .endpoint-loading');
    if (loading) loading.remove();
    const holder = document.createElement('div');
    holder.innerHTML = html;
    while (holder.firstChild) d.appendChild(holder.firstChild);
    d.dataset.hydrated = '1';
    highlightJsonBlocks(d);
  }

  function hydrateEndpoint(d) {
    if (!d || d.dataset.hydrated === '1' || d.dataset.hydrating === '1') return;
    const tpl = d.querySelector(':scope > template.endpoint-template');
    if (tpl) {
      d.appendChild(tpl.content.cloneNode(true));
      d.dataset.hydrated = '1';
      highlightJsonBlocks(d);
      return;
    }
    // Mark hydration in-flight synchronously so a re-entrant call (e.g. the
    // toggle handler firing right after a hash-navigation expand) doesn't
    // kick off a second load that would append the detail content twice.
    d.dataset.hydrating = '1';
    const loading = d.querySelector(':scope > .endpoint-loading');
    if (loading) loading.textContent = 'Loading endpoint details...';
    loadEndpointDetails().then(map => {
      if (!map || !map[d.id]) {
        if (loading) loading.textContent = 'Endpoint detail payload is unavailable.';
        return;
      }
      appendEndpointDetail(d, map[d.id]);
    }).catch(() => {
      if (loading) loading.textContent = 'Could not load endpoint details.';
    }).finally(() => {
      delete d.dataset.hydrating;
    });
  }

  document.querySelectorAll('details.endpoint').forEach(d => {
    d.addEventListener('toggle', () => { if (d.open) hydrateEndpoint(d); });
    if (d.open) hydrateEndpoint(d);
  });

  highlightJsonBlocks(document);
  /*
  document.querySelectorAll('pre.json-body').forEach(pre => {
    pre.innerHTML = highlightJson(pre.textContent);
  });
  */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-json'); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const card = btn.closest('.json-card'); if (!card) return;
    const pre = card.querySelector('pre.json-body'); if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard?.writeText(text).then(() => {
      btn.classList.add('copied');
      btn.textContent = '✓ copied';
      toast('Copied JSON');
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = 'copy'; }, 1400);
    });
  });

  // Copy-path buttons (legacy, kept for endpoint summaries that don't have ep-actions)
  document.querySelectorAll('details.endpoint').forEach(d => {
    if (d.querySelector('.ep-actions')) return; // new card has its own actions
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
        toast('Copied path');
        setTimeout(()=>{ btn.classList.remove('copied'); btn.innerHTML='copy'; },1400);
      });
    });
    summary.appendChild(btn);
  });

  // ─── ENDPOINT ACTIONS (copy path / permalink / cURL) ────────────────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ep-action'); if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const action = btn.dataset.action;
    const ep = btn.closest('details.endpoint');
    if (!ep) return;
    let text = '', toastMsg = 'Copied';
    if (action === 'copy-path') {
      text = btn.dataset.path || (ep.querySelector('.e-path')?.textContent.trim() || '');
      toastMsg = 'Copied path';
    } else if (action === 'copy-permalink') {
      text = location.origin + location.pathname + '#' + ep.id;
      toastMsg = 'Copied permalink';
    } else if (action === 'copy-curl') {
      text = btn.dataset.curl || '';
      try { text = decodeURIComponent(text); } catch(e) {}
      toastMsg = 'Copied cURL';
    } else { return; }
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      btn.classList.add('is-copied');
      const orig = btn.innerHTML;
      btn.innerHTML = '<svg class="i"><use href="#i-check"/></svg><span>copied</span>';
      toast(toastMsg);
      setTimeout(() => { btn.classList.remove('is-copied'); btn.innerHTML = orig; }, 1400);
    });
  });

  // ─── ENDPOINT TABS (Overview / Schema / Example) ────────────────────────
  document.addEventListener('click', e => {
    const tab = e.target.closest('.ep-tab'); if (!tab) return;
    e.preventDefault();
    const ep = tab.closest('details.endpoint'); if (!ep) return;
    const targetKey = tab.dataset.tab;
    ep.querySelectorAll('.ep-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === targetKey));
    ep.querySelectorAll('.ep-tab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.tab === targetKey));
  });

  // ─── USED-BY "Show more" expand ─────────────────────────────────────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ub-more[data-ub-expand]');
    if (!btn) return;
    const list = btn.closest('.ub-list');
    if (list) list.querySelectorAll('.ub-row[hidden]').forEach(r => r.removeAttribute('hidden'));
    btn.remove();
  });

  // TOC scroll-spy
  const tocLinks = Array.from(document.querySelectorAll('aside.toc a[data-toc]'));
  const tocTargets = tocLinks.map(a => document.getElementById(a.dataset.toc)).filter(Boolean);
  const subnavLinks = Array.from(document.querySelectorAll('.subnav a[href^="#"]'));
  function updateActiveToc() {
    const sy = window.scrollY + 120;
    if (tocTargets.length) {
      let activeId = tocTargets[0].id;
      for (const t of tocTargets) { if (t.offsetTop <= sy) activeId = t.id; else break; }
      tocLinks.forEach(a => a.classList.toggle('active', a.dataset.toc === activeId));
      document.querySelectorAll('nav.rail a.area-link').forEach(a => a.classList.remove('is-active'));
      const ra = document.querySelector('nav.rail a.area-link[href="#'+activeId+'"]'); if (ra) ra.classList.add('is-active');
    } else {
      const areaLinks = Array.from(document.querySelectorAll('nav.rail a.area-link'));
      const areaTargets = areaLinks.map(a => {
        const id = (a.getAttribute('href') || '').slice(1);
        return { a, el: id ? document.getElementById(id) : null };
      }).filter(x => x.el);
      if (areaTargets.length) {
        let activeId = areaTargets[0].el.id;
        for (const { el } of areaTargets) { if (el.offsetTop <= sy) activeId = el.id; else break; }
        areaLinks.forEach(a => a.classList.toggle('is-active', (a.getAttribute('href') || '').slice(1) === activeId));
      }
    }
    if (subnavLinks.length) {
      const visited = subnavLinks.map(a => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        return { a, el, top: el ? el.offsetTop : -1 };
      }).filter(x => x.el);
      let active = visited[0];
      for (const x of visited) { if (x.top <= sy) active = x; else break; }
      subnavLinks.forEach(a => a.classList.toggle('is-active', a === active.a));
    }
  }
  let rp = false;
  window.addEventListener('scroll', () => { if (!rp) { rp = true; requestAnimationFrame(()=>{ updateActiveToc(); rp = false; }); } }, { passive:true });
  updateActiveToc();

  function expandAnchor() {
    const h = location.hash.slice(1); if (!h) return;
    const t = document.getElementById(h);
    if (t && t.tagName.toLowerCase() === 'details') {
      hydrateEndpoint(t);
      t.open = true;
    }
  }
  window.addEventListener('hashchange', expandAnchor); expandAnchor();

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
    // Read filter state from URL hash on load: #m=POST,GET&s=svc1,svc2&q=term
    function readHash() {
      const h = location.hash.slice(1); if (!h) return;
      const params = new URLSearchParams(h);
      const m = params.get('m'); if (m) { activeMethod = m.toUpperCase(); }
      const s = params.get('s'); if (s) { s.split(',').forEach(v => activeSvcs.add(v)); }
      const qp = params.get('q'); if (qp) { q = qp.toLowerCase(); text.value = qp; }
      mchips.forEach(x => x.classList.toggle('is-active', x.dataset.method === activeMethod));
      schips.forEach(x => x.classList.toggle('is-active', activeSvcs.has(x.dataset.svc)));
    }
    function writeHash() {
      const params = new URLSearchParams();
      if (activeMethod) params.set('m', activeMethod);
      if (activeSvcs.size) params.set('s', Array.from(activeSvcs).join(','));
      if (q) params.set('q', q);
      const str = params.toString();
      // History.replaceState avoids polluting browser history while filters move.
      const url = location.pathname + location.search + (str ? '#' + str : '');
      history.replaceState(null, '', url);
    }
    function applyAndSync() { apply(); writeHash(); }
    readHash(); apply();
    text.addEventListener('input', e => { q = e.target.value.toLowerCase().trim(); applyAndSync(); });
    mchips.forEach(c => c.addEventListener('click', () => {
      const m = c.dataset.method;
      activeMethod = (activeMethod === m) ? null : m;
      mchips.forEach(x => x.classList.toggle('is-active', x.dataset.method === activeMethod));
      applyAndSync();
    }));
    schips.forEach(c => c.addEventListener('click', () => {
      const s = c.dataset.svc;
      if (activeSvcs.has(s)) activeSvcs.delete(s); else activeSvcs.add(s);
      schips.forEach(x => x.classList.toggle('is-active', activeSvcs.has(x.dataset.svc)));
      applyAndSync();
    }));
    clear.addEventListener('click', () => {
      activeMethod = null; activeSvcs.clear(); q = ''; text.value = '';
      mchips.forEach(x => x.classList.remove('is-active'));
      schips.forEach(x => x.classList.remove('is-active'));
      applyAndSync();
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
    // Auto-open the area containing an endpoint targeted by the initial URL hash
    if (location.hash) { const epLink = map.get(location.hash.slice(1)); if (epLink) epLink.closest('.area-item')?.classList.add('is-open'); }
    const obs = new IntersectionObserver(es => es.forEach(en => {
      const l = map.get(en.target.id); if (!l) return;
      if (en.isIntersecting) { l.classList.add('is-active'); l.closest('.area-item')?.classList.add('is-open'); }
      else l.classList.remove('is-active');
    }), { rootMargin:'-30% 0px -55% 0px' });
    eps.forEach(el => obs.observe(el));
  }

  // Rail area — clicking always opens that area's endpoint list (never collapses via nav click)
  document.querySelectorAll('nav.rail .area-link').forEach(link => {
    link.addEventListener('click', () => link.closest('.area-item')?.classList.add('is-open'));
  });

  // Expand all / Collapse all on service pages
  const expandAllBtn = document.getElementById('expand-all');
  if (expandAllBtn) {
    const allEndpoints = Array.from(document.querySelectorAll('details.endpoint'));
    const allAreaItems = Array.from(document.querySelectorAll('nav.rail .area-item'));
    let allExpanded = false;
    expandAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      allAreaItems.forEach(item => item.classList.toggle('is-open', allExpanded));
      allEndpoints.forEach(d => { if (allExpanded) hydrateEndpoint(d); d.open = allExpanded; });
      expandAllBtn.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    });
  }

  // Service page inline filter
  (function() {
    const filterEl = document.getElementById('svc-filter');
    if (!filterEl) return;
    const textInput = document.getElementById('svc-filter-text');
    const methodBtns = Array.from(filterEl.querySelectorAll('.svc-mchip'));
    const clearBtn = document.getElementById('svc-filter-clear');
    const countEl = document.getElementById('svc-filter-count');
    const allEndpoints = Array.from(document.querySelectorAll('details.endpoint'));
    const allAreas = Array.from(document.querySelectorAll('section.area'));
    let activeMethod = null, q = '';
    function applyFilter() {
      let shown = 0;
      for (const ep of allEndpoints) {
        const method = ep.querySelector('.verb')?.textContent?.trim() || '';
        const path = ep.querySelector('.e-path')?.getAttribute('data-tip') || ep.querySelector('.e-path')?.textContent?.trim() || '';
        const summary = ep.querySelector('.e-summary')?.textContent?.trim() || '';
        const area = ep.dataset.area || '';
        const hay = (path + ' ' + summary + ' ' + area).toLowerCase();
        let visible = true;
        if (activeMethod && method !== activeMethod) visible = false;
        if (visible && q && !hay.includes(q)) visible = false;
        ep.hidden = !visible;
        if (visible) shown++;
      }
      for (const area of allAreas) {
        area.hidden = !area.querySelector('details.endpoint:not([hidden])');
      }
      if (countEl) countEl.textContent = shown + ' endpoint' + (shown === 1 ? '' : 's');
      clearBtn?.classList.toggle('is-active', !!(activeMethod || q));
    }
    if (textInput) textInput.addEventListener('input', e => { q = e.target.value.toLowerCase().trim(); applyFilter(); });
    methodBtns.forEach(btn => btn.addEventListener('click', () => {
      const m = btn.dataset.m;
      activeMethod = activeMethod === m ? null : m;
      methodBtns.forEach(b => b.classList.toggle('is-active', b.dataset.m === activeMethod));
      applyFilter();
    }));
    if (clearBtn) clearBtn.addEventListener('click', () => {
      activeMethod = null; q = '';
      if (textInput) textInput.value = '';
      methodBtns.forEach(b => b.classList.remove('is-active'));
      applyFilter();
    });
    applyFilter();
  })();

  // Mobile rail drawer. The rendered rail remains full fidelity on desktop,
  // while mobile users get a compact picker instead of thousands of links above content.
  document.querySelectorAll('nav.rail').forEach(rail => {
    if (rail.querySelector('.rail-toggle')) return;
    const epCount = rail.querySelectorAll('a.ep-link').length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rail-toggle';
    btn.innerHTML = '<span><svg class="i"><use href="#i-list"/></svg> Navigation</span><span class="count">' + epCount + '</span>';
    btn.addEventListener('click', () => {
      rail.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', rail.classList.contains('is-open') ? 'true' : 'false');
    });
    rail.insertBefore(btn, rail.firstChild);
    rail.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a && window.matchMedia('(max-width: 820px)').matches) rail.classList.remove('is-open');
    });
  });

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

  // V2 API Explorer
  const explorer = document.getElementById('api-explorer');
  if (explorer && window.__CATALOGUE_V2__) {
    const data = window.__CATALOGUE_V2__;
    const rows = data.endpoints || [];
    const text = document.getElementById('api-filter-text');
    const svc = document.getElementById('api-filter-service');
    const method = document.getElementById('api-filter-method');
    const category = document.getElementById('api-filter-category');
    const auth = document.getElementById('api-filter-auth');
    const schema = document.getElementById('api-filter-schema');
    const usage = document.getElementById('api-filter-usage');
    const clear = document.getElementById('api-filter-clear');
    const results = document.getElementById('api-results');
    const summary = document.getElementById('api-summary');
    const option = (value, label) => '<option value="' + escHTML(value) + '">' + escHTML(label) + '</option>';
    const unique = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
    if (svc) svc.innerHTML += unique(rows.map(r => r.service)).map(v => option(v, (data.services || []).find(s => s.id === v)?.name || v)).join('');
    if (method) method.innerHTML += unique(rows.map(r => r.method)).map(v => option(v, v)).join('');
    if (category) category.innerHTML += unique(rows.map(r => r.category)).map(v => option(v, v === 'uncategorized' ? 'Other / uncategorized' : v)).join('');

    function parseExplorerQuery(q) {
      const filters = {};
      const terms = [];
      String(q || '').trim().split(/\\s+/).filter(Boolean).forEach(tok => {
        const m = tok.match(/^([a-z]+):(.*)$/i);
        if (m) filters[m[1].toLowerCase()] = m[2].toLowerCase();
        else if (/^(GET|POST|PUT|PATCH|DELETE)$/i.test(tok)) filters.method = tok.toUpperCase();
        else terms.push(tok.toLowerCase().replace(/^\\//, ''));
      });
      return { filters, terms };
    }
    function matchesQuery(r, parsed) {
      const f = parsed.filters;
      if (f.service && !r.service.toLowerCase().includes(f.service)) return false;
      if (f.method && r.method !== f.method.toUpperCase()) return false;
      if (f.category && !r.category.toLowerCase().includes(f.category)) return false;
      if (f.auth && r.auth !== f.auth) return false;
      if (f.schema && r.schema !== f.schema) return false;
      if (f.used === '0' && r.used !== 0) return false;
      if (f.used && f.used !== '0' && r.used === 0) return false;
      const hay = (r.path + ' ' + r.summary + ' ' + r.area + ' ' + r.serviceName + ' ' + (r.tags || []).join(' ')).toLowerCase();
      return parsed.terms.every(t => hay.includes(t));
    }
    function chip(label, cls) {
      return '<span class="api-chip ' + (cls || '') + '">' + escHTML(label) + '</span>';
    }
    function renderRow(r) {
      const schemaCls = r.schema === 'ok' ? 'is-ok' : 'is-warn';
      const authCls = r.auth === 'none' ? 'is-warn' : 'is-ok';
      const usedLabel = r.used ? r.used + ' UI' : (r.siblingUsed ? r.siblingUsed + ' sibling' : '0 UI');
      return '<a class="api-result" href="' + escHTML(r.href) + '">'
        + chip(r.method, r.method)
        + '<span class="api-path"><code>' + escHTML(r.path) + '</code><span class="api-summary">' + escHTML(r.summary || r.area) + '</span></span>'
        + '<span class="api-chip api-service">' + escHTML(r.serviceName) + '</span>'
        + '<span class="api-chip api-category">' + escHTML(r.category === 'uncategorized' ? 'other' : r.category) + '</span>'
        + '<span class="api-health">' + chip(r.auth === 'none' ? 'no gate' : r.auth, authCls) + chip('schema ' + r.schema, schemaCls) + (r.paginated ? chip('pageable', 'is-muted') : '') + '</span>'
        + '<span class="api-chip api-used ' + (r.used || r.siblingUsed ? 'is-ok' : 'is-warn') + '">' + escHTML(usedLabel) + '</span>'
        + '</a>';
    }
    function applyUrlParams() {
      const params = new URLSearchParams(location.search);
      if (params.get('category') && category) category.value = params.get('category');
      if (params.get('service') && svc) svc.value = params.get('service');
      if (params.get('method') && method) method.value = params.get('method').toUpperCase();
      if (params.get('q') && text) text.value = params.get('q');
    }
    function applyExplorer() {
      const parsed = parseExplorerQuery(text ? text.value : '');
      let out = rows.filter(r => {
        if (svc && svc.value && r.service !== svc.value) return false;
        if (method && method.value && r.method !== method.value) return false;
        if (category && category.value && r.category !== category.value) return false;
        if (auth && auth.value && r.auth !== auth.value) return false;
        if (schema && schema.value && r.schema !== schema.value) return false;
        if (usage && usage.value === 'used' && r.used === 0) return false;
        if (usage && usage.value === 'orphan' && r.used !== 0) return false;
        if (usage && usage.value === 'sibling' && r.siblingUsed === 0) return false;
        return matchesQuery(r, parsed);
      });
      out.sort((a, b) => {
        const au = a.used + a.siblingUsed, bu = b.used + b.siblingUsed;
        return bu - au || a.service.localeCompare(b.service) || a.path.localeCompare(b.path);
      });
      const shown = out.slice(0, 700);
      if (summary) {
        const used = out.filter(r => r.used > 0).length;
        const missing = out.filter(r => r.schema === 'missing').length;
        const noGate = out.filter(r => r.auth === 'none').length;
        summary.innerHTML =
          '<div class="summary-tile"><span>Showing</span><b>' + out.length.toLocaleString() + '</b></div>'
          + '<div class="summary-tile"><span>UI used</span><b>' + used.toLocaleString() + '</b></div>'
          + '<div class="summary-tile"><span>Schema missing</span><b>' + missing.toLocaleString() + '</b></div>'
          + '<div class="summary-tile"><span>No detected gate</span><b>' + noGate.toLocaleString() + '</b></div>';
      }
      if (results) {
        results.innerHTML = shown.map(renderRow).join('') + (out.length > shown.length ? '<div class="api-more">Showing first ' + shown.length + ' of ' + out.length + ' matches. Tighten filters to narrow the set.</div>' : '');
      }
    }
    applyUrlParams();
    [text, svc, method, category, auth, schema, usage].filter(Boolean).forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', applyExplorer));
    if (clear) clear.addEventListener('click', () => {
      if (text) text.value = '';
      [svc, method, category, auth, schema, usage].filter(Boolean).forEach(el => { el.value = ''; });
      history.replaceState(null, '', location.pathname);
      applyExplorer();
    });
    applyExplorer();
  }

  // Map ⌘K hero badge for the search button (specific to the home page hero)
  const kbdHero = document.getElementById('kbd-meta-hero');
  if (kbdHero) kbdHero.textContent = isMac ? '⌘' : 'Ctrl';

})();
`;

function escapeHtml(s) { return String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function escapeAttr(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

module.exports = { FONTS, CSS, SCRIPT, APPBAR, PALETTE, ICONS, TOAST, SHORTCUTS_SHEET, escapeHtml, escapeAttr };
