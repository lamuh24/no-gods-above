# Sable Full Rebuild V3 Plan

Generated: 2026-07-08
Character: `sable`
Stage folder: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3`
SpriteForge stage: `full-rebuild-v3`
Status: preview-only full animation restart
Approved for live roster: no

## Decision

Sable's active Style 4 restart is now the full 39-core-clip rebuild. The earlier `specials-rebuild-v3` lane remains preserved as special-only history, but it is no longer the complete target for today's Sable redo.

The production order should prioritize attacks first, then movement/reaction polish, but the queue and reports now include every required core animation:

- 9 base/reaction clips
- 15 normal attacks
- 15 specials

## Reference Lock

- Primary reference: `assets/characters/sable/references/sable_pixel_reference_style.png`
- Previous primary preserved: `assets/characters/sable/references/sable_pixel_reference_style_previous_primary_20260708.png`
- Visual target: approved Sable pixel reference sheet, not animator-rebuild-v2 and not the choppy special-only draft.

## Required Clips

Base/reaction:

- `idle`
- `walk_forward`
- `walk_backward`
- `jump`
- `crouch`
- `block`
- `hit_stun`
- `knockdown`
- `getup`

Normals:

- `stand_light`
- `stand_medium`
- `stand_heavy`
- `crouch_light`
- `crouch_medium`
- `crouch_heavy`
- `jump_light`
- `jump_medium`
- `jump_heavy`
- `forward_light`
- `forward_medium`
- `forward_heavy`
- `back_light`
- `back_medium`
- `back_heavy`

Specials:

- `neutral_special_light`
- `neutral_special_medium`
- `neutral_special_heavy`
- `forward_special_light`
- `forward_special_medium`
- `forward_special_heavy`
- `back_special_light`
- `back_special_medium`
- `back_special_heavy`
- `down_special_light`
- `down_special_medium`
- `down_special_heavy`
- `up_special_light`
- `up_special_medium`
- `up_special_heavy`

## Special Families

- Neutral specials: Void Shard L/M/H
- Forward specials: Phase Lunge L/M/H
- Back specials: Void Anchor L/M/H
- Down specials: Ground Rift L/M/H
- Up specials: Vertical Phase L/M/H

L/M/H variants must share family identity while differing clearly in startup, range, body commitment, active pose, VFX size, recovery, risk/reward, silhouette intensity, and gameplay read.

## Pipeline

Use:

1. Key poses
2. In-betweens
3. Assembled transparent spritesheet
4. SpriteForge validation
5. Preview harness approval

Do not promote live until `GAME_READY`.

## Start Command

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --stage full-rebuild-v3 --clips "idle,walk_forward,walk_backward,jump,crouch,block,hit_stun,knockdown,getup,stand_light,stand_medium,stand_heavy,crouch_light,crouch_medium,crouch_heavy,jump_light,jump_medium,jump_heavy,forward_light,forward_medium,forward_heavy,back_light,back_medium,back_heavy,neutral_special_light,neutral_special_medium,neutral_special_heavy,forward_special_light,forward_special_medium,forward_special_heavy,back_special_light,back_special_medium,back_special_heavy,down_special_light,down_special_medium,down_special_heavy,up_special_light,up_special_medium,up_special_heavy" --approval-policy previewAuto --skip-approved
```

## Resume And Verify

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable --stage full-rebuild-v3
npm.cmd run sprite-agent -- verify-pack --character sable --stage full-rebuild-v3
```

## Boundary

No live gameplay/runtime files should change during this animation-production pass. Do not wire generated sheets into `NO_GODS_ABOVE/assets`, do not add Sable to the public roster, do not alter combat balance, and do not delete previous Sable assets.
