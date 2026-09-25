import { CelestePresenter } from './celestePresenter';
import type { FighterId, FighterState, MatchState } from "../core/types";
import { drawSwahiliGunfire } from "./swahiliGunVfx";
import { currentAscendHeavyChain, currentDivineCounter } from "../core/engine";
import { exposureFrame, fetchReviewData, loopFrame } from "../lamuhlegacy/common";
import { PreparedFrames, reactionFrameIndex, type ReactionPack } from "../lamuhlegacy/quality";
import { radiantDiveFrame } from "../lamuhlegacy/radiantDive";
import { crownVisual, loadCrown, crownPaths, drawCrownAura, drawCrownBeam, drawCrownChargeBall, drawCrownContacts, type CrownManifest } from "../lamuhlegacy/ultimate";
import { drawKiOrb } from "../lamuhlegacy/celestialPalm";
import { swahiliSandboxSpriteSources } from "../sandbox/swahiliSandboxSpriteSources";
import { swahiliSpriteGeometry, swahiliSpriteScale, type SwahiliClipGeometry } from "./swahiliSpriteGeometry";
import { swahiliStageSpriteSources } from "../stage/spriteSources";
import { newSpecialFrames, NEW_SPECIAL_GEOMETRY, NEW_SPECIAL_BODY_SCALES } from './swahiliNewSpecialFrames';
import { upRedoFrames } from './swahiliUpRedoFrames';
import { airMediumV10Frames } from './swahiliAirMediumV10Frames';
import { neutralLightFrames, neutralMediumFrames } from './swahiliNeutralRuntimeFrames';
import { hookFlowFrames as hookHeadbuttFrames } from './swahiliHookFlowFrames';
import groundSealUrl from '../../../../tools/nga-forge/production/characters/swahili/reviews/new-specials-runtime-v1/ground-seal.png?url';
import { ROSTER, drawScaleFor, rootFor, type CharacterId, type VersusCharacter } from "./roster";
import airLightRuntime01 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/01_air_light_contract_bullet_runtime.png?url";
import airLightRuntime02 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/02_air_light_contract_bullet_runtime.png?url";
import airLightRuntime03 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/03_air_light_contract_bullet_runtime.png?url";
import airLightRuntime04 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/04_air_light_contract_bullet_runtime.png?url";
import airLightRuntime05 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/05_air_light_contract_bullet_runtime.png?url";
import airLightRuntime06 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/06_air_light_contract_bullet_runtime.png?url";
import airLightRuntime07 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/07_air_light_contract_bullet_runtime.png?url";
import airLightRuntime08 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-light-v1/frames_1536/08_air_light_contract_bullet_runtime.png?url";
import airMediumSpecialChakramRuntime01 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/01_air_medium_special_scythe_grab_reach.png?url";
import airMediumSpecialChakramRuntime02 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/02_air_medium_special_scythe_grab_clamp.png?url";
import airMediumSpecialChakramRuntime03 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/03_air_medium_special_scythe_grab_lock.png?url";
import airMediumSpecialChakramRuntime04 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/04_air_medium_special_tuck_into_held_ball.png?url";
import airMediumSpecialChakramRuntime05 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/05_air_medium_special_chakram_spin_contact.png?url";
import airMediumSpecialChakramRuntime06 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/06_air_medium_special_chakram_spin_followthrough.png?url";
import airMediumSpecialChakramRuntime07 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/07_air_medium_special_chakram_spin_followthrough.png?url";
import airMediumSpecialChakramRuntime08 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/08_air_medium_special_chakram_spin_followthrough.png?url";
import airMediumSpecialChakramRuntime09 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/09_air_medium_special_chakram_spin_contact.png?url";
import airMediumSpecialChakramRuntime10 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/10_air_medium_special_chakram_spin_recovery.png?url";
import airMediumSpecialChakramRuntime11 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/11_air_medium_special_chakram_spin_recovery.png?url";
import airMediumSpecialChakramRuntime12 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/12_air_medium_special_chakram_spin_recovery.png?url";
import airMediumSpecialChakramRuntime13 from "../../../../tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/runtime-air-medium-special-chakram-held-mask-ball-v6/frames_1536/13_air_medium_special_chakram_spin_recovery.png?url";

export interface CoverageRow { label: string; status: "animated" | "single_pose" | "placeholder"; detail: string; }

export type WorldMap = { x: (x: number) => number; y: (y: number) => number };

/** Each fighter owns its own drawing so it can bring its own VFX and root policy. */
export interface Presenter {
  readonly character: VersusCharacter;
  preload(onProgress?: (done: number, total: number) => void): Promise<void>;
  draw(context: CanvasRenderingContext2D, fighter: FighterState, state: MatchState, world: WorldMap): void;
  /** Projectiles owned by this fighter; returns false when it has no art for one. */
  drawProjectile?(context: CanvasRenderingContext2D, projectile: any, world: WorldMap, worldScale: number): boolean;
  /** Character-owned effects drawn over the fighters: ki orbs, ultimate aura and beam. */
  /** `side` names the fighter this presenter draws, so mirror matches never double an effect. */
  drawEffects?(context: CanvasRenderingContext2D, state: MatchState, world: WorldMap, worldScale: number, side?: FighterId): void;
  coverage(): CoverageRow[];
  /** Every command the character can actually perform, for the move list panel. */
  moveList(): Array<{ command: string; name: string; animated: boolean }>;
}

function silhouette(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "rgba(150,160,180,.30)";
  context.fillRect(-22 * scale, -182 * scale, 44 * scale, 182 * scale);
  context.restore();
}

// ---------------------------------------------------------------------------
// Lamuh — complete move set, driven by the same manifests the Lamuh sandbox uses
// ---------------------------------------------------------------------------

interface Frame { publicPath: string; root?: { x: number; y: number }; bodyOnlyPublicPath?: string }
interface Sequence { frames: Frame[]; exposureTicks: number[] }

const LAMUH_ROOT = { x: 768, y: 1360 };

class LamuhPresenter implements Presenter {
  readonly character = ROSTER.lamuh;
  private readonly scale = drawScaleFor(ROSTER.lamuh.metrics);
  private readonly frames = new PreparedFrames(drawScaleFor(ROSTER.lamuh.metrics));
  private movement: Record<string, Sequence> = {};
  private attacks = new Map<string, Sequence>();
  private reactions: ReactionPack | null = null;
  private throws: any = null;
  private crown: CrownManifest | null = null;
  private downFamily: any = null;
  private divineLight: Sequence | null = null;
  private divineMedium: Sequence | null = null;
  private divineStance: Sequence | null = null;
  private divineResponse: Sequence | null = null;
  private heavyChain: { opener: Sequence; response: Sequence; projectileFrames: Frame[]; projectileExposureTicks: number[] } | null = null;
  private projectileArt = new Map<string, Sequence>();
  private missing = new Set<string>();

  private async json(url: string) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch { this.missing.add(url); return null; }
  }

  async preload(onProgress?: (done: number, total: number) => void) {
    const data = await fetchReviewData();

    for (const [id, state] of Object.entries(data.movementModernization.states)) {
      this.movement[id] = { frames: (state as any).frames, exposureTicks: (state as any).exposureTicks };
    }
    this.throws = data.throwAnimations;

    const closure = (c: any): Sequence | null =>
      c?.v2?.frames ? { frames: c.v2.frames, exposureTicks: c.timingCandidates?.B?.exposureTicks ?? c.v2.frames.map(() => 4) } : null;
    const put = (id: string, c: any) => { const s = closure(c); if (s) this.attacks.set(id, s); };

    put("standing_light", data.standingLightClosure); put("standing_medium", data.standingMediumClosure); put("standing_heavy", data.standingHeavyClosure);
    put("crouching_light", data.crouchingLightClosure); put("crouching_medium", data.crouchingMediumClosure); put("crouching_heavy", data.crouchingHeavyClosure);
    put("air_light", data.airLightClosure); put("air_medium", data.airMediumClosure); put("air_heavy", data.airHeavyClosure);
    for (const [s, c] of Object.entries((data as any).celestialPalmFamily?.variants ?? {})) put(`legacy_celestial_palm_${s}`, c);
    for (const [s, c] of Object.entries((data as any).heavenSplitterFamily?.variants ?? {})) put(`legacy_heaven_splitter_${s}`, c);
    for (const [s, c] of Object.entries((data as any).radiantDiveFamily?.variants ?? {})) put(`legacy_radiant_dive_${s}`, c);
    for (const [s, c] of Object.entries((data as any).ascendStepFamily?.variants ?? {})) put(s === "medium" ? "legacy_ascend_step" : `legacy_ascend_step_${s}`, c);

    // Forward family: the cleaned candidate supersedes the review-data variants.
    const forward = await this.json("/lamuh-legacy-v2/forward-clean-v1/manifest.json");
    for (const [s, c] of Object.entries(forward?.variants ?? {})) put(s === "medium" ? "legacy_ascend_step" : `legacy_ascend_step_${s}`, c);

    // Down specials (Aura Sweep L/M/H) — previously missing entirely.
    this.downFamily = await this.json("/lamuh-legacy-v2/down-specials-v1/manifest.json");
    if (this.downFamily?.projectileFrames) {
      this.projectileArt.set("legacy_aura_sweep_heavy_wave", { frames: this.downFamily.projectileFrames, exposureTicks: this.downFamily.projectileExposureTicks });
    }

    // Divine Vanish L/M, plus the Heavy counter stance and its triggered response.
    const divine = await this.json("/lamuh-legacy-v2/divine-vanish-v1/manifest.json");
    const divineMediumV4 = await this.json("/lamuh-legacy-v2/divine-vanish-medium-v4/manifest.json");
    this.divineLight = closure(divine?.variants?.light);
    this.divineMedium = closure(divineMediumV4?.medium) ?? closure(divine?.variants?.medium);
    const counter = await this.json("/lamuh-legacy-v2/counter-launch-v4/manifest.json");
    this.divineStance = counter?.stance ?? null;
    this.divineResponse = counter?.response ?? null;
    if (counter?.projectileFrames) {
      this.projectileArt.set("legacy_divine_vanish_counter_aura_ball", { frames: counter.projectileFrames, exposureTicks: counter.projectileExposureTicks });
    }

    // Ascend Heavy is a punch that confirms into a kick and an aura ball.
    this.heavyChain = await this.json("/lamuh-legacy-v2/heavy-chain-v1/manifest.json");
    if (this.heavyChain?.projectileFrames) {
      this.projectileArt.set("legacy_ascend_step_heavy_aura_ball", { frames: this.heavyChain.projectileFrames, exposureTicks: this.heavyChain.projectileExposureTicks });
    }

    const reactions = await this.json("/lamuh-legacy-v2/reactions-quality-v1/manifest.json");
    this.reactions = reactions as ReactionPack | null;
    this.crown = await loadCrown();

    const urls = new Set<string>();
    const add = (s?: Sequence | null) => s?.frames.forEach((f) => { urls.add(f.publicPath); if (f.bodyOnlyPublicPath) urls.add(f.bodyOnlyPublicPath); });
    Object.values(this.movement).forEach(add);
    this.attacks.forEach(add);
    this.projectileArt.forEach(add);
    add(this.divineLight); add(this.divineMedium); add(this.divineStance); add(this.divineResponse);
    if (this.heavyChain) { add(this.heavyChain.opener); add(this.heavyChain.response); }
    for (const variant of Object.values(this.downFamily?.variants ?? {})) add(variant as Sequence);
    for (const sequence of Object.values(this.throws?.sequences ?? {})) add(sequence as Sequence);
    this.reactions?.frames.forEach((f) => urls.add(f.publicPath));
    crownPaths(this.crown).forEach((p) => urls.add(p));

    const all = [...urls];
    const chunk = 24;
    for (let i = 0; i < all.length; i += chunk) {
      await this.frames.load(all.slice(i, i + chunk), 12);
      onProgress?.(Math.min(all.length, i + chunk), all.length);
    }
  }

  /** Draws a manifest frame, falling back to idle when the art is not cached. */
  private put(context: CanvasRenderingContext2D, frame: Frame | undefined, x: number, y: number, facing: 1 | -1, rotation = 0): boolean {
    if (!frame || !this.frames.has(frame.publicPath)) return false;
    this.frames.draw(context, frame.publicPath, frame.root ?? LAMUH_ROOT, x, y, facing, rotation);
    return true;
  }

  private at(sequence: Sequence | null | undefined, tick: number, loop = false): Frame | undefined {
    if (!sequence?.frames.length) return undefined;
    const index = loop
      ? loopFrame(sequence.frames.length, tick, Math.max(1, sequence.exposureTicks[0] ?? 8))
      : exposureFrame(sequence.exposureTicks, tick);
    return sequence.frames[Math.min(sequence.frames.length - 1, Math.max(0, index))];
  }

  private idleFrame(tick: number) { return this.at(this.movement.idle, tick, true); }

  draw(context: CanvasRenderingContext2D, f: FighterState, state: MatchState, world: WorldMap) {
    const x = world.x(f.x), y = world.y(f.y);
    const facing = f.phase === "attack" ? f.attackFacing : f.facing;

    // Ultimate owns the whole body while it is running.
    const crown = crownVisual(this.crown, state, f);
    if (crown && this.put(context, crown.record as Frame, x, y, (state.ultimateInteraction?.facing ?? f.attackFacing) as 1 | -1)) return;

    // Throw choreography.
    const interaction = state.throwInteraction;
    if (interaction && interaction.attacker === f.id && this.throws) {
      const connected = interaction.result === "connected" && (interaction.throwId === "forward_throw" || interaction.throwId === "back_throw") ? interaction.throwId : null;
      const sequence = this.throws.sequences[connected || "universal_grab_attempt"] as Sequence | undefined;
      if (sequence) {
        const visualTick = connected
          ? Math.min((sequence as any).totalTicks - 1, interaction.tick)
          : interaction.result === "whiff" ? (interaction.tick <= 6 ? 5 : interaction.tick < 12 ? 11 : 15) : interaction.tick;
        if (this.put(context, this.at(sequence, visualTick), x, y, f.facing)) return;
      }
    }

    // Hit reactions, knockdown, getup.
    if (this.reactions) {
      const index = reactionFrameIndex(f);
      if (index !== null && this.put(context, this.reactions.frames[index] as Frame, x, y, f.facing, f.phase === "thrown" ? f.throwRotation : 0)) return;
    }

    if (f.phase === "attack" && f.currentAttack) {
      const id = f.currentAttack;

      // Aura Sweep family.
      if (id.startsWith("legacy_aura_sweep_")) {
        const variant = this.downFamily?.variants?.[id.split("_").at(-1)!];
        if (this.put(context, this.at(variant, f.phaseTick), x, y, facing)) return;
      }
      // Ascend Heavy punch -> confirmed kick -> aura ball.
      if (id === "legacy_ascend_step_heavy" && this.heavyChain && currentAscendHeavyChain(f)) {
        const sequence = (f as any).ascendHeavyResponse ? this.heavyChain.response : this.heavyChain.opener;
        if (this.put(context, this.at(sequence, f.phaseTick), x, y, facing)) return;
      }
      // Divine Vanish: light/medium retreats, heavy counter stance and response.
      if (id.startsWith("legacy_divine_vanish")) {
        const strength = id.endsWith("light") ? "light" : id.endsWith("medium") ? "medium" : "heavy";
        const sequence = strength === "heavy"
          ? ((f as any).divineCounterResponse ? this.divineResponse : this.divineStance)
          : strength === "light" ? this.divineLight : this.divineMedium;
        void currentDivineCounter(f);
        if (this.put(context, this.at(sequence, f.phaseTick), x, y, facing)) return;
      }
      // Radiant Dive samples simulation stages, never art time.
      if (id.startsWith("legacy_radiant_dive_")) {
        const sequence = this.attacks.get(id);
        const index = radiantDiveFrame(f, state);
        if (sequence && index !== null && this.put(context, sequence.frames[Math.min(sequence.frames.length - 1, index)], x, y, facing)) return;
      }
      if (this.put(context, this.at(this.attacks.get(id), f.phaseTick), x, y, facing)) return;
    }

    const byPhase: Record<string, string> = {
      walk_forward: "walk_forward", walk_backward: "walk_backward", dash: "dash_forward", backdash: "dash_backward",
      crouch: "crouch", crouch_release: "crouch_to_stand", jump: "jump", jump_startup: "jump",
      air_dash_forward: "air_dash_forward", air_dash_backward: "air_dash_backward", turn: "turn_facing"
    };
    if (f.phase === "block") {
      if (this.put(context, this.at(this.movement[f.crouchBlocking ? "crouching_block" : "standing_block"], f.phaseTick), x, y, f.facing)) return;
    }
    const looping = f.phase === "walk_forward" || f.phase === "walk_backward";
    const id = byPhase[f.phase];
    if (id && this.put(context, this.at(this.movement[id], f.phaseTick, looping), x, y, f.facing)) return;
    if (this.put(context, this.idleFrame(f.phaseTick), x, y, f.facing)) return;
    silhouette(context, x, y, this.scale / (drawScaleFor(ROSTER.lamuh.metrics) / 1));
  }

  drawProjectile(context: CanvasRenderingContext2D, projectile: any, world: WorldMap, worldScale: number) {
    // Match the sandbox's authored counter aura-ball art and strength scaling.
    // Simulation remains authoritative for travel, collision and release timing.
    if (/^legacy_celestial_palm_(light|medium|heavy)$/.test(projectile.attackId)) {
      const palmArt = this.projectileArt.get("legacy_divine_vanish_counter_aura_ball");
      const palmFrame = this.at(palmArt, projectile.ageTicks ?? 0, true);
      if (palmFrame && this.frames.has(palmFrame.publicPath)) {
        const size = projectile.hitbox.rect.h / 48;
        context.save();
        context.translate(world.x(projectile.x), world.y(projectile.y));
        context.scale(size, size);
        this.frames.draw(context, palmFrame.publicPath, palmFrame.root ?? LAMUH_ROOT, 0, 0, projectile.facing as 1 | -1);
        context.restore();
      } else {
        drawKiOrb(context, world.x(projectile.x), world.y(projectile.y),
          projectile.hitbox.rect.h * 0.5 * worldScale, projectile.facing, projectile.ageTicks);
      }
      return true;
    }
    const art = this.projectileArt.get(projectile.hitbox?.id);
    const frame = this.at(art, projectile.ageTicks ?? 0, true);
    if (!frame || !this.frames.has(frame.publicPath)) {
      // Any other Lamuh projectile still reads as an energy orb rather than a box.
      drawKiOrb(context, world.x(projectile.x), world.y(projectile.y),
        projectile.hitbox.rect.h * 0.5 * worldScale, projectile.facing, projectile.ageTicks);
      return true;
    }
    this.frames.draw(context, frame.publicPath, frame.root ?? LAMUH_ROOT, world.x(projectile.x), world.y(projectile.y), projectile.facing as 1 | -1);
    return true;
  }

  /**
   * The ultimate's own layers. Without these the Crown played its body frames with
   * no charge ball, no aura and no beam, which read as "the ultimate isn't showing".
   */
  drawEffects(context: CanvasRenderingContext2D, state: MatchState, world: WorldMap) {
    if (!this.crown || !state.ultimateInteraction) return;
    drawCrownAura(context, this.frames, this.crown, state, world.x, world.y);
    drawCrownChargeBall(context, this.frames, this.crown, state, world.x, world.y);
    drawCrownBeam(context, this.frames, this.crown, state, world.x, world.y);
    drawCrownContacts(context, state, world.x, world.y);
  }

  /** Diagnostics for the smoke script: which frame a state actually resolves to. */
  debugFrameFor(f: FighterState, state: MatchState): string | null {
    const probe = { drew: null as string | null };
    const real = this.frames.draw.bind(this.frames);
    (this.frames as any).draw = function (this: unknown, ...args: unknown[]) { probe.drew = args[1] as string; return (real as Function).apply(null, args); };
    try {
      const noop = document.createElement("canvas").getContext("2d")!;
      this.draw(noop, f, state, { x: () => 0, y: () => 0 });
    } finally { (this.frames as any).draw = real; }
    return probe.drew;
  }

  moveList() {
    const animated = (id: string) => this.attacks.has(id);
    return [
      { command: "5L / 5M / 5H", name: "Standing normals", animated: animated("standing_light") },
      { command: "2L / 2M / 2H", name: "Crouching normals", animated: animated("crouching_light") },
      { command: "j.L / j.M / j.H", name: "Air normals", animated: animated("air_light") },
      { command: "U + L/M/H", name: "Celestial Palm", animated: animated("legacy_celestial_palm_light") },
      { command: "→ + U + L/M/H", name: "Ascend Step", animated: animated("legacy_ascend_step_light") },
      { command: "← + U + L/M/H", name: "Divine Vanish", animated: !!this.divineLight },
      { command: "↓ + U + L/M/H", name: "Aura Sweep", animated: !!this.downFamily },
      { command: "U then ↑ + L/M/H", name: "Heaven Splitter", animated: animated("legacy_heaven_splitter_light") },
      { command: "air U + L/M/H", name: "Radiant Dive", animated: animated("legacy_radiant_dive_light") },
      { command: "I  /  ← + I", name: "Forward / back throw", animated: !!this.throws },
      { command: "P (100 tension)", name: "Crown of No Gods", animated: !!this.crown }
    ];
  }

  coverage(): CoverageRow[] {
    const rows: CoverageRow[] = [
      { label: "Movement set", status: "animated", detail: `${Object.keys(this.movement).length} states` },
      { label: "Normals (9)", status: "animated", detail: "standing / crouching / air L M H" },
      { label: "Celestial Palm", status: this.attacks.has("legacy_celestial_palm_light") ? "animated" : "placeholder", detail: "neutral special, 3 strengths + orbs" },
      { label: "Ascend Step", status: this.attacks.has("legacy_ascend_step_light") ? "animated" : "placeholder", detail: this.heavyChain ? "forward special, Heavy confirms into kick + ball" : "forward special" },
      { label: "Divine Vanish", status: this.divineLight && this.divineStance ? "animated" : "placeholder", detail: "back special, Heavy is a counter stance" },
      { label: "Aura Sweep", status: this.downFamily ? "animated" : "placeholder", detail: "down special, Heavy releases a ground wave" },
      { label: "Heaven Splitter", status: this.attacks.has("legacy_heaven_splitter_light") ? "animated" : "placeholder", detail: "up special, 3 strengths" },
      { label: "Radiant Dive", status: this.attacks.has("legacy_radiant_dive_light") ? "animated" : "placeholder", detail: "air special, stage-driven" },
      { label: "Throws", status: this.throws ? "animated" : "placeholder", detail: "forward, back, grab whiff" },
      { label: "Reactions", status: this.reactions ? "animated" : "placeholder", detail: "hit / knockdown / getup" },
      { label: "Crown ultimate", status: this.crown ? "animated" : "placeholder", detail: this.crown ? "body sequences; cinematic camera stays in the Lamuh sandbox" : "candidate art unavailable" }
    ];
    if (this.missing.size) rows.push({ label: "Manifests missing", status: "placeholder", detail: `${this.missing.size}` });
    return rows;
  }
}

// ---------------------------------------------------------------------------
// Swahili
// ---------------------------------------------------------------------------

type PoseKey = keyof typeof swahiliSandboxSpriteSources;
const pose = (key: PoseKey) => swahiliSandboxSpriteSources[key].url;
const poses = (...keys: PoseKey[]) => keys.map(pose);
type StageFrameKey = keyof typeof swahiliStageSpriteSources;
const stagePose = (key: StageFrameKey) => swahiliStageSpriteSources[key];
const stagePoses = (...keys: StageFrameKey[]) => keys.map(stagePose);

interface Clip { urls: string[]; ticksPerFrame: number; loop: boolean; frameStarts?: number[] }
const clip = (urls: string[], ticksPerFrame: number, loop = false): Clip => ({ urls, ticksPerFrame, loop });

const SWAHILI_ATTACK_CLIPS: Record<string, Clip> = {
  standing_light: clip(poses(
    "standing_normals_motion_v1_light_01_compact_chamber", "standing_normals_motion_v1_light_02_fast_low_extension",
    "standing_normals_motion_v1_light_03_low_kick_contact", "standing_normals_motion_v1_light_04_post_contact_recoil",
    "standing_normals_motion_v1_light_05_leg_retraction", "standing_normals_motion_v1_light_06_planted_recovery"), 2),
  standing_medium: clip(poses(
    "standing_normals_motion_v1_medium_01_anticipation", "standing_normals_motion_v1_medium_02_hip_drive_rise",
    "standing_normals_motion_v1_medium_03_rising_knee_contact", "standing_normals_motion_v1_medium_04_knee_descent",
    "standing_normals_motion_v1_medium_05_torso_settling"), 4),
  standing_heavy: clip(poses(
    "standing_heavy_anticipation_v2", "standing_heavy_preparation", "standing_heavy_extension",
    "standing_heavy_impact_v2", "standing_heavy_recoil_v2", "standing_heavy_recovery"), 5),
  crouching_light: clip(poses(
    "crouching_light_v4_01_guarded_crouch", "crouching_light_v4_02_rapid_low_aim", "crouching_light_v4_03_point_blank_shot",
    "crouching_light_v4_04_compact_recoil", "crouching_light_v4_05_crouched_recovery"), 3),
  crouching_medium: clip(poses(
    "crouching_medium_opposed_split_shot_v6_01_guarded_crouch_preparation", "crouching_medium_opposed_split_shot_v6_02_opposed_split_alignment",
    "crouching_medium_opposed_split_shot_v6_03_simultaneous_contact", "crouching_medium_opposed_split_shot_v6_04_opposed_dual_recoil",
    "crouching_medium_opposed_split_shot_v6_05_controlled_pistol_lowering", "crouching_medium_opposed_split_shot_v6_06_crouched_recovery"), 4),
  crouching_heavy: clip(poses(
    "crouching_heavy_motion_v1_01_deep_rotational_anticipation", "crouching_heavy_motion_v1_02_sweep_acceleration",
    "crouching_heavy_motion_v1_03_low_ground_contact", "crouching_heavy_motion_v1_04_rotational_carry_past_contact",
    "crouching_heavy_motion_v1_05_committed_follow_through", "crouching_heavy_motion_v1_06_recovery_unwind",
    "crouching_heavy_motion_v1_07_planted_recovery"), 5),
  air_light: clip(poses(
    "air_light_compact_boot_v2_01_approved_apex_chamber", "air_light_compact_boot_v2_02_compact_boot_contact",
    "air_light_compact_boot_v2_03_approved_fall_connector", "air_light_compact_boot_v2_04_approved_falling_recovery"), 4),
  air_medium: clip(poses(
    "air_medium_scythe_shaft_v1_01_cross_body_load", "air_medium_scythe_shaft_v1_02_shaft_contact",
    "air_medium_scythe_shaft_v1_03_fall_compatible_unwind"), 5),
  air_heavy: clip(poses(
    "air_heavy_descending_hook_v1_01_committed_airborne_load", "air_heavy_descending_hook_v1_02_descending_hook_contact",
    "air_heavy_descending_hook_v1_03_post_contact_landing_carry", "air_heavy_descending_hook_v1_04_held_scythe_attack_landing_recovery"), 6),
  special_up_heavy: clip(poses(
    "grave_furrow_v1_01_grounded_ready", "grave_furrow_v1_02_blade_ground_plant", "grave_furrow_v1_03_ground_drag_connector",
    "grave_furrow_v1_04_maximum_furrow_resistance", "grave_furrow_v1_05_release_acceleration", "grave_furrow_v1_06_single_rising_contact",
    "grave_furrow_v1_07_launcher_follow_through", "grave_furrow_v1_08_controlled_recovery", "grave_furrow_v1_09_controlled_remount"), 7)
};

// The versus page is a real moveset playtest, not a hitbox lab. These clips use
// the same normalized Swahili motion frames as the stage/sandbox presenter so
// every authored special has a visible body sequence while its combat data stays
// owned by the deterministic core.
Object.assign(SWAHILI_ATTACK_CLIPS, {
  special_neutral_medium: clip(stagePoses(
    "special_neutral_medium_low_ready_anticipation", "special_neutral_medium_scythe_draw_short_load",
    "special_neutral_medium_control_strike_contact", "special_neutral_medium_follow_through_recoil",
    "special_neutral_medium_recovery_remount_start"), 4),
  special_forward_light: clip(stagePoses(
    "special_forward_light_motion_01", "special_forward_light_motion_02", "special_forward_light_motion_03",
    "special_forward_light_motion_04", "special_forward_light_motion_05", "special_forward_light_motion_06",
    "special_forward_light_motion_07", "special_forward_light_motion_08", "special_forward_light_motion_09",
    "special_forward_light_motion_10", "special_forward_light_motion_11", "special_forward_light_motion_12",
    "special_forward_light_motion_13", "special_forward_light_motion_14", "special_forward_light_motion_15",
    "special_forward_light_motion_16"), 2),
  special_forward_medium: clip(stagePoses(
    "special_forward_medium_motion_01", "special_forward_medium_motion_02", "special_forward_medium_motion_03",
    "special_forward_medium_motion_04", "special_forward_medium_motion_05", "special_forward_medium_motion_06",
    "special_forward_medium_motion_07", "special_forward_medium_motion_08", "special_forward_medium_motion_09",
    "special_forward_medium_motion_10", "special_forward_medium_motion_11", "special_forward_medium_motion_12",
    "special_forward_medium_motion_13", "special_forward_medium_motion_14", "special_forward_medium_motion_15",
    "special_forward_medium_motion_16"), 3),
  // Forward Heavy is the completed Execution Crescent V3 route, not the older
  // nine-pose Ground-Drag Slice key-pose study. Keep the full sixteen-frame
  // connected clip here so its running load, planted coil, single crescent
  // contact, carried follow-through, and low-ready recovery are visible in the
  // actual versus playtest.
  special_forward_heavy: clip(stagePoses(
    "special_forward_heavy_motion_01", "special_forward_heavy_motion_02", "special_forward_heavy_motion_03",
    "special_forward_heavy_motion_04", "special_forward_heavy_motion_05", "special_forward_heavy_motion_06",
    "special_forward_heavy_motion_07", "special_forward_heavy_motion_08", "special_forward_heavy_motion_09",
    "special_forward_heavy_motion_10", "special_forward_heavy_motion_11", "special_forward_heavy_motion_12",
    "special_forward_heavy_motion_13", "special_forward_heavy_motion_14", "special_forward_heavy_motion_15",
    "special_forward_heavy_motion_16"), 3),
  special_down_light: clip(stagePoses(
    "special_down_light_motion_01", "special_down_light_motion_02", "special_down_light_motion_03",
    "special_down_light_motion_04", "special_down_light_motion_05", "special_down_light_motion_06",
    "special_down_light_motion_07", "special_down_light_motion_08", "special_down_light_motion_09",
    "special_down_light_motion_10", "special_down_light_motion_11", "special_down_light_motion_12",
    "special_down_light_motion_13", "special_down_light_motion_14", "special_down_light_motion_15",
    "special_down_light_motion_16"), 3),
  special_down_medium: clip(stagePoses(
    "special_down_medium_motion_01", "special_down_medium_motion_02", "special_down_medium_motion_03",
    "special_down_medium_motion_04", "special_down_medium_motion_05", "special_down_medium_motion_06",
    "special_down_medium_motion_07", "special_down_medium_motion_08", "special_down_medium_motion_09",
    "special_down_medium_motion_10", "special_down_medium_motion_11", "special_down_medium_motion_12"), 4),
  special_down_heavy: clip(stagePoses(
    "special_down_heavy_low_ready", "special_down_heavy_scythe_take", "special_down_heavy_blade_flip_load",
    "special_down_heavy_deep_grounded_coil", "special_down_heavy_vertical_alignment", "special_down_heavy_staff_plant_contact",
    "special_down_heavy_post_plant_release", "special_down_heavy_gun_draw_turn", "special_down_heavy_spin_midpoint",
    "special_down_heavy_spin_brake_alignment", "special_down_heavy_dual_pistol_aim_hold", "special_down_heavy_contract_blast_contact",
    "special_down_heavy_contract_blast_recoil", "special_down_heavy_controlled_lower", "special_down_heavy_holster_turn",
    "special_down_heavy_scythe_reclaim", "special_down_heavy_ferrule_lift_remount", "special_down_heavy_ferrule_lift_hold"), 5),
  special_up_medium: clip(stagePoses(
    "special_up_medium_grounded_ready", "special_up_medium_low_loaded_anticipation", "special_up_medium_rising_hook_contact",
    "special_up_medium_upward_recoil_settle", "special_up_medium_controlled_remount_connector",
    "special_up_medium_controlled_remount_start"), 5),
  // Air normals stay on their own keys above. These special slots are separate
  // moves: Air Light and Air Medium use dedicated candidate runtime sheets,
  // while Heavy remains a distinct normalized proxy. Regular j.L/j.K/j.H air
  // normals are never reused for the special commands.
  special_air_light: clip([
    airLightRuntime01, airLightRuntime02, airLightRuntime03, airLightRuntime04,
    airLightRuntime05, airLightRuntime06, airLightRuntime07, airLightRuntime08
  ], 3),
  special_air_medium: clip([
    airMediumSpecialChakramRuntime01, airMediumSpecialChakramRuntime02, airMediumSpecialChakramRuntime03,
    airMediumSpecialChakramRuntime04, airMediumSpecialChakramRuntime05, airMediumSpecialChakramRuntime06,
    airMediumSpecialChakramRuntime07, airMediumSpecialChakramRuntime08, airMediumSpecialChakramRuntime09,
    airMediumSpecialChakramRuntime10, airMediumSpecialChakramRuntime11, airMediumSpecialChakramRuntime12,
    airMediumSpecialChakramRuntime13
  ], 3),
  special_air_heavy: clip(stagePoses(
    "special_forward_heavy_motion_01", "special_forward_heavy_motion_02", "special_forward_heavy_motion_03",
    "special_forward_heavy_motion_04", "special_forward_heavy_motion_05", "special_forward_heavy_motion_06",
    "special_forward_heavy_motion_07", "special_forward_heavy_motion_08", "special_forward_heavy_motion_09",
    "special_forward_heavy_motion_10", "special_forward_heavy_motion_11", "special_forward_heavy_motion_12",
    "special_forward_heavy_motion_13", "special_forward_heavy_motion_14", "special_forward_heavy_motion_15",
    "special_forward_heavy_motion_16"), 3),
  air_special_ender: clip(stagePoses(
    "special_forward_heavy_motion_01", "special_forward_heavy_motion_02", "special_forward_heavy_motion_03",
    "special_forward_heavy_motion_04", "special_forward_heavy_motion_05", "special_forward_heavy_motion_06",
    "special_forward_heavy_motion_07", "special_forward_heavy_motion_08", "special_forward_heavy_motion_09",
    "special_forward_heavy_motion_10", "special_forward_heavy_motion_11", "special_forward_heavy_motion_12",
    "special_forward_heavy_motion_13", "special_forward_heavy_motion_14", "special_forward_heavy_motion_15",
    "special_forward_heavy_motion_16"), 3)
});

const NEW_SPECIAL_CLIPS: Record<string, Clip> = {
  special_up_light: clip(newSpecialFrames('special_up_light', 16), 5),
  special_neutral_heavy: clip(newSpecialFrames('special_neutral_heavy', 12), 5),
  special_back_light: clip(newSpecialFrames('special_back_light', 12), 5),
  special_back_medium: clip(newSpecialFrames('special_back_medium', 12), 5),
  special_back_heavy: clip(newSpecialFrames('special_back_heavy', 8), 6),
  special_back_heavy_response: clip(newSpecialFrames('special_back_heavy_response', 12), 5),
  special_down_light: { ...clip(newSpecialFrames('special_down_light', 8), 4), frameStarts: [0,5,10,14,17,22,27,32] }
};
Object.assign(SWAHILI_ATTACK_CLIPS, NEW_SPECIAL_CLIPS);

// User-requested local playtest replacement. Old clips and source assets stay above.
const UP_REDO_CLIPS: Record<string, Clip> = {
  special_up_medium: { ...clip(upRedoFrames.special_up_medium, 3), frameStarts: [0,3,7,11,13,15,18,21,24,27,30,33] },
  special_up_heavy: { ...clip(upRedoFrames.special_up_heavy, 5), frameStarts: [0,8,18,27,34,37,40,44,48,53,58,62] }
};
Object.assign(SWAHILI_ATTACK_CLIPS, UP_REDO_CLIPS);
// Only the marked Air Medium changes; original Air Light and retained Heavy stay intact.
const AIR_MEDIUM_V10_CLIP: Clip = { ...clip(airMediumV10Frames, 3), frameStarts: [0,3,6,9,10,13,16,19,20,24,29,34] };
SWAHILI_ATTACK_CLIPS.special_air_medium = AIR_MEDIUM_V10_CLIP;
const NEUTRAL_RUNTIME_CLIPS: Record<string, Clip> = {
  swahili_paid_seal: { ...clip(neutralLightFrames, 4), frameStarts: [0,4,8,12,15,18,22,26,30,35,40,45] },
  swahili_paid_super: { ...clip(neutralLightFrames, 4), frameStarts: [0,4,8,12,15,18,22,26,30,35,40,45] },
  special_neutral_light: { ...clip(neutralLightFrames, 1), frameStarts: [0,1,2,3,4,5,6,7,8,9,10,11] },
  special_neutral_medium: { ...clip(neutralMediumFrames, 3), frameStarts: [0,2,4,6,9,13,19] },
};
Object.assign(SWAHILI_ATTACK_CLIPS, NEUTRAL_RUNTIME_CLIPS);
const HOOK_HEADBUTT_CLIP: Clip = { ...clip(hookHeadbuttFrames, 4), frameStarts: [0,4,7,11,14,18,22,26,30,32,38,45] };

const SWAHILI_MOVEMENT_CLIPS: Record<string, Clip> = {
  idle: clip(poses("idle_00", "idle_01", "idle_02", "idle_03"), 11, true),
  walk_forward: clip(poses(
    "walk_forward_contact", "walk_forward_neutral_departure", "walk_forward_passing", "walk_forward_opposite_contact",
    "walk_forward_return", "walk_forward_opposite_down", "walk_forward_opposite_passing", "walk_forward_opposite_up_return"), 6, true),
  walk_backward: clip(poses(
    "walk_backward_rearward_contact", "walk_backward_neutral_departure", "walk_backward_passing",
    "walk_backward_opposite_contact", "walk_backward_return"), 7, true),
  dash: clip(poses(
    "dash_forward_v2_startup_load", "dash_forward_v2_grounded_push_connector", "dash_forward_v2_committed_launch",
    "dash_forward_v2_low_travel_carry", "dash_forward_v2_deceleration_catch", "dash_forward_v2_brake_recovery"), 3),
  backdash: clip(poses(
    "dash_backward_v3_load_low", "dash_backward_v3_push_away", "dash_backward_v3_compact_retreat_hop_slide",
    "dash_backward_v3_max_retreat", "dash_backward_v3_controlled_landing", "dash_backward_v3_guarded_recovery"), 4),
  knockdown: clip(poses(
    "knockdown_recovery_03_ground_impact", "knockdown_recovery_04_impact_settle", "knockdown_recovery_05_face_up_knockdown"), 8),
  getup: clip(poses(
    "knockdown_recovery_08_push_to_kneel", "knockdown_recovery_09_neutral_get_up", "knockdown_recovery_10_rise_to_stand"), 6)
};

class SwahiliPresenter implements Presenter {
  readonly character = ROSTER.swahili;
  private readonly scale = drawScaleFor(ROSTER.swahili.metrics);
  private readonly root = rootFor(ROSTER.swahili.metrics);
  private readonly images = new Map<string, HTMLCanvasElement>();
  private readonly origins = new Map<string, { x: number; y: number }>();
  private readonly clipGeometry = new Map<string, SwahiliClipGeometry>(
    Object.entries(swahiliSpriteScale.clipOverrides).flatMap(([key, geometry]) =>
      SWAHILI_ATTACK_CLIPS[key].urls.map((url) => [url, geometry] as const))
  );
  private readonly failed = new Set<string>();
  private seal?: ImageBitmap;
  private paidToken?: ImageBitmap;

  drawEffects(context: CanvasRenderingContext2D, state: MatchState, world: WorldMap, worldScale: number, side?: FighterId) {
    for (const id of side ? [side] : (["p1", "p2"] as FighterId[])) {
      const fighter = state.fighters[id];
      if (fighter.kind === ROSTER.swahili.kind) drawSwahiliGunfire(context, fighter, state, world, worldScale);
    }
  }

  drawProjectile(context: CanvasRenderingContext2D, projectile: any, world: WorldMap, worldScale: number) {
    if(projectile.attackId==='swahili_paid_seal'||projectile.attackId==='swahili_paid_super'){
      if(this.paidToken){const size=46*worldScale;context.save();context.translate(world.x(projectile.x),world.y(projectile.y));
        context.rotate(projectile.ageTicks*.16*projectile.facing);context.drawImage(this.paidToken,-size/2,-size/2,size,size);context.restore();}
      return true;
    }
    if (!projectile.stationaryGroundSeal || !this.seal) return false;
    if (projectile.attackId === 'special_back_light' && projectile.ageTicks < 5) return true;
    context.save();
    context.translate(world.x(projectile.x), world.y(projectile.y));
    context.scale(projectile.facing, 1);
    // Keep the complete seal above the combat plane's floor: its lower half
    // was previously under the physical stage. Preserve the source aspect.
    const width = 60 * worldScale;
    const height = width * this.seal.height / this.seal.width;
    context.drawImage(this.seal, -width / 2, -height - 2 * worldScale, width, height);
    context.restore();
    return true;
  }

  private urls() {
    const out = new Set<string>();
    hookHeadbuttFrames.forEach(url => out.add(url));
    for (const c of [...Object.values(SWAHILI_ATTACK_CLIPS), ...Object.values(SWAHILI_MOVEMENT_CLIPS)]) c.urls.forEach((u) => out.add(u));
    for (const key of ["crouch", "standing_block", "crouching_block_v2", "light_hit_reaction", "heavy_hit_reaction",
      "jump_v1_anticipation", "jump_v1_rising", "jump_v1_apex", "jump_v1_falling", "jump_v1_soft_landing",
      "turn_pivot_bridge_v1", "universal_grab_reach", "air_dash_forward_02_forward_burst", "air_dash_backward_02_backward_burst",
      "command_grab_11_secure_scoop_catch", "knockdown_recovery_02_airborne_tumble"] as PoseKey[]) out.add(pose(key));
    return out;
  }

  async preload(onProgress?: (done: number, total: number) => void) {
    for (const [key, c] of Object.entries(NEW_SPECIAL_CLIPS)) {
      for (const url of c.urls) this.clipGeometry.set(url, {
        ...NEW_SPECIAL_GEOMETRY, bodyScale: NEW_SPECIAL_BODY_SCALES[key]
      });
    }
    for (const c of Object.values(UP_REDO_CLIPS)) {
      for (const url of c.urls) this.clipGeometry.set(url, { ...NEW_SPECIAL_GEOMETRY, bodyScale: 1 });
    }
    for (const url of AIR_MEDIUM_V10_CLIP.urls) this.clipGeometry.set(url, { ...NEW_SPECIAL_GEOMETRY, bodyScale: 1 });
    for (const c of Object.values(NEUTRAL_RUNTIME_CLIPS)) {
      for (const url of c.urls) this.clipGeometry.set(url, { ...NEW_SPECIAL_GEOMETRY, bodyScale: 1 });
    }
    this.seal = await createImageBitmap(await (await fetch(groundSealUrl)).blob());
    this.paidToken = await createImageBitmap(await (await fetch('/swahili-paid-review/contract-token-v1.png')).blob());
    for (const url of hookHeadbuttFrames) this.clipGeometry.set(url, { referenceCanvasWidth: 2560, bodyScale: 1, root: { x: 1024, y: 2300 } });
    const all = [...this.urls()];
    let done = 0;
    for (let i = 0; i < all.length; i += 12) {
      await Promise.all(all.slice(i, i + 12).map(async (url) => {
        try {
          const bitmap = await createImageBitmap(await (await fetch(url, { cache: "force-cache" })).blob());
          const canvas = document.createElement("canvas");
          const geometry = swahiliSpriteGeometry(bitmap.width, bitmap.height, this.clipGeometry.get(url));
          canvas.width = geometry.width;
          canvas.height = geometry.height;
          const ctx = canvas.getContext("2d")!;
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          this.images.set(url, canvas);
          this.origins.set(url, { x: geometry.rootX, y: geometry.rootY });
        } catch { this.failed.add(url); }
        onProgress?.(++done, all.length);
      }));
    }
  }

  private put(context: CanvasRenderingContext2D, url: string, x: number, y: number, facing: 1 | -1) {
    const resolvedUrl = this.images.has(url) ? url : pose("idle_00");
    const image = this.images.get(resolvedUrl);
    if (!image) return false;
    context.save();
    context.translate(x, y);
    context.scale(facing, 1);
    const origin = this.origins.get(resolvedUrl) ?? { x: this.root.x * this.scale, y: this.root.y * this.scale };
    context.drawImage(image, -origin.x, -origin.y);
    context.restore();
    return true;
  }

  private fromClip(context: CanvasRenderingContext2D, c: Clip, tick: number, x: number, y: number, facing: 1 | -1) {
    const index = c.frameStarts ? Math.max(0, c.frameStarts.filter(start => tick >= start).length - 1)
      : c.loop ? Math.floor(tick / c.ticksPerFrame) % c.urls.length : Math.min(c.urls.length - 1, Math.floor(tick / c.ticksPerFrame));
    return this.put(context, c.urls[index], x, y, facing);
  }

  draw(context: CanvasRenderingContext2D, f: FighterState, _state: MatchState, world: WorldMap) {
    const x = world.x(f.x), y = world.y(f.y);
    const hook = _state.throwInteraction;
    if (hook?.throwId === "swahili_hook_headbutt") {
      if (hook.attacker === f.id) {
        this.fromClip(context, HOOK_HEADBUTT_CLIP, hook.tick, x, y, hook.startingFacing);
        return;
      }
      if (hook.defender === f.id && hook.result === "connected") {
        this.put(context, pose(hook.damageApplied ? "heavy_hit_reaction" : "light_hit_reaction"), x, y, f.facing);
        return;
      }
    }
    const facing = (f.phase === "attack" ? f.attackFacing : f.facing) as 1 | -1;
    const ok = (() => {
      if (f.phase === "attack" && f.currentAttack) {
        const key = f.currentAttack === 'special_back_heavy' && f.divineCounterResponse ? 'special_back_heavy_response' : f.currentAttack;
        const c = SWAHILI_ATTACK_CLIPS[key];
        return c ? this.fromClip(context, c, f.phaseTick, x, y, facing) : this.put(context, pose("standing_heavy_impact_v2"), x, y, facing);
      }
      switch (f.phase) {
        case "hit_reaction": return this.put(context, pose(f.hitReactionWeight === "light" ? "light_hit_reaction" : "heavy_hit_reaction"), x, y, facing);
        case "knockdown": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.knockdown, f.phaseTick, x, y, facing);
        case "getup": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.getup, f.phaseTick, x, y, facing);
        case "thrown": return this.put(context, pose("knockdown_recovery_02_airborne_tumble"), x, y, facing);
        case "block": return this.put(context, pose(f.crouchBlocking ? "crouching_block_v2" : "standing_block"), x, y, facing);
        case "crouch": case "crouch_release": return this.put(context, pose("crouch"), x, y, facing);
        case "jump_startup": return this.put(context, pose("jump_v1_anticipation"), x, y, facing);
        case "jump": return this.put(context, pose(f.vy < -6 ? "jump_v1_rising" : f.vy < 4 ? "jump_v1_apex" : "jump_v1_falling"), x, y, facing);
        case "landing": case "dive_landing": return this.put(context, pose("jump_v1_soft_landing"), x, y, facing);
        case "air_recovery": return this.put(context, pose("jump_v1_falling"), x, y, facing);
        case "air_dash_forward": return this.put(context, pose("air_dash_forward_02_forward_burst"), x, y, facing);
        case "air_dash_backward": return this.put(context, pose("air_dash_backward_02_backward_burst"), x, y, facing);
        case "dash": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.dash, f.phaseTick, x, y, facing);
        case "backdash": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.backdash, f.phaseTick, x, y, facing);
        case "turn": return this.put(context, pose("turn_pivot_bridge_v1"), x, y, facing);
        case "throw_startup": case "throw_whiff": return this.put(context, pose("universal_grab_reach"), x, y, facing);
        case "throw_active": return this.put(context, pose("command_grab_11_secure_scoop_catch"), x, y, facing);
        case "walk_forward": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.walk_forward, f.phaseTick, x, y, facing);
        case "walk_backward": return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.walk_backward, f.phaseTick, x, y, facing);
        default: return this.fromClip(context, SWAHILI_MOVEMENT_CLIPS.idle, f.phaseTick, x, y, facing);
      }
    })();
    if (!ok) silhouette(context, x, y, 1);
  }

  moveList() {
    const animated = (id: string) => !!SWAHILI_ATTACK_CLIPS[id];
    return [
      { command: "5L / 5M / 5H", name: "Standing normals", animated: animated("standing_light") },
      { command: "2L / 2M / 2H", name: "Crouching normals", animated: animated("crouching_light") },
      { command: "j.L / j.M / j.H", name: "Air normals", animated: animated("air_light") },
      { command: "↑ + U + H", name: "Death & Interest (new art)", animated: animated("special_up_heavy") },
      { command: "U + J", name: "Claim Check", animated: animated("special_neutral_light") },
      { command: "U + K", name: "Scythe hook → pull → headbutt (12-pose flow)", animated: true },
      { command: "→ + U + L/M/H", name: "Warning Drag / Shoulder / Drag Slice", animated: animated("special_forward_light") },
      { command: "↓ + U + J/K/L", name: "Kneecap Notice / Crossdraw / Grounded Verdict", animated: animated("special_down_light") },
      { command: "U + W + J", name: "Ceiling Tax — alternating four-shot launcher", animated: animated("special_up_light") },
      { command: "U + L", name: "Golden Injunction", animated: animated("special_neutral_heavy") },
      { command: "Back + U + J/K/L", name: "Fine Print / Hidden Clause / Default Judgment", animated: animated("special_back_light") },
      { command: "↑ + U + M", name: "Vertical Audit (new art)", animated: animated("special_up_medium") },
      { command: "W, then U+J/K/L", name: "Air specials (Light + Medium runtime / Heavy proxy)", animated: animated("special_air_light") },
      { command: "P · 100% SUPER", name: "Paid in Full · contract collection", animated: animated("swahili_paid_super") },
      { command: "I  /  ← + I", name: "Forward / back throw", animated: false }
    ];
  }

  coverage(): CoverageRow[] {
    const rows: CoverageRow[] = [
      { label: "Idle / walk", status: "animated", detail: "4 idle, 8 forward, 5 backward" },
      { label: "Dash / backdash", status: "animated", detail: "6 + 6 poses" },
      { label: "Jump / fall / land", status: "animated", detail: "jump-fall-landing v1" },
      { label: "Crouch / block", status: "single_pose", detail: "one held pose each; crouch art is not lower than standing" },
      { label: "Hit reactions", status: "single_pose", detail: "light and heavy held poses" },
      { label: "Knockdown / getup", status: "animated", detail: "knockdown-recovery v1" },
      { label: "Standing L / M / H", status: "animated", detail: "6 / 5 / 6 poses" },
      { label: "Crouching L / M / H", status: "animated", detail: "5 / 6 / 7 poses" },
      { label: "Air L / M / H", status: "animated", detail: "4 / 3 / 4 poses" },
      { label: "NEW Up Medium / Heavy", status: "animated", detail: "Vertical Audit / Death & Interest: 12 transparent frames each. Local playtest art; weapon flow remains flagged. Existing combat preserved." },
      { label: "NEW specials installed", status: "animated", detail: "Ceiling Tax 16; Golden Injunction 12; Fine Print 12; Hidden Clause 12; Default Judgment 8 + 12 response; Kneecap Notice 8. Transparent runtime frames. Debt stacks and wall splat remain unfinished; Default Judgment scythe polish flagged." },
      { label: "Neutral / forward / down / up specials", status: "animated", detail: "authored motion clips wired to the live presenter" },
      { label: "Air specials", status: "animated", detail: "Light unchanged (8 frames); NEW Medium V10 uses the marked 12-pose overhead swing, tuck and outward-blade roll. Two-hit combat unchanged; blade-root seams flagged. Retained Heavy and air normals unchanged." },
      { label: "Throws", status: "single_pose", detail: "grab reach + scoop catch only" }
    ];
    if (this.failed.size) rows.push({ label: "Failed to load", status: "placeholder", detail: `${this.failed.size} frame(s)` });
    return rows;
  }
}

export function createPresenter(id: CharacterId): Presenter {
  return id === "celeste" ? new CelestePresenter() : id === "lamuh" ? new LamuhPresenter() : new SwahiliPresenter();
}
