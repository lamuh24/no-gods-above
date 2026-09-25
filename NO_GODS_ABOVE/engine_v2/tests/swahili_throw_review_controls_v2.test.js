const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createThrowReviewScenario,
  THROW_REVIEW_SCENARIO_ORDER,
  THROW_REVIEW_SCENARIO_ORDER_V2,
  THROW_REVIEW_SCENARIOS
} = require('../dist/debug/throwReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const V2_IDS = ['p2_command_grab_hit', 'p2_command_grab_whiff'];

function runScenario(id, seed) {
  const { definition, state, input } = createThrowReviewScenario(id, seed);
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const defenderStartX = defender.x;
  const startFacing = attacker.facing;
  const events = [];
  let damageEvents = 0;
  let elapsed = 0;

  tick(state, input);
  assert.strictEqual(state.throwInteraction?.throwId, definition.expectedThrowId, `${id}: wrong throw route`);
  assert.strictEqual(state.throwInteraction?.attacker, definition.attacker, `${id}: wrong attacker`);

  while (state.throwInteraction) {
    if (state.lastThrowEvent && events.at(-1)?.eventId !== state.lastThrowEvent.eventId) events.push({ ...state.lastThrowEvent });
    const healthBefore = defender.health;
    tick(state, {});
    if (defender.health < healthBefore) damageEvents++;
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical bounds`);
    }
    assert.ok(++elapsed < 180, `${id}: scenario did not terminate`);
  }
  if (state.lastThrowEvent && events.at(-1)?.eventId !== state.lastThrowEvent.eventId) events.push({ ...state.lastThrowEvent });

  const expectedEvents = definition.expectedOutcome === 'connected'
    ? ['startup', 'connect', 'release', 'complete']
    : ['startup', 'whiff', 'complete'];
  assert.deepStrictEqual(events.map((event) => event.type), expectedEvents, `${id}: event lifecycle mismatch`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(damageEvents, definition.expectedDamage > 0 ? 1 : 0, `${id}: damage-event parity mismatch`);
  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to neutral`);
  const sideSwitched = (defender.x - attacker.x) * startFacing < 0;
  assert.strictEqual(sideSwitched, definition.expectedSideSwitch, `${id}: side-switch result mismatch`);
  if (definition.expectedOutcome === 'whiff') assert.strictEqual(defender.x, defenderStartX, `${id}: whiff moved the victim`);

  return {
    id,
    elapsedTicks: elapsed,
    damage: defenderStartHealth - defender.health,
    damageEvents,
    sideSwitched,
    finalPositions: { p1: state.fighters.p1.x, p2: state.fighters.p2.x },
    eventTypes: events.map((event) => event.type)
  };
}

assert.strictEqual(THROW_REVIEW_SCENARIO_ORDER.length, 9, 'V1 scenario evidence surface changed');
assert.strictEqual(THROW_REVIEW_SCENARIO_ORDER_V2.length, 11, 'V2 scenario count changed');
assert.deepStrictEqual(THROW_REVIEW_SCENARIO_ORDER_V2.slice(0, 9), THROW_REVIEW_SCENARIO_ORDER, 'V2 must preserve V1 order');
assert.deepStrictEqual(THROW_REVIEW_SCENARIO_ORDER_V2.slice(9), V2_IDS, 'V2 mirrored Command Grab scenarios missing');
assert.strictEqual(new Set(THROW_REVIEW_SCENARIO_ORDER_V2).size, 11, 'V2 scenario IDs must be unique');

for (const id of V2_IDS) {
  const setup = createThrowReviewScenario(id, 3300 + V2_IDS.indexOf(id));
  assert.strictEqual(setup.definition.attacker, 'p2', `${id}: attacker must be P2`);
  assert.strictEqual(setup.input.p1, undefined, `${id}: P1 input must remain empty`);
  assert.deepStrictEqual(setup.input.p2, { special: true, throw: true }, `${id}: must use normal P2 Command Grab input`);
}

const p1Hit = runScenario('p1_command_grab_hit', 3401);
const p2Hit = runScenario('p2_command_grab_hit', 3401);
const p1Whiff = runScenario('p1_command_grab_whiff', 3402);
const p2Whiff = runScenario('p2_command_grab_whiff', 3402);

assert.strictEqual(p2Hit.damage, 220, 'P2 mirrored Command Grab damage changed');
assert.strictEqual(p2Hit.damageEvents, 1, 'P2 mirrored Command Grab must retain one damage event');
assert.strictEqual(p2Hit.sideSwitched, true, 'P2 mirrored Command Grab must retain the approved side switch');
assert.deepStrictEqual(p2Hit.eventTypes, p1Hit.eventTypes, 'P2 hit lifecycle must mirror P1');
assert.strictEqual(p2Hit.elapsedTicks, p1Hit.elapsedTicks, 'P2 hit duration must mirror P1');
assert.strictEqual(p2Whiff.damage, 0, 'P2 Command Grab whiff dealt damage');
assert.strictEqual(p2Whiff.sideSwitched, false, 'P2 Command Grab whiff side-switched');
assert.deepStrictEqual(p2Whiff.eventTypes, p1Whiff.eventTypes, 'P2 whiff lifecycle must mirror P1');
assert.strictEqual(p2Whiff.elapsedTicks, p1Whiff.elapsedTicks, 'P2 whiff duration must mirror P1');

assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.damage, 220, 'approved Command Grab damage changed');
assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab timing changed');
const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /THROW_REVIEW_SCENARIO_ORDER_V3\.map/, 'debug page must render the current V3 scenario order');
assert.match(mainSource, /queuedP2Input\s*=\s*setup\.input\.p2\s*\?\?\s*\{\}/, 'P2 scenario must use the normal one-tick input queue');
const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({
  status: 'PASS',
  scenarioCount: THROW_REVIEW_SCENARIO_ORDER_V2.length,
  preservedV1ScenarioCount: THROW_REVIEW_SCENARIO_ORDER.length,
  addedScenarios: V2_IDS,
  candidateOnly: true,
  approvedMotionChanged: false,
  combatDefinitionsChanged: false,
  results: [p2Hit, p2Whiff]
}, null, 2));
console.log('Swahili throw review controls V2 tests passed: preserved V1 order plus mirrored P2 Command Grab hit/whiff parity, one-damage-event hit, bounded recovery, normal input queue, and legacy lock.');
