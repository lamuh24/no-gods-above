# Celeste Sprite Sheet Recreation Contract

## Purpose

Celeste's previous sheets had inconsistent frame boxes, shifting origins, labels, backgrounds, and frames going out of bounds. All recreated Celeste sheets must be production-ready fighting-game sprite sheets, not concept boards.

The goal is clean animation frames that can be imported without jitter, clipping, frame shifting, or manual rescue work.

## Global Sheet Rules

- Transparent background only.
- No magenta background.
- No checkerboard background.
- No white panel background.
- No row labels.
- No column labels.
- No decorative text.
- No input text.
- No title text.
- No frame numbers.
- Every frame must sit inside the same-size invisible cell.
- Use equal spacing between frames.
- Use the same character scale across every frame.
- Do not crop frames tightly.
- Leave generous transparent padding around every frame.
- Celeste's full body, hair, coat, boots, baton, and body-scale effects must stay fully inside the cell.
- Grounded frames must share the same feet baseline.
- Airborne frames must share a consistent center-mass anchor.
- Knockdown frames must share a consistent floor-contact point.
- Effects must not force the body out of frame.
- If an effect is large, keep it as detached VFX on a separate sheet.
- Keep Celeste's silhouette readable.
- Do not let her body jump around inside the cell.
- Do not change her outfit, hairstyle, weapon, proportions, or colors between frames.
- Make every sheet easy for a developer to slice into equal-size frames.

## Celeste Design Lock

- Slender elegant female conductor fighter.
- Long dark wavy hair.
- Ivory/off-white conductor coat with gold musical notation.
- Fitted black inner outfit.
- Black pants.
- Heeled boots.
- Small conductor baton.
- Graceful, dangerous, confident expression.
- Divine orchestra anime fighting-game style.
- Readable 2D sprite silhouette.

## Production Cell Strategy

Use larger stable render boxes instead of tight cells. Transparent padding is correct and preferred.

- Body basics: stable grounded or air movement cells.
- Ground attacks: larger attack cells with full baton/coat/effect containment.
- Up and air attacks: larger cells with stable center-mass anchoring.
- Specials: larger cells for FA/SOL/LA/TI body poses; keep oversized effects detached.
- Defense and knockdown: wider cells for floor poses, knockback, KO, and victory.
- Octava body: large cinematic body cells; beam and large spirit effects must stay on detached VFX sheets.

## Anchor Rules

Grounded frames:
- Anchor to a shared feet baseline.
- Celeste may lean, step, or pose, but the sprite origin must not drift randomly.

Airborne frames:
- Anchor to a stable torso/center-mass point.
- Do not make the frame crop pull Celeste around the screen.

Knockdown and KO:
- Anchor to a consistent floor contact point.
- Do not let Celeste float above or sink below the floor.

VFX:
- Anchor detached VFX to the baton tip, palm/hand, torso center, trap placement point, or Octava beam origin.
- Do not bake huge VFX into body frames if they make the body box unstable.

## Negative Prompt / Exclusions

No labels, no title, no text, no numbers, no UI, no command inputs, no frame labels, no colored background, no checkerboard, no white panels, no magenta chroma screen, no concept art layout, no poster composition, no cropped limbs, no cropped baton, no cropped coat, no cropped hair, no inconsistent scale, no changing costume, no duplicated character bodies in one cell, no random camera zooms, no per-frame origin drift.

## Reusable Image Prompt Core

Create a production-ready 2D anime fighting-game sprite sheet for Celeste from No Gods Above.

Celeste is a slender elegant female conductor fighter with long dark wavy hair, an ivory/off-white conductor coat with gold musical notation, a fitted black inner outfit, black pants, heeled boots, and a small conductor baton. She has a graceful, dangerous, confident expression and a divine orchestra anime-fighting-game style.

Use a fully transparent background. Do not include labels, title text, input text, row names, column names, frame numbers, panel backgrounds, checkerboard, magenta, white backdrop, UI, or decorative text.

Arrange the animation frames in equal-size invisible cells with equal spacing. Every frame must use the same character scale and the same outfit, hairstyle, baton, proportions, and colors. Do not crop tightly. Leave generous transparent padding inside every cell. Celeste's full body, hair, coat, boots, baton, and any body-scale effects must stay fully inside the cell.

For grounded frames, keep the same feet baseline in every frame. For airborne frames, keep a stable center-mass anchor. For knockdown frames, keep a stable floor-contact anchor. Celeste should animate inside the cell; the cell origin must not shift from frame to frame.

Keep the silhouette readable and clean for a 2D fighting game. This is a production sprite sheet ready for slicing into equal-size frames, not a concept board.

## Import Validation Gate

Before a recreated sheet replaces runtime art, validate:

- Sheet is transparent RGBA.
- No visible magenta/chroma/checkerboard/panel background.
- No labels or text artifacts.
- All cells are equal size.
- No frame has visible pixels touching or nearly touching the cell edge.
- Grounded rows share a feet baseline.
- Air rows share a center-mass anchor.
- Knockdown rows share floor contact.
- Character scale is consistent.
- Detached VFX are separated when large.
- Runtime smoke confirms no console errors and no failed asset requests.
