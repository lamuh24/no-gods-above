const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks, frameAcrossWindow } = require('../dist/stage/attackFrameTracks');
const { attackStageFrameFor } = require('../dist/stage/fighterFrameSelector');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ENGINE_ROOT, '..', '..');
const LEGACY_HASH = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function start(state, input, moveId) {
  tick(state, { p1: input });
  assert.strictEqual(state.fighters.p1.currentAttack, moveId);
}

run('Down Light V3 uses the deliberate 36-tick one-hit contract', () => {
  const move = fighterDefinitions.lamuh_proto.attacks.special_down_light;
  assert.deepStrictEqual(
    { startup: move.startup, active: move.active, recovery: move.recovery },
    { startup: 14, active: 3, recovery: 19 }
  );
  assert.strictEqual(move.startup + move.active + move.recovery, 36);
  assert.strictEqual(move.hitboxes.length, 1);
  assert.strictEqual(move.hitboxes[0].id, 'stamped_shaft_check');
  assert.strictEqual(move.hitboxes[0].damage, 45);
  assert.strictEqual(move.hitboxes[0].level, 'low');
  assert.strictEqual(move.rootMotion, undefined);
});

run('Crossdraw V6 preserves the 64-tick low then mid two-contact contract', () => {
  const move = fighterDefinitions.lamuh_proto.attacks.special_down_medium;
  assert.deepStrictEqual(
    { startup: move.startup, active: move.active, recovery: move.recovery },
    { startup: 25, active: 18, recovery: 21 }
  );
  assert.strictEqual(move.startup + move.active + move.recovery, 64);
  assert.deepStrictEqual(move.hitboxes.map((hitbox) => hitbox.id), [
    'crossdraw_low_shot',
    'crossdraw_mid_shot'
  ]);
  assert.deepStrictEqual(move.hitboxes.map((hitbox) => hitbox.damage), [30, 42]);
  assert.deepStrictEqual(move.hitboxes.map((hitbox) => hitbox.level), ['low', 'mid']);
  assert.deepStrictEqual(move.hitboxes.map((hitbox) => [hitbox.start, hitbox.end]), [[25, 27], [40, 42]]);
  assert.strictEqual(move.rootMotion, undefined);
});

run('Down Light has sixteen cels and Crossdraw has twelve individually timed cels', () => {
  const light = attackFrameTracks.special_down_light;
  const medium = attackFrameTracks.special_down_medium;
  assert.deepStrictEqual([light.startup.length, light.active.length, light.recovery.length], [9, 1, 6]);
  assert.deepStrictEqual([medium.startup.length, medium.active.length, medium.recovery.length], [4, 4, 4]);
  const lightFrames = [...light.startup, ...light.active, ...light.recovery];
  const mediumFrames = [...medium.startup, ...medium.active, ...medium.recovery];
  assert.strictEqual(new Set(lightFrames).size, 16);
  assert.strictEqual(new Set(mediumFrames).size, 12);
  assert.ok(lightFrames.every((id, index) => id === `special_down_light_motion_${String(index + 1).padStart(2, '0')}`));
  assert.ok(mediumFrames.every((id, index) => id === `special_down_medium_motion_${String(index + 1).padStart(2, '0')}`));
});

run('U stays inert while both exact Down commands start their intended moves', () => {
  const inert = createMatch(3101);
  tick(inert, { p1: { special: true } });
  assert.strictEqual(inert.fighters.p1.currentAttack, null);
  start(createMatch(3102), { down: true, special: true, light: true }, 'special_down_light');
  start(createMatch(3103), { down: true, special: true, medium: true }, 'special_down_medium');
});

run('Down Medium registers exactly two hits without launch knockdown capture or side switch', () => {
  const state = createMatch(3104, { p1X: -70, p2X: 70 });
  start(state, { down: true, special: true, medium: true }, 'special_down_medium');
  for (let index = 0; index < 120; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.hitCountTaken, 2);
  assert.ok(state.fighters.p2.health < 940 && state.fighters.p2.health > 920);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p2.grounded, true);
  assert.strictEqual(state.throwInteraction, null);
  assert.ok(state.fighters.p1.x < state.fighters.p2.x);
});

run('Grounded Verdict Heavy remains the preserved 80-tick two-stage move', () => {
  const move = fighterDefinitions.lamuh_proto.attacks.special_down_heavy;
  assert.deepStrictEqual(
    { startup: move.startup, active: move.active, recovery: move.recovery },
    { startup: 28, active: 24, recovery: 28 }
  );
  assert.deepStrictEqual(move.hitboxes.map((hitbox) => hitbox.id), [
    'grounded_verdict_staff_plant',
    'grounded_verdict_contract_blast'
  ]);
});

run('all active cleaned frames and their separate alpha evidence exist', () => {
  const packages = [
    ['special-down-light-stamped-shaft-check-motion-v3', 'special_down_light_motion_', 16],
    ['special-down-medium-crossdraw-reprisal-v6', 'special_down_medium_motion_', 12]
  ];
  const spriteSource = fs.readFileSync(path.join(ENGINE_ROOT, 'src/stage/spriteSources.ts'), 'utf8');
  for (const [folder, prefix, count] of packages) {
    const frameRoot = path.join(
      REPO_ROOT,
      'tools/nga-forge/production/characters/swahili/reviews',
      folder,
      'runtime_frames_alpha_clean_v1'
    );
    const frames = fs.readdirSync(frameRoot).filter((name) => name.endsWith('.png'));
    assert.strictEqual(frames.length, count);
    for (let index = 1; index <= count; index++) {
      assert.ok(spriteSource.includes(`${prefix}${String(index).padStart(2, '0')}`));
    }
  }
  const alphaReport = JSON.parse(fs.readFileSync(path.join(
    REPO_ROOT,
    'tools/nga-forge/production/characters/swahili/reports/swahili-down-special-motion-runtime-alpha-cleanup-v1.json'
  ), 'utf8'));
  assert.strictEqual(alphaReport.frameCount, 32);
  assert.strictEqual(alphaReport.everyRuntimeFrameAtOrBelowIdleExteriorNeutralRatio, true);
  assert.strictEqual(alphaReport.blenderUsed, false);
  const currentAlpha = JSON.parse(fs.readFileSync(path.join(REPO_ROOT,
    'tools/nga-forge/production/characters/swahili/reviews/special-down-medium-crossdraw-reprisal-v6/alpha-cleanup.json'), 'utf8'));
  assert.strictEqual(currentAlpha.frameCount, 12);
  assert.strictEqual(currentAlpha.everyRuntimeFrameAtOrBelowIdleExteriorNeutralRatio, true);
  assert.strictEqual(currentAlpha.blenderUsed, false);
  assert.ok(!spriteSource.includes('special-down-medium-hook-ferrule-shove-motion-v4/'));
  assert.ok(!spriteSource.includes('special-down-medium-debt-spiral-motion-v5/'));
});

run('Crossdraw package and frame selector share every authored exposure and both flashes', () => {
  const packageRoot = path.join(
    REPO_ROOT,
    'tools/nga-forge/production/characters/swahili/reviews/special-down-medium-crossdraw-reprisal-v6'
  );
  const report = JSON.parse(fs.readFileSync(path.join(packageRoot, 'normalization.json'), 'utf8'));
  assert.strictEqual(report.candidateId, 'special-down-medium-crossdraw-reprisal-v6');
  assert.strictEqual(report.frameCount, 12);
  assert.strictEqual(report.blenderUsed, false);
  assert.deepStrictEqual(report.frames.filter((frame) => frame.contact).map((frame) => frame.index), [5, 8]);
  const fighter = createMatch(3105).fighters.p1;
  fighter.currentAttack = 'special_down_medium';
  const seen = [];
  for (let time = 0; time < 64; time++) {
    fighter.phase = 'attack';
    fighter.phaseTick = time;
    const frame = report.frames.find(frame => time >= frame.startTick && time < frame.startTick + frame.ticks);
    const actual = attackStageFrameFor(fighter);
    assert.strictEqual(actual, `special_down_medium_motion_${String(frame.index).padStart(2, '0')}`, `tick ${time}`);
    seen.push(actual);
  }
  assert.strictEqual(new Set(seen).size, 12);
  assert.strictEqual(seen[25], 'special_down_medium_motion_05');
  assert.strictEqual(seen[40], 'special_down_medium_motion_08');
  assert.throws(() => frameAcrossWindow(['special_down_medium_motion_01'], 0, 3, [2]), /cover their simulation phase/);
  assert.throws(() => frameAcrossWindow(['special_down_medium_motion_01'], 0, 3, [-3]), /cover their simulation phase/);
  assert.ok(fs.existsSync(path.join(packageRoot, 'runtime_alpha_clean_v1_dark_contact_sheet.png')));
  assert.ok(fs.existsSync(path.join(packageRoot, 'review.html')));
});

run('protected legacy game remains unchanged', () => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO_ROOT, 'NO_GODS_ABOVE/game.js'))).digest('hex').toUpperCase();
  assert.strictEqual(digest, LEGACY_HASH);
});
