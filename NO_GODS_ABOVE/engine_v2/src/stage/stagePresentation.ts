import * as THREE from "three";
import { FighterId, FighterState, MatchState } from "../core/types";
import { swahiliStageSpriteSources, SwahiliStageFrameId } from "./spriteSources";
import { stageFrameFor } from "./fighterFrameSelector";
import { StageProductionContract } from "./types";

interface FighterPresentation {
  group: THREE.Group;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  currentFrame: SwahiliStageFrameId | null;
  rootPosition: [number, number, number];
  rootAlignmentError: number;
}

/** Preview-only ceiling on decoded frame size. Authored 1536px sources stay untouched on disk. */
const PREVIEW_TEXTURE_MAX_DIMENSION = 768;
const TEXTURE_LOAD_BATCH = 8;

function downscaleTexture(texture: THREE.Texture, maxDimension: number): THREE.Texture {
  const image = texture.image as HTMLImageElement | undefined;
  const width = image?.naturalWidth ?? image?.width ?? 0;
  const height = image?.naturalHeight ?? image?.height ?? 0;
  if (!image || width <= maxDimension && height <= maxDimension) return texture;
  const scale = maxDimension / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return texture;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  texture.dispose();
  return new THREE.CanvasTexture(canvas);
}

function paintedBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#080a16");
  gradient.addColorStop(0.46, "#171428");
  gradient.addColorStop(0.72, "#35151d");
  gradient.addColorStop(1, "#090910");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(156, 42, 48, 0.2)";
  context.beginPath();
  context.arc(720, 130, 94, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(5, 7, 14, 0.88)";
  for (let index = 0; index < 18; index++) {
    const x = index * 70 - 40;
    const height = 55 + ((index * 37) % 110);
    context.fillRect(x, canvas.height - height, 46, height);
    if (index % 3 === 0) {
      context.beginPath();
      context.moveTo(x - 8, canvas.height - height);
      context.lineTo(x + 23, canvas.height - height - 52);
      context.lineTo(x + 54, canvas.height - height);
      context.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class StagePresentation {
  readonly camera: THREE.PerspectiveCamera;
  readonly ready: Promise<void>;
  private readonly textures = new Map<SwahiliStageFrameId, THREE.Texture>();
  private readonly fighters: Record<FighterId, FighterPresentation>;
  private readonly disposableGeometries = new Set<THREE.BufferGeometry>();
  private readonly disposableMaterials = new Set<THREE.Material>();
  private readonly disposableTextures = new Set<THREE.Texture>();
  private loadError: string | null = null;

  constructor(private readonly scene: THREE.Scene, private readonly contract: StageProductionContract, maxAnisotropy: number) {
    this.camera = new THREE.PerspectiveCamera(contract.camera.fovDegrees, 16 / 9, contract.camera.near, contract.camera.far);
    this.camera.position.fromArray(contract.camera.defaultPosition);
    this.camera.lookAt(...contract.camera.defaultTarget);
    this.buildEnvironment();
    this.fighters = { p1: this.createFighter("p1"), p2: this.createFighter("p2") };
    this.ready = this.loadTextures(Math.min(Number(contract.spriteIntegration.sampling.maxAnisotropy) || 1, maxAnisotropy));
  }

  update(state: MatchState) {
    for (const id of ["p1", "p2"] as const) this.updateFighter(id, state.fighters[id], state);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  getStatus() {
    return {
      contractId: this.contract.id,
      webglBaseline: "WebGL2",
      loadedTextures: this.textures.size,
      expectedTextures: Object.keys(swahiliStageSpriteSources).length,
      loadError: this.loadError,
      idleApproval: "APPROVED_AS_IDLE_FOUNDATION_V1",
      walkApproval: "candidate_video_repair_v2_awaiting_human_review",
      walkCycleComplete: true,
      movementCoverage: "walk_forward_video_repair_v2 + walk_backward_candidate + dash_repair_v2",
      defenseCoverage: "approved standing/crouching block entry + hold",
      systemMotionFallbacks: ["roman_cancel", "burst"],
      hitReactionApproval: "APPROVED_AS_DEFENSE_REACTION_MOTION_V1",
      airborneReactionApproval: "APPROVED_AS_KNOCKDOWN_RECOVERY_MOTION_V1",
      knockdownRecoveryApproval: "APPROVED_AS_KNOCKDOWN_RECOVERY_MOTION_V1",
      renderingAuthoritative: false
    };
  }

  getFighterSnapshots() {
    return Object.fromEntries((["p1", "p2"] as const).map((id) => {
      const view = this.fighters[id];
      return [id, {
        frame: view.currentFrame,
        rootPosition: [...view.rootPosition],
        spritePosition: view.sprite.getWorldPosition(new THREE.Vector3()).toArray(),
        rootAlignmentError: view.rootAlignmentError,
        shadowPosition: view.shadow.position.toArray(),
        shadowXError: Math.abs(view.shadow.position.x - view.rootPosition[0]),
        mirrored: view.group.scale.x < 0,
        throwRotation: THREE.MathUtils.radToDeg(view.sprite.rotation.z)
      }];
    }));
  }

  dispose() {
    for (const geometry of this.disposableGeometries) geometry.dispose();
    for (const material of this.disposableMaterials) material.dispose();
    for (const texture of this.disposableTextures) texture.dispose();
  }

  private trackGeometry<T extends THREE.BufferGeometry>(geometry: T) { this.disposableGeometries.add(geometry); return geometry; }
  private trackMaterial<T extends THREE.Material>(material: T) { this.disposableMaterials.add(material); return material; }

  private buildEnvironment() {
    this.scene.background = new THREE.Color(0x070912);
    this.scene.fog = new THREE.Fog(0x090b14, 22, 56);

    const hemisphere = new THREE.HemisphereLight(0x6f8fc9, 0x170b10, 0.72);
    const key = new THREE.DirectionalLight(0xffd7aa, 2.2);
    key.position.set(6, 10, 8);
    this.scene.add(hemisphere, key);

    const backdropTexture = paintedBackdropTexture();
    this.disposableTextures.add(backdropTexture);
    const backdrop = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(48, 20)),
      this.trackMaterial(new THREE.MeshBasicMaterial({ map: backdropTexture, fog: true, depthWrite: false }))
    );
    backdrop.position.set(0, 7, -16);
    backdrop.renderOrder = -20;
    this.scene.add(backdrop);

    const floor = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(34, 22)),
      this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x121520, roughness: 0.88, metalness: 0.16 }))
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -2);
    this.scene.add(floor);

    const lane = new THREE.Mesh(
      this.trackGeometry(new THREE.PlaneGeometry(16.8, 6.4)),
      this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x25212c, roughness: 0.92, metalness: 0.08, emissive: 0x11070b, emissiveIntensity: 0.45 }))
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.012, 0.25);
    this.scene.add(lane);

    const centerLine = new THREE.Mesh(
      this.trackGeometry(new THREE.BoxGeometry(0.035, 0.018, 6.2)),
      this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x8a3740, transparent: true, opacity: 0.68 }))
    );
    centerLine.position.set(0, 0.03, 0.2);
    this.scene.add(centerLine);

    const pylonGeometry = this.trackGeometry(new THREE.BoxGeometry(0.42, 5.8, 0.72));
    const pylonMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x3b2630, roughness: 0.72, metalness: 0.24, emissive: 0x21070d, emissiveIntensity: 0.32 }));
    for (const x of [this.contract.combatPlane.worldBounds.left, this.contract.combatPlane.worldBounds.right]) {
      const pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
      pylon.position.set(x, 2.9, -0.7);
      this.scene.add(pylon);
      const boundary = new THREE.Mesh(
        this.trackGeometry(new THREE.BoxGeometry(0.055, 0.025, 6.2)),
        this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0xd35a58, transparent: true, opacity: 0.75 }))
      );
      boundary.position.set(x, 0.04, 0.2);
      this.scene.add(boundary);
    }

    const buttressGeometry = this.trackGeometry(new THREE.BoxGeometry(1.1, 6.6, 1.5));
    const buttressMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x171724, roughness: 0.95, metalness: 0.05 }));
    for (const x of [-12, -8, -4, 4, 8, 12]) {
      const buttress = new THREE.Mesh(buttressGeometry, buttressMaterial);
      buttress.position.set(x, 3.3, -7 - Math.abs(x) * 0.05);
      this.scene.add(buttress);
    }

    const hazeMaterial = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x394b70, transparent: true, opacity: 0.08, depthWrite: false, fog: true }));
    for (const [z, y, width] of [[-5.5, 2.3, 32], [-10, 4.2, 42]] as const) {
      const haze = new THREE.Mesh(this.trackGeometry(new THREE.PlaneGeometry(width, 4)), hazeMaterial);
      haze.position.set(0, y, z);
      this.scene.add(haze);
    }

    const foregroundGeometry = this.trackGeometry(new THREE.BoxGeometry(1.4, 9, 1.8));
    const foregroundMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({ color: 0x090a10, roughness: 0.9 }));
    for (const x of [-12.4, 12.4]) {
      const frame = new THREE.Mesh(foregroundGeometry, foregroundMaterial);
      frame.position.set(x, 4.5, 3.2);
      this.scene.add(frame);
    }
  }

  private createFighter(id: FighterId): FighterPresentation {
    const group = new THREE.Group();
    const width = this.contract.spriteIntegration.sourceCanvas.width * this.contract.combatPlane.spritePixelsToWorldUnits;
    const height = this.contract.spriteIntegration.sourceCanvas.height * this.contract.combatPlane.spritePixelsToWorldUnits;
    const material = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: this.contract.spriteIntegration.edgeTreatment.transparent,
      alphaTest: this.contract.spriteIntegration.edgeTreatment.alphaTest,
      depthWrite: this.contract.spriteIntegration.edgeTreatment.depthWrite,
      depthTest: true,
      side: THREE.DoubleSide,
      roughness: 0.92,
      metalness: 0,
      emissive: 0x0d0910,
      emissiveIntensity: 0.32,
      toneMapped: this.contract.spriteIntegration.edgeTreatment.toneMapped
    }));
    const sprite = new THREE.Mesh(this.trackGeometry(new THREE.PlaneGeometry(width, height)), material);
    sprite.renderOrder = id === "p1" ? 21 : 20;
    const shadowMaterial = this.trackMaterial(new THREE.MeshBasicMaterial({ color: 0x020205, transparent: true, opacity: this.contract.spriteIntegration.shadow.maxOpacity, depthWrite: false }));
    const shadow = new THREE.Mesh(this.trackGeometry(new THREE.CircleGeometry(1, 48)), shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    this.scene.add(shadow);
    group.add(sprite);
    this.scene.add(group);
    return { group, sprite, shadow, currentFrame: null, rootPosition: [0, 0, 0], rootAlignmentError: 0 };
  }

  private async loadTextures(anisotropy: number) {
    const loader = new THREE.TextureLoader();
    const entries = Object.entries(swahiliStageSpriteSources) as Array<[SwahiliStageFrameId, string]>;
    try {
      // The full attacker + defender pose set is far larger than the idle-only slice, so frames are
      // decoded in small batches and downscaled to PREVIEW_TEXTURE_MAX_DIMENSION. Source PNGs are
      // untouched; this only bounds debug-harness GPU memory.
      for (let index = 0; index < entries.length; index += TEXTURE_LOAD_BATCH) {
        await Promise.all(entries.slice(index, index + TEXTURE_LOAD_BATCH).map(async ([id, url]) => {
          const loaded = await loader.loadAsync(url).catch((cause) => {
            throw new Error(`stage sprite ${id} failed to load from ${url}: ${cause instanceof Error ? cause.message : String(cause)}`);
          });
          const texture = downscaleTexture(loaded, PREVIEW_TEXTURE_MAX_DIMENSION);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = anisotropy;
          texture.generateMipmaps = true;
          texture.premultiplyAlpha = false;
          texture.needsUpdate = true;
          this.textures.set(id, texture);
          this.disposableTextures.add(texture);
        }));
      }
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  private updateFighter(id: FighterId, fighter: FighterState, state: MatchState) {
    const view = this.fighters[id];
    const frame = stageFrameFor(fighter, state);
    if (frame !== view.currentFrame) {
      view.sprite.material.map = this.textures.get(frame) ?? null;
      view.sprite.material.needsUpdate = true;
      view.currentFrame = frame;
    }
    const simulationScale = this.contract.combatPlane.simulationPixelsToWorldUnits;
    const rootX = fighter.x * simulationScale;
    const rootY = -fighter.y * simulationScale + this.contract.combatPlane.floorY;
    const source = this.contract.spriteIntegration;
    const pixelScale = this.contract.combatPlane.spritePixelsToWorldUnits;
    const centerAboveRoot = (source.sourceRoot.y - source.sourceCanvas.height / 2) * pixelScale;
    const tieBreakZ = id === "p1" ? 0.12 : 0.1;
    view.group.position.set(rootX, rootY + centerAboveRoot, tieBreakZ);
    view.group.scale.set(fighter.facing * this.contract.combatPlane.fighterWorldScale, this.contract.combatPlane.fighterWorldScale, 1);
    view.group.rotation.set(0, Math.atan2(this.camera.position.x - rootX, this.camera.position.z - tieBreakZ), 0);
    view.sprite.rotation.z = THREE.MathUtils.degToRad(fighter.throwRotation);
    view.rootPosition = [rootX, rootY, tieBreakZ];
    view.rootAlignmentError = Math.abs((view.group.position.y - centerAboveRoot) - rootY);

    const jumpHeight = Math.max(0, rootY - this.contract.combatPlane.floorY);
    const shadowScale = Math.max(0.58, 1 - jumpHeight * 0.075);
    view.shadow.position.set(rootX, this.contract.spriteIntegration.shadow.planeY, tieBreakZ - 0.02);
    view.shadow.scale.set(1.55 * shadowScale, 0.58 * shadowScale, 1);
    view.shadow.material.opacity = this.contract.spriteIntegration.shadow.maxOpacity * Math.max(0.2, 1 - jumpHeight * 0.14);
  }
}
