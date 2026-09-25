const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { swahiliSpriteGeometry, swahiliSpriteScale } = require('../dist/versus/swahiliSpriteGeometry');
const { SWAHILI_METRICS, drawScaleFor } = require('../dist/versus/roster');
const { inventory } = require('../scripts/swahili_scale_inventory.cjs');
const measured = require('../docs/versus_playtest/swahili-scale-v1/source-measurements.json');

// The same art exported at any resolution must occupy the same world space.
const native = swahiliSpriteGeometry(1536, 1536);
for (const width of [448, 512, 1024, 1536, 2048]) {
  const geometry = swahiliSpriteGeometry(width, width);
  assert.equal(geometry.width, native.width);
  assert.equal(geometry.height, native.height);
  assert.equal(geometry.rootX, native.rootX);
  assert.equal(geometry.rootY, native.rootY);
  const scale = drawScaleFor(SWAHILI_METRICS) * geometry.sourceToReference;
  assert.ok(Math.abs((1035 * width / 1536) * scale / 1.3 - 182) < 1e-8);
}
// A wider weapon canvas keeps its aspect. A tucked pose isn't auto-expanded.
assert.ok(Math.abs(swahiliSpriteGeometry(1536, 768).height * 2 - native.height) <= 1);
assert.throws(() => swahiliSpriteGeometry(0, 512));

const { groups, repo } = inventory();
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'tools/nga-forge/production/characters/swahili/reviews/new-specials-runtime-v1/manifest.json'), 'utf8'));
const normalized = new Map(Object.values(manifest.clips).flatMap(c => c.frames.map(f => [f.file, f])));
const unique = new Set();
for (const [name, group] of Object.entries(groups)) {
  const override = group.geometry;
  const scales = new Set();
  for (const file of group.urls) {
    unique.add(file);
    let frame = measured.frames[file];
    if (normalized.has(file)) {
      const png = fs.readFileSync(path.join(repo, file));
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      frame = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
      assert.deepEqual([frame.width, frame.height], manifest.cell, `${file} runtime cell`);
      assert.equal(png[25], 6, `${file} must have real RGBA channel`);
      assert.equal(override.referenceCanvasWidth, manifest.referenceCanvas[0]);
      const calibrated = { special_up_light: .80, special_neutral_heavy: .88, special_back_light: .86,
        special_back_medium: .90, special_back_heavy: .88, special_back_heavy_response: .87, special_down_light: .88 };
      assert.equal(override.bodyScale, calibrated[name], 'new clip must use its idle-calibrated body size');
      assert.deepEqual([override.root.x, override.root.y], manifest.root);
      const bounds = normalized.get(file).bounds1536;
      assert.ok(bounds[0] >= 0 && bounds[1] >= 0 && bounds[2] <= manifest.referenceCanvas[0] && bounds[3] <= manifest.referenceCanvas[1], `${file} clipped normalized bounds`);
    }
    assert.ok(frame, `Missing measured or normalized manifest evidence for ${file}`);
    const geometry = swahiliSpriteGeometry(frame.width, frame.height, override);
    scales.add(geometry.width);
    assert.ok(geometry.width > 0 && geometry.height > 0);
  }
  assert.equal(scales.size, 1, `${name} changes size within its clip`);
}
assert.equal([...normalized.keys()].filter(file => unique.has(file)).length, normalized.size, 'Every new normalized frame must be loaded');
// Historical Down Light remains a fallback artifact; its measured correction is
// not applied to the replacement. New clip body identity remains a visual check.
const idleHead = measured.frames[groups.idle.urls[0]].headMajor;
for (const file of measured.groups.special_down_light.urls) {
  const frame = measured.frames[file];
  const ratio = frame.headMajor / idleHead * 1536 / frame.width * swahiliSpriteScale.clipOverrides.special_down_light.bodyScale;
  assert.ok(Math.abs(ratio - 1) <= .08, `Down light differs from reference by ${ratio}`);
}
console.log(`PASS: ${unique.size} frames / ${Object.keys(groups).length} clips; resolution-independent size, stable clip scale, down-light calibration.`);
