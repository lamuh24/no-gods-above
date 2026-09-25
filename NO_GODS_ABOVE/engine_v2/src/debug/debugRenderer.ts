import * as THREE from "three";
import { fighterDefinitions } from "../data/fighters";
import { FighterId, MatchState, Rect } from "../core/types";
import { StageCameraRig } from "../stage/cameraRig";
import { stageVerticalSliceContract } from "../stage/stageContract";
import { StagePresentation } from "../stage/stagePresentation";
import { CinematicContext } from "../stage/types";

const SCALE = stageVerticalSliceContract.combatPlane.simulationPixelsToWorldUnits;

function material(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false, depthTest: false });
}

function worldRect(fighter: MatchState["fighters"]["p1"], rect: Rect): Rect {
  const facing = fighter.phase === "attack" ? fighter.attackFacing : fighter.facing;
  return { x: fighter.x + rect.x * facing - (facing < 0 ? rect.w : 0), y: fighter.y + rect.y, w: rect.w, h: rect.h };
}

export class DebugRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly overlays = { push: true, hurt: true, strike: true, origin: true, facing: true, ground: true };
  readonly stageContract = stageVerticalSliceContract;
  private readonly stage: StagePresentation;
  private readonly cameraRig = new StageCameraRig(stageVerticalSliceContract);
  private readonly overlayGroup = new THREE.Group();
  private readonly overlayGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly overlayPool: THREE.Mesh[] = [];
  private readonly hostResizeObserver: ResizeObserver | null;
  private overlayCursor = 0;
  private aspect = 16 / 9;
  private readonly materials = {
    origin: material(0xfacc15), ground: material(0x22c55e), boundary: material(0xef4444), spawn: material(0xa78bfa),
    push: material(0x38bdf8, 0.22), hurt: material(0x22c55e, 0.2), strike: material(0xef4444, 0.45), facing: material(0xffffff)
  };

  constructor(private host: HTMLElement) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { antialias: true, alpha: false, preserveDrawingBuffer: true });
    if (!context) throw new Error("NGA Stage Vertical Slice requires a WebGL2 context");
    this.renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x070912);
    host.appendChild(this.renderer.domElement);
    this.stage = new StagePresentation(this.scene, stageVerticalSliceContract, this.renderer.capabilities.getMaxAnisotropy());
    this.camera = this.stage.camera;
    this.overlayGroup.renderOrder = 80;
    this.scene.add(this.overlayGroup);
    window.addEventListener("resize", () => this.resize());
    this.hostResizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => this.resize());
    this.hostResizeObserver?.observe(host);
    this.resize();
  }

  resize() {
    const width = this.host.clientWidth || 960;
    const height = this.host.clientHeight || 540;
    this.aspect = width / Math.max(1, height);
    this.renderer.setSize(width, height, false);
    this.stage.resize(width, height);
  }

  dispose() {
    this.hostResizeObserver?.disconnect();
    this.stage.dispose();
    this.overlayGeometry.dispose();
    for (const value of Object.values(this.materials)) value.dispose();
    this.renderer.dispose();
    this.host.replaceChildren();
  }

  render(state: MatchState) {
    const pose = this.cameraRig.update(state, this.aspect);
    this.camera.position.fromArray(pose.position);
    this.camera.lookAt(...pose.target);
    this.stage.update(state);
    this.drawOverlays(state);
    this.renderer.render(this.scene, this.camera);
  }

  whenReady() { return this.stage.ready; }
  startCinematic(context: CinematicContext, attackerId: FighterId, state: MatchState, moveAuthoredDurationTicks?: number) { this.cameraRig.startCinematic(context, attackerId, state, this.aspect, moveAuthoredDurationTicks); }
  abortCinematic(state: MatchState, rollback = false) { this.cameraRig.abort(state, rollback, this.aspect); }
  snapCamera(state: MatchState) { return this.cameraRig.snapToGameplay(state, this.aspect); }
  getCameraSnapshot() { return this.cameraRig.snapshot(); }
  getStageStatus() { return this.stage.getStatus(); }
  getFighterPresentationSnapshots() { return this.stage.getFighterSnapshots(); }
  projectWorldToNdc(point: [number, number, number]) { return new THREE.Vector3(...point).project(this.camera).toArray(); }
  getResourceSnapshot() {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      pooledOverlays: this.overlayPool.length,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      webgl2: this.renderer.capabilities.isWebGL2,
      stage: this.stage.getStatus(),
      camera: this.cameraRig.snapshot()
    };
  }

  private acquire(mat: THREE.Material) {
    let mesh = this.overlayPool[this.overlayCursor];
    if (!mesh) {
      mesh = new THREE.Mesh(this.overlayGeometry, mat);
      mesh.renderOrder = 80;
      this.overlayPool.push(mesh);
      this.overlayGroup.add(mesh);
    }
    mesh.material = mat;
    mesh.visible = true;
    this.overlayCursor++;
    return mesh;
  }

  private placeRect(rect: Rect, mat: THREE.Material, z = 0.4) {
    const mesh = this.acquire(mat);
    mesh.position.set((rect.x + rect.w / 2) * SCALE, (-rect.y - rect.h / 2) * SCALE, z);
    mesh.scale.set(rect.w * SCALE, rect.h * SCALE, 0.04);
  }

  private drawOverlays(state: MatchState) {
    this.overlayCursor = 0;
    if (this.overlays.ground) {
      this.placeRect({ x: state.stage.left, y: -2, w: state.stage.right - state.stage.left, h: 2 }, this.materials.ground, 0.32);
      this.placeRect({ x: state.stage.left, y: state.stage.ceilingY, w: state.stage.right - state.stage.left, h: 1 }, this.materials.boundary, 0.32);
      for (const x of [state.stage.left, state.stage.right]) this.placeRect({ x: x - 1, y: state.stage.ceilingY, w: 2, h: -state.stage.ceilingY }, this.materials.boundary, 0.34);
      for (const x of [-76, 76]) this.placeRect({ x: x - 1, y: -72, w: 2, h: 72 }, this.materials.spawn, 0.33);
    }
    for (const id of ["p1", "p2"] as const) {
      const fighterState = state.fighters[id];
      const fighter = fighterDefinitions[fighterState.kind];
      if (this.overlays.push) this.placeRect(worldRect(fighterState, fighter.pushbox), this.materials.push);
      if (this.overlays.hurt) {
        const hurtboxes = fighterState.phase === "crouch" || fighterState.crouchBlocking ? fighter.crouchingHurtboxes : fighter.standingHurtboxes;
        for (const hurt of hurtboxes) this.placeRect(worldRect(fighterState, hurt), this.materials.hurt);
      }
      if (this.overlays.origin) this.placeRect({ x: fighterState.x - 4, y: fighterState.y - 4, w: 8, h: 8 }, this.materials.origin, 0.5);
      if (this.overlays.facing) this.placeRect({ x: fighterState.x + (fighterState.facing > 0 ? 0 : -30), y: fighterState.y - 100, w: 30, h: 3 }, this.materials.facing, 0.5);
      if (this.overlays.strike && fighterState.phase === "attack" && fighterState.currentAttack) {
        const attack = fighter.attacks[fighterState.currentAttack];
        for (const hitbox of attack.hitboxes) {
          if (fighterState.phaseTick >= hitbox.start && fighterState.phaseTick <= hitbox.end) this.placeRect(worldRect(fighterState, hitbox.rect), this.materials.strike, 0.55);
        }
      }
    }
    for (let index = this.overlayCursor; index < this.overlayPool.length; index++) this.overlayPool[index].visible = false;
  }
}
