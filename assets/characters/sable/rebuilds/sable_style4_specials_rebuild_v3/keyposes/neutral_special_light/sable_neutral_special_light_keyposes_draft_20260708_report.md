# Sable Neutral Special Light Key-Pose Draft Report

Generated: 2026-07-08
Clip: `neutral_special_light`
Family: Void Shard
Variant: Light
Status: `draft_keyposes_started_not_production_ready`
Approved for live roster: no

## Outputs

- Built-in image generation source: `C:\Users\qchee\.codex\generated_images\019f2368-7eb6-7e60-8546-5d6d3b741d25\ig_0857080730516296016a4e902b05b48196b4c9d1ee688c13bf.png`
- Chroma draft: `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/keyposes/neutral_special_light/sable_neutral_special_light_keyposes_draft_20260708.png`
- Transparent key-pose draft: `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/keyposes/neutral_special_light/sable_neutral_special_light_keyposes_draft_20260708_alpha.png`
- Derived 12-frame draft strip: `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/draft_strips/neutral_special_light/sable_neutral_special_light_draft_strip_12x1_448_20260708.png`
- Draft strip report: `assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/draft_strips/neutral_special_light/sable_neutral_special_light_draft_strip_12x1_448_20260708_report.json`
- SpriteForge validation: `assets/characters/sable/reports/20260708-140514_neutral_special_light_validation_report.md`
- SpriteForge validation JSON: `assets/characters/sable/reports/20260708-140514_neutral_special_light_validation_report.json`

## What Worked

- Sable's identity is much closer to the approved 2026-07-08 reference: dark skin, short curled highlighted hair, navy-black bodysuit, silver/gold seams, and obsidian void-crystal wraps.
- The key-pose draft has a readable light Void Shard motion: ready, draw-in, active flick, compact impact, follow-through, return.
- Chroma removal produced an RGBA draft with transparent background.
- The derived draft strip matches the SpriteForge technical grid: 12 frames, `448x448` cells, horizontal strip, baseline near `382`.

## Current Blockers

- This is not a true in-betweened animation yet. It is derived from 6 key poses and contains held/duplicate frames.
- SpriteForge validation returned `manual_review_required` with `technicalStatus: warn`.
- The warning is `POSSIBLE_DUPLICATE_FRAMES`: 10 near-duplicate frame pairs were detected.
- Do not drop this into the production queue inbox as final art. Use it as a visual seed for true in-between generation or as a reference for the next generation pass.

## Next Step

Generate a true 12-frame `neutral_special_light` in-between strip from this key-pose direction, then place only the improved candidate in:

`assets/characters/sable/rebuilds/sable_style4_specials_rebuild_v3/generated/inbox/neutral_special_light/`

After that, run:

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable --stage specials-rebuild-v3
npm.cmd run sprite-agent -- verify-pack --character sable --stage specials-rebuild-v3
```
