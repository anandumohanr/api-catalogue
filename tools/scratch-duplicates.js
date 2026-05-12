// One-shot survey: same METHOD+path in multiple services, and per-twin UI consumers.
const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '..', '_data');
const services = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8')).services;

const xref = JSON.parse(fs.readFileSync(path.join(dataDir, 'xref.json'), 'utf8'));
const usage = xref.endpointUsage || {};

const byKey = new Map(); // `${method} ${path}` -> [{serviceId, endpointId, area, pages}]
for (const svc of services) {
  const specPath = path.join(dataDir, `${svc.id}.spec.json`);
  if (!fs.existsSync(specPath)) continue;
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  for (const area of spec.areas || []) {
    for (const ep of area.endpoints || []) {
      const k = `${ep.method} ${ep.path}`;
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({
        serviceId: svc.id,
        endpointId: ep.id,
        area: area.name,
        pages: (usage[ep.id] || []).length,
      });
    }
  }
}

const dupes = [...byKey.entries()].filter(([, v]) => v.length > 1);
console.log(`total endpoints: ${[...byKey.values()].reduce((a, v) => a + v.length, 0)}`);
console.log(`duplicate (METHOD path) groups: ${dupes.length}`);
console.log(`endpoints inside duplicate groups: ${dupes.reduce((a, [, v]) => a + v.length, 0)}`);

let consumedTwinSilentSibling = 0;
let allSilent = 0;
let allConsumed = 0;
for (const [, group] of dupes) {
  const consumed = group.filter(g => g.pages > 0).length;
  if (consumed === 0) allSilent++;
  else if (consumed === group.length) allConsumed++;
  else consumedTwinSilentSibling++;
}
console.log(`groups where SOME twin has UI and SOME does not: ${consumedTwinSilentSibling}`);
console.log(`groups where NO twin has UI: ${allSilent}`);
console.log(`groups where ALL twins have UI: ${allConsumed}`);

console.log('\n--- mixed groups (the "missing" cases) ---');
for (const [k, group] of dupes) {
  const consumed = group.filter(g => g.pages > 0).length;
  if (consumed === 0 || consumed === group.length) continue;
  console.log(`\n${k}`);
  for (const g of group) {
    console.log(`  ${g.serviceId.padEnd(22)} ${g.endpointId.padEnd(28)} area=${g.area.padEnd(28)} pages=${g.pages}`);
  }
}

console.log('\n--- all-silent duplicate groups (rare; both twins unused) ---');
let printed = 0;
for (const [k, group] of dupes) {
  const consumed = group.filter(g => g.pages > 0).length;
  if (consumed !== 0) continue;
  if (printed++ < 25) {
    console.log(`\n${k}`);
    for (const g of group) console.log(`  ${g.serviceId} ${g.endpointId} area=${g.area}`);
  }
}
