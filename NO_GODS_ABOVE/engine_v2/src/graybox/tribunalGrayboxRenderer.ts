import * as THREE from "three";
import { FighterId, MatchState } from "../core/types";
import { StageCameraRig } from "../stage/cameraRig";
import { stageVerticalSliceContract } from "../stage/stageContract";
import { CinematicContext, StageMatchState } from "../stage/types";
import { grayboxSpriteSources } from "./grayboxSpriteSources";
import type { TribunalGrayboxSceneConfig, TribunalGrayboxMaterialConfig, Vec3 } from "./tribunalSceneConfig";

export type GrayboxScenarioId =
  | "center_stage" | "left_corner" | "right_corner" | "p1_p2_spawn" | "side_switch" | "high_jump"
  | "crouch" | "knockdown" | "swahili_idle" | "swahili_walk_forward" | "swahili_walk_backward"
  | "standing_heavy" | "standing_block" | "light_hit_reaction" | "heavy_hit_reaction"
  | "command_grab" | "super" | "ultimate" | "round_finisher" | "large_beam" | "projectile"
  | "hit_sparks" | "bright_costume" | "dark_costume" | "mirrored_fighters" | "contrast_study";
export type TribunalEffectStudyMode = "off" | "hit_sparks" | "projectile" | "large_beam" | "all";

export interface FinisherShotVfxPresentation {
  active: boolean;
  showMuzzleFlash: boolean;
  showTracer: boolean;
  showImpact: boolean;
  muzzle: readonly [number, number];
  impact: readonly [number, number];
  mirrored: boolean;
  eventId: string | null;
  visibleImpactCount: number;
}

type FighterVisualMode = string;

export type TribunalSpriteSourceRegistry = Record<string, { url: string; approval: string }>;
export interface TribunalGrayboxRendererOptions {
  /** Environment-only adapter; defaults preserve the existing fighter study. */
  backgroundOnly?: boolean;
  spriteSources?: TribunalSpriteSourceRegistry;
  initialFrameId?: string;
  textureMaxResolution?: number;
  sceneConfig?: TribunalGrayboxSceneConfig;
}

interface FighterView {
  group: THREE.Group;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  proxy: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  mode: FighterVisualMode;
  root: THREE.Vector3;
  rootAlignmentError: number;
  facingOverride: 1 | -1 | null;
}

const CONTRACT = stageVerticalSliceContract;
const SCALE = CONTRACT.combatPlane.simulationPixelsToWorldUnits;
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

export class TribunalGrayboxRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly ready: Promise<void>;
  private readonly rig = new StageCameraRig(CONTRACT);
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly spriteSources: TribunalSpriteSourceRegistry;
  private readonly initialFrameId: string;
  private readonly textureMaxResolution: number;
  private readonly spriteMemoryMb: number;
  private readonly sceneConfig?: TribunalGrayboxSceneConfig;
  private readonly loadedGeometryRoles = new Set<string>();
  private readonly fighters: Record<FighterId, FighterView>;
  private readonly geometry = new Set<THREE.BufferGeometry>();
  private readonly materials = new Set<THREE.Material>();
  private readonly disposableTextures = new Set<THREE.Texture>();
  private readonly diagnostics = new THREE.Group();
  private readonly dynamicDiagnostics = new THREE.Group();
  private readonly rootMarkers: THREE.Mesh[] = [];
  private readonly rootLines: THREE.Line[] = [];
  private readonly foregroundMeshes: THREE.Mesh[] = [];
  private readonly vfx = new THREE.Group();
  private readonly beam = new THREE.Group();
  private readonly projectile = new THREE.Group();
  private readonly sparks = new THREE.Group();
  private readonly muzzleFlashes = new THREE.Group();
  private readonly finisherShot = new THREE.Group();
  private readonly finisherMuzzle = new THREE.Group();
  private readonly finisherTracer = new THREE.Group();
  private readonly finisherImpact = new THREE.Group();
  private readonly contrastDarkProxy = new THREE.Group();
  private readonly cameraTargetMarker: THREE.Mesh;
  private diagnosticEnabled = false;
  private aspect = 16 / 9;
  private loadError: string | null = null;
  private currentScenario: GrayboxScenarioId = "center_stage";
  private effectStudyMode: TribunalEffectStudyMode = "off";
  private finisherShotPresentation: FinisherShotVfxPresentation = {
    active: false,
    showMuzzleFlash: false,
    showTracer: false,
    showImpact: false,
    muzzle: [0, 0],
    impact: [0, 0],
    mirrored: false,
    eventId: null,
    visibleImpactCount: 0
  };

  constructor(private readonly host: HTMLElement, options: TribunalGrayboxRendererOptions = {}) {
    this.spriteSources = options.spriteSources ?? grayboxSpriteSources;
    this.initialFrameId = options.initialFrameId ?? "idle";
    this.textureMaxResolution = options.textureMaxResolution ?? CONTRACT.spriteIntegration.sourceCanvas.width;
    this.sceneConfig = options.sceneConfig;
    const textureWidth = Math.min(CONTRACT.spriteIntegration.sourceCanvas.width, this.textureMaxResolution);
    const textureHeight = Math.min(CONTRACT.spriteIntegration.sourceCanvas.height, this.textureMaxResolution);
    this.spriteMemoryMb = textureWidth * textureHeight * 4 / (1024 * 1024);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { antialias: true, alpha: false, preserveDrawingBuffer: true });
    if (!context) throw new Error("The Last Tribunal graybox requires WebGL2");
    this.renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x070811);
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(CONTRACT.camera.fovDegrees, this.aspect, CONTRACT.camera.near, CONTRACT.camera.far);
    this.camera.position.fromArray(CONTRACT.camera.defaultPosition);
    this.camera.lookAt(...CONTRACT.camera.defaultTarget);
    this.buildEnvironment();
    this.fighters = { p1: this.createFighter("p1"), p2: this.createFighter("p2") };
    this.buildVfxProxies();
    this.buildContrastDarkProxy();
    this.cameraTargetMarker = this.mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false }));
    this.cameraTargetMarker.renderOrder = 120;
    this.dynamicDiagnostics.add(this.cameraTargetMarker);
    this.buildDiagnostics();
    this.scene.add(this.diagnostics, this.dynamicDiagnostics, this.vfx);
    this.diagnostics.visible = false;
    this.dynamicDiagnostics.visible = false;
    if (options.backgroundOnly) {
      this.fighters.p1.group.visible = false;
      this.fighters.p2.group.visible = false;
      this.fighters.p1.shadow.visible = false;
      this.fighters.p2.shadow.visible = false;
      this.vfx.visible = false;
      this.contrastDarkProxy.visible = false;
    }
    this.ready = options.backgroundOnly ? Promise.resolve() : this.loadTextures(Math.min(4, this.renderer.capabilities.getMaxAnisotropy()));
    this.resize();
  }

  presentationIdentity() {
    return this.sceneConfig
      ? {
          arenaId: this.sceneConfig.arenaId,
          presentationId: this.sceneConfig.presentationId,
          sceneConfigPath: this.sceneConfig.sceneConfigPath,
          rendererEntryPoint: this.sceneConfig.rendererEntryPoint,
          genericFallbackRendered: false
        }
      : {
          arenaId: "generic_sandbox",
          presentationId: "generic_sandbox_presentation_v1",
          sceneConfigPath: null,
          rendererEntryPoint: "src/graybox/tribunalGrayboxRenderer.ts",
          genericFallbackRendered: true
        };
  }

  configureScenario(id: GrayboxScenarioId, state: MatchState) {
    this.currentScenario = id;
    state.tick = 100;
    Object.assign(state.fighters.p1, { x: -76, y: 0, facing: 1, attackFacing: 1, grounded: true, phase: "idle" });
    Object.assign(state.fighters.p2, { x: 76, y: 0, facing: -1, attackFacing: -1, grounded: true, phase: "idle" });
    this.setFighterFrame("p1", this.initialFrameId);
    this.setFighterFrame("p2", this.initialFrameId);
    this.hideVfx();
    this.effectStudyMode = "off";

    switch (id) {
      case "left_corner": Object.assign(state.fighters.p1, { x: -410 }); Object.assign(state.fighters.p2, { x: -285 }); break;
      case "right_corner": Object.assign(state.fighters.p1, { x: 285 }); Object.assign(state.fighters.p2, { x: 410 }); break;
      case "p1_p2_spawn": break;
      case "side_switch": Object.assign(state.fighters.p1, { x: 88, facing: -1, attackFacing: -1 }); Object.assign(state.fighters.p2, { x: -88, facing: 1, attackFacing: 1 }); break;
      case "high_jump": Object.assign(state.fighters.p1, { x: -150, y: -180, grounded: false }); Object.assign(state.fighters.p2, { x: 150 }); break;
      case "crouch": this.setFighterFrame("p1", "crouch"); break;
      case "knockdown": this.setFighterFrame("p1", "knockdown_proxy"); break;
      case "swahili_walk_forward": this.setFighterFrame("p1", "walk_forward"); break;
      case "swahili_walk_backward": this.setFighterFrame("p1", "walk_backward"); break;
      case "standing_heavy": this.setFighterFrame("p1", "standing_heavy"); break;
      case "standing_block": this.setFighterFrame("p1", "standing_block"); break;
      case "light_hit_reaction": this.setFighterFrame("p1", "light_hit_reaction"); break;
      case "heavy_hit_reaction": this.setFighterFrame("p1", "heavy_hit_reaction"); break;
      case "command_grab": Object.assign(state.fighters.p1, { x: -38 }); Object.assign(state.fighters.p2, { x: 38 }); break;
      case "super": Object.assign(state.fighters.p1, { x: -78 }); Object.assign(state.fighters.p2, { x: 92 }); this.beam.visible = true; break;
      case "ultimate": Object.assign(state.fighters.p1, { x: -74 }); Object.assign(state.fighters.p2, { x: 86 }); this.beam.visible = true; this.sparks.visible = true; break;
      case "round_finisher": Object.assign(state.fighters.p1, { x: -80 }); Object.assign(state.fighters.p2, { x: 120 }); this.setFighterFrame("p2", "knockdown_proxy"); break;
      case "large_beam": this.beam.visible = true; break;
      case "projectile": this.projectile.visible = true; this.muzzleFlashes.visible = true; break;
      case "hit_sparks": this.sparks.visible = true; this.muzzleFlashes.visible = true; break;
      case "bright_costume": this.setFighterFrame("p2", "bright_proxy"); break;
      case "dark_costume": this.setFighterFrame("p2", "dark_proxy"); break;
      case "mirrored_fighters": Object.assign(state.fighters.p1, { facing: 1, attackFacing: 1 }); Object.assign(state.fighters.p2, { facing: -1, attackFacing: -1 }); break;
      case "contrast_study":
        Object.assign(state.fighters.p1, { x: -180 });
        Object.assign(state.fighters.p2, { x: 40 });
        this.setFighterFrame("p2", "bright_proxy");
        this.contrastDarkProxy.visible = true;
        this.beam.visible = true; this.projectile.visible = true; this.sparks.visible = true; this.muzzleFlashes.visible = true;
        break;
    }
    this.updateFighters(state);
  }

  setDiagnostics(enabled: boolean) {
    this.diagnosticEnabled = enabled;
    this.diagnostics.visible = enabled;
    this.dynamicDiagnostics.visible = enabled;
  }

  setEffectStudy(mode: TribunalEffectStudyMode) {
    this.hideVfx();
    this.effectStudyMode = mode;
    if (mode === "hit_sparks" || mode === "all") { this.sparks.visible = true; this.muzzleFlashes.visible = true; }
    if (mode === "projectile" || mode === "all") { this.projectile.visible = true; this.muzzleFlashes.visible = true; }
    if (mode === "large_beam" || mode === "all") this.beam.visible = true;
  }

  setFinisherShotVfx(presentation: FinisherShotVfxPresentation) {
    this.finisherShotPresentation = {
      ...presentation,
      muzzle: [...presentation.muzzle] as [number, number],
      impact: [...presentation.impact] as [number, number]
    };
    this.finisherShot.visible = presentation.active;
    this.finisherMuzzle.visible = presentation.showMuzzleFlash;
    this.finisherTracer.visible = presentation.showTracer;
    this.finisherImpact.visible = presentation.showImpact;
    if (!presentation.active) return;
    const muzzle = new THREE.Vector3(presentation.muzzle[0] * SCALE, -presentation.muzzle[1] * SCALE, 0.82);
    const impact = new THREE.Vector3(presentation.impact[0] * SCALE, -presentation.impact[1] * SCALE, 0.82);
    const delta = impact.clone().sub(muzzle);
    const distance = Math.max(0.001, Math.hypot(delta.x, delta.y));
    const angle = Math.atan2(delta.y, delta.x);
    this.finisherMuzzle.position.copy(muzzle);
    this.finisherMuzzle.rotation.set(0, 0, angle);
    this.finisherTracer.position.copy(muzzle.clone().add(impact).multiplyScalar(0.5));
    this.finisherTracer.rotation.set(0, 0, angle);
    this.finisherTracer.scale.set(distance, 1, 1);
    this.finisherImpact.position.copy(impact);
    this.finisherImpact.rotation.set(0, 0, presentation.mirrored ? -0.16 : 0.16);
  }

  startCinematic(context: CinematicContext, attackerId: FighterId, state: StageMatchState, durationTicks?: number) {
    if (this.sceneConfig) {
      const volumeId = context === "throw" || context === "command_grab"
        ? "close_combat"
        : context === "super"
          ? "wide_super"
          : context === "round_finisher"
            ? "finisher"
            : context === "intro" || context === "victory"
              ? "intro_victory"
              : "ultimate";
      if (!this.sceneConfig.cinematicVolumes.some((volume) => volume.id === volumeId)) {
        throw new Error(`ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: missing cinematic volume ${volumeId}`);
      }
    }
    this.rig.startCinematic(context, attackerId, state, this.aspect, durationTicks);
  }

  snapCamera(state: StageMatchState) { return this.rig.snapToGameplay(state, this.aspect); }

  render(state: StageMatchState) {
    const pose = this.rig.update(state, this.aspect);
    this.camera.position.fromArray(pose.position);
    this.camera.lookAt(...pose.target);
    this.cameraTargetMarker.position.fromArray(pose.target);
    this.contrastDarkProxy.rotation.y = Math.atan2(this.camera.position.x - 4.25, this.camera.position.z);
    this.updateFighters(state);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = this.host.clientWidth || 1110;
    const height = this.host.clientHeight || 720;
    this.aspect = width / Math.max(1, height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  projectSimulationPoint(x: number, y: number, z = 0) {
    const ndc = new THREE.Vector3(x * SCALE, -y * SCALE, z).project(this.camera);
    const width = this.host.clientWidth || 1;
    const height = this.host.clientHeight || 1;
    return {
      x: (ndc.x + 1) * 0.5 * width,
      y: (1 - ndc.y) * 0.5 * height,
      ndc: ndc.toArray(),
      visible: ndc.z >= -1 && ndc.z <= 1 && ndc.x >= -1.2 && ndc.x <= 1.2 && ndc.y >= -1.2 && ndc.y <= 1.2
    };
  }

  benchmark(state: StageMatchState, frames = 120) {
    const gl = this.renderer.getContext();
    const benchmarkState: StageMatchState = {
      tick: state.tick,
      fighters: {
        p1: { ...state.fighters.p1 },
        p2: { ...state.fighters.p2 }
      }
    };
    const start = performance.now();
    for (let index = 0; index < frames; index++) {
      benchmarkState.tick++;
      this.render(benchmarkState);
      gl.finish();
    }
    const totalMs = performance.now() - start;
    return { frames, totalMs, averageFrameMs: totalMs / frames, measuredFps: frames / (totalMs / 1000) };
  }

  snapshot(state: StageMatchState, scenario: string = this.currentScenario) {
    const pose = this.rig.snapshot();
    const eclipsePosition = this.sceneConfig
      ? new THREE.Vector3(this.sceneConfig.geometry.oculusWall.openingCenter[0], this.sceneConfig.geometry.oculusWall.openingCenter[1], this.sceneConfig.geometry.oculusWall.z - 0.12)
      : new THREE.Vector3(0, 8.25, -14.8);
    const eclipse = eclipsePosition.project(this.camera);
    const heads = (["p1", "p2"] as const).map((id) => this.fighters[id].root.clone().add(new THREE.Vector3(0, 3.25, 0)).project(this.camera));
    const identity = this.presentationIdentity();
    const worldBounds = this.sceneConfig?.combatPlane.worldBounds ?? [-8.4, 8.4];
    const cameraClampX = this.sceneConfig?.camera.clampX ?? [-7.8, 7.8];
    const spawnWorldX = this.sceneConfig?.combatPlane.spawnWorldX ?? [-1.52, 1.52];
    const parallaxZ = this.sceneConfig?.parallaxZ ?? { foreground: 3.2, fighter: 0, midground: -7, background: -15 };
    return {
      arenaId: identity.arenaId,
      presentation: identity,
      status: "production_arena_graybox_candidate",
      deployable: false,
      approvalState: "awaiting_human_graybox_and_concept_approval",
      scenario,
      authority: { gameplayPlane: "deterministic_2d", renderingMayAffectGameplay: false, fighterPlaneZ: 0 },
      camera: pose,
      activeCinematicVolume: pose.active && this.sceneConfig
        ? (pose.active.context === "throw" || pose.active.context === "command_grab"
            ? "close_combat"
            : pose.active.context === "super"
              ? "wide_super"
              : pose.active.context === "round_finisher"
                ? "finisher"
                : pose.active.context === "intro" || pose.active.context === "victory"
                  ? "intro_victory"
                  : "ultimate")
        : null,
      diagnostics: {
        enabled: this.diagnosticEnabled,
        foregroundOcclusionPercent: Number(this.foregroundOcclusionPercent().toFixed(3)),
        eclipseHeadSeparationNdc: heads.map((head) => Number(Math.hypot(head.x - eclipse.x, head.y - eclipse.y).toFixed(4))),
        cameraClampX,
        worldBounds,
        spawnWorldX,
        parallaxZ,
        actualTribunalGeometryLoaded: !!this.sceneConfig && this.sceneConfig.geometry.requiredRoles.every((role) => this.loadedGeometryRoles.has(role)),
        loadedGeometryRoles: [...this.loadedGeometryRoles],
        cinematicVolumes: this.sceneConfig?.cinematicVolumes ?? [],
        contrastZones: this.sceneConfig?.contrastZones ?? [],
        vfxSafetyRegions: this.sceneConfig?.vfxSafetyRegions ?? []
      },
      fighters: Object.fromEntries((["p1", "p2"] as const).map((id) => {
        const fighter = this.fighters[id];
        return [id, {
          mode: fighter.mode,
          root: fighter.root.toArray(),
          shadow: fighter.shadow.position.toArray(),
          rootAlignmentError: fighter.rootAlignmentError,
          shadowXError: Math.abs(fighter.shadow.position.x - fighter.root.x),
          mirrored: fighter.group.scale.x < 0,
          rootNdc: fighter.root.clone().project(this.camera).toArray(),
          readabilityNdc: this.readabilityBounds(fighter.root)
        }];
      })),
      effects: {
        studyMode: this.effectStudyMode,
        beam: this.beam.visible,
        projectile: this.projectile.visible,
        hitSparks: this.sparks.visible,
        muzzleFlashes: this.muzzleFlashes.visible,
        darkSilhouettePlaceholder: this.contrastDarkProxy.visible,
        finisherShot: {
          ...this.finisherShotPresentation,
          muzzle: [...this.finisherShotPresentation.muzzle],
          impact: [...this.finisherShotPresentation.impact]
        }
      },
      resources: {
        webgl2: this.renderer.capabilities.isWebGL2,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        loadedSpriteTextures: this.textures.size,
        estimatedSpriteTextureMemoryMb: Number((this.textures.size * this.spriteMemoryMb).toFixed(2)),
        textureMaxResolution: this.textureMaxResolution,
        stageTextures: this.sceneConfig?.runtimeAssets.stageTextures.length ?? 0,
        conceptBoardRuntimeDependency: this.sceneConfig?.runtimeAssets.conceptBoardRuntimeDependency ?? false,
        loadError: this.loadError,
        realTimeShadowCasters: 0
      }
    };
  }

  private trackedGeometry<T extends THREE.BufferGeometry>(value: T) { this.geometry.add(value); return value; }
  private trackedMaterial<T extends THREE.Material>(value: T) { this.materials.add(value); return value; }
  private mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(geometry: G, material: M) {
    return new THREE.Mesh(this.trackedGeometry(geometry), this.trackedMaterial(material));
  }

  private buildEnvironment() {
    if (this.sceneConfig) {
      this.buildActualTribunalEnvironment(this.sceneConfig);
      return;
    }
    this.scene.background = new THREE.Color(0x070811);
    this.scene.fog = new THREE.FogExp2(0x121222, 0.018);
    const hemisphere = new THREE.HemisphereLight(0x6f7399, 0x130c12, 1.15);
    const primary = new THREE.DirectionalLight(0xbec4d8, 1.55);
    primary.position.set(6, 10, 8);
    primary.castShadow = false;
    this.scene.add(hemisphere, primary);

    const floor = this.mesh(new THREE.PlaneGeometry(34, 20), new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.96, metalness: 0.02 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -1.5); this.scene.add(floor);
    const dais = this.mesh(new THREE.BoxGeometry(19, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x20212a, roughness: 0.95, metalness: 0.04 }));
    dais.position.set(0, -0.15, -0.5); this.scene.add(dais);

    const brass = this.trackedMaterial(new THREE.MeshStandardMaterial({ color: 0x57482f, roughness: 0.83, metalness: 0.35 }));
    for (const radius of [2.2, 4.15]) {
      const ring = new THREE.Mesh(this.trackedGeometry(new THREE.TorusGeometry(radius, 0.035, 6, 96)), brass);
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.018; this.scene.add(ring);
    }
    for (const x of [-8.4, 0, 8.4]) {
      const line = new THREE.Mesh(this.trackedGeometry(new THREE.BoxGeometry(0.035, 0.025, 6.8)), brass);
      line.position.set(x, 0.025, 0); this.scene.add(line);
    }

    const ash = this.trackedMaterial(new THREE.MeshStandardMaterial({ color: 0x262731, roughness: 0.93, metalness: 0.02 }));
    const darkStone = this.trackedMaterial(new THREE.MeshStandardMaterial({ color: 0x11131c, roughness: 0.97, metalness: 0.01 }));
    const columnGeometry = this.trackedGeometry(new THREE.BoxGeometry(1.15, 8.6, 1.5));
    for (const x of [-11.5, -8, -4.6, 4.6, 8, 11.5]) {
      const column = new THREE.Mesh(columnGeometry, x === -4.6 || x === 4.6 ? ash : darkStone);
      column.position.set(x, 4.3, -7.5 - Math.abs(x) * 0.05); this.scene.add(column);
    }

    for (const x of [-9.8, 9.8]) {
      const gallery = new THREE.Mesh(this.trackedGeometry(new THREE.BoxGeometry(8.5, 3.2, 2.4)), darkStone);
      gallery.position.set(x, 5, -10.6); this.scene.add(gallery);
      const gallerySlot = new THREE.Mesh(this.trackedGeometry(new THREE.BoxGeometry(7.4, 1.2, 0.2)), this.trackedMaterial(new THREE.MeshBasicMaterial({ color: 0x090a10 })));
      gallerySlot.position.set(x, 4.9, -9.35); this.scene.add(gallerySlot);
    }

    const apse = new THREE.Mesh(this.trackedGeometry(new THREE.TorusGeometry(5.8, 0.5, 10, 72, Math.PI)), ash);
    apse.rotation.z = 0; apse.position.set(0, 5.1, -12.4); this.scene.add(apse);
    const eclipse = this.mesh(new THREE.CircleGeometry(2.25, 64), new THREE.MeshBasicMaterial({ color: 0x020207, fog: false }));
    eclipse.position.set(0, 8.25, -14.8); this.scene.add(eclipse);
    const corona = this.mesh(new THREE.TorusGeometry(2.35, 0.12, 12, 96), new THREE.MeshBasicMaterial({ color: 0x8d5961, transparent: true, opacity: 0.8, fog: false }));
    corona.position.copy(eclipse.position); this.scene.add(corona);
    const skyBand = this.mesh(new THREE.PlaneGeometry(46, 20), new THREE.MeshBasicMaterial({ color: 0x161329, fog: true, depthWrite: false }));
    skyBand.position.set(0, 7, -15); skyBand.renderOrder = -30; this.scene.add(skyBand);

    const red = this.trackedMaterial(new THREE.MeshBasicMaterial({ color: 0x4d1720, transparent: true, opacity: 0.72 }));
    for (const x of [-7, 7]) {
      const banner = new THREE.Mesh(this.trackedGeometry(new THREE.PlaneGeometry(1.1, 5.4)), red);
      banner.position.set(x, 6.1, -6.65); this.scene.add(banner);
    }

    const hazeMaterial = this.trackedMaterial(new THREE.MeshBasicMaterial({ color: 0x615a81, transparent: true, opacity: 0.055, depthWrite: false, fog: true }));
    for (const [z, y, width] of [[-6.8, 2.6, 30], [-11.8, 4.8, 42]] as const) {
      const haze = new THREE.Mesh(this.trackedGeometry(new THREE.PlaneGeometry(width, 4.4)), hazeMaterial);
      haze.position.set(0, y, z); this.scene.add(haze);
    }

    const pylonGeometry = this.trackedGeometry(new THREE.BoxGeometry(0.5, 4.8, 0.8));
    for (const x of [-8.4, 8.4]) {
      const pylon = new THREE.Mesh(pylonGeometry, brass); pylon.position.set(x, 2.4, -1); this.scene.add(pylon);
    }

    const foregroundGeometry = this.trackedGeometry(new THREE.BoxGeometry(1.3, 9.5, 1.8));
    for (const x of [-12.7, 12.7]) {
      const foreground = new THREE.Mesh(foregroundGeometry, darkStone);
      foreground.position.set(x, 4.75, 3.2); foreground.renderOrder = 40; this.scene.add(foreground); this.foregroundMeshes.push(foreground);
    }
  }

  private buildActualTribunalEnvironment(config: TribunalGrayboxSceneConfig) {
    this.scene.background = new THREE.Color(0x070811);
    this.scene.fog = new THREE.FogExp2(config.lighting.fogColor, config.lighting.fogDensity);
    const hemisphere = new THREE.HemisphereLight(config.lighting.hemisphereSky, config.lighting.hemisphereGround, config.lighting.hemisphereIntensity);
    const primary = new THREE.DirectionalLight(config.lighting.primaryColor, config.lighting.primaryIntensity);
    primary.position.fromArray(config.lighting.primaryDirection);
    primary.castShadow = false;
    this.scene.add(hemisphere, primary);
    for (const [id, z] of Object.entries(config.parallaxZ)) {
      const anchor = new THREE.Object3D();
      anchor.name = `parallax_anchor_${id}`;
      anchor.position.set(0, 3, z);
      anchor.userData.parallaxDepth = z;
      anchor.userData.presentationOnly = true;
      this.scene.add(anchor);
    }

    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const material = (id: string) => {
      const existing = materials.get(id);
      if (existing) return existing;
      const definition = config.materials[id] as TribunalGrayboxMaterialConfig | undefined;
      if (!definition) throw new Error(`ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: missing material ${id}`);
      const created = this.trackedMaterial(new THREE.MeshStandardMaterial({
        color: definition.color,
        roughness: definition.roughness,
        metalness: definition.metalness
      }));
      materials.set(id, created);
      return created;
    };
    const box = (id: string, size: Vec3, position: Vec3, materialId: string, parent: THREE.Object3D = this.scene) => {
      const value = new THREE.Mesh(this.trackedGeometry(new THREE.BoxGeometry(...size)), material(materialId));
      value.name = id;
      value.position.fromArray(position);
      value.userData.presentationOnly = true;
      parent.add(value);
      return value;
    };

    const floorDefinition = config.geometry.floor;
    const floor = new THREE.Mesh(
      this.trackedGeometry(new THREE.PlaneGeometry(...floorDefinition.size)),
      material(floorDefinition.material)
    );
    floor.name = "matte_tribunal_floor";
    floor.rotation.x = -Math.PI / 2;
    floor.position.fromArray(floorDefinition.position);
    floor.userData.presentationOnly = true;
    this.scene.add(floor);
    this.loadedGeometryRoles.add("matte_tribunal_floor");

    const receiverDefinition = config.geometry.shadowReceiver;
    const receiver = this.mesh(
      new THREE.PlaneGeometry(...receiverDefinition.size),
      new THREE.MeshBasicMaterial({ color: 0x08090d, transparent: true, opacity: receiverDefinition.opacity, depthWrite: false })
    );
    receiver.name = "fighter_shadow_receiver";
    receiver.rotation.x = -Math.PI / 2;
    receiver.position.fromArray(receiverDefinition.position);
    receiver.renderOrder = 2;
    receiver.userData.presentationOnly = true;
    this.scene.add(receiver);
    this.loadedGeometryRoles.add("fighter_shadow_receiver");

    for (const step of config.geometry.daisSteps) box(step.id, step.size, step.position, step.material);
    this.loadedGeometryRoles.add("central_dais");

    const brass = material("aged_brass");
    for (const radius of [2.2, 4.15]) {
      const ring = new THREE.Mesh(this.trackedGeometry(new THREE.TorusGeometry(radius, 0.035, 6, 96)), brass);
      ring.name = `restrained_judgment_ring_${radius}`;
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.018;
      ring.userData.presentationOnly = true;
      this.scene.add(ring);
    }
    for (const x of [-8.4, 0, 8.4]) box(`judgment_inlay_${x}`, [0.035, 0.025, 6.8], [x, 0.025, 0], "aged_brass");

    const midground = new THREE.Group();
    midground.name = "tribunal_midground_depth_-7";
    midground.userData.parallaxDepth = config.parallaxZ.midground;
    this.scene.add(midground);
    for (const wingX of config.geometry.courtWingX) {
      config.geometry.galleryTiers.forEach((tier, index) => {
        box(`gallery_${wingX < 0 ? "left" : "right"}_tier_${index + 1}`, tier.size, [wingX, tier.y, tier.z], index < 2 ? "deep_stone" : "ash_stone", midground);
        const slot = box(`gallery_${wingX < 0 ? "left" : "right"}_void_${index + 1}`, [tier.size[0] - 0.7, Math.max(0.25, tier.size[1] * 0.28), 0.18], [wingX, tier.y + 0.1, tier.z + tier.size[2] / 2 + 0.1], "deep_stone", midground);
        slot.renderOrder = 1;
      });
    }
    this.loadedGeometryRoles.add("rear_gallery_depth");

    const column = config.geometry.column;
    for (const x of config.geometry.columnX) {
      box(`column_${x}_shaft`, column.shaftSize, [x, column.shaftSize[1] / 2, column.z], Math.abs(x) < 6 ? "ash_stone" : "deep_stone", midground);
      box(`column_${x}_base`, column.baseSize, [x, column.baseSize[1] / 2, column.z], "aged_brass", midground);
      box(`column_${x}_capital`, column.capitalSize, [x, column.shaftSize[1] + column.capitalSize[1] / 2, column.z], "aged_brass", midground);
    }
    this.loadedGeometryRoles.add("courthouse_architectural_masses");

    for (const [index, witness] of config.geometry.witnessBoxes.entries()) {
      box(`witness_box_${index + 1}`, witness.size, witness.position, "deep_stone", midground);
      box(`witness_box_${index + 1}_rail`, [witness.size[0], 0.16, 0.18], [witness.position[0], witness.position[1] + witness.size[1] / 2 + 0.18, witness.position[2] + witness.size[2] / 2], "aged_brass", midground);
    }
    this.loadedGeometryRoles.add("midground_court_structures");

    const background = new THREE.Group();
    background.name = "tribunal_background_depth_-15";
    background.userData.parallaxDepth = config.parallaxZ.background;
    this.scene.add(background);
    const sky = this.mesh(new THREE.PlaneGeometry(48, 22), new THREE.MeshBasicMaterial({ color: config.materials.sky_violet.color, fog: true, depthWrite: false }));
    sky.name = "eclipsed_sky_placeholder";
    sky.position.set(0, 8, config.parallaxZ.background - 0.55);
    sky.renderOrder = -30;
    sky.userData.presentationOnly = true;
    background.add(sky);
    this.loadedGeometryRoles.add("eclipsed_sky_placeholder");

    for (const piece of config.geometry.oculusWall.pieces) box(piece.id, piece.size, piece.position, "oculus_wall", background);
    const opening = config.geometry.oculusWall;
    const eclipse = this.mesh(new THREE.CircleGeometry(opening.openingRadius - 0.12, 64), new THREE.MeshBasicMaterial({ color: config.materials.oculus_void.color, fog: false }));
    eclipse.name = "central_eclipse_void";
    eclipse.position.set(opening.openingCenter[0], opening.openingCenter[1], opening.z + 0.44);
    background.add(eclipse);
    const corona = this.mesh(new THREE.TorusGeometry(opening.openingRadius, 0.13, 12, 96), new THREE.MeshBasicMaterial({ color: config.materials.corona.color, transparent: true, opacity: 0.78, fog: false }));
    corona.name = "central_eclipse_corona_placeholder";
    corona.position.copy(eclipse.position);
    background.add(corona);
    const apse = new THREE.Mesh(this.trackedGeometry(new THREE.TorusGeometry(5.9, 0.48, 10, 72, Math.PI)), material("ash_stone"));
    apse.name = "oculus_apse_arch";
    apse.position.set(0, 5.25, opening.z + 0.6);
    apse.userData.presentationOnly = true;
    background.add(apse);
    this.loadedGeometryRoles.add("background_oculus_wall");

    for (const [index, bannerDefinition] of config.geometry.banners.entries()) {
      const banner = this.mesh(new THREE.PlaneGeometry(...bannerDefinition.size), new THREE.MeshBasicMaterial({ color: config.materials.cathedral_red.color, transparent: true, opacity: index < 2 ? 0.82 : 0.58, side: THREE.DoubleSide }));
      banner.name = `cathedral_red_banner_${index + 1}`;
      banner.position.fromArray(bannerDefinition.position);
      banner.userData.presentationOnly = true;
      (bannerDefinition.position[2] <= -10 ? background : midground).add(banner);
    }
    this.loadedGeometryRoles.add("cathedral_red_banner_masses");

    for (const [index, hazeDefinition] of config.geometry.hazeBands.entries()) {
      const haze = this.mesh(new THREE.PlaneGeometry(...hazeDefinition.size), new THREE.MeshBasicMaterial({ color: config.materials.haze.color, transparent: true, opacity: hazeDefinition.opacity, depthWrite: false, fog: true }));
      haze.name = `cool_violet_haze_${index + 1}`;
      haze.position.fromArray(hazeDefinition.position);
      haze.userData.presentationOnly = true;
      this.scene.add(haze);
    }

    const pylons = config.geometry.boundaryPylons;
    for (const x of pylons.x) box(`boundary_pylon_${x < 0 ? "left" : "right"}`, pylons.size, [x, pylons.positionY, pylons.z], "aged_brass");
    this.loadedGeometryRoles.add("boundary_pylons");

    const foreground = new THREE.Group();
    foreground.name = "tribunal_foreground_depth_3.2";
    foreground.userData.parallaxDepth = config.parallaxZ.foreground;
    this.scene.add(foreground);
    for (const frame of config.geometry.foregroundFrames) {
      const mesh = box(frame.id, frame.size, frame.position, frame.id.includes("rail") ? "aged_brass" : "deep_stone", foreground);
      mesh.renderOrder = 40;
      this.foregroundMeshes.push(mesh);
    }
    this.loadedGeometryRoles.add("foreground_architectural_frame");

    const missingRoles = config.geometry.requiredRoles.filter((role) => !this.loadedGeometryRoles.has(role));
    if (missingRoles.length) throw new Error(`ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: missing geometry roles ${missingRoles.join(", ")}`);
  }

  private createFighter(id: FighterId): FighterView {
    const group = new THREE.Group();
    const width = CONTRACT.spriteIntegration.sourceCanvas.width * CONTRACT.combatPlane.spritePixelsToWorldUnits;
    const height = CONTRACT.spriteIntegration.sourceCanvas.height * CONTRACT.combatPlane.spritePixelsToWorldUnits;
    const sprite = this.mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.08, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    sprite.renderOrder = id === "p1" ? 31 : 30;
    const proxy = this.mesh(this.fighterProxyGeometry(), new THREE.MeshBasicMaterial({ color: 0xf1ede3, transparent: true, opacity: 0.98, depthWrite: false, side: THREE.DoubleSide }));
    proxy.visible = false; proxy.renderOrder = sprite.renderOrder;
    group.add(sprite, proxy); this.scene.add(group);
    const shadow = this.mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0x010104, transparent: true, opacity: 0.48, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 4; this.scene.add(shadow);
    return { group, sprite, proxy, shadow, mode: this.initialFrameId, root: new THREE.Vector3(), rootAlignmentError: 0, facingOverride: null };
  }

  setFighterFrame(id: FighterId, mode: FighterVisualMode, facingOverride: 1 | -1 | null = null) {
    const fighter = this.fighters[id];
    fighter.mode = mode;
    fighter.facingOverride = facingOverride;
    const isSprite = Object.prototype.hasOwnProperty.call(this.spriteSources, mode);
    fighter.sprite.visible = isSprite;
    fighter.proxy.visible = !isSprite;
    if (isSprite) {
      fighter.sprite.material.map = this.textures.get(mode) ?? null;
      fighter.sprite.material.needsUpdate = true;
    } else {
      fighter.proxy.material.color.setHex(mode === "bright_proxy" ? 0xf2eee4 : mode === "dark_proxy" ? 0x080912 : 0x30313b);
      const knockdown = mode === "knockdown_proxy";
      fighter.proxy.scale.set(1, 1, 1);
      fighter.proxy.rotation.z = knockdown ? -Math.PI / 2 : 0;
    }
  }

  private updateFighters(state: StageMatchState) {
    const centerAboveRoot = (CONTRACT.spriteIntegration.sourceRoot.y - CONTRACT.spriteIntegration.sourceCanvas.height / 2) * CONTRACT.combatPlane.spritePixelsToWorldUnits;
    for (const id of ["p1", "p2"] as const) {
      const fighterState = state.fighters[id] as StageMatchState["fighters"][typeof id] & {
        presentationRotationZ?: number;
        presentationScale?: number;
        presentationRenderOrder?: number | null;
        presentationShadowVisible?: boolean;
        presentationRootOffsetX?: number;
        presentationRootOffsetY?: number;
      };
      const view = this.fighters[id];
      const rootX = fighterState.x * SCALE;
      const rootY = -fighterState.y * SCALE;
      const presentationScale = fighterState.presentationScale ?? 1;
      const presentationOffsetX = (fighterState.presentationRootOffsetX ?? 0) * SCALE;
      const presentationOffsetY = -(fighterState.presentationRootOffsetY ?? 0) * SCALE;
      const isKnockdown = view.mode === "knockdown_proxy";
      const visualCenter = isKnockdown ? 0.78 : view.sprite.visible ? centerAboveRoot : 2.05;
      view.group.position.set(rootX + presentationOffsetX, rootY + presentationOffsetY + visualCenter, 0);
      const presentationFacing = view.facingOverride ?? fighterState.facing;
      view.group.scale.set(presentationFacing * presentationScale, presentationScale, 1);
      view.group.rotation.set(0, Math.atan2(this.camera.position.x - rootX, this.camera.position.z), fighterState.presentationRotationZ ?? 0);
      const renderOrder = fighterState.presentationRenderOrder ?? (id === "p1" ? 31 : 30);
      view.sprite.renderOrder = renderOrder;
      view.proxy.renderOrder = renderOrder;
      view.root.set(rootX, rootY, 0);
      view.rootAlignmentError = Math.abs((view.group.position.y - visualCenter) - (rootY + presentationOffsetY));
      const jump = Math.max(0, rootY);
      const shadowScale = Math.max(0.58, 1 - jump * 0.075);
      view.shadow.position.set(rootX, 0.018, 0);
      view.shadow.scale.set((isKnockdown ? 2.05 : 1.55) * shadowScale, (isKnockdown ? 0.68 : 0.58) * shadowScale, 1);
      view.shadow.material.opacity = 0.48 * Math.max(0.2, 1 - jump * 0.14);
      view.shadow.visible = fighterState.presentationShadowVisible ?? true;
    }
    this.updateDynamicDiagnostics();
  }

  private buildVfxProxies() {
    const beamCore = this.mesh(new THREE.PlaneGeometry(18.4, 0.72), new THREE.MeshBasicMaterial({ color: 0xe6fbff, transparent: true, opacity: 0.86, depthWrite: false, blending: THREE.AdditiveBlending }));
    const beamGlow = this.mesh(new THREE.PlaneGeometry(18.4, 1.5), new THREE.MeshBasicMaterial({ color: 0x44c7ff, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }));
    beamCore.position.set(0, 2.25, 0.62); beamGlow.position.set(0, 2.25, 0.6); this.beam.add(beamGlow, beamCore);
    const orb = this.mesh(new THREE.SphereGeometry(0.42, 20, 12), new THREE.MeshBasicMaterial({ color: 0x8ce8ff }));
    const trail = this.mesh(new THREE.PlaneGeometry(2.3, 0.34), new THREE.MeshBasicMaterial({ color: 0x3cbbe8, transparent: true, opacity: 0.5, depthWrite: false }));
    orb.position.set(0.7, 2.1, 0.65); trail.position.set(-0.65, 2.1, 0.62); this.projectile.add(trail, orb);
    const sparkMaterial = this.trackedMaterial(new THREE.LineBasicMaterial({ color: 0xfff0a3, transparent: true, opacity: 0.95, depthTest: false }));
    const sparkPoints: number[] = [];
    for (let index = 0; index < 12; index++) {
      const angle = index / 12 * Math.PI * 2;
      sparkPoints.push(0, 0, 0, Math.cos(angle) * (0.55 + index % 3 * 0.18), Math.sin(angle) * (0.55 + index % 3 * 0.18), 0);
    }
    const sparkGeometry = this.trackedGeometry(new THREE.BufferGeometry());
    sparkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparkPoints, 3));
    const lines = new THREE.LineSegments(sparkGeometry, sparkMaterial); lines.position.set(0.2, 2.25, 0.74); lines.renderOrder = 70; this.sparks.add(lines);
    for (const x of [-2.2, 2.2]) {
      const flash = this.mesh(new THREE.CircleGeometry(0.32, 12), new THREE.MeshBasicMaterial({ color: 0xffd071, transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending }));
      flash.position.set(x, 2.4, 0.7); this.muzzleFlashes.add(flash);
    }
    const finisherGold = new THREE.MeshBasicMaterial({ color: 0xffd56a, transparent: true, opacity: 0.98, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const finisherWhite = new THREE.MeshBasicMaterial({ color: 0xfffbda, transparent: true, opacity: 1, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const finisherRed = new THREE.MeshBasicMaterial({ color: 0xff4f38, transparent: true, opacity: 0.88, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const muzzleCore = this.mesh(new THREE.CircleGeometry(0.22, 16), finisherWhite.clone());
    const muzzleLong = this.mesh(new THREE.PlaneGeometry(1.05, 0.095), finisherGold.clone());
    const muzzleCross = this.mesh(new THREE.PlaneGeometry(0.58, 0.075), finisherGold.clone());
    muzzleCross.rotation.z = Math.PI / 2;
    muzzleCore.renderOrder = muzzleLong.renderOrder = muzzleCross.renderOrder = 82;
    this.finisherMuzzle.add(muzzleLong, muzzleCross, muzzleCore);

    const tracerGlow = this.mesh(new THREE.PlaneGeometry(1, 0.18), new THREE.MeshBasicMaterial({ color: 0xffa12d, transparent: true, opacity: 0.32, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const tracerCore = this.mesh(new THREE.PlaneGeometry(1, 0.045), finisherWhite.clone());
    tracerGlow.renderOrder = 78;
    tracerCore.renderOrder = 79;
    this.finisherTracer.add(tracerGlow, tracerCore);

    const impactRing = this.mesh(new THREE.RingGeometry(0.22, 0.48, 24), finisherGold.clone());
    const impactCore = this.mesh(new THREE.CircleGeometry(0.19, 16), finisherWhite.clone());
    const impactBurst = this.mesh(new THREE.PlaneGeometry(1.32, 0.10), finisherRed.clone());
    const impactBurstCross = this.mesh(new THREE.PlaneGeometry(1.02, 0.08), finisherGold.clone());
    impactBurst.rotation.z = Math.PI / 5;
    impactBurstCross.rotation.z = Math.PI / 2 + Math.PI / 5;
    impactRing.renderOrder = impactCore.renderOrder = impactBurst.renderOrder = impactBurstCross.renderOrder = 83;
    this.finisherImpact.add(impactBurst, impactBurstCross, impactRing, impactCore);
    this.finisherShot.add(this.finisherMuzzle, this.finisherTracer, this.finisherImpact);
    this.vfx.add(this.beam, this.projectile, this.sparks, this.muzzleFlashes, this.finisherShot);
    this.hideVfx();
  }

  private hideVfx() { this.beam.visible = false; this.projectile.visible = false; this.sparks.visible = false; this.muzzleFlashes.visible = false; this.finisherShot.visible = false; this.contrastDarkProxy.visible = false; }

  private fighterProxyGeometry() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.72, 0);
    shape.lineTo(-0.32, 1.35); shape.lineTo(-0.9, 2.15); shape.lineTo(-0.68, 2.48); shape.lineTo(-0.34, 2.34);
    shape.lineTo(-0.28, 3.1); shape.lineTo(-0.42, 3.42); shape.lineTo(-0.28, 3.78); shape.lineTo(0, 4.08);
    shape.lineTo(0.28, 3.78); shape.lineTo(0.42, 3.42); shape.lineTo(0.28, 3.1); shape.lineTo(0.34, 2.34);
    shape.lineTo(0.68, 2.48); shape.lineTo(0.9, 2.15); shape.lineTo(0.32, 1.35); shape.lineTo(0.72, 0);
    shape.lineTo(0.3, 0); shape.lineTo(0, 1.15); shape.lineTo(-0.3, 0); shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.center();
    return geometry;
  }

  private buildContrastDarkProxy() {
    const rim = this.mesh(this.fighterProxyGeometry(), new THREE.MeshBasicMaterial({ color: 0x53576b, transparent: true, opacity: 0.65, depthWrite: false }));
    rim.scale.set(1.08, 1.04, 1); rim.position.z = -0.02;
    const body = this.mesh(this.fighterProxyGeometry(), new THREE.MeshBasicMaterial({ color: 0x090a13, depthWrite: false }));
    const shadow = this.mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0x010104, transparent: true, opacity: 0.45, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -2.02, -0.02); shadow.scale.set(1.4, 0.5, 1);
    this.contrastDarkProxy.add(rim, body, shadow);
    this.contrastDarkProxy.position.set(4.25, 2.05, 0);
    this.contrastDarkProxy.renderOrder = 32;
    this.contrastDarkProxy.visible = false;
    this.scene.add(this.contrastDarkProxy);
  }

  private readabilityBounds(root: THREE.Vector3) {
    const points = [
      new THREE.Vector3(root.x - 2.2, root.y + 0.45, 0), new THREE.Vector3(root.x + 2.2, root.y + 0.45, 0),
      new THREE.Vector3(root.x - 2.2, root.y + 3.8, 0), new THREE.Vector3(root.x + 2.2, root.y + 3.8, 0)
    ].map((point) => point.project(this.camera));
    return {
      left: Math.min(...points.map((point) => point.x)), right: Math.max(...points.map((point) => point.x)),
      bottom: Math.min(...points.map((point) => point.y)), top: Math.max(...points.map((point) => point.y))
    };
  }

  private buildDiagnostics() {
    const planeMaterial = this.trackedMaterial(new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.12, depthWrite: false, depthTest: false }));
    const plane = new THREE.Mesh(this.trackedGeometry(new THREE.PlaneGeometry(16.8, 8)), planeMaterial); plane.rotation.x = -Math.PI / 2; plane.position.y = 0.04; plane.renderOrder = 90; this.diagnostics.add(plane);
    const addBar = (x: number, color: number, height: number, z: number) => { const bar = this.mesh(new THREE.BoxGeometry(0.055, height, 0.055), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88, depthTest: false })); bar.position.set(x, height / 2, z); bar.renderOrder = 100; this.diagnostics.add(bar); };
    for (const x of [-8.4, 8.4]) addBar(x, 0xef4444, 6, 0.6);
    for (const x of [-7.8, 7.8]) addBar(x, 0xa78bfa, 5.4, 0.68);
    for (const x of [-1.52, 1.52]) addBar(x, 0xc084fc, 1.3, 0.72);
    const contrast = this.mesh(new THREE.PlaneGeometry(16.4, 5.45), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.055, depthWrite: false, depthTest: false }));
    contrast.position.set(0, 3.075, -0.42); contrast.renderOrder = 88; this.diagnostics.add(contrast);
    const vfxRegion = this.mesh(new THREE.PlaneGeometry(18.4, 4.4), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.075, wireframe: true, depthTest: false }));
    vfxRegion.position.set(0, 2.6, -0.3); vfxRegion.renderOrder = 89; this.diagnostics.add(vfxRegion);
    const projectileRegion = this.mesh(new THREE.PlaneGeometry(18.4, 3.35), new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.08, wireframe: true, depthTest: false }));
    projectileRegion.position.set(0, 2.125, -0.25); projectileRegion.renderOrder = 90; this.diagnostics.add(projectileRegion);
    const volumeMaterial = this.trackedMaterial(new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.055, wireframe: true, depthTest: false }));
    for (const [width, height, z] of [[14.8, 6.4, 1.2], [13.6, 7.2, 1.5], [12.4, 8, 1.8]] as const) {
      const volume = new THREE.Mesh(this.trackedGeometry(new THREE.BoxGeometry(width, height, 2.4)), volumeMaterial); volume.position.set(0, height / 2, z); volume.renderOrder = 86; this.diagnostics.add(volume);
    }
    for (const [z, color] of [[3.2, 0xf97316], [0, 0x22c55e], [-7, 0x60a5fa], [-15, 0x818cf8]] as const) {
      const depth = this.mesh(new THREE.BoxGeometry(25, 0.035, 0.035), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthTest: false }));
      depth.position.set(0, 6.35, z); depth.renderOrder = 105; this.diagnostics.add(depth);
    }
    for (let index = 0; index < 2; index++) {
      const marker = this.mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x34d399, depthTest: false }));
      marker.renderOrder = 120; this.dynamicDiagnostics.add(marker); this.rootMarkers.push(marker);
      const geometry = this.trackedGeometry(new THREE.BufferGeometry());
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geometry, this.trackedMaterial(new THREE.LineBasicMaterial({ color: 0x34d399, depthTest: false })));
      line.renderOrder = 119; this.dynamicDiagnostics.add(line); this.rootLines.push(line);
    }
  }

  private updateDynamicDiagnostics() {
    for (const [index, id] of (["p1", "p2"] as const).entries()) {
      const root = this.fighters[id].root;
      this.rootMarkers[index].position.copy(root);
      const positions = this.rootLines[index].geometry.getAttribute("position") as THREE.BufferAttribute;
      positions.setXYZ(0, root.x, root.y, root.z);
      positions.setXYZ(1, this.fighters[id].shadow.position.x, this.fighters[id].shadow.position.y, this.fighters[id].shadow.position.z);
      positions.needsUpdate = true;
    }
  }

  private async loadTextures(anisotropy: number) {
    const loader = new THREE.TextureLoader();
    try {
      await Promise.all(Object.entries(this.spriteSources).map(async ([id, source]) => {
        const loaded = await loader.loadAsync(source.url);
        let texture: THREE.Texture = loaded;
        const image = loaded.image as HTMLImageElement;
        if (this.textureMaxResolution > 0 && (image.naturalWidth > this.textureMaxResolution || image.naturalHeight > this.textureMaxResolution)) {
          const scale = Math.min(this.textureMaxResolution / image.naturalWidth, this.textureMaxResolution / image.naturalHeight);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Unable to allocate sandbox sprite sampling canvas");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          texture = new THREE.CanvasTexture(canvas);
          loaded.dispose();
        }
        texture.colorSpace = THREE.SRGBColorSpace; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = anisotropy; texture.generateMipmaps = true; texture.premultiplyAlpha = false;
        this.textures.set(id, texture); this.disposableTextures.add(texture);
      }));
      this.setFighterFrame("p1", this.initialFrameId); this.setFighterFrame("p2", this.initialFrameId);
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  private foregroundOcclusionPercent() {
    const safe = { left: -0.86, right: 0.86, bottom: -0.92, top: 0.92 };
    const safeArea = (safe.right - safe.left) * (safe.top - safe.bottom);
    let area = 0;
    for (const mesh of this.foregroundMeshes) {
      const box = new THREE.Box3().setFromObject(mesh);
      const min = new THREE.Vector2(Infinity, Infinity); const max = new THREE.Vector2(-Infinity, -Infinity);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const point = new THREE.Vector3(x, y, z).project(this.camera); min.min(new THREE.Vector2(point.x, point.y)); max.max(new THREE.Vector2(point.x, point.y));
      }
      const width = Math.max(0, Math.min(max.x, safe.right) - Math.max(min.x, safe.left));
      const height = Math.max(0, Math.min(max.y, safe.top) - Math.max(min.y, safe.bottom));
      area += width * height;
    }
    return clamp(area / safeArea * 100, 0, 100);
  }
}
