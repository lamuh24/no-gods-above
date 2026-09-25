# Lamuh V2 — special-family review checkpoint

Local branch: `codex/lamuh-legacy-v2-rebuild-v1`. Candidate packaging remains nondeployable. No push, commit, merge, PR, deployment, roster promotion or legacy `game.js` change.

## Human decisions

- Forward Ascend Step L/M/H: user said “mark the forward specials and move onto the next set”. Scoped pass-for-now, starred for polish. Exact frame/B-profile receipt: `records/forward-special-family-v1.approval.json`. Medium heel/contact height and support/landing continuity remain debt.
- Neutral Celestial Palm L/M/H: user said “passes now move onto the next moveset”. `APPROVED_AS_PRODUCTION_BASELINE` is scoped to the shown current-review family, not final combat balance, the whole fighter, roster or art promotion. Exact22 frame references and three B profiles: `records/celestial-palm-v1.approval.json`.
- Heaven Splitter: user said “passes onto the next moveset” after the Heavy V4 surrounding-aura redraw. `APPROVED_AS_PRODUCTION_BASELINE` is scoped to the shown L/M/H family, its exact36 frame references and B/combat snapshots in `records/heaven-splitter-v4.approval.json`. Earlier rejected Heavy versions remain preserved; this is not whole-character, final-balance or art/roster promotion.
- Radiant Dive: next pending family. User additionally requested Heavy aura in the animation like Heaven. Twelve new adult airborne poses, Heavy baked aura, and reused approved landing/idle frames are candidates; no approval is inferred from Heaven's pass. See [Radiant source/design audit](RADIANT_DIVE_REVIEW_2026-09-05.md).

## Current authored special coverage

| Family | Input | L / M / H total ticks | Job |
|---|---|---|---|
| Ascend Step | Forward + Special + L/M/H |20 /48 /42|Approach; slide/handspring conversion; behind-switch blast|
| Celestial Palm | Neutral Special + L/M/H |28 /40 /56|One detached descending ki projectile; range check with recovery|
| Heaven Splitter | Up + Special + L/M/H |36 /43 /53|One short-range anti-air uppercut; low/medium/high hop|
| Radiant Dive | Airborne Special + L/M/H |Variable flight +10 /14 /20 landing|One descending palm; shallow/diagonal/steep approach; Heavy aura embedded in art|

The clock is60Hz, not a universal move length. B is gameplay-aligned; A/C are visual alternatives. Radiant's B comparison is an explicitly labeled height180 no-hit simulation sample, not a fixed runtime landing tick. Existing normals, throws and accepted movement are unchanged. Divine Vanish and ultimate remain unimplemented proposals, not filled slots.

Palm projectiles have separate swept collision, capture owner/facing/instance on release, persist after interruption, and hit at most once. L/M close shots can be ducked; H reaches crouch; timed jumps avoid midrange shots. The attacker's later action is not frozen/cancel-enabled by detached impact. Projectile state and event ledgers participate in replay/checksum.

Heaven S/A/R is7/4/25,10/5/28,14/6/33. Damage44/62/80; hitstop5/7/9; launch velocity−7/−10/−12. Authored hops take off/apex/land at7/14/24,10/20/33,14/26/43 with heights16/40/64. Forward travel8/14/20. No invulnerability, extra hits, air-action refund or normal-cancel route was added. Standing block, crouch duck and whiff punishment remain available. Interrupted hops hand off current position/velocity to physics rather than teleport to ground.

## Motion and rendering

Legacy Heaven row2 remains seven protected448px poses. Preserve its coil→uppercut→rise→gather→catch arc, not its two shrinking ascent drawings or detached sandal fragment. The new V2 action explicitly uses one near arm; it is a modernization, not a claim of exact far-arm artwork reuse.

Light/Medium use11 active poses with approved idle endpoints. Heavy V2 uses14 poses with separately authored wind-back, compressed coil, rising-fist connector, full extension, guarded gather and two-foot catch. Heavy body sources are distinct from Light/Medium except the exact idle endpoints. Its53-tick gameplay, damage and hop were not lengthened or buffed for the cinematic repair.

All source frames are2048×1536 RGBA with fixed root768,1360 and .30 presentation scale. Air poses use hand-audited pelvis registration to virtual ground; pose compression is not normalized away. The larger Heavy release source uses one documented0.8 source-camera correction, not individual frame-height scaling. Anatomical/support registration still needs human motion judgment.

Heavy cinematic presentation is separate: short preparation vignette/framing, a surrounding cyan/gold rising aura behind the intact body, one confirmed-hit shock ring and a deterministic5-frame camera impulse of at most6px. The user explicitly requested aura around the uppercut. No zoom, body resizing, victim choreography/teleport, extra damage or cinematic control lock. Block/whiff cannot trigger the hit camera. The VFX checkbox disables it. Down Heavy's rejected decorative VFX remains disabled.

### Historical Heavy aura V3 anchor audit (superseded by V4 below)

- Latest user decision: “make the aura apart of the animation itself”. V3 supersedes the procedural aura checkpoint. The aura is now pixels inside individual animation source frames, not a separately animated runtime overlay.
- Move: `legacy_heaven_splitter_heavy`; editable authoring source: `src/lamuhlegacy/heavenSplitter.ts`. Deterministic exporter: `scripts/bake_lamuh_heaven_heavy_aura_v3.js`. It rasterizes existing native artwork, so no new image generation or character redraw was needed for this request. Classification: candidate `KEEP`, pending human readability review.
- Source: `content-source/characters/lamuh-legacy-v2/heaven-heavy-aura-frames-v3/`, with separate aura-only layers and body-only originals retained. Active interior frames use `/lamuh-legacy-v2/heaven-heavy-aura-v3/`; exact approved idle endpoints stay unchanged. Source report: `tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1/heavy-authored-aura-v3.report.json` from repository root.
- Anchor: current actor screen root; fist crown centered at local `(39,-287)`, radius26. Actor root follows simulation hop and forward travel; `attackFacing` mirrors all local x coordinates. It is not world-anchored or detached.
- Scale: fixed local screen-pixel envelope relative to the `.30` body draw. No body scale changes. Maximum aura reach324px above root; authored flame tip332px above root.
- Pose clock: aura source cels3/4 are charge and connector (ticks9–13); cels5/6 are full uppercut and extension (14–26); cel7 is the apex fade (27–29); absent from cel8 onward before tucked descent/landing. B exposures remain `[2,3,4,3,2,6,7,3,5,8,4,3,2,1]`. Aura and body advance/hold together, including hitstop and A/C comparison holds. No wall clock, random particles, collision or additional event/hit.
- Alpha envelope0–1 is sampled into the authored source cels, with translucent cyan fill/glow, cyan rim and gold accents. The exporter composites the unchanged body above the aura and verifies every fully opaque body pixel: zero changed. No global yellow overlay. The crown/outer trails emphasize one rise, not multiple impacts.
- Runtime and comparison draw the same composite PNG. The VFX toggle selects retained body-only PNGs; neither route draws a second aura overlay. The Heavy Forge `presentationTrack` has no aura spawn. Only actual sandbox contact can trigger separate hit feedback/camera.

Two critic-localized enclosed pale hair gaps were removed only in extracted windup2 `(95..118,189..203)` and release0 `(281..315,261..272)`, bright-neutral pixels only. Raw sources remain intact. No global interior-white removal was used; sleeves, coat and face were rechecked independently.

## Collision and production boundaries

The old Lamuh fixture's normal hurtboxes are waist-high relative to adult art. Palm uses a Lamuh-only projectile defensive profile; Heaven uses an explicit extended-profile query for itself and its target. The new narrow Heaven strike covers the visible fist/forearm plus small ki crescent, not a screen-sized box. Legacy normals/other fighters are untouched. A separate normal-hurtbox alignment pass is still debt.

Forge: original27 first-playable packages retained, with additive Palm3, Heaven3 and reaction5 bundles. `combat-track.schema.json` and the validator now describe detached projectile tracks and authored self-motion. Compiled artifacts are candidate/nondeployable; approved individual sources and metadata remain truth.

## Evidence and next gate

- Source and normalization: `tools/nga-forge/review/lamuh-legacy-v2-celestial-palm-v1/` and `tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1/` from repository root. Raw imagegen outputs and fallback art preserved. Prompts were issued with built-in imagegen, followed by deterministic normalization, not CLI/API fallback.
- Pixel integrity: forward/Palm scoped receipts, protected V1 lock and185-frame existing-art lock. New Heaven hashes in `records/heaven-splitter-v1.hash-lock.json`.
- Core/content tests: Palm12 groups, Heaven9 groups, Palm/Heaven content suites including31 projectile and24 self-motion invalid-contract cases; Heavy presentation test; existing Lamuh closure and quality regression.
- Browser: `engine_v2/artifacts/lamuh-heaven-splitter-v1/` holds the runtime counterplay/mirror/whole-composite checks and native canvas1×/.5× recordings. The previous procedural result is preserved under `procedural-aura-checkpoint/`, not evidence for V3. Composite alpha bounds include aura; they prove canvas containment, not anatomical body-scale consistency. Re-run final matrix after any Heavy PNG change.

Final V3 technical result: `browser-report.json`, version `authored-aura-v3`, passed30 outcome cases,3 actual keyboard chords,12 corner paths, compact viewport and1×/.5× recordings, with zero browser errors/failures. Actual draw-source tracing proves sandbox and comparison use `heavy-aura-05.png`, with no second procedural aura; VFX-off uses clean `heavy-release-02.png` without simulation mutation. Twelve active interior composite/body source pairs have matching hashes and zero changed opaque body pixels; only cels3–7 contain aura outside the body. A faint charge-glow cutoff was removed before this final run by exporting complete radial support. Build, Heaven9 deterministic groups, content/Heavy presentation and existing16 closure regressions pass. These technical results do not grant human motion/production approval.

Review Heavy at1× first: does its coil, extension, impact and landing feel distinct and stronger than Light/Medium without becoming slow or chibi? Then inspect .5× and the numbered active sheet for arm continuity, scale, complete alpha, coat/loc follow-through and neutral return. Stop here for human approval before another family or promotion.

Applied: NGA Engine V2 preservation/validation, playable-character production, character visual consistency, sprite-sheet validation, VFX integration audit, fighting-game balance pass, Character Sprite Pipeline, Animation Fluidity Standard, Special Move Standard, fighter-atlas normalization and built-in imagegen. The individual-frame V2 contract supersedes the older fixed6×5 atlas convention. The ultimate skill was inspected but not applied: this is a special presentation repair, not an ultimate or victim-lock system. Independent Gauntlet core/content/browser and visual critics were used; no persistent role graph changed.

## Latest request — proper surrounding aura redraw V4

Exact user request: “redo the spritesheet with the proper surrounding aura”. V4 replaces the V3 vector-derived aura target with six genuinely redrawn release poses. Curved cyan/white flame tongues with restrained gold edges wrap the legs, torso and near striking arm, peak through the single uppercut and extension, contract at the apex, and die during the gather. This is source artwork, not a procedural runtime overlay.

Source and exact prompts: `tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4/` from repository root. The original redraw and matte-only follow-up are preserved and hash-locked. Built-in imagegen supplied the actual edits. A near-magenta unmix creates real alpha while retaining pale aura cores and white sleeves; no neutral-white key. Audited source cuts at x0/490/890/1448 and y0/500/1086 avoid intersecting the aura. Crop-origin compensation retains the original absolute registrations and one2.490272376 source-camera scale; no per-pose rescaling.

Only Heavy active slots3–8 change artwork. Eight other slots retain the previous body/idle frames. All14 have fixed canvas2048×1536/root768,1360. B exposures remain `[2,3,4,3,2,6,7,3,5,8,4,3,2,1]`:53 ticks, contact index5 at tick14, one hit,80 damage. Aura is source-bound at ticks9–34, absent from landing approach at35; body/aura freeze together on hitstop and mirror together. No new hitboxes, mechanics, inputs, movement or L/M changes. Forge has no Heavy aura spawn event.

Current body-pixel preservation is **not** claimed: this is an art redraw, unlike V3. VFX-off and silhouette mode deliberately compare previous clean poses, not a pixel-exact extraction of the new body; UI and metadata state that boundary. Composite bounds contain energy and are not anatomical measurements. V3 raw/body/overlay/export artifacts remain history, and the rejected-aura request receipt preserves the previous closure. Nothing is promoted.

V4 source technical checks and independent static review pass: six real-alpha outputs, zero retained magenta, no canvas-edge contact, preserved complete sleeves/coat/fists/sandals/locs, no visible matte pockets or neighbor fragments, one near-arm strike and connected14-pose recovery. TypeScript/Vite build, Heaven9 deterministic groups +4 content/Forge groups, Heavy6 presentation groups, Palm4 preserved-source/content groups,16-group closure, quality72 contact scenarios and5 cancel regressions pass. V3 browser results above are historical, not V4 evidence.

Fresh V4 browser result: `engine_v2/artifacts/lamuh-heaven-splitter-v1/browser-report.json`, version `authored-aura-redraw-v4`, PASS30/30 outcome cases,2280 center tick samples,3 real keyboard chords,12 corner paths,760×720 compact viewport and36 served frame hashes; zero browser errors/failures. Actual runtime/comparison tracing sees `heaven-heavy-aura-redraw-v4/release-02.png`, no procedural double overlay. VFX-off selects the previous clean pose without simulation mutation; all14 fallback slots verified. L/M records and all B profiles are frozen against the preserved V3 checkpoint. Native1×/.5× canvas recordings cover every11 L/M and14 H frame, hop peaks and one-hit recovery. Fresh P1/P2 contact/apex screenshots were directly inspected: complete opaque body/coat/limbs, no material matte artifacts, full surrounding-aura framing. Composite bounds still do not prove anatomy. V3's163 prior artifacts/script/source metadata are retained under `authored-aura-v3-checkpoint/`. Human feel/production approval remains pending.

Applied this repair: NGA Engine V2 preservation/validation, built-in imagegen, fighter-atlas factory normalization, playable-character production, visual consistency, sprite-sheet validation, VFX audit, Character Sprite Pipeline and Animation Fluidity Standard. Independent static and runtime/content critics inspect the actual candidate. Human motion approval remains the next gate.
