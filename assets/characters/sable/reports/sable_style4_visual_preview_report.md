# Sable Style 4 Visual Preview Report

Generated: 2026-06-29T02:34:16.884Z

## PREVIEW_VISUAL_STATUS

Status: STYLE_RESET_REQUIRED

Redo the full non-anchor Sable preview pack in the correct anchor style instead of switching the first few clips to the mismatched majority style.

Preview manifest: assets/characters/sable/manifests/preview_animation_clips.json
Queue status: assets/characters/sable/reports/spriteforge_queue_status.json
Harness: assets/characters/sable/test/sable_style4_preview_pack_harness.html
Contact sheet: assets/characters/sable/reports/sable_style4_visual_contact_sheet.png

No live roster promotion was performed. No gameplay, movesets, balance, or runtime behavior were changed by this audit.

## Current Approved Anchors

- Approved anchors retained: idle, block, hitstun.
- Correct style references that still need cleanup: crouch and walk.
- Redo target: regenerate the rest of the pack to match this anchor style.

## Queue State

- Overall status: waiting_for_generation
- Current redo clip: crouch
- Approved preview clips: idle, block, hit_stun
- Approved live clips: none
- Redo required clips: crouch, walk_forward, jump, stand_light, stand_medium, stand_heavy, jump_light, jump_medium, jump_heavy, neutral_special_light, forward_special_light, forward_special_medium, forward_special_heavy, back_special_light, down_special_light, up_special_light

## Clip Findings

| Clip | Status | Reason |
| --- | --- | --- |
| idle | ANCHOR_APPROVED | Approved anchor retained. |
| crouch | REDO_REQUIRED | Correct style family, but redo to remove placeholder-like effects. |
| block | ANCHOR_APPROVED | Approved anchor retained. |
| hitstun | ANCHOR_APPROVED | Approved anchor retained. |
| walk | REDO_REQUIRED | Correct style family, but redo walk cycle because it reads like a skip. |
| jump | REDO_REQUIRED | Broken fragments and style reset required. |
| ground light | REDO_REQUIRED | Style drift and ground light VFX/motion do not match the anchor. |
| ground medium | REDO_REQUIRED | Style drift and ground medium VFX does not match the anchor. |
| ground heavy | REDO_REQUIRED | Style drift and ground heavy does not pass. |
| air light | REDO_REQUIRED | Style drift; air light does not pass. |
| air medium | REDO_REQUIRED | Style drift; air medium does not pass. |
| air heavy | REDO_REQUIRED | Style drift; air heavy does not pass. |
| Void Shard | REDO_REQUIRED | Void Shard VFX does not match the anchor. |
| Forward Light Phase Lunge | REDO_REQUIRED | Style drift from the correct Sable anchor. |
| Forward Medium Phase Lunge | REDO_REQUIRED | Style drift from the correct Sable anchor. |
| Forward Heavy Phase Lunge | REDO_REQUIRED | Style drift from the correct Sable anchor. |
| Void Anchor | REDO_REQUIRED | Style drift from the correct Sable anchor. |
| Ground Rift | REDO_REQUIRED | Style drift from the correct Sable anchor. |
| Vertical Phase | REDO_REQUIRED | Style drift from the correct Sable anchor. |

## Validation Commands

- npm.cmd --prefix tools/sprite-agent run typecheck: PASS.
- npm.cmd run sprite-agent -- status --character sable: PASS; queue is waiting_for_generation at crouch with idle/block/hitstun still preview-approved.
- npm.cmd run sprite-agent -- verify-pack --character sable --stage mvp: EXPECTED_FAILED_NEEDS_HUMAN because 16 clips are now human-rejected/missing from preview manifest.

## Manual Review Boundary

This report resets the preview pack direction. It does not generate replacement art by itself and does not approve live promotion. The next generation pass should start at crouch, preserve the correct Sable identity, remove placeholder-looking effects, fix the walk cycle, and regenerate all attacks/specials to match the anchor style.
