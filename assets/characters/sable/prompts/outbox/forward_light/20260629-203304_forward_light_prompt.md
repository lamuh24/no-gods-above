# Style 4 HD Pixel Anime Fighter Sprite Master Prompt

Create production-ready character animation frames for No Gods Above using the locked character spec below.

## Target Sprite Standard

- 448x448 frame canvas per frame.
- Transparent background with real alpha.
- Character faces right by default.
- Feet aligned to baselineY 382.
- Mature HD pixel anime fighter proportions.
- Strong readable silhouette.
- Crisp outline.
- Simplified cel/pixel shading.
- No text, labels, watermark, background, frame border, UI marks, or grid lines.
- No cropping of hair, hands, feet, clothing, weapons, VFX, or motion arcs.
- Consistent character scale across all frames.
- Preserve the locked character identity exactly.

## Character Spec

{
  "id": "sable",
  "displayName": "Sable",
  "role": "Playable MVP fighter; pixel-art visual redo lock only",
  "bodyType": "Black female fighter with crisp finished pixel-art proportions, athletic elegant silhouette, long readable limbs, and consistent body scale across every animation",
  "skinTone": "warm dark brown skin tone from the pixel reference style sheet",
  "hair": "short tight black coils with silver/lavender bead-like highlights, rounded curl clusters, no long hair and no hair-as-weapon behavior",
  "face": "stern focused fighter face with silver eyes, readable brows, lips, and facial structure at sprite scale",
  "outfit": "dark navy-black fitted bodysuit with readable gold/silver seam lines, angular paneling, high collar, gloves, boots, and bright pixel rim highlights",
  "accessories": [
    "obsidian forearm wraps",
    "void-crystal fracture accents around forearms/hands"
  ],
  "vfx": "controlled void-crystal fracture energy, black/violet/silver glassy shard wraps and compact fracture bursts; VFX supports the body and never replaces it",
  "forbidden": [
    "do not redesign Sable",
    "do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing",
    "do not add weapons",
    "do not give Sable long hair",
    "do not add a white coat",
    "do not add a Lamuh gold pendant",
    "do not use realistic, painterly, soft, 3D-rendered, or low-detail rendering for final sprites",
    "do not let later clips lose suit texture, seam detail, hair detail, face readability, boots, gloves, or fracture accents",
    "do not include text, labels, borders, watermarks, backgrounds, or frame grids",
    "do not crop hair, hands, feet, face, or void-crystal accents",
    "do not wire generated assets into the live roster automatically"
  ],
  "palette": {
    "skin": "dark brown skin tone from reference",
    "hair": "black short tight coils with silver/lavender bead-like highlights",
    "eyes": "silver eyes",
    "suitPrimary": "dark navy-black bodysuit",
    "suitAccent": "readable gold/silver seam lines and angular paneling",
    "forearmWraps": "obsidian crystal wraps",
    "vfx": "black obsidian shards, violet glass, silver fracture lines, compact cool highlights",
    "outline": "crisp pixel-art fighting-game outline"
  },
  "spriteRules": {
    "frameWidth": 448,
    "frameHeight": 448,
    "baselineY": 382,
    "facing": "right",
    "style": "Sable locked pixel-reference fighting-game sprite style",
    "transparentBackground": true,
    "noText": true,
    "noLabels": true,
    "noFrameBorders": true,
    "consistentScale": true,
    "firstClip": "idle",
    "idleFrameCount": 8
  },
  "styleNotes": [
    "Sable is already a playable MVP character; this spec locks visual identity only.",
    "The pixel reference sheet at assets/characters/sable/references/sable_pixel_reference_style.png is the exact style target for the redo.",
    "Keep Sable body-first and readable. Void-crystal fracture VFX must be compact, attached, and supportive of the body animation.",
    "Generate and judge the full MVP animation pack as one locked-style pass before preview approval.",
    "Reject the whole batch if later clips lose pixel detail, simplify the suit, change face/hair, drift body scale, or make VFX look pasted on.",
    "Brief source preserved at assets/characters/sable/briefs/v20260627-012225/brief.md. Review and fold exact identity details into this spec before approval."
  ],
  "gameplayLock": {
    "status": "existing_playable_mvp",
    "doNotChange": true,
    "moves": [
      "idle",
      "walk",
      "jump",
      "crouch",
      "block",
      "hitstun",
      "ground light",
      "ground medium",
      "ground heavy",
      "air light",
      "air medium",
      "air heavy",
      "Void Shard",
      "Forward Light Phase Lunge",
      "Forward Medium Phase Lunge",
      "Forward Heavy Phase Lunge",
      "Void Anchor",
      "Ground Rift",
      "Vertical Phase"
    ]
  },
  "lock": {
    "status": "draft_locked",
    "createdAt": "2026-06-27T00:00:00.000Z",
    "updatedAt": "2026-06-27T05:22:25.911Z",
    "requiresHumanApproval": true
  },
  "references": [
    {
      "path": "assets/characters/sable/references/v20260627-012225/reference.png",
      "ingestedAt": "2026-06-27T05:22:25.911Z"
    },
    {
      "path": "assets/characters/sable/references/sable_pixel_reference_style.png",
      "ingestedAt": "2026-06-29T16:56:00.000Z",
      "role": "exact_pixel_style_redo_target"
    }
  ],
  "briefs": [
    {
      "path": "assets/characters/sable/briefs/v20260627-012225/brief.md",
      "ingestedAt": "2026-06-27T05:22:25.911Z"
    }
  ]
}

## Character-Specific Redo Style Lock

# Sable Pixel Style Redo Lock

Reference image: `assets/characters/sable/references/sable_pixel_reference_style.png`

This is the exact target style for the next Sable redo. The current Style 4 preview pack is acceptable for temporary playtest only, but it is not the final Sable art direction.

## Locked Visual Target

- Crisp finished pixel-art fighter style, not painterly, soft, 3D-rendered, or low-detail.
- Sable is a Black woman with warm brown skin, silver eyes, stern focused expression, and short tight black coils with silver/lavender bead-like highlights.
- Outfit is a dark navy/black fitted bodysuit with readable gold/silver seam lines, angular paneling, high collar, gloves, boots, and bright pixel rim highlights.
- Body scale is athletic and elegant, with long readable limbs and consistent proportions across every clip.
- Void-crystal power language is black, violet, silver, and glassy: angular shard wraps around forearms, fractured light cracks, and compact shard bursts.
- VFX must support the body animation. It must not replace the body, hide the silhouette, create detached previous-frame debris, or dominate the cell.
- Pixel detail must stay stable across the whole pack: suit texture, hair detail, face read, seam lines, boots, gloves, and fracture accents cannot fade in later clips.

## Redo Workflow Decision

- Generate and judge the full Sable MVP animation pack as one locked style pass.
- Do not approve clip-by-clip batches until the full pack contact sheet proves consistency.
- Use the pixel reference as the identity anchor for every clip, including movement, normals, air attacks, and specials.
- Reject the whole batch if later clips lose detail, simplify the suit, change the face/hair, drift body scale, or make VFX look pasted on.
- Keep all outputs preview-only until human review explicitly approves a live-promotion pass.

## Sprite Contract

- One horizontal transparent strip per clip.
- Frame size: `448x448`.
- BaselineY: `382`.
- Facing: right.
- No text, labels, borders, UI, card backgrounds, or reference-sheet panels in generated animation strips.
- No live roster promotion and no gameplay/moveset/balance changes during the art redo.


## Safety Rules

- Do not redesign the character.
- Do not change skin tone, face family, hair identity, outfit silhouette, palette, or power language.
- Body readability comes before VFX.
- Large VFX may exist only if the body remains visible and centered.
- Produce candidate art only. These frames are not approved for live roster use until validation passes.


---

# Sprite Clip Prompt: sable / forward_light

Use the Style 4 HD pixel anime fighter standard plus the character-specific redo style lock. For Sable, the pixel reference style is the exact game target, and the whole MVP pack must maintain the same crisp pixel-art detail level.

Clip: `forward_light`
Subject: `Sable` only
Category: `normal`
Frame count: `6`
FPS target: `14`
Loop: `false`
Canvas: `448x448` per frame
Facing: `right`
BaselineY: `382`

## Motion Direction

Create exactly 6 frames for `forward_light`.
Show Sable only. Do not include any other character, prop character, weapon, UI card, title, logo, or background scene.

The result must be:

- one horizontal strip sized `2688x448`
- exactly 6 equal cells, each `448x448`
- no grid layout, no second row, no stacked layout, and no visible cell borders

Every frame must keep the same character scale and identity. Do not include text, labels, borders, background, floor, props, or camera framing marks.

## Character Lock

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

## Redo Style Lock

# Sable Pixel Style Redo Lock

Reference image: `assets/characters/sable/references/sable_pixel_reference_style.png`

This is the exact target style for the next Sable redo. The current Style 4 preview pack is acceptable for temporary playtest only, but it is not the final Sable art direction.

## Locked Visual Target

- Crisp finished pixel-art fighter style, not painterly, soft, 3D-rendered, or low-detail.
- Sable is a Black woman with warm brown skin, silver eyes, stern focused expression, and short tight black coils with silver/lavender bead-like highlights.
- Outfit is a dark navy/black fitted bodysuit with readable gold/silver seam lines, angular paneling, high collar, gloves, boots, and bright pixel rim highlights.
- Body scale is athletic and elegant, with long readable limbs and consistent proportions across every clip.
- Void-crystal power language is black, violet, silver, and glassy: angular shard wraps around forearms, fractured light cracks, and compact shard bursts.
- VFX must support the body animation. It must not replace the body, hide the silhouette, create detached previous-frame debris, or dominate the cell.
- Pixel detail must stay stable across the whole pack: suit texture, hair detail, face read, seam lines, boots, gloves, and fracture accents cannot fade in later clips.

## Redo Workflow Decision

- Generate and judge the full Sable MVP animation pack as one locked style pass.
- Do not approve clip-by-clip batches until the full pack contact sheet proves consistency.
- Use the pixel reference as the identity anchor for every clip, including movement, normals, air attacks, and specials.
- Reject the whole batch if later clips lose detail, simplify the suit, change the face/hair, drift body scale, or make VFX look pasted on.
- Keep all outputs preview-only until human review explicitly approves a live-promotion pass.

## Sprite Contract

- One horizontal transparent strip per clip.
- Frame size: `448x448`.
- BaselineY: `382`.
- Facing: right.
- No text, labels, borders, UI, card backgrounds, or reference-sheet panels in generated animation strips.
- No live roster promotion and no gameplay/moveset/balance changes during the art redo.


## Clip Notes

Forward-moving light normal, a compact advancing palm or forearm check.
This is not Phase Lunge; keep travel implied by pose only and avoid special VFX.
Maintain Sable's locked pixel style and in-frame body silhouette.

## Output Requirement

Return only the sprite sheet image. No caption text inside the image.
