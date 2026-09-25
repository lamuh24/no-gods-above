import { AIR_NORMALS_PLAYTEST_V1, airNormalIsActive } from "./airNormalsPlaytestV1";
import type { SandboxFighterState } from "./types";

export const AIR_LIGHT_CONTACT_PRESENTATION_V1 = {
  record: "SWAHILI_AIR_LIGHT_COMPACT_BOOT_PRESENTATION_V2",
  status: "candidate-only",
  deployable: false,
  approval: "awaiting_human_air_light_compact_boot_motion_review",
  bodyArtworkComplete: true,
  detachedContactRead: false,
  contactStyle: "compact_leading_boot_body_contact_with_separate_hit_spark",
  renderingMayAffectGameplay: false
} as const;

export interface AirLightContactPresentationSample {
  readonly active: boolean;
  readonly activeAge: number | null;
  readonly showContactArc: boolean;
  readonly showImpact: boolean;
  readonly hitConfirmed: boolean;
}

export function airLightContactPresentationSample(attacker: SandboxFighterState): AirLightContactPresentationSample {
  const definition = AIR_NORMALS_PLAYTEST_V1.air_light;
  if (attacker.state !== definition.state || attacker.moveCursor === null || !airNormalIsActive(definition, attacker.moveCursor)) {
    return { active: false, activeAge: null, showContactArc: false, showImpact: false, hitConfirmed: false };
  }
  const activeAge = attacker.moveCursor - definition.startupTicks;
  const hitConfirmed = attacker.airNormalConnectedHitOrdinals.includes(1);
  return { active: true, activeAge, showContactArc: false, showImpact: hitConfirmed && activeAge < 3, hitConfirmed };
}
