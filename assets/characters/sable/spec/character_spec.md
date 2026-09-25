# SpriteForge Character Spec - Sable

Status: **draft_locked**
Requires human approval: **yes**

## Identity Lock

Display name: Sable
Role: Playable WIP fighter; Style 4 full-rebuild-v3 visual restart lock only
Body type: dark-skinned female fighter with mature HD pixel anime fighter proportions and an elegant acrobatic 2.5D fighting-game silhouette
Skin tone: dark skin, preserved from the official Sable reference sheet
Hair: short curled hair, tight rounded curls, no long hair and no hair-as-weapon behavior
Face: focused elegant fighter face with silver eyes, readable brows, lips, and facial structure in sprite scale
Outfit: sleek navy-black bodysuit with subtle silver/obsidian panel lines and a clean athletic silhouette
Accessories: obsidian forearm wraps, void-crystal fracture accents around forearms/hands
VFX: controlled void-crystal fracture energy, dark obsidian shards with silver-violet fracture highlights; VFX supports the body and never replaces it
Forbidden: do not redesign Sable, do not change Sable gameplay, moveset, role, attacks, abilities, combat values, or input routing, do not add weapons, do not give Sable long hair, do not add a white coat, do not add a Lamuh gold pendant, do not use realistic or painterly rendering for final sprites, do not include text, labels, borders, watermarks, backgrounds, or frame grids, do not crop hair, hands, feet, face, or void-crystal accents, do not wire generated assets into the live roster automatically
Palette: skin: dark brown skin tone from reference; hair: black short curled hair with subtle silver highlights only where present in the lock; eyes: silver eyes; suitPrimary: navy-black bodysuit; suitAccent: subtle silver/obsidian panel lines; forearmWraps: obsidian crystal wraps; vfx: black obsidian shards, silver fracture lines, restrained violet/cool highlights; outline: crisp dark fighting-game sprite outline
Style notes: Sable is a delayed/WIP playable character; this spec locks visual identity for preview-only animation restart work.; The official primary reference is assets/characters/sable/references/sable_pixel_reference_style.png as of 2026-07-08.; Keep Sable body-first and readable. Void-crystal fracture VFX must support the body animation.; The full-rebuild-v3 target is 39 preview-only core clips: 9 base/reaction clips, 15 normals, and 15 specials.; The specials remain 5 special families with 3 strength variants each: Void Shard, Phase Lunge, Void Anchor, Ground Rift, and Vertical Phase.; Reject the batch if clips lose pixel detail, simplify the suit, change face/hair, drift body scale, make VFX look pasted on, or reduce L/M/H variants to near-duplicates.

## Sprite Rules

- Frame: 448x448
- BaselineY: 382
- Facing: right
- Style: No Gods Above Style 4 HD pixel anime fighter sprite
- Transparent background: required
- No text, labels, borders, or background

## References

- assets/characters/sable/references/v20260627-012225/reference.png (2026-06-27T05:22:25.911Z)
- assets/characters/sable/references/sable_pixel_reference_style.png (2026-07-08T00:00:00.000Z, primary official Style 4 character reference)
- assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png (2026-07-08T00:00:00.000Z, preserved previous primary reference; do not delete)

## Animation Restart

- Stage: `sable_style4_full_rebuild_v3`
- Queue stage: `full-rebuild-v3`
- Status: full 39-clip preview-only queue started; no live promotion.
- Release status: `wip_delayed`
- Preview status: `animation_rebuild_required`
- Approved for live roster: false
- Required target: 39 core clips total: 9 base/reaction clips, 15 normals, and 15 specials grouped as 5 families with light/medium/heavy variants.
- Movement/reaction clips: `idle`, `walk_forward`, `walk_backward`, `jump`, `crouch`, `block`, `hit_stun`, `knockdown`, `getup`.
- Normal attack clips: `stand_light`, `stand_medium`, `stand_heavy`, `crouch_light`, `crouch_medium`, `crouch_heavy`, `jump_light`, `jump_medium`, `jump_heavy`, `forward_light`, `forward_medium`, `forward_heavy`, `back_light`, `back_medium`, `back_heavy`.
- Special attack clips: `neutral_special_light`, `neutral_special_medium`, `neutral_special_heavy`, `forward_special_light`, `forward_special_medium`, `forward_special_heavy`, `back_special_light`, `back_special_medium`, `back_special_heavy`, `down_special_light`, `down_special_medium`, `down_special_heavy`, `up_special_light`, `up_special_medium`, `up_special_heavy`.
- Pipeline: key poses -> in-betweens -> assembled spritesheet -> SpriteForge validation -> preview approval.

## Briefs

- assets/characters/sable/briefs/v20260627-012225/brief.md (2026-06-27T05:22:25.911Z)
