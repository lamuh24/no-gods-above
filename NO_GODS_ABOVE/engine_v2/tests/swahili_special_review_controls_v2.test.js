const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createSpecialReviewScenario,
  SPECIAL_REVIEW_GROUPS_V2,
  SPECIAL_REVIEW_SCENARIO_ORDER,
  SPECIAL_REVIEW_SCENARIO_ORDER_V2
} = require('../dist/debug/specialReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runMirrorScenario(id) {
  const { definition, state, input } = createSpecialReviewScenario(id, 9100 + SPECIAL_REVIEW_SCENARIO_ORDER_V2.indexOf(id));
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const events = new Map();

  tick(state, input);
  assert.strictEqual(definition.attacker, 'p2', `${id}: expected mirrored P2 attacker`);
  assert.strictEqual(attacker.currentAttack, definition.expectedAttackId, `${id}: wrong attack route`);
  assert.strictEqual(state.throwInteraction, null, `${id}: special leaked into a throw`);

  let elapsed = 0;
  while (attacker.currentAttack) {
    tick(state, {});
    const event = state.lastCombatEvent;
    if (event && event.attackId === definition.expectedAttackId && event.attacker === 'p2') {
      events.set(`${event.tick}:${event.hitOrdinal}:${event.outcome}`, { ...event });
    }
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal stage bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical stage bounds`);
    }
    assert.ok(++elapsed < 200, `${id}: scenario did not return to neutral`);
  }

  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to neutral`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(events.size, definition.expectedRegisteredHits, `${id}: registered-hit parity mismatch`);
  assert.ok([...events.values()].every((event) => event.outcome === definition.expectedOutcome), `${id}: outcome mismatch`);

  return { id, attackId: definition.expectedAttackId, damage: defenderStartHealth - defender.health, registeredHits: events.size, elapsedTicks: elapsed };
}

assert.strictEqual(SPECIAL_REVIEW_SCENARIO_ORDER.length, 17, 'V1 evidence order changed');
assert.deepStrictEqual(SPECIAL_REVIEW_SCENARIO_ORDER_V2.slice(0, SPECIAL_REVIEW_SCENARIO_ORDER.length), SPECIAL_REVIEW_SCENARIO_ORDER, 'V2 must preserve the V1 prefix');
assert.strictEqual(SPECIAL_REVIEW_SCENARIO_ORDER_V2.length, 19);
assert.deepStrictEqual(SPECIAL_REVIEW_GROUPS_V2.map((group) => [group.id, group.scenarioIds.length]), [
  ['gameplay_candidates', 12],
  ['p2_mirror', 4],
  ['fallback_comparisons', 3]
]);

const results = [
  runMirrorScenario('p2_neutral_medium_hit'),
  runMirrorScenario('p2_up_medium_air_hit')
];
assert.deepStrictEqual(results.map((result) => [result.attackId, result.damage, result.registeredHits]), [
  ['special_neutral_medium', 65, 1],
  ['special_up_medium', 78, 1]
]);

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /SPECIAL_REVIEW_GROUPS_V(?:2|3)/, 'live review page must expose V2 or a backward-compatible superset');
assert.match(mainSource, /queuedP2Input\s*=\s*setup\.input\.p2\s*\?\?\s*\{\}/, 'P2 scenarios must use the normal one-tick input queue');
assert.match(mainSource, /no result is human approval/i, 'review UI must retain the human-approval boundary');

assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab motion timing changed');
const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: SPECIAL_REVIEW_SCENARIO_ORDER_V2.length, addedMirrors: results, candidateOnly: true, combatDefinitionsChanged: false, approvedMotionChanged: false }, null, 2));
console.log('Swahili special review controls V2 tests passed: preserved V1 plus P2 Neutral Medium and Up Medium mirror playtests.');
