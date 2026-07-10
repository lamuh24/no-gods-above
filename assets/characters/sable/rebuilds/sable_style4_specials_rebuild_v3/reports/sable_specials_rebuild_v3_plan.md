# Sable Specials Rebuild V3 Plan

Generated: 2026-07-08
Character: `sable`
Stage folder: `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3`
SpriteForge stage: `specials-rebuild-v3`
Status: preview-only prompts prepared; waiting for generation
Approved for live roster: no

## Reference Lock

- Primary reference: `assets/characters/sable/references/sable_pixel_reference_style.png`
- Source copied from: `C:\Users\qchee\Downloads\sable pixel reference style.png`
- Previous primary preserved at: `assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png`
- Old Sable animation packs remain preserved and archived as failed/WIP quality candidates.

## Pipeline

Future production should use:

1. Key poses
2. In-betweens
3. Assembled spritesheet
4. SpriteForge validation
5. Preview approval

No generated v3 art has been created in this setup pass. Do not promote live until `GAME_READY`.

## Clip Targets

| Clip | Family | Variant | Frames | Strip | Prompt |
| --- | --- | --- | ---: | --- | --- |
| `neutral_special_light` | Void Shard | light | 12 | `5376x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/neutral_special_light/latest_neutral_special_light_prompt.md` |
| `neutral_special_medium` | Void Shard | medium | 14 | `6272x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/neutral_special_medium/latest_neutral_special_medium_prompt.md` |
| `neutral_special_heavy` | Void Shard | heavy | 16 | `7168x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/neutral_special_heavy/latest_neutral_special_heavy_prompt.md` |
| `forward_special_light` | Phase Lunge | light | 12 | `5376x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/forward_special_light/latest_forward_special_light_prompt.md` |
| `forward_special_medium` | Phase Lunge | medium | 14 | `6272x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/forward_special_medium/latest_forward_special_medium_prompt.md` |
| `forward_special_heavy` | Phase Lunge | heavy | 16 | `7168x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/forward_special_heavy/latest_forward_special_heavy_prompt.md` |
| `back_special_light` | Void Anchor | light | 12 | `5376x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/back_special_light/latest_back_special_light_prompt.md` |
| `back_special_medium` | Void Anchor | medium | 14 | `6272x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/back_special_medium/latest_back_special_medium_prompt.md` |
| `back_special_heavy` | Void Anchor | heavy | 16 | `7168x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/back_special_heavy/latest_back_special_heavy_prompt.md` |
| `down_special_light` | Ground Rift | light | 12 | `5376x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/down_special_light/latest_down_special_light_prompt.md` |
| `down_special_medium` | Ground Rift | medium | 14 | `6272x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/down_special_medium/latest_down_special_medium_prompt.md` |
| `down_special_heavy` | Ground Rift | heavy | 16 | `7168x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/down_special_heavy/latest_down_special_heavy_prompt.md` |
| `up_special_light` | Vertical Phase | light | 12 | `5376x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/up_special_light/latest_up_special_light_prompt.md` |
| `up_special_medium` | Vertical Phase | medium | 14 | `6272x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/up_special_medium/latest_up_special_medium_prompt.md` |
| `up_special_heavy` | Vertical Phase | heavy | 16 | `7168x448` | `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/prompts/up_special_heavy/latest_up_special_heavy_prompt.md` |

## Validation Gates

- Smoothness gate
- Uniqueness gate
- Hit clarity gate
- Startup/active/recovery metadata gate
- Preview harness visibility gate
- Stable baseline/scale validation
- No near-duplicate L/M/H variants
- No live promotion until `GAME_READY`

## Start Command

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --stage specials-rebuild-v3 --clips "neutral_special_light,neutral_special_medium,neutral_special_heavy,forward_special_light,forward_special_medium,forward_special_heavy,back_special_light,back_special_medium,back_special_heavy,down_special_light,down_special_medium,down_special_heavy,up_special_light,up_special_medium,up_special_heavy" --approval-policy previewAuto --skip-approved
```

## Resume And Verify

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable --stage specials-rebuild-v3
npm.cmd run sprite-agent -- verify-pack --character sable --stage specials-rebuild-v3
```
