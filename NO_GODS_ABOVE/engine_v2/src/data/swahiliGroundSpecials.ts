import { AttackDefinition, AttackId, StrikeHitbox } from "../core/types";

export type SwahiliGroundSpecialId = "swahili_paid_seal" | "swahili_paid_super" | "special_neutral_light" | "special_up_light" | "special_neutral_heavy" | "special_back_light" | "special_back_medium" | "special_back_heavy";
export const SWAHILI_GROUND_SPECIAL_IDS: SwahiliGroundSpecialId[] = ["swahili_paid_seal", "swahili_paid_super", "special_neutral_light", "special_up_light", "special_neutral_heavy", "special_back_light", "special_back_medium", "special_back_heavy"];
export function isSwahiliGroundSpecialId(id: AttackId): id is SwahiliGroundSpecialId {
  return SWAHILI_GROUND_SPECIAL_IDS.includes(id as SwahiliGroundSpecialId);
}
function hit(id: string, tick: number, rect: StrikeHitbox["rect"], damage: number, extra: Partial<StrikeHitbox> = {}): StrikeHitbox {
  return { id, start: tick, end: tick + 2, rect, damage, hitstop: 5, hitstun: 26, blockstun: 14,
    knockbackX: 2, knockbackY: 0, maxHits: 1, level: "mid", ...extra };
}
function seal(id: "special_back_light" | "special_back_medium", distance: number, lifeTicks: number): AttackDefinition {
  return { id, command: id === "special_back_light" ? "4S+L" : "4S+M", startup: 30, active: 1, recovery: 29,
    groundOnly: true, hitboxes: [], projectile: { releaseTick: 30, spawnOffset: { x: distance, y: 0 },
      releaseSweepStartX: distance, speed: 0, gravity: 0, maxTravel: 1, lifeTicks, stationaryGroundSeal: true,
      hitbox: hit(id + "_seal", 0, { x: -30, y: -20, w: 60, h: 20 }, id === "special_back_light" ? 35 : 45,
        id === "special_back_light" ? { launches: true, knockbackY: -12, knockbackX: 0, juggleCost: 1 } : { hitstun: 32, knockbackX: 0 }) } };
}
// Opt-in Swahili playtest only. Contract/debt stacks and wall splat are NOT implemented.
export const SWAHILI_GROUND_SPECIALS_V1: Record<SwahiliGroundSpecialId, AttackDefinition> = {
  // Hidden starter prototype: real collision/block/whiff, deliberately no damage or meter tuning.
  swahili_paid_seal: {id:'swahili_paid_seal',command:'Ultimate starter test',startup:18,active:1,recovery:29,groundOnly:true,hitboxes:[],
    projectile:{releaseTick:18,spawnOffset:{x:38,y:-105},releaseSweepStartX:30,speed:9,gravity:0,maxTravel:310,lifeTicks:36,
      hitbox:hit('paid_contract_confirm',0,{x:-16,y:-20,w:32,h:40},0,{hitstop:8,hitstun:32,blockstun:16,knockbackX:0,knockbackY:0,juggleCost:0})}},
  // Playable single-hit super while the longer Paid in Full cinematic remains in production.
  swahili_paid_super: {id:'swahili_paid_super',command:'P · Paid in Full',startup:18,active:1,recovery:29,groundOnly:true,hitboxes:[],
    projectile:{releaseTick:18,spawnOffset:{x:38,y:-105},releaseSweepStartX:30,speed:9,gravity:0,maxTravel:310,lifeTicks:36,
      hitbox:hit('paid_contract_collection',0,{x:-16,y:-20,w:32,h:40},180,
        {hitstop:12,hitstun:0,blockstun:18,knockbackX:8,knockbackY:0,juggleCost:0,knockdown:'hard'})}},
  // Preserve the previous U+Light fallback's single-hit values and phase duration.
  special_neutral_light: { id: "special_neutral_light", command: "5S+L", startup: 3, active: 3, recovery: 7,
    cancel: { onHit: ["standing_medium", "crouching_medium"], onBlock: ["standing_medium", "crouching_medium"] },
    groundOnly: true, hitboxes: [hit("claim_check", 3, { x: 28, y: -78, w: 54, h: 34 }, 30,
      { hitstop: 4, hitstun: 12, blockstun: 8, knockbackX: 2.2 })] },
  special_up_light: { id: "special_up_light", command: "8S+L", startup: 10, active: 48, recovery: 22, groundOnly: true,
    hitboxes: [10, 25, 40, 55].map((tick, index) => hit("ceiling_tax_shot_" + (index + 1), tick,
      { x: 26, y: -80 - index * 55, w: 200, h: 100 + index * 35 }, 18,
      { launches: true, knockbackY: [-12, -14, -16, -20][index], knockbackX: index === 3 ? 3 : 0,
        hitstun: 30, juggleCost: 1, hitstop: 4 })) },
  special_neutral_heavy: { id: "special_neutral_heavy", command: "5S+H", startup: 30, active: 3, recovery: 27,
    groundOnly: true, hitboxes: [hit("golden_injunction_crossfire", 30, { x: 32, y: -140, w: 260, h: 130 }, 95,
      { hitstop: 9, hitstun: 26, knockbackX: 8 })] },
  special_back_light: seal("special_back_light", 85, 240),
  special_back_medium: seal("special_back_medium", 200, 300),
  special_back_heavy: { id: "special_back_heavy", command: "4S+H", startup: 6, active: 30, recovery: 12,
    groundOnly: true, hitboxes: [], strikeCounter: { start: 6, end: 35, response: {
      id: "special_back_heavy", command: "Default Judgment response", startup: 10, active: 33, recovery: 17,
      groundOnly: true, responseStrikeInvulnThrough: 42,
      hitboxes: [hit("default_judgment_pistol", 10, { x: 20, y: -140, w: 210, h: 140 }, 30,
        { knockbackX: 0, hitstun: 40 }),
      hit("default_judgment_scythe", 40, { x: 20, y: -150, w: 210, h: 150 }, 65,
        { knockdown: "hard", knockbackX: 7, hitstop: 9 })] } } }
};
