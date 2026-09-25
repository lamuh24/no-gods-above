import type { ThrowDefinition, ThrowTrackPoint } from "../core/types";
const point = (tick: number, victimOffsetX: number): ThrowTrackPoint => ({
  tick, attackerOffsetX: 0, attackerOffsetY: 0, victimOffsetX, victimOffsetY: 0, victimRotation: 0, victimFacing: -1,
});
// Local Swahili playtest draft. One 65-damage headbutt, with a non-damaging hook.
export const SWAHILI_HOOK_HEADBUTT: ThrowDefinition = {
  id: "swahili_hook_headbutt", command: "5S+M", startup: 14, connectTick: 14,
  releaseTick: 32, totalTicks: 54, range: 170, heightTolerance: 24,
  damage: 65, hitstop: 6, knockdownTicks: 0, victimClass: "standard_humanoid",
  track: [point(0,160),point(14,160),point(23,100),point(30,65),point(39,65),point(53,140)],
};
