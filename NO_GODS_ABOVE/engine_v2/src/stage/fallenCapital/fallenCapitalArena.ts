import * as THREE from 'three';
import type { MatchState } from '../../core/types';
import { STOCK_RULES } from '../../versus/matchRules';
import { calculateFallenCapitalCamera, FALLEN_CAPITAL_VIEW, type FallenCapitalShot } from './camera';

const { width: WIDTH, height: HEIGHT, pixelsPerSim: PIXELS_PER_SIM, worldPerSim: WORLD_PER_SIM } = FALLEN_CAPITAL_VIEW;
const BACKGROUND_URL = './stages/fallen-capital/background.png';

/** First Fallen Capital stage. Every mesh is presentation-only; the engine owns collision. */
export class FallenCapitalArena {
  readonly ready: Promise<void>;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FALLEN_CAPITAL_VIEW.fov, WIDTH / HEIGHT, .1, 220);
  private readonly textures = new Set<THREE.Texture>();
  private readonly geometries = new Set<THREE.BufferGeometry>();
  private readonly materials = new Set<THREE.Material>();
  private readonly shadows: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private source?: HTMLCanvasElement;
  private combatTexture?: THREE.CanvasTexture;
  private combatPlane?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private backdrop?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private floorMaterial?: THREE.MeshStandardMaterial;
  private foundation?: THREE.Mesh;
  private floor?: THREE.Mesh;
  private readonly wallObjects: THREE.Object3D[] = [];
  private readonly roundPerimeter: THREE.Object3D[] = [];
  private readonly stockPerimeter: THREE.Object3D[] = [];
  private readonly stockUpperPlatforms: THREE.Object3D[] = [];
  private stockMode = false;
  private architectureMaterial?: THREE.MeshStandardMaterial;
  private fasciaLongMaterial?: THREE.MeshBasicMaterial;
  private fasciaSideMaterial?: THREE.MeshBasicMaterial;
  private textureReady = false;
  private disposed = false;
  private shot: FallenCapitalShot = { targetX: 0, targetY: 2.726, distance: 18.4, orbitDegrees: 0, phase: 'gameplay' };
  private lastTick = 0;
  private combatBounds = { left: -420, right: 420 };

  constructor(host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(WIDTH, HEIGHT, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.setAttribute('aria-label', 'The Fallen Capital, NGA V2 stage');
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color('#566273');
    this.scene.add(new THREE.HemisphereLight('#b9c8e5', '#302725', 2.15));
    const sun = new THREE.DirectionalLight('#ffdfad', 3.1);
    sun.position.set(5, 15, -11);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#8295b3', .7);
    fill.position.set(-12, 6, 8);
    this.scene.add(fill);
    this.buildArchitecture();
    this.setCamera();
    const loader = new THREE.TextureLoader();
    const loadTexture = async (url: string) => {
      const texture = await loader.loadAsync(url);
      if (this.disposed) { texture.dispose(); throw new Error('Fallen Capital disposed before art loaded'); }
      this.textures.add(texture);
      return texture;
    };
    this.ready = Promise.all([loadTexture(BACKGROUND_URL), loadTexture('./stages/fallen-capital/head.png'), loadTexture('./stages/fallen-capital/stone.png'), loadTexture('./stages/fallen-capital/pier.png'), loadTexture('./stages/fallen-capital/fascia.png')]).then(([texture, headTexture, stoneTexture, pierTexture, fasciaTexture]) => {
      if (this.disposed) throw new Error('Fallen Capital disposed before art loaded');
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      this.textures.add(texture);
      const material = this.material(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, depthWrite: false }));
      this.backdrop = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(1, 1)), material);
      // Distant matte painting remains fixed in the world, behind every physical mesh.
      // Overscan covers camera tracking and the constrained cinematic arc.
      this.backdrop.position.set(0, 0, -64);
      this.backdrop.renderOrder = -20;
      this.scene.add(this.backdrop);
      headTexture.colorSpace = THREE.SRGBColorSpace;
      const headMaterial = this.material(new THREE.MeshBasicMaterial({ map: headTexture, transparent: true, alphaTest: .025, depthWrite: false, toneMapped: false }));
      const head = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(6.9, 4.6)), headMaterial);
      head.position.set(8.45, 2.12, -4.8);
      head.renderOrder = -1;
      this.scene.add(head);
      stoneTexture.colorSpace = THREE.SRGBColorSpace;
      stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
      stoneTexture.repeat.set(3, 1.5);
      stoneTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.floorMaterial!.map = stoneTexture;
      this.floorMaterial!.needsUpdate = true;
      const pierStone = stoneTexture.clone();
      pierStone.repeat.set(.35, 1.3);
      this.textures.add(pierStone);
      this.architectureMaterial!.map = pierStone;
      this.architectureMaterial!.needsUpdate = true;
      // Independent repeats preserve the carved panel proportions on long faces and returns.
      fasciaTexture.colorSpace = THREE.SRGBColorSpace;
      fasciaTexture.wrapS = THREE.RepeatWrapping;
      fasciaTexture.repeat.set(10, 1);
      fasciaTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.fasciaLongMaterial!.map = fasciaTexture;
      this.fasciaLongMaterial!.needsUpdate = true;
      const sideFascia = fasciaTexture.clone();
      sideFascia.repeat.set(16 / 3.6, 1);
      this.textures.add(sideFascia);
      this.fasciaSideMaterial!.map = sideFascia;
      this.fasciaSideMaterial!.needsUpdate = true;
      pierTexture.colorSpace = THREE.SRGBColorSpace;
      const facadeMaterial = this.material(new THREE.MeshBasicMaterial({ map: pierTexture, transparent: true, alphaTest: .05, depthWrite: true, toneMapped: false }));
      for (const side of [-1, 1]) {
        const facade = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(3.61, 6.6)), facadeMaterial);
        facade.position.set(side * 8.4, 3.3, -1.03);
        this.scene.add(facade);
        this.wallObjects.push(facade);
      }
      this.textureReady = true;
      this.setCamera();
    }).catch(error => { throw new Error(`Fallen Capital background failed to load: ${String(error)}`); });
  }

  private geometry<T extends THREE.BufferGeometry>(g: T): T { this.geometries.add(g); return g; }
  private material<T extends THREE.Material>(m: T): T { this.materials.add(m); return m; }
  private box(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, y, z); this.scene.add(mesh); return mesh;
  }

  private buildArchitecture(): void {
    const ash = this.material(new THREE.MeshStandardMaterial({ color: '#5b5a5c', roughness: .96, metalness: .03 }));
    this.architectureMaterial = ash;
    const edge = this.material(new THREE.MeshStandardMaterial({ color: '#37383e', roughness: 1 }));
    const brass = this.material(new THREE.MeshStandardMaterial({ color: '#89754e', roughness: .72, metalness: .42 }));
    const darkBrass = this.material(new THREE.MeshStandardMaterial({ color: '#4e4635', roughness: .84, metalness: .25 }));
    // Closed masonry slab: all four exposed vertical faces receive finished relief art.
    // Basic materials retain the painted fill light under this otherwise back-lit ledge.
    this.fasciaLongMaterial = this.material(new THREE.MeshBasicMaterial({ color: '#c5c0b9', toneMapped: false }));
    this.fasciaSideMaterial = this.material(new THREE.MeshBasicMaterial({ color: '#b6b3ae', toneMapped: false }));
    const foundation = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(36, 1.2, 16)), [
      this.fasciaSideMaterial, this.fasciaSideMaterial, ash, ash, this.fasciaLongMaterial, this.fasciaLongMaterial,
    ]);
    foundation.name = 'fallen-capital-finished-foundation';
    foundation.position.set(0, -.64, -1.2);
    this.scene.add(foundation);
    this.foundation = foundation;

    // Continuous physical plane: the hand-painted paving controls all surface joints.
    this.floorMaterial = this.material(new THREE.MeshStandardMaterial({ color: '#c7bfba', roughness: .98, metalness: .015 }));
    const floor = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(36, 16)), this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1.2);
    this.scene.add(floor);
    this.floor = floor;
    // Oval tribunal inlay and central compass are worn metal, never emissive VFX.
    for (const radius of [5.3, 5.42]) {
      const ring = new THREE.Mesh(this.geometry(new THREE.RingGeometry(radius, radius + .019, 128)), brass);
      ring.rotation.x = -Math.PI / 2; ring.scale.y = .56; ring.position.y = .006; this.scene.add(ring);
    }
    this.box(.025, .008, 8.4, 0, .006, -.5, darkBrass);
    for (let i = 0; i < 8; i++) {
      const pointer = new THREE.Mesh(this.geometry(new THREE.ConeGeometry(i % 2 ? .055 : .08, i % 2 ? .48 : .82, 3)), brass);
      pointer.rotation.z = i * Math.PI / 4; pointer.rotation.x = Math.PI / 2;
      pointer.position.set(Math.sin(i * Math.PI / 4) * .18, .019, Math.cos(i * Math.PI / 4) * .18);
      this.scene.add(pointer);
    }

    // The piers sit entirely behind the combat plane; wall effects stay unobstructed.
    for (const side of [-1, 1]) {
      const x = side * 8.4, z = -1.65;
      // Recessed solid masonry supports the illustrated ornate facade under orbit.
      this.wallObjects.push(this.box(.76, 4.8, .65, x, 2.65, z, ash));
      this.wallObjects.push(this.box(1.5, .25, .9, x, .125, z, edge));
    }
    for (let i = 0; i < 2; i++) {
      const material = this.material(new THREE.ShaderMaterial({
        uniforms: { opacity: { value: .31 } }, transparent: true, depthWrite: false,
        vertexShader: 'varying vec2 shadowUv; void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'varying vec2 shadowUv; uniform float opacity; void main(){float radius=length((shadowUv-.5)*2.);float alpha=(1.-smoothstep(.15,1.,radius))*opacity;gl_FragColor=vec4(.045,.039,.044,alpha);}',
      }));
      const shadow = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(2.5, 1.1)), material);
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = .013; shadow.renderOrder = 2;
      this.shadows.push(shadow); this.scene.add(shadow);
    }
    // Broken perimeter architecture is confined behind the fighting lane.
    const rubble = new THREE.InstancedMesh(this.geometry(new THREE.DodecahedronGeometry(1, 0)), this.floorMaterial, 38);
    const transform = new THREE.Object3D();
    for (let i = 0; i < 38; i++) {
      const side = i % 2 ? -1 : 1;
      transform.position.set(side * (9.3 + ((i * 17) % 39) * .16), .14 + (i % 3) * .08, -2.7 - ((i * 7) % 17) * .16);
      transform.rotation.set(i * .18, i * .71, i * .11);
      transform.scale.set(.14 + (i % 4) * .16, .16 + (i % 3) * .12, .23 + (i % 5) * .08);
      transform.updateMatrix(); rubble.setMatrixAt(i, transform.matrix);
    }
    this.scene.add(rubble);
    this.wallObjects.push(rubble);
    // Shallow physical coping wraps each corner, below the authoritative flat floor.
    const stockSpan = (STOCK_RULES.openPlatform!.right - STOCK_RULES.openPlatform!.left) * WORLD_PER_SIM;
    for (const z of [-9.2, 6.8]) {
      this.roundPerimeter.push(this.box(36.08, .12, .12, 0, -.075, z, ash));
      this.stockPerimeter.push(this.box(stockSpan + .08, .12, .12, 0, -.075, z, ash));
    }
    for (const x of [-18, 18]) this.roundPerimeter.push(this.box(.12, .12, 16, x, -.075, -1.2, ash));
    for (const x of [STOCK_RULES.openPlatform!.left * WORLD_PER_SIM, STOCK_RULES.openPlatform!.right * WORLD_PER_SIM])
      this.stockPerimeter.push(this.box(.12, .12, 16, x, -.075, -1.2, ash));
    for (const mesh of this.stockPerimeter) mesh.visible = false;
    // Every raised landing is finished on its top and exposed faces. Their dimensions
    // come from the same combat coordinates used by the stock collision contract.
    for (const surface of STOCK_RULES.openPlatform!.upperPlatforms ?? []) {
      const width = (surface.right - surface.left) * WORLD_PER_SIM;
      const x = (surface.left + surface.right) * WORLD_PER_SIM / 2;
      const top = -surface.y * WORLD_PER_SIM;
      const slab = new THREE.Mesh(this.geometry(new THREE.BoxGeometry(width, .28, 2.4)), [
        this.fasciaSideMaterial!, this.fasciaSideMaterial!, this.floorMaterial!, ash,
        this.fasciaLongMaterial!, this.fasciaLongMaterial!,
      ]);
      slab.position.set(x, top - .14, -1.2); this.scene.add(slab); this.stockUpperPlatforms.push(slab);
      this.stockUpperPlatforms.push(this.box(width + .08, .055, .11, x, top - .03, .055, brass));
      this.stockUpperPlatforms.push(this.box(width, .13, 2.1, x, top - .35, -1.2, edge));
    }
    for (const mesh of this.stockUpperPlatforms) mesh.visible = false;
  }

  private setStockMode(enabled: boolean): void {
    if (this.stockMode === enabled) return;
    this.stockMode = enabled;
    // Both rulesets use the exact same full-width paving and finished slab.
    // Stock changes only collision/raised landings; it never shrinks the arena art.
    if (this.foundation) this.foundation.scale.x = 1;
    if (this.floor) this.floor.scale.x = 1;
    for (const object of this.wallObjects) object.visible = !enabled;
    for (const object of this.roundPerimeter) object.visible = !enabled;
    for (const object of this.stockPerimeter) object.visible = enabled;
    for (const object of this.stockUpperPlatforms) object.visible = enabled;
    const stone = this.floorMaterial?.map;
    if (stone) { stone.repeat.x = 3; stone.needsUpdate = true; }
    const fascia = this.fasciaLongMaterial?.map;
    if (fascia) { fascia.repeat.x = 10; fascia.needsUpdate = true; }
  }

  private setCamera(): void {
    const radians = this.shot.orbitDegrees * Math.PI / 180;
    const { targetX, targetY, distance } = this.shot;
    this.camera.position.set(targetX + Math.sin(radians) * distance, targetY + (this.shot.eyeElevation ?? 1.75), Math.cos(radians) * distance);
    this.camera.lookAt(targetX, targetY, 0);
    this.camera.updateMatrixWorld(true);
    if (this.backdrop) {
      // Cyclorama has a fixed depth. Expand its safe coverage vertically
      // with an airborne camera, preserving native 16:9 art and the halo at the top.
      // Horizontal tracking still gives scene-space parallax against the near piers.
      const depth = distance + 64;
      const halfHeight = depth * Math.tan(this.camera.fov * Math.PI / 360);
      const height = halfHeight * 2.18;
      const eyeElevation = this.shot.eyeElevation ?? 1.75;
      const centerRayY = targetY + eyeElevation - depth * eyeElevation / distance;
      this.backdrop.scale.set(height * 16 / 9, height, 1);
      this.backdrop.position.y = centerRayY + halfHeight * 1.025 - height / 2;
      // Distant-sky tracking leaves 25% of world translation and 20% of orbit
      // parallax while covering even a corner ultimate; near meshes stay fixed.
      this.backdrop.position.x = targetX * .75 - Math.tan(radians) * 64 * .8;
    }
  }

  /** `shake` is a presentation-only impact offset in simulation units; it never touches state. */
  render(state: MatchState, foregroundCanvas: HTMLCanvasElement, shake: { x: number; y: number } = { x: 0, y: 0 }, cinematicShot?: FallenCapitalShot): void {
    if (this.disposed) return;
    this.setStockMode(!!state.matchConfig.versusRules?.openPlatform);
    if (this.source !== foregroundCanvas) {
      if (this.combatPlane) { this.scene.remove(this.combatPlane); this.combatPlane.geometry.dispose(); this.geometries.delete(this.combatPlane.geometry); this.combatPlane.material.dispose(); this.materials.delete(this.combatPlane.material); }
      if (this.combatTexture) { this.combatTexture.dispose(); this.textures.delete(this.combatTexture); }
      this.source = foregroundCanvas;
      this.combatTexture = new THREE.CanvasTexture(foregroundCanvas);
      this.combatTexture.colorSpace = THREE.NoColorSpace;
      this.combatTexture.minFilter = THREE.LinearFilter;
      this.combatTexture.magFilter = THREE.LinearFilter;
      this.combatTexture.generateMipmaps = false;
      this.textures.add(this.combatTexture);
      const material = this.material(new THREE.MeshBasicMaterial({ map: this.combatTexture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      // Match Tribunal's efficient RGBA canvas upload plus shader sRGB decoding.
      material.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor = vec4(mix(pow((diffuseColor.rgb + 0.055) / 1.055, vec3(2.4)), diffuseColor.rgb / 12.92, step(diffuseColor.rgb, vec3(0.04045))), diffuseColor.a);`); };
      this.combatPlane = new THREE.Mesh(this.geometry(new THREE.PlaneGeometry(foregroundCanvas.width / PIXELS_PER_SIM * WORLD_PER_SIM, foregroundCanvas.height / PIXELS_PER_SIM * WORLD_PER_SIM)), material);
      this.combatPlane.position.set(0, (foregroundCanvas.height / 2 - 80) / PIXELS_PER_SIM * WORLD_PER_SIM, .025);
      this.combatPlane.renderOrder = 10;
      this.scene.add(this.combatPlane);
    }
    this.combatTexture!.needsUpdate = true;
    this.shot = cinematicShot ?? calculateFallenCapitalCamera(state);
    this.lastTick = state.tick;
    this.combatBounds = { left: state.stage.left, right: state.stage.right };
    this.setCamera();
    if (shake.x || shake.y) {
      this.camera.position.x += shake.x * WORLD_PER_SIM;
      this.camera.position.y -= shake.y * WORLD_PER_SIM;
      this.camera.updateMatrixWorld(true);
    }
    for (const [index, shadow] of this.shadows.entries()) {
      shadow.visible = this.shot.phase !== 'paid-enemy-pov';
      const fighter = state.fighters[index === 0 ? 'p1' : 'p2'];
      const height = Math.max(0, -fighter.y * WORLD_PER_SIM);
      const scale = 1 + Math.min(height, 12) * .035;
      shadow.position.x = fighter.x * WORLD_PER_SIM;
      shadow.scale.set(scale, scale, 1);
      shadow.material.uniforms.opacity.value = Math.max(.12, .34 - height * .023);
    }
    this.renderer.render(this.scene, this.camera);
  }

  project(x: number, y: number): { x: number; y: number } {
    const point = new THREE.Vector3(x * WORLD_PER_SIM, -y * WORLD_PER_SIM, .025).project(this.camera);
    return { x: (point.x + 1) * WIDTH / 2, y: (1 - point.y) * HEIGHT / 2 };
  }

  diagnostics() {
    return {
      stageId: 'fallen-capital', displayName: 'The Fallen Capital', stageLoaded: this.textureReady,
      textureReady: this.textureReady, backgroundUrl: BACKGROUND_URL, disposed: this.disposed,
      cameraPosition: this.camera.position.toArray(), cameraFov: this.camera.fov, cameraTarget: [this.shot.targetX, this.shot.targetY, 0],
      cameraDistance: this.shot.distance, orbitDegrees: this.shot.orbitDegrees, phase: this.shot.phase,
      projection: 'PerspectiveCamera', fixedCombatPlane: true, simulatedStateMutated: false,
      bounds: { ...this.combatBounds, groundY: 0, leftWorld: this.combatBounds.left * WORLD_PER_SIM, rightWorld: this.combatBounds.right * WORLD_PER_SIM },
      endpoints: { left: this.project(this.combatBounds.left, 0), right: this.project(this.combatBounds.right, 0), center: this.project(0, 0) },
      viewport: { width: WIDTH, height: HEIGHT }, tick: this.lastTick,
      renderCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const texture of this.textures) texture.dispose();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.textures.clear(); this.geometries.clear(); this.materials.clear();
    this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}

export { calculateFallenCapitalCamera, FALLEN_CAPITAL_VIEW } from './camera';
