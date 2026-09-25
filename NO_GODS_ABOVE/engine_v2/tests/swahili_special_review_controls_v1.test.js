const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const {
  createSpecialReviewScenario,
  SPECIAL_REVIEW_GROUPS,
  SPECIAL_REVIEW_SCENARIO_ORDER,
  SPECIAL_REVIEW_SCENARIOS
} = require('../dist/debug/specialReviewScenarios');

const LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';

function runScenario(id) {
  const { definition, state, input } = createSpecialReviewScenario(id, 2800 + SPECIAL_REVIEW_SCENARIO_ORDER.indexOf(id));
  const attacker = state.fighters[definition.attacker];
  const defenderId = definition.attacker === 'p1' ? 'p2' : 'p1';
  const defender = state.fighters[defenderId];
  const defenderStartHealth = defender.health;
  const eventKeys = new Set();
  const events = [];
  let elapsed = 0;

  tick(state, input);
  assert.strictEqual(attacker.currentAttack, definition.expectedAttackId, `${id}: wrong attack route`);
  assert.strictEqual(state.throwInteraction, null, `${id}: special scenario leaked into a throw`);

  while (attacker.currentAttack) {
    tick(state, {});
    const event = state.lastCombatEvent;
    if (event && event.attackId === definition.expectedAttackId && event.attacker === definition.attacker) {
      const key = `${event.tick}:${event.hitOrdinal}:${event.outcome}`;
      if (!eventKeys.has(key)) {
        eventKeys.add(key);
        events.push({ ...event });
      }
    }
    for (const fighter of Object.values(state.fighters)) {
      assert.ok(fighter.x >= state.stage.left && fighter.x <= state.stage.right, `${id}: fighter escaped horizontal stage bounds`);
      assert.ok(fighter.y >= state.stage.ceilingY && fighter.y <= state.stage.groundY, `${id}: fighter escaped vertical stage bounds`);
    }
    assert.ok(++elapsed < 200, `${id}: special scenario did not return to neutral`);
  }

  assert.strictEqual(attacker.phase, 'idle', `${id}: attacker did not return to neutral`);
  assert.strictEqual(defenderStartHealth - defender.health, definition.expectedDamage, `${id}: damage mismatch`);
  assert.strictEqual(events.length, definition.expectedRegisteredHits, `${id}: registered-hit parity mismatch`);
  assert.ok(events.every((event) => event.outcome === definition.expectedOutcome), `${id}: expected only ${definition.expectedOutcome} outcomes`);
  if (definition.expectedOutcome === 'whiff') assert.strictEqual(events.length, 0, `${id}: whiff emitted a combat contact`);

  return {
    id,
    group: definition.group,
    attacker: definition.attacker,
    attackId: definition.expectedAttackId,
    outcome: definition.expectedOutcome,
    elapsedTicks: elapsed,
    damage: defenderStartHealth - defender.health,
    registeredHits: events.length,
    eventOutcomes: events.map((event) => event.outcome),
    finalPositions: { p1: state.fighters.p1.x, p2: state.fighters.p2.x }
  };
}

const results = SPECIAL_REVIEW_SCENARIO_ORDER.map(runScenario);
assert.strictEqual(results.length, 17);
assert.strictEqual(new Set(results.map((result) => result.id)).size, 17);
assert.deepStrictEqual(SPECIAL_REVIEW_GROUPS.map((group) => [group.id, group.scenarioIds.length]), [
  ['gameplay_candidates', 12],
  ['p2_mirror', 2],
  ['fallback_comparisons', 3]
]);

const coveredCandidates = new Set(results.filter((result) => result.group === 'gameplay_candidates').map((result) => result.attackId));
assert.deepStrictEqual([...coveredCandidates].sort(), ['special_down_heavy', 'special_neutral_medium', 'special_up_heavy', 'special_up_medium']);
assert.strictEqual(results.find((result) => result.id === 'p1_grounded_verdict_hit').registeredHits, 2);
assert.strictEqual(results.find((result) => result.id === 'p1_grounded_verdict_block').registeredHits, 2);
assert.strictEqual(results.find((result) => result.id === 'p1_up_medium_low_profile').outcome, 'whiff');
assert.strictEqual(results.find((result) => result.id === 'p2_grave_furrow_hit').attacker, 'p2');
assert.strictEqual(results.find((result) => result.id === 'p2_grounded_verdict_hit').attacker, 'p2');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'main.ts'), 'utf8');
assert.match(mainSource, /data-special-scenario=/, 'special scenario buttons are missing');
assert.match(mainSource, /queuedP1Input\s*=\s*setup\.input\.p1\s*\?\?\s*\{\}/, 'P1 scenarios must use the normal one-tick input queue');
assert.match(mainSource, /queuedP2Input\s*=\s*setup\.input\.p2\s*\?\?\s*\{\}/, 'P2 scenarios must use the normal one-tick input queue');
assert.match(mainSource, /no result is human approval/i, 'review UI must retain the human-approval boundary');

assert.strictEqual(fighterDefinitions.lamuh_proto.attacks.special_down_heavy.hitboxes.length, 2);
assert.strictEqual(fighterDefinitions.lamuh_proto.attacks.special_up_heavy.hitboxes.length, 1);
assert.strictEqual(fighterDefinitions.lamuh_proto.throws.command_grab.totalTicks, 107, 'approved Command Grab motion timing changed');

const gameBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
assert.strictEqual(crypto.createHash('sha256').update(gameBytes).digest('hex').toUpperCase(), LEGACY_GAME_SHA256);

console.log(JSON.stringify({ status: 'PASS', scenarioCount: results.length, groups: SPECIAL_REVIEW_GROUPS, candidateOnly: true, combatDefinitionsChanged: false, approvedMotionChanged: false, results }, null, 2));
console.log('Swahili special review controls V1 tests passed: four gameplay candidates, hit/block/whiff, low-profile, P2 mirror, fallback comparison, normal input queue, hit parity, and legacy lock.');
