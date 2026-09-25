const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { VFX_ENGINE_V1_CATALOG, validateVfxCatalog, vfxCatalogManifest } = require("../dist/vfx/catalog.js");
const { VfxEngine } = require("../dist/vfx/engine.js");

let passed = 0;
function run(name, test) {
  test();
  passed += 1;
  console.log(`PASS ${name}`);
}

function engineFor(effectId, options = {}) {
  const engine = new VfxEngine(VFX_ENGINE_V1_CATALOG, 0x56465831);
  engine.trigger(effectId, {
    anchorId: "socket",
    anchor: { x: 480, y: 282 },
    facing: options.facing || 1,
    outcome: options.outcome || "hit",
    seed: 0x4e474131
  });
  return engine;
}

run("catalog is valid, unique, candidate-only, and contains no baked fighter art", () => {
  assert.deepStrictEqual(validateVfxCatalog(), []);
  assert.strictEqual(VFX_ENGINE_V1_CATALOG.length, 8);
  assert.strictEqual(new Set(VFX_ENGINE_V1_CATALOG.map((effect) => effect.id)).size, 8);
  assert.ok(VFX_ENGINE_V1_CATALOG.every((effect) => effect.candidateOnly && !effect.deployable && !effect.fighterArtworkBakedIn));
  const serialized = JSON.stringify(VFX_ENGINE_V1_CATALOG);
  assert.doesNotMatch(serialized, /assets\/sprites|source-frames|fighterArtworkPath|\.png|\.webp/i);
});

run("catalog manifest exposes rendering-only and no-simulation-authority boundaries", () => {
  const manifest = vfxCatalogManifest();
  assert.strictEqual(manifest.status, "candidate-only");
  assert.strictEqual(manifest.deployable, false);
  assert.strictEqual(manifest.renderingOnly, true);
  assert.strictEqual(manifest.simulationAuthority, false);
  assert.strictEqual(manifest.tickRate, 60);
});

run("opposed split shot emits two simultaneous muzzle flashes with no baked impact", () => {
  const engine = engineFor("swahili.opposed_split_shot_v2");
  engine.seek(3);
  const frame = engine.sample({ socket: { x: 480, y: 282 } });
  const flashes = frame.primitives.filter((primitive) => primitive.kind === "flash");
  assert.strictEqual(flashes.length, 2);
  assert.ok(flashes.some((primitive) => primitive.x < 480));
  assert.ok(flashes.some((primitive) => primitive.x > 480));
  assert.strictEqual(frame.primitives.some((primitive) => primitive.layerId.includes("impact")), false);
});

run("facing mirrors offsets and projectile travel without changing timing", () => {
  const right = engineFor("projectile.celestial_orb", { facing: 1 });
  const left = engineFor("projectile.celestial_orb", { facing: -1 });
  right.seek(10);
  left.seek(10);
  const rightCore = right.sample().primitives.find((primitive) => primitive.layerId === "orb_core");
  const leftCore = left.sample().primitives.find((primitive) => primitive.layerId === "orb_core");
  assert.ok(rightCore.x > 480);
  assert.ok(leftCore.x < 480);
  assert.strictEqual(Math.round(rightCore.x - 480), Math.round(480 - leftCore.x));
});

run("hit, block, and whiff gates keep impact VFX honest", () => {
  const hit = engineFor("impact.heavy_old_gold", { outcome: "hit" }).sample();
  const whiff = engineFor("impact.heavy_old_gold", { outcome: "whiff" }).sample();
  const block = engineFor("impact.block_cyan", { outcome: "block" }).sample();
  const wrongOutcome = engineFor("impact.block_cyan", { outcome: "hit" }).sample();
  assert.ok(hit.primitives.length > 0);
  assert.notDeepStrictEqual(hit.cameraShake, [0, 0]);
  assert.strictEqual(whiff.primitives.length, 0);
  assert.deepStrictEqual(whiff.cameraShake, [0, 0]);
  assert.ok(block.primitives.length > 0);
  assert.strictEqual(wrongOutcome.primitives.length, 0);
  assert.deepStrictEqual(wrongOutcome.cameraShake, [0, 0]);
});

run("follow anchors move only layers that explicitly opt in", () => {
  const moving = engineFor("movement.cyan_dash_trail");
  moving.seek(10);
  const atSpawn = moving.sample({ socket: { x: 480, y: 282 } });
  const moved = moving.sample({ socket: { x: 620, y: 282 } });
  assert.strictEqual(Math.round(moved.primitives[0].x - atSpawn.primitives[0].x), 140);

  const world = engineFor("environment.heavy_landing_dust");
  world.seek(10);
  const worldAtSpawn = world.sample({ socket: { x: 480, y: 282 } });
  const worldMoved = world.sample({ socket: { x: 620, y: 282 } });
  assert.deepStrictEqual(worldMoved.primitives, worldAtSpawn.primitives);
});

run("sampling is pure and fixed-seed replay checksums are deterministic", () => {
  const first = engineFor("system.burst_gold_cyan");
  const second = engineFor("system.burst_gold_cyan");
  const firstChecksums = [];
  const secondChecksums = [];
  for (let tick = 0; tick < 36; tick += 1) {
    first.seek(tick);
    second.seek(tick);
    const firstFrame = first.sample();
    firstChecksums.push(firstFrame.checksum);
    secondChecksums.push(second.sample().checksum);
    assert.strictEqual(first.sample().checksum, firstFrame.checksum, "sample must not mutate engine state");
  }
  assert.deepStrictEqual(firstChecksums, secondChecksums);
  assert.strictEqual(firstChecksums[0], "f1862639");
  assert.strictEqual(firstChecksums.at(-1), "0dd1b44e");
});

run("schema and VFX-only lab entry exist as independent additive artifacts", () => {
  const root = path.resolve(__dirname, "..");
  const schema = JSON.parse(fs.readFileSync(path.join(root, "schemas", "vfx-effect-v1.schema.json"), "utf8"));
  const html = fs.readFileSync(path.join(root, "vfx-lab.html"), "utf8");
  assert.strictEqual(schema.title, "NGA VFX Engine V1 Effect Definition");
  assert.match(html, /NGA VFX Engine V1 Lab/);
  assert.match(html, /src\/vfx\/main\.ts/);
});

console.log(`VFX Engine V1 tests passed: ${passed}/8`);
