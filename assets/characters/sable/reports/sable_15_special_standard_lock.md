# Sable 15-Special Standard Lock

Date: 2026-07-08
Character: Sable
Status: planning/schema/report update only

## Decision

Every serious playable No Gods Above character should support the full 15-special system. Do not reduce serious playable fighters to only five specials.

Sable remains planned as a full 39-core-clip rebuild target:

- 9 base/reaction clips.
- 15 normals.
- 15 specials.

This report supersedes the older Sable MVP-era reduced-special planning notes for serious-playable/release planning. Existing MVP/dev-preview data is preserved and this update does not change live gameplay behavior.

## Required Normals

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

## Required Specials

Specials are five family identities with three strength variants, not 15 unrelated moves:

- Void Shard: `neutral_special_light`, `neutral_special_medium`, `neutral_special_heavy`
- Phase Lunge: `forward_special_light`, `forward_special_medium`, `forward_special_heavy`
- Void Anchor: `back_special_light`, `back_special_medium`, `back_special_heavy`
- Ground Rift: `down_special_light`, `down_special_medium`, `down_special_heavy`
- Vertical Phase: `up_special_light`, `up_special_medium`, `up_special_heavy`

Each L/M/H variant must share a family identity but differ clearly through startup speed, range, body commitment, active pose, VFX size, recovery, risk/reward, silhouette intensity, and gameplay read.

## Base / Reaction Clips

- `idle`
- `walk_forward`
- `walk_backward`
- `jump`
- `crouch`
- `block`
- `hit_stun`
- `knockdown`
- `getup`

Ultimate/cinematic clips should be required for release-ready characters if supported by the character/game pipeline.

## Quality Gates

Every special must pass:

- smoothness gate
- uniqueness gate
- hit clarity gate
- startup/active/recovery metadata
- preview harness visibility
- stable baseline/scale validation
- no near-duplicate L/M/H variants

## Safety

- Do not restart generation in this pass.
- Do not promote anything live.
- Do not modify gameplay balance.
- Do not overwrite live roster assets.
- Do not delete Sable assets.
- Do not commit unless explicitly asked.
