# Sol Raze Sprite Production Plan

Sol Raze, the Iron Sun, is the next planned new-generation fighter for NO GODS ABOVE after the Seris rollback. This is a sprite-sheet production plan only.

Do not generate Sol art from this document yet. Do not add runtime code, rebuild combat, redesign Kairo, Vanta, or Nyx, restart Seris, or begin controller support from this brief.

## Core Identity

- Name: Sol Raze
- Title: The Iron Sun
- Archetype: Grounded solar-gauntlet pressure brawler
- Fantasy: A disciplined martial artist with steel gauntlets who compresses solar energy into blunt, body-first strikes.
- Gameplay read: Deliberate footwork, high-medium health, medium-high damage, medium-low speed, shorter heavy combo routes, strong anti-air threat.
- Visual read: Sacred boxer, impact monk, solar iron martial artist.
- Palette: White, black, steel gray, solar gold.
- VFX language: Compact gold sparks, short gauntlet trails, small impact rings, brief aura pulses, dust and shock puffs.

## Character Lock

```text
Character name: Sol Raze
Gender/body type: Athletic adult martial artist, grounded stance, strong shoulders and forearms
Theme: Solar-gauntlet pressure brawler, sacred boxer, impact monk
Hair: Short bright white or pale gold hair, clean readable silhouette
Armor/clothing: White martial coat or sleeveless mantle, black underlayer, steel gray plated gauntlets, solar-gold trim
Weapon: Steel solar gauntlets only; no handheld weapon, no chains, no whip, no tether
Energy color: Bright solar gold with white-hot centers and muted orange edge glow
Forbidden design elements: No chain links, no whip trails, no long detached weapon overlays, no floating swords, no projectile weapon body, no Nyx-style purple shadow effects
Silhouette notes: Wide planted stance, heavy forearms, squared shoulders, compact strike arcs, body-first motion
```

## Sheet Standard

Use the clean NO GODS ABOVE fighter atlas standard:

- 7 clean body sheets.
- Each body sheet is 6 columns x 5 rows.
- Each row has 6 runtime frames.
- Total body animations: 35 rows.
- Total body frames: 210 cells.
- Suggested clean-sheet size: 1920 x 1600 if using 320 x 320 cells.
- Clean sheets use solid `#ff00ff` magenta background before extraction.
- Runtime extraction may convert clean sheets to transparent atlases later.
- No text, labels, debug lines, frame numbers, grid lines, UI, or title art on clean sheets.
- Generate and validate exactly one sheet at a time.

## Full Animation List

### Sheet 1 - Basic Movement

| Row | Runtime row | Frames | Sol-specific direction |
|---|---:|---:|---|
| 1 | `idle` | 6 | Planted guard, slow solar breathing, gauntlets low and ready. |
| 2 | `walk_forward` | 6 | Heavy measured advance, shoulders steady, no sliding feet. |
| 3 | `walk_back` | 6 | Guarded retreat, palms angled forward, grounded posture. |
| 4 | `dash` | 6 | Short shoulder-led burst with a small heel spark and body blur only. |
| 5 | `crouch` | 6 | Low defensive stance, one gauntlet guarding ribs, one palm forward. |

### Sheet 2 - Defense / Recovery

| Row | Runtime row | Frames | Sol-specific direction |
|---|---:|---:|---|
| 1 | `stand_up` | 6 | Return from low brace to neutral guard. |
| 2 | `guard_idle` | 6 | Crossed gauntlet block, solar glint on impact side. |
| 3 | `hurt` | 6 | Light body recoil, gauntlets still protecting centerline. |
| 4 | `knockback` | 6 | Heavy stagger backward, boots scraping with small dust puffs. |
| 5 | `get_up` | 6 | Push up from one knee, gauntlet plants on ground briefly. |

### Sheet 3 - Core Attacks A

| Row | Runtime row | Frames | Sol move / direction |
|---|---:|---:|---|
| 1 | `neutral_light` | 6 | Sun Jab: compact lead-hand jab, tiny gold knuckle spark. |
| 2 | `neutral_medium` | 6 | Iron Palm: forward palm burst from centerline, small circular hit flash. |
| 3 | `neutral_heavy` | 6 | Furnace Hook: short heavy hook, gold arc stays close to gauntlet. |
| 4 | `forward_light` | 6 | Pressure step jab, slight forward lean but travel stays code-driven. |
| 5 | `forward_medium` | 6 | Shoulder palm check, blunt close-range body pressure. |

### Sheet 4 - Core Attacks B

| Row | Runtime row | Frames | Sol move / direction |
|---|---:|---:|---|
| 1 | `forward_heavy` | 6 | Solar hammerfist, downward diagonal impact with dust at feet. |
| 2 | `back_light` | 6 | Retreating guard tap, short defensive poke. |
| 3 | `back_medium` | 6 | Back-step elbow, compact gold elbow flash. |
| 4 | `back_heavy` | 6 | Dawn Upper: main launcher row, rising gauntlet uppercut with small halo ring. |
| 5 | `taunt` | 6 | Calm iron-sun prayer stance, gauntlets touch and pulse once. |

### Sheet 5 - Low / Air

| Row | Runtime row | Frames | Sol move / direction |
|---|---:|---:|---|
| 1 | `down_light` | 6 | Low knuckle tap, close to ground, no long sweep effect. |
| 2 | `down_medium` | 6 | Low iron palm to body line, crouched pressure check. |
| 3 | `down_heavy` | 6 | Rising low-to-high gauntlet lift, secondary anti-air option. |
| 4 | `jump_light` | 6 | Falling Tap: quick downward palm, restrained air pose. |
| 5 | `jump_medium` | 6 | Comet Knee: knee-first impact with small gold knee spark. |

### Sheet 6 - Specials / Ultimate

| Row | Runtime row | Frames | Sol move / direction |
|---|---:|---:|---|
| 1 | `jump_heavy` | 6 | Sunfall Axe: descending axe kick or hammerfist, strong downward finish. |
| 2 | `special_1` | 6 | Solar Step: grounded burst step with brief heel spark and gauntlet flare. |
| 3 | `special_2` | 6 | Radiant Break: armored palm smash, circular impact ring at chest height. |
| 4 | `special_3` | 6 | Rising Halo: vertical anti-air palm/uppercut, compact halo ring rises with body. |
| 5 | `ultimate` | 6 | Solar Verdict: body-centered judgment strike, large but contained solar blast. |

### Sheet 7 - End States / Extras

| Row | Runtime row | Frames | Sol-specific direction |
|---|---:|---:|---|
| 1 | `death` | 6 | Heavy collapse, gauntlets dim, no dramatic dismembered effects. |
| 2 | `victory` | 6 | Turns gauntlets inward, solar aura settles behind shoulders. |
| 3 | `level_up` | 6 | Power-up pulse, small sun disc forms behind the back then fades. |
| 4 | `intro_pose` | 6 | Steps in, tightens gauntlets, plants feet. |
| 5 | `select_idle` | 6 | Character-select loop, readable heroic stance with subtle solar pulse. |

## Move Mapping

- Light Attack: `neutral_light` - Sun Jab.
- Medium Attack: `neutral_medium` - Iron Palm.
- Heavy Attack: `neutral_heavy` - Furnace Hook.
- Launcher: `back_heavy` - Dawn Upper.
- Air Light: `jump_light` - Falling Tap.
- Air Medium: `jump_medium` - Comet Knee.
- Air Heavy: `jump_heavy` - Sunfall Axe.
- Special 1: `special_1` - Solar Step.
- Special 2: `special_2` - Radiant Break.
- Special 3: `special_3` - Rising Halo.
- Signature / Ultimate: `ultimate` - Solar Verdict.

## Frame Composition Rules

Every 6-frame row should read as a complete mini-animation:

- Frame 1: Ready/start pose.
- Frame 2: Startup or weight shift.
- Frame 3: Main extension or active strike.
- Frame 4: Peak impact or VFX flash.
- Frame 5: Recoil/recovery.
- Frame 6: Return toward neutral or held recovery.

For movement rows, use smoother loops:

- Idle: 6 looping breathing frames.
- Walk forward/back: 6 evenly spaced walk-cycle frames.
- Dash/Solar Step: anticipation, burst, peak smear, plant, recover, settle.
- Crouch/guard: 6 frames may include a held stable pose after the transition.

Do not change combat timing to match the art later. If an animation needs fewer unique poses, hold or duplicate clean poses inside the 6-frame row.

## Separate VFX Recommendations

Sol should use separate compact VFX sheets only for impact polish. The body sheets must still read correctly with VFX disabled.

Recommended VFX categories:

- Hit sparks: Small gold-white starbursts for light, medium, heavy, launcher, air hits.
- Impact rings: Short-lived circular rings for Iron Palm, Radiant Break, Rising Halo, and Solar Verdict.
- Gauntlet trails: 2 to 4 frame close trails that hug the fist, elbow, knee, or palm.
- Dust/shock puffs: Grounded puffs for heavy attacks, dash plants, knockback, and Sunfall Axe landing.
- Aura pulses: Brief body-centered solar flare for intro, victory, level-up, Radiant Break, and ultimate startup.

Recommended VFX sheet plan:

| VFX sheet | Rows | Use |
|---|---:|---|
| `sol_vfx_hit_sparks` | 5 rows x 6 frames | Jab spark, palm spark, hook flash, upper spark, air impact spark. |
| `sol_vfx_rings_dust` | 5 rows x 6 frames | Palm ring, Rising Halo ring, Radiant Break ring, Solar Verdict ring, heavy dust puff. |
| `sol_vfx_aura_pulses` | 5 rows x 6 frames | Idle glint, intro pulse, victory pulse, Solar Step heel flare, ultimate aura. |

VFX rules:

- Keep all VFX compact and centered near Sol's body or the impact point.
- No long detached overlays.
- No projectile weapon body.
- No chain, whip, tether, rope, ribbon, or extended segmented effect.
- No large crescent slash language, because that belongs closer to Seris/Nyx territory.
- Ultimate VFX may be larger, but it must remain centered on Sol, his gauntlet, the opponent impact area, or the immediate ground shock zone.

## Consistency Rules

- Sol always faces right in source sheets; runtime handles facing flips.
- Feet stay on one invisible baseline for grounded rows.
- Body scale stays consistent across all sheets.
- The steel gauntlets must remain the strongest silhouette marker in every row.
- Solar gold should be bright but not replace the body silhouette.
- White clothing should not blend into white-hot VFX; separate with black/steel outlines.
- Attack arcs stay close to limbs.
- Movement is body-first, not effect-first.
- Solar Step travel is represented by pose and small sparks only; actual displacement remains code-driven.
- Rising Halo must read as an uppercut/anti-air, not a projectile.
- Solar Verdict must read as a martial strike causing a solar judgment impact, not a beam super.
- Never use Seris-style long weapon overlays or Nyx-style shadow slash waves.

## Reusable Sheet Prompt Template

Use this only after the plan is approved and only one sheet at a time.

```text
Create one clean 2D pixel-art anime fighting game sprite sheet for NO GODS ABOVE.

Character lock:
Sol Raze, the Iron Sun. Athletic grounded solar-gauntlet martial artist, sacred boxer / impact monk, white and black martial clothing, steel gray gauntlets, solar-gold energy accents, short pale hair, strong planted stance, compact body-first strikes.

Sheet:
<SHEET_NUMBER_AND_NAME>

Canvas and layout:
6 columns x 5 rows, 6 frames per row, equal-size cells, solid #ff00ff magenta background, no text, no labels, no numbers, no grid, no debug lines, no UI.

Rows:
Row 1 = <ROW_1_NAME_AND_ACTION>
Row 2 = <ROW_2_NAME_AND_ACTION>
Row 3 = <ROW_3_NAME_AND_ACTION>
Row 4 = <ROW_4_NAME_AND_ACTION>
Row 5 = <ROW_5_NAME_AND_ACTION>

Animation rules:
Each row is a readable 6-frame fighting-game animation. Keep Sol's body scale consistent. Keep grounded feet aligned to the same invisible baseline. Keep all limbs, gauntlets, sparks, rings, dust, and aura pulses inside each cell. Face right. Use compact gold hit sparks, short gauntlet trails, small circular impact rings, and brief body-centered solar aura only.

Forbidden:
No chain, no whip, no tether, no rope, no long detached overlay, no projectile weapon body, no floating weapon, no purple shadow energy, no giant slash wave, no frame overlap, no neighboring-cell bleed.
```

## Recommended Production Order

1. Lock this plan and create a Sol character-lock file.
2. Produce Sheet 1 first, because idle/walk/dash/crouch establishes scale, baseline, silhouette, and palette.
3. Audit Sheet 1 before any other sheet: frame grid, baseline, scale, no bleed, no chroma contamination, readable gauntlets.
4. Produce Sheet 3 and Sheet 4 next, because Sol's identity depends on grounded pressure normals and Dawn Upper.
5. Produce Sheet 5 after the grounded attacks, keeping air movement restrained and not Nyx-like.
6. Produce Sheet 6 after the normal attacks are stable, especially Radiant Break, Rising Halo, and Solar Verdict.
7. Produce Sheet 2 after the attack language is locked, matching defensive poses to the established silhouette.
8. Produce Sheet 7 last for select idle, intro, victory, and end states.
9. Produce separate compact VFX sheets only after body sheets pass static audit.
10. Create character-select portrait/card art from the approved `select_idle`, `intro_pose`, and `victory` language.
11. Run atlas validation on every clean sheet before extraction/import.
12. Import Sol only after static sheet previews are clean; then smoke-test against Kairo, Vanta, and Nyx without touching their configs.

## Static Audit Checklist

- 6 columns x 5 rows on every clean sheet.
- 6 frames per row.
- Equal cell dimensions.
- Solid `#ff00ff` background on clean generation output.
- No text, labels, grid, debug marks, or UI.
- No frame-edge clipping.
- No neighboring-cell overlap.
- No body fragments from adjacent frames.
- No baked duplicate Sol bodies in one cell.
- Grounded feet align to the same baseline.
- Gauntlets remain consistent in size and design.
- VFX stays compact and body/impact attached.
- No chain/whip/tether visual language.
- Body-only animation still reads without separate VFX.
- Runtime-facing rows match the animation map above.

## Implementation Notes For Later

- Sol should start as a new character folder, not by modifying Kairo, Vanta, Nyx, or Seris assets.
- Keep Sol gameplay tuning inside Sol's future character config.
- Do not tune shared combat constants for Sol unless explicitly requested in a later gameplay pass.
- If the generated sheets include large solar blasts baked into body cells, reject or repair them before import.
- If Solar Verdict needs a bigger visual, put the big flash/ring into a separate VFX sheet instead of stretching the body sheet format.
