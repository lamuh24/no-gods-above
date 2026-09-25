const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createThrowReviewScenario,
  THROW_REVIEW_SCENARIO_ORDER,
  THROW_REVIEW_SCENARIOS
} = require('../dist/debug/throwReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runScenario(id) {
  const { definition, state, input } = createThrowReviewScenario(id, 2700 + THROW_REVIEW_SCENARIO_ORDER.indexOf(id));
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const defenderStartX = defender.x;
  const startFacing = attacker.facing;
  const events = [];
  let damageEvents = 0;
  let sawExpectedOutcome = false;
  let elapsed = 0;

  tick(state, input);
  assert.strictEqual(state.throwInteraction?.throwId, definition.expectedThrowId, `${id}: wrong throw route`);
  assert.strictEqual(state.throwInteraction?.attacker, definition.attacker, `${id}: wrong attacker`);

  while (state.throwInteraction) {
    const interaction = state.throwInteraction;
    sawExpectedOutcome ||= interaction.result === definition.expectedOutcome;
    if (state.lastThrowEvent && events.at(-1)?.eventId !== state.lastThrowEvent.eventId) events.push({ ...state.lastThrowEvent });
    const healthBefore = defender.health;
    tick(state, {});
    if (defender.health < healthBefore) damageEvents++;
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal stage bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical stage bounds`);
    }
    assert.ok(++elapsed < 180, `${id}: throw scenario did not terminate`);
  }
  if (state.lastThrowEvent && events.at(-1)?.eventId !== state.lastThrowEvent.eventId) events.push({ ...state.lastThrowEvent });

  const expectedEvents = definition.expectedOutcome === 'connected'
    ? ['startup', 'connect', 'release', 'complete']
    : ['startup', 'whiff', 'complete'];
  assert.deepStrictEqual(events.map((event) => event.type), expectedEvents, `${id}: event lifecycle mismatch`);
  assert.ok(sawExpectedOutcome, `${id}: expected ${definition.expectedOutcome} was never observed`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(damageEvents, definition.expectedDamage > 0 ? 1 : 0, `${id}: damage-event parity mismatch`);
  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to neutral`);
  const sideSwitched = (defender.x - attacker.x) * startFacing < 0;
  assert.strictEqual(sideSwitched, definition.expectedSideSwitch, `${id}: side-switch result mismatch`);
  if (definition.expectedOutcome === 'whiff') assert.strictEqual(defender.x, defenderStartX, `${id}: whiff moved the victim`);

  return {
    id,
    attacker: definition.attacker,
    throwId: definition.expectedThrowId,
    outcome: definition.expectedOutcome,
    elapsedTicks: elapsed,
    damage: definition.expectedDamage,
    damageEvents,
    sideSwitched,
    finalPositions: { p1: state.fighters.p1.x, p2: state.fighters.p2.x },
    eventTypes: events.map((event) => event.type)
  };
}

const results = THROW_REVIEW_SCENARIO_ORDER.map(runScenario);
assert.strictEqual(results.length, 9);
assert.strictEqual(new Set(results.map((result) => result.id)).size, 9);
assert.deepStrictEqual(THROW_REVIEW_SCENARIOS.p1_throw_whiff.input, { throw: true });
assert.deepStrictEqual(THROW_REVIEW_SCENARIOS.p1_command_grab_hit.input, { special: true, throw: true });
assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.damage, 220, 'approved Command Grab damage changed');
assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab motion timing changed');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
for (const id of THROW_REVIEW_SCENARIO_ORDER) assert.ok(mainSource.includes('throwScenarioButtons') && mainSource.includes('data-throw-scenario'), `${id}: debug control binding missing`);
assert.match(mainSource, /queuedP1Input\s*=\s*setup\.input\.p1\s*\?\?\s*\{\}/, 'P1 scenario must use the normal one-tick input queue');
assert.match(mainSource, /queuedP2Input\s*=\s*setup\.input\.p2\s*\?\?\s*\{\}/, 'P2 scenario must use the normal one-tick input queue');

const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: results.length, candidateOnly: true, combatDefinitionsChanged: false, approvedMotionChanged: false, results }, null, 2));
console.log('Swahili throw review controls V1 tests passed: P1/P2, hit/whiff, center/corner, side switches, single-damage parity, bounded recovery, normal input queue, and legacy lock.');
