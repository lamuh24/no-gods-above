import { SWAHILI_METRICS, drawScaleFor, rootFor } from './roster';
export { default as swahiliSpriteScale } from './swahiliSpriteScale.json';

export interface SwahiliClipGeometry {
  bodyScale: number;
  referenceCanvasWidth?: number;
  /** Root in the common 1536px reference space, independent of export size. */
  root: { x: number; y: number };
}

/** Convert each export resolution to Swahili's common authored coordinate space.
 * Body size is fixed by idle. Pose/weapon alpha bounds must never set scale.
 */
export function swahiliSpriteGeometry(sourceWidth: number, sourceHeight: number, clip?: SwahiliClipGeometry) {
  if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Swahili sprite dimensions must be positive finite numbers');
  }
  const scale = drawScaleFor(SWAHILI_METRICS) * (clip?.bodyScale ?? 1);
  const sourceToReference = (clip?.referenceCanvasWidth ?? SWAHILI_METRICS.canvas.width) / sourceWidth;
  const root = clip?.root ?? rootFor(SWAHILI_METRICS);
  return {
    sourceToReference,
    width: Math.round(sourceWidth * sourceToReference * scale),
    height: Math.round(sourceHeight * sourceToReference * scale),
    rootX: root.x * scale,
    rootY: root.y * scale,
  };
}
