import { createMatch, tick } from "./engine";
import { InputLogFrame, MatchState } from "./types";

export interface ReplayRecording {
  schemaVersion: "2.0.0-alpha";
  seed: number;
  frames: InputLogFrame[];
  finalChecksum?: string;
}

export function recordReplay(state: MatchState): ReplayRecording {
  return { schemaVersion: "2.0.0-alpha", seed: state.seed, frames: JSON.parse(JSON.stringify(state.inputLog)), finalChecksum: state.checksums[state.checksums.length - 1] };
}

export function executeReplay(replay: ReplayRecording): MatchState {
  const state = createMatch(replay.seed);
  for (const frame of replay.frames) tick(state, { p1: frame.p1, p2: frame.p2 });
  return state;
}
