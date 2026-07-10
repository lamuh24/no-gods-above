# Sable Pixel Style Redo Lock

Primary reference image: `assets/characters/sable/references/sable_pixel_reference_style.png`

As of 2026-07-08, this file is the official Sable Style 4 pixel character reference sheet for all future Sable restart work. It was copied from `C:\Users\qchee\Downloads\sable pixel reference style.png` and replaces the prior rebuild-v2 walk-strip image as the primary visual anchor.

The previous primary reference is preserved only as history at `assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png`. Do not delete it, but do not use it as the generation anchor for `sable_style4_specials_rebuild_v3`.

## Locked Visual Target

- Sable is a dark-skinned Black woman with warm brown skin, silver eyes, a stern focused fighter face, and short tight black curls with pale silver/lavender highlights.
- Outfit is a dark navy-black fitted bodysuit with angular silver/gold seam lines, high collar, gloves, boots, and crisp pixel rim highlights.
- Forearms and hands carry obsidian void-crystal wraps with black, violet, and silver fracture effects.
- Body language is elegant, athletic, acrobatic, and mature. Preserve Sable's proportions and fighting-game silhouette.
- Pixel rendering must be Style 4 HD pixel anime fighter: crisp outline, readable full-body poses, stable suit detail, stable face/hair read, and no painterly or 3D look.
- Void-crystal VFX must support the body animation. It must not replace the body, hide the silhouette, create disconnected debris, or dominate the cell.

## Restart Workflow Decision

- `animator-rebuild-v2` and older Sable animation attempts are preserved as failed/WIP quality candidates, not production candidates.
- Future Sable animation production starts from this full character reference sheet, then uses a key-pose-first pipeline before any in-betweening or pack assembly.
- `sable_style4_specials_rebuild_v3` remains preserved as the earlier special-only restart lane.
- `sable_style4_full_rebuild_v3` is the active isolated preview-only restart lane for all 39 Sable core clips: 9 base/reaction clips, 15 normals, and 15 specials.
- Reject a clip if it changes Sable's skin tone, face, hair, body proportions, bodysuit shape, seam language, silver eyes, forearm crystal wraps, or void-crystal power language.
- Reject a clip if it is missing/choppy, has near-duplicate L/M/H variants, has unclear startup/active/recovery reads, or makes the VFX more readable than Sable's body.

## Sprite Contract

- One horizontal transparent strip per clip.
- Frame size: `448x448`.
- BaselineY: `382` except intentional airborne frames.
- Facing: right.
- Full body visible in every cell.
- No text, labels, borders, UI, reference-sheet panels, card backgrounds, weapons, white coat, Lamuh pendant, or redesigns.
- No live roster promotion and no gameplay/moveset/balance changes during the art restart.
