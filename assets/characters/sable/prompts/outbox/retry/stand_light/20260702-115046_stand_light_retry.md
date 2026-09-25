# Retry Prompt: sable / stand_light

Regenerate `stand_light` for `sable`.

The previous sheet was rejected or needs retry because:

- NO_ALPHA_TRANSPARENCY: Image has no meaningful transparency.
- OPAQUE_FULL_BACKGROUND: Opaque pixel ratio 1.000 suggests a full baked background.
- DIMENSIONS_NOT_FRAME_MULTIPLE: Sheet 2201x714 is not an exact multiple of 448x448.

Keep the locked identity and Style 4 target exactly:

Display name: Sable
Role: Playable MVP fighter; pixel-art visual redo lock only
Body type: Black female fighter with crisp finished pixel-art proportions, athletic elegant silhouette, long readable limbs, and consistent body scale across every animation
Skin tone: warm dark brown skin tone from the pixel reference style sheet
Hair: short tight black coils with silver/lavender bead-like highlights, rounded curl clusters, no long hair and no hair-as-weapon behavior
Face: stern focused fighter face with silver eyes, readable brows, lips, and facial structure at sprite scale
Outfit: dark navy-black fitted bodysuit with readable gold/silver seam lines, angular paneling, high collar, gloves, boots, and bright pixel rim highlights
Accessories: obsidian forearm wraps, void-crystal fracture accents around forearms/hands
VFX: controlled void-crystal fracture energy, black/violet/silver glassy shard wraps and compact fracture bursts; VFX supports the body and never replaces it
Forbidden: do not redesign Sable, do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing, do not add weapons, do not give Sable long hair, do not add a white coat, do not add a Lamuh gold pendant, do not use realistic, painterly, soft, 3D-rendered, or low-detail rendering for final sprites, do not let later clips lose suit texture, seam detail, hair detail, face readability, boots, gloves, or fracture accents, do not include text, labels, borders, watermarks, backgrounds, or frame grids, do not crop hair, hands, feet, face, or void-crystal accents, do not wire generated assets into the live roster automatically
Palette: skin: dark brown skin tone from reference; hair: black short tight coils with silver/lavender bead-like highlights; eyes: silver eyes; suitPrimary: dark navy-black bodysuit; suitAccent: readable gold/silver seam lines and angular paneling; forearmWraps: obsidian crystal wraps; vfx: black obsidian shards, violet glass, silver fracture lines, compact cool highlights; outline: crisp pixel-art fighting-game outline
Style notes: Sable is already a playable MVP character; this spec locks visual identity only.; The pixel reference sheet at assets/characters/sable/references/sable_pixel_reference_style.png is the exact style target for the redo.; Keep Sable body-first and readable. Void-crystal fracture VFX must be compact, attached, and supportive of the body animation.; Generate and judge the full MVP animation pack as one locked-style pass before preview approval.; Reject the whole batch if later clips lose pixel detail, simplify the suit, change face/hair, drift body scale, or make VFX look pasted on.; Brief source preserved at assets/characters/sable/briefs/v20260627-012225/brief.md. Review and fold exact identity details into this spec before approval.

Hard requirements:

- 8 frames.
- 448x448 transparent canvas per frame.
- Character faces right.
- Feet align to baselineY 382.
- No background, text, labels, borders, watermark, or frame grid.
- No cropping.
- Stable scale and center across all frames.
- Preserve the exact character design.

Return only the corrected sprite sheet image.
