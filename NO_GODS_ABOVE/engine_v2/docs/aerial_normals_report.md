# Engine V2 Lamuh Aerial-Normal Completion Report

Date: 2026-07-11
Scope: Lamuh prototype aerial normals only; legacy `NO_GODS_ABOVE/game.js`, throws, specials, models, animations, and unrelated grounded tuning excluded.

## Implemented behavior

- Airborne `J`, `K`, and `L` now select distinct data-driven `air_light` (`j.J`), `air_medium` (`j.K`), and `air_heavy` (`j.L`) definitions.
- `j.J` is the fast, lowest-damage starter and cancels on hit/block to `j.K` or `j.L`.
- `j.K` is the moderate bridge and cancels on hit/block only to `j.L`.
- `j.L` preserves the working Air Heavy timing, damage, hitstop, hitstun, downward knockback, and soft-knockdown finish. Only its command label/hitbox id changed from the temporary `j.H` notation to the requested `j.L` notation.
- `2H`'s existing authored `jumpCancelOnHit` flag now drives a real pursuit jump cancel instead of exposing an unusable Air Heavy attack cancel while grounded.
- Reverse chains are absent from the data graph. Ground/air restrictions are validated before an attack begins.

## Temporary proof values

| Move | Startup | Active | Recovery | Damage | Hitstop | Hitstun | Knockback | Role |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `j.J` | 3 | 3 | 7 | 25 | 3 | 13 | `1.5, -1.5` | short starter |
| `j.K` | 5 | 4 | 10 | 45 | 4 | 16 | `2.8, -5` | aerial bridge |
| `j.L` | 6 | 6 | 14 | 70 | 6 | 18 | `5, 8` + soft knockdown | finisher |

The `j.K` hitbox points horizontally/slightly downward while its temporary upward target velocity preserves the launcher route long enough for `j.L`. These are prototype proof values, not a production balance pass.

## Airborne and landing policy

- Jump takeoff grants three aerial-normal actions. Each aerial-normal start consumes one; no double jump, air dash, special, or extra mobility action was added.
- Air attacks retain horizontal velocity, continue gravity, retain airborne state, and lock facing at attack start. Existing hitstop remains the only authored physics freeze.
- Landing interrupts any unfinished aerial startup/active/recovery, clears the move and cancel graph, resets remaining air actions to zero, and enters the existing 5-tick landing recovery.
- Every aerial hitbox is authored for one hit. Combo damage scaling, interruption reset, neutral reset, bounds clamps, snapshot, and replay rules remain shared with the repaired kernel.

## Debug presentation

- `j.J`, `j.K`, and `j.L` use cyan, yellow, and rose body indicators with progressively stronger body angles/scales.
- Their strike rectangles are distinct sizes/shapes.
- HUD now exposes aerial move id, startup/active/recovery phase, available aerial cancels, remaining air actions, and the accumulated combo route.

## Validation and browser evidence

- `tests/aerial_normals.test.js`: 17 focused tests covering the requested aerial input, route, physics, landing, hit-count, reset, bounds, determinism, budget, facing, and legacy-hash gates.
- Full simulation suite: 62 tests passing, including the repaired grounded chains, trades, blocking, hitstop, and snapshot/replay coverage.
- Windows browser smoke: no console errors; stable renderer resources at 8 geometries / 17 pooled overlays.
- Browser route: `2H -> j.J -> j.K -> j.L`, 4 hits, 194 scaled damage, defender health 806, no bounds warnings.
- Replay fixture checksum: expected/actual `7d56f13c`.
- Report: `docs/browser_smoke/browser_smoke_report.json`.
- Contact sheet: `docs/browser_smoke/aerial_normals_contact_sheet.png`.
- Frames: `aerial_2h_to_jj_hud.png`, `aerial_jj_to_jk.png`, `aerial_full_jj_jk_jl.png`, and `aerial_jl_landing_knockdown.png`.

No dropped input, camera escape, floatiness, stale landing attack state, combo-reset fault, renderer growth, or browser console error appeared in the automated browser pass. Manual feel is not accepted by automation.

## Required owner gate

Manually playtest `2H -> jump -> j.J -> j.K -> j.L`, `j.J -> j.L`, and `j.K -> j.L` in the open debug runtime. If accepted, the next task is universal forward-throw architecture, followed by temporary rigged Lamuh integration. Neither follow-up is part of this change.
