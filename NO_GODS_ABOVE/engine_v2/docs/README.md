# NGA Engine V2 Alpha Slice

This folder contains the first executable, preservation-first Engine V2 vertical slice. It does **not** replace the current playable runtime. The legacy game remains `NO_GODS_ABOVE/game.js`; V2 combines a validated contract layer for incremental migration with an isolated, headless TypeScript package for deterministic combat simulation.

## What exists now

- `schemas/character.schema.json` documents the V2 character contract.
- `schemas/stage.schema.json` documents the V2 stage contract.
- `manifests/characters.seed.json` captures the current playable roster as legacy-adapted V2 contracts.
- `manifests/stages.seed.json` captures the current stage set as legacy-adapted V2 contracts.
- `scripts/validate_manifests.js` validates manifest structure, duplicate ids, policy fields, and repo-local file references.
- `scripts/parity_smoke.js` statically compares V2 manifest ids with legacy selectable ids in `NO_GODS_ABOVE/game.js` without evaluating the game runtime.
- `src/core/` contains the headless deterministic combat kernel: 60 Hz fixed-step ticks, serializable match state, seeded RNG, input frames/logs, fighter state machine, pushboxes, hurtboxes, strike hitboxes, a distinct universal-throw collision/pairing path, hit resolution, health, hitstop, hitstun, blockstun foundation, knockback, checksums, snapshots, and replay execution.
- `src/data/fighters.ts` contains data-driven Lamuh prototype and training dummy definitions.
- `tests/combat_kernel.test.js` proves determinism, snapshot/replay behavior, hit rules, hitstop, gravity/knockback, pushboxes, and isolation from `game.js`.
- `tests/gameplay_kernel_repair.test.js` locks grounded/airborne physics, jump/dash timing, true hitstop, buffered input policy, combo reset, required chains, hitstun/block legality, symmetric trades, update-order independence, stage bounds, control separation, Windows smoke launching, and repaired snapshot fields.
- `tests/aerial_normals.test.js` locks distinct `j.J`/`j.K`/`j.L` inputs, launcher pursuit, legal/illegal aerial cancels, deterministic air physics, landing interruption, hit-count limits, combo reset, bounds, replay/snapshot behavior, and the legacy-runtime hash boundary.
- `tests/forward_throw.test.js` locks Throw input edges, grounded eligibility, exact startup/active/tech timing, whiff/recovery, deterministic paired anchors, tech/release/knockdown, corner containment, interruption/reset cleanup, strike priority, mutual-throw policy, replay/snapshot/order determinism, renderer separation, and the legacy-runtime hash boundary.
- `replays/lamuh_light_opening.replay.json` is a small deterministic replay example.
- `src/debug/` and `index.html` provide a Three.js debug runtime that renders the authoritative simulation state with live/replay controls and collision overlays.
- `docs/browser_smoke/` stores browser smoke screenshots and the latest smoke report.
- `docs/input_mapping.md` documents keyboard/gamepad mappings.
- `docs/combat_tuning.md` documents temporary movement/combat values.
- `docs/gameplay_kernel_repair_report.md` records the audit roots, repaired behavior, evidence, and remaining manual gate.
- `docs/aerial_normals_report.md` records the completed aerial-normal slice, temporary values, browser evidence, and owner playtest gate.
- `docs/forward_throw_report.md` records the universal forward-throw policy, temporary authored values, deterministic state flow, browser evidence, and owner playtest gate.

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
npm run dev
npm run smoke:browser
```

From the repo root:

```bash
npm --prefix NO_GODS_ABOVE/engine_v2 test
node NO_GODS_ABOVE/engine_v2/scripts/validate_manifests.js
npm --prefix NO_GODS_ABOVE/engine_v2 run smoke:browser
```

## Current boundary

The simulation imports no DOM, renderer, sound, Three.js, Blender, networking, or legacy `NO_GODS_ABOVE/game.js` runtime APIs. Hitboxes and hurtboxes are authored primitives, not sprite/model geometry. Animation root motion is intentionally excluded from combat state. The debug renderer is downstream only: keyboard/replay input is translated into existing `InputFrame` data, `tick()` advances the fixed 60 Hz simulation, serializable state is read by Three.js, and renderer meshes never decide hits, move fighters authoritatively, or mutate combat state.

## Implemented fighter scope

Lamuh prototype includes deterministic walk, dash/backdash, crouch, jump/landing, `5L/5M/5H`, `2L/2M/2H`, distinct `j.J/j.K/j.L` aerial normals, a grounded techable universal forward throw, blocking, hit/block stun, bounded launcher pursuit, combo tracking/reset, knockdown/get-up, and same-tick trades. The training dummy includes block modes, a distinct throw hurtbox, capture/release reactions, health, and reset behavior. Full Lamuh ports, back throws, air throws, command grabs, hit-grabs, specials, burst, ultimate, sprite/model mappings, production balance, and cinematic systems remain out of scope.

## Next exact task

Owner manual playtest of the close-range forward throw on both facings, whiff recovery, same-button throw tech, release/knockdown, and both corners. If accepted, the next task may be temporary rigged Lamuh integration. Back throws, air throws, command grabs, specials, and production animation work must remain separate follow-up tasks.
