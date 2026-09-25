import { createMatch, restoreSnapshot, saveSnapshot, tick } from "../core/engine";
import { executeReplay, ReplayRecording } from "../core/replay";
import { InputFrame, MatchState, TickResult } from "../core/types";

export type DebugMode = "live" | "replay";

export interface DebugRuntimeOptions {
  seed?: number;
  replay?: ReplayRecording;
}

export class DebugRuntime {
  mode: DebugMode = "live";
  paused = false;
  state: MatchState;
  replay: ReplayRecording | null;
  replayCursor = 0;
  readonly initialSnapshot: MatchState;
  lastResult: TickResult | null = null;

  constructor(options: DebugRuntimeOptions = {}) {
    this.state = createMatch(options.seed ?? options.replay?.seed ?? 1234);
    this.initialSnapshot = saveSnapshot(this.state);
    this.replay = options.replay ?? null;
  }

  setReplay(replay: ReplayRecording) {
    this.replay = replay;
    this.mode = "replay";
    this.reset();
  }

  setMode(mode: DebugMode) {
    this.mode = mode;
    this.reset();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  togglePause() {
    this.paused = !this.paused;
    return this.paused;
  }

  reset() {
    const seed = this.mode === "replay" && this.replay ? this.replay.seed : this.initialSnapshot.seed;
    this.state = createMatch(seed);
    this.replayCursor = 0;
    this.lastResult = null;
  }

  step(liveInput: { p1?: InputFrame; p2?: InputFrame } = {}, force = false): TickResult | null {
    if (this.paused && !force) return null;
    const input = this.mode === "replay" ? this.nextReplayInput() : liveInput;
    this.lastResult = tick(this.state, input);
    return this.lastResult;
  }

  frameAdvance(liveInput: { p1?: InputFrame; p2?: InputFrame } = {}) {
    return this.step(liveInput, true);
  }

  runReplayToEnd(replay = this.replay): MatchState {
    if (!replay) throw new Error("No replay loaded");
    return executeReplay(replay);
  }

  get checksum() {
    return this.state.checksums[this.state.checksums.length - 1] ?? "pending";
  }

  getSerializableState() {
    return saveSnapshot(this.state);
  }

  restore(snapshot: MatchState) {
    this.state = restoreSnapshot(snapshot);
  }

  private nextReplayInput() {
    if (!this.replay || this.replayCursor >= this.replay.frames.length) return {};
    const frame = this.replay.frames[this.replayCursor++];
    return { p1: frame.p1, p2: frame.p2 };
  }
}
