import { InputFrame, MatchState } from "../core/types";
import { buildRouteStages, RouteDefinition, RouteStage } from "./routes";

export interface DriverStatus {
  readonly routeId: string;
  readonly stageIndex: number;
  readonly stageCount: number;
  readonly stageLabel: string;
  readonly ticksInStage: number;
  readonly loops: number;
  readonly desyncs: number;
  readonly lastDesync: string | null;
}

/**
 * Replays one scripted juggle route as per-tick inputs. It never writes fighter state: it only
 * decides which buttons P1 presses, exactly as a player would.
 */
export class JuggleRouteDriver {
  private stages: RouteStage[];
  private stageIndex = 0;
  private ticksInStage = 0;
  private pressed = false;
  loops = 0;
  desyncs = 0;
  lastDesync: string | null = null;
  restartRequested = false;

  constructor(private routeDefinition: RouteDefinition) {
    this.stages = buildRouteStages(routeDefinition);
  }

  get route() { return this.routeDefinition; }

  setRoute(route: RouteDefinition) {
    this.routeDefinition = route;
    this.stages = buildRouteStages(route);
    this.rewind();
    this.loops = 0;
    this.desyncs = 0;
    this.lastDesync = null;
  }

  /** Resets the script cursor only. Match state is reset by the harness. */
  rewind() {
    this.stageIndex = 0;
    this.ticksInStage = 0;
    this.pressed = false;
    this.restartRequested = false;
  }

  status(): DriverStatus {
    return {
      routeId: this.routeDefinition.id,
      stageIndex: this.stageIndex,
      stageCount: this.stages.length,
      stageLabel: this.stages[this.stageIndex]?.label ?? "complete",
      ticksInStage: this.ticksInStage,
      loops: this.loops,
      desyncs: this.desyncs,
      lastDesync: this.lastDesync
    };
  }

  /** Input for the next simulation tick, given the state produced by the previous one. */
  nextInput(state: MatchState): InputFrame {
    const stage = this.stages[this.stageIndex];
    if (!stage) return {};

    if (this.ticksInStage > 0 && stage.until(state)) {
      this.advance();
      return this.nextInput(state);
    }

    if (this.ticksInStage >= stage.timeoutTicks) {
      const finalStage = this.stageIndex === this.stages.length - 1;
      if (!finalStage) {
        this.desyncs++;
        this.lastDesync = `${stage.label} did not complete within ${stage.timeoutTicks} ticks`;
      }
      this.loops++;
      this.rewind();
      this.restartRequested = true;
      return {};
    }

    const first = !this.pressed;
    const cursor = this.ticksInStage;
    this.pressed = true;
    this.ticksInStage++;
    if (!stage.press) return stage.hold ?? {};
    if (first) return stage.press;
    // A press can be swallowed by hitstop or by an unavailable cancel window. Re-press on a clean
    // edge every few ticks until the simulation actually starts the move this stage is waiting on.
    const started = stage.expectAttack ? state.fighters.p1.currentAttack === stage.expectAttack : true;
    const retry = !started && cursor % 4 === 0;
    return retry ? stage.press : stage.hold ?? {};
  }

  private advance() {
    this.stageIndex++;
    this.ticksInStage = 0;
    this.pressed = false;
  }
}
