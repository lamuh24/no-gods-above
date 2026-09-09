import { FighterState, MatchState } from "../core/types";

export interface TimingCandidate {
  label: string;
  phaseTicks: { startup: number; active: number; recovery: number };
  durationTicks: number;
  exposureTicks: number[];
  preservesSourceFrameOrder: boolean;
  duplicateMeaninglessFrames: boolean;
}
export interface TimingMove {
  moveId: string;
  sourceFrameCount: number;
  authoredFrameCount?: number;
  contactSourceFrames: number[];
  v1Historical: HistoricalTimeline;
  candidates: Record<"A" | "B" | "C", TimingCandidate>;
  recommendedCandidate: "B";
  humanReviewStatus: string;
  note: string | null;
}
export interface HistoricalTimeline {
  durationTicks: number;
  exposureTicks: number[];
  durationEvidence: string;
  exposureEvidence: string;
  contactTick: number | null;
  note: string;
}
export interface ComparisonClip {
  clipId: string;
  sourceFrameCount: number;
  v1Historical: HistoricalTimeline | null;
  v2Candidate: { label: string; durationTicks: number; exposureTicks: number[] };
  humanReviewStatus: string | null;
}
export interface RuntimeTimeline { exposureTicks: number[]; durationTicks: number; contactSourceFrames: number[]; contactTick: number | null; contactTicks?: number[]; }
export interface StyleCheckpoint {
  title: string;
  publicPath: string;
  candidateOnly: true;
  deployable: false;
  humanReviewStatus: string | null;
  artStatus: string;
  sourceMove: string;
  sourceFrame: number;
  alphaAudit: { genuineTransparency: boolean; cornerAlpha: number };
  purpleFringeAudit: { sourceMagentaPercent: number; candidateMagentaPercent: number };
  knownDebt: string[];
}
export interface AnimationClosureFrame {
  index: number;
  sourceV1Index?: number;
  sourceV1Indices?: number[];
  role: string;
  publicPath: string;
  bodyOnlyPublicPath?: string;
  bodyOnlySha256?: string;
  auraBaked?: boolean;
  bodyVisibleBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  sha256: string;
  sourceSha256: string;
  root: { x: number; y: number };
  authoredWorldRootOffset?: { x: number; y: number };
  visibleBounds: { minX: number; minY: number; maxX: number; maxY: number };
  bodyCenter: { x: number; y: number };
  contact: boolean;
  visibleImpact: boolean;
}
export interface MovementModernizationFrame {
  index: number;
  role: string;
  publicPath: string;
  sha256: string;
  sourceSha256: string;
  legacySha256: string | null;
  legacyIndex: number | null;
  root: { x: number; y: number };
  visibleBounds: { minX: number; minY: number; maxX: number; maxY: number };
  bodyCenter: { x: number; y: number };
}
export interface MovementModernizationState {
  sourceFrameCount: number;
  authoredFrameCount: number;
  selectedLegacyFrames: number[];
  exposureTicks: number[];
  durationTicks: number;
  loop: boolean;
  frames: MovementModernizationFrame[];
}
export interface MovementModernization {
  status: string;
  candidateOnly: true;
  deployable: false;
  rendererAuthoritative: false;
  simulationAuthoritative: true;
  simulationHz: 60;
  canvas: { width: number; height: number };
  root: { x: number; y: number };
  perFrameRescale: false;
  visualRecentering: false;
  placementPolicy: string;
  states: Record<"idle" | "walk_forward" | "walk_backward" | "dash_forward" | "dash_backward" | "crouch" | "crouch_to_stand" | "jump" | "air_dash_forward" | "air_dash_backward" | "standing_block" | "crouching_block" | "turn_facing", MovementModernizationState>;
  crouchJumpModernization?: {
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPath: string;
    contactSheetSha256: string;
    sourceRepairReason: string;
    sourceSheetCameraCorrections: { crouch: number; jump: number };
    humanApproval: { crouch: string | null; jump: string | null; transitions: string | null };
  };
  crouchingBlockModernization?: {
    status: string;
    candidateOnly: true;
    deployable: false;
    timingChanged: false;
    gameplayChanged: false;
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPath: string;
    contactSheetSha256: string;
    rejectedGenerationEvidence: string;
    sourceRepairReason: string;
    identityLock: { matureAdultProportions: boolean; boxedBeardAndMustache: boolean; noPurpleOutline: boolean; humanApproval: string | null };
    humanApproval: string | null;
  };
  jumpAdultProportionRepair?: {
    status: string;
    candidateOnly: true;
    deployable: false;
    timingChanged: false;
    physicsChanged: false;
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPath: string;
    contactSheetSha256: string;
    sourceRepairReason: string;
    idleHeightDeltaRatio: number;
    identityLock: { matureAdultProportions: boolean; boxedBeardAndMustache: boolean; noPurpleOutline: boolean; sameSevenPoseArc: boolean; humanApproval: string | null };
    humanApproval: string | null;
  };
  dashBlockModernization?: {
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPaths: Record<"dash_forward" | "dash_backward" | "air_dash_forward" | "air_dash_backward" | "standing_block", string>;
    contactSheetSha256: Record<"dash_forward" | "dash_backward" | "air_dash_forward" | "air_dash_backward" | "standing_block", string>;
    sourceRepairReason: string;
    humanApproval: Record<"dash_forward" | "dash_backward" | "air_dash_forward" | "air_dash_backward" | "standing_block", string | null>;
  };
  backwardMotionRepair?: {
    status: string;
    candidateOnly: true;
    deployable: false;
    timingChanged: false;
    simulationTravelChanged: false;
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPaths: Record<"walk_backward" | "dash_backward", string>;
    contactSheetSha256: Record<"walk_backward" | "dash_backward", string>;
    sourceRepairReason: string;
    humanApproval: Record<"walk_backward" | "dash_backward" | "transitions", string | null>;
    supersededStates?: Record<string, string>;
  };
  walkBackVideoRebuild?: {
    status: string;
    candidateOnly: true;
    deployable: false;
    generatedArtwork: false;
    reversedPlayback: true;
    timingChanged: false;
    simulationTravelChanged: false;
    sourceVideo: { path: string; sha256: string; frameRate: number; durationSeconds: number; sourceFrameCount: number };
    sourceVideoFrames: number[];
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPath: string;
    contactSheetSha256: string;
    supersedes: string;
    humanApproval: { motion: string | null; transitions: string | null };
  };
  turnFacingModernization?: {
    status: string;
    candidateOnly: true;
    deployable: false;
    productionApproved: false;
    timingChanged: false;
    combatChanged: false;
    gameplayFacingSwapDelayed: false;
    fighterRootDisplacement: number;
    normalizationReport: { path: string; sha256: string };
    hashLock: { path: string; sha256: string };
    contactSheetPublicPath: string;
    contactSheetSha256: string;
    rejectedGenerationEvidence: string;
    sourceRepairReason: string;
    identityLock: {
      matureAdultProportions: boolean;
      boxedBeardAndMustache: boolean;
      noPurpleOutline: boolean;
      fixedIdleScale: boolean;
    };
    transitionContract: {
      durationTicks: number;
      gameplayFacingSwapTick: number;
      presentationFacingSource: string;
      immediatelyInterruptible: boolean;
      rendererOwnsGameplayState: boolean;
    };
    humanApproval: string | null;
    approvalReceipt: { path: string; sha256: string } | null;
    starredForRevisit: boolean;
    polishDebt: string | null;
  };
  reviewQuestions: string[];
}
export interface ThrowAnimationFrame {
  index: number;
  role: string;
  publicPath: string;
  sha256: string;
  sourceSha256: string;
  root: { x: number; y: number };
  visibleBounds: { minX: number; minY: number; maxX: number; maxY: number };
  bodyCenter: { x: number; y: number };
}
export interface ThrowAnimationSequence {
  id: "universal_grab_attempt" | "forward_throw" | "back_throw";
  authoredFrameCount: number;
  totalTicks: number;
  exposureTicks: number[];
  connectTick: number;
  releaseTick: number | null;
  frames: ThrowAnimationFrame[];
}
export interface ThrowAnimationFamily {
  status: string;
  candidateOnly: true;
  deployable: false;
  rendererAuthoritative: false;
  simulationAuthoritative: true;
  simulationHz: 60;
  canvas: { width: number; height: number };
  root: { x: number; y: number };
  perFrameRescale: false;
  visualRecentering: false;
  placementPolicy: string;
  standardVictimClass: "standard_humanoid";
  globalVictimScale: false;
  sequences: Record<ThrowAnimationSequence["id"], ThrowAnimationSequence>;
  contactSheetPublicPath: string;
  contactSheetSha256: string;
  reviewQuestions: string[];
  humanApproval: { standardGrab: string | null; forwardThrow: string | null; backThrow: string | null };
  approvalReceipt: { path: string; sha256: string } | null;
}
export interface AnimationClosure {
  status: string;
  candidateOnly: true;
  deployable: false;
  rendererAuthoritative: false;
  simulationAuthoritative: true;
  simulationHz: 60;
  identityLock?: { matureAdultProportions: boolean; noChibiProportions: boolean; boxedBeardAndMustache: boolean; longBlackLocs: boolean; noPurpleOutline: boolean; sameSequenceScale: boolean; compactFramesUsePoseCompressionNotPerFrameScale: boolean; internalVisualAudit: string; directionReceipt: { path: string; sha256: string }; humanApproval: string | null };
  v1: { sourceFrameCount: number; historicalDurationTicks: number; reconstructedExposureTicks: number[]; exposureEvidence: string; root: { x: number; y: number }; visibleBounds: Array<{ minX: number; minY: number; maxX: number; maxY: number }>; bodyCenters: Array<{ x: number; y: number }>; contactFrame: number | null; exactContactTick: number | null; note: string };
  v2: { canvas: { width: number; height: number }; root: { x: number; y: number }; rootPath: Array<{ x: number; y: number }>; authoredWorldRootPath?: Array<{ x: number; y: number }>; frames: AnimationClosureFrame[]; contactFrame: number; contactFrames?: number[]; contactPresentation: { publicPath: string; sha256: string; bodyOnlyOnWhiff: true; bodyOnlyForAllOutcomes?: boolean; vfxEnabled?: boolean; classification?: string; allowedOutcomes: string[]; contacts?: Array<{ frame: number; publicPath: string; sha256: string; role: string }>; separationStatus: string }; singleSequenceScale: number; sourceArtCameraCorrections?: number[]; perFrameRescale: false; visualRecentering: false; placementPolicy: string; visibleImpactCount: number; gameplayHitCount: number; singleActionContract?: { oneContinuousPhysicalAction: boolean; groundedDashForward: boolean; strikingLimb: string; punchOnly: boolean; contactFrame: number; visibleImpactCount: number; gameplayHitCount: number; risingStrikeRemoved: boolean; airborneFollowupRemoved: boolean; secondStrikeRemoved: boolean; poseProgression: string[] }; mobilityIdentity?: { primaryRead: string; dashAura: boolean; auraPalette: string[]; auraFrames: number[]; strongestAuraFrame: number; impactExplosion: boolean; afterimageBodyClone: boolean; worldTravelOwner: string; variation?: string }; targetSideSwitchContract?: { owner: string; triggerTick: number; captureRange: number; behindDistance: number; verticalTolerance: number; requireTargetAhead: boolean; faceTargetAfterSwitch: boolean; victimTranslated: false; cornerFallback: string }; chargeReadability?: { targetSideReappearanceFrame: number; briefPauseFrame: number; smallEnergySeedFrame: number; growingEnergyBallFrame: number; singleBlastContactFrame: number; damageBeforeContact: false }; preservationBoundary?: { protectedLegacyFramesModified: boolean; sourceOrderPreserved: boolean; approvedV2Disposition: string; retainedLegacyQualities: string[]; retiredLegacyBeats: string[]; explicitRootMotionOwner: string } };
  timingCandidates: Record<"A" | "B" | "C", TimingCandidate>;
  recommendedTimingCandidate: "B";
  impactCandidates: Record<"I1" | "I2" | "I3", { label: string; hitstopTicks: number; contactExposureDelta: number; recoilExposureDelta: number; recoveryExposureDelta: number }>;
  recommendedImpactCandidate: "I2";
  rejectedCandidate?: { path: string; sha256: string; decision: string };
  unsupported: { counterHit: string };
}
export type StandingHeavyClosure = AnimationClosure;
export interface RadiantDiveClosure extends AnimationClosure {
  v2: AnimationClosure['v2'] & { releaseSocket: {x:number;y:number} };
}
export interface ReviewData {
  radiantDiveFamily?: {
    status: string; candidateOnly: true; deployable: false;
    variants: { light: RadiantDiveClosure; medium: RadiantDiveClosure; heavy: RadiantDiveClosure };
    contactSheets: string[]; reviewNotes: string[];
  };
  heavenSplitterFamily: {
    status: string; candidateOnly: true; deployable: false;
    variants: { light: AnimationClosure; medium: AnimationClosure; heavy: AnimationClosure };
    contactSheets: string[]; reviewNotes: string[];
  };
  celestialPalmFamily: {
    status: string; candidateOnly: true; deployable: false;
    variants: { light: AnimationClosure; medium: AnimationClosure; heavy: AnimationClosure };
    contactSheets: string[]; reviewNotes: string[];
  };
  humanReviewStatus: string;
  timingCandidates: { schemaVersion: string; simulationHz: 60; durationPolicy: string; moves: TimingMove[] };
  comparisonClips: ComparisonClip[];
  runtimeTimelines: Record<string, RuntimeTimeline>;
  firstPlayable: {
    technicalStatus: string;
    humanReviewStatus: string | null;
    candidateOnly: boolean;
    deployable: boolean;
    knownArtDebt: string[];
    reviewQuestions: string[];
    currentReviewGate: {
      starredForRevisit: Array<{
        subject: string;
        decision: string;
        reason: string;
        approvalReceipt?: { path: string; sha256: string };
      }>;
    };
  };
  throws: { technicalStatus: string; humanReviewStatus: string | null; artStatus: string; artTruth: string };
  styleCheckpoint: StyleCheckpoint;
  sourceLock: { artifacts: Array<{ kind: string; sheetId?: string; path: string; sha256: string }> };
  authority: { renderingAuthoritative: false; simulationAuthoritative: true; candidateOnly: true; deployable: false };
  standingHeavyClosure: AnimationClosure;
  standingLightClosure: AnimationClosure;
  standingMediumClosure: AnimationClosure;
  crouchingLightClosure: AnimationClosure;
  crouchingMediumClosure: AnimationClosure;
  crouchingHeavyClosure: AnimationClosure;
  airLightClosure: AnimationClosure;
  airMediumClosure: AnimationClosure;
  airHeavyClosure: AnimationClosure;
  ascendStepClosure: AnimationClosure;
  ascendStepFamily: {
    schemaVersion: string;
    status: string;
    candidateOnly: true;
    deployable: false;
    variants: { light: AnimationClosure; medium: AnimationClosure; heavy: AnimationClosure };
    inputs: { light: string; medium: string; heavy: string };
    differentiation: { light: string; medium: string; heavy: string };
    humanApproval: { family: string | null; light: string | null; medium: string | null; heavy: string | null; heavyTargetSideSwitch: string | null };
  };
  airNormalsBatch: { status: string; candidateOnly: true; deployable: false; contactSheetPublicPath: string; contactSheetSha256: string; humanReviewStatus: string };
  movementModernization: MovementModernization;
  throwAnimations: ThrowAnimationFamily;
}

export interface SpriteRow {
  atlas: string;
  row: number;
  frames: number;
  sourceName: string;
}

const atlas = (filename: string) => `/lamuh-legacy-v2/atlases/${filename}`;
export const spriteRows: Record<string, SpriteRow> = {
  idle: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 0, frames: 8, sourceName: "idle" },
  walk_forward: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 1, frames: 6, sourceName: "walk_forward" },
  walk_backward: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 2, frames: 6, sourceName: "walk_backward" },
  dash_forward: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 3, frames: 6, sourceName: "dash_forward" },
  dash_backward: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 4, frames: 6, sourceName: "dash_backward" },
  crouch: { atlas: atlas("lamuh_sheet_1_core_movement_atlas.png"), row: 5, frames: 4, sourceName: "crouch" },
  jump: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 0, frames: 4, sourceName: "jump" },
  forward_jump: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 1, frames: 4, sourceName: "forward_jump" },
  backward_jump: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 2, frames: 4, sourceName: "backward_jump" },
  fall: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 3, frames: 4, sourceName: "fall" },
  air_dash_forward: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 4, frames: 6, sourceName: "air_dash_forward" },
  air_dash_backward: { atlas: atlas("lamuh_sheet_2_air_movement_atlas.png"), row: 5, frames: 6, sourceName: "air_dash_backward" },
  standing_light: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 0, frames: 4, sourceName: "standing_light" },
  crouching_light: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 0, frames: 4, sourceName: "standing_light (V1 alias)" },
  standing_medium: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 1, frames: 8, sourceName: "standing_medium" },
  crouching_medium: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 1, frames: 8, sourceName: "standing_medium (V1 alias)" },
  standing_heavy: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 2, frames: 7, sourceName: "standing_heavy" },
  crouching_heavy: { atlas: atlas("lamuh_sheet_3_ground_normals_atlas.png"), row: 3, frames: 7, sourceName: "launcher" },
  air_light: { atlas: atlas("lamuh_sheet_4_air_normals_atlas.png"), row: 0, frames: 4, sourceName: "air_light" },
  air_medium: { atlas: atlas("lamuh_sheet_4_air_normals_atlas.png"), row: 1, frames: 6, sourceName: "air_medium" },
  air_heavy: { atlas: atlas("lamuh_sheet_4_air_normals_atlas.png"), row: 2, frames: 7, sourceName: "air_heavy" },
  ascend_step: { atlas: atlas("lamuh_sheet_5_specials_atlas.png"), row: 1, frames: 7, sourceName: "ascend_step" },
  ascend_step_light: { atlas: atlas("lamuh_sheet_5_specials_atlas.png"), row: 1, frames: 7, sourceName: "ascend_step (V1 family source)" },
  standing_block: { atlas: atlas("lamuh_sheet_6_defense_hit_reactions_atlas.png"), row: 0, frames: 4, sourceName: "standing_block" },
  crouching_block: { atlas: atlas("lamuh_sheet_6_defense_hit_reactions_atlas.png"), row: 1, frames: 4, sourceName: "crouching_block" },
  light_reaction: { atlas: atlas("lamuh_sheet_6_defense_hit_reactions_atlas.png"), row: 3, frames: 5, sourceName: "light_reaction" },
  heavy_reaction: { atlas: atlas("lamuh_sheet_6_defense_hit_reactions_atlas.png"), row: 5, frames: 6, sourceName: "heavy_reaction" },
  knockdown: { atlas: atlas("lamuh_sheet_7_knockdown_recovery_flavor_atlas.png"), row: 0, frames: 6, sourceName: "knockdown" },
  get_up: { atlas: atlas("lamuh_sheet_7_knockdown_recovery_flavor_atlas.png"), row: 2, frames: 6, sourceName: "get_up" }
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const v2EdgeCache = new Map<string, Promise<HTMLCanvasElement>>();
export function loadImage(source: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(source);
  if (cached) return cached;
  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${source}`));
    image.src = source;
  });
  imageCache.set(source, loading);
  return loading;
}

export function loadPresentationImage(source: string, edgeProfile: "legacy" | "v2_dark_ink" = "legacy"): Promise<CanvasImageSource> {
  if (edgeProfile === "legacy") return loadImage(source);
  const cached = v2EdgeCache.get(source);
  if (cached) return cached;
  const loading = loadImage(source).then((image) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error(`Unable to create V2 edge-clean canvas for ${source}`);
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let repaired = 0;
    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index], green = pixels.data[index + 1], blue = pixels.data[index + 2], alpha = pixels.data[index + 3];
      // Legacy atlases carry an opaque magenta extraction fringe. Replace only that hue family
      // with neutral dark-ink separation; intentional cyan/blue ki and gold accents are untouched.
      if (alpha > 8 && red > 45 && blue > 45 && red > green * 1.18 && blue > green * 1.18) {
        const ink = Math.min(34, Math.round((red * .08 + green * .18 + blue * .05)));
        pixels.data[index] = ink; pixels.data[index + 1] = ink; pixels.data[index + 2] = ink; repaired++;
      }
    }
    context.putImageData(pixels, 0, 0);
    canvas.dataset.edgeRepairCount = String(repaired);
    return canvas;
  });
  v2EdgeCache.set(source, loading);
  return loading;
}

export function exposureFrame(exposures: readonly number[], tick: number) {
  let cursor = Math.max(0, Math.floor(tick));
  for (let frame = 0; frame < exposures.length; frame++) {
    if (cursor < exposures[frame]) return frame;
    cursor -= exposures[frame];
  }
  return exposures.length - 1;
}

export function loopFrame(frameCount: number, phaseTick: number, ticksPerFrame = 7.5) {
  return Math.floor(Math.max(0, phaseTick) / ticksPerFrame) % frameCount;
}

export function contactTick(move: TimingMove, candidate: TimingCandidate) {
  return candidate.exposureTicks.slice(0, Math.min(...move.contactSourceFrames)).reduce((sum, value) => sum + value, 0);
}

export function runtimeTimelineFrame(data: ReviewData, timelineId: string, phaseTick: number, loop = false) {
  const timeline = data.runtimeTimelines[timelineId];
  if (!timeline) return 0;
  const tick = loop ? Math.max(0, phaseTick) % Math.max(1, timeline.durationTicks) : Math.min(Math.max(0, phaseTick), timeline.durationTicks - 1);
  return exposureFrame(timeline.exposureTicks, tick);
}

export async function drawAtlasFrame(
  context: CanvasRenderingContext2D,
  row: SpriteRow,
  frame: number,
  x: number,
  groundY: number,
  scale: number,
  facing: 1 | -1 = 1,
  rotationDegrees = 0,
  alpha = 1,
  edgeProfile: "legacy" | "v2_dark_ink" = "legacy"
) {
  const image = await loadPresentationImage(row.atlas, edgeProfile);
  const cell = 448;
  const drawSize = cell * scale;
  context.save();
  context.globalAlpha = alpha;
  context.translate(x, groundY);
  context.rotate((rotationDegrees * Math.PI) / 180);
  context.scale(facing, 1);
  context.drawImage(image, Math.max(0, Math.min(row.frames - 1, frame)) * cell, row.row * cell, cell, cell, -drawSize / 2, -drawSize, drawSize, drawSize);
  context.restore();
}

export async function drawStandaloneFrame(
  context: CanvasRenderingContext2D,
  source: string,
  sourceRoot: { x: number; y: number },
  sourceCanvas: { width: number; height: number },
  x: number,
  groundY: number,
  scale: number,
  facing: 1 | -1 = 1,
  alpha = 1,
  silhouette = false
) {
  const image = await loadImage(source);
  context.save();
  context.globalAlpha = alpha;
  context.translate(x, groundY);
  context.scale(facing, 1);
  if (silhouette) context.filter = "brightness(0) saturate(100%) invert(83%) sepia(22%) saturate(975%) hue-rotate(102deg) brightness(94%) contrast(91%)";
  context.drawImage(image, -sourceRoot.x * scale, -sourceRoot.y * scale, sourceCanvas.width * scale, sourceCanvas.height * scale);
  context.restore();
}

export function drawAuthoredOverlay(
  context: CanvasRenderingContext2D,
  rootScreen: { x: number; y: number },
  sourceRoot: { x: number; y: number },
  scale: number,
  facing: 1 | -1,
  bodyCenter?: { x: number; y: number },
  bounds?: { minX: number; minY: number; maxX: number; maxY: number },
  options: { root?: boolean; bodyCenter?: boolean; bounds?: boolean } = {}
) {
  const screenX = (sourceX: number) => rootScreen.x + facing * (sourceX - sourceRoot.x) * scale;
  const screenY = (sourceY: number) => rootScreen.y + (sourceY - sourceRoot.y) * scale;
  context.save();
  if (options.root) {
    context.strokeStyle = "#ffe08a"; context.lineWidth = 2;
    context.beginPath(); context.moveTo(rootScreen.x - 8, rootScreen.y); context.lineTo(rootScreen.x + 8, rootScreen.y); context.moveTo(rootScreen.x, rootScreen.y - 8); context.lineTo(rootScreen.x, rootScreen.y + 8); context.stroke();
  }
  if (options.bodyCenter && bodyCenter) {
    const x = screenX(bodyCenter.x), y = screenY(bodyCenter.y);
    context.fillStyle = "#75d39b"; context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2); context.fill();
    context.strokeStyle = "rgba(117,211,155,.7)"; context.beginPath(); context.moveTo(rootScreen.x, rootScreen.y); context.lineTo(x, y); context.stroke();
  }
  if (options.bounds && bounds) {
    const left = Math.min(screenX(bounds.minX), screenX(bounds.maxX));
    const right = Math.max(screenX(bounds.minX), screenX(bounds.maxX));
    context.strokeStyle = "rgba(89,202,255,.85)"; context.setLineDash([6, 4]);
    context.strokeRect(left, screenY(bounds.minY), right - left, screenY(bounds.maxY) - screenY(bounds.minY));
  }
  context.restore();
}

export function drawReviewBackdrop(context: CanvasRenderingContext2D, width: number, height: number, title: string) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#101a26"); gradient.addColorStop(1, "#05080c");
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(214,166,56,.3)"; context.lineWidth = 1;
  for (let x = 0; x < width; x += 32) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
  context.fillStyle = "#d6a638"; context.font = "600 13px system-ui"; context.fillText(title, 16, 24);
  context.strokeStyle = "rgba(255,255,255,.25)"; context.beginPath(); context.moveTo(0, height - 34); context.lineTo(width, height - 34); context.stroke();
}

export function sourceRowForFighter(fighter: FighterState, state: MatchState, data: ReviewData): { row: SpriteRow; frame: number; placeholder: boolean } {
  if (state.throwInteraction && state.throwInteraction.attacker === fighter.id) {
    const interaction = state.throwInteraction;
    const frame = Math.min(7, Math.floor((interaction.tick / Math.max(1, fighter.phase === "throw_whiff" ? 32 : 36)) * 8));
    return { row: spriteRows.standing_medium, frame, placeholder: true };
  }
  if (fighter.currentAttack) {
    const moveId = fighter.currentAttack === "legacy_ascend_step" ? "ascend_step" : fighter.currentAttack;
    const row = spriteRows[moveId] || spriteRows.idle;
    return { row, frame: Math.min(row.frames - 1, runtimeTimelineFrame(data, moveId, fighter.phaseTick)), placeholder: false };
  }
  if (fighter.phase === "walk_forward") return { row: spriteRows.walk_forward, frame: runtimeTimelineFrame(data, "walk_forward", fighter.phaseTick, true), placeholder: false };
  if (fighter.phase === "walk_backward") return { row: spriteRows.walk_backward, frame: runtimeTimelineFrame(data, "walk_backward", fighter.phaseTick, true), placeholder: false };
  if (fighter.phase === "dash") return { row: spriteRows.dash_forward, frame: runtimeTimelineFrame(data, "dash_forward", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "backdash") return { row: spriteRows.dash_backward, frame: runtimeTimelineFrame(data, "dash_backward", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "air_dash_forward") return { row: spriteRows.air_dash_forward, frame: runtimeTimelineFrame(data, "air_dash_forward", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "air_dash_backward") return { row: spriteRows.air_dash_backward, frame: runtimeTimelineFrame(data, "air_dash_backward", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "crouch") return { row: spriteRows.crouch, frame: runtimeTimelineFrame(data, "crouch", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "block") return { row: fighter.crouchBlocking ? spriteRows.crouching_block : spriteRows.standing_block, frame: runtimeTimelineFrame(data, fighter.crouchBlocking ? "crouching_block" : "standing_block", fighter.phaseTick, true), placeholder: false };
  if (fighter.phase === "hit_reaction") return { row: fighter.hitReactionWeight === "heavy" ? spriteRows.heavy_reaction : spriteRows.light_reaction, frame: fighter.hitReactionWeight === "heavy" ? loopFrame(6, fighter.phaseTick, 3) : runtimeTimelineFrame(data, "light_reaction", fighter.phaseTick), placeholder: false };
  if (fighter.phase === "knockdown") return { row: spriteRows.knockdown, frame: loopFrame(6, fighter.phaseTick, 4), placeholder: false };
  if (fighter.phase === "getup") return { row: spriteRows.get_up, frame: loopFrame(6, fighter.phaseTick, 3), placeholder: false };
  if (!fighter.grounded) return { row: fighter.vy < 0 ? spriteRows.jump : spriteRows.fall, frame: loopFrame(4, fighter.phaseTick, 4), placeholder: false };
  return { row: spriteRows.idle, frame: runtimeTimelineFrame(data, "idle", fighter.phaseTick, true), placeholder: false };
}

export async function fetchReviewData() {
  const response = await fetch('/lamuh-legacy-v2/review-data.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Review data HTTP ${response.status}`);
  return response.json() as Promise<ReviewData>;
}
