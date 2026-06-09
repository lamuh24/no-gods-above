# LAMUH Visual Redesign Audit

Date: 2026-06-04
Agent: Codex

## Scope

This audit covers LAMUH visual identity, super-form consistency, special animation readability, and debug presentation. It does not add moves, change input routing, rebalance damage/frame data, or intentionally modify Celeste, Sol, Seris, Nyx, Vanta, or Kairo.

## Current Runtime Sources

Base LAMUH uses the final runtime atlases in `assets/sprites/lamuh_final/`:

- Sheet 1 core movement: `lamuh_sheet_1_core_movement_atlas.png`
- Sheet 2 air movement: `lamuh_sheet_2_air_movement_atlas.png`
- Sheet 3 ground normals: `lamuh_sheet_3_ground_normals_atlas.png`
- Sheet 4 air normals: `lamuh_sheet_4_air_normals_atlas.png`
- Sheet 5 specials: `lamuh_sheet_5_specials_atlas.png`
- Sheet 6 defense and hit reactions: `lamuh_sheet_6_defense_hit_reactions_atlas.png`
- Sheet 7 knockdown, recovery, and flavor: `lamuh_sheet_7_knockdown_recovery_flavor_atlas.png`

The powered-up Crown cinematic body source is `lamuh_sheet_8_crown_of_no_gods_body_atlas.png`. Rows 0-4 still read close enough to base LAMUH for startup, rush, combo, and launch beats. Rows 5-7 are the risk area: charge, beam fire, and recovery shift the hair/color/silhouette too far toward a separate ascended character read.

## Super-Form Correction

`LAMUH_ASCENDED_BODY_ATLAS_ENABLED` is now the explicit art gate for Sheet 8 Rows 5-7. It is set to `false`.

While the gate is off:

- `crown_charge` routes to a base-compatible Sheet 5 special row.
- `crown_fire` routes to a base-compatible Sheet 5 special row.
- `crown_recovery` routes to base idle.
- A restrained gold, white, cyan, and black aura/rim layer provides the powered-up read.
- The approved Crown beam VFX still supplies the cinematic fire beat.

This preserves LAMUH's face, skin tone, dark loc identity, white coat silhouette, black/gold outfit read, and cyan/gold energy language until a redesigned ascended body sheet exists.

## Debug Presentation

Debug hitboxes and the ground/contact baseline are off by default because `state.debug` initializes as `false`.

Runtime toggle:

- Press `H` during gameplay to toggle debug hitboxes and baseline.
- Hidden test helpers can also set debug state in `?celesteTest`.

Normal recording and presentation mode is clean unless debug has been toggled on manually.

## Special Animation Readability Audit

| Move | Current alias | Runtime row | Shares row with | Current read | Bespoke row needed |
| --- | --- | --- | --- | --- | --- |
| Mirror Pierce | `mirror_pierce` | Sheet 8 Row 1 | `crown_rush` | Body pose is still a Crown rush fallback. VFX and side-switch carry most readability. | Required |
| Crown Beam | `crown_fire` during active, fallback alias `crown_beam` | Sheet 5 Row 5 while ascended gate is off | `special_recovery`, Crown charge/fire fallback | Safer identity, but the body pose is not a true beam firing pose. Beam VFX carries the read. | Required |
| Crown Rupture | `crown_rupture` | Sheet 5 Row 2 | Heaven Splitter, Ground Breaker, Rising Crown | Ground shock VFX helps, but body pose overlaps too much with vertical specials. | Required |
| Ascendant Break | `ascendant_break` | Sheet 8 Row 4 | `crown_launch` | Stronger than most fallbacks, but still a Crown cinematic launch pose rather than a bespoke up-heavy special. | Required |
| Rebound Strike | `rebound_strike` | Sheet 5 Row 3 | Divine Vanish, Mirror Slip, Mirror Reversal | Movement snap helps, but the body row still reads like the back-special family. | Required |
| Mirror Pulse | `mirror_pulse` | Sheet 5 Row 0 | Mirror Spark, neutral light special, air light special | White/cyan VFX distinguishes it, but the body pose is still shared. | Strongly recommended |
| Ground Breaker | `ground_breaker` | Sheet 5 Row 2 | Heaven Splitter, Crown Rupture, Rising Crown | Ground ripple helps, but body silhouette is shared. | Strongly recommended |
| Rising Crown | `rising_crown` | Sheet 5 Row 2 | Heaven Splitter, Ground Breaker, Crown Rupture | Vertical spark and rise motion help, but body silhouette is shared. | Strongly recommended |
| Mirror Break | `mirror_break` | Sheet 5 Row 1 | Dash Strike, Ascend Step | Dash speed/contact VFX help, but body pose is shared with forward-special rushes. | Strongly recommended |
| Air Crown Drop | `air_crown_drop` | Sheet 4 Row 2 | Air heavy/crown drop | Functional, but a bespoke air crown drop would read better as a special. | Strongly recommended |

## Bespoke Sprite Row Plan

### `lamuh_mirror_pierce`

- Purpose: forward heavy special that pierces through the opponent and exits behind them.
- Silhouette: narrow forward lean, locs trailing backward, one shoulder low, mirror edge leading.
- Startup pose: compressed runner stance with white coat pulled behind the body.
- Active pose: long, blade-like body line crossing through a mirror slit, feet barely touching the ground.
- Recovery pose: back-turned exit pose with LAMUH already re-facing the target.
- VFX notes: thin white mirror seam, small black/gold shards at the crossing point, afterimage trail behind the body.
- Difference: should not look like Dash Strike; it needs a sleeker through-body silhouette and a back-side exit frame.

### `lamuh_crown_beam`

- Purpose: heavy neutral special and Crown fire fallback that projects divine beam power without changing identity.
- Silhouette: planted, squared shoulders, one hand or jewel forward, coat edges lit but body still readable.
- Startup pose: hand/chest jewel draws in cyan/gold light while LAMUH remains base-form.
- Active pose: beam brace pose with face visible, dark locs intact, white coat silhouette intact.
- Recovery pose: hand lowers, glow fades from trim and loc tips.
- VFX notes: beam core stays separate from body sheet; body row only needs muzzle/rim hints.
- Difference: should not be Mirror Pulse with a bigger projectile. It needs a grounded beam-brace silhouette.

### `lamuh_crown_rupture`

- Purpose: down heavy special that breaks the ground with Crown force.
- Silhouette: wide low stomp or palm-to-ground stance, coat flares outward.
- Startup pose: raised heel or lowered palm with crown sparks collecting at the ground.
- Active pose: force driven into floor, knees bent, torso angled downward.
- Recovery pose: rising from the stomp with ground fragments fading.
- VFX notes: ground cracks and vertical gold/black shards should be separate or lightly attached.
- Difference: should not share the Heaven Splitter/Rising Crown upright pose. It needs a grounded downward force read.

### `lamuh_ascendant_break`

- Purpose: up heavy special, highest commitment launcher.
- Silhouette: vertical ascension with one arm and coat edge forming a crown shape.
- Startup pose: crouched coil with cyan/gold light at chest and feet.
- Active pose: upward break pose, locs and coat trailing downward, body stretched tall.
- Recovery pose: hanging/falling finish with aura fading from coat trim.
- VFX notes: vertical crown shards and cyan rim can surround the body but not cover face or limbs.
- Difference: should not reuse Crown launch. It needs an active upward body strike, not just cinematic lift.

### `lamuh_rebound_strike`

- Purpose: back medium special that retreats, then snaps forward into a counter-hit style strike.
- Silhouette: first frames lean away, active frames whip forward with one arm cutting across.
- Startup pose: guarded backward slip with mirror shield angle.
- Active pose: forward snap strike, coat reversing direction, locs lagging behind.
- Recovery pose: low balanced stance after the rebound.
- VFX notes: small white mirror echo at the retreat point, not a large purple vanish.
- Difference: should not read as Divine Vanish. It needs a visible recoil-then-return body rhythm.

### `lamuh_mirror_pulse`

- Purpose: medium neutral special with expanding mirror pressure.
- Silhouette: palms/jewel centered, calm stance, circular force from torso line.
- Startup pose: hands close to chest with small mirror circle.
- Active pose: arms open slightly as pulse expands.
- Recovery pose: hands settle without full beam brace.
- VFX notes: white/cyan ring, lighter than Crown Beam.
- Difference: broader and calmer than Mirror Spark, smaller and less committed than Crown Beam.

### `lamuh_ground_breaker`

- Purpose: down medium special with quick ground pressure.
- Silhouette: short grounded slash or stomp with modest reach.
- Startup pose: low stance, one hand near ground.
- Active pose: diagonal ground cut, not a full rupture.
- Recovery pose: fast return to low stance.
- VFX notes: smaller ground ripple than Crown Rupture.
- Difference: quick low breaker, not the heavy earthquake pose.

### `lamuh_rising_crown`

- Purpose: up medium launcher with jump-cancel utility.
- Silhouette: compact rising cut.
- Startup pose: light knee bend, hand angled upward.
- Active pose: upward sweep with modest height.
- Recovery pose: controlled landing or air-ready pose.
- VFX notes: thin gold crown arc, fewer shards than Ascendant Break.
- Difference: faster and lighter than Ascendant Break, not a ground rupture.

### `lamuh_mirror_break`

- Purpose: forward medium special that breaks guard space.
- Silhouette: mid-height shoulder or palm rush with mirror shatter.
- Startup pose: forward lean, mirror shard at leading hand.
- Active pose: impact frame with body still in front of opponent, not passing through.
- Recovery pose: braced stance, coat settling forward.
- VFX notes: white/gold shatter at impact only.
- Difference: stop-on-impact rush, not Dash Strike speed line and not Mirror Pierce pass-through.

### `lamuh_air_crown_drop`

- Purpose: air heavy special that drops with Crown weight.
- Silhouette: descending axe/body drop with coat and locs above the body.
- Startup pose: suspended tuck with crown spark below.
- Active pose: downward force pose, feet/knee/hand leading.
- Recovery pose: grounded impact settle.
- VFX notes: short vertical impact plume on landing.
- Difference: should read as a special drop, not a generic air heavy.
