import type { FighterId, MatchState } from "../core/types";

/**
 * Rounds match flow. Owns presentation-level match structure only: round intro, timer,
 * knockout and time-over resolution, round and match results. The simulation stays
 * authoritative for every hit; the director reads state after each tick and never writes it.
 */
export type RoundPhase = "intro" | "fight" | "ko" | "time" | "outro" | "match_end";
export type RoundWinner = FighterId | "draw";
export interface RoundRules { roundsToWin: number; roundSeconds: number; }
export interface Announcement { text: string; sub?: string; tone: "round" | "fight" | "ko" | "time" | "win" | "match"; key: string; }
export interface RoundSummary { round: number; winner: RoundWinner; method: "ko" | "double_ko" | "time" | "perfect"; seconds: number; }

const INTRO_TICKS = 96, FIGHT_UNLOCK_TICK = 62, KO_HOLD_TICKS = 110, TIME_HOLD_TICKS = 80, OUTRO_TICKS = 150;

export class RoundDirector {
  phase: RoundPhase = "intro";
  phaseTicks = 0;
  round = 1;
  wins: Record<FighterId, number> = { p1: 0, p2: 0 };
  timerTicks: number;
  lastRound: RoundSummary | null = null;
  history: RoundSummary[] = [];
  matchWinner: FighterId | null = null;
  /** Set on the tick a new round must be created; the caller clears it after resetting. */
  pendingReset = false;

  constructor(readonly rules: RoundRules, private readonly names: Record<FighterId, string>) {
    this.timerTicks = rules.roundSeconds * 60;
  }

  get inputsLocked(): boolean {
    return (this.phase === "intro" && this.phaseTicks < FIGHT_UNLOCK_TICK) || this.phase === "ko" || this.phase === "time" || this.phase === "outro" || this.phase === "match_end";
  }
  /** Simulation speed. A knockout plays out in slow motion before the hold. */
  get timeScale(): number {
    if (this.phase === "ko" && this.phaseTicks < 42) return 0.3;
    return 1;
  }
  get finalRound(): boolean { return this.wins.p1 === this.rules.roundsToWin - 1 && this.wins.p2 === this.rules.roundsToWin - 1; }
  get secondsLeft(): number { return Math.ceil(this.timerTicks / 60); }
  get koFlash(): boolean { return this.phase === "ko" && this.phaseTicks < 6; }

  /** Advance one simulation tick. Returns true when the round's outcome was decided this tick. */
  afterTick(state: MatchState): boolean {
    this.phaseTicks++;
    const { p1, p2 } = state.fighters;
    switch (this.phase) {
      case "intro":
        if (this.phaseTicks >= INTRO_TICKS) this.enter("fight");
        return false;
      case "fight": {
        const koP1 = !!p1.knockedOut, koP2 = !!p2.knockedOut;
        if (koP1 || koP2) {
          const winner: RoundWinner = koP1 && koP2 ? "draw" : koP1 ? "p2" : "p1";
          const perfect = winner !== "draw" && state.fighters[winner].health >= 1000;
          this.decide(winner, koP1 && koP2 ? "double_ko" : perfect ? "perfect" : "ko");
          this.enter("ko");
          return true;
        }
        if (!state.ultimateInteraction && this.timerTicks > 0) this.timerTicks--;
        if (this.timerTicks === 0) {
          const ratio = (id: FighterId) => state.fighters[id].health / 1000;
          const winner: RoundWinner = Math.abs(ratio("p1") - ratio("p2")) < 0.0005 ? "draw" : ratio("p1") > ratio("p2") ? "p1" : "p2";
          this.decide(winner, "time");
          this.enter("time");
          return true;
        }
        return false;
      }
      case "ko": {
        const loserDown = [p1, p2].filter((f) => f.knockedOut).every((f) => f.grounded);
        if (this.phaseTicks >= KO_HOLD_TICKS && loserDown) this.enter("outro");
        return false;
      }
      case "time":
        if (this.phaseTicks >= TIME_HOLD_TICKS) this.enter("outro");
        return false;
      case "outro":
        if (this.phaseTicks >= OUTRO_TICKS) {
          const champion = (["p1", "p2"] as FighterId[]).find((id) => this.wins[id] >= this.rules.roundsToWin);
          if (champion) { this.matchWinner = champion; this.enter("match_end"); }
          else { this.round++; this.timerTicks = this.rules.roundSeconds * 60; this.pendingReset = true; this.enter("intro"); }
        }
        return false;
      case "match_end":
        return false;
    }
  }

  announcement(): Announcement | null {
    switch (this.phase) {
      case "intro":
        if (this.phaseTicks < 58) return { text: this.finalRound ? "FINAL ROUND" : `ROUND ${this.round}`, tone: "round", key: `round-${this.round}` };
        return { text: "FIGHT", tone: "fight", key: `fight-${this.round}` };
      case "ko": {
        const summary = this.lastRound!;
        return { text: summary.method === "double_ko" ? "DOUBLE K.O." : "K.O.", tone: "ko", key: `ko-${this.round}` };
      }
      case "time":
        return { text: "TIME", tone: "time", key: `time-${this.round}` };
      case "outro": {
        const summary = this.lastRound!;
        if (summary.winner === "draw") return { text: "DRAW", tone: "win", key: `win-${this.round}` };
        return { text: `${this.names[summary.winner]} WINS`, sub: summary.method === "perfect" ? "PERFECT" : summary.method === "time" ? "TIME OVER" : undefined, tone: "win", key: `win-${this.round}` };
      }
      default:
        return null;
    }
  }

  /** Start a fresh match with the same players and rules. */
  rematch() {
    this.round = 1; this.wins = { p1: 0, p2: 0 }; this.history = []; this.lastRound = null; this.matchWinner = null;
    this.timerTicks = this.rules.roundSeconds * 60; this.pendingReset = true; this.enter("intro");
  }

  private decide(winner: RoundWinner, method: RoundSummary["method"]) {
    // A draw awards both players the round unless that would end the match on a shared win.
    if (winner === "draw") {
      const bothFinish = this.wins.p1 + 1 >= this.rules.roundsToWin && this.wins.p2 + 1 >= this.rules.roundsToWin;
      if (!bothFinish) { this.wins.p1++; this.wins.p2++; }
    } else this.wins[winner]++;
    this.lastRound = { round: this.round, winner, method, seconds: this.rules.roundSeconds - this.secondsLeft };
    this.history.push(this.lastRound);
  }
  private enter(phase: RoundPhase) { this.phase = phase; this.phaseTicks = 0; }
}
