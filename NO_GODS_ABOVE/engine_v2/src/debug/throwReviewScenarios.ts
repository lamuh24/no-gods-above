import { createMatch } from "../core/engine";
import { FighterId, FighterKind, InputFrame, MatchState, ThrowId } from "../core/types";

export type ThrowReviewScenarioId =
  | "p1_forward_throw_center"
  | "p1_back_throw_center"
  | "p1_throw_whiff"
  | "p1_command_grab_hit"
  | "p1_command_grab_whiff"
  | "p1_forward_throw_right_corner"
  | "p1_back_throw_right_corner"
  | "p2_forward_throw_center"
  | "p2_back_throw_left_corner"
  | "p2_command_grab_hit"
  | "p2_command_grab_whiff"
  | "p2_forward_throw_left_corner"
  | "p1_command_grab_right_corner"
  | "p2_command_grab_left_corner";

export interface ThrowReviewScenarioDefinition {
  id: ThrowReviewScenarioId;
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
  expectedThrowId: ThrowId;
  expectedOutcome: "connected" | "whiff";
  expectedDamage: number;
  expectedSideSwitch: boolean;
  reviewQuestion: string;
}

export const THROW_REVIEW_SCENARIOS: Record<ThrowReviewScenarioId, ThrowReviewScenarioDefinition> = {
  p1_forward_throw_center: {
    id: "p1_forward_throw_center", label: "P1 Forward Throw · center", shortLabel: "P1 Forward Throw", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: -30, p2X: 30, p1Facing: 1, p2Facing: -1,
    input: { throw: true }, expectedThrowId: "forward_throw", expectedOutcome: "connected", expectedDamage: 70, expectedSideSwitch: false,
    reviewQuestion: "Does the accepted forward-throw motion read clearly from reach through release and recovery?"
  },
  p1_back_throw_center: {
    id: "p1_back_throw_center", label: "P1 Back Throw · center", shortLabel: "P1 Back Throw", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: -30, p2X: 30, p1Facing: 1, p2Facing: -1,
    input: { left: true, throw: true }, expectedThrowId: "back_throw", expectedOutcome: "connected", expectedDamage: 75, expectedSideSwitch: true,
    reviewQuestion: "Does the accepted back throw complete one legible side switch without body separation or an early facing flip?"
  },
  p1_throw_whiff: {
    id: "p1_throw_whiff", label: "P1 Universal Throw · whiff", shortLabel: "P1 Throw Whiff", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: -160, p2X: 160, p1Facing: 1, p2Facing: -1,
    input: { throw: true }, expectedThrowId: "forward_throw", expectedOutcome: "whiff", expectedDamage: 0, expectedSideSwitch: false,
    reviewQuestion: "Does the miss show a readable reach and committed recovery with enough time to recognize the punish window?"
  },
  p1_command_grab_hit: {
    id: "p1_command_grab_hit", label: "P1 Command Grab · hit", shortLabel: "P1 Command Grab", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "connected", expectedDamage: 220, expectedSideSwitch: true,
    reviewQuestion: "Does the frozen approved Command Grab remain one continuous capture, carry, side switch, release, and single-shot payoff?"
  },
  p1_command_grab_whiff: {
    id: "p1_command_grab_whiff", label: "P1 Command Grab · whiff", shortLabel: "Command Grab Whiff", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: -220, p2X: 220, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "whiff", expectedDamage: 0, expectedSideSwitch: false,
    reviewQuestion: "Does a missed Command Grab visibly complete its approved committed motion without touching or moving the victim?"
  },
  p1_forward_throw_right_corner: {
    id: "p1_forward_throw_right_corner", label: "P1 Forward Throw · right corner", shortLabel: "Forward Throw Corner", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: 340, p2X: 400, p1Facing: 1, p2Facing: -1,
    input: { throw: true }, expectedThrowId: "forward_throw", expectedOutcome: "connected", expectedDamage: 70, expectedSideSwitch: false,
    reviewQuestion: "Does the forward throw clamp cleanly at the right wall without root separation, wall overlap, or scale change?"
  },
  p1_back_throw_right_corner: {
    id: "p1_back_throw_right_corner", label: "P1 Back Throw · right corner", shortLabel: "Back Throw Corner", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: 340, p2X: 400, p1Facing: 1, p2Facing: -1,
    input: { left: true, throw: true }, expectedThrowId: "back_throw", expectedOutcome: "connected", expectedDamage: 75, expectedSideSwitch: true,
    reviewQuestion: "Does the back throw leave the corner only after a readable pivot and complete its side switch inside the stage bounds?"
  },
  p2_forward_throw_center: {
    id: "p2_forward_throw_center", label: "P2 Forward Throw · mirrored center", shortLabel: "P2 Mirror Forward", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -30, p2X: 30, p1Facing: 1, p2Facing: -1,
    input: { throw: true }, expectedThrowId: "forward_throw", expectedOutcome: "connected", expectedDamage: 70, expectedSideSwitch: false,
    reviewQuestion: "Does lossless P2 mirroring preserve the same forward-throw timing, silhouettes, and victim relationship?"
  },
  p2_back_throw_left_corner: {
    id: "p2_back_throw_left_corner", label: "P2 Back Throw · mirrored left corner", shortLabel: "P2 Mirror Back Corner", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -400, p2X: -340, p1Facing: 1, p2Facing: -1,
    input: { right: true, throw: true }, expectedThrowId: "back_throw", expectedOutcome: "connected", expectedDamage: 75, expectedSideSwitch: true,
    reviewQuestion: "Does the mirrored back throw resolve the left corner with the same bounded side-switch behavior as P1?"
  },
  p2_command_grab_hit: {
    id: "p2_command_grab_hit", label: "P2 Command Grab · mirrored hit", shortLabel: "P2 Mirror Command Grab", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -76, p2X: 76, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "connected", expectedDamage: 220, expectedSideSwitch: true,
    reviewQuestion: "Does lossless P2 mirroring preserve the frozen Command Grab's capture, carry, side switch, airborne release, and single-shot payoff?"
  },
  p2_command_grab_whiff: {
    id: "p2_command_grab_whiff", label: "P2 Command Grab · mirrored whiff", shortLabel: "P2 Command Grab Whiff", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -220, p2X: 220, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "whiff", expectedDamage: 0, expectedSideSwitch: false,
    reviewQuestion: "Does the mirrored missed Command Grab preserve the same committed recovery without touching or moving the victim?"
  },
  p2_forward_throw_left_corner: {
    id: "p2_forward_throw_left_corner", label: "P2 Forward Throw · mirrored left corner", shortLabel: "P2 Forward Corner", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -400, p2X: -340, p1Facing: 1, p2Facing: -1,
    input: { throw: true }, expectedThrowId: "forward_throw", expectedOutcome: "connected", expectedDamage: 70, expectedSideSwitch: false,
    reviewQuestion: "Does the mirrored forward throw clamp cleanly at the left wall with the same spacing, scale, and release timing as P1?"
  },
  p1_command_grab_right_corner: {
    id: "p1_command_grab_right_corner", label: "P1 Command Grab · right corner", shortLabel: "P1 Command Corner", attacker: "p1",
    p1Kind: "lamuh_proto", p2Kind: "training_dummy", p1X: 248, p2X: 400, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "connected", expectedDamage: 220, expectedSideSwitch: true,
    reviewQuestion: "Does the frozen Command Grab keep one continuous capture and bounded side switch when P1 begins at the right wall?"
  },
  p2_command_grab_left_corner: {
    id: "p2_command_grab_left_corner", label: "P2 Command Grab · mirrored left corner", shortLabel: "P2 Command Corner", attacker: "p2",
    p1Kind: "training_dummy", p2Kind: "lamuh_proto", p1X: -400, p2X: -248, p1Facing: 1, p2Facing: -1,
    input: { special: true, throw: true }, expectedThrowId: "command_grab", expectedOutcome: "connected", expectedDamage: 220, expectedSideSwitch: true,
    reviewQuestion: "Does the mirrored frozen Command Grab preserve the same bounded corner capture, carry, release, and single-shot payoff?"
  }
};

// Preserve the original nine-scenario order as the V1 evidence surface.
export const THROW_REVIEW_SCENARIO_ORDER: ThrowReviewScenarioId[] = [
  "p1_forward_throw_center",
  "p1_back_throw_center",
  "p1_throw_whiff",
  "p1_command_grab_hit",
  "p1_command_grab_whiff",
  "p1_forward_throw_right_corner",
  "p1_back_throw_right_corner",
  "p2_forward_throw_center",
  "p2_back_throw_left_corner"
];

export const THROW_REVIEW_SCENARIO_ORDER_V2: ThrowReviewScenarioId[] = [
  ...THROW_REVIEW_SCENARIO_ORDER,
  "p2_command_grab_hit",
  "p2_command_grab_whiff"
];

// V3 completes symmetric corner review coverage without changing any throw definition.
export const THROW_REVIEW_SCENARIO_ORDER_V3: ThrowReviewScenarioId[] = [
  ...THROW_REVIEW_SCENARIO_ORDER_V2,
  "p2_forward_throw_left_corner",
  "p1_command_grab_right_corner",
  "p2_command_grab_left_corner"
];

export function createThrowReviewScenario(id: ThrowReviewScenarioId, seed = 1234): {
  definition: ThrowReviewScenarioDefinition;
  state: MatchState;
  input: { p1?: InputFrame; p2?: InputFrame };
} {
  const definition = THROW_REVIEW_SCENARIOS[id];
  const state = createMatch(seed, {
    matchId: `swahili-throw-review-${id}-${seed}`,
    p1Kind: definition.p1Kind,
    p2Kind: definition.p2Kind,
    p1X: definition.p1X,
    p2X: definition.p2X
  });
  state.fighters.p1.facing = definition.p1Facing;
  state.fighters.p1.attackFacing = definition.p1Facing;
  state.fighters.p2.facing = definition.p2Facing;
  state.fighters.p2.attackFacing = definition.p2Facing;
  return {
    definition,
    state,
    input: definition.attacker === "p1" ? { p1: { ...definition.input } } : { p2: { ...definition.input } }
  };
}
