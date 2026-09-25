import type { MatchState } from '../../core/types';

export const FALLEN_CAPITAL_VIEW = Object.freeze({ width: 1600, height: 900, fov: 28, worldPerSim: .02, pixelsPerSim: 1.3 });
export interface FallenCapitalShot { targetX: number; targetY: number; distance: number; orbitDegrees: number; phase: string; eyeElevation?: number; }
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Stateless framing: replay ticks, pauses and resets produce identical camera transforms. */
export function calculateFallenCapitalCamera(state: MatchState): FallenCapitalShot {
  const { p1, p2 } = state.fighters;
  const left = Math.min(p1.x, p2.x) * .02 - 1.65;
  const right = Math.max(p1.x, p2.x) * .02 + 1.65;
  let top = Math.max(5.8, -Math.min(p1.y, p2.y) * .02 + 4.5);
  // Active projectiles share the combat plane and must remain legible during a juggle.
  for (const projectile of state.projectiles ?? []) top = Math.max(top, -projectile.y * .02 + 1);
  const openPlatform = state.matchConfig.versusRules?.openPlatform;
  const trackingLimit = openPlatform ? Math.max(5.6, openPlatform.right * .02 - 2.5) : 5.6;
  const targetX = clamp((left + right) / 2, -trackingLimit, trackingLimit);
  const targetY = top * .47;
  const halfWidth = Math.max(right - targetX, targetX - left);
  const tangent = Math.tan(FALLEN_CAPITAL_VIEW.fov * Math.PI / 360);
  const distance = Math.max(18.4, halfWidth / (tangent * (16 / 9) * .88), (top + 1.1) / (2 * tangent * .86));
  const shot = state.ultimateInteraction;
  // A restrained four-degree move keeps the fixed plane, both bodies and beam in view.
  const orbitDegrees = shot ? Math.sin(clamp((shot.tick - 66) / 160, 0, 1) * Math.PI * 2) * 4 * shot.facing : 0;
  return { targetX, targetY, distance: distance + (shot ? .7 : 0), orbitDegrees, phase: shot?.phase ?? 'gameplay' };
}
