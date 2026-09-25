# Sable Promotion Readiness Report

Generated: 2026-06-28T20:08:49.6955379-04:00  
Character: `sable`  
Stage: `mvp`

## PREVIEW_PACK_STATUS

Status: `COMPLETE_PREVIEW_PACK`

- Preview pack path: `assets/characters/sable/preview_pack/sable_style4_mvp_preview_pack/`
- Required clips: 19
- Preview pack strip files: 19
- Preview manifest clips: 19
- Queue completed clips: 19
- Queue approved preview clips: 19
- Failed clips: none
- Remaining clips: none
- Smoke test: passed
- Idle preservation: passed

The preview manifest at `assets/characters/sable/manifests/preview_animation_clips.json` references approved normalized strips for all 19 required Sable MVP clips:

| Clip | Preview normalized strip |
| --- | --- |
| idle | `assets/characters/sable/normalized/idle/v20260627-015723/sable_idle_normalized_strip.png` |
| crouch | `assets/characters/sable/normalized/crouch/v20260628-180804/sable_crouch_normalized_strip.png` |
| block | `assets/characters/sable/normalized/block/v20260628-181327/sable_block_normalized_strip.png` |
| hitstun | `assets/characters/sable/normalized/hit_stun/v20260628-182024/sable_hit_stun_normalized_strip.png` |
| walk | `assets/characters/sable/normalized/walk_forward/v20260628-182538/sable_walk_forward_normalized_strip.png` |
| jump | `assets/characters/sable/normalized/jump/v20260628-182735/sable_jump_normalized_strip.png` |
| ground light | `assets/characters/sable/normalized/stand_light/v20260628-183526/sable_stand_light_normalized_strip.png` |
| ground medium | `assets/characters/sable/normalized/stand_medium/v20260628-183857/sable_stand_medium_normalized_strip.png` |
| ground heavy | `assets/characters/sable/normalized/stand_heavy/v20260628-184106/sable_stand_heavy_normalized_strip.png` |
| air light | `assets/characters/sable/normalized/jump_light/v20260628-184342/sable_jump_light_normalized_strip.png` |
| air medium | `assets/characters/sable/normalized/jump_medium/v20260628-184541/sable_jump_medium_normalized_strip.png` |
| air heavy | `assets/characters/sable/normalized/jump_heavy/v20260628-184909/sable_jump_heavy_normalized_strip.png` |
| Void Shard | `assets/characters/sable/normalized/neutral_special_light/v20260628-185500/sable_neutral_special_light_normalized_strip.png` |
| Forward Light Phase Lunge | `assets/characters/sable/normalized/forward_special_light/v20260628-193427/sable_forward_special_light_normalized_strip.png` |
| Forward Medium Phase Lunge | `assets/characters/sable/normalized/forward_special_medium/v20260628-194401/sable_forward_special_medium_normalized_strip.png` |
| Forward Heavy Phase Lunge | `assets/characters/sable/normalized/forward_special_heavy/v20260628-194718/sable_forward_special_heavy_normalized_strip.png` |
| Void Anchor | `assets/characters/sable/normalized/back_special_light/v20260628-195232/sable_back_special_light_normalized_strip.png` |
| Ground Rift | `assets/characters/sable/normalized/down_special_light/v20260628-195635/sable_down_special_light_normalized_strip.png` |
| Vertical Phase | `assets/characters/sable/normalized/up_special_light/v20260628-200015/sable_up_special_light_normalized_strip.png` |

## LIVE_PROMOTION_STATUS

Status: `NOT_PROMOTED_BLOCKED_BY_PREEXISTING_LIVE_DIRTINESS`

- `approvedLiveClips`: empty
- `approvedForLiveRoster`: false in the preview manifest
- `liveRosterWiring`: `disabled`
- No live promotion happened.
- SpriteForge preview output remains under `assets/characters/sable/`.
- No live roster assets were overwritten by this audit.

`verify-pack` reports `FAILED_NEEDS_HUMAN`, but the reason is live-runtime git dirtiness, not preview-pack failure.

## BLOCKERS

The following live-runtime files currently block clean promotion verification:

| Path | Git status | Assessment |
| --- | --- | --- |
| `NO_GODS_ABOVE/game.js` | `M` | Pre-existing before this audit; documented in `SESSION_CONTEXT.md`; not written by this audit. |
| `NO_GODS_ABOVE/index.html` | `M` | Pre-existing before this audit; documented in `SESSION_CONTEXT.md`; not written by this audit. |
| `NO_GODS_ABOVE/style.css` | `M` | Pre-existing before this audit; documented in `SESSION_CONTEXT.md`; not written by this audit. |
| `NO_GODS_ABOVE/assets/sprites/portraits/sable_select.png` | `??` | Pre-existing before this audit; documented in `SESSION_CONTEXT.md`; not written by this audit. |
| `NO_GODS_ABOVE/assets/sprites/sable_placeholder/` | `??` | Pre-existing before this audit; documented in `SESSION_CONTEXT.md`; not written by this audit. |

These blockers are separate from SpriteForge preview-pack success.

## SAFE_NEXT_ACTIONS

1. Review the completed preview pack visually before any live promotion.
2. Audit the dirty live-runtime files separately and decide whether to keep, stage, revert, or quarantine them.
3. After live-runtime dirtiness is resolved, rerun `npm.cmd run sprite-agent -- verify-pack --character sable --stage mvp`.
4. Do not promote Sable to the live roster until a separate live integration task is explicitly requested.
5. If promotion is approved later, stage only intentional SpriteForge preview-pack/report/manifest files and separately approved live-runtime changes.

## Validation

- `npm.cmd --prefix tools/sprite-agent run typecheck`: passed
- `npm.cmd run sprite-agent -- status --character sable`: passed; queue complete, failed none, remaining none
- `npm.cmd run sprite-agent -- verify-pack --character sable --stage mvp`: ran; `FAILED_NEEDS_HUMAN` due live-runtime dirty guardrail

