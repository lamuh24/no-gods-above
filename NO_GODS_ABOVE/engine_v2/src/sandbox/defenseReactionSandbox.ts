export type SandboxFighterId = "p1" | "p2";
export type SandboxControlState = "idle" | "walk_forward" | "walk_backward" | "crouch" | "standing_block_entry" | "standing_block_hold" | "standing_block_release" | "crouching_block_entry" | "crouching_block_hold" | "crouching_block_release" | "light_hit_reaction" | "heavy_hit_reaction";

interface Exposure { sourceFrameId: string; start: number; duration: number; }
interface PresentationEvent { index: number; frame: number; type: string; payload: { trigger?: string; socket?: string; profile?: string; optional?: boolean }; eventIdTemplate: string; }
interface CompiledAnimation {
  id: string;
  simulationLength: number;
  exposures: Exposure[];
  gameplayTimingStatus: { authoritative: boolean; candidateValues: Record<string, unknown> };
  playbackPolicy: { mode: string; cursorOwner: string; hitstopFreezesCursor: boolean; holdBehavior: string };
  presentationTrack: PresentationEvent[];
  groundingTrack: Array<{ sourceFrameId: string; root: Point; nearFoot: Point; farFoot: Point; nearFootRole: string; farFootRole: string; projectedGroundPlaneY: number }>;
}
export interface CompiledDefenseManifest { fighterId: string; deployable: boolean; animations: CompiledAnimation[]; }
export interface Point { x: number; y: number; }

export interface SandboxPresentationEvent {
  id: string;
  fighterId: SandboxFighterId;
  packageId: string;
  type: string;
  profile: string;
  socket: string;
  optional: boolean;
  simulationTick: number;
  deduplicated: boolean;
}

export interface SandboxFighterState {
  id: SandboxFighterId;
  x: number;
  facing: 1 | -1;
  controlState: SandboxControlState;
  packageId: string | null;
  packageTick: number;
  packageInstance: number;
  heldBlock: boolean;
  heldDown: boolean;
  hitstopCursor: number;
  hitstunCursor: number;
  blockstunCursor: number;
  fallbackWarnings: string[];
  lastPresentationEventId: string | null;
}

export interface SandboxSnapshot {
  tick: number;
  fighters: Record<SandboxFighterId, SandboxFighterState>;
}

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

export class SwahiliDefenseReactionSandbox {
  readonly packages: Record<string, CompiledAnimation>;
  readonly emittedEvents: SandboxPresentationEvent[] = [];
  readonly eventLedger = new Set<string>();
  tick = 0;
  paused = true;
  fighters: Record<SandboxFighterId, SandboxFighterState>;

  constructor(readonly manifest: CompiledDefenseManifest) {
    if (manifest.fighterId !== "swahili" || manifest.deployable !== false) throw new Error("Sandbox requires the non-deployable Swahili candidate manifest");
    this.packages = Object.fromEntries(manifest.animations.map((animation) => [animation.id, animation]));
    for (const id of ["standing_block", "crouching_block", "light_hit_reaction", "heavy_hit_reaction"]) {
      const animation = this.packages[id];
      if (!animation || animation.playbackPolicy.cursorOwner !== "simulation" || animation.gameplayTimingStatus.authoritative) throw new Error(`Invalid sandbox package ${id}`);
    }
    this.fighters = { p1: this.newFighter("p1"), p2: this.newFighter("p2") };
  }

  private newFighter(id: SandboxFighterId): SandboxFighterState {
    return { id, x: id === "p1" ? 320 : 960, facing: id === "p1" ? 1 : -1, controlState: "idle", packageId: null, packageTick: 0, packageInstance: 0, heldBlock: false, heldDown: false, hitstopCursor: 0, hitstunCursor: 0, blockstunCursor: 0, fallbackWarnings: [], lastPresentationEventId: null };
  }

  reset() {
    this.tick = 0;
    this.fighters = { p1: this.newFighter("p1"), p2: this.newFighter("p2") };
    this.emittedEvents.length = 0;
    this.eventLedger.clear();
  }

  snapshot(): SandboxSnapshot { return { tick: this.tick, fighters: clone(this.fighters) }; }
  restore(snapshot: SandboxSnapshot, preservePresentationLedger = true) {
    this.tick = snapshot.tick;
    this.fighters = clone(snapshot.fighters);
    if (!preservePresentationLedger) this.eventLedger.clear();
  }

  setBaseState(id: SandboxFighterId, state: "idle" | "walk_forward" | "walk_backward" | "crouch") {
    const fighter = this.fighters[id];
    Object.assign(fighter, { controlState: state, packageId: null, packageTick: 0, hitstopCursor: 0, hitstunCursor: 0, blockstunCursor: 0, heldBlock: false, heldDown: state === "crouch" });
  }

  startBlock(id: SandboxFighterId, crouching = false) {
    const fighter = this.fighters[id];
    if (fighter.hitstunCursor > 0) return false;
    fighter.packageId = crouching ? "crouching_block" : "standing_block";
    fighter.packageTick = 0;
    fighter.packageInstance++;
    fighter.heldBlock = true;
    fighter.heldDown = crouching;
    fighter.controlState = crouching ? "crouching_block_entry" : "standing_block_entry";
    return true;
  }

  releaseBlock(id: SandboxFighterId) { this.fighters[id].heldBlock = false; }

  receiveBlockedHit(id: SandboxFighterId) {
    const fighter = this.fighters[id];
    if (fighter.packageId !== "standing_block" && fighter.packageId !== "crouching_block") return false;
    const values = this.packages[fighter.packageId].gameplayTimingStatus.candidateValues as { sandboxBlockedHit?: { hitstopTicks?: number; blockstunTicks?: number } };
    fighter.hitstopCursor = values.sandboxBlockedHit?.hitstopTicks ?? 0;
    fighter.blockstunCursor = values.sandboxBlockedHit?.blockstunTicks ?? 0;
    this.emitPresentation(id, "external_block_contact");
    return true;
  }

  receiveHit(id: SandboxFighterId, weight: "light" | "heavy") {
    const fighter = this.fighters[id];
    const packageId = `${weight}_hit_reaction`;
    const animation = this.packages[packageId];
    const values = animation.gameplayTimingStatus.candidateValues as { sandboxHitstopTicks?: number; sandboxHitstunTicks?: number };
    fighter.packageId = packageId;
    fighter.packageTick = 0;
    fighter.packageInstance++;
    fighter.controlState = packageId as SandboxControlState;
    fighter.hitstopCursor = values.sandboxHitstopTicks ?? 0;
    fighter.hitstunCursor = values.sandboxHitstunTicks ?? animation.simulationLength;
    fighter.blockstunCursor = 0;
    this.emitPresentation(id, "external_hit_result");
    return true;
  }

  sideSwitch() {
    const p1x = this.fighters.p1.x;
    this.fighters.p1.x = this.fighters.p2.x;
    this.fighters.p2.x = p1x;
    this.fighters.p1.facing = -1;
    this.fighters.p2.facing = 1;
  }

  setCorner(side: "left" | "right") {
    if (side === "left") Object.assign(this.fighters.p1, { x: 220, facing: 1 as const });
    else Object.assign(this.fighters.p1, { x: 1060, facing: -1 as const });
  }

  step(count = 1) { for (let index = 0; index < count; index++) this.stepOnce(); }

  private stepOnce() {
    for (const id of ["p1", "p2"] as const) this.progressFighter(this.fighters[id]);
    this.tick++;
  }

  private progressFighter(fighter: SandboxFighterState) {
    if (fighter.hitstopCursor > 0) { fighter.hitstopCursor--; return; }
    if (fighter.hitstunCursor > 0) {
      fighter.hitstunCursor--;
      const animation = fighter.packageId ? this.packages[fighter.packageId] : null;
      if (animation) fighter.packageTick = Math.min(animation.simulationLength - 1, fighter.packageTick + 1);
      if (fighter.hitstunCursor === 0) this.returnToControl(fighter);
      return;
    }
    if (fighter.blockstunCursor > 0) fighter.blockstunCursor--;
    if (!fighter.packageId) return;
    if (fighter.packageId === "standing_block" || fighter.packageId === "crouching_block") this.progressBlock(fighter);
  }

  private progressBlock(fighter: SandboxFighterState) {
    const packageId = fighter.packageId;
    if (!packageId) return;
    const crouching = packageId === "crouching_block";
    if (fighter.controlState.endsWith("_entry")) {
      fighter.packageTick++;
      if (fighter.packageTick >= 4) { fighter.packageTick = 4; fighter.controlState = crouching ? "crouching_block_hold" : "standing_block_hold"; }
      return;
    }
    if (fighter.controlState.endsWith("_hold")) {
      if (fighter.packageTick < 15) fighter.packageTick++;
      if (!fighter.heldBlock && fighter.blockstunCursor === 0) { fighter.packageTick = 16; fighter.controlState = crouching ? "crouching_block_release" : "standing_block_release"; }
      return;
    }
    if (fighter.controlState.endsWith("_release")) {
      fighter.packageTick++;
      if (fighter.packageTick >= this.packages[packageId].simulationLength) {
        fighter.packageId = null;
        fighter.packageTick = 0;
        fighter.controlState = crouching ? "crouch" : "idle";
      }
    }
  }

  private returnToControl(fighter: SandboxFighterState) {
    fighter.packageId = null;
    fighter.packageTick = 0;
    fighter.controlState = fighter.heldDown ? "crouch" : "idle";
    if (fighter.heldBlock) this.startBlock(fighter.id, fighter.heldDown);
  }

  artworkExposure(id: SandboxFighterId) {
    const fighter = this.fighters[id];
    if (!fighter.packageId) return { sourceFrameId: this.baseFrame(fighter.controlState), start: 0, duration: 1, packageTick: 0 };
    const animation = this.packages[fighter.packageId];
    const exposure = animation.exposures.find((item) => fighter.packageTick >= item.start && fighter.packageTick < item.start + item.duration) ?? animation.exposures.at(-1)!;
    return { ...exposure, packageTick: fighter.packageTick };
  }

  grounding(id: SandboxFighterId) {
    const fighter = this.fighters[id];
    if (!fighter.packageId) return null;
    const sourceFrameId = this.artworkExposure(id).sourceFrameId;
    return this.packages[fighter.packageId].groundingTrack.find((item) => item.sourceFrameId === sourceFrameId) ?? null;
  }

  diagnostics(id: SandboxFighterId) {
    const fighter = this.fighters[id];
    return { simulationTick: this.tick, gameplayState: fighter.controlState, artworkExposure: this.artworkExposure(id), hitstunCursor: fighter.hitstunCursor, blockstunCursor: fighter.blockstunCursor, hitstopCursor: fighter.hitstopCursor, root: { x: fighter.x, y: 650 }, sourceGrounding: this.grounding(id), packageId: fighter.packageId, presentationEventId: fighter.lastPresentationEventId, fallbackWarnings: [...fighter.fallbackWarnings], facing: fighter.facing };
  }

  private baseFrame(state: SandboxControlState) {
    if (state === "crouch") return "crouch";
    if (state === "walk_forward") return "walk_forward_contact";
    if (state === "walk_backward") return "walk_backward_rearward_contact";
    return "idle_00";
  }

  private emitPresentation(id: SandboxFighterId, trigger: string) {
    const fighter = this.fighters[id];
    if (!fighter.packageId) return;
    for (const event of this.packages[fighter.packageId].presentationTrack.filter((item) => item.payload.trigger === trigger)) {
      const eventId = `${this.tick}:${id}:${fighter.packageInstance}:${event.index}`;
      const deduplicated = this.eventLedger.has(eventId);
      if (!deduplicated) this.eventLedger.add(eventId);
      const emitted: SandboxPresentationEvent = { id: eventId, fighterId: id, packageId: fighter.packageId, type: event.type, profile: event.payload.profile ?? "unspecified", socket: event.payload.socket ?? "none", optional: event.payload.optional === true, simulationTick: this.tick, deduplicated };
      this.emittedEvents.push(emitted);
      fighter.lastPresentationEventId = eventId;
    }
  }
}
