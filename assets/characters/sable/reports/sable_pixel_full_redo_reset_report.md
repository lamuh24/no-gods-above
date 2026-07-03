# Sable Pixel Full Redo Reset Report

Status: `RESET_READY_FOR_FULL_PACK_REDO`
Date: `2026-06-29`

## Summary

Sable has been reset for a full MVP sprite-sheet redo using the exact pixel reference style at:

- `assets/characters/sable/references/sable_pixel_reference_style.png`
- `assets/characters/sable/references/sable_pixel_style_redo_lock.md`

The previous Style 4 preview pack was revoked for preview and should be treated as temporary playtest material only. No live roster promotion happened.

## Reset Actions

- Revoked preview approval for all 19 Sable MVP clips.
- Refreshed `assets/characters/sable/manifests/preview_animation_clips.json` to `0` approved preview clips and `19` missing clips.
- Moved stale generated inbox contents into quarantine instead of hard-deleting them:
  - `assets/characters/sable/generated/quarantine/pixel_reference_full_redo_reset/20260629-131818/inbox/`
- Left the active drop folders empty:
  - `assets/characters/sable/generated/inbox/<clip>/`
- Wrote fresh prompt files for all 19 MVP clips under:
  - `assets/characters/sable/prompts/outbox/<clip>/latest_<clip>_prompt.md`
- Updated SpriteForge prompt templates and Sable spec so every new prompt includes the pixel-reference redo lock.

## Required Redo Clips

- `idle`
- `crouch`
- `block`
- `hit_stun`
- `walk_forward`
- `jump`
- `stand_light`
- `stand_medium`
- `stand_heavy`
- `jump_light`
- `jump_medium`
- `jump_heavy`
- `neutral_special_light`
- `forward_special_light`
- `forward_special_medium`
- `forward_special_heavy`
- `back_special_light`
- `down_special_light`
- `up_special_light`

## New Output Drop Zone

Place each replacement sheet in a fresh run folder under:

```text
assets/characters/sable/generated/inbox/<clip>/<new-run-folder>/
```

Each sheet must be transparent PNG/WebP, one horizontal strip, `448x448` per frame, with the exact expected strip width for the clip.

## Next Commands

After new sheets are dropped:

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable
```

or:

```powershell
npm.cmd run sprite-agent -- run-pack --character sable --stage mvp --approval-policy previewAuto --redo-approved --auto-verify
```

## Safety

- Live roster assets were not promoted.
- `approvedForLiveRoster` remains `false`.
- Gameplay, balance, movesets, and runtime files were not intentionally modified by this reset.
- Old normalized outputs remain only as rejected audit history; they are no longer exported into the active preview manifest.
