# Engine V2 Gameplay-Kernel Repair Report

Date: 2026-07-11
Scope: existing Engine V2 prototype only; legacy `NO_GODS_ABOVE/game.js` excluded.

## Root causes

- Generic neutral input logic overwrote jump-startup, dash, and backdash every tick.
- Ground integration applied persistent negative `vy` to fighters still marked grounded.
- Hitstop paused phase timers but did not pause movement/gravity integration.
- Knockback values were orders of magnitude larger than the authored chain spacing.
- Combo counters/scaling had no target or neutral-reset lifecycle.
- Blocking was computed before the hitstun guard.
- Hits mutated state immediately in P1-then-P2 order, suppressing equal trades.
- Combat and debug controls shared Space/O while Escape was never consumed by the debug runtime.
- Debug overlays and attack materials allocated new GPU resources every rendered frame.
- Browser smoke launched `npm.cmd` directly on Windows and assumed fixed port 5176 was the correct app.

## Behavior before and after

| Area | Before | After |
|---|---|---|
| Ground physics | 5M/5H drove grounded victims to large negative Y | Grounded non-launch hits remain exactly at `y=0`, `vy=0` |
| Launcher | 2H left camera immediately and needed about 799 ticks to land | Apex about `-114` inside `-180` ceiling; landing completes in a bounded window |
| Jump | Never became airborne | Startup completes exactly once in 4 ticks; landing clamps to ground |
| Dash/backdash | Generic idle logic overrode durations | Authored 12/14 tick durations are deterministic |
| Hitstop | Knockback and gravity continued | Input history buffers; all combat progression/integration freezes |
| Chains | Only first hit connected | `5L -> 5M -> 5H`, `2L -> 2M -> 2H`, and `5L -> 2M -> 2H` connect |
| Combo state | Never reset | Resets after interruption or 12 neutral ticks with fresh scaling |
| Hitstun/block | Holding block escaped hitstun | Blocking is rejected during hitstun; stuns are mutually exclusive |
| Equal trades | P1 always won | Candidates resolve from one snapshot; equal 5L trades deal 30 to both |
| Controls | Space/O conflicts; Escape inactive | O block, Escape pause, F1 overlays, period step while paused |
| Renderer | Geometry grew unbounded | Shared geometry/material pool stabilizes at 8 geometries / 17 overlays |
| Windows smoke | `spawn EINVAL` | Vite launches through `process.execPath` on a dynamic verified port |

## Automated and browser evidence

- Original Engine V2 suite plus the gameplay-kernel repair regression suite.
- Windows browser report: `docs/browser_smoke/browser_smoke_report.json`.
- Visual evidence/contact sheet: `docs/browser_smoke/gameplay_kernel_repair_contact_sheet.png`.
- Browser evidence covers jump/landing, dash duration, both grounded chains, bounded launcher/landing, symmetric trade, combo reset, hitstun block rejection, stable renderer resources, and conflict-free controls.
- Deterministic replay fixture `replays/lamuh_light_opening.replay.json` is currently pinned to checksum `0f5b884d`; the serialized checksum changed again when the universal-throw slice added explicit round, throw, partner, facing, invulnerability, and outcome state. The repaired grounded input script and result remain deterministic.

## Remaining gate

Automated gameplay validity is satisfied for the current prototype slice, but final feel is not accepted by automation. The owner must manually playtest movement, chain timing, launcher readability, block feel, and repeated reset/replay behavior. Any foundational defect found remains a stabilization task.

## Exact next task

Run the owner manual playtest on the repaired Engine V2 build and capture concrete reproduction notes. If any foundational issue appears, perform another focused kernel stabilization pass. Do not begin throws or 3D character integration yet.
