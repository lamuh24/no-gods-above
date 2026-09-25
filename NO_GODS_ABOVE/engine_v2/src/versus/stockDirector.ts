import type { FighterId, MatchState } from "../core/types";
import type { Announcement } from "./roundDirector";

/** Match structure for the open-platform ruleset. The engine owns combat and blast losses. */
export class StockDirector {
  lives: Record<FighterId, number>;
  phase: "intro" | "fight" | "loss" | "match_end" = "intro";
  phaseTicks = 0;
  lossNumber = 0;
  matchWinner: FighterId | "draw" | null = null;
  pendingRespawn: FighterId[] = [];

  constructor(readonly stocks: number, readonly names: Record<FighterId, string>) {
    this.lives = { p1: stocks, p2: stocks };
  }

  get inputsLocked() { return this.phase === "intro" || this.phase === "loss" || this.phase === "match_end"; }
  get koFlash() { return this.phase === "loss" && this.phaseTicks < 7; }

  afterTick(state: MatchState) {
    this.phaseTicks++;
    if (this.phase === "intro") { if (this.phaseTicks >= 70) this.enter("fight"); return; }
    if (this.phase === "fight") {
      const lost = (["p1", "p2"] as FighterId[]).filter(side => !!state.fighters[side].knockedOut);
      if (!lost.length) return;
      for (const side of lost) this.lives[side] = Math.max(0, this.lives[side] - 1);
      this.pendingRespawn = lost.filter(side => this.lives[side] > 0);
      this.lossNumber++;
      this.enter("loss");
      return;
    }
    if (this.phase === "loss" && this.phaseTicks >= 85) {
      if (this.lives.p1 === 0 || this.lives.p2 === 0) {
        this.matchWinner = this.lives.p1 === this.lives.p2 ? "draw" : this.lives.p1 > 0 ? "p1" : "p2";
        this.enter("match_end");
      } else {
        this.enter("intro");
      }
    }
  }

  takeRespawns(): FighterId[] {
    if (this.phase !== "intro") return [];
    return this.pendingRespawn.splice(0);
  }

  announcement(): Announcement | null {
    if (this.phase === "intro") return { text: this.lossNumber ? "READY" : "STOCK BATTLE", sub: `${this.stocks} LIVES EACH`, tone: "round", key: `stock-intro-${this.lossNumber}` };
    if (this.phase === "loss") return { text: "STOCK LOST", sub: `${this.lives.p1} — ${this.lives.p2}`, tone: "ko", key: `stock-loss-${this.lossNumber}` };
    return null;
  }

  rematch() {
    this.lives = { p1: this.stocks, p2: this.stocks };
    this.lossNumber = 0; this.matchWinner = null; this.pendingRespawn = [];
    this.enter("intro");
  }

  private enter(phase: typeof this.phase) { this.phase = phase; this.phaseTicks = 0; }
}
