import type { AttackId } from "../../core/types";
import type { CharacterId } from "../roster";

/**
 * Character knowledge for the CPU. Every entry is a real command the player could input;
 * the CPU never starts a move by writing simulation state. Frame data (startup, reach,
 * recovery) is read from the live attack definitions at runtime, not duplicated here.
 */
export type Button = "light" | "medium" | "heavy" | "special" | "throw" | "ultimate";
/** Direction relative to the fighter's facing. */
export type Dir = "F" | "B" | "U" | "D" | "UF" | "DB" | "DF";

export interface Command { attack: AttackId; buttons: Button[]; dir?: Dir; air?: boolean; }
export interface JumpStep { jump: "cancel" | "forward"; }
export type RouteStep = Command | JumpStep;

export interface ComboRoute {
  id: string;
  /** Opener is steps[0]; every later step is taken only after the previous one connects. */
  steps: RouteStep[];
  /** Largest horizontal gap between bodies at which the opener connects. Filled at runtime. */
  role: "confirm" | "punish" | "anti_air" | "meter" | "jump_in";
  requiresMeter?: boolean;
  /** Steps that may still be taken when the previous step was blocked (a safe blockstring). */
  blockstringLength?: number;
}

export interface CpuKit {
  character: CharacterId;
  preferredRange: [number, number];
  jab: Command; lowJab: Command;
  pokes: Command[];
  lows: Command[];
  antiAir: Command[];
  projectiles: Command[];
  jumpInAttack: Command;
  counterStance?: Command;
  routes: ComboRoute[];
  /** Tactic weights, tuned so each character reads as itself. */
  style: { zoning: number; rushdown: number; jumpIns: number; patience: number; throws: number };
}

const c = (attack: AttackId, buttons: Button[], dir?: Dir, air?: boolean): Command => ({ attack, buttons, ...(dir ? { dir } : {}), ...(air ? { air: true } : {}) });
const jumpCancel: JumpStep = { jump: "cancel" };

const LAMUH: CpuKit = {
  character: "lamuh",
  preferredRange: [140, 230],
  jab: c("standing_light", ["light"]),
  lowJab: c("crouching_light", ["light"], "D"),
  pokes: [c("crouching_medium", ["medium"], "D"), c("standing_medium", ["medium"]), c("legacy_ascend_step_light", ["special", "light"], "F")],
  lows: [c("crouching_medium", ["medium"], "D"), c("legacy_aura_sweep_medium", ["special", "medium"], "D")],
  antiAir: [c("legacy_heaven_splitter_light", ["special", "light"], "U"), c("crouching_heavy", ["heavy"], "D")],
  projectiles: [c("legacy_celestial_palm_medium", ["special", "medium"]), c("legacy_celestial_palm_heavy", ["special", "heavy"]), c("legacy_celestial_palm_light", ["special", "light"])],
  jumpInAttack: c("air_medium", ["medium"], undefined, true),
  counterStance: c("legacy_divine_vanish_heavy", ["special", "heavy"], "B"),
  routes: [
    { id: "lamuh_low_launch", role: "confirm", blockstringLength: 2, steps: [
      c("crouching_light", ["light"], "D"), c("crouching_medium", ["medium"], "D"), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_mid_launch", role: "confirm", blockstringLength: 2, steps: [
      c("standing_light", ["light"]), c("standing_medium", ["medium"]), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_ascend_chain", role: "punish", steps: [
      c("standing_light", ["light"]), c("standing_medium", ["medium"]), c("legacy_ascend_step_heavy", ["special", "heavy"], "F")] },
    { id: "lamuh_crown", role: "meter", requiresMeter: true, steps: [
      c("crouching_light", ["light"], "D"), c("crouching_medium", ["medium"], "D"), c("legacy_crown_of_no_gods", ["ultimate"])] },
    // Versus launcher follow-ups: every Heaven Splitter and the Ascend backspring jump-cancel into an air chase.
    { id: "lamuh_splitter_launch", role: "confirm", blockstringLength: 2, steps: [
      c("crouching_light", ["light"], "D"), c("crouching_medium", ["medium"], "D"), c("legacy_heaven_splitter_medium", ["special", "medium"], "U"), jumpCancel,
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("legacy_radiant_dive_medium", ["special", "medium"], undefined, true),
      // Radiant Dive Medium extends: Lamuh rebounds off the strike and keeps juggling.
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_heavy_splitter", role: "punish", steps: [
      c("standing_light", ["light"]), c("legacy_heaven_splitter_heavy", ["special", "heavy"], "U"), jumpCancel,
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_ascend_launch", role: "confirm", steps: [
      c("crouching_medium", ["medium"], "D"), c("legacy_ascend_step", ["special", "medium"], "F"), jumpCancel,
      c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_splitter_aa", role: "anti_air", steps: [c("legacy_heaven_splitter_light", ["special", "light"], "U"), jumpCancel,
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "lamuh_jump_in", role: "jump_in", steps: [
      c("air_medium", ["medium"], undefined, true), c("crouching_medium", ["medium"], "D"), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] }
  ],
  style: { zoning: 0.9, rushdown: 1.0, jumpIns: 0.8, patience: 0.7, throws: 0.9 }
};

const SWAHILI: CpuKit = {
  character: "swahili",
  preferredRange: [170, 260],
  jab: c("standing_light", ["light"]),
  lowJab: c("crouching_light", ["light"], "D"),
  pokes: [c("crouching_medium", ["medium"], "D"), c("standing_medium", ["medium"]), c("special_down_light", ["special", "light"], "D"), c("special_forward_light", ["special", "light"], "F")],
  lows: [c("crouching_medium", ["medium"], "D"), c("special_down_light", ["special", "light"], "D")],
  antiAir: [c("special_up_medium", ["special", "medium"], "U"), c("crouching_heavy", ["heavy"], "D")],
  projectiles: [c("special_neutral_heavy", ["special", "heavy"]), c("special_back_light", ["special", "light"], "B")],
  jumpInAttack: c("air_medium", ["medium"], undefined, true),
  counterStance: c("special_back_heavy", ["special", "heavy"], "B"),
  routes: [
    { id: "swahili_low_launch", role: "confirm", blockstringLength: 2, steps: [
      c("crouching_light", ["light"], "D"), c("crouching_medium", ["medium"], "D"), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] },
    { id: "swahili_mid_launch", role: "confirm", blockstringLength: 2, steps: [
      c("standing_light", ["light"]), c("standing_medium", ["medium"]), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_light", ["light"], undefined, true), c("air_medium", ["medium"], undefined, true), c("special_air_heavy", ["special", "heavy"], undefined, true)] },
    { id: "swahili_heavy_chain", role: "punish", steps: [
      c("standing_medium", ["medium"]), c("standing_heavy", ["heavy"])] },
    { id: "swahili_vertical_audit", role: "anti_air", steps: [c("special_up_medium", ["special", "medium"], "U")] },
    { id: "swahili_jump_in", role: "jump_in", steps: [
      c("air_medium", ["medium"], undefined, true), c("crouching_medium", ["medium"], "D"), c("crouching_heavy", ["heavy"], "D"), jumpCancel,
      c("air_medium", ["medium"], undefined, true), c("air_heavy", ["heavy"], undefined, true)] }
  ],
  style: { zoning: 0.8, rushdown: 0.75, jumpIns: 0.9, patience: 1.25, throws: 0.6 }
};

const CELESTE:CpuKit={
 character:"celeste",preferredRange:[80,150],jab:c("standing_light",["light"]),lowJab:c("crouching_light",["light"],"D"),
 pokes:[c("standing_medium",["medium"]),c("crouching_medium",["medium"],"D")],lows:[c("crouching_medium",["medium"],"D")],
 antiAir:[c("rising_note",["special","light"],"U"),c("ascending_aria",["special","medium"],"U")],
 projectiles:[c("ovation_staccato",["special","light"]),c("ovation_procession",["special","medium"]),c("ovation_fortissimo",["special","heavy"])],
 jumpInAttack:c("air_medium",["medium"],undefined,true),counterStance:c("reversal_measure",["special","medium"],"B"),
 routes:[
  {id:"celeste_mid_confirm",role:"confirm",blockstringLength:2,steps:[c("standing_light",["light"]),c("standing_medium",["medium"]),c("standing_heavy",["heavy"])]},
  {id:"celeste_low_launch",role:"confirm",blockstringLength:2,steps:[c("crouching_light",["light"],"D"),c("crouching_medium",["medium"],"D"),c("ascending_aria",["special","medium"],"U"),jumpCancel,c("air_light",["light"],undefined,true),c("air_medium",["medium"],undefined,true),c("air_heavy",["heavy"],undefined,true)]},
  {id:"celeste_punish",role:"punish",steps:[c("standing_medium",["medium"]),c("standing_heavy",["heavy"])]},
  {id:"celeste_anti_air",role:"anti_air",steps:[c("ascending_aria",["special","medium"],"U"),jumpCancel,c("air_light",["light"],undefined,true),c("air_medium",["medium"],undefined,true),c("air_heavy",["heavy"],undefined,true)]},
  {id:"celeste_octava",role:"meter",requiresMeter:true,steps:[c("standing_medium",["medium"]),c("octava",["ultimate"])]}
 ],style:{zoning:.7,rushdown:1.2,jumpIns:.9,patience:.8,throws:1.0}
};
export const CPU_KITS: Record<CharacterId, CpuKit> = { lamuh: LAMUH, swahili: SWAHILI, celeste: CELESTE };
export function isJump(step: RouteStep): step is JumpStep { return (step as JumpStep).jump !== undefined; }
