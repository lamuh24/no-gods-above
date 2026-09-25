#!/usr/bin/env node
// Rebase this stage-only correction onto the last verified public package.
// The shared source tree contains separate, unfinished character/combat edits.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const source = path.resolve(__dirname, '../playtest_public');
const target = path.resolve(process.argv[2] || '');
assert(process.argv[2], 'Pass a new output directory');
assert(fs.existsSync(source), 'Missing previous public package');
assert(!fs.existsSync(target), 'Output directory already exists');

const oldBundle = 'playtest-index-BjJxUG2Y-optimized-1d09f80158f2.js';
let bundle = fs.readFileSync(path.join(source, 'assets', oldBundle), 'utf8');
const patch = (from, to, label) => {
  const first = bundle.indexOf(from);
  assert(first >= 0 && bundle.indexOf(from, first + 1) < 0, `${label}: expected exactly one source match`);
  bundle = bundle.replace(from, to);
};

patch('openPlatform:{left:-420,right:420,blastX:690,blastY:220',
  'openPlatform:{left:-900,right:900,blastX:1170,blastY:220', 'stock collision dimensions');
patch('stage:{left:-420,right:420,groundY:0,ceilingY:-180}',
  'stage:{left:t.versusRules?.openPlatform?.left??-420,right:t.versusRules?.openPlatform?.right??420,groundY:0,ceilingY:-180}',
  'stock simulation bounds');
patch('let o=xF((r+i)/2,-5.6,5.6),s=a*.47',
  'let h=e.matchConfig.versusRules?.openPlatform,g=h?Math.max(5.6,h.right*.02-2.5):5.6,o=xF((r+i)/2,-g,g),s=a*.47',
  'far-edge camera tracking');
patch('Math.max(e.matchConfig.versusRules?.openPlatform?20.5:18.4,',
  'Math.max(18.4,', 'regular 1v1 camera scale');
patch('let y=m.mode===`rounds`,b=m.mode===`stocks`,S=y||b;n.innerHTML=',
  'let y=m.mode===`rounds`,b=m.mode===`stocks`,S=y||b;e=b&&d===`fallen-capital`?2700:1600,a=e/2;n.innerHTML=',
  'full-width combat texture');
patch('bounds:{left:-420,right:420,groundY:0,leftWorld:-8.4,rightWorld:8.4},endpoints:{left:this.project(-420,0),right:this.project(420,0),center:this.project(0,0)}',
  'bounds:{left:this.stockMode?-900:-420,right:this.stockMode?900:420,groundY:0,leftWorld:this.stockMode?-18:-8.4,rightWorld:this.stockMode?18:8.4},endpoints:{left:this.project(this.stockMode?-900:-420,0),right:this.project(this.stockMode?900:420,0),center:this.project(0,0)}',
  'stage diagnostics');

// Refuse to patch a different release or a package without the expected HTML.
for (const htmlName of ['index.html', 'versus-playtest.html']) {
  const html = fs.readFileSync(path.join(source, htmlName), 'utf8');
  assert(html.includes(oldBundle), `${htmlName}: previous bundle reference missing`);
}
fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: true });
const digest = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 12);
const newBundle = `playtest-index-fullstage-${digest}.js`;
fs.writeFileSync(path.join(target, 'assets', newBundle), bundle);
for (const htmlName of ['index.html', 'versus-playtest.html']) {
  const htmlPath = path.join(target, htmlName);
  const html = fs.readFileSync(htmlPath, 'utf8');
  fs.writeFileSync(htmlPath, html.replace(oldBundle, newBundle));
}
console.log(JSON.stringify({ source, target, previousBundle: oldBundle, newBundle, digest, patchCount: 6 }));
