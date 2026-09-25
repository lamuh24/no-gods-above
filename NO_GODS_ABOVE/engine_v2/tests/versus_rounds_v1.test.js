// Versus Rounds v1: opt-in match rules, round flow, and the competitive CPU.
//
// Pins the contracts the Rounds mode depends on:
//   1. Every rule is opt-in: a match without versusRules carries none of the new state.
//   2. Pushback decays, corners push the attacker back, walls bounce juggles once.
//   3. Knockouts stay down; throws keep authored reach against wider versus bodies.
//   4. Presses made during hitstop are honoured once it ends.
//   5. The round director resolves KO, time-over, draws and match end.
//   6. The CPU plays deterministically through real inputs, and every kit route connects.

const assert = require('assert');
const { createMatch, tick, fighterPushbox } = require('../dist');
const { ROSTER } = require('../dist/versus/roster');
const { ROUNDS_RULES, TRAINING_RULES } = require('../dist/versus/matchRules');
const { RoundDirector } = require('../dist/versus/roundDirector');
const { CpuBrain } = require('../dist/versus/cpu/cpuBrain');
const { CPU_KITS } = require('../dist/versus/cpu/cpuKits');

function versus(p1 = 'lamuh', p2 = 'swahili', { rules = ROUNDS_RULES, p1X = -43, p2X = 43, seed = 5150 } = {}) {
  return createMatch(seed, {
    matchId: `rounds-${seed}`, p1Kind: ROSTER[p1].kind, p2Kind: ROSTER[p2].kind, p1X, p2X, swahiliAirSpecialsV1: true,
    p1BodyEnvelope: ROSTER[p1].envelope, p2BodyEnvelope: ROSTER[p2].envelope, ...(rules ? { versusRules: rules } : {})
  });
}
const run = (state, frames, input = () => ({})) => { for (let i = 0; i < frames; i++) tick(state, input(i)); return state; };
const gap = (state) => Math.abs(state.fighters.p1.x - state.fighters.p2.x);

// --- 1. opt-in: no rules, no new state ---------------------------------------
{
  const plain = versus('lamuh', 'swahili', { rules: null });
  run(plain, 90, (i) => (i === 0 ? { p1: { medium: true } } : {}));
  assert.strictEqual(plain.matchConfig.versusRules, undefined, 'a match without rules must not record any');
  for (const side of ['p1', 'p2']) {
    for (const key of ['pushback', 'wallBounced', 'knockedOut', 'bufferedHitstop']) {
      assert.ok(!(key in plain.fighters[side]), `${side}.${key} must stay absent without versus rules`);
    }
  }
  assert.strictEqual(plain.lastWallBounce, undefined);
}

// --- 2a. pushback decays ------------------------------------------------------
{
  const slide = (rules) => {
    const state = versus('lamuh', 'swahili', { rules });
    const before = state.fighters.p2.x;
    run(state, 60, (i) => (i === 0 ? { p1: { medium: true } } : {}));
    return state.fighters.p2.x - before;
  };
  const legacy = slide(null), decayed = slide(ROUNDS_RULES);
  assert.ok(legacy > 70, `legacy grounded pushback slides for the whole reaction (${legacy.toFixed(1)})`);
  assert.ok(decayed > 10 && decayed < 40, `versus pushback decays to a readable distance (${decayed.toFixed(1)})`);
}

// --- 2b. corner pushback returns to the attacker ------------------------------
{
  const state = versus('lamuh', 'swahili', { p1X: 330, p2X: 418 });
  const attackerBefore = state.fighters.p1.x;
  run(state, 50, (i) => (i === 0 ? { p1: { medium: true } } : {}));
  assert.ok(state.lastCombatEvent && state.lastCombatEvent.outcome === 'hit', 'the corner hit must land');
  assert.ok(state.fighters.p1.x < attackerBefore - 5, `a wall-pinned defender pushes the attacker back (${(attackerBefore - state.fighters.p1.x).toFixed(1)})`);
  assert.ok(state.fighters.p2.x <= state.stage.right, 'the defender stays inside the wall');
}

// --- 2c. wall bounce: once per combo, still in hitstun ------------------------
{
  const state = versus('lamuh', 'swahili', { p1X: 300, p2X: 390 });
  const d = state.fighters.p2;
  // Test setup only: an airborne juggled body already travelling into the right wall.
  d.grounded = false; d.y = -80; d.vy = -2; d.vx = 9; d.hitstun = 20; d.phase = 'hit_reaction';
  let bounces = 0;
  for (let i = 0; i < 40 && !d.grounded; i++) {
    tick(state, {});
    if (state.lastWallBounce && state.lastWallBounce.tick === state.tick - 1) {
      bounces++;
      if (bounces === 1) {
        assert.ok(d.vx < 0, 'the bounce sends the body back into play');
        assert.ok(d.hitstun > 0, 'a bounced body stays in hitstun for the follow-up');
        d.vx = 9; // drive it straight back into the wall: a second bounce is not allowed
      }
    }
  }
  assert.strictEqual(bounces, 1, 'exactly one wall bounce per combo');
}

// --- 3a. knockout stays down --------------------------------------------------
{
  const state = versus('lamuh', 'swahili');
  state.fighters.p2.health = 10;
  run(state, 30, (i) => (i === 0 ? { p1: { medium: true } } : {}));
  const d = state.fighters.p2;
  assert.strictEqual(d.health, 0);
  assert.strictEqual(d.knockedOut, true, 'a lethal hit knocks out');
  const hitsTaken = d.hitCountTaken;
  run(state, 400, (i) => ({ p1: i % 6 === 0 ? { down: true, light: true } : {}, p2: { up: true, heavy: true } }));
  assert.ok(d.grounded && d.phase === 'knockdown', `the knocked-out body stays down (${d.phase})`);
  assert.strictEqual(d.hitCountTaken, hitsTaken, 'no further hits land on a knocked-out body');
}

// --- 3b. throws keep authored reach from body contact -------------------------
{
  for (const [a, b] of [['lamuh', 'swahili'], ['swahili', 'lamuh'], ['lamuh', 'lamuh']]) {
    const state = versus(a, b, { p1X: -20, p2X: 20 });
    run(state, 2);
    const contact = (fighterPushbox(state.fighters.p1).w + fighterPushbox(state.fighters.p2).w) / 2;
    assert.ok(gap(state) >= contact - 0.01, `${a} vs ${b} bodies rest at the versus spacing`);
    let connected = false;
    run(state, 60, (i) => (i === 0 ? { p1: { throw: true } } : {}));
    connected = !!state.lastThrowEvent && ['connect', 'release', 'complete'].includes(state.lastThrowEvent.type);
    assert.ok(connected, `${a} forward throw must connect at point-blank versus spacing`);
    run(state, 120);
  }
}

// --- 3c. Heaven Splitter still connects point-blank in every pairing ----------
{
  for (const defender of ['lamuh', 'swahili']) {
    const state = versus('lamuh', defender, { p1X: -10, p2X: 10 });
    run(state, 2);
    run(state, 30, (i) => (i === 0 ? { p1: { up: true, special: true, light: true } } : {}));
    assert.ok(state.fighters.p1.comboCount >= 1 || (state.lastCombatEvent && state.lastCombatEvent.attackId === 'legacy_heaven_splitter_light'),
      `Heaven Splitter Light must connect at point-blank range against ${defender}`);
  }
}

// --- 4. presses during hitstop are buffered -----------------------------------
{
  const jumpCancelAt = (rules, delay) => {
    const state = versus('swahili', 'lamuh', { rules });
    let contact = -1, jumped = false;
    tick(state, { p1: { down: true, heavy: true } });
    for (let i = 0; i < 50; i++) {
      const input = contact >= 0 && state.tick === contact + delay ? { up: true } : contact >= 0 && state.tick > contact + delay ? {} : { down: true };
      tick(state, { p1: input });
      if (contact < 0 && state.fighters.p1.comboCount >= 1) contact = state.tick - 1;
      if (contact >= 0 && !state.fighters.p1.grounded) jumped = true;
    }
    return jumped;
  };
  assert.strictEqual(jumpCancelAt(null, 1), false, 'without the rule an early hitstop press is dropped (documents the old behaviour)');
  for (const delay of [1, 2, 3, 6]) assert.strictEqual(jumpCancelAt(ROUNDS_RULES, delay), true, `a jump cancel pressed ${delay} tick(s) into hitstop must come out`);
}

// --- 4b. counter hits reward every character in versus ------------------------
{
  // Swahili 5M lands during Lamuh's 5H startup: a committed defender.
  const counterFor = (rules) => {
    const state = versus('swahili', 'lamuh', { rules, p1X: -43, p2X: 43 });
    let counter = null;
    for (let i = 0; i < 40; i++) {
      tick(state, { p1: i === 6 ? { medium: true } : {}, p2: i === 4 ? { heavy: true } : {} });
      const e = state.lastCombatEvent;
      if (counter === null && e && e.tick === state.tick - 1 && e.attacker === 'p1' && e.outcome === 'hit') counter = !!e.counterHit;
    }
    return counter;
  };
  assert.strictEqual(counterFor(null), false, 'without versus rules only Lamuh Legacy earns counter hits');
  assert.strictEqual(counterFor(ROUNDS_RULES), true, 'under versus rules a Swahili strike into a committed Lamuh counter-hits');
}

// --- 5. round director --------------------------------------------------------
{
  const names = { p1: 'LAMUH', p2: 'SWAHILI' };
  const fake = () => ({ tick: 0, fighters: { p1: { health: 1000, grounded: true }, p2: { health: 1000, grounded: true } } });
  const director = new RoundDirector({ roundsToWin: 2, roundSeconds: 99 }, names);
  const state = fake();
  assert.strictEqual(director.inputsLocked, true, 'the intro locks input');
  while (director.phase === 'intro') director.afterTick(state);
  assert.strictEqual(director.inputsLocked, false);
  state.fighters.p2.knockedOut = true; state.fighters.p2.health = 0; state.fighters.p1.health = 1000;
  director.afterTick(state);
  assert.strictEqual(director.phase, 'ko');
  assert.strictEqual(director.lastRound.method, 'perfect');
  assert.ok(director.timeScale < 1, 'a knockout plays in slow motion');
  let guard = 0;
  while (!director.pendingReset && guard++ < 1000) director.afterTick(state);
  assert.strictEqual(director.round, 2, 'the next round starts after the outro');
  assert.deepStrictEqual(director.wins, { p1: 1, p2: 0 });
  director.pendingReset = false;
  const round2 = fake();
  while (director.phase === 'intro') director.afterTick(round2);
  round2.fighters.p1.health = 400; round2.fighters.p2.health = 700;
  for (let i = 0; i < 99 * 60 + 5 && director.phase === 'fight'; i++) director.afterTick(round2);
  assert.strictEqual(director.phase, 'time');
  assert.strictEqual(director.lastRound.winner, 'p2', 'time over awards the healthier fighter');
  guard = 0;
  while (!director.pendingReset && guard++ < 1000) director.afterTick(round2);
  director.pendingReset = false;
  const round3 = fake();
  while (director.phase === 'intro') director.afterTick(round3);
  assert.strictEqual(director.finalRound, true);
  round3.fighters.p1.knockedOut = true; round3.fighters.p2.knockedOut = true;
  director.afterTick(round3);
  assert.strictEqual(director.lastRound.method, 'double_ko');
  assert.deepStrictEqual(director.wins, { p1: 1, p2: 1 }, 'a double KO on match point awards nobody');
}

// --- 6a. CPU routes connect through the real engine ---------------------------
{
  const dir = (d = '') => ({ ...(d.includes('F') ? { right: true } : {}), ...(d.includes('B') ? { left: true } : {}), ...(d.includes('U') ? { up: true } : {}), ...(d.includes('D') ? { down: true } : {}) });
  for (const attacker of ['lamuh', 'swahili']) for (const defender of ['lamuh', 'swahili']) for (const route of CPU_KITS[attacker].routes) {
    if (route.role === 'anti_air' || route.role === 'jump_in') continue;
    const state = versus(attacker, defender, { p1X: -30, p2X: 30 });
    if (route.requiresMeter) state.fighters.p1.tension = 100;
    run(state, 2);
    let peak = 0;
    for (const step of route.steps) {
      const before = state.fighters.p1.currentMoveInstance;
      let started = false;
      for (let t = 0; t < 60 && !started; t++) {
        if (step.jump) { tick(state, { p1: t % 3 === 0 ? { up: true, right: true } : { right: true } }); started = state.fighters.p1.phase === 'jump'; continue; }
        tick(state, { p1: t % 3 === 0 ? { ...dir(step.dir), ...Object.fromEntries(step.buttons.map((b) => [b, true])) } : {} });
        started = !!state.ultimateInteraction || (state.fighters.p1.currentAttack === step.attack && state.fighters.p1.currentMoveInstance !== before);
      }
      assert.ok(started, `${attacker} vs ${defender} ${route.id}: ${step.jump ? 'jump cancel' : step.attack} must start`);
      for (let t = 0; t < 60 && !step.jump && !state.fighters.p1.attackConnected && !state.ultimateInteraction; t++) { tick(state, {}); peak = Math.max(peak, state.fighters.p1.comboCount); }
      peak = Math.max(peak, state.fighters.p1.comboCount);
    }
    for (let t = 0; t < 320; t++) { tick(state, {}); peak = Math.max(peak, state.fighters.p1.comboCount); }
    const links = route.steps.filter((s) => !s.jump).length;
    assert.ok(peak >= links, `${attacker} vs ${defender} ${route.id} must land every link (${peak}/${links})`);
  }
}

// --- 6b. CPU vs CPU is deterministic and actually fights ----------------------
{
  const match = (seed) => {
    const state = versus('lamuh', 'swahili', { p1X: -110, p2X: 110, seed });
    const brains = { p1: new CpuBrain('p1', 'lamuh', 'hard', seed * 7 + 1), p2: new CpuBrain('p2', 'swahili', 'hard', seed * 13 + 5) };
    const hits = { p1: 0, p2: 0 };
    let t = 0;
    for (; t < 99 * 60; t++) {
      tick(state, { p1: brains.p1.input(state), p2: brains.p2.input(state) });
      const e = state.lastCombatEvent;
      if (e && e.tick === state.tick - 1 && e.outcome === 'hit') hits[e.attacker]++;
      if (state.fighters.p1.knockedOut || state.fighters.p2.knockedOut) break;
    }
    return { checksum: state.checksums[state.checksums.length - 1], ticks: t, hits, ko: !!(state.fighters.p1.knockedOut || state.fighters.p2.knockedOut) };
  };
  const first = match(31), again = match(31);
  assert.strictEqual(first.checksum, again.checksum, 'the same seed must replay the same CPU match');
  assert.ok(first.ko, 'a hard CPU vs CPU round ends in a knockout inside the timer');
  assert.ok(first.hits.p1 >= 5 && first.hits.p2 >= 3, `both CPUs must land real offense (${JSON.stringify(first.hits)})`);
}

// --- training keeps its rules without knockouts --------------------------------
{
  const state = versus('lamuh', 'swahili', { rules: TRAINING_RULES });
  state.fighters.p2.health = 5;
  run(state, 30, (i) => (i === 0 ? { p1: { medium: true } } : {}));
  assert.ok(!state.fighters.p2.knockedOut, 'training never knocks a fighter out');
}

console.log('versus rounds v1: all checks passed');

// --- 7. Lamuh launchers open a jump-cancel chase (versus rules only) -----------
{
  const chase = (rules, launcher, openers = []) => {
    const state = versus('lamuh', 'swahili', { rules, p1X: -30, p2X: 30 });
    const a = state.fighters.p1;
    run(state, 2);
    for (const opener of openers) {
      const inst = a.currentMoveInstance;
      for (let t = 0; t < 30 && !(a.currentMoveInstance !== inst && a.attackConnected); t++) tick(state, { p1: t % 3 === 0 ? opener : {} });
    }
    const inst = a.currentMoveInstance;
    for (let t = 0; t < 30 && a.currentMoveInstance === inst; t++) tick(state, { p1: t % 3 === 0 ? launcher : {} });
    let launched = false;
    for (let t = 0; t < 40 && !launched; t++) { tick(state, {}); launched = a.attackConnected && !state.fighters.p2.grounded; }
    let jumped = false;
    // Counts only a jump that interrupts the launcher, not an ordinary jump after its recovery ends.
    for (let t = 0; t < 40 && !jumped && a.phase === 'attack'; t++) { tick(state, { p1: t % 2 === 0 ? { up: true, right: true } : { right: true } }); jumped = a.phase === 'jump' || a.phase === 'jump_startup'; }
    return { launched, jumped, hits: a.comboCount };
  };
  const splitters = { light: { up: true, special: true, light: true }, medium: { up: true, special: true, medium: true }, heavy: { up: true, special: true, heavy: true } };
  for (const [strength, input] of Object.entries(splitters)) {
    const withRules = chase(ROUNDS_RULES, input);
    assert.ok(withRules.launched && withRules.jumped, `Heaven Splitter ${strength} must jump-cancel after it launches`);
    assert.strictEqual(chase(null, input).jumped, false, `without versus rules Heaven Splitter ${strength} keeps its authored full recovery`);
  }
  // A light normal that hit pushes the victim beyond the uppercut's ~60u reach; the step-in closes it.
  const cancelled = chase(ROUNDS_RULES, splitters.light, [{ down: true, light: true }]);
  assert.ok(cancelled.launched && cancelled.hits >= 2, `2L > Heaven Splitter Light must link on hit (${cancelled.hits} hits)`);
  const plain = versus('lamuh', 'swahili', { rules: null, p1X: -30, p2X: 30 });
  run(plain, 2);
  run(plain, 60, (i) => ({ p1: i === 0 ? { down: true, light: true } : i === 9 ? { up: true, special: true, light: true } : {} }));
  assert.ok(!('comboApproach' in plain.fighters.p1) && !('launcherFollowUp' in plain.fighters.p1), 'no follow-up state without versus rules');
}
console.log('versus rounds v1: launcher follow-ups passed');

// --- 8. Radiant Dive Medium extends an air combo once --------------------------
{
  const press = (state, frame, until, max = 45) => { for (let t = 0; t < max; t++) { tick(state, { p1: t % 3 === 0 ? frame : { right: true } }); if (until()) return true; } return false; };
  const extend = (rules) => {
    const state = versus('lamuh', 'swahili', { rules, p1X: -30, p2X: 30 });
    const a = state.fighters.p1, hit = (inst) => () => a.currentMoveInstance !== inst && a.attackConnected;
    run(state, 2);
    for (const frame of [{ down: true, light: true }, { down: true, medium: true }, { down: true, heavy: true }]) press(state, frame, hit(a.currentMoveInstance));
    press(state, { up: true, right: true }, () => a.phase === 'jump' || a.phase === 'jump_startup');
    press(state, { medium: true }, hit(a.currentMoveInstance));
    press(state, { special: true, medium: true }, hit(a.currentMoveInstance));
    let rebounded = false;
    for (let t = 0; t < 20 && !rebounded && !a.grounded; t++) { tick(state, { p1: { right: true } }); rebounded = a.phase === 'jump'; }
    return { state, a, rebounded };
  };
  const withRules = extend(ROUNDS_RULES);
  assert.ok(withRules.rebounded, 'Radiant Dive Medium hitting an airborne victim rebounds Lamuh into a jump');
  assert.ok(!withRules.state.fighters.p2.grounded && withRules.state.fighters.p2.hitstun > 0, 'the victim stays juggled after the extender');
  assert.strictEqual(withRules.a.airExtenderUsed, true);
  const before = withRules.a.comboCount;
  press(withRules.state, { light: true }, () => withRules.a.comboCount > before);
  assert.ok(withRules.a.comboCount > before, 'the rebound leads straight into another air hit');
  assert.strictEqual(extend(null).rebounded, false, 'without versus rules Radiant Dive Medium keeps its authored dive to the floor');
}
console.log('versus rounds v1: air extender passed');
