# NGA VFX Engine V1

> Superseded as the visual authoring surface by `tools/nga-forge/vfx-forge/`. This procedural lab is preserved only as a deterministic presentation-runtime prototype; new specials and supers should manufacture transparent sprite atlases in VFX Forge.

Status: `candidate-only`

Deployable: `false`

Production roster authority: `false`

Combat simulation authority: `false`

## Purpose

VFX Engine V1 is a standalone, effects-only vertical slice for authoring and reviewing No Gods Above presentation effects without baking them into fighter artwork or allowing them to mutate combat simulation.

Local review page: `http://127.0.0.1:4194/vfx-lab.html`

## V1 Contract

- Fixed 60 Hz tick sampling.
- Seeded deterministic particles and frame checksums.
- Facing-aware offsets, velocities, and rotations.
- Owner-socket, impact-point, world, and previous-position anchor vocabulary.
- Per-layer hit, block, and whiff visibility gates.
- Independent muzzle flash, smoke, shell, impact, trail, projectile, ring, debris, and camera-shake tracks.
- No fighter pixels or baked body artwork in the catalog.
- No damage, hitstun, knockback, hitbox, input, resource, roster, or balance writes.

## Included Presets

1. Swahili Opposed Split Shot V2.
2. Heavy Impact — Old Gold.
3. Block Impact — Cyan.
4. Cyan Dash Trail.
5. Celestial Orb.
6. Roman Cancel — Crimson.
7. Burst Escape — Gold/Cyan.
8. Heavy Landing Dust.

These presets are procedural review references, not production-approved character VFX. Character-specific palette, sockets, scale, and timing remain human-gated.

## Integration Boundary

The pure `VfxEngine` emits presentation primitives and a camera-shake request. A future adapter may consume rollback-safe `spawn_vfx` and `start_shake` presentation events, but V1 is deliberately not wired into combat. The existing game, Engine V2 combat state, Swahili candidates, fighter art, packages, atlases, and roster mappings remain untouched.

## Validation Commands

```powershell
npm.cmd run build:sim
node tests/vfx_engine_v1.test.js
node node_modules/vite/bin/vite.js build --config vite.vfx.config.js
```

Visual review must cover right-facing, left-facing, hit, block, whiff, 1×, 0.5×, moving anchors, and alpha-checker contrast before any preset is promoted.
