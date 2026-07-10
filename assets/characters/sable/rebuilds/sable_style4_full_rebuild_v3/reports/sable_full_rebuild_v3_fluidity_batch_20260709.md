# Sable Full Rebuild V3 Fluidity Batch - 2026-07-09

## Decision Applied

Codex stopped the pre-standard `stand_heavy` repair path and applied `NO_GODS_ABOVE/docs/ANIMATION_FLUIDITY_STANDARD.md` to the active full-rebuild-v3 queue.

No jitter/offset safe variants were used for this batch. When a source sheet had fewer usable silhouettes than the previous target, the full-rebuild-v3 preview clip override was lowered instead of padding frames.

## Tooling Changes

- Removed the unsafe `pack_alpha_strip.mjs` repair helper from the active toolchain.
- Added `tools/sprite-agent/scripts/frame_scrub_report.mjs` as an audit-only frame-scrub/contact-sheet helper.
- Updated `tools/sprite-agent/scripts/prepare-codex-sheet.mjs` with optional `--scale-strategy global` so a clip can be normalized with one shared scale across all frames.

## Preview-Approved Under New Standard

| Clip | Frame Count | Source |
| --- | ---: | --- |
| `stand_heavy` | 8 | `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/stand_heavy/vzzzzzzzzz-safe352-8-final/sable_stand_heavy_8.png` |
| `crouch_light` | 7 | `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/crouch_light/vzzzzzzzzzz-global-safe352-7-final/sable_crouch_light_7.png` |
| `crouch_medium` | 8 | `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/crouch_medium/vzzzzzzzzzzzz-redraw02-global-safe352-8-final/sable_crouch_medium_8.png` |
| `crouch_heavy` | 8 | `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/crouch_heavy/vzzzzzzzzzzz-largest-global-safe336-8-final/sable_crouch_heavy_8.png` |
| `jump_light` | 7 | `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/jump_light/vzzzzzzzzzz-redraw02-global-safe336-7-final/sable_jump_light_7.png` |

Each clip has a numbered contact sheet and JSON/Markdown frame-scrub report under `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/reports/frame_scrub/<clip>/`.

## Rejected / Quarantined

`stand_light` and `stand_medium` were removed from preview approval because their prior candidates were produced before the 2026-07-09 fluidity standard and used the now-rejected safe-variant repair approach.

Their old generated inbox candidates were moved to:

- `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/quarantine/stand_light/v20260709-fluidity-standard-prestandard-inbox/`
- `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/quarantine/stand_medium/v20260709-fluidity-standard-prestandard-inbox/`

## Current Queue

- Approved preview clips: 5
- Waiting/missing output: 34 clips
- Approved for live roster: false
- Live gameplay/runtime changes: none

Next clip to rebuild under the new standard: `stand_light`.
