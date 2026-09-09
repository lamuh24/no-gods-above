const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, executeReplay, recordReplay, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { attackFrameTracks } = require('../dist/stage/attackFrameTracks');
const { stageFrameFor } = require('../dist/stage/fighterFrameSelector');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const MOVE_ID = 'special_neutral_medium';

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

function stepUntil(state, predicate, maxTicks = 180) {
  for (let index = 0; index < maxTicks; index++) {
    if (predicate(state)) return state;
    tick(state, {});
  }
  assert.ok(predicate(state), `condition was not reached within ${maxTicks} ticks`);
  return state;
}

function startNeutralMedium(state, input) {
  tick(state, { p1: input || { special: true, medium: true } });
  assert.strictEqual(state.fighters.p1.currentAttack, MOVE_ID);
  return state;
}

run('candidate definition is a planted one-hit torso control strike', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  assert.strictEqual(definition.command, '5S+M');
  assert.deepStrictEqual(
    { startup: definition.startup, active: definition.active, recovery: definition.recovery },
    { startup: 9, active: 3, recovery: 13 }
  );
  assert.strictEqual(definition.startup + definition.active + definition.recovery, 25);
  assert.strictEqual(definition.rootMotion, undefined);
  assert.deepStrictEqual(definition.hitboxes[0], {
    id: 'neutral_control_strike', start: 9, end: 11, rect: { x: 40, y: -118, w: 120, h: 72 },
    damage: 65, hitstop: 6, hitstun: 16, blockstun: 11, knockbackX: 4.8, knockbackY: 0,
    maxHits: 1, level: 'mid', blockHitstop: 5
  });
  assert.strictEqual(definition.cancel, undefined);
});

run('neutral Special plus Medium starts without stealing directional specials or bare inputs', () => {
  startNeutralMedium(createMatch(2101));

  const mirrored = createMatch(2102, { p1X: 160, p2X: -160 });
  tick(mirrored, {});
  assert.strictEqual(mirrored.fighters.p1.facing, -1);
  startNeutralMedium(mirrored);

  const standingMedium = createMatch(2103);
  tick(standingMedium, { p1: { medium: true } });
  assert.strictEqual(standingMedium.fighters.p1.currentAttack, 'standing_medium');

  const unbound = createMatch(2104);
  tick(unbound, { p1: { special: true } });
  assert.strictEqual(unbound.fighters.p1.currentAttack, null);

  const downMedium = createMatch(2105);
  tick(downMedium, { p1: { down: true, special: true, medium: true } });
  assert.strictEqual(downMedium.fighters.p1.currentAttack, 'special_down_medium');

  const upMedium = createMatch(2106);
  tick(upMedium, { p1: { up: true, special: true, medium: true } });
  assert.strictEqual(upMedium.fighters.p1.currentAttack, 'special_up_medium');
});

run('five poses read as short draw one contact recoil and controlled remount', () => {
  const state = createMatch(2107);
  const fighter = state.fighters.p1;
  Object.assign(fighter, { phase: 'attack', currentAttack: MOVE_ID, attackFacing: 1, grounded: true });
  const track = attackFrameTracks[MOVE_ID];
  assert.deepStrictEqual([track.startup.length, track.active.length, track.recovery.length], [2, 1, 2]);
  const ordered = [...track.startup, ...track.active, ...track.recovery];
  assert.strictEqual(new Set(ordered).size, 5);
  assert.ok(ordered.every((sourceId) => !sourceId.includes('command_grab')));
  const samples = [0, 5, 9, 12, 19].map((phaseTick) => {
    fighter.phaseTick = phaseTick;
    return stageFrameFor(fighter, state);
  });
  assert.deepStrictEqual(samples, ordered);
  assert.strictEqual(samples[2], 'special_neutral_medium_control_strike_contact');
  assert.strictEqual(samples[3], 'special_neutral_medium_follow_through_recoil');
  assert.strictEqual(samples.at(-1), 'special_neutral_medium_recovery_remount_start');
});

run('one control strike registers one 65-damage grounded hit with separate impact and stun', () => {
  const state = createMatch(2108);
  startNeutralMedium(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  assert.strictEqual(state.fighters.p2.health, 935);
  assert.strictEqual(state.fighters.p1.hitstop, 6);
  assert.strictEqual(state.fighters.p2.hitstop, 6);
  assert.strictEqual(state.lastCombatEvent.baseHitstun, 16);
  assert.strictEqual(state.lastCombatEvent.effectiveHitstun, 16);
  assert.strictEqual(state.fighters.p2.knockdownKind, 'none');
  assert.strictEqual(state.fighters.p2.grounded, true);
  for (let index = 0; index < 60; index++) tick(state, {});
  assert.strictEqual(state.fighters.p2.health, 935);
  assert.strictEqual(state.fighters.p2.hitCountTaken, 1);
});

run('the mid strike uses five-tick block freeze against standing and crouching guard', () => {
  for (const [seed, mode] of [[2109, 'stand_block'], [2110, 'crouch_block']]) {
    const state = createMatch(seed);
    state.fighters.p2.dummyMode = mode;
    startNeutralMedium(state);
    stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'block');
    assert.strictEqual(state.fighters.p2.health, 1000);
    assert.strictEqual(state.fighters.p1.hitstop, 5);
    assert.strictEqual(state.fighters.p2.hitstop, 5);
    assert.strictEqual(state.fighters.p2.blockstun, 11);
  }
});

run('torso lane misses a clearly elevated target and never moves Swahili', () => {
  const state = createMatch(2111);
  const startX = state.fighters.p1.x;
  startNeutralMedium(state);
  for (let index = 0; index < 50; index++) {
    Object.assign(state.fighters.p2, { y: -150, grounded: false, phase: 'jump', vy: 0 });
    tick(state, {});
  }
  assert.strictEqual(state.fighters.p1.x, startX);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.notStrictEqual(state.lastCombatEvent?.attackId, MOVE_ID);
});

run('control-strike role stays between Standing Medium and the complete two-hit Down Medium without capture reward', () => {
  const definition = fighterDefinitions.lamuh_proto.attacks[MOVE_ID];
  const standingMedium = fighterDefinitions.lamuh_proto.attacks.standing_medium;
  const downMedium = fighterDefinitions.lamuh_proto.attacks.special_down_medium;
  assert.ok(definition.startup > standingMedium.startup);
  assert.ok(definition.recovery > standingMedium.recovery);
  assert.ok(definition.hitboxes[0].rect.w > standingMedium.hitboxes[0].rect.w);
  assert.ok(definition.hitboxes[0].damage > standingMedium.hitboxes[0].damage);
  assert.ok(definition.startup < downMedium.startup);
  assert.ok(definition.recovery < downMedium.recovery);
  assert.ok(definition.hitboxes[0].rect.w < downMedium.hitboxes[0].rect.w);
  const downMediumTotalDamage = downMedium.hitboxes.reduce((sum, hitbox) => sum + hitbox.damage * hitbox.maxHits, 0);
  assert.ok(definition.hitboxes[0].damage < downMediumTotalDamage, 'Compare the one-hit strike with both authored Down Medium contacts');
  assert.strictEqual(definition.hitboxes[0].launches, undefined);
  assert.strictEqual(definition.hitboxes[0].knockdown, undefined);
});

run('repeating the strike leaves a real defender recovery gap before second contact', () => {
  const state = createMatch(2112);
  startNeutralMedium(state);
  stepUntil(state, (current) => current.lastCombatEvent?.attackId === MOVE_ID && current.lastCombatEvent.outcome === 'hit');
  stepUntil(state, (current) => current.fighters.p1.phase === 'idle');
  startNeutralMedium(state);
  let defenderRecoveredDuringStartup = false;
  while (state.fighters.p1.currentAttack === MOVE_ID && state.fighters.p1.phaseTick < 9) {
    if (state.fighters.p2.hitstun === 0) defenderRecoveredDuringStartup = true;
    tick(state, {});
  }
  assert.strictEqual(defenderRecoveredDuringStartup, true);
});

run('whiff has no capture side switch rotation shot cancel or hidden root travel', () => {
  const state = createMatch(2113, { p1X: -300, p2X: 300 });
  const p1Start = state.fighters.p1.x;
  const p2Start = state.fighters.p2.x;
  startNeutralMedium(state);
  for (let index = 0; index < 50; index++) tick(state, {});
  assert.strictEqual(state.fighters.p1.x, p1Start);
  assert.strictEqual(state.fighters.p2.x, p2Start);
  assert.strictEqual(state.fighters.p2.health, 1000);
  assert.strictEqual(state.throwInteraction, null);
  assert.strictEqual(state.lastThrowEvent, null);
  assert.strictEqual(state.fighters.p1.throwRotation, 0);
  assert.strictEqual(state.fighters.p2.throwRotation, 0);
  assert.deepStrictEqual(state.fighters.p1.cancelOptions, []);
  assert.strictEqual(state.fighters.p1.phase, 'idle');
});

run('rollback replay remains deterministic for the neutral Medium chord', () => {
  const state = createMatch(2114);
  for (let index = 0; index < 90; index++) {
    tick(state, index === 0 ? { p1: { special: true, medium: true } } : {});
  }
  const replay = recordReplay(state);
  const reproduced = executeReplay(replay);
  assert.deepStrictEqual(reproduced.checksums, state.checksums);
  assert.strictEqual(reproduced.checksums.at(-1), replay.finalChecksum);
});

run('candidate gate and protected legacy runtime remain intact', () => {
  const statusPath = path.join(
    __dirname, '..', '..', '..', 'tools', 'nga-forge', 'production', 'characters', 'swahili',
    'status', 'special-neutral-medium-control-strike-v2.status.json'
  );
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  assert.strictEqual(status.candidateOnly, true);
  assert.strictEqual(status.deployable, false);
  assert.strictEqual(status.motionApproved, false);
  assert.strictEqual(status.runtimeIntegrated, true);
  assert.strictEqual(status.runtimeScope, 'local Engine V2 debug playtest only');
  assert.strictEqual(status.gate, 'awaiting_human_special_neutral_medium_control_strike_gameplay_review');
  const bytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);
});

console.log('Swahili Neutral Medium Control Strike V2 tests passed: input separation, 25-tick five-pose presentation, one-hit mid control, guard, torso-lane whiff, family separation, anti-loop gap, replay, and release gate.');
