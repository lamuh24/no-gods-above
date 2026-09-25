# Swahili playtest size correction — 2026-09-12

The current versus playtest now converts every Swahili export into the same reference coordinate system before drawing. It measures size against the approved idle, keeping crouches, lunges, and ball poses free to change shape.

## Fixed

- Forward Light/Medium/Heavy, Down Light/Medium, and the Air Heavy proxy used 512px images in a presenter designed around 1536px images. Previously these exports drew the character at one-third scale and used the wrong floor origin.
- Export resolution now determines the conversion into reference space, never the final body size. The nominal idle body remains 182 simulation units.
- Forward clips use their authored floor origins (approximately 480/512 and 482/512), so corrected sprites are no longer displaced relative to the ground.
- Down Light's source was approximately 23% oversized after resolution conversion. One 0.81 scale correction across all 16 frames brings its head-size diagnostic within 7% of idle and uses its authored floor at 488/512.
- Player 1 and Player 2 use identical geometry, including reused Air Heavy frames and idle fallback origins.

No source sprites, attack timing, damage, inputs, hit counts, or collision envelopes were changed. Earlier animation versions remain preserved. Source-art proportions and motion quality remain separate from the corrected runtime resolution/anchor bug; this report is not approval of every pose's anatomy or choreography.

## Evidence

- Inventoried and measured **232 unique loaded images across 45 clips/held states**.
- Runtime comparison captured all 45 entries against idle in 12 pages, sampling first, middle, and last frames. Every source image was included in the technical inventory.
- **PASS:** resolution-independent scale tests, stable per-clip geometry, Down Light measurement regression, Air Medium Special regression, TypeScript/Vite build, versus playtest smoke.
- **PASS:** P1/P2 image and origin parity; zero missing sources, failed loads, or browser errors in the focused comparison.
- Only existing build chunk-size warnings remain.

See `source-measurements.json`, `calibrated-browser.json`, and `calibrated-01.png` through `calibrated-12.png`. `resolution-fixed-*` shows the intermediate comparison before the additional Down Light calibration.

## Implementation

Paths below are relative to the project root:

- `NO_GODS_ABOVE/engine_v2/src/versus/presentation.ts`: normalizes source dimensions during preload and stores the matching per-image draw origin.
- `NO_GODS_ABOVE/engine_v2/src/versus/swahiliSpriteGeometry.ts`: shared conversion math.
- `NO_GODS_ABOVE/engine_v2/src/versus/swahiliSpriteScale.json`: reference and per-clip calibration manifest.
- `NO_GODS_ABOVE/engine_v2/tests/swahili_move_scale.test.cjs`: scale regression checks across the loaded inventory.
- `NO_GODS_ABOVE/engine_v2/scripts/swahili_scale_inventory.cjs`: extracts the actual presenter mappings.
- `NO_GODS_ABOVE/engine_v2/scripts/measure_swahili_move_scale.py`: offline diagnostics only; does not edit images. Pink-head measurements require visual interpretation when hands, weapons, or effects overlap the head.
- `NO_GODS_ABOVE/engine_v2/scripts/review_swahili_move_scale.cjs`: captures the real presenter against idle on both player sides.

## Playtest and reproduce

From `NO_GODS_ABOVE/engine_v2`, with the existing project dependencies installed:

```text
npm run dev -- --port 4175 --strictPort
```

Open `http://127.0.0.1:4175/versus-playtest.html?character=swahili&air-specials-v1=1`.
This is a local address: a partner must run their own checkout to use it. An asset handoff ZIP does not include the full game.

```text
npm run build:sim
node tests/swahili_move_scale.test.cjs
node tests/swahili_air_medium_special_runtime_v1.test.js
node scripts/review_swahili_move_scale.cjs calibrated
npm run smoke:versus-playtest
```

NGA guidance applied: Engine V2, Playable Character Production, Character Visual Consistency, Sprite Sheet Validation, Character Sprite Pipeline, and Animation Fluidity Standard. These informed the idle reference, preservation of pose/weapon extents, fixed clip scaling, and P1/P2 review.

Local candidate playtest only. Obsidian CLI reported that Obsidian was not running; the continuity note is preserved under `.agent-sync-pending/2026-09-12-swahili-playtest-size.md`.
