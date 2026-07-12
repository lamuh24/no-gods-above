import * as THREE from "three";
import { fighterDefinitions } from "../data/fighters";
import { MatchState, Rect } from "../core/types";
import { getThrowDebugGeometry } from "../core/engine";
import { CharacterVisualAdapter } from "./characterVisualAdapter";

const SCALE = 0.02;

interface FighterView { group: THREE.Group; body: THREE.Mesh; face: THREE.Mesh; origin: THREE.Mesh; baseMaterial: THREE.Material; visual: CharacterVisualAdapter | null; }

function material(color: number, opacity = 1) { return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }); }
function worldRect(f: MatchState["fighters"]["p1"], rect: Rect): Rect { const facing = f.phase === "attack" ? f.attackFacing : f.facing; return { x: f.x + rect.x * facing - (facing < 0 ? rect.w : 0), y: f.y + rect.y, w: rect.w, h: rect.h }; }

export class DebugRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private outline: { render(scene: THREE.Scene, camera: THREE.Camera): void };
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 100);
  readonly overlays = { push: true, hurt: true, strike: true, throw: true, anchors: true, origin: true, facing: true, ground: true };
  private readonly fighters: Record<string, FighterView>;
  private readonly overlayGroup = new THREE.Group();
  private readonly overlayGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly overlayPool: THREE.Mesh[] = [];
  private overlayCursor = 0;
  private readonly materials = {
    p1: material(0x7dd3fc), p2: material(0xfca5a5), attack: material(0xfbbf24),
    airLight: material(0x67e8f9), airMedium: material(0xfacc15), airHeavy: material(0xfb7185), face: material(0xffffff),
    throwStartup: material(0xe879f9), throwActive: material(0xd946ef), throwCapture: material(0x8b5cf6),
    throwRelease: material(0xf97316), throwRecovery: material(0xa78bfa), throwWhiff: material(0x64748b),
    throwTeched: material(0x22d3ee), throwVictimCaptured: material(0xc4b5fd), throwVictimReleased: material(0xfdba74),
    origin: material(0xfacc15), ground: material(0x22c55e), boundary: material(0xef4444), spawn: material(0xa78bfa),
    push: material(0x38bdf8, 0.22), hurt: material(0x22c55e, 0.2), strike: material(0xef4444, 0.45), facing: material(0xffffff),
    throwBoxStartup: material(0xe879f9, 0.28), throwBoxActive: material(0xd946ef, 0.52), throwHurt: material(0xc4b5fd, 0.2),
    grabAnchor: material(0x22d3ee), victimAnchor: material(0xf97316), releaseAnchor: material(0xef4444), cameraAnchor: material(0xffffff), pairing: material(0xa855f7)
  };

  constructor(private host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.outline = this.renderer;
    import("three/examples/jsm/effects/OutlineEffect.js").then(({ OutlineEffect }) => {
      this.outline = new OutlineEffect(this.renderer, { defaultThickness: 0.004, defaultColor: [0.02, 0.02, 0.03] });
    });
    this.renderer.setSize(host.clientWidth || 960, host.clientHeight || 540);
    this.renderer.setClearColor(0x111827);
    host.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 10);
    this.scene.add(new THREE.HemisphereLight(0xf3fbff, 0x272033, 2.2));
    const rim = new THREE.DirectionalLight(0x60e6d7, 2.4); rim.position.set(-2, 4, 4); this.scene.add(rim);
    this.scene.add(new THREE.GridHelper(20, 20, 0x334155, 0x1f2937).rotateX(Math.PI / 2));
    this.scene.add(this.overlayGroup);
    this.fighters = { p1: this.createFighter(this.materials.p1, true), p2: this.createFighter(this.materials.p2, false) };
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  resize() {
    const w = this.host.clientWidth || 960, h = this.host.clientHeight || 540;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.left = -8 * aspect; this.camera.right = 8 * aspect; this.camera.top = 4.5; this.camera.bottom = -4.5;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    const geometries = new Set<THREE.BufferGeometry>();
    this.scene.traverse((object) => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
    for (const geometry of geometries) geometry.dispose();
    for (const value of Object.values(this.materials)) value.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  render(state: MatchState) {
    this.updateCamera(state);
    for (const id of ["p1", "p2"] as const) this.updateFighter(this.fighters[id], state.fighters[id]);
    this.drawOverlays(state);
    this.outline.render(this.scene, this.camera);
  }

  getResourceSnapshot() { return { geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, pooledOverlays: this.overlayPool.length }; }
  getCharacterVisualStatus() { return this.fighters.p1.visual?.status ?? null; }

  private createFighter(baseMaterial: THREE.Material, useLamuhModel: boolean): FighterView {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.25, 4, 8), baseMaterial);
    body.position.y = 0.75;
    const face = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 3), this.materials.face);
    face.position.set(0.35, 1.15, 0.05); face.rotation.z = -Math.PI / 2;
    const origin = new THREE.Mesh(new THREE.SphereGeometry(0.08), this.materials.origin);
    let visual: CharacterVisualAdapter | null = null;
    if (useLamuhModel) {
      visual = new CharacterVisualAdapter(() => { body.visible = false; face.visible = false; });
      group.add(visual.container);
    }
    group.add(body, face, origin); this.scene.add(group);
    return { group, body, face, origin, baseMaterial, visual };
  }

  private updateFighter(view: FighterView, f: MatchState["fighters"]["p1"]) {
    view.group.position.set(f.x * SCALE, -f.y * SCALE, 0);
    view.group.scale.set(f.facing, f.phase === "crouch" || f.crouchBlocking ? 0.75 : 1, 1);
    view.visual?.update(f);
    view.body.rotation.z = 0;
    view.body.scale.set(1, 1, 1);
    view.body.material = f.phase === "attack" ? this.materials.attack : view.baseMaterial;
    if (f.phase === "attack" && f.currentAttack === "air_light") {
      view.body.material = this.materials.airLight; view.body.rotation.z = -0.22; view.body.scale.set(0.9, 1, 1);
    } else if (f.phase === "attack" && f.currentAttack === "air_medium") {
      view.body.material = this.materials.airMedium; view.body.rotation.z = -0.42; view.body.scale.set(1.15, 0.95, 1);
    } else if (f.phase === "attack" && f.currentAttack === "air_heavy") {
      view.body.material = this.materials.airHeavy; view.body.rotation.z = -0.7; view.body.scale.set(1.25, 0.9, 1);
    }
    if (f.phase === "throw_startup") view.body.material = this.materials.throwStartup;
    else if (f.phase === "throw_active") view.body.material = this.materials.throwActive;
    else if (f.phase === "throw_capture") view.body.material = this.materials.throwCapture;
    else if (f.phase === "throw_release") view.body.material = this.materials.throwRelease;
    else if (f.phase === "throw_recovery") view.body.material = this.materials.throwRecovery;
    else if (f.phase === "throw_whiff") view.body.material = this.materials.throwWhiff;
    else if (f.phase === "throw_teched") view.body.material = this.materials.throwTeched;
    else if (f.phase === "throw_victim_captured") view.body.material = this.materials.throwVictimCaptured;
    else if (f.phase === "throw_victim_released") view.body.material = this.materials.throwVictimReleased;
  }

  private updateCamera(state: MatchState) {
    const p1 = state.fighters.p1.x * SCALE, p2 = state.fighters.p2.x * SCALE;
    const center = (p1 + p2) / 2;
    const halfWidth = (this.camera.right - this.camera.left) / 2;
    const min = state.stage.left * SCALE + halfWidth, max = state.stage.right * SCALE - halfWidth;
    this.camera.position.x = min <= max ? Math.max(min, Math.min(max, center)) : (state.stage.left + state.stage.right) * SCALE / 2;
  }

  private acquire(mat: THREE.Material) {
    let mesh = this.overlayPool[this.overlayCursor];
    if (!mesh) { mesh = new THREE.Mesh(this.overlayGeometry, mat); this.overlayPool.push(mesh); this.overlayGroup.add(mesh); }
    mesh.material = mat; mesh.visible = true; this.overlayCursor++;
    return mesh;
  }

  private placeRect(rect: Rect, mat: THREE.Material, z = 0.2) {
    const mesh = this.acquire(mat);
    mesh.position.set((rect.x + rect.w / 2) * SCALE, (-rect.y - rect.h / 2) * SCALE, z);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(rect.w * SCALE, rect.h * SCALE, 0.05);
  }

  private placePoint(x: number, y: number, size: number, mat: THREE.Material, z = 0.32) {
    this.placeRect({ x: x - size / 2, y: y - size / 2, w: size, h: size }, mat, z);
  }

  private placeSegment(fromX: number, fromY: number, toX: number, toY: number, width: number, mat: THREE.Material, z = 0.28) {
    const dx = (toX - fromX) * SCALE, dy = -(toY - fromY) * SCALE;
    const mesh = this.acquire(mat);
    mesh.position.set((fromX + toX) * SCALE / 2, -(fromY + toY) * SCALE / 2, z);
    mesh.rotation.set(0, 0, Math.atan2(dy, dx));
    mesh.scale.set(Math.max(Math.hypot(dx, dy), 0.02), width * SCALE, 0.05);
  }

  private placeLine(x: number, y: number, w: number, h: number, mat: THREE.Material, z = -0.01) { this.placeRect({ x, y: -y - h, w, h }, mat, z); }

  private drawOverlays(state: MatchState) {
    this.overlayCursor = 0;
    if (this.overlays.ground) {
      this.placeLine(state.stage.left, 0, state.stage.right - state.stage.left, 2, this.materials.ground, -0.02);
      this.placeLine(state.stage.left, -state.stage.ceilingY, state.stage.right - state.stage.left, 1, this.materials.boundary, -0.02);
      for (const x of [state.stage.left, state.stage.right, -76, 76]) this.placeLine(x - 1, 0, 2, 100, x === -76 || x === 76 ? this.materials.spawn : this.materials.boundary);
    }
    for (const id of ["p1", "p2"] as const) {
      const f = state.fighters[id], fighter = fighterDefinitions[f.kind];
      if (this.overlays.push) this.placeRect(worldRect(f, fighter.pushbox), this.materials.push);
      if (this.overlays.hurt) for (const hurt of (f.phase === "crouch" || f.crouchBlocking ? fighter.crouchingHurtboxes : fighter.standingHurtboxes)) this.placeRect(worldRect(f, hurt), this.materials.hurt);
      if (this.overlays.origin) this.placeRect({ x: f.x - 4, y: f.y - 4, w: 8, h: 8 }, this.materials.origin, 0.1);
      if (this.overlays.facing) this.placeRect({ x: f.x + (f.facing > 0 ? 0 : -30), y: f.y - 100, w: 30, h: 3 }, this.materials.facing, 0.1);
      if (this.overlays.strike && f.phase === "attack" && f.currentAttack) {
        const attack = fighter.attacks[f.currentAttack];
        for (const hitbox of attack.hitboxes) if (f.phaseTick >= hitbox.start && f.phaseTick <= hitbox.end) this.placeRect(worldRect(f, hitbox.rect), this.materials.strike);
      }
    }
    for (const id of ["p1", "p2"] as const) {
      const f = state.fighters[id], geometry = getThrowDebugGeometry(state, id);
      if (!geometry || geometry.role !== "attacker") continue;
      if (this.overlays.throw) {
        if (geometry.throwHurtbox) this.placeRect(geometry.throwHurtbox, this.materials.throwHurt, 0.22);
        if (geometry.throwBox) this.placeRect(geometry.throwBox, geometry.captureWindowActive ? this.materials.throwBoxActive : this.materials.throwBoxStartup, 0.26);
        const partner = f.throwPartner ? state.fighters[f.throwPartner] : null;
        if (partner) this.placeSegment(f.x, f.y - 48, partner.x, partner.y - 48, 5, this.materials.pairing);
      }
      if (this.overlays.anchors) {
        if (geometry.victimAnchor) this.placePoint(geometry.victimAnchor.x, geometry.victimAnchor.y, 15, this.materials.victimAnchor);
        this.placePoint(geometry.grabAnchor.x, geometry.grabAnchor.y, 9, this.materials.grabAnchor, 0.34);
        this.placePoint(geometry.releaseAnchor.x, geometry.releaseAnchor.y, 12, this.materials.releaseAnchor);
        if (geometry.cameraTarget) this.placePoint(geometry.cameraTarget.x, geometry.cameraTarget.y, 5, this.materials.cameraAnchor, 0.36);
      }
    }
    for (let index = this.overlayCursor; index < this.overlayPool.length; index++) this.overlayPool[index].visible = false;
  }
}
