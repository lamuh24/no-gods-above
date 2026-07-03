# Sable Corrected Preview Schema Delta Report

Status: `DELTA_PROMPTS_READY`
Date: `2026-06-29`

## Summary

Sable's SpriteForge MVP preview schema has been corrected to use one neutral special, three forward specials, one back special, one down special, and one up special. Sable does not use the full 15-special structure.

The current preview manifest preserves the existing `19` approved clips and now reports `9` missing required normal clips.

Live roster promotion remains disabled. `approvedForLiveRoster` remains `false`.

## Existing Approved Clips

- `idle`
- `crouch`
- `block`
- `hit_stun`
- `walk_forward` (`walk`)
- `jump`
- `stand_light`
- `stand_medium`
- `stand_heavy`
- `jump_light`
- `jump_medium`
- `jump_heavy`
- `neutral_special_light` (Void Shard)
- `forward_special_light` (Forward Light Phase Lunge)
- `forward_special_medium` (Forward Medium Phase Lunge)
- `forward_special_heavy` (Forward Heavy Phase Lunge)
- `back_special_light` (Void Anchor)
- `down_special_light` (Ground Rift)
- `up_special_light` (Vertical Phase)

## Missing Required Clips

- `crouch_light`
- `crouch_medium`
- `crouch_heavy`
- `forward_light`
- `forward_medium`
- `forward_heavy`
- `back_light`
- `back_medium`
- `back_heavy`

## Removed / Non-Required Clips

These clips are not required for Sable's corrected MVP preview pack and should not be generated for this delta:

- `neutral_special_medium`
- `neutral_special_heavy`
- `back_special_medium`
- `back_special_heavy`
- `down_special_medium`
- `down_special_heavy`
- `up_special_medium`
- `up_special_heavy`

## Prompt Outputs

Latest prompts were generated only for the missing required clips:

- `assets/characters/sable/prompts/outbox/crouch_light/latest_crouch_light_prompt.md`
- `assets/characters/sable/prompts/outbox/crouch_medium/latest_crouch_medium_prompt.md`
- `assets/characters/sable/prompts/outbox/crouch_heavy/latest_crouch_heavy_prompt.md`
- `assets/characters/sable/prompts/outbox/forward_light/latest_forward_light_prompt.md`
- `assets/characters/sable/prompts/outbox/forward_medium/latest_forward_medium_prompt.md`
- `assets/characters/sable/prompts/outbox/forward_heavy/latest_forward_heavy_prompt.md`
- `assets/characters/sable/prompts/outbox/back_light/latest_back_light_prompt.md`
- `assets/characters/sable/prompts/outbox/back_medium/latest_back_medium_prompt.md`
- `assets/characters/sable/prompts/outbox/back_heavy/latest_back_heavy_prompt.md`

## Delta Queue Command

Run only this missing delta after placing/generated outputs are ready:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch_light,crouch_medium,crouch_heavy,forward_light,forward_medium,forward_heavy,back_light,back_medium,back_heavy" --approval-policy previewAuto --provider manual
```

## Status Caveat

`npm.cmd run sprite-agent -- status --character sable` currently reads the last custom 19-clip queue status, so it still reports `complete`. The corrected MVP source of truth is `assets/characters/sable/manifests/preview_animation_clips.json`, which now reports `19` approved preview clips and `9` missing clips after `npm.cmd run sprite-agent -- export --character sable --stage mvp`.

## Safety

- Existing approved preview clips were preserved.
- No prohibited medium/heavy neutral, back, down, or up special variants were queued.
- No generated image candidates from the interrupted pre-correction step were imported into the repo.
- No live roster assets were modified.
- No gameplay, balance, moveset, or runtime behavior changes were made.
