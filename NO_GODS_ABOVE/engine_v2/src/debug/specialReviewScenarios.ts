import { createMatch } from "../core/engine";
import { AttackId, DummyMode, FighterId, FighterKind, InputFrame, MatchState } from "../core/types";

export type SpecialReviewScenarioId =
  | "p1_forward_light_live_hit"
  | "p1_forward_medium_live_hit"
  | "p1_forward_heavy_live_hit"
  | "p1_neutral_medium_hit"
  | "p1_neutral_medium_block"
  | "p1_neutral_medium_whiff"
  | "p1_up_medium_air_hit"
  | "p1_up_medium_stand_block"
  | "p1_up_medium_low_profile"
  | "p1_grave_furrow_hit"
  | "p1_grave_furrow_block"
  | "p1_grave_furrow_whiff"
  | "p1_grounded_verdict_hit"
  | "p1_grounded_verdict_block"
  | "p1_grounded_verdict_whiff"
  | "p2_neutral_medium_hit"
  | "p2_neutral_medium_block"
  | "p2_neutral_medium_whiff"
  | "p2_up_medium_air_hit"
  | "p2_up_medium_stand_block"
  | "p2_up_medium_low_profile"
  | "p2_grave_furrow_hit"
  | "p2_grave_furrow_block"
  | "p2_grave_furrow_whiff"
  | "p2_grounded_verdict_hit"
  | "p2_grounded_verdict_block"
  | "p2_grounded_verdict_whiff"
  | "p1_forward_heavy_fallback_hit"
  | "p1_down_light_fallback_hit"
  | "p1_down_medium_fallback_hit";

export type SpecialReviewGroupId = "gameplay_candidates" | "p2_mirror" | "fallback_comparisons";

export interface SpecialReviewScenarioDefinition {
  id: SpecialReviewScenarioId;
  group: SpecialReviewGroupId;
  label: string;
  shortLabel: string;
  attacker: FighterId;
  p1Kind: FighterKind;
  p2Kind: FighterKind;
  p1X: number;
  p2X: number;
  p1Facing: 1 | -1;
  p2Facing: 1 | -1;
  input: InputFrame;
  expectedAttackId: AttackId;
  expectedOutcome: "hit" | "block" | "whiff";
  expectedDamage: number;
  expectedRegisteredHits: number;
  defenderDummyMode?: DummyMode;
  defenderAirborne?: { y: number; vy: number };
  reviewQuestion: string;
}

const p1 = (definition: Omit<SpecialReviewScenarioDefinition, "attacker" | "p1Kind" | "p2Kind" | "p1Facing" | "p2Facing">): SpecialReviewScenarioDefinition => ({
  ...definition,
  attacker: "p1",
  p1Kind: "lamuh_proto",
  p2Kind: "training_dummy",
  p1Facing: 1,
  p2Facing: -1
});

export const SPECIAL_REVIEW_SCENARIOS: Record<SpecialReviewScenarioId, SpecialReviewScenarioDefinition> = {
  p1_forward_light_live_hit: p1({
    id: "p1_forward_light_live_hit", group: "gameplay_candidates", label: "Forward Light V3 · live hit", shortLabel: "Play Forward L V3",
    p1X: -76, p2X: 76, input: { right: true, special: true, light: true }, expectedAttackId: "special_forward_light",
    expectedOutcome: "hit", expectedDamage: 48, expectedRegisteredHits: 1,
    reviewQuestion: "Does the full sixteen-frame warning drag, running pickup, shaft drive, and moving recovery read as one continuous live attack?"
  }),
  p1_forward_medium_live_hit: p1({
    id: "p1_forward_medium_live_hit", group: "gameplay_candidates", label: "Forward Medium V3 · live two-hit process", shortLabel: "Play Forward M V3",
    p1X: -76, p2X: 76, input: { right: true, special: true, medium: true }, expectedAttackId: "special_forward_medium",
    expectedOutcome: "hit", expectedDamage: 82, expectedRegisteredHits: 2,
    reviewQuestion: "Do the shoulder drive and cross-body scythe rip read as two distinct contacts inside one continuous sixteen-frame attack?"
  }),
  p1_forward_heavy_live_hit: p1({
    id: "p1_forward_heavy_live_hit", group: "gameplay_candidates", label: "Forward Heavy V3 · live hit", shortLabel: "Play Forward H V3",
    p1X: -76, p2X: 76, input: { right: true, special: true, heavy: true }, expectedAttackId: "special_forward_heavy",
    expectedOutcome: "hit", expectedDamage: 105, expectedRegisteredHits: 1,
    reviewQuestion: "Does the full sixteen-frame ground grind, planted coil, execution crescent, and carried recovery read as one continuous live heavy?"
  }),
  p1_neutral_medium_hit: p1({
    id: "p1_neutral_medium_hit", group: "gameplay_candidates", label: "Neutral Medium · hit", shortLabel: "Neutral M Hit",
    p1X: -76, p2X: 76, input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium",
    expectedOutcome: "hit", expectedDamage: 65, expectedRegisteredHits: 1,
    reviewQuestion: "Does the compact scythe control strike read as exactly one grounded torso contact followed by recoil?"
  }),
  p1_neutral_medium_block: p1({
    id: "p1_neutral_medium_block", group: "gameplay_candidates", label: "Neutral Medium · block", shortLabel: "Neutral M Block",
    p1X: -76, p2X: 76, input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium",
    expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1, defenderDummyMode: "stand_block",
    reviewQuestion: "Does the blocked control strike keep its single-contact read without resembling a grab or second hit?"
  }),
  p1_neutral_medium_whiff: p1({
    id: "p1_neutral_medium_whiff", group: "gameplay_candidates", label: "Neutral Medium · whiff", shortLabel: "Neutral M Whiff",
    p1X: -300, p2X: 300, input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium",
    expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the whiff expose a readable draw, one committed strike path, and controlled remount?"
  }),
  p1_up_medium_air_hit: p1({
    id: "p1_up_medium_air_hit", group: "gameplay_candidates", label: "Up Medium · airborne hit", shortLabel: "Up M Air Hit",
    p1X: -76, p2X: 76, input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium",
    expectedOutcome: "hit", expectedDamage: 78, expectedRegisteredHits: 1, defenderAirborne: { y: -48, vy: 0 },
    reviewQuestion: "Does the rising hook clearly catch an airborne target as one anti-air contact with no hidden root travel?"
  }),
  p1_up_medium_stand_block: p1({
    id: "p1_up_medium_stand_block", group: "gameplay_candidates", label: "Up Medium · standing block", shortLabel: "Up M Block",
    p1X: -76, p2X: 76, input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium",
    expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1, defenderDummyMode: "stand_block",
    reviewQuestion: "Does standing guard make the upper-hook contact and recovery readable without creating a second impact?"
  }),
  p1_up_medium_low_profile: p1({
    id: "p1_up_medium_low_profile", group: "gameplay_candidates", label: "Up Medium · crouch low-profile", shortLabel: "Up M Low Profile",
    p1X: -76, p2X: 76, input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium",
    expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0, defenderDummyMode: "crouch_block",
    reviewQuestion: "Does the crouching target visibly low-profile the upper-region hook while Swahili completes the authored whiff?"
  }),
  p1_grave_furrow_hit: p1({
    id: "p1_grave_furrow_hit", group: "gameplay_candidates", label: "Grave Furrow · hit", shortLabel: "Grave Hit",
    p1X: -76, p2X: 76, input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy",
    expectedOutcome: "hit", expectedDamage: 120, expectedRegisteredHits: 1,
    reviewQuestion: "Does the planted furrow produce one signature rising contact, moderate lift, and committed remount?"
  }),
  p1_grave_furrow_block: p1({
    id: "p1_grave_furrow_block", group: "gameplay_candidates", label: "Grave Furrow · block", shortLabel: "Grave Block",
    p1X: -76, p2X: 76, input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy",
    expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1, defenderDummyMode: "stand_block",
    reviewQuestion: "Does the blocked signature scythe contact retain heavy weight while exposing the committed recovery?"
  }),
  p1_grave_furrow_whiff: p1({
    id: "p1_grave_furrow_whiff", group: "gameplay_candidates", label: "Grave Furrow · whiff", shortLabel: "Grave Whiff",
    p1X: -300, p2X: 300, input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy",
    expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the full grounded furrow and remount remain legible and punishable when no victim is contacted?"
  }),
  p1_grounded_verdict_hit: p1({
    id: "p1_grounded_verdict_hit", group: "gameplay_candidates", label: "Grounded Verdict · two-hit process", shortLabel: "Verdict 2-Hit",
    p1X: -76, p2X: 76, input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy",
    expectedOutcome: "hit", expectedDamage: 104, expectedRegisteredHits: 2,
    reviewQuestion: "Do the anchored staff plant and later simultaneous contract blast read as exactly two separated impacts?"
  }),
  p1_grounded_verdict_block: p1({
    id: "p1_grounded_verdict_block", group: "gameplay_candidates", label: "Grounded Verdict · crouch block", shortLabel: "Verdict Block",
    p1X: -76, p2X: 76, input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy",
    expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 2, defenderDummyMode: "crouch_block",
    reviewQuestion: "Does crouch guard show two clearly separated blocked contacts without changing the planted weapon line?"
  }),
  p1_grounded_verdict_whiff: p1({
    id: "p1_grounded_verdict_whiff", group: "gameplay_candidates", label: "Grounded Verdict · whiff", shortLabel: "Verdict Whiff",
    p1X: -300, p2X: 300, input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy",
    expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the staff plant, gun-draw spin, blast, reclaim, and recovery remain a coherent committed process on whiff?"
  }),
  p2_neutral_medium_hit: {
    id: "p2_neutral_medium_hit", group: "p2_mirror", label: "P2 Neutral Medium · mirrored hit", shortLabel: "P2 Neutral M", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium", expectedOutcome: "hit", expectedDamage: 65, expectedRegisteredHits: 1,
    reviewQuestion: "Does lossless P2 mirroring preserve Neutral Medium's one compact torso contact, rigid scythe line, and controlled recoil?"
  },
  p2_neutral_medium_block: {
    id: "p2_neutral_medium_block", group: "p2_mirror", label: "P2 Neutral Medium · mirrored block", shortLabel: "P2 Neutral M Block", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium", expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1,
    defenderDummyMode: "stand_block",
    reviewQuestion: "Does mirrored standing guard preserve Neutral Medium's one blocked contact, rigid scythe line, and controlled recoil?"
  },
  p2_neutral_medium_whiff: {
    id: "p2_neutral_medium_whiff", group: "p2_mirror", label: "P2 Neutral Medium · mirrored whiff", shortLabel: "P2 Neutral M Whiff", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -300, p2X: 300, p1Facing: 1, p2Facing: -1,
    input: { special: true, medium: true }, expectedAttackId: "special_neutral_medium", expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the mirrored whiff preserve Neutral Medium's readable draw, committed strike path, and controlled remount?"
  },
  p2_up_medium_air_hit: {
    id: "p2_up_medium_air_hit", group: "p2_mirror", label: "P2 Up Medium · mirrored airborne hit", shortLabel: "P2 Up M Air", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium", expectedOutcome: "hit", expectedDamage: 78, expectedRegisteredHits: 1,
    defenderAirborne: { y: -48, vy: 0 },
    reviewQuestion: "Does lossless P2 mirroring preserve Up Medium's one rising anti-air contact, upper hook path, and grounded root?"
  },
  p2_up_medium_stand_block: {
    id: "p2_up_medium_stand_block", group: "p2_mirror", label: "P2 Up Medium · mirrored standing block", shortLabel: "P2 Up M Block", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium", expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1,
    defenderDummyMode: "stand_block",
    reviewQuestion: "Does mirrored standing guard preserve Up Medium's one upper-hook contact and committed recovery?"
  },
  p2_up_medium_low_profile: {
    id: "p2_up_medium_low_profile", group: "p2_mirror", label: "P2 Up Medium · mirrored crouch low-profile", shortLabel: "P2 Up M Low", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { up: true, special: true, medium: true }, expectedAttackId: "special_up_medium", expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    defenderDummyMode: "crouch_block",
    reviewQuestion: "Does a mirrored crouching target visibly low-profile the upper-region hook while Swahili completes the whiff?"
  },
  p2_grave_furrow_hit: {
    id: "p2_grave_furrow_hit", group: "p2_mirror", label: "P2 Grave Furrow · mirrored hit", shortLabel: "P2 Grave Mirror", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy", expectedOutcome: "hit", expectedDamage: 120, expectedRegisteredHits: 1,
    reviewQuestion: "Does lossless P2 mirroring preserve Grave Furrow's planted path, single contact, and remount timing?"
  },
  p2_grave_furrow_block: {
    id: "p2_grave_furrow_block", group: "p2_mirror", label: "P2 Grave Furrow · mirrored block", shortLabel: "P2 Grave Block", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy", expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 1,
    defenderDummyMode: "stand_block",
    reviewQuestion: "Does mirrored block preserve Grave Furrow's one heavy contact, planted path, and committed remount?"
  },
  p2_grave_furrow_whiff: {
    id: "p2_grave_furrow_whiff", group: "p2_mirror", label: "P2 Grave Furrow · mirrored whiff", shortLabel: "P2 Grave Whiff", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -300, p2X: 300, p1Facing: 1, p2Facing: -1,
    input: { up: true, heavy: true }, expectedAttackId: "special_up_heavy", expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the mirrored full furrow and remount remain legible and punishable with no victim contact?"
  },
  p2_grounded_verdict_hit: {
    id: "p2_grounded_verdict_hit", group: "p2_mirror", label: "P2 Grounded Verdict · mirrored hit", shortLabel: "P2 Verdict Mirror", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy", expectedOutcome: "hit", expectedDamage: 104, expectedRegisteredHits: 2,
    reviewQuestion: "Does mirrored Grounded Verdict preserve the anchored staff and exactly two-contact plant-to-blast process?"
  },
  p2_grounded_verdict_block: {
    id: "p2_grounded_verdict_block", group: "p2_mirror", label: "P2 Grounded Verdict · mirrored crouch block", shortLabel: "P2 Verdict Block", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy", expectedOutcome: "block", expectedDamage: 0, expectedRegisteredHits: 2,
    defenderDummyMode: "crouch_block",
    reviewQuestion: "Does mirrored crouch guard preserve Grounded Verdict's two separated blocks and anchored weapon line?"
  },
  p2_grounded_verdict_whiff: {
    id: "p2_grounded_verdict_whiff", group: "p2_mirror", label: "P2 Grounded Verdict · mirrored whiff", shortLabel: "P2 Verdict Whiff", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -300, p2X: 300, p1Facing: 1, p2Facing: -1,
    input: { down: true, special: true, heavy: true }, expectedAttackId: "special_down_heavy", expectedOutcome: "whiff", expectedDamage: 0, expectedRegisteredHits: 0,
    reviewQuestion: "Does the mirrored plant, gun-draw spin, blast, reclaim, and recovery remain coherent with no victim contact?"
  },
  p1_forward_heavy_fallback_hit: p1({
    id: "p1_forward_heavy_fallback_hit", group: "fallback_comparisons", label: "Forward Heavy V3 compatibility hit", shortLabel: "Test Forward H V3",
    p1X: -76, p2X: 76, input: { right: true, special: true, heavy: true }, expectedAttackId: "special_forward_heavy",
    expectedOutcome: "hit", expectedDamage: 105, expectedRegisteredHits: 1,
    reviewQuestion: "Does the preserved one-hit Heavy combat definition drive the connected sixteen-frame Execution Crescent V3 presentation cleanly?"
  }),
  p1_down_light_fallback_hit: p1({
    id: "p1_down_light_fallback_hit", group: "fallback_comparisons", label: "Down Light Stamped Shaft Check V3 · hit", shortLabel: "Test Down L V3",
    p1X: -76, p2X: 76, input: { down: true, special: true, light: true }, expectedAttackId: "special_down_light",
    expectedOutcome: "hit", expectedDamage: 45, expectedRegisteredHits: 1,
    reviewQuestion: "Does the complete stamp, single low contact, held line, and weighted recovery read as a distinct special?"
  }),
  p1_down_medium_fallback_hit: p1({
    id: "p1_down_medium_fallback_hit", group: "fallback_comparisons", label: "Down Medium Crossdraw Reprisal V6 · hit", shortLabel: "Test Crossdraw V6",
    p1X: -76, p2X: 76, input: { down: true, special: true, medium: true }, expectedAttackId: "special_down_medium",
    // The fresh two-hit sequence applies 30 + round(42 * 0.92) damage after combo scaling.
    expectedOutcome: "hit", expectedDamage: 69, expectedRegisteredHits: 2,
    reviewQuestion: "Does the low shot connect once, followed by a separate rising torso shot, with continuous recoil and the scythe remaining mounted?"
  })
};

// Preserve the original 17-scenario evidence surface as V1.
export const SPECIAL_REVIEW_SCENARIO_ORDER: SpecialReviewScenarioId[] = [
  "p1_neutral_medium_hit",
  "p1_neutral_medium_block",
  "p1_neutral_medium_whiff",
  "p1_up_medium_air_hit",
  "p1_up_medium_stand_block",
  "p1_up_medium_low_profile",
  "p1_grave_furrow_hit",
  "p1_grave_furrow_block",
  "p1_grave_furrow_whiff",
  "p1_grounded_verdict_hit",
  "p1_grounded_verdict_block",
  "p1_grounded_verdict_whiff",
  "p2_grave_furrow_hit",
  "p2_grounded_verdict_hit",
  "p1_forward_heavy_fallback_hit",
  "p1_down_light_fallback_hit",
  "p1_down_medium_fallback_hit"
];

export const SPECIAL_REVIEW_SCENARIO_ORDER_V2: SpecialReviewScenarioId[] = [
  ...SPECIAL_REVIEW_SCENARIO_ORDER,
  "p2_neutral_medium_hit",
  "p2_up_medium_air_hit"
];

export const SPECIAL_REVIEW_SCENARIO_ORDER_V3: SpecialReviewScenarioId[] = [
  ...SPECIAL_REVIEW_SCENARIO_ORDER_V2,
  "p2_neutral_medium_block",
  "p2_neutral_medium_whiff",
  "p2_up_medium_stand_block",
  "p2_up_medium_low_profile",
  "p2_grave_furrow_block",
  "p2_grave_furrow_whiff",
  "p2_grounded_verdict_block",
  "p2_grounded_verdict_whiff"
];

function buildGroups(order: SpecialReviewScenarioId[]): Array<{ id: SpecialReviewGroupId; label: string; scenarioIds: SpecialReviewScenarioId[] }> {
  return [
    { id: "gameplay_candidates", label: "Current gameplay candidates", scenarioIds: order.filter((id) => SPECIAL_REVIEW_SCENARIOS[id].group === "gameplay_candidates") },
    { id: "p2_mirror", label: "P2 mirror checks", scenarioIds: order.filter((id) => SPECIAL_REVIEW_SCENARIOS[id].group === "p2_mirror") },
    { id: "fallback_comparisons", label: "Completed forward/down motion checks", scenarioIds: order.filter((id) => SPECIAL_REVIEW_SCENARIOS[id].group === "fallback_comparisons") }
  ];
}

export const SPECIAL_REVIEW_GROUPS = buildGroups(SPECIAL_REVIEW_SCENARIO_ORDER);
export const SPECIAL_REVIEW_GROUPS_V2 = buildGroups(SPECIAL_REVIEW_SCENARIO_ORDER_V2);
export const SPECIAL_REVIEW_GROUPS_V3 = buildGroups(SPECIAL_REVIEW_SCENARIO_ORDER_V3);

export function createSpecialReviewScenario(id: SpecialReviewScenarioId, seed = 1234): {
  definition: SpecialReviewScenarioDefinition;
  state: MatchState;
  input: { p1?: InputFrame; p2?: InputFrame };
} {
  const definition = SPECIAL_REVIEW_SCENARIOS[id];
  const state = createMatch(seed, {
    matchId: `swahili-special-review-${id}-${seed}`,
    p1Kind: definition.p1Kind,
    p2Kind: definition.p2Kind,
    p1X: definition.p1X,
    p2X: definition.p2X
  });
  state.fighters.p1.facing = definition.p1Facing;
  state.fighters.p1.attackFacing = definition.p1Facing;
  state.fighters.p2.facing = definition.p2Facing;
  state.fighters.p2.attackFacing = definition.p2Facing;
  const defenderId: FighterId = definition.attacker === "p1" ? "p2" : "p1";
  const defender = state.fighters[defenderId];
  if (definition.defenderDummyMode) defender.dummyMode = definition.defenderDummyMode;
  if (definition.defenderAirborne) Object.assign(defender, { ...definition.defenderAirborne, grounded: false, phase: "jump" as const });
  return {
    definition,
    state,
    input: definition.attacker === "p1" ? { p1: { ...definition.input } } : { p2: { ...definition.input } }
  };
}
