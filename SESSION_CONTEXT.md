# Session Context - no gods above

## 2026-09-08 - Swahili air-special gameplay rehearsal and art correction

- User caught that the prior versus mapping was showing Swahili's regular air normals when the Air Light / Medium / Heavy special buttons were pressed. The gameplay contracts and real input path are distinct, but dedicated air-special artwork is not authored yet.
- Kept the deep link and deterministic rehearsal buttons in `NO_GODS_ABOVE/engine_v2/src/versus/main.ts`, but removed the misleading `special_air_*` clip aliases from `NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts`. The move list and coverage now explicitly say `dedicated art pending`; normal air clips remain available only under `j.L / j.M / j.H`. Practice controls are labeled gameplay rehearsal so they do not imply completed special art.
- Evidence: `tools/nga-forge/production/characters/swahili/reviews/air-specials-v1/light-source.png` is the only distinct air-special candidate currently present and is raw magenta-source art, not a normalized runtime sheet. No dedicated Medium or Heavy air-special sheet was found. Do not wire the raw source or superseded pistol-frame work directly into gameplay.
- Validation: `npm run build:sim`, `npm run build`, and `npm run smoke:versus-playtest` pass. Live browser verification shows both Swahili practice strips, the explicit art-pending status, and the existing `special_air_heavy` gameplay event path.
- Candidate-only: no combat timing/damage/input-routing changes, no promotion, deployment, commit, push, merge, PR, Blender, or image-generation use.

### What's Next

- Author and normalize dedicated air-special Light / Medium / Heavy sheets (then run frame-scrub and runtime review) before wiring them into the versus presenter. Keep regular air normals separate.

## 2026-09-08 - Swahili Forward Heavy source correction

- User reported the versus playtest was showing the wrong Forward Heavy animation.
- Corrected `NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts`: `special_forward_heavy` now uses the completed sixteen-frame `special-forward-heavy-execution-crescent-motion-v3` runtime sequence (`special_forward_heavy_motion_01..16`) instead of the older nine-pose Ground-Drag Slice study. Combat definition, timing, damage, input routing, and the older candidate sources remain unchanged.
- Reopened the local Swahili mirror match at `http://127.0.0.1:4175/versus-playtest.html?character=swahili&air-specials-v1=1` with debug boxes off.
- Validation: `npm run build:sim`, `node tests/swahili_completed_motion_runtime_playtest_v1.test.js`, `node tests/swahili_forward_heavy_ground_drag_slice_v1.test.js`, and `npm run build` pass. The completed-motion test confirms sixteen connected frames and the single registered contact at frame 10.
- Candidate-only: no promotion, deployment, commit, push, merge, PR, or Blender use.

### What's Next

- Human-playtest the corrected Forward Heavy Execution Crescent V3 in the live match at 1x and report any specific frame/phase that still needs motion repair.

## 2026-09-08 - Swahili versus animation visibility repair

- User reported the live Swahili versus playtest showed hitboxes instead of usable character animation.
- `NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts` now wires the existing normalized Swahili stage motion sources into the versus presenter for neutral, forward, down, up, air-special, and air-special-ender attack IDs. Combat timing/input data was not changed.
- The versus character-select screen now leaves the debug box overlay off by default; the in-match `boxes` toggle remains available for QA. Swahili's roster status now accurately describes the full playable candidate clip coverage.
- Validation: `npm run build:sim`, `npm run build`, and `npm run smoke:versus-playtest` pass. The smoke reports zero page errors and zero failed requests. The browser playtest was reloaded at `http://127.0.0.1:4175/versus-playtest.html?character=swahili&air-specials-v1=1` and left on the live Swahili mirror match with boxes off.
- Candidate-only: no promotion, deployment, commit, push, merge, or PR. Blender was not used.

### What's Next

- Human-playtest the repaired ground and air specials at 1x. If a specific move still reads incorrectly, report the move name and frame/phase; keep hitbox overlay off for motion review and enable it only for collision QA.

## 2026-09-08 - Versus playtest becomes training mode; Lamuh's full move set wired in

- User reported "lamuh is missing all of his moves". Verified: all 28 of his playable moves DO fire in the simulation (proved by driving each special input through `tick` and reading `currentAttack`) - they were **invisible**. The first versus build only loaded art for 21 of them, so Divine Vanish L/M/H, Aura Sweep L/M/H, the Ascend Heavy confirm chain and the Crown ultimate silently fell back to a held standing-heavy pose.
- Wired every remaining manifest into `src/versus/presentation.ts`: `down-specials-v1`, `divine-vanish-v1` + `divine-vanish-medium-v4` + `counter-launch-v4` (counter stance and response), `heavy-chain-v1` (punch -> confirmed kick -> aura ball), `forward-clean-v1`, and `ultimate-v1` via `loadCrown`/`crownVisual`. Projectiles now draw their authored art (palm orbs, Aura Sweep ground wave, counter and Ascend Heavy aura balls) instead of a placeholder rectangle. Radiant Dive uses `radiantDiveFrame` so it samples simulation stages, never art time.
- Refactored `Presenter` from "return a frame" to "draw yourself", so each fighter owns its root policy and VFX. Made `PreparedFrames` take an optional scale (default .3, unchanged) so the versus page reuses the sandbox's real Lamuh drawing at the shared 182u body height instead of a parallel copy.
- Converted the page to **training mode**: AI opponent toggle + Easy/Normal/Aggressive levels, dummy behaviour (stand / crouch / jump / block all / block after first hit), infinite health (default on, refills only out of hitstun so damage still reads), infinite meter, reset positions, swap sides, a per-character move list panel, and a training readout with phase/frame/hitstun/meter and the last combat event. A second player can take over P2 at any moment by pressing their keys - a human input beats the dummy/AI for that frame.
- The AI is deterministic (hash of match tick, never `Math.random`), acts only out of neutral, and picks one action per cadence window so options actually compete. Measured: 5 distinct moves, hits on the player scale 15 / 14 / 21 across easy / normal / aggressive.
- **Found a real pre-existing engine bug.** `tickWithFighterOrder` skips `resolvePush` on any tick a throw interaction is live, so a throw that pins the victim in a corner leaves overlapping pushboxes when the interaction ends and the end-of-tick invariant throws "fighter pushboxes overlap outside an authored throw interaction". Reproduced deterministically at tick 317 of a seed-1 match, and **it reproduces identically with the body envelope disabled**, so it is not caused by this work. NOT patched: the fix changes post-throw corner positioning, which is approved gameplay with pinned tests, so it is a human call. The playtest catches it, separates the fighters the way resolvePush would have, and shows the fault in red in the readout rather than dying. Likely one-line fix documented for whoever takes it.
- Body-check note now compares each fighter's CONFIGURED standing envelope rather than the live box, so a crouching or downed fighter no longer reads as a height mismatch; the live span is still shown and annotated "low profile".
- Evidence: `npm run test:versus` (10 contracts, incl. downed fighters dropping to the low profile) and `npm run smoke:versus-playtest` - the smoke now asserts each Lamuh special both activates AND animates through several distinct sprites (Palm 10, Ascend 21, Vanish 11, Aura Sweep 16, Heaven 15), plus every dummy mode, AI variety, infinite health and the move list. 0 page errors, 0 failed requests. Full suite still 76 pass / 13 fail, same pre-existing 13. `npm run build` passes.
- Docs: `NO_GODS_ABOVE/engine_v2/docs/versus_playtest/TRAINING_MODE.md` (move table, controls, the engine bug) and updated `BODY_METRICS.md`.
- Not committed, not pushed, no PR, no deploy. Branch codex/lamuh-legacy-v2-rebuild-v1, working tree only.

## 2026-09-08 - Versus playtest: Lamuh vs Swahili, matched height, full-body hitboxes

- User asked for a playtest where Lamuh and Swahili fight in the same room, both playable from a character select screen, at the same height, with hitboxes that envelope the whole body. Built as a NEW page, `versus-playtest.html` -> `src/versus/` (roster/presentation/main). No existing sandbox, fighter definition, or approved move data was touched.
- Measured, not guessed. Swahili was rendering **18% shorter than Lamuh and floating 24px above the floor**: his root was taken as the canvas bottom edge (y=1536) instead of his real foot line (y=1406), and his scale was a hand-tuned 0.64. Lamuh body = 788px at 0.3; Swahili body = 1035px. Both now derive `drawScale = 182 * WORLD_SCALE / bodyHeightPx` and root at the measured foot line, so both draw at exactly 182.00u. `node scripts/measure_versus_body_metrics.mjs` re-derives every constant from the art and fails on drift.
- Second real defect: both fighters' authored hurtboxes stop at y=-98/-96 while the drawn bodies are 182u tall, so **the top half of each character was not a hurtbox** and head-height attacks passed through. Added an opt-in `BodyEnvelope` (head/torso/legs bands + pushbox + crouch profile) carried on `MatchConfig` -> `FighterState.bodyEnvelope`, honoured by `fighterPushbox`, `hurtboxes`, `fighterProjectileHurtboxes`. Absent = byte-for-byte previous behaviour; no existing test changed. Downed/rising fighters use the low profile so the box follows the body to the floor.
- Swahili gameplay runs on the existing `lamuh_proto` kind unchanged - that kind carries HIS moveset (Grave Furrow, Grounded Verdict, Crossdraw) and the engine gates his air specials on it. The name is legacy only. This is why the playtest inherits his real tested combat data instead of a copy.
- Swahili presentation maps his existing pose library to engine states: 4 idle, 8 walk-forward, 5 walk-back, 6+6 dashes, jump/fall/land, knockdown/getup, standing L/M/H, crouching L/M/H, air L/M/H, and 9-pose Grave Furrow. **12 specials have no drawn motion and hold the heavy contact pose** - flagged red in an in-match coverage panel rather than hidden.
- Evidence: `npm run test:versus` (9 contracts incl. a head-height strike that CONNECTS with the envelope and MISSES without it, proving the envelope is what fixed accuracy) and `npm run smoke:versus-playtest` (real browser: select screen, both kinds, live 182u body check, Lamuh hits Swahili, Swahili hits Lamuh, Swahili mirror, zero page errors, zero failed requests). Captures in `NO_GODS_ABOVE/engine_v2/docs/versus_playtest/captures/`. Full suite: 76 pass / 13 fail, the SAME 13 that fail at baseline (verified by reverting my engine edits and re-running).
- Gotcha confirmed again: `requestAnimationFrame` stops when the desktop preview pane is not compositing even though `document.hidden` is false. The versus loop carries the same 100ms watchdog as the Lamuh sandbox; without it the match silently freezes when the pane is hidden.
- Known gaps, all documented in `docs/versus_playtest/BODY_METRICS.md`: **Swahili's crouch art is not lower than his standing art** (both ~1035px body) so the pose does not read as a crouch though the hitbox compresses correctly; envelope WIDTHS are a deliberate review choice (raw silhouette is 90u+ wide because it includes robe/coat/scythe) and are the part most worth a human look; Lamuh's Crown ultimate is not wired into this page; arena is a flat 2D stand-in, not the 3D Tribunal.
- Not committed, not pushed, no PR, no deploy. Working tree only, branch codex/lamuh-legacy-v2-rebuild-v1.
- NOTE: this file is 294 KB, far past the ~8 KB router target. Pre-existing; `split-context.mjs` should be run.

## 2026-09-08 - Lamuh sandbox opponent playtest

- Local Lamuh sandbox now starts P1 as `lamuh_legacy_v2` against a Swahili visual opponent using the approved neutral Swahili source pose; P2 runtime kind is `lamuh_proto` so the deterministic opponent remains interactive. This is preview-only and does not alter legacy game.js or roster promotion.
- Scoped build passed (`npm run build`). Local Vite preview restarted on port 4177 and the playtest tab was left open/marked deliverable.
- Fixed missing opponent framing: Swahili standalone source now uses its bottom-center root `(224,448)` so it sits on the same floor as Lamuh. CPU controller advances, blocks, and attacks deterministically. Browser screenshot verified both full bodies in Tribunal; playtest left running.

> [!info] Router
> Current state is the 3 most recent entries below. Everything older lives in
> [`SESSION_CONTEXT_ARCHIVE.md`](./SESSION_CONTEXT_ARCHIVE.md) — 285 entries, 2026-08-16 back to 2026-06-10.
> Cross-project status: `LAMUH/00 - Home/ACTIVE STATE.md` (generated).
> Append new work at the top; run `split-context.mjs` when this file grows past ~8 KB.

## 2026-09-08 - Lamuh playtest frame pacing repair (21 -> 143 fps)

- User reported the playtest was laggy and not smooth. Measured rather than guessed: new `scripts/lamuh_frame_pacing_probe.js` drives a real browser and reports animation-frame deltas plus real simulation Hz. Before: 21 fps, 47 ms median frame, worst 70.6 ms.
- Root cause was the sprite plane's `SRGBColorSpace` CanvasTexture: the 1120x620 2D canvas is uploaded into the 3D scene every frame, and an SRGB8_ALPHA8 texture cannot be filled from a canvas on this GL backend without a per-pixel CPU conversion (~40 ms/frame alone). Isolation runs: skipping the upload gave 133 fps, flat mode 142 fps; antialias, preserveDrawingBuffer, flipY/premultiplyAlpha and willReadFrequently each changed nothing. Fix uploads plain RGBA8 and does the sRGB decode in the material shader via onBeforeCompile.
- Also replaced the `setInterval` pump with an animation-frame fixed-timestep accumulator (simulation still steps in whole deterministic 60 Hz ticks, stalls clamped not replayed), removed the every-other-tick render cap in the 3D view, and cached the ~20 per-frame `querySelector` toggle lookups.
- After: 143 fps presented, worst frame 12.5 ms, simulation 60.2 Hz. Pixel check with new `scripts/lamuh_arena_color_probe.js` (deterministic pose, before vs after): 2.56% of channels differ, max delta 19/255, mean 0.07 - antialiased sprite edges only, because filtering now precedes the sRGB decode. That is a real if sub-perceptual presentation delta on approved art; flag it if a reviewer wants it exact.
- Gotcha: an animation-frame clock stops when the desktop preview pane is not compositing even though `document.hidden` is false. A 100 ms watchdog takes over only after animation frames stop arriving, so the sandbox degrades to ~40 Hz off-screen instead of freezing. Verified both paths.
- Note for playtesting: the 3D arena view starts PAUSED by design (`playing = !tribunal`) - press Play or Escape. Full test sweep re-run: same 13 pre-existing failures, no regressions.

## 2026-09-08 - Lamuh combat audit vs Arc System Works + modernization v1

- User asked for a Lamuh combat audit against ASW design and for upgrades. Audit written to `NO_GODS_ABOVE/engine_v2/docs/LAMUH_COMBAT_AUDIT_ASW_2026-09-08.md` with measured per-move on-block/on-hit advantage. Headline gap: Lamuh had NO normal-into-special cancels at all, so 15 specials (all -8 to -34 on block) were only reachable raw and no confirm converted.
- Shipped, Lamuh-scoped: ASW gatling ladder on all ground/air normals (strictly increasing light->medium->heavy->special->super, so no chain can loop; Divine Vanish excluded as a cancel target), counter hit (x1.2 damage, +6 hitstun, +3 symmetric hitstop, heavy reaction, `counterHit` event flag; gated to lamuh_legacy_v2 attackers and excluded from the cinematic ultimate), dash cancel from tick 5, backdash strike+throw invulnerability for 7 of its 20 ticks, and authored super cancel. No frame data, damage, hitbox, throw or art value changed.
- NOT changed on purpose: Heaven Splitter / ultimate invulnerability. Both combat definitions are pinned by human approval receipts and `lamuh_heaven_splitter.test.js` explicitly asserts its startup is vulnerable. The enabling mechanism (`AttackDefinition.invulnerable`, honoured by strikes/projectiles/throws) is implemented but no attack declares a window. Giving Lamuh a real reversal is the top remaining upgrade and needs a human call.
- Fixed alongside: the sandbox failing to load with "The source image cannot be decoded". The PNGs are valid; 313 frames of 2048x1536 art saturate the renderer's decoded-image cache. `PreparedFrames.load` now decodes via ImageBitmap and closes it after the 0.3 downscale. Prepared pixels unchanged; real fix is exporting movement frames at presentation resolution. Also repaired a pre-existing `const window` local in `currentDivineCounter` that was failing the headless-determinism gate.
- Tests: new `tests/lamuh_combat_modernization_v1.test.js` (9 contracts, all pass). Whole suite run file-by-file before and after: 14 failing files before, 13 after (same set minus combat_kernel, now repaired). The two aggregate Lamuh data hashes in `lamuh_divine_vanish.test.js` / `lamuh_radiant_dive.test.js` had ALREADY drifted before this work (proved by reverting and re-running); they were not re-pinned - a human should re-pin them deliberately, covering the earlier drift too.
- Not committed, not pushed, no PR, no deploy. Working tree only, on branch codex/lamuh-legacy-v2-rebuild-v1.

## 2026-09-08 - Lamuh Crown celestial ultimate first cinematic candidate

- Camera repair after user rejected sprite spinning: Lamuh sandbox now defaults to actual Last Tribunal scene shared with Swahili, using optional background-only renderer and a fixed transparent combat plane. Charge holds q0; real PerspectiveCamera moves about−25→+25degrees, then widens for beam and returns. `?arena=flat` retains fallback. Core unchanged. Live screenshots at−22.29/+20.88degrees show floor/columns moving while Lamuh remains planted; beam framing inspected. New mocked-WebGL/real-Three camera test verifies mapping, mirrors, scrub/reset and no state mutation. Render30fps, sim60Hz; hidden tabs pause, default3D view paused, nativepixelratio1 for laptop load. Still2.5D sprites, not full3D character or shot-for-shot DBFZ recreation; human motion gate pending.

- Follow-up: user requested a clear huge growing charge ball. Added presentation-only66–165 tick24→240px monotonic ball growth, per-camera-view cupped-hand sockets, eight-tick consumption into beam, camera margins and native-resolution aura-ball reuse (no source redraw). Gameplay/timing unchanged. Charge-ball curve/content/core tests pass; browser checked growing ball at92 and huge preblast162. Candidate human review pending.

- User approved ultimate implementation, camera orbit during charge and celestial white-gold loc transformation. New `ultimate-v1` source/public package contains8 martial,6 charge-angle/body and4 separate aura/beam drawings, all normalized2048x1536 with protected source hashes. False checkerboard outputs rejected; green-only extraction preserved white cloth/hair, real-alpha VFX retained. Existing idle, other moves and legacy originals preserved.
- P or Crown HIT/BLOCK/WHIFF in sandbox4177. Full100 tension, starter18/4/30; genuine hit alone enters240-tick four-beat sequence (40+50+60+130 nominal, existing entry scaling). Knee launches diagonally; charge66–165; beam166/impact178; normal form/recovery202–239. Explicit serializable interaction, event ledger, fixed beam target after release; hand origin57,-156. No renderer damage.
- Seven Forge phase packages and build pass; focused gameplay/content/down regression pass, with mirrors/corners/KO/interruption/trades/rollback covered. Live browser confirmed charge84, palm-aligned beam175 and final victim720HP/four hits/full100spend/return to idle. Block/whiff checked separately. Legacy game.js hash remainsD081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B.
- HUMAN MOTION REVIEW PENDING. Sprite-angle orbital shot study (not a free3D orbit), martial connectors/bright loc edges/recovery/cinematic weight need1x/.5x review. No production approval, deployment, push, merge or PR. Evidence/prompts: `tools/nga-forge/review/lamuh-ultimate-v1/README.md`; contract `NO_GODS_ABOVE/docs/lamuh_legacy_v2_ultimate_crown_candidate.md`. Central-vault sync remains pending in local `.agent-sync-pending/2026-09-08-lamuh-crown-celestial-v1.md`.

## 2026-09-08 - Lamuh Divine counter rising kick and diagonal ball V4

- User passed down-special family: exact source/manifest snapshot recorded in `records/down-specials-v1.review-pass.json`, scoped current family baseline, no release promotion. Requested ultimate next. Audited existing58-pose mixed-provenance Crown source and old non-V2 contract. New preproduction `NO_GODS_ABOVE/docs/lamuh_legacy_v2_ultimate_crown_candidate.md`: palm rush -> elbow -> knee launch -> planted diagonal beam; no transformation; hit-confirm only. Proposed full tension cost and four beats (~280damage), NOT approved values. Stop before major art/runtime pending user sequence approval. Current V2 lacks ultimate InputFrame/AttackId/cinematic phase; tension exists, do not assume old I+O/meter architecture.

- NEW down-special family implemented after explicit concept approval: `legacy_aura_sweep_light/medium/heavy` via Down+U+J/K/L. New adult sweep/turn/heel-slam sources plus groundwave; Light28/Medium42/Heavy56 ticks,32/48/66damage, one hit each. Candidate-only Forge/public/source packages `down-specials-v1`, inputs/core tests and full build pass. Live L/P2M/H contacts verified; motion review `/lamuh-legacy-v2/down-specials-v1/preview.html`. Independent critique drove Medium connectors/early-aura removal and Heavy heel repair. Medium pivot vertical bob/angular spacing remains human gate, no automatic approval. Detail/provenance: `tools/nga-forge/review/lamuh-down-specials-v1/README.md`. Legacy game.js hash unchanged; no release actions.

- Neutral Celestial Palm L/M/H now reuse existing counter/forward cyan-white-gold aura-ball sprites in the sandbox, with size ratios26/48,34/48,42/48 to retain strength readability. Only renderer mapping changed; body art, source images, damage, timing, speed, hitboxes and other moves preserved. Full build, 12 Palm gameplay groups and new aura-render routing tests pass; browser screenshots verified Light/Heavy right and Medium mirrored left. Existing content test fails on stale next-review label (Heaven expected, Radiant actual), unrelated and not rewritten. Candidate visual review pending; no deploy/push/promotion.

- Follow-up: user requested a far-away launch before the blast. Current candidate response is 55 ticks, kick12–14 with knockback(12,-18), longer charge, ball release32 with velocity(32,-6). Damage68 and stance/window unchanged. Counter/core/presentation/Forge tests and full build pass. Live sandbox verified response31:296-unit gap/no projectile; response32:308-unit gap/ball spawn; follow-up reaches two hits and victim HP932. Human review pending; no deploy or promotion.

- User requested kick-launch followed by diagonal aura ball. Implemented counter-only48-tick response (kick12–14, projectile25),28+44nominal/68scaled damage. Stance40/window6–17 unchanged; throws/projectiles beat it. No homing/victim teleport. New8 adult poses plus reused matching ball; counter guard reuses new cyan-white-gold pose. Light/Medium/forward specials unchanged.
- Additive source/Forge/public packages `counter-launch-v4` and `counter-launch-packages-v4`; normalized2048x1536 root768,1360 with one2.45scale, green0 and edge-clear. Sandbox uses new package; oldV3 retained. Static independent review passed anatomy/limb/ball handoff; sparse transitions need human1x/.5x review.
- Build and focused counter12, presentation/Forge, AscendHeavy7, Palm12, Medium3 and quality72-scenario tests pass. Legacy game.js hash unchanged. Preview/manifest HTTP200. Browser failed to attach after restart; open request queued, NOT visually verified. Chrome unavailable. Human approval pending, no deploy/push/merge/PR.
- Playtest4177 `/lamuh-legacy-sandbox.html`: `Heavy counter SUCCESS`. Animation-only preview `/lamuh-legacy-v2/counter-launch-v4/preview.html`. Sources/prompts/evidence: `tools/nga-forge/review/lamuh-counter-launch-v4/README.md`. Obsidian CLI cannot find running app; local pending handoff saved.
- Prior forward Heavy punch→pause→vanish→kick→ball remains saved in `heavy-chain-v1`, technically tested but still awaiting human review; do not confuse it with this counter.

## 2026-09-07 - Swahili actual-character Forward Heavy V5 started

- User REJECTED the V4 mannequin. Do not treat its choreography checks as human acceptance. Reopened actual arena4175, then began actual-character Forward Heavy source art under `reviews/special-forward-heavy-character-v5/` using approved idle reference and built-in imagegen; no Blender.
- Two full-sheet attempts failed weapon continuity (second also invents an extra staff), preserved as rejected sources. Individual passing pose corrected a double blade but remains reference-only; PNG type2 proves baked checkerboard, not alpha. No new animation completed or integrated; arena unchanged.
- Next: independent identity check, individual adjacent connectors/contact/recovery, alpha cleanup and full motion QA. Do not count these source drawings as playable moves. See candidate README for evidence and prompt.

## 2026-09-07 - Swahili Forward Heavy motion study V4

- Added `tools/nga-forge/production/characters/swahili/reviews/special-forward-heavy-foreclosure-cleave-v4/`: a continuous 62-tick 2D choreography blueprint, not final sprites or an arena replacement. No Blender. Existing one-hit 26/4/32 combat contract preserved.
- Independent visual critique drove ready-stance, elbow-pole and floor/step corrections. Deterministic 62-tick checks and Chrome playback at 1x/half speed pass; receipts and rendered captures are beside the review. Legacy game.js hash unchanged. No engine source edits in this pass.
- Human motion review remains pending before sprite conversion. Fast release needs an authored passing/smear drawing in final art. Forward Medium, Grave Furrow and other audit work remain unfinished.
- Static review served locally on4196. Browser open request queued; do not infer it is visible. Obsidian CLI could not find a running app; handoff preserved under `.agent-sync-pending/2026-09-07-swahili-forward-heavy-motion-v4.md`.

## 2026-09-07 - Lamuh Divine Vanish Light pass; Medium/Heavy blink candidates

- Medium-only follow-up: user requested a longer disappearance and farther backward travel with a teleport feel. Candidate V4 changes total28→32 ticks, aura-only4→8 ticks, retreat110→180 units;160 units concentrated in invisible ticks10–17. Same source PNGs and recovery poses, no added invulnerability/damage. Light and Heavy counter remain outside this change. Sandbox reads additive `divine-vanish-medium-v4/manifest.json`; V1/V3 historical packages are retained.

- UPDATE: User changed Heavy to a hit-triggered counter and requested all3 in gameplay. Implemented stationary40-tick stance, body-strike counter window6–17, conditional36-tick response: vanish0–4, reappear5–7, one72-damage/12-knockback soft-knockdown blast8–10, recovery11–35. Throws/projectiles beat stance/response; untriggered stance does not attack. Light/Medium unchanged. Old Heavy retreat preserved as historical only.
- All3 now render in `lamuh-legacy-sandbox.html` using source-bound manifests, with success/whiff/normal buttons and optional enemy attacks. Heavy reuses existing adult Ascend Heavy charge/blast cels rather than redrawing accepted body art. Core56 focused groups, counter/source content checks and tsc/Vite build passed. Browser observed genuine incoming Light trigger, unchanged1000 actorHP, exactlyone72-damage reply, Heavy whiff return with no events, Light60-unit retreat and Medium aura-only gameplay frame. Human timing/art approval still pending.
- Counter V3 source/Forge packages and public manifest are additive. Review-data comparison gate remains historical Radiant and is not updated; dedicated blink-preview Heavy is now historical. Current playtest uses counter V3. No push/deploy/merge/PR or production promotion.

- User liked the isolated Light Vanish preview and requested Medium/Heavy next. Light source poses and 20-tick timing retained; this is scoped motion acceptance, not character/production promotion.
- Divine core L/M/H retreat is 60/110/160 units over20/28/40 ticks, zero damage/hits. Focused core and prior-family regression checks passed during implementation. Grounded segmented rootMotionTrack added to Forge without weakening existing hop rules. Main sandbox/review integration is still pending; do not equate core availability with finished runtime presentation.
- New Medium/Heavy preview uses an authored aura-only cel, completely removing the body for4/6 ticks respectively, then reuses the exact embodied poses for reappearance. Visual disappearance does not grant invulnerability. Medium/Heavy remain human-review candidates.
- Isolated routes: `/lamuh-divine-light-preview.html` and `/lamuh-divine-blink-preview.html` on local4177. Sources/scripts/reports under `tools/nga-forge/review/lamuh-legacy-v2-divine-vanish-v1` and Divine Vanish v2 transit artifacts. No deploy/push/merge/PR or legacy edits. Protected game.js hash verified D081DA2D…C6B.
- Remaining: human Medium/Heavy motion review, additive Forge packaging validation with final transit art, then explicit sandbox/comparison presentation wiring. Radiant Dive browser QA remains incomplete; preserve prior scoped approvals and starred debt.

## 2026-09-05 - Swahili moveset audit and Crossdraw Reprisal V6

- User expanded scope to audit Swahili's whole moveset and improve weak animations using Arc System Works-style pose/timing principles. No Blender. Local candidate arena only; approved source history and other-character work preserved.
- Audit: `tools/nga-forge/production/characters/swahili/reviews/swahili-quality-audit-2026-09-05/audit.md` and `audit.json`. Actual arena coverage is 9/15 planned normals and 9/15 planned specials; twelve planned attack slots are not routed. Forward Heavy V3, Forward Medium V3 and Grave Furrow V7 still need trajectory redraws. Character is NOT complete or human-approved.
- Replaced human-rejected Down Medium V4 and model-rejected Debt Spiral V5 with Crossdraw Reprisal V6: low leading-pistol shot, rising second torso shot, mounted scythe throughout. Twelve transparent 512px poses with exact 64-tick exposures and contact cels5/8 at ticks25/40. Existing damage/range/timing/hit count preserved. Sources, alpha report, dark sheet, connected player, independent critique and browser evidence are in `reviews/special-down-medium-crossdraw-reprisal-v6/`.
- Fixed Swahili grounded cancel phase-clock inheritance in `core/engine.ts`, with early/delayed P1/P2 hit/block and hitstop/replay checks. Correct startup means some combos require closer spacing; tests now separately prove legal-range confirms and tip-range whiffs. Seven-hit ground-to-air route remains functional for both facings at the measured walked-in gap92.6.
- Standing Light final recovery alias now uses the complete approved idle anchor, removing cropped blade/coat. Preceding kick/recoil/retraction, old source and isolated approved sandbox are unchanged. Independent critique accepted this local safety substitution; browser root alignment error0.
- `scripts/swahili_crossdraw_v6_smoke.js` passed both-fighter twelve-pose coverage, exact two visible/registered contacts, 1x/0.5x live playback, recovery alignment, connected viewer, no browser errors or failed asset requests. Local tsc/Vite build and focused combat/animation suites passed. Human motion review remains pending; no release/push/deploy. Legacy game.js still has the protected D081DA2D…C6B hash.
- Playtest: `http://127.0.0.1:4175/index.html?full-animation-v1=1&crossdraw-v6=1&moveset-audit-20260905=1`; S+U+K or Test Crossdraw V6. Review server4196. New browser tab retained for user. Playwright uses installed Chrome; its bundled browser/ffmpeg are absent, so no new video-recording claim.
- Full `npm test` is NOT green: it proceeds through combat, animation, special/throw, preview and stage suites, then stops at `swahili_sandbox.test.js:82` because untouched isolated `swahiliSandboxSimulation.ts` differs from its recorded human-approval hash. No approval hash was changed. Final local Vite/tsc build passed with a chunk-size warning.
- Obsidian CLI unavailable; local pending handoff saved under `.agent-sync-pending/2026-09-05-swahili-quality-audit-crossdraw-v6.md`, not centrally synced. SESSION_CONTEXT is about274KB; a separate user-scoped archive/cap task would help, but no unrelated history was rewritten.

## 2026-09-05 - Lamuh Heavy surrounding-aura sprite redraw V4

- Latest live request: “redo the spritesheet with the proper surrounding aura”. Created six genuinely redrawn Heavy release poses using built-in imagegen, with flowing cyan/white/gold energy wrapped around body and rising near fist. Replaces active slots3–8 only; eight entry/recovery slots preserved. Prior V3 vector-baked art and review closure retained as historical/rejected-aura-request evidence.
- Sources/prompts/crop/alpha hashes and six/full14-pose contact sheets: `tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4/`. Real RGBA source frames in `engine_v2/content-source/characters/lamuh-legacy-v2/heaven-heavy-aura-redraw-frames-v4/`. Audited whitespace slicing plus near-magenta unmix preserves white sleeves/aura cores; no global white key. Original release camera scale2.490272376 and absolute roots retained; no per-pose body-height normalization.
- Same14-pose/53-tick B rhythm, contact14,80 damage, one hit, authored hop and inputs. Aura source-bound at9–34, gone by clean landing approach35. No separate runtime/Forge aura overlay. VFX-off/silhouette explicitly compares previous clean art, not pixel-identical aura removal. L/M and prior accepted source hashes retained; protected legacy `game.js` unchanged.
- V4 independent static art/cutout review and six presentation groups pass. Build, Heaven9 deterministic +4 content/Forge, Palm4 content, closure16, quality72 contact scenarios and cancel5 tests pass. Fresh browser report `authored-aura-redraw-v4` PASS:30 cases,3 real keyboard chords,12 corner paths,760×720 compact viewport, both1×/.5× recordings (all14 H poses), zero errors/failures. Actual source tracing confirms V4 PNG/no second overlay and truthful previous-clean fallback without simulation mutation. V3 browser evidence remains in `authored-aura-v3-checkpoint/`, not relabeled. Existing user tab is the clean full-body sandbox at4177.
- Human gate remains `awaiting_human_heaven_splitter_family_review`; candidate only, deployable=false. No commit, push, PR, merge, deploy or asset/roster promotion. Detailed current record: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/SPECIAL_FAMILY_REVIEW_2026-09-05.md`. Obsidian CLI unavailable; local pending note records this repair.

## 2026-09-05 - Lamuh forward mark, Palm pass, Heaven Splitter and cinematic Heavy

- Recorded exact human decisions: forward Ascend L/M/H passed-for-now and starred (`records/forward-special-family-v1.approval.json`); neutral Celestial Palm L/M/H passed its scoped current-family baseline (`records/celestial-palm-v1.approval.json`). Accepted PNG hashes/B profiles frozen; no final-character, roster or art promotion.
- Added real deterministic Palm projectiles (28/40/56 ticks), then Heaven Splitter Up+Special L/M/H (36/43/53 ticks, one hit, short low/medium/high hops). Hop/projectile collision and state belong to core; replay, interruption, hitstop, landing, bounded movement and mirrored counterplay tested. Old normals and other fighters' collision profiles remain unchanged; new special-specific adult defensive profiles are explicit audit debt boundaries.
- User rejected Heavy as an extended Light, then requested aura around the uppercut. H now has separate14-pose windup, rising connector, uppercut, gather and heavy landing art; one-hit80-damage53-tick combat profile unchanged. Cyan/gold surrounding aura follows the body/fist on phase ticks9–29, full at14–19, behind opaque body; freezes with hitstop and mirrors facing. Restrained preparation framing, confirmed-hit shock ring and ≤6px camera impulse do not resize bodies or puppet the victim. Two enclosed hair-gap matte pockets locally cleaned, coat/arms preserved. Original H retained as rejected history. Light/Medium and passed Palm/forward PNGs preserved.
- Latest follow-up supersedes procedural aura: “make the aura apart of the animation itself”. V3 exports the existing editable aura into individual Heavy PNGs, five aura cels3–7 synchronized with14 body poses; full extension holds with cel6 through26 and fade cel7 ends29. No character redraw; zero changed fully opaque body pixels. Exact idle endpoints/body-only fallback retained. Runtime/review skip separate aura overlay, VFX-off selects clean body, Forge Heavy has no aura spawn. Source/export evidence: `heavy-authored-aura-v3.report.json` and `scripts/bake_lamuh_heaven_heavy_aura_v3.js`. Procedural browser checkpoint explicitly separated; V3 needs its own final browser evidence.
- Current technical/source details and applied skills: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/SPECIAL_FAMILY_REVIEW_2026-09-05.md`. Additive Palm3/Heaven3 Forge bundles; old27 first-playable and reaction5 bundles retained; deployable=false. Schema/validator negative projectile and self-motion contracts tested.
- Current gate: `awaiting_human_heaven_splitter_family_review`, specifically judge cinematic Heavy at1× then .5×. Core/content/quality tests pass; final Heavy alpha/browser evidence belongs under `engine_v2/artifacts/lamuh-heaven-splitter-v1/`. No commercial-parity claim. No push, commit, PR, merge or deploy. Legacy `game.js` hash unchanged.
- Final authored-aura V3 technical evidence PASS: browser report version `authored-aura-v3`,30/30 outcome cases,3 actual keyboard chords,12 corner paths, compact viewport and1×/.5× recordings; no browser errors. Actual sandbox/comparison source paths prove composite selection and no double overlay; VFX-off restores clean body without simulation mutation. Independent pixel audit verifies all12 active interior composite/body hashes with zero changed opaque body pixels and only five aura-bearing poses. Build, Heaven9 deterministic groups, Heavy presentation/content, Palm content and closure16 regression groups pass. Composite bounds include aura, not proof of anatomy; final human timing/feel approval remains pending.
- Obsidian CLI unavailable; pending local handoff `.agent-sync-pending/2026-09-05-lamuh-palm-pass-heaven-heavy-v2.md`. Do not claim central sync. Next: human-review Heavy, keep forward/turn/pushbox stars, then choose remaining Divine Vanish or Radiant Dive only after this gate.

## 2026-09-05 - Lamuh quality benchmark and reaction rebuild pass 1

- Continued the user-requested Arc System Works benchmark/rebuild on `codex/lamuh-legacy-v2-rebuild-v1`. Current scope and measured move table: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/QUALITY_BENCHMARK_AUDIT_2026-09-05.md`. Commercial parity is not claimed.
- Lamuh-only core repairs: grounded cancels restart the next move's full authored clock; grounded Up+Heavy no longer reaches the copied unrelated special; light contacts now select light reaction weight in Lamuh mirrors. Existing prototype behavior, damage/stun/hitstop and attack PNGs remain unchanged.
- Added 12 adult V2 reaction/launch/down/get-up source frames, fixed sequence scale, one-shot/state-driven presentation; five additive zero-damage Forge candidate packages. The old 27-package first-playable bundle was not replaced. `quality-preserved-art.lock.json` locks 185 existing movement/normal/special/throw frames.
- Sandbox at4177 now predecodes 202 presentation sources, keeps the body frame intact at impact, uses collision-triggered sprite-socket feedback, offers optional existing SFX, previous-visual comparison, clean full-body playtest, and reaction contact-sheet review. Crouching Heavy's rejected decorative effect stays disabled. `artifacts/lamuh-quality-v1/` holds browser evidence and a real-time canvas recording.
- Recorded the exact prior “pass for now but mark it” as a scoped starred pushbox decision; preserved its screenshot separately as `fighter-pushbox-pressure-approved-2026-09-04.png`. No animation/character promotion is inferred from that decision.
- Focused Lamuh suites, quality tests (72 contact scenarios + source integrity), regression browser smoke, dedicated quality browser smoke, TypeScript/Vite build and additive Forge check passed during this pass. The broader engine suite was not re-run here; previous unrelated Swahili balance failure remains outside this result. Protected legacy `game.js` hash remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Human gate: judge new reactions/impact at1×. Starred debt: source-bbox anchoring does not prove anatomical foot planting; recoil→catch, down→rise and Ascend M heel-to-victim contact height/landing require targeted motion review. No deployment, push, merge, PR, commit or silent promotion. Central Obsidian CLI unavailable; pending handoff `.agent-sync-pending/2026-09-05-lamuh-quality-review-rebuild-v1.md`.

## 2026-09-04 - Lamuh deterministic fighter pushbox separation

- Repaired the shared Engine V2 pushbox resolver used by the Lamuh Legacy sandbox. Fighter overlap now resolves even during hitstop, and a wall-pinned fighter transfers its unavailable half of the correction to the fighter who still has arena room. Lamuh's pushbox was widened from the undersized legacy `46` units to `68` units to match his adult V2 torso silhouette; two Lamuh fighters settle at a deterministic `68.0001`-unit root separation and cannot pass through or occupy the opponent outside an authored throw interaction.
- Preserved the authored exceptions and move behavior: forward/back throw victim tracks remain authoritative during the active throw, Ascend Step Heavy still performs its legal target-relative side switch without translating the victim, and Ascend Step Medium retains its two-hit slide/back-handspring launcher profile.
- Added a checked gold `fighter pushboxes` overlay, `fighterCollision` readout evidence, and a `Pushbox pressure` scenario to `lamuh-legacy-sandbox.html`. Browser smoke now captures `artifacts/lamuh-legacy-v2/fighter-pushbox-pressure.png` and verifies wall pressure, the 68-unit adult-silhouette separation, inactive throw exception, and visible overlay.
- Validation PASS: focused core pushbox regression including frozen/corner pressure, complete Lamuh Legacy V2 test target, Vite production build, Lamuh browser smoke, and protected `game.js` SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. The broader engine suite reached the unrelated existing Swahili Neutral Medium assertion that its 65 damage must be below Down Medium's first-hit damage; this failure is outside the Lamuh files changed here.
- The refreshed local sandbox remains a candidate-only playtest at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`; no commit, push, PR, merge, deployment, or candidate promotion occurred. Applied NGA Engine V2 preservation, fighting-game balance pass, and focused fighting-game playtest QA guidance. Central Obsidian sync is not claimed; pending handoff: `.agent-sync-pending/2026-09-04-lamuh-deterministic-pushbox-separation-v1.md`.

### What's Next

- Human-playtest `Pushbox pressure` in center and corner spaces, then confirm normal movement, Ascend Step Medium, Ascend Step Heavy side switch, and both approved throws still feel natural before continuing special production.

## 2026-09-04 - Swahili Down Medium weapon-continuity V4

- Replaced only the local Engine V2 Down Medium presentation with `special-down-medium-hook-ferrule-shove-motion-v4`. Frames 2-5 now form one draw into the low hook; Frames 8-12 form one follow-through, reversal, ferrule chamber, second contact, and hold; Frames 13-16 recoil and remount the same complete scythe. The rejected V3 package remains preserved as history/fallback.
- Regenerated sixteen 512x512 transparent frames, numbered and dark-background contact sheets, and 1x/0.5x lossless WebP loops. The loops were rebuilt from the exact alpha-clean runtime frames. No Blender was used.
- Integrated V4 into the live arena and updated exact-preview, scenario, help, and input-contract labels. The move remains `S+U+K`, 64 ticks, two registered hits at the existing windows, and no root motion. Standalone `U`, Down Heavy, and the protected legacy runtime were unchanged.
- Validation PASS: focused Down-special suite (9 checks), gameplay-kernel repair, standalone-special modifier, V3 review controls, completed-motion regression, Down Heavy regression, Vite production build, 32-frame alpha report, 16-frame WebP verification, and live browser scenario/reference loading. `game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- This is a human-playtest-ready local candidate, not approval, production roster content, deployment, or release. The full playtest is open at `127.0.0.1:4175` with the `Play Down Medium V4` button visible.
- Applied NGA Engine V2 preservation, playable-character production, character visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, fighter-atlas normalization, built-in image generation, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-09-04-swahili-down-medium-weapon-continuity-v4.md`.

### What's Next

- Human-playtest Down Medium V4 at 1x and 0.5x, concentrating on Frames 2-5 and 10-13. Record approve/revise feedback before promoting any art or moving to the next special.

## 2026-09-03 - Lamuh Ascend Step L/M/H family and Heavy arm/blast repair

- Replaced the rejected two-beat Ascend Step interpretation with three deterministic V2 variants: Light is a short one-hit aura dash-punch, Medium is a longer one-hit aura dash-punch, and Heavy approaches, performs a legal target-relative behind switch, then fires one rear blast. Heavy never damages during approach/teleport and never translates the victim.
- Repaired the Heavy eight-frame art after human feedback: both arms remain complete in every full-body pose, only the intentional teleport-streak frame omits the body, and the single contact now has a denser cyan-white core, unbroken cyan shell, gold rim, and radial shock flare. Fixed root `(768,1360)`, one sequence scale `2.72`, adult proportions, and zero meaningful purple pixels remain enforced.
- Added explicit Engine V2 attack IDs/input routes (`6S+L/M/H`), independently authored `20/30/42`-tick recommended profiles, deterministic Heavy side-switch logic with corner/far-whiff fallback, runtime presentation events, and three Forge packages. The first-playable bundle now compiles `27` candidate packages.
- Added a focused Ascend Step family suite covering input/mirror routing, exact one-hit parity, no victim teleport, Heavy side switch, corner/far whiff, replay/order parity, and protected legacy `game.js` hash. Updated content parity and live browser smoke to cover the L/M/H gate and Heavy contact.
- Validation PASS: `npm run build:lamuh-ascend-step`, `npm run test:lamuh-legacy-v2`, `npm run build`, and `npm run smoke:lamuh-legacy-v2`. The sandbox was left open on the repaired Heavy scenario. This remains candidate-only and nondeployable; no commit, push, PR, merge, or deployment occurred.
- Applied NGA Engine V2 preservation, playable-character production, character visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, fighter-atlas normalization, and built-in image-generation guidance. Central Obsidian sync is not claimed; pending handoff: `.agent-sync-pending/2026-09-03-lamuh-ascend-step-lmh-heavy-arm-blast-repair.md`.

### What's Next

- Human-playtest Ascend Step Light, Medium, and Heavy, focusing first on the repaired Heavy arm continuity and blast impact. Record scoped motion/timing/side-switch/combat decisions before starting the next special family or promoting candidate art.

## 2026-09-03 - Swahili Forward Light completed-motion V3

- Replaced the Forward Light slideshow/direction preview with a completed 16-frame transparent sprite animation: warning drag, continuous forward drive, one clear shaft impact on Frame 10, follow-through, and recovery. The first generated attempt failed the body/weapon-continuity gate and remains preserved under the candidate's `rejected/` folder; a targeted four-frame contact repair supplied the final contact transition.
- Added deterministic atlas/frame normalization, a numbered 4x4 contact sheet, direct 1x/0.5x animated WebP playback, restart and mirror controls, status/build/visual/browser reports, and an exact full-playtest route. The full playtest now exposes three connected-motion specials: Forward Light V3, Forward Medium V3, and Grave Furrow V7; no special is presented there as a slideshow.
- Validation PASS: focused governed Python `70/70`, completed-motion/exact-route engine tests, Vite production build, JSON parsing, HTTP asset checks, and in-app browser playback. Browser QA confirmed frame advancement, speed/mirror/restart behavior, full-body/scythe visibility, and zero warnings or errors.
- This is a human-review-ready candidate only. No Blender, runtime alias, combat value, hit count, input, roster, deployment, or release state changed. The playable Forward Light fallback remains `special-forward-light-advancing-shaft-drive-v1`; protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 preservation, playable-character production, character visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, image-generation, fighter-atlas normalization, focused playtest QA, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-03-swahili-forward-light-completed-motion-v3.md`.

### What's Next

- Human-playtest Forward Light V3 in the open full playtest and record a scoped approve/revise decision. Continue unresolved specials after that review, prioritizing Forward Heavy or the remaining Down-special family without promoting candidate art or changing combat/input behavior.

## 2026-09-03 - Lamuh throw-family approval and Ascend Step adult-proportion V2 gate

- Recorded scoped human decisions `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW`. The approval covers dedicated attacker motion, standard-height humanoid interaction, and neutral transitions only; candidate art remains unpromoted and nondeployable.
- Advanced the active review to Ascend Step. Seven protected V1 poses remain untouched and hash-locked; seven distinct outline-free V2 frames preserve their order at one fixed root and one sequence scale.
- Added a hard adult-proportion/no-chibi contract across the full special. Compact poses are authored compression, not per-frame shrinking; the internal visual audit passes for mature face/beard/locs, adult limb/torso proportions, fixed scale, and zero meaningful purple outline. Human adult-identity approval is still required.
- Preserved deterministic gameplay authority: B is the `30`-tick gameplay-aligned candidate; A `26` and C `34` are visual comparisons. Existing root travel, one-hit parity, damage, hitstop, hitstun, blockstun, and knockdown are unchanged.
- Updated the V1/V2 route to default to Ascend Step and the isolated sandbox to render the same candidate. Validation PASS: Lamuh core/content/closure/turn tests, content contracts, TypeScript, Vite, and browser smoke. Protected `game.js` hash is unchanged.
- Applied NGA Engine V2 preservation, playable-character production, visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, fighter-atlas normalization, and built-in image generation guidance.
- Central Obsidian sync is not claimed; pending handoff: `.agent-sync-pending/2026-09-03-lamuh-throw-family-approved-ascend-step-adult-gate.md`.

### What's Next

- Human-review Ascend Step B in motion for adult proportions, preserved V1 flow, timing, transitions, and combat fit. Stop before the next special or any art promotion until this gate is resolved.

## 2026-09-02 - Swahili new-motion visible pose playback V2

- Fixed the reported full-playtest visibility failure across all three new-motion review groups. The modal no longer presents direction boards only as a small static strip; it now uses a large autoplaying focus stage that advances one labeled conceptual pose at a time, with pause, restart, previous/next beat, speed, and mirror controls where supported.
- Preserved each unchanged full source board below the focused stage in standalone review mode. Embedded full-playtest mode hides the redundant source-board strip so the moving focus stage stays above the fold.
- Added cache-busted V2 preview routes and a persistent Chrome/Playwright audit covering twelve exact routes: nine pose-playback candidates and three existing moving GIFs. All nine pose routes advanced visibly, all assets loaded, one arena canvas remained, and browser diagnostics reported zero warnings, errors, failed requests, or horizontal overflow.
- Validation PASS: pose-playback V2 and 12-preview engine suites, six governed Python files `73/73`, TypeScript, Vite production build (`312` modules), browser report, and screenshot evidence.
- This remains candidate-only review presentation. No source-board pixels, extracted transparent sprites, runtime aliases, combat definitions, inputs, approved Command Grab motion, accepted basics, roster, Blender path, deployment, commit, push, PR, or release state changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-new-motion-visible-pose-playback-v2.md`.

### What's Next

- Human-playtest Forward Medium and the remaining exact preview buttons in the open full playtest. Approval here covers the shown motion direction only; final transparent sprite production, authoritative 60 Hz timing, runtime replacement, roster, deployment, and release remain separate gates.

## 2026-09-02 - Swahili throw repeat-cadence review V1

- Added an additive full-playtest `Throw recovery + repeat cadence` lane for universal Forward Throw, Back Throw, and the frozen Command Grab. Each has P1 and P2 far-whiff buttons for six deterministic scenarios.
- Each scenario performs two normal fresh throw inputs, queuing the second on the first neutral tick after complete whiff recovery. Exact P1/P2 start-to-start cadence is Forward Throw `32`, Back Throw `36`, and Command Grab `107` ticks, each with one visible neutral tick before reuse.
- Preserved and measured authored whiff self-motion rather than suppressing it: absolute attacker travel per use is Forward `18`, Back `1`, and Command Grab `48.51` world units. Far whiffs leave the defender unmoved and all participants stage-bounded.
- Browser QA at `751x698` shows all six cadence buttons, one `750.67` px responsive canvas, zero horizontal overflow, the completed `107T START→START · 1T NEUTRAL` Command Grab readout, and zero warning/error logs. The exact Command Grab cadence route is the review deliverable.
- Validation PASS: new throw-cadence suite, V3 corner throws, V2 throw controls, frozen Command Grab full playtest, special cadence, standalone `U`, V3 special controls, exact deep links, responsive canvas, TypeScript, Vite production build (`312` modules), and focused governed Python `68/68`.
- No throw definition, damage, timing, range, input route, approved motion, frozen Command Grab choreography, accepted content, roster, Blender path, deployment, commit, push, PR, or release state changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 preservation, fighting-game balance, focused playtest QA, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-throw-repeat-cadence-review-v1.md`.

### What's Next

- Human-playtest the six throw cadence buttons, starting with frozen Command Grab. Automation proves deterministic commitment, neutral return, travel, and mirror parity only; punishability, frustration, motion weight, and any later tuning remain human decisions.

### Gotcha

- The in-app browser wrapper does not support Playwright `waitForEvent('console')`; use the existing DOM/browser diagnostics path or local Chrome Playwright capture for console receipts.

## 2026-09-02 - Swahili special repeat-cadence review V1

- Added an additive full-playtest `Recovery + repeat cadence` lane for Neutral Medium, Up Medium, Grave Furrow V1 fallback, and Grounded Verdict V2. Each has P1 and P2 buttons for eight deterministic scenarios.
- Each scenario whiffs the same move twice and queues the second fresh input on the first neutral tick after full recovery. Exact P1/P2 start-to-start cadence is Neutral Medium `25`, Up Medium `35`, Grave Furrow `64`, and Grounded Verdict `80` ticks, with one visible neutral tick before reuse.
- Fixed narrow-view playtest clipping by making the WebGL debug renderer observe its actual host size and adding CSS canvas containment. Browser QA at `751x698` now shows one `750.03` px canvas inside a `751.2` px viewport, zero horizontal overflow, all eight cadence buttons, the completed `80T START→START · 1T NEUTRAL` Grounded Verdict readout, and zero warning/error logs.
- Validation PASS: new cadence and responsive-canvas suites, V3 special/throw controls, standalone `U`, frozen Command Grab, exact review routes, 12 motion-preview visibility, conservative gameplay-impact audit, accepted-basic firewall, current-state reconciliation, TypeScript, Vite production build, and focused Python `62/62`.
- No damage, hitbox, combat timing, input rule, accepted sprite or motion, approved Command Grab choreography, roster, Blender path, deployment, commit, push, PR, or release state changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 preservation, fighting-game balance, focused playtest QA, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-special-repeat-cadence-review-v1.md`.

### What's Next

- Human-playtest the eight cadence buttons, starting with Grounded Verdict now open. Automated parity proves deterministic reuse timing only; impact weight, punishability, frustration, and any later tuning remain human feel decisions.

## 2026-09-02 - Swahili moving-preview visibility correction

- Reproduced the reported visibility mismatch: the open exact route was Neutral Heavy, which is a static direction board rather than completed animation.
- Reopened the full playtest directly on Backward Medium, one of the three genuine moving key-pose GIF previews. Browser validation confirms the `720x720` GIF loaded completely in a `360x360` contained viewport with zero horizontal overflow and no warning/error logs.
- The other genuine moving previews remain Backward Light and Up Light. The other recent redesigns are direction/key-pose boards only and remain intentionally absent from the live arena until human motion approval and transparent runtime sprite production.
- No source files, animation mappings, combat values, runtime authority, protected legacy runtime, roster, deployment, commit, push, PR, or release state changed.

### What's Next

- Human-review Backward Medium in the open moving preview. If the intent is to see the redesigns execute on the arena fighter, the next scoped milestone is transparent runtime-ready sprite production after move-specific motion approval.

## 2026-09-02 - Swahili remaining-special exact preview routes V1

- Reconciled the current 84-entry Swahili state and 23-item Specials & Throws hub before continuing. All unresolved Neutral/Back/Up specials remain at explicit direction/key-pose gates; no runtime or sprite production approval was inferred.
- Added six allowlisted exact full-playtest routes for Neutral Light, Neutral Heavy, Backward Light, Backward Medium, Backward Heavy, and Up Light. Together with the three Forward routes, the playtest now exposes nine prominent per-move preview buttons while preserving the original three preview groups and twelve total reviewed candidates.
- Compacted the embedded Neutral/Back/Up sampler so the selected full board or exact existing GIF is immediately visible. Neutral Heavy — Writ Enforcement V2 is the focused human review: seven direction poses, two proposed contacts, one explicitly inactive bridge, and zero shots.
- Browser QA PASS: Neutral Heavy loaded at `1991x790`, full stage visible from `y=193.8` to `y=475.49` in a `566` px iframe viewport, zero horizontal overflow, one preserved arena canvas, and zero warning/error logs. Paused exact-beat readback proves Beat 3 `Middle-shaft jam` CONTACT, Beat 4 `Horizontal pin / head load` BRIDGE with no callout, and Beat 5 `Planted boar headbutt` CONTACT.
- Validation PASS: exact Forward and remaining-special route suites, 12-preview visibility, V3 special and throw controls, standalone `U`, exact review links, frozen Command Grab, remaining-special sampler, Neutral-family distinction, conservative gameplay-impact audit, accepted-basic firewall `7/7`, current-state reconciliation `37/37`, TypeScript, and Vite production build. Focused Python coverage passed `74/74`.
- No source assets, fighter pixels, transparent sprites, connectors, runtime aliases, attack frames, combat definitions, inputs, damage, hitboxes, approved Command Grab motion, accepted-basic content, roster, Blender path, deployment, commit, push, PR, or release state changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-remaining-special-exact-preview-routes-v1.md`.

### What's Next

- Human-review Neutral Heavy's shaft jam → inactive load → planted boar headbutt direction now open. A direction pass authorizes later transparent pose and connector production only; it does not approve combat timing, runtime replacement, roster, deployment, or release. If rejected, revise the two-contact body process before producing gameplay sprites.

## 2026-09-02 - Swahili Forward Special exact rhythm visibility V1

- Repaired the "no new animation visible" playtest failure in two layers: restarted the local review server on `127.0.0.1:4196`, then added exact allowlisted Forward Light, Medium, and Heavy motion-preview routes to the full playtest. The selected Forward move now propagates into the five-move rhythm sampler instead of always defaulting silently to Light.
- Added three prominent full-playtest controls: `Play new Forward Light direction`, `Play new Forward Medium · 2-hit`, and `Play new Forward Heavy direction`. The embedded sampler now uses a compact presentation that places the selected full-frame board above the fold while the standalone review retains its full context and stop-line text.
- Browser QA PASS on Forward Medium: exact active tab and seven-pose source board at `2172x724`, board fully visible from `y=121` to `y=356.84` inside a `566` px iframe viewport, zero horizontal overflow, visible progression from Beat 4 bridge to Beat 6 follow-through, one preserved arena canvas, and zero warning/error logs. The exact review remains open as the browser deliverable.
- Validation PASS: new exact-route suite, existing 12-preview visibility suite, V3 special and throw controls, standalone `U`, exact gameplay review links, frozen Command Grab, sampler Python suite, accepted-basic firewall `7/7`, current-state reconciliation `37/37`, TypeScript, Vite production build, JSON evidence parse, and scoped whitespace.
- No source-board pixels, transparent sprites, runtime animation aliases, attack frames, combat definitions, inputs, damage, hitboxes, approved Command Grab motion, accepted-basic content, roster, Blender path, deployment, commit, push, PR, or release state changed. These remain candidate direction/rhythm previews awaiting human direction and later motion approval. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-forward-special-exact-rhythm-visibility-v1.md`.

### What's Next

- Human-review the exact Forward Medium two-hit direction now open. A direction pass authorizes later transparent pose and connector production only; it does not approve combat timing, runtime replacement, roster, deployment, or release. If rejected, revise the continuous drive → inactive reversal → rip motion before producing gameplay sprites.

## 2026-09-02 - Swahili throw corner playtest coverage V3

- Completed the missing symmetric corner review coverage without changing any throw definition. V3 preserves the nine V1 and eleven V2 scenarios, then adds `p2_forward_throw_left_corner`, `p1_command_grab_right_corner`, and `p2_command_grab_left_corner` for fourteen total throw-review buttons.
- Deterministic mirror QA PASS: forward corner resolves at `[358,420]` / `[-420,-358]` with no side switch; back corner resolves at `[341,214]` / `[-214,-341]` with the intended side switch; Command Grab resolves at `[296.51,213.55]` / `[-213.55,-296.51]`, one 220-damage event, and the approved side switch. All participants remain stage-bounded and return cleanly to neutral.
- Updated the full-playtest review controls, conservative gameplay-impact audit, exact deep links, and Specials & Throws hub to the 14-throw / 41-total-scenario V3 surface. Browser QA PASS: all fourteen buttons visible, three new buttons launch and complete, exact Command Grab corner URL auto-queues, one arena canvas, no horizontal overflow, zero warning/error logs, and both local servers return HTTP 200.
- Preservation PASS: V1/V2/V3 throw suites, approved Command Grab full-playtest, universal throw presentation, standalone `U`, exact review deep links, V3 special controls, 12-motion-preview visibility, conservative audit `12/12`, accepted-basic firewall `7/7`, current-state reconciliation `37/37`, TypeScript, and Vite production build.
- No fighter pixels, source motion, approved Command Grab choreography, damage, timing, hitboxes, normal input routing, accepted-basic content, roster, Blender path, deployment, commit, push, PR, or release state changed. Candidate-only and human feel gates remain open. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 preservation, fighting-game balance, fighting-game playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-throw-corner-playtest-v3.md`.

### What's Next

- Human-playtest the six symmetric corner buttons at the Throw Review section, especially the frozen Command Grab at both walls. A pass covers corner gameplay feel only; motion, balance, production sprites, roster, deployment, and release remain separate gates. Then continue the unresolved special direction/motion queue.

## 2026-09-02 - Swahili Grave Furrow V6 full-board rhythm review

- Reconciled the current 84-entry Swahili matrix before continuing. All unresolved specials remain at explicit human direction/key-pose/gameplay gates; Throw Tech is the sole manual-art blocker and its prior bounded automated attempt is exhausted, so no prohibited AI retry was made.
- Upgraded the Grave Furrow V6 review from a static seven-pose board to an autoplaying, non-occluding full-board rhythm review with pause, restart, previous/next beat, direct beat selection, 1×/0.5× review speed, authored P1, and mirrored P2. The guide highlights Grind -> Run -> Pickup -> Torque -> In-stride slash -> Passing step -> Running exit without hiding the coat, legs, chain, pendant, or straight scythe.
- Added Grave Furrow V6 as the third exact new-motion preview group in the full playtest. The preview surface now truthfully exposes 12 direction/key-pose reviews: five Forward/Down, six Neutral/Back/Up, and one Grave Furrow V6 direction rhythm. The embedded link lands directly on the full rhythm stage instead of above it.
- Browser QA PASS: source board loaded at `2172x724`; no horizontal page overflow; beat 7 advances and mirrors from guide-left `85.7143%` to `0%`; 0.5× remains on Beat 1 after 500 ms and reaches Beat 2 after 1400 ms; the exact full-playtest query opens the modal with one preserved arena canvas and three preview links.
- Validation PASS: Grave Furrow V6 `6/6`, new preview visibility, V3 special controls, accepted-basic firewall `7/7`, current-state reconciliation `37/37`, Vite production build, JSON parse, HTTP 200, and scoped whitespace. The 116-frame accepted baseline and protected `NO_GODS_ABOVE/game.js` SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B` remain unchanged.
- No fighter pixels, source-board pixels, final sprites, combat timing, damage, hitboxes, runtime mappings, approved Command Grab motion, roster, Blender path, deployment, commit, push, PR, or release state changed. This is direction-rhythm evidence only and does not infer human approval.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance boundaries, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, Image Generation stop rules, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-grave-furrow-v6-full-board-rhythm-review.md`.

### What's Next

- Human-review Grave Furrow V6's seven-beat direction rhythm and answer its targeted question: does the one slash land mid-stride and carry through a passing step into a running exit with no braking pose? A pass authorizes later motion authoring only; transparent sprites, gameplay timing, combat, roster, deployment, and release remain separate gates.

## 2026-09-02 - Lamuh live crouch-release transition integration V1

- Closed the technical crouch-to-stand gap without regenerating artwork: the live sandbox now reuses modern Crouch Frames 04-05 (`rising_connector`, `standing_recovery`) through an explicit deterministic `crouch_release` fighter phase.
- The presentation lasts eight visible 60 Hz ticks, returns to Idle when uninterrupted, and is immediately preempted by attack, jump, dash, crouch, walk, or block input. Standing gameplay boxes apply on release; renderer code never owns or delays gameplay state.
- Added the `crouch_to_stand` movement/review timeline, comparison-route entry, source-audit coverage, candidate record, `Crouch release` sandbox scenario, fixed-root/zero-purple browser captures, and replay/checksum/input-interruption regression coverage.
- Validation PASS: focused Lamuh deterministic/content/closure suite, TypeScript/Vite production build, 24-package nondeployable content validation, comparison/sandbox browser smoke, and direct visual inspection of both new captures. Protected `NO_GODS_ABOVE/game.js` remains hash-locked by the focused suite.
- Dedicated turn/facing art remains the only authored presentation item still affecting the pre-specials normals/idle/transition gate. No special production, combat timing, damage, hitbox, roster, legacy original, deployment, commit, push, PR, or production promotion changed.
- Applied NGA Engine V2 preservation guidance plus playable-character, visual-consistency, sprite-validation, Character Sprite Pipeline, and Animation Fluidity Standard boundaries. Central Obsidian sync is not claimed because the vault is outside the active writable scope. Pending handoff: `.agent-sync-pending/2026-09-02-lamuh-live-crouch-release-transition-v1.md`.

### What's Next

- Human-playtest `Crouch release` in `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`, including release-to-idle and immediate attack/walk interruption. If it passes, author/review dedicated turn/facing presentation before broader specials work begins.

## 2026-09-02 - Swahili new-motion preview visibility V1

- Added a prominent `NEW MOTION PREVIEWS - 11 REDESIGNS - NOT PLAYABLE SPRITES YET` surface to the Engine V2 full-playtest special controls. It opens the five Forward/Down direction rhythms or the six Neutral/Back/Up direction/key-pose reviews in an in-place modal, with direct-link fallbacks and exact `motionPreview=forwardDown|neutralBackUp` deep links.
- Preserved the current arena animation fallbacks and labeled the boundary explicitly: the 11 redesigns are review candidates, not transparent gameplay sprites. No combat definitions, approved motion, runtime sprite aliases, roster, Blender path, or release state changed.
- Validation PASS: Vite production build; new 11-preview regression; standalone `U`; V3 special controls; exact review deep links; V2 throw controls; frozen Command Grab; 116-frame accepted-basic baseline verifier plus `7/7` firewall and `37/37` current-state tests; both review pages and the playtest returned HTTP 200. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Both embedded modal families were visually verified before the local environment rollover. After rollover, browser URL security policy blocked reclaiming the final user tab; no alternate-browser workaround was attempted. The current local servers and exact links remain available. A strict TypeScript check also exposes an unrelated existing `crouch_to_stand` record mismatch in `src/lamuhlegacy/sandbox.ts`; that file has no scoped diff and was not changed.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-02-swahili-new-motion-preview-visibility-v1.md`.

### What's Next

- Human-open either exact new-motion deep link from the full playtest and review each move independently. Direction/key-pose approval still does not authorize transparent motion production, gameplay integration, roster promotion, deployment, or release.

## 2026-09-01 - Lamuh Crouching Block and adult-proportion Jump repair V1

- Rejected and preserved two Crouching Block generations that failed Lamuh's identity lock: the first omitted his boxed beard and read chibi; the second restored the beard but retained excessive torso/limb compression. Rebuilt four mature adult-proportion Crouching Block poses that preserve the legacy low-guard progression without purple outline.
- Rebuilt the existing seven-pose Jump / fall / landing arc with a smaller adult head-to-body ratio, longer adult torso/limbs, and boxed beard continuity. Authored timing and simulation-owned jump physics are unchanged; Jump recovery matches modern Idle visible height within `0.25%`.
- Normalized both sequences on the shared `2048x1536` canvas, fixed root `(768,1360)`, and one scale per sequence. Added candidate hash locks, rejected-generation evidence, numbered contact sheets, source/normalized frames, review-data state coverage, V1/V2 comparison routing, and a dedicated sandbox `Crouching block` scenario.
- Added `NORMALS_IDLE_TRANSITION_READINESS_AUDIT.md`. Broader specials production remains stopped at the requested human gate; dedicated turn art, live crouch-to-stand presentation, and combined normals/idle/transition review remain open.
- Validation PASS: focused Lamuh deterministic/content/closure suite, TypeScript/Vite production build, 24-package nondeployable content validation, browser comparison/sandbox smoke, zero-purple checks, fixed-root hashes, and real Crouching Block / Jump gameplay captures. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No gameplay timing, jump physics, defense rules, damage, input routing, legacy originals, roster, deployment, commit, push, PR, or production promotion changed. Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighter-atlas factory, fighting-game playtest QA, Character Sprite Pipeline, Animation Fluidity Standard, and Image Generation guidance.
- Central Obsidian sync is not claimed because the vault is outside the active writable scope. Pending handoff: `.agent-sync-pending/2026-09-01-lamuh-crouching-block-jump-adult-identity-repair-v1.md`.

### What's Next

- Human-playtest `Crouching block` and `Jump movement` beside Idle and all normals at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. Approve or request targeted repair for adult identity, beard continuity, motion, scale, and entry/exit flow. Do not begin broader specials production until the combined normals/idle/transition gate passes.

## 2026-09-01 - Swahili accepted-basic baseline firewall V1

- Reconciled the direct August 26 full-playtest approval against the older current-state matrix. The accepted current in-game baseline is the 20 named basic families in `current-in-game-baseline-v2.approval.json`; later replacement attempts remain candidate/manual-blocked and were not promoted.
- Added an additive asset-and-semantics hash lock covering `116` exact presentation frames across the 20 accepted basic families plus the approved 24-frame Command Grab motion. The lock includes family-specific attack tracks, movement/reaction selectors, supporting approval/freeze records, and protected legacy hash evidence.
- Explicitly excluded all unresolved `special_*` families, universal-throw gameplay, throw tech, and later walk replacement decisions. Historical files under a `candidates` path remain candidates by provenance; the lock records only their accepted current-playtest use.
- Verification PASS: new baseline firewall `7/7`, existing current-state reconciliation `37/37`, Python compile, and protected `NO_GODS_ABOVE/game.js` SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No artwork, animation timing, combat definitions, sprite aliases, accepted Command Grab motion, special candidate, roster, Blender path, deployment, commit, push, PR, or publication changed. Candidate-only, nondeployable, and human-gated boundaries remain closed.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, Character Sprite Pipeline, Animation Fluidity Standard, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-accepted-basic-baseline-firewall-v1.md`.

### What's Next

- Continue unresolved special and throw review/repair work against this firewall. If a future change touches an accepted basic asset or selector, run `verify_swahili_v2_accepted_basic_baseline_v1.py` and treat any mismatch as an explicit reopen decision rather than silently refreshing the lock.

## 2026-09-01 - Swahili exact scenario review deep links V1

- Added a fail-closed `reviewDeepLink` resolver to the Engine V2 debug runtime. One allowlisted `specialScenario` or `throwScenario` query queues the existing deterministic one-tick review input after replay setup; unknown, repeated, or mixed special/throw queries queue nothing.
- Regenerated the conservative gameplay-impact audit so all `27` special outcomes and all `11` throw outcomes expose one exact full-playtest link. The audit page renders `38` links and retains the distinction between playable candidates/fallbacks and direction-only redesigns.
- Live browser QA PASS: Grounded Verdict hit auto-queued from a valid special link; Command Grab whiff auto-queued from a valid throw link; invalid and mixed links left both readouts at READY; audit page rendered `7` move rows, `3` throw rows, `38` scenarios, zero warnings, and zero errors.
- Validation PASS: Engine V2 TypeScript/Vite production build, exact-link regression, Special Review V3, Throw Review V2, `49` focused Forge tests, JSON parse, and scoped whitespace. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No combat definitions, input priority, timing, damage, hitboxes, sprite aliases, approved Command Grab motion, roster, Blender path, legacy runtime, deployment, commit, push, PR, or publication changed. Candidate-only and every human gate remain open.
- Applied NGA Engine V2, Playable Character Production, Fighting Game Balance Pass boundaries, Animation Fluidity Standard, LAMUH Fighting-Game Playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-exact-scenario-review-deep-links-v1.md`.

### What's Next

- Human-playtest exact hit, block, and whiff links from the impact audit and report the named move plus phase. Keep the five Forward/Down redesigns and Grave Furrow V6 direction-only until their transparent motion and explicit human gates close.

## 2026-09-01 - Swahili remaining-special review sampler and hub reconciliation V1

- Resolved the apparent `11 direction / 7 gameplay` versus artifact-stage mismatch. Those are human review-lane counts; exact artifact stages are `9 direction / 3 key-pose / 4 gameplay / 2 interaction / 4 approved / 1 blocked`. Grave Furrow V6 remains a direction-stage artifact routed through the gameplay lane because its preserved V1 fallback is playable while V6 is unintegrated.
- Added `swahili-remaining-special-review-sampler-v1` for the six remaining Neutral/Back/Up candidates. Neutral Light, Neutral Heavy, and Back Heavy use complete opaque direction boards with non-occluding beat guides. Back Light, Back Medium, and Up Light switch the twelve exact pre-existing authored/mirrored 1x/0.5x GIF assets; GIF step controls are deliberately disabled instead of fabricating frame behavior.
- The sampler preserves exact visible/proposed hit parity, distinguishes non-damaging deflects from offensive contacts, exposes Back Medium's three missing weapon connectors, and creates no new fighter frames, crops, slices, timing, combat, or runtime mapping.
- Refreshed the Specials & Throws hub's stale status/browser evidence from `9 direction / 3 blockers / 17 special scenarios / 9 throw scenarios` to current `11 direction-lane / 1 blocker / 27 special / 11 throw`. Corrected the visible date, `18` decisionable-candidate wording, three-integrated-gameplay-versus-Grave-Furrow-fallback wording, and explicit lane-versus-stage count note.
- Browser QA PASS: six tabs; all three boards loaded at exact dimensions with full-board visibility, impact/bridge/deflect roles, and P2 mirroring; all three GIF moves loaded four unique exact source variants at `720 x 720`; fake GIF play/step controls stay disabled; page diagnostics remained `0` warnings / `0` errors. One aggregate readback exceeded the observation deadline, but the same checks completed in bounded per-mode calls and the page remained healthy.
- Current-state reconciliation PASS at `84` entries / `23` hub items / `11-7-4-1` review lanes; `86` focused tests PASS. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No source art, approved motion, accepted throws, approved Command Grab, standalone `U`, combat definitions, final sprites, runtime promotion, Blender build, roster, deployment, commit, push, PR, or publication changed. Applied NGA Engine V2, playable-character production, visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-remaining-special-review-sampler-v1.md`.

### What's Next

- Human-review the six sampler tabs independently. A pass on a board covers direction only; a pass on a GIF covers existing key-pose direction only. Back Medium still requires three explicit weapon-transition connectors, and every move remains blocked from final sprites/runtime until its later motion and gameplay gates close.

## 2026-09-01 - Swahili direction sampler non-occluding framing repair

- Reproduced the user's report that some move poses looked cut off in the Forward/Down direction-rhythm sampler. The source boards were intact, but the active-beat box used a giant outside-cell shadow that visually suppressed any scythe, coat, arm, or leg crossing the guide boundary.
- Removed the outside-cell mask and replaced it with a transparent gold/blue timing guide. The complete single-row and multi-row source boards now remain fully lit; source images, pose cells, cadence, contact roles, and combat data are unchanged.
- Browser QA PASS on Forward Light and Down Light: board overflow is `visible`, the old `9999px` mask is absent, Down Light loaded at `1536 x 1024`, and cross-boundary weapons remain visible. Focused regression passes `7/7`.
- Opened the actual Engine V2 gameplay build at `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1&special-modifier-v1=1&special-review-controls-v3=1&throw-review-controls-v2=1#special-review-controls` with 27 deterministic special scenarios plus throw controls. This does not infer human approval.
- No source art, sprites, combat definitions, approved Command Grab, standalone `U`, protected `NO_GODS_ABOVE/game.js`, Blender path, roster, deployment, commit, push, PR, or publication changed. Applied in-app Browser, NGA Engine V2, playable-character production, visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-direction-rhythm-no-cut-playtest-v1.md`.

### What's Next

- Human-playtest the current Neutral Medium, Up Medium, Grave Furrow, and Grounded Verdict candidates at 1x; use the deterministic hit/block/whiff buttons and report the move plus phase if anything still clips. Direction-board review and gameplay approval remain separate gates.

## 2026-09-01 - Swahili Forward/Down direction rhythm sampler V1

- Audited the current 84-state matrix and 23-item Specials & Throws hub. The highest-leverage unblocked review gap was the five redesigned Forward/Down specials that remained static direction boards: Forward Light, Forward Medium, Forward Heavy, Down Light, and Down Medium.
- Added a consolidated full-board direction rhythm sampler with Play/Pause, Restart, previous/next beat, 1×/0.5× review, direct beat selection, and authored-P1/mirrored-P2 controls. The sampler highlights one beat on the unchanged full source board; it creates no crops, sliced sprites, intermediate motion, or runtime assets.
- Encoded 28 concept poses and exact visible/proposed contact parity: `1 / 2 / 1 / 1 / 2` contacts across the five moves. Forward Medium exposes one inactive reversal bridge; Down Medium exposes two inactive carry/reversal bridges. Cadence is explicitly illustrative direction-review timing, not 60 Hz combat timing or gameplay data.
- Browser QA PASS: all five source boards loaded at their exact dimensions; every move exposed the expected beat count and impact/bridge roles; half-speed Forward Heavy remained on Beat 1 after 500 ms and advanced to Beat 2 after 1500 ms; mirrored P2 transformed the full board; browser logs contained zero warnings or errors. The sampler is open at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-forward-down-special-direction-rhythm-sampler-v1/review.html?rhythm-v1=1`.
- Linked the sampler from the current Specials & Throws hub and retained the full Engine V2 gameplay playtest separately. Reconciliation remains 84 states / 23 hub items / 11 direction / 7 gameplay / 4 approved-preserve / 1 manual blocker; candidate-only, nondeployable, and no-human-approval boundaries remain unchanged.
- Validation PASS: 72 focused Forge tests, source-board SHA-256 preservation, current-state reconciliation, V3 special review, Forward/Down family regressions, hub regression, browser QA, and protected `NO_GODS_ABOVE/game.js` SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No source art, final sprites, connectors, combat definitions, accepted throws, approved Command Grab, standalone `U`, runtime mapping, roster, Blender path, deployment, commit, push, PR, or publication changed. Applied NGA Engine V2, playable-character production, character visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-forward-down-direction-rhythm-sampler-v1.md`.

### What's Next

- Human-review the five direction rhythms independently. A response should name the move and choose approve-direction, targeted revision, or reject. Any pass covers only the action direction and visible-hit structure; transparent motion production, 60 Hz timing, combat, runtime integration, roster, deployment, and release remain separate gates.

## 2026-09-01 - Swahili complete special mirror and half-speed review V3

- Preserved the complete 19-scenario V2 special-review surface and appended eight P2 block/whiff outcomes for Neutral Medium, Up Medium, Grave Furrow, and Grounded Verdict. The current local review now exposes 27 deterministic special buttons plus the existing throw controls and one gameplay canvas.
- Added a review-only `1× / 0.5×` speed toggle. It scales presentation wall-time while leaving the deterministic 60 Hz simulation, authored ticks, damage, hit counts, hitboxes, and combat definitions unchanged. Browser proof at 0.5× showed P2 Neutral Medium Block still in `RECOVERY · T13` after 350 ms, then completing normally; the page was restored to 1×.
- Browser QA PASS: all eight added P2 scenarios reached the expected COMPLETE block/whiff readouts, Grounded Verdict block preserved exactly two contacts, the page rendered one canvas, and browser logs contained zero warnings or errors. The visible review route is `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1&special-modifier-v1=1&special-review-controls-v3=1&throw-review-controls-v2=1#special-review-controls`.
- Updated the current special/throw hub and active Neutral, Up, and Down family links to V3, preserving V1/V2 evidence as history. Reconciled the 84-entry current matrix, queue, audit, and final report at 23 hub items: 11 direction, 7 gameplay, 4 approved-preserve, and 1 manual blocker.
- Validation PASS: V1/V2/V3 special controls, standalone `U` no-op, frozen Command Grab full playtest, TypeScript/Vite production build, 95 focused Forge tests, and current-state reconciliation. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No move art, combat timing, damage, hitboxes, approved throws, approved Command Grab, runtime release mapping, roster, Blender path, deployment, commit, push, PR, or publication changed. Candidate-only/nondeployable status and every human approval gate remain open. Applied NGA Engine V2, playable-character production, fighting-game balance, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-special-review-complete-mirror-v3.md`.

### What's Next

- Human-playtest the current candidates at 1×, use 0.5× only for motion diagnosis, and report the specific move plus phase that needs revision. This review does not approve motion, final balance, packaging, roster promotion, deployment, or release.

## 2026-09-01 - Swahili special-review P2 mirror parity V2

- Preserved the original 17-scenario special-review evidence surface and added two V2-only P2 mirror playtests: Neutral Medium hit and Up Medium airborne hit. The live review now exposes 19 deterministic special buttons without changing animation sources or combat definitions.
- Deterministic validation records P2 Neutral Medium as one hit / 65 damage / 30 review ticks and P2 Up Medium as one airborne hit / 78 damage / 41 review ticks. Browser playback reaches the matching COMPLETE readouts with one canvas, 19 controls, and zero warnings or errors.
- Updated the current special/throw hub and active Neutral, Up, and Down family links to `special-review-controls-v2=1`, then regenerated the 84-entry current matrix, queue, audit, and current final report. Historical V1 evidence remains preserved.
- Validation PASS: V1 and V2 special-review controls, standalone `U` no-op, frozen Command Grab full playtest, TypeScript/Vite production build, 66 focused Forge tests, current 84-entry / 23-item reconciliation, and scoped whitespace checks. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No move art, timing, damage, hitboxes, approved throws, approved Command Grab, runtime release mapping, roster, Blender path, deployment, commit, push, PR, or publication changed. Human approval is not inferred. Applied NGA Engine V2, playable-character production, visual consistency, sprite validation, fighting-game balance boundaries, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-special-review-mirror-parity-v2.md`.

### What's Next

- Human-playtest `P2 Neutral M` and `P2 Up M Air` beside their P1 equivalents. A pass approves only mirrored review parity for those current local candidates; it does not approve motion, combat balance, packaging, roster promotion, deployment, or release. Grave Furrow V6 and other direction-only specials remain at their existing human gates.

## 2026-09-01 - Swahili Back-special family distinction and Contract Reversal V2

- Audited Back Light, Medium, and Heavy against the active dynamic-special distinction standard. The original Heavy Counter Volley V1 automatically failed because its final both-arms-forward contact silhouette duplicated Standing Heavy; V1 remains preserved as comparison history, not the current direction.
- Authored `special-backward-heavy-contract-reversal-v2` as opaque `REFERENCE_ONLY` direction material: rearward counter tell, one non-damaging deflect, asymmetric pistol trap, one right-hand point-blank contract shot, heavy recoil twist, and long off-balance release. It has one visible discharge, one offensive contact, and one proposed registered hit. A first draft that dropped the second pistol was rejected and retained under generation provenance.
- Built the unified `Counter Clause` family review. Pairwise confirmed distinction deltas are `5 / 5 / 5` against a minimum of `4`; closest cross-move checks pass at `5 / 7 / 7`. Full production evidence remains incomplete, especially Heavy transparent poses, victim interaction, overlays, timing, connectors, and P1/P2 playback.
- Corrected the current-state reconciler so `special_backward_heavy` points truthfully to V2 as `candidate_direction`; old V1 timing/volley metadata no longer masquerades as current. The 23-item review hub now links the family review and current Heavy V2 while retaining the V1 comparison.
- Validation PASS: `110` focused Forge tests, standalone `U` no-op `5/5`, special-review controls `17` scenarios, Grave Furrow core `9/9`, TypeScript build, 84-entry/23-item reconciliation, family browser render with all `8` images loaded and zero logs, and protected `NO_GODS_ABOVE/game.js` SHA256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No Blender path, combat definitions, runtime aliases, accepted throws, approved Command Grab, roster, deployment, or release state changed. Applied NGA Engine V2, playable-character production, visual-consistency, sprite-validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, image generation, and in-app Browser guidance. Obsidian CLI is unavailable, so central sync is not claimed; fallback note: `.agent-sync-pending/2026-09-01-swahili-back-special-family-distinction-v1.md`.

### What's Next

- Human-review the `Counter Clause` family and specifically whether Heavy reads as a counter-only trap into one contract shot rather than Standing Heavy. A pass authorizes direction only; it does not approve motion, transparent production sprites, timing, combat, runtime replacement, roster promotion, deployment, or release.

## 2026-08-31 - Lamuh dedicated grab and throw animation family V1

- Replaced the visible Standing Medium attacker placeholder in universal grab, forward throw, and back throw with `18` dedicated modern-style Lamuh frames. The clips have no purple outline and are classified as new V2 missing-state authoring because no reusable V1 universal-throw artwork was recoverable.
- Fixed the initial split-cell extraction issue by grouping the full connected silhouette before normalization. Every frame now uses the same `2048 x 1536` canvas, fixed authored root `(768, 1360)`, and one sequence-wide `2.0` scale; no per-frame rescale or visual recenter is permitted. The numbered contact sheet has no detached hands/feet, edge clipping, or meaningful magenta.
- Bound dedicated art to pending grab, grab whiff, forward throw, and back throw presentation. Existing deterministic mechanics remain unchanged: forward throw connect/release/total `4 / 14 / 32`, `70` damage, hitstop `6`; back throw `4 / 16 / 36`, `75` damage, hitstop `7`. Victim paths and the single deterministic side switch remain body-driven.
- Also recorded the targeted Air Medium third-foot repair: extension/contact no longer show a duplicate foot, while the approved one-hit `44`-damage, `21`-tick flow and gameplay contract remain unchanged.
- Validation PASS: Lamuh core/content/closure suite, TypeScript/Vite production build, focused Forge throw packages, and browser smoke. Browser captures cover forward mid-track, back mid-track, and grab-whiff recoil. Protected `NO_GODS_ABOVE/game.js` remains hash-locked and unchanged.
- Candidate remains local, unpromoted, and nondeployable. No commit, push, PR, merge, or deployment occurred. Applied NGA Engine V2, Fighter Atlas Factory, playable-character production, visual consistency, sprite validation, playtest QA, image generation/editing, Obsidian Markdown, and Obsidian CLI guidance.
- Review route: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. Central Obsidian sync is not claimed until the CLI/bridge is verified; repository fallback is `.agent-sync-pending/2026-08-31-lamuh-legacy-v2-throw-animation-family-v1.md`.

### What's Next

- Human-playtest Grab Whiff, Forward Throw, and Back Throw at normal speed and review fixed scale, body mechanics, victim causality, release readability, and recovery into neutral. Stop at `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW`, or request a targeted repair. Do not infer first-playable or production approval from this gate.

## 2026-08-29 - Lamuh Air Light and Air Medium smooth single-hit rebuild V1

- Superseded the sparse-pose Air Light/Air Medium playback after the user's targeted report that both remained jittery compared with the ground normals. Protected V1 art and hashes remain unchanged; the prior candidate strips remain preserved as history.
- Authored targeted connector-art candidates in the approved modern Lamuh style. Air Light now uses five poses for one same-arm palm action: chamber, extension, one contact, held follow-through, and guarded recovery. Air Medium now uses six poses for one same-leg kick: chamber, extension, one contact, retraction, knee recoil, and guarded recovery. No punch, second strike, or double-hit reading remains.
- Preserved gameplay and recommended total durations: Jump Light stays one hit / `22` damage / `13` ticks, and Jump Medium stays one hit / `44` damage / `21` ticks. Only visual exposure distribution and frame provenance changed; deterministic 60 Hz ownership, inputs, hitboxes, cancel rules, meter/scaling behavior, and unrelated moves remain unchanged.
- Rebuilt normalization, closure data, review UI, Forge packages, tests, and browser evidence. The Forge packages now consume the validated `2048x1536` connector frames with the real fixed root instead of falsely treating new frames as `448x448` V1 cells. Generated connector provenance is explicit and V1 motion references remain hash-locked.
- Visual QA PASS: `5` distinct Light frames, `6` distinct Medium frames, one highlighted contact each, first-frame heights `[812,823,814]` across Light/Medium/Heavy (`1.34%` delta), fixed root `(768,1360)`, zero meaningful magenta pixels, no edge clipping, no neighboring-frame bleed, and body-only contact presentation.
- Validation PASS: focused Lamuh deterministic/content/closure suite, TypeScript/Vite production build, and Lamuh browser smoke. Browser proof records Light `1 hit / 22 damage`, Medium `1 hit / 44 damage`, zero console errors, and zero failed requests. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`; sandbox and comparison routes return HTTP `200`.
- Candidate remains local, nondeployable, unpromoted, and awaiting targeted human motion review. No commit, push, PR, merge, deployment, or broader approval occurred. Applied NGA Engine V2 preservation guidance, playable-character production, character visual consistency, sprite validation, fighting-game balance boundaries, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh manifest, Fighter Atlas Factory, image generation/editing, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed; fallback note: `.agent-sync-pending/2026-08-29-lamuh-air-light-medium-smooth-single-hit-v1.md`.

### What's Next

- Human-playtest `j.L one-hit check`, `j.M one-hit check`, and normal jump-to-air-normal-to-landing flow at 1x and 0.5x. A pass approves only this targeted smooth single-hit repair; it does not promote the first playable or full character.

## 2026-08-29 - Swahili Up-special family distinction review V1

- Built the missing family-level review for `special_up_light`, `special_up_medium`, and Grave Furrow V6 without generating new fighter art. The shared family identity is `Vertical Judgment`: compact pistol-frame vertical check -> planted rising scythe hook -> traveling floor-to-overhead-to-downward scythe route.
- Pairwise direction audit PASS at `7/7` authored distinction axes for Light/Medium, Light/Heavy, and Medium/Heavy. Closest other-move checks also clear the five-axis gate: Light vs Standing Block `6 confirmed`, Medium vs Crouching Heavy `7 confirmed`, and Heavy vs Forward Heavy Execution Crescent `5 confirmed + 1 spatial provisional`.
- Added an honest evidence-completeness audit. The family is ready for human direction comparison, but full production evidence is not complete: Light still lacks a silhouette scrub and explicit 60 Hz strip; Medium timing remains non-authoritative metadata; Heavy V6 still lacks transparent numbered poses, silhouette/path overlays, timing, and P1/P2 motion playback.
- Corrected the Up Medium review page to show its authoritative current state: local Engine V2 gameplay candidate at the human gameplay gate, with temporary `11 / 4 / 20`, `78` damage, one-hit values—not the stale key-pose-only gate. Updated its stale focused tests to distinguish local debug integration from production/runtime promotion.
- Connected the unified review to the existing 23-item Specials & Throws hub. Browser QA PASS: three variant boards plus four Light/Medium GIFs loaded at expected dimensions, all three family links render, Up Medium current-gate wording is visible, and browser logs are empty.
- Validation PASS: current `84`-entry / `23`-item reconciliation, `86` focused Forge tests, standalone-`U` no-op `5/5`, special review controls `17` scenarios, and protected `NO_GODS_ABOVE/game.js` SHA256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No sprites, combat definitions, aliases, accepted throws, approved Command Grab, roster, Blender path, deployment, or release state changed. The broad historical baseline suite retains the unrelated seven-file Engine V2 hash-lock drift recorded in the prior entry.
- Review route: `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-up-special-family-distinction-v1/review.html`. Obsidian CLI remains unavailable, so central sync is not claimed; fallback note: `.agent-sync-pending/2026-08-29-swahili-up-special-family-distinction-v1.md`.

### What's Next

- Human-review the family relationship plus each targeted stop line. Do not infer Light contact approval, Medium gameplay approval, Heavy motion approval, sprite completion, final timing/combat approval, runtime replacement, roster promotion, deployment, or release from the family-direction pass.

## 2026-08-29 - Swahili Grave Furrow running slash-carry direction V6

- Reworked the current Grave Furrow direction after the user's targeted note that Swahili should stay in motion with the slash. V6 keeps the existing grind/run/pickup/overhead setup, moves the one contact to an unmistakable in-stride beat, then adds a passing cross-step and seventh running-exit pose so the recovery no longer reads as a low stop.
- Packaged the board as `REFERENCE_ONLY`, candidate-only direction evidence with a hash-bound seven-beat contract, provenance, fresh visual gate, status, focused tests, and a browser-validated review page. The single-hit contract remains `1 visible / 1 proposed`; beats 6–7 are moving recovery only.
- V5 is preserved as a superseded comparison. Current V1 gameplay, final sprites, connectors, combat values, runtime aliases, accepted throws, approved Command Grab, roster, and release state remain unchanged. No Blender path was used.
- Validation PASS: Grave Furrow V3–V6 lineage tests, current 84-state reconciliation, throw-review parity regression, `63` focused tests, local HTTP/render QA, 2172×724 image load, P2 mirror control, and zero browser logs. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`; V6 is absent from runtime sprite sources.
- The broad historical Swahili discovery suite still stops on pre-existing baseline hash-lock drift in seven untracked Engine V2 files: `compile_content.js`, `validate_production_contracts.js`, `checksum.ts`, `engine.ts`, `replay.ts`, `types.ts`, and `fighters.ts`. None of those files were touched in this repair; the targeted V6/current-state/runtime-boundary suite is green.
- Review route: `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-running-slash-carry-v6/review.html`. Central Obsidian sync is not claimed; fallback note: `.agent-sync-pending/2026-08-29-swahili-grave-furrow-running-slash-carry-v6.md`.

### What's Next

- Human-review whether the slash, passing step, and running exit read as one continuous action. A pass would authorize this motion direction only; it would not approve timing, transparent production frames, connectors, combat, runtime integration, roster promotion, deployment, or release.

## 2026-08-29 - Swahili P2 Command Grab mirror-parity review controls V2

- Extended the deterministic throw-review surface from nine to eleven scenarios by adding P2 mirrored Command Grab hit and whiff controls. The original V1 scenario order remains exported and tested unchanged; the V2 debug page appends only `p2_command_grab_hit` and `p2_command_grab_whiff` through the normal one-tick P2 input queue.
- Preserved the approved Command Grab exactly: `220` damage, `107` authored ticks, one damage event, one side switch on hit, and no victim movement on whiff. Deterministic review completion remains `118` elapsed ticks on hit and `106` on whiff for both sides.
- Browser QA PASS at the visible full playtest: all `11` throw controls render; P2 mirrored hit completed with the defender at `780` health and no debug warnings; P2 mirrored whiff left both fighters at `1000` health and the victim fixed at `x=-220` with no debug warnings.
- Updated only current hub/playtest URLs to the V2 review flag. Historical V1 status and browser evidence remain unchanged. Reconciled the authoritative `84`-entry matrix and `23`-item review hub at the accepted `11 direction / 7 gameplay / 4 approved-preserve / 1 manual-blocker` split; candidate-only, nondeployable, and no-human-approval boundaries remain intact.
- Validation PASS: both throw-control suites, Command Grab full playtest `7/7`, universal throw presentation `6/6`, standalone-`U` protection `5/5`, Engine V2 TypeScript/Vite production build, reconciliation script, and combined Forge coverage suite `73/73`. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- The manual Throw Tech paint-over gate remains closed; no automated retry occurred. No fighter sprites, combat definitions, accepted motion, runtime release mapping, roster, deployment, Blender path, push, PR, or merge changed. Applied NGA Engine V2 preservation guidance, playable-character production, visual consistency, sprite validation, Animation Fluidity Standard, fighting-game balance boundaries, and in-app Browser review guidance. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-29-swahili-p2-command-grab-mirror-parity-v2.md`.

### What's Next

- Human-playtest P1 and P2 Command Grab hit/whiff buttons for mirrored motion and punish-window feel. Treat any pass as approval of this targeted review parity only; do not infer Throw Tech art approval, wider throw balance approval, final Swahili approval, runtime promotion, or release.

## 2026-08-28 - Swahili Forward Special family direction rebuild V2

- Rebuilt the unresolved Forward Light and Forward Medium special directions in the existing 2D review pipeline. Forward Light is now a five-pose, one-hit warning-drag into compact shaft drive and hard brake; Forward Medium is a seven-pose, two-hit shoulder drive into an inactive carried reversal, cross-body rip, and spent guard. Forward Heavy Execution Crescent V2 remains preserved as the family power member.
- Packaged both concepts as `REFERENCE_ONLY`, opaque direction boards with key-pose contracts, provenance, status records, individual review pages, and one unified family review. The first Medium board touched both side edges and is retained under its generation `rejected/` folder; the repaired board passes safe-frame preflight.
- The family distinction audit passes all seven authored axes for Light versus Medium, Light versus Heavy, and Medium versus Heavy. These are direction-level claims only: no final transparent sprites, connectors, combat timing, damage, hitboxes, runtime aliases, roster state, or release state changed.
- Reconciled the current matrix, queue, and consolidated review hub: manual-art blockers decrease from 10 to 8 and direction/key-pose candidates increase from 13 to 15. Historical V1 manual-art kits and their status records remain preserved.
- Validation PASS: focused reconciliation suite `67/67`, Engine V2 TypeScript/Vite production build, standalone `U` no-op, Grave Furrow core, Grounded Verdict, and frozen Command Grab runtime checks. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`; the new Forward V2 IDs are absent from runtime sprite sources.
- Unified review is open at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-forward-special-family-v2/review.html`. Browser QA loaded all three direction boards at their expected dimensions with zero errors. No Blender path was used. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-28-swahili-forward-special-family-v2.md`.

### What's Next

- Human-review the Forward Light one-hit drive and Forward Medium two-hit shoulder/reversal/rip process in motion-design terms. Do not generate final sprites, integrate runtime aliases, alter combat values, replace Forward Heavy, touch accepted throws or Command Grab, or infer wider Swahili approval until the relevant direction gates are explicitly closed.

## 2026-08-28 - Lamuh Jump Medium single-hit flow repair V1

- Superseded the immediately prior two-hit Jump Medium candidate after the user's targeted motion-readability rejection. The accepted source artwork and fixed-root scale remain intact; authored playback now uses four protected poses only: same-leg chamber, side-kick contact, knee recoil, and guarded air recovery. The confusing fist entry and cross-punch are excluded from V2 playback without modifying the V1 source.
- Restored exact one-hit parity across animation, deterministic gameplay, closure metadata, Forge packages, sandbox diagnostics, and browser smoke. Jump Medium now has one `legacy_jm_kick` hitbox, one visible contact, `44` damage, and recommended candidate B timing `6 / 4 / 11` (`21` ticks).
- Validation PASS: all focused Lamuh deterministic/content/closure tests, TypeScript/Vite build, Lamuh browser smoke, `4` distinct authored frames, visible/registered impacts `1 / 1`, fixed-root cross-move scale delta `5.04%`, zero meaningful magenta pixels, and no edge contact. Browser evidence confirms Jump Medium `1 hit / 44 damage`, victim health `956`, combo count `1`, and hit ordinal `1`.
- Protected `NO_GODS_ABOVE/game.js` remains unchanged at SHA256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. Both local routes return HTTP `200`: `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` and `http://127.0.0.1:4177/lamuh-v1-v2-review.html`.
- Candidate remains local, nondeployable, unpromoted, and stopped at the targeted human review gate. No commit, push, PR, merge, deployment, or broader approval occurred. Applied NGA Engine V2 preservation guidance, playable-character production, character visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable, so central sync is not claimed; fallback note: `.agent-sync-pending/2026-08-28-lamuh-jump-medium-single-hit-flow-v1.md`.

### What's Next

- Human-playtest `j.M one-hit check` and normal jump-to-Jump-Medium flow. Treat a pass as approval of this targeted single-hit repair only; do not infer full air-normal, first-playable, or production approval.

## 2026-08-28 - Lamuh Jump Light one-hit and Jump Medium two-hit clarity pass V1

- Applied the user's explicit hit-parity direction: Jump Light now authors only the protected chamber, single open-palm contact, and guarded recoil frames, so the fist-looking legacy entry no longer implies an extra hit. The omitted V1 source frame remains hash-protected and unchanged.
- Modernized Jump Medium into a real two-hit move without regenerating accepted motion. The preserved side kick is contact one (`ticks 6-7`); the connected cross-punch during leg retraction is contact two (`ticks 10-11`), with a two-tick inactive gap for readability. Distinct deterministic hitbox IDs allow each contact to hit once.
- Preserved the prior practical damage target: raw `22 + 24` resolves to `44` after normal second-hit scaling. Jump Light remains `22` damage and exactly one hit. Jump Medium's recommended candidate B is now `23` ticks (`6 / 8 / 9`); Jump Light remains `13` ticks (`3 / 5 / 5`).
- Added multi-contact closure/Forge metadata, plural contact labeling on the V1/V2 review route, combo/hit-count evidence in the sandbox, and dedicated `j.L one-hit check` / `j.M two-hit check` buttons. Both remain body-only with contact VFX disabled.
- Validation PASS: focused Lamuh deterministic/content/closure suite, TypeScript/Vite production build, Lamuh browser smoke, zero meaningful magenta pixels, no edge contact, all authored frames distinct, fixed-root scale delta `5.85%`, browser proof of Jump Light `1 hit / 22 damage` and Jump Medium `2 hits / 44 damage`, and protected `NO_GODS_ABOVE/game.js` SHA256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Candidate remains local, nondeployable, and unpromoted at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. No commit, push, PR, merge, deployment, or broader approval occurred. Obsidian CLI is unavailable, so central sync is not claimed; fallback note: `.agent-sync-pending/2026-08-28-lamuh-air-normal-hit-parity-v1.md`.

### What's Next

- Human-playtest the dedicated one-hit/two-hit buttons and the normal jump-to-air-normal transitions. Treat any pass as approval of this targeted hit-readability repair only; do not infer full air-normal, first-playable, or production approval.

## 2026-08-28 - Lamuh Down Heavy scale and Shift-dash targeted repair V1

- Applied the user's narrow Down Heavy scale correction as one sequence-wide `0.95` multiplier around the unchanged authored root `(768,1360)`. All seven `Crown Riser` poses retain their internal proportions, root path, exposure order, one-hit parity, and V1-derived motion; no per-frame renderer scale or visual recentering was added.
- Repositioned and reduced the outcome-routed contact accent through the same root-relative `0.95` transform, keeping it attached to the raised hand. The new contact socket is `(1026,334)`. All frames retain edge padding and zero meaningful magenta/purple contour pixels.
- Added `ShiftLeft` and `ShiftRight` as sandbox dash shortcuts. Neutral Shift queues an authored forward double tap; holding left or right while pressing Shift queues that side. The shortcut therefore enters the existing deterministic `dash`, `backdash`, `air_dash_forward`, or `air_dash_backward` state as appropriate. Existing manual double-tap dash remains unchanged.
- Validation PASS: cross-clip fixed-scale audit (`51` measured frames, `25-36` px), `36/36` focused Lamuh deterministic/content/closure checks, 22-package content contract checks with every package nondeployable, Lamuh browser smoke with neutral-Shift forward dash and directional-Shift backdash, TypeScript/Vite production build, and protected `NO_GODS_ABOVE/game.js` SHA256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Review evidence: `tools/nga-forge/review/lamuh-legacy-v2-crouching-heavy-v1/crouching-heavy-numbered-contact-sheet.png`, `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/crouching-heavy-sequence-scale-095.png`, and `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/browser-smoke-closure.json`.
- Candidate remains local, nondeployable, and unpromoted at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. No commit, push, PR, merge, deployment, or broader approval occurred. Central Obsidian sync is not claimed; fallback note: `.agent-sync-pending/2026-08-28-lamuh-down-heavy-scale-shift-dash-v1.md`.

### What's Next

- Human-playtest `crouch -> 2H`, neutral Shift, and direction+Shift in motion. Treat any pass as approval of this targeted scale/control repair only; do not infer broader first-playable or production approval.

## 2026-08-28 - Lamuh targeted standing-scale closure and V1-preserved air dashes V1

- Applied the user's narrow scale feedback without changing accepted neighboring frames: Standing Medium frame `00 wide_ready_entry` alone now uses body-scale correction `0.69`, while frames `01-07` remain at `0.70`. Its visible height is `712` px versus a `725` px preserved-frame median (`1.79%` delta), so it is no longer oversized. Standing Light now holds an authored anatomy scale of approximately `0.83` across all six frames.
- Added strict targeted scale evidence under `tools/nga-forge/review/lamuh-legacy-v2-cross-clip-scale-v1/`: the user-reference manifest, standing-scale analysis, measured overlay, and validation report all pass. Purple contour checks remain zero meaningful magenta pixels for both Standing Light and Standing Medium.
- Preserved the legacy Lamuh forward/backward air-dash motion from `lamuh_sheet_2_air_movement_atlas.png`, normalized it to the shared `(768,1360)` root and modern outline-free presentation, and integrated one deterministic air dash per airtime. Forward travel is `72.10` units and backward travel is `-62.30` units over independently authored `14`-tick states; gravity pauses during the burst and the dash returns to jump state.
- Retired the byte-identical final backward-air-dash duplicate from the authored frame list and represented its intent as a four-tick air-brake exposure. The movement package now contains `37` unique frames and the Lamuh Forge build contains `22` nondeployable candidate packages.
- Validation PASS: `36` focused Lamuh deterministic/content/closure tests, TypeScript/Vite production build, content/package checks, fixed-scale audit (`51` measured frames at `25-36` px), and browser smoke including the corrected Standing Medium entry plus both air-dash entries. The broader Engine V2 suite reaches only the pre-existing Swahili sandbox approval-hash mismatch: untracked `src/sandbox/swahiliSandboxSimulation.ts` hashes `A78973...` while its test expects `998353...`; that unrelated file and lock were not changed.
- Refreshed stale first-playable evidence without changing gameplay or approval state: the closure receipt now records `98` extracted protected cells, `49` audited animations, `22` nondeployable packages, `36` focused checks, both air-dash browser states, and the targeted scale validation. Removed the obsolete claim that Crouching Light/Medium reuse standing rows; current debt now truthfully identifies missing authored transition/launch/grab/throw art. The human review document presents the standing-scale/air-dash preflight before the broader four-section closure queue.
- Protected `NO_GODS_ABOVE/game.js` remains hash-locked. The sandbox is local at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`, candidate-only, nondeployable, and awaiting the user's targeted scale/movement review. No commit, push, PR, merge, deployment, runtime promotion, or broader production approval occurred.
- Applied NGA Engine V2 preservation guidance, playable-character production, character visual consistency, sprite validation, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Fighter Atlas Factory, reference validation, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-28-lamuh-standing-scale-air-dash-closure-v1.md`.

### What's Next

- Human-playtest `idle -> 5L`, `idle -> 5M`, and both air-dash buttons in motion. This stop line is only the targeted standing-scale and movement review gate; do not infer full-character approval or promote any candidate assets.

## 2026-08-28 - Lamuh fixed-scale repair and user-video forward walk V1

- Classified the earlier combined Lamuh sandbox as `REJECTED_FOR_MOTION_REVISION` after the user's report that Lamuh changed size between idle, attacks, and Crouching Heavy. No earlier narrow animation approval was widened or revoked.
- Integrated the user-supplied `Lamuh_performs_forward_walk_cycle_202608271343.mp4` as the forward-walk motion source. The protected review copy is 720x1280, 24 fps, eight seconds, 192 frames, SHA256 `C3D745562609834CEB3FF3DA63047874B0A068688A104EDBF39CB67CACAB0E40`; sixteen full-resolution source frames at indices `0,12,...,180` now drive a 32-tick deterministic loop with one shared baked source-camera scale and no runtime rescaling.
- Re-normalized idle, backward walk, all six ground normals, Standing Heavy's startup/recovery, and Crouching Heavy's launcher/contact/recovery around the shared 2048x1536 canvas and fixed root `(768,1360)`. Purple outline removal remains intact. Crouching Heavy contact is no longer a shrunken body, and Standing Heavy contact/overshoot retain an equal body-scale correction.
- Added the fixed-scale cross-clip audit and same-viewport contact sheet under `tools/nga-forge/review/lamuh-legacy-v2-cross-clip-scale-v1/`. The automated perspective-aware shoulder landmark gate passed `51` measurable frames at `26-36` pixels; Standing Medium/Heavy occlusions remain explicitly subject to human same-viewport review rather than a pose-invalid visible-height gate.
- Validation PASS: full Lamuh reconstruction/package chain, `35` Lamuh deterministic/content/closure tests, TypeScript/Vite production build, Lamuh browser smoke, and live frame-step inspection of Standing Heavy startup plus Crouching Heavy contact. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- The repaired playtest remains local, candidate-only, nondeployable, and open/playing at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. No commit, push, PR, merge, deployment, runtime promotion, or production approval occurred.
- Applied NGA Engine V2 preservation guidance, playable-character production, character visual consistency, sprite validation, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Fighter Atlas Factory, video review, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-28-lamuh-fixed-scale-video-walk-repair-v1.md`.

### What's Next

- Human-playtest A/D walking, idle-to-walk, walk-to-attack, Standing Heavy, and Crouching Heavy in the visible sandbox. Treat the repaired package as `APPROVED_WITH_TARGETED_REPAIR` only if the same-size relationship holds in motion; otherwise return a move-specific frame/timing note. Do not promote any asset or infer full-character approval from this review.

## 2026-08-27 - Swahili Grave Furrow continuous-motion direction V4

- Applied the user's targeted correction that Swahili should stay in motion with the slash instead of stopping after the running pickup. The active five-beat review direction is now: advancing ground grind, forward-running pickup, continuous rising crossover, forward overhead slash acceleration, and one moving grounded cleave.
- Replaced the V3 planted gather and static overhead hold with forward-traveling poses. V3 remains preserved as `superseded-draft`; current V1 gameplay and sandbox remain the unchanged primary comparison and fallback.
- Fresh-context Gauntlet verdict is `PASS_FOR_DIRECTION_REVIEW_ONLY`: pose 3 reads as a crossover rather than a plant, pose 4 reads as moving slash acceleration rather than a hold, root/coat/scythe momentum continues screen-right, the shaft remains straight and unbroken, pistols stay holstered, and only pose 5 implies impact.
- Added a hash-bound comparison against Forward Heavy Execution Crescent V2. The fresh-context distinction gate passes at direction level with five confirmed axes plus one spatial axis that remains provisional: Grave Furrow keeps moving into a late downward floor contact and future carried recovery, while Forward Heavy deliberately plants into an earlier rising-diagonal contact and ends in a planted exhausted brake. Only the opening ground grind is intentionally shared.
- Pairwise collapse failures are additive to the full dynamic-distinction standard: Grave Furrow may not regain a middle plant, turn pose 4 into a rising hit, lose its downward final contact, or snap its later recovery to neutral; Forward Heavy may not lose its maximum coil, rising contact, or planted brake. Final transparent motion must re-prove spatial role and a distinct Grave Furrow post-contact recovery.
- The 2172x724 RGB board remains `REFERENCE_ONLY`: it has an opaque checkerboard, 9px/15px side margins, and must not be sliced or packaged. Final production still requires transparent RGBA poses, all four connectors, same-limb frame-scrub proof, canonical body/scythe/chain locks, lossless P1/P2 playback, victim/contact evidence, explicit Forward Heavy differentiation, and one visible/registered hit parity.
- Validation PASS: V4 `6/6`, superseded V3 `4/4`, review hub `7/7`, current matrix `37/37`, Engine V2 TypeScript/Vite build, special controls `17/17`, standalone-U protections `5/5`, and throw controls `9/9`. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Active review route: `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-grind-run-rotation-cleave-v4/review.html`. The consolidated hub points only to V4 while retaining the current V1 full-playtest route.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Special Move Standard, image generation, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. No Blender path was used. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-grave-furrow-continuous-motion-v4.md`.

### What's Next

- Human-review whether V4 now carries enough forward momentum through the slash and remains distinct from Forward Heavy. Do not generate final sprite frames, replace current V1 gameplay, alter combat timing/hit count, touch accepted throws or Command Grab, or promote roster/release state until the direction gate is explicitly closed.

## 2026-08-27 - Swahili Grave Furrow five-beat run-in direction V3 (superseded by V4)

- Applied the user's targeted Grave Furrow revision by inserting a real forward-running pickup pose between the opening ground grind and the planted gather. The review-only sequence is now: ground grind, forward run into pickup, planted gather, overhead hoist, and one grounded cleave.
- Preserved the current V1 full-playtest implementation as the active gameplay comparison. V2 and V3 are now labeled `superseded-draft`; V4 is the active alternate direction and remains nondeployable with human direction and motion decisions unset.
- The selected five-pose board keeps Swahili's approved suit, boar head, holstered dual pistols, and a straight unbroken scythe. Only the final cleave communicates an impact; grind, run, gather, and hoist are presentation beats rather than extra hits. The RGB checkerboard background makes this reference art only, not a runtime-ready transparent sprite source.
- Fresh-context Gauntlet review passed the board for direction review only. Remaining blockers are transparent authored final poses, exact scythe/chain scale continuity, connector frames, victim/contact evidence, and final visible-hit versus registered-hit parity.
- Validation PASS: V3 direction `4/4`, review-hub draft `7/7`, current matrix `37/37`, Engine V2 TypeScript/Vite build, special controls `17/17`, and standalone-special modifier `5/5`. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Historical review route: `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-grind-run-hoist-cleave-v3/review.html`. It now links forward to active V4; the consolidated hub no longer presents V3 as the active alternate.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite validation, fighting-game balance, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Special Move Standard, image generation, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. No Blender path was used. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-grave-furrow-five-beat-v3.md`.

### Historical stop line

- Do not review or promote V3 as the active direction. It is retained only as evidence of the planted-pause draft that V4 replaced.

## 2026-08-27 - Lamuh Legacy V2 Crouching Heavy and modern movement combined playtest V1

- Recorded the user's narrow Crouching Medium pass as `APPROVED_V1_MOTION_PRESERVED` plus `APPROVED_V2_RETIMING` for timing candidate B (`22` ticks). Impact/combat approval, runtime promotion, production baseline, first-playable approval, and broader character approval remain false.
- Completed the outline-free Crouching Heavy `Crown Riser` candidate from seven protected V1 poses. It retains the low coil, knee-driven rise, same-hand contact, held follow-through, and guarded return; the duplicate V1 drawing is represented as authored exposure while one distinct recovery connector keeps all seven V2 frames unique. Candidate B is `37` ticks; human motion/timing approval is still pending.
- Added modern outline-free idle, walk-forward, and walk-backward candidates to the isolated Engine V2 sandbox. Idle keeps the recovered `60`-tick loop through four distinct poses; each six-pose walk cycle keeps an independent `18`-tick rhythm. All movement and ground-normal sprites use fixed roots and a constant runtime renderer scale.
- The combined sandbox now runs modern idle/walk art and all six modern ground normals over the real deterministic 60 Hz simulation. Live frame-step QA confirmed `modern_movement` for idle, forward walk, and backward walk, and `modern_ground_normal` for Crouching Heavy. Grounding and scale remained coherent; browser diagnostics contained zero errors.
- Validation PASS: full Lamuh reconstruction/package chain; Engine V2 TypeScript/Vite build; `35` Lamuh deterministic/content/closure tests; both Lamuh browser smoke routes. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- The playtest remains local, candidate-only, nondeployable, and open at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`. No commit, push, PR, merge, deployment, runtime-art promotion, or production approval occurred.
- Applied NGA Engine V2 preservation guidance, playable-character production, character visual consistency, sprite validation, fighting-game balance, VFX integration, git checkpoint safety, Character Sprite Pipeline, Animation Fluidity Standard, Lamuh animation manifest, Fighter Atlas Factory, image generation, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-lamuh-legacy-v2-crouching-heavy-modern-movement-playtest-v1.md`.

### What's Next

- Human-playtest idle, A/D walking, the six ground normals, and their transitions together. Crouching Heavy and all movement art remain unapproved until the user gives a narrow decision. Grab/throw attacker art remains explicit manual-art debt; no later move or production gate should be inferred from this combined-playtest review.

## 2026-08-27 - Swahili Blender path explicitly rejected; 2D-only continuation

- The user explicitly directed: `DO NOT USE BLENDER BUILD`. Treat this as a hard production constraint for the current Swahili continuation: use the existing 2D sprite/playtest pipeline only.
- A newly rendered offline Forward Heavy Execution Crescent Blender candidate remains local under `tools/nga-forge/production/characters/swahili/pipeline/motion-first-v1/blender/` but is rejected, unintegrated, unlinked, and must not be used as Swahili motion, sprite, gameplay, review-hub, or release evidence.
- Verification found no references to the candidate in `NO_GODS_ABOVE`, the Swahili status records, or the consolidated review hub. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No runtime, combat, sprite, status, review-hub, roster, or release state changed. Standalone `U` remains inert and future Swahili animation work should continue from the current 2D playtest baseline.
- Applied the Obsidian Markdown and Obsidian CLI continuity guidance. Direct central-vault sync was not attempted because the CLI remains unavailable; fallback handoff: `.agent-sync-pending/2026-08-27-swahili-blender-path-rejected.md`.

### What's Next

- Continue Swahili specials and animation repair in the existing 2D sprite/playtest workflow only. Do not revive, link, validate, promote, or derive final art from the rejected Blender candidate.

## 2026-08-27 - Swahili draft-only human decision ledger V1

- Added an in-memory-only decision scratchpad to the consolidated Swahili special/throw review hub. Exactly 16 direction/key-pose/gameplay/interaction candidates receive `draft_approve`, `draft_request_targeted_revision`, or `draft_reject` controls; the four accepted-motion preserve items and three manual-art blockers remain read-only.
- The exported JSON is explicitly `draftOnly: true`, `authority: none`, `approvalRecordsWritten: false`, and `runtimeOrReleaseStateChanged: false`. It includes the raw manifest fingerprint and each item's stage, gate, question, source status, approval effect, choice, note, and validity. Revision and rejection require a targeted 8-600 character note. State is never stored and resets on reload.
- Browser QA PASS: neutral `0/16`, exact `23 / 16 / 4 / 3` lanes, draft approve and note-required revision behavior, inert script-shaped note text, filter persistence (`9 / 7 / 23`), and reload reset. The hub is left visible at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-v2-special-throw-review-hub-v1/review.html?hub-v1=1`. Browser console history was not captured in this pass; no zero-diagnostic claim was added.
- Regression PASS: focused ledger `7/7`, Engine V2 build, standalone-special-modifier `5/5` including grounded and airborne U-alone no-op, special controls `17/17`, throw controls `9/9`, and current matrix `37/37`. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Evidence: `tools/nga-forge/production/characters/swahili/status/swahili-v2-human-decision-draft-ledger-v1.status.json` and matching browser report. The fresh-context Gauntlet critic required non-authoritative wording, exact lane isolation, manifest fingerprinting, targeted-note validation, XSS-safe text handling, and zero persistence/network writes; those constraints shaped the implementation.
- Applied NGA Engine V2, Playable Character Production, Fighting Game Balance, Special Move Standard, Fighting Game Playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-human-decision-draft-ledger-v1.md`.

### What's Next

- Use the visible hub to review the 16 candidates and copy the draft JSON before leaving. A live user decision and separate governed approval record are still required to close any gate. Do not treat the scratchpad as approval, change accepted throw/Command Grab motion, replace fallbacks, rewrite the sandbox approval hash, promote the roster/package, or release through this tooling.

## 2026-08-27 - Swahili deterministic special controls and review-hub reconciliation V1

- Added 17 deterministic special-review scenarios to the full Engine V2 playtest: hit/block/whiff coverage for Neutral Medium, Up Medium, Grave Furrow, and Grounded Verdict; P2 mirrors for both Heavy specials; and explicit Forward Heavy, Down Light, and Down Medium fallback comparisons. The existing nine throw scenarios remain available beside them.
- Preserved the corrected input contract: `U` alone is inert grounded and airborne, Grave Furrow is `W+L`, the air-combo ender is cancel-only `U+L`, and `U+K` / `U+I` remain intact. Browser QA reconfirmed U-alone leaves state, attack, and position unchanged.
- Reconciled all 23 items in the newer special/throw review hub into the 84-state current matrix: nine direction/key-pose decisions, seven gameplay/interaction decisions, four approved motions to preserve, and three manual-art blockers. Execution Crescent V2, Stamped Shaft Check V2, Hook/Ferrule Shove V2, and Grave Furrow are now the active review directions; Ground Drag Slice, Fast Shaft Check, Low Hook Control, and Vertical Launcher are labeled only as runtime or historical fallbacks.
- Validation PASS: Engine V2 build; special controls `17/17`; throw controls `9/9`; matrix suite `37/37`; browser `195/195` textures with zero warnings/errors. The full Engine V2 suite reaches only the pre-existing sandbox approval-hash mismatch (`998353...` expected, `A78973...` actual); the lock was not rewritten.
- The full playtest is visible at `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1&special-modifier-v1=1&special-review-controls-v1=1&throw-review-controls-v1=1#special-review-controls`. Candidate-only evidence is under `tools/nga-forge/production/characters/swahili/status/swahili-v2-special-review-controls-and-gate-reconciliation-v1.status.json` and the matching browser report.
- Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No combat definitions, accepted throw/Command Grab motion, roster, legacy runtime, deployment, push, PR, merge, or human approval changed.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite validation, fighting-game balance, local-versus, animation fluidity, sprite-pipeline, special-move, fighting-game playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. A fresh-context Gauntlet critic identified the stale matrix as the highest-leverage safe repair. Obsidian CLI is unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-special-review-controls-and-gate-reconciliation-v1.md`.

### What's Next

- Human-playtest the 17 special buttons and review the three redesigned direction boards. Keep accepted throws and Command Grab frozen; do not replace fallbacks, promote a roster/package, rewrite the sandbox approval hash, or release until the corresponding human gates are explicitly closed.

## 2026-08-27 - Ty signature special transparent stage candidate V1

- Preserved the user-supplied 1280x720, 24 fps, 240-frame signature-attack video under `tools/nga-forge/production/characters/ty/review/signature-attack-video-v1/source-video/` and built 63 review poses on 1536x1536 RGBA canvases.
- Replaced the neutral-gray video matte with real alpha using a 7-30 neutral-distance ramp plus explicit red-effect protection. Detached red shards, pale arcs, white impact cores, rings, dust, and recovery sparks remain; red and bright-pixel retention both measure 100%, transparent corners pass, and zero normalized frames touch a canvas edge.
- Added `Signature Special` to the isolated `ty-stage-preview` only. The stage uses wide simulation framing plus presentation offsets so the full blast remains visible and reaches the idle defender visually. No hitboxes, damage, hit count, combat timing, inputs, roster data, runtime animation aliases, public assets, or deployment changed.
- Validation PASS: Python syntax and 63-frame RGBA audit; Engine V2 TypeScript plus production Vite build; checker/light/dark contact sheets; live in-app stage review with zero captured warning/error diagnostics. The tab is visible and playing at `http://127.0.0.1:5176/ty-stage-preview.html?repair=shin-feet-v4`.
- Status remains local candidate-only, nondeployable, and awaiting human motion/identity/effect/timing review. Source caveat: the supplied video changes the lower-body treatment from white trousers to dark/black during crouched recovery; transparency preserves that source content rather than repainting it.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, VFX Integration Audit, Character Sprite Pipeline, Animation Fluidity Standard, Fighter Atlas Factory, Watch fallback guidance, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. The Watch helper could not read its private config folder, so analysis stayed local through existing FFmpeg/Pillow tooling. Obsidian CLI is unavailable, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-ty-signature-attack-transparent-special-v1.md`.

### What's Next

- Human-review the open `Signature Special` loop. Approve it, request a targeted matte/motion/identity repair, or reject it. Combat timing, hit parity, runtime packaging, roster promotion, and deployment remain separate gates.

## 2026-08-27 - Swahili standalone U correction and deterministic throw review controls V1

- Corrected the shared Engine V2 input resolver so `U` alone does nothing on the ground or in the air. Grave Furrow is now explicitly `W+L`; the cancel-only airborne ender is `U+L`; existing `U+K` and `U+I` routes remain intact.
- Added nine deterministic candidate-only throw scenarios to the full playtest for P1/P2, forward/back, hit/whiff, center/corner, and Command Grab. Every scenario resets a fresh match and queues one normal combat-input tick; combat definitions and approved throw/Command Grab motion are unchanged.
- Added focused regression coverage and updated the Grave Furrow, air-combo, special-family, control-contract, and throw-review tests. Focused suites pass, the full Vite build passes, and the complete test command reaches only the pre-existing sandbox approval-lock mismatch (`998353...` expected versus `A78973...` actual); that human lock was not rewritten.
- Browser QA at `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1&special-modifier-v1=1&throw-review-controls-v1=1#throw-review-controls` confirms `U` leaves Swahili idle with no attack/event, all `195/195` textures load, and P1 whiff, P1 Command Grab, and mirrored P2 corner scenarios complete with zero browser warnings/errors. The review hub now links directly to these controls.
- Candidate-only status and browser evidence are recorded under `tools/nga-forge/production/characters/swahili/status/swahili-v2-special-modifier-and-throw-review-controls-v1.status.json` and `tools/nga-forge/production/characters/swahili/reports/swahili-v2-special-modifier-and-throw-review-controls-v1/browser-validation.json`. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`; no deployment, roster promotion, push, PR, merge, or human approval was inferred.
- Applied NGA Engine V2, Local Versus, Fighting Game Balance, Animation Fluidity Standard, Fighting Game Playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable on PATH, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-special-modifier-and-throw-review-controls-v1.md`.

### What's Next

- Human-playtest the explicit special chords and the nine throw buttons. Keep approved throw/Command Grab motion frozen and treat any later combat/balance, roster, packaging, or release decision as a separate gate.

## 2026-08-27 - Swahili V2 specials and throws consolidated human-review hub V1

- Reconciled the complete current gate surface into one browser hub: all 15 specials plus eight throw/grab items. The queue now visibly separates nine direction/key-pose candidates, seven local gameplay/interaction candidates, four approved-motion preserve items, and three manual-art blockers.
- Prioritized the user's dynamic-special revisions first: Forward Heavy Execution Crescent V2, corrected straight-shaft Down Light V2, and two-hit Down Medium V2. The next lane directly opens Grounded Verdict V2, Neutral Medium V2, Up Medium V1, and Grave Furrow playtests; older tested fallbacks remain available for comparison and were not replaced.
- Protected accepted Universal Grab Attempt, Forward Throw, Backward Throw, and Command Grab motion in a separate preserve lane. Direction approval, gameplay approval, combat/balance approval, packaging, roster promotion, legacy runtime, and release remain independent gates; opening the hub infers none of them.
- Validation PASS: manifest parses with 23 unique items and all 15 special IDs; zero missing status sources or local files; every source gate reconciles; all 22 unique review/playtest routes return HTTP 200. Browser QA renders the full queue and filters at `23 / 9 / 7 / 4 / 3` with zero diagnostics. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Hub left visible at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/swahili-v2-special-throw-review-hub-v1/review.html?hub-v1=1`. No fighter art, connector, atlas, animation package, runtime mapping, combat value, roster, legacy game, deployment, push, PR, or merge changed.
- Applied NGA Engine V2, Playable Character Production, Fighting Game Balance, Special Move Standard, Animation Fluidity Standard, Fighting Game Playtest QA, in-app Browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI is unavailable on PATH, so central sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-swahili-v2-special-throw-review-hub-v1.md`.

### What's Next

- Human-review the hub in priority order and give one independent decision per candidate: `approve`, `request targeted revision`, or `reject`. Do not generate more disconnected candidates before these grouped gates are resolved. Forward Light, Forward Medium, and Throw Tech remain stopped at their complete manual paint-over kits.

## 2026-08-27 - Lamuh Crouching Light approval and Crouching Medium Sweep Line candidate V1

- Recorded the user's narrow Crouching Light pass as `APPROVED_V1_MOTION_PRESERVED` plus `APPROVED_V2_RETIMING` for timing candidate B (`16` ticks). Crouching Light impact/combat profile, runtime-art promotion, production baseline, first-playable closure, and broader Lamuh approval remain false.
- Audited Crouching Medium and confirmed that V1 aliased all eight protected Standing Medium frames. Classified it `MODERNIZE`, retained the recoverable medium-weight rhythm and body-mechanics intent, and authored the distinct outline-free `Sweep Line` low sweep rather than reusing standing art.
- Added eight unique 2048x1536 normalized frames at fixed root `(768,1360)`: guarded crouch, load, acceleration, one frame-03 contact, same-leg follow-through, retraction, balance recovery, and guarded crouch exit. The outcome-only frame-03 composite is separated from the whiff body frame; no frame touches an edge and meaningful magenta/purple pixels are zero.
- Added independent timing candidates A `19`, B recommended `22`, and C `25` ticks plus I1/I2/I3 hitstop candidates `4/5/6`. These remain presentation candidates only; no combat values or runtime art were promoted.
- Extended the V1/V2 review route and left it visible and playing at `http://127.0.0.1:4177/lamuh-v1-v2-review.html` on Crouching Medium B + I2 at 1x.
- Validation PASS: full Lamuh suite `33/33`; TypeScript/Vite build; comparison+sandbox browser smoke; eight-frame fixed-root scrub; protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Crouching Medium remains candidate-only, `deployable: false`, uncommitted, unpushed, undeployed, and stopped at human motion/timing review. Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-27-lamuh-legacy-v2-crouching-medium-candidate-v1.md`.

### What's Next

- Human-review Sweep Line at 1x and 0.5x. Approve, reject, or request a targeted motion repair and choose A/B/C timing independently. Do not promote impact/combat data, broaden approval, start another animation, deploy, merge, push, or open a PR through this gate.

## 2026-08-27 - Swahili Down Light Stamped Shaft Check V2 direction

- Continued the dynamic-special pass with the highest-priority unblocked special: Down Light. The current 23-tick `special-down-light-fast-shaft-check-v1` remains the tested one-hit local runtime fallback; it is now explicitly superseded as the final V2 direction because its quick take and immediate restow still read too much like a normal low attack.
- Built the review-only `special-down-light-stamped-shaft-check-v2` direction as six chronological poses: stamped low ready, ankle-line brace, one shaft-and-ferrule contact, arrested held line with no second hit, weighted recoil, and low-guard recovery. The illustrative 36-tick rhythm is deliberately slower than the fallback while remaining lighter than the 64-tick Down Medium and 80-tick Down Heavy directions.
- Rejected the first generated board because the two retained pistols were not visibly accounted for. A first targeted repair added two compact holstered pistols; human review then caught a split and crooked staff around the grips, so a second targeted repair rebuilt all six scythes as one continuous rigid straight shaft from blade hub through both hands to the ferrule. The selected 1536x1024 RGB board preserves Swahili's identity, full scythe topology, P1 screen-right facing, planted body, one-hit parity, and no capture, sweep, launch, knockdown, root travel, projectile, or gunfire.
- Added the V2 key-pose contract, status, generation manifest, dynamic-distinction audit, redesign-contract pointers, and isolated review route. The board remains concept art, not transparent sprite source; timing and the conservative one-hit reward envelope are non-authoritative. No connectors, atlas, runtime mapping, combat values, package, roster, legacy runtime, or deployment changed.
- Validation PASS: six JSON records parse; board and review route return HTTP 200; browser QA loads both 1536x1024 images, distinguishes the sole contact from the no-hit held line, verifies Next/Previous/Mirror P2 controls, and reports zero diagnostics. The preserved Down Light runtime suite passes 11/11, direction hit parity is 1/1, `git diff --check` passes, and protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 universal-character, asset-animation, and validation guidance; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighting Game Balance; VFX Integration Audit; Special Move Standard; Character Sprite Pipeline; Animation Fluidity Standard; Fighter Atlas Factory; Image Generation; in-app Browser; Obsidian Markdown; and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-27-swahili-down-light-stamped-shaft-check-v2.md`.

### What's Next

- Human-review whether the stamped preparation, one low check, no-hit held line, and weighted recoil read as a dynamic special and the lightest Grounded Verdict. If approved, author real-alpha poses and connectors, then produce the full silhouette, path, family-delta, P1/P2 1x/0.5x, and hit-parity evidence before any runtime replacement. If rejected, revise only this move direction and keep the tested fallback.

## 2026-08-27 - Swahili Down Medium Hook and Ferrule Shove V2 direction

- Continued the dynamic-special pass with one isolated next move: Down Medium. The current 44-tick, one-hit `special-down-medium-low-hook-control-v1` remains the tested local runtime fallback; it is now explicitly superseded as the final V2 direction because it does not supply the requested slower two-step process.
- Built the review-only `special-down-medium-hook-ferrule-shove-v2` direction as six chronological poses: deep planted coil, low blade-hook contact, no-contact hook carry, visible weapon-reversal chamber, pointed-ferrule shove contact, and braked ferrule hold. The two intended contacts are visually distinct and separated by a readable transition.
- Preserved Swahili's locked identity, full scythe continuity, planted lower body, and screen-right P1 orientation. Rejected the first generated board because the final pose lost the rear scythe blade; the selected 1536x1024 RGB board restores the full weapon. It remains concept art, not transparent sprite source.
- Added the key-pose contract, generation manifest, status, family-distinction audit, and isolated review page. The illustrative 64-tick rhythm and two-hit damage envelope are non-authoritative; there is no capture, launch, knockdown, projectile, third impact, hidden root travel, runtime mapping, combat edit, roster edit, package, or deployment.
- Validation PASS: all new/updated JSON records parse; review HTML and images return HTTP 200; browser QA shows both 1536x1024 images loaded, pose navigation reaches the weapon-reversal second beat, P2 mirroring restores cleanly, and browser diagnostics are empty. The existing Down Medium runtime suite passes in full, `git diff --check` passes, and protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2 universal-character, asset-animation, and validation guidance; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighting Game Balance; VFX Integration Audit; Special Move Standard; Character Sprite Pipeline; Animation Fluidity Standard; Fighter Atlas Factory; Image Generation; in-app Browser; Obsidian Markdown; and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-27-swahili-down-medium-hook-ferrule-shove-v2.md`.

### What's Next

- Human-review the six-pose Down Medium direction. If approved, author real-alpha poses and connector frames, then validate the final two visible impacts against any proposed two-hit runtime definition before replacing the fallback. If rejected, revise only this move direction; do not alter the preserved Command Grab, current runtime fallback, combat data, or legacy `game.js`.

## 2026-08-27 - Swahili dynamic-special gate and Forward Heavy Execution Crescent V2 direction

- Recorded the user's "mark this one" direction as a narrow preserved checkpoint for the current forward-walk video repair and Grounded Verdict presentation, including the scale/outline, fixed-scythe-anchor, and restored rear-leg repairs. The freeze record keeps both as preferred local fallbacks but deliberately leaves `motionApproved: false`; it is not blanket Swahili, combat, roster, package, or deployment approval.
- Added `swahili-special-dynamic-distinction-standard-v1.{md,json}` as the permanent authoring/review gate for every future or revised Swahili special. Each move must prove a unique preparation silhouette, action verb, rhythm, weapon/body path, spatial role, hit payoff, and recovery consequence. Same-pose retiming, normal-speed specials, generic attacks, larger VFX over unchanged body art, duplicate contacts, unclear hit parity, and consequence-free recoveries automatically fail.
- Audited both existing Forward Heavy candidates. Ground Drag Slice V1 and Long Hook Control V1 are retained as superseded source evidence: the former overlaps Grave Furrow without a unique payoff, and the latter is clean but lacks the required grind-to-crescent process and reads too much like a long normal. The current playable ground-drag version remains fallback until a replacement passes human review.
- Built a new four-pose review-only direction board for `special-forward-heavy-execution-crescent-v2`: advancing ground grind, maximum planted coil, one huge rising-diagonal crescent contact, and exhausted braked recovery. Added its key-pose contract, status, candidate audit, and isolated review route. No source frames, connectors, atlas, runtime mapping, combat, VFX, roster, package, legacy runtime, or deployment changed.
- The built-in background-extraction retry still returned RGB with a baked checkerboard. The board is therefore explicitly labeled visual-review evidence only, not transparent sprite source. It requires human direction approval before transparent pose production and connector work.
- Validation PASS: all nine added/updated JSON records parse; the review HTML and 2172x724 board both return HTTP 200; browser QA reports both images loaded, zero warnings/errors, and working Next/Previous/Mirror P2 controls. Review is left visible at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-forward-heavy-execution-crescent-v2/review.html`. The full playtest remains separately available on port `4175`.
- Applied NGA Engine V2 plus universal-character, asset-animation, and validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Character Sprite Pipeline; Animation Fluidity Standard; Fighter Atlas Factory; Image Generation; in-app Browser; Obsidian Markdown; and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-27-swahili-dynamic-special-gate-and-forward-heavy-execution-crescent-v2.md`.

### What's Next

- Human-review whether the four silhouettes now read as a dynamic and distinct Forward Heavy. If approved, author real-alpha key poses and connectors, then build the required 1x/0.5x P1/P2, path, family-delta, cross-move, and hit-parity evidence before any runtime replacement. If rejected, revise only the action direction while retaining the marked fallback.

## 2026-08-27 - Lamuh Legacy V2 Standing Medium approval and Crouching Light candidate V1

- Recorded the user's narrow Standing Medium approval as `APPROVED_V1_MOTION_PRESERVED` plus `APPROVED_V2_RETIMING` for candidate B (`24` ticks). Standing Medium combat profile, runtime-art promotion, production baseline, first-playable closure, and broader character approval remain false.
- Audited Crouching Light and found that V1 did not have a distinct crouching-light animation: it aliased the four Standing Light frames. Classified it as `MODERNIZE` and authored a true seven-pose low palm check with a planted crouched base, same lead limb, one visible impact, connected recoil, and no purple/magenta outline.
- Added deterministic timing candidates A `14` ticks `[2,2,1,1,2,2,4]`, B recommended `16` `[3,2,1,1,2,3,4]`, and C `18` `[3,3,1,2,2,3,4]`; impact candidates are I1/I2/I3 `2/3/4`. These remain human-review presentation candidates; combat data is not promoted.
- Normalized seven unique 2048x1536 RGBA frames at fixed root `(768,1360)`, no edge touches, `4.36%` visible-height drift, zero meaningful magenta-outline pixels, and an outcome-routed contact composite. Repaired the normalizer's forward-scaling sampling gap by inverse-mapping destination pixels, eliminating the checker/grid artifact without altering source originals.
- Extended the V1/V2 review route and left it visible and playing at `http://127.0.0.1:4177/lamuh-v1-v2-review.html` on Crouching Light B + I2 at 1x.
- Validation PASS: focused Lamuh suite `32/32`; TypeScript/Vite build; comparison+sandbox browser smoke; fixed-root numbered contact-sheet review. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Crouching Light remains candidate-only, `deployable: false`, non-roster, uncommitted, unpushed, and undeployed. Central Obsidian CLI was unavailable; pending handoff: `.agent-sync-pending/2026-08-27-lamuh-legacy-v2-crouching-light-candidate-v1.md`.

### What's Next

- Human-review Crouching Light at 1x and 0.5x. Approve, reject, or request a targeted motion repair and choose A/B/C timing independently. Do not promote combat data, broaden approval, start another animation, deploy, merge, push, or open a PR through this gate.

## 2026-08-27 - Lamuh Legacy V2 Standing Light approval and Standing Medium candidate V1

- Recorded the user's narrow Standing Light approval as `APPROVED_V1_MOTION_PRESERVED` plus `APPROVED_V2_RETIMING` for candidate B (`18` ticks). Combat profile, runtime-art promotion, production baseline, first-playable closure, and all other animations remain unapproved.
- Advanced exactly one next animation: Standing Medium. Hash-locked all eight protected V1 source frames, classified the legacy punch-to-knee-to-high-kick row as `MODERNIZE`, and rebuilt it as one committed rear-hand cross with ready, load, deep coil, acceleration, single contact, same-arm shoulder overshoot, rear-arm recoil, and connected guard recovery.
- Preserved the V1 wide base, cross-body coil, hip/shoulder drive, rear-hand trajectory, coat/loc lag, body momentum, and recovery direction. Retired the legacy knee/high-kick tail so one visible impact matches one gameplay hit. The purple/magenta outline is removed and the art follows the approved modern NGA V2 Lamuh style.
- Normalized eight unique frames plus an outcome-routed hit/block contact composite to 2048x1536 at fixed root `(768,1360)`. No frame touches an edge, meaningful magenta pixels are zero, runtime per-frame scale and visual recentering are disabled, and measured visible-height drift is `0.67%`.
- Authored deterministic review candidates A `21` ticks `[3,3,2,2,1,2,3,5]`, B recommended `24` `[4,3,2,2,1,3,4,5]`, and C `27` `[4,4,2,3,2,3,4,5]`; impact candidates are `5/6/7` hitstop. These are presentation candidates only; Standing Medium combat values were not promoted.
- Extended the V1/V2 comparison route and typed review data for Standing Medium. The live route is left visible and playing at `http://127.0.0.1:4177/lamuh-v1-v2-review.html` with Standing Medium B + I2 at 1x.
- Validation PASS: focused Lamuh suite `31/31`; TypeScript/Vite build; Lamuh comparison+sandbox browser smoke; fixed-root contact-sheet visual QA. Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Standing Medium remains candidate-only, `deployable: false`, non-roster, uncommitted, unpushed, undeployed, and stopped at human motion/timing review. Central Obsidian sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-lamuh-legacy-v2-standing-medium-candidate-v1.md`.

### What's Next

- Human-review Standing Medium at 1x and 0.5x. Approve, reject, or request a targeted motion repair and choose A/B/C timing independently. Do not promote combat data, broaden approval, start another animation, deploy, merge, push, or open a PR through this gate.

## 2026-08-27 - Swahili Grounded Verdict rear-leg repair and forward-walk video repair V2

- Repaired the Grounded Verdict scythe-removal mask so it restores the qualifying rear lower-leg component on frames 10-15 before compositing the fixed planted scythe. The staff anchor remains `(781,1402)` through frames 06-16; combat timing, damage, two-hit parity, input, root motion, and Command Grab are unchanged.
- Rebuilt forward walk from the imported 240-frame / four-cycle video as eight biomechanical gait poses with a connected-silhouette matte that preserves enclosed black coat/trouser regions. Normalized to 1536x1536 RGBA at root `(768,1408)` and integrated a contact-weighted 40-tick presentation cycle `[6,5,4,5,6,5,4,5]`; simulation still owns movement.
- Visual QA passed on numbered dark, light, and mirrored sheets. The local Engine V2 playtest was rebuilt and left open at `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1`; final runtime reports `195/195` textures, no load error, no debug warnings, and candidate-specific walk labeling. A live pre-reload hold-D sample entered `walk_forward` and moved P1 from `-76` to `-49`; the Grounded Verdict demo still registered two hits / 104 combo damage while showing the planted-staff and restored-leg section.
- Validation PASS: TypeScript/Vite production build; Swahili presentation `11/11`; Forward Walk preservation `6/6`; Grounded Verdict `8/8`; both sprite scripts syntax-check; eight walk PNGs and eighteen Down Heavy PNGs present; all updated JSON parses; protected `game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Both repairs remain local candidate-only, nondeployable, uncommitted, unpushed, and awaiting human playtest review. No roster, public runtime, legacy runtime, deployment, combat values, or backward walk changed. Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Watch methodology, Fighter Atlas Factory, and in-app Browser guidance. Central Obsidian sync is not claimed; pending note: `.agent-sync-pending/2026-08-27-swahili-grounded-verdict-body-and-forward-walk-video-repair-v2.md`.

### What's Next

- Hold `D` to judge the new forward gait at 1x, then use `Demo Grounded Verdict` to judge the repaired planted-scythe/body section. Approve, reject, or request a narrow repair per animation; do not promote or deploy through this gate.

## 2026-08-27 - Ty foot and shin artifact cleanup V3

- Completed the targeted follow-up on Ty's candidate Walk matte. Raised the visible-alpha cutoff from 4 to 64, restricted the shoe guard to strong white/red pixels, and removed achromatic floor residue outside that guard. The final crossed-foot floor stub in source 227 has a bounded frame-local erase.
- Reconnected only the interior low-contrast trouser bands in source frames 219 and 222; the repair polygons stay inside visible cloth and do not define the outer silhouette. Replaced artifact-prone source frame 225 with adjacent clean source frame 226 while preserving the 12-pose / 80-tick walk timeline.
- Added `review-boards/ty_walk.lower-leg-before-after.png`. The earlier artifact-heavy candidate and review evidence remain under `rejected/pre-shin-foot-artifact-cleanup-v2/`; the earlier severed-leg rejection remains under `rejected/pre-colored-guard-cut-v1/`.
- Refreshed the open isolated Last Tribunal preview and paused Walk frames 08, 09, 10, and 11 at gameplay scale. Feet and shins are continuous for P1 and lossless mirrored P2 with no visible load-error surface. Saved the final crossed-foot capture to `validation/ty_video_motion_last_tribunal.png` and left the visible route paused on Walk for inspection.
- Validation: Python compile PASS; Engine V2 `build:sim` PASS; package contracts PASS for idle (`10` / `158`) and walk (`12` / `80`); deterministic replay PASS across `93` artifacts with `DETERMINISM_CHANGED=0`; protected `game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Ty remains candidate-only, noncanonical, nondeployable, outside roster/combat/public runtime, uncommitted, unpushed, and undeployed. Applied Fighter Atlas Factory, NGA Engine V2 asset/validation guidance, Playable Character Production, Sprite Sheet Validation, Character Visual Consistency, Character Sprite Pipeline, Animation Fluidity Standard, and in-app Browser guidance. Central Obsidian sync is not claimed; pending note updated at `.agent-sync-pending/2026-08-26-ty-video-motion-v1.md`.

### What's Next

- Human-review the repaired Walk at 1x in the open preview and approve, reject, or request another narrow visual repair. Do not promote, retime, add roster/combat data, or deploy through this visual gate.

## 2026-08-27 - Lamuh Legacy V2 Standing Light candidate V1

- Continued the Lamuh Legacy V2 rebuild with exactly one isolated next animation: Standing Light. Protected all four V1 source frames and their recorded SHA-256 hashes; no legacy originals or `game.js` changed.
- Rebuilt the legacy two-extension/one-hit row as six outline-free NGA V2 frames: compact ready, lead-fist chamber, one straight contact, same-arm follow-through, recoil, and connected guard recovery. Only frame `02` carries outcome-routed hit/block VFX; whiff remains body-only.
- Normalized to 2048×1536 RGBA at fixed root `(768,1360)`, no runtime per-frame scale, no visual recentering, zero meaningful magenta-outline pixels, no edge touches, six unique frame hashes, and 4.64% visible-height drift. Added a numbered fixed-root contact sheet.
- Added independent presentation candidates: A `15` ticks `[2,2,1,2,3,5]`, B recommended `18` `[3,2,1,3,4,5]`, C `20` `[3,3,2,3,4,5]`; impact candidates are `3/4/5` hitstop. Runtime combat values remain unpromoted pending human motion/timing review.
- Extended the V1/V2 comparison route to select closure art and controls per move. Standing Light now opens by default at B + I2, 1×, and was left visible and playing at `http://127.0.0.1:4177/lamuh-v1-v2-review.html`.
- Validation: focused Lamuh suite `30/30` PASS; TypeScript/Vite build PASS; Lamuh comparison+sandbox browser smoke PASS; live route has zero browser errors and advances frames; `game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Candidate remains `deployable: false`, non-production, non-roster, uncommitted, unpushed, undeployed, and awaiting only Standing Light human motion/timing review. Applied NGA Engine V2, playable-character, visual-consistency, sprite-validation, balance, VFX, git-safety, Fighter Atlas Factory, Image Generation, Animation Fluidity, browser, and Obsidian Markdown guidance.
- Central Obsidian sync is not claimed; pending handoff: `.agent-sync-pending/2026-08-27-lamuh-legacy-v2-standing-light-candidate-v1.md`.

### What's Next

- Human-review Standing Light in motion at 1× and 0.5×. Approve, reject, or request a targeted repair for motion and timing independently. Do not promote the clip, alter combat timing, expand to another move, deploy, merge, push, or open a PR through this gate.

## 2026-08-27 - Ty colored-guard lower-leg matte repair

- Replaced the Ty video processor's destructive 18 px lower-body proximity cut with a temporary closed colored guard: green shows the safe envelope and cyan shows the retained cut in diagnostic-only review images. The final 1536×1536 RGBA frames contain zero diagnostic-color pixels.
- Walk source frame 219 and the other gray-on-gray lower-leg phases now retain continuous calves, ankles, and shoes. Added shoe-local floor-residue cleanup without reconsidering trouser pixels. Preserved the broken candidate, its frames/boards/report, and the pre-repair processor under `review/video-motion-v1/rejected/pre-colored-guard-cut-v1/`.
- Added per-frame colored guides under `cut-guides/` and numbered guard sheets `review-boards/ty_{idle,walk}.colored-guard-contact-sheet.png`; updated the visual receipt, human-review queue, reports, atlases, and animation packages. Idle recovered 226,060 low-contrast pixels; walk recovered 202,103; both technical gates pass and both atlases reconstruct source frames pixel-exactly.
- Validation: Python compile PASS; Engine V2 `build:sim` PASS; `validateAnimationPackage` PASS for idle (`10` frames / `158` ticks) and walk (`12` / `80`); deterministic rebuild PASS across 90 artifacts with `DETERMINISM_CHANGED=0`; protected `game.js` hash remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Refreshed the visible isolated stage route on Walk with mirrored P2; formerly broken lower-leg phases remain continuous and browser warning/error log count is zero. Tab is marked deliverable. Ty remains candidate-only, noncanonical, nondeployable, and outside roster/combat/public runtime.
- Applied Fighter Atlas Factory, NGA Engine V2 asset/validation guidance, Playable Character Production, Sprite Sheet Validation, Character Visual Consistency, Character Sprite Pipeline, Animation Fluidity Standard, and in-app Browser guidance. Central Obsidian sync is not claimed; pending note remains `.agent-sync-pending/2026-08-26-ty-video-motion-v1.md`.

### What's Next

- Human-review the repaired Idle and Walk independently in the open stage preview. Do not promote, retime, add roster/combat data, or deploy before explicit approval.

## 2026-08-26 - Ty video-to-sprite idle/walk candidate V1

- Processed the two user-supplied 1280×720 H.264 clips (24 fps, 240 frames, 10.005 s each) through a deterministic, non-generative Ty motion experiment. Preserved both source videos and all 480 decoded PNGs under `tools/nga-forge/production/characters/ty/review/video-motion-v1/`.
- Classified clip A as walk and clip B as idle. Retained a clean 32-source-frame walk period near frames 198–230 and a 65-frame idle period near frames 63–128; selected 12 walk poses (`198,201,203,206,209,211,214,217,219,222,225,227`) and 10 idle poses (`63,69,76,82,89,95,102,108,115,121`). Loop-close proof frames 230/128 are excluded from playback. Walk discontinuity 96–97, all nonselected frames, the fixed star watermark, gray background, and generated floor shadow are rejected.
- Added `scripts/process_video_motion_v1.py`. It uses color-distance alpha extraction, a central component gate, white-safe edge decontamination, semantic contact cleanup, one sequence-wide scale/projected-ground offset, stable torso-root translation, and no redraw/interpolation/generative repair. Output remains 1536×1536 RGBA with root `(768,1408)`, baseline `1408`, 960 px target body height, screen-right P1 authorship, and lossless P2 mirroring. Foot lift/bob remain visible; movement stays code-owned.
- Authored candidate-only 60 Hz visual timelines: idle 10 poses / 158 ticks and walk 12 poses / 80 ticks. Produced raw/numbered contact sheets, source-vs-processed boards, light/dark GIFs, transparent APNGs, reports, frame mappings, rejected-range records, per-frame offsets/bounds/alpha/crimson audits, and a human-review queue. The local FFmpeg build has no WebM/VP9 output, so verified GIFs fulfill the animated-preview slot; invalid one-frame MP4 fallbacks were removed.
- After agent visual QA, compiled deterministic variable-trim 4096² candidate atlases with one-pixel extrusion and Engine V2 animation packages. Both atlas manifests reconstruct every 1536² source frame pixel-exactly; Engine V2 `validateAnimationPackage` passes idle (`10`, `158`) and walk_forward (`12`, `80`). A rebuild/package replay compared 40 key artifacts with `DETERMINISM_CHANGED=0`.
- Upgraded the isolated `NO_GODS_ABOVE/engine_v2/ty-stage-preview.html` route to animate Idle/Walk on The Last Tribunal with pause, mirror match, spacing, and guides. TypeScript `build:sim` passes. Headless Chrome and the visible Codex in-app browser verified frame advance, Idle/Walk switching, stable pause, 1600×900 canvas, P2 mirror, hidden load error, gameplay-code movement authority, and zero browser warnings/errors. Capture: `review/video-motion-v1/validation/ty_video_motion_last_tribunal.png`; the visible tab is marked deliverable and left on Walk.
- Human gates are explicit in `review/video-motion-v1/HUMAN_REVIEW.md`: `TY IDLE — READY FOR HUMAN REVIEW` and `TY WALK — READY FOR HUMAN REVIEW`. Mild AI-source morphology drift remains disclosed for shoulder/torso/hand/trouser/shoe/head consistency review. Neither motion is final or canonical.
- No public assets, normal runtime registry, roster, combat, movement, input, legacy runtime, deployment, commit, push, PR, merge, or publication changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Watch methodology, Fighter Atlas Factory, and in-app Browser guidance. Watch's optional local setup could not read its private config, so analysis used preserved decoded frames and local deterministic tooling without credential access. Obsidian CLI remains unavailable; central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-ty-video-motion-v1.md`.

### What's Next

- Human-review Idle and Walk independently at 1x in the open local route. Approve, reject, or request a targeted repair per motion. Do not promote Ty, replace `idle_00`, change timing, add roster/combat data, or deploy from this candidate gate.

## 2026-08-26 - Ty idle_00 static anchor candidate V1

### Stage preview addendum

- Added an isolated local Engine V2 review route at `NO_GODS_ABOVE/engine_v2/ty-stage-preview.html` using The Last Tribunal actual graybox renderer, approved stage camera/parallax, combat-plane roots, contact shadows, HUD treatment, and runtime P2 mirroring.
- The route loads Ty only from the existing review source, exposes mirror-match/wide-spacing/stage-guide controls, and identifies itself as candidate-only, nondeployable, and not roster-integrated. It does not alter fighter manifests, roster data, combat, public assets, legacy runtime, or deployment.
- TypeScript `build:sim` passes. In-app browser QA at `http://127.0.0.1:5176/ty-stage-preview.html` verified a 1600x900 WebGL canvas, correct grounded scale, authored P1 and mirrored P2 presentation, functioning spacing control, no load-error surface, and zero warning/error logs. Saved capture: `tools/nga-forge/production/characters/ty/review/idle-anchor-v1/validation/ty_idle_00_last_tribunal.png`.
- The local Vite review server is running on port `5176`; the preview was queued into the Codex side panel. Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-ty-stage-preview-v1.md`.

- Built exactly one review-only `idle_00` static anchor for Veronica's character Ty from the user-supplied canonical turnaround; no idle loop was generated.
- Preserved the first baked-checkerboard RGB attempt as rejected provenance. Retained the stronger true-alpha source after light/dark compositing, identity review, and a whole-frame screen-right-facing correction.
- Added a Ty-specific candidate lock and deterministic build package under `tools/nga-forge/production/characters/ty/`. Normalized without anatomical redraw to the verified V2 source contract: 1536x1536 RGBA, baseline `1408`, root `(768,1408)`, 960 px body height, safe-frame-contained. Produced a non-integrated 448x448 compatibility preview with baseline `382`.
- Validation classification: `PASS_TECHNICAL_AWAITING_HUMAN_IDENTITY_APPROVAL`. Real alpha, source/runtime dimensions, root/baseline placement, safe-frame containment, mirrored P2 review, gameplay-size readability, six crimson regions, and zero saturated blue/purple/magenta contamination pass.
- Fresh visual review classifies the asset as a strong static anchor candidate for human review. Residual human checks are facial featurelessness, rear-foot grounded read, and theatrical open-hand pose.
- No atlas, runtime mapping, combat, input, roster, `agent/memory/character_truth.md`, public asset, legacy runtime, deployment, commit, push, PR, merge, or publication change occurred. Ty remains candidate-only and nondeployable.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Image Generation, Reference Analysis Validator, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-ty-idle-00-static-anchor-candidate-v1.md`.

### What's Next

- Human-review `idle_00`. If explicitly approved, lock its hash and build only the restrained four-pose idle foundation; otherwise apply one targeted repair or preserve rejection. Do not integrate or promote Ty through this gate.

## 2026-08-26 - Swahili Neutral Medium Control Strike gameplay candidate V2

- Advanced the preserved five-pose `special_neutral_medium` V2 source into the local Engine V2 full-animation playtest. Physical action: planted low ready -> short scythe draw -> one rigid shaft/inner-hook-shoulder torso contact -> compact recoil -> controlled remount start. Rejected V1 remains quarantined. The move has no root travel, cancel, launcher, knockdown, airborne coverage, shot, capture, side switch, rotational carry, victim sync, or Command Grab mechanics.
- Added neutral `5S+M` / `U+K` with candidate `9/3/13` timing, one `65`-damage mid hit, `6` hit / `5` block freeze, `16` hitstun, `11` blockstun, and `4.8/0` grounded push. Hitstop, hitstun, recovery, and advantage remain separate; values are non-authoritative pending human 1x gameplay review.
- Integrated all five existing source poses as `[2 startup, 1 contact, 2 recovery]` with gameplay exposure `[5,4,3,6,7]`; no new art, pipeline redesign, Blender migration, accepted-basic reopening, or Command Grab change occurred. The focused suite proves both guard heights, one-hit parity, an elevated-target whiff, directional-input separation, and a real defender recovery gap before a repeated second contact.
- Verification: build PASS with `292` modules; Neutral Medium `11/11`; Down Light `11/11`; Down Medium `10/10`; Down Heavy `9/9`; Up Medium `9/9`; Forward Heavy `10/10`; Grave Furrow `9/9`; universal throws `6/6`; frozen Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`. Full `npm.cmd test` passes the new Neutral Medium suite and production arena, then stops only at the unchanged pre-existing sandbox approval hash (`A789...` actual, `9983...` expected).
- Rebuilt playtest `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1`: WebGL2, `188/188` textures, no load error, no debug warnings, visible `U+K` HUD/help copy, idle state, screenshot captured, and marked deliverable. No browser chord or console-log-capture claim is made; deterministic tests own hit/block/whiff/input evidence.
- Updated the current coverage matrix, Neutral Medium status, full-playtest status, focused test registration, visible controls, and gameplay-validation receipt. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred. Candidate remains nondeployable and human-release-gated. Applied NGA Engine V2 and its character/asset/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-neutral-medium-control-strike-gameplay-candidate-v2.md`.

### What's Next

- Human-playtest Neutral Medium at 1x with direction-neutral `U+K` for standing and crouching guard, close hit, elevated and spacing whiffs, repeat-pressure gap, and mirrored readability. Preserve every existing gameplay gate; continue Up Light or the next highest-value unresolved scythe special without reopening the locked baseline.

## 2026-08-26 - Swahili Down Light Fast Shaft Check gameplay candidate V1

- Advanced the preserved seven-pose `special_down_light` source into the local Engine V2 full-animation playtest. Physical action: quick scythe take -> planted lead foot -> one lower-shaft snap across the low lane -> immediate restow into low ready. It has no root travel, cancel, launcher, knockdown, airborne coverage, shot, capture, side switch, rotational carry, or Command Grab mechanics.
- Added `2S+L` / `S+U+J` with candidate `11/3/9` timing, one `45`-damage low hit, `5` hit / `4` block freeze, `13` hitstun, `9` blockstun, and `3.8/0` grounded push. Hitstop, hitstun, recovery, and advantage remain separate; values are non-authoritative pending human 1x gameplay review.
- Integrated all seven existing source poses as `[4 startup, 1 contact, 2 recovery]` with gameplay exposure `[3,3,3,2,3,5,4]`; no new art, pipeline redesign, Blender migration, accepted-basic reopening, or Command Grab change occurred. A focused repeat-pressure test proves the defender receives a real recovery gap before a second shaft-check contact.
- Verification: build PASS; Down Light `11/11`; Down Medium `10/10`; Down Heavy `9/9`; Up Medium `9/9`; Forward Heavy `10/10`; Grave Furrow `9/9`; universal throws `6/6`; frozen Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`. Full `npm.cmd test` passes the new Down Light suite and production arena, then stops only at the unchanged pre-existing sandbox approval hash (`A789...` actual, `9983...` expected).
- Rebuilt playtest `http://127.0.0.1:4175/index.html?full-animation-v1=1&down-light-v1=1`: WebGL2, `183/183` textures, no load error, no debug warnings, zero warning/error logs, visible `S+U+J` control, idle state, and marked deliverable. No browser chord claim is made; deterministic tests own hit/block/whiff/input evidence.
- Updated the current coverage matrix, Down Light status, full-playtest status, focused test registration, and gameplay-validation receipt. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred. Candidate remains nondeployable and human-release-gated. Applied NGA Engine V2 and its character/asset/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-down-light-fast-shaft-check-gameplay-candidate-v1.md`.

### What's Next

- Human-playtest Down Light at 1x with `S+U+J` for standing hit, crouch block, elevated-target whiff, spacing whiff, repeat-pressure gap, and mirrored readability. Preserve all existing gameplay gates; continue Neutral Medium or the next highest-value unresolved scythe special without reopening the locked baseline.

## 2026-08-26 - Swahili Down Medium Low Hook Control gameplay candidate V1

- Advanced the preserved eight-pose `special_down_medium` key-pose candidate into the local Engine V2 full-animation playtest. Physical action: planted scythe take -> deep grounded coil -> one broad horizontal low hook -> carry past contact -> controlled restow. It has no root travel, launcher, knockdown, shot, capture, side switch, rotational carry, or Command Grab mechanics.
- Added `2S+M` / `S+U+K` with candidate `21/5/18` timing, one `72`-damage low hit, `7` hit / `6` block freeze, `17` hitstun, `13` blockstun, `6.2/0` grounded push, no cancel routes, and no root motion. Hitstop, hitstun, recovery, and advantage remain separate; values are non-authoritative pending human 1x gameplay review.
- Integrated the eight existing source poses as `[4 startup, 1 contact, 3 recovery]` with gameplay exposure `[6,5,5,5,5,6,6,6]`; no new art, pipeline redesign, Blender migration, accepted-basic reopening, or Command Grab change occurred.
- Verification: build PASS; Down Medium `10/10`; Grave Furrow `9/9`; Forward Heavy `10/10`; Up Medium `9/9`; Down Heavy `9/9`; universal throws `6/6`; frozen Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`. Full `npm.cmd test` passes the new Down Medium suite and production arena, then stops only at the unchanged pre-existing sandbox approval hash (`A789...` actual, `9983...` expected).
- Rebuilt playtest `http://127.0.0.1:4175/index.html?full-animation-v1=1&down-medium-v1=1`: WebGL2, `176/176` textures, no load error, no debug warnings, zero warning/error logs, visible `S+U+K` control, idle state, and marked deliverable. No browser chord claim is made; deterministic tests own hit/block/whiff/input evidence.
- Updated the current coverage matrix, Down Medium status, full-playtest status, focused test registration, and gameplay-validation receipt. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred. Candidate remains nondeployable and human-release-gated. Applied NGA Engine V2 and its character/asset/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-down-medium-low-hook-control-gameplay-candidate-v1.md`.

### What's Next

- Human-playtest Down Medium at 1x with `S+U+K` for standing hit, crouch block, elevated-target whiff, spacing whiff, and mirrored readability. Preserve all existing gameplay gates; continue Down Light or the next highest-value unresolved scythe special without reopening the locked baseline.

## 2026-08-26 - Lamuh Legacy V2 Standing Heavy and first-playable human closure V1

- Created branch `codex/lamuh-legacy-v2-first-playable-closure-v1` from the approved Lamuh rebuild checkpoint at `b056b9d5a76564b931a9233c2c4527958da72716`. The exact Standing Heavy style checkpoint remains hash-bound as `APPROVED_WITH_TARGETED_REPAIR`; this closure does not broaden that approval.
- Completed a seven-frame high-resolution Standing Heavy candidate from the protected V1 choreography: load, guarded coil, launch, one body-only contact, distinct no-hit overshoot, same-leg recoil, and recovery. Fresh-context critique caught that the first frame-01 candidate still read like a palm hit; the retained guarded-coil repair closes the hand and removes the burst/droplets. Deterministic normalization uses one sequence-wide scale, fixed root `(768,1360)`, 2048×1536 RGBA canvases, safe transparent padding, distinct hashes, and no visible purple contour. The hit composite is outcome-routed to hit/block only; whiff stays body-only.
- Added direct deterministic A/B/C gameplay timing (`32/37/42` ticks) and I1/I2/I3 impact candidates (`8/9/10` hitstop) without altering Standing Heavy damage, stun, pushback, cancel, scaling, or hit count. Added a true protected-V1 versus rebuilt-V2 comparison route and upgraded sandbox for P1/P2, center/corners, hit/block/whiff, repeat, transition scenarios, overlays, grab, Forward Throw, and Back Throw.
- During live human review, the contact pose was correctly identified as appearing larger than adjacent frames. Re-authored the body-only and hit/block contact sources at the neighboring anatomical scale while retaining the fixed root and full kick. Launch/contact/overshoot visible heights now measure `839/870/870` px; the earlier oversized contact remains preserved. Added an under-8% three-frame height-drift regression gate; focused tests and browser smoke pass after repair.
- Validation PASS: 29 focused Lamuh tests, content schemas/check-current, TypeScript/Vite build, and browser smoke with zero console/request failures. Visual browser audit counts V1 purple-family pixels `3370`, rebuilt V2 `0`. Legacy `game.js` remains byte-identical at `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Broader `npm.cmd run validate` is not fully green because the inherited test script references missing Swahili test `swahili_down_medium_low_hook_control_v1.test.js`; continued read-only validation also reproduces the known unrelated Swahili sandbox hash mismatch (`A789...` actual, `9983...` expected). Swahili was not modified.
- Candidate remains `deployable: false` with status `awaiting_human_lamuh_v2_first_playable_closure_review`. Throw mechanics pass, but attacker throw art remains explicitly labeled manual-art debt. No legacy runtime, roster, deployment, commit, push, PR, merge, or publication action occurred.
- Applied NGA Engine V2 preservation guidance, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Fighter Atlas Factory validation principles, Fighting-Game Playtest QA, Evidence Verifier, Image Generation, Git Checkpoint Safety, and Obsidian Markdown continuity guidance.
- Central Obsidian sync is not claimed because the vault is outside the task write boundary. Pending handoff: `.agent-sync-pending/2026-08-26-lamuh-legacy-v2-first-playable-closure-v1.md`.

### What's Next

- Human-review the one four-section queue in `FIRST_PLAYABLE_CLOSURE_REVIEW.md`: A) Standing Heavy motion, B) timing choice A/B/C, C) overall first playable, and D) Standard Grab / Forward Throw / Back Throw as independent decisions. Stop here; do not expand or promote until the queue is resolved.

## 2026-08-26 - Swahili Down Heavy Vertical Shaft Plant gameplay candidate V1

- Advanced the preserved eleven-pose `special_down_heavy` candidate into the local Engine V2 full-animation playtest under the gameplay-first continuation direction. Physical action: planted diagonal coil -> one lower-ferrule vertical ground plant -> same-contact compression -> visible lift-off -> controlled remount. It has zero root travel, no airborne coverage, no shot, no capture, no side switch, and no Command Grab choreography.
- Added `2S+H` / `S+U+L` with candidate `27/5/32` timing, one `95`-damage low hit, `11` hit / `8` block freeze, `18` listed base hitstun that resolves to `0` through an explicit soft knockdown, `16` blockstun, `8.5/0` grounded push, no cancel routes, and no root motion. Timing and combat values remain non-authoritative pending human 1x gameplay review.
- Integrated the eleven existing source poses as `[5 startup, 1 contact, 5 recovery]` with gameplay exposure `[6,5,6,5,5,5,7,6,7,6,6]`; no new art, pipeline redesign, Blender migration, accepted-basic reopening, or Command Grab change occurred. The earlier key-pose gate remains recorded as provenance.
- Verification: build PASS; Down Heavy `9/9`; Grave Furrow `9/9`; Forward Heavy `10/10`; Up Medium `9/9`; universal throws `6/6`; frozen Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`; all four suites after the known full-test stop PASS. Full `npm.cmd test` passes through production arena and the new Down Heavy suite, then stops only at the unchanged pre-existing sandbox approval-hash gate (`A789...` actual, `9983...` expected).
- Rebuilt playtest `http://127.0.0.1:4175/index.html?full-animation-v1=1&down-heavy-v1=1`: WebGL2, `168/168` textures, no load error, no debug warnings, zero warning/error logs, visible `S+U+L` help, and reset to idle. Browser automation triggered generic Special instead of a same-tick three-key chord, so no browser hit claim is made; deterministic tests cover the real chord/hit/block/whiff behavior. The tab is marked deliverable and left open.
- Updated the current coverage matrix, Down Heavy status, full-playtest status, focused test registration, and gameplay-validation receipt. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred. Candidate remains nondeployable and human-release-gated. Applied NGA Engine V2 and its character/asset/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-down-heavy-vertical-shaft-plant-gameplay-candidate-v1.md`.

### What's Next

- Human-playtest Down Heavy at 1x with `S+U+L` for standing hit, crouch block, elevated-target whiff, spacing whiff, and mirrored readability. Preserve the pending Forward Heavy and Up Medium gameplay gates; continue Down Medium or the next highest-value scythe special without reopening the locked baseline.

## 2026-08-26 - Swahili Up Medium Rising Scythe Hook gameplay candidate V1

- Advanced the preserved six-pose `special_up_medium` candidate into the local Engine V2 full-animation playtest under the new gameplay-first continuation direction. Physical action: planted low load -> one two-handed rising hook -> upward recoil -> controlled remount. It has no root travel, shot, capture, side switch, rotational carry, or Command Grab art.
- Added `8S+M` / `W+U+K` with candidate 11/4/20 timing, one 78-damage upper-region launcher hit, 7 hit / 6 block freeze, 17 base hitstun, 13 blockstun, moderate `4.8/-8.2` launch, and a deliberate crouching low-profile gap. Timing and combat values remain non-authoritative pending human 1x gameplay review.
- Integrated all six existing source poses as `[2 startup, 1 contact, 3 recovery]` with gameplay exposure `[6,5,4,7,7,6]`; no new art, Blender migration, pipeline redesign, or accepted-basic reopening occurred. The earlier key-pose gate remains recorded as provenance while the new user direction authorizes immediate gameplay-speed review.
- Verification: production build PASS; Up Medium `9/9`; Grave Furrow `9/9`; Forward Heavy `10/10`; universal throws `6/6`; frozen Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`. Full `npm.cmd test` passes through production arena and stops only at the unchanged pre-existing sandbox approval-hash gate (`A789...` actual, `9983...` expected).
- Live rebuilt playtest at `http://127.0.0.1:4175/index.html?full-animation-v1=1&up-medium-v1=1`: WebGL2, `157/157` textures, replay checksum `32251695`, no load error, no debug warnings, zero warning/error console logs, visible `W+U+K` help, and reset to idle. Browser automation registered `W` as jump instead of a same-tick three-key chord, so no browser hit claim is made; deterministic tests cover the real chord/hit/block/whiff behavior.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred; candidate remains nondeployable and human-release-gated.
- Applied NGA Engine V2 and its universal-character/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-up-medium-rising-scythe-hook-gameplay-candidate-v1.md`.

### What's Next

- Human-playtest Up Medium at 1x with `W+U+K` for standing hit, airborne interception, stand block, crouch low-profile, whiff, and mirrored readability. Preserve Forward Heavy's pending gameplay gate and continue the next unresolved special family without reopening the locked baseline.

## 2026-08-26 - Lamuh Legacy V2 first-playable and visual style checkpoint V1

- Created branch `codex/lamuh-legacy-v2-rebuild-v1` from `b056b9d5a76564b931a9233c2c4527958da72716`. Audited 47 canonical legacy animations, hash-locked 22 original artifacts, extracted 86 additive source cells, authored 10 independent A/B/C timing sets, and compiled 20 nondeployable Forge move packages. Normal builds validate rather than regenerate the source lock.
- Added configurable `lamuh_legacy_v2` Engine V2 support, real 60 Hz timelines, deterministic presentation-event IDs, replay/config coverage, one signature special, all first-milestone normals, movement/defense, universal grab, physical forward/back throw tracks, whiff, victim anchoring without connect snap, exact throw durations, and the required transition matrix.
- Added isolated `lamuh-v1-v2-review.html` and `lamuh-legacy-sandbox.html` routes. The review separates recovered historical V1 timing from current Legacy and V2 A/B/C candidates; browser smoke covers 1x/0.5x/frame step, mirrored movement, Standing Heavy contact tick 11, forward/back throws and whiff.
- Removed the visible purple contour from V2 presentation with a non-destructive dark-ink edge profile while retaining the original V1 panel as labeled evidence. Browser audit: 3,398 matching pixels on V1 versus 16 interpolation/VFX pixels on V2, greater than 99.5% reduction with no visible V2 outline.
- Added a 1536x1024 new-game Standing Heavy style checkpoint with genuine alpha, 0% sampled magenta, and preserved Lamuh identity/costume/high-kick intent. On 2026-08-26 the user approved this exact direction as `APPROVED_WITH_TARGETED_REPAIR`; the hash-bound receipt is `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/style-checkpoint-v1.approval.json`. Two later padding attempts remain rejected opaque-RGB evidence. Runtime art, completed motion, first-playable approval, production, deployment, and roster promotion remain false.
- Validation PASS: Lamuh build, focused core/content suite, schemas/content-current, TypeScript/Vite build, and browser smoke. Full repo tests stop only at the unrelated pre-existing Swahili sandbox approval-hash mismatch (`A789...` actual, `9983...` expected). Protected `NO_GODS_ABOVE/game.js` remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No deploy, roster promotion, legacy runtime edit, commit, push, PR, merge, or publication occurred. Technical milestone is complete for local human review, not production-approved. Validation receipt: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/VALIDATION_REPORT.md`.
- Applied NGA Engine V2 and its three references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighting Game Balance; VFX Integration Audit; Git Checkpoint Safety; Character Sprite Pipeline; Animation Fluidity Standard; LAMUH Dynamic Agent Orchestrator; Fighting-Game Playtest QA; Evidence Verifier; Image Generation; Obsidian Markdown; and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoffs: `.agent-sync-pending/2026-08-26-lamuh-legacy-v2-first-playable-style-checkpoint-v1.md` and `.agent-sync-pending/2026-08-26-lamuh-legacy-v2-style-direction-approval.md`.

### What's Next

- The style/identity direction is accepted. Next repair padding and build Standing Heavy as one complete preservation-first sequence, then frame-scrub it before extending the style. The V1/V2 timing route, sandbox grab/throws, candidate B timings, completed Standing Heavy motion, and overall first playable still require separate human review.

## 2026-08-26 - Swahili Forward Heavy Ground-Drag gameplay candidate V1

- Advanced the newer nine-pose `special_forward_heavy` Ground-Drag Slice into the local Engine V2 full-animation playtest and superseded the older flourish-heavy long-hook proposal for this review slice. Physical action: low drag -> one broad slice -> carry-through -> heavy recovery; no capture, side switch, rotational carry, or shot behavior.
- Added `6S+H` / hold toward+`U+L` with candidate 26/4/32 timing, 19.2 units of rooted advance, one 105-damage low hit, 10 hit / 8 block freeze, 18 base hitstun, 17 blockstun, and horizontal-dominant low lift. Combat and movement values remain non-authoritative pending human 1x gameplay review.
- Restored approved universal forward/back throw definitions to Swahili's Engine V2 profile after a fresh-build regression exposed that only Command Grab was exported. Forward/back throw `6/6` and frozen Command Grab `7/7` pass afterward.
- Verification: build PASS; Forward Heavy `10/10`; Grave Furrow `9/9`; universal throws `6/6`; Command Grab `7/7`; air-juggle presentation `11/11`; combat spine `11/11`; gameplay-kernel repair `16/16`; four later Swahili suites pass independently. Full `npm.cmd test` reaches only the unchanged pre-existing sandbox approval-hash gate (`A789...` actual, `9983...` expected).
- Live in-app browser verification at `http://127.0.0.1:4173/index.html?full-animation-v1=1`: WebGL2, `151/151` textures, replay checksum `32251695`, no load error, no debug warnings, and zero warning/error console logs. The page is left open and visible for human playtesting.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred; candidate remains nondeployable and human-release-gated.
- Applied NGA Engine V2, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-forward-heavy-ground-drag-gameplay-candidate-v1.md`.

### What's Next

- Human-playtest Forward Heavy at 1x for hit, crouch block, whiff, and mirrored readability. If accepted, record the human motion/gameplay decision before package or production promotion; if not, repair only the visible timing/transition/scythe issue. Then continue the next review-authorized special without reopening accepted basics.

## 2026-08-26 — Swahili V2 accepted-baseline combat closure V1

- Locked the human-accepted locomotion, idle, crouch, defense, reaction, normal, air-juggle, Standing Heavy, and Command Grab direction as `APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT`; no blanket retune or redesign was performed.
- Integrated Grave Furrow into the real Engine V2 candidate playtest: `U` grounded or `W+L`, 34/5/25 timing, one 120-damage rising contact, 12 hit / 9 block freeze, backward-dominant moderate lift, soft knockdown, nine authored poses, and deterministic mirroring/replay.
- Fixed a gameplay regression that zeroed horizontal velocity during every air attack; accepted air-juggle movement now passes again. Added separate block-hitstop support without inflating hitstun.
- Wired approved universal forward/back throw artwork into the live stage: reach, capture, route-specific preparation/commitment, recovery, separate victim reaction/tumble art, simulated victim rotation, side switch, whiff recovery, and deterministic mirroring/replay. `I` throws; hold away+`I` for back throw.
- Integrated all 24 immutable approved Command Grab poses without regenerating them. `U+I` now runs capture, rotational carry, side switch, airborne release, one midair shot, fall, and recovery; victim presentation remains generic approved reaction art rather than attacker or mannequin art.
- Verification: build PASS; Grave Furrow `9/9`; universal throw presentation `6/6`; Command Grab full playtest `7/7`; combat spine `11/11`; juggle presentation `11/11`; Lamuh legacy core `10/10`; gameplay kernel repair `16/16`. Browser at `http://127.0.0.1:4173/index.html?full-animation-v1=1` reports WebGL2, `142/142` textures, replay checksum `32251695`, no load error, and no debug warnings; it is left open.
- Full `npm.cmd test` passes all suites through production arena, then stops at the pre-existing `swahiliSandboxSimulation.ts` approval-hash gate (`A789...` actual, `9983...` expected). All four later suites pass independently. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No roster, legacy runtime, deployment, commit, push, PR, merge, or publication occurred. Status remains local candidate/debug, nondeployable, and human-release-gated. Additional directional specials remain candidate/manual-art/combat-design/human-review gated, so the overall Swahili V2 goal remains active.
- Applied NGA Engine V2, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, VFX Integration Audit, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-swahili-v2-accepted-baseline-combat-closure-v1.md`.

### What's Next

- Human-playtest air routes, Grave Furrow hit/block/whiff/mirror, both universal throws, and `U+I` Command Grab. Continue unresolved special families one at a time under their existing human/manual-art gates; separately reconcile the sandbox approval hash under its owning review change.

## 2026-08-25 — Swahili full-animation combat playtest V1

- Expanded the real Engine V2 air-juggle runtime presentation from 75 to 102 loaded Swahili frames: full 8-frame forward walk, 5-frame backward walk, 6-frame repaired dash, 6-frame repaired backdash, and approved standing/crouching block entry + hold. Existing attack, jump, landing, reaction, knockdown, get-up, and air-juggle mappings remain active.
- Roman Cancel and Burst retain their existing system VFX and intentionally report a neutral-body fallback because no approved Swahili body-motion clip exists for either system. Command Grab, Grave Furrow, air dash, and other sandbox-only families were not falsely promoted into gameplay mechanics.
- Added focused coverage tests for all movement/defense frames and every non-attack simulation phase. `npm.cmd run test:juggle-animation` passes `11/11`. The broader `npm.cmd test` passes all core/combat/aerial/stage/contract checks until the pre-existing `src/sandbox/swahiliSandboxSimulation.ts` approval-hash mismatch (`actual A789...`, expected `9983...`); all four suites after that stop point pass when run independently.
- Installed the exact `package-lock.json` dependencies after explicit user approval. Build passes with Vite 8.1.4; npm reports two high-severity dependency advisories and no audit fix was applied. Added a durable public replay fixture and versioned local build namespace to prevent missing replay files and stale browser modules after clean builds.
- Live in-app verification at `http://127.0.0.1:4173/index.html?full-animation-v1=1`: `102/102` textures, walk cycle complete, replay checksum `32251695`, no debug warnings, no stage load error, and zero browser warning/error logs. The page is left open for human playtesting.
- No combat timing, damage, hitboxes, inputs, roster, legacy `game.js`, deployment, commit, push, PR, or publication changed. Status remains local candidate/debug playtest; `renderingAuthoritative: false`.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-25-swahili-full-animation-combat-playtest-v1.md`.

### What's Next

- Human-playtest walk/dash/backdash, both guard heights, ground and air normals, reactions, knockdown/get-up, and the documented air-juggle routes. Separately reconcile the sandbox simulation approval hash before calling the entire repository test command green.

## 2026-08-24 — Swahili Blender Grave Furrow motion blockout V1

- Added an offline Blender 5.2 LTS motion-authoring layer under `tools/nga-forge/production/characters/swahili/pipeline/motion-first-v1/blender/`. The additive layer uses Blender only as a stunt-double lab; NGA runtime remains sprite-based.
- Built `scenes/swahili_motion_lab_v1.blend` at 60 fps with meters, fixed 16:9 orthographic framing, deterministic `tick = frame - 1`, full-volume Swahili/victim proxies, rigid planar scythe, provisional pistol proxies, grip locks, planted-foot controls, and the exact requested 11 Grave Furrow beats.
- Rendered 69-frame main, silhouette, and victim-interaction PNG sequences; gray 1x/0.5x, silhouette, and victim GIF playbacks; five diagnostics; a numbered 11-pose sheet; review page; JSON motion export; build, validation, review-manifest, and animator reports.
- Independent Blender reopen validation PASS with `0` failures: constant interpolation, fixed camera, rigid-prop distance/scale invariants, grip tolerance, grounded sole markers, exactly one contact frame, horizontal-dominant `+X` victim launch with moderate `+Z` lift, and reflected `-X` P2 mirror rule. Package tests `6/6`; motion-first tests `11/11`; Grave Furrow key-pose tests `8/8`; Swahili baseline/candidate/completion tests `23/23`; isolated prior playtest smoke PASS.
- No final sprites, runtime 3D formats, gameplay timing authority, legacy `game.js` edit, roster change, commit, push, PR, merge, deploy, or publication occurred. Status: `GRAVE_FURROW_MOTION_BLOCKOUT_V1: candidate-only / awaiting_human_motion_blockout_review`.
- Applied Blender Modeling, Blender Animation, NGA Engine V2, Playable Character Production, Character Sprite Pipeline, and Animation Fluidity Standard guidance. Blender Export was intentionally not used because no runtime 3D export was requested or allowed.
- Central Obsidian sync is not claimed; local pending handoff: `.agent-sync-pending/2026-08-24-swahili-blender-grave-furrow-motion-blockout-v1.md`.

### What's Next

- Human-review `blender/review/grave_furrow_blender_motion_v1/playtest.html`, especially resistance, one-contact clarity, horizontal-dominant launch, recovery weight, silhouette, feet, and grips. Record approval or revision feedback before any final sprite conversion.

## 2026-08-24 — Swahili Grave Furrow V1 isolated playtest candidate

- Built and opened an isolated browser-native playtest for the repaired nine-pose Grave Furrow family at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-key-poses-v1/playtest.html`. Controls include `Y` attack, attacker/opponent spacing, blocking, side swap, detached-VFX toggle, 1x/0.5x speed, and reset.
- Preserved the existing 64-tick review timing `[5,6,7,9,5,9,7,8,8]`; Frame 06 is the sole visible and registered contact. Temporary feel values provide 12-tick hitstop, one 120-damage hit, and backward-dominant airborne victim travel. The Sable character reference is used directly; no test mannequin appears.
- Added isolated Engine V2 sandbox source wiring for the same candidate under `NO_GODS_ABOVE/engine_v2/src/sandbox/`, including direct `Y` input and same-tick up+heavy support. These additive untracked sandbox sources pass Node TypeScript syntax checks. A full `tsc` build was not claimed because the checkout has no installed/cached package dependencies; no dependency was fetched or installed.
- Gauntlet verification passes: source hashes `9/9`; motion order `1-9`; hit/block/whiff; exactly one contact; mirrored backward launch; victim rotates during flight and returns to zero rotation before grounded recovery; static HTTP for the page/script/key assets; and live in-app inspection at Frame 06 (`1` hit, Sable `880/1000`, launched). Focused test: `test-grave-furrow-playtest-v1.js`.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No production runtime, roster, atlas, package, deployment, commit, push, PR, or publication changed.
- Status is `candidate-only`, `deployable: false`, gate `awaiting_human_grave_furrow_sandbox_playtest_review`. Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, LAMUH Fighting-Game Playtest QA, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-24-swahili-grave-furrow-playtest-v1.md`.

### What's Next

- Human-playtest the move close, at tip range, blocked, whiffed, authored, and mirrored. Keep it candidate-only until explicit motion/feel approval; tune temporary sandbox timing/impact values from that feedback before any production integration.

## 2026-08-24 — Swahili Motion-First Pipeline V1 candidate

- Upgraded the active Swahili Moveset Goal without restarting it or reopening approved families. The current 84-entry matrix has 39 unresolved candidates: 8 narrowly bounded `FAST_PATH` seams and 31 `MOTION_FIRST` moves. Grave Furrow (`special_up_heavy`) is the first complex pilot.
- Added the additive pipeline package at `tools/nga-forge/production/characters/swahili/pipeline/motion-first-v1/`: production rules/classification, offline Swahili rig spec, rigid scythe and provisional pistol motion contract, motion and human-sidecar schemas, hash-bound motion QA gate, approved-source identity pack, sprite-conversion/runtime-firewall contract, Forge workbench minimum spec, dependency queues, and Grave Furrow blockout requirements.
- Added `10-grave-furrow-v1.motion.json` as a requirements-only provisional seed: 9-pose semantic spine, 52 non-authoritative ticks, planar rigid scythe, one lower-torso contact, and horizontal-dominant victim travel away from the attacker (`+X` authored / `-X` mirrored). It does not reuse the visual candidate's 64-tick holds or pixel path as motion truth; rig calibration and a fresh gray blockout remain required.
- Validation: new standard-library suite `11/11`; existing current-state, completion, candidate-package, and baseline suites `59/59`; all pipeline JSON parses; scoped `git diff --check` clean; protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No final sprites, gray render, human approval, runtime 3D, legacy runtime edit, roster change, commit, push, PR, merge, or deploy occurred. Overall state is `pipeline_candidate`, `deployable: false`, gate `awaiting_human_motion_first_pipeline_review`; the full Swahili Goal remains active.
- Applied NGA Engine V2 and its universal-character, asset-animation, and validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Character Sprite Pipeline; Animation Fluidity Standard; and LAMUH Dynamic Agent Orchestrator for bounded read-only Gauntlet review.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-24-swahili-motion-first-pipeline-v1.md`.

### What's Next

- Human-review the 8/31 production-path partition and the pipeline architecture. If accepted, calibrate and human-review the offline rig, implement the semantic validator/static renderer/sidecar writer and preflight firewall, then render the Grave Furrow gray blockout. Do not generate final Swahili sprites before `APPROVED_MOTION_BLOCKOUT`.

## 2026-08-24 — Swahili Grave Furrow V1 blade-swing repair V3

- Human review rejected the prior Frames `05-07` because the blade did not visibly swing. Preserved Frames `01-04` and `08-09` byte-for-byte, re-authored only Frame `05 release_acceleration` and Frame `07 launcher_follow_through`, and retained the validated Frame `06 single_rising_contact` as the sole hit.
- The repaired blade head now crosses three distinct zones: low/trailing Frame 05 at `-12.71°`, one lower-torso contact at Frame 06 at `34.00°`, and a higher carry-through at Frame 07 at `50.18°`. World-space tip displacement measures `596.31 px` from 05→06 and `96.34 px` from 06→07; the latter rises `95 px`, proving continued follow-through rather than a repeated pose.
- Rebuilt the numbered contact sheet, authored/mirrored blade-flow boards, transition strip, single-contact board, victim trajectory, 1×/0.5× VFX-off previews, and new shared-root `09_blade_arc_displacement_overlay.png`. Rejected push/repeated-diagonal generator checkpoints remain under `generated/rejected/` for Gauntlet evidence.
- Deterministic builder PASS; focused tests `8/8`; static HTTP `15/15` declared images and `9/9` scrub frames; protected six-frame hashes and `NO_GODS_ABOVE/game.js` hash remain unchanged. Browser automation again hit the localhost URL-policy gate, so interactive scrub/mirror and console checks are not claimed.
- No connectors, runtime, combat values, packages, atlases, roster, deployment, commit, push, PR, or publication changed. Status remains `candidate-only`, `deployable: false`, and `awaiting_human_grave_furrow_launch_repair_review`.
- Applied NGA Engine V2 and references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighter Atlas Factory; Image Generation; Character Sprite Pipeline; Animation Fluidity Standard; in-app browser; Obsidian Markdown; and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-24-swahili-grave-furrow-blade-swing-repair-v3.md`.

### What's Next

- Human-review the new low→contact→carry blade arc. Do not create connectors or integrate runtime/combat until this targeted motion repair is explicitly approved.

## 2026-08-22 — Swahili Grave Furrow V1 targeted launch repair

- Applied human result `SPECIAL_HEAVY_GRAVE_FURROW_V1: APPROVED_CONCEPT_WITH_TARGETED_LAUNCH_REPAIR` without returning to the rejected vertical-launch checkpoint. Frames `01-04` and `08-09` were protected without rewrite; their six SHA-256 values remain unchanged. Only Frames `05 release_acceleration`, `06 single_rising_contact`, and `07 launcher_follow_through` were re-authored.
- The selected repair now reads shallow/low at Frame 05 (`-1.42°` shaft), one forward/up lower-torso slice at Frame 06 (`34.0°`), and same-line carry-through at Frame 07 (`30.26°`). Frame 06 remains the only visible/proposed hit; no second contact, shot, projectile, baked VFX, hook capture, or reel-in was introduced.
- Added detached full-volume Sable victim evidence: grounded before contact, feet airborne at contact/follow, pelvis traveling `620 px` screen-right versus `220 px` upward (`19.54°`). The victim proxy is review-only and is not baked into Swahili or integrated into runtime.
- Rebuilt the candidate review package at `tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-key-poses-v1/` with the updated numbered sheet, old/new Frames 05-07 comparison, `04→05→06→07→08` strip, paired attacker/victim contact, silhouette scrub, blade-tip/inner-hook/shaft overlays, victim root/pelvis/head path, authored/mirrored views, and 1×/0.5× VFX-off previews. Animator report: `tools/nga-forge/production/characters/swahili/reports/special-up-heavy-grave-furrow-key-poses-v1/animator-report.md`.
- Deterministic builder PASS; focused tests `8/8`; alpha/edge audit PASS; review page and all declared assets pass static HTTP (`14/14` images, `9/9` scrub frames). In-app browser automation was blocked by the localhost URL policy, so interactive scrub/mirror and console checks are explicitly not claimed; the server is live at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-key-poses-v1/review.html` for manual refresh.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No connectors, combat values, runtime mappings, packages, atlases, roster, deployment, commit, push, PR, or publication changed.
- Status remains `candidate-only`, `deployable: false`, and `awaiting_human_grave_furrow_launch_repair_review`.
- Applied NGA Engine V2 and its character/asset/validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighter Atlas Factory; Image Generation; Character Sprite Pipeline; Animation Fluidity Standard; in-app browser; Obsidian Markdown; and Obsidian CLI guidance.

### What's Next

- Human-review the repaired Frames 05-07, especially the paired lower-torso contact and backward-dominant victim path. Do not create connectors or integrate runtime/combat until this targeted launch repair is explicitly approved.

## 2026-08-18 — Juggle Animation Lab V1 + attacker attack-motion presentation

- Root cause of "characters stand still while juggling": `src/stage/fighterFrameSelector.ts` had no branch for `phase === "attack"`, `jump*`, `landing`, or `crouch`, so the attacker cycled idle art through every move. Only the defender's reaction motion was wired up.
- Added `src/stage/attackFrameTracks.ts`: a startup/active/recovery pose track per engine attack id, spread across whatever window length the simulation reports. Artwork adds no frames and never writes simulation state. Extended `src/stage/spriteSources.ts` from 23 to 75 frames using the same approved / human-review sources the isolated Swahili sandbox already presents (standing + crouching light/medium/heavy, air light/medium/heavy, jump/fall/landing, crouch).
- `StagePresentation` now decodes frames in batches of 8 and caps preview textures at 768 px (source PNGs untouched) — 75 uncapped 1536² textures would have been ~940 MB of GPU memory.
- New harness `juggle-lab.html` + `src/jugglelab/` replays four scripted routes (`2H → j.J → j.K → j.L`, the five-action route, `2H → j.L`, and the grounded `5L → 5M → 5H`) as per-tick P1 inputs at selectable speed, with a per-tick attacker frame log showing pose, tick, hold length, and startup/active/recovery. Run with `npm --prefix NO_GODS_ABOVE/engine_v2 run lab:juggle` (127.0.0.1:4197).
- Two real bugs found and fixed while testing: the grounded route re-pressed its own opener button (5L→5L never cancels), and a press swallowed by hitstop stalled the script forever. The driver now retries a press on a clean edge until the simulation actually starts the expected move.
- Evidence: new `tests/swahili_juggle_attack_animation_v1.test.js` `9/9` (added to `npm test`), full `npm run validate` PASS, live browser smoke `scripts/juggle_lab_smoke.js` PASS with 4 routes, 0 console errors, 0 failed requests, and 11 captured attacker poses in `NO_GODS_ABOVE/engine_v2/docs/juggle_lab/`. Primary route shows 11 distinct attacker poses and 18 total, 4 hits, juggle 5, soft knockdown.
- The existing combat harness (`index.html`) inherits the same motion — verified live: 75/75 textures, no console errors, `2H` now plays anticipation → acceleration → contact instead of idle.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No combat value, package, atlas, roster, VFX, audio, deployment, commit, push, or publication change. Status `candidate-only`, `deployable: false`.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-18-nga-juggle-animation-lab-v1.md`.

### What's Next

- Human review of the attack motion at 0.25x in the lab. Air normals and several connectors are still human-review candidates, not approved art — approve or reject them there before this presentation layer is treated as settled.

## 2026-08-17 — Swahili Special Forward Heavy ground-drag slice V1 candidate

- Reworked Special Forward Heavy as the requested single-hit grounded scythe attack: low ready, scythe drop, ground-drag load, lead-foot drive, one committed low slice, continuous carry-through, heavy recovery, and controlled return. The move no longer reads as hook capture, command grab, throw, gun attack, multi-hit flourish, or blade-flip showcase.
- Built a nine-pose authored family and mirrored review package at `tools/nga-forge/production/characters/swahili/reviews/special-forward-heavy-ground-drag-slice-v1/`. The old long-hook/control candidate remains preserved for comparison and was not promoted.
- Gauntlet review rejected noncanonical blade variants, thrust-like carry poses, duplicate carries, contaminated alpha edges, and recovery poses that weakened the slash. The retained family keeps one visible contact and a low-to-forward blade path with a detached backward-send intent arrow.
- Validation passes: deterministic builder PASS, focused tests `7/7`, nine scrubber frames `9/9`, declared review images `12/12` loaded over HTTP, zero browser warning/error logs, approved root/scale/containment/mirroring checks, and alpha/edge contamination inside the candidate envelope.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`; Engine V2 core hashes also remain unchanged. No connector, runtime, combat, package, atlas, roster, deployment, commit, push, PR, or publication change occurred.
- Status is `candidate-only`, `deployable: false`, and `awaiting_human_special_forward_heavy_ground_drag_slice_key_pose_review`. The review is open at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-forward-heavy-ground-drag-slice-v1/review.html`.
- The earlier Up Special Heavy blade-direction repair was superseded before promotion and remains unpromoted.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Fighter Atlas Factory, Character Sprite Pipeline, Animation Fluidity Standard, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- The Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-17-swahili-special-forward-heavy-ground-drag-slice-v1.md`.

### What's Next

- Human-review only the nine-pose key family and authored/mirrored presentation. Do not build connectors or perform runtime integration until this key-pose candidate is explicitly approved.

## 2026-08-17 — Swahili Up Special Heavy Grave Furrow blade-direction repair V2

- Resumed the candidate-only Grave Furrow key-pose package and rejected its prior visual checkpoint because the written audit claimed a correct rising blade without proving the actual Frame 03+ orientation.
- Re-authored Frames 03–07. The ground drag now travels left plant -> lower-center connector -> far-right resistance, then the whole rigid scythe head rises while the crescent remains below the skull hub and faces down through release, the sole contact, and follow-through.
- Added measured source and normalized hub-to-tip landmarks plus authored/mirrored detached overlays. The blade-direction gate now hard-fails unless Frames `03,04,05,06,07` all keep the tip below the hub.
- Preserved the nine-pose spine, exactly one visible/proposed rising hit at Frame 06, zero ground-drag hits, zero shots/projectiles/baked VFX, approved recovery/remount anchors, and the previous rejected frames under `generated/rejected/`.
- Validation passes: deterministic builder PASS, focused tests `7/7`, 9 scrub frames, 12/12 live review images loaded, mirrored transform verified, zero browser warnings/errors, alpha/edge audit PASS with maximum saturated-green count `80`, and protected `game.js` SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Review is open at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-key-poses-v1/review.html`. Status remains `candidate-only`, `deployable: false`, and `awaiting_human_special_up_heavy_grave_furrow_key_pose_review`.
- No connector, combat value, runtime, package, atlas, roster, deployment, commit, push, PR, or publication changed.
- Applied NGA Engine V2 and its universal-character, asset-animation, and validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Fighter Atlas Factory; Image Generation; Character Sprite Pipeline; Animation Fluidity Standard; in-app browser; Obsidian Markdown; and Obsidian CLI guidance.
- The Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-17-swahili-special-up-heavy-grave-furrow-blade-direction-repair-v2.md`.

### What's Next

- Human-review the numbered sheet and 1x/0.5x authored/mirrored VFX-off previews. Do not create connectors or integrate runtime/combat until the repaired key-pose family is explicitly approved.

## 2026-09-01 — Lamuh Legacy V2 modern crouch + jump combined-playtest candidate

- Moved the existing dirty candidate work onto the user-requested branch `codex/lamuh-legacy-v2-rebuild-v1`. The target branch and prior working branch pointed to the same commit before the switch. No commit, merge, push, PR, or deployment occurred.
- Preserved and hash-checked the protected four-frame V1 crouch and jump sources. Rebuilt their obsolete purple-edged artwork as `6` modern crouch frames and `7` modern jump/fall/landing frames while retaining the V1 low-crouch and raised-knee airborne silhouettes.
- Crouch candidate roles: lowering entry, lowering connector, deep guarded crouch, held settle, rising connector, standing recovery. Review exposure is `3/3/6/6/4/4` (`26` ticks). Live sandbox plays the entry and deep hold; the rising connector remains comparison-ready targeted debt because silently adding a gameplay/presentation phase would change neutral responsiveness or checksum state.
- Jump candidate roles: anticipation, takeoff, rise, apex, fall, soft landing, guarded recovery. Review exposure is `4/3/5/4/5/4/3` (`28` ticks). Live sandbox maps startup and vertical velocity to the poses, then uses the landing recovery phase. Simulation remains authoritative for all travel and landing timing.
- Normalized all `13` frames to the existing `2048x1536` canvas and fixed root `(768,1360)`. One baked source-sheet camera correction is used per sheet (`1.63934426` crouch, `2.17391304` jump) against the `800 px` modern idle reference; no per-frame/runtime rescaling or visual recentering. No meaningful purple remains and no frame touches an edge. Component QA removed one detached neighboring-cell coat fragment from Jump Frame 04 before integration.
- Added candidate source frames, public movement frames, sidecars, normalization report, fixed-scale numbered contact sheet, immutable candidate hash lock, source-audit updates, V1/V2 comparison integration, and `Crouch movement` / `Jump movement` sandbox scenarios. Existing grab/throw review remains a separate move-specific human gate inside the combined status.
- Validation PASS: `npm.cmd --prefix .\NO_GODS_ABOVE\engine_v2 run test:lamuh-legacy-v2`; `npm.cmd --prefix .\NO_GODS_ABOVE\engine_v2 run build` (existing large-chunk warning only); `npm.cmd --prefix .\NO_GODS_ABOVE\engine_v2 run smoke:lamuh-legacy-v2`. Browser evidence covers V1/V2 crouch and jump, live crouch hold, jump rise, apex, landing, fixed root, disabled runtime rescale, and zero purple.
- Primary artifacts: `tools/nga-forge/review/lamuh-legacy-v2-crouch-jump-modernization-v1/`, `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/crouch-jump-modernization-v1.hash-lock.json`, `NO_GODS_ABOVE/engine_v2/public/lamuh-legacy-v2/movement-v2/`, and `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/`.
- Protected `NO_GODS_ABOVE/game.js` was not edited. Status remains candidate-only, `deployable: false`, and `awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review`.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Fighter Atlas Factory, LAMUH Fighting-Game Playtest QA, Image Generation, Character Sprite Pipeline, Animation Fluidity Standard, and Obsidian Markdown guidance.
- Central Obsidian sync is not claimed because the vault bridge/CLI is unavailable from this workspace. Pending handoff: `.agent-sync-pending/2026-09-01-lamuh-legacy-v2-crouch-jump-modernization-v1.md`.

### What's Next

- Human-review `Crouch movement` and `Jump movement` in `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`, then compare `crouch` and `jump` at 1x, 0.5x, and frame-step in `http://127.0.0.1:4177/lamuh-v1-v2-review.html`.
- Approve or reject crouch motion, jump motion, scale, and transitions independently. If crouch motion passes, integrate the already-authored rising connector through a deterministic presentation contract without delaying neutral actions; do not infer that approval from technical validation.
- Standard grab, forward throw, and back throw still require their own human decisions. Do not promote or continue broader moveset production until the current review gate is resolved.

## 2026-08-16 — Engine V2 Combat Recovery V1 candidate

- Completed the candidate air-combo ending layer without retuning the human-accepted combo cadence: directional/manual and automatic air tech, immediate combo break on tech, `10` air-tech invulnerability ticks, `5.5` directional tech speed, `-5.5` vertical stabilization, `26`-tick soft knockdown for unrecovered airborne landings, existing `42`-tick hard knockdown, existing `18`-tick getup, and existing input-locked `5`-tick ordinary landing recovery.
- Preserved the accepted six-tick air-tech window, `12`-tick minimum airborne hitstun, eight-point juggle ceiling, gravity, damage, knockback, and the seven-hit `271`-damage `8/8` route. Ordinary attacks remain no-OTG.
- Added a prominent live combo/recovery panel and `Dummy Tech Back`, `Dummy Tech Neutral`, and `Dummy Tech Forward` controls. The panel reports tech windows, tech direction, soft/hard knockdown, getup, and landing recovery instead of the raw JSON being the only readable signal.
- Gauntlet repair 1: focused testing proved that the newly tracked tech invulnerability was not yet consulted by hit detection; the missing candidate-rejection check was added and same-tick re-hit is now blocked. Gauntlet repair 2: fresh HUD review found getup falsely showed `DEFENSE READY`; it now displays remaining getup ticks.
- Focused Combat Recovery passes `10/10`; Combat Spine `11/11`; Combat Systems `11/11`; hit-reaction presentation `5/5`; full `npm.cmd run validate`; and `npm.cmd run build` with only the existing large-chunk warning. The replay checksum `32251695` was independently reproduced three times before updating the fixture.
- Live in-app verification at `http://127.0.0.1:4194/` confirmed the air-tech explanation, all three tech buttons, readable status panel, checksum `32251695`, `14/14` textures, empty runtime warnings, no stage load error, and zero captured browser warning/error logs.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No approved move art, package, atlas, roster, VFX, audio, deployment, commit, push, or publication changed.
- Status remains candidate-only, non-roster, and `deployable: false` pending human feel review. Applied NGA Engine V2, Fighting Game Balance Pass, LAMUH Fighting-Game Playtest QA, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-16-nga-engine-v2-combat-recovery-v1.md`.

### What's Next

- Human playtest all three air-tech directions, combo-counter reset, missed-tech soft knockdown, getup readability, and landing recovery at `http://127.0.0.1:4194/`. After approval, begin character-specific special attacks against this accepted combat foundation.

## 2026-08-26 — Cluckarot Codex pet v2 upgrade

- Upgraded the external Codex pet at `C:\Users\qchee\.codex\pets\cluckarot` from the v1 `1536x1872` atlas to the v2 `1536x2288` atlas with 16 clockwise looking directions and `spriteVersionNumber: 2`.
- Preserved the original populated animation cells in rows 0-8, added the required v2 neutral cell, and retained the original manifest and spritesheet under the release backup.
- The installed WebP hash matches the validated release. Installed validation passes with zero atlas errors/warnings, zero transparent RGB residue, zero chroma fringe, and no alpha holes. Three-agent blind QA passes both hard cardinal gates; independent final visual QA passes after repairing the 315-degree up-left pose.
- Release evidence: `C:\Users\qchee\.codex\visualizations\2026\08\26\01a03e81-b341-71d3-83da-0938940d8420\cluckarot-v2-upgrade-release`.
- No NO GODS ABOVE game code, roster, gameplay asset, deployment, commit, push, PR, or publication changed. Applied Hatch Pet, Image Generation, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-08-26-cluckarot-v2-upgrade.md`.

### What's Next

- Restart or reload Codex if the pet renderer does not immediately pick up `spriteVersionNumber: 2`; no further asset work is required for this upgrade.

## 2026-08-26 — Swahili Down Heavy Grounded Verdict V2 finished; walking-animation import next

- Human direction reopened every Forward and Down special because the current families were too fast and insufficiently distinct. The authored redesign contract is `tools/nga-forge/production/characters/swahili/design/swahili-v2-forward-down-special-action-redesign-v2.{md,json}`. Forward Light/Medium/Heavy remain pending a complete `Execution Advance` family rebuild; Down Light/Medium remain pending slower, clearer `Grounded Verdict` variants.
- Implemented only the first concrete slice before the pause: Down Heavy `Grounded Verdict V2`, an `80`-tick, two-contact local Engine V2 candidate. Contact 1 is a low staff plant on ticks `28-31`; Swahili then visibly draws two pistols during an in-place spin; Contact 2 is one simultaneous mid contract-bullet blast on ticks `49-51`, followed by deliberate holster/scythe-reclaim recovery. It has no root travel, capture, side switch, victim rotation, airborne release, midair-shot interaction, projectile entity, or cancel route.
- Added and normalized 18 RGBA `1536x1536` review frames under `tools/nga-forge/production/characters/swahili/source-frames/candidates/moveset-goal-v1/special-down-heavy-grounded-verdict-v2/`. Technical normalization passes; contact sheets are under `reviews/special-down-heavy-grounded-verdict-v2/`. Status is candidate-only and nondeployable at `status/special-down-heavy-grounded-verdict-v2.status.json`. Known polish debt is recorded there: generated body-scale variance, slight planted-scythe drift, and a deliberate repeated ferrule-lift recovery hold replacing a rejected pose that reintroduced both pistols.
- Focused Down Heavy V2 tests pass all eight gates: exact 80-tick/18-pose contract, exactly two contacts, crouch/stand guard behavior, input isolation, no travel/capture/projectile leakage, deterministic replay, and protected legacy hash. Adjacent Down Light, Down Medium, Forward Heavy, Grave Furrow, frozen Command Grab, Standing Heavy balance, defense/reactions, turn/side-switch, and air-mobility suites pass unchanged. The production build passes.
- Restarted the local Engine V2 Vite server on `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1`. The local `Demo Grounded Verdict` control now queues the exact one-tick `S+U+L` input through the normal combat path. Live browser QA captured the second contact and verified the staff-plant -> spin -> contract-blast sequence, `2 HIT / 104 DMG`, dummy health `896`, soft knockdown, `195/195` textures, and zero debug warnings at contact.
- `npm.cmd --prefix NO_GODS_ABOVE/engine_v2 test` reaches and passes Grounded Verdict plus all preceding tests, then stops only at the preserved unrelated `swahili_sandbox.test.js` approval lock (`actual A789...` versus `expected 998...`). That hash was not blessed or changed; the four tests after the stop were run directly and pass. Evidence is recorded in `tools/nga-forge/production/characters/swahili/reports/special-down-heavy-grounded-verdict-v2/gameplay-validation.json`.
- The user resumed only long enough to finish this special, then intends to import new material for repairing the walking animation. Grounded Verdict V2 is finished as a local human-playtest candidate, not motion-approved or deployable. Do not continue the other Forward/Down special redesigns or alter walking assets until the walking import arrives and is inspected. Preserve the running local server and all candidate/rejected evidence.
- Read-only walking intake audit found no new import in the current workspace or current thread attachments. It also confirmed a pre-existing integration mismatch to address after the import: the isolated accepted forward review uses contact-weighted `[6,5,4,5,6,5,4,5]` exposure over `40` ticks, while the full playtest selector currently uses flat `4`-tick exposure over `32` ticks. Backward walk remains a five-frame/25-tick runtime fallback because `walk_backward_first_passing`, `walk_backward_first_up`, and `walk_backward_opposite_down` are still blocked on manual RGBA paintovers. Intake evidence: `tools/nga-forge/production/characters/swahili/reports/walk-repair-import-intake-v1/baseline-audit.json`. No timing or art was changed before seeing the import.
- `NO_GODS_ABOVE/game.js` remains protected; no roster, package, atlas, deployment, commit, push, PR, merge, or publication occurred. Applied NGA Engine V2 plus character/asset/validation references, Playable Character Production, Fighting Game Balance Pass, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, VFX Integration Audit, Fighter Atlas Factory, Image Generation, LAMUH Fighting-Game Playtest QA, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Current pending handoff: `.agent-sync-pending/2026-08-26-swahili-grounded-verdict-v2-finished-before-walk-import.md`; the earlier pause note is retained as superseded history.

### What's Next

- Wait for the user's walking-animation import. Inspect it before modifying any walk source, then repair the walking animation in a separate bounded slice while preserving the accepted full-animation baseline and the finished Grounded Verdict V2 candidate. Forward/Down family redesign resumes only when the user asks.

## 2026-08-27 — Swahili Grounded Verdict scale/outline repair and walk-video intake

- Repaired the Down Heavy `Grounded Verdict V2` size jump and pale/cyan matte outline without changing combat timing or damage. Frames 01-06 remain exact copies; frames 07-18 use root-locked uniform scale and exterior-fringe cleanup, with the contract-bullet flash protected.
- Local Engine V2 now loads the repaired frame directory through `NO_GODS_ABOVE/engine_v2/src/stage/spriteSources.ts`. Focused Grounded Verdict tests pass `8/8`; the production build passes; live capture verified staff plant at tick 36, gun draw at 45, dual-pistol aim at 55, and contract blast at 65 for `2 HIT / 104 DMG` and dummy health `896`. The runtime loaded `195/195` textures with no load error or browser console warnings/errors.
- Copied and hashed the supplied `Character_walk_cycle_animation_202608270529.mp4`, then decoded all `240` source frames at approximately `24 fps`. Review found four repetitions of one 60-frame forward-walk cycle. Raw numbered frames and four contact sheets are under `tools/nga-forge/production/characters/swahili/imports/walk-repair-video-20260827/`.
- Rejected the automatic dark-key alpha candidate because the opaque black background cannot be separated from Swahili's black coat and trousers without destructive holes. The rejected matte remains evidence only and was not wired into runtime. The video is retained as forward-walk motion reference for an authored transparent repair; it does not resolve the three blocked backward-walk paintovers.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No Command Grab, combat values, roster, deployment, commit, push, PR, merge, or publication changed. Status remains local candidate-only and nondeployable.
- Applied NGA Engine V2 plus universal-character, asset-animation, and validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; VFX Integration Audit; Character Sprite Pipeline; Animation Fluidity Standard; Watch; and in-app browser guidance.
- Central Obsidian sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-08-27-swahili-grounded-verdict-scale-outline-and-walk-video-intake.md`.

### What's Next

- Human-playtest the repaired Down Heavy in the open local playtest. For the walking repair, author transparent frames from the 60-frame forward-motion reference or obtain a clean-alpha/green-screen source; do not promote the rejected dark-key matte. Preserve the existing accepted walk baseline until a transparent candidate passes frame scrub and live movement QA.

## 2026-08-27 — Swahili Grounded Verdict planted-scythe anchor repair V1

- Fixed the Grounded Verdict V2 continuity defect by anchoring the planted scythe at source coordinate `(781, 1402)` from frame 06 contact through frame 16 reclaim. Frames 08-15 now composite one static planted weapon behind Swahili while his release, spin, gun draw, aim, contract blast, recoil, lower, and holster animation continues; frames 17-18 lift the weapon only after the reclaim reconnects at the same anchor.
- Preserved the existing scale/outline repair, body integrity, 80-tick timing, two-hit contact contract, `104` observed combo damage, zero root travel, input routing, and frozen Command Grab. `NO_GODS_ABOVE/engine_v2/src/stage/spriteSources.ts` points only the 18 Down Heavy presentation imports to the new anchor-repair candidate.
- Anchor audit passes: frames 06-16 keep their strongest planted-floor columns centered at `x=780-781`. Dark, light, and mirrored numbered contact sheets pass local visual QA; destructive old-shaft masking that cut into the body was rejected and is not in the retained candidate.
- Focused Grounded Verdict tests pass `8/8`; the production build passes; both new scripts pass Node syntax checks. Live playtest verified plant, release, spin, blast, holster, reclaim, and lift; `195/195` textures load, no load error, and zero browser console warnings/errors. The post-knockback HUD stage-bound clamp is expected debug state.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No combat values, Command Grab, roster, deployment, commit, push, PR, merge, or publication changed. Status remains local candidate-only, nondeployable, and awaiting human playtest review.
- Applied NGA Engine V2 plus universal-character, asset-animation, and validation references; Playable Character Production; Character Visual Consistency; Sprite Sheet Validation; Character Sprite Pipeline; Animation Fluidity Standard; and in-app browser guidance.
- Central Obsidian sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-08-27-swahili-grounded-verdict-scythe-anchor-repair-v1.md`.

### What's Next

- Human-playtest the refreshed `Demo Grounded Verdict` move in the open local Engine V2 tab. Resume the walking-animation repair as a separate bounded slice only when requested.

## 2026-08-28 — Grave Furrow V5 moving-slash direction checkpoint

- Replaced the V4 planted-looking finish with a six-pose V5 direction option: grind, running transition, traveling pickup, airborne torque, slash during a long forward lunge, then a moving cross-step recovery. The user direction is locked verbatim as “instead of stopping he should stay in motion with the slash.”
- Fresh-context visual review passed the root-motion, one-impact, rigid-scythe, identity, scale, and full-body reads after two targeted ornament rounds restored one attached trailing chain and pendant in the two final poses.
- The V5 board remains opaque `REFERENCE_ONLY` direction art. It is not a slicable sprite source, motion-approved, runtime-integrated, deployable, roster-authoritative, or release-approved. Current Grave Furrow V1 playtest and runtime fallback remain unchanged.
- The review hub now points Up Heavy’s secondary review to `tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-drive-through-cleave-v5/review.html`. Local HTTP validation returned `200`; the review was queued to open at `http://127.0.0.1:4196/tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-drive-through-cleave-v5/review.html`.
- Focused Grave Furrow V3/V4/V5 regression tests pass `15/15`. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No Blender, combat values, input routing, accepted throws, Command Grab, atlas, roster, deployment, commit, push, PR, or publication changed.
- The separate Down Heavy rigid-scythe V3 cleanup remains rejected by its strict 1:1 visual gate because clean body mattes and complete old-prop removal are not yet proven. Runtime still uses the earlier human-marked scythe-anchor fallback; do not promote V3.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Fighting Game Balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, Image Generation, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.

### What's Next

- Human-review Grave Furrow V5’s moving slash and cross-step recovery. Approval covers direction only; transparent source poses and connectors remain blocked until that decision. Continue the Down Heavy matte/prop cleanup as a separate candidate-only repair without touching its runtime fallback.

## 2026-08-28 — Lamuh Down Heavy VFX removal and Air Normal review batch V1

- Disabled Crouching Heavy contact VFX at authoring, closure, renderer, and browser-smoke layers. Its contact presentation is now `DISABLE_FOR_NOW`, `vfxEnabled: false`, and body-only for hit, block, and whiff; toggling sandbox VFX cannot change the contact canvas.
- Added outline-free modern V2 candidates for Air Light (4 frames, `PRESERVE_WITH_RETIMING`), Air Medium (6 frames, `MODERNIZE` with one consistent striking leg), and Air Heavy (7 frames, `MODERNIZE` as a single descending two-hand slam). Each has one visible contact and one gameplay hit; contact VFX remains disabled for this review batch.
- Normalized all 17 frames to `2048x1536` with fixed root `(768,1360)`, one sequence-wide scale per move, no per-frame renderer scaling, no visual recentering, zero meaningful magenta pixels, and no edge touches. First-frame visible heights are `803 / 821 / 814`, a `2.19%` spread.
- Added three Forge candidate packages, deterministic timelines and combat profiles, public review frames, closure sidecars, V1/V2 timing comparison, numbered frame scrub, sandbox scenarios for `jump → j.L`, `jump → j.M`, `jump → j.H`, and the `j.L → j.M → j.H` air chain. All packages remain `candidate`, `deployable: false`, and are not roster-promoted.
- Validation passes: production TypeScript/Vite build; Lamuh V2 targeted suite `37/37`; production-contract and compiled-content check with `24` nondeployable Lamuh packages; live comparison/sandbox browser smoke; protected `NO_GODS_ABOVE/game.js` SHA-256 remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Primary review artifacts: `tools/nga-forge/review/lamuh-legacy-v2-air-normals-v1/air-normals-numbered-contact-sheet.png`, `tools/nga-forge/review/lamuh-legacy-v2-air-normals-v1/normalization.report.json`, and `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/`. Review route defaults to Air Light; sandbox includes all three air normals.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, VFX Integration Audit, Character Sprite Pipeline, Animation Fluidity Standard, LAMUH Fighting-Game Playtest QA, and Image Generation guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-08-28-lamuh-down-heavy-vfx-air-normal-batch-v1.md`.

### What's Next

- Human-review Air Light, Air Medium, and Air Heavy at 1x and 0.5x, then playtest jump entry, contact, recovery, landing, and the three-move air chain. Approval is move-specific; do not promote or continue beyond the air-normal gate until the human verdict.

## 2026-08-28 — Swahili Grave Furrow V5 moving-slash review + Down Heavy V3 fresh gate

- Preserved the user's latest Grave Furrow direction in V5: Swahili does not stop for the slash. The six-beat direction sequence advances through grind, run, traveling pickup, airborne torque, moving-lunge contact, and cross-step follow-through. Beat 5 remains the sole implied hit and beat 6 carries forward rather than planting or snapping to neutral.
- Grave Furrow V5 focused tests pass `5/5`; the in-app review loaded with no browser errors at `tools/nga-forge/production/characters/swahili/reviews/special-up-heavy-grave-furrow-drive-through-cleave-v5/review.html`. Status remains `candidate-only`, `runtimeIntegrated: false`, `blenderUsed: false`, and `awaiting_human_grave_furrow_drive_through_direction_review`.
- Down Heavy rigid-scythe/pistol continuity repair V3 now passes its fresh-context visual gate for human direction review after re-authoring the recoil matte and correcting residual fringe, whole-body scale continuity, and weapon continuity. Its family-distinction audit is aligned to the final V3 evidence. It remains review-only; runtime still uses `special-down-heavy-grounded-verdict-v2-scythe-anchor-repair-v1`.
- Validation: Down Heavy V3 plus down-family tests pass `13/13`; focused Engine V2 tests pass for standalone `U` no-op, Grave Furrow, Grounded Verdict, special review controls, universal throws, frozen Command Grab, and throw review controls; the production build passes. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- The broad historical Swahili Python sweep ran `389` tests with `12` failures caused by stale prior-gate assertions and unrelated shared-file hash-lock drift. Those historical records were not rewritten as part of this bounded motion repair.
- No Blender, combat values, input routing, accepted throws, Command Grab, runtime V3 promotion, atlas, roster, deployment, commit, push, PR, or publication changed. Applied NGA Engine V2, playable-character production, visual-consistency, sprite-validation, sprite-pipeline, animation-fluidity, image-generation, and in-app-browser guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-08-28-swahili-grave-furrow-v5-down-heavy-v3.md`.

### What's Next

- Human-review Grave Furrow V5's moving slash and cross-step. Approval covers motion direction only; final transparent production frames, connectors, timing, combat integration, VFX/audio, roster, and release remain separate gates. Down Heavy V3 likewise awaits human direction review before any runtime promotion.

## 2026-09-01 — Lamuh Legacy V2 first-playable audit and current review-gate reconciliation

- Reconciled the active Lamuh milestone, closure record, public review data, and generated manifest to the requested branch `codex/lamuh-legacy-v2-rebuild-v1` and the current status `awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review`.
- Added `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/FIRST_PLAYABLE_REQUIREMENTS_AUDIT.md`, mapping every first-playable requirement to its Forge package, comparison/sandbox evidence, technical state, human gate, and honest remaining debt. The current character bundle has `24` candidate packages, all human-gated and nondeployable.
- Updated the V1/V2 comparison route to open on crouch and show the current crouch, jump, grab, throws, and combined-movement decision queue. No control promotes assets or approves combat/production.
- Added regression coverage that binds the branch, 24-package count, coverage groups, semantic grab states, candidate firewall, current review status, and audit artifact. Recompiled the candidate manifest after the metadata-only source digest changed.
- Strengthened the browser smoke so it now proves the live comparison route opens on crouch, shows all six current human-decision prompts, exposes 1×/0.5×/frame-step/facing/restart controls, links to the deterministic sandbox, and renders V1/V2 crouch evidence before later scenarios. The direct receipt is `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/current-review-gate-crouch-default.png` (`1500x2064`, SHA-256 `AC4000B7A05D4758489B406E2168DBD7799E890A4888609D7E65998284F3D7C6`).
- Replaced the overflowing raw movement-status enum in the human-facing card with a readable summary; the authoritative machine status is unchanged.
- Validation passes: Lamuh deterministic/content/closure suite; TypeScript/Vite production build; 13-schema production-contract validation with all 24 Lamuh packages `deployable: false`; compiled-content freshness check; and live comparison/sandbox browser smoke. The existing large Vite chunk warning remains informational.
- Protected `NO_GODS_ABOVE/game.js` remains outside the edited scope. No gameplay timing, combat values, legacy source, roster, deployment, merge, push, PR, or production promotion changed.
- Central Obsidian sync is not claimed. Updated repo fallback handoff: `.agent-sync-pending/2026-09-01-lamuh-legacy-v2-crouch-jump-modernization-v1.md`.

### What's Next

- Human-review crouch and jump first, then Standard Grab, Forward Throw, Back Throw, and combined movement. If crouch passes, integrate the already-authored rising connector through a deterministic presentation contract that does not delay neutral actions or change checksums.

## 2026-09-01 — Swahili throw-integrity consolidation and Grave Furrow V6 reconciliation

- Consolidated the unresolved universal-throw whiff, authored/mirrored corner behavior, and Command Grab victim-fall evidence under `tools/nga-forge/production/characters/swahili/reviews/swahili-throw-interaction-integrity-v1/review.html`. Automated evidence passes, but human punishability/corner/fall-continuity review remains open; Throw Tech remains blocked on its manual bilateral pre-lock parry paintover.
- Linked the consolidated page from the throw group in the 23-item Swahili special/throw hub. Browser validation passes with `14/14` media loaded, zero failed images, zero console errors, and no horizontal overflow. Focused throw/current-state Python coverage passes `59/59`; all six throw/input runtime suites pass, including standalone `U` remaining inert.
- Reconciled every current-state surface for Up Heavy to `special-up-heavy-grave-furrow-running-slash-carry-v6`. The matrix now records `candidate_direction`, the completion audit records seven poses with contact on beat 5, passing step on beat 6, and running exit on beat 7, and the final JSON report points to the same V6 candidate instead of the superseded Vertical Launcher detail.
- Grave Furrow V6 remains opaque `REFERENCE_ONLY` direction art. It is not motion-approved, slicable, runtime-integrated, deployable, roster-authoritative, or release-approved. The preserved playable Grave Furrow V1 remains the comparison path while the human judges the continuous run-through direction.
- The full Swahili playtest is live at `http://127.0.0.1:4175/index.html?full-animation-v1=1&neutral-medium-v2=1&down-heavy-v2=1&special-modifier-v1=1&special-review-controls-v1=1&throw-review-controls-v2=1#special-review-controls`. Current integrated candidates and deterministic throw controls are ready for human playtest.
- Final focused reconciliation coverage passes `58/58`; protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No approved throw motion, Command Grab motion, combat values, final sprite package, roster, deployment, Blender build, commit, push, PR, or publication changed.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Fighting Game Balance, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, Image Generation, LAMUH Fighting-Game Playtest QA, in-app browser, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-throw-integrity-grave-furrow-v6-current-state.md`.

### What's Next

- Await targeted human playtest feedback on the integrated Neutral Medium, Up Medium, Grave Furrow fallback, Grounded Verdict, universal-throw, corner, and Command Grab scenarios. Keep V6 direction-only until the user explicitly accepts its motion read; do not infer approval from opening or playing the harness.

## 2026-09-01 — Lamuh V2 modern dash, air-dash, and standing-block review candidate

- Rebuilt Lamuh's Dash Forward (`6` frames), Dash Backward (`5`), Air Dash Forward (`6`), Air Dash Backward (`5`), and Standing Block (`4`) in the approved outline-free modern style while preserving protected V1 pose progression, momentum, coat/loc lag, and guard rhythm.
- Normalized `26` unique transparent frames to the shared `2048x1536` canvas and fixed root `(768,1360)` with one baked scale per sequence, zero per-frame/runtime scaling, zero meaningful magenta/red artifacts, and zero edge touches. Removed one detached neighbor-cell foot and the final backdash ground-dust artifact during frame scrub.
- Integrated the five candidate sequences into both `lamuh-v1-v2-review.html` and `lamuh-legacy-sandbox.html`. The review now opens on Dash Forward; the sandbox has dedicated Dash Forward, Dash Backward, Air Dash Forward, Air Dash Backward, and Standing Block buttons. Shift dash remains functional. Crouching Block and all combat/gameplay values remain unchanged.
- Added `build_lamuh_legacy_v2_dash_block_modernization.js`, per-state visual candidate metadata, `dash-block-modernization-v1.hash-lock.json`, public contact sheets/frames, updated review/audit/milestone metadata, and explicit candidate-only human gates.
- Validation passes: `test:lamuh-legacy-v2`, TypeScript/Vite production build, live browser comparison/sandbox smoke, 26-frame hash/fixed-root checks, and combined five-state purple count `0`. Browser receipt: `NO_GODS_ABOVE/engine_v2/artifacts/lamuh-legacy-v2/browser-smoke-closure.json` with zero errors and zero failed requests.
- Protected `NO_GODS_ABOVE/game.js` remains outside the edited scope. No movement physics, combat values, input rules, legacy source, roster, deploy, merge, push, PR, or promotion occurred. Applied NGA Engine V2 preservation, universal-character, animation workflow, validation-gate, playable-character, visual-consistency, sprite-validation, sprite-pipeline, animation-fluidity, Fighter Atlas Factory, Image Generation, and LAMUH Fighting-Game Playtest QA guidance.
- Central Obsidian sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-09-01-lamuh-v2-dash-air-dash-standing-block-modernization-v1.md`.

### What's Next

- Human-review Dash Forward, Dash Backward, both Air Dashes, and Standing Block at 1x/0.5x and in the combined sandbox. Stop at this gate; approval must remain move-specific before any candidate promotion or broader moveset expansion.

## 2026-09-01 — Swahili new-motion preview visibility repair

- Diagnosed the human-visible mismatch: the Engine V2 full fighter page contains integrated gameplay candidates and preserved fallbacks, while the newest unresolved Neutral/Back/Up work lives in a separate candidate-only sampler. That sampler previously opened on Neutral Light's static direction board, so it looked like no new animation was present.
- The remaining-special sampler now opens on the actual Back Medium looping motion GIF by default, accepts a shareable `move` query, and labels all six tabs as either `MOTION` or `DIRECTION ONLY`. Back Light, Back Medium, and Up Light are the three motion previews; Neutral Light, Neutral Heavy, and Back Heavy remain static direction evidence and were not misrepresented as animation.
- Added a direct `Open 3 newer motion previews` link inside the full fighter's Special Review Controls. The hub and status routes now also open directly on Back Medium motion.
- Browser QA loaded all three motion GIFs at their exact `720x720` natural size with zero recorded warnings/errors. Focused sampler tests pass `9/9`; the earlier direction-board cutoff tests pass `7/7`; Engine V2 special-review-controls V3 and TypeScript compilation pass with all `27` scenarios preserved.
- Combat definitions, runtime sprite mapping, approved motion, source GIF bytes, and `NO_GODS_ABOVE/game.js` were not changed. The protected legacy hash remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. The three visible GIFs remain candidate key-pose evidence with non-authoritative timing, not final runtime animations.
- Central Obsidian sync is not claimed because the CLI remains unavailable. Repo fallback handoff: `.agent-sync-pending/2026-09-01-swahili-new-motion-preview-visibility-repair.md`.

### What's Next

- Human-review the visible Back Light, Back Medium, and Up Light motion previews. Back Medium still lacks the first holster, second holster, and two-pistol redraw connectors. Do not promote any of the three into gameplay until transparent runtime-ready atlases, frame-scrub validation, and explicit human motion approval exist.

## 2026-09-01 — Lamuh Walk Back and Back Dash directional-motion repair

- Replaced only `walk_backward` (`6` frames) and `dash_backward` (`5` frames) with outline-free fixed-scale V2 candidates that visibly move away from Lamuh's right-side opponent. Walk Back now shows rearward foot placement and leftward weight transfer; Back Dash now shows guarded recoil, backward takeoff, airborne retreat, landing catch, and planted brake instead of a forward-sprint silhouette.
- Preserved the existing deterministic contracts: Walk Back remains `18` ticks at `3/3/3/3/3/3`; Back Dash remains `20` ticks at `4/4/4/4/4`. Inputs, simulation displacement, collision, movement physics, and combat values were not changed.
- Normalized `11` unique frames to `2048x1536` with fixed root `(768,1360)`, one scale per sequence, zero runtime/per-frame scaling, zero edge touches, and zero meaningful magenta or red artifacts. Candidate record: `NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/records/backward-motion-repair-v1.hash-lock.json`.
- Added dedicated comparison contact sheets and a `Walk backward` sandbox scenario while retaining the existing `Dash backward` and Shift-backdash controls. Browser smoke proves Walk Back reaches `x=-63.6` in `walk_backward`, Back Dash enters `backdash`, both use `modern_movement`, and the current receipt has zero console errors or failed requests.
- Validation passes: Lamuh deterministic/content/closure suite, TypeScript/Vite production build, production/content-contract freshness checks, live comparison/sandbox browser smoke, and protected `NO_GODS_ABOVE/game.js` hash `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No legacy source, timing, input routing, movement physics, roster, deployment, merge, push, PR, or production promotion changed. Central Obsidian sync is not claimed; repo fallback: `.agent-sync-pending/2026-09-01-lamuh-backward-motion-repair-v1.md`.

### What's Next

- Human-playtest the dedicated `Walk backward` and `Dash backward` buttons at 1x and 0.5x. Approval remains unset for both directional reads and their entry/exit transitions; stop at this review gate.

## 2026-09-01 — Lamuh Walk Back video-derived supersession

- Superseded the generated six-pose Walk Back presentation with seven frames taken exclusively from the hash-locked user walking video. Active source order is `72/60/48/36/24/12/0`, reversing the first complete forward gait cycle so the animation reads as retreat without inventing new poses.
- Preserved the `18`-tick deterministic state with authored exposures `3/3/2/3/2/2/3`, fixed root `(768,1360)`, one baked scale `0.8658`, simulation-authored leftward travel, input routing, collision, and movement physics. Back Dash remains unchanged from its directional repair.
- Added a reproducible PowerShell extraction/normalization script, a dedicated Engine V2 candidate builder, source/hash records, seven public frames, numbered frame scrub, review-route presentation, milestone metadata, and updated deterministic/content/closure assertions.
- Validation passes: source-video hash, seven-frame normalization report, Lamuh test suite, TypeScript/Vite build, production/content-contract freshness checks, and live comparison/sandbox browser smoke. The smoke proves `walk_backward`, `x=-63.6`, `modern_movement`, seven video-derived frames, `18` ticks, and zero meaningful purple pixels.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No legacy source, Back Dash art, combat values, input rules, movement physics, roster, deployment, merge, push, PR, or production promotion changed.
- Applied NGA Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, Animation Fluidity Standard, Watch, and Fighter Atlas Factory guidance. Central Obsidian sync is not claimed; repo fallback: `.agent-sync-pending/2026-09-01-lamuh-walk-back-video-rebuild-v1.md`.

### What's Next

- Human-playtest the refreshed `Walk backward` button at 1x and 0.5x. Judge the retreat direction, foot cadence, body-scale continuity, and neutral entry/exit. Keep the superseded generated Walk Back inactive and stop at this human review gate.

## 2026-09-01 — Swahili V2 conservative gameplay-impact audit V1

- Published a deterministic, candidate-only impact audit for the seven currently playable special definitions and three throw types at `tools/nga-forge/production/characters/swahili/reviews/swahili-v2-conservative-gameplay-impact-audit-v1/review.html`. The 23-item Specials & Throws hub now links to it.
- The audit derives behavior from Engine V2 runtime definitions and executes all `27` special-review scenarios plus all `11` throw-review scenarios. It records exact 60 Hz startup/active/recovery, hitboxes, raw and observed damage, P1/P2 hit-block-whiff outcomes, throw lifecycles, side switches, return-to-neutral bounds, held-input non-repeat, and fresh-input rearm after the `18`-tick buffer plus two clear ticks.
- Deterministic result: `PASS_WITH_HUMAN_FEEL_GATES_AND_KNOWN_DIRECTION_REVISIONS`. Neutral Medium, Up Medium, the Grave Furrow V1 playable fallback, Grounded Verdict V2, Forward Throw, Back Throw, and Command Grab are `PRESERVE_FOR_HUMAN_PLAYTEST`. Forward Heavy, Down Light, and Down Medium fallbacks remain `REVISE` comparison baselines because their requested redesign directions are still unintegrated. Throw Tech remains `BLOCKED` on its existing one-frame manual bilateral-parry paintover.
- Exact preserved values include Neutral Medium `9/3/13`, `65` damage; Up Medium `11/4/20`, `78`; Grave Furrow fallback `34/5/25`, `120`; Grounded Verdict `28/24/28`, two defined contacts, `110` raw and `104` observed scaled damage; Forward/Back Throws `70/75`; and Command Grab `107` authored ticks, `220` damage, one damage event, intended side switch.
- No held input auto-repeats a special or throw. After a full input-buffer clear, every fresh input routes back to its expected move. An initial Back Throw audit fixture omitted the away direction and correctly failed by routing to Forward Throw; the fixture was repaired to `left + throw`, then regenerated and retested. This was not a runtime defect.
- Browser QA renders `7` move rows, `3` throw rows, `38` scenarios, and `1` blocker with no page overflow and zero recorded warnings/errors. Focused validation passes: new impact audit `11/11`, current-state reconciliation `37/37`, special-review controls V3, throw-review controls V2, and TypeScript compilation.
- No combat tuning, hitbox, damage, input, sprite mapping, approved motion, frozen Command Grab, roster, deployment, or legacy runtime changed. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, Fighting Game Balance Pass, Special Move Standard, LAMUH Fighting-Game Playtest QA, in-app browser, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed. Pending handoff: `.agent-sync-pending/2026-09-01-swahili-v2-conservative-gameplay-impact-audit-v1.md`.

### What's Next

- Human-playtest the six named impact questions from the audit before changing numbers: Neutral Medium impact/recovery, Up Medium anti-air risk/reward, Grave Furrow fallback commitment/payoff, Grounded Verdict two-stage weight/whiff exposure, universal throw punishability/corners, and Command Grab hit/whiff feel. Keep the three redesign fallbacks unchanged until their separate motion gates produce runtime-ready candidates.

## 2026-09-02 — Lamuh Crouch release approval and dedicated Turn / Facing candidate

- Recorded the user's `passes` decision as `APPROVED_V1_MOTION_PRESERVED` for `crouch_to_stand_motion_and_transition_only`; this does not approve the whole fighter, combat values, production promotion, or deployment.
- Audited V1 and confirmed no dedicated Lamuh turn/facing clip. Authored an explicit four-frame V2 missing-state candidate: planted entry, rear three-quarter pivot, weight transfer, and settle at `2/3/3/4` exposure (`12` ticks).
- Normalized all four unique outline-free frames to the shared `2048x1536` movement canvas, fixed root `(768,1360)`, one sequence scale, `2%` visible-height spread, `0.12%` Idle median-height delta, and zero meaningful purple/magenta pixels. Retained the first checkerboard/duplicate-settle generation as rejected evidence.
- Integrated a deterministic `turn` presentation phase. Gameplay facing swaps immediately; presentation reads `turnStartingFacing`; P2 mirrors the whole sequence; attack, jump, walk, crouch, block, and dash remain immediately available. Fixed a discovered attack-interruption cleanup defect so `turnStartingFacing` clears on attack entry.
- Added the Turn / Facing Forge package as package `25`, updated audit/milestone/review metadata, made Turn / Facing the default comparison gate, and added the playable sandbox scenario.
- Validation passes: TypeScript/Vite build; 13 production schemas and 25 nondeployable Lamuh packages; Lamuh core/content/closure plus focused Turn / Facing tests; current browser smoke with zero failed requests/errors; protected `NO_GODS_ABOVE/game.js` hash remains `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- No legacy source, combat values, roster, deployment, merge, push, PR, or candidate promotion changed.

### What's Next

- Human-review Turn / Facing at 1x, 0.5x, frame advance, authored and mirrored facing, then use the `Turn / facing` sandbox button to judge interruption and combined flow. Stop at this gate before broader specials production.

## 2026-09-02 — Swahili Forward Medium complete-motion viewer V3

- Replaced the full-playtest pose-slideshow presentation with an honest completed-motion gate. The existing exact Forward Medium deep link now opens a continuous `16`-frame animated WebP candidate; unfinished special links open `swahili-incomplete-motion-notice-v1` instead of stepping through direction boards.
- Built and normalized Forward Medium Shoulder / Rip Combination Motion V3 as `16` transparent `512x512` frames plus a `2048x2048` RGBA atlas, numbered contact sheet, and `1x`/`0.5x` animated WebPs. The connected sequence has visible contacts on Frames `06` and `11`, with the reversal explicitly inactive on Frames `08-10`.
- Repaired the embedded review layout after live QA exposed the animation stage being pushed below the modal viewport. The full body and rigid scythe now remain visible at `1280x720`; restart, `1x`, `0.5x`, and mirrored P2 controls are visible and functional.
- Updated the current moveset matrix and special/throw review hub from `candidate_key_poses` / direction review to `candidate_motion` / complete-motion human review for Forward Medium only. Candidate-only, nondeployable, runtime, combat, roster, and release gates remain unchanged.
- Validation passes: six Python asset tests; three focused viewer/deep-link Node tests; TypeScript/Vite production build; JSON parse checks; live exact-route browser playback with frame changes observed at both speeds; unfinished Forward Light deep-link gate; all post-sandbox-lock tests. The broad `npm test` run passed through the new viewer tests and then stopped at the existing untracked `swahiliSandboxSimulation.ts` human-approved hash mismatch (`A78973...` actual vs `998353...` expected); neither sandbox file was edited in this work.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No Blender, combat values, input routing, approved Command Grab, legacy runtime, roster, deployment, commit, push, PR, or publication changed.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, sprite pipeline, animation-fluidity, special-move, image-generation, fighter-atlas, LAMUH fighting-game playtest QA, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI is unavailable on PATH, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-09-02-swahili-forward-medium-complete-motion-v3.md`.

### What's Next

- Human-review Forward Medium V3 as continuous motion. If accepted, keep combat/runtime integration separately gated. Author real connector passes for the remaining specials one move at a time; do not restore pose slideshows as completed animation.

## 2026-09-02/03 — Lamuh Turn / Facing starred baseline pass and throw-gate handoff

- Recorded the user's `passes but star this one because we may come back to it` response as `APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT` for `turn_facing_motion_mirrored_parity_and_transition_only` in `records/turn-facing-v1.approval.json`.
- Turn / Facing remains candidate-only and nondeployable. It is visibly marked `★ revisit`; the receipt does not approve the combined movement set, combat profile, first playable, runtime-art promotion, roster, or production release.
- Updated the Turn / Facing builder so regeneration preserves and validates the hash-bound approval receipt, polish-debt flag, package metadata, and next-gate state instead of resetting human approval.
- Advanced the comparison and sandbox banners to the independent Standard Grab, Forward Throw, and Back Throw human gates. The comparison route now opens on the 20-tick `universal_grab_attempt`; Turn / Facing remains selectable as `★ turn facing · revisit`.
- Validation passes: `test:lamuh-legacy-v2`, 13-schema production/content validation with all 25 Lamuh packages `deployable: false`, compiled-manifest freshness, TypeScript/Vite production build, and the full Lamuh browser smoke with zero failed requests/errors.
- The convenience `build:lamuh-turn-facing` wrapper encountered a host PowerShell `Get-FileHash` command-resolution failure in the already-normalized Forge script. The authoritative Node builder and content compiler completed successfully from the existing hash-locked normalization evidence.
- Protected `NO_GODS_ABOVE/game.js` remains unchanged. No legacy source, combat values, candidate promotion, roster, deployment, merge, push, or PR changed.

### What's Next

- Human-review Standard Grab first, then Forward Throw and Back Throw as separate decisions. Use the comparison route for 1x/0.5x/frame advance and the sandbox for deterministic victim interaction. Keep the starred Turn / Facing polish debt open for a later targeted revisit.

## 2026-09-03 — Swahili Grave Furrow completed-motion viewer V7

- Replaced Grave Furrow's direction-board/slideshow review with a connected `16`-frame animated WebP candidate. The exact full-playtest deep link now opens the complete V7 motion; the viewer provides restart, `1x`, `0.5x`, and mirrored P2 controls.
- The sequence connects ground grind, forward run, moving scythe pickup, overhead torque, one in-stride slash on Frame `10`, passing cross-step, and running exit. Full body, back leg, and the single straight rigid scythe remain inside frame through recovery; there is no pale/cyan matte outline.
- Preserved the first generated sheet as rejected evidence because it contained extra apparent impacts and an incomplete late scythe. V7 uses `16` transparent `512x512` frames, a `2048x2048` RGBA atlas/contact sheet, and `1x`/`0.5x` animated WebPs.
- Updated the moveset matrix, human-review queue, special/throw review hub, current-state audit, final report, Engine V2 completed-motion menu, exact deep-link routing, and preservation tests. Forward Medium V3 and Grave Furrow V7 are the two completed-animation options; unfinished moves still show an honest incomplete notice rather than a slideshow.
- Validation passes: `28/28` Grave Furrow asset/history tests, `37/37` current-state tests, focused TypeScript completed-motion/deep-link suite, production build, JSON parsing, whitespace check, live `1280x720` browser playback, and all post-sandbox-lock Engine V2 tests. The broad Engine V2 suite still reaches the pre-existing untracked `swahiliSandboxSimulation.ts` hash mismatch (`A78973E...` actual vs `9983530...` expected); that unrelated file and lock were not changed.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No Blender, runtime sprite mapping, combat timing/damage/input, approved Command Grab, roster, deployment, commit, push, or release state changed.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, sprite pipeline, animation-fluidity, special-move, image-generation, fighter-atlas, LAMUH fighting-game playtest QA, Obsidian Markdown, and Obsidian CLI guidance.
- Obsidian CLI remains unavailable, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-09-03-swahili-grave-furrow-complete-motion-v7.md`.

### What's Next

- Human-review Grave Furrow V7 at `1x` and `0.5x`. If the motion is accepted, keep gameplay/combat/runtime integration behind its separate approval gates. Continue converting the remaining special directions into real connected clips one move at a time; do not restore pose slideshows as completed animation.

## 2026-09-03 — Lamuh Ascend Step exact-identity rebuild

- Rejected the separately generated Ascend Step character bodies after the user identified that the avatar did not match the approved Idle stance. The rejected raw sheets and contact sheets remain preserved as history under the two Ascend Step review folders and `records/ascend-step-generated-avatar-v3.rejection.json`.
- Rebuilt Light/Medium from exact approved `idle`, `dash_forward`, and `standing_light` runtime frames. Rebuilt Heavy from the same approved body sources plus a body-free teleport frame. No generated avatar pixels, body rescaling, visual recentering, or body cutout processing remain in the active special frames.
- Generated and normalized only isolated cyan/white/gold VFX sheets for dash aura and Heavy charge/growth/blast, then composited those behind or in front of untouched approved body sprites. All body frames remain on the shared `2048 x 1536` canvas at fixed root `(768,1360)` and scale `1.0`; the entire silhouette is contained.
- Regenerated the Light/Medium and Heavy normalization reports, contact sheets, public frames, candidate hash locks, three Forge packages, and the 27-package first-playable manifest. Heavy remains `24/5/13`, switches behind legally without moving the victim, and deals one `84`-damage hit only on ticks `24-28`.
- Validation passed the full `npm run test:lamuh-legacy-v2` suite and Vite build after the identity rebuild; after the final test assertions were added, the Ascend Step and content tests still pass directly. A later full-wrapper rerun is currently blocked before the tests by unrelated concurrent TypeScript drift in `src/stage/attackFrameTracks.ts` (missing Swahili `special_forward_light` / `special_forward_medium` entries), which this Lamuh task did not edit. Forge compilation, legacy `game.js` hash lock `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`, and live sandbox execution pass. The local playtest is open at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`, scrolled to full-body arena framing with Ascend Step Heavy selected.
- Candidate-only boundary is unchanged: no promotion, deployment, merge, push, or PR occurred. Human motion/timing/combat approval remains open.

### What's Next

- Human-playtest Ascend Step Light, Medium, and Heavy at `1x` and `0.5x`, judging exact Idle identity continuity, dash readability, whole-body framing, arm opacity, Heavy pause/growth/blast impact, and neutral recovery. Stop at this family review gate before starting the next special.

## 2026-09-03 — Swahili four-move completed-motion runtime playtest and alpha cleanup

- Integrated the completed `16`-frame Forward Light V3, Forward Medium V3, Forward Heavy V3, and Grave Furrow V7 clips into Swahili's local Engine V2 arena playtest. Direct live buttons and real inputs are available; the animation player no longer substitutes direction-board slideshows for these four moves.
- Added candidate-only Forward Light (`D+U+J`, one hit) and Forward Medium (`D+U+K`, two hits) definitions. Preserved the existing Forward Heavy (`D+U+L`) and Grave Furrow (`W+L`) combat definitions exactly. Standalone `U` remains inert.
- Created `64` alpha-clean runtime copies under each move's `runtime_frames_alpha_clean_v1/` directory. Removed baked checker/matte pixels and bright neutral edge fringe while preserving the source frames, character identity, scythe, intentional gold attack effect, root, scale, and sequence order. Saved four dark-background contact sheets and a passing cleanup report.
- Added deterministic integration coverage for complete frame order, visible/registered hit-count parity, P1/P2 mirroring, rollback replay, U-alone isolation, preserved Heavy/Grave definitions, clean-source wiring, candidate/release gates, and the protected legacy hash. Updated the stale Grave Furrow preview expectation to match the user-requested local runtime integration.
- Focused integration tests, Grave Furrow preview regression, all four post-sandbox-lock suites, JSON validation, and the Vite production build pass. The broad `npm test` run reaches only the documented pre-existing untracked `swahiliSandboxSimulation.ts` approval-hash mismatch (`A78973E...` actual vs `9983530...` expected); this task did not edit that source or approval receipt.
- Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`. No Blender, roster promotion, deployment, release, commit, push, or PR occurred.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighter-atlas normalization, sprite pipeline, animation-fluidity, special-move, git-checkpoint, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-09-03-swahili-completed-motion-runtime-playtest-v1.md`.

### What's Next

- Human-playtest all four completed moves in the arena, especially Forward Medium's two distinct contacts and Grave Furrow's continuous running slash. If any white fringe or identity-only isolation problem remains in a specific frame, record the move and frame before changing combat or source art. Keep all four as local candidates until an explicit human approval decision.

## 2026-09-03 — Swahili completed-motion idle-style outline repair

- Tightened the source-preserving cleanup for all `64` runtime frames after the user identified a remaining thin white/gray outline. The revised normalizer performs up to eight exterior low-chroma neutral passes, stopping at Swahili's dark ink edge or saturated skin, copper, and gold colors.
- Added measured Idle parity to the cleanup report. The approved Idle exterior-neutral ratio is `0.057178`; the worst cleaned runtime frame is `0.043638`, and every frame passes at or below the Idle reference. Source frames, character identity, scythe, intended gold contact effects, root, scale, frame order, combat, and input routing remain unchanged.
- Regenerated all four dark contact sheets, visually reviewed them, refreshed the live arena with cache-busting query `alpha-clean-v3=1`, verified all `259/259` textures loaded with no load error, and left the playtest reset at `1x` with the special controls visible.
- Focused completed-motion integration tests and the Vite production build pass. No Blender, roster promotion, deployment, release, commit, push, or PR occurred. Obsidian CLI remains unavailable; the existing repo fallback handoff was updated.

### What's Next

- Human-playtest the four cleaned moves against the arena background. Treat any further issue as a named move/frame correction; do not broaden into combat or source-art redesign without new direction.

## 2026-09-03 — Swahili Down Light / Medium completed-motion playtest V3

- Recorded Forward Light V3, Forward Medium V3, Forward Heavy V3, and Grave Furrow V7 as acceptable for the current local playtest with explicit character-design polish debt; this is not final visual, release, or deployment approval.
- Built, normalized, alpha-cleaned, and integrated two new connected `16`-frame specials: Down Light `Stamped Shaft Check` and Down Medium `Hook / Ferrule Shove`. Down Light is one low hit; Down Medium is a deliberate two-contact low-hook-to-mid-shove process. Standalone `U` remains inert.
- Preserved Down Heavy `Grounded Verdict` exactly at `28/24/28`, `80` total ticks, and two hits. No Blender, roster promotion, deployment, release, commit, push, or PR occurred.
- Added direct playtest/review buttons and isolated `1x`/`0.5x` motion viewers. Both runtime sequences use alpha-clean frames; all `32` pass at or below the approved Idle exterior-neutral ratio, with no generated-grid spill or body crop in the reviewed contact sheets.
- Validation passes: eight focused Down Special V3 tests, all `27` special-review scenarios, TypeScript/Vite production build, protected Heavy contract, U-alone isolation, and protected legacy `game.js` hash `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- Applied NGA Engine V2, playable-character production, character visual consistency, sprite-sheet validation, fighting-game balance, fighter-atlas normalization, sprite pipeline, animation-fluidity, special-move, git-checkpoint, Obsidian Markdown, and Obsidian CLI guidance. Obsidian CLI remains unavailable, so central sync is not claimed. Repo fallback handoff: `.agent-sync-pending/2026-09-03-swahili-down-special-motion-v3.md`.

### What's Next

- Human-playtest Down Light with `S+U+J` and Down Medium with `S+U+K` at `1x` and `0.5x`. Judge silhouette/identity continuity, low-hook readability, two-hit rhythm, scythe rigidity, and recovery weight. Keep both as local candidates pending an explicit human decision, then proceed to the next special family.

## 2026-09-04 — Lamuh Ascend Step Medium targeted motion repair V3

- Replaced the illogical reused Air Heavy pose at frame `06` with a dedicated backward two-hand floor-reach connector. The active sixteen-frame sequence now reads: traveling slide contact, retraction/coil, backward reach, two-hand plant, hips-over-shoulders turn, one asymmetric rising-heel contact, authored leg gather/tuck, two-foot landing, compression, and Idle recovery.
- Preserved all legacy originals and superseded Medium variants. The active candidate uses seven exact approved slide/recovery frames and nine animation frames derived from six bounded missing-state sources at one locked scale; three in-betweens use rigid rotation only. No per-frame body scaling, purple outline, victim teleport, or renderer-owned gameplay movement was introduced.
- Added deterministic multi-segment root motion support and authored Medium travel: forward through the slide, then backward through the handspring, ending at a net forward offset. Candidate B is `48` ticks (`7/24/17`), with contacts at ticks `7` and `26`; the rising heel launches the standard-height Lamuh victim and the complete route registers exactly two hits for `66` scaled damage.
- Rebuilt the normalization report, numbered sheet, VFX-off sheet, silhouettes, root-path overlay, slide/coil/plant close-up, handspring/kick close-up, old-vs-repaired comparison, public review data, Forge packages, and compiled 27-package first-playable manifest.
- Validation passes: full `test:lamuh-legacy-v2`, TypeScript/Vite production build, and the complete Lamuh browser smoke. Browser evidence includes both contacts and the authored `post_contact_leg_gather` pose. Protected `NO_GODS_ABOVE/game.js` remains SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.
- The localhost sandbox is running at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`, open in the in-app browser at full-body framing with Ascend Step Medium available at `1x` and `0.5x`.
- Candidate boundary remains intact: no art promotion, deployment, merge, push, or PR occurred. Status is `awaiting_human_ascend_step_medium_targeted_motion_repair_review`.

### What's Next

- Human-review Ascend Step Medium primarily at `1x`, focusing on frame `06` continuity, backward handspring direction, one-heel launcher clarity, body scale/identity, post-contact tuck, landing, and overall flow. Do not advance to the next special until this scoped gate receives a decision.

## 2026-09-07 — Forward family motion and congruent aura candidates (Codex)
- User requested cleaner forward specials and aura matching newer moves. Added separate `forward-light-clean-v2`, `forward-medium-connectors-v4`, and `ascend-heavy-clean-v2` source/public candidates. Flowing cyan-white-gold aura is baked in, adult identity retained, old sources preserved.
- Sandbox loads `forward-clean-v1/manifest.json` only for forward L/M/H; Divine Vanish unchanged, including shared old Heavy sources. Quick forward buttons added. Timings remain 20/48/42 ticks; contacts 5, 7/26, 24. No core changes or production approval.
- Passed TypeScript/Vite build, forward family core checks, Heavy source/alpha tests, Divine counter and Medium V4 regression checks. Unified builder verifies all source hashes and B contact timing. Browser verified loaded 260 frames, new Light one-hit32 damage and Heavy blast/full-body presentation.
- Human motion review pending. Heavy retains brief older disappearance streak and repeated dash pose as explicit polish debt. Comparison route remains historical; current rebuilt art is in sandbox and new numbered sheets. Central vault sync pending; local handoff preserved.
