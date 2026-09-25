const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createMatch, LAMUH_TURN_PRESENTATION_TICKS, tick } = require('../dist');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ENGINE_ROOT, '..', '..');
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const REVIEW_DATA = readJson(path.join(ENGINE_ROOT, 'public', 'lamuh-legacy-v2', 'review-data.json'));
const REPORT = readJson(path.join(REPO_ROOT, 'tools', 'nga-forge', 'review', 'lamuh-legacy-v2-turn-facing-modernization-v1', 'normalization.report.json'));
const EXPECTED_LEGACY_GAME_SHA256 = 'D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B';
const sha256 = (filename) => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').toUpperCase();

function p1Match(seed = 9101) {
  return createMatch(seed, { matchId: `lamuh-turn-${seed}`, p1Kind: 'lamuh_legacy_v2', p2Kind: 'training_dummy', p1X: 100, p2X: -100 });
}

function p2Match(seed = 9201) {
  return createMatch(seed, { matchId: `lamuh-turn-${seed}`, p1Kind: 'training_dummy', p2Kind: 'lamuh_legacy_v2', p1X: 100, p2X: -100 });
}

function testCandidateArtAndMetadata() {
  const movement = REVIEW_DATA.movementModernization;
  const state = movement.states.turn_facing;
  const candidate = movement.turnFacingModernization;
  assert.ok(candidate, 'turn/facing modernization metadata must exist');
  assert.strictEqual(candidate.status, 'candidate-only');
  assert.strictEqual(movement.status, 'turn_facing_approved_for_current_baseline_with_polish_debt_remaining_movement_gates_pending');
  assert.strictEqual(candidate.candidateOnly, true);
  assert.strictEqual(candidate.deployable, false);
  assert.strictEqual(candidate.gameplayFacingSwapDelayed, false);
  assert.strictEqual(candidate.transitionContract.gameplayFacingSwapTick, 0);
  assert.strictEqual(candidate.transitionContract.immediatelyInterruptible, true);
  assert.strictEqual(candidate.humanApproval, 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT');
  assert.strictEqual(candidate.starredForRevisit, true);
  assert.ok(candidate.approvalReceipt.path.endsWith('records/turn-facing-v1.approval.json'));
  assert.deepStrictEqual(state.exposureTicks, [2, 3, 3, 4]);
  assert.strictEqual(state.durationTicks, LAMUH_TURN_PRESENTATION_TICKS);
  assert.strictEqual(state.frames.length, 4);
  assert.strictEqual(new Set(state.frames.map((frame) => frame.sha256)).size, 4);
  assert.ok(REPORT.normalizedHeightSpread <= 0.04, 'body height spread must remain within the authored scale gate');
  assert.ok(REPORT.idleHeightDeltaRatio <= 0.02, 'turn body scale must remain aligned with Idle');
  for (const frame of state.frames) {
    const publicFile = path.join(ENGINE_ROOT, 'public', frame.publicPath.replace(/^\//, ''));
    assert.strictEqual(sha256(publicFile), frame.sha256);
    assert.deepStrictEqual(frame.root, movement.root);
  }
}

function testImmediateFacingAndFixedRoot() {
  const state = p1Match();
  const fighter = state.fighters.p1;
  const rootX = fighter.x;
  assert.strictEqual(fighter.facing, 1);
  tick(state, {});
  assert.strictEqual(fighter.facing, -1, 'gameplay facing must change on the first legal simulation tick');
  assert.strictEqual(fighter.phase, 'turn');
  assert.strictEqual(fighter.phaseTick, 0);
  assert.strictEqual(fighter.turnStartingFacing, 1);
  assert.strictEqual(fighter.x, rootX, 'turn presentation must not author world travel');
  for (let index = 1; index < LAMUH_TURN_PRESENTATION_TICKS; index++) {
    tick(state, {});
    assert.strictEqual(fighter.x, rootX);
    assert.strictEqual(fighter.facing, -1);
  }
  assert.strictEqual(fighter.phase, 'turn');
  assert.strictEqual(fighter.phaseTick, 11);
  tick(state, {});
  assert.strictEqual(fighter.phase, 'idle');
  assert.strictEqual(fighter.turnStartingFacing, undefined);
}

function testWholeSequenceMirrorContract() {
  const state = p2Match();
  const fighter = state.fighters.p2;
  const rootX = fighter.x;
  assert.strictEqual(fighter.facing, -1);
  tick(state, {});
  assert.strictEqual(fighter.facing, 1);
  assert.strictEqual(fighter.turnStartingFacing, -1);
  assert.strictEqual(fighter.phase, 'turn');
  assert.strictEqual(fighter.x, rootX);
  assert.strictEqual(REVIEW_DATA.movementModernization.turnFacingModernization.transitionContract.presentationFacingSource, 'turnStartingFacing');
}

function interruptedBy(input) {
  const state = p1Match(9300 + Object.keys(input).join('').length);
  tick(state, {});
  assert.strictEqual(state.fighters.p1.phase, 'turn');
  tick(state, { p1: input });
  return state.fighters.p1;
}

function testImmediateControlInterruptions() {
  const attack = interruptedBy({ light: true });
  assert.strictEqual(attack.phase, 'attack');
  assert.strictEqual(attack.currentAttack, 'standing_light');
  assert.strictEqual(attack.turnStartingFacing, undefined);

  assert.strictEqual(interruptedBy({ up: true }).phase, 'jump_startup');
  assert.strictEqual(interruptedBy({ left: true }).phase, 'walk_forward');
  assert.strictEqual(interruptedBy({ down: true }).phase, 'crouch');
  assert.strictEqual(interruptedBy({ block: true }).phase, 'block');

  const dashState = p1Match(9401);
  tick(dashState, {});
  tick(dashState, { p1: { left: true } });
  tick(dashState, {});
  tick(dashState, { p1: { left: true } });
  assert.strictEqual(dashState.fighters.p1.phase, 'dash');
}

function testChecksumDeterminismAndLegacyProtection() {
  const first = p1Match(9501), second = p1Match(9501);
  const inputs = [{}, {}, { p1: { light: true } }, {}, {}, {}, {}, {}];
  for (const input of inputs) { tick(first, input); tick(second, input); }
  assert.deepStrictEqual(first.checksums, second.checksums);
  assert.strictEqual(sha256(path.join(REPO_ROOT, 'NO_GODS_ABOVE', 'game.js')), EXPECTED_LEGACY_GAME_SHA256);
}

testCandidateArtAndMetadata();
testImmediateFacingAndFixedRoot();
testWholeSequenceMirrorContract();
testImmediateControlInterruptions();
testChecksumDeterminismAndLegacyProtection();
console.log('Lamuh Legacy V2 turn/facing candidate: PASS');
