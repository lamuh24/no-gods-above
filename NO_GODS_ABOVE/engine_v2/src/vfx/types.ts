export const VFX_TICKS_PER_SECOND = 60;

export type VfxFacing = -1 | 1;
export type VfxOutcome = "hit" | "block" | "whiff";
export type VfxVisibility = "always" | "on_hit" | "on_block" | "on_whiff";
export type VfxBlendMode = "source-over" | "lighter" | "screen";
export type VfxAnchorMode = "owner_socket" | "impact_point" | "world" | "previous_position";
export type VfxPrimitiveKind = "flash" | "smoke" | "spark" | "ring" | "beam" | "projectile" | "trail" | "debris";

export interface VfxPoint {
  readonly x: number;
  readonly y: number;
}

export interface VfxCameraShakeDefinition {
  readonly startTick: number;
  readonly durationTicks: number;
  readonly amplitude: readonly [number, number];
  readonly frequency: number;
  readonly visibility?: VfxVisibility;
}

export interface VfxLayerDefinition {
  readonly id: string;
  readonly kind: VfxPrimitiveKind;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly count: number;
  readonly visibility: VfxVisibility;
  readonly anchorMode: VfxAnchorMode;
  readonly followAnchor: boolean;
  readonly mirrorWithFacing: boolean;
  readonly offset: readonly [number, number];
  readonly velocity: readonly [number, number];
  readonly gravity: number;
  readonly spread: number;
  readonly size: number;
  readonly length: number;
  readonly width: number;
  readonly rotationDegrees: number;
  readonly color: string;
  readonly secondaryColor: string;
  readonly blend: VfxBlendMode;
  readonly opacity: number;
}

export interface VfxEffectDefinition {
  readonly id: string;
  readonly label: string;
  readonly category: "weapon" | "impact" | "movement" | "projectile" | "system" | "environment";
  readonly description: string;
  readonly durationTicks: number;
  readonly tags: readonly string[];
  readonly layers: readonly VfxLayerDefinition[];
  readonly cameraShake?: VfxCameraShakeDefinition;
  readonly candidateOnly: true;
  readonly deployable: false;
  readonly fighterArtworkBakedIn: false;
}

export interface VfxTriggerOptions {
  readonly anchorId?: string;
  readonly anchor: VfxPoint;
  readonly facing?: VfxFacing;
  readonly outcome?: VfxOutcome;
  readonly seed?: number;
  readonly startTick?: number;
}

export interface VfxInstance {
  readonly instanceId: string;
  readonly effectId: string;
  readonly anchorId: string | null;
  readonly spawnAnchor: VfxPoint;
  readonly facing: VfxFacing;
  readonly outcome: VfxOutcome;
  readonly seed: number;
  readonly startTick: number;
}

export interface VfxPrimitive {
  readonly instanceId: string;
  readonly layerId: string;
  readonly kind: VfxPrimitiveKind;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly size: number;
  readonly length: number;
  readonly width: number;
  readonly alpha: number;
  readonly color: string;
  readonly secondaryColor: string;
  readonly blend: VfxBlendMode;
  readonly renderOrder: number;
}

export interface VfxFrameSample {
  readonly tick: number;
  readonly primitives: readonly VfxPrimitive[];
  readonly cameraShake: readonly [number, number];
  readonly activeInstanceIds: readonly string[];
  readonly checksum: string;
}

export type VfxAnchorMap = Readonly<Record<string, VfxPoint>>;

export const DEFAULT_LAYER: Omit<VfxLayerDefinition, "id" | "kind"> = {
  startTick: 0,
  durationTicks: 1,
  count: 1,
  visibility: "always",
  anchorMode: "world",
  followAnchor: false,
  mirrorWithFacing: true,
  offset: [0, 0],
  velocity: [0, 0],
  gravity: 0,
  spread: 0,
  size: 24,
  length: 28,
  width: 4,
  rotationDegrees: 0,
  color: "#ffffff",
  secondaryColor: "#ffffff",
  blend: "lighter",
  opacity: 1
};

export function defineLayer(
  layer: Pick<VfxLayerDefinition, "id" | "kind"> & Partial<Omit<VfxLayerDefinition, "id" | "kind">>
): VfxLayerDefinition {
  return { ...DEFAULT_LAYER, ...layer };
}
