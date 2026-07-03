# Sable Style 4 Animator Rebuild v2 Plan

Status: **REBUILD_READY_FOR_GENERATION**
Generated: 2026-06-30T17:27:12.445Z

This is a preview-only, isolated rebuild plan. It does not promote Sable to the live roster and does not overwrite the current approved preview pack.

## Commands

- Run pack: `npm.cmd run sprite-agent -- run-pack --character sable --stage animator-rebuild-v2 --approval-policy previewAuto --skip-approved --auto-verify`
- Resume pack: `npm.cmd run sprite-agent -- resume-pack --character sable --stage animator-rebuild-v2`
- Verify pack: `npm.cmd run sprite-agent -- verify-pack --character sable --stage animator-rebuild-v2`
- Status: `npm.cmd run sprite-agent -- status --character sable`

## Existing Preview Clips For Reference Only

- back_special_light
- block
- crouch
- down_special_light
- forward_special_heavy
- forward_special_light
- forward_special_medium
- hit_stun
- idle
- jump
- jump_heavy
- jump_light
- jump_medium
- neutral_special_light
- stand_heavy
- stand_light
- stand_medium
- up_special_light
- walk_forward

## Clips To Regenerate

- idle
- walk_forward
- walk_backward
- jump
- crouch
- block
- hit_stun
- knockdown
- getup
- stand_light
- stand_medium
- stand_heavy
- crouch_light
- crouch_medium
- crouch_heavy
- jump_light
- jump_medium
- jump_heavy
- forward_light
- forward_medium
- forward_heavy
- back_light
- back_medium
- back_heavy
- neutral_special_light
- neutral_special_medium
- neutral_special_heavy
- forward_special_light
- forward_special_medium
- forward_special_heavy
- back_special_light
- back_special_medium
- back_special_heavy
- down_special_light
- down_special_medium
- down_special_heavy
- up_special_light
- up_special_medium
- up_special_heavy

## Clip Plan

| Clip | Frames | FPS | Prompt | Expected Output Folder |
| --- | ---: | ---: | --- | --- |
| idle | 8 | 8 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/idle/latest_idle_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/idle/ |
| walk_forward | 12 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/walk_forward/latest_walk_forward_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/walk_forward/ |
| walk_backward | 12 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/walk_backward/latest_walk_backward_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/walk_backward/ |
| jump | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/jump/latest_jump_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/jump/ |
| crouch | 8 | 8 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/crouch/latest_crouch_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/crouch/ |
| block | 8 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/block/latest_block_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/block/ |
| hit_stun | 8 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/hit_stun/latest_hit_stun_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/hit_stun/ |
| knockdown | 8 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/knockdown/latest_knockdown_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/knockdown/ |
| getup | 8 | 10 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/getup/latest_getup_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/getup/ |
| stand_light | 8 | 14 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/stand_light/latest_stand_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/stand_light/ |
| stand_medium | 10 | 13 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/stand_medium/latest_stand_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/stand_medium/ |
| stand_heavy | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/stand_heavy/latest_stand_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/stand_heavy/ |
| crouch_light | 8 | 14 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/crouch_light/latest_crouch_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/crouch_light/ |
| crouch_medium | 10 | 13 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/crouch_medium/latest_crouch_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/crouch_medium/ |
| crouch_heavy | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/crouch_heavy/latest_crouch_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/crouch_heavy/ |
| jump_light | 8 | 14 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/jump_light/latest_jump_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/jump_light/ |
| jump_medium | 10 | 13 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/jump_medium/latest_jump_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/jump_medium/ |
| jump_heavy | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/jump_heavy/latest_jump_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/jump_heavy/ |
| forward_light | 8 | 14 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_light/latest_forward_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_light/ |
| forward_medium | 10 | 13 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_medium/latest_forward_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_medium/ |
| forward_heavy | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_heavy/latest_forward_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_heavy/ |
| back_light | 8 | 14 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_light/latest_back_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_light/ |
| back_medium | 10 | 13 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_medium/latest_back_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_medium/ |
| back_heavy | 12 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_heavy/latest_back_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_heavy/ |
| neutral_special_light | 14 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/neutral_special_light/latest_neutral_special_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/neutral_special_light/ |
| neutral_special_medium | 16 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/neutral_special_medium/latest_neutral_special_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/neutral_special_medium/ |
| neutral_special_heavy | 18 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/neutral_special_heavy/latest_neutral_special_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/neutral_special_heavy/ |
| forward_special_light | 14 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_special_light/latest_forward_special_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_special_light/ |
| forward_special_medium | 16 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_special_medium/latest_forward_special_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_special_medium/ |
| forward_special_heavy | 18 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/forward_special_heavy/latest_forward_special_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/forward_special_heavy/ |
| back_special_light | 14 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_special_light/latest_back_special_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_special_light/ |
| back_special_medium | 16 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_special_medium/latest_back_special_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_special_medium/ |
| back_special_heavy | 18 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/back_special_heavy/latest_back_special_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/back_special_heavy/ |
| down_special_light | 14 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/down_special_light/latest_down_special_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/down_special_light/ |
| down_special_medium | 16 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/down_special_medium/latest_down_special_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/down_special_medium/ |
| down_special_heavy | 18 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/down_special_heavy/latest_down_special_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/down_special_heavy/ |
| up_special_light | 14 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/up_special_light/latest_up_special_light_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/up_special_light/ |
| up_special_medium | 16 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/up_special_medium/latest_up_special_medium_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/up_special_medium/ |
| up_special_heavy | 18 | 12 | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/prompts/up_special_heavy/latest_up_special_heavy_prompt.md | assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/generated/inbox/up_special_heavy/ |

## Guardrails

- Do not touch gameplay, balance, movesets, runtime behavior, live roster assets, or live promotion.
- Do not overwrite `assets/characters/sable/preview_pack/sable_style4_mvp_preview_pack/`.
- Generated art for this rebuild belongs under `assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2/` first.
- Current preview clips may be used as failure references only, not as source art to mix into the new pack.
