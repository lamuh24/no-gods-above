import {
  VfxAnchorMap,
  VfxEffectDefinition,
  VfxFrameSample,
  VfxInstance,
  VfxLayerDefinition,
  VfxOutcome,
  VfxPoint,
  VfxPrimitive,
  VfxTriggerOptions,
  VfxVisibility
} from "./types";

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mix32(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function unitRandom(seed: number, channel: number): number {
  return mix32(seed ^ Math.imul(channel + 1, 0x9e3779b1)) / 0x100000000;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function visibilityMatches(visibility: VfxVisibility | undefined, outcome: VfxOutcome): boolean {
  return visibility === undefined || visibility === "always" || visibility === `on_${outcome}`;
}

function alphaEnvelope(kind: VfxPrimitive["kind"], progress: number): number {
  const p = clamp01(progress);
  if (kind === "flash") return Math.pow(1 - p, 1.8);
  if (kind === "smoke") return Math.min(1, p * 5) * Math.pow(1 - p, 1.25);
  if (kind === "projectile") return Math.min(1, p * 8, (1 - p) * 10);
  if (kind === "trail") return Math.min(1, p * 4) * Math.pow(1 - p, 1.1);
  return Math.pow(1 - p, 1.05);
}

function checksumFrame(tick: number, primitives: readonly VfxPrimitive[], shake: readonly [number, number]): string {
  const payload = JSON.stringify({
    tick,
    shake: shake.map(round),
    primitives: primitives.map((primitive) => ({
      i: primitive.instanceId,
      l: primitive.layerId,
      k: primitive.kind,
      x: round(primitive.x),
      y: round(primitive.y),
      r: round(primitive.rotation),
      s: round(primitive.size),
      n: round(primitive.length),
      w: round(primitive.width),
      a: round(primitive.alpha),
      c: primitive.color,
      c2: primitive.secondaryColor,
      b: primitive.blend
    }))
  });
  return hashString(payload).toString(16).padStart(8, "0");
}

function layerParticle(
  instance: VfxInstance,
  layer: VfxLayerDefinition,
  effectAge: number,
  particleIndex: number,
  currentAnchor: VfxPoint
): VfxPrimitive | null {
  const layerAge = effectAge - layer.startTick;
  const maxDelay = Math.min(8, Math.max(0, layer.durationTicks - 2));
  const delay = layer.count === 1 ? 0 : Math.floor((particleIndex / layer.count) * maxDelay);
  const age = layerAge - delay;
  const available = Math.max(1, layer.durationTicks - delay);
  if (age < 0 || age >= available) return null;

  const progress = available <= 1 ? 0 : age / (available - 1);
  const layerSeed = mix32(instance.seed ^ hashString(layer.id) ^ Math.imul(particleIndex + 1, 0x85ebca6b));
  const randomA = unitRandom(layerSeed, 0) - 0.5;
  const randomB = unitRandom(layerSeed, 1) - 0.5;
  const randomC = unitRandom(layerSeed, 2) - 0.5;
  const mirrored = layer.mirrorWithFacing ? instance.facing : 1;
  const baseRotation = layer.rotationDegrees * Math.PI / 180;
  const fanOffset = layer.count === 1 ? 0 : (particleIndex / (layer.count - 1) - 0.5) * layer.spread;
  const unmirroredAngle = baseRotation + (fanOffset + randomA * Math.min(layer.spread, 28)) * Math.PI / 180;
  const angle = mirrored === -1 ? Math.PI - unmirroredAngle : unmirroredAngle;
  const isRadial = layer.kind === "spark" || layer.kind === "debris";
  const speed = Math.hypot(layer.velocity[0], layer.velocity[1]);
  const velocityX = isRadial && layer.spread > 0
    ? Math.cos(angle) * speed * (0.82 + unitRandom(layerSeed, 3) * 0.36)
    : layer.velocity[0] * mirrored + randomA * layer.spread * 0.08;
  const velocityY = isRadial && layer.spread > 0
    ? Math.sin(angle) * speed * (0.82 + unitRandom(layerSeed, 4) * 0.36)
    : layer.velocity[1] + randomB * layer.spread * 0.08;
  const origin = layer.followAnchor ? currentAnchor : instance.spawnAnchor;
  const x = origin.x + layer.offset[0] * mirrored + velocityX * age;
  const y = origin.y + layer.offset[1] + velocityY * age + 0.5 * layer.gravity * age * age;
  const expansion = layer.kind === "ring" ? 0.7 + progress * 2.15 : layer.kind === "smoke" ? 0.55 + progress * 1.7 : 1;
  const pulse = layer.kind === "projectile" ? 1 + Math.sin((age + randomC) * 0.72) * 0.08 : 1;
  const variance = 0.86 + unitRandom(layerSeed, 5) * 0.28;

  return {
    instanceId: instance.instanceId,
    layerId: layer.id,
    kind: layer.kind,
    x: round(x),
    y: round(y),
    rotation: round(isRadial ? angle + progress * randomC * 3 : angle),
    size: round(layer.size * expansion * pulse * variance),
    length: round(layer.length * (layer.kind === "spark" ? 0.55 + (1 - progress) * 0.65 : 1) * variance),
    width: round(layer.width * (layer.kind === "ring" ? 1 - progress * 0.45 : 1) * variance),
    alpha: round(layer.opacity * alphaEnvelope(layer.kind, progress)),
    color: layer.color,
    secondaryColor: layer.secondaryColor,
    blend: layer.blend,
    renderOrder: layer.startTick * 1000 + particleIndex
  };
}

export class VfxEngine {
  private readonly definitions = new Map<string, VfxEffectDefinition>();
  private readonly instances: VfxInstance[] = [];
  private instanceSerial = 0;
  private currentTick = 0;

  constructor(catalog: readonly VfxEffectDefinition[], private readonly sessionSeed = 0x4e474156) {
    for (const effect of catalog) {
      if (this.definitions.has(effect.id)) throw new Error(`Duplicate VFX definition: ${effect.id}`);
      this.definitions.set(effect.id, effect);
    }
  }

  get tick(): number { return this.currentTick; }
  get activeInstances(): readonly VfxInstance[] { return this.instances; }
  get effectIds(): readonly string[] { return [...this.definitions.keys()]; }

  definition(effectId: string): VfxEffectDefinition {
    const definition = this.definitions.get(effectId);
    if (!definition) throw new Error(`Unknown VFX effect: ${effectId}`);
    return definition;
  }

  trigger(effectId: string, options: VfxTriggerOptions): VfxInstance {
    this.definition(effectId);
    const startTick = options.startTick ?? this.currentTick;
    const serial = this.instanceSerial++;
    const instance: VfxInstance = {
      instanceId: `${effectId}:${startTick}:${serial}`,
      effectId,
      anchorId: options.anchorId ?? null,
      spawnAnchor: { x: options.anchor.x, y: options.anchor.y },
      facing: options.facing ?? 1,
      outcome: options.outcome ?? "hit",
      seed: mix32(options.seed ?? (this.sessionSeed ^ hashString(effectId) ^ serial)),
      startTick
    };
    this.instances.push(instance);
    return instance;
  }

  clear(): void {
    this.instances.length = 0;
    this.instanceSerial = 0;
    this.currentTick = 0;
  }

  seek(tick: number): void {
    if (!Number.isFinite(tick) || tick < 0) throw new Error(`Invalid VFX tick: ${tick}`);
    this.currentTick = Math.floor(tick);
  }

  step(ticks = 1): VfxFrameSample {
    if (!Number.isInteger(ticks) || ticks < 0) throw new Error(`VFX step must be a non-negative integer: ${ticks}`);
    this.currentTick += ticks;
    return this.sample();
  }

  sample(anchors: VfxAnchorMap = {}): VfxFrameSample {
    const primitives: VfxPrimitive[] = [];
    const activeInstanceIds: string[] = [];
    let shakeX = 0;
    let shakeY = 0;

    for (const instance of this.instances) {
      const definition = this.definition(instance.effectId);
      const effectAge = this.currentTick - instance.startTick;
      if (effectAge < 0 || effectAge >= definition.durationTicks) continue;
      activeInstanceIds.push(instance.instanceId);
      const currentAnchor = instance.anchorId && anchors[instance.anchorId] ? anchors[instance.anchorId] : instance.spawnAnchor;

      for (const layer of definition.layers) {
        if (!visibilityMatches(layer.visibility, instance.outcome)) continue;
        for (let particleIndex = 0; particleIndex < layer.count; particleIndex += 1) {
          const primitive = layerParticle(instance, layer, effectAge, particleIndex, currentAnchor);
          if (primitive && primitive.alpha > 0) primitives.push(primitive);
        }
      }

      const shake = definition.cameraShake;
      if (shake && visibilityMatches(shake.visibility, instance.outcome)) {
        const shakeAge = effectAge - shake.startTick;
        if (shakeAge >= 0 && shakeAge < shake.durationTicks) {
          const envelope = 1 - shakeAge / Math.max(1, shake.durationTicks);
          const phase = (shakeAge + unitRandom(instance.seed, 71)) * shake.frequency;
          shakeX += Math.sin(phase * 2.13) * shake.amplitude[0] * envelope;
          shakeY += Math.cos(phase * 1.71) * shake.amplitude[1] * envelope;
        }
      }
    }

    primitives.sort((a, b) => a.renderOrder - b.renderOrder || a.layerId.localeCompare(b.layerId));
    const cameraShake = [round(shakeX), round(shakeY)] as const;
    return {
      tick: this.currentTick,
      primitives,
      cameraShake,
      activeInstanceIds,
      checksum: checksumFrame(this.currentTick, primitives, cameraShake)
    };
  }
}
