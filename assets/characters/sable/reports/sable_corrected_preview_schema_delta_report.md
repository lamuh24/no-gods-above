# Sable Corrected Preview Schema Delta Report

Status: `SUPERSEDED_BY_15_SPECIAL_STANDARD`
Date: `2026-06-29`
Superseded: `2026-07-08`

## Summary

This report is historical. It documented a temporary Sable MVP preview schema that used one neutral special, three forward specials, one back special, one down special, and one up special.

Final design decision as of `2026-07-08`: every serious playable No Gods Above character should support the full 15-special system. Sable's future animator-rebuild-v2/key-pose restart target remains 39 core clips: 9 base/reaction clips, 15 normals, and 15 specials.

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

## Previously Removed / Now Required For Serious Rebuilds

These clips were treated as non-required in the historical MVP delta only. They are required for Sable's serious-playable rebuild planning:

- `neutral_special_medium`
- `neutral_special_heavy`
- `back_special_medium`
- `back_special_heavy`
- `down_special_medium`
- `down_special_heavy`
- `up_special_medium`
- `up_special_heavy`

Sable's 15-special family map is now:

- Neutral specials: Void Shard L/M/H.
- Forward specials: Phase Lunge L/M/H.
- Back specials: Void Anchor L/M/H.
- Down specials: Ground Rift L/M/H.
- Up specials: Vertical Phase L/M/H.

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
- The historical MVP delta did not queue medium/heavy neutral, back, down, or up special variants.
- That reduced-special rule is no longer the serious-playable standard.
- No generated image candidates from the interrupted pre-correction step were imported into the repo.
- No live roster assets were modified.
- No gameplay, balance, moveset, or runtime behavior changes were made.
