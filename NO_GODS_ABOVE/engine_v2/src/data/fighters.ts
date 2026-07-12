import { AttackDefinition, FighterDefinition, MovementTuning } from "../core/types";

const move: MovementTuning = { walkForward: 5.4, walkBackward: 3.8, dashSpeed: 13, dashDuration: 12, backdashSpeed: -10, backdashDuration: 14, jumpStartup: 4, jumpVelocity: -18, forwardJumpVelocityX: 6.2, backJumpVelocityX: -5.1, airControl: 1.4, gravity: 1.05, landingRecovery: 5, inputBuffer: 18, wakeupInvuln: 18, comboNeutralTimeout: 12 };
function hit(id: string, start: number, end: number, rect: any, damage: number, hitstop: number, hitstun: number, blockstun: number, kx: number, ky: number, level: any, extra = {}) { return { id, start, end, rect, damage, hitstop, hitstun, blockstun, knockbackX: kx, knockbackY: ky, maxHits: 1, level, ...extra }; }
const attacks: Record<string, AttackDefinition> = {
  standing_light: { id: "standing_light", command: "5L", startup: 3, active: 3, recovery: 7, cancel: { onHit: ["standing_medium", "crouching_medium"], onBlock: ["standing_medium", "crouching_medium"] }, groundOnly: true, hitboxes: [hit("5l", 3, 5, { x: 28, y: -78, w: 54, h: 34 }, 30, 4, 12, 8, 2.2, 0, "mid")] },
  standing_medium: { id: "standing_medium", command: "5M", startup: 5, active: 4, recovery: 11, cancel: { onHit: ["standing_heavy"], onBlock: ["standing_heavy"] }, groundOnly: true, hitboxes: [hit("5m", 5, 8, { x: 34, y: -86, w: 76, h: 40 }, 55, 5, 16, 10, 3, 0, "mid")] },
  standing_heavy: { id: "standing_heavy", command: "5H", startup: 8, active: 5, recovery: 17, groundOnly: true, hitboxes: [hit("5h", 8, 12, { x: 42, y: -94, w: 92, h: 50 }, 85, 7, 22, 14, 5, 0, "mid", { knockdown: "soft" })] },
  crouching_light: { id: "crouching_light", command: "2L", startup: 4, active: 3, recovery: 8, cancel: { onHit: ["crouching_medium"], onBlock: ["crouching_medium"] }, groundOnly: true, hitboxes: [hit("2l", 4, 6, { x: 24, y: -38, w: 58, h: 28 }, 25, 3, 11, 7, 2, 0, "low")] },
  crouching_medium: { id: "crouching_medium", command: "2M", startup: 6, active: 4, recovery: 13, cancel: { onHit: ["crouching_heavy"], onBlock: ["crouching_heavy"] }, groundOnly: true, hitboxes: [hit("2m", 6, 9, { x: 28, y: -42, w: 96, h: 30 }, 50, 5, 15, 10, 3, 0, "low")] },
  crouching_heavy: { id: "crouching_heavy", command: "2H", startup: 9, active: 5, recovery: 19, groundOnly: true, hitboxes: [hit("2h", 9, 13, { x: 26, y: -112, w: 88, h: 110 }, 80, 7, 28, 15, 4, -16, "launcher", { launches: true, jumpCancelOnHit: true })] },
  air_light: { id: "air_light", command: "j.J", startup: 3, active: 3, recovery: 7, cancel: { onHit: ["air_medium", "air_heavy"], onBlock: ["air_medium", "air_heavy"] }, airOnly: true, hitboxes: [hit("jj", 3, 5, { x: 20, y: -78, w: 64, h: 30 }, 25, 3, 13, 7, 1.5, -1.5, "mid")] },
  air_medium: { id: "air_medium", command: "j.K", startup: 5, active: 4, recovery: 10, cancel: { onHit: ["air_heavy"], onBlock: ["air_heavy"] }, airOnly: true, hitboxes: [hit("jk", 5, 8, { x: 26, y: -70, w: 72, h: 42 }, 45, 4, 16, 9, 2.8, -5, "mid")] },
  air_heavy: { id: "air_heavy", command: "j.L", startup: 6, active: 6, recovery: 14, airOnly: true, hitboxes: [hit("jl", 6, 11, { x: 22, y: -82, w: 78, h: 58 }, 70, 6, 18, 12, 5, 8, "mid", { knockdown: "soft" })] }
};
export const fighterDefinitions: Record<string, FighterDefinition> = {
  lamuh_proto: { kind: "lamuh_proto", maxHealth: 1000, movement: move, pushbox: { x: -22, y: -96, w: 44, h: 96 }, standingHurtboxes: [{ x: -24, y: -96, w: 48, h: 46 }, { x: -20, y: -52, w: 40, h: 52 }], crouchingHurtboxes: [{ x: -25, y: -66, w: 50, h: 66 }], attacks: attacks as any },
  training_dummy: { kind: "training_dummy", maxHealth: 1000, movement: { ...move, walkForward: 0, walkBackward: 0 }, pushbox: { x: -23, y: -98, w: 46, h: 98 }, standingHurtboxes: [{ x: -25, y: -98, w: 50, h: 48 }, { x: -21, y: -54, w: 42, h: 54 }], crouchingHurtboxes: [{ x: -25, y: -68, w: 50, h: 68 }], attacks: attacks as any }
};
export const defaultTuning = { lamuh_proto: move, attacks };
