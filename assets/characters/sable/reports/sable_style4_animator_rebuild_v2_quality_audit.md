# Sable Style 4 Animator Rebuild v2 Quality Audit

Final status: **REBUILD_READY_FOR_GENERATION**
Generated: 2026-06-30T17:27:12.445Z

## Missing Clips

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

## Prior Preview Issues To Fix

- Walk read as a skip instead of a grounded walk cycle.
- Jump and several attack/special clips changed character style from the early state clips.
- Some VFX-heavy clips had oversized effects, body smearing, or previous-frame debris.
- Crouch had placeholder-like effects.
- Earlier pack lost detail deeper into the animation set.
- Back and crouch attack coverage was missing from the corrected playtest harness.

## Clips With Special Similarity Risk

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

## Timing Metadata

- Timing metadata is present for every rebuild clip.

## Notes

- No generated art has been approved in this rebuild stage yet.
- The current approved preview pack remains the reference/fallback and is not overwritten.
- All 39 rebuild clips must be judged together for character consistency before any preview approval decision.
- If a provider is not configured, place generated sheets into the expected rebuild inbox folders and run resume-pack for this stage.
