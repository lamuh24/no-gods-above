# Sable Style 4 Redo Next Step

Generated: 2026-06-29
Scope: preview-only art pipeline checkpoint.

## Decision

Redo the non-anchor Sable preview pack in the correct Sable style instead of switching the approved anchors to the mismatched majority style.

Approved preview anchors remain:

- `idle`
- `block`
- `hit_stun`

`crouch` and `walk_forward` remain useful visual-family references. `crouch` has now been cleaned and approved for preview; `walk_forward` is the next redo target because it reads like a skip.

## Current Queue

- Status: `waiting_for_generation`
- Current clip: `walk_forward`
- Approved preview clips: `idle`, `crouch`, `block`, `hit_stun`
- Approved live clips: none
- Live promotion: disabled

## Completed This Pass

Cleaned crouch source:

`assets/characters/sable/generated/inbox/crouch/v20260629-084954-style-reset-cleaned-crouch/zz_sable_crouch_style-reset-cleaned_prepared_8x1_448.png`

Approved normalized strip:

`assets/characters/sable/normalized/crouch/v20260629-085046/sable_crouch_normalized_strip.png`

SpriteForge validation, normalization, visual score, smoke, export, and preview-only approval passed for `crouch`.

## Crouch Prompt

Latest prompt:

`assets/characters/sable/prompts/outbox/crouch/latest_crouch_prompt.md`

Trace copy:

`assets/characters/sable/prompts/outbox/crouch/20260628-230239_style_reset_crouch_prompt.md`

The prompt requires a clean 8-frame `3584x448` transparent strip, keeps Sable grounded on baselineY `382`, locks the approved idle/block/hitstun identity, and rejects placeholder effects, detached debris, frame bleed, duplicate body fragments, and out-of-frame poses.

## Next Manual Provider Target

Next clip:

`walk_forward`

Put the next generated walk candidate under:

`assets/characters/sable/generated/inbox/walk_forward/<new-run-folder>/`

Then run:

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable
```

or, for only this clip:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "walk_forward" --approval-policy previewAuto
```

## Safety

No gameplay, movesets, balance, runtime files, live roster assets, approved preview strips, or live roster manifests should be edited for this step.
