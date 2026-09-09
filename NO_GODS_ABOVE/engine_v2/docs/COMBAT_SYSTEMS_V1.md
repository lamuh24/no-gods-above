# Engine V2 Combat Systems V1

Status: `candidate-only`

Deployable: `false`

Purpose: prove deterministic ArcSys-inspired resource and escape rules before character-specific specials, supers, or final balance are authored.

## Tension

- Range: `0-100`.
- Real forward movement: `+2` per moving tick.
- Confirmed hit: `+16`.
- Blocked attack: `+5`.
- Starting Tension: `0`.
- Tension does not reset damage scaling, juggle points, or the approved airborne hitstun timing.

## Roman Cancel

- Plain English: Roman Cancel spends meter to stop your current attack early after it touches the opponent. Use the saved recovery time to continue the combo or regain control sooner.
- Input: `H` on keyboard or gamepad button `6`.
- Cost: `50` Tension.
- Valid only while the current attack has connected or been blocked.
- Cancels the attack and recovery, applies `8` freeze ticks to the opponent, and uses `4` recovery ticks for the actor.
- Air Roman Cancel refunds exactly one normal air action, capped by the five-action budget.
- Roman Cancel never resets the combo counter, scaling, juggle points, or damage.
- Raw and insufficient-meter attempts are rejected deterministically.

## Burst

- P1 input: `P` on keyboard or gamepad button `8`.
- Debug dummy input: `B` or the `Dummy Burst` button while the dummy is in hitstun or blockstun.
- Starts at `100`, costs all `100`, and does not regenerate in this vertical slice.
- Valid only during hitstun or blockstun; it cannot be used from neutral, getup, or knockdown.
- Applies `6` freeze ticks, `20` recovery ticks, `18` zero-damage hitstun to the attacker, and `12` pushback.
- Clears the attacker's active move and combo route without damaging health.
- Empty repeat attempts are rejected.

## Hitstun presentation

- The deterministic `hit_reaction` state drives approved Swahili reaction artwork instead of falling back to idle.
- Grounded light reactions use `light_hit_entry -> light_hit_reaction -> light_hit_recovery`.
- Grounded heavy and Burst reactions use `heavy_hit_entry -> heavy_hit_reaction -> heavy_hit_recovery`.
- Airborne hitstun uses the approved launch-reaction pose followed by the approved airborne-tumble pose.
- Hitstop freezes the visual cursor, and every new combo hit restarts the reaction at impact.
- Presentation does not add, remove, or retime gameplay hitstun.

## Air tech, knockdown, and landing recovery

- When airborne hitstun expires, the defender enters a six-tick tech window.
- Direction or attack/block input performs a manual air tech. Left/right chooses forward or backward relative to facing; other accepted inputs produce a neutral tech.
- No input produces an automatic neutral tech after six ticks, except the explicit debug `no_recovery` dummy mode.
- A successful tech ends the old combo, applies ten ticks of air-tech invulnerability, and gives a small upward stabilization. Directional tech moves at `5.5` simulation units per tick.
- Landing while still in airborne hitstun—or reaching the floor without teching—causes a `26`-tick soft knockdown followed by the existing `18`-tick getup.
- Authored hard knockdowns remain `42` ticks. Ordinary attacks still cannot OTG.
- Air Heavy is the normal air-route finisher and always applies soft knockdown on hit.
- The supported normal routes are `Air Light -> Air Medium -> Air Heavy` and `Air Light -> Air Medium -> Air Light -> Air Medium -> Air Heavy`.
- Air Medium may alternate back to Air Light. Five normal air actions are available, while the unchanged `8/8` juggle ceiling makes the longer route consume the full budget (`1 + 2 + 1 + 2 + 2`) and prevents another airborne hit.
- Air Medium's vertical knockback is `-8` instead of `-5`, a targeted relaunch adjustment that keeps the existing startup/active/recovery timing unchanged while keeping the opponent aligned for the second Light.
- The root stage renderer uses the approved ten-pose Swahili knockdown/recovery family for airborne tumble, ground impact, downed hold, getup, and rise. No new fighter artwork was generated.
- Ordinary jump and air-attack landings retain the accepted five-tick, input-locked landing recovery.
- The accepted seven-hit route remains `271` damage and `8/8` juggle points. Its attack cadence, gravity, hitstun, damage, and horizontal knockback are unchanged; the Air Medium vertical relaunch is the only trajectory adjustment.
- The live playtest now exposes a prominent combo counter, tech window/status, knockdown kind/timer, landing recovery timer, and manual dummy-tech buttons.

## Playtest

1. Hold `D` to approach and earn Tension.
2. Use `J -> K -> H -> S+L -> W+D -> J -> K -> L -> U`.
3. Confirm `H` after grounded Medium spends `50` only after contact and creates a clear cancel window before the launcher without changing the approved air-combo timing.
4. During any dummy hitstun, press `B` to queue dummy Burst through the real deterministic P2 input path.
5. Confirm the dummy escapes, P1 is pushed away, no Burst damage occurs, and a second Burst is unavailable after the resource is spent.
6. Stop an air route before the ender and use the dummy-tech buttons during airborne hitstun. Confirm forward/back/neutral tech movement, an `AIR TECH` status, and a reset combo counter.
7. Cycle the dummy to `no_recovery`, let it reach the floor after airborne hitstun, and confirm `SOFT KNOCKDOWN` followed by getup.
8. After a launcher, press `J -> K -> L` or `J -> K -> J -> K -> L`. Confirm Heavy drops the dummy through airborne tumble, ground impact, a downed hold, and the complete getup sequence.

## Boundaries

- Temporary system values, pending human playtest.
- No Roman Cancel or Burst fighter artwork/VFX/audio is authored or implied.
- No Swahili package, atlas, roster, special attack, legacy `game.js`, deployment, or production balance authority is changed.
