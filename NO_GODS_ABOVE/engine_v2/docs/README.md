# NGA Engine V2 Alpha Slice

This folder contains the first executable, preservation-first Engine V2 vertical slice. It does **not** replace the current playable runtime. The legacy game remains `NO_GODS_ABOVE/game.js`; V2 combines a validated contract layer for incremental migration with an isolated, headless TypeScript package for deterministic combat simulation.

## What exists now

- `schemas/character.schema.json` documents the V2 character contract.
- `schemas/stage.schema.json` documents the V2 stage contract.
- `schemas/production/` locks the Milestone A character-production schemas, the approved NGA Stage Production Contract, and approval-gated production-arena planning schemas.
- `manifests/characters.seed.json` captures the current playable roster as legacy-adapted V2 contracts.
- `manifests/stages.seed.json` captures the current stage set as legacy-adapted V2 contracts.
- `content-source/characters/lamuh/` contains the retired, rejected, non-deployable `lamuh_legacy_motion_fixture`; it is technical test data, not gameplay art.
- `scripts/production_contracts.js`, `validate_production_contracts.js`, and `compile_content.js` validate and deterministically compile authored source into `generated/` without overwriting source.
- `docs/production_ecosystem_architecture.md` records the binding Forge-centered architecture and the removal of runtime 3D fighters from the roadmap.
- `scripts/validate_manifests.js` validates manifest structure, duplicate ids, policy fields, and repo-local file references.
- `scripts/parity_smoke.js` statically compares V2 manifest ids with legacy selectable ids in `NO_GODS_ABOVE/game.js` without evaluating the game runtime.
- `src/core/` contains the headless deterministic combat kernel: 60 Hz fixed-step ticks, serializable match state, seeded RNG, input frames/logs, fighter state machine, pushboxes, hurtboxes, strike hitboxes, hit resolution, health, hitstop, hitstun, blockstun foundation, knockback, checksums, snapshots, and replay execution.
- `src/data/fighters.ts` contains data-driven Lamuh prototype and training dummy definitions.
- `tests/combat_kernel.test.js` proves determinism, snapshot/replay behavior, hit rules, hitstop, gravity/knockback, pushboxes, and isolation from `game.js`.
- `tests/gameplay_kernel_repair.test.js` locks grounded/airborne physics, jump/dash timing, true hitstop, buffered input policy, combo reset, required chains, hitstun/block legality, symmetric trades, update-order independence, stage bounds, control separation, Windows smoke launching, and repaired snapshot fields.
- `tests/aerial_normals.test.js` locks distinct `j.J`/`j.K`/`j.L` inputs, launcher pursuit, legal/illegal aerial cancels, deterministic air physics, landing interruption, hit-count limits, combo reset, bounds, replay/snapshot behavior, and the legacy-runtime hash boundary.
- `replays/lamuh_light_opening.replay.json` is a small deterministic replay example.
- `src/stage/` contains the first presentation-only WebGL2 stage vertical slice: constrained perspective camera, 3D depth, painted planes, grounding/shadows, hash-locked Swahili preview sprites, and cinematic-camera constraints.
- `src/debug/` and `index.html` provide a Three.js debug runtime that renders the authoritative simulation state with live/replay controls, stage presentation, and optional collision overlays.
- `docs/STAGE_PRODUCTION_CONTRACT.md` defines the first repeatable combat-plane, camera, sprite-integration, art-direction, grounding, collision, cinematic, and validation contract.
- `docs/stage_vertical_slice/` stores the stage validation report, browser metrics, and P1/P2/center/corner/jump/cinematic captures.
- `sandbox.html`, `src/sandbox/`, and `docs/swahili_sandbox/` provide a preview-only Swahili playtest harness on the Last Tribunal graybox, with explicit incomplete-state diagnostics and no production-roster registration.
- `tribunal-playtest.html` and `docs/tribunal_live_playtest/` provide the named Swahili Sandbox × The Last Tribunal Graybox live-playtest candidate route. It reuses the sandbox simulation, remains non-deployable, and cannot count as human approval.
- `stage-production/templates/` provides the reusable production-arena brief contract, while `stage-production/arenas/the_last_tribunal/` contains the approved Production Arena Brief V1 plus its non-deployable concept and deterministic graybox candidate. The package includes 28 paired clean/diagnostic browser scenarios, rollback-safe event plans with move-authored fixed-tick durations, an art-pack specification, and the next human approval gate.
- `docs/browser_smoke/` stores browser smoke screenshots and the latest smoke report.
- `docs/input_mapping.md` documents keyboard/gamepad mappings.
- `docs/combat_tuning.md` documents temporary movement/combat values.
- `docs/gameplay_kernel_repair_report.md` records the audit roots, repaired behavior, evidence, and remaining manual gate.
- `docs/aerial_normals_report.md` records the completed aerial-normal slice, temporary values, browser evidence, and owner playtest gate.

## Preservation-first migration progression

The V2 manifests began as intentionally read-only planning/runtime-contract artifacts while the active game remained `NO_GODS_ABOVE/game.js`. The safe migration plan was to:

1. Extract a runtime read-only registry adapter that loads the manifests for tooling only.
2. Add a focused parity smoke comparing V2 roster and stage ids with the current select UI ids.
3. Move one low-risk stage or character metadata field from hard-coded runtime data to the V2 registry while preserving existing fallback constants.

The parity smoke is now implemented. Any later runtime data migration must still preserve the legacy fallback boundary.

## Run it

From `NO_GODS_ABOVE/engine_v2/`:

```bash
npm run build
npm test
npm run validate
npm run compile:content
npm run check:content
npm run dev
npm run smoke:browser
npm run smoke:stage
npm run smoke:graybox
npm run smoke:sandbox
npm run smoke:tribunal-playtest
npm run validate:arena
```

From the repo root:

```bash
npm --prefix NO_GODS_ABOVE/engine_v2 test
node NO_GODS_ABOVE/engine_v2/scripts/validate_manifests.js
npm --prefix NO_GODS_ABOVE/engine_v2 run smoke:browser
```

## Current boundary

The simulation imports no DOM, renderer, sound, Three.js, Blender, networking, or legacy `NO_GODS_ABOVE/game.js` runtime APIs. Hitboxes and hurtboxes are authored primitives, not sprite/model geometry. Animation root motion is intentionally excluded from combat state. The debug renderer is downstream only: keyboard/replay input is translated into existing `InputFrame` data, `tick()` advances the fixed 60 Hz simulation, serializable state is read by Three.js, and renderer meshes never decide hits, move fighters authoritatively, or mutate combat state.

The Last Tribunal is currently `production_arena_graybox_candidate`, `deployable: false`, and `awaiting_human_graybox_and_concept_approval`. Its concept board and graybox are review evidence only. Final arena materials, production textures, production roster integration, runtime deployment, and any combat-authority change remain prohibited.

## Implemented fighter scope

Lamuh prototype includes deterministic walk, dash/backdash, crouch, jump/landing, `5L/5M/5H`, `2L/2M/2H`, distinct `j.J/j.K/j.L` aerial normals, blocking, hit/block stun, bounded launcher pursuit, combo tracking/reset, knockdown/get-up, and same-tick trades. The training dummy includes block modes, hurtboxes, reactions, health, and reset behavior. Full Lamuh ports, throws, specials, burst, ultimate, sprite mappings, production balance, and cinematic systems remain out of scope.

## Next exact task

Owner manual playtest of `2H -> jump cancel -> j.J -> j.K -> j.L`, including direct `j.J -> j.L` and `j.K -> j.L`, remains the acceptance gate for the current gameplay prototype.

The architecture gate is separate from the rejected fixture. Do not begin replacement character work until the correct final reference is supplied. The legacy fixture remains only for deterministic compiler, transition, timing, atlas, and regression validation.
