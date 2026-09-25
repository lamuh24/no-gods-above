// Re-derives the versus playtest body metrics from the shipped art.
//
// Every constant in src/versus/roster.ts comes from this script. Run it after
// any idle-frame change to confirm the numbers still hold:
//   node scripts/measure_versus_body_metrics.mjs
//
// Method (alpha mask of each fighter's idle frame):
//   feetY       lowest opaque row: the floor contact line.
//   headTopY    first row at least 60px wide. A narrower threshold latches onto
//               Swahili's scythe blade, which rises above his head and is not
//               part of his body.
//   footCentreX centre of the union of shoe-sized runs (55-260px wide) across
//               the bottom tenth of the body. The width band excludes Lamuh's
//               robe hem and Swahili's coat tails and scythe spike, and the
//               vertical window is deep enough to catch a raised rear foot.
//
// Lamuh's root X is NOT measured: his frames carry an authored, approved root
// that the whole Lamuh toolchain shares, so this script reads it from the
// manifest instead of second-guessing it.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '..');
const repo = path.resolve(engine, '..', '..');

const WORLD_SCALE = 1.3;
const TARGET_BODY_UNITS = 182;

const PY = `
import sys, json
import numpy as np
from PIL import Image
path = sys.argv[1]
a = np.array(Image.open(path).convert('RGBA').getchannel('A')) > 8
rows = a.sum(1); nz = np.nonzero(rows)[0]
feet = int(nz[-1])
head = int(next(y for y in nz if rows[y] >= 60))
body = feet - head
left = right = None
for y in range(feet - int(body * 0.10), feet + 1):
    c = np.nonzero(a[y])[0]
    if len(c) == 0: continue
    runs = [r for r in np.split(c, np.nonzero(np.diff(c) != 1)[0] + 1) if 55 <= len(r) <= 260]
    if not runs: continue
    l, r = int(runs[0][0]), int(runs[-1][-1])
    left = l if left is None else min(left, l)
    right = r if right is None else max(right, r)
centre = (left + right) // 2 if left is not None else a.shape[1] // 2
print(json.dumps({'canvasW': int(a.shape[1]), 'canvasH': int(a.shape[0]),
                  'feetY': feet, 'headTopY': head, 'footCentreX': int(centre)}))
`;

const measure = (file) => JSON.parse(execFileSync('python', ['-c', PY, file], { encoding: 'utf8' }).trim());

// Lamuh's authored root, straight from the movement manifest.
function lamuhAuthoredRootX() {
  const data = JSON.parse(readFileSync(path.join(engine, 'public/lamuh-legacy-v2/review-data.json'), 'utf8'));
  return data.movementModernization.states.idle.frames[0].root.x;
}

const TARGETS = [
  {
    name: 'LAMUH',
    file: path.join(engine, 'public/lamuh-legacy-v2/movement-v2/idle-00.png'),
    rootXSource: 'authored manifest root',
    rootX: lamuhAuthoredRootX,
    expected: { canvasW: 2048, canvasH: 1536, feetY: 1359, headTopY: 571, footCentreX: 768 }
  },
  {
    name: 'SWAHILI',
    file: path.join(repo, 'tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png'),
    rootXSource: 'measured foot centre',
    rootX: (measured) => measured.footCentreX,
    expected: { canvasW: 1536, canvasH: 1536, feetY: 1406, headTopY: 371, footCentreX: 773 }
  }
];

let failures = 0;
console.log(`shared body height target: ${TARGET_BODY_UNITS}u at world scale ${WORLD_SCALE}\n`);

for (const target of TARGETS) {
  readFileSync(target.file); // fail loudly if the art moved
  const measured = measure(target.file);
  measured.footCentreX = target.rootX(measured);
  const bodyPx = measured.feetY - measured.headTopY;
  const drawScale = (TARGET_BODY_UNITS * WORLD_SCALE) / bodyPx;

  console.log(target.name);
  console.log(`  canvas       ${measured.canvasW}x${measured.canvasH}`);
  console.log(`  feet / head  y=${measured.feetY} / y=${measured.headTopY}  -> body ${bodyPx}px`);
  console.log(`  root         (${measured.footCentreX}, ${measured.feetY})   [x from ${target.rootXSource}]`);
  console.log(`  draw scale   ${drawScale.toFixed(5)} canvas px per source px`);
  console.log(`  drawn height ${((bodyPx * drawScale) / WORLD_SCALE).toFixed(2)}u`);

  for (const key of Object.keys(target.expected)) {
    if (measured[key] !== target.expected[key]) {
      console.error(`  MISMATCH ${key}: measured ${measured[key]}, roster.ts records ${target.expected[key]}`);
      failures += 1;
    }
  }
  console.log('');
}

if (failures) {
  console.error(`${failures} metric(s) drifted from src/versus/roster.ts — update the roster before trusting the playtest.`);
  process.exit(1);
}
console.log('All measured metrics match src/versus/roster.ts.');
