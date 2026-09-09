# Swahili Sandbox × The Last Tribunal Actual Graybox

Status: `production_arena_live_playtest_candidate`  
Deployable: `false`  
Approval state: `awaiting_actual_tribunal_graybox_integration`  
Human live-stage playtest completed: `false`

This direct route reuses the existing authoritative deterministic Swahili sandbox simulation and presents it through `actual_graybox_v1`. The route does not instantiate the generic sandbox environment and does not use the concept board as a gameplay background. If the arena/config identity is invalid, startup stops behind a visible `ACTUAL TRIBUNAL GRAYBOX LOAD ERROR` instead of silently falling back.

The simulation continues to own movement, collision, hit detection, attack timing, bounds, walls, jump motion, spacing, fighter state, and health. All Tribunal geometry is collision-independent presentation.

Automated validation is readiness evidence only. It is not human stage-playtest approval and does not authorize Art Development Layer 1.

## Loaded presentation

- Arena ID: `the_last_tribunal`
- Presentation ID: `actual_graybox_v1`
- Renderer entry: `src/graybox/actualTribunalGrayboxRenderer.ts`
- Scene config: `stage-production/arenas/the_last_tribunal/graybox/actual_graybox_v1.scene.json`
- Camera rig: `src/stage/cameraRig.ts`
- Generic renderer retained only for `/sandbox.html`: `src/graybox/tribunalGrayboxRenderer.ts`

The actual graybox config drives the matte floor, shadow receiver, stepped central dais, witness boxes, column/base/capital masses, four-tier rear galleries, oculus wall and eclipse opening, depth-separated cathedral-red banners, foreground frames, boundary pylons, haze bands, approved parallax depths, contrast zones, VFX regions, and cinematic volumes. It loads no stage texture and has no concept-board runtime dependency.

## Launch

From `NO_GODS_ABOVE/engine_v2/`:

```powershell
npm.cmd run playtest:tribunal
```

Local URL: `http://127.0.0.1:4174/tribunal-playtest.html`

No configuration edit or stage switch is required.

## Controls

| Action | Control |
| --- | --- |
| Move | `A` / `D` or Left / Right |
| Crouch | `S` or Down |
| Standing block | Hold `O` |
| Crouching block | Hold `S`/Down + `O` |
| Standing Heavy | `L` or `H` |
| Reset positions | `R` or Reset round button |
| Cycle dummy block | `B` or Dummy block button |
| Switch sides | `F` or Switch sides button |
| Diagnostics | `F1` or Diagnostics button |
| Pause/resume | `Esc` or Pause button |
| Frame advance | `.` while paused or Frame advance button |
| Slow motion | `Q` or Slow motion button (`0.25x`) |
| Force light/heavy reaction | UI buttons |
| VFX contrast study | `V` or VFX contrast button |

The VFX control cycles `off`, `hit_sparks`, `projectile`, `large_beam`, and `all`. These remain presentation-only graybox proxies.

## Real and incomplete states

Real approved or currently reviewable Swahili content is used for idle, forward walk candidate, crouch, standing/crouching block packages, light/heavy reactions, Standing Heavy, mirroring, side switching, and multipart body hurtboxes.

Backward walk remains five real roles plus three explicit missing roles. The red debug warning and `BLOCKED_ON_THREE_MANUAL_PAINTOVERS` state remain visible. Jump remains a labeled debug fallback used for camera coverage.

## Validation evidence

Run:

```powershell
npm.cmd run smoke:tribunal-playtest
```

The focused browser smoke verifies the actual arena/presentation identity, every required Tribunal geometry role, floor/root/shadow alignment, camera and bounds, depth-ordered parallax response, five cinematic volumes, no stage or concept-board texture, no generic fallback, deterministic replay, mirrored P1/P2, side switch, corners, Standing Heavy hit/block/whiff, blocks/reactions, presentation checksum neutrality, WebGL2, browser errors, and the legacy `game.js` hash.

Comparison and scenario captures are under `docs/tribunal_live_playtest/captures/`; machine-readable results are in `browser_report.json`.

## Known limitations

- Human judgment is still required for corner comfort, eclipse distraction, camera tracking feel, grounding, scale, movement cadence, and sprite/VFX contrast.
- Backward walk remains blocked on three manual paintovers.
- Standing Heavy exposure timing remains a human animation-timing review item.
- The 36 standalone preview fighter textures estimate 81 MiB; this is not a production stage-texture package.
- VFX are contrast-test proxies, not final effects.
- No Layer 1 floor material, production texture, final oculus art, architecture art, banner art, atmosphere, or final lighting work has begun.
