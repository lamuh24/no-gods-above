# Sable Pixel Style Redo Lock

Reference image: `assets/characters/sable/references/sable_pixel_reference_style.png`

As of 2026-07-02, this file is the user-approved rebuild-v2 walk-strip design
lock, copied from `assets/characters/sable/references/sable_rebuild_v2_design_lock_strip.png`.
The previous full character-reference sheet is preserved only as historical
context at `assets/characters/sable/references/sable_pixel_reference_style_old_reference_sheet_20260702.png`.
Do not use that old reference sheet as the generation anchor for rebuild-v2.

This is the exact target style for the Sable animator-rebuild-v2 pack. Match the
approved in-pack strips exactly; do not redesign Sable from the older polished
reference sheet.

## Locked Visual Target

- Match the approved rebuild-v2 strip style exactly: narrow body scale, small readable head, long limbs, subdued side-view pixel rendering, and the same camera distance.
- Sable is a Black woman with warm brown skin, silver eyes, stern focused expression, and short tight black coils with pale silver/lavender bead-like highlights.
- Outfit is the same dark navy/black fitted bodysuit from the approved strips, with thin gold/silver seam lines, high collar, gloves, boots, and restrained rim highlights.
- Body scale is slim, athletic, and consistent with `walk_forward`; do not inflate the head, torso, hips, boots, crystal wraps, or VFX.
- Void-crystal power language is restrained black, violet, silver, and glassy: small attached shard wraps and compact current-frame accents only.
- VFX must support the body animation. It must not replace the body, hide the silhouette, create detached previous-frame debris, or dominate the cell.
- Pixel detail must stay stable across the whole pack: suit texture, hair detail, face read, seam lines, boots, gloves, and fracture accents cannot fade in later clips.

## Redo Workflow Decision

- Generate and judge new clips against the approved rebuild-v2 strips, especially `walk_forward`, `idle`, and `block`.
- Do not approve clips that look like the older full character-reference sheet instead of the approved in-pack strip.
- Use the current `sable_pixel_reference_style.png` / `sable_rebuild_v2_design_lock_strip.png` as the identity anchor for every clip, including movement, normals, air attacks, and specials.
- Reject the clip if it loses detail, simplifies the suit, changes the face/hair, inflates body scale, adds oversized crystal gauntlets, or makes VFX look pasted on.
- Keep all outputs preview-only until human review explicitly approves a live-promotion pass.

## Sprite Contract

- One horizontal transparent strip per clip.
- Frame size: `448x448`.
- BaselineY: `382`.
- Facing: right.
- No text, labels, borders, UI, card backgrounds, or reference-sheet panels in generated animation strips.
- No live roster promotion and no gameplay/moveset/balance changes during the art redo.
