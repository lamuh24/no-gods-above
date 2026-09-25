# Swahili Jump/Fall/Landing Key Poses V1 — Engine V2 Live Review

Status: `candidate-only`  
Deployable: `false`  
Production roster: `false`  
Gate: `awaiting_human_jump_fall_landing_live_review`

## Live test

Launch from `NO_GODS_ABOVE/engine_v2/`:

```powershell
npm.cmd run dev -- --port 4173 --strictPort
```

Open:

`http://127.0.0.1:4173/sandbox.html?walkTiming=contact_weighted_40_ticks`

Use `W` for the default soft landing. The panel also exposes `Jump: soft landing`, `Jump: attack landing`, and `Jump: hard landing`. Scenario presets 75–78 provide the three landing branches and authored/mirrored review.

## Candidate mapping

| Frame | Runtime source | Selection rule |
| --- | --- | --- |
| 01 | `jump_v1_anticipation` | Grounded for 4 review ticks before launch |
| 02 | `jump_v1_takeoff` | First 3 airborne pose ticks |
| 03 | `jump_v1_rising` | Vertical velocity below `-2.5` |
| 04 | `jump_v1_apex` | Vertical velocity from `-2.5` through `+2.5` |
| 05 | `jump_v1_falling` | Vertical velocity above `+2.5` |
| 06 | `jump_v1_soft_landing` | Default grounded landing branch, 6-tick hold |
| 07 | `jump_v1_attack_landing_recovery` | Sandbox review branch, 9-tick hold |
| 08 | `jump_v1_hard_landing_compatibility` | Sandbox review branch, 12-tick hold |

No connector artwork was generated. The key-pose spacing is intentionally exposed for human review.

## Authority boundary

- Existing sandbox jump velocity remains `-13` simulation units/tick.
- Existing gravity remains `0.85` simulation units/tick².
- Existing air steering, stage bounds, ceiling clamp, pushboxes, hurtboxes, and landing detection remain simulation-owned.
- Artwork selects a pose only; it cannot move roots, collision, or camera.
- Authored P1 art is mirrored at runtime for the opposite facing; no mirrored source PNG was created.
- No source PNG was rewritten. The focused test verifies all eight SHA-256 values against the pose-library manifest.

## Measured review path

- Anticipation: 4 ticks.
- Airborne: 30 ticks.
- Apex root: `Y = -93.00000000000003` simulation units.
- Soft / attack / hard branches share the same takeoff, apex, fall, and landing-contact tick.
- Landing holds differ only to expose the three candidate recovery poses.

## Validation

- `npm.cmd run test:jump-review` — passed exact hashes, ordered pose coverage, all landing branches, authored/mirrored parity, and candidate-only isolation.
- `npm.cmd test` — full Engine V2 suite passed.
- `npm.cmd run build` — TypeScript and Vite production build passed.
- Live in-app browser — loaded 95 sprite sources, `loadError: null`, no jump fallback warning, attack landing completed with 30 airborne ticks and the same `Y=-93` apex.

No atlas, package, legacy `game.js` edit, production roster integration, commit, push, PR, or deployment was performed.
