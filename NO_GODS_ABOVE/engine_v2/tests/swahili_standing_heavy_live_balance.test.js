const assert = require('assert');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const config = require('../dist/sandbox/sandboxConfig');
const profileModule = require('../dist/sandbox/standingHeavyCombatProfile');

const profile = profileModule.SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1;

function run(name, test) { test(); console.log(`PASS ${name}`); }
function step(state, input = {}, ticks = 1) {
  for (let index = 0; index < ticks; index++) sim.tickSwahiliSandbox(state, index === 0 ? input : { ...input, command: undefined });
  return state;
}

function contactAt(contactTick, { block = 'off', counter = false } = {}) {
  const state = sim.createSwahiliSandbox();
  state.dummyBlockMode = block;
  state.counterHitArmed = counter;
  if (contactTick > 24) state.fighters.p2.x = 300;
  step(state, { heavy: true });
  if (contactTick > 24) {
    while (state.fighters.p1.moveCursor < contactTick) step(state);
    state.fighters.p2.x = state.fighters.p1.x + state.fighters.p1.facing * 190;
  }
  while (!['hit', 'counter_hit', 'block'].includes(state.lastEvent?.outcome) && state.tick < 100) step(state);
  return state;
}

function actualAdvantage(contactTick, options) {
  const state = contactAt(contactTick, options);
  let attackerActionable = null;
  let defenderActionable = null;
  while ((attackerActionable === null || defenderActionable === null) && state.tick < 180) {
    if (attackerActionable === null && state.fighters.p1.state === 'idle') attackerActionable = state.tick;
    if (defenderActionable === null && state.fighters.p2.hitstun === 0 && state.fighters.p2.blockstun === 0) defenderActionable = state.tick;
    if (attackerActionable === null || defenderActionable === null) step(state);
  }
  return { value: defenderActionable - attackerActionable, attackerActionable, defenderActionable, state };
}

function rangeResult(rootSeparation, crouching = false) {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = -100;
  state.fighters.p2.x = -100 + rootSeparation;
  state.dummyCrouching = crouching;
  step(state, { heavy: true });
  while (state.fighters.p1.moveCursor !== null && state.fighters.p1.moveCursor <= profile.active.end) step(state);
  return state.lastCombatDiagnostic?.outcome ?? 'whiff';
}

run('approved profile is the authoritative V1 sandbox baseline', () => {
  assert.strictEqual(profile.id, 'SWAHILI_STANDING_HEAVY_COMBAT_PROFILE_V1');
  assert.strictEqual(profile.approval, 'APPROVED_RECOMMENDED_PROFILE');
  assert.strictEqual(profile.authority, 'authoritative_v1_balance_baseline');
  assert.strictEqual(profile.candidateOnly, true);
  assert.strictEqual(profile.deployable, false);
  assert.strictEqual(profile.productionRoster, false);
  assert.strictEqual(config.SANDBOX_TUNING.standingHeavy, profile);
  assert.deepStrictEqual(profile.startup, { start: 0, end: 23 });
  assert.deepStrictEqual(profile.active, { start: 24, end: 28 });
  assert.deepStrictEqual(profile.recovery, { start: 29, end: 74 });
  assert.strictEqual(profile.returnToIdleTick, 75);
  assert.deepStrictEqual(profile.hitstop, { hit: 8, block: 5, whiff: 0 });
  assert.deepStrictEqual(profile.hitbox, { x: 44, y: -92, w: 108, h: 50 });
  assert.strictEqual(profile.projectile, false);
  assert.deepStrictEqual(profile.cancelWindows, []);
  assert.deepStrictEqual(profile.armor, []);
  assert.deepStrictEqual(profile.invulnerability, []);
  assert.strictEqual(profile.rootMotion, false);
});

run('actual first- and last-active normal-hit advantage is +5 and +9', () => {
  assert.strictEqual(actualAdvantage(24).value, 5);
  assert.strictEqual(actualAdvantage(28).value, 9);
});

run('actual first- and last-active block advantage is -31 and -27', () => {
  assert.strictEqual(actualAdvantage(24, { block: 'standing' }).value, -31);
  assert.strictEqual(actualAdvantage(28, { block: 'standing' }).value, -27);
});

run('actual first- and last-active counter-hit advantage is +13 and +17', () => {
  assert.strictEqual(actualAdvantage(24, { counter: true }).value, 13);
  assert.strictEqual(actualAdvantage(28, { counter: true }).value, 17);
});

run('normal hit, counter hit, block, and whiff apply approved resources', () => {
  const hit = contactAt(24);
  assert.strictEqual(hit.fighters.p2.health, 880);
  assert.strictEqual(hit.fighters.p1.meter, 12);
  assert.strictEqual(hit.fighters.p1.damageScaling, 0.92);
  assert.strictEqual(hit.lastCombatDiagnostic.damageApplied, 120);
  assert.strictEqual(hit.lastCombatDiagnostic.pushbackPerTick, 2.3);

  const counter = contactAt(24, { counter: true });
  assert.strictEqual(counter.fighters.p2.health, 862);
  assert.strictEqual(counter.lastCombatDiagnostic.hitstun, 64);
  assert.strictEqual(counter.lastCombatDiagnostic.outcome, 'counter_hit');

  const blocked = contactAt(24, { block: 'crouching' });
  assert.strictEqual(blocked.fighters.p2.health, 1000);
  assert.strictEqual(blocked.fighters.p1.meter, 4);
  assert.strictEqual(blocked.lastCombatDiagnostic.blockstun, 20);
  assert.strictEqual(blocked.lastCombatDiagnostic.pushbackPerTick, 0.575);

  const whiff = sim.createSwahiliSandbox();
  whiff.fighters.p2.x = 300;
  step(whiff, { heavy: true });
  while (whiff.fighters.p1.state !== 'idle') step(whiff);
  assert.strictEqual(whiff.lastCombatDiagnostic.outcome, 'whiff');
  assert.strictEqual(whiff.fighters.p1.meter, 0);
});

run('strict range remains point-blank and mirrors losslessly', () => {
  assert.strictEqual(rangeResult(199.999), 'hit');
  assert.strictEqual(rangeResult(200.001), 'whiff');
  assert.strictEqual(rangeResult(195.999, true), 'hit');
  assert.strictEqual(rangeResult(196.001, true), 'whiff');
  assert.strictEqual(rangeResult(240), 'whiff');

  const authored = contactAt(24);
  const mirrored = sim.createSwahiliSandbox();
  mirrored.fighters.p1.x = 76;
  mirrored.fighters.p2.x = -76;
  step(mirrored, { heavy: true });
  while (mirrored.lastEvent?.outcome !== 'hit') step(mirrored);
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  assert.strictEqual(mirrored.lastCombatDiagnostic.damageApplied, authored.lastCombatDiagnostic.damageApplied);
  assert.strictEqual(mirrored.lastCombatDiagnostic.rootSeparation, authored.lastCombatDiagnostic.rootSeparation);
});

run('attack-arm hurtbox exists only on approved active extension ticks', () => {
  const state = sim.createSwahiliSandbox();
  const fighter = state.fighters.p1;
  fighter.state = 'standing_heavy';
  for (const tick of [22, 23, 29, 30, 35]) {
    fighter.moveCursor = tick;
    assert.strictEqual(sim.fighterHurtboxes(fighter).length, 3, `attack-arm hurtbox leaked onto tick ${tick}`);
  }
  for (const tick of [24, 25, 26, 27, 28]) {
    fighter.moveCursor = tick;
    assert.strictEqual(sim.fighterHurtboxes(fighter).length, 4, `attack-arm hurtbox missing on active tick ${tick}`);
  }
});

run('corner, side switch, repeated use, and scaling reset stay deterministic', () => {
  const corner = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(corner, 'heavy_corner_hit');
  assert.strictEqual(corner.lastEvent.outcome, 'hit');
  assert.ok(corner.fighters.p1.x >= corner.stage.left);
  assert.ok(corner.fighters.p2.x <= corner.stage.right);

  const switched = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(switched, 'heavy_side_switch');
  assert.strictEqual(switched.lastEvent.outcome, 'hit');
  assert.strictEqual(switched.fighters.p1.facing, -1);

  const repeated = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(repeated, 'heavy_repeated_use');
  assert.strictEqual(repeated.fighters.p2.health, 760);
  assert.strictEqual(repeated.fighters.p1.meter, 24);
  assert.strictEqual(repeated.lastCombatDiagnostic.scalingBefore, 1);
});

run('rollback replay reproduces combat diagnostic and checksum', () => {
  const state = sim.createSwahiliSandbox(991);
  step(state, { heavy: true });
  while (state.fighters.p1.moveCursor < 23) step(state);
  const checkpoint = JSON.parse(JSON.stringify(state));
  step(state, {}, 48);
  const expectedChecksum = sim.sandboxChecksum(state);
  const expectedDiagnostic = JSON.stringify(state.lastCombatDiagnostic);
  const replay = JSON.parse(JSON.stringify(checkpoint));
  step(replay, {}, 48);
  assert.strictEqual(sim.sandboxChecksum(replay), expectedChecksum);
  assert.strictEqual(JSON.stringify(replay.lastCombatDiagnostic), expectedDiagnostic);
});

run('diagnostics expose approved sockets, geometry, meter, scaling, and punish windows', () => {
  const blocked = contactAt(24, { block: 'standing' });
  assert.deepStrictEqual(blocked.lastCombatDiagnostic.hitbox, { x: -32, y: -92, w: 108, h: 50 });
  assert.strictEqual(blocked.lastCombatDiagnostic.defenderHurtboxes.length, 3);
  assert.ok(blocked.lastCombatDiagnostic.presentationEvents.includes('left_muzzle'));
  assert.ok(blocked.lastCombatDiagnostic.presentationEvents.includes('right_muzzle'));
  assert.ok(blocked.lastCombatDiagnostic.presentationEvents.includes('impact_origin'));
  assert.strictEqual(blocked.lastCombatDiagnostic.resultingAdvantage, -31);
  assert.strictEqual(blocked.lastCombatDiagnostic.meterGain, 4);

  const whiffPunish = sim.createSwahiliSandbox();
  sim.setupSandboxScenario(whiffPunish, 'heavy_punish_after_whiff');
  assert.strictEqual(whiffPunish.fighters.p1.moveCursor, 29);
  assert.strictEqual(profile.returnToIdleTick - whiffPunish.fighters.p1.moveCursor, 46);
});

console.log('Swahili Standing Heavy live-balance tests passed: approved V1 profile, actual advantage, strict range, resource state, mirrored geometry, and rollback replay.');
