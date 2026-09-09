import "./style.css";
import { drawHeavenArc } from './heavenSplitter';
import { AttackId, FighterState } from '../core/types';
import {
  AnimationClosure, ComparisonClip, drawAtlasFrame, drawAuthoredOverlay, drawReviewBackdrop, drawStandaloneFrame,
  exposureFrame, fetchReviewData, HistoricalTimeline, loadPresentationImage, MovementModernizationState, spriteRows,
  ThrowAnimationSequence, TimingMove
} from "./common";

type CandidateId = "A" | "B" | "C";
type ImpactId = "I1" | "I2" | "I3";
type ReviewEntry = {
  key: string;
  moveId: string;
  kind: "attack" | "state" | "throw";
  sourceFrameCount: number;
  v1Historical: HistoricalTimeline | null;
  timingMove?: TimingMove;
  comparisonClip?: ComparisonClip;
  throwSequence?: ThrowAnimationSequence;
  note: string | null;
};
type ReviewTimeline = { label: string; durationTicks: number; exposureTicks: number[] };

async function main() {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Missing #app");
  app.innerHTML = `
    <section class="shell">
      <p class="eyebrow">NGA Engine V2 · preservation-first human closure</p>
      <h1>LAMUH LEGACY — V1 / V2 motion benchmark</h1>
      <p class="lede">✓ Celestial Palm and Heaven Splitter L/M/H passed their family reviews. ★ Forward specials remain marked for polish. Next: Radiant Dive—one descending palm, three dive angles, Heavy surrounding aura and floor-triggered landing. Protected legacy motion stays on the left.</p>
      <div class="gate">CURRENT GATE: HEAVEN SPLITTER L / M / H · CANDIDATE ONLY · NO PRODUCTION PROMOTION · ★ FORWARD SPECIALS / TURN / PUSHBOX REVISIT</div>
      <div class="toolbar wrap">
        <label>Move or state <select id="move"></select></label>
        <label>V2 timing <select id="candidate"></select></label>
        <label>Impact <select id="impact"></select></label>
        <button id="play">Pause</button><button id="speed1" class="active">1×</button><button id="speedHalf">0.5×</button><button id="step">+1 tick</button><button id="facing">Facing: authored →</button><button id="restart">Restart</button>
        <a class="button-link" href="/lamuh-legacy-sandbox.html">Open deterministic victim sandbox</a>
      </div>
      <div class="toolbar wrap compact">
        <label><input id="silhouette" type="checkbox"> silhouettes</label>
        <label><input id="rootOverlay" type="checkbox" checked> roots</label>
        <label><input id="centerOverlay" type="checkbox" checked> body centers / path</label>
        <label><input id="boundsOverlay" type="checkbox"> visible bounds</label>
        <label><input id="vfxToggle" type="checkbox" checked> VFX / authored aura</label><span class="fine">Heavy: VFX-off and silhouette compare previous clean poses, not exact aura removal.</span>
      </div>
      <div class="panels">
        <article class="panel"><h2 id="v1Title">LAMUH V1 LEGACY · exact protected art</h2><canvas id="v1" width="620" height="500"></canvas><div id="v1data" class="data-grid"></div></article>
        <article class="panel"><h2 id="v2Title">LAMUH V2 REBUILD · distinct normalized candidate</h2><canvas id="v2" width="620" height="500"></canvas><div id="v2data" class="data-grid"></div></article>
      </div>
      <div class="timeline"><i id="progress"></i></div><p id="summary" class="fine"></p>
      <section class="card style-checkpoint"><div><p class="eyebrow">Review authority and source boundary</p><h2 id="styleTitle"></h2><p id="styleIntro">The approved checkpoint remains unchanged and hash-bound. Rebuilt sequences extend that direction, but motion, timing, impact and gameplay feel still require review.</p><div id="styleFacts" class="data-grid"></div><p id="styleDebt" class="fine"></p></div><figure><img id="styleImage" alt="Lamuh V2 review evidence"><figcaption id="styleCaption">APPROVED STYLE DIRECTION · CANDIDATE SEQUENCES · NOT DEPLOYABLE</figcaption></figure></section>
      <section class="card"><h2>Human closure queue</h2><ul id="questions"></ul><p class="fine">No control on this page promotes art or changes the roster.</p></section>
    </section>`;

  const data = await fetchReviewData();
  const movementStates = data.movementModernization.states as Record<string, MovementModernizationState>;
  const style = data.styleCheckpoint;
  const previousClosureFor = (moveId: string): AnimationClosure | undefined => moveId === "standing_light" ? data.standingLightClosure : moveId === "standing_medium" ? data.standingMediumClosure : moveId === "crouching_light" ? data.crouchingLightClosure : moveId === "crouching_medium" ? data.crouchingMediumClosure : moveId === "crouching_heavy" ? data.crouchingHeavyClosure : moveId === "standing_heavy" ? data.standingHeavyClosure : moveId === "air_light" ? data.airLightClosure : moveId === "air_medium" ? data.airMediumClosure : moveId === "air_heavy" ? data.airHeavyClosure : moveId === "ascend_step_light" ? data.ascendStepFamily.variants.light : moveId === "ascend_step" ? data.ascendStepFamily.variants.medium : moveId === "ascend_step_heavy" ? data.ascendStepFamily.variants.heavy : undefined;
  const palmClosures:Record<string,AnimationClosure> = Object.fromEntries(Object.entries(data.celestialPalmFamily.variants).map(([strength,c])=>[`celestial_palm_${strength}`,c]));
  const heavenClosures:Record<string,AnimationClosure> = Object.fromEntries(Object.entries(data.heavenSplitterFamily.variants).map(([strength,c])=>[`heaven_splitter_${strength}`,c]));
  const diveClosures:Record<string,AnimationClosure> = Object.fromEntries(Object.entries(data.radiantDiveFamily?.variants || {}).map(([strength,c])=>[`radiant_dive_${strength}`,c]));
  const closureFor=(moveId:string):AnimationClosure|undefined=>diveClosures[moveId]||heavenClosures[moveId]||palmClosures[moveId]||previousClosureFor(moveId);
  for(const id of Object.keys(palmClosures))spriteRows[id]={atlas:"/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png",row:0,frames:6,sourceName:"celestial_palm"};
  for(const id of Object.keys(heavenClosures))spriteRows[id]={atlas:"/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png",row:2,frames:7,sourceName:"heaven_splitter"};
  for(const id of Object.keys(diveClosures))spriteRows[id]={atlas:"/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png",row:4,frames:7,sourceName:"radiant_dive"};
  const datum = (label: string, value: string | number) => `<div class="datum"><span>${label}</span><strong>${value}</strong></div>`;
  document.querySelector<HTMLElement>("#styleTitle")!.textContent = style.title;
  document.querySelector<HTMLImageElement>("#styleImage")!.src = style.publicPath;

  const entries: ReviewEntry[] = [
    ...data.timingCandidates.moves.map((move) => ({ key: `attack:${move.moveId}`, moveId: move.moveId, kind: "attack" as const, sourceFrameCount: move.sourceFrameCount, v1Historical: move.v1Historical, timingMove: move, note: move.note })),
    ...data.comparisonClips.map((clip) => ({ key: `state:${clip.clipId}`, moveId: clip.clipId, kind: "state" as const, sourceFrameCount: clip.sourceFrameCount, v1Historical: clip.v1Historical, comparisonClip: clip, note: clip.v1Historical?.note || "No recoverable V1 turn/facing clip; explicit V2 missing-state authoring." })),
    ...Object.values(data.throwAnimations.sequences).map((sequence) => ({
      key: `throw:${sequence.id}`,
      moveId: sequence.id,
      kind: "throw" as const,
      sourceFrameCount: 0,
      v1Historical: null,
      throwSequence: sequence,
      note: "No recoverable V1 universal-throw animation; dedicated V2 missing-state authoring."
    }))
  ];
  const moveSelect = document.querySelector<HTMLSelectElement>("#move")!;
  const candidateSelect = document.querySelector<HTMLSelectElement>("#candidate")!;
  const impactSelect = document.querySelector<HTMLSelectElement>("#impact")!;
  const attackGroup = document.createElement("optgroup"); attackGroup.label = "ATTACK TIMING CANDIDATES";
  const stateGroup = document.createElement("optgroup"); stateGroup.label = "PRESERVED MOVEMENT / DEFENSE";
  const throwGroup = document.createElement("optgroup"); throwGroup.label = "NEW V2 STANDARD GRAB / THROWS";
  for (const entry of entries) {
    const throwDecision = entry.kind === "throw" ? data.throwAnimations.humanApproval[entry.moveId === "universal_grab_attempt" ? "standardGrab" : entry.moveId === "forward_throw" ? "forwardThrow" : "backThrow"] : null;
    const label = entry.moveId.startsWith("celestial_palm") ? `✓ ${entry.moveId.replaceAll('_',' ')} · passed` : entry.moveId.startsWith("ascend_step") ? `★ ${entry.moveId.replaceAll("_", " ")} · passed for now / polish` : entry.moveId === "turn_facing" && data.movementModernization.turnFacingModernization?.starredForRevisit ? `★ ${entry.moveId.replaceAll("_", " ")} · revisit` : throwDecision ? `✓ ${entry.moveId.replaceAll("_", " ")} · approved` : entry.moveId.replaceAll("_", " ");
    (entry.kind === "attack" ? attackGroup : entry.kind === "state" ? stateGroup : throwGroup).append(new Option(label, entry.key));
  }
  moveSelect.append(stateGroup, throwGroup, attackGroup); moveSelect.value = new URLSearchParams(location.search).get('move') || (data.radiantDiveFamily ? "attack:radiant_dive_heavy" : "attack:heaven_splitter_heavy");
  document.querySelector("#questions")!.innerHTML = [
    "A. Motion — does Radiant Dive read as chamber → one descending palm → gather → connected landing at 1× and 0.5×?",
    "B. Hit clarity — one near-arm palm strike only. No disconnected late kick, repeated contact or damaging landing burst.",
    "C. Timing — Radiant comparison uses a labeled reference height. Gameplay flight length depends on actual entry height; landing recovery starts at floor contact, not an arbitrary fixed tick.",
    "D. Scale/style — does Lamuh stay adult-proportioned with beard, locs, white/gold coat, cyan/gold aura, and no purple outline through every pose?",
    "E. Gameplay — test jump → air-special, low/high entry, stand/crouch block, far whiff, landing punishment, and mirrored facing. No invulnerability or repeat-dive refund.",
    "F. Scope — Celestial Palm and Heaven Splitter passed their family reviews; Radiant Dive is pending. Forward L/M/H, Turn/Facing, and Pushbox remain starred; nothing is production-promoted."
  ].map((question) => `<li>${question}</li>`).join("");

  let cursor = 0, halfAccumulator = 0, renderSerial = 0;
  let playing = true, speed: 1 | .5 = 1, facing: 1 | -1 = 1;
  const checked = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)!.checked;
  const selectedEntry = () => entries.find((entry) => entry.key === moveSelect.value) || entries[0];
  const selectedCandidate = () => candidateSelect.value as CandidateId;
  const selectedImpact = () => impactSelect.value as ImpactId;
  const v2Timeline = (entry: ReviewEntry, candidate: CandidateId): ReviewTimeline => {
    if (entry.throwSequence) return { label: "AUTHORED_GAMEPLAY_ALIGNED", durationTicks: entry.throwSequence.totalTicks, exposureTicks: entry.throwSequence.exposureTicks };
    return closureFor(entry.moveId)?.timingCandidates[candidate] || (entry.timingMove ? entry.timingMove.candidates[candidate] : entry.comparisonClip!.v2Candidate);
  };
  const v1Duration = (entry: ReviewEntry) => entry.v1Historical?.durationTicks || 0;
  const readable = (value: string) => value.toLowerCase().replaceAll("_", " ");
  const statusSummary = (value: string) => value === "awaiting_human_turn_facing_and_combined_transition_review"
    ? "review open · turn / facing / combined transitions"
    : value === "awaiting_human_dash_air_dash_standing_block_crouch_jump_grab_throw_and_combined_movement_review"
    ? "review open · dash / air dash / standing block / combined movement"
    : value === "awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review"
      ? "review open · crouch / jump / grab / throws / movement"
    : value === "awaiting_human_standard_grab_forward_throw_back_throw_review"
      ? "review open · standard grab / forward throw / back throw"
      : value === "awaiting_human_ascend_step_light_medium_heavy_family_review"
        ? "review open · Ascend Step L / M / H family / timing / side switch / combat"
      : value === "awaiting_human_ascend_step_medium_slide_back_handspring_launcher_review"
        ? "review open · Ascend Step Medium slide / back-handspring / launcher"
      : value === "awaiting_human_ascend_step_medium_targeted_motion_repair_review"
        ? "review open · Ascend Step Medium targeted motion repair"
      : readable(value);
  function syncControls() {
    const entry = selectedEntry(), closure = closureFor(entry.moveId), candidates = closure?.timingCandidates || entry.timingMove?.candidates;
    const selected = (candidateSelect.value || "B") as CandidateId;
    candidateSelect.replaceChildren(...(entry.throwSequence
      ? [new Option(`AUTHORED · gameplay-aligned · ${entry.throwSequence.totalTicks} ticks`, "B", true, true)]
      : (["A", "B", "C"] as CandidateId[]).map((id) => new Option(candidates ? `${id} · ${readable(candidates[id].label)} · ${candidates[id].durationTicks} ticks` : `${id} · unavailable`, id, false, id === selected))));
    candidateSelect.value = entry.throwSequence ? "B" : (["A", "B", "C"].includes(selected) ? selected : "B");
    candidateSelect.disabled = entry.kind !== "attack";
    const selectedImpactId = (impactSelect.value || closure?.recommendedImpactCandidate || "I2") as ImpactId;
    impactSelect.replaceChildren(...(["I1", "I2", "I3"] as ImpactId[]).map((id) => new Option(closure ? `${id} · ${readable(closure.impactCandidates[id].label)} · ${closure.impactCandidates[id].hitstopTicks} hitstop` : `${id} · n/a`, id, false, id === selectedImpactId)));
    impactSelect.value = selectedImpactId;
    impactSelect.disabled = !closure;
    const isThrow = !!entry.throwSequence, isMissingV1State = entry.kind === "state" && !entry.v1Historical, isAscendStepEntry = entry.moveId.startsWith("ascend_step"), isMediumAscendStep = entry.moveId === "ascend_step", isHeavyAscendStep = entry.moveId === "ascend_step_heavy";
    document.querySelector<HTMLElement>("#v1Title")!.textContent = isThrow || isMissingV1State || isHeavyAscendStep ? "LAMUH V1 LEGACY · required state was missing" : isAscendStepEntry ? "LAMUH V1 LEGACY · protected two-beat family source (rejected for V2)" : "LAMUH V1 LEGACY · exact protected art";
    document.querySelector<HTMLElement>("#v2Title")!.textContent = isThrow ? "LAMUH V2 REBUILD · dedicated throw candidate" : isMissingV1State ? "LAMUH V2 REBUILD · dedicated turn/facing candidate" : isHeavyAscendStep ? "LAMUH V2 REBUILD · Heavy behind-switch growing blast" : isMediumAscendStep ? "LAMUH V2 REBUILD · Medium slide / back-handspring launcher" : isAscendStepEntry ? "LAMUH V2 REBUILD · Light movement-first dash punch" : "LAMUH V2 REBUILD · distinct normalized candidate";
    if (entry.throwSequence) {
      const sequence = entry.throwSequence;
      document.querySelector<HTMLElement>("#styleTitle")!.textContent = "Dedicated standard-grab / throw frame scrub";
      document.querySelector<HTMLElement>("#styleIntro")!.textContent = "All three throw sequences are new V2 missing-state authoring. Their motion, standard-humanoid interaction, and neutral-return gate passed; the artwork remains candidate-only and is not runtime-promoted.";
      document.querySelector<HTMLImageElement>("#styleImage")!.src = data.throwAnimations.contactSheetPublicPath;
      document.querySelector<HTMLElement>("#styleCaption")!.textContent = "18 DEDICATED FRAMES · FIXED ROOT · CANDIDATE ONLY · NOT DEPLOYABLE";
      const decision = data.throwAnimations.humanApproval[sequence.id === "universal_grab_attempt" ? "standardGrab" : sequence.id === "forward_throw" ? "forwardThrow" : "backThrow"];
      document.querySelector<HTMLElement>("#styleFacts")!.innerHTML = datum("throw decision", decision || statusSummary(data.throwAnimations.status)) + datum("selected sequence", `${sequence.frames.length} distinct frames`) + datum("fixed root", `${data.throwAnimations.root.x}, ${data.throwAnimations.root.y}`) + datum("connect / release", `tick ${sequence.connectTick} / ${sequence.releaseTick === null ? "n/a" : `tick ${sequence.releaseTick}`}`) + datum("promotion", data.throwAnimations.deployable ? "allowed" : "blocked");
      document.querySelector<HTMLElement>("#styleDebt")!.textContent = `Standard-height victim class only · global victim scale ${data.throwAnimations.globalVictimScale ? "enabled" : "disabled"} · deterministic victim track remains review-only in the sandbox.`;
    } else if (movementStates[entry.moveId]) {
      const movementState = movementStates[entry.moveId], crouchJump = data.movementModernization.crouchJumpModernization, crouchingBlock = data.movementModernization.crouchingBlockModernization, jumpRepair = data.movementModernization.jumpAdultProportionRepair, dashBlock = data.movementModernization.dashBlockModernization, backwardRepair = data.movementModernization.backwardMotionRepair, walkBackVideo = data.movementModernization.walkBackVideoRebuild, turnFacing = data.movementModernization.turnFacingModernization;
      const isTurnFacing = entry.moveId === "turn_facing" && !!turnFacing;
      const isCrouchingBlock = entry.moveId === "crouching_block" && !!crouchingBlock;
      const isJumpRepair = entry.moveId === "jump" && !!jumpRepair;
      const isCrouchRelease = entry.moveId === "crouch_to_stand" && !!crouchJump;
      const isCrouchJump = (entry.moveId === "crouch" || entry.moveId === "jump" || isCrouchRelease) && !!crouchJump && !isJumpRepair;
      const isDashBlock = !!dashBlock && ["dash_forward", "dash_backward", "air_dash_forward", "air_dash_backward", "standing_block"].includes(entry.moveId);
      const isWalkBackVideo = !!walkBackVideo && entry.moveId === "walk_backward";
      const isBackwardRepair = !!backwardRepair && entry.moveId === "dash_backward";
      document.querySelector<HTMLElement>("#styleTitle")!.textContent = isTurnFacing ? `${turnFacing!.starredForRevisit ? "★ " : ""}Dedicated Turn / Facing transition frame scrub` : isCrouchingBlock ? "Modern adult-proportion Crouching Block frame scrub" : isJumpRepair ? "Adult-proportion Jump identity repair" : isCrouchRelease ? "Live crouch-to-stand transition frame scrub" : isWalkBackVideo ? "Video-derived Walk Back frame scrub" : isBackwardRepair ? "Back Dash directional-motion repair" : isDashBlock ? "Modern dash + standing block fixed-scale frame scrub" : isCrouchJump ? "Modern crouch + jump fixed-scale frame scrub" : "Modern movement fixed-scale candidate";
      document.querySelector<HTMLElement>("#styleIntro")!.textContent = isTurnFacing
        ? "No dedicated V1 turn clip was recoverable. This explicit V2 missing-state sequence keeps gameplay facing immediate while showing a twelve-tick, fixed-root pivot that every normal movement or attack input can interrupt."
        : isWalkBackVideo
        ? "These seven poses come directly from the supplied forward-walk video and play in reverse chronological order for retreat. Generated Walk Back artwork is superseded; the fixed root and 18-tick simulation contract remain unchanged."
        : isBackwardRepair
        ? "Lamuh remains right-facing while his feet, hips, recoil, and landing now visibly carry him left. The original 18-tick Walk Back and 20-tick Back Dash simulation contracts are unchanged."
        : isCrouchingBlock
        ? "The four legacy low-guard beats are preserved with Lamuh's mature boxed beard, adult skeletal scale, modern outline-free rendering, and a stable final guard hold. Blocking remains simulation-owned."
        : isJumpRepair
        ? "The same seven-pose takeoff, tuck, apex, fall, landing, and recovery arc is preserved. The repaired art uses Idle's adult body scale and beard identity while jump travel remains simulation-owned."
        : isCrouchRelease
        ? "The existing modern Crouch rising connector and standing recovery frames now run through an eight-tick simulation-owned phase. Attacks and every movement/defense action can interrupt the presentation immediately."
        : isDashBlock
        ? "Each selected sequence is shown from a numbered contact sheet with one authored scale and root. Dash travel, air-dash travel, collision, and defense state remain simulation-owned."
        : isCrouchJump
          ? "The contact sheet uses one fixed display scale and root, so crouch compression and jump tuck remain visible without hiding anatomy-size drift."
          : "Movement candidates share the modern outline-free style and deterministic simulation-owned travel contract.";
      document.querySelector<HTMLImageElement>("#styleImage")!.src = isTurnFacing ? turnFacing!.contactSheetPublicPath : isCrouchingBlock ? crouchingBlock!.contactSheetPublicPath : isJumpRepair ? jumpRepair!.contactSheetPublicPath : isWalkBackVideo ? walkBackVideo!.contactSheetPublicPath : isBackwardRepair ? backwardRepair!.contactSheetPublicPaths.dash_backward : isDashBlock ? dashBlock!.contactSheetPublicPaths[entry.moveId as keyof typeof dashBlock.contactSheetPublicPaths] : isCrouchJump ? crouchJump!.contactSheetPublicPath : style.publicPath;
      document.querySelector<HTMLElement>("#styleCaption")!.textContent = isTurnFacing ? `${turnFacing!.starredForRevisit ? "★ CURRENT BASELINE · REVISIT" : "AWAITING REVIEW"} · 4 DISTINCT FRAMES · 12 INTERRUPTIBLE TICKS` : isCrouchingBlock ? "4 ADULT-PROPORTION CROUCH BLOCK FRAMES · 16 TICKS · CANDIDATE ONLY" : isJumpRepair ? "7 ADULT-PROPORTION JUMP FRAMES · TIMING / PHYSICS UNCHANGED" : isCrouchRelease ? "2 REUSED MODERN CROUCH FRAMES · 8 INTERRUPTIBLE TICKS · CANDIDATE ONLY" : isWalkBackVideo ? "7 USER-VIDEO WALK BACK FRAMES · REVERSED SOURCE CYCLE · 18 TICKS" : isBackwardRepair ? "5 DISTINCT BACK DASH FRAMES · FIXED ROOT · TIMING UNCHANGED" : isDashBlock ? "26 DISTINCT DASH / AIR-DASH / BLOCK FRAMES · FIXED ROOT · CANDIDATE ONLY" : isCrouchJump ? "13 DISTINCT CROUCH/JUMP FRAMES · FIXED ROOT · CANDIDATE ONLY" : "MODERN MOVEMENT CANDIDATE · NOT DEPLOYABLE";
      document.querySelector<HTMLElement>("#styleFacts")!.innerHTML = datum(isTurnFacing ? "turn decision" : "movement status", isTurnFacing ? turnFacing!.humanApproval || "UNSET" : statusSummary(data.movementModernization.status)) + datum("selected sequence", `${movementState.frames.length} distinct frames`) + datum("fixed root", `${data.movementModernization.root.x}, ${data.movementModernization.root.y}`) + datum("runtime rescale", data.movementModernization.perFrameRescale ? "enabled" : "disabled") + datum("promotion", data.movementModernization.deployable ? "allowed" : "blocked");
      document.querySelector<HTMLElement>("#styleDebt")!.textContent = isTurnFacing
        ? `${turnFacing!.sourceRepairReason} ${turnFacing!.starredForRevisit ? "Passed for the current baseline with polish debt; ★ revisit remains open. No runtime promotion was authorized." : "Turn motion and combined-transition approval remain unset."}`
        : isCrouchingBlock
        ? `${crouchingBlock!.sourceRepairReason} Beard, adult proportion, guard motion, and transition approval remain unset.`
        : isJumpRepair
        ? `${jumpRepair!.sourceRepairReason} Adult identity, jump motion, and transition approval remain unset.`
        : isCrouchRelease
        ? "No V1 dedicated release clip exists. This preserve-first candidate reuses approved modern frames; transition approval remains unset."
        : isWalkBackVideo
        ? `${walkBackVideo!.supersedes} Walk Back motion and transition approval remain unset.`
        : isBackwardRepair
        ? `${backwardRepair!.sourceRepairReason} Walk Back, Back Dash, and transition approval remain unset.`
        : isDashBlock
        ? `${dashBlock!.sourceRepairReason} Dash, air-dash, standing-block, and combined-transition approval remain unset.`
        : isCrouchJump
          ? `${crouchJump!.sourceRepairReason} Crouch, jump, landing and transition approval remain unset.`
          : "Movement motion, scale and combined transition approval remain unset.";
    } else {
      const factsClosure = closure || data.standingHeavyClosure;
      const isAscendStep = entry.moveId.startsWith("ascend_step") && !!data.ascendStepFamily;
      const isMedium = entry.moveId === "ascend_step";
      const isHeavy = entry.moveId === "ascend_step_heavy";
      document.querySelector<HTMLElement>("#styleTitle")!.textContent = isHeavy ? "Ascend Step Heavy pause + growing-blast frame scrub" : isMedium ? "Ascend Step Medium slide + back-handspring launcher frame scrub" : isAscendStep ? "Ascend Step Light exact-cutout dash frame scrub" : style.title;
      document.querySelector<HTMLElement>("#styleIntro")!.textContent = isHeavy
        ? "Heavy is new V2 missing-state authoring: a cyan/gold approach dash, one deterministic target-relative side switch behind the opponent, a brief pause, a visibly growing energy ball, then one complete rear palm blast. The victim is never translated by the switch, and no damage occurs before the blast."
        : isMedium
        ? "Medium is a single continuous traveling action: a forward low slide heel contact flows through a distinct retraction/coil, two clearly planted hands, shoulders and hips passing over that pivot, then one asymmetric rising-heel launcher while the other leg remains bent for counterbalance. Distinct follow-through art gathers the legs before the controlled landing. Simulation-owned root segments travel forward for the slide, then redirect backward through the handspring; the renderer does not drive gameplay. Its two visible contacts register exactly two deterministic gameplay hits, and the victim is never teleported."
        : isAscendStep
        ? "Light preserves the approved six-frame adult-proportion movement-first dash-punch arc built from exact Lamuh gameplay body frames plus isolated VFX-only aura layers."
        : "The approved checkpoint remains unchanged and hash-bound. Rebuilt sequences extend that direction, but motion, timing, impact and gameplay feel still require review.";
      document.querySelector<HTMLImageElement>("#styleImage")!.src = isHeavy ? "/lamuh-legacy-v2/ascend-step-heavy-v1/ascend-step-heavy-numbered-contact-sheet.png" : isMedium ? "/lamuh-legacy-v2/ascend-step-medium-slide-flip-v1/ascend-step-medium-slide-flip-numbered-contact-sheet.png" : isAscendStep ? "/lamuh-legacy-v2/ascend-step-v2/ascend-step-dash-punch-numbered-contact-sheet.png" : style.publicPath;
      document.querySelector<HTMLElement>("#styleCaption")!.textContent = isHeavy ? "10 FRAMES · DASH → BEHIND-SWITCH → PAUSE → GROW → ONE BLAST · NO VICTIM TELEPORT" : isMedium ? "16 FRAMES · TRAVELING SLIDE → COIL → HAND PLANT → ONE RISING-HEEL CONTACT → AUTHORED TUCK → CONTROLLED LANDING" : isAscendStep ? "6 EXACT-CUTOUT DASH-PUNCH FRAMES · COMPLETE OPAQUE LIMBS · ONE CONTACT" : "APPROVED STYLE DIRECTION · CANDIDATE SEQUENCES · NOT DEPLOYABLE";
      const actionLabel = isHeavy ? "dash + side switch + pause + growing ball + one blast" : isMedium ? "traveling slide + coil + one rising-heel handspring launcher" : "one dash + one punch";
      document.querySelector<HTMLElement>("#styleFacts")!.innerHTML = datum("style status", style.humanReviewStatus || "UNSET") + datum("selected sequence", `${factsClosure.v2.frames.length} distinct frames`) + datum("single runtime scale", "yes") + (isAscendStep ? datum("action contract", factsClosure.v2.singleActionContract?.oneContinuousPhysicalAction ? actionLabel : "FAILED") + datum("adult / chibi gate", factsClosure.identityLock?.noChibiProportions ? "adult locked / chibi rejected" : "FAILED") : "") + datum("visible impacts / hits", `${factsClosure.v2.visibleImpactCount} / ${factsClosure.v2.gameplayHitCount}`) + datum("promotion", factsClosure.deployable ? "allowed" : "blocked");
      document.querySelector<HTMLElement>("#styleDebt")!.textContent = isAscendStep ? `${factsClosure.rejectedCandidate ? `Prior candidate: ${factsClosure.rejectedCandidate.decision}. ` : ""}${isMedium ? "Deliberate root travel, authored slide-to-coil connector, asymmetric single-leg launcher, post-contact tuck, controlled landing, and two-hit parity pass internal checks" : "Exact-cutout, adult-proportion, and one-hit internal audits pass"}; human approval remains required. ${isHeavy ? "Heavy pause/growth rhythm, target-side-switch behavior, corner fallback, timing, and combat profile remain unapproved." : isMedium ? "Judge the Medium repair primarily at 1×; motion continuity, root path, two-contact clarity, timing, launcher feel, landing, transitions, and combat profile remain unapproved." : "Dash feel, timing, transitions, and combat profile remain unapproved."}` : `Contact presentation: ${factsClosure.v2.contactPresentation.separationStatus}. ${style.knownDebt.join(" · ")}`;
      if(entry.moveId.startsWith("celestial_palm")){
        document.querySelector<HTMLElement>("#styleTitle")!.textContent="Celestial Palm neutral family · single projectile release";
        document.querySelector<HTMLElement>("#styleIntro")!.textContent="Body-only animation. The gold marker is RELEASE, not an impact. Gameplay collision decides whether the traveling orb hits. Light/Medium share the straight-palm legacy action; Heavy adds a braced load and recoil. A/C are visual candidates; B is gameplay-aligned.";
        document.querySelector<HTMLImageElement>("#styleImage")!.src=data.celestialPalmFamily.contactSheets[entry.moveId.endsWith("heavy")?1:0];
        document.querySelector<HTMLElement>("#styleDebt")!.textContent="✓ Celestial Palm L/M/H passed the current-family review. Accepted frames and B profiles are hash-bound; no art/roster promotion or final character approval. ★ Forward specials retain polish debt.";
      } else if(entry.moveId.startsWith('heaven_splitter')) {
        document.querySelector<HTMLElement>('#styleTitle')!.textContent='Heaven Splitter · one rising uppercut';
        document.querySelector<HTMLElement>('#styleIntro')!.textContent='Adult V2 near-arm uppercut modernizes the legacy rising arc. One anatomical scale; torso/waist registration for air poses. B follows simulation-owned rise, descent and landing. The left preserves legacy scale defects for honest comparison.';
        document.querySelector<HTMLImageElement>('#styleImage')!.src=data.heavenSplitterFamily.contactSheets[entry.moveId.endsWith('heavy')?1:0];
        document.querySelector<HTMLElement>('#styleCaption')!.textContent=entry.moveId.endsWith('heavy')?'HEAVY V2:14 active body poses, separate heavy windup/extension/landing. One hit,53ticks. Cinematic backdrop and confirmed-hit impulse live in sandbox.':'SOURCE AUDIT: generated0/11 and redundant4 excluded; approved idle starts/ends active11-frame clips. Body-only frames; ki arc lives separately in the sandbox.';
        document.querySelector<HTMLElement>('#styleDebt')!.textContent='✓ PASSED: Heaven L/M/H and Heavy V4 surrounding-aura source frames plus B profiles are hash-bound. This scoped pass does not promote the character, roster or final balance.';
      } else if(entry.moveId.startsWith('radiant_dive')) {
        document.querySelector<HTMLElement>('#styleTitle')!.textContent='Radiant Dive · one descending palm';
        document.querySelector<HTMLElement>('#styleIntro')!.textContent='L shallow / M diagonal / H steep. Same near arm drives one strike then retracts into an airborne gather. Heavy surrounds the body in authored cyan/gold aura. The comparison uses a measured 180-unit entry-height reference sample; actual sandbox duration varies with jump height. Landing recovery begins only on the real floor.';
        document.querySelector<HTMLImageElement>('#styleImage')!.src=data.radiantDiveFamily!.contactSheets[0];
        document.querySelector<HTMLElement>('#styleCaption')!.textContent='CANDIDATE · STAGE-DRIVEN FLIGHT + FLOOR-TRIGGERED LANDING · ONE HIT';
        document.querySelector<HTMLElement>('#styleDebt')!.textContent='PENDING: adult proportions, continuous near-arm strike, Heavy aura, dive angles and physical gather-to-landing. V1 exact per-pose exposure is unrecoverable; its disconnected late kick is retired.';
      } else if(isAscendStep)document.querySelector<HTMLElement>("#styleDebt")!.textContent="★ PASSED FOR NOW · STARRED FOR POLISH. Medium rising-heel contact height and support/landing registration remain noted. No final balance or production approval.";
    }
  }
  function adjustedExposures(closure: AnimationClosure, candidate: CandidateId, impactId: ImpactId) {
    const result = [...closure.timingCandidates[candidate].exposureTicks], impact = closure.impactCandidates[impactId], contact = closure.v2.contactFrame, recoil = Math.min(result.length - 1, contact + 2), recovery = result.length - 1;
    result[contact] += impact.contactExposureDelta; result[recoil] += impact.recoilExposureDelta; result[recovery] += impact.recoveryExposureDelta; return result;
  }
  function drawBodyPath(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, root: { x: number; y: number }, screenRoot: { x: number; y: number }, scale: number) {
    if (!checked("centerOverlay")) return;
    context.save(); context.strokeStyle = "rgba(117,211,155,.58)"; context.lineWidth = 2; context.setLineDash([4, 4]); context.beginPath();
    points.forEach((point, index) => { const x = screenRoot.x + facing * (point.x - root.x) * scale, y = screenRoot.y + (point.y - root.y) * scale; if (index) context.lineTo(x, y); else context.moveTo(x, y); }); context.stroke(); context.restore();
  }
  function drawWorldRootPath(context: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, screenRoot: { x: number; y: number }) {
    if (!checked("centerOverlay")) return;
    context.save(); context.strokeStyle = "rgba(255,224,138,.82)"; context.lineWidth = 3; context.setLineDash([7, 5]); context.beginPath();
    points.forEach((point, index) => { const x = screenRoot.x + facing * point.x * 1.3, y = screenRoot.y + point.y * 1.3; if (index) context.lineTo(x, y); else context.moveTo(x, y); }); context.stroke(); context.restore();
  }

  async function renderPanel(canvasId: string, entry: ReviewEntry, candidate: CandidateId, v1: boolean, serial: number) {
    const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId}`)!, context = canvas.getContext("2d")!;
    // The height-180 air-special reference needs headroom, never a smaller fighter.
    const panelHeight=entry.moveId.startsWith('radiant_dive')?620:500;
    if(canvas.height!==panelHeight)canvas.height=panelHeight;
    const closure = closureFor(entry.moveId), movementState = !v1 ? movementStates[entry.moveId] : undefined, throwSequence = entry.throwSequence, impactId = selectedImpact();
    const missingV1Throw = v1 && !!throwSequence, missingV1State = v1 && entry.kind === "state" && !entry.v1Historical, missingV1Attack = v1 && !!closure && closure.v1.sourceFrameCount === 0;
    const missingV1 = missingV1Throw || missingV1State || missingV1Attack;
    const timeline = v1 ? entry.v1Historical : v2Timeline(entry, candidate);
    const exposures = closure && !v1 ? adjustedExposures(closure, candidate, impactId) : timeline?.exposureTicks || [];
    const localTick = timeline ? Math.min(cursor, timeline.durationTicks - 1) : 0, frame = exposures.length ? exposureFrame(exposures, localTick) : 0, row = spriteRows[entry.moveId];
    const screenRoot = { x: 270, y: canvas.height - 34 }, silhouette = checked("silhouette");
    drawReviewBackdrop(context, canvas.width, canvas.height, missingV1Throw ? "Protected V1 audit · universal throw state absent" : missingV1State ? "Protected V1 audit · turn/facing state absent" : missingV1Attack ? "Protected V1 audit · Heavy family variant absent" : v1 ? "Protected V1 · reconstructed pose holds" : throwSequence ? "V2 authored throw · deterministic timing" : `V2 ${candidate}${closure ? ` · impact ${impactId}` : ""}`);
    if (missingV1) {
      context.fillStyle = "rgba(255,224,138,.10)"; context.fillRect(72, 126, canvas.width - 144, 214);
      context.strokeStyle = "rgba(255,224,138,.45)"; context.setLineDash([8, 6]); context.strokeRect(72, 126, canvas.width - 144, 214); context.setLineDash([]);
      context.fillStyle = "#ffe08a"; context.textAlign = "center"; context.font = "700 22px system-ui"; context.fillText("NO RECOVERABLE V1", canvas.width / 2, 210); context.fillText(missingV1Attack ? "ASCEND STEP HEAVY VARIANT" : missingV1State ? "TURN / FACING CLIP" : "UNIVERSAL-THROW ART", canvas.width / 2, 244);
      context.fillStyle = "#aeb8c7"; context.font = "14px system-ui"; context.fillText("V2 is explicit missing-state authoring", canvas.width / 2, 286); context.textAlign = "start";
    } else if (throwSequence && !v1) {
      const record = throwSequence.frames[frame];
      await drawStandaloneFrame(context, record.publicPath, record.root, data.throwAnimations.canvas, screenRoot.x, screenRoot.y, .30, facing, 1, silhouette);
      if (serial !== renderSerial) return;
      drawBodyPath(context, throwSequence.frames.map((item) => item.bodyCenter), data.throwAnimations.root, screenRoot, .30);
      drawAuthoredOverlay(context, screenRoot, record.root, .30, facing, record.bodyCenter, record.visibleBounds, { root: checked("rootOverlay"), bodyCenter: checked("centerOverlay"), bounds: checked("boundsOverlay") });
    } else if (closure && !v1) {
      const record = closure.v2.frames[frame], source = (!checked('vfxToggle')||silhouette)&&record.bodyOnlyPublicPath?record.bodyOnlyPublicPath:frame === closure.v2.contactFrame && closure.v2.contactPresentation.vfxEnabled !== false && checked("vfxToggle") ? closure.v2.contactPresentation.publicPath : record.publicPath;
      const sampleTick=Math.max(0,localTick-(closure.timingCandidates[candidate].phaseTicks.startup-closure.timingCandidates.B.phaseTicks.startup));
      const authoredOffset = entry.moveId.startsWith('heaven_splitter') || entry.moveId.startsWith('radiant_dive') ? closure.v2.authoredWorldRootPath?.[Math.min(sampleTick,closure.v2.authoredWorldRootPath.length-1)] || {x:0,y:0} : record.authoredWorldRootOffset || { x: 0, y: 0 };
      const presentationRoot = { x: screenRoot.x + facing * authoredOffset.x * 1.3, y: screenRoot.y + authoredOffset.y * 1.3 };
      if(entry.moveId.startsWith('heaven_splitter')&&checked('vfxToggle')&&!silhouette&&!record.auraBaked){
        // Review-only presentation sample: no simulated collision/contact is invented.
        const previewFighter={kind:'lamuh_legacy_v2',currentAttack:('legacy_'+entry.moveId) as AttackId,phaseTick:sampleTick,attackFacing:facing} as FighterState;
        drawHeavenArc(context,previewFighter,presentationRoot.x,presentationRoot.y);
      }
      await drawStandaloneFrame(context, source, record.root, closure.v2.canvas, presentationRoot.x, presentationRoot.y, .30, facing, 1, silhouette);
      if (serial !== renderSerial) return;
      if (closure.v2.authoredWorldRootPath) drawWorldRootPath(context, closure.v2.authoredWorldRootPath, screenRoot);
      else drawBodyPath(context, closure.v2.frames.map((item) => item.bodyCenter), closure.v2.root, screenRoot, .30);
      drawAuthoredOverlay(context, presentationRoot, record.root, .30, facing, record.bodyCenter, record.visibleBounds, { root: checked("rootOverlay"), bodyCenter: checked("centerOverlay"), bounds: checked("boundsOverlay") });
    } else if (movementState) {
      const record = movementState.frames[Math.min(frame, movementState.frames.length - 1)];
      await drawStandaloneFrame(context, record.publicPath, record.root, data.movementModernization.canvas, screenRoot.x, screenRoot.y, .30, facing, 1, silhouette);
      if (serial !== renderSerial) return;
      drawBodyPath(context, movementState.frames.map((item) => item.bodyCenter), data.movementModernization.root, screenRoot, .30);
      drawAuthoredOverlay(context, screenRoot, record.root, .30, facing, record.bodyCenter, record.visibleBounds, { root: checked("rootOverlay"), bodyCenter: checked("centerOverlay"), bounds: checked("boundsOverlay") });
    } else if (row) {
      await loadPresentationImage(row.atlas, v1 ? "legacy" : "v2_dark_ink"); if (serial !== renderSerial) return;
      context.save(); if (silhouette) context.filter = "brightness(0) invert(1)"; await drawAtlasFrame(context, row, frame, screenRoot.x, screenRoot.y, .86, facing, 0, 1, v1 ? "legacy" : "v2_dark_ink"); context.restore();
      if (closure) { drawBodyPath(context, closure.v1.bodyCenters, closure.v1.root, screenRoot, .86); drawAuthoredOverlay(context, screenRoot, closure.v1.root, .86, facing, closure.v1.bodyCenters[frame], closure.v1.visibleBounds[frame], { root: checked("rootOverlay"), bodyCenter: checked("centerOverlay"), bounds: checked("boundsOverlay") }); }
    }
    const contactFrames = closure?.v2.contactFrames || (closure ? [closure.v2.contactFrame] : []);
    const contactTicks = closure && !v1 ? contactFrames.map((contactFrame) => exposures.slice(0, contactFrame).reduce((sum, value) => sum + value, 0)) : [];
    if (closure && !v1 && contactFrames.includes(frame)) { context.strokeStyle = "#ffe08a"; context.lineWidth = 4; context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12); context.fillStyle = "#ffe08a"; context.font = "700 16px system-ui"; context.fillText(`${entry.moveId.startsWith('celestial_palm')?'RELEASE':'CONTACT'} ${contactFrames.indexOf(frame) + 1}/${contactFrames.length}`, canvas.width - 142, 28); }
    const throwConnectFrame = throwSequence ? exposureFrame(throwSequence.exposureTicks, throwSequence.connectTick) : -1;
    const throwReleaseFrame = throwSequence?.releaseTick === null || throwSequence?.releaseTick === undefined ? -1 : exposureFrame(throwSequence.exposureTicks, throwSequence.releaseTick);
    if (throwSequence && !v1 && (frame === throwConnectFrame || frame === throwReleaseFrame)) {
      const label = frame === throwReleaseFrame ? throwSequence.id === "back_throw" ? "RELEASE / SIDE SWITCH" : "FORWARD RELEASE" : "GRAB CONNECT WINDOW";
      context.strokeStyle = frame === throwReleaseFrame ? "#75d39b" : "#ffe08a"; context.lineWidth = 4; context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12); context.fillStyle = context.strokeStyle; context.font = "700 15px system-ui"; context.fillText(label, canvas.width - 205, 28);
    }
    const hitstop = closure && !v1 ? closure.impactCandidates[impactId].hitstopTicks : "n/a", effectiveHold = closure && !v1 ? exposures[closure.v2.contactFrame] + Number(hitstop) : "unknown";
    const frameCount = missingV1 ? 0 : throwSequence && !v1 ? throwSequence.frames.length : closure && !v1 ? closure.v2.frames.length : movementState ? movementState.frames.length : row?.frames || 0;
    const artSource = missingV1 ? "missing-state source audit" : throwSequence && !v1 ? throwSequence.frames[frame].sha256.slice(0, 12) : closure && !v1 ? closure.v2.frames[frame].sha256.slice(0, 12) : movementState ? movementState.frames[Math.min(frame, movementState.frames.length - 1)].sha256.slice(0, 12) : row ? `${row.sourceName} atlas` : "unavailable";
    const duration = timeline ? `${timeline.durationTicks} ticks · ${(timeline.durationTicks / 60).toFixed(3)} s` : "not authored in V1";
    const eventData = missingV1 ? "no V1 event data" : throwSequence && !v1 ? `connect tick ${throwSequence.connectTick}${throwSequence.releaseTick === null ? " · no release" : ` · release tick ${throwSequence.releaseTick}`}` : v1 ? "not exactly recoverable" : contactTicks.map((tick) => `tick ${tick}`).join(" · ");
    const authoredWorldRootPath = closure && !v1 ? closure.v2.authoredWorldRootPath : undefined;
    const rootData = missingV1 ? "not authored" : throwSequence && !v1 ? `fixed ${data.throwAnimations.root.x}, ${data.throwAnimations.root.y} · body path overlay` : authoredWorldRootPath ? `world Δx ${Math.min(...authoredWorldRootPath.map((point) => point.x))} → ${Math.max(...authoredWorldRootPath.map((point) => point.x))} → ${authoredWorldRootPath.at(-1)!.x} · simulation-owned` : closure && !v1 ? `fixed ${closure.v2.root.x}, ${closure.v2.root.y} · body path overlay` : closure ? `${closure.v1.root.x}, ${closure.v1.root.y} · reconstructed path` : movementState ? `fixed ${data.movementModernization.root.x}, ${data.movementModernization.root.y} · body path overlay` : "legacy bottom-center";
    const role = throwSequence && !v1 ? readable(throwSequence.frames[frame].role) : missingV1 ? "required state absent" : movementState ? readable(movementState.frames[Math.min(frame, movementState.frames.length - 1)].role) : "n/a";
    const evidence = missingV1Attack ? "NO RECOVERABLE V1 ASCEND STEP HEAVY VARIANT" : missingV1State ? "NO RECOVERABLE V1 TURN / FACING SOURCE" : missingV1Throw ? "NO RECOVERABLE V1 UNIVERSAL THROW SOURCE" : throwSequence && !v1 ? "dedicated V2 missing-state art · deterministic simulation timing" : v1 ? entry.v1Historical?.exposureEvidence || "not recoverable" : "simulation timing · candidate presentation";
    document.querySelector<HTMLElement>(v1 ? "#v1data" : "#v2data")!.innerHTML = datum("duration", duration) + datum("source frame", frameCount ? `${frame + 1} / ${frameCount}` : "0 / 0") + datum("contact / release", eventData) + datum("recovery endpoint", timeline ? `tick ${timeline.durationTicks - 1}` : "not applicable") + datum("exposures", exposures.length ? exposures.join(" · ") : "none") + datum("frame role", role) + datum("root / path", rootData) + datum("hitstop / selected contact hold", `${hitstop}${closure && !v1 ? ` / ${effectiveHold} ticks` : ""}`) + datum("art source", artSource) + datum("evidence", evidence);
  }

  async function render() {
    const serial = ++renderSerial, entry = selectedEntry(), candidate = selectedCandidate();
    await Promise.all([renderPanel("v1", entry, "A", true, serial), renderPanel("v2", entry, candidate, false, serial)]);
    const v2 = v2Timeline(entry, candidate), max = Math.max(v1Duration(entry), v2.durationTicks);
    document.querySelector<HTMLElement>("#progress")!.style.width = `${Math.min(100, (cursor / Math.max(1, max - 1)) * 100)}%`;
    const v1Summary = entry.v1Historical ? `${entry.v1Historical.durationTicks} ticks${entry.v1Historical.exposureEvidence.includes("RECONSTRUCTION") ? " (reconstructed holds)" : ""}` : "N/A · required state absent";
    const v2Summary = entry.throwSequence ? `AUTHORED ${v2.durationTicks} ticks` : `${candidate} ${v2.durationTicks} ticks`;
    document.querySelector<HTMLElement>("#summary")!.textContent = `Review tick ${cursor} · V1 ${v1Summary} · V2 ${v2Summary} · ${entry.note || "source order preserved"}`;
  }
  function restart() { cursor = 0; render(); }
  function setSpeed(next: 1 | .5) { speed = next; document.querySelector("#speed1")!.classList.toggle("active", speed === 1); document.querySelector("#speedHalf")!.classList.toggle("active", speed === .5); }
  document.querySelector("#play")!.addEventListener("click", () => { playing = !playing; document.querySelector("#play")!.textContent = playing ? "Pause" : "Play"; });
  document.querySelector("#speed1")!.addEventListener("click", () => setSpeed(1)); document.querySelector("#speedHalf")!.addEventListener("click", () => setSpeed(.5));
  document.querySelector("#step")!.addEventListener("click", () => { playing = false; document.querySelector("#play")!.textContent = "Play"; cursor++; render(); });
  document.querySelector("#facing")!.addEventListener("click", () => { facing = facing === 1 ? -1 : 1; document.querySelector("#facing")!.textContent = facing === 1 ? "Facing: authored →" : "Facing: mirrored ←"; render(); });
  document.querySelector("#restart")!.addEventListener("click", restart); moveSelect.addEventListener("change", () => { syncControls(); restart(); }); candidateSelect.addEventListener("change", restart); impactSelect.addEventListener("change", restart);
  for (const id of ["silhouette", "rootOverlay", "centerOverlay", "boundsOverlay", "vfxToggle"]) document.querySelector(`#${id}`)!.addEventListener("change", render);
  setInterval(() => { if (!playing) return; if (speed === .5 && ++halfAccumulator % 2) return; const entry = selectedEntry(), max = Math.max(v1Duration(entry), v2Timeline(entry, selectedCandidate()).durationTicks); cursor = cursor >= max + 8 ? 0 : cursor + 1; render(); }, 1000 / 60);
  syncControls(); await render();
  Object.assign(window, { lamuhReview: { getState: () => ({ moveId: selectedEntry().moveId, kind: selectedEntry().kind, candidate: selectedCandidate(), impact: selectedImpact(), cursor, playing, speed, facing, silhouette: checked("silhouette"), vfx: checked("vfxToggle") }), selectMove: (moveId: string) => { const entry = entries.find((item) => item.moveId === moveId); if (entry) { moveSelect.value = entry.key; syncControls(); } restart(); }, selectCandidate: (candidate: CandidateId) => { candidateSelect.value = candidate; restart(); }, selectImpact: (impact: ImpactId) => { impactSelect.value = impact; restart(); }, pause: () => { playing = false; }, step: () => { cursor++; return render(); }, mirror: () => { facing = facing === 1 ? -1 : 1; return render(); }, restart } });
}

void main().catch((error) => { console.error(error); const app = document.querySelector<HTMLElement>("#app"); if (app) app.textContent = `Lamuh review failed: ${error instanceof Error ? error.message : String(error)}`; });
