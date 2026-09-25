# Engine V2 Prototype Combat Tuning

Temporary committed defaults live in `src/data/fighters.ts`; the browser panel can copy a JSON tuning note but is not the source of truth.

## Lamuh movement defaults

- Walk forward: `5.4` units/tick
- Walk backward: `3.8` units/tick
- Dash: `13` units/tick for `12` ticks
- Backdash: `10` units/tick for `14` ticks
- Jump startup: `4` ticks
- Jump velocity: `-18`
- Forward jump velocity X: `6.2`
- Back jump velocity X: `-5.1`
- Air control: `1.4`
- Gravity: `1.05`
- Landing recovery: `5` ticks
- Input buffer: `18` ticks
- Wake-up invulnerability: `18` ticks
- Combo neutral reset timeout: `12` ticks

## Prototype normals

- `5L`: fast short-range pressure, chains to `5M` or `2M` on hit/block.
- `5M`: medium bridge, chains to `5H` on hit/block.
- `5H`: grounded finisher with soft knockdown placeholder.
- `2L`: fast low; must be crouch-blocked.
- `2M`: longer low starter, chains to `2H`.
- `2H`: launcher with jump-cancel/pursuit flag and no long-range tracking.
- `j.J`: 3 startup / 3 active / 7 recovery, 25 damage, short air-to-air starter; chains to `j.K` or `j.L`.
- `j.K`: 5 startup / 4 active / 10 recovery, 45 damage, horizontal/slightly downward bridge; chains to `j.L`.
- `j.L`: preserved 6 startup / 6 active / 14 recovery, 70 damage, downward `8` knockback and soft-knockdown finisher.

Directional back-block and the configured block button are both enabled for this prototype. Low attacks require crouch block; mids can be standing or crouch blocked.

## Gameplay-kernel stabilization rules

- Engine coordinates use negative Y above the floor. The debug combat ceiling is `-180`; the ground is exactly `0`.
- Normal grounded hits keep `vy = 0`. Only an authored launcher sets a negative airborne velocity.
- Temporary proof-of-architecture horizontal knockback is `2.2 / 3 / 5` for `5L / 5M / 5H` and `2 / 3 / 4` for `2L / 2M / 2H`. These values exist only to prove the authored chains connect; they are not a production balance pass.
- `2H` uses temporary launch velocity `-16`, reaches about `-114`, and lands inside the legal camera/bounds window.
- Hitstop continues collecting deterministic input history but freezes state timers, attack frames, movement, gravity, and knockback integration. Buffered presses may be consumed afterward within the existing input leniency.
- `phaseTick` means elapsed ticks in the current authored phase, including the entry tick. Jump startup, dash, and backdash own their state until their configured duration expires.
- Combo state starts on an unblocked hit, continues through connected hitstun/airborne/knockdown states, and resets after interruption or `12` neutral ticks. Reset restores count, accumulated damage, target, and scaling.
- Hitstun and blockstun are mutually exclusive. A defender cannot begin blocking during hitstun.
- Same-tick hits are collected before mutation, allowing symmetric trades and leaving future priority/armor/clash rules as explicit extension points.

## Aerial-normal policy

- A jump starts with three aerial-normal actions. Starting `j.J`, `j.K`, or `j.L` consumes one; the acyclic cancel graph and budget prevent loops without adding double jumps or air dashes.
- Air attacks preserve the fighter's horizontal velocity and continue deterministic gravity. Hitstop remains the only authored freeze.
- Facing is captured at attack start and retained for hitbox resolution.
- Landing immediately interrupts an unfinished aerial attack, clears its move/cancel state and remaining air actions, then applies the existing 5-tick landing recovery.
- Every aerial hitbox has `maxHits: 1`. Combo scaling and neutral reset use the repaired shared kernel rules.
- These are temporary prototype proof values, not a roster-wide balance pass.
