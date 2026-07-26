# Swahili Moveset Goal V1 - Human Review Queue

Status: `ready_for_grouped_human_review`  
Candidate-only: `true`  
Deployable: `false`  

Review groups are independent. A blocked family does not stop decisions on another family. Concept approval authorizes candidate key-pose work only; it does not approve motion, timing, balance, roster promotion, or deployment.

## 1. Locomotion

- `crouch_to_standing` - `human_review_ready_candidate`
  - Gate: `awaiting_human_stance_transition_motion_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/stance-transitions-v1.status.json`
- `standing_to_crouch` - `human_review_ready_candidate`
  - Gate: `awaiting_human_stance_transition_motion_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/stance-transitions-v1.status.json`
- `turn_side_switch_compatibility` - `human_review_ready_candidate`
  - Gate: `awaiting_human_turn_side_switch_live_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/turn-side-switch-compatibility-v1.status.json`, `tools/nga-forge/production/characters/swahili/reports/animation-coverage-completion-v1/turn-side-switch-compatibility-v1/turn-side-switch-compatibility-v1.motion-review.md`
- `walk_forward` - `human_review_ready_candidate`
  - Gate: `awaiting_human_forward_walk_v2_motion_review`
  - Evidence: `NO_GODS_ABOVE/engine_v2/docs/swahili_sandbox/forward-walk-v2-live-review/REVIEW_SUMMARY.md`, `tools/nga-forge/production/characters/swahili/production-entry.json`

## 4. Directional Air Normal Concepts

- `air_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `air_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `air_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `backward_normal_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `backward_normal_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `backward_normal_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `forward_normal_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `forward_normal_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `forward_normal_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/attack-animation-audit-v1.md`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`

## 5. Core Special Concepts

- `special_backward_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_backward_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_backward_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_down_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_down_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_down_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_forward_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_forward_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_forward_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_neutral_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_neutral_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_neutral_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_up_heavy` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_up_light` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`
- `special_up_medium` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json`

## 6. Reaction And Grab Contracts

- `delayed_recovery` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/knockdown-recovery-motion-v1.approval.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`
- `ground_bounce_reaction` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`
- `quick_recovery` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/knockdown-recovery-motion-v1.approval.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`
- `soft_knockdown` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/knockdown-recovery-motion-v1.approval.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`
- `throw_corner_behavior` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/packages/grab-throw-v1/operation-status.json`
- `throw_tech` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/packages/grab-throw-v1/operation-status.json`
- `unsupported_victim_variants` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`, `tools/nga-forge/production/characters/swahili/packages/grab-throw-v1/operation-status.json`
- `wall_bounce_reaction` - `human_review_ready_combat_design_candidate`
  - Gate: `awaiting_grouped_human_move_concept_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/character.lock.json`, `tools/nga-forge/production/characters/swahili/design/swahili-moveset-goal-v1.combat-concepts.json`

## 7. Manual Art Blockers

- `backward_to_forward_reversal` - `blocked_manual_art_complete_kit`
  - Gate: `blocked_until_backward_walk_manual_paintovers_pass`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/walk-backward-motion-v2.manual-paintovers-block.json`, `tools/nga-forge/production/characters/swahili/manual-paintover-kits/moveset-goal-v1-reversals/reversal-manual-action-kit.json`
- `forward_to_backward_reversal` - `blocked_manual_art_complete_kit`
  - Gate: `blocked_until_backward_walk_manual_paintovers_pass`
  - Evidence: `tools/nga-forge/production/characters/swahili/manual-paintover-kits/moveset-goal-v1-reversals/reversal-manual-action-kit.json`
- `walk_backward` - `blocked_manual_art_complete_kit`
  - Gate: `three_manual_rgba_paintovers_required`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/walk-backward-motion-v2.manual-paintovers-block.json`, `tools/nga-forge/production/characters/swahili/manual-paintover-kits/walk-backward-motion-v2/manual-paintover-kits.manifest.json`

## 8. Other Review Candidates

- `command_grab_victim_fall` - `human_review_ready_candidate`
  - Gate: `awaiting_human_command_grab_victim_fall_gameplay_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/command-grab-victim-fall-v1.status.json`
- `crouching_heavy` - `human_review_ready_candidate`
  - Gate: `awaiting_human_crouching_heavy_motion_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/crouching-heavy-motion-v1.status.json`
- `crouching_medium` - `human_review_ready_candidate`
  - Gate: `awaiting_human_crouching_medium_motion_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/crouching-medium-motion-v1.status.json`
- `standing_medium` - `human_review_ready_candidate`
  - Gate: `awaiting_human_standing_medium_v3_key_pose_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/status/standing-medium-identity-v3.status.json`, `tools/nga-forge/production/characters/swahili/reports/attack-animation-cleanup-v1/standing-medium-identity-v3/standing-medium-v3-key-pose-review.md`
- `throw_result_knockdown_compatibility` - `human_review_ready_candidate`
  - Gate: `awaiting_throw_result_and_corner_gameplay_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/approvals/knockdown-recovery-motion-v1.approval.json`, `NO_GODS_ABOVE/engine_v2/tests/swahili_knockdown_recovery_v1.test.js`
- `throw_whiff` - `human_review_ready_candidate`
  - Gate: `awaiting_throw_whiff_gameplay_review`
  - Evidence: `tools/nga-forge/production/characters/swahili/packages/grab-throw-v1/operation-status.json`
