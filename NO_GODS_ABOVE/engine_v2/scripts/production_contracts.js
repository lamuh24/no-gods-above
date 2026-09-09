const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(ROOT, '..', '..');
const CONTENT_SOURCE_ROOT = path.join(ROOT, 'content-source');
const GENERATED_ROOT = path.join(ROOT, 'generated');
const COMPILER_VERSION = '0.1.0';
const EVENT_ID_TEMPLATE = '{matchId}:{simulationFrame}:{fighterId}:{moveInstance}:{eventIndex}';
const TIMING_DURATION_BASIS = [
  'move_weight',
  'readability',
  'combat_role',
  'risk_reward',
  'character_identity',
  'animation_quality',
  'balance'
];
const PRODUCTION_SCHEMA_NAMES = [
  'animation-package.schema.json',
  'character-bundle.schema.json',
  'combat-track.schema.json',
  'compiled-runtime-manifest.schema.json',
  'pose-token.schema.json',
  'presentation-event.schema.json',
  'production-arena-brief.schema.json',
  'provenance.schema.json',
  'stage-art-pack.schema.json',
  'stage-presentation-events.schema.json',
  'stage-production.schema.json',
  'stage-validation-plan.schema.json',
  'transition.schema.json'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveInside(parent, candidate, label) {
  const resolved = path.resolve(candidate);
  assert(isInside(parent, resolved), `${label} must stay inside ${parent}`);
  return resolved;
}

function resolveRepoUri(uri, label) {
  assert(typeof uri === 'string' && uri.startsWith('repo://'), `${label} must use repo://`);
  const relative = uri.slice('repo://'.length).replaceAll('/', path.sep);
  return resolveInside(PROJECT_ROOT, path.join(PROJECT_ROOT, relative), label);
}

function fileSha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
}

function assertId(value, label) {
  assert(typeof value === 'string' && /^[a-z0-9_]+$/.test(value), `${label} must be snake_case`);
}

function assertInteger(value, label, minimum = 0) {
  assert(Number.isInteger(value) && value >= minimum, `${label} must be an integer >= ${minimum}`);
}

function assertUnique(values, label) {
  assert(new Set(values).size === values.length, `${label} contains duplicates`);
}

function validatePoseToken(pose, label) {
  assert(pose && typeof pose === 'object' && !Array.isArray(pose), `${label} must be an object`);
  assertId(pose.id, `${label}.id`);
  assert(['forward', 'backward', 'either'].includes(pose.facing), `${label}.facing invalid`);
  assert(['grounded', 'airborne', 'either'].includes(pose.elevation), `${label}.elevation invalid`);
  assert(['left', 'right', 'both', 'none', 'either'].includes(pose.plantedFoot), `${label}.plantedFoot invalid`);
  assert(['neutral', 'forward', 'backward', 'low', 'airborne'].includes(pose.weight), `${label}.weight invalid`);
  assert(typeof pose.weaponState === 'string' && pose.weaponState, `${label}.weaponState required`);
  assert(pose.handOccupancy && typeof pose.handOccupancy.left === 'string' && typeof pose.handOccupancy.right === 'string', `${label}.handOccupancy invalid`);
  assert(typeof pose.silhouette === 'string' && pose.silhouette, `${label}.silhouette required`);
  assert(['stationary', 'rising', 'apex', 'falling', 'landing'].includes(pose.verticalMotion), `${label}.verticalMotion invalid`);
}

function validateRange(range, length, label) {
  assertInteger(range.start, `${label}.start`);
  assertInteger(range.end, `${label}.end`);
  assert(range.start <= range.end, `${label} start must not exceed end`);
  assert(range.end < length, `${label} exceeds simulation length ${length}`);
}

// A dive starts at the fighter's current airborne height. Its linear exposures
// describe a tooling envelope, never a scheduled landing or a gameplay cursor.
// Runtime playback must select the stage using the simulation-owned dive state.
function validateAuthoredDiveTrack(animationPackage, sourceFrameIds, label) {
  const combat = animationPackage.combatTrack;
  const dive = combat.authoredDiveTrack;
  const diveLabel = `${label}.combatTrack.authoredDiveTrack`;
  const exactKeys = (value, keys, name) => {
    assert(value && typeof value === 'object' && !Array.isArray(value), `${name} must be an object`);
    assert(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${name} fields invalid`);
  };
  exactKeys(dive, ['owner', 'attackId', 'track', 'maximumAirTicks', 'landingPhase', 'landingTrigger', 'airExposurePolicy', 'hitstopFreezes', 'maxHits', 'phaseExposures'], diveLabel);
  assert(dive.owner === 'deterministic_simulation' && dive.hitstopFreezes === true, `${diveLabel} ownership/hitstop invalid`);
  assertId(dive.attackId, `${diveLabel}.attackId`);
  assert(dive.landingPhase === 'dive_landing' && dive.landingTrigger === 'actual_floor_contact', `${diveLabel} must land only on actual floor contact`);
  assert(dive.airExposurePolicy === 'stage_driven' && dive.maxHits === 1, `${diveLabel} must be stage-driven and single-hit`);
  assert(!combat.selfMotionTrack && !combat.projectileTrack && combat.cancelWindows.length === 0, `${diveLabel} cannot combine hop, projectile or cancel tracks`);
  assert(combat.startup > 0 && combat.active > 0 && combat.damage > 0, `${diveLabel} requires positive startup, active and damage`);
  assert(!combat.boxes.some(box => box.kind === 'throw'), `${diveLabel} cannot contain a throw`);
  assert(animationPackage.entryPose.elevation === 'airborne' && animationPackage.exitPose.elevation === 'grounded', `${diveLabel} must enter airborne and exit grounded`);
  const playback = animationPackage.playbackPolicy;
  assert(playback?.mode === 'external_gameplay_state' && playback.holdBehavior === 'clamp_to_gameplay_state' && playback.cursorOwner === 'simulation' && playback.hitstopFreezesCursor === true, `${diveLabel} playback must follow simulation stage, not a fixed landing tick`);

  const track = dive.track;
  exactKeys(track, ['minimumHeight', 'maximumHeight', 'landingApproachHeight', 'windupVelocity', 'strikeVelocity', 'gatherVelocity', 'landingRecoveryTicks'], `${diveLabel}.track`);
  assert(Number.isFinite(track.minimumHeight) && track.minimumHeight > 0 && Number.isFinite(track.maximumHeight) && track.maximumHeight >= track.minimumHeight, `${diveLabel} height gate invalid`);
  assert(Number.isFinite(track.landingApproachHeight) && track.landingApproachHeight > 0 && track.landingApproachHeight < track.minimumHeight, `${diveLabel} landing approach height invalid`);
  for (const stage of ['windup', 'strike', 'gather']) {
    const velocity = track[`${stage}Velocity`];
    exactKeys(velocity, ['x', 'y'], `${diveLabel}.track.${stage}Velocity`);
    assert(Number.isFinite(velocity.x) && velocity.x >= 0 && Number.isFinite(velocity.y) && (stage === 'windup' ? velocity.y >= 0 : velocity.y > 0), `${diveLabel} ${stage} velocity must move forward/downward`);
  }
  assertInteger(track.landingRecoveryTicks, `${diveLabel}.track.landingRecoveryTicks`, 1);
  assert(track.landingRecoveryTicks === combat.recovery, `${diveLabel} recovery must equal landingRecoveryTicks`);
  assertInteger(dive.maximumAirTicks, `${diveLabel}.maximumAirTicks`, 1);
  const maximumAirTicks = combat.startup + Math.ceil(track.maximumHeight / Math.min(track.strikeVelocity.y, track.gatherVelocity.y));
  assert(dive.maximumAirTicks === maximumAirTicks && maximumAirTicks > combat.startup + combat.active, `${diveLabel} maximumAirTicks must be the conservative descent envelope`);
  assert(animationPackage.simulationLength === maximumAirTicks + track.landingRecoveryTicks, `${diveLabel} simulationLength must equal maximum air envelope plus committed landing`);
  assert(animationPackage.landing.length === 1 && animationPackage.landing[0].start === maximumAirTicks && animationPackage.landing[0].end === animationPackage.simulationLength - 1, `${diveLabel} landing metadata must describe the envelope endpoint, not a fixed floor tick`);

  const phases = dive.phaseExposures;
  exactKeys(phases, ['windup', 'strike', 'gather', 'landing'], `${diveLabel}.phaseExposures`);
  const expectedDuration = { windup: combat.startup, strike: combat.active, gather: 1, landing: track.landingRecoveryTicks };
  for (const stage of Object.keys(expectedDuration)) {
    assert(Array.isArray(phases[stage]) && phases[stage].length > 0, `${diveLabel}.phaseExposures.${stage} required`);
    if (stage === 'strike' || stage === 'gather') assert(phases[stage].length === 1, `${diveLabel} ${stage} must use one continuous pose`);
    let duration = 0;
    for (const [index, exposure] of phases[stage].entries()) {
      exactKeys(exposure, ['sourceFrameId', 'duration'], `${diveLabel}.phaseExposures.${stage}[${index}]`);
      assert(sourceFrameIds.has(exposure.sourceFrameId), `${diveLabel}.phaseExposures.${stage} references unknown source frame`);
      assertInteger(exposure.duration, `${diveLabel}.phaseExposures.${stage}[${index}].duration`, 1);
      duration += exposure.duration;
    }
    assert(duration === expectedDuration[stage], `${diveLabel} ${stage} exposure duration must equal ${expectedDuration[stage]}`);
  }
  let cursor = 0;
  const envelopeExposures = ['windup', 'strike', 'gather', 'landing'].flatMap(stage => phases[stage].map(exposure => {
    const duration = stage === 'gather' ? maximumAirTicks - combat.startup - combat.active : exposure.duration;
    const result = { sourceFrameId: exposure.sourceFrameId, start: cursor, duration };
    cursor += duration;
    return result;
  }));
  assert(stableJson(animationPackage.exposures) === stableJson(envelopeExposures), `${diveLabel} tooling exposures must match the stage-driven envelope`);
}

function validateAnimationPackage(animationPackage, poseIds, packageIds, label) {
  assert(animationPackage.schemaVersion === '2.1.0-contract', `${label}.schemaVersion invalid`);
  assertId(animationPackage.id, `${label}.id`);
  assertInteger(animationPackage.version, `${label}.version`, 1);
  assert(['draft', 'candidate', 'approved', 'retired'].includes(animationPackage.promotionState), `${label}.promotionState invalid`);
  assertInteger(animationPackage.simulationLength, `${label}.simulationLength`, 1);

  assert(Array.isArray(animationPackage.sourceFrames) && animationPackage.sourceFrames.length > 0, `${label}.sourceFrames required`);
  const sourceFrameIds = animationPackage.sourceFrames.map((frame, index) => {
    assertId(frame.id, `${label}.sourceFrames[${index}].id`);
    assert(typeof frame.sourceUri === 'string' && frame.sourceUri, `${label}.sourceFrames[${index}].sourceUri required`);
    assertInteger(frame.width, `${label}.sourceFrames[${index}].width`, 1);
    assertInteger(frame.height, `${label}.sourceFrames[${index}].height`, 1);
    if (animationPackage.promotionState !== 'retired') {
      assert(/^[A-Fa-f0-9]{64}$/.test(frame.sha256 || ''), `${label}.sourceFrames[${index}].sha256 required`);
      const sourcePath = resolveRepoUri(frame.sourceUri, `${label}.sourceFrames[${index}].sourceUri`);
      assert(fs.existsSync(sourcePath), `${label}.sourceFrames[${index}] source does not exist`);
      assert(fileSha256(sourcePath) === frame.sha256.toUpperCase(), `${label}.sourceFrames[${index}] SHA-256 mismatch`);
      for (const uriField of ['approvalUri', 'provenanceUri', 'metadataUri']) {
        const recordPath = resolveRepoUri(frame[uriField], `${label}.sourceFrames[${index}].${uriField}`);
        assert(fs.existsSync(recordPath), `${label}.sourceFrames[${index}].${uriField} does not exist`);
      }
    }
    return frame.id;
  });
  assertUnique(sourceFrameIds, `${label}.sourceFrames ids`);
  const sourceFrameIdSet = new Set(sourceFrameIds);

  assert(Array.isArray(animationPackage.exposures) && animationPackage.exposures.length > 0, `${label}.exposures required`);
  let exposureCursor = 0;
  for (const [index, exposure] of animationPackage.exposures.entries()) {
    assert(sourceFrameIdSet.has(exposure.sourceFrameId), `${label}.exposures[${index}] references unknown source frame`);
    assertInteger(exposure.start, `${label}.exposures[${index}].start`);
    assertInteger(exposure.duration, `${label}.exposures[${index}].duration`, 1);
    assert(exposure.start === exposureCursor, `${label}.exposures must be contiguous at frame ${exposureCursor}`);
    exposureCursor += exposure.duration;
  }
  assert(exposureCursor === animationPackage.simulationLength, `${label}.exposures cover ${exposureCursor} frames, expected ${animationPackage.simulationLength}`);

  const phaseNames = ['anticipation', 'startup', 'active', 'impact', 'followThrough', 'recovery'];
  for (const phaseName of phaseNames) {
    const ranges = animationPackage.phases?.[phaseName];
    assert(Array.isArray(ranges), `${label}.phases.${phaseName} must be an array`);
    ranges.forEach((range, index) => validateRange(range, animationPackage.simulationLength, `${label}.phases.${phaseName}[${index}]`));
  }

  validatePoseToken(animationPackage.entryPose, `${label}.entryPose`);
  validatePoseToken(animationPackage.exitPose, `${label}.exitPose`);
  assert(poseIds.has(animationPackage.entryPose.id), `${label}.entryPose is absent from the character pose library`);
  assert(poseIds.has(animationPackage.exitPose.id), `${label}.exitPose is absent from the character pose library`);
  assert(Array.isArray(animationPackage.interruptPoses), `${label}.interruptPoses must be an array`);
  animationPackage.interruptPoses.forEach((pose, index) => validatePoseToken(pose, `${label}.interruptPoses[${index}]`));

  assert(Array.isArray(animationPackage.transitions), `${label}.transitions must be an array`);
  for (const [index, transition] of animationPackage.transitions.entries()) {
    const transitionLabel = `${label}.transitions[${index}]`;
    assertId(transition.id, `${transitionLabel}.id`);
    assert(poseIds.has(transition.fromPose), `${transitionLabel}.fromPose is absent from the character pose library`);
    assert(packageIds.has(transition.toAnimation), `${transitionLabel}.toAnimation references unknown package ${transition.toAnimation}`);
    assert(['clean_cut', 'impact_masked', 'smear_bridge', 'authored_micro_transition'].includes(transition.type), `${transitionLabel}.type invalid`);
    validateRange(transition.simulationWindow, animationPackage.simulationLength, `${transitionLabel}.simulationWindow`);
    assert(Array.isArray(transition.visualFrames), `${transitionLabel}.visualFrames must be an array`);
    transition.visualFrames.forEach((frameId) => assert(sourceFrameIdSet.has(frameId), `${transitionLabel}.visualFrames references unknown source frame ${frameId}`));
    assert(transition.addsGameplayFrames === false, `${transitionLabel} must not add gameplay frames`);
  }

  assert(Array.isArray(animationPackage.landing), `${label}.landing must be an array`);
  animationPackage.landing.forEach((landing, index) => validateRange(landing, animationPackage.simulationLength, `${label}.landing[${index}]`));
  const airborne = animationPackage.entryPose.elevation === 'airborne' || animationPackage.exitPose.elevation === 'airborne';
  assert(!airborne || animationPackage.landing.length > 0, `${label} is airborne but has no landing rule`);

  assert(Array.isArray(animationPackage.anchors) && animationPackage.anchors.length > 0, `${label}.anchors required`);
  animationPackage.anchors.forEach((anchor, index) => {
    assertInteger(anchor.frame, `${label}.anchors[${index}].frame`);
    assert(anchor.frame < animationPackage.simulationLength, `${label}.anchors[${index}] exceeds simulation length`);
    for (const key of ['root', 'feet', 'effect']) {
      assert(Number.isInteger(anchor[key]?.x) && Number.isInteger(anchor[key]?.y), `${label}.anchors[${index}].${key} must use integer coordinates`);
    }
    if (anchor.sourceFrameId) assert(sourceFrameIdSet.has(anchor.sourceFrameId), `${label}.anchors[${index}].sourceFrameId unknown`);
    for (const key of ['nearFoot', 'farFoot']) {
      if (anchor[key]) assert(Number.isInteger(anchor[key].x) && Number.isInteger(anchor[key].y), `${label}.anchors[${index}].${key} must use integer coordinates`);
    }
  });

  if (animationPackage.promotionState !== 'retired') {
    const playback = animationPackage.playbackPolicy;
    assert(playback && ['fixed_timeline', 'input_held_guard', 'external_gameplay_state'].includes(playback.mode), `${label}.playbackPolicy.mode invalid`);
    assert(playback.cursorOwner === 'simulation', `${label}.playbackPolicy cursor must be simulation-owned`);
    assert(playback.hitstopFreezesCursor === true, `${label}.playbackPolicy must freeze during hitstop`);
    assert(['none', 'clamp_while_input_held', 'clamp_to_gameplay_state'].includes(playback.holdBehavior), `${label}.playbackPolicy.holdBehavior invalid`);

    const interruption = animationPackage.interruptionBehavior;
    assert(interruption?.owner === 'simulation', `${label}.interruptionBehavior must be simulation-owned`);
    assert(Array.isArray(interruption.allowedSources), `${label}.interruptionBehavior.allowedSources required`);
    assert(typeof interruption.onInterrupt === 'string' && interruption.onInterrupt, `${label}.interruptionBehavior.onInterrupt required`);
    assert(typeof interruption.returnStatePolicy === 'string' && interruption.returnStatePolicy, `${label}.interruptionBehavior.returnStatePolicy required`);

    assert(Array.isArray(animationPackage.groundingTrack) && animationPackage.groundingTrack.length > 0, `${label}.groundingTrack required`);
    for (const [index, grounding] of animationPackage.groundingTrack.entries()) {
      assert(sourceFrameIdSet.has(grounding.sourceFrameId), `${label}.groundingTrack[${index}] source frame unknown`);
      for (const key of ['root', 'nearFoot', 'farFoot']) assert(Number.isInteger(grounding[key]?.x) && Number.isInteger(grounding[key]?.y), `${label}.groundingTrack[${index}].${key} invalid`);
      assert(typeof grounding.nearFootRole === 'string' && grounding.nearFootRole, `${label}.groundingTrack[${index}].nearFootRole required`);
      assert(typeof grounding.farFootRole === 'string' && grounding.farFootRole, `${label}.groundingTrack[${index}].farFootRole required`);
      assertInteger(grounding.projectedGroundPlaneY, `${label}.groundingTrack[${index}].projectedGroundPlaneY`);
      assert(typeof grounding.contractVersion === 'string' && grounding.contractVersion, `${label}.groundingTrack[${index}].contractVersion required`);
    }

    const facing = animationPackage.facingBehavior;
    assert(facing?.authoredFacing === 'P1_screen_right', `${label}.facingBehavior.authoredFacing invalid`);
    assert(facing.runtimeP2 === 'horizontal_mirror_screen_left', `${label}.facingBehavior.runtimeP2 invalid`);
    assertInteger(facing.mirrorAxisX, `${label}.facingBehavior.mirrorAxisX`);
    assert(facing.losslessMirrorRequired === true, `${label}.facingBehavior must require lossless mirroring`);

    assert(Array.isArray(animationPackage.transitionCompatibility) && animationPackage.transitionCompatibility.length > 0, `${label}.transitionCompatibility required`);
    animationPackage.transitionCompatibility.forEach((transition, index) => {
      assert(Array.isArray(transition.fromStates) && transition.fromStates.length > 0, `${label}.transitionCompatibility[${index}].fromStates required`);
      assert(typeof transition.toState === 'string' && transition.toState, `${label}.transitionCompatibility[${index}].toState required`);
      assert(typeof transition.condition === 'string' && transition.condition, `${label}.transitionCompatibility[${index}].condition required`);
      assert(transition.addsGameplayFrames === false, `${label}.transitionCompatibility[${index}] must not add gameplay frames`);
    });

    assert(Array.isArray(animationPackage.presentationSockets) && animationPackage.presentationSockets.length > 0, `${label}.presentationSockets required`);
    const socketIds = animationPackage.presentationSockets.map((socket, index) => {
      assertId(socket.id, `${label}.presentationSockets[${index}].id`);
      assert(Number.isInteger(socket.x) && Number.isInteger(socket.y), `${label}.presentationSockets[${index}] coordinates invalid`);
      assert(socket.mirrorRule === 'x_prime_equals_canvas_width_minus_x', `${label}.presentationSockets[${index}].mirrorRule invalid`);
      assert(Array.isArray(socket.eventTypes) && socket.eventTypes.length > 0, `${label}.presentationSockets[${index}].eventTypes required`);
      return socket.id;
    });
    assertUnique(socketIds, `${label}.presentationSockets ids`);

    const gameplayTiming = animationPackage.gameplayTimingStatus;
    assert(gameplayTiming?.owner === 'simulation', `${label}.gameplayTimingStatus must be simulation-owned`);
    assert(['sandbox_candidate_awaiting_combat_approval', 'authoritative', 'not_applicable'].includes(gameplayTiming.state), `${label}.gameplayTimingStatus.state invalid`);
    assert(typeof gameplayTiming.authoritative === 'boolean', `${label}.gameplayTimingStatus.authoritative required`);
    assert(gameplayTiming.candidateValues && typeof gameplayTiming.candidateValues === 'object', `${label}.gameplayTimingStatus.candidateValues required`);
    assert(Array.isArray(gameplayTiming.notes), `${label}.gameplayTimingStatus.notes required`);

    assert(Array.isArray(animationPackage.approvalRecords) && animationPackage.approvalRecords.length > 0, `${label}.approvalRecords required`);
    animationPackage.approvalRecords.forEach((uri, index) => {
      const approvalPath = resolveRepoUri(uri, `${label}.approvalRecords[${index}]`);
      assert(fs.existsSync(approvalPath), `${label}.approvalRecords[${index}] does not exist`);
    });
  }

  const combat = animationPackage.combatTrack;
  for (const field of ['startup', 'active', 'recovery', 'damage', 'hitstop', 'hitstun', 'blockstun']) {
    assertInteger(combat?.[field], `${label}.combatTrack.${field}`);
  }
  assert(Array.isArray(combat.boxes), `${label}.combatTrack.boxes must be an array`);
  assert(Array.isArray(combat.cancelWindows), `${label}.combatTrack.cancelWindows must be an array`);
  if (Object.hasOwn(combat, 'authoredDiveTrack')) {
    validateAuthoredDiveTrack(animationPackage, sourceFrameIdSet, label);
  } else if (combat.damage > 0 || animationPackage.promotionState !== 'retired') {
    assert(combat.startup + combat.active + combat.recovery === animationPackage.simulationLength, `${label} combat timing must equal simulationLength`);
  }
  if (animationPackage.promotionState !== 'retired') {
    const authorship = combat.timingAuthorship;
    assert(authorship && typeof authorship === 'object' && !Array.isArray(authorship), `${label}.combatTrack.timingAuthorship required for production packages`);
    assert(authorship.simulationTickRateHz === 60, `${label}.combatTrack.timingAuthorship.simulationTickRateHz must be 60`);
    assert(authorship.authoredTotalDuration === animationPackage.simulationLength, `${label}.combatTrack.timingAuthorship.authoredTotalDuration must equal simulationLength`);
    assert(authorship.durationModel === 'independently_authored_per_move', `${label}.combatTrack.timingAuthorship.durationModel invalid`);
    assert(Array.isArray(authorship.durationBasis), `${label}.combatTrack.timingAuthorship.durationBasis must be an array`);
    assertUnique(authorship.durationBasis, `${label}.combatTrack.timingAuthorship.durationBasis`);
    assert(
      TIMING_DURATION_BASIS.every((basis) => authorship.durationBasis.includes(basis))
        && authorship.durationBasis.length === TIMING_DURATION_BASIS.length,
      `${label}.combatTrack.timingAuthorship.durationBasis must record all independent duration factors`
    );
    assert(authorship.uniformDurationNormalizationProhibited === true, `${label}.combatTrack must prohibit uniform duration normalization`);
    assert(authorship.visualGameplayAlignment === 'aligned_by_default', `${label}.combatTrack visual/gameplay timing must align by default`);
    assert(Array.isArray(authorship.timingExceptions), `${label}.combatTrack.timingAuthorship.timingExceptions must be an array`);
    authorship.timingExceptions.forEach((exception, index) => {
      validateRange(exception, animationPackage.simulationLength, `${label}.combatTrack.timingAuthorship.timingExceptions[${index}]`);
      assert(typeof exception.visualState === 'string' && exception.visualState, `${label}.timingExceptions[${index}].visualState required`);
      assert(typeof exception.gameplayState === 'string' && exception.gameplayState, `${label}.timingExceptions[${index}].gameplayState required`);
      assert(typeof exception.reason === 'string' && exception.reason, `${label}.timingExceptions[${index}].reason required`);
      assert(exception.approvalStatus === 'approved', `${label}.timingExceptions[${index}] requires explicit approval`);
    });
  }
  if (Object.hasOwn(combat, 'counterTrack')) {
    const counter = combat.counterTrack;
    assert(counter && counter.owner === 'deterministic_simulation' && counter.hitstopFreezes === true && /^[a-z0-9_]+$/.test(counter.attackId || ''), `${label}.counterTrack ownership invalid`);
    assert(counter.trigger === 'incoming_body_strike' && counter.responseMode === 'nested_definition_same_attack_id', `${label}.counterTrack trigger/response invalid`);
    assert(combat.damage === 0 && combat.active === 0 && combat.boxes.length === 0 && !combat.rootMotionTrack && !combat.selfMotionTrack && !combat.authoredDiveTrack, `${label}.counterTrack stance must be non-damaging and stationary`);
    assert(Number.isInteger(counter.start) && counter.start >= combat.startup && Number.isInteger(counter.end) && counter.end >= counter.start && counter.end < animationPackage.simulationLength, `${label}.counterTrack window invalid`);
    for (const key of ['responseStartup', 'responseActive', 'responseRecovery']) assert(Number.isInteger(counter[key]) && counter[key] > 0, `${label}.counterTrack response timing invalid`);
    assert(Number.isInteger(counter.responseStrikeInvulnThrough) && counter.responseStrikeInvulnThrough >= 0 && counter.responseStrikeInvulnThrough < counter.responseStartup, `${label}.counterTrack response protection invalid`);
  }
  if (Object.hasOwn(combat, 'rootMotionTrack')) {
    const motion = combat.rootMotionTrack;
    assert(motion && motion.owner === 'deterministic_simulation' && motion.hitstopFreezes === true && /^[a-z0-9_]+$/.test(motion.attackId || ''), `${label}.rootMotionTrack ownership invalid`);
    assert(!combat.selfMotionTrack && !combat.authoredDiveTrack, `${label}.rootMotionTrack cannot combine with another motion owner`);
    assert(Array.isArray(motion.segments) && motion.segments.length > 0, `${label}.rootMotionTrack segments required`);
    let previousEnd = -1;
    for (const segment of motion.segments) {
      assert(segment && Number.isInteger(segment.start) && Number.isInteger(segment.end) && segment.start >= 0 && segment.start <= segment.end && segment.end < animationPackage.simulationLength && Number.isFinite(segment.velocity), `${label}.rootMotionTrack segment invalid`);
      assert(segment.start > previousEnd, `${label}.rootMotionTrack segments overlap or are unordered`);
      previousEnd = segment.end;
    }
  }
  if (combat.selfMotionTrack) {
    const motion=combat.selfMotionTrack, hop=motion.hop, root=motion.rootMotion;
    assert(motion.owner==='deterministic_simulation' && motion.hitstopFreezes===true && /^[a-z0-9_]+$/.test(motion.attackId||''), `${label}.selfMotionTrack ownership invalid`);
    assert(motion.interruption==='handoff_current_position_and_velocity_to_physics', `${label}.selfMotionTrack interruption invalid`);
    assert(hop && ['takeoffTick','apexTick','landTick'].every(k=>Number.isInteger(hop[k])) && hop.takeoffTick===combat.startup && hop.takeoffTick<hop.apexTick && hop.apexTick<hop.landTick && hop.landTick<animationPackage.simulationLength && Number.isFinite(hop.height) && hop.height>0, `${label}.selfMotionTrack hop invalid`);
    assert(root && Number.isInteger(root.start) && Number.isInteger(root.end) && root.start>=0 && root.start<=root.end && root.end<animationPackage.simulationLength && Number.isFinite(root.velocity), `${label}.selfMotionTrack root invalid`);
  }
  if (combat.damage > 0) {
    assert(combat.active > 0, `${label} deals damage but has no active frames`);
    const activeStart = combat.startup;
    const activeEnd = combat.startup + combat.active - 1;
    const hitBoxes = combat.boxes.filter((box) => box.kind === 'hit' || box.kind === 'throw');
    const projectile = combat.projectileTrack;
    if (projectile) {
      assert(projectile.owner === 'deterministic_simulation' && projectile.maxHits === 1, `${label}.projectileTrack ownership/hit count invalid`);
      assert(projectile.independentAfterRelease === true && projectile.bodyHitboxes === false && /^[a-z0-9_]+$/.test(projectile.attackId || ''), `${label}.projectileTrack source/authority invalid`);
      assert(Number.isInteger(projectile.lifeTicks) && Number.isInteger(projectile.releaseTick), `${label}.projectileTrack clocks must be integer ticks`);
      assert(projectile.releaseTick === combat.startup && projectile.releaseTick < animationPackage.simulationLength, `${label}.projectileTrack release must align with active start`);
      for (const key of ['speed', 'maxTravel', 'lifeTicks']) assert(Number.isFinite(projectile[key]) && projectile[key] > 0, `${label}.projectileTrack.${key} must be positive`);
      assert(Number.isFinite(projectile.gravity) && projectile.gravity >= 0, `${label}.projectileTrack.gravity invalid`);
      assert(Number.isFinite(projectile.spawnOffset?.x) && Number.isFinite(projectile.spawnOffset?.y), `${label}.projectileTrack spawn invalid`);
      const box=projectile.collisionRect;
      assert(box && ['x','y','w','h'].every(key=>Number.isFinite(box[key])) && box.w>0 && box.h>0, `${label}.projectileTrack collision rect invalid`);
      assert(projectile.damage === combat.damage, `${label}.projectileTrack damage mismatch`);
    }
    assert(hitBoxes.length > 0 || projectile, `${label} deals damage but has no hit, throw or projectile box`);
    hitBoxes.forEach((box, index) => assert(box.frame >= activeStart && box.frame <= activeEnd, `${label}.combatTrack hit box ${index} is outside active frames`));
  }

  assert(Array.isArray(animationPackage.presentationTrack), `${label}.presentationTrack must be an array`);
  const eventIndexes = [];
  for (const [index, event] of animationPackage.presentationTrack.entries()) {
    assertInteger(event.index, `${label}.presentationTrack[${index}].index`);
    eventIndexes.push(event.index);
    assertInteger(event.frame, `${label}.presentationTrack[${index}].frame`);
    assert(event.frame < animationPackage.simulationLength, `${label}.presentationTrack[${index}] exceeds simulation length`);
    assert(event.eventIdTemplate === EVENT_ID_TEMPLATE, `${label}.presentationTrack[${index}] has a rollback-unsafe event id template`);
  }
  assertUnique(eventIndexes, `${label}.presentationTrack indexes`);

  assert(animationPackage.validation?.humanApprovalRequired === true, `${label} must require human creative approval`);
  assert(animationPackage.provenance && typeof animationPackage.provenance.tool === 'string', `${label}.provenance required`);
  const approval = animationPackage.provenance.humanApproval;
  assert(approval && ['pending', 'approved', 'rejected'].includes(approval.state), `${label}.provenance.humanApproval invalid`);
  if (animationPackage.promotionState === 'approved') {
    assert(approval.state === 'approved' && approval.approvedBy && approval.approvedAt, `${label} is approved without a human approval record`);
  }
}

function loadAndValidateBundle(bundlePath) {
  const resolvedBundlePath = resolveInside(CONTENT_SOURCE_ROOT, bundlePath, 'character bundle');
  const bundle = readJson(resolvedBundlePath);
  assert(bundle.schemaVersion === '2.1.0-contract', 'character bundle schemaVersion invalid');
  assertId(bundle.id, 'character bundle id');
  assertInteger(bundle.bundleVersion, 'character bundle bundleVersion', 1);
  assert(['draft', 'candidate', 'approved', 'retired'].includes(bundle.promotionState), 'character bundle promotionState invalid');
  assert(Array.isArray(bundle.poseLibrary) && bundle.poseLibrary.length > 0, 'character bundle poseLibrary required');
  bundle.poseLibrary.forEach((pose, index) => validatePoseToken(pose, `character bundle poseLibrary[${index}]`));
  const poseIds = bundle.poseLibrary.map((pose) => pose.id);
  assertUnique(poseIds, 'character bundle pose ids');

  assert(Array.isArray(bundle.animationPackages) && bundle.animationPackages.length > 0, 'character bundle animationPackages required');
  const packageRecords = bundle.animationPackages.map((relativePath) => {
    assert(typeof relativePath === 'string' && relativePath, 'animation package path required');
    const packagePath = resolveInside(path.dirname(resolvedBundlePath), path.join(path.dirname(resolvedBundlePath), relativePath), 'animation package');
    assert(isInside(CONTENT_SOURCE_ROOT, packagePath), 'animation package must remain inside content-source');
    assert(!isInside(GENERATED_ROOT, packagePath), 'generated output cannot be used as source content');
    return { path: packagePath, relativePath, value: readJson(packagePath) };
  });
  const packageIds = packageRecords.map((record) => record.value.id);
  assertUnique(packageIds, 'animation package ids');
  const packageIdSet = new Set(packageIds);
  const poseIdSet = new Set(poseIds);
  packageRecords.forEach((record) => validateAnimationPackage(record.value, poseIdSet, packageIdSet, `animation package ${record.relativePath}`));

  assert(bundle.packageGroups && typeof bundle.packageGroups === 'object' && !Array.isArray(bundle.packageGroups), 'character bundle packageGroups required');
  for (const [group, ids] of Object.entries(bundle.packageGroups)) {
    assert(Array.isArray(ids), `character bundle packageGroups.${group} must be an array`);
    ids.forEach((id) => assert(packageIdSet.has(id), `character bundle packageGroups.${group} references unknown package ${id}`));
  }
  if (bundle.promotionState === 'approved') {
    assert(packageRecords.every((record) => record.value.promotionState === 'approved'), 'approved character bundle contains a non-approved animation package');
  }
  return { bundlePath: resolvedBundlePath, bundle, packages: packageRecords };
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(sortDeep(value), null, 2)}\n`;
}

function compileBundle(loaded) {
  const sortedPackages = [...loaded.packages].sort((a, b) => a.value.id.localeCompare(b.value.id));
  const digestInput = {
    bundle: loaded.bundle,
    packages: sortedPackages.map((record) => ({ relativePath: record.relativePath.replaceAll('\\', '/'), value: record.value }))
  };
  const sourceDigest = crypto.createHash('sha256').update(stableJson(digestInput)).digest('hex');
  const deployable = loaded.bundle.promotionState === 'approved' && sortedPackages.every((record) => {
    const item = record.value;
    return item.promotionState === 'approved'
      && item.provenance.humanApproval.state === 'approved'
      && item.sourceFrames.every((frame) => !frame.sourceUri.startsWith('fixture://'));
  });
  return {
    schemaVersion: '2.1.0-runtime',
    compilerVersion: COMPILER_VERSION,
    sourceDigest,
    fighterId: loaded.bundle.id,
    bundleVersion: loaded.bundle.bundleVersion,
    deployable,
    packageGroups: loaded.bundle.packageGroups,
    animations: sortedPackages.map(({ value }) => {
      const legacyFields = {
        id: value.id,
        version: value.version,
        simulationLength: value.simulationLength,
        exposures: value.exposures,
        entryPoseId: value.entryPose.id,
        exitPoseId: value.exitPose.id,
        transitions: value.transitions,
        landing: value.landing,
        combatTrack: value.combatTrack,
        presentationTrack: value.presentationTrack
      };
      if (value.promotionState === 'retired') return legacyFields;
      return {
        ...legacyFields,
        sourceFrames: value.sourceFrames,
        phases: value.phases,
        interruptPoses: value.interruptPoses,
        anchors: value.anchors,
        groundingTrack: value.groundingTrack,
        facingBehavior: value.facingBehavior,
        playbackPolicy: value.playbackPolicy,
        interruptionBehavior: value.interruptionBehavior,
        transitionCompatibility: value.transitionCompatibility,
        gameplayTimingStatus: value.gameplayTimingStatus,
        presentationSockets: value.presentationSockets,
        approvalRecords: value.approvalRecords
      };
    })
  };
}

function compileFromPath(bundlePath) {
  return compileBundle(loadAndValidateBundle(bundlePath));
}

function writeCompiledManifest(bundlePath, outputPath) {
  const resolvedOutput = resolveInside(GENERATED_ROOT, outputPath, 'compiled output');
  const manifest = compileFromPath(bundlePath);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, stableJson(manifest), 'utf8');
  return { manifest, outputPath: resolvedOutput };
}

function validateProductionSchemas() {
  const schemaRoot = path.join(ROOT, 'schemas', 'production');
  for (const name of PRODUCTION_SCHEMA_NAMES) readJson(path.join(schemaRoot, name));
  return PRODUCTION_SCHEMA_NAMES.length;
}

module.exports = {
  COMPILER_VERSION,
  CONTENT_SOURCE_ROOT,
  EVENT_ID_TEMPLATE,
  GENERATED_ROOT,
  PRODUCTION_SCHEMA_NAMES,
  TIMING_DURATION_BASIS,
  compileBundle,
  compileFromPath,
  loadAndValidateBundle,
  stableJson,
  validateAnimationPackage,
  validateProductionSchemas,
  writeCompiledManifest
};
