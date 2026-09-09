# Lamuh V2 — quality benchmark and rebuild pass 1

Date: 2026-09-05. Branch: `codex/lamuh-legacy-v2-rebuild-v1`.
Status: LOCAL, TESTED CANDIDATE. Not production-approved, deployed, pushed, merged, or roster-promoted.

## Benchmark and limits

Arc System Works' GDC 2015 art-direction brief describes preserving the appeal of classic 2D animation while rebuilding the presentation technology. That supports preserving Lamuh's strong source motion instead of replacing all frames. This audit uses the published session abstract; it does not claim to have watched or measured the entire presentation. [Official GDC session: Guilty Gear Xrd's Art Style](https://www.gdcvault.com/play/1022031/Guilty-Gear-Xrd-s-Art).

Strive's official system guide distinguishes offensive/defensive resource uses, forward pressure incentives, and conversion opportunities. It is a useful reference for moves having understandable jobs and costs, not a universal duration table or a mandate to clone Strive mechanics. [Official Strive systems](https://www.guiltygear.com/ggst/en/battle/systems/).

**Our applied interpretation:** assess intention → anticipation → strike → contact → follow-through → recovery, clear strength differences, readable defender response, intentional route choices, and character continuity. Commercial parity is not established by this pass or by automated tests. Exact ArcSys frame values, balance parity, and player preference were not measured.

## Current playable identity, not the old proposal

A mobile close-to-midrange pressure/confirm fighter. Fast palm/punch checks and low attacks lead into committed kick knockdowns or a launcher; Ascend L advances, Ascend M converts a low slide into a handspring launcher, and Ascend H spends time approaching/repositioning before one rear blast. One air dash per jump supports repositioning. No functioning long-range projectile, ultimate, or additional special family is claimed.

Strengths: short confirms, low pressure, grounded movement, air conversion and side switching. Weaknesses: committed heavy recovery, linear approach, currently limited long-range options. Tension/Burst exist in the core, but their complete Lamuh presentation and sandbox input coverage are not part of this delivered art pass. The earlier COMBAT_IDENTITY document remains a historical wider-kit proposal, not evidence of implemented moves.

## Actual move inventory

S/A/R are independently authored simulation ticks, excluding hitstop; these are Lamuh values, not copied ArcSys timings. Damage is unscaled base damage. Natural cancels work on hit/block unless noted. Standing Heavy's default review I2 uses 9 hitstop; its base definition uses 8.

| Move | S/A/R | Hits | Damage | Purpose / natural route | Decision in this pass |
|---|---:|---:|---:|---|---|
| 5L | 3/5/6 | 1 | 24 | Check → 5M or 2M | PRESERVE_WITH_V2_COMBAT_UPDATE: fresh cancel clock, light reaction |
| 5M | 6/6/11 | 1 | 48 | Confirm → 5H/2H; Ascend M on hit | PRESERVE_WITH_V2_COMBAT_UPDATE: full startup on cancel |
| 5H | 11/5/21 | 1 | 82 | Committed soft knockdown | PRESERVE: keep A/B/C review rhythm |
| 2L | 3/4/7 | 1 | 22 | Fast low → 2M | PRESERVE_WITH_V2_COMBAT_UPDATE: light reaction |
| 2M | 6/5/11 | 1 | 44 | Longer low → 2H | PRESERVE: limb-anchored contact feedback |
| 2H | 10/5/22 | 1 | 70 | Launcher, jump-cancel on hit | PRESERVE: rejected decorative VFX stays disabled |
| j.L | 3/5/5 | 1 | 22 | Air check → j.M/j.H | PRESERVE: strictly one hit |
| j.M | 6/4/11 | 1 | 44 | Air conversion → j.H | PRESERVE: strictly one hit |
| j.H | 8/5/17 | 1 | 72 | Soft-knockdown ender | PRESERVE |
| Ascend L | 5/4/11 | 1 | 32 | Movement-first aura dash/punch | PRESERVE: no second strike |
| Ascend M | 7/24/17 | 2 | 26 + 44 | Low slide → handspring launcher | PRESERVE current repair; keep contact/landing review debt |
| Ascend H | 24/5/13 | 1 | 84 | Approach → behind switch → growing blast | PRESERVE; no victim teleport or approach damage |
| Forward throw | 32 total | 1 | 70 | Connect 4, release 14 | PRESERVE scoped human acceptance |
| Back throw | 36 total | 1 | 75 | Connect 4, release 16 | PRESERVE scoped human acceptance |

Ascend M's 24-tick active phase is an envelope: damage windows are **7–9 and 26–28**, not 24 consecutive damaging ticks. A fresh full connection deals 66 after scaling. Universal grab is the shared reach/attempt/connect/whiff for the two throws, not a third damaging attack.

Nine normals and one three-strength special family are playable. Dormant inherited/test attack definitions are not Lamuh coverage. Additional directional families will only be authored if they provide a meaningful role. No slot-filling variants were invented.

## Coverage and findings

| Area | Verified finding | Action / status |
|---|---|---|
| Ground cancels | Outgoing phaseTick could carry into the next move, skipping startup and even its contact window | FIXED for Lamuh V2; prototype behavior preserved; early/late hit/block, mirror and replay tested |
| Up + Heavy | Could reach an unrelated copied special without Lamuh art | FIXED to Standing Heavy on ground, Air Heavy in air |
| Strength response | Generic hitstun ≥18 rule made Lamuh light contacts use heavy reactions | FIXED semantically for Lamuh mirrors; no damage, stun, hitstop or hit-count change |
| Idle/walk/dashes/crouch/jump/block/turn | Modern candidate source frames already present | PRESERVED byte-for-byte; 185 current movement/attack/throw frames locked |
| Light/heavy hit response | Legacy fallback and repeated source-row cycling weakened impact readability | REBUILT with distinct adult V2 reactions and one-shot holds |
| Launch/fall/down/get-up | Legacy pose/identity changes broke the receiving side's continuity | REBUILT candidate: launch → gather → brace → down → supported rise → guard |
| Hit feedback | Baked composite swap could change body artwork; inherited collision coordinates did not reliably match visual limbs | Body-only source retained; actual contact event triggers a separate, authored sprite-socket cue; distinct block arc |
| Frame delivery | Large PNG decode could occur during animation | Predecode/cache 202 presentation sources at fixed display scale before simulation starts |
| Whole-body playtest | Dense controls pushed the canvas off a laptop-sized viewport | Clean playtest mode; full canvas above scenario controls; optional sound and previous-visual comparison |
| Fighter overlap | Prior human: “pass for now but mark it” | Exact receipt retained, starred for revisit; accepted screenshot preserved under a dated filename |

## What was not changed

No existing attack, movement or throw PNG was redrawn or rescaled during this quality pass. Original V1 lock and protected legacy `game.js` remain intact. No uniform speed multiplier, new combo hits, new damage tuning, air-block mechanic, counter-hit invention, ultimate, stage redesign, or unrelated character change was added. Existing A/B/C candidates remain available; sandbox A/C remain visual-only where already declared, while B is the aligned playtest default.

## Explicit review debt — not hidden by the effects

- **Foot/support registration:** new frames use a constant sequence scale and fixed canvas root, but source extraction anchors each silhouette's midpoint/bottom. This is not measured support-foot registration. Heavy recoil → catch and down → supported rise require 1× human no-slide review.
- **Ascend M contact height:** the fully extended rising heel and receiving body's height need close visual judgment. A logical collision and a correctly placed limb spark do not prove physical limb-to-victim contact. Keep this and handspring landing starred for targeted repair; do not fake victim translation to hide it.
- Air-normal arcs, heavy recovery, and all important entry/exit blends still need player judgment in strings, not just contact-sheet acceptance.
- Old baked effects remain in the explicitly selectable previous-visual baseline. New compact feedback is a candidate and can be switched off.
- Broader victim classes, explicit overhead/air-guard rules, complete meter presentation, remaining signature special concepts and ultimate are unfinished—not falsely counted as covered.
- Existing first-playable Forge bundle remains separate. The new reactions have an **additive five-animation candidate bundle**, not a production replacement. Nominal review exposures are explicitly subordinate to authoritative hitstun/velocity/knockdown/get-up state selection.

## Art/source and validation evidence

- Source: `reaction-frames-quality-v1/`, `reactions-quality.v1.json` (12 unique RGBA frames; 2048×1536; root 768,1360; one sequence scale 2.84697509).
- Preservation: `quality-preserved-art.lock.json` (185 frame hashes); no silent checkpoint overwrite.
- Contact data: `quality-contact-sockets.v1.json` (12 reviewed source-frame bindings; no collision-box mutation).
- Forge: `quality-reaction-packages/quality-reactions.bundle.json` and `generated/manifests/lamuh_quality_reactions_v1.candidate.runtime.json`; five zero-damage packages, deployable false.
- Tests: `npm run test:lamuh-legacy-v2`; `npm run test:lamuh-quality` (cancel/reaction regressions, 72 outcome/mirror cases, selector checksum purity, hit-count parity, no-loop down state, pixel hashes, socket mirror parity, Forge freshness).
- Browser: `artifacts/lamuh-quality-v1/browser-quality-report.json`, per-contact screenshots, `clean-playtest.png`, `quality-playtest-motion.webm`; `npm run smoke:lamuh-quality` requires the local server at4177. The movie is a real-time canvas capture of three playtest scenarios, not a generated motion claim.
- Legacy regression: `npm run smoke:lamuh-legacy-v2`, including approved throw behavior, single-hit air normals, movement, bounds, and prior candidate comparison route.

## Next human gate

Play at 1× first with Refined reactions + impact enabled. Try 5L → 5M, lows, Ascend M, Ascend H, then disable the checkbox to compare the old receiving-side visuals. Inspect the twelve-pose sheet and 0.5× only after normal-speed judgment. Record targeted approval/rejection; this pass is not a full-character production approval.

Applied and read: NGA Engine V2 preserve-first/validation guidance; playable_character_production_skill; character_visual_consistency_skill; sprite_sheet_validation_skill; vfx_integration_audit_skill; fighting_game_balance_pass_skill; git_checkpoint_safety_skill; CHARACTER_SPRITE_PIPELINE; ANIMATION_FLUIDITY_STANDARD; lamuh_animation_manifest; fighter-atlas-factory; built-in imagegen; focused fighting-game playtest QA. A separate critic inspected the reaction art and core regression evidence. Obsidian Markdown/CLI guidance applies to the pending handoff only.
