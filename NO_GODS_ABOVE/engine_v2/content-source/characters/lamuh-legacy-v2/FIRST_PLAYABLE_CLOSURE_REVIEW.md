# Lamuh Legacy V2 first-playable closure — human decision queue

Status: **candidate-only**  
Deployable: **false**  
Human review: **awaiting_human_crouch_jump_standard_grab_forward_throw_back_throw_and_combined_movement_review**

Review the local V1/V2 comparison and isolated sandbox, then answer this one four-section queue. Do not treat one approval as approval of the others.

## Current gate — resolve before broader production

Review the combined sandbox at `http://127.0.0.1:4177/lamuh-legacy-sandbox.html`:

- `Crouch movement`: ready, lowering, and deep guarded hold must retain the idle anatomy scale and V1 low silhouette.
- `Jump movement`: anticipation, takeoff, knee-tuck, apex, fall, landing, and recovery must read as one arc without size/root drift.
- `Forward throw`, `Back throw`, and `Grab whiff → neutral`: judge the attacker motion and deterministic standard-height victim track independently.
- Combined movement: idle, walk, dash, crouch, jump, attacks, and landing must look normal when played together.

The V1/V2 route at `http://127.0.0.1:4177/lamuh-v1-v2-review.html` now opens on crouch. The authored rising connector is visible there but is not yet inserted into the live crouch-to-stand state because doing so before motion approval could change neutral responsiveness and checksum behavior.

Record move-specific statuses: `APPROVED_V1_MOTION_PRESERVED` or an exact targeted repair for crouch/jump, then `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW` independently. This gate does not approve combat profiles, the production baseline, roster selection, or deployment.

After this preflight gate passes, answer sections A-D below.

A. **Standing Heavy visual/motion reconstruction** — `APPROVED_V1_MOTION_PRESERVED`, `APPROVED_WITH_TARGETED_REPAIR`, `REJECTED_V2_LOST_V1_FLOW`, or `REJECTED_FOR_MOTION_REVISION`.

B. **Standing Heavy timing** — `TIMING_A_V1_RHYTHM`, `TIMING_B_RECOMMENDED_READABILITY`, `TIMING_C_HEAVIER_ALTERNATE`, or request a targeted adjustment. Judge the 8/9/10-hitstop choices separately while testing; they remain candidate tuning, not a separate production approval.

C. **Overall Lamuh first playable** — `APPROVED_FIRST_PLAYABLE_V1`, `APPROVED_FIRST_PLAYABLE_WITH_POLISH_DEBT`, `APPROVED_WITH_TARGETED_REPAIR`, `REJECTED_FOR_TIMING`, or `REJECTED_FOR_MOTION_REVISION`.

D. **Standard grab / throws** — record independently: `APPROVED_STANDARD_GRAB`, `APPROVED_FORWARD_THROW`, and `APPROVED_BACK_THROW`, or provide the exact targeted rejection reason for each item that does not pass.

Current throw mechanics use deterministic standard-height victim tracks. Attacker throw artwork remains a labeled placeholder, so mechanics may pass while the human records an exact visual-repair or manual-art rejection reason.

Stop after this queue. Do not integrate the live crouch exit, expand the moveset, promote candidate art, change the roster, deploy, merge, push, or open a PR until the current human gate is resolved.
