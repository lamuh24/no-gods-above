import "./style.css";
import { ActualTribunalGrayboxRenderer } from "../graybox/actualTribunalGrayboxRenderer";
import type { StageMatchState } from "../stage/types";

type MotionId = "idle" | "walk" | "signature";

const REVIEW_ROOT =
  "/@fs/C:/Users/qchee/OneDrive/Documents/no gods above/tools/nga-forge/production/characters/ty/review/video-motion-v1";
const SIGNATURE_REVIEW_ROOT =
  "/@fs/C:/Users/qchee/OneDrive/Documents/no gods above/tools/nga-forge/production/characters/ty/review/signature-attack-video-v1";

function reviewUrl(relativePath: string, root = REVIEW_ROOT) {
  return encodeURI(`${root}/${relativePath}`);
}

const motions: Record<MotionId, { frameIds: string[]; holds: number[]; totalTicks: number }> = {
  idle: {
    frameIds: Array.from({ length: 10 }, (_, index) => `ty_idle_${String(index).padStart(2, "0")}`),
    holds: [16, 16, 16, 16, 16, 16, 15, 16, 16, 15],
    totalTicks: 158
  },
  walk: {
    frameIds: Array.from({ length: 12 }, (_, index) => `ty_walk_${String(index).padStart(2, "0")}`),
    holds: [7, 7, 6, 7, 7, 6, 7, 7, 6, 7, 7, 6],
    totalTicks: 80
  },
  signature: {
    frameIds: Array.from({ length: 63 }, (_, index) => `ty_signature_${String(index).padStart(2, "0")}`),
    holds: Array.from({ length: 63 }, () => 2),
    totalTicks: 126
  }
};

const spriteSources = Object.fromEntries(
  (["idle", "walk"] as const).flatMap((motionId) =>
    motions[motionId].frameIds.map((frameId) => [
      frameId,
      {
        url: reviewUrl(`source-frames/${motionId}/${frameId}.png`),
        approval: `candidate_ty_${motionId}_video_motion_v1_awaiting_human_review`
      }
    ])
  )
);

for (const frameId of motions.signature.frameIds) {
  spriteSources[frameId] = {
    url: reviewUrl(`source-frames/signature/${frameId}.png`, SIGNATURE_REVIEW_ROOT),
    approval: "candidate_ty_signature_attack_video_v1_awaiting_human_motion_and_alpha_review"
  };
}

const root = document.querySelector<HTMLDivElement>("#app")!;
root.innerHTML = `
  <main class="preview-shell">
    <section id="viewport" class="viewport" aria-label="Animated Ty on The Last Tribunal stage"></section>
    <div id="load-error" class="load-error" hidden></div>
    <div class="hud">
      <div class="top-hud">
        <section class="fighter-hud">
          <div class="name-row"><span class="name">TY</span><span class="player">P1</span></div>
          <div class="health"></div>
        </section>
        <div class="round"><span class="round-number">99</span><span class="round-label">ROUND 1</span></div>
        <section class="fighter-hud right">
          <div class="name-row"><span class="name">TY</span><span class="player">P2</span></div>
          <div class="health"></div>
        </section>
      </div>
      <div></div>
      <div class="stage-tag">The Last Tribunal<br>Engine V2 camera + stage</div>
    </div>
    <aside class="review-card">
      <h1 class="review-title">TY — Video-motion candidate</h1>
      <p id="review-copy" class="review-copy">Walk · 12 poses · 80 ticks at 60 Hz · visual holds only · movement remains code-owned</p>
      <p id="frame-readout" class="frame-readout">Loading candidate textures…</p>
    </aside>
    <nav class="controls" aria-label="Preview controls">
      <button id="idle" aria-pressed="false">Idle</button>
      <button id="walk" aria-pressed="true">Walk</button>
      <button id="signature" aria-pressed="false">Signature Special</button>
      <button id="pause" aria-pressed="false">Pause</button>
      <button id="duel" aria-pressed="true">Mirror Match</button>
      <button id="spacing" aria-pressed="false">Wide Spacing</button>
      <button id="diagnostics" aria-pressed="false">Stage Guides</button>
    </nav>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;
const renderer = new ActualTribunalGrayboxRenderer(viewport, {
  spriteSources,
  initialFrameId: motions.walk.frameIds[0],
  textureMaxResolution: 768
});

const state: StageMatchState = {
  tick: 0,
  fighters: {
    p1: { x: -112, y: 0, facing: 1 },
    p2: { x: 112, y: 0, facing: -1 }
  }
};

let currentMotion: MotionId = "walk";
let motionTick = 0;
let wideSpacing = false;
let diagnostics = false;
let playing = true;
let animationFrame = 0;
let lastTimestamp = 0;
let tickAccumulator = 0;

function frameAtTick(motionId: MotionId, tick: number) {
  const motion = motions[motionId];
  const wrapped = ((tick % motion.totalTicks) + motion.totalTicks) % motion.totalTicks;
  let cursor = 0;
  for (let index = 0; index < motion.holds.length; index += 1) {
    cursor += motion.holds[index];
    if (wrapped < cursor) return { frameId: motion.frameIds[index], index, hold: motion.holds[index] };
  }
  const index = motion.frameIds.length - 1;
  return { frameId: motion.frameIds[index], index, hold: motion.holds[index] };
}

function render(label = currentMotion) {
  renderer.render(state);
  return renderer.snapshot(state, `ty_${label}_${wideSpacing ? "wide" : "duel"}`);
}

function applyMotionFrame() {
  const selected = frameAtTick(currentMotion, motionTick);
  const p1Presentation = state.fighters.p1 as StageMatchState["fighters"]["p1"] & {
    presentationScale?: number;
    presentationRootOffsetX?: number;
    presentationRootOffsetY?: number;
  };
  const p2Presentation = state.fighters.p2 as StageMatchState["fighters"]["p2"] & {
    presentationScale?: number;
    presentationRootOffsetX?: number;
    presentationRootOffsetY?: number;
  };
  if (currentMotion === "signature") {
    const defender = frameAtTick("idle", motionTick);
    renderer.setFighterFrame("p1", selected.frameId);
    renderer.setFighterFrame("p2", defender.frameId);
    p1Presentation.presentationScale = 1.4;
    p1Presentation.presentationRootOffsetX = 125;
    p1Presentation.presentationRootOffsetY = -42;
    p2Presentation.presentationScale = 1;
    p2Presentation.presentationRootOffsetX = -60;
    p2Presentation.presentationRootOffsetY = 0;
    state.fighters.p1.x = -180;
    state.fighters.p2.x = 180;
  } else {
    renderer.setFighterFrame("p1", selected.frameId);
    renderer.setFighterFrame("p2", selected.frameId);
    p1Presentation.presentationScale = 1;
    p1Presentation.presentationRootOffsetX = 0;
    p1Presentation.presentationRootOffsetY = 0;
    p2Presentation.presentationScale = 1;
    p2Presentation.presentationRootOffsetX = 0;
    p2Presentation.presentationRootOffsetY = 0;
    state.fighters.p1.x = wideSpacing ? -210 : -112;
    state.fighters.p2.x = wideSpacing ? 210 : 112;
  }
  document.querySelector<HTMLParagraphElement>("#frame-readout")!.textContent =
    `${selected.frameId} · hold ${selected.hold} ticks · sequence tick ${motionTick % motions[currentMotion].totalTicks}/${motions[currentMotion].totalTicks - 1}`;
  render();
}

function setMotion(motionId: MotionId) {
  currentMotion = motionId;
  motionTick = 0;
  const motion = motions[motionId];
  document.querySelector<HTMLButtonElement>("#idle")!.setAttribute("aria-pressed", String(motionId === "idle"));
  document.querySelector<HTMLButtonElement>("#walk")!.setAttribute("aria-pressed", String(motionId === "walk"));
  document.querySelector<HTMLButtonElement>("#signature")!.setAttribute("aria-pressed", String(motionId === "signature"));
  document.querySelector<HTMLParagraphElement>("#review-copy")!.textContent =
    `${motionId === "idle" ? "Idle" : motionId === "walk" ? "Walk" : "Signature Special"} · ${motion.frameIds.length} poses · ${motion.totalTicks} ticks at 60 Hz · ${motionId === "signature" ? "transparent review composite · combat timing remains unapproved" : "visual holds only · movement remains code-owned"}`;
  applyMotionFrame();
  renderer.snapCamera(state);
  render();
  return renderer.snapshot(state, `ty_${motionId}_selected`);
}

function setPlaying(enabled: boolean) {
  playing = enabled;
  document.querySelector<HTMLButtonElement>("#pause")!.setAttribute("aria-pressed", String(!enabled));
  document.querySelector<HTMLButtonElement>("#pause")!.textContent = enabled ? "Pause" : "Play";
  return playing;
}

function setSpacing(wide: boolean) {
  wideSpacing = wide;
  state.tick += 1;
  state.fighters.p1.x = wide ? -210 : -112;
  state.fighters.p2.x = wide ? 210 : 112;
  renderer.snapCamera(state);
  document.querySelector<HTMLButtonElement>("#duel")!.setAttribute("aria-pressed", String(!wide));
  document.querySelector<HTMLButtonElement>("#spacing")!.setAttribute("aria-pressed", String(wide));
  return render();
}

function setDiagnostics(enabled: boolean) {
  diagnostics = enabled;
  renderer.setDiagnostics(enabled);
  document.querySelector<HTMLButtonElement>("#diagnostics")!.setAttribute("aria-pressed", String(enabled));
  return render();
}

function animate(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const elapsed = Math.min(100, timestamp - lastTimestamp);
  lastTimestamp = timestamp;
  if (playing) {
    tickAccumulator += elapsed * 60 / 1000;
    const ticks = Math.floor(tickAccumulator);
    if (ticks > 0) {
      tickAccumulator -= ticks;
      motionTick = (motionTick + ticks) % motions[currentMotion].totalTicks;
      state.tick += ticks;
      applyMotionFrame();
    }
  }
  animationFrame = requestAnimationFrame(animate);
}

document.querySelector("#idle")!.addEventListener("click", () => setMotion("idle"));
document.querySelector("#walk")!.addEventListener("click", () => setMotion("walk"));
document.querySelector("#signature")!.addEventListener("click", () => setMotion("signature"));
document.querySelector("#pause")!.addEventListener("click", () => setPlaying(!playing));
document.querySelector("#duel")!.addEventListener("click", () => setSpacing(false));
document.querySelector("#spacing")!.addEventListener("click", () => setSpacing(true));
document.querySelector("#diagnostics")!.addEventListener("click", () => setDiagnostics(!diagnostics));
window.addEventListener("resize", () => { renderer.resize(); render(); });

const ready = renderer.ready.then(() => {
  renderer.snapCamera(state);
  const requestedMotion = new URLSearchParams(window.location.search).get("move") === "signature" ? "signature" : "walk";
  setMotion(requestedMotion);
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(animate);
  return renderer.snapshot(state, `ty_${requestedMotion}_ready`);
}).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  const element = document.querySelector<HTMLDivElement>("#load-error")!;
  element.hidden = false;
  element.textContent = `TY STAGE PREVIEW LOAD ERROR: ${message}`;
  throw error;
});

(window as any).__NGA_TY_STAGE_PREVIEW__ = {
  ready,
  renderer,
  state,
  motions,
  setMotion,
  setPlaying,
  setSpacing,
  setDiagnostics,
  snapshot: render,
  candidateOnly: true,
  deployable: false,
  rosterIntegrated: false,
  combatIntegrated: false,
  movementAuthority: "gameplay_code",
  animationCoverage: ["idle", "walk", "signature"],
  signatureSpecialAlphaStatus: "transparent_candidate_effects_preserved",
  signatureSpecialCombatTimingApproved: false
};
