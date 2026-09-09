import { groundNormalForState } from "./groundNormalsPlaytestV1";
import type { SandboxFighterState } from "./types";

export const CROUCHING_MEDIUM_DOUBLE_SHOT_V1_PRESENTATION = {
  record: "SWAHILI_CROUCHING_MEDIUM_DOUBLE_SHOT_V1_PRESENTATION",
  status: "candidate-only",
  deployable: false,
  approval: "awaiting_human_crouching_medium_double_shot_v1_review",
  concept: "close_range_crouched_double_tap",
  visibleShotCount: 2,
  registeredHitCount: 2,
  projectileEntityCount: 0,
  sourceRoot: [768, 1408],
  muzzleSockets: {
    1: [1322, 742],
    2: [1328, 716]
  },
  ejectionSockets: {
    1: [1200, 700],
    2: [1216, 674]
  },
  sourcePixelsToSimulationUnits: 0.165,
  cameraShakeMaxPixels: 3,
  renderingMayAffectGameplay: false
} as const;

export interface CrouchingMediumDoubleShotSample {
  readonly active: boolean;
  readonly shotOrdinal: 1 | 2 | null;
  readonly shotAge: number | null;
  readonly showMuzzleFlash: boolean;
  readonly showSmoke: boolean;
  readonly showShell: boolean;
  readonly showImpact: boolean;
  readonly showTracer: boolean;
  readonly muzzleFrame: number;
  readonly smokeFrame: number;
  readonly shellFrame: number;
  readonly impactFrame: number;
  readonly recoilJoltPixels: number;
  readonly cameraShakePixels: readonly [number, number];
  readonly hitConfirmed: boolean;
  readonly connectedHitOrdinals: readonly number[];
  readonly visibleShotEvents: 0 | 1;
  readonly visibleImpactEvents: 0 | 1;
}

const INACTIVE_SAMPLE: CrouchingMediumDoubleShotSample = {
  active: false,
  shotOrdinal: null,
  shotAge: null,
  showMuzzleFlash: false,
  showSmoke: false,
  showShell: false,
  showImpact: false,
  showTracer: false,
  muzzleFrame: 0,
  smokeFrame: 0,
  shellFrame: 0,
  impactFrame: 0,
  recoilJoltPixels: 0,
  cameraShakePixels: [0, 0],
  hitConfirmed: false,
  connectedHitOrdinals: [],
  visibleShotEvents: 0,
  visibleImpactEvents: 0
};

export function crouchingMediumDoubleShotSample(attacker: SandboxFighterState): CrouchingMediumDoubleShotSample {
  const definition = groundNormalForState(
    attacker.state,
    attacker.standingNormalTimingProfile,
    attacker.crouchingLightTimingProfile,
    attacker.crouchingMediumTimingProfile,
    attacker.crouchingHeavyTimingProfile
  );
  if (!definition || definition.id !== "crouching_medium" || attacker.moveCursor === null) return INACTIVE_SAMPLE;

  const activeWindow = [...definition.hits]
    .reverse()
    .find((candidate) => attacker.moveCursor! >= candidate.startTick && attacker.moveCursor! - candidate.startTick < 4);
  if (!activeWindow || (activeWindow.ordinal !== 1 && activeWindow.ordinal !== 2)) {
    return { ...INACTIVE_SAMPLE, connectedHitOrdinals: [...attacker.groundNormalConnectedHitOrdinals] };
  }

  const shotOrdinal = activeWindow.ordinal;
  const shotAge = attacker.moveCursor - activeWindow.startTick;
  const hitConfirmed = attacker.groundNormalConnectedHitOrdinals.includes(shotOrdinal);
  const showMuzzleFlash = shotAge < 2;
  const showSmoke = shotAge < 3;
  const showShell = shotAge < 4;
  const showImpact = hitConfirmed && shotAge < 3;
  const showTracer = shotAge < 2;
  const recoilJoltPixels = hitConfirmed
    ? (shotOrdinal === 1 ? [3, 2, 1, 0] : [5, 3, 1, 0])[shotAge]
    : 0;
  const cameraShakePixels = hitConfirmed
    ? (shotOrdinal === 1
      ? ([[1, -1], [-1, 0], [0, 0], [0, 0]] as const)[shotAge]
      : ([[3, -1], [-2, 1], [0, 0], [0, 0]] as const)[shotAge])
    : ([0, 0] as const);

  return {
    active: showMuzzleFlash || showSmoke || showShell || showImpact || showTracer,
    shotOrdinal,
    shotAge,
    showMuzzleFlash,
    showSmoke,
    showShell,
    showImpact,
    showTracer,
    muzzleFrame: Math.min(shotAge, 1),
    smokeFrame: Math.min(shotAge, 2),
    shellFrame: Math.min(shotAge, 3),
    impactFrame: Math.min(shotAge, 2),
    recoilJoltPixels,
    cameraShakePixels,
    hitConfirmed,
    connectedHitOrdinals: [...attacker.groundNormalConnectedHitOrdinals],
    visibleShotEvents: 1,
    visibleImpactEvents: showImpact ? 1 : 0
  };
}
