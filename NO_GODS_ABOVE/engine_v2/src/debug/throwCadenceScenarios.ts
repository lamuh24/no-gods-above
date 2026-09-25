import { createMatch } from "../core/engine";
import { FighterId, InputFrame, MatchState, ThrowId } from "../core/types";

export type ThrowCadenceScenarioId =
  | "p1_forward_throw_repeat_whiff"
  | "p1_back_throw_repeat_whiff"
  | "p1_command_grab_repeat_whiff"
  | "p2_forward_throw_repeat_whiff"
  | "p2_back_throw_repeat_whiff"
  | "p2_command_grab_repeat_whiff";

export type ThrowCadenceStage = "first_queued" | "first_active" | "repeat_queued" | "second_active" | "complete" | "failed";

export interface ThrowCadenceScenarioDefinition {
  id: ThrowCadenceScenarioId;
  attacker: FighterId;
  expectedThrowId: ThrowId;
  input: InputFrame;
  label: string;
  shortLabel: string;
  reviewQuestion: string;
}

export interface ThrowCadenceTracker {
  scenarioId: ThrowCadenceScenarioId;
  stage: ThrowCadenceStage;
  startCount: number;
  firstStartTick: number | null;
  firstNeutralTick: number | null;
  repeatQueuedTick: number | null;
  secondStartTick: number | null;
  secondNeutralTick: number | null;
  startToStartTicks: number | null;
  neutralVisualGapTicks: number | null;
  previousExpectedThrowActive: boolean;
  failure: string | null;
}

export interface ThrowCadenceReviewSetup {
  definition: ThrowCadenceScenarioDefinition;
  state: MatchState;
  input: { p1?: InputFrame; p2?: InputFrame };
  tracker: ThrowCadenceTracker;
}

const p1 = (
  id: ThrowCadenceScenarioId,
  expectedThrowId: ThrowId,
  input: InputFrame,
  label: string,
  shortLabel: string,
  reviewQuestion: string
): ThrowCadenceScenarioDefinition => ({ id, attacker: "p1", expectedThrowId, input, label, shortLabel, reviewQuestion });

const p2 = (
  id: ThrowCadenceScenarioId,
  expectedThrowId: ThrowId,
  input: InputFrame,
  label: string,
  shortLabel: string,
  reviewQuestion: string
): ThrowCadenceScenarioDefinition => ({ id, attacker: "p2", expectedThrowId, input, label, shortLabel, reviewQuestion });

export const THROW_CADENCE_SCENARIOS: Record<ThrowCadenceScenarioId, ThrowCadenceScenarioDefinition> = {
  p1_forward_throw_repeat_whiff: p1(
    "p1_forward_throw_repeat_whiff", "forward_throw", { throw: true }, "P1 Forward Throw · repeat whiff cadence", "P1 Forward ×2",
    "Does the universal forward-throw whiff expose a fair reset before the fresh second attempt?"
  ),
  p1_back_throw_repeat_whiff: p1(
    "p1_back_throw_repeat_whiff", "back_throw", { left: true, throw: true }, "P1 Back Throw · repeat whiff cadence", "P1 Back ×2",
    "Does the side-switch throw's whiff commitment remain distinct and punishable before reuse?"
  ),
  p1_command_grab_repeat_whiff: p1(
    "p1_command_grab_repeat_whiff", "command_grab", { special: true, throw: true }, "P1 Command Grab · repeat whiff cadence", "P1 Command ×2",
    "Does the frozen 107-tick Command Grab whiff remain unmistakably committed before a fresh second attempt?"
  ),
  p2_forward_throw_repeat_whiff: p2(
    "p2_forward_throw_repeat_whiff", "forward_throw", { throw: true }, "P2 Forward Throw · mirrored repeat whiff cadence", "P2 Forward ×2",
    "Does mirrored forward-throw whiff recovery preserve the same earliest reuse rhythm?"
  ),
  p2_back_throw_repeat_whiff: p2(
    "p2_back_throw_repeat_whiff", "back_throw", { right: true, throw: true }, "P2 Back Throw · mirrored repeat whiff cadence", "P2 Back ×2",
    "Does mirrored back-throw whiff recovery preserve the same side-switch commitment and reuse rhythm?"
  ),
  p2_command_grab_repeat_whiff: p2(
    "p2_command_grab_repeat_whiff", "command_grab", { special: true, throw: true }, "P2 Command Grab · mirrored repeat whiff cadence", "P2 Command ×2",
    "Does the mirrored frozen Command Grab preserve the same long whiff commitment before reuse?"
  )
};

export const THROW_CADENCE_SCENARIO_ORDER: ThrowCadenceScenarioId[] = [
  "p1_forward_throw_repeat_whiff",
  "p1_back_throw_repeat_whiff",
  "p1_command_grab_repeat_whiff",
  "p2_forward_throw_repeat_whiff",
  "p2_back_throw_repeat_whiff",
  "p2_command_grab_repeat_whiff"
];

function cloneInput(input: { p1?: InputFrame; p2?: InputFrame }) {
  return {
    ...(input.p1 ? { p1: { ...input.p1 } } : {}),
    ...(input.p2 ? { p2: { ...input.p2 } } : {})
  };
}

export function createThrowCadenceReviewScenario(id: ThrowCadenceScenarioId, seed = 1234): ThrowCadenceReviewSetup {
  const definition = THROW_CADENCE_SCENARIOS[id];
  const state = createMatch(seed, {
    matchId: `swahili-throw-cadence-${id}-${seed}`,
    p1Kind: definition.attacker === "p1" ? "lamuh_proto" : "training_dummy",
    p2Kind: definition.attacker === "p2" ? "lamuh_proto" : "training_dummy",
    p1X: -300,
    p2X: 300
  });
  state.fighters.p1.facing = 1;
  state.fighters.p1.attackFacing = 1;
  state.fighters.p2.facing = -1;
  state.fighters.p2.attackFacing = -1;
  const input = definition.attacker === "p1" ? { p1: { ...definition.input } } : { p2: { ...definition.input } };
  return {
    definition,
    state,
    input,
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
      previousExpectedThrowActive: false,
      failure: null
    }
  };
}

export function observeThrowCadenceReview(
  setup: ThrowCadenceReviewSetup,
  state: MatchState
): { p1?: InputFrame; p2?: InputFrame } | null {
  const { definition, tracker } = setup;
  if (tracker.stage === "complete" || tracker.stage === "failed") return null;
  const interaction = state.throwInteraction;
  if (interaction && (interaction.attacker !== definition.attacker || interaction.throwId !== definition.expectedThrowId)) {
    tracker.stage = "failed";
    tracker.failure = `unexpected throw ${interaction.throwId} by ${interaction.attacker}`;
    return null;
  }

  const active = interaction?.attacker === definition.attacker && interaction.throwId === definition.expectedThrowId;
  if (active && !tracker.previousExpectedThrowActive) {
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
  if (!active && tracker.previousExpectedThrowActive) {
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

  tracker.previousExpectedThrowActive = active;
  return queuedInput;
}
