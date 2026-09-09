import type { CommandGrabRuntimeV1, SandboxFighterState } from "./types";

export const COMMAND_GRAB_FINISHER_REVIEW_V1_APPROVAL = "awaiting_human_command_grab_far_launch_visual_hit_review" as const;

const SOURCE_ROOT = { x: 768, y: 1408 } as const;
const SOURCE_PIXELS_TO_SIMULATION_UNITS = 0.165;

export interface CommandGrabFarLaunchPoint {
  readonly sourceTick: number;
  readonly oppositeSideDistance: number;
  readonly victimY: number;
  readonly phase: "release_impulse" | "far_airborne_launch" | "shot_suspension" | "post_shot_descent" | "grounded_finish";
}

const FAR_LAUNCH_KEYS: readonly CommandGrabFarLaunchPoint[] = [
  { sourceTick: 51, oppositeSideDistance: 20, victimY: -65, phase: "release_impulse" },
  { sourceTick: 52, oppositeSideDistance: 42, victimY: -70, phase: "release_impulse" },
  { sourceTick: 53, oppositeSideDistance: 72, victimY: -74, phase: "release_impulse" },
  { sourceTick: 54, oppositeSideDistance: 106, victimY: -78, phase: "release_impulse" },
  { sourceTick: 55, oppositeSideDistance: 140, victimY: -80, phase: "release_impulse" },
  { sourceTick: 56, oppositeSideDistance: 169, victimY: -82, phase: "far_airborne_launch" },
  { sourceTick: 57, oppositeSideDistance: 193, victimY: -87, phase: "far_airborne_launch" },
  { sourceTick: 59, oppositeSideDistance: 222, victimY: -91, phase: "far_airborne_launch" },
  { sourceTick: 61, oppositeSideDistance: 239, victimY: -92, phase: "far_airborne_launch" },
  { sourceTick: 63, oppositeSideDistance: 250, victimY: -92, phase: "shot_suspension" },
  { sourceTick: 64, oppositeSideDistance: 257, victimY: -89, phase: "shot_suspension" },
  { sourceTick: 66, oppositeSideDistance: 266, victimY: -89, phase: "shot_suspension" },
  { sourceTick: 69, oppositeSideDistance: 278, victimY: -54, phase: "post_shot_descent" },
  { sourceTick: 72, oppositeSideDistance: 284, victimY: -20, phase: "post_shot_descent" },
  { sourceTick: 73, oppositeSideDistance: 286, victimY: 0, phase: "grounded_finish" },
  { sourceTick: 84, oppositeSideDistance: 286, victimY: 0, phase: "grounded_finish" }
] as const;

export const COMMAND_GRAB_FINISHER_REVIEW_V1 = {
  record: "SWAHILI_COMMAND_GRAB_FAR_LAUNCH_VISUAL_HIT_V1",
  status: "candidate-only",
  deployable: false,
  productionRoster: false,
  approval: COMMAND_GRAB_FINISHER_REVIEW_V1_APPROVAL,
  attackerPixelsModified: false,
  victimPixelsModified: false,
  trajectoryAuthority: "sandbox_simulation_owned_collision_safe",
  launch: {
    startsAtSourceTick: 52,
    shotDistanceFromSideSwitchOrigin: 257,
    finalDistanceFromSideSwitchOrigin: 286,
    stageMargin: 26,
    interpolation: "deterministic_piecewise_linear_source_tick_curve"
  },
  shot: {
    sourceTick: 64,
    registeredHitCount: 1,
    visibleImpactCount: 1,
    muzzleFlashSourceTicks: [64, 65] as const,
    tracerSourceTicks: [64, 64] as const,
    impactSourceTicks: [64, 66] as const,
    attackerSourceId: "command_grab_20_midair_shot",
    victimSourceId: "knockdown_recovery_01_launch_reaction",
    muzzleSocketSourcePixels: [250, 660] as const,
    victimTorsoImpactSocketSourcePixels: [700, 850] as const,
    mirrorsWithFacing: true,
    worldAnchoredDuringVisibleTick: true
  },
  rejectionConditions: [
    "victim_teleports_or_reverses_after_release",
    "victim_lands_before_source_tick_73",
    "visual_impact_count_differs_from_registered_hit_count",
    "tracer_points_away_from_victim_in_authored_or_mirrored_playback",
    "launch_exits_stage_bounds",
    "runtime_uses_mannequin_or_non_enemy_victim_art",
    "approved_attacker_or_victim_pixels_change"
  ]
} as const;

function lerp(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

export function commandGrabFarLaunchPointAtSourceTick(sourceTick: number): CommandGrabFarLaunchPoint | null {
  if (sourceTick < COMMAND_GRAB_FINISHER_REVIEW_V1.launch.startsAtSourceTick) return null;
  const bounded = Math.max(FAR_LAUNCH_KEYS[0].sourceTick, Math.min(FAR_LAUNCH_KEYS.at(-1)!.sourceTick, sourceTick));
  const rightIndex = FAR_LAUNCH_KEYS.findIndex((key) => key.sourceTick >= bounded);
  const right = FAR_LAUNCH_KEYS[Math.max(0, rightIndex)];
  const left = FAR_LAUNCH_KEYS[Math.max(0, rightIndex - 1)];
  if (right.sourceTick === left.sourceTick) return { ...right, sourceTick: bounded };
  const amount = (bounded - left.sourceTick) / (right.sourceTick - left.sourceTick);
  return {
    sourceTick: bounded,
    oppositeSideDistance: lerp(left.oppositeSideDistance, right.oppositeSideDistance, amount),
    victimY: lerp(left.victimY, right.victimY, amount),
    phase: right.phase
  };
}

export interface CommandGrabFinisherVfxPresentation {
  readonly active: boolean;
  readonly showMuzzleFlash: boolean;
  readonly showTracer: boolean;
  readonly showImpact: boolean;
  readonly muzzle: readonly [number, number];
  readonly impact: readonly [number, number];
  readonly mirrored: boolean;
  readonly eventId: string | null;
  readonly visibleImpactCount: number;
}

function sourceSocketToSimulation(
  rootX: number,
  rootY: number,
  facing: 1 | -1,
  presentationScale: number,
  socket: readonly [number, number]
): readonly [number, number] {
  return [
    rootX + facing * (socket[0] - SOURCE_ROOT.x) * SOURCE_PIXELS_TO_SIMULATION_UNITS * presentationScale,
    rootY + (socket[1] - SOURCE_ROOT.y) * SOURCE_PIXELS_TO_SIMULATION_UNITS * presentationScale
  ];
}

export function commandGrabFinisherVfxPresentation(
  runtime: CommandGrabRuntimeV1,
  attacker: SandboxFighterState,
  victim: SandboxFighterState
): CommandGrabFinisherVfxPresentation {
  const shot = COMMAND_GRAB_FINISHER_REVIEW_V1.shot;
  const sourceTick = runtime.sourceTick;
  const showMuzzleFlash = runtime.captured && sourceTick >= shot.muzzleFlashSourceTicks[0] && sourceTick <= shot.muzzleFlashSourceTicks[1];
  const showTracer = runtime.captured && sourceTick >= shot.tracerSourceTicks[0] && sourceTick <= shot.tracerSourceTicks[1];
  const showImpact = runtime.captured && sourceTick >= shot.impactSourceTicks[0] && sourceTick <= shot.impactSourceTicks[1];
  const muzzle = sourceSocketToSimulation(runtime.attackerStartX, 0, runtime.startingFacing, 1, shot.muzzleSocketSourcePixels);
  const impact = sourceSocketToSimulation(victim.x, victim.y, victim.facing, victim.presentationScale, shot.victimTorsoImpactSocketSourcePixels);
  return {
    active: showMuzzleFlash || showTracer || showImpact,
    showMuzzleFlash,
    showTracer,
    showImpact,
    muzzle,
    impact,
    mirrored: runtime.startingFacing < 0,
    eventId: runtime.shotVisualHitRegistered ? "command_grab_finishing_shot_visual_hit_v1" : null,
    visibleImpactCount: showImpact ? 1 : 0
  };
}
