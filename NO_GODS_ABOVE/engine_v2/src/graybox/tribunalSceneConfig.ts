import rawScene from "../../stage-production/arenas/the_last_tribunal/graybox/actual_graybox_v1.scene.json";

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export interface TribunalGrayboxMaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
}

export interface TribunalGrayboxSceneConfig {
  schemaVersion: "1.0.0-actual-tribunal-graybox-scene";
  arenaId: "the_last_tribunal";
  presentationId: "actual_graybox_v1";
  sceneConfigPath: string;
  rendererEntryPoint: string;
  status: string;
  deployable: false;
  approvalState: string;
  authority: {
    gameplayPlane: "deterministic_2d";
    renderGeometryAuthoritative: false;
    presentationMayWriteSimulation: false;
    fighterPlaneZ: 0;
    floorY: 0;
    realTimeStageShadowCasters: 0;
  };
  sourceContracts: Record<string, string>;
  combatPlane: { origin: Vec3; floorY: 0; worldBounds: Vec2; spawnWorldX: Vec2; wallBounceWorldX: Vec2 };
  camera: { strategy: "constrained_perspective"; fovDegrees: number; defaultPosition: Vec3; distanceRange: Vec2; clampX: Vec2 };
  parallaxZ: { foreground: number; fighter: 0; midground: number; background: number };
  lighting: {
    primaryDirection: Vec3;
    primaryColor: string;
    primaryIntensity: number;
    hemisphereSky: string;
    hemisphereGround: string;
    hemisphereIntensity: number;
    fogColor: string;
    fogDensity: number;
  };
  materials: Record<string, TribunalGrayboxMaterialConfig>;
  geometry: {
    requiredRoles: string[];
    floor: { size: Vec2; position: Vec3; material: string };
    shadowReceiver: { size: Vec2; position: Vec3; opacity: number };
    daisSteps: Array<{ id: string; size: Vec3; position: Vec3; material: string }>;
    courtWingX: number[];
    galleryTiers: Array<{ size: Vec3; y: number; z: number }>;
    columnX: number[];
    column: { shaftSize: Vec3; baseSize: Vec3; capitalSize: Vec3; z: number };
    witnessBoxes: Array<{ position: Vec3; size: Vec3 }>;
    oculusWall: { z: number; openingCenter: Vec2; openingRadius: number; pieces: Array<{ id: string; size: Vec3; position: Vec3 }> };
    banners: Array<{ position: Vec3; size: Vec2 }>;
    boundaryPylons: { x: number[]; size: Vec3; positionY: number; z: number };
    foregroundFrames: Array<{ id: string; position: Vec3; size: Vec3 }>;
    hazeBands: Array<{ position: Vec3; size: Vec2; opacity: number }>;
  };
  contrastZones: Array<{ id: string; bounds: [number, number, number, number] }>;
  vfxSafetyRegions: Array<{ id: string; bounds?: [number, number, number, number]; radiusFromFighterRoot?: number }>;
  cinematicVolumes: Array<{ id: string; centerClampX: Vec2; rootMargin: number }>;
  runtimeAssets: { stageTextures: string[]; conceptBoardRuntimeDependency: false; finalMaterialsOrTextures: false };
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ACTUAL TRIBUNAL GRAYBOX LOAD ERROR: ${message}`);
}

export function validateActualTribunalGrayboxScene(value: unknown): TribunalGrayboxSceneConfig {
  invariant(!!value && typeof value === "object" && !Array.isArray(value), "scene config root must be an object");
  const scene = value as Partial<TribunalGrayboxSceneConfig>;
  invariant(scene.schemaVersion === "1.0.0-actual-tribunal-graybox-scene", "scene schema mismatch");
  invariant(scene.arenaId === "the_last_tribunal", "arena id must be the_last_tribunal");
  invariant(scene.presentationId === "actual_graybox_v1", "presentation id must be actual_graybox_v1");
  invariant(scene.authority?.gameplayPlane === "deterministic_2d", "deterministic 2D gameplay plane is required");
  invariant(scene.authority?.renderGeometryAuthoritative === false, "render geometry must remain non-authoritative");
  invariant(scene.authority?.presentationMayWriteSimulation === false, "presentation must not write simulation");
  invariant(scene.authority?.fighterPlaneZ === 0 && scene.authority.floorY === 0, "fighter plane and floor must remain zero");
  invariant(scene.combatPlane?.worldBounds?.[0] === -8.4 && scene.combatPlane.worldBounds[1] === 8.4, "approved world bounds mismatch");
  invariant(scene.combatPlane?.spawnWorldX?.[0] === -1.52 && scene.combatPlane.spawnWorldX[1] === 1.52, "approved spawns mismatch");
  invariant(scene.camera?.fovDegrees === 28 && scene.camera.clampX[0] === -7.8 && scene.camera.clampX[1] === 7.8, "approved camera mismatch");
  invariant(scene.parallaxZ?.foreground === 3.2 && scene.parallaxZ.fighter === 0 && scene.parallaxZ.midground === -7 && scene.parallaxZ.background === -15, "approved parallax depths mismatch");
  invariant((scene.geometry?.requiredRoles?.length ?? 0) >= 11, "required graybox geometry roles are incomplete");
  invariant(scene.runtimeAssets?.conceptBoardRuntimeDependency === false, "concept board cannot be a runtime dependency");
  invariant(scene.runtimeAssets?.stageTextures?.length === 0, "graybox stage textures must remain empty");
  return scene as TribunalGrayboxSceneConfig;
}

export const actualTribunalGrayboxV1Scene = validateActualTribunalGrayboxScene(rawScene);
