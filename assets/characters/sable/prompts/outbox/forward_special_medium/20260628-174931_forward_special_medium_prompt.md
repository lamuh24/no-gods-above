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
  "role": "Playable MVP fighter; visual Style 4 sprite lock only",
  "bodyType": "dark-skinned female fighter with mature HD pixel anime fighter proportions and an elegant acrobatic 2.5D fighting-game silhouette",
  "skinTone": "dark skin, preserved from the official Sable reference sheet",
  "hair": "short curled hair, tight rounded curls, no long hair and no hair-as-weapon behavior",
  "face": "focused elegant fighter face with silver eyes, readable brows, lips, and facial structure in sprite scale",
  "outfit": "sleek navy-black bodysuit with subtle silver/obsidian panel lines and a clean athletic silhouette",
  "accessories": [
    "obsidian forearm wraps",
    "void-crystal fracture accents around forearms/hands"
  ],
  "vfx": "controlled void-crystal fracture energy, dark obsidian shards with silver-violet fracture highlights; VFX supports the body and never replaces it",
  "forbidden": [
    "do not redesign Sable",
    "do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing",
    "do not add weapons",
    "do not give Sable long hair",
    "do not add a white coat",
    "do not add a Lamuh gold pendant",
    "do not use realistic or painterly rendering for final sprites",
    "do not include text, labels, borders, watermarks, backgrounds, or frame grids",
    "do not crop hair, hands, feet, face, or void-crystal accents",
    "do not wire generated assets into the live roster automatically"
  ],
  "palette": {
    "skin": "dark brown skin tone from reference",
    "hair": "black short curled hair with subtle silver highlights only where present in the lock",
    "eyes": "silver eyes",
    "suitPrimary": "navy-black bodysuit",
    "suitAccent": "subtle silver/obsidian panel lines",
    "forearmWraps": "obsidian crystal wraps",
    "vfx": "black obsidian shards, silver fracture lines, restrained violet/cool highlights",
    "outline": "crisp dark fighting-game sprite outline"
  },
  "spriteRules": {
    "frameWidth": 448,
    "frameHeight": 448,
    "baselineY": 382,
    "facing": "right",
    "style": "No Gods Above Style 4 HD pixel anime fighter sprite",
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
    "The official reference sheet is the identity source of truth, but final sprites must convert the look into clean Style 4 HD pixel anime fighter sprite art.",
    "Keep Sable body-first and readable. Void-crystal fracture VFX should be subtle during idle.",
    "The first production sprite test is idle only: 8-frame horizontal strip, 448x448 per frame, right-facing, transparent background, elegant acrobatic idle stance.",
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
    }
  ],
  "briefs": [
    {
      "path": "assets/characters/sable/briefs/v20260627-012225/brief.md",
      "ingestedAt": "2026-06-27T05:22:25.911Z"
    }
  ]
}

## Safety Rules

- Do not redesign the character.
- Do not change skin tone, face family, hair identity, outfit silhouette, palette, or power language.
- Body readability comes before VFX.
- Large VFX may exist only if the body remains visible and centered.
- Produce candidate art only. These frames are not approved for live roster use until validation passes.


---

# Sprite Clip Prompt: sable / forward_special_medium

Use the Style 4 HD pixel anime fighter standard.

Clip: `forward_special_medium`
Subject: `Sable` only
Category: `special`
Frame count: `8`
FPS target: `12`
Loop: `false`
Canvas: `448x448` per frame
Facing: `right`
BaselineY: `382`

## Motion Direction

Create exactly 8 frames for `forward_special_medium`.
Show Sable only. Do not include any other character, prop character, weapon, UI card, title, logo, or background scene.

The result must be:

- one horizontal strip sized `3584x448`
- exactly 8 equal cells, each `448x448`
- no grid layout, no second row, no stacked layout, and no visible cell borders

Every frame must keep the same character scale and identity. Do not include text, labels, borders, background, floor, props, or camera framing marks.

## Character Lock

Display name: Sable
Role: Playable MVP fighter; visual Style 4 sprite lock only
Body type: dark-skinned female fighter with mature HD pixel anime fighter proportions and an elegant acrobatic 2.5D fighting-game silhouette
Skin tone: dark skin, preserved from the official Sable reference sheet
Hair: short curled hair, tight rounded curls, no long hair and no hair-as-weapon behavior
Face: focused elegant fighter face with silver eyes, readable brows, lips, and facial structure in sprite scale
Outfit: sleek navy-black bodysuit with subtle silver/obsidian panel lines and a clean athletic silhouette
Accessories: obsidian forearm wraps, void-crystal fracture accents around forearms/hands
VFX: controlled void-crystal fracture energy, dark obsidian shards with silver-violet fracture highlights; VFX supports the body and never replaces it
Forbidden: do not redesign Sable, do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing, do not add weapons, do not give Sable long hair, do not add a white coat, do not add a Lamuh gold pendant, do not use realistic or painterly rendering for final sprites, do not include text, labels, borders, watermarks, backgrounds, or frame grids, do not crop hair, hands, feet, face, or void-crystal accents, do not wire generated assets into the live roster automatically
Palette: skin: dark brown skin tone from reference; hair: black short curled hair with subtle silver highlights only where present in the lock; eyes: silver eyes; suitPrimary: navy-black bodysuit; suitAccent: subtle silver/obsidian panel lines; forearmWraps: obsidian crystal wraps; vfx: black obsidian shards, silver fracture lines, restrained violet/cool highlights; outline: crisp dark fighting-game sprite outline
Style notes: Sable is already a playable MVP character; this spec locks visual identity only.; The official reference sheet is the identity source of truth, but final sprites must convert the look into clean Style 4 HD pixel anime fighter sprite art.; Keep Sable body-first and readable. Void-crystal fracture VFX should be subtle during idle.; The first production sprite test is idle only: 8-frame horizontal strip, 448x448 per frame, right-facing, transparent background, elegant acrobatic idle stance.; Brief source preserved at assets/characters/sable/briefs/v20260627-012225/brief.md. Review and fold exact identity details into this spec before approval.

## Clip Notes

No extra clip notes.

## Output Requirement

Return only the sprite sheet image. No caption text inside the image.
