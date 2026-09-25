// Local visual calibration against movement-v2/idle-00, not combat geometry.
// Keep every air-normal sequence at one scale: tucked poses and extended limbs
// must not be independently height-normalized. Replaces the Heavy-only .92 pass.
export function lamuhBodyScale(source: string): number {
  if (/^\/lamuh-legacy-v2\/air-normals-v2\/air-(light|medium|heavy)\/air-\1-\d{2}\.png(?:\?.*)?$/.test(source)) return .84;
  // Heavy-only uppercut and dive camera calibration. Embedded aura stays attached;
  // shared idle/landing endpoints and the Light/Medium special art stay untouched.
  if (/^\/lamuh-legacy-v2\/(?:heaven-heavy-v2\/heavy-(?:windup|release)-\d{2}|heaven-heavy-aura-redraw-v4\/release-\d{2}|radiant-dive-v1\/heavy-0[0-3])\.png(?:\?.*)?$/.test(source)) return .90;
  return 1;
}
