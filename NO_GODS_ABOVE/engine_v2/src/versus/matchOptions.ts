import type { FighterId } from "../core/types";
import type { CpuLevel } from "./cpu/cpuBrain";

export type MatchMode = "training" | "rounds" | "stocks";
export type Controller = "human" | "cpu";
export interface MatchOptions {
  mode: MatchMode;
  controllers: Record<FighterId, Controller>;
  cpuLevel: Record<FighterId, CpuLevel>;
  roundsToWin: number;
  roundSeconds: number;
  stocks: number;
  envelope: boolean;
  showBoxes: boolean;
}

export const CPU_LEVELS: CpuLevel[] = ["easy", "normal", "hard", "master"];

export function defaultMatchOptions(mode: MatchMode = "training"): MatchOptions {
  return {
    mode,
    controllers: { p1: "human", p2: mode === "training" ? "human" : "cpu" },
    cpuLevel: { p1: "hard", p2: "hard" },
    roundsToWin: 2,
    roundSeconds: 99,
    stocks: 3,
    envelope: true,
    showBoxes: false
  };
}

/** Deep links for scripted checks: ?mode=rounds&p1=cpu&p2=cpu&level=master&rounds=2&time=99 */
export function matchOptionsFromQuery(query: URLSearchParams): MatchOptions {
  const mode: MatchMode = query.get("mode") === "rounds" ? "rounds" : query.get("mode") === "stocks" ? "stocks" : "training";
  const options = defaultMatchOptions(mode);
  for (const side of ["p1", "p2"] as FighterId[]) {
    const controller = query.get(side);
    if (controller === "cpu" || controller === "human") options.controllers[side] = controller;
    const level = query.get(`${side}level`) ?? query.get("level");
    if (level && (CPU_LEVELS as string[]).includes(level)) options.cpuLevel[side] = level as CpuLevel;
  }
  if (query.get("cpu") === "1") options.controllers.p2 = "cpu";
  const rounds = Number(query.get("rounds"));
  if (rounds >= 1 && rounds <= 5) options.roundsToWin = Math.floor(rounds);
  const time = Number(query.get("time"));
  if (time >= 10 && time <= 999) options.roundSeconds = Math.floor(time);
  const stocks = Number(query.get("stocks"));
  if (stocks >= 1 && stocks <= 5) options.stocks = Math.floor(stocks);
  if (query.get("boxes") === "1") options.showBoxes = true;
  return options;
}
