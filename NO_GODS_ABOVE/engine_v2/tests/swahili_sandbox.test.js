const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sim = require('../dist/sandbox/swahiliSandboxSimulation');
const config = require('../dist/sandbox/sandboxConfig');
const airNormals = require('../dist/sandbox/airNormalsPlaytestV1');
const airLightPresentation = require('../dist/sandbox/airLightContactPresentationV1');
const groundNormals = require('../dist/sandbox/groundNormalsPlaytestV1');
const commandGrab = require('../dist/sandbox/commandGrabMotionV1');

function run(name, test) { test(); console.log(`PASS ${name}`); }
function advance(state, input, count) { for (let index = 0; index < count; index++) sim.tickSwahiliSandbox(state, index === 0 ? input : { ...input, command: undefined }); return state; }
function jumpToAirborne(state) {
  sim.tickSwahiliSandbox(state, { up: true });
  while (state.fighters.p1.grounded && state.tick < 30) sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.grounded, false);
  assert.strictEqual(state.fighters.p1.state, 'jump_airborne_review');
}
function runHeavy(mode) {
  const state = sim.createSwahiliSandbox();
  if (mode === 'whiff') state.fighters.p2.x = 300;
  if (mode === 'block') state.dummyBlockMode = 'standing';
  sim.tickSwahiliSandbox(state, { heavy: true });
  while (state.fighters.p1.state !== 'idle' && state.tick < 140) sim.tickSwahiliSandbox(state, {});
  return state;
}

run('sandbox status remains preview-only and non-roster', () => {
  const state = sim.createSwahiliSandbox();
  assert.strictEqual(state.status, 'preview-only');
  assert.strictEqual(state.candidateOnly, true);
  assert.strictEqual(state.deployable, false);
  assert.strictEqual(state.productionRoster, false);
});

run('current playable attack set carries the human-approved sandbox baseline without deployment promotion', () => {
  const approval = 'APPROVED_AS_CURRENT_SANDBOX_MOVESET_2026_08_12';
  assert.strictEqual(groundNormals.GROUND_NORMALS_PLAYTEST_V1_APPROVAL, approval);
  assert.strictEqual(airNormals.AIR_NORMALS_PLAYTEST_V1_STATUS, 'approved-current-sandbox-baseline');
  assert.strictEqual(airNormals.AIR_NORMALS_PLAYTEST_V1_GATE, approval);
  assert.ok(Object.values(airNormals.AIR_NORMALS_PLAYTEST_V1).every((move) => move.exposures.every((exposure) => exposure.approval === approval)));
  assert.strictEqual(commandGrab.COMMAND_GRAB_CURRENT_SANDBOX_PLAYTEST_APPROVAL, approval);
  assert.strictEqual(commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.status, 'approved-current-sandbox-baseline');
  const state = sim.createSwahiliSandbox();
  assert.strictEqual(state.status, 'preview-only');
  assert.strictEqual(state.deployable, false);
  assert.strictEqual(state.productionRoster, false);
});

run('human approval receipt matches the exact live attack scope and keeps absent content excluded', () => {
  const receiptPath = path.resolve(__dirname, '../../../tools/nga-forge/production/characters/swahili/approvals/current-sandbox-moveset-pass.approval.json');
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  assert.strictEqual(receipt.result, 'APPROVED_AS_CURRENT_SANDBOX_MOVESET_BASELINE');
  assert.strictEqual(receipt.humanInstruction, 'approve all current moveset this playtest passes');
  assert.deepStrictEqual(receipt.approvedCurrentAttackPlayback.map((entry) => entry.move), [
    'standing_light', 'standing_medium', 'standing_heavy',
    'crouching_light', 'crouching_medium', 'crouching_heavy',
    'air_light', 'air_medium', 'air_heavy',
    'universal_grab_entry', 'command_grab'
  ]);
  assert.ok(receipt.excludedFromApproval.includes('special_families_not_present_in_this_sandbox'));
  assert.ok(receipt.excludedFromApproval.includes('directional_normals_not_present_in_this_sandbox'));
  assert.ok(receipt.excludedFromApproval.includes('production_roster'));
  assert.strictEqual(receipt.candidateOnly, true);
  assert.strictEqual(receipt.deployable, false);
  assert.strictEqual(receipt.productionRoster, false);
  assert.strictEqual(receipt.targetedReviewState.move, 'command_grab');
  assert.strictEqual(receipt.targetedReviewState.correction, 'fall_phase_horizontal_facing_handoff');
  assert.strictEqual(receipt.targetedReviewState.status, 'implementation_verified_awaiting_human_playtest_confirmation');
  const rejectedSpin = receipt.targetedCorrections.find((entry) => entry.outcome === 'superseded_misinterpreted_as_spin');
  assert.ok(rejectedSpin && rejectedSpin.runtimeImplementationRetained === false, 'misinterpreted spin must remain superseded');
  const facingCorrection = receipt.targetedCorrections.find((entry) => entry.outcome === 'command_grab_victim_horizontal_facing_flips_during_final_two_airborne_fall_poses');
  assert.ok(facingCorrection, 'fall-phase facing handoff correction must be recorded');
  assert.strictEqual(facingCorrection.presentationSpinAllowed, false);
  assert.deepStrictEqual(facingCorrection.airborneFacingFlipPoses, ['post_shot_fall', 'fall_low']);
  assert.strictEqual(facingCorrection.landingFacingAlreadyAligned, true);
  assert.strictEqual(facingCorrection.combatChanged, false);
  const repoRoot = path.resolve(__dirname, '../../..');
  for (const [relativePath, expectedHash] of Object.entries(receipt.sourceRevision.sha256)) {
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, relativePath))).digest('hex').toUpperCase();
    assert.strictEqual(actualHash, expectedHash, `${relativePath} must still match the human-approved playtest revision`);
  }
});

run('Standing Heavy authoritative timing and outcome-specific hitstop', () => {
  assert.deepStrictEqual(config.SANDBOX_TUNING.standingHeavy.startup, { start: 0, end: 23 });
  assert.deepStrictEqual(config.SANDBOX_TUNING.standingHeavy.active, { start: 24, end: 28 });
  assert.deepStrictEqual(config.SANDBOX_TUNING.standingHeavy.recovery, { start: 29, end: 74 });
  assert.strictEqual(config.SANDBOX_TUNING.standingHeavy.returnToIdleTick, 75);
  assert.deepStrictEqual(config.SANDBOX_TUNING.standingHeavy.hitstop, { hit: 8, block: 5, whiff: 0 });
  assert.strictEqual(runHeavy('whiff').tick, 75, 'whiff must return on global tick 75');
  const hit = runHeavy('hit');
  assert.strictEqual(hit.tick, 83, '8 hitstop ticks must extend elapsed time without shortening the 75-tick cursor');
  assert.strictEqual(hit.fighters.p2.health, 880);
  assert.strictEqual(hit.lastEvent.outcome, 'hit');
  const block = runHeavy('block');
  assert.strictEqual(block.tick, 80, '5 block hitstop ticks must extend elapsed time without shortening the 75-tick cursor');
  assert.strictEqual(block.fighters.p2.health, 1000);
  assert.strictEqual(block.lastEvent.outcome, 'block');
});

run('Standing Heavy hits once and preserves approved exposure selection', () => {
  const state = sim.createSwahiliSandbox();
  sim.tickSwahiliSandbox(state, { heavy: true });
  while (state.lastEvent?.outcome !== 'hit') sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.lastEvent.tick, 24);
  assert.strictEqual(state.fighters.p1.moveCursor, 24);
  assert.strictEqual(sim.currentHeavyPhase(state.fighters.p1), 'active');
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).sourceId, 'standing_heavy_preparation');
  advance(state, {}, 30);
  assert.strictEqual(state.fighters.p2.health, 880, 'maxHits one must prevent repeated damage');
});

run('movement, stage bounds, facing, and side switch are simulation-owned', () => {
  const state = sim.createSwahiliSandbox();
  const initialX = state.fighters.p1.x;
  advance(state, { right: true }, 5);
  assert.ok(state.fighters.p1.x > initialX);
  assert.strictEqual(state.fighters.p1.state, 'walk_forward');
  advance(state, {}, 1);
  advance(state, { left: true }, 5);
  assert.strictEqual(state.fighters.p1.state, 'walk_backward');
  sim.tickSwahiliSandbox(state, { command: 'switch_sides' });
  assert.strictEqual(state.fighters.p1.facing, -1);
  assert.strictEqual(state.fighters.p2.facing, 1);
  state.fighters.p1.x = -999;
  sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.x, state.stage.left);
});

run('hurtboxes fit Swahili body anatomy and exclude weapon/canvas silhouette in both facings', () => {
  const cases = [
    { state: 'idle', crouching: false, cursor: null, profile: config.BODY_HURTBOX_PROFILES.standing },
    { state: 'crouch', crouching: true, cursor: null, profile: config.BODY_HURTBOX_PROFILES.crouching },
    { state: 'heavy_hit_reaction', crouching: false, cursor: null, profile: config.BODY_HURTBOX_PROFILES.reaction },
    { state: 'standing_heavy', crouching: false, cursor: 27, profile: config.BODY_HURTBOX_PROFILES.standingHeavyExtended }
  ];
  for (const facing of [1, -1]) {
    const state = sim.createSwahiliSandbox();
    const fighter = state.fighters.p1;
    fighter.x = 40;
    fighter.facing = facing;
    for (const candidate of cases) {
      fighter.state = candidate.state;
      fighter.crouching = candidate.crouching;
      fighter.moveCursor = candidate.cursor;
      const boxes = sim.fighterHurtboxes(fighter);
      assert.strictEqual(boxes.length, candidate.profile.length, `${candidate.state} body-part count drift`);
      boxes.forEach((box, index) => {
        const authored = candidate.profile[index];
        const expectedX = facing > 0 ? fighter.x + authored.x : fighter.x - authored.x - authored.w;
        assert.deepStrictEqual(box, { x: expectedX, y: authored.y, w: authored.w, h: authored.h });
        assert.ok(box.w <= 94 && box.h <= 74, `${candidate.state} contains an oversized body-part hurtbox`);
        const localLeft = facing > 0 ? box.x - fighter.x : fighter.x - box.x - box.w;
        assert.ok(localLeft >= -52 && localLeft + box.w <= 80, `${candidate.state} reaches weapon/canvas-only space`);
      });
    }
  }
});

run('standing and crouching block use approved visual states', () => {
  const state = sim.createSwahiliSandbox();
  sim.tickSwahiliSandbox(state, { block: true });
  assert.strictEqual(state.fighters.p1.state, 'standing_block');
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).sourceId, 'standing_block_entry');
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).fallbackWarning, null);
  advance(state, { block: true }, 3);
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).sourceId, 'standing_block');
  sim.tickSwahiliSandbox(state, { block: true, down: true });
  assert.strictEqual(state.fighters.p1.state, 'crouching_block');
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).sourceId, 'crouching_block_entry');
  advance(state, { block: true, down: true }, 3);
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).sourceId, 'crouching_block_v2');
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1).approval, 'APPROVED_AS_DEFENSE_REACTION_MOTION_V1');
});

run('backward walk exposes all three missing roles as labeled fallbacks', () => {
  const state = sim.createSwahiliSandbox();
  const fighter = state.fighters.p1;
  fighter.state = 'walk_backward';
  const warnings = [];
  for (const stateTick of [10, 15, 25]) { fighter.stateTick = stateTick; warnings.push(sim.selectSandboxAnimation(fighter).fallbackWarning); }
  assert.deepStrictEqual(warnings, [
    'DEBUG FALLBACK - MISSING walk_backward_first_passing',
    'DEBUG FALLBACK - MISSING walk_backward_first_up',
    'DEBUG FALLBACK - MISSING walk_backward_opposite_down'
  ]);
  assert.strictEqual(config.MISSING_ANIMATION_STATES.filter((entry) => entry.startsWith('walk_backward:')).length, 3);
});

run('jump candidate review uses simulation-owned trajectory and no missing-art fallback', () => {
  const state = sim.createSwahiliSandbox();
  advance(state, { up: true }, 8);
  const animation = sim.selectSandboxAnimation(state.fighters.p1);
  assert.strictEqual(state.fighters.p1.grounded, false);
  assert.strictEqual(animation.sourceId, 'jump_v1_rising');
  assert.strictEqual(animation.fallbackWarning, null);
  assert.strictEqual(animation.approval, 'awaiting_human_jump_fall_landing_live_review');
  assert.strictEqual(config.MISSING_ANIMATION_STATES.includes('jump'), false);
});

run('airborne U I and L activate distinct Swahili air normals', () => {
  for (const [input, expected] of [[{ light: true }, 'air_light_review'], [{ medium: true }, 'air_medium_review'], [{ heavy: true }, 'air_heavy_review']]) {
    const state = sim.createSwahiliSandbox();
    jumpToAirborne(state);
    sim.tickSwahiliSandbox(state, input);
    assert.strictEqual(state.fighters.p1.state, expected);
    assert.strictEqual(state.fighters.p1.grounded, false);
    assert.strictEqual(state.airMobilityReview.airNormalActionsUsed, 1);
  }
});

run('Air Light uses the slower 17-tick kick cadence while remaining faster than Air Medium', () => {
  const light = airNormals.AIR_NORMALS_PLAYTEST_V1.air_light;
  const medium = airNormals.AIR_NORMALS_PLAYTEST_V1.air_medium;
  assert.deepStrictEqual(light.exposures.map((exposure) => exposure.ticks), [5, 3, 4, 5]);
  assert.strictEqual(light.startupTicks, 5);
  assert.strictEqual(light.activeTicks, 3);
  assert.strictEqual(light.recoveryTicks, 9);
  assert.strictEqual(light.totalTicks, 17);
  assert.strictEqual(light.attackerContactHoldTicks, 3);
  assert.strictEqual(light.exposures.reduce((sum, exposure) => sum + exposure.ticks, 0), light.totalTicks);
  assert.ok(light.startupTicks < medium.startupTicks, 'Air Light startup must remain faster than Air Medium');
  assert.ok(light.totalTicks < medium.totalTicks, 'Air Light total duration must remain shorter than Air Medium');
});

run('Air Light keeps the approved close-range cadence when the kick whiffs at distance', () => {
  function playAt(opponentX) {
    const state = sim.createSwahiliSandbox();
    state.fighters.p1.x = -40;
    state.fighters.p2.x = opponentX;
    jumpToAirborne(state);
    const startTick = state.tick;
    sim.tickSwahiliSandbox(state, { light: true });
    const cursorTrace = [];
    while (state.fighters.p1.state === 'air_light_review' && state.tick < 100) {
      cursorTrace.push(state.fighters.p1.moveCursor);
      sim.tickSwahiliSandbox(state, {});
    }
    return { state, elapsedTicks: state.tick - startTick, cursorTrace };
  }

  const near = playAt(40);
  const far = playAt(500);
  const approvedCloseTrace = [1, 2, 3, 4, 5, 5, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  assert.strictEqual(near.elapsedTicks, 20, 'approved close hit must keep its existing 20-tick elapsed cadence');
  assert.strictEqual(far.elapsedTicks, 20, 'far whiff must receive the same three-tick contact hold');
  assert.deepStrictEqual(near.cursorTrace, approvedCloseTrace);
  assert.deepStrictEqual(far.cursorTrace, approvedCloseTrace, 'fighter animation cursor must be range-invariant');
  assert.strictEqual(near.state.fighters.p2.health, 975, 'near kick still registers exactly one 25-damage hit');
  assert.strictEqual(far.state.fighters.p2.health, 1000, 'far kick remains a whiff');
  assert.strictEqual(far.state.lastEvent?.id, 'air_normal_air_light_whiff_complete');
});

run('W then U during jump anticipation buffers Air Light and exposes its body-authored boot contact', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = 320;
  sim.tickSwahiliSandbox(state, { up: true });
  sim.tickSwahiliSandbox(state, { light: true });
  assert.strictEqual(state.fighters.p1.state, 'jump_anticipation_review');
  assert.strictEqual(state.airMobilityReview.queuedAirNormal, 'air_light');
  while (state.fighters.p1.state !== 'air_light_review' && state.tick < 30) sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.state, 'air_light_review', 'buffered Air Light must start immediately after takeoff');
  assert.strictEqual(state.airMobilityReview.queuedAirNormal, null, 'buffer must clear when Air Light starts');
  while (state.fighters.p1.moveCursor < airNormals.AIR_NORMALS_PLAYTEST_V1.air_light.startupTicks) sim.tickSwahiliSandbox(state, {});
  const sample = airLightPresentation.airLightContactPresentationSample(state.fighters.p1);
  assert.strictEqual(sample.active, true);
  assert.strictEqual(sample.showContactArc, false, 'Air Light must use the fighter body pose instead of a detached arc');
  assert.strictEqual(airLightPresentation.AIR_LIGHT_CONTACT_PRESENTATION_V1.bodyArtworkComplete, true);
  assert.strictEqual(airLightPresentation.AIR_LIGHT_CONTACT_PRESENTATION_V1.contactStyle, 'compact_leading_boot_body_contact_with_separate_hit_spark');
});

run('each air normal registers exactly one hit with temporary sandbox damage', () => {
  const cases = [
    { input: { light: true }, id: 'air_light', damage: 25 },
    { input: { medium: true }, id: 'air_medium', damage: 45 },
    { input: { heavy: true }, id: 'air_heavy', damage: 70 }
  ];
  for (const candidate of cases) {
    const state = sim.createSwahiliSandbox();
    state.fighters.p1.x = -40;
    state.fighters.p2.x = 40;
    jumpToAirborne(state);
    sim.tickSwahiliSandbox(state, candidate.input);
    while (state.lastEvent?.id !== `air_normal_${candidate.id}_contact` && state.tick < 80) sim.tickSwahiliSandbox(state, {});
    assert.strictEqual(state.lastEvent?.id, `air_normal_${candidate.id}_contact`);
    assert.strictEqual(state.fighters.p2.health, 1000 - candidate.damage);
    assert.deepStrictEqual(state.fighters.p1.airNormalConnectedHitOrdinals, [1]);
    const healthAfterContact = state.fighters.p2.health;
    advance(state, {}, 20);
    assert.strictEqual(state.fighters.p2.health, healthAfterContact, `${candidate.id} must not hit twice`);
  }
});

run('Air Light gameplay exposes the compact boot contact without a missing-art fallback', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = 320;
  jumpToAirborne(state);
  sim.tickSwahiliSandbox(state, { light: true });
  while (state.fighters.p1.moveCursor < airNormals.AIR_NORMALS_PLAYTEST_V1.air_light.startupTicks) sim.tickSwahiliSandbox(state, {});
  const animation = sim.selectSandboxAnimation(state.fighters.p1, state);
  assert.strictEqual(animation.sourceId, 'air_light_compact_boot_v2_02_compact_boot_contact');
  assert.strictEqual(animation.fallbackWarning, null);
  assert.strictEqual(airNormals.AIR_NORMALS_PLAYTEST_V1.air_light.candidateArtComplete, true);
});

run('mirrored Air Heavy keeps facing locked and its hitbox reaches the opponent-facing side', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p1.x = 40;
  state.fighters.p2.x = -40;
  jumpToAirborne(state);
  sim.tickSwahiliSandbox(state, { heavy: true });
  assert.strictEqual(state.fighters.p1.facing, -1);
  while (state.lastEvent?.id !== 'air_normal_air_heavy_contact' && state.tick < 80) sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.lastEvent?.id, 'air_normal_air_heavy_contact');
  assert.strictEqual(state.fighters.p2.health, 930);
  assert.strictEqual(state.fighters.p1.facing, -1);
});

run('landing interrupts aerial recovery and uses the attack landing pose', () => {
  const state = sim.createSwahiliSandbox();
  state.fighters.p2.x = 350;
  jumpToAirborne(state);
  sim.tickSwahiliSandbox(state, { heavy: true });
  while (state.fighters.p1.state !== 'jump_landing_attack_review' && state.tick < 100) sim.tickSwahiliSandbox(state, {});
  assert.strictEqual(state.fighters.p1.state, 'jump_landing_attack_review');
  assert.strictEqual(state.fighters.p1.moveCursor, null);
  assert.strictEqual(sim.selectSandboxAnimation(state.fighters.p1, state).sourceId, 'jump_v1_attack_landing_recovery');
  advance(state, {}, 12);
  assert.strictEqual(state.fighters.p1.state, 'idle');
});

run('air attacks are mechanically covered and Air Light body art is no longer listed as missing', () => {
  assert.strictEqual(config.MISSING_ANIMATION_STATES.includes('air_attacks'), false);
  assert.strictEqual(config.MISSING_ANIMATION_STATES.includes('air_light:contact_art_manual_paintover'), false);
  assert.strictEqual(airNormals.AIR_NORMALS_PLAYTEST_V1_GAMEPLAY_VALUES, 'TEMPORARY_SANDBOX_AIR_NORMALS_NOT_PRODUCTION_BALANCE');
});

run('identical input logs produce identical checksums', () => {
  const inputs = [
    ...Array.from({ length: 12 }, () => ({ right: true })),
    {}, { left: true }, { left: true }, {},
    { command: 'switch_sides' },
    { heavy: true },
    ...Array.from({ length: 90 }, () => ({}))
  ];
  const run = () => { const state = sim.createSwahiliSandbox(77); for (const input of inputs) sim.tickSwahiliSandbox(state, input); return sim.sandboxChecksum(state); };
  assert.strictEqual(run(), run());
});

run('sandbox remains isolated from the deterministic combat kernel and production roster', () => {
  const sandboxRoot = path.join(__dirname, '..', 'src', 'sandbox');
  for (const file of fs.readdirSync(sandboxRoot).filter((name) => name.endsWith('.ts'))) {
    const source = fs.readFileSync(path.join(sandboxRoot, file), 'utf8');
    assert.ok(!source.includes('../core/engine'), `${file} must not import the combat kernel`);
    assert.ok(!source.includes('selectableCharacterIds'), `${file} must not touch production roster selection`);
  }
  const legacyDiffSentinel = fs.readFileSync(path.join(__dirname, '..', '..', 'game.js'));
  assert.ok(legacyDiffSentinel.length > 0);
});

console.log('Swahili sandbox tests passed: deterministic preview simulation, 75-tick heavy, live air normals, candidate jump review, explicit remaining fallbacks, and non-roster isolation.');
