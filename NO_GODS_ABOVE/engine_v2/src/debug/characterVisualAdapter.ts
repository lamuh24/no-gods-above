import * as THREE from "three";
import { FighterState } from "../core/types";

const PRESENTATION_FPS = 15;

export interface CharacterVisualStatus {
  assetId: string;
  ready: boolean;
  currentClip: string;
  sampledFrame: number;
  error: string | null;
}

export function selectCharacterClip(fighter: FighterState): string {
  if (fighter.phase === "attack" && fighter.currentAttack) return fighter.currentAttack;
  if (fighter.phase === "throw_whiff") return "forward_throw_whiff";
  if (fighter.phase === "throw_teched") return fighter.id === "p1" ? "throw_tech_attacker" : "throw_tech_victim";
  if (["throw_startup", "throw_active", "throw_capture", "throw_release", "throw_recovery"].includes(fighter.phase)) return "forward_throw_attacker";
  if (fighter.phase === "block") return fighter.crouchBlocking ? "crouching_block" : "standing_block";
  if (fighter.phase === "hit_reaction") return fighter.hitstun >= 18 ? "heavy_hit" : "light_hit";
  if (fighter.phase === "jump") return "jump_air";
  if (fighter.phase === "dash") return "dash_forward";
  if (fighter.phase === "getup") return "get_up";
  return fighter.phase;
}

function toonify(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    object.material = source.map((item) => {
      const standard = item as THREE.MeshStandardMaterial;
      return new THREE.MeshToonMaterial({ name: `${standard.name}_toon`, color: standard.color?.clone() ?? new THREE.Color(0xffffff), emissive: standard.emissive?.clone() ?? new THREE.Color(0) });
    });
    object.castShadow = false;
    object.receiveShadow = false;
  });
}

export class CharacterVisualAdapter {
  readonly container = new THREE.Group();
  readonly status: CharacterVisualStatus = { assetId: "lamuh_prototype_v0", ready: false, currentClip: "loading", sampledFrame: 0, error: null };
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<string, THREE.AnimationAction>();
  private activeAction: THREE.AnimationAction | null = null;
  private activeClip = "";

  constructor(onReady?: () => void) {
    this.container.name = "lamuh_prototype_v0_visual";
    import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader().load("/models/lamuh_prototype_v0.glb", (gltf) => {
      toonify(gltf.scene);
      this.container.add(gltf.scene);
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));
      this.status.ready = true;
      this.status.currentClip = "idle";
      onReady?.();
    }, undefined, (error) => {
      this.status.error = error instanceof Error ? error.message : String(error);
      this.status.currentClip = "fallback_capsule";
    })).catch((error) => {
      this.status.error = error instanceof Error ? error.message : String(error);
      this.status.currentClip = "fallback_capsule";
    });
  }

  update(fighter: FighterState) {
    if (!this.mixer) return;
    const clipName = selectCharacterClip(fighter);
    const action = this.actions.get(clipName) ?? this.actions.get("idle");
    if (!action) return;
    if (this.activeAction !== action) {
      this.activeAction?.stop();
      action.reset().play();
      action.paused = true;
      this.activeAction = action;
      this.activeClip = clipName;
    }
    const duration = action.getClip().duration;
    const rawTime = fighter.phaseTick / 60;
    const sampledFrame = Math.floor(rawTime * PRESENTATION_FPS);
    action.time = duration > 0 ? (sampledFrame / PRESENTATION_FPS) % duration : 0;
    this.mixer.update(0);
    this.status.currentClip = this.activeClip;
    this.status.sampledFrame = sampledFrame;
  }
}
