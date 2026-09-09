import "./style.css";
import { VFX_ENGINE_V1_CATALOG, validateVfxCatalog, vfxCatalogManifest } from "./catalog";
import { VfxEngine } from "./engine";
import { VfxCanvasRenderer, VfxLabBackground } from "./renderer";
import { VFX_TICKS_PER_SECOND, VfxFacing, VfxOutcome, VfxPoint } from "./types";

const catalogErrors = validateVfxCatalog();
if (catalogErrors.length > 0) throw new Error(`Invalid VFX catalog:\n${catalogErrors.join("\n")}`);

const root = document.querySelector<HTMLDivElement>("#app")!;
const effectOptions = VFX_ENGINE_V1_CATALOG.map((effect) => `<option value="${effect.id}">${effect.label}</option>`).join("");
root.innerHTML = `
  <main class="vfx-shell">
    <header class="masthead">
      <div>
        <p class="eyebrow">NO GODS ABOVE · ENGINE V2</p>
        <h1>VFX Engine <span>V1</span></h1>
        <p class="subtitle">A deterministic, effects-only authoring and review surface. No fighter artwork. No combat authority.</p>
      </div>
      <div class="status-stack">
        <span class="status candidate">candidate-only</span>
        <span class="status safe">rendering-only</span>
        <span class="status locked">deployable: false</span>
      </div>
    </header>

    <section class="workspace">
      <div class="stage-column">
        <div class="stage-toolbar">
          <label>Effect<select id="effect-select">${effectOptions}</select></label>
          <label>Outcome<select id="outcome-select"><option value="hit">Hit confirmed</option><option value="block">Blocked</option><option value="whiff">Whiff</option></select></label>
          <label>Contrast<select id="background-select"><option value="cathedral">Cathedral dark</option><option value="neutral">Neutral dark</option><option value="checker">Alpha checker</option></select></label>
        </div>
        <div class="canvas-frame">
          <canvas id="vfx-canvas" width="960" height="540" aria-label="VFX-only preview canvas"></canvas>
          <div class="canvas-corner top-left">60 HZ · DETERMINISTIC</div>
          <div class="canvas-corner top-right" id="facing-readout">FACING →</div>
          <div class="canvas-corner bottom-left" id="frame-readout">TICK 000</div>
          <div class="canvas-corner bottom-right" id="checksum-readout">CHECKSUM --------</div>
        </div>

        <div class="transport">
          <button id="restart" class="primary">Restart</button>
          <button id="play-pause">Pause</button>
          <button id="step">Step +1</button>
          <button id="facing">Facing →</button>
          <div class="speed-group" aria-label="Playback speed">
            <button data-speed="0.5">0.5×</button><button data-speed="1" class="active">1×</button><button data-speed="2">2×</button>
          </div>
          <label class="check"><input id="loop" type="checkbox" checked /> Loop</label>
          <label class="check"><input id="anchors" type="checkbox" checked /> Anchors</label>
          <label class="check"><input id="follow" type="checkbox" /> Move socket</label>
        </div>
        <div class="timeline-row">
          <span>0</span><input id="timeline" type="range" min="0" max="23" value="0" step="1" /><span id="duration-readout">24</span>
        </div>
      </div>

      <aside class="inspector">
        <section class="panel hero-panel">
          <p class="panel-label">Selected preset</p>
          <h2 id="effect-name"></h2>
          <p id="effect-description"></p>
          <div id="effect-tags" class="tags"></div>
        </section>

        <section class="panel metrics">
          <div><span>Tick</span><strong id="metric-tick">0</strong></div>
          <div><span>Primitives</span><strong id="metric-primitives">0</strong></div>
          <div><span>Instances</span><strong id="metric-instances">0</strong></div>
          <div><span>Shake</span><strong id="metric-shake">0, 0</strong></div>
        </section>

        <section class="panel">
          <div class="panel-heading"><div><p class="panel-label">Independent tracks</p><h3>Layer audit</h3></div><button id="copy-manifest">Copy manifest</button></div>
          <div id="layer-list" class="layer-list"></div>
        </section>

        <section class="panel contract-panel">
          <p class="panel-label">Engine contract</p>
          <ul>
            <li>Fixed-tick playback and seeded particles</li>
            <li>Facing-aware offsets and velocity</li>
            <li>Owner, impact, world, and previous-position anchors</li>
            <li>Hit, block, and whiff visibility gates</li>
            <li>Effects never mutate combat simulation</li>
          </ul>
          <pre id="event-log">Ready.</pre>
        </section>
      </aside>
    </section>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>("#vfx-canvas")!;
const renderer = new VfxCanvasRenderer(canvas);
const engine = new VfxEngine(VFX_ENGINE_V1_CATALOG, 0x56465831);
const anchorBase: VfxPoint = { x: 480, y: 282 };
let selectedEffectId = VFX_ENGINE_V1_CATALOG[0].id;
let facing: VfxFacing = 1;
let outcome: VfxOutcome = "hit";
let speed = 1;
let paused = false;
let accumulator = 0;
let lastTime = performance.now();
let background: VfxLabBackground = "cathedral";

const effectSelect = document.querySelector<HTMLSelectElement>("#effect-select")!;
const outcomeSelect = document.querySelector<HTMLSelectElement>("#outcome-select")!;
const backgroundSelect = document.querySelector<HTMLSelectElement>("#background-select")!;
const timeline = document.querySelector<HTMLInputElement>("#timeline")!;
const loopToggle = document.querySelector<HTMLInputElement>("#loop")!;
const anchorsToggle = document.querySelector<HTMLInputElement>("#anchors")!;
const followToggle = document.querySelector<HTMLInputElement>("#follow")!;
const playPause = document.querySelector<HTMLButtonElement>("#play-pause")!;
const eventLog = document.querySelector<HTMLPreElement>("#event-log")!;

function definition() { return engine.definition(selectedEffectId); }

function currentAnchor(): VfxPoint {
  if (!followToggle.checked) return anchorBase;
  return {
    x: anchorBase.x + Math.sin(engine.tick * 0.12) * 105,
    y: anchorBase.y + Math.sin(engine.tick * 0.06) * 22
  };
}

function triggerSelected(message = "Triggered"): void {
  engine.clear();
  engine.trigger(selectedEffectId, { anchorId: "preview_socket", anchor: anchorBase, facing, outcome, seed: 0x4e474131 });
  engine.seek(0);
  timeline.max = String(Math.max(0, definition().durationTicks - 1));
  timeline.value = "0";
  document.querySelector("#duration-readout")!.textContent = String(definition().durationTicks - 1);
  eventLog.textContent = `${message}: ${selectedEffectId}\noutcome=${outcome} · facing=${facing === 1 ? "right" : "left"} · seed=0x4e474131`;
  updateDefinitionPanel();
}

function updateDefinitionPanel(): void {
  const effect = definition();
  document.querySelector("#effect-name")!.textContent = effect.label;
  document.querySelector("#effect-description")!.textContent = effect.description;
  document.querySelector("#effect-tags")!.innerHTML = effect.tags.map((tag) => `<span>${tag.replaceAll("_", " ")}</span>`).join("");
  document.querySelector("#layer-list")!.innerHTML = effect.layers.map((layer) => `
    <article class="layer-row">
      <span class="layer-swatch" style="--swatch:${layer.color};--swatch2:${layer.secondaryColor}"></span>
      <div><strong>${layer.id.replaceAll("_", " ")}</strong><small>${layer.kind} · ${layer.anchorMode.replaceAll("_", " ")} · ${layer.visibility.replace("on_", "")}</small></div>
      <b>${layer.startTick}–${layer.startTick + layer.durationTicks - 1}</b>
    </article>`).join("");
}

function setPaused(value: boolean): void {
  paused = value;
  playPause.textContent = paused ? "Play" : "Pause";
}

function advanceTick(): void {
  const lastTick = definition().durationTicks - 1;
  if (engine.tick >= lastTick) {
    if (loopToggle.checked) triggerSelected("Looped");
    else setPaused(true);
  } else engine.step();
}

function render(): void {
  const anchor = currentAnchor();
  const anchors = { preview_socket: anchor } as const;
  const frame = engine.sample(anchors);
  renderer.render(frame, { background, showAnchors: anchorsToggle.checked, anchors });
  timeline.value = String(Math.min(Number(timeline.max), engine.tick));
  document.querySelector("#facing-readout")!.textContent = `FACING ${facing === 1 ? "→" : "←"}`;
  document.querySelector("#frame-readout")!.textContent = `TICK ${String(engine.tick).padStart(3, "0")}`;
  document.querySelector("#checksum-readout")!.textContent = `CHECKSUM ${frame.checksum}`;
  document.querySelector("#metric-tick")!.textContent = String(engine.tick);
  document.querySelector("#metric-primitives")!.textContent = String(frame.primitives.length);
  document.querySelector("#metric-instances")!.textContent = String(frame.activeInstanceIds.length);
  document.querySelector("#metric-shake")!.textContent = `${frame.cameraShake[0].toFixed(1)}, ${frame.cameraShake[1].toFixed(1)}`;
}

function loop(now: number): void {
  const elapsed = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!paused) {
    accumulator += elapsed * speed;
    while (accumulator >= 1 / VFX_TICKS_PER_SECOND) {
      advanceTick();
      accumulator -= 1 / VFX_TICKS_PER_SECOND;
    }
  }
  render();
  requestAnimationFrame(loop);
}

effectSelect.addEventListener("change", () => { selectedEffectId = effectSelect.value; triggerSelected("Preset changed"); });
outcomeSelect.addEventListener("change", () => { outcome = outcomeSelect.value as VfxOutcome; triggerSelected("Outcome changed"); });
backgroundSelect.addEventListener("change", () => { background = backgroundSelect.value as VfxLabBackground; render(); });
document.querySelector("#restart")!.addEventListener("click", () => { setPaused(false); triggerSelected("Restarted"); });
playPause.addEventListener("click", () => setPaused(!paused));
document.querySelector("#step")!.addEventListener("click", () => { setPaused(true); advanceTick(); render(); });
document.querySelector("#facing")!.addEventListener("click", (event) => {
  facing = facing === 1 ? -1 : 1;
  (event.currentTarget as HTMLButtonElement).textContent = `Facing ${facing === 1 ? "→" : "←"}`;
  triggerSelected("Facing mirrored");
});
document.querySelectorAll<HTMLButtonElement>("[data-speed]").forEach((button) => button.addEventListener("click", () => {
  speed = Number(button.dataset.speed);
  document.querySelectorAll("[data-speed]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
}));
timeline.addEventListener("input", () => { setPaused(true); engine.seek(Number(timeline.value)); render(); });
window.addEventListener("resize", () => { renderer.resize(); render(); });
document.querySelector("#copy-manifest")!.addEventListener("click", async (event) => {
  const text = JSON.stringify(vfxCatalogManifest(), null, 2);
  await navigator.clipboard?.writeText(text);
  (event.currentTarget as HTMLButtonElement).textContent = "Copied";
  window.setTimeout(() => ((event.currentTarget as HTMLButtonElement).textContent = "Copy manifest"), 1200);
});

const debugApi = {
  engine,
  renderer,
  catalog: VFX_ENGINE_V1_CATALOG,
  metadata: { status: "candidate-only", deployable: false, renderingOnly: true, simulationAuthority: false, fighterArtworkBakedIn: false, catalogErrors },
  snapshot: () => engine.sample({ preview_socket: currentAnchor() }),
  select: (effectId: string) => { selectedEffectId = effectId; effectSelect.value = effectId; triggerSelected("API selected"); },
  setOutcome: (value: VfxOutcome) => { outcome = value; outcomeSelect.value = value; triggerSelected("API outcome"); },
  setFacing: (value: VfxFacing) => { facing = value; triggerSelected("API facing"); }
};
(window as typeof window & { __NGA_VFX_ENGINE_V1__?: typeof debugApi }).__NGA_VFX_ENGINE_V1__ = debugApi;

triggerSelected("Ready");
requestAnimationFrame(loop);
