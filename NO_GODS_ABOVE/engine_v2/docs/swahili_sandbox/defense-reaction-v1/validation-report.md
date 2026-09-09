# Swahili Defense / Reaction Candidate Package Validation

Status: `awaiting_human_in_game_defense_reaction_review`  
Candidate-only: `true`  
Deployable: `false`  
Production roster: unchanged

## Approved source promotion

`defense_reaction_motion_v1` is recorded as `APPROVED_AS_DEFENSE_REACTION_MOTION_V1`. The eight reviewed connector PNGs were copied into `tools/nga-forge/production/characters/swahili/source-frames/approved/defense-reaction-motion-v1/` without pixel changes. Candidate and approved SHA-256 values match for every file.

## Candidate packages

| Package | Sandbox artwork timing | Gameplay timing status | Return behavior |
| --- | --- | --- | --- |
| `standing_block` | 4 entry / 12 minimum hold / 4 release | sandbox candidate; hold input-extendable | idle |
| `crouching_block` | 4 entry / 12 minimum hold / 4 release | sandbox candidate; hold input-extendable | crouch |
| `light_hit_reaction` | 2 entry / 4 approved reaction / 6 recovery (12 total) | sandbox candidate; 4 hitstop / 12 hitstun | simulation-resolved |
| `heavy_hit_reaction` | 3 entry / 8 approved reaction / 12 recovery (23 total) | sandbox candidate; 7 hitstop / 23 hitstun | simulation-resolved; no automatic knockdown |

All four package cursors are simulation-owned. Hitstop freezes the package cursor and current artwork exposure. Hitstun, blockstun, launch, stagger, and knockdown remain combat-state decisions rather than animation decisions.

## Presentation separation

Hit spark, block spark, character hit flash, impact sound, optional camera shake, and optional smoke/debris are declared as rollback-safe presentation events and sockets. None are baked into fighter source frames. Replay of the same rollback frame emitted five events once and identified all five replay attempts as deduplicated through stable event IDs.

## Sandbox findings

- Standing block enters, holds while input remains held, and releases to idle without an extra transition frame.
- Crouching block enters and holds correctly, then releases back to crouch rather than standing idle.
- Light and heavy reactions were exercised from idle, walk, crouch, and block states.
- Heavy reaction remains a large intentional impact cut. Root, camera, and scale stay fixed; the cut was not softened and no fighter-art VFX was added.
- Authored P1, mirrored P2, side switch, both corners, hitstop, repeated rapid hits, and valid control-state return passed.
- Thirty-four browser captures loaded all 36 expected textures with no console errors, stale pixels, frame overlap, camera pop, or scale pop observed.
- The 36 standalone preview textures have an estimated 81 MiB upload cost, above the arena candidate's 72 MiB ceiling. This is a non-blocking preview-budget warning pending later atlas/packing work, not a gameplay-state or source-art defect.
- No candidate atlas was compiled, so atlas reconstruction was not applicable to this milestone.

## Validation executed

- `npm.cmd run validate` — passed Engine V2 manifests, parity, content contracts, compiler freshness, TypeScript, combat/kernel regressions, stage regressions, sandbox tests, and package tests.
- `npm.cmd run smoke:sandbox` — passed 34 Chromium/SwiftShader capture states; WebGL2; 36 textures; zero console errors.
- `python -m unittest discover -s tools/nga-forge/backend/tests -p "test_*.py"` — 42 tests passed.
- `game.js` SHA-256 remained `D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B`.

## Evidence

- Browser report: `NO_GODS_ABOVE/engine_v2/docs/swahili_sandbox/captures/sandbox_browser_report.json`
- Capture index: `NO_GODS_ABOVE/engine_v2/docs/swahili_sandbox/captures/capture_index.html`
- Package operation status: `tools/nga-forge/production/characters/swahili/packages/defense-reaction-v1/operation-status.json`
- Compiled candidate manifest: `NO_GODS_ABOVE/engine_v2/generated/manifests/swahili_defense_reaction_v1.candidate.runtime.json`
