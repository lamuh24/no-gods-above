# Sable Runtime Consistency Fix

Status: wired only to the hidden `?sableTest` runtime. Public roster remains unchanged.

## Root Causes

1. The new 350 px idle existed only as a review candidate, while the game still loaded the old 257 px idle.
2. `getup` ended at 260 px and the three Void Anchor clips began/ended at 255-260 px.
3. Sable's rebuilt strips used runtime scale 0.98, making a correct 350 px source render near 343 px versus LAMUH near 306 px.
4. The unchanged `game.js` and service-worker cache keys could keep an old build active after refresh.

## Corrected Runtime Set

| Clip | First standing height | Last standing height | Baseline |
| --- | ---: | ---: | ---: |
| idle | 350 px | 349 px | 381 |
| getup | grounded pose | 352 px | 381 |
| back_special_light | 353 px | 353 px | 381 |
| back_special_medium | 352 px | 352 px | 381 |
| back_special_heavy | 352 px | 358 px | 381 |

- Sable rebuild render multiplier: 0.86
- LAMUH comparison: approximately 306 px on-screen
- Sable comparison: approximately 301-303 px on-screen
- Candidate manifest gate: 39/39 pass
- Palette remains locked to suit hue 249.3 degrees, lattice hue 24.3 degrees, hair-fleck density 7.24 percent.

Void Anchor light and medium use one intentional held plant-plus-trap frame because the generator omitted Sable from a VFX-only cell. No body anatomy was fabricated; the preceding complete on-model pose is held while the trap remains active.

## Verification

- `npm.cmd run check:game`: pass
- `npm.cmd --prefix tools/sprite-agent run typecheck`: pass
- `cross_clip_consistency`: 39 passed, 0 failed
- Fresh numbered frame-scrub sheets are under `reports/frame_scrub/<clip>/consistency_352_final/`.
