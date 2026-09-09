import { FighterId, FighterState } from "../core/types";

export type Vec3Tuple = [number, number, number];
export type CinematicContext = "throw" | "command_grab" | "super" | "ultimate" | "round_finisher" | "intro" | "victory";

export interface CameraPose {
  position: Vec3Tuple;
  target: Vec3Tuple;
  mode: "gameplay" | "cinematic" | "returning";
  context: CinematicContext | null;
}

export interface StageProductionContract {
  schemaVersion: "2.2.0-stage-contract";
  id: string;
  displayName: string;
  status: "candidate" | "approved" | "retired";
  authority: {
    gameplayPlane: "deterministic_2d";
    renderingMayAffectGameplay: false;
    prohibitedDependencies: string[];
  };
  combatPlane: {
    origin: Vec3Tuple;
    floorY: number;
    baselineY: number;
    simulationBounds: { left: number; right: number };
    worldBounds: { left: number; right: number };
    wallAnchors: { left: number; right: number };
    cameraSafeRegion: { left: number; right: number; bottom: number; top: number };
    fighterWorldScale: number;
    simulationPixelsToWorldUnits: number;
    spritePixelsToWorldUnits: number;
  };
  camera: {
    strategy: "constrained_perspective";
    fovDegrees: number;
    near: number;
    far: number;
    defaultPosition: Vec3Tuple;
    defaultTarget: Vec3Tuple;
    zoom: { minDistance: number; maxDistance: number };
    framing: { fighterPaddingWorld: number; verticalRootBiasWorld: number; fixedTickSmoothingAlpha: number; safeHorizontalMarginWorld: number };
    stageEdgeBehavior: string;
    jumpFraming: string;
    sideSwitchBehavior: string;
    deterministicInputs: string[];
    cinematicOverrideRule: string;
    returnToGameplay: { ticks: number; easing: string; mustContainBothFighters: true };
  };
  spriteIntegration: {
    sourceCanvas: { width: number; height: number };
    sourceRoot: { x: number; y: number };
    billboard: string;
    pivot: string;
    canonicalFacing: string;
    runtimeMirroring: string;
    depthPolicy: string;
    sampling: Record<string, string | number | boolean>;
    edgeTreatment: { alphaTest: number; transparent: boolean; depthWrite: boolean; toneMapped: boolean; haloCleanupRequiredAtSource: boolean };
    shadow: { type: string; planeY: number; maxOpacity: number; airborneFade: boolean; renderOnly: boolean };
    optionalMasks: Record<string, string | boolean>;
    antiCardboard: string[];
  };
  artDirection: Record<string, unknown>;
  grounding: Record<string, unknown>;
  collision: {
    source: "serialized_match_state";
    floor: number;
    leftWall: number;
    rightWall: number;
    cornerDetection: string;
    wallBounceAnchors: [number, number];
    renderGeometryAuthoritative: false;
    hazards: "prohibited";
  };
  cinematicCameras: {
    allowedContexts: CinematicContext[];
    shots: Record<CinematicContext, { durationTicks: number; positionOffset: Vec3Tuple; targetOffset: Vec3Tuple; minDistance: number }>;
    visibilityRule: string;
    mirroringRule: string;
    abortRule: string;
    rollbackRule: string;
  };
  assets: {
    environment: Array<Record<string, string>>;
    fighters: Array<{ id: string; path: string; approval: string; usage: string }>;
  };
  validation: {
    checks: string[];
    performanceBudget: { targetFps: number; maxDrawCalls: number; maxTriangles: number; maxTextures: number; maxTextureMemoryMb: number };
    captureIds: string[];
    deterministicReplayRequired: true;
  };
}

export interface ActiveCinematic {
  context: CinematicContext;
  attackerId: FighterId;
  startTick: number;
  durationTicks: number;
  from: CameraPose;
}

export interface CameraRigSnapshot {
  pose: CameraPose;
  active: ActiveCinematic | null;
  lastTick: number;
}

export interface StageMatchState {
  tick: number;
  fighters: Record<FighterId, Pick<FighterState, "x" | "y" | "facing">>;
}
