# Lamuh Legacy V2 first-playable requirements audit

Status: **technically covered candidate**  
Human status: **crouch-to-stand transition passed; awaiting dedicated turn/facing and combined-transition review**  
Branch: `codex/lamuh-legacy-v2-rebuild-v1`  
Deployable: **false**

This is an evidence map, not a production approval. The Forge character bundle contains 27 candidate packages, including distinct Ascend Step Light, Medium, and Heavy packages. Protected V1 source remains hash-locked, visual comparison uses fixed authored roots, and gameplay remains on the deterministic 60 Hz simulation.

| Milestone requirement | Candidate evidence | Technical state | Human state |
| --- | --- | --- | --- |
| Idle | `moves/idle/animation.package.json`; V1/V2 comparison; live neutral | covered | earlier combined movement feedback exists; current combined gate still open |
| Walk forward/back | `moves/walk-forward`; `moves/walk-backward`; sandbox movement | covered | combined movement gate open |
| Dash forward/back | `moves/dash-forward`; `moves/dash-backward`; Shift and double-tap sandbox controls | covered | combined movement gate open |
| Turn / facing | four dedicated fixed-root frames, `moves/turn-facing`, missing-V1 comparison panel, mirrored playback, immediate simulation-facing swap, and interruptibility tests | covered candidate | motion, mirrored parity, and combined-transition approval required |
| Crouch | six modern frames, numbered contact sheet, comparison, live hold, and deterministic eight-tick release | covered candidate | Crouch-to-Stand motion/transition is `APPROVED_V1_MOTION_PRESERVED`; broader Crouch and combined-movement approval remains open |
| Jump / fall / landing | seven modern frames, numbered contact sheet, comparison and live rise/apex/landing | covered candidate | current motion/scale/transition decision required |
| Standing block | `moves/standing-block`; comparison clip; sandbox block input | covered | first-playable approval not granted |
| Light hit reaction | `moves/light-reaction`; comparison clip; sandbox hit-to-recovery scenario | covered | first-playable approval not granted |
| Standing L/M/H | three Forge packages, A/B/C timing data, comparison, sandbox | covered | Standing L/M have scoped motion/retiming receipts; production and combat approval remain false |
| Crouching L/M/H | three Forge packages, A/B/C timing data, comparison, sandbox | covered | Crouching L/M have scoped motion/retiming receipts; production and combat approval remain false |
| Air normal | Air L/M/H packages and one-hit sandbox checks | exceeds minimum | combined first-playable approval remains false |
| Signature legacy special | `moves/ascend-step`; independent A/B/C timing; sandbox input | covered | combat-profile approval remains false |
| Universal grab startup/connect/whiff/recovery | six-frame `universal-grab-attempt` package plus deterministic connect/whiff mechanics | covered candidate | `APPROVED_STANDARD_GRAB` required |
| Forward throw | six-frame attacker package plus deterministic standard-humanoid victim track | covered candidate | `APPROVED_FORWARD_THROW` required |
| Back throw | six-frame pivot package, side switch, and deterministic standard-humanoid victim track | covered candidate | `APPROVED_BACK_THROW` required |

## Current stop gate

The Crouch-to-Stand live transition passed its clip-scoped human gate on 2026-09-02. Turn / Facing passed for the current baseline with polish debt on 2026-09-02 and is explicitly starred for revisit. Standard Grab, Forward Throw, and Back Throw are now the current independent human gates. Continue to use `http://127.0.0.1:4177/lamuh-v1-v2-review.html` and `http://127.0.0.1:4177/lamuh-legacy-sandbox.html` for direct review. Record move-specific decisions only. Do not promote assets, broaden moveset production, deploy, merge, push, or open a PR from this audit.

The focused validation verifies Standard Grab as the default comparison state and preserves Turn / Facing as a starred review entry. It also verifies the throw-family missing-V1 disclosure, deterministic victim tracks, fixed roots, the four-frame twelve-tick Turn / Facing candidate, immediate facing, mirrored playback, control interruptions, and deterministic checksums. Browser screenshots remain evidence only and cannot approve a gate.

## Honest remaining debt

- The live crouch-to-stand presentation is simulation-owned: it reuses the authored rise/recovery frames for eight deterministic ticks, is checksum/replay covered, and is immediately interruptible by attack, jump, dash, crouch, walk, or block input. Its motion/transition is `APPROVED_V1_MOTION_PRESERVED`; no broader fighter or production approval is implied.
- Turn / Facing is authored as explicit V2 missing-state art and is `APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT` for its clip-scoped motion, mirror parity, and transition behavior. It remains candidate-only, is starred for revisit, and has no runtime-promotion authority. A dedicated launch-reaction row remains unauthored.
- Throw victim presentation currently supports the standard-height humanoid class; small, large, non-humanoid, and extreme-proportion classes remain future work.
- Candidate presentation art is not production source until its corresponding human gate passes.
