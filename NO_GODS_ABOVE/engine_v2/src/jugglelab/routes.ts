import { AttackId, InputFrame, MatchState } from "../core/types";

export type RouteId = "air_light_medium_heavy" | "air_heavy_only" | "air_five_action" | "ground_chain";

export interface RouteDefinition {
  readonly id: RouteId;
  readonly label: string;
  readonly description: string;
  /** Attacks the route is expected to show, in order, including the opener. */
  readonly expectedRoute: readonly AttackId[];
  readonly airborne: boolean;
  readonly buttons: ReadonlyArray<"light" | "medium" | "heavy">;
}

export const juggleRoutes: readonly RouteDefinition[] = [
  {
    id: "air_light_medium_heavy",
    label: "2H → j.J → j.K → j.L",
    description: "Launcher into the standard three-hit juggle that ends in soft knockdown.",
    expectedRoute: ["crouching_heavy", "air_light", "air_medium", "air_heavy"],
    airborne: true,
    buttons: ["light", "medium", "heavy"]
  },
  {
    id: "air_five_action",
    label: "2H → j.J → j.K → j.J → j.K → j.L",
    description: "Full five-action route that spends the whole juggle budget.",
    expectedRoute: ["crouching_heavy", "air_light", "air_medium", "air_light", "air_medium", "air_heavy"],
    airborne: true,
    buttons: ["light", "medium", "light", "medium", "heavy"]
  },
  {
    id: "air_heavy_only",
    label: "2H → j.L",
    description: "Launcher straight into the air heavy ender. Slowest route to read frame by frame.",
    expectedRoute: ["crouching_heavy", "air_heavy"],
    airborne: true,
    buttons: ["heavy"]
  },
  {
    id: "ground_chain",
    label: "5L → 5M → 5H",
    description: "Grounded chain, for comparing standing attack motion against the air route.",
    expectedRoute: ["standing_light", "standing_medium", "standing_heavy"],
    airborne: false,
    buttons: ["medium", "heavy"]
  }
];

export interface RouteStage {
  readonly label: string;
  /** Input sent on the first tick of the stage only. */
  readonly press?: InputFrame;
  /** Input sent on every later tick of the stage. */
  readonly hold?: InputFrame;
  /** Attack this stage is trying to start. The press is retried until the simulation runs it. */
  readonly expectAttack?: AttackId;
  readonly until: (state: MatchState) => boolean;
  readonly timeoutTicks: number;
}

const HOLD_FORWARD: InputFrame = { right: true };

function attacker(state: MatchState) { return state.fighters.p1; }
function defender(state: MatchState) { return state.fighters.p2; }

/**
 * Builds the same scripted route the air-knockdown regression test drives, expressed as per-tick
 * stages so the harness can play it in real time at any speed. The driver only supplies inputs; the
 * simulation decides every result.
 */
export function buildRouteStages(route: RouteDefinition): RouteStage[] {
  const stages: RouteStage[] = [];
  const opener: InputFrame = route.airborne ? { down: true, heavy: true } : { light: true };
  const openerLabel = route.airborne ? "2H launcher" : "5L opener";

  stages.push({ label: openerLabel, press: opener, hold: {}, expectAttack: route.expectedRoute[0], until: (state) => attacker(state).comboCount >= 1, timeoutTicks: 90 });
  stages.push({ label: "hitstop", hold: {}, until: (state) => attacker(state).hitstop === 0, timeoutTicks: 40 });

  if (route.airborne) {
    stages.push({ label: "jump cancel", press: { up: true, ...HOLD_FORWARD }, hold: HOLD_FORWARD, until: (state) => !attacker(state).grounded, timeoutTicks: 40 });
  }

  route.buttons.forEach((button, index) => {
    const target = index + 2;
    const label = route.airborne ? `j.${button[0]!.toUpperCase()} (hit ${target})` : `5${button[0]!.toUpperCase()} (hit ${target})`;
    stages.push({
      label,
      press: { [button]: true, ...HOLD_FORWARD } as InputFrame,
      hold: HOLD_FORWARD,
      expectAttack: route.expectedRoute[index + 1],
      until: (state) => attacker(state).comboCount >= target,
      timeoutTicks: 110
    });
    stages.push({ label: `${label} hitstop`, hold: {}, until: (state) => attacker(state).hitstop === 0, timeoutTicks: 40 });
  });

  stages.push({
    label: "ender recovery",
    hold: {},
    until: (state) => attacker(state).grounded && attacker(state).phase !== "attack" && defender(state).grounded,
    timeoutTicks: 180
  });
  stages.push({ label: "reset pause", hold: {}, until: () => false, timeoutTicks: 45 });

  return stages;
}
