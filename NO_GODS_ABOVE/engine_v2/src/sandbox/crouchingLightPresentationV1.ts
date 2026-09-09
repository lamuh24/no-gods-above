import muzzleFlash01 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/muzzle_flash/muzzle_flash_01.png?url";
import muzzleFlash02 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/muzzle_flash/muzzle_flash_02.png?url";
import smokePuff01 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/smoke_puff/smoke_puff_01.png?url";
import smokePuff02 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/smoke_puff/smoke_puff_02.png?url";
import smokePuff03 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/smoke_puff/smoke_puff_03.png?url";
import shellEjection01 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/shell_ejection/shell_ejection_01.png?url";
import shellEjection02 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/shell_ejection/shell_ejection_02.png?url";
import shellEjection03 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/shell_ejection/shell_ejection_03.png?url";
import shellEjection04 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/shell_ejection/shell_ejection_04.png?url";
import impactSpark01 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/impact_spark/impact_spark_01.png?url";
import impactSpark02 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/impact_spark/impact_spark_02.png?url";
import impactSpark03 from "../../../../tools/nga-forge/production/characters/swahili/vfx/candidates/attack-animation-cleanup-v1/crouching-light-presentation-v1/impact_spark/impact_spark_03.png?url";

import { groundNormalForState } from "./groundNormalsPlaytestV1";
import type { SandboxFighterState } from "./types";

export const CROUCHING_LIGHT_PRESENTATION_V1 = {
  record: "SWAHILI_CROUCHING_LIGHT_V4_TIMING_REVIEW_V1",
  status: "candidate-only",
  deployable: false,
  approval: "awaiting_human_crouching_light_timing_review",
  baseArtwork: "CROUCHING_LIGHT_V4_APPROVED_AS_BASE_ARTWORK_PENDING_PRESENTATION_VFX_REVIEW",
  whiffVariant: "D_flash_smoke_shell",
  hitVariant: "D_plus_compact_impact_spark",
  hitstopTicks: 1,
  cameraShakeMaxPixels: 2,
  recoilDrawJoltPixels: [2, 4],
  sourceRoot: [768, 1408],
  muzzleSocket: [1347, 823],
  ejectionSocket: [1198, 774],
  sourcePixelsToSimulationUnits: 0.165,
  renderingMayAffectGameplay: false
} as const;

export interface CrouchingLightVfxAsset {
  readonly url: string;
  readonly anchor: readonly [number, number];
  readonly sourceScale?: number;
}

export const CROUCHING_LIGHT_PRESENTATION_V1_ASSETS = {
  muzzleFlash: [
    { url: muzzleFlash01, anchor: [10, 70] },
    { url: muzzleFlash02, anchor: [10, 55] }
  ],
  smokePuff: [
    { url: smokePuff01, anchor: [28, 100] },
    { url: smokePuff02, anchor: [28, 100] },
    { url: smokePuff03, anchor: [28, 100] }
  ],
  shellEjection: [
    { url: shellEjection01, anchor: [36, 36] },
    { url: shellEjection02, anchor: [36, 36] },
    { url: shellEjection03, anchor: [36, 36] },
    { url: shellEjection04, anchor: [36, 36] }
  ],
  impactSpark: [
    { url: impactSpark01, anchor: [120, 120], sourceScale: 0.62 },
    { url: impactSpark02, anchor: [105, 105], sourceScale: 0.62 },
    { url: impactSpark03, anchor: [85, 85], sourceScale: 0.62 }
  ]
} as const satisfies Record<string, readonly CrouchingLightVfxAsset[]>;

export interface CrouchingLightPresentationSample {
  readonly active: boolean;
  readonly shotAge: number | null;
  readonly showMuzzleFlash: boolean;
  readonly showSmoke: boolean;
  readonly showShell: boolean;
  readonly showImpact: boolean;
  readonly muzzleFrame: number;
  readonly smokeFrame: number;
  readonly shellFrame: number;
  readonly impactFrame: number;
  readonly recoilJoltPixels: number;
  readonly cameraShakePixels: readonly [number, number];
  readonly hitConfirmed: boolean;
  readonly visibleShotEvents: 0 | 1;
  readonly visibleImpactEvents: 0 | 1;
}

const INACTIVE_SAMPLE: CrouchingLightPresentationSample = {
  active: false,
  shotAge: null,
  showMuzzleFlash: false,
  showSmoke: false,
  showShell: false,
  showImpact: false,
  muzzleFrame: 0,
  smokeFrame: 0,
  shellFrame: 0,
  impactFrame: 0,
  recoilJoltPixels: 0,
  cameraShakePixels: [0, 0],
  hitConfirmed: false,
  visibleShotEvents: 0,
  visibleImpactEvents: 0
};

export function crouchingLightPresentationSample(attacker: SandboxFighterState): CrouchingLightPresentationSample {
  const definition = groundNormalForState(
    attacker.state,
    attacker.standingNormalTimingProfile,
    attacker.crouchingLightTimingProfile
  );
  if (!definition || definition.id !== "crouching_light" || attacker.moveCursor === null) return INACTIVE_SAMPLE;
  const shotAge = attacker.moveCursor - definition.startupTicks;
  if (shotAge < 0 || shotAge >= 4) return { ...INACTIVE_SAMPLE, shotAge };

  const hitConfirmed = attacker.attackConnected;
  const showMuzzleFlash = shotAge < 2;
  const showSmoke = shotAge < 3;
  const showShell = shotAge < 4;
  const showImpact = hitConfirmed && shotAge < 3;
  const recoilJoltPixels = hitConfirmed ? [4, 3, 2, 0][shotAge] : 0;
  const cameraShakePixels = hitConfirmed
    ? ([[2, -1], [-1, 1], [0, 0], [0, 0]] as const)[shotAge]
    : ([0, 0] as const);
  return {
    active: showMuzzleFlash || showSmoke || showShell || showImpact,
    shotAge,
    showMuzzleFlash,
    showSmoke,
    showShell,
    showImpact,
    muzzleFrame: Math.min(shotAge, 1),
    smokeFrame: Math.min(shotAge, 2),
    shellFrame: Math.min(shotAge, 3),
    impactFrame: Math.min(shotAge, 2),
    recoilJoltPixels,
    cameraShakePixels,
    hitConfirmed,
    visibleShotEvents: 1,
    visibleImpactEvents: showImpact ? 1 : 0
  };
}

