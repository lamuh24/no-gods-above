# Sable Style 4 Animator Rebuild v2 Prompt - hit_stun

Create one complete transparent PNG or WEBP horizontal spritesheet for Sable.

clipId: hit_stun
category: base
frameCount: 8
fps: 10
loop: false
frameSize: 448x448
stripSize: 3584x448
baselineY: 382
hitFrames: none
cancelFrames: none

## Locked Identity

Reference: `assets/characters/sable/references/sable_pixel_reference_style.png`
Style lock: `assets/characters/sable/references/sable_pixel_style_redo_lock.md`

- Use the exact Sable pixel-reference game style: finished crisp pixel-art fighter sprites, not painterly concept art.
- Sable is a Black woman with warm brown skin, stern focused face, silver eyes, short tight black coils with silver/lavender bead highlights, and silver earrings.
- Costume is a fitted dark navy/black bodysuit with angular gold/silver seam lines and compact black/violet/silver void-crystal forearm wraps.
- Keep the same face, hair volume, proportions, palette, suit paneling, body scale, and baseline across every clip.
- Right-facing side-view fighting-game sprite strip on transparent alpha only.
- No text, labels, watermarks, cell borders, frames, background, glow backdrop, green screen, or decorative UI.
- No weapons and no redesign. Void effects must be compact and attached unless the clip explicitly calls for projectile, anchor, rift, or vertical phase VFX.
- No leftover previous-frame debris. Each frame must contain only the current pose and intentional current-frame VFX.
- Keep the full character in every 448x448 frame. Do not crop hair, boots, hands, crystals, or VFX that is part of the move.
- Anchor the feet/body to baselineY 382. Movement should read through pose and timing, not by drifting off-cell.

## Clip Direction

Readable impact recoil and recovery while staying in frame; no duplicate frozen frames.

Use the old Sable preview clips only as reference for what failed: do not copy their artifacts, placeholder effects, off-cell drift, or mixed character styles. This rebuild should look like one animator drew the full pack at once from the locked pixel reference.

## Output Contract

- Exactly 8 frames.
- Exactly 3584x448 pixels.
- Each frame is exactly 448x448 pixels.
- Character faces right.
- Transparent alpha background.
- No text, labels, borders, frame dividers, or background.
- Keep Sable fully inside every frame with stable baseline and scale.
