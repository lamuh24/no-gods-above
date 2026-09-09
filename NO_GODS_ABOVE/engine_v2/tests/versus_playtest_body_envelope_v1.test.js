// Versus playtest: matched body height and full-body hitboxes.
//
// Guards the two properties the playtest exists to demonstrate:
//   1. Lamuh and Swahili occupy one shared body height, drawn and collided.
//   2. Hurtboxes envelope that whole body, so a head-height strike connects.
//
// Also pins the opt-in contract: with no envelope supplied, every existing
// fighter keeps exactly the geometry it had before this feature landed.

const assert = require('assert');
const { createMatch, fighterPushbox, fighterExtendedHurtboxes, tick } = require('../dist');
const { fighterDefinitions } = require('../dist/data/fighters');
const { ROSTER, TARGET_BODY_UNITS } = require('../dist/versus/roster');

const LAMUH = ROSTER.lamuh;
const SWAHILI = ROSTER.swahili;

function versusMatch({ envelope = true, p1X = -40, p2X = 40, seed = 4180 } = {}) {
  return createMatch(seed, {
    matchId: `versus-${seed}-${envelope}`,
    p1Kind: LAMUH.kind,
    p2Kind: SWAHILI.kind,
    p1X, p2X,
    swahiliAirSpecialsV1: true,
    ...(envelope ? { p1BodyEnvelope: LAMUH.envelope, p2BodyEnvelope: SWAHILI.envelope } : {})
  });
}

const span = (boxes) => {
  const top = Math.min(...boxes.map((b) => b.y));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));
  return { top, bottom, height: bottom - top };
};

// --- 1. one shared body height -------------------------------------------
{
  const state = versusMatch();
  const p1 = span(fighterExtendedHurtboxes(state.fighters.p1));
  const p2 = span(fighterExtendedHurtboxes(state.fighters.p2));

  assert.strictEqual(p1.height, TARGET_BODY_UNITS, 'Lamuh hurtbox span must equal the shared body height');
  assert.strictEqual(p2.height, TARGET_BODY_UNITS, 'Swahili hurtbox span must equal the shared body height');
  assert.strictEqual(p1.height, p2.height, 'both fighters must share one body height');
  assert.strictEqual(p1.top, p2.top, 'both heads must sit at the same height above the floor');
  assert.strictEqual(p1.bottom, 0, 'the hurtbox stack must reach the floor, not float above it');
  assert.strictEqual(p2.bottom, 0, 'the hurtbox stack must reach the floor, not float above it');

  for (const side of ['p1', 'p2']) {
    const pushbox = fighterPushbox(state.fighters[side]);
    assert.strictEqual(pushbox.h, TARGET_BODY_UNITS, `${side} pushbox must span the whole drawn body`);
  }
}

// --- 2. the hurtbox stack has no vertical gaps ----------------------------
{
  const state = versusMatch();
  for (const side of ['p1', 'p2']) {
    const boxes = [...fighterExtendedHurtboxes(state.fighters[side])].sort((a, b) => a.y - b.y);
    for (let i = 1; i < boxes.length; i += 1) {
      const previousBottom = boxes[i - 1].y + boxes[i - 1].h;
      assert.ok(boxes[i].y <= previousBottom,
        `${side} hurtbox band ${i} starts at ${boxes[i].y} but the band above ends at ${previousBottom}: attacks would pass through the gap`);
    }
  }
}

// --- 3. a head-height strike connects with the envelope and misses without -
// The authored hurtboxes were sized for a silhouette roughly half the height of
// the drawn adult body, so anything aimed at the head used to pass straight
// through. This is the accuracy defect the envelope repairs.
{
  const HEAD_STRIKE = { x: 30, y: -170, w: 70, h: 30 }; // squarely in the head band

  function headStrikeConnects(useEnvelope) {
    const state = versusMatch({ envelope: useEnvelope, p1X: -40, p2X: 40 });
    const defender = state.fighters.p2;
    const boxes = fighterExtendedHurtboxes(defender);
    const world = { x: state.fighters.p1.x + HEAD_STRIKE.x, y: HEAD_STRIKE.y, w: HEAD_STRIKE.w, h: HEAD_STRIKE.h };
    return boxes.some((box) =>
      world.x < box.x + box.w && box.x < world.x + world.w &&
      world.y < box.y + box.h && box.y < world.y + world.h);
  }

  assert.strictEqual(headStrikeConnects(true), true, 'a head-height strike must connect against the full-body envelope');
  assert.strictEqual(headStrikeConnects(false), false, 'the legacy hurtboxes must still be the shorter silhouette, proving the envelope is what fixed it');
}

// --- 4. both characters can actually fight each other ---------------------
{
  const state = versusMatch({ p1X: -32, p2X: 32 });
  const events = [];
  const inputs = [{ p1: { heavy: true } }];
  for (let i = 0; i < 60; i += 1) {
    tick(state, inputs[i] ?? {});
    const event = state.lastCombatEvent;
    if (event && event.tick === state.tick - 1) events.push(event);
  }
  const hit = events.find((event) => event.attacker === 'p1' && event.outcome === 'hit');
  assert.ok(hit, 'Lamuh must be able to land a normal on Swahili in a shared match');
  assert.ok(hit.damage > 0, 'the landed hit must deal damage');
  assert.ok(state.fighters.p2.health < fighterDefinitions[SWAHILI.kind].maxHealth, 'Swahili must actually lose health');
}

// --- 4b. a downed body does not keep a standing-height hurtbox ------------
{
  const state = versusMatch();
  const standing = span(fighterExtendedHurtboxes(state.fighters.p2)).height;
  for (const phase of ['knockdown', 'getup', 'crouch']) {
    state.fighters.p2.phase = phase;
    const low = span(fighterExtendedHurtboxes(state.fighters.p2)).height;
    assert.ok(low < standing, `a fighter in "${phase}" must not carry the full standing envelope (${low} vs ${standing})`);
  }
}

// --- 5. opt-in: an ordinary match is byte-for-byte unaffected --------------
{
  const withoutEnvelope = versusMatch({ envelope: false });
  for (const side of ['p1', 'p2']) {
    const fighter = withoutEnvelope.fighters[side];
    assert.strictEqual(fighter.bodyEnvelope, undefined, `${side} must carry no envelope when none was requested`);
    assert.deepStrictEqual(
      fighterPushbox(fighter),
      { x: fighter.x + fighterDefinitions[fighter.kind].pushbox.x, y: fighterDefinitions[fighter.kind].pushbox.y, w: fighterDefinitions[fighter.kind].pushbox.w, h: fighterDefinitions[fighter.kind].pushbox.h },
      `${side} must fall back to its authored pushbox`);
  }
}

// --- 6. presentation scale really does equalise the drawn bodies ----------
// Height parity is only real if the sprite scale matches the collision height.
{
  const { drawScaleFor, bodyHeightPx, WORLD_SCALE } = require('../dist/versus/roster');
  for (const character of [LAMUH, SWAHILI]) {
    const drawnUnits = (bodyHeightPx(character.metrics) * drawScaleFor(character.metrics)) / WORLD_SCALE;
    assert.ok(Math.abs(drawnUnits - TARGET_BODY_UNITS) < 0.001,
      `${character.name} draws at ${drawnUnits.toFixed(3)}u but must draw at ${TARGET_BODY_UNITS}u`);
  }
  // And the roots must sit on the floor line, not on the authored canvas edge.
  const { rootFor } = require('../dist/versus/roster');
  for (const character of [LAMUH, SWAHILI]) {
    assert.strictEqual(rootFor(character.metrics).y, character.metrics.feetY,
      `${character.name} sprite root must be the foot contact line`);
  }
}

console.log('versus playtest body envelope v1: all checks passed');
