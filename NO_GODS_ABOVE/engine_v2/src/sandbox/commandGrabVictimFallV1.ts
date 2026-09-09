import type { CommandGrabVictimPose } from "./commandGrabMotionV1";

export const COMMAND_GRAB_VICTIM_FALL_V1_APPROVAL = "CURRENT_SANDBOX_ENEMY_ONLY_REACTION_MAPPING_FALL_FACING_HANDOFF_2026_08_12" as const;

export interface CommandGrabVictimFallFrame {
  readonly index: number;
  readonly sourceId: string;
  readonly archivedMannequinSourceId: string;
  readonly role: string;
  readonly victimRoot: readonly [number, number];
  readonly candidateSha256: string;
}

export const COMMAND_GRAB_VICTIM_FALL_V1_FRAMES: readonly CommandGrabVictimFallFrame[] = [
  { index: 1, sourceId: "knockdown_recovery_01_launch_reaction", archivedMannequinSourceId: "command_grab_victim_post_release_airborne", role: "post_release_airborne", victimRoot: [690, 980], candidateSha256: "9E916A8F924ECA05710404BFFC7FA4DB911961590377F25BB7EDDC0574A90B10" },
  { index: 2, sourceId: "knockdown_recovery_02_airborne_tumble", archivedMannequinSourceId: "command_grab_victim_airborne_carry_hang", role: "airborne_carry_hang", victimRoot: [630, 880], candidateSha256: "90F7EABB72C30CC68222D2235D5BC870D69C76E20C08980FAC13A357BC3E54FE" },
  { index: 3, sourceId: "knockdown_recovery_01_launch_reaction", archivedMannequinSourceId: "command_grab_victim_midair_shot_reaction", role: "midair_shot_reaction", victimRoot: [570, 870], candidateSha256: "A8CE179086F47887538B1F338A935A035100333A4EBCF79F0C909BC077FB4FE8" },
  { index: 4, sourceId: "knockdown_recovery_02_airborne_tumble", archivedMannequinSourceId: "command_grab_victim_post_shot_fall", role: "post_shot_fall", victimRoot: [540, 1080], candidateSha256: "BBAF2B2AC09344EEAB42C2885D19F022A8DF51874C32EF77417C28EC848B78CF" },
  { index: 5, sourceId: "knockdown_recovery_02_airborne_tumble", archivedMannequinSourceId: "command_grab_victim_descent_landing_prep", role: "descent_landing_prep", victimRoot: [520, 1290], candidateSha256: "403F30F78326355C9BC93E4BDA3443DA692BEBC0286297CDBEF44CFB4D79D841" },
  { index: 6, sourceId: "knockdown_recovery_03_ground_impact", archivedMannequinSourceId: "command_grab_victim_impact_downed", role: "impact_downed", victimRoot: [500, 1408], candidateSha256: "73BC5944CE52F9B21AB9529562A13FBDC94F4F5CBC8DEDBB68C657A86266F6BD" }
] as const;

export const COMMAND_GRAB_VICTIM_FACING_HANDOFF_V1 = {
  phase: "final_two_airborne_fall_poses",
  flipPoses: ["post_shot_fall", "fall_low"],
  landingPose: "downed",
  presentationRotationZDegrees: 0,
  landingKeepsFallFacing: true
} as const;

export function commandGrabVictimFacingForPose(pose: CommandGrabVictimPose, startingFacing: 1 | -1): 1 | -1 {
  const hasCrossedIntoFinalFallFacing = pose === "post_shot_fall" || pose === "fall_low" || pose === "downed";
  if (hasCrossedIntoFinalFallFacing) return startingFacing;
  return startingFacing === 1 ? -1 : 1;
}

export const COMMAND_GRAB_VICTIM_FALL_V1_REVIEW = {
  record: "SWAHILI_COMMAND_GRAB_VICTIM_FALL_V1",
  candidateOnly: true,
  deployable: false,
  productionRoster: false,
  approval: COMMAND_GRAB_VICTIM_FALL_V1_APPROVAL,
  facingHandoffPhase: COMMAND_GRAB_VICTIM_FACING_HANDOFF_V1.phase,
  facingFlipPoses: COMMAND_GRAB_VICTIM_FACING_HANDOFF_V1.flipPoses,
  landingKeepsFallFacing: COMMAND_GRAB_VICTIM_FACING_HANDOFF_V1.landingKeepsFallFacing,
  presentationRotationZDegrees: COMMAND_GRAB_VICTIM_FACING_HANDOFF_V1.presentationRotationZDegrees,
  attackerPixelsModified: false,
  enemyCharacterOnly: true,
  mannequinRuntimeSourcesAllowed: false,
  archivedMannequinFramesRuntimeLoaded: false
} as const;

export function commandGrabVictimFallFrameForPose(pose: CommandGrabVictimPose) {
  const indexByPose: Partial<Record<CommandGrabVictimPose, number>> = {
    airborne_release: 0,
    airborne_hang: 1,
    shot_react: 2,
    post_shot_fall: 3,
    fall_low: 4,
    downed: 5
  };
  const index = indexByPose[pose];
  return index === undefined ? null : COMMAND_GRAB_VICTIM_FALL_V1_FRAMES[index];
}
