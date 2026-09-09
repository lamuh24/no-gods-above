import * as THREE from 'three';
import type { MatchState } from '../core/types';
import { ActualTribunalGrayboxRenderer } from '../graybox/actualTribunalGrayboxRenderer';

const WIDTH = 1120, HEIGHT = 620, PIXELS_PER_SIM = 1.3, WORLD_PER_SIM = .02;
const ease = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };

/** Presentation adapter only: simulation positions, damage and timelines are never changed. */
export class LamuhTribunalArena {
  readonly ready: Promise<void>;
  private readonly arena: ActualTribunalGrayboxRenderer;
  private texture?: THREE.CanvasTexture;
  private plane?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private source?: HTMLCanvasElement;
  private frameOrdinal = 0;
  private angle = 0;
  private phase = 'gameplay';

  constructor(host: HTMLElement) {
    this.arena = new ActualTribunalGrayboxRenderer(host, { backgroundOnly: true, spriteSources: {} });
    this.ready = this.arena.ready;
    this.arena.renderer.setPixelRatio(1);
    this.arena.renderer.setSize(WIDTH, HEIGHT, false);
    this.arena.renderer.domElement.style.width = '100%';
    this.arena.renderer.domElement.style.height = '100%';
    this.arena.camera.aspect = WIDTH / HEIGHT;
    this.arena.camera.fov = 35;
    this.arena.camera.updateProjectionMatrix();
  }

  render(state: MatchState, foregroundCanvas: HTMLCanvasElement): void {
    if (this.source !== foregroundCanvas) {
      this.texture?.dispose();
      if (this.plane) { this.arena.scene.remove(this.plane); this.plane.geometry.dispose(); this.plane.material.dispose(); }
      this.source = foregroundCanvas;
      this.texture = new THREE.CanvasTexture(foregroundCanvas);
      // The combat plane is re-uploaded every frame, so the upload path decides the frame rate.
      // Tagging it sRGB asks for an SRGB8_ALPHA8 texture, which this GL backend cannot fill from
      // a canvas without a per-pixel CPU conversion: measured ~40 ms per frame, i.e. ~21 fps.
      // Upload plain RGBA8 instead and decode sRGB in the shader, which is where the previous
      // texture format was doing the same maths. Sampled colour is unchanged.
      this.texture.colorSpace = THREE.NoColorSpace;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.generateMipmaps = false;
      const material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          `#include <map_fragment>
           diffuseColor = vec4(mix(pow((diffuseColor.rgb + 0.055) / 1.055, vec3(2.4)), diffuseColor.rgb / 12.92, step(diffuseColor.rgb, vec3(0.04045))), diffuseColor.a);`
        );
      };
      this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(foregroundCanvas.width / PIXELS_PER_SIM * WORLD_PER_SIM, foregroundCanvas.height / PIXELS_PER_SIM * WORLD_PER_SIM),
        material
      );
      // The exact same fixed combat plane contains every body, socket and effect.
      // It never rotates to face the camera. Root y=source.height-80 maps to floor0.
      this.plane.position.set(0, (foregroundCanvas.height / 2 - 80) / PIXELS_PER_SIM * WORLD_PER_SIM, .025);
      this.arena.scene.add(this.plane);
    }
    this.texture!.needsUpdate = true;
    const shot = state.ultimateInteraction;
    let targetX = (state.fighters.p1.x + state.fighters.p2.x) * .5 * WORLD_PER_SIM;
    let targetY = 3.0, distance = 14.5, angle = 0;
    this.phase = shot?.phase ?? 'gameplay';
    if (shot) {
      const attacker = state.fighters[shot.attacker];
      const focus = attacker.x * WORLD_PER_SIM;
      const chargeBlend = ease((shot.tick - 66) / 14);
      const recovery = 1 - ease((shot.tick - 202) / 38);
      targetX += (focus - targetX) * .3 * chargeBlend * recovery;
      if (shot.tick >= 66 && shot.tick < 166) {
        // Real perspective camera travel about the planted fighter: scenery parallax,
        // floor vanishing point and opponent projection all respond together.
        const travel = ease((shot.tick - 80) / 85);
        angle = (-25 + 50 * travel) * chargeBlend * shot.facing;
        distance = 14.5 + 1.3 * chargeBlend;
        targetY = 3 + .25 * chargeBlend;
      } else if (shot.tick >= 166) {
        const release = ease((shot.tick - 166) / 10);
        angle = 25 * (1 - release) * shot.facing * recovery;
        distance = 14.5 + (1.3 + 1.7 * release) * recovery;
        targetY = 3 + .25 * recovery;
      }
    }
    this.angle = angle;
    const radians = angle * Math.PI / 180;
    this.arena.camera.position.set(targetX + Math.sin(radians) * distance, targetY + 1.7, Math.cos(radians) * distance);
    this.arena.camera.lookAt(targetX, targetY, 0);
    this.arena.camera.updateMatrixWorld(true);
    this.arena.renderer.render(this.arena.scene, this.arena.camera);
  }

  project(x: number, y: number) {
    const p = new THREE.Vector3(x * WORLD_PER_SIM, -y * WORLD_PER_SIM, .025).project(this.arena.camera);
    return { x: (p.x + 1) * WIDTH / 2, y: (1 - p.y) * HEIGHT / 2 };
  }

  diagnostics() {
    return { ...this.arena.presentationIdentity(), cameraPosition: this.arena.camera.position.toArray(), orbitDegrees: this.angle,
      phase: this.phase, projection: 'PerspectiveCamera', fixedCombatPlane: true, simulatedStateMutated: false };
  }
}
