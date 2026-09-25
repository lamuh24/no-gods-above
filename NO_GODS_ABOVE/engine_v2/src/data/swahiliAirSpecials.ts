import { AttackDefinition, AttackId, StrikeHitbox, SwahiliAirSpecialId } from "../core/types";

// Review-only gameplay contracts. Deliberately NOT merged into fighterDefinitions:
// the existing arena and its approved/default data remain untouched until promotion.
export const SWAHILI_AIR_SPECIAL_IDS: SwahiliAirSpecialId[] = ["special_air_light", "special_air_medium", "special_air_heavy"];
export function isSwahiliAirSpecialId(id: AttackId): id is SwahiliAirSpecialId {
  return SWAHILI_AIR_SPECIAL_IDS.includes(id as SwahiliAirSpecialId);
}
function contact(id: string, start: number, end: number, rect: StrikeHitbox["rect"], damage: number,
  hitstop: number, hitstun: number, blockstun: number, knockbackX: number, knockbackY: number,
  extra: Partial<StrikeHitbox> = {}): StrikeHitbox {
  return { id, start, end, rect, damage, hitstop, hitstun, blockstun, knockbackX, knockbackY,
    maxHits: 1, level: "mid", ...extra };
}
export const SWAHILI_AIR_SPECIALS_V1: Record<SwahiliAirSpecialId, AttackDefinition> = {
  special_air_light: {
    id: "special_air_light", command: "j.S+L", startup: 7, active: 3, recovery: 12, airOnly: true, airActionCost: 1,
    // A short instantaneous downward contract-bullet lane, not a traveling/fullscreen projectile.
    hitboxes: [contact("air_contract_confirm", 7, 9, { x: 28, y: -30, w: 94, h: 80 }, 34, 4, 16, 9, 3, -2, { blockHitstop: 3, juggleCost: 1 })]
  },
  special_air_medium: {
    id: "special_air_medium", command: "j.S+M", startup: 10, active: 13, recovery: 16, airOnly: true, airActionCost: 2,
    // Distinct ledgers and seven inactive ticks separate the hook from the pull-through.
    // The first contact pulls through velocity only; there is no target tether or teleport.
    hitboxes: [
      contact("air_scythe_hook", 10, 12, { x: 28, y: -76, w: 96, h: 102 }, 26, 5, 18, 13, -1.6, -2.5, { blockHitstop: 4, juggleCost: 1 }),
      contact("air_scythe_pull_through", 20, 22, { x: 24, y: -88, w: 114, h: 114 }, 38, 7, 18, 12, 5.6, -4, { blockHitstop: 5, juggleCost: 2 })
    ]
  },
  special_air_heavy: {
    id: "special_air_heavy", command: "j.S+H", startup: 12, active: 5, recovery: 20, airOnly: true, airActionCost: 2,
    // Gravity/inherited horizontal movement remain ordinary outside these five strike ticks.
    airDescent: { start: 12, end: 16, minimumVelocityY: 6, maximumVelocityY: 12 },
    hitboxes: [contact("air_scythe_foreclosure", 12, 16, { x: 24, y: -74, w: 108, h: 108 }, 78, 8, 0, 15, 6.5, 9,
      { blockHitstop: 6, juggleCost: 3, knockdown: "hard" })]
  }
};
