# Seris Emergency Rollback and Restart Plan

## Status

Seris is disabled from active runtime selection as of 2026-05-31.

The Seris concept is not cancelled. The current runtime implementation is quarantined because the chain/whip approach produced corrupted sprite fragments, duplicated body pieces, disconnected chain parts, and unstable runtime presentation.

## Runtime Decision

- Do not patch the current Seris runtime implementation forward.
- Do not load current Seris sprite atlases or Sheet 8 chain/whip VFX in runtime.
- Keep Kairo, Vanta, and Nyx as the stable active roster.
- Preserve Seris docs, source assets, generated atlases, and screenshots for reference only.

## What Went Wrong

- Long chain arcs exceeded what the current generated sheet/layout workflow could cleanly support.
- Separate Sheet 8 chain overlays did not align well enough with body animation.
- Embedded long-chain frames introduced duplicate poses, broken fragments, and unreadable cells.
- Repeated runtime masking and source-rect repairs made the presentation more unstable instead of production-ready.

## Rebuild Rules

1. Start from a fresh Seris base model/reference pose.
2. Use a simpler weapon plan.
3. Avoid long full-screen chain arcs on normal attacks.
4. Keep weapon motion inside practical fixed-size cells.
5. Make the weapon part of body animation from the beginning.
6. Do not use separate VFX as the main weapon body.
7. Use VFX only for small hit sparks, glow, ultimate/special accents, or brief active-frame emphasis.
8. Use fixed-size cells from the start.
9. Use one consistent Seris body anchor from the start.
10. Do not use aggressive per-frame trimming.
11. Do not allow frame cells to overlap.
12. Do not import Seris until sprite sheets pass static visual previews.
13. Do not wire Seris into runtime until atlas previews are clean.
14. Do not add chain VFX overlays until body animations are proven stable in-game.

## Safer Weapon Options

- Short divine chain-blade attached to wrist/hand.
- Paired short chain sickles with limited arc range.
- Compact segmented whip with controlled medium arcs.
- Floating divine chain ring that stays close to Seris.
- Elegant chain ribbon effect baked into sprites, not runtime overlay.

## Recommended Rebuild Direction

Prefer a compact weapon silhouette: short divine chain-blade, paired short chain sickles, or a close-orbit chain ring. Seris should still read as elegant, divine, precise, and dangerous, but her weapon should stay inside stable animation boxes.

## Production Gate

Before runtime import, the rebuilt Seris sheets must prove:

- No duplicate bodies inside cells.
- No disconnected body parts.
- No chain fragments or stray weapon debris.
- No long chain arcs clipped by cells.
- Consistent source rectangles and anchors.
- Clean static row previews for movement, normals, air normals, specials, defense, and end states.
- No Sheet 8-style overlay dependency for normal attacks.
