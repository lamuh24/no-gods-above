import "./style.css";
import { lamuhBodyScale } from "./bodyScale";
import { createMatch, currentAttackPhase, fighterPushbox, fighterExtendedHurtboxes, fighterProjectileHurtboxes, projectileWorldRect, resolveAttackDefinition, tick } from "../core/engine";
import { FighterId, FighterState, InputFrame, LamuhReviewHitstop, MatchState, Rect } from "../core/types";
import { fighterDefinitions } from "../data/fighters";
import { drawAtlasFrame, drawAuthoredOverlay, drawReviewBackdrop, drawStandaloneFrame, exposureFrame, fetchReviewData, loadPresentationImage, sourceRowForFighter } from "./common";
import { ContactCue, ContactSocketPack, PreparedFrames, ReactionPack, contactCue, contactScreenAnchor, drawContactCue, reactionFrameIndex } from "./quality";
import { drawCelestialProjectiles } from './celestialPalm';
import { LamuhTribunalArena } from './tribunalArena';
import { ProjectileEvent } from '../core/types';
import { drawHeavenArc, drawHeavenFocus, heavyImpactOffset } from './heavenSplitter';
import { currentAuthoredDive, currentDivineCounter, currentAscendHeavyChain } from '../core/engine';
import { radiantDiveFrame } from './radiantDive';
import { loadCrown, crownPaths, crownVisual, crownCamera, drawCrownAura, drawCrownBeam, drawCrownBars, drawCrownContacts, drawCrownChargeBall } from './ultimate';
import { grayboxSpriteSources } from '../graybox/grayboxSpriteSources';

type CandidateId = "A" | "B" | "C";
type ImpactId = "I1" | "I2" | "I3";
type ActorSide = "p1" | "p2";
type SpaceId = "center" | "left_corner" | "right_corner";
type OutcomeId = "hit" | "stand_block" | "crouch_block" | "whiff";

async function main() {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) throw new Error("Missing #app");
  app.innerHTML = `
    <section class="shell quality-playtest">
      <p class="eyebrow">NGA Engine V2 · deterministic 60 Hz first playable closure</p>
      <h1>LAMUH LEGACY V2 — isolated human-review sandbox</h1>
      <p class="lede">Down specials: quick aura sweep → advancing spinning sweep → heel slam and short ground wave. Other special families are preserved.</p>
      <div class="gate">CURRENT REVIEW: DOWN + U + J / K / L · NEW CANDIDATES · <a href="/lamuh-legacy-v2/down-specials-v1/preview.html">Down-special frame review</a></div>
      <div class="toolbar"><label><input id="enemyAttack" type="checkbox"> Enemy attacks repeatedly (test counters)</label><span>Back + U + J / K / L = Light / Medium / Heavy Vanish. Heavy counters body strikes only; throws and projectiles beat it.</span></div>
      <div class="gate">✓ HEAVEN SPLITTER L / M / H · HEAVY V4 AURA PASSED · EXACT FRAMES AND B PROFILES RETAINED</div>
      <div class="gate">✓ CELESTIAL PALM L / M / H · CURRENT FAMILY PASSED · NO ROSTER OR ART PROMOTION</div>
      <div class="gate">★ Previous forward specials passed with polish debt; these replacement animations need a new review.</div>
      <div class="gate" id="pushboxReviewMark">★ PUSHBOX SEPARATION · LOADING REVIEW MARK</div>
      <div class="toolbar compact quality-controls"><label><input id="quality" type="checkbox" checked> Refined reactions + impact</label><label><input id="sound" type="checkbox"> Sound</label><button id="cleanView">Clean playtest</button><a class="button-link" href="/lamuh-v1-v2-review.html">Frame comparison</a><span id="loadingFrames" class="fine">Preparing animation frames…</span><span class="fine">New reactions and feedback: candidate · awaiting your review. Uncheck to compare previous visuals.</span></div>
      <div class="toolbar wrap">
        <label>Review timing <select id="timing"><option value="A">A · visual candidate</option><option value="B" selected>B · gameplay-aligned</option><option value="C">C · visual candidate</option></select></label>
        <label>Impact <select id="impact"><option value="I1">I1 · 8 hitstop</option><option value="I2" selected>I2 · 9 hitstop</option><option value="I3">I3 · 10 hitstop</option></select></label>
        <label>Actor <select id="side"><option value="p1">P1 · authored →</option><option value="p2">P2 · mirrored ←</option></select></label>
        <label>Space <select id="space"><option value="center">Center</option><option value="left_corner">Left corner</option><option value="right_corner">Right corner</option></select></label>
        <label>Outcome <select id="outcome"><option value="hit">Hit</option><option value="stand_block">Stand block</option><option value="crouch_block">Crouch block</option><option value="whiff">Whiff</option></select></label>
      </div>
      <details class="reaction-audit"><summary>New reaction poses · frame audit</summary><p class="fine">Light/heavy impact → airborne reaction → ground recovery. One constant body scale. Candidate art, not production-approved.</p><img src="/lamuh-legacy-v2/reactions-quality-v1/reactions-numbered-contact-sheet.png" alt="Twelve numbered Lamuh V2 reaction and recovery poses"></details>
      <div class="scenario-row" id="scenarios"></div>
      <div class="toolbar wrap compact"><label><input id="hitboxes" type="checkbox" checked> hitboxes</label><label><input id="hurtboxes" type="checkbox"> hurtboxes</label><label><input id="pushboxes" type="checkbox" checked> fighter pushboxes</label><label><input id="roots" type="checkbox" checked> roots / body center</label><label><input id="vfx" type="checkbox" checked> VFX</label><label><input id="halfSpeed" type="checkbox"> 0.5×</label><span class="fine">Counter hit: LIVE — 1.2x damage, +6 hitstun, +3 freeze when the opponent is struck out of their own action</span></div>
      <div class="sandbox-grid">
        <article class="panel"><canvas id="stage" width="1120" height="620"></canvas><div class="toolbar"><button id="pause">Pause</button><button id="step">+1 tick</button><button id="reset">Reset to neutral</button></div><p class="fine">A/D move · Shift dash · W jump · S crouch · J/K/L normals · AIR: U+J/K/L = Radiant Dive · grounded W+U+J/K/L = Heaven Splitter · neutral U+J/K/L = Celestial Palm · forward+U+J/K/L = Ascend Step · I throw · back+I back throw · O block · Period step · Escape pause. For Radiant, jump first, then hold U and press J/K/L. For Heaven, hold U before W.</p></article>
        <aside class="card"><h2>Simulation evidence</h2><div id="readout" class="readout"></div><h2>Human gate</h2><p id="artdebt" class="fine"></p></aside>
      </div>
    </section>`;

  const useTribunal=new URLSearchParams(location.search).get('arena')!=='flat';
  let tribunal:LamuhTribunalArena|null=null;
  if(useTribunal){
    const source=document.querySelector<HTMLCanvasElement>('#stage')!,host=document.createElement('div');
    host.id='tribunalStage';host.style.cssText='width:100%;aspect-ratio:1120/620;position:relative;overflow:hidden;border-radius:8px';
    source.before(host);source.width=1600;source.height=900;
    try{tribunal=new LamuhTribunalArena(host);await tribunal.ready;source.style.display='none';}
    catch(error){tribunal=null;host.remove();source.width=1120;source.height=620;console.error('Tribunal arena unavailable; flat fallback',error);}
  }
  document.querySelector('.lede')!.textContent=tribunal?'The Last Tribunal · Lamuh playtest · real perspective charge orbit, planted stance, huge aura charge and wide beam release. P = ultimate.':'Flat fallback review · P = ultimate.';
  const arenaLink=document.createElement('a');arenaLink.href=tribunal?'?arena=flat':'?arena=tribunal';arenaLink.textContent=tribunal?'Open flat fallback':'Open Tribunal arena';document.querySelector('.quality-controls')!.append(arenaLink);
  const reviewData = await fetchReviewData();
  const pushboxReview = (() => {
    const record=reviewData.firstPlayable.currentReviewGate.starredForRevisit.find((entry) => entry.subject === "fighter_pushbox_separation");
    if(!record)throw new Error("Missing fighter pushbox human-review mark");
    return record;
  })();
  document.querySelector<HTMLElement>("#pushboxReviewMark")!.textContent = `★ PUSHBOX SEPARATION · PASSED FOR NOW · REVISIT · ${pushboxReview.decision} · CANDIDATE ONLY`;
  const closure = reviewData.standingHeavyClosure;
  const movement = reviewData.movementModernization;
  type DivineSequence = {frames: typeof reviewData.standingLightClosure.v2.frames; exposureTicks:number[]};
  const divineResponse=await fetch('/lamuh-legacy-v2/divine-vanish-v1/manifest.json',{cache:'no-store'});
  if(!divineResponse.ok)throw new Error('Divine Vanish manifest missing');
  const divineFamily=await divineResponse.json() as {variants:Record<string,typeof reviewData.standingLightClosure>};
  const mediumResponse=await fetch('/lamuh-legacy-v2/divine-vanish-medium-v4/manifest.json',{cache:'no-store'});
  if(!mediumResponse.ok)throw new Error('Divine Medium teleport manifest missing');
  const mediumManifest=await mediumResponse.json() as {medium:typeof reviewData.standingLightClosure};
  divineFamily.variants.medium=mediumManifest.medium;
  const divineRoot={x:768,y:1360};
  const counterManifestResponse=await fetch('/lamuh-legacy-v2/counter-launch-v4/manifest.json',{cache:'no-store'});
  if(!counterManifestResponse.ok)throw new Error('Divine counter manifest missing');
  const counterManifest=await counterManifestResponse.json() as {stance:DivineSequence;response:DivineSequence;projectileFrames:DivineSequence['frames'];projectileExposureTicks:number[];sockets:{kick:{x:number;y:number};ball:{x:number;y:number}}};
  const divineStance=counterManifest.stance,divineReply=counterManifest.response;
  const downResponse=await fetch('/lamuh-legacy-v2/down-specials-v1/manifest.json',{cache:'no-store'});
  if(!downResponse.ok)throw new Error('Down special manifest not ready');
  const downFamily=await downResponse.json() as {variants:Record<string,DivineSequence>;projectileFrames:DivineSequence['frames'];projectileExposureTicks:number[]};
  function downVisual(f:FighterState){
    if(!f.currentAttack?.startsWith('legacy_aura_sweep_'))return null;
    const strength=f.currentAttack.split('_').at(-1)!,s=downFamily.variants[strength],index=exposureFrame(s.exposureTicks,f.phaseTick);
    return {index,record:s.frames[index]};
  }
  const chainResponse=await fetch('/lamuh-legacy-v2/heavy-chain-v1/manifest.json',{cache:'no-store'});
  if(!chainResponse.ok)throw new Error('Heavy punch-kick-ball manifest missing');
  const heavyChain=await chainResponse.json() as {opener:DivineSequence;response:DivineSequence;projectileFrames:DivineSequence['frames'];projectileExposureTicks:number[]};
  function heavyChainVisual(f:FighterState){
    const chain=currentAscendHeavyChain(f);if(!chain)return null;
    const seq=f.ascendHeavyResponse?heavyChain.response:heavyChain.opener,index=exposureFrame(seq.exposureTicks,f.phaseTick);
    return {chain,index,record:seq.frames[index]};
  }
  function divineVisual(f:FighterState){
    if(!f.currentAttack?.startsWith('legacy_divine_vanish'))return null;
    const counter=currentDivineCounter(f);
    const strength=f.currentAttack.endsWith('light')?'light':f.currentAttack.endsWith('medium')?'medium':'heavy';
    const seq:DivineSequence=strength==='heavy'?(f.divineCounterResponse?divineReply:divineStance):{frames:divineFamily.variants[strength].v2.frames,exposureTicks:divineFamily.variants[strength].timingCandidates.B.exposureTicks};
    const index=exposureFrame(seq.exposureTicks,f.phaseTick);
    return {record:seq.frames[index],index,counter};
  }
  const throwAnimations = reviewData.throwAnimations;
  const forwardResponse=await fetch('/lamuh-legacy-v2/forward-clean-v1/manifest.json',{cache:'no-store'});
  if(!forwardResponse.ok)throw new Error('Forward animation candidate manifest missing');
  const forwardFamily=await forwardResponse.json() as {variants:Partial<typeof reviewData.ascendStepFamily.variants>};
  const attackClosures = new Map([
    ["standing_light", reviewData.standingLightClosure], ["standing_medium", reviewData.standingMediumClosure], ["standing_heavy", reviewData.standingHeavyClosure],
    ["crouching_light", reviewData.crouchingLightClosure], ["crouching_medium", reviewData.crouchingMediumClosure], ["crouching_heavy", reviewData.crouchingHeavyClosure],
    ["air_light", reviewData.airLightClosure], ["air_medium", reviewData.airMediumClosure], ["air_heavy", reviewData.airHeavyClosure],
    ["legacy_ascend_step_light", forwardFamily.variants.light ?? reviewData.ascendStepFamily.variants.light],
    ["legacy_ascend_step", forwardFamily.variants.medium ?? reviewData.ascendStepFamily.variants.medium],
    ["legacy_ascend_step_heavy", forwardFamily.variants.heavy ?? reviewData.ascendStepFamily.variants.heavy],
    ["legacy_celestial_palm_light", reviewData.celestialPalmFamily.variants.light],
    ["legacy_celestial_palm_medium", reviewData.celestialPalmFamily.variants.medium],
    ["legacy_celestial_palm_heavy", reviewData.celestialPalmFamily.variants.heavy],
    ["legacy_heaven_splitter_light", reviewData.heavenSplitterFamily.variants.light],
    ["legacy_heaven_splitter_medium", reviewData.heavenSplitterFamily.variants.medium],
    ["legacy_heaven_splitter_heavy", reviewData.heavenSplitterFamily.variants.heavy],
    ...Object.entries(reviewData.radiantDiveFamily?.variants || {}).map(([s,c])=>[`legacy_radiant_dive_${s}`,c] as const)
  ]);
  const reactionResponse=await fetch('/lamuh-legacy-v2/reactions-quality-v1/manifest.json',{cache:'no-store'});
  if(!reactionResponse.ok)throw new Error(`Reaction manifest HTTP ${reactionResponse.status}`);
  const reactions=await reactionResponse.json() as ReactionPack;
  const socketResponse=await fetch('/lamuh-legacy-v2/quality-contact-sockets.v1.json',{cache:'no-store'});
  if(!socketResponse.ok)throw new Error(`Contact socket manifest HTTP ${socketResponse.status}`);
  const contactSockets=await socketResponse.json() as ContactSocketPack;
  if(forwardFamily.variants.light){const f=forwardFamily.variants.light.v2.frames[4];contactSockets.attacks.legacy_ascend_step_light=[{frame:4,sourcePath:f.publicPath,sha256:f.sha256,root:f.root,x:1175,y:860}];}
  if(forwardFamily.variants.medium)contactSockets.attacks.legacy_ascend_step=contactSockets.attacks.legacy_ascend_step.map(s=>{const f=forwardFamily.variants.medium!.v2.frames[s.frame];return {...s,sourcePath:f.publicPath,sha256:f.sha256,y:s.y-(s.frame===10?49:0)};});
  contactSockets.attacks.legacy_ascend_step_heavy=[{...heavyChain.opener.frames[4],frame:4,sourcePath:heavyChain.opener.frames[4].publicPath,x:1175,y:860},{...heavyChain.response.frames[7],frame:7,sourcePath:heavyChain.response.frames[7].publicPath,x:1410,y:826}];
  contactSockets.attacks.legacy_divine_vanish_heavy=[{...divineReply.frames[3],frame:3,sourcePath:divineReply.frames[3].publicPath,...counterManifest.sockets.kick}];
  for(const [strength,c] of Object.entries(reviewData.radiantDiveFamily?.variants || {})) {
    const f=c.v2.frames[c.v2.contactFrame];
    contactSockets.attacks[`legacy_radiant_dive_${strength}`]=[{frame:c.v2.contactFrame,sourcePath:f.publicPath,sha256:f.sha256,root:f.root,...c.v2.releaseSocket}];
  }
  const preparedFrames=new PreparedFrames();
  const crown=await loadCrown();
  const framePaths=[...Object.values(movement.states).flatMap((s)=>s.frames.map((f)=>f.publicPath)),
    ...Object.values(throwAnimations.sequences).flatMap((s)=>s.frames.map((f)=>f.publicPath)),
    ...[...attackClosures.values()].flatMap((c)=>[...c.v2.frames.flatMap((f)=>f.bodyOnlyPublicPath?[f.publicPath,f.bodyOnlyPublicPath]:[f.publicPath]),c.v2.contactPresentation.publicPath]),
    ...reactions.frames.map((f)=>f.publicPath),...Object.values(divineFamily.variants).flatMap(c=>c.v2.frames.map(f=>f.publicPath)),...divineReply.frames.map(f=>f.publicPath),...counterManifest.projectileFrames.map(f=>f.publicPath),...heavyChain.opener.frames.map(f=>f.publicPath),...heavyChain.response.frames.map(f=>f.publicPath),...heavyChain.projectileFrames.map(f=>f.publicPath)];
  framePaths.push(...Object.values(downFamily.variants).flatMap(s=>s.frames.map(f=>f.publicPath)),...downFamily.projectileFrames.map(f=>f.publicPath));
  framePaths.push(...crownPaths(crown));
  await preparedFrames.load(framePaths);
  document.querySelector('#loadingFrames')!.textContent=`${preparedFrames.count} frames ready · 60 Hz`;
  document.querySelector<HTMLElement>("#artdebt")!.textContent = "Heaven Splitter L/M/H and Celestial Palm passed their scoped reviews. ★ Forward specials retain polish debt. Current review: Radiant Dive—one descending palm, shallow/diagonal/steep angles, Heavy aura drawn in the sprites, and floor-triggered landing recovery. Enter after jumping; Heavy needs more height. Review the dive-to-gather transition and landing at 1×. No invulnerability, damaging landing burst or free repeat dive. Comparison A/C are visual-only. Radiant Heavy's baked aura remains visible with presentation VFX off. No production promotion.";
  const timingSelect = document.querySelector<HTMLSelectElement>("#timing")!, impactSelect = document.querySelector<HTMLSelectElement>("#impact")!, sideSelect = document.querySelector<HTMLSelectElement>("#side")!, spaceSelect = document.querySelector<HTMLSelectElement>("#space")!, outcomeSelect = document.querySelector<HTMLSelectElement>("#outcome")!;
  document.querySelector<HTMLElement>('#artdebt')!.textContent='Divine Heavy V4: triggered rising kick and diagonal aura ball; human review pending. Light/Medium unchanged.';
  const selectedTiming = () => timingSelect.value as CandidateId, selectedImpact = () => impactSelect.value as ImpactId, selectedSide = () => sideSelect.value as ActorSide, selectedSpace = () => spaceSelect.value as SpaceId, selectedOutcome = () => outcomeSelect.value as OutcomeId;
  const toggleCache = new Map<string, HTMLInputElement>();
  const checked = (id: string) => {
    let input = toggleCache.get(id);
    if (!input) { input = document.querySelector<HTMLInputElement>(`#${id}`)!; toggleCache.set(id, input); }
    return input.checked;
  };
  const cues: ContactCue[]=[];
  const projectileFeedback:ProjectileEvent[]=[];
  const seenProjectileFeedback=new Set<string>();
  const seenCues=new Set<string>();
  const soundSamples=new Map<string,HTMLAudioElement>();
  for(const name of ['hit_light','hit_medium','hit_heavy','block','dash','jump','whoosh','grab_catch','grab_toss']) soundSamples.set(name,new Audio(`/lamuh-legacy-v2/quality-audio/${name}.wav`));
  function playSound(name:string){if(!checked('sound')||!playing)return;const sample=soundSamples.get(name)?.cloneNode() as HTMLAudioElement|undefined;if(sample){sample.volume=.35;void sample.play().catch(()=>{});}}

  function setupPositions(side: ActorSide, space: SpaceId, outcome: OutcomeId) {
    const gap = outcome === "whiff" ? 270 : 68;
    if (space === "left_corner") return { p1X: -260, p2X: -260 + gap };
    if (space === "right_corner") return { p1X: 260 - gap, p2X: 260 };
    return side === "p1" ? { p1X: -gap / 2, p2X: gap / 2 } : { p1X: -gap / 2, p2X: gap / 2 };
  }
  function newState(seed = 4401) {
    const side = selectedSide(), impact = closure.impactCandidates[selectedImpact()], positions = setupPositions(side, selectedSpace(), selectedOutcome());
    const profile = { timing: selectedTiming(), hitstop: impact.hitstopTicks as LamuhReviewHitstop } as const;
    const state = createMatch(seed, { matchId: `lamuh-closure-${seed}-${side}-${selectedTiming()}-${selectedImpact()}`, p1Kind: "lamuh_legacy_v2", p2Kind: "lamuh_proto", ...positions, ...(side === "p1" ? { p1LamuhReview: profile } : { p2LamuhReview: profile }) });
    state.stage.left = -280;
    state.stage.right = 280;
    const dummy = state.fighters[side === "p1" ? "p2" : "p1"];
    dummy.dummyMode = selectedOutcome() === "stand_block" ? "stand_block" : selectedOutcome() === "crouch_block" ? "crouch_block" : "auto_recovery";
    // Keep the review sandbox ultimate-ready without changing the match engine's
    // meter rules. The in-game contract still requires full tension; this only
    // saves the human reviewer from having to build meter before pressing P.
    const lamuh = Object.values(state.fighters).find((fighter) => fighter.kind === "lamuh_legacy_v2");
    if (lamuh) lamuh.tension = fighterDefinitions[lamuh.kind].combat.maxTension;
    return state;
  }
  let state: MatchState = newState(), playing = !tribunal, halfAccumulator = 0, cameraCenter = 0;
  let queued: InputFrame[] = [];
  let enemyQueued:InputFrame[]=[];
  const heldKeys = new Set<string>();
  const actorId = () => selectedSide() as FighterId, actor = () => state.fighters[actorId()], victim = () => state.fighters[actorId() === "p1" ? "p2" : "p1"];
  const keyMap: Record<string, keyof InputFrame> = { KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right", KeyS: "down", ArrowDown: "down", KeyW: "up", ArrowUp: "up", KeyJ: "light", KeyK: "medium", KeyL: "heavy", KeyU: "special", KeyI: "throw", KeyO: "block", KeyP:'ultimate' };
  window.addEventListener("keydown", (event) => { if (event.code === "Period") { playing = false; stepSimulation(); event.preventDefault(); return; } if (event.code === "Escape") { playing = !playing; updatePauseLabel(); return; } if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.repeat) { queueDashShortcut(); event.preventDefault(); return; } if (keyMap[event.code]) { heldKeys.add(event.code); event.preventDefault(); } });
  window.addEventListener("keyup", (event) => heldKeys.delete(event.code));
  window.addEventListener('blur',()=>heldKeys.clear());
  function currentInput() { const input: InputFrame = {}; for (const code of heldKeys) input[keyMap[code]] = true; return input; }
  function nextInput() { return queued.length ? queued.shift()! : currentInput(); }
  function cpuInput(): InputFrame {
    const cpu = state.fighters.p2, target = state.fighters.p1, distance = target.x - cpu.x, toward = distance > 18 ? "right" : distance < -18 ? "left" : null;
    if (cpu.phase !== "idle" && cpu.phase !== "walk_forward" && cpu.phase !== "walk_backward") return {};
    if (Math.abs(distance) > 120) return toward ? { [toward]: true } as InputFrame : {};
    if (state.tick % 97 === 12) return { block: true };
    if (state.tick % 61 === 7) return { heavy: true };
    if (state.tick % 43 === 19) return { medium: true };
    if (state.tick % 79 === 31) return { special: true, [distance > 0 ? "right" : "left"]: true } as InputFrame;
    return toward ? { [toward]: true } as InputFrame : {};
  }
  function stepSimulation(renderFrame=true) {
    const input=nextInput(), previous=actor().phase, previousMove=actor().currentMoveInstance;
    // The CPU is opt-in for review. Keep queued scenario inputs (for the heavy
    // counter success case) deterministic, but do not let the background AI
    // attack unless the explicit test toggle is enabled.
    const enemyInput=enemyQueued.length?enemyQueued.shift()!:(checked('enemyAttack')?cpuInput():{});
    tick(state, actorId()==="p1"?{p1:input,p2:enemyInput}:{p2:input,p1:enemyInput});
    const projectileEvent=state.lastProjectileEvent;
    if(projectileEvent&&projectileEvent.tick===state.tick-1&&!seenProjectileFeedback.has(projectileEvent.eventId)){
      seenProjectileFeedback.add(projectileEvent.eventId);projectileFeedback.push({...projectileEvent});
      if(projectileEvent.type==='hit'||projectileEvent.type==='block')playSound(projectileEvent.type==='block'?'block':projectileEvent.attackId.endsWith('heavy')?'hit_heavy':'hit_medium');
    }
    while(projectileFeedback.length&&state.tick-projectileFeedback[0].tick>12)projectileFeedback.shift();
    const cue=contactCue(state);
    if(cue&&!seenCues.has(cue.id)){seenCues.add(cue.id);cues.push(cue);playSound(cue.kind==='block'?'block':`hit_${cue.strength}`);}
    while(cues.length && state.tick-cues[0].tick>16)cues.shift();
    if(actor().currentMoveInstance!==previousMove)playSound('whoosh');
    if(actor().phase!==previous){if(['dash','backdash','air_dash_forward','air_dash_backward'].includes(actor().phase))playSound('dash');if(actor().phase==='jump_startup')playSound('jump');}
    if(state.lastThrowEvent?.tick===state.tick-1){if(state.lastThrowEvent.type==='connect')playSound('grab_catch');if(state.lastThrowEvent.type==='release')playSound('grab_toss');}
    if(renderFrame)return render();
  }
  function updatePauseLabel() { document.querySelector("#pause")!.textContent = playing ? "Pause" : "Play"; }
  function reset(seed = state.seed + 1) { state = newState(seed); queued = []; enemyQueued=[]; cues.length=0;seenCues.clear();projectileFeedback.length=0;seenProjectileFeedback.clear();cameraCenter = 0; render(); }
  function queue(...frames: InputFrame[]) { queued.push(...frames); }
  const blanks = (count: number) => Array.from({ length: count }, () => ({} as InputFrame));
  const facingTap = (forward: boolean): InputFrame => actor().facing === (forward ? 1 : -1) ? { right: true } : { left: true };
  function queueDashShortcut() {
    const leftHeld = heldKeys.has("KeyA") || heldKeys.has("ArrowLeft"), rightHeld = heldKeys.has("KeyD") || heldKeys.has("ArrowRight");
    const tap: InputFrame = leftHeld !== rightHeld ? leftHeld ? { left: true } : { right: true } : facingTap(true);
    queue(tap, {}, tap);
  }
  function queueAirDash(forward: boolean) { const tap = facingTap(forward); queue({ up: true }, ...blanks(5), tap, {}, tap, ...blanks(18)); }
  function queueTurnFacing() { const fighter = actor(), opponent = victim(); opponent.x = fighter.x - fighter.facing * 72; queue({}); }
  function ascendStepInput(strength: "light" | "medium" | "heavy"): InputFrame { return { ...facingTap(true), special: true, [strength]: true }; }
  function queueRepeatHeavy() { for (let repeat = 0; repeat < 3; repeat++) queue({ heavy: true }, ...blanks(closure.timingCandidates[selectedTiming()].durationTicks + closure.impactCandidates[selectedImpact()].hitstopTicks + 8)); }
  function forceHitRecovery() { const f = actor(); f.phase = "hit_reaction"; f.phaseTick = 0; f.hitstun = 10; f.hitReactionWeight = "heavy"; }
  function queueRadiantDive(strength: 'light'|'medium'|'heavy', height: number) {
    reset();
    // Scenario setup only; the attack starts through the same input route as a jump.
    const f=actor(); f.y=state.stage.groundY-height; f.vy=0; f.vx=0;
    f.grounded=false; f.phase='jump'; f.phaseTick=0;
    const definition=fighterDefinitions[f.kind];
    f.airActionsRemaining=definition.combat.airActionBudget;
    f.airDashesRemaining=definition.movement.airDashCount;
    delete f.airDiveUsed; delete f.airDiveGatherStartTick;
    queue({special:true,[strength]:true});
    void render();
  }
  const scenarios: Array<[string, () => void]> = [
    ...(['HIT','BLOCK','WHIFF'] as const).map((outcome):[string,()=>void]=>[`Crown ${outcome}`,()=>{outcomeSelect.value=outcome==='HIT'?'hit':outcome==='BLOCK'?'stand_block':'whiff';document.querySelector<HTMLInputElement>('#enemyAttack')!.checked=false;reset();const gap=outcome==='WHIFF'?500:100;const left=selectedSpace()==='left_corner'?-280:selectedSpace()==='right_corner'?280-gap:-gap/2;state.fighters.p1.x=left;state.fighters.p2.x=left+gap;actor().tension=100;queue({ultimate:true});}]),
    ...(['light','medium','heavy'] as const).map((strength):[string,()=>void]=>[`Aura Sweep ${strength[0].toUpperCase()+strength.slice(1)}`,()=>{reset();const gap=selectedOutcome()==='whiff'?500:strength==='heavy'?180:100;const left=selectedSpace()==='left_corner'?-280:selectedSpace()==='right_corner'?280-gap:-gap/2;state.fighters.p1.x=left;state.fighters.p2.x=left+gap;queue({down:true,special:true,[strength]:true});}]),
    ...(['light','medium','heavy'] as const).map((strength):[string,()=>void]=>[`Divine Vanish ${strength}`,()=>{reset();queue({...facingTap(false),special:true,[strength]:true});}]),
    ['Heavy counter SUCCESS',()=>{outcomeSelect.value='hit';document.querySelector<HTMLInputElement>('#enemyAttack')!.checked=false;reset();queue({...facingTap(false),special:true,heavy:true});enemyQueued=[...blanks(3),{light:true}];}],
    ['Heavy counter WHIFF',()=>{reset();document.querySelector<HTMLInputElement>('#enemyAttack')!.checked=false;queue({...facingTap(false),special:true,heavy:true});}],
    ...(['light','medium','heavy'] as const).flatMap((strength):Array<[string,()=>void]>=>[
      [`Radiant Dive ${strength[0].toUpperCase()+strength.slice(1)}`,()=>queueRadiantDive(strength,100)],
      [`Radiant ${strength} high entry`,()=>queueRadiantDive(strength,170)]
    ]),
    ...(['light','medium','heavy'] as const).flatMap((strength):Array<[string,()=>void]>=>[
      [`Heaven Splitter ${strength[0].toUpperCase()+strength.slice(1)}`,()=>{reset();queue({up:true,special:true,[strength]:true});}],
      [`Heaven ${strength} anti-air`,()=>{reset();victim().y=-80;victim().vy=-5;victim().grounded=false;victim().phase='jump';queue({up:true,special:true,[strength]:true});}]
    ]),
    ...(['light','medium','heavy'] as const).map((strength):[string,()=>void]=>[`Celestial Palm ${strength[0].toUpperCase()+strength.slice(1)}`,()=>{reset();const gap=selectedOutcome()==='whiff'?560:300;const left=selectedSpace()==='left_corner'?-280:selectedSpace()==='right_corner'?280-gap:-gap/2;state.fighters.p1.x=left;state.fighters.p2.x=left+gap;queue({special:true,[strength]:true});}]),
    ["5H outcome", () => queue({ heavy: true })], ["5H repeat ×3", queueRepeatHeavy], ["idle → 5L", () => queue({ light: true })], ["idle → 5M", () => queue({ medium: true })],
    ["crouch → 2L",()=>queue({down:true,light:true})], ["crouch → 2M",()=>queue({down:true,medium:true})],
    ["5L → 5M cancel",()=>queue({light:true},...blanks(11),{medium:true})],
    ["walk → 5H", () => queue({ right: true }, { right: true }, { right: true }, { heavy: true })], ["dash → 5H", () => queue({ right: true }, {}, { right: true }, {}, {}, { heavy: true })],
    ["Turn / facing", queueTurnFacing], ["Walk backward", () => queue(...Array.from({ length: 36 }, () => ({ left: true })))], ["Dash forward", () => queue({ right: true }, {}, { right: true }, ...blanks(24))], ["Dash backward", () => queue({ left: true }, {}, { left: true }, ...blanks(26))],
    ["Air dash forward", () => queueAirDash(true)], ["Air dash backward", () => queueAirDash(false)],
    ["Standing block", () => queue(...Array.from({ length: 24 }, () => ({ block: true })))], ["Crouching block", () => queue(...Array.from({ length: 24 }, () => ({ down: true, block: true })))], ["Crouch movement", () => queue(...Array.from({ length: 24 }, () => ({ down: true })))], ["Crouch release", () => queue(...Array.from({ length: 18 }, () => ({ down: true })), ...blanks(16))], ["Jump movement", () => queue({ up: true }, ...blanks(48))],
    ["crouch → 2H", () => queue({ down: true }, { down: true }, { down: true, heavy: true })], ["jump → j.L", () => queue({ up: true }, ...blanks(6), { light: true })],
    ["jump → j.M", () => queue({ up: true }, ...blanks(6), { medium: true })], ["jump → j.H", () => queue({ up: true }, ...blanks(6), { heavy: true })],
    ["j.L one-hit check", () => queue({ up: true }, ...blanks(25), { light: true }, ...blanks(12))], ["j.M one-hit check", () => queue({ up: true }, ...blanks(23), { medium: true }, ...blanks(20))],
    ["air chain j.L → j.M → j.H", () => queue({ up: true }, ...blanks(6), { light: true }, ...blanks(9), { medium: true }, ...blanks(13), { heavy: true })],
    ["attack → walk", () => queue({ heavy: true }, ...blanks(closure.timingCandidates[selectedTiming()].durationTicks + 2), { right: true }, { right: true })], ["hit → recovery", forceHitRecovery],
    ["Pushbox pressure", () => queue(...Array.from({ length: 90 }, () => facingTap(true)))],
    ["Ascend Step Light", () => queue(ascendStepInput("light"))], ["Ascend Step Medium", () => queue(ascendStepInput("medium"))], ["Ascend Step Heavy", () => queue(ascendStepInput("heavy"))],
    ["Heavy chain HIT",()=>{outcomeSelect.value='hit';reset();queue(ascendStepInput('heavy'));}],
    ["Heavy chain BLOCK",()=>{outcomeSelect.value='stand_block';reset();queue(ascendStepInput('heavy'));}],
    ["Heavy chain WHIFF",()=>{outcomeSelect.value='whiff';reset();queue(ascendStepInput('heavy'));}],
    ["Forward throw", () => queue({ throw: true })], ["Back throw", () => queue({ left: true, throw: true })],
    ["Grab whiff → neutral", () => { outcomeSelect.value = "whiff"; reset(); queue({ throw: true }); }]
  ];
  const scenarioRoot = document.querySelector<HTMLElement>("#scenarios")!;
  for (const [label, action] of scenarios) { const button = document.createElement("button"); button.textContent = label; button.addEventListener("click", action); scenarioRoot.append(button); }
  const quick=document.createElement('div');quick.className='toolbar wrap compact';quick.id='divineQuick';
  document.querySelector<HTMLElement>('#artdebt')!.textContent='Divine Heavy counter V4 candidate: stationary 40-tick stance, body-strike window 6–17. Triggered response 55 ticks: vanish 0–4, rising kick 12–14 launches far diagonally away, delayed aura ball 32, then recovery. Standard center test: over 300 units apart before release. Two contacts; 28+44 nominal /68 scaled standard route. Throws/projectiles beat the stance; interruption before release prevents the shot. No homing or victim teleport. Review 1x/0.5x. Other specials and prior starred debt preserved.';
  document.querySelector<HTMLElement>('#artdebt')!.textContent='Down-special family: Light low sweep, Medium advancing spin, Heavy heel slam releasing one independent ground wave. S+U+J/K/L. Each move hits once; crouch block defends. New artwork/timing are candidates pending your review. Preserved prior move approvals and starred debt. Frame review includes full/half speed and single-tick stepping.';
  for(const [label,action]of [...scenarios.filter(([label])=>label.startsWith('Aura Sweep')), ...scenarios.filter(([label])=>label.startsWith('Heavy counter')), ...scenarios.filter(([label])=>label.startsWith('Divine Vanish')), ...scenarios.filter(([label])=>label.startsWith('Heavy chain'))]){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{action();playing=true;updatePauseLabel();};quick.append(button);}
  const repeat=document.createElement('button');repeat.textContent='Enemy attacks: OFF';repeat.onclick=()=>{const toggle=document.querySelector<HTMLInputElement>('#enemyAttack')!;toggle.checked=!toggle.checked;repeat.textContent=`Enemy attacks: ${toggle.checked?'ON':'OFF'}`;};quick.append(repeat);
  document.querySelector('#stage')!.parentElement!.prepend(quick);
  const crownQuick=document.createElement('div');crownQuick.className='toolbar wrap compact';crownQuick.id='crownQuick';
  for(const [label,action] of scenarios.filter(([label])=>label.startsWith('Crown '))){const button=document.createElement('button');button.textContent=label;button.onclick=()=>{action();playing=true;updatePauseLabel();};crownQuick.append(button);}
  const fullMeter=document.createElement('button');fullMeter.textContent='Training: full tension';fullMeter.onclick=()=>{if(!state.ultimateInteraction){actor().tension=100;void render();}};crownQuick.append(fullMeter);
  const crownStatus=document.createElement('span');crownStatus.className='fine';crownStatus.textContent=crown?'P = Ultimate · full 100 tension · confirmed hit only · candidate art':'Ultimate art unavailable — existing moves remain playable; reload after candidate package is built';crownQuick.append(crownStatus);document.querySelector('#stage')!.parentElement!.prepend(crownQuick);
  document.querySelector('.lede')!.textContent='Crown of No Gods: palm → elbow → rising knee → celestial charge orbit → huge diagonal beam. P activates at full tension. All prior special families remain playable.';
  document.querySelector('.gate')!.textContent='CURRENT REVIEW: CELESTIAL ULTIMATE · P · CANDIDATE ONLY';
  document.querySelector<HTMLElement>('#artdebt')!.textContent='Ultimate motion candidate: four damage beats on confirmed hit only; white-gold loc transformation is local to the charge/beam and reverts in recovery. Camera fits both full bodies; angle-specific charge drawings supply the orbit. Use Crown HIT/BLOCK/WHIFF, 0.5x and +1 tick. Training full-tension button changes sandbox setup only. Human animation review pending.';

  const worldScale = 1.3;
  const cinematicOffset=()=>checked('vfx')?heavyImpactOffset(state):{x:0,y:0};
  const worldX = (x: number) => tribunal?800+x*worldScale:560+(x-cameraCenter)*worldScale+cinematicOffset().x;
  const worldY = (y: number) => tribunal?820+y*worldScale:540+y*worldScale+cinematicOffset().y;
  async function drawDummy(context: CanvasRenderingContext2D, fighter: FighterState) {
    if (fighter.id === "p2") {
      const source = fighter.phase === "attack" ? grayboxSpriteSources.standing_heavy.url : fighter.phase === "block" ? grayboxSpriteSources.standing_block.url : fighter.phase === "hit_reaction" ? grayboxSpriteSources.light_hit_reaction.url : fighter.phase === "crouch" ? grayboxSpriteSources.crouch.url : fighter.phase === "walk_forward" ? grayboxSpriteSources.walk_forward.url : fighter.phase === "walk_backward" ? grayboxSpriteSources.walk_backward.url : grayboxSpriteSources.idle.url;
      // Swahili's standalone 448px source is bottom-centered at (224,448); keep that root on the same floor as Lamuh.
      await drawStandaloneFrame(context, source, { x: 224, y: 448 }, { width: 448, height: 448 }, worldX(fighter.x), worldY(fighter.y), tribunal ? 0.64 : 0.64, fighter.facing, fighter.phase === "thrown" ? 0.78 : 1);
      return;
    }
    context.save(); context.translate(worldX(fighter.x), worldY(fighter.y)); context.rotate((fighter.throwRotation * Math.PI) / 180); context.scale(fighter.facing, 1); context.strokeStyle = fighter.phase === "thrown" ? "#ffe08a" : "#8aa0bb"; context.fillStyle = "rgba(92,112,138,.35)"; context.lineWidth = 5; context.beginPath(); context.arc(0, -168, 22, 0, Math.PI * 2); context.fill(); context.stroke(); context.beginPath(); context.moveTo(0, -145); context.lineTo(0, -70); context.moveTo(0, -125); context.lineTo(-34, -91); context.moveTo(0, -125); context.lineTo(34, -91); context.moveTo(0, -70); context.lineTo(-25, 0); context.moveTo(0, -70); context.lineTo(25, 0); context.stroke(); context.restore();
  }
  function rectWorld(fighter: FighterState, rect: Rect, facing = fighter.phase === "attack" ? fighter.attackFacing : fighter.facing): Rect { return { x: fighter.x + rect.x * facing - (facing < 0 ? rect.w : 0), y: fighter.y + rect.y, w: rect.w, h: rect.h }; }
  function drawWorldRect(context: CanvasRenderingContext2D, rect: Rect, color: string) { context.strokeStyle = color; context.lineWidth = 2; context.strokeRect(worldX(rect.x), worldY(rect.y), rect.w * worldScale, rect.h * worldScale); }
  function adjustedExposures() { const result = [...closure.timingCandidates[selectedTiming()].exposureTicks], impact = closure.impactCandidates[selectedImpact()]; result[3] += impact.contactExposureDelta; result[5] += impact.recoilExposureDelta; result[6] += impact.recoveryExposureDelta; return result; }
  function actualContactPresentation(fighter: FighterState, attackId: string) { const event = state.lastCombatEvent; return !!event && event.attackId === attackId && event.attacker === fighter.id && (event.outcome === "hit" || event.outcome === "block") && state.presentationEventLedger.some(id=>id.startsWith(`${state.matchId}:${event.tick}:${fighter.id}:${fighter.currentMoveInstance}:`)); }

  let renderSerial = 0;
  async function drawLamuh(context: CanvasRenderingContext2D, fighter: FighterState, serial: number) {
    const crownFrame=crownVisual(crown,state,fighter);
    if(crownFrame){preparedFrames.draw(context,crownFrame.record.publicPath,crownFrame.record.root,worldX(fighter.x),worldY(fighter.y),state.ultimateInteraction?.facing??fighter.attackFacing);return;}
    const throwInteraction = state.throwInteraction;
    if (throwInteraction && throwInteraction.attacker === fighter.id) {
      const connectedThrow = throwInteraction.result === "connected" && (throwInteraction.throwId === "forward_throw" || throwInteraction.throwId === "back_throw")
        ? throwInteraction.throwId
        : null;
      const sequence = throwAnimations.sequences[connectedThrow || "universal_grab_attempt"];
      const visualTick = connectedThrow
        ? Math.min(sequence.totalTicks - 1, throwInteraction.tick)
        : throwInteraction.result === "whiff"
          ? throwInteraction.tick <= 6 ? 5 : throwInteraction.tick < 12 ? 11 : 15
          : Math.min(sequence.totalTicks - 1, throwInteraction.tick);
      const frame = exposureFrame(sequence.exposureTicks, visualTick), record = sequence.frames[frame];
      preparedFrames.draw(context,record.publicPath,record.root,worldX(fighter.x),worldY(fighter.y),fighter.facing);
      if (checked("roots")) drawAuthoredOverlay(context, { x: worldX(fighter.x), y: worldY(fighter.y) }, record.root, .30, fighter.facing, record.bodyCenter, record.visibleBounds, { root: true, bodyCenter: true });
      return;
    }
    const reactionIndex=checked('quality')?reactionFrameIndex(fighter):null;
    if(reactionIndex!==null){
      const record=reactions.frames[reactionIndex];
      preparedFrames.draw(context,record.publicPath,record.root,worldX(fighter.x),worldY(fighter.y),fighter.facing,fighter.phase==='thrown'?fighter.throwRotation:0);
      return;
    }
    const moveClosure = fighter.currentAttack ? attackClosures.get(fighter.currentAttack) : undefined;
    const down=downVisual(fighter);
    if(down){preparedFrames.draw(context,down.record.publicPath,down.record.root,worldX(fighter.x),worldY(fighter.y),fighter.attackFacing);return;}
    const divine=divineVisual(fighter);
    const heavy=heavyChainVisual(fighter);
    if(heavy){preparedFrames.draw(context,heavy.record.publicPath,heavy.record.root,worldX(fighter.x),worldY(fighter.y),fighter.attackFacing);return;}
    if(divine){preparedFrames.draw(context,divine.record.publicPath,divine.record.root||divineRoot,worldX(fighter.x),worldY(fighter.y),fighter.attackFacing);return;}
    if (fighter.currentAttack && moveClosure) {
      const exposures = fighter.currentAttack === "standing_heavy" ? adjustedExposures() : fighter.currentAttack.startsWith("legacy_ascend_step") ? moveClosure.timingCandidates[selectedTiming()].exposureTicks : moveClosure.timingCandidates.B.exposureTicks;
      const frame = radiantDiveFrame(fighter,state) ?? exposureFrame(exposures, fighter.phaseTick), record = moveClosure.v2.frames[frame];
      const source = !checked('vfx')&&record.bodyOnlyPublicPath?record.bodyOnlyPublicPath:!checked('quality') && frame === moveClosure.v2.contactFrame && moveClosure.v2.contactPresentation.vfxEnabled !== false && checked("vfx") && actualContactPresentation(fighter, fighter.currentAttack) ? moveClosure.v2.contactPresentation.publicPath : record.publicPath;
      if(checked('vfx')&&!record.auraBaked)drawHeavenArc(context,fighter,worldX(fighter.x),worldY(fighter.y));
      preparedFrames.draw(context,source,record.root,worldX(fighter.x),worldY(fighter.y),fighter.facing);
      if (checked("roots")) drawAuthoredOverlay(context, { x: worldX(fighter.x), y: worldY(fighter.y) }, record.root, .30*lamuhBodyScale(source), fighter.facing, record.bodyCenter, record.visibleBounds, { root: true, bodyCenter: true });
      return;
    }
    const movementStateId = fighter.phase === "turn" ? "turn_facing"
      : fighter.phase === "walk_forward" ? "walk_forward"
      : fighter.phase === "walk_backward" ? "walk_backward"
        : fighter.phase === "dash" ? "dash_forward"
          : fighter.phase === "backdash" ? "dash_backward"
            : fighter.phase === "air_dash_forward" ? "air_dash_forward"
              : fighter.phase === "air_dash_backward" ? "air_dash_backward"
                : fighter.phase === "block" && fighter.crouchBlocking ? "crouching_block"
                  : fighter.phase === "block" ? "standing_block"
                    : fighter.phase === "crouch" ? "crouch"
                      : fighter.phase === "crouch_release" ? "crouch_to_stand"
                    : fighter.phase === "jump_startup" || fighter.phase === "jump" || fighter.phase === "landing" ? "jump"
                      : fighter.phase === "idle" ? "idle" : null;
    if (movementStateId) {
      const movementState = movement.states[movementStateId];
      const visualTick = movementState.loop ? Math.max(0, fighter.phaseTick) % movementState.durationTicks : Math.min(Math.max(0, fighter.phaseTick), movementState.durationTicks - 1);
      const frame = movementStateId === "crouch"
        ? fighter.phaseTick <= 0 ? 0 : fighter.phaseTick <= 2 ? 1 : 2 + (Math.floor((fighter.phaseTick - 3) / 8) % 2)
        : movementStateId === "jump"
          ? fighter.phase === "jump_startup" ? 0
            : fighter.phase === "landing" ? fighter.phaseTick < 3 ? 5 : 6
              : fighter.vy < -12 ? 1 : fighter.vy < -4 ? 2 : fighter.vy < 4 ? 3 : 4
          : exposureFrame(movementState.exposureTicks, visualTick);
      const record = movementState.frames[frame];
      const presentationFacing = movementStateId === "turn_facing" ? fighter.turnStartingFacing ?? fighter.facing : fighter.facing;
      preparedFrames.draw(context,record.publicPath,record.root,worldX(fighter.x),worldY(fighter.y),presentationFacing);
      if (checked("roots")) drawAuthoredOverlay(context, { x: worldX(fighter.x), y: worldY(fighter.y) }, record.root, .30, presentationFacing, record.bodyCenter, record.visibleBounds, { root: true, bodyCenter: true });
      return;
    }
    const presentation = sourceRowForFighter(fighter, state, reviewData); await loadPresentationImage(presentation.row.atlas, "v2_dark_ink"); if (serial !== renderSerial) return;
    await drawAtlasFrame(context, presentation.row, presentation.frame, worldX(fighter.x), worldY(fighter.y), .64, fighter.facing, fighter.throwRotation, 1, "v2_dark_ink");
    if (presentation.placeholder) { context.fillStyle = "#f1b46f"; context.font = "700 14px system-ui"; context.fillText("LEGACY FALLBACK ART · SIMULATION TRACK AUTHORITATIVE", 18, 52); }
  }
  async function render() {
    const serial = ++renderSerial, canvas = document.querySelector<HTMLCanvasElement>("#stage")!, context = canvas.getContext("2d")!, a = actor(), v = victim();
    if(tribunal)context.clearRect(0,0,canvas.width,canvas.height);
    else drawReviewBackdrop(context, canvas.width, canvas.height, `LAMUH LEGACY V2 · ${selectedTiming()} · ${selectedImpact()} · ${selectedSide().toUpperCase()} · ${selectedSpace().replace("_", " ")} · ${selectedOutcome().replace("_", " ")}`);
    const camera=tribunal?{x:0,y:0,zoom:1,letterbox:0}:crownCamera(state,worldX,worldY);
    context.save();context.translate(camera.x,camera.y);context.scale(camera.zoom,camera.zoom);
    if(!tribunal){context.fillStyle = "rgba(214,166,56,.08)"; context.fillRect(0, worldY(0), canvas.width, 80); context.strokeStyle = "rgba(214,166,56,.45)"; context.beginPath(); context.moveTo(0, worldY(0)); context.lineTo(canvas.width, worldY(0)); context.stroke();}
    if(checked('vfx'))for(const fighter of [a,v])drawHeavenFocus(context,fighter,worldX(fighter.x),worldY(fighter.y));
    if(checked('vfx'))drawCrownAura(context,preparedFrames,crown,state,worldX,worldY);
    for (const fighter of [state.fighters.p1, state.fighters.p2]) { if (fighter.kind === "lamuh_legacy_v2") await drawLamuh(context, fighter, serial); else await drawDummy(context, fighter); if (serial !== renderSerial) { context.restore(); return; } }
    drawCelestialProjectiles(context,state,worldX,worldY,worldScale,projectileFeedback,checked('vfx'),projectile=>{
      // Reuse the matching counter aura ball without changing simulation geometry.
      const cycle=counterManifest.projectileExposureTicks.reduce((sum,ticks)=>sum+ticks,0);
      const frame=counterManifest.projectileFrames[exposureFrame(counterManifest.projectileExposureTicks,projectile.ageTicks%cycle)];
      const size=projectile.hitbox.rect.h/48;
      context.save();context.translate(worldX(projectile.x),worldY(projectile.y));context.scale(size,size);
      preparedFrames.draw(context,frame.publicPath,frame.root,0,0,projectile.facing);
      context.restore();
    });
    for(const projectile of state.projectiles||[])if(projectile.attackId==='legacy_ascend_step_heavy'){
      const index=exposureFrame(heavyChain.projectileExposureTicks,projectile.ageTicks%6),frame=heavyChain.projectileFrames[index];
      preparedFrames.draw(context,frame.publicPath,frame.root,worldX(projectile.x),worldY(projectile.y),projectile.facing);
    }
    for(const projectile of state.projectiles||[])if(projectile.attackId==='legacy_aura_sweep_heavy'){
      const cycle=downFamily.projectileExposureTicks.reduce((sum,t)=>sum+t,0);
      const frame=downFamily.projectileFrames[exposureFrame(downFamily.projectileExposureTicks,projectile.ageTicks%cycle)];
      preparedFrames.draw(context,frame.publicPath,frame.root,worldX(projectile.x),worldY(projectile.y),projectile.facing);
    }
    for(const projectile of state.projectiles||[])if(projectile.attackId==='legacy_divine_vanish_heavy'){
      const index=exposureFrame(counterManifest.projectileExposureTicks,projectile.ageTicks%6),frame=counterManifest.projectileFrames[index];
      const tilt=Math.atan2(projectile.velocityY,Math.abs(projectile.velocityX))*180/Math.PI*projectile.facing;
      preparedFrames.draw(context,frame.publicPath,frame.root,worldX(projectile.x),worldY(projectile.y),projectile.facing,tilt);
    }
    if(checked('quality')&&checked('vfx'))for(const cue of cues){const point=contactScreenAnchor(cue,contactSockets,worldX,worldY);drawContactCue(context,cue,state.tick-cue.tick,point.x,point.y);}
    if(checked('vfx'))drawCrownBeam(context,preparedFrames,crown,state,worldX,worldY);
    if(checked('vfx'))drawCrownChargeBall(context,preparedFrames,crown,state,worldX,worldY);
    if(checked('vfx'))drawCrownContacts(context,state,worldX,worldY);
    if (checked("hurtboxes")) for (const fighter of [a, v]) { const definition = fighterDefinitions[fighter.kind], rects = fighter.phase === "crouch" || fighter.crouchBlocking ? definition.crouchingHurtboxes : definition.standingHurtboxes; const worldRects=[a,v].some(f=>f.currentAttack?.startsWith('legacy_heaven_splitter')||f.currentAttack?.startsWith('legacy_radiant_dive'))?fighterExtendedHurtboxes(fighter):state.projectiles?.length?fighterProjectileHurtboxes(fighter):rects.map(r=>rectWorld(fighter,r,fighter.facing)); for (const rect of worldRects) drawWorldRect(context, rect, "rgba(89,202,255,.8)"); }
    if(checked('hitboxes'))for(const projectile of state.projectiles||[])drawWorldRect(context,projectileWorldRect(projectile),'rgba(255,96,92,.95)');
    if (checked("pushboxes")) for (const fighter of [a, v]) drawWorldRect(context, fighterPushbox(fighter), "rgba(255,224,138,.95)");
    if (checked("hitboxes")) for (const fighter of [a, v]) drawWorldRect(context, { x: fighter.x - 36, y: fighter.y - 180, w: 72, h: 180 }, "rgba(255,96,92,.6)");
    if (checked("hitboxes") && a.currentAttack && a.phase==='attack') { const attack = resolveAttackDefinition(a); for (const hitbox of attack.hitboxes) if (a.phaseTick >= hitbox.start && a.phaseTick <= hitbox.end) drawWorldRect(context, rectWorld(a, hitbox.rect, a.attackFacing), "rgba(255,96,92,.95)"); }
    const attack = a.currentAttack ? resolveAttackDefinition(a) : null, exposures = adjustedExposures(), frame = a.currentAttack === "standing_heavy" ? exposureFrame(exposures, a.phaseTick) : null;
    context.restore();if(tribunal)tribunal.render(state,canvas);else drawCrownBars(context,state,camera.letterbox);
    const activeClosure = a.currentAttack ? attackClosures.get(a.currentAttack) : undefined;
    const activeExposures = a.currentAttack === "standing_heavy" ? exposures : a.currentAttack?.startsWith("legacy_ascend_step") ? activeClosure?.timingCandidates[selectedTiming()].exposureTicks : activeClosure?.timingCandidates.B.exposureTicks;
    const activeFrame = activeClosure && activeExposures ? radiantDiveFrame(a,state) ?? exposureFrame(activeExposures, a.phaseTick) : null;
    const activeContactFrames = activeClosure?.v2.contactFrames || (activeClosure ? [activeClosure.v2.contactFrame] : []);
    const isAuthoredContact = activeFrame !== null && activeContactFrames.includes(activeFrame);
    const contactPresentation = isAuthoredContact && a.currentAttack
      ? a.currentAttack === 'crouching_heavy' || !checked('quality') && activeClosure?.v2.contactPresentation.vfxEnabled === false
        ? "body_only_vfx_disabled"
        : actualContactPresentation(a, a.currentAttack) ? checked('quality') ? "body_plus_contact_event" : "hit_or_block_composite" : "body_only_no_whiff_spark"
      : "not_contact";
    const actorPushbox = fighterPushbox(a), victimPushbox = fighterPushbox(v);
    const pushboxesOverlap = actorPushbox.x < victimPushbox.x + victimPushbox.w && actorPushbox.x + actorPushbox.w > victimPushbox.x && actorPushbox.y < victimPushbox.y + victimPushbox.h && actorPushbox.y + actorPushbox.h > victimPushbox.y;
    const readout = { tick: state.tick, checksum: state.checksums.at(-1) || "not stepped", actor: a.id, opponentKind: v.kind, visibleArenaBounds: [state.stage.left, state.stage.right], fighterCollision: { reviewDecision: pushboxReview.decision, starredForRevisit: true, candidateOnly: true, rootSeparation: Number(Math.abs(v.x - a.x).toFixed(2)), pushboxesOverlap, authoredThrowExceptionActive: !!state.throwInteraction, actorPushbox, opponentPushbox: victimPushbox }, profile: a.reviewAttackProfile, phase: a.phase, phaseTick: a.phaseTick, turnStartingFacing: a.turnStartingFacing ?? null, gameplayFacing: a.facing, attackFacing: a.attackFacing, airDashesRemaining: a.airDashesRemaining, visualPackage: state.throwInteraction?.attacker === a.id ? "dedicated_standard_grab_throw_candidate" : a.currentAttack === "legacy_ascend_step_light" ? "ascend_step_light_exact_cutout_dash_punch_candidate" : a.currentAttack === "legacy_ascend_step" ? "ascend_step_medium_targeted_motion_repair_candidate" : a.currentAttack === "legacy_ascend_step_heavy" ? "ascend_step_heavy_pause_growing_ball_single_blast_candidate" : a.currentAttack && attackClosures.has(a.currentAttack) ? a.currentAttack.startsWith("air_") ? "modern_air_normal_candidate" : "modern_ground_normal" : a.phase === "turn" || a.phase === "idle" || a.phase === "walk_forward" || a.phase === "walk_backward" || a.phase === "dash" || a.phase === "backdash" || a.phase === "block" || a.phase === "crouch" || a.phase === "crouch_release" || a.phase === "jump_startup" || a.phase === "jump" || a.phase === "landing" || a.phase === "air_dash_forward" || a.phase === "air_dash_backward" ? "modern_movement" : "legacy_fallback_candidate", attack: a.currentAttack, attackPhase: currentAttackPhase(a), attackTiming: attack ? [attack.startup, attack.active, attack.recovery] : null, targetSideSwitch: attack?.targetSideSwitch || null, authoredContacts: activeContactFrames, standingHeavyFrame: frame, standingHeavyExposures: exposures, activeGroundNormalFrame: activeFrame, activeNormalFrame: activeFrame, activeFrameRole: activeFrame === null ? null : activeClosure?.v2.frames[activeFrame]?.role || null, contactPresentation, combo: { count: a.comboCount, damage: a.comboDamage, route: a.comboRoute }, health: a.health, victim: { kind: v.kind, phase: v.phase, position: [Number(v.x.toFixed(2)), Number(v.y.toFixed(2))], rotation: Number(v.throwRotation.toFixed(1)), health: v.health, hitCountTaken: v.hitCountTaken, blocking: v.blocking, crouchBlocking: v.crouchBlocking }, throw: state.throwInteraction, lastCombatEvent: state.lastCombatEvent, lastThrowEvent: state.lastThrowEvent, presentationEventCount: state.presentationEventLedger.length, counterHit: closure.unsupported.counterHit, candidateOnly: true, deployable: false, humanReviewStatus: reviewData.humanReviewStatus };
    if(checked('quality')&&reactionFrameIndex(a)!==null)readout.visualPackage='modern_reaction_quality_candidate';
    Object.assign(readout,{presentationQuality:{enabled:checked('quality'),preparedFrames:preparedFrames.count,actorReactionFrame:reactionFrameIndex(a),victimReactionFrame:reactionFrameIndex(v),eventIds:[...seenCues],activeContactCues:cues.map(cue=>({...cue,screenAnchor:contactScreenAnchor(cue,contactSockets,worldX,worldY)})),bodyLayer:'unchanged_source_frame',heavyVfxOffComparison:'previous clean poses, not pixel-identical aura removal',contactLayer:checked('quality')?'collision_triggered_sprite_socket':'legacy_baked_composite'}});
    Object.assign(readout,{projectiles:state.projectiles||[],lastProjectileEvent:state.lastProjectileEvent||null,projectileEventLedger:state.projectileEventLedger||[],forwardSpecialsReview:"passed_for_now_starred"});
    const chainVisual=heavyChainVisual(a);if(chainVisual){Object.assign(readout,{visualPackage:'heavy_hit_confirm_chain_v1_candidate',heavyChain:chainVisual.chain,activeFrameRole:chainVisual.record.role,activeNormalFrame:chainVisual.index,heavyChainSource:chainVisual.record.publicPath,actorPosition:{x:a.x,y:a.y},humanReviewStatus:'awaiting_human_heavy_chain_review',forwardSpecialsReview:'heavy_redesign_pending'});}
    const down=downVisual(a);if(down)Object.assign(readout,{visualPackage:'down_aura_sweep_v1_candidate',activeFrameRole:down.record.role,activeNormalFrame:down.index,sourceFrame:down.record.publicPath,actorPosition:{x:a.x,y:a.y},humanReviewStatus:'awaiting_human_down_special_family_review'});
    if(a.currentAttack?.startsWith("legacy_celestial_palm"))readout.visualPackage="celestial_palm_neutral_candidate";
    if(a.currentAttack?.startsWith('legacy_heaven_splitter')){readout.visualPackage='heaven_splitter_single_uppercut_candidate';Object.assign(readout,{authoredHop:attack?.authoredHop,actorPosition:{x:a.x,y:a.y},oneUppercut:true});}
    if(currentAuthoredDive(a,state)){readout.visualPackage='radiant_dive_stage_driven_candidate';Object.assign(readout,{authoredDive:currentAuthoredDive(a,state),actorPosition:{x:a.x,y:a.y},oneDescendingPalm:true});}
    const divine=divineVisual(a);if(divine){readout.visualPackage=a.currentAttack==='legacy_divine_vanish_heavy'?'divine_counter_launch_v4_candidate':'divine_vanish_preserved';Object.assign(readout,{divineCounter:divine.counter,divineFrame:divine.index,divineSource:divine.record.publicPath,activeFrameRole:divine.record.role,actorPosition:{x:a.x,y:a.y}});}
    const crownFrame=crownVisual(crown,state,a);Object.assign(readout,{ultimateInteraction:state.ultimateInteraction??null,ultimateArtReady:!!crown,tension:a.tension,tensionSpent:a.tensionSpent,ultimateCamera:camera});
    if(crownFrame)Object.assign(readout,{visualPackage:'crown_celestial_ultimate_v1_candidate',activeFrameRole:crownFrame.record.role,activeNormalFrame:crownFrame.index,sourceFrame:crownFrame.record.publicPath,ultimateVisualPhase:crownFrame.phase,ultimateLocalTick:crownFrame.localTick,actorPosition:{x:a.x,y:a.y},humanReviewStatus:'awaiting_human_ultimate_motion_review'});
    Object.assign(readout,{arena:tribunal?.diagnostics()??{presentationId:'flat_fallback'}});
    document.querySelector<HTMLElement>("#readout")!.textContent = JSON.stringify(readout, null, 2);
  }
  document.querySelector("#pause")!.addEventListener("click", () => { playing = !playing; updatePauseLabel(); }); document.querySelector("#step")!.addEventListener("click", () => { playing = false; updatePauseLabel(); stepSimulation(); }); document.querySelector("#reset")!.addEventListener("click", () => reset());
  for (const select of [timingSelect, impactSelect, sideSelect, spaceSelect, outcomeSelect]) select.addEventListener("change", () => reset());
  for (const id of ["hitboxes", "hurtboxes", "pushboxes", "roots", "vfx", "quality"]) document.querySelector(`#${id}`)!.addEventListener("change", render);
  document.querySelector('#cleanView')!.addEventListener('click',()=>{document.querySelector('.quality-playtest')!.classList.toggle('clean');for(const id of ['hitboxes','hurtboxes','pushboxes','roots'])(document.querySelector(`#${id}`) as HTMLInputElement).checked=false;void render();});
  // Presentation pacing only: the simulation still advances in whole deterministic 60 Hz
  // ticks, in the same order, with the same inputs. requestAnimationFrame aligns those ticks
  // to the display instead of to a free-running timer, and each animation frame renders once
  // after the ticks it owns, so motion reads at the refresh rate rather than every other tick.
  const STEP_MS = 1000 / 60;
  let simAccumulator = 0, lastPumpTime = 0, lastAnimationFrameAt = 0, renderInFlight = false;
  async function renderOnce() {
    if (renderInFlight) return;
    renderInFlight = true;
    try { await render(); } finally { renderInFlight = false; }
  }
  function pump(now: number) {
    if (!lastPumpTime) { lastPumpTime = now; return; }
    // A long stall (tab switch, asset work, a breakpoint) must never be replayed as a burst
    // of catch-up ticks: clamp the debt instead of fast-forwarding the match.
    const elapsed = Math.min(now - lastPumpTime, 4 * STEP_MS);
    lastPumpTime = now;
    if (!playing || document.hidden) { simAccumulator = 0; return; }
    simAccumulator += elapsed;
    let stepped = false;
    while (simAccumulator >= STEP_MS) {
      simAccumulator -= STEP_MS;
      if (checked("halfSpeed") && ++halfAccumulator % 2) continue;
      stepSimulation(false);
      stepped = true;
    }
    if (stepped) void renderOnce();
  }
  function frameLoop(now: number) {
    requestAnimationFrame(frameLoop);
    lastAnimationFrameAt = now;
    pump(now);
  }
  requestAnimationFrame(frameLoop);
  // Some hosts (a docked or backgrounded preview pane) suspend animation frames while the
  // document still reports itself visible. Nothing is on screen then, but the sandbox must
  // not silently freeze the way an animation-frame-only clock would: keep a low-rate
  // watchdog that only takes over once animation frames have actually stopped arriving.
  setInterval(() => {
    const now = performance.now();
    if (!playing || document.hidden || now - lastAnimationFrameAt < 250) return;
    lastPumpTime = Math.max(lastPumpTime, now - 4 * STEP_MS);
    pump(now);
  }, 100);
  updatePauseLabel();
  await render();
  Object.assign(window, { lamuhSandbox: { getState: () => JSON.parse(JSON.stringify(state)), getReviewState: () => ({ timing: selectedTiming(), impact: selectedImpact(), side: selectedSide(), space: selectedSpace(), outcome: selectedOutcome(), halfSpeed: checked("halfSpeed"), vfx: checked("vfx") }), pause: () => { playing = false; updatePauseLabel(); }, step: stepSimulation, render, reset, queue, scenario: (label: string) => scenarios.find(([name]) => name === label)?.[1](), selectTiming: (value: CandidateId) => { timingSelect.value = value; reset(); }, selectImpact: (value: ImpactId) => { impactSelect.value = value; reset(); }, selectSide: (value: ActorSide) => { sideSelect.value = value; reset(); }, selectSpace: (value: SpaceId) => { spaceSelect.value = value; reset(); }, selectOutcome: (value: OutcomeId) => { outcomeSelect.value = value; reset(); } } });
}

void main().catch((error) => { console.error(error); const app = document.querySelector<HTMLElement>("#app"); if (app) app.textContent = `Lamuh sandbox failed: ${error instanceof Error ? error.message : String(error)}`; });
