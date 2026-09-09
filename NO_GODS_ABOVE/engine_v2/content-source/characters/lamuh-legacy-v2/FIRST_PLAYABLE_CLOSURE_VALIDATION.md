# Lamuh Legacy V2 first-playable closure — validation

Status: **candidate-only**  
Deployable: **false**  
Human review: **awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review**

## Passing Lamuh gates

- Protected legacy audit: 22 hash-locked sources, zero mismatches, 98 extracted source cells, 49 audited animations, and 10 move-specific timing sets.
- Standing Heavy source: seven distinct normalized 2048×1536 RGBA frames, one sequence-wide scale, fixed authored root `(768, 1360)`, safe transparent padding, zero edge contact, and zero visible purple pixels in the browser V2 contact capture.
- Motion contract: V1 choreography roles remain ordered as load, guarded coil, launch, one contact, distinct no-hit overshoot, same-leg recoil, and rotational recovery. A fresh-context critique identified an open-palm impact read in the first coil candidate; the retained frame closes the hand and removes the burst/droplets so it reads as anticipation.
- Human motion review identified an apparent scale jump at contact. The retained contact was re-authored at the neighboring launch/overshoot anatomical scale with the planted root preserved; no renderer zoom, per-frame runtime scale, or normalization recentering was introduced. The earlier oversized contact remains preserved as rejected evidence.
- Timing contract: A `9/5/18` (32 ticks), B `11/5/21` (37 ticks), and C `13/6/23` (42 ticks) directly alter the deterministic simulation. Impact I1/I2/I3 use 8/9/10 hitstop without changing total visual duration or other combat values.
- Outcome routing: hit and block may show the contact composite; whiff uses body-only contact art. Visible impacts and gameplay hits remain `1/1`.
- Standing-scale repair: Standing Light now holds approximately the frame-00 authored anatomy scale across all six frames. Standing Medium frame `00 wide_ready_entry` alone was reduced; frames `01-07` remain untouched. The entry is `712` px high versus a `725` px preserved-frame median (`1.79%` delta), with fixed runtime scale and zero meaningful magenta pixels.
- Air-dash preservation: protected V1 forward/backward air-dash poses are normalized to the shared root `(768, 1360)`. Both use independent 14-tick deterministic states, one use per airtime, gravity suspension during the burst, and return to jump. The byte-identical final backward-dash source drawing is represented as authored air-brake exposure rather than a duplicate runtime frame.
- Crouch/jump modernization: six crouch and seven jump/fall/landing frames use fixed root `(768, 1360)`, zero meaningful magenta pixels, no edge contact, one sequence-wide scale, and simulation-authored travel. The rising crouch connector remains comparison-only pending human transition review.
- Focused tests: `npm.cmd run test:lamuh-legacy-v2` passes core, content, closure, replay, checksum, mirroring, timing, collision outcomes, movement, throw mechanics, and promotion-firewall coverage.
- Browser playtest: `npm.cmd run smoke:lamuh-legacy-v2` passed true V1/V2 comparison, 0.5× and mirror controls, the corrected Standing Medium entry, forward/backward air-dash entry states, A/B/C direct simulation, hit/block/whiff, P2 right-corner play, Forward Throw, Back Throw side switch, and grab-whiff neutral return with no console or request failures.
- Current-gate browser contract: the comparison route is directly asserted to open on `state:crouch`, render both V1 and V2 evidence, expose 1×/0.5×/frame-step/facing/restart controls, link to the sandbox, and display all six current human-decision prompts. The human-facing status label is shortened for readability while the machine status remains unchanged.
- Content contracts: `node scripts/validate_production_contracts.js` and `node scripts/compile_content.js --check` pass. All 24 Lamuh first-playable packages remain non-deployable candidates.
- Build: the Engine V2 TypeScript/Vite build passed for both Lamuh review routes.
- Protected runtime: legacy `game.js` remains byte-identical at SHA-256 `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B` and does not import `lamuh_legacy_v2`.

## Browser evidence

- `artifacts/lamuh-legacy-v2/v1-v2-standing-heavy-closure.png`
- `artifacts/lamuh-legacy-v2/current-review-gate-crouch-default.png`
- `artifacts/lamuh-legacy-v2/standing-medium-fixed-scale-entry.png`
- `artifacts/lamuh-legacy-v2/air-dash-forward-entry.png`
- `artifacts/lamuh-legacy-v2/air-dash-backward-entry.png`
- `artifacts/lamuh-legacy-v2/standing-heavy-candidate-c-hit.png`
- `artifacts/lamuh-legacy-v2/first-playable-closure-sandbox.png`
- `artifacts/lamuh-legacy-v2/v1-v2-crouch-modern-style-review.png`
- `artifacts/lamuh-legacy-v2/v1-v2-jump-modern-style-review.png`
- `artifacts/lamuh-legacy-v2/crouch-modern-style-hold.png`
- `artifacts/lamuh-legacy-v2/jump-modern-style-rise.png`
- `artifacts/lamuh-legacy-v2/jump-modern-style-apex.png`
- `artifacts/lamuh-legacy-v2/jump-modern-style-landing.png`
- `artifacts/lamuh-legacy-v2/browser-smoke-closure.json`
- `../../../tools/nga-forge/review/lamuh-legacy-v2-cross-clip-scale-v1/validation/standing-scale-validation.json`

The browser audit counted 3,370 purple-family visible pixels on the protected V1 contact view and zero on the rebuilt V2 contact view. This is presentation evidence, not production-art approval.

## Broader repository gate

`npm.cmd run validate` passed manifests, stage contracts, production arena validation, legacy/V2 roster parity, content schemas, deterministic compilation, and all tests reached before the pre-existing Swahili sandbox approval-hash mismatch stopped the command:

- actual Swahili sandbox SHA-256 `A78973E5097305A09F99BF7BA19C8DAD4BD2675E2D2208F1D81C2EDC273F7E3E`
- expected Swahili sandbox SHA-256 `9983530AF0AEA032ECBEAE009A7843AA81953E211DB40572C936E90BA3270B4A`

These are classified `KNOWN_UNRELATED_SWAHILI_VALIDATION_MISMATCH`. Swahili was not modified because the closure goal expressly prohibits it.

## Unresolved human gates

Technical closure does not approve production. The current gate must judge the rebuilt crouch, jump/fall/landing arc, combined movement flow, and Standard Grab / Forward Throw / Back Throw independently. The live crouch-to-stand connector remains targeted debt until the motion/transition decision is recorded. The broader Standing Heavy timing, combat-profile, overall first-playable, and production decisions remain separate.

No candidate was promoted. No roster, deployment, merge, push, or pull request action occurred.
