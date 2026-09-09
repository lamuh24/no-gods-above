import { AttackId, FighterId, InputFrame, MatchState } from "../core/types";
import {
  createSpecialReviewScenario,
  SPECIAL_REVIEW_SCENARIOS,
  SpecialReviewScenarioId
} from "./specialReviewScenarios";

export type SpecialCadenceScenarioId =
  | "p1_neutral_medium_repeat_whiff"
  | "p1_up_medium_repeat_whiff"
  | "p1_grave_furrow_repeat_whiff"
  | "p1_grounded_verdict_repeat_whiff"
  | "p2_neutral_medium_repeat_whiff"
  | "p2_up_medium_repeat_whiff"
  | "p2_grave_furrow_repeat_whiff"
  | "p2_grounded_verdict_repeat_whiff";

export type SpecialCadenceStage = "first_queued" | "first_active" | "repeat_queued" | "second_active" | "complete" | "failed";

export interface SpecialCadenceScenarioDefinition {
  id: SpecialCadenceScenarioId;
  baseScenarioId: SpecialReviewScenarioId;
  attacker: FighterId;
  expectedAttackId: AttackId;
  label: string;
  shortLabel: string;
  reviewQuestion: string;
}

export interface SpecialCadenceTracker {
  scenarioId: SpecialCadenceScenarioId;
  stage: SpecialCadenceStage;
  startCount: number;
  firstStartTick: number | null;
  firstNeutralTick: number | null;
  repeatQueuedTick: number | null;
  secondStartTick: number | null;
  secondNeutralTick: number | null;
  startToStartTicks: number | null;
  neutralVisualGapTicks: number | null;
  previousExpectedAttackActive: boolean;
  failure: string | null;
}

export interface SpecialCadenceReviewSetup {
  definition: SpecialCadenceScenarioDefinition;
  state: MatchState;
  input: { p1?: InputFrame; p2?: InputFrame };
  tracker: SpecialCadenceTracker;
}

const defineCadence = (
  id: SpecialCadenceScenarioId,
  baseScenarioId: SpecialReviewScenarioId,
  label: string,
  shortLabel: string,
  reviewQuestion: string
): SpecialCadenceScenarioDefinition => {
  const base = SPECIAL_REVIEW_SCENARIOS[baseScenarioId];
  return { id, baseScenarioId, attacker: base.attacker, expectedAttackId: base.expectedAttackId, label, shortLabel, reviewQuestion };
};

export const SPECIAL_CADENCE_SCENARIOS: Record<SpecialCadenceScenarioId, SpecialCadenceScenarioDefinition> = {
  p1_neutral_medium_repeat_whiff: defineCadence(
    "p1_neutral_medium_repeat_whiff", "p1_neutral_medium_whiff", "P1 Neutral Medium · repeat whiff cadence", "P1 Neutral M ×2",
    "Does two fresh uses preserve a compact but punishable remount instead of reading like a normal-speed loop?"
  ),
  p1_up_medium_repeat_whiff: defineCadence(
    "p1_up_medium_repeat_whiff", "p1_up_medium_low_profile", "P1 Up Medium · repeat whiff cadence", "P1 Up M ×2",
    "Does the anti-air recovery create a clear reset before the next rising hook?"
  ),
  p1_grave_furrow_repeat_whiff: defineCadence(
    "p1_grave_furrow_repeat_whiff", "p1_grave_furrow_whiff", "P1 Grave Furrow · repeat whiff cadence", "P1 Grave ×2",
    "Does the full signature commitment remain obvious when the move is attempted twice at the earliest legal cadence?"
  ),
  p1_grounded_verdict_repeat_whiff: defineCadence(
    "p1_grounded_verdict_repeat_whiff", "p1_grounded_verdict_whiff", "P1 Grounded Verdict · repeat whiff cadence", "P1 Verdict ×2",
    "Do plant, spin, blast, reclaim, and recovery fully resolve before a fresh second process begins?"
  ),
  p2_neutral_medium_repeat_whiff: defineCadence(
    "p2_neutral_medium_repeat_whiff", "p2_neutral_medium_whiff", "P2 Neutral Medium · mirrored repeat whiff cadence", "P2 Neutral M ×2",
    "Does mirrored Neutral Medium preserve the same compact commitment and remount cadence?"
  ),
  p2_up_medium_repeat_whiff: defineCadence(
    "p2_up_medium_repeat_whiff", "p2_up_medium_low_profile", "P2 Up Medium · mirrored repeat whiff cadence", "P2 Up M ×2",
    "Does the mirrored anti-air preserve the same recovery and reset before the second hook?"
  ),
  p2_grave_furrow_repeat_whiff: defineCadence(
    "p2_grave_furrow_repeat_whiff", "p2_grave_furrow_whiff", "P2 Grave Furrow · mirrored repeat whiff cadence", "P2 Grave ×2",
    "Does the mirrored signature fallback preserve the same full commitment before reuse?"
  ),
  p2_grounded_verdict_repeat_whiff: defineCadence(
    "p2_grounded_verdict_repeat_whiff", "p2_grounded_verdict_whiff", "P2 Grounded Verdict · mirrored repeat whiff cadence", "P2 Verdict ×2",
    "Does the mirrored two-stage process fully resolve before its fresh second use?"
  )
};

export const SPECIAL_CADENCE_SCENARIO_ORDER: SpecialCadenceScenarioId[] = [
  "p1_neutral_medium_repeat_whiff",
  "p1_up_medium_repeat_whiff",
  "p1_grave_furrow_repeat_whiff",
  "p1_grounded_verdict_repeat_whiff",
  "p2_neutral_medium_repeat_whiff",
  "p2_up_medium_repeat_whiff",
  "p2_grave_furrow_repeat_whiff",
  "p2_grounded_verdict_repeat_whiff"
];

function cloneInput(input: { p1?: InputFrame; p2?: InputFrame }) {
  return {
    ...(input.p1 ? { p1: { ...input.p1 } } : {}),
    ...(input.p2 ? { p2: { ...input.p2 } } : {})
  };
}

export function createSpecialCadenceReviewScenario(id: SpecialCadenceScenarioId, seed = 1234): SpecialCadenceReviewSetup {
  const definition = SPECIAL_CADENCE_SCENARIOS[id];
  const base = createSpecialReviewScenario(definition.baseScenarioId, seed);
  return {
    definition,
    state: base.state,
    input: cloneInput(base.input),
    tracker: {
      scenarioId: id,
      stage: "first_queued",
      startCount: 0,
      firstStartTick: null,
      firstNeutralTick: null,
      repeatQueuedTick: null,
      secondStartTick: null,
      secondNeutralTick: null,
      startToStartTicks: null,
      neutralVisualGapTicks: null,
      previousExpectedAttackActive: false,
      failure: null
    }
  };
}

export function observeSpecialCadenceReview(
  setup: SpecialCadenceReviewSetup,
  state: MatchState
): { p1?: InputFrame; p2?: InputFrame } | null {
  const { definition, tracker } = setup;
  if (tracker.stage === "complete" || tracker.stage === "failed") return null;
  const actor = state.fighters[definition.attacker];
  if (actor.currentAttack && actor.currentAttack !== definition.expectedAttackId) {
    tracker.stage = "failed";
    tracker.failure = `unexpected attack ${actor.currentAttack}`;
    return null;
  }

  const active = actor.currentAttack === definition.expectedAttackId;
  if (active && !tracker.previousExpectedAttackActive) {
    tracker.startCount += 1;
    if (tracker.startCount === 1) {
      tracker.firstStartTick = state.tick;
      tracker.stage = "first_active";
    } else if (tracker.startCount === 2) {
      tracker.secondStartTick = state.tick;
      tracker.startToStartTicks = tracker.firstStartTick === null ? null : state.tick - tracker.firstStartTick;
      tracker.neutralVisualGapTicks = tracker.firstNeutralTick === null ? null : state.tick - tracker.firstNeutralTick;
      tracker.stage = "second_active";
    } else {
      tracker.stage = "failed";
      tracker.failure = "more than two starts observed";
    }
  }

  let queuedInput: { p1?: InputFrame; p2?: InputFrame } | null = null;
  if (!active && tracker.previousExpectedAttackActive) {
    if (tracker.startCount === 1) {
      tracker.firstNeutralTick = state.tick;
      tracker.repeatQueuedTick = state.tick;
      tracker.stage = "repeat_queued";
      queuedInput = cloneInput(setup.input);
    } else if (tracker.startCount === 2) {
      tracker.secondNeutralTick = state.tick;
      tracker.stage = "complete";
    }
  }

  tracker.previousExpectedAttackActive = active;
  return queuedInput;
}
