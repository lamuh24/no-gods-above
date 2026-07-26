#!/usr/bin/env node
"use strict";

const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const DIST = path.join(REPO_ROOT, "NO_GODS_ABOVE", "engine_v2", "dist", "sandbox");
const load = (name) => require(path.join(DIST, `${name}.js`));

const walk = load("forwardWalkV2Review");
const dash = load("dashRepairV2");
const jump = load("jumpFallLandingV1");
const airDash = load("airDashMotionV1");
const turn = load("turnSideSwitchV1");
const knockdown = load("knockdownRecoveryV1");
const normals = load("groundNormalsPlaytestV1");
const commandGrab = load("commandGrabMotionV1");
const commandVictim = load("commandGrabVictimFallV1");
const sandbox = load("sandboxConfig");

function exposure(sourceId, ticks, role, extra = {}) {
  return { sourceId, ticks, role, ...extra };
}

function fromFrameRecords(frames) {
  return frames.map((frame) =>
    exposure(frame.sourceId, frame.exposureTicks, frame.role, {
      approvalSha256: frame.candidateSha256 || null,
      grounded: frame.grounded ?? null,
      support: frame.support || frame.supportFoot || null
    })
  );
}

function fromNormal(candidate) {
  return candidate.exposures.map((frame) => exposure(frame.sourceId, frame.ticks, frame.role));
}

const selectedWalk = walk.FORWARD_WALK_V2_TIMING_PROFILES[walk.FORWARD_WALK_V2_SELECTED_TIMING];
const groundNormals = normals.GROUND_NORMALS_PLAYTEST_V1;
const commandGrabSimulationExposures = [];
for (let simulationTick = 0; simulationTick < commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks; simulationTick++) {
  const sourceTick = commandGrab.commandGrabSourceTickAtSimulationTick(simulationTick);
  const frame = commandGrab.commandGrabFrameAtSourceTick(sourceTick);
  const previous = commandGrabSimulationExposures.at(-1);
  if (previous && previous.sourceId === frame.sourceId) {
    previous.ticks += 1;
  } else {
    commandGrabSimulationExposures.push(
      exposure(frame.sourceId, 1, frame.role, {
        approvalSha256: frame.candidateSha256 || null,
        sourceExposureTicks: frame.exposureTicks,
        attackerRoot: frame.attackerRoot,
        victimRoot: frame.victimRoot,
        victimPose: frame.victimPose
      })
    );
  }
}

const sequences = [
  {
    id: "idle",
    family: "universal_movement",
    reviewState: "approved_production_baseline",
    timingAuthority: "approved_idle_review_loop_non_combat",
    exposures: [
      exposure("idle_00", 8, "neutral_anchor"),
      exposure("idle_01", 8, "breath_shift"),
      exposure("idle_02", 8, "guarded_settle"),
      exposure("idle_03", 8, "loop_return")
    ]
  },
  {
    id: "walk_forward",
    family: "universal_movement",
    reviewState: "awaiting_human_forward_walk_v2_motion_review",
    timingAuthority: "candidate_contact_weighted_40_ticks",
    rootMotionAuthority: walk.FORWARD_WALK_V2_REVIEW_STATUS.collisionOwner,
    exposures: walk.FORWARD_WALK_V2_SLOT_REVIEW_METADATA.map((frame, index) =>
      exposure(frame.sourceId, selectedWalk.frameTicks[index], frame.role, {
        approvalSha256: frame.candidateSha256,
        supportFoot: frame.supportFoot,
        swingFoot: frame.swingFoot
      })
    )
  },
  {
    id: "dash_forward",
    family: "universal_movement",
    reviewState: "approved_current_forge_baseline",
    timingAuthority: "approved_review_motion_candidate_gameplay_distance_simulation_owned",
    rootMotionAuthority: dash.DASH_REPAIR_V2_REVIEW.movementAuthority,
    exposures: fromFrameRecords(dash.DASH_REPAIR_V2_FRAMES.forward)
  },
  {
    id: "dash_backward",
    family: "universal_movement",
    reviewState: "approved_current_forge_baseline",
    timingAuthority: "approved_review_motion_candidate_gameplay_distance_simulation_owned",
    rootMotionAuthority: dash.DASH_REPAIR_V2_REVIEW.movementAuthority,
    exposures: fromFrameRecords(dash.DASH_REPAIR_V2_FRAMES.backward)
  },
  {
    id: "jump_fall_landing",
    family: "air_movement",
    reviewState: "approved_current_forge_baseline",
    timingAuthority: "simulation_trajectory_with_review_exposure_defaults",
    rootMotionAuthority: jump.JUMP_FALL_LANDING_V1_REVIEW.trajectoryAuthority,
    exposures: jump.JUMP_FALL_LANDING_V1_FRAMES.map((frame, index) =>
      exposure(
        frame.sourceId,
        [4, 3, 4, 3, 4, 6, 9, 12][index],
        frame.role,
        { verticalState: frame.verticalState }
      )
    )
  },
  {
    id: "air_dash_forward",
    family: "air_movement",
    reviewState: "approved_current_sandbox_baseline",
    timingAuthority: "candidate_12_ticks",
    rootMotionAuthority: airDash.AIR_DASH_MOTION_V1_REVIEW.rootMotionAuthority,
    exposures: fromFrameRecords(airDash.AIR_DASH_MOTION_V1_FRAMES.forward)
  },
  {
    id: "air_dash_backward",
    family: "air_movement",
    reviewState: "approved_current_sandbox_baseline",
    timingAuthority: "candidate_12_ticks",
    rootMotionAuthority: airDash.AIR_DASH_MOTION_V1_REVIEW.rootMotionAuthority,
    exposures: fromFrameRecords(airDash.AIR_DASH_MOTION_V1_FRAMES.backward)
  },
  {
    id: "air_dash_side_switch",
    family: "air_movement",
    reviewState: "approved_current_sandbox_baseline",
    timingAuthority: "candidate_12_ticks",
    rootMotionAuthority: airDash.AIR_DASH_SIDE_SWITCH_V2_REVIEW.rootMotionAuthority,
    exposures: [
      exposure("air_dash_forward_01_air_brace", 2, "air_brace"),
      exposure("air_dash_forward_02_forward_burst", 3, "forward_burst"),
      exposure("air_dash_forward_03_forward_travel", 2, "forward_travel_pre_cross"),
      exposure(airDash.AIR_DASH_SIDE_SWITCH_V2_FRAME.sourceId, 1, airDash.AIR_DASH_SIDE_SWITCH_V2_FRAME.role),
      exposure("air_dash_backward_03_max_retreat", 2, "backdash_carry_post_cross"),
      exposure("air_dash_backward_04_air_brake", 2, "backdash_brake_post_cross")
    ]
  },
  {
    id: "standing_to_crouch",
    family: "universal_transitions",
    reviewState: "awaiting_human_stance_transition_motion_review",
    timingAuthority: "candidate_11_ticks",
    exposures: [
      exposure("idle_00", 3, "idle_departure"),
      exposure("crouching_block_release", 3, "controlled_compression_connector"),
      exposure("crouch", 5, "crouch_settle")
    ]
  },
  {
    id: "crouch_to_standing",
    family: "universal_transitions",
    reviewState: "awaiting_human_stance_transition_motion_review",
    timingAuthority: "candidate_11_ticks",
    exposures: [
      exposure("crouch", 3, "crouch_departure"),
      exposure("crouching_block_release", 3, "controlled_rise_connector"),
      exposure("idle_00", 5, "idle_settle")
    ]
  },
  {
    id: "turn_side_switch",
    family: "universal_transitions",
    reviewState: turn.TURN_SIDE_SWITCH_V1_APPROVAL,
    timingAuthority: "candidate_12_ticks",
    rootMotionAuthority: "simulation_owned_zero_fighter_displacement",
    exposures: turn.TURN_SIDE_SWITCH_V1_EXPOSURES.map((frame) =>
      exposure(frame.sourceId, frame.exposureTicks, frame.role, { facingPhase: frame.facingPhase })
    )
  },
  {
    id: "knockdown_recovery",
    family: "reactions_and_recovery",
    reviewState: knockdown.KNOCKDOWN_RECOVERY_MOTION_V1_APPROVAL,
    timingAuthority: "approved_motion_review_timing_sandbox_combat_values_non_authoritative",
    rootMotionAuthority: knockdown.KNOCKDOWN_RECOVERY_MOTION_V1_REVIEW.rootMotionOwner,
    exposures: fromFrameRecords(knockdown.KNOCKDOWN_RECOVERY_MOTION_V1_FRAMES)
  },
  {
    id: "standing_light",
    family: "ground_normals",
    reviewState: "approved_current_baseline_with_polish_debt",
    timingAuthority: "approved_current_review_baseline",
    exposures: fromNormal(groundNormals.standing_light),
    combatCandidate: {
      startup: groundNormals.standing_light.startupTicks,
      active: groundNormals.standing_light.activeTicks,
      recovery: groundNormals.standing_light.recoveryTicks
    }
  },
  {
    id: "standing_heavy",
    family: "ground_normals",
    reviewState: sandbox.SANDBOX_TUNING.standingHeavy.approval,
    timingAuthority: sandbox.SANDBOX_TUNING.standingHeavy.authority,
    exposures: sandbox.STANDING_HEAVY_EXPOSURES.map((frame) =>
      exposure(frame.sourceId, frame.end - frame.start + 1, frame.role, {
        supportFoot: frame.supportFoot
      })
    ),
    combatCandidate: {
      authoritative: true,
      startup: 24,
      active: 5,
      recovery: 46
    }
  },
  {
    id: "crouching_light",
    family: "ground_normals",
    reviewState: normals.CROUCHING_LIGHT_MOTION_V1_APPROVAL,
    timingAuthority: "approved_17_ticks",
    exposures: fromNormal(groundNormals.crouching_light),
    combatCandidate: {
      startup: groundNormals.crouching_light.startupTicks,
      active: groundNormals.crouching_light.activeTicks,
      recovery: groundNormals.crouching_light.recoveryTicks
    }
  },
  {
    id: "crouching_medium",
    family: "ground_normals",
    reviewState: normals.CROUCHING_MEDIUM_MOTION_V1_REVIEW_STATUS,
    timingAuthority: "candidate_responsive_medium_20_ticks",
    exposures: fromNormal(groundNormals.crouching_medium),
    combatCandidate: {
      startup: groundNormals.crouching_medium.startupTicks,
      active: groundNormals.crouching_medium.activeTicks,
      recovery: groundNormals.crouching_medium.recoveryTicks
    }
  },
  {
    id: "crouching_heavy",
    family: "ground_normals",
    reviewState: normals.CROUCHING_HEAVY_MOTION_V1_REVIEW_STATUS,
    timingAuthority: "candidate_responsive_heavy_sweep_32_ticks",
    exposures: fromNormal(groundNormals.crouching_heavy),
    combatCandidate: {
      startup: groundNormals.crouching_heavy.startupTicks,
      active: groundNormals.crouching_heavy.activeTicks,
      recovery: groundNormals.crouching_heavy.recoveryTicks
    }
  },
  {
    id: "command_grab_v2",
    family: "grabs",
    reviewState: "approved_attacker_motion_with_candidate_victim_fall_and_combat_timing",
    timingAuthority: "temporary_sandbox_values_not_production_balance",
    rootMotionAuthority: "deterministic_sandbox_simulation",
    exposures: commandGrabSimulationExposures,
    combatCandidate: {
      startup: Math.ceil(commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.captureSourceTick / commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate),
      active: 1,
      recovery:
        commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks
        - Math.ceil(commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.captureSourceTick / commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.playbackRate)
        - 1
    },
    victimFrames: commandVictim.COMMAND_GRAB_VICTIM_FALL_V1_FRAMES.map((frame) => ({
      sourceId: frame.sourceId,
      role: frame.role,
      victimRoot: frame.victimRoot,
      approvalSha256: frame.candidateSha256
    })),
    interactionContract: {
      captureSourceTick: commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.captureSourceTick,
      releaseSourceTick: commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.releaseSourceTick,
      shotSourceTick: commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.shotSourceTick,
      landingSourceTick: commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.landingSourceTick,
      simulationTotalTicks: commandGrab.COMMAND_GRAB_MOTION_V1_REVIEW.simulationTotalTicks,
      authoritative: false
    }
  }
];

const result = {
  schemaVersion: 1,
  record: "SWAHILI_MOVESET_GOAL_V1_ENGINE_SEQUENCE_SNAPSHOT",
  generatedAt: "2026-07-25",
  source: "compiled Engine V2 sandbox modules",
  candidateOnly: true,
  deployable: false,
  productionRoster: false,
  sequenceCount: sequences.length,
  sequences
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
