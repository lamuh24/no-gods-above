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
  "role": "Playable WIP fighter; Style 4 full-rebuild-v3 visual restart lock only",
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
    "Sable is a delayed/WIP playable character; this spec locks visual identity for preview-only animation restart work.",
    "The pixel reference sheet at assets/characters/sable/references/sable_pixel_reference_style.png is the official primary Style 4 target as of 2026-07-08.",
    "Keep Sable body-first and readable. Void-crystal fracture VFX must be compact, attached, and supportive of the body animation.",
    "Generate and judge the full-rebuild-v3 pack as 39 preview-only clips: 9 base/reaction clips, 15 normals, and 15 specials.",
    "The specials remain 5 families with 3 clear strength variants each: Void Shard, Phase Lunge, Void Anchor, Ground Rift, and Vertical Phase.",
    "Reject the whole batch if later clips lose pixel detail, simplify the suit, change face/hair, drift body scale, or make VFX look pasted on.",
    "Brief source preserved at assets/characters/sable/briefs/v20260627-012225/brief.md. Review and fold exact identity details into this spec before approval."
  ],
  "gameplayLock": {
    "status": "existing_playable_mvp",
    "doNotChange": true,
    "specialSystem": "full_15_special_family_standard",
    "specialFamilies": {
      "neutral": "Void Shard light/medium/heavy",
      "forward": "Phase Lunge light/medium/heavy",
      "back": "Void Anchor light/medium/heavy",
      "down": "Ground Rift light/medium/heavy",
      "up": "Vertical Phase light/medium/heavy"
    },
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
  "animationRestart": {
    "stage": "sable_style4_full_rebuild_v3",
    "queueStage": "full-rebuild-v3",
    "status": "full_39_clip_queue_started_preview_only",
    "releaseStatus": "wip_delayed",
    "previewStatus": "animation_rebuild_required",
    "approvedForLiveRoster": false,
    "primaryReference": "assets/characters/sable/references/sable_pixel_reference_style.png",
    "preservedPreviousPrimary": "assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png",
    "coverage": {
      "baseReaction": 9,
      "normals": 15,
      "specials": 15,
      "totalCoreClips": 39
    },
    "targetClips": [
      "idle",
      "walk_forward",
      "walk_backward",
      "jump",
      "crouch",
      "block",
      "hit_stun",
      "knockdown",
      "getup",
      "stand_light",
      "stand_medium",
      "stand_heavy",
      "crouch_light",
      "crouch_medium",
      "crouch_heavy",
      "jump_light",
      "jump_medium",
      "jump_heavy",
      "forward_light",
      "forward_medium",
      "forward_heavy",
      "back_light",
      "back_medium",
      "back_heavy",
      "neutral_special_light",
      "neutral_special_medium",
      "neutral_special_heavy",
      "forward_special_light",
      "forward_special_medium",
      "forward_special_heavy",
      "back_special_light",
      "back_special_medium",
      "back_special_heavy",
      "down_special_light",
      "down_special_medium",
      "down_special_heavy",
      "up_special_light",
      "up_special_medium",
      "up_special_heavy"
    ],
    "pipeline": "key poses -> in-betweens -> assembled spritesheet -> SpriteForge validation -> preview approval",
    "noLivePromotionUntil": "GAME_READY"
  },
  "lock": {
    "status": "draft_locked",
    "createdAt": "2026-06-27T00:00:00.000Z",
    "updatedAt": "2026-07-08T00:00:00.000Z",
    "requiresHumanApproval": true
  },
  "references": [
    {
      "path": "assets/characters/sable/references/v20260627-012225/reference.png",
      "ingestedAt": "2026-06-27T05:22:25.911Z"
    },
    {
      "path": "assets/characters/sable/references/sable_pixel_reference_style.png",
      "ingestedAt": "2026-07-08T00:00:00.000Z",
      "role": "primary_official_style4_character_reference"
    },
    {
      "path": "assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png",
      "ingestedAt": "2026-07-08T00:00:00.000Z",
      "role": "preserved_previous_primary_reference_do_not_delete"
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


## Safety Rules

- Do not redesign the character.
- Do not change skin tone, face family, hair identity, outfit silhouette, palette, or power language.
- Body readability comes before VFX.
- Large VFX may exist only if the body remains visible and centered.
- Produce candidate art only. These frames are not approved for live roster use until validation passes.


---

# Sprite Clip Prompt: sable / stand_light

Use the Style 4 HD pixel anime fighter standard plus the character-specific redo style lock. For Sable, the pixel reference style is the exact game target, and the current preview pack must maintain the same crisp pixel-art detail level.

Clip: `stand_light`
Subject: `Sable` only
Category: `normal`
Frame count: `8`
FPS target: `14`
Loop: `false`
Canvas: `448x448` per frame
Facing: `right`
BaselineY: `382`

## Motion Direction

Create exactly 8 frames for `stand_light`.
Show Sable only. Do not include any other character, prop character, weapon, UI card, title, logo, or background scene.

The result must be:

- one horizontal strip sized `3584x448`
- exactly 8 equal cells, each `448x448`
- no grid layout, no second row, no stacked layout, and no visible cell borders

Every frame must keep the same character scale and identity. Do not include text, labels, borders, background, floor, props, or camera framing marks.

## Character Lock

Display name: Sable
Role: Playable WIP fighter; Style 4 full-rebuild-v3 visual restart lock only
Body type: Black female fighter with crisp finished pixel-art proportions, athletic elegant silhouette, long readable limbs, and consistent body scale across every animation
Skin tone: warm dark brown skin tone from the pixel reference style sheet
Hair: short tight black coils with silver/lavender bead-like highlights, rounded curl clusters, no long hair and no hair-as-weapon behavior
Face: stern focused fighter face with silver eyes, readable brows, lips, and facial structure at sprite scale
Outfit: dark navy-black fitted bodysuit with readable gold/silver seam lines, angular paneling, high collar, gloves, boots, and bright pixel rim highlights
Accessories: obsidian forearm wraps, void-crystal fracture accents around forearms/hands
VFX: controlled void-crystal fracture energy, black/violet/silver glassy shard wraps and compact fracture bursts; VFX supports the body and never replaces it
Forbidden: do not redesign Sable, do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing, do not add weapons, do not give Sable long hair, do not add a white coat, do not add a Lamuh gold pendant, do not use realistic, painterly, soft, 3D-rendered, or low-detail rendering for final sprites, do not let later clips lose suit texture, seam detail, hair detail, face readability, boots, gloves, or fracture accents, do not include text, labels, borders, watermarks, backgrounds, or frame grids, do not crop hair, hands, feet, face, or void-crystal accents, do not wire generated assets into the live roster automatically
Palette: skin: dark brown skin tone from reference; hair: black short tight coils with silver/lavender bead-like highlights; eyes: silver eyes; suitPrimary: dark navy-black bodysuit; suitAccent: readable gold/silver seam lines and angular paneling; forearmWraps: obsidian crystal wraps; vfx: black obsidian shards, violet glass, silver fracture lines, compact cool highlights; outline: crisp pixel-art fighting-game outline
Style notes: Sable is a delayed/WIP playable character; this spec locks visual identity for preview-only animation restart work.; The pixel reference sheet at assets/characters/sable/references/sable_pixel_reference_style.png is the official primary Style 4 target as of 2026-07-08.; Keep Sable body-first and readable. Void-crystal fracture VFX must be compact, attached, and supportive of the body animation.; Generate and judge the full-rebuild-v3 pack as 39 preview-only clips: 9 base/reaction clips, 15 normals, and 15 specials.; The specials remain 5 families with 3 clear strength variants each: Void Shard, Phase Lunge, Void Anchor, Ground Rift, and Vertical Phase.; Reject the whole batch if later clips lose pixel detail, simplify the suit, change face/hair, drift body scale, or make VFX look pasted on.; Brief source preserved at assets/characters/sable/briefs/v20260627-012225/brief.md. Review and fold exact identity details into this spec before approval.

## Redo Style Lock

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


## Clip Notes

full-rebuild-v3 normal attack. Fast standing light body-first poke with compact forearm crystal accent; clear startup, active frame, and recovery.

## Output Requirement

Return only the sprite sheet image. No caption text inside the image.
