import { createMatch, tick } from "./engine";
import { InputLogFrame, MatchConfig, MatchState } from "./types";

export interface ReplayRecording {
  schemaVersion: "2.0.0-alpha";
  seed: number;
  matchConfig?: MatchConfig;
  frames: InputLogFrame[];
  finalChecksum?: string;
}

export function recordReplay(state: MatchState): ReplayRecording {
  return {
    schemaVersion: "2.0.0-alpha", seed: state.seed,
    matchConfig: { matchId: state.matchId, ...state.matchConfig },
    frames: JSON.parse(JSON.stringify(state.inputLog)),
    finalChecksum: state.checksums[state.checksums.length - 1]
  };
}

export function executeReplay(replay: ReplayRecording): MatchState {
  const state = createMatch(replay.seed, replay.matchConfig);
  for (const frame of replay.frames) tick(state, { p1: frame.p1, p2: frame.p2 });
  return state;
}
