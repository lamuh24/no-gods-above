# LAMUH Character Lock And Sheet 1 Production Contract

This document locks the planning contract for LAMUH before any runtime implementation, sprite generation, or combat tuning.

Do not add LAMUH to runtime from this document alone. Do not add asset keys, `characterProfiles.lamuh`, select-card markup, or `selectableCharacterIds` until a later approved implementation pass.

## Current Public Gameplay Acceptance

As of June 2, 2026, LAMUH is public and playable in No Gods Above. His current public movement, normals, directional specials, and balance are accepted for now after real playtesting. Directional specials feel distinct and good in live play, P1/P2 LAMUH works, and players are enjoying him.

Do not rewrite or retune LAMUH's core movement, normals, specials, or balance unless later playtesting identifies a specific issue. Future LAMUH work should focus on the full cinematic beam ultimate, transformation if explicitly approved, or later polish rather than core kit rewrites.

Cinematic ultimate and transformation remain deferred.

## 1. Identity Summary

- Name: LAMUH
- Role: CELESTIAL KI / KI RUSH FIGHTER
- Pipeline: new-generation fighter, using the Sol/Nyx/Seris style profile-driven runtime approach.
- Fantasy: original anime ki fighter with fast, stylish, confident FighterZ-style combat energy.
- Character read: Black male dreadhead anime martial artist modeled after the creator.
- Fighting vibe: smooth, elite, composed, and explosive when he chooses to move.
- Power theme: celestial ki, aura pressure, cyan/gold energy accents, martial confidence.
- Later ultimate concept: cinematic martial combo into a giant beam finisher.

LAMUH should feel like a confident ki-fighter main character: calm until the burst, clean in silhouette, fast in motion, and readable in every pose.

## 2. Visual Design Lock

LAMUH's visual identity must stay consistent across all future sheets:

- Black male anime fighter.
- Medium-length locs, chunky and readable.
- White knee-length captain-style haori/cloak.
- Dark sleeved combat outfit underneath.
- Gold and cyan accents.
- Sandals with clear foot and baseline readability.
- Athletic martial artist body language.
- No weapon silhouette.
- No chain, rope, whip, tether, tentacle, or hair-weapon language.

The design should communicate celestial ki and martial swagger, not weaponized hair or cloak attacks.

## 3. Palette Lock

Primary colors:

- White haori/cloak.
- Deep black / dark charcoal inner combat outfit.
- Warm gold trim and accent details.
- Cyan celestial ki accents.
- Natural dark hair.
- Warm brown skin tones.

VFX accent direction:

- Cyan for clean celestial aura and quick ki trails.
- Gold for divine impact flashes and premium trim.
- White-hot centers only for later high-impact specials or ultimate VFX.

Palette guardrails:

- Keep cyan/gold accents controlled on Sheet 1.
- Do not let aura effects overpower the body silhouette.
- Do not let white cloak blend into white-hot energy.
- Preserve strong outlines around white clothing.

## 4. Sprite Readability Rules

All LAMUH animation should prioritize clear fighting-game readability:

- Body silhouette must read before VFX.
- Hands, elbows, knees, kicks, and palms must be visible in attack poses.
- Feet must be readable in sandals and aligned to the baseline in grounded states.
- The white cloak should add premium motion, not hide the fighter's body mechanics.
- Locs should trail naturally with motion but stay recognizably hair.
- Each frame should stay contained inside its source cell.
- No neighboring-frame bleed.
- No duplicate body ghosts baked into a cell.
- No text, labels, numbers, debug baselines, UI, or grid lines.
- Source art faces right; runtime mirrors facing.

Movement and travel must stay code-driven. Do not bake large horizontal displacement into sprite cells.

## 5. Hair / Loc Rules

LAMUH's locs are hair only.

Hard rules:

- Locs must never become attack limbs.
- Locs must never become tentacles.
- Locs must never become whips.
- Locs must never become ropes.
- Locs must never become chains.
- Locs must never become grab tools.
- Locs must never form projectile bodies.
- Locs must never strike the opponent.

Allowed loc behavior:

- Natural sway during idle.
- Follow-through during walk, dash, crouch, and later attacks.
- Short secondary motion caused by body movement.
- Clear chunky hair shapes that remain attached to the head.

If a frame reads like hair is attacking, grabbing, extending unnaturally, or becoming a weapon, reject or repair that frame before runtime import.

## 6. Cloak / Haori Containment Rules

The white knee-length captain-style haori is a major identity marker, but it must stay contained and readable.

Rules:

- The cloak may flare, lag, and settle with movement.
- The cloak may show fast cloth follow-through during dash frames.
- The cloak must not become a strike effect.
- The cloak must not cover the hands, elbows, knees, feet, or core fighting pose.
- The cloak must not trail across neighboring cells.
- The cloak must not look like wings, tendrils, ropes, chains, or weapon extensions.
- The cloak bottom should remain consistent with knee-length design.
- Dash cloth motion should be explosive but still tied to the body.

If the cloak hides foot placement or baseline contact, repair the pose before using the sheet.

## 7. Animation Personality

LAMUH's animation personality:

- Calm confidence.
- Fast, smooth transitions.
- Martial swagger.
- Composed stance discipline.
- Explosive dashes.
- Elite walk cycle.
- "I know I'm him" idle energy.

Sheet 1 should establish that LAMUH is not frantic. He moves like he is always in control.

Animation tone:

- Idle: relaxed dominance, controlled breathing, subtle aura accent.
- Walk forward: measured pressure, shoulders steady, clean footfalls.
- Walk back: guarded confidence, never panicked.
- Dash forward: sharp burst, readable body lean, quick cloak/loc follow-through.
- Dash back: stylish retreat, fast but composed.
- Crouch: low martial stance, balanced, ready to explode upward later.

## 8. Gameplay Archetype

LAMUH is planned as a ki rush fighter.

Initial gameplay direction:

- Fast, stylish, pressure-oriented martial artist.
- Strong movement identity.
- Clean basic normals first.
- Strong air-control potential later, but not defined in Sheet 1.
- Celestial ki supports strikes instead of replacing them.
- Body-first combat: fists, elbows, knees, kicks, palm strikes, footwork, and aura.

Do not implement gameplay from this document yet.

When runtime work begins, start conservatively:

- Movement identity.
- Basic ground normals.
- Air normals.
- Specials.
- Ultimate.

## 9. New-Generation Runtime Format

LAMUH should follow the current new-generation runtime contract used by recent fighters, especially the Sol-style 448px format.

Recommended runtime folder:

```text
NO_GODS_ABOVE/assets/sprites/lamuh_final/
```

Runtime metadata target:

```js
cellSize: 448,
baselineY: 382,
scale: 1.0,
fixedSourceCells: true,
anchorMode: "lockedFrameBottomCenter",
skipSanitize: true
```

Runtime behavior:

- Right-facing source art.
- Runtime mirrors facing.
- Transparent runtime atlases after processing.
- No trimming.
- Fixed source cells.
- Bottom-center anchoring.
- Grounded feet aligned to `baselineY: 382`.

Note: the older generic atlas skill standard says 6 columns x 5 rows. LAMUH Sheet 1 intentionally follows the live-code Sol-style movement format requested for this fighter: 8 columns x 6 rows at 448px cells.

## 10. Sheet Production Plan

LAMUH production should proceed in this order:

1. Sheet 1 - Core Movement.
2. Sheet 3 - Ground Normals, neutral basics first.
3. Sheet 4 - Air Normals.
4. Directional normals if needed.
5. Defense and hit reactions.
6. Specials.
7. Ultimate and separate VFX.
8. End states and select portrait.
9. Runtime import.
10. Hidden/test-only smoke.
11. Public character select enablement.

Do not produce multiple sheets before Sheet 1 is audited. Sheet 1 locks scale, baseline, silhouette, cloak behavior, loc behavior, and palette discipline.

## 11. Sheet 1 Exact Contract

Filename:

```text
lamuh_sheet_1_core_movement_atlas.png
```

Purpose:

Core movement identity anchor.

Folder when eventually produced:

```text
NO_GODS_ABOVE/assets/sprites/lamuh_final/
```

Atlas specs:

- Atlas size: 3584x2688.
- Cell size: 448x448.
- Grid: 8 columns x 6 rows.
- BaselineY: 382.
- Fixed source cells: true.
- Anchor mode: lockedFrameBottomCenter.
- Background: transparent for final runtime atlas.
- No trimming.
- Right-facing source art.
- Runtime mirrors facing.
- No text.
- No labels.
- No numbers.
- No debug baselines.
- No grid lines.
- No UI.

Rows:

| Row | Runtime animation | Frames | Direction |
|---:|---|---:|---|
| 0 | `idle` / `select_idle` | 8 | Calm elite stance, relaxed dominance, subtle breathing, minimal contained cyan/gold accent. |
| 1 | `walk_forward` | 6 | Controlled forward pressure, clean sandal footfalls, cloak/locs follow naturally. |
| 2 | `walk_back` | 6 | Guarded retreat, composed posture, no panic or sliding. |
| 3 | `dash_forward` | 6 | Quick explosive burst, readable body lean, code-driven travel, contained cloth/hair follow-through. |
| 4 | `dash_back` | 6 | Stylish fast retreat, clean reset posture, no excessive smear outside body silhouette. |
| 5 | `crouch` / `low_stance` | 4 | Low balanced martial stance, ready posture, cloak contained around body and knees. |

Frame-count policy:

- The atlas may have 8 columns for every row.
- Rows with fewer than 8 runtime frames should use `frameCounts`.
- Recommended future metadata for Sheet 1:

```js
lamuhFinalCoreMovement: {
  cols: 8,
  rows: 6,
  cellSize: 448,
  baselineY: 382,
  scale: 1.0,
  frameCounts: [8, 6, 6, 6, 6, 4],
  fixedSourceCells: true,
  anchorMode: "lockedFrameBottomCenter",
  skipSanitize: true
}
```

Sheet 1 animation direction:

- LAMUH should feel fast, smooth, confident, and composed.
- Idle should have calm "I know I'm him" energy.
- Walk should feel controlled and elite.
- Dash should be quick and explosive but readable.
- Cloak and locs should move naturally but stay contained.
- Sandals and feet should align clearly to the baseline.
- No aura overload in movement sheet.
- Subtle cyan/gold energy accents only if contained and not VFX-heavy.
- No attack poses in Sheet 1.
- No beam, projectile, or ultimate buildup in Sheet 1.

Sheet 1 reject conditions:

- Locs read as weapons.
- Cloak reads as a weapon or giant wing.
- Feet do not align to baseline.
- Body scale changes between rows.
- Dash contains baked long travel.
- Aura hides body mechanics.
- Hair or cloak crosses cell boundaries.
- Any frame includes extra bodies, ghosting, UI, labels, or debug marks.

## 12. Risks And Guardrails

Risk: locs become accidental attack shapes.

Guardrail: locs must remain hair-only secondary motion. Reject any frame where locs extend toward the opponent like a strike, grab, whip, rope, chain, or tentacle.

Risk: white haori hides movement readability.

Guardrail: keep hands, elbows, knees, feet, and torso readable. If the cloak covers key body mechanics, repair before import.

Risk: aura overload makes Sheet 1 look like a special-move sheet.

Guardrail: keep Sheet 1 mostly body-first. Use only subtle contained cyan/gold accents.

Risk: 448px cells make LAMUH feel too large compared with Kairo/Vanta.

Guardrail: follow Sol-style metadata first, then adjust only `sheetMeta.scale`, `baselineY`, or `anchorX` during a future visual import pass. Do not compensate by changing gameplay movement, hitboxes, damage, or health.

Risk: runtime P2 animation mapping misses enemy-prefixed keys.

Guardrail: when runtime work begins, create both player and enemy animation maps from the same sheet rows. Include `enemy_air_dash_forward` and `enemy_air_dash_back` from the start.

Risk: future directional specials collide with current input assumptions.

Guardrail: defer directional specials until LAMUH basics are playable. Keep the first implementation to existing key actions and existing move slots.

## 13. Future Special And Ultimate Notes

This section is later work. Do not implement it during Sheet 1 production.

Future special direction:

- Ki palm burst.
- Vanish-like step-in strike.
- Rising knee / palm anti-air.
- Short aura guard-break strike.
- Beam feint only if it remains readable and balanced.

Future ultimate direction:

- Cinematic martial combo.
- Multiple fast body-first hits.
- Final palm or two-hand ki release.
- Giant celestial beam finisher.
- Beam and large aura should be separate VFX or code-driven effects, not baked into movement sprites.

Ultimate guardrails:

- Locs do not become part of the beam.
- Cloak does not become the attack.
- Beam does not require changing core combat systems.
- Use existing ultimate/meter flow first.
- Keep P1/P2 support from the start when runtime implementation begins.

## Implementation Stop Line

This document is the stop line for the current pass.

No runtime implementation has started. LAMUH is not added to `assetPaths`, `sheetMeta`, `characterProfiles`, `selectableCharacterIds`, or character select markup by this document.
