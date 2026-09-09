# Radiant Dive: next-family design and source audit

Date: 2026-09-05. State: design/audit candidate, not a combat or art approval.

Scope: Lamuh Legacy V2 only. The parent task records the user's Heaven pass and its exact receipt. This audit does not change that receipt, any approval gate, accepted Forward/Palm/Heaven data or frames, other fighters, the public roster, or deployment state. No protected V1 file was changed.

## Selection

Radiant Dive is the next useful family. It adds a committed air-to-ground approach to the present ground-entry, projectile, and anti-air families. Divine Vanish remains a later defensive movement family: its protected implementation is a zero-damage retreat, not a damaging teleport, parry, or automatic side switch. Another side-switch attack would overlap Ascend Step Heavy rather than fill the actual airborne-special gap.

The selected modern action is one descending near-arm open-palm strike. Keep the same striking arm through chamber, acceleration, contact, follow-through, and recovery. The protected Dive row's late side kick is retired from the new active sequence, not converted into a second registered hit. Keep all seven old poses available as historical comparison.

## Verified protected-runtime facts

These are facts about the protected current `NO_GODS_ABOVE/game.js`, not a claim that every older V1 exposure or physics sample is recoverable. The source audit explicitly has `historicalV1Combat: null` for both moves and no frame-indexed collision/root track.

| Protected Legacy move | P1 phases, nominal total | P1 contact | P2 differences | Source art |
| --- | --- | --- | --- | --- |
| Divine Vanish / `back_special` | 2 startup / 0 active / 13 recovery, 15 frames | 0 damage; `noHit`; zero-sized `mirrorSlip` hitbox | 3/0/15, 18 total; retreat speed 850 instead of 930 units/second | Specials row 3, six poses; purple phase/afterimage and horizontal smear |
| Radiant Dive / `air_special` | 5 startup / 6 active / 18 recovery, 29 frames | 58 damage; hitstun 30; derived blockstun 17; knockback X 78 / Y +90; soft knockdown; one hit | 6/6/20, 32 total; damage 52; hitstun 28; blockstun 16; knockback X 78 / Y +82 | Specials row 4, seven poses; descending hand strike, gather, then disconnected late kick |

Source anchors (line numbers at this audit):

- `game.js:1231-1251` and `1260-1279`: Legacy clones `back_light_special` and `air_medium_special`, renames their animation aliases, and drops unrelated modern moves.
- `game.js:1144`, `1181`: Divine Vanish's underlying `mirrorSlip` definitions. `shadowStepAway: true` means retreat; it does not use the target-relative branch of the helper.
- `game.js:1154`, `1191`: Radiant Dive's P1/P2 `airDashStrike` definitions. Neither has `multiHit`, a projectile, invulnerability, a launcher, or authored victim motion. `meter: 13` on P1 is a legacy flag, not a verified V2 resource-cost requirement.
- `game.js:1344`, `1355`: `mirrorSlip` is a zero box. Dive's generic box is width 136, height 74, X offset 54, Y offset -92. At right-facing root `(x,y)` it covers `[x+54,x+190]` and `[y-92,y-18]`; facing left mirrors X. This is not a measured new palm socket or a per-pose V2 collision prescription.
- `game.js:2914-2915`: attack metadata parameters and default blockstun calculation `max(8, round(hitstun * .58))`.
- `game.js:7827-7838`, `8197-8218`: Vanish imposes reverse-facing X speed 930/850 during the first 0.22 seconds. Dive imposes forward X speed 560/520 and a downward minimum Y speed 260/230 during the same early interval. These are legacy per-second velocities, not V2 per-tick values; normal frame integration/gravity also applies. Do not copy the numeric values directly into V2.
- `game.js:7856-7862`: the non-multihit path uses `hasHit`, giving one successful contact per move instance.
- `game.js:9601-9614`: generic active-time test and facing-aware, root-relative axis-aligned hitbox.
- `game.js:9188-9206`: generic landing sets the body grounded, but ordinary landing recovery is only added when no action is active. The old Dive does not expose a dedicated authored landing contract.
- `game.js:13081-13095`: any airborne Legacy special chord selects the single `air_special`, independent of direction/strength. Grounded back selects `back_special`.
- `content-source/characters/lamuh-legacy-v2/source-audit.v1.json:1021-1098`: six/seven source poses, legacy 8 FPS loop evidence, modern protected move-level metadata, and unrecoverable frame-specific combat/exposure caveats.

Protected `game.js` SHA-256 observed during this audit: `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.

The actual protected atlas was inspected at `public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png`. Divine Vanish's purple effect is deliberate move identity, distinct from obsolete purple outlines. Its later rebuild must not silently substitute Palm/Heaven cyan-gold energy. Radiant's first descending hand-contact passage is the usable motion reference; the later separate side kick does not justify an extra hit.

## Verified V2 seams before the Dive implementation

The following observations are a **pre-Dive baseline**, not claims about the later patch:

1. `src/core/engine.ts:197-221` gates authored Lamuh specials to grounded input. The later generic airborne Special+Heavy route requests `air_special_ender`. That definition (`src/data/fighters.ts:93`) is cancel-only/system-test-only; it is not a completed Lamuh special.
2. A read-only probe of the compiled baseline, starting an airborne Lamuh in `jump` at Y -100 with five air actions, produced Special+L -> `air_light`, Special+M -> `air_medium`, Special+H -> no attack (`jump`). H is rejected as a neutral start by the ender's `cancelOnly` requirement. Thus the unused ender must not be mislabeled existing Dive coverage.
3. `src/lamuhlegacy/sandbox.ts:119` removes `special` from airborne held input. The UI owner must explicitly preserve the modifier for the new family; adding core IDs alone does not make real keyboard play work.
4. `engine.ts:97-119` supports `airOnly` and air-action cost, captures `attackFacing`, and gives Lamuh cancels a new move-local clock. `537-557` currently blocks input during air dash, but allows a neutral airborne attack during `jump`. Preserve these existing movement rules unless a separate cancellation policy is explicitly selected.
5. `engine.ts:673-689` clears an air-only attack on landing and enters ordinary landing recovery. A probe starting j.M at Y -2/VY +3 landed in the same tick, removed the attack, and received only seven recovery ticks. A Dive must not use this as a free early-recovery shortcut.
6. `engine.ts:653-669`'s existing `authoredHop` is relative to the stage ground. It is correct for grounded Heaven Splitter, but would snap a Dive started at arbitrary airborne height. Use current-position-relative deterministic descent instead; do not reuse the ground-relative hop.
7. `engine.ts:833-845` uses the move instance/hitbox ledger, captured attack facing, and a shared hit snapshot. Reuse that one-contact resolution. No renderer collision, target teleport, late kick hitbox, or new projectile is required.
8. V2 only has `mid`, `low`, and `launcher` hit levels. A `mid` Dive can be guarded standing or crouching when it intersects. Calling it an unblockable/overhead without adding and independently reviewing an explicit guard rule would be false. Do not expand guard rules during this family by accident.
9. Existing normal hurtboxes are shorter than the modern body. Heaven's opt-in `hurtboxProfile`/`targetHurtboxProfile: "extended"` provides an isolated adult-height profile. Reuse only after new hand/body alignment is checked; do not globally enlarge old normal hurtboxes to make an oversized Dive work.

## Candidate family and safe deterministic contract

The core owner reported the following implementation candidate selected with the parent task. The ready core was then inspected and tested independently as recorded below. These are **new V2 candidate values**, not protected legacy values or final balance approval.

| Candidate | Distinct job | Body/trajectory read | Commitment/reward |
| --- | --- | --- | --- |
| Light | Shallow forward descent check | Compact airborne chamber; fastest forward/slowest downward strike vector; one near-hand contact; quick guarded catch | Least damage and shortest exposed landing recovery; trades steeper interception for forward reach |
| Medium | Diagonal air-to-ground interception | Steeper, slower-forward diagonal with a fuller torso extension and trailing coat; same single descending hand | Midrange angle, damage and recovery; not falsely described as longer-forward than Light |
| Heavy | Committed steep air-to-ground ender | Clear longer coil; steeper plunging body line; one stronger near-hand contact; deep two-foot landing compression | Highest commitment and longest punishable recovery; one stronger knockdown, no extra kick, bounce, cinematic lock, or victim puppet track |

| Candidate value | Light | Medium | Heavy |
| --- | ---: | ---: | ---: |
| Startup / maximum active ticks | 7 / 10 | 10 / 10 | 14 / 12 |
| Actual-ground-contact recovery ticks | 10 | 14 | 20 |
| Minimum entry height | 32 | 44 | 60 |
| Strike velocity X / Y, world units per tick | 7 / 5 | 5 / 8 | 3 / 12 |
| Non-damaging gather velocity X / Y | 2 / 5 | 1 / 8 | 0.5 / 12 |
| Damage / hitstop | 40 / 5 | 58 / 7 | 76 / 9 |
| Base hitstun metadata / blockstun | 18 / 11 | 24 / 14 | 28 / 17 |
| Knockdown | None | None | Soft |

All candidates use facing-relative X, downward-positive Y, windup velocity `(0.8, 0.5)`, two air-action cost, one-use-per-airtime, and an explicit 180-unit maximum entry height measured from actual `stage.groundY`. This ceiling matches the present stage; it does not automatically expand if a future stage is taller. Heavy's soft knockdown uses the existing knockdown lifecycle instead of applying its 28 base hitstun as ordinary reaction stun.

The implemented descent uses bounded constant-velocity stages, not gravity-driven normal jump motion or a normalized absolute Y path. Runtime air duration depends on actual entry height; nominal startup/active metadata does not dictate ground-arrival time. `dive_landing` keeps attack identity for presentation while its reset `phaseTick` counts landing only. `currentAuthoredDive(fighter, state)` exposes `windup`, `strike`, `gather`, or `landing`, stage-local tick, remaining landing ticks, and conservative bounded air ticks. Its `moveTick` is deliberately null during landing; a renderer must not treat the landing clock as a restarted damaging flight sequence.

Recommended implementation shape:

- Separate Lamuh-only `legacy_radiant_dive_light/medium/heavy` attack IDs, `airOnly`, and an explicit descent descriptor. Intercept airborne Special+L/M/H before the generic ender and ordinary air-normal routes. Retain all grounded Forward/Palm/Heaven priorities and values.
- Require a minimum legal height and available air-action budget. Reject a failed Dive chord without falling through to an ordinary attack. Simultaneous or modifier-first input selects Dive. A strength button pressed on an earlier simulation tick has already started j.L/M/H and is not silently replaced by a later modifier; this is the verified input-order boundary, not arbitrary button-first leniency.
- Capture facing and move instance once. Apply the authored windup/strike/gather velocities from the fighter's current position, with positive Y directed downward. Do not teleport to a standard height, auto-aim toward a victim, normalize every jump to the same path, or move the opponent.
- Explicitly choose whether descent uses a one-time velocity impulse plus ordinary gravity or a bounded constant-velocity segment. Preserve old jump/air-dash physics outside the new move. Declare the chosen rule in data and tests, rather than allowing a renderer to bend the path to the sprite.
- Allow at most one damaging hand hit per move instance. Keep the hitbox near the authored hand, not the entire energy trail. Use collision-triggered impact feedback; whiff gets only motion energy. No invulnerability, armor, automatic counter, OTG, homing, or extra ground shockwave damage is implied.
- Limit repetition per airtime (an explicit consumed-air-special state is safer than allowing recovery/cancel refunds to reset the restriction). Restore eligibility on the intended actual jump/ground lifecycle, not on art transitions or Roman Cancel. Any new state that affects movement, eligibility, or landing must be included in snapshots/checksums/replay.
- On real ground arrival, end damaging collision and enter the correct grounded compression/recovery sequence with an explicit move-specific recovery duration. Do not erase this commitment through the ordinary seven-tick landing path. Do not play a grounded landing pose while the fighter is still airborne.
- Keep a finite flight/attack cap. A high whiff can transition to ordinary falling recovery with the landing obligation retained; it must not loop an attack forever. An interrupted Dive drops its authored motion and follows ordinary hit physics, without a lingering damage box or a forced landing pose.
- Hitstop must freeze the attacking body, move phase, descent state, and landing clock together. Stage boundaries clamp the real body/root. Test the ground-crossing frame explicitly: integration currently precedes hit collection, so either choose a documented pre-ground contact policy or intentionally expire the attack before landing; do not silently lose/duplicate an impact.
- Use one identical authored candidate definition for P1 and P2. The protected game's AI-side numerical asymmetry is evidence, not a requirement for V2 mirrored parity.

## Forge / variable-landing contract needs

An air-start move cannot truthfully advertise one fixed landing tick for every initial height, momentum, and hitstop outcome. A fixed `simulationLength` may describe a bounded nominal flight/body sequence, but is not an absolute runtime arrival schedule.

The additive package should explicitly represent:

- simulation ownership, air-only eligibility, minimum height, per-airtime use rule, captured facing, departure trigger, velocity/gravity policy, and finite flight bound;
- the one hitbox window/ledger rule and the exact early-landing cutoff policy;
- a **state-driven real-ground-contact transition**, with separate landing compression/recovery exposures and an explicit minimum commitment;
- interruption behavior, hitstop-freeze semantics, and no refund of used air-special eligibility through visual transitions;
- root/anchor coordinates as source-canvas registration, not proof that an airborne sandal is planted;
- fixed art scale, no per-pose height normalization, and honest source-frame/hash provenance;
- pending human approval, candidate-only/nondeployable status, and no copied Palm/Heaven approval receipt.

Do not force the existing grounded `selfMotionTrack.hop` or fake a static root path to make the validator pass. Add a narrow validated descent/landing schema or explicitly document an unsupported runtime contract boundary. Reject malformed descriptors: non-finite velocities, upward-only descent, invalid phase ordering, unbounded duration, missing landing recovery, renderer-owned trajectory, multiple damaging contacts, or an airborne root snap.

## Required independent review

- Real Special+L/M/H keyboard input while airborne, modifier-first and button-first, both facings and both players; grounded and too-low rejection; exhausted-budget/second-use rejection; held-input no repeat.
- Standing block, crouch block, anti-air interruption during startup/descent, midair target, short dummy, grounded hit, high/low/far whiff, both walls, landing during startup/active/recovery, no OTG, and no second late-kick contact.
- Full/half-speed playback: jump -> chamber -> descending same-arm hand -> follow-through/gather -> actual two-foot landing -> recover. Preserve adult identity, coat/loc flow, whole-body framing, and fixed anatomical scale.
- Hitstop on the last airborne frame; land tick and recovery tick accounting; no damage after clear/interruption/landing; snapshots, checksum mutation sensitivity, P1/P2 update-order parity, and deterministic replay.
- Forward/Palm/Heaven data/art hash locks, nine normals, one-hit j.L/j.M, two-hit Ascend M, ordinary jump/air-dash behavior, and other-fighter behavior remain unchanged.

## Independent ready-core review

Inspected `src/core/types.ts`, `src/core/engine.ts`, `src/core/checksum.ts`, `src/data/fighters.ts`, and `tests/lamuh_radiant_dive.test.js` after the core owner's READY signal. Ran the authored regression directly: **all nine groups passed**. This is local deterministic simulation evidence, not visual, balance, or production approval.

Verified behavior:

- `engine.ts:97-125`: entry height is relative to actual stage ground; cost and once-per-airtime gate apply before an instance starts. Entry consumes air-dash availability and cancels inherited air-tech invulnerability. Failed chords do not leak to generic copied moves.
- `engine.ts:129-140`, `650-708`: actual position-relative descent, finite legal-entry flight bound, ground-contact-driven landing, and 10/14/20 dedicated recovery. Landing begins at tick zero, retains the attack identity only for pose selection, forbids guard and action escape, and clears the identity on completion.
- `engine.ts:891-902`: only `attack` phase can hit. Integration ends collision before a ground-crossing tick is resolved; the landing pose itself never damages. There is one hitbox and one ledger contact, not one hit per visible active pose.
- Interruption clears authored attack motion and returns to ordinary gravity without a forced floor snap. Paid Roman Cancel retains the used-Dive flag and refunds no Dive air action; it remains available only under the existing hit/block confirmation and resource rules.
- The authored suite checks 24 mirrored hit/standing-block/crouching-block/whiff cases; trajectory/mirror/corner/order parity; real jump-to-Dive replay; snapshots and used-state checksum sensitivity; early-floor commitment; hitstop; interruption; input and height gates; exact old Lamuh/prototype/dummy data hashes and protected V1 source hash.

Extra independent probes, beyond that suite, passed for all three strengths:

- Ground moved to `groundY = 50`, ceiling -130: entry remained relative to current position and landed at Y 50 without a root snap.
- Three injected hitstop ticks during `dive_landing`: no landing-clock or remaining-recovery decrement.
- An actual enemy 5L active hit during landing, while Dive owner held block/back/throw/jump/special: the landing was punishable, took one 24-damage hit, and lost its retained attack identity. A Boolean guard assertion alone was not treated as proof.
- A grounded knockdown victim held through the full Dive: zero hits, confirming no OTG contact.

Measured uninterrupted distant-whiff landing times (ticks elapsed from the input, excluding hitstop):

| Strength | Minimum legal height -> floor | Height 120 -> floor | Height 180 -> floor | Conservative air bound | Additional grounded recovery |
| --- | ---: | ---: | ---: | ---: | ---: |
| Light | 32 -> 12 | 30 | 42 | 43 | 10 |
| Medium | 44 -> 14 | 24 | 31 | 33 | 14 |
| Heavy | 60 -> 18 | 23 | 28 | 29 | 20 |

These measurements intentionally do not claim one universal total-duration clip. The initial provisional Light box `(18,-115,64,58)` could not reach a standing target from height 180 before its active window expired. That observation is **superseded**, not an intended balance rule: final source-hand measurements place the open palm much lower. With the final palm-aligned boxes, an independent height-180/gap-100 probe records exactly one hit for each L/M/H, dealing 40/58/76. Do not retain a stale whiff claim or move the visible hand to preserve an unmeasured prototype rectangle.

One checksum-completeness defect was reproduced and sent to the core owner: during Dive startup at `phaseTick = 1`, changing `currentMoveInstance` and `moveInstanceCounter` from 1 to 101 produced the same checksum, because the existing body-move projection strips these counters until the first presentation event. At Light's first active tick, event IDs diverged (`local-1:6:p1:1:0` versus `local-1:6:p1:101:0`) and checksums then diverged. The owner added a narrow `diveSources` projection. **Independent repair recheck passed:** changing each counter separately changes the startup checksum for every L/M/H variant (six mutation cases); the untouched seed-901 twenty-tick fixture retains checksum `366de6d2`. No core/checksum file was edited by this audit owner.

Final ready-core refinement: the parent selected an explicit `landingApproachHeight` of 10/16/24 to enter non-damaging gather before actual floor contact at low entry heights. The pre-integration projected strike height triggers this transition, `airDiveGatherStartTick` owns the gather clock, and collision retires immediately. **The final ready core passed ten groups and Forge passed four groups independently.** High-entry floor arrival remains 42/31/28 ticks; the real post-tick height-180 comparison includes first idle completion and therefore lasts 52/45/48 ticks, with seven-frame holds `[4,2,10,25,4,4,3]`, `[5,4,10,11,6,6,3]`, and `[8,5,12,2,8,8,5]`. Those samples remain separate from conservative Forge envelopes 53/47/49.

A fresh compile also exposed two pre-existing inherited Swahili hitbox-name differences between older `dist` output and current source (`hook_ferrule_low_hook`/`hook_ferrule_shove` versus `crossdraw_low_shot`/`crossdraw_mid_shot`). The parent directed preservation of current source. The final regression explicitly canonicalizes only those two named compatibility differences for the old-definition hash comparison; it does not loosen move values or accepted Lamuh family checks. Scoped Heaven content/presentation regressions were rerun after this fresh build and passed all four plus six groups.

Final source-palm registration and collision are now frozen for this candidate:

| Strength | Manual normalized palm center | Corresponding world center at `.30 / 1.3` | Final root-relative hit rectangle |
| --- | --- | --- | --- |
| Light | (1056,1189) | (66.46,-39.46) | (40,-62,54,46) |
| Medium | (1045,1220) | (63.92,-32.31) | (38,-55,54,46) |
| Heavy | (946,1354) | (41.08,-1.38) | (14,-28,54,50) |

The final lower-hand core passed all ten groups again, and the additive Forge validator passed four groups. The contact rectangles contain those source-palm centers; this does not claim perfect per-pose anatomy, collision fairness at every distance, or human motion approval.

## Additive package closeout

The final twelve-frame report was explicitly released by the art owner with `sourceArtStatus: candidate_ready_for_human_review`. Its corrected Heavy connector comes from `raw-heavy-connector-single-v5.png`, separate from `raw-heavy-aura-v3.png`; both have independent raw SHA receipts in provenance and the hash lock. The connector's 1448x1086 render is restored to the 2048x1536 reference canvas at exact 4:3 resolution, not independently scaled to its silhouette. Manual palm-center methodology is recorded verbatim from normalization metadata.

`scripts/build_lamuh_radiant_dive_v1.js` built and passed `--check`. It verifies final readiness, all raw source hashes, normalized source/public PNG hashes, RGBA/canvas/root, and palm containment before publishing the family. It creates three candidate-only Forge packages with state-driven landing and empty presentation tracks; the required open-palm socket is a capability declaration, not a scheduled spawn. The first compile correctly rejected an empty required socket list; the corrected builder adds the measured socket without adding a presentation event.

New artifacts are `radiant-dive-family.candidate.v1.json`, `radiant-dive-packages/`, `records/radiant-dive-v1.hash-lock.json`, the public `radiant-dive-v1/manifest.json`, and `generated/manifests/lamuh_radiant_dive_v1.candidate.runtime.json`, plus additive first-playable/review-data coverage. There are 21 authored frame references: twelve new source poses plus three existing catch/settle/idle images reused across strengths. No accepted family, frame, approval receipt, or star was replaced. The gate remains `awaiting_human_radiant_dive_family_review`; all new family/Forge human approvals are pending and deployment/roster promotion remain false.

`tests/lamuh_radiant_dive_content.test.js` passes five groups covering all 21 source references and three raw hashes; exact source/public/compiled parity; B playback sampled independently with the actual runtime selector; final palm containment; source-candidate boundaries; and invalid actual-package landing/clock/multihit/playback/collision rejection. Scoped Heaven tests still pass four content plus six presentation groups after this build.

Independent static contact-sheet critique: Light reads as the shallow reach, Medium as the steeper open palm, and Heavy as a distinct head-first plunge with surrounding body aura. No static limb switch or extra late-kick impact was identified. The main remaining motion review point is Heavy contact -> upright knee gather: a large body orientation change, with only two gather samples at height 180 before the existing catch. Full/half-speed runtime review must judge that transition, adult anatomical scale, and physical foot planting; a fixed canvas root is registration evidence, not a planted-foot measurement. Browser QA is owned separately and is not promoted to PASS by these deterministic/artifact checks.

## Applied guidance

Read and applied: NGA Engine V2 and universal character contract; Playable Character Production; Fighting Game Balance Pass; VFX Integration Audit; Character Visual Consistency; Sprite Sheet Validation; Character Sprite Pipeline; Animation Fluidity Standard; Special Move Standard; Lamuh Animation Manifest; Fighter Atlas Factory and its full standard. Their effect here is preservation-first scope, meaningful family jobs, normalized source/canvas/root validation under the explicit seven-frame V2 package contract, one-action/one-hit continuity, deterministic ownership, truthful variable landing, and a separate human approval boundary. No outside benchmark duration or commercial-parity claim is used.
