import { fighterDefinitions } from "../data/fighters";
import { FighterState, MatchState } from "../core/types";
import { attackFrameTracks, frameAcrossWindow } from "./attackFrameTracks";
import { SwahiliStageFrameId } from "./spriteSources";
import { commandGrabFrameAtSourceTick, commandGrabSourceTickAtSimulationTick, COMMAND_GRAB_MOTION_V1_REVIEW } from "../sandbox/commandGrabMotionV1";

interface Exposure {
  readonly frame: SwahiliStageFrameId;
  readonly ticks: number;
}

const LIGHT_REACTION: readonly Exposure[] = [
  { frame: "light_hit_entry", ticks: 2 },
  { frame: "light_hit_reaction", ticks: 4 },
  { frame: "light_hit_recovery", ticks: Number.POSITIVE_INFINITY }
];

const HEAVY_REACTION: readonly Exposure[] = [
  { frame: "heavy_hit_entry", ticks: 3 },
  { frame: "heavy_hit_reaction", ticks: 8 },
  { frame: "heavy_hit_recovery", ticks: Number.POSITIVE_INFINITY }
];

const AIRBORNE_REACTION: readonly Exposure[] = [
  { frame: "airborne_launch_reaction", ticks: 4 },
  { frame: "airborne_tumble", ticks: Number.POSITIVE_INFINITY }
];

const GROUNDED_KNOCKDOWN: readonly Exposure[] = [
  { frame: "knockdown_ground_impact", ticks: 3 },
  { frame: "knockdown_impact_settle", ticks: 4 },
  { frame: "knockdown_face_up", ticks: Number.POSITIVE_INFINITY }
];

const GETUP: readonly Exposure[] = [
  { frame: "getup_shoulder_roll", ticks: 3 },
  { frame: "getup_roll_brace", ticks: 3 },
  { frame: "getup_push_to_kneel", ticks: 4 },
  { frame: "getup_neutral", ticks: 4 },
  { frame: "getup_rise_to_stand", ticks: Number.POSITIVE_INFINITY }
];

const RISING_VERTICAL_SPEED = 3;

const WALK_FORWARD: readonly Exposure[] = [
  { frame: "walk_forward_contact", ticks: 6 },
  { frame: "walk_forward_neutral_departure", ticks: 5 },
  { frame: "walk_forward_passing", ticks: 4 },
  { frame: "walk_forward_opposite_contact", ticks: 5 },
  { frame: "walk_forward_return", ticks: 6 },
  { frame: "walk_forward_opposite_down", ticks: 5 },
  { frame: "walk_forward_opposite_passing", ticks: 4 },
  { frame: "walk_forward_opposite_up_return", ticks: 5 }
];
const WALK_BACKWARD: readonly SwahiliStageFrameId[] = [
  "walk_backward_rearward_contact", "walk_backward_neutral_departure",
  "walk_backward_opposite_contact", "walk_backward_passing", "walk_backward_return"
];
const DASH_FORWARD: readonly SwahiliStageFrameId[] = [
  "dash_forward_startup", "dash_forward_push", "dash_forward_launch",
  "dash_forward_travel", "dash_forward_catch", "dash_forward_recovery"
];
const BACKDASH: readonly SwahiliStageFrameId[] = [
  "backdash_load", "backdash_push", "backdash_retreat", "backdash_apex",
  "backdash_landing", "backdash_recovery"
];

function cycleFrame(track: readonly SwahiliStageFrameId[], cursor: number, ticksPerFrame: number) {
  return track[Math.floor(Math.max(0, cursor) / ticksPerFrame) % track.length];
}

function frameAcrossPhase(track: readonly SwahiliStageFrameId[], cursor: number, duration: number) {
  return frameAcrossWindow(track, Math.max(0, Math.floor(cursor)), Math.max(track.length, duration)) ?? track.at(-1)!;
}

function exposureAt(track: readonly Exposure[], cursor: number): SwahiliStageFrameId {
  let remaining = Math.max(0, Math.floor(cursor));
  for (const exposure of track) {
    if (remaining < exposure.ticks) return exposure.frame;
    remaining -= exposure.ticks;
  }
  return track.at(-1)!.frame;
}

function cycleExposureAt(track: readonly Exposure[], cursor: number): SwahiliStageFrameId {
  const cycleTicks = track.reduce((sum, exposure) => sum + exposure.ticks, 0);
  const cycleCursor = ((Math.floor(cursor) % cycleTicks) + cycleTicks) % cycleTicks;
  return exposureAt(track, cycleCursor);
}

/**
 * Attacker artwork for the move the simulation is currently running. Returns null when the fighter
 * is not attacking or the move has no authored track, so the caller falls through to its own
 * neutral selection.
 */
export function attackStageFrameFor(fighter: FighterState): SwahiliStageFrameId | null {
  if (fighter.phase !== "attack" || !fighter.currentAttack) return null;
  const definition = fighterDefinitions[fighter.kind]?.attacks[fighter.currentAttack];
  const track = attackFrameTracks[fighter.currentAttack];
  if (!definition || !track) return null;
  const cursor = Math.max(0, Math.floor(fighter.phaseTick));
  if (cursor < definition.startup) return frameAcrossWindow(track.startup, cursor, definition.startup, track.exposureTicks?.startup);
  const activeCursor = cursor - definition.startup;
  if (activeCursor < definition.active) return frameAcrossWindow(track.active, activeCursor, definition.active, track.exposureTicks?.active);
  return frameAcrossWindow(track.recovery, activeCursor - definition.active, definition.recovery, track.exposureTicks?.recovery);
}

/**
 * Universal-throw body art follows the deterministic throw interaction. Attacker and victim are
 * selected independently so capture art can never leak onto the defender.
 */
export function throwStageFrameFor(fighter: FighterState, state: MatchState): SwahiliStageFrameId | null {
  const interaction = state.throwInteraction;
  if (!interaction) return null;
  const attacker = state.fighters[interaction.attacker];
  const definition = fighterDefinitions[attacker.kind]?.throws[interaction.throwId];
  if (!definition) return null;

  if (interaction.throwId === "command_grab") {
    const sourceTick = commandGrabSourceTickAtSimulationTick(interaction.tick);
    if (fighter.id === interaction.attacker) {
      return commandGrabFrameAtSourceTick(sourceTick).sourceId as SwahiliStageFrameId;
    }
    if (fighter.id === interaction.defender && fighter.phase === "thrown") {
      if (sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.landingSourceTick) return "knockdown_ground_impact";
      if (sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.shotSourceTick) return "airborne_tumble";
      if (sourceTick >= COMMAND_GRAB_MOTION_V1_REVIEW.releaseSourceTick) return "airborne_launch_reaction";
      return "heavy_hit_reaction";
    }
    return null;
  }

  if (fighter.id === interaction.defender && fighter.phase === "thrown") {
    return interaction.tick <= definition.releaseTick ? "airborne_launch_reaction" : "airborne_tumble";
  }
  if (fighter.id !== interaction.attacker) return null;
  if (fighter.phase === "throw_startup") return "universal_grab_reach";
  if (fighter.phase === "throw_whiff") return "universal_grab_recovery";
  if (fighter.phase !== "throw_active") return null;

  const cursor = Math.max(0, interaction.tick);
  if (cursor <= definition.connectTick + 2) return "universal_grab_capture";
  if (cursor < definition.releaseTick) {
    return interaction.throwId === "back_throw"
      ? "universal_backward_throw_preparation"
      : "universal_forward_throw_preparation";
  }
  if (cursor <= definition.releaseTick + 5) {
    return interaction.throwId === "back_throw"
      ? "universal_backward_throw_commitment"
      : "universal_forward_throw_commitment";
  }
  return "universal_grab_recovery";
}

/** Airborne artwork driven by the simulation's own vertical velocity, never by wall-clock time. */
function airborneStageFrame(fighter: FighterState): SwahiliStageFrameId {
  if (fighter.phase === "jump" && fighter.phaseTick < 2) return "jump_takeoff";
  if (fighter.vy < -RISING_VERTICAL_SPEED) return "jump_rising";
  if (fighter.vy <= RISING_VERTICAL_SPEED) return "jump_apex";
  return "jump_falling";
}

export function stageFrameFor(fighter: FighterState, state: MatchState): SwahiliStageFrameId {
  const throwFrame = throwStageFrameFor(fighter, state);
  if (throwFrame) return throwFrame;
  if (fighter.phase === "hit_reaction" && fighter.hitstun > 0) {
    if (!fighter.grounded) return exposureAt(AIRBORNE_REACTION, fighter.phaseTick);
    return exposureAt(fighter.hitReactionWeight === "heavy" ? HEAVY_REACTION : LIGHT_REACTION, fighter.phaseTick);
  }
  if (fighter.phase === "knockdown") {
    if (!fighter.grounded) return "airborne_tumble";
    return exposureAt(GROUNDED_KNOCKDOWN, fighter.phaseTick);
  }
  if (fighter.phase === "getup") return exposureAt(GETUP, fighter.phaseTick);
  if (fighter.phase === "air_recovery") return "airborne_tumble";
  const attackFrame = attackStageFrameFor(fighter);
  if (attackFrame) return attackFrame;
  if (fighter.phase === "jump_startup") return "jump_anticipation";
  if (fighter.phase === "jump" || !fighter.grounded) return airborneStageFrame(fighter);
  if (fighter.phase === "landing") return "jump_soft_landing";
  if (fighter.phase === "crouch") return "crouch_stance";
  if (fighter.phase === "walk_forward") return cycleExposureAt(WALK_FORWARD, fighter.phaseTick);
  if (fighter.phase === "walk_backward") return cycleFrame(WALK_BACKWARD, fighter.phaseTick, 5);
  if (fighter.phase === "dash") return frameAcrossPhase(DASH_FORWARD, fighter.phaseTick, fighterDefinitions[fighter.kind].movement.dashDuration);
  if (fighter.phase === "backdash") return frameAcrossPhase(BACKDASH, fighter.phaseTick, fighterDefinitions[fighter.kind].movement.backdashDuration);
  if (fighter.phase === "block") {
    if (fighter.crouchBlocking) return fighter.phaseTick < 2 ? "crouching_block_entry" : "crouching_block";
    return fighter.phaseTick < 2 ? "standing_block_entry" : "standing_block";
  }
  // Roman Cancel and Burst currently communicate through authored VFX/system overlays; Swahili has
  // no approved body-motion clip for either system. Keep a stable authored neutral pose instead of
  // falsely labelling reaction or attack art as a system animation.
  if (fighter.phase === "roman_cancel" || fighter.phase === "burst") return "idle_01";
  const idleFrames: SwahiliStageFrameId[] = ["idle_00", "idle_01", "idle_02", "idle_03"];
  return idleFrames[Math.floor(state.tick / 15) % idleFrames.length];
}
