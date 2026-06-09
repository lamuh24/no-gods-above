# LAMUH Ultimate Contract - Crown of No Gods

## Purpose

This document defines the preproduction and implementation contract for LAMUH's final cinematic ultimate, **Crown of No Gods**.

Do not implement the final ultimate from this document alone. Do not generate the ultimate body sheet, beam VFX sheet, impact VFX sheet, or super-flash assets until a later approved production pass. Do not rewrite LAMUH's accepted public movement, normals, directional specials, or balance while preparing this ultimate.

## Current Runtime Findings

The current game uses data-driven attack definitions and a shared `startMove()` / `beginMove()` flow for ultimates.

- P1 ultimate input is `I + O`.
- P2 ultimate input is `Numpad0`.
- `startMove()` blocks ultimate use unless the fighter has full meter.
- `beginMove()` immediately spends meter for `flags.ultimate`, adds camera shake, and spawns a burst.
- Meter is gained through non-ultimate hits or intended meter-gain actions.
- Current ultimates are regular attack actions with stronger damage, hitstop, knockback, camera shake, and burst feedback.
- There is not currently a full cinematic lock/cutscene state for long multi-stage supers.
- Nyx is the closest bespoke ultimate precedent: its ultimate starts a normal attack, then spawns a dedicated animated slash-wave visual hook.
- LAMUH's current placeholder ultimate maps to the Celestial Palm row and is explicitly temporary.

Conclusion: Crown of No Gods should be implemented as a small LAMUH-only cinematic ultimate subsystem layered on top of the existing ultimate/meter flow, not as a combat-system rewrite.

## Ultimate Summary

**Name:** Crown of No Gods

**Fantasy:** LAMUH flashes forward with main-character confidence, confirms with a rush starter, strings the opponent through a short cinematic martial combo, launches them into a celestial beam setup, then fires a huge cyan-gold beam that detonates in a clean divine-war impact.

**Desired feel:**

- Main-character energy.
- Stylish, explosive, elite, and clean.
- Signature LAMUH finisher, not a generic beam slapped on top.
- Cinematic without becoming cluttered or unreadable.
- Strong payoff, but not a whiff cutscene.

## Gameplay Intent

Crown of No Gods should be a **rush-confirm cinematic super**.

The move should reward a real hit confirm. It should be scary at full meter, but it should not force both players to watch a long giant-beam sequence when LAMUH whiffs in neutral.

Recommended high-level behavior:

- Full cinematic sequence happens only after the rush starter connects.
- Whiff plays a shorter non-cinematic rush/pose recovery.
- Block should either stop at a short blocked rush impact or produce a reduced non-cinematic guard-crush style effect, not the full beam.
- Meter is spent on activation, matching the current runtime's ultimate behavior, unless a later implementation deliberately adds a two-stage refund rule.

## Cinematic Sequence

1. **Super Startup / Flash**
   - LAMUH snaps into a composed power stance.
   - Brief cyan/gold screen flash, time-slow, and crown-like halo accent.
   - No transformation. No new form.
   - Locs remain hair only.

2. **Rush-Forward Starter Hit**
   - LAMUH bursts forward with a palm, shoulder, elbow, or punch starter.
   - This is the confirm window.
   - If it hits, enter cinematic lock.
   - If it whiffs, end with short recovery.

3. **Cinematic Combo String**
   - 3-5 fast martial hits: palm, elbow, knee, kick, and body movement.
   - The camera may tighten slightly.
   - The opponent is carried enough to read the combo, but the base combat juggle rules should not be rewritten.

4. **Launch / Setup**
   - LAMUH sends the opponent upward or back into a suspended setup position.
   - LAMUH plants, turns, or slides into the beam charge stance.

5. **Beam Charge**
   - Hands gather compact cyan/gold celestial ki.
   - Charge should feel dense and clean, not noisy.
   - Cloak and locs react naturally but stay contained.

6. **Giant Beam Fire**
   - A kamehameha-style celestial beam fires from LAMUH's hands.
   - Beam is cyan core, gold/brass rim, white-hot center only at peak.
   - Beam should be large enough to feel ultimate-scale, but anchored and readable.

7. **Impact / Explosion**
   - Beam hits target/edge with a crisp explosion, shock ring, and sparks.
   - Use strong hitstop and camera shake, then decay quickly.
   - Avoid fullscreen clutter.

8. **Recovery / Finish Pose**
   - LAMUH lowers his hands or turns into a calm finish pose.
   - He should look controlled: "I knew that was over."

## Hit, Whiff, And Block Behavior

### Hit

Full cinematic should only trigger if the rush starter connects with a valid defender.

Recommended flow:

- Player presses ultimate at full meter.
- LAMUH enters `crown_startup`.
- During `crown_rush`, the starter hitbox checks collision.
- On hit, both fighters enter a temporary cinematic lock.
- Defender takes staged damage through scripted beats or a single final damage packet split for readability.
- Beam impact applies final knockdown/KO.

### Whiff

Do not play the giant beam on whiff.

Recommended whiff behavior:

- Startup and rush still play.
- No cinematic lock.
- No beam.
- LAMUH slides/recoils into `crown_recovery`.
- Recovery should be punishable enough to preserve gameplay sanity.

### Block

Preferred first implementation:

- Blocked starter does not trigger the full cinematic.
- Defender takes no damage or very small chip only if chip rules are later added.
- LAMUH enters a short blocked recovery.
- Optional: big guard spark and camera tick, but no beam cutscene.

If block-confirm cinematic is ever desired later, it should be a separate design pass.

## Startup, Active, Recovery Concept

These are planning values only and should be tuned during implementation.

- Startup flash: 18-24 frames.
- Rush active window: 8-12 frames after forward movement begins.
- Whiff recovery: 36-48 frames.
- Block recovery: 30-42 frames.
- Confirm cinematic duration: 150-210 frames total.
- Beam charge: 30-42 frames inside cinematic.
- Beam fire and impact: 45-72 frames inside cinematic.
- Finish pose / return: 18-30 frames.

The total cinematic should feel premium but not exhausting. Target roughly 2.5-3.5 seconds after confirm.

## Meter Behavior

Recommended initial behavior:

- Requires full meter, same as existing ultimates.
- Spend full meter on activation, same as current `beginMove()` ultimate flow.
- No meter gain during the cinematic.
- Do not allow canceling out of Crown of No Gods.
- If a whiff refund is considered later, keep it partial and only after playtesting. First implementation should keep the existing spend-on-use model for simplicity and consistency.

## Damage Intention

Target damage should feel like a real finisher without creating routine TODs.

Recommended target:

- Total confirmed damage: around 260-320 before later balancing.
- Whiff damage: 0.
- Block damage: 0 for first pass unless chip damage is explicitly added later.
- Beam final hit should be the largest visual damage beat.
- The move should ignore normal combo scaling only if the implementation needs it for presentation; otherwise apply a controlled ultimate-specific damage plan.

Do not use Crown of No Gods to rebalance LAMUH's accepted base kit.

## Camera, Hitstop, And Flash Recommendations

Minimum cinematic support needed:

- Brief startup time-slow or hit pause.
- Camera shake on starter hit, launch, beam fire, and final impact.
- Optional camera framing lerp toward the fighters during the cinematic.
- Optional darkened background overlay during charge/beam.
- Strong but short white/cyan/gold flash at beam fire.
- No long screen-covering whiteout that hides the result.

Current runtime already supports `state.hitPause`, `state.cameraShake`, particles, bursts, and Nyx-style bespoke ultimate visual hooks. A small LAMUH-only cinematic state can reuse those primitives first.

## Required Runtime Concepts

The safest final implementation should add these concepts narrowly:

- `lamuhCrownState` or equivalent LAMUH-only cinematic state.
- Confirm starter hitbox distinct from regular `ultimate`.
- Cinematic lock that freezes or heavily constrains both fighters only after hit confirm.
- Scripted beat timer for combo, launch, charge, beam, impact, and recovery.
- LAMUH-specific VFX arrays or a generic `ultimateEffects` array if clean.
- Rendering hooks for beam and impact VFX.
- Safe cleanup on KO, rematch, return-to-select, pause, and match reset.

Avoid broad changes to:

- Existing fighter attacks.
- Existing combo routes.
- Existing directional specials.
- Existing local-versus input mapping.
- Seris Sheet 8 behavior.

## Asset Breakdown

### Required: Ultimate Body Sheet

Used for LAMUH's body animation during startup, rush, combo, launch, beam charge, beam fire, and finish pose.

### Required: Beam VFX Sheet

Used for the large cyan/gold beam. This should be separate from the body sheet so the beam can scale, stretch, clip, and layer correctly without corrupting LAMUH's body readability.

### Required: Impact / Explosion VFX Sheet

Used for the beam collision and final explosion. Separate impact art keeps the beam readable and lets the explosion be placed at the defender or stage edge.

### Optional: Super Flash / Portrait Flash Assets

Used for premium fighting-game presentation. These should be optional and easy to skip if they slow implementation.

## Future Sheet Contracts

### Sheet 8 - Ultimate Body

- File: `assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png`
- Purpose: LAMUH body animation for Crown of No Gods.
- Atlas size: `3584x3584`
- Grid: `8 columns x 8 rows`
- Cell size: `448x448`
- Baseline: `baselineY: 382` where grounded.
- Anchor: `lockedFrameBottomCenter`
- Fixed source cells: `true`
- Facing: right-facing source art; runtime mirrors facing.
- Background: transparent RGBA.
- Trimming: no trimming, no aggressive cropping.
- Runtime scale: start with the current LAMUH body scale `0.82`.

Rows:

- Row 0: `crown_startup_flash` - 8 frames.
- Row 1: `crown_rush_start` - 8 frames.
- Row 2: `crown_combo_string_a` - 8 frames.
- Row 3: `crown_combo_string_b` - 8 frames.
- Row 4: `crown_launch_setup` - 8 frames.
- Row 5: `crown_beam_charge` - 8 frames.
- Row 6: `crown_beam_fire_recoil` - 8 frames.
- Row 7: `crown_recovery_finish` - 6 frames, with trailing cells transparent or clean held finish poses.

Style constraints:

- Match approved LAMUH Sheets 1-7.
- Medium locs remain hair only.
- White haori and dark outfit remain readable.
- Gold/cyan effects must be contained on the body sheet.
- No transformation form.
- No giant beam drawn into the body sheet.

### Beam VFX Sheet

- File: `assets/effects/lamuh/lamuh_crown_of_no_gods_beam_vfx_atlas.png`
- Purpose: Giant celestial beam animation.
- Atlas size: `8192x2048`
- Grid: `8 columns x 4 rows`
- Cell size: `1024x512`
- Anchor: beam origin at left-center of each cell for right-facing source.
- Facing: right-facing source; runtime mirrors or flips for left-facing use.
- Background: transparent RGBA.
- Trimming: no trimming; preserve consistent beam origin and width.

Rows:

- Row 0: `beam_charge_core` - 8 frames.
- Row 1: `beam_fire_start` - 8 frames.
- Row 2: `beam_sustain_peak` - 8 frames.
- Row 3: `beam_dissipate` - 8 frames.

Style constraints:

- Cyan core, gold/brass edges, white-hot center at peak only.
- Beam should feel huge but clean.
- No baked background.
- No text.
- No detached random particles outside the intended beam bounds unless they are contained in the cell.

### Impact / Explosion VFX Sheet

- File: `assets/effects/lamuh/lamuh_crown_of_no_gods_impact_vfx_atlas.png`
- Purpose: Beam impact, explosion, shock ring, and dissipating embers.
- Atlas size: `6144x1536`
- Grid: `8 columns x 3 rows`
- Cell size: `768x512`
- Anchor: impact center in the middle of the cell.
- Background: transparent RGBA.
- Trimming: no trimming; preserve center anchor.

Rows:

- Row 0: `impact_contact_flash` - 8 frames.
- Row 1: `impact_explosion_bloom` - 8 frames.
- Row 2: `impact_decay_sparks` - 8 frames.

Style constraints:

- Cyan/gold/white only, with limited dark smoke if needed.
- Explosion should not become a full-screen mess.
- Must stay readable over the stage.

### Optional Super Flash / Portrait Assets

- File: `assets/effects/lamuh/lamuh_crown_super_flash.png`
- Suggested size: `1920x1080`
- Purpose: optional translucent screen flash / divine-war overlay.
- Background: transparent RGBA.
- Notes: Should be low-opacity and should not hide gameplay for long.

- File: `assets/sprites/portraits/lamuh_crown_ultimate_portrait.png`
- Suggested size: `720x720` or `460x520` depending on final UI direction.
- Purpose: optional portrait cut-in.
- Background: transparent RGBA.
- Notes: Base LAMUH only; no transformation, no baked text.

## Identity Guardrails

- LAMUH stays in base form.
- No transformation in this pass.
- Medium locs are hair only and never attack limbs, ropes, whips, tentacles, chains, or weapons.
- Attacks come from body motion, fists, elbows, knees, kicks, palm strikes, and celestial ki.
- Cloak/haori motion should support the silhouette, not hide the martial arts.
- Gold/cyan celestial ki should feel signature, not generic.

## Implementation Risks

1. **No existing full cinematic state.**
   - Current ultimates are regular moves. A long confirm super needs a new LAMUH-only state, or it will fight the normal action loop.

2. **Meter spends before hit confirm today.**
   - This is acceptable for first implementation, but designers should decide whether whiff spending full meter feels fair.

3. **P1/P2 local versus must remain symmetric.**
   - The cinematic state must work when LAMUH is P1 or P2/enemy-side.

4. **Reset/pause/KO cleanup.**
   - Beam and cinematic timers must clear on rematch, return-to-select, KO, and pause flow.

5. **Layering and scale.**
   - Beam VFX should be drawn behind/in front of fighters intentionally. Body sheet scale should start at LAMUH's current accepted scale.

6. **Performance and texture size.**
   - Large beam sheets can be heavy. Validate image dimensions, browser memory, load time, and no failed requests before public use.

7. **Gameplay sanity.**
   - Full cinematic on whiff would feel bad. Confirm-only cinematic is strongly recommended.

## Safest Implementation Order

1. Keep LAMUH's current placeholder ultimate unchanged until assets exist.
2. Generate and validate Sheet 8 body animation first.
3. Generate and validate beam VFX and impact VFX separately.
4. Add asset paths and metadata behind a LAMUH ultimate feature flag.
5. Add a small LAMUH-only `crown_of_no_gods` move key while preserving the existing `ultimate` fallback.
6. Add confirm-only starter behavior: whiff and block exit without the full cinematic.
7. Add cinematic lock state on confirmed hit.
8. Add body animation phase mapping.
9. Add beam and impact VFX rendering.
10. Add cleanup on KO/rematch/select/pause.
11. Smoke test P1 LAMUH, P2 LAMUH, LAMUH mirrors, existing fighters, and Seris Sheet 8 disabled behavior.
12. Only after the above passes, replace the public placeholder ultimate.

## Validation Checklist For Future Implementation

- P1 `I + O` triggers Crown of No Gods only at full meter.
- P2 `Numpad0` triggers Crown of No Gods only at full meter.
- Full cinematic only plays on starter hit.
- Whiff does not play giant beam.
- Block does not play full cinematic in the first implementation.
- Meter spend is consistent and clearly documented.
- LAMUH base movement/normals/directional specials remain unchanged.
- Existing fighters' ultimates still work.
- Local P1/P2 versus still works.
- Rematch and return-to-select clear all ultimate state.
- Pause does not corrupt cinematic state.
- KO during ultimate resolves cleanly.
- No console/runtime errors.
- No failed asset requests.
- No Seris Sheet 8 regular gameplay VFX behavior changes.
