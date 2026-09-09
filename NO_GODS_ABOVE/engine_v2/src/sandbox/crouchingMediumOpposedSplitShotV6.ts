import { groundNormalForState } from "./groundNormalsPlaytestV1";
import type { SandboxFighterState } from "./types";

export const CROUCHING_MEDIUM_OPPOSED_SPLIT_SHOT_V6_PRESENTATION = {
  record: "SWAHILI_CROUCHING_MEDIUM_OPPOSED_DOUBLE_SHOT_V2_VFX_V6_SANDBOX_PRESENTATION",
  status: "candidate-only",
  deployable: false,
  approval: "awaiting_human_crouching_medium_opposed_double_shot_v2_vfx_v6_review",
  concept: "simultaneous_opposed_split_shot_one_pistol_left_one_pistol_right",
  visibleMuzzleEventCount: 2,
  simultaneousFiringBeatCount: 1,
  registeredHitCountPerOpponent: 1,
  projectileEntityCount: 0,
  sourceRoot: [768, 1408],
  muzzleSockets: { screenLeft: [155, 730], screenRight: [1385, 720] },
  ejectionSockets: { screenLeft: [330, 650], screenRight: [1205, 645] },
  sourcePixelsToSimulationUnits: 0.165,
  cameraShakeMaxPixels: 10,
  recoilDrawJoltMaxPixels: 24,
  vfxRecipe: "preferred_v2_detached_vfx",
  renderingMayAffectGameplay: false
} as const;

export type OpposedSplitLane = "screenLeft" | "screenRight";

export interface CrouchingMediumOpposedSplitShotSample {
  readonly active: boolean;
  readonly contactAge: number | null;
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
  readonly visibleMuzzleEvents: 0 | 2;
  readonly visibleImpactEvents: 0 | 1;
}

const INACTIVE_SAMPLE: CrouchingMediumOpposedSplitShotSample = {
  active: false, contactAge: null, showMuzzleFlash: false, showSmoke: false, showShell: false,
  showImpact: false, showTracer: false, muzzleFrame: 0, smokeFrame: 0, shellFrame: 0,
  impactFrame: 0, recoilJoltPixels: 0, cameraShakePixels: [0, 0], hitConfirmed: false,
  connectedHitOrdinals: [], visibleMuzzleEvents: 0, visibleImpactEvents: 0
};

export function crouchingMediumOpposedSplitShotSample(attacker: SandboxFighterState): CrouchingMediumOpposedSplitShotSample {
  const definition = groundNormalForState(attacker.state, attacker.standingNormalTimingProfile, attacker.crouchingLightTimingProfile, attacker.crouchingMediumTimingProfile, attacker.crouchingHeavyTimingProfile);
  if (!definition || definition.id !== "crouching_medium" || attacker.moveCursor === null) return INACTIVE_SAMPLE;
  const contact = definition.hits[0];
  const contactAge = attacker.moveCursor - contact.startTick;
  if (contactAge < 0 || contactAge >= 4) return { ...INACTIVE_SAMPLE, connectedHitOrdinals: [...attacker.groundNormalConnectedHitOrdinals] };
  const hitConfirmed = attacker.groundNormalConnectedHitOrdinals.includes(contact.ordinal);
  const showMuzzleFlash = contactAge < 2;
  const showSmoke = contactAge < 3;
  const showShell = contactAge < 4;
  const showImpact = hitConfirmed && contactAge < 3;
  const showTracer = contactAge < 2;
  return {
    active: true,
    contactAge,
    showMuzzleFlash,
    showSmoke,
    showShell,
    showImpact,
    showTracer,
    muzzleFrame: Math.min(contactAge, 1),
    smokeFrame: Math.min(contactAge, 2),
    shellFrame: Math.min(contactAge, 3),
    impactFrame: Math.min(contactAge, 2),
    recoilJoltPixels: hitConfirmed ? [24, 18, 10, 4][contactAge] : 0,
    cameraShakePixels: hitConfirmed ? ([[10, -4], [-7, 3], [3, -1], [0, 0]] as const)[contactAge] : [0, 0],
    hitConfirmed,
    connectedHitOrdinals: [...attacker.groundNormalConnectedHitOrdinals],
    visibleMuzzleEvents: showMuzzleFlash ? 2 : 0,
    visibleImpactEvents: showImpact ? 1 : 0
  };
}
