# Character Visual Consistency Skill

Purpose: prevent a fighter from becoming a different-looking character across sheets, rows, transformations, or VFX passes.

Use this after Sheet 1 approval, before later sheet production, and before runtime import.

## Identity Anchor Workflow

1. Treat approved Sheet 1 as the visual anchor.
2. Extract the permanent identity rules:
   - hair shape and behavior
   - skin tone
   - outfit silhouette
   - palette
   - weapon or no-weapon identity
   - power source
   - outline weight
   - body scale
3. Compare every later sheet to Sheet 1 before packaging.
4. Reject rows that look like a different costume, species, age, weapon set, or power system.

## Visual Consistency Checklist

- Hair remains the same identity.
- Palette remains stable.
- Skin and outfit colors are not globally tinted.
- Silhouette matches the approved body type.
- Outfit length and major shapes stay consistent.
- Weapon/power language follows the character lock.
- Hands, feet, and face remain recognizable.
- VFX supports the character instead of replacing the body.
- Transformations enhance the locked identity instead of creating a new character.

## Scale Drift Checks

- Compare idle height and body width to Sheet 1.
- Compare crouch and get-up to the same body proportions.
- Compare ground normals against idle/walk.
- Compare air normals against air movement.
- Compare specials against normals.
- Compare hit reactions against neutral body size.
- Flag sudden growth caused by cloak, hair, aura, or attack smears.

## LAMUH Lessons

- Locs are hair only. They must never become whips, ropes, chains, tentacles, attack limbs, or beam bodies.
- Ascended LAMUH should have golden/white-gold locs and stronger aura, not a global yellow overlay.
- The cloak should remain white and the dark inner outfit should remain dark during transformation.
- A hand-origin energy orb must align with the palms; detached orbs make the animation read as pasted-on VFX.

## Seris Lessons

- Detached chain language can overwhelm body readability.
- Do not patch broken chain-body rows forward if the silhouette has holes, duplicated bodies, or fragmented chains.
- Keep `SERIS_CHAIN_VFX_RUNTIME_ENABLED = false` unless a later pass explicitly approves a separate VFX system.
- If a generated row embeds clutter into body art, prefer a clean body row and separate VFX later.

## Nyx And Sol Lessons

- Nyx slash VFX should stay on dedicated VFX sheets or specific signature hooks, not procedural clutter.
- Sol should stay body-first with compact gauntlet/impact accents, not Seris-style chains or tethers.
- New-generation fighters should use final folders and final portraits before public enablement.

## Preserve / Fix / Regenerate

Preserve when:

- silhouette, palette, identity, and baseline match the anchor.

Fix when:

- pose is good but offset, tint, alpha, or small artifact is wrong.

Target regenerate when:

- one row breaks identity or motion but the rest of the sheet is good.

Fully regenerate when:

- multiple rows look like different characters or the source has systemic grid/identity failure.

## Do Not

- Do not accept "cool" if it breaks identity.
- Do not globally tint a sprite to sell transformation.
- Do not let hair, cloth, aura, or chains become accidental weapons.
- Do not compensate for inconsistent art by changing gameplay values.

## Prompt Template

```text
Audit [SHEET] against approved Sheet 1 for [CHARACTER].
Classify each row as PRESERVE, FIX, TARGET_REGEN, or FULL_REGEN.
Focus on hair, palette, outfit, silhouette, scale, baseline, and power identity.
Do not change runtime.
```

