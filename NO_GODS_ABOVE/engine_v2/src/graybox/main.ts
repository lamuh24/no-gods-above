import "./style.css";
import { createMatch } from "../core/engine";
import { CinematicContext } from "../stage/types";
import { TribunalGrayboxRenderer, GrayboxScenarioId } from "./tribunalGrayboxRenderer";

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="shell">
    <section id="viewport" class="viewport"></section>
    <aside class="panel">
      <h1>The Last Tribunal — Graybox</h1>
      <p class="badge">production_arena_graybox_candidate · deployable: false<br>deterministic 2D authority · collision-independent presentation</p>
      <div class="buttons">
        <button data-scene="center_stage">Center</button><button data-scene="left_corner">Left corner</button>
        <button data-scene="right_corner">Right corner</button><button data-scene="high_jump">High jump</button>
        <button data-scene="contrast_study">Contrast study</button><button id="diagnostics">Diagnostics</button>
        <button data-camera="command_grab">Command grab</button><button data-camera="super">Super</button>
        <button data-camera="ultimate">Ultimate</button><button data-camera="round_finisher">Finisher</button>
      </div>
      <div class="legend">
        <span class="swatch" style="background:#34d399"></span><span>combat plane / root</span>
        <span class="swatch" style="background:#ef4444"></span><span>walls / wall-bounce anchors</span>
        <span class="swatch" style="background:#a78bfa"></span><span>spawns / camera clamps</span>
        <span class="swatch" style="background:#38bdf8"></span><span>contrast and VFX safety volumes</span>
        <span class="swatch" style="background:#f59e0b"></span><span>cinematic volumes / camera target</span>
      </div>
      <pre id="hud"></pre>
    </aside>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const hud = document.querySelector<HTMLPreElement>("#hud")!;
const state = createMatch(20260714);
const renderer = new TribunalGrayboxRenderer(viewport);
const captureMode = new URLSearchParams(window.location.search).has("capture");
let diagnostics = false;
let scenario: GrayboxScenarioId = "center_stage";

function setScenario(id: GrayboxScenarioId, diagnostic = diagnostics) {
  scenario = id;
  diagnostics = diagnostic;
  renderer.configureScenario(id, state);
  renderer.setDiagnostics(diagnostics);
  renderer.snapCamera(state);
  renderer.render(state);
  return renderer.snapshot(state, id);
}

function startCinematic(context: CinematicContext, elapsedTicks: number, durationTicks?: number) {
  const scenarioByContext: Partial<Record<CinematicContext, GrayboxScenarioId>> = {
    command_grab: "command_grab", super: "super", ultimate: "ultimate", round_finisher: "round_finisher"
  };
  renderer.configureScenario(scenarioByContext[context] ?? "center_stage", state);
  renderer.snapCamera(state);
  renderer.startCinematic(context, "p1", state, durationTicks);
  state.tick += elapsedTicks;
  renderer.render(state);
  return renderer.snapshot(state, context);
}

function renderLoop() {
  renderer.render(state);
  hud.textContent = JSON.stringify(renderer.snapshot(state, scenario), null, 2);
  requestAnimationFrame(renderLoop);
}

document.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach((button) => button.addEventListener("click", () => setScenario(button.dataset.scene as GrayboxScenarioId)));
document.querySelectorAll<HTMLButtonElement>("[data-camera]").forEach((button) => button.addEventListener("click", () => startCinematic(button.dataset.camera as CinematicContext, 10)));
document.querySelector<HTMLButtonElement>("#diagnostics")!.addEventListener("click", () => setScenario(scenario, !diagnostics));

window.addEventListener("resize", () => renderer.resize());
(window as any).__NGA_TRIBUNAL_GRAYBOX__ = {
  renderer,
  state,
  ready: renderer.ready,
  setScenario,
  startCinematic,
  setDiagnostics: (enabled: boolean) => setScenario(scenario, enabled),
  render: () => renderer.render(state),
  snapshot: () => renderer.snapshot(state, scenario),
  benchmark: (frames = 120) => renderer.benchmark(state, frames)
};

renderer.ready.then(() => {
  setScenario("center_stage", false);
  if (!captureMode) requestAnimationFrame(renderLoop);
});
