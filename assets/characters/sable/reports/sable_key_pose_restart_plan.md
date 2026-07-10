# Sable Key-Pose Restart Plan

Date: 2026-07-03
Character: Sable
Status: active. `full-rebuild-v3` was queued on 2026-07-08 as a preview-only 39-core-clip restart.

## Goal

Rebuild Sable's animation pack with fighting-game readability first. Future Sable production should use:

`key poses -> in-betweens -> assembled spritesheet -> SpriteForge validation -> preview approval`

No live promotion until the pack reaches `GAME_READY`.

Current active SpriteForge stage: `full-rebuild-v3`.

## Coverage Lock

Sable's future restart must keep the full 39-core-clip target:

- 9 base/reaction clips: `idle`, `walk_forward`, `walk_backward`, `jump`, `crouch`, `block`, `hit_stun`, `knockdown`, `getup`.
- 15 normals: `stand_light`, `stand_medium`, `stand_heavy`, `crouch_light`, `crouch_medium`, `crouch_heavy`, `jump_light`, `jump_medium`, `jump_heavy`, `forward_light`, `forward_medium`, `forward_heavy`, `back_light`, `back_medium`, `back_heavy`.
- 15 specials: 5 special families with Light/Medium/Heavy variants.

Sable's special families:

- Neutral specials: Void Shard L/M/H.
- Forward specials: Phase Lunge L/M/H.
- Back specials: Void Anchor L/M/H.
- Down specials: Ground Rift L/M/H.
- Up specials: Vertical Phase L/M/H.

Do not treat the specials as 15 unrelated random moves. Each L/M/H variant must share a family identity while differing clearly through startup speed, range, body commitment, active pose, VFX size, recovery, risk/reward, silhouette intensity, and gameplay read.

Every special must pass the smoothness gate, uniqueness gate, hit clarity gate, startup/active/recovery metadata, preview harness visibility, stable baseline/scale validation, and no near-duplicate L/M/H variant check.

## Workflow

1. **Key-pose lock**
   - Use the approved Sable visual design and side-view style lock.
   - Create readable contact sheets of the strongest poses first.
   - Do not start in-betweens until key poses pass identity and readability review.

2. **Base movement key pose sheets**
   - Idle.
   - Walk forward and walk backward.
   - Dash / phase dash.
   - Crouch / low stance.
   - Jump, fall, landing, and air drift.
   - Block / guard.
   - Hit stun, knockdown, getup, and recovery.

3. **Normal attack key pose sheets**
   - Standing light, medium, heavy.
   - Crouching light, medium, heavy.
   - Forward light, medium, heavy.
   - Back light, medium, heavy.
   - Jump light, medium, heavy.
   - Confirm anticipation, strike, hit frame, follow-through, and recovery readability before in-betweens.

4. **Special family key pose sheets**
   - Neutral special family: Void Shard L/M/H.
   - Forward special family: Phase Lunge L/M/H.
   - Back special family: Void Anchor L/M/H.
   - Down special family: Ground Rift L/M/H.
   - Up special family: Vertical Phase L/M/H.
   - Ultimate / super family only after core movement, normals, and specials read clearly.

5. **In-between generation**
   - Generate in-betweens from approved key poses only.
   - Preserve body scale, face, skin tone, hair, outfit, palette, and silhouette.
   - Keep VFX separate when large effects would hide the body.

6. **Assembled spritesheet**
   - Assemble transparent runtime strips or sheets from approved key poses and in-betweens.
   - Preserve the runtime contract: 448x448 cells, right-facing source, baseline check, real alpha, no labels, no background.

7. **SpriteForge validation**
   - Run technical validation for dimensions, alpha, frame counts, baseline, and expected metadata.
   - Run visual consistency review against the approved Sable design lock.
   - Reject rows that are missing, choppy, unreadable, identity-drifted, or VFX-only.

8. **Preview harness check**
   - Test the pack in the Sable preview harness first.
   - Confirm every movement, normal, special, reaction, knockdown, and getup visibly differs from idle/walk placeholders.
   - Keep dev preview access, but do not public-promote the pack.

9. **Approval gate**
   - Mark the future pack `GAME_READY` only after preview approval, runtime smoke, and hands-on visual QA pass.
   - Public roster promotion requires an explicit later approval.
