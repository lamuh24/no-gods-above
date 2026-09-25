import { currentAttackPhase, fighterExtendedHurtboxes, fighterPushbox, resolveAttackDefinition } from "../../core/engine";
import type { AttackId, FighterId, FighterState, InputFrame, MatchState, Rect } from "../../core/types";
import type { CharacterId } from "../roster";
import { CPU_KITS, isJump, type Button, type Command, type ComboRoute, type CpuKit, type Dir } from "./cpuKits";

/**
 * Competitive CPU.
 *
 * The CPU plays through the same input path a player uses: it returns one InputFrame per tick
 * and the simulation decides every result. It reads the opponent through a reaction delay (a
 * history of past opponent snapshots) and reads frame data from the live attack definitions,
 * so difficulty changes perception and decision quality, never the rules.
 *
 * Deterministic: all randomness is a hash of the match seed, tick, side and a decision counter,
 * so a CPU vs CPU match replays identically.
 */
export type CpuLevel = "easy" | "normal" | "hard" | "master";
interface Profile {
  /** Ticks between an opponent action and the CPU noticing it. */
  reaction: number;
  block: number; antiAir: number; punish: number;
  /** Chance to drop a confirmed combo at each link. */
  drop: number;
  aggression: number; burst: number; reversal: number;
}
export const CPU_PROFILES: Record<CpuLevel, Profile> = {
  easy: { reaction: 24, block: 0.3, antiAir: 0.15, punish: 0.2, drop: 0.3, aggression: 0.45, burst: 0, reversal: 0.03 },
  normal: { reaction: 16, block: 0.58, antiAir: 0.42, punish: 0.5, drop: 0.1, aggression: 0.55, burst: 0.3, reversal: 0.08 },
  hard: { reaction: 11, block: 0.8, antiAir: 0.7, punish: 0.8, drop: 0.03, aggression: 0.62, burst: 0.55, reversal: 0.14 },
  master: { reaction: 8, block: 0.9, antiAir: 0.86, punish: 0.94, drop: 0, aggression: 0.68, burst: 0.8, reversal: 0.2 }
};

interface MoveInfo { startup: number; reach: number; total: number; top: number; bottom: number; }
interface PlanState { route: ComboRoute; index: number; waited: number; startInstance: number; started: boolean; }
type TacticName = "approach" | "dash_in" | "retreat" | "hold" | "jump_in" | "poke" | "zone" | "throw" | "pressure" | "bait" | "space" | "meaty" | "counter";
interface Tactic { name: TacticName; ticks: number; age: number; command?: Command; }

const CONTROLLABLE = new Set(["idle", "walk_forward", "walk_backward", "crouch", "crouch_release", "block", "turn"]);

function hashUnit(...parts: number[]): number {
  let n = 0x9e3779b9;
  for (const part of parts) { n = Math.imul(n ^ (part | 0), 2654435761); n ^= n >>> 15; n = Math.imul(n, 2246822519); n ^= n >>> 13; }
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class CpuBrain {
  readonly kit: CpuKit;
  readonly profile: Profile;
  private history: FighterState[] = [];
  private queue: InputFrame[] = [];
  private plan: PlanState | null = null;
  private tactic: Tactic | null = null;
  private recentTactics: TacticName[] = [];
  private blockRead = { instance: -1, block: false };
  private antiAirRead = -1;
  private punishRead = -1;
  private burstRead = -1;
  private wakeRead = -1;
  private wakeChoice: "block" | "backdash" | "counter" | "jab" = "block";
  private counter = 0;
  private cooldown = 0;
  private opponentAirborneSince = -1;
  private lastBlockstun = 0;
  private jumpGuardRead = -1;
  /** Move instance whose hit the CPU already routed (or chose to drop); never reconfirmed. */
  private handledInstance = -1;
  private moveCache = new Map<string, MoveInfo>();
  label = "neutral";

  constructor(readonly side: FighterId, readonly character: CharacterId, readonly level: CpuLevel, private seed: number) {
    this.kit = CPU_KITS[character];
    this.profile = CPU_PROFILES[level];
  }

  /** Clears everything tied to a round, keeping identity and difficulty. */
  reset(seed = this.seed) {
    this.seed = seed; this.history = []; this.queue = []; this.plan = null; this.tactic = null; this.recentTactics = [];
    this.blockRead = { instance: -1, block: false }; this.antiAirRead = -1; this.punishRead = -1; this.burstRead = -1; this.wakeRead = -1;
    this.counter = 0; this.cooldown = 0; this.opponentAirborneSince = -1; this.lastBlockstun = 0; this.jumpGuardRead = -1; this.handledInstance = -1; this.label = "neutral";
  }

  private roll(state: MatchState): number { return hashUnit(this.seed, state.tick, this.side === "p1" ? 11 : 29, this.counter++); }

  input(state: MatchState): InputFrame {
    const me = state.fighters[this.side], opp = state.fighters[this.side === "p1" ? "p2" : "p1"];
    this.history.push({ ...opp });
    if (this.history.length > 48) this.history.shift();
    const seen = this.history[Math.max(0, this.history.length - 1 - this.profile.reaction)];
    if (!opp.grounded && this.opponentAirborneSince < 0) this.opponentAirborneSince = state.tick;
    if (opp.grounded) this.opponentAirborneSince = -1;
    if (this.cooldown > 0) this.cooldown--;

    if (me.knockedOut || opp.knockedOut || state.ultimateInteraction) { this.abort(); return {}; }
    const throwing = state.throwInteraction;
    if (throwing && (throwing.attacker === me.id || throwing.defender === me.id)) { this.abort(); return {}; }

    if (me.hitstun > 0 || me.phase === "hit_reaction") { this.abort(); return this.whileHit(state, me, opp); }
    if (me.phase === "air_recovery") { this.abort(); this.label = "air tech"; return state.tick % 2 ? {} : this.build(me, { dir: "B" }); }
    if (me.phase === "knockdown" || me.phase === "getup") { this.abort(); return this.wakeup(state, me); }
    if (me.blockstun > 0) { this.abort(); this.lastBlockstun = me.blockstun; this.label = "blocking"; return this.build(me, { dir: seen.grounded ? "DB" : "B" }); }
    if (this.lastBlockstun > 0) {
      // Just left blockstun next to an attacker who still has the initiative: usually keep guard.
      this.lastBlockstun = 0;
      if (this.punishWindow(seen, opp) === 0 && this.bodyGap(me, opp) < 150 && this.roll(state) < this.profile.block * 0.75) {
        this.tactic = { name: "hold", ticks: 8 + Math.floor(this.roll(state) * 16), age: 0 };
      }
    }

    if (this.queue.length) return this.queue.shift()!;
    if (this.plan) {
      const output = this.runPlan(state, me, opp);
      if (output) return output;
    }
    // A hit from outside a plan (a poke, a jump-in, a meaty) is confirmed into the best route.
    if (!this.plan && me.phase === "attack" && me.currentAttack && me.attackConnected && this.confirmFrom(state, me)) {
      const output = this.runPlan(state, me, opp);
      if (output) return output;
    }
    if (me.phase === "attack" || me.phase === "dive_landing") return {};

    if (me.phase === "jump" || me.phase === "jump_startup") return this.airborne(state, me, opp);
    if (me.phase === "dash" && this.tactic?.name === "dash_in") return this.dashArrival(state, me, opp);
    if (!CONTROLLABLE.has(me.phase)) return {};

    return this.reactOrAct(state, me, opp, seen);
  }

  // ---------------------------------------------------------------------------
  // Reactive layer
  // ---------------------------------------------------------------------------
  private reactOrAct(state: MatchState, me: FighterState, opp: FighterState, seen: FighterState): InputFrame {
    const gap = this.bodyGap(me, opp);

    // Anti-air: one read per opponent jump.
    if (!seen.grounded && seen.hitstun === 0 && !seen.knockedOut && this.opponentAirborneSince >= 0 && this.antiAirRead !== this.opponentAirborneSince) {
      const height = -seen.y, dx = Math.abs(seen.x - me.x), approaching = (seen.x - me.x) * seen.vx < 0 || dx < 60;
      if (approaching && seen.vy > -4 && height > 30 && height < 175 && dx < 190) {
        this.antiAirRead = this.opponentAirborneSince;
        if (this.roll(state) < this.profile.antiAir) {
          const route = this.kit.routes.find((r) => r.role === "anti_air");
          if (route) { this.startPlan(route, 0, me); this.label = "anti-air"; const out = this.runPlan(state, me, opp); if (out) return out; }
        }
      }
    }

    // Respect a jump-in that is not being anti-aired: stand guard while it arrives.
    if (!seen.grounded && seen.hitstun === 0 && this.opponentAirborneSince >= 0 && this.jumpGuardRead !== this.opponentAirborneSince
      && Math.abs(seen.x - me.x) < 200 && (seen.x - me.x) * seen.vx < 0) {
      this.jumpGuardRead = this.opponentAirborneSince;
      if (this.roll(state) < this.profile.block * 0.8) this.tactic = { name: "hold", ticks: 26, age: 0 };
    }

    // Guard against a perceived incoming strike. One decision per opponent move instance.
    const threat = this.threat(state, me, seen);
    if (threat) {
      const key = seen.currentMoveInstance * 4 + (threat.projectile ? 1 : 0);
      if (this.blockRead.instance !== key) {
        const r = this.roll(state);
        this.blockRead = { instance: key, block: r < this.profile.block };
        const stance = this.kit.counterStance;
        if (stance && !threat.projectile && threat.ticks >= 5 && this.roll(state) < this.profile.reversal * 0.6) {
          this.label = "counter stance";
          this.tactic = null;
          return this.build(me, stance);
        }
      }
      if (this.blockRead.block) { this.label = "guard"; return this.build(me, { dir: seen.grounded && !threat.projectile ? "DB" : "B" }); }
    }

    // Whiff and block punishes: the opponent's committed recovery against our fastest reaching opener.
    const punish = this.punishWindow(seen, opp);
    if (punish > 0 && this.punishRead !== seen.currentMoveInstance) {
      this.punishRead = seen.currentMoveInstance;
      if (this.roll(state) < this.profile.punish) {
        const route = this.bestRoute(state, me, opp, gap, punish, ["punish", "confirm", "meter"]);
        if (route) { this.startPlan(route, 0, me); this.label = `punish: ${route.id}`; const out = this.runPlan(state, me, opp); if (out) return out; }
      }
    }

    // Guard loses to throws. An opponent walking into point-blank range is checked with a fast low.
    if (this.pushGap(me, opp) < 26 && (seen.phase === "walk_forward" || seen.phase === "dash") && this.cooldown === 0) {
      if (this.roll(state) < 0.2 + this.profile.reversal * 2) {
        this.cooldown = 14; this.label = "throw check";
        const route = this.kit.routes.find((r) => r.role === "confirm" && !isJump(r.steps[0]) && (r.steps[0] as Command).attack === this.kit.lowJab.attack);
        this.startPlan(route ?? { id: "throw_check", role: "confirm", steps: [this.kit.lowJab] }, 0, me);
        const out = this.runPlan(state, me, opp); if (out) return out;
      }
    }

    // A downed opponent: move in for a meaty, or respect the wakeup.
    if (opp.phase === "knockdown" || opp.phase === "getup") return this.oki(state, me, opp, gap);

    return this.neutral(state, me, opp, gap);
  }

  private whileHit(state: MatchState, me: FighterState, opp: FighterState): InputFrame {
    this.label = "hit";
    // One burst read per opponent move that extends a combo of three or more hits.
    if (opp.comboCount >= 3 && me.burst >= 100 && this.burstRead !== opp.currentMoveInstance) {
      this.burstRead = opp.currentMoveInstance;
      if (this.roll(state) < this.profile.burst * 0.35) { this.label = "burst"; return { burst: true }; }
    }
    return {};
  }

  private wakeup(state: MatchState, me: FighterState): InputFrame {
    this.label = "wakeup";
    const knockdownId = me.recoveryEvent?.tick ?? -1;
    if (this.wakeRead !== knockdownId) {
      this.wakeRead = knockdownId;
      const r = this.roll(state);
      const reversal = this.profile.reversal;
      this.wakeChoice = r < reversal ? "counter" : r < reversal * 2 && this.character === "lamuh" ? "backdash" : r < reversal * 2.6 ? "jab" : "block";
    }
    if (me.phase === "getup" && me.getupTicks <= 2) {
      if (this.wakeChoice === "backdash") { const back = this.build(me, { dir: "B" }); this.queue.push(back, {}, back); return {}; }
      if (this.wakeChoice === "counter" && this.kit.counterStance) { this.queue.push(this.build(me, this.kit.counterStance)); return {}; }
      if (this.wakeChoice === "jab") { this.queue.push(this.build(me, this.kit.lowJab)); return {}; }
      return this.build(me, { dir: "DB" });
    }
    return {};
  }

  // ---------------------------------------------------------------------------
  // Offense
  // ---------------------------------------------------------------------------
  private neutral(state: MatchState, me: FighterState, opp: FighterState, gap: number): InputFrame {
    if (!this.tactic || this.tactic.age >= this.tactic.ticks) this.chooseTactic(state, me, opp, gap);
    const tactic = this.tactic!;
    tactic.age++;
    this.label = tactic.name;
    const [near, far] = this.kit.preferredRange;
    const wallBehind = this.wallBehind(state, me);
    switch (tactic.name) {
      case "approach":
        if (gap <= near * 0.55) { this.tactic = null; return {}; }
        return this.walk(me, opp, 1);
      case "space": {
        const walkingIn = opp.phase === "walk_forward" || opp.phase === "dash";
        const tip = this.kit.pokes.find((command) => { const reach = this.info(me, command.attack).reach; return gap <= reach && gap >= reach - 34; });
        if (tip && walkingIn && this.cooldown === 0 && this.roll(state) < 0.25 + this.profile.aggression * 0.35) {
          this.tactic = null; this.cooldown = 16; this.label = "whiff punish";
          this.startPlan({ id: `tip:${tip.attack}`, role: "confirm", steps: [tip] }, 0, me);
          return this.runPlan(state, me, opp) ?? {};
        }
        const target = (near + far) / 2;
        if (Math.abs(gap - target) < 18) return {};
        return this.walk(me, opp, gap > target || wallBehind < 40 ? 1 : -1);
      }
      case "retreat":
        if (wallBehind < 36) { this.tactic = null; return {}; }
        return this.walk(me, opp, -1);
      case "hold":
        return this.build(me, { dir: "DB" });
      case "bait":
        return this.walk(me, opp, tactic.age < tactic.ticks * 0.4 ? 1 : -1);
      case "dash_in": {
        const forward = this.build(me, { dir: "F" });
        this.queue.push({}, forward);
        return forward;
      }
      case "jump_in":
        // Age > 1 means this jump already happened and the CPU has landed without striking.
        if (tactic.age > 1) { this.tactic = null; return {}; }
        this.tactic = { name: "jump_in", ticks: 70, age: 5 };
        this.queue.push(this.build(me, { dir: "F" }));
        return this.build(me, { dir: "UF" });
      case "poke":
      case "zone":
      case "counter": {
        const command = tactic.command;
        this.tactic = null;
        this.cooldown = tactic.name === "zone" ? 26 : 12;
        if (!command) return {};
        const route = this.kit.routes.find((r) => !isJump(r.steps[0]) && (r.steps[0] as Command).attack === command.attack);
        this.startPlan(route ?? { id: `single:${command.attack}`, role: "confirm", steps: [command] }, 0, me);
        return this.runPlan(state, me, opp) ?? {};
      }
      case "throw": {
        // Throws only capture a grounded opponent who is not reeling, blocking a hit, or rising.
        const throwable = opp.grounded && opp.hitstun === 0 && opp.blockstun === 0 && opp.knockdownTicks === 0 && opp.getupTicks === 0 && opp.wakeupInvuln === 0;
        if (!throwable) return opp.phase === "getup" || opp.blockstun > 0 ? this.build(me, { dir: "D" }) : {};
        if (this.pushGap(me, opp) > 8) return this.walk(me, opp, 1);
        this.tactic = null; this.cooldown = 20;
        return this.build(me, { buttons: ["throw"], dir: wallBehind < 90 && this.roll(state) < 0.6 ? "B" : undefined });
      }
      case "pressure": {
        this.tactic = null;
        const routes = this.kit.routes.filter((r) => r.role === "confirm" && !isJump(r.steps[0]) && this.info(me, (r.steps[0] as Command).attack).reach >= gap - 4);
        if (!routes.length) return this.walk(me, opp, 1);
        this.startPlan(routes[Math.floor(this.roll(state) * routes.length)], 0, me);
        return this.runPlan(state, me, opp) ?? {};
      }
      case "meaty":
        this.tactic = null;
        return {};
    }
    return {};
  }

  private chooseTactic(state: MatchState, me: FighterState, opp: FighterState, gap: number) {
    const style = this.kit.style, aggression = this.profile.aggression;
    const [near, far] = this.kit.preferredRange;
    const wallBehind = this.wallBehind(state, me), oppWall = this.wallBehind(state, opp);
    const weights: Array<[TacticName, number, Command?]> = [];
    const add = (name: TacticName, weight: number, command?: Command) => { if (weight > 0) weights.push([name, weight, command]); };
    const poke = this.kit.pokes.filter((p) => { const i = this.info(me, p.attack); return i.reach >= gap && i.reach - gap < 70; });
    const zoneable = this.kit.projectiles.filter((p) => this.info(me, p.attack).reach >= gap && gap > 150);
    const offense = (w: number) => w * (0.5 + aggression) * (this.cooldown > 0 ? 0.25 : 1);
    if (gap > far) {
      add("approach", 2.6 * style.rushdown);
      add("dash_in", offense(1.4 * style.rushdown));
      if (zoneable.length) add("zone", offense(2.2 * style.zoning), zoneable[Math.floor(this.roll(state) * zoneable.length)]);
      add("jump_in", offense(0.5 * style.jumpIns));
      add("hold", 0.4 * style.patience);
    } else if (gap > near * 0.55) {
      add("approach", 1.2);
      add("space", 1.1 * style.patience);
      if (poke.length) add("poke", offense(2.4), poke[Math.floor(this.roll(state) * poke.length)]);
      add("jump_in", offense(1.3 * style.jumpIns));
      add("dash_in", offense(1.2 * style.rushdown));
      if (zoneable.length) add("zone", offense(0.9 * style.zoning), zoneable[0]);
      add("retreat", wallBehind > 90 ? 0.7 * style.patience : 0);
      add("bait", 0.7 * style.patience);
    } else {
      add("pressure", offense(2.8 * style.rushdown));
      add("throw", offense(0.8 * style.throws) * (opp.phase === "block" || opp.crouchBlocking ? 1.8 : 1));
      if (poke.length) add("poke", offense(0.9), poke[0]);
      add("retreat", wallBehind > 90 ? 0.9 * style.patience : 0);
      add("hold", (0.6 + this.profile.block * 1.4) * style.patience);
      add("jump_in", wallBehind < 70 ? 1.2 : 0.25);
      if (this.kit.counterStance && this.level !== "easy") add("counter", 0.25 * this.profile.reversal * 4, this.kit.counterStance);
    }
    if (oppWall < 80) for (const entry of weights) if (entry[0] === "pressure" || entry[0] === "throw") entry[1] *= 1.5;
    const last = this.recentTactics.slice(-2);
    for (const entry of weights) if (last.length === 2 && last[0] === entry[0] && last[1] === entry[0]) entry[1] *= 0.3;
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    let pick = this.roll(state) * total;
    let chosen = weights[weights.length - 1];
    for (const entry of weights) { pick -= entry[1]; if (pick <= 0) { chosen = entry; break; } }
    const duration = chosen[0] === "approach" || chosen[0] === "retreat" || chosen[0] === "space" || chosen[0] === "bait" ? 14 + Math.floor(this.roll(state) * 26)
      : chosen[0] === "hold" ? 14 + Math.floor(this.roll(state) * 22) : chosen[0] === "throw" ? 30 : 1;
    this.tactic = { name: chosen[0], ticks: duration, age: 0, ...(chosen[2] ? { command: chosen[2] } : {}) };
    this.recentTactics.push(chosen[0]);
    if (this.recentTactics.length > 6) this.recentTactics.shift();
  }

  private airborne(state: MatchState, me: FighterState, opp: FighterState): InputFrame {
    this.label = "airborne";
    if (me.phase !== "jump" || this.tactic?.name !== "jump_in") return {};
    const command = this.kit.jumpInAttack, info = this.info(me, command.attack);
    const dx = Math.abs(opp.x - me.x), height = opp.y - me.y;
    // Strike on the way down so the blow lands deep on the body.
    if (me.vy > 1 && dx < info.reach + 34 && height > 40 && height < 150 && opp.phase !== "knockdown") {
      this.tactic = null;
      const route = this.kit.routes.find((r) => r.role === "jump_in");
      this.startPlan(route ?? { id: "jump_in", role: "jump_in", steps: [command] }, 0, me);
      return this.runPlan(state, me, opp) ?? {};
    }
    return this.build(me, { dir: "F" });
  }

  private dashArrival(state: MatchState, me: FighterState, opp: FighterState): InputFrame {
    const gap = this.bodyGap(me, opp);
    if (gap > 70) return {};
    this.tactic = null;
    if (this.roll(state) < 0.3 * this.kit.style.throws && this.pushGap(me, opp) < 20) {
      this.tactic = { name: "throw", ticks: 12, age: 0 };
      return {};
    }
    const route = this.bestRoute(state, me, opp, gap, 99, ["confirm"]);
    if (!route) return {};
    this.startPlan(route, 0, me);
    return this.runPlan(state, me, opp) ?? {};
  }

  private oki(state: MatchState, me: FighterState, opp: FighterState, gap: number): InputFrame {
    this.label = "oki";
    const jab = this.kit.lowJab, startup = this.info(me, jab.attack).startup;
    if (gap > 40 && (opp.knockdownTicks > 14 || opp.phase === "getup")) {
      if (gap > 120 && opp.knockdownTicks > 30) { const forward = this.build(me, { dir: "F" }); this.queue.push({}, forward); return forward; }
      return this.walk(me, opp, 1);
    }
    // Time a low so its active frames overlap the first vulnerable tick after getup.
    const vulnerableIn = opp.phase === "knockdown" ? opp.knockdownTicks + 18 : opp.getupTicks;
    if (vulnerableIn === startup + 1 + Math.floor(this.roll(state) * 2)) {
      const route = this.kit.routes.find((r) => r.role === "confirm" && !isJump(r.steps[0]) && (r.steps[0] as Command).attack === jab.attack);
      if (route && this.roll(state) < 0.55 + this.profile.aggression * 0.4) { this.startPlan(route, 0, me); return this.runPlan(state, me, opp) ?? {}; }
      this.tactic = { name: "throw", ticks: 30, age: 0 };
    }
    return {};
  }

  // ---------------------------------------------------------------------------
  // Plans (combo routes)
  // ---------------------------------------------------------------------------
  private wantsSuper(state: MatchState, me: FighterState): boolean {
    if (me.tension < 100) return false;
    const opp = state.fighters[me.id === "p1" ? "p2" : "p1"];
    return opp.health <= 330 || hashUnit(this.seed, me.currentMoveInstance, 71) < 0.2;
  }
  private startPlan(route: ComboRoute, index: number, me: FighterState) {
    this.handledInstance = me.currentMoveInstance;
    this.plan = { route, index, waited: 0, startInstance: me.currentMoveInstance, started: false };
  }
  private abort() { this.plan = null; this.queue.length = 0; if (this.tactic && this.tactic.name !== "hold") this.tactic = null; }

  /** Finds a route containing the move that just hit and continues it from the next link. */
  private confirmFrom(state: MatchState, me: FighterState): boolean {
    if (me.currentMoveInstance === this.handledInstance) return false;
    const attack = me.currentAttack as AttackId;
    const candidates: Array<{ route: ComboRoute; index: number }> = [];
    for (const route of this.kit.routes) {
      if (route.requiresMeter && !this.wantsSuper(state, me)) continue;
      route.steps.forEach((step, index) => { if (!isJump(step) && step.attack === attack && index < route.steps.length - 1) candidates.push({ route, index }); });
    }
    if (!candidates.length) return false;
    const meter = candidates.find((c) => c.route.requiresMeter);
    const pick = meter && this.roll(state) < 0.8 ? meter : candidates[Math.floor(this.roll(state) * candidates.length)];
    this.handledInstance = me.currentMoveInstance;
    this.plan = { route: pick.route, index: pick.index, waited: 0, startInstance: me.currentMoveInstance, started: true };
    this.label = `confirm: ${pick.route.id}`;
    return true;
  }

  private runPlan(state: MatchState, me: FighterState, opp: FighterState): InputFrame | null {
    const plan = this.plan!;
    const step = plan.route.steps[plan.index];
    if (!step) { this.finishPlan(); return null; }
    plan.waited++;
    if (isJump(step)) {
      // A launcher hop is airborne but not yet a jump: wait for the cancel into the jump phase itself.
      if (me.phase === "jump") { this.advance(plan, me); return this.runPlan(state, me, opp); }
      if (plan.waited > (me.phase === "attack" ? 45 : 14)) { this.finishPlan(); return null; }
      return (plan.waited - 1) % 3 === 0 ? this.build(me, { dir: "UF" }) : this.build(me, { dir: "F" });
    }
    if (!plan.started) {
      if (me.phase === "attack" && me.currentAttack === step.attack && me.currentMoveInstance !== plan.startInstance) {
        plan.started = true; plan.startInstance = me.currentMoveInstance;
      } else {
        if (plan.waited > (step.air ? 34 : 24)) { this.finishPlan(); return null; }
        if (step.air && me.grounded) return {};
        if (plan.index > 0 && opp.hitstun === 0 && opp.blockstun === 0 && opp.grounded && opp.phase !== "knockdown") { this.finishPlan(); return null; }
        return (plan.waited - 1) % 3 === 0 ? this.build(me, step) : this.build(me, { dir: step.air ? "F" : step.dir === "D" ? "D" : undefined });
      }
    }
    if (me.currentMoveInstance !== plan.startInstance || (me.phase !== "attack" && me.phase !== "dive_landing")) { this.finishPlan(); return null; }
    if (me.attackConnected) {
      if (this.profile.drop > 0 && this.roll(state) < this.profile.drop) { this.finishPlan(); return null; }
      this.advance(plan, me);
      return this.plan ? this.runPlan(state, me, opp) : null;
    }
    if (me.attackBlocked) {
      if (plan.index + 1 < (plan.route.blockstringLength ?? 0)) { this.advance(plan, me); return this.runPlan(state, me, opp); }
      this.finishPlan();
      // After a blockstring, sometimes walk up and throw the opponent who kept holding guard.
      if (this.roll(state) < 0.35 * this.kit.style.throws) this.tactic = { name: "throw", ticks: 30, age: 0 };
      return {};
    }
    return {};
  }
  private advance(plan: PlanState, me: FighterState) {
    this.handledInstance = me.currentMoveInstance;
    plan.index++; plan.waited = 0; plan.started = false; plan.startInstance = me.currentMoveInstance;
    if (plan.index >= plan.route.steps.length) this.finishPlan();
  }
  private finishPlan() { this.plan = null; this.cooldown = Math.max(this.cooldown, 8); }

  private bestRoute(state: MatchState, me: FighterState, opp: FighterState, gap: number, window: number, roles: ComboRoute["role"][]): ComboRoute | null {
    const options = this.kit.routes.filter((route) => {
      if (!roles.includes(route.role) || isJump(route.steps[0]) || (route.steps[0] as Command).air) return false;
      if (route.requiresMeter && !this.wantsSuper(state, me)) return false;
      const info = this.info(me, (route.steps[0] as Command).attack);
      return info.startup <= window && info.reach >= gap;
    });
    if (!options.length) return null;
    const meter = options.find((route) => route.requiresMeter);
    if (meter && this.roll(state) < 0.7) return meter;
    const punish = options.filter((route) => route.role === "punish" && window >= 10);
    if (punish.length && this.roll(state) < 0.6) return punish[0];
    void opp;
    return options[Math.floor(this.roll(state) * options.length)];
  }

  // ---------------------------------------------------------------------------
  // Perception helpers
  // ---------------------------------------------------------------------------
  private threat(state: MatchState, me: FighterState, seen: FighterState): { ticks: number; projectile: boolean } | null {
    const hurt = fighterExtendedHurtboxes(me);
    if (seen.phase === "attack" && seen.currentAttack) {
      const attack = resolveAttackDefinition(seen);
      for (const hitbox of attack.hitboxes) {
        if (seen.phaseTick > hitbox.end) continue;
        const until = Math.max(0, hitbox.start - seen.phaseTick);
        if (until > 20) continue;
        const rect = this.rectFor(seen, hitbox.rect, 30);
        if (hurt.some((box) => this.overlap(rect, box))) return { ticks: until, projectile: false };
      }
      if (attack.projectile && seen.phaseTick <= attack.projectile.releaseTick) {
        const dx = Math.abs(me.x - seen.x), facingMe = Math.sign(me.x - seen.x) === seen.attackFacing;
        if (facingMe && dx < attack.projectile.spawnOffset.x + attack.projectile.maxTravel) return { ticks: attack.projectile.releaseTick - seen.phaseTick, projectile: true };
      }
    }
    for (const projectile of state.projectiles ?? []) {
      if (projectile.owner === me.id || projectile.ageTicks < this.profile.reaction * 0.5) continue;
      const toward = Math.sign(me.x - projectile.x) === projectile.facing;
      const dx = Math.abs(me.x - projectile.x);
      if (toward && dx < 260) return { ticks: Math.round(dx / Math.max(1, Math.abs(projectile.velocityX))), projectile: true };
    }
    return null;
  }

  /** Remaining committed recovery the CPU can see on a whiffed or blocked opponent move. */
  private punishWindow(seen: FighterState, live: FighterState): number {
    if (seen.phase === "dive_landing" && live.phase === "dive_landing") return 8;
    if (seen.phase !== "attack" || !seen.currentAttack || live.phase !== "attack" || live.currentMoveInstance !== seen.currentMoveInstance) return 0;
    if (currentAttackPhase(seen) !== "recovery" || seen.attackConnected) return 0;
    const attack = resolveAttackDefinition(live);
    if (attack.authoredDive || !seen.grounded) return 0;
    return attack.startup + attack.active + attack.recovery - live.phaseTick;
  }

  private info(f: FighterState, id: AttackId): MoveInfo {
    const key = `${f.kind}:${f.swahiliAirSpecialsV1 ? 1 : 0}:${id}`;
    const cached = this.moveCache.get(key);
    if (cached) return cached;
    const attack = resolveAttackDefinition(f, id);
    let reach = 0, startup = attack.startup, top = 0, bottom = -999;
    for (const hitbox of attack.hitboxes) {
      reach = Math.max(reach, hitbox.rect.x + hitbox.rect.w);
      startup = Math.min(startup, hitbox.start);
      top = Math.min(top, hitbox.rect.y); bottom = Math.max(bottom, hitbox.rect.y + hitbox.rect.h);
    }
    if (!attack.hitboxes.length) startup = attack.projectile?.releaseTick ?? attack.startup;
    if (attack.projectile) reach = Math.max(reach, attack.projectile.spawnOffset.x + Math.min(attack.projectile.maxTravel, 420));
    const segments = attack.rootMotionSegments ?? (attack.rootMotion ? [attack.rootMotion] : []);
    for (const segment of segments) for (let t = segment.start; t <= Math.min(segment.end, startup); t++) reach += Math.max(0, segment.velocity);
    if (attack.hitConfirm) reach = Math.max(reach, 0);
    const info = { startup, reach, total: attack.startup + attack.active + attack.recovery, top, bottom };
    this.moveCache.set(key, info);
    return info;
  }

  /** Horizontal distance from this fighter's centre to the nearest edge of the opponent's body. */
  private bodyGap(me: FighterState, opp: FighterState): number {
    const boxes = fighterExtendedHurtboxes(opp);
    if (!boxes.length) return Math.abs(opp.x - me.x);
    return opp.x >= me.x ? Math.max(0, Math.min(...boxes.map((b) => b.x)) - me.x) : Math.max(0, me.x - Math.max(...boxes.map((b) => b.x + b.w)));
  }
  private pushGap(me: FighterState, opp: FighterState): number {
    const a = fighterPushbox(me), b = fighterPushbox(opp);
    return Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w));
  }
  private wallBehind(state: MatchState, f: FighterState): number {
    const opp = state.fighters[f.id === "p1" ? "p2" : "p1"];
    return opp.x >= f.x ? f.x - state.stage.left : state.stage.right - f.x;
  }
  private rectFor(f: FighterState, rect: Rect, grow: number): Rect {
    const facing = f.attackFacing;
    const x = f.x + rect.x * facing - (facing < 0 ? rect.w : 0);
    return { x: x - grow, y: f.y + rect.y, w: rect.w + grow * 2, h: rect.h };
  }
  private overlap(a: Rect, b: Rect) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // ---------------------------------------------------------------------------
  // Input construction
  // ---------------------------------------------------------------------------
  private walk(me: FighterState, opp: FighterState, toward: 1 | -1): InputFrame {
    const screen = Math.sign(opp.x - me.x || me.facing) * toward;
    return screen > 0 ? { right: true } : { left: true };
  }
  build(me: FighterState, command: { buttons?: Button[]; dir?: Dir }): InputFrame {
    const out: Record<string, boolean> = {};
    for (const button of command.buttons ?? []) out[button] = true;
    const forward = me.facing === 1 ? "right" : "left", back = me.facing === 1 ? "left" : "right";
    const dir = command.dir ?? "";
    if (dir.includes("F")) out[forward] = true;
    if (dir.includes("B")) out[back] = true;
    if (dir.includes("U")) out.up = true;
    if (dir.includes("D")) out.down = true;
    return out as InputFrame;
  }
}
