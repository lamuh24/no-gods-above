# Cinematic Ultimate Production Skill

Purpose: create cinematic ultimates safely through preproduction, asset contracts, hidden runtime, and staged polish.

Use this for supers like LAMUH's Crown of No Gods. Do not use it to retune a character's accepted base kit.

## Guardrails

- Do not implement the final ultimate before the preproduction contract exists.
- Do not change existing fighters.
- Do not rewrite combat.
- Do not build transformation unless explicitly approved.
- Keep whiff behavior sane.
- Keep P1/P2 and facing support from the start.
- Keep ultimate VFX separated from body sheets unless the contract says otherwise.

## Preproduction Contract

Create `NO_GODS_ABOVE/docs/[character]_ultimate_[name].md` with:

- ultimate name
- gameplay intent
- cinematic fantasy
- phase sequence
- hit-confirm behavior
- whiff behavior
- block behavior if any
- meter behavior
- damage intention
- camera, shake, flash, and hitstop recommendations
- victim choreography
- required body and VFX assets
- runtime risks
- safe implementation order

## Recommended Phase Sequence

1. super startup / flash
2. rush-forward starter hit
3. confirm check
4. cinematic combo string
5. launch/setup
6. transformation or power escalation if approved
7. beam/projectile/finisher charge
8. beam/projectile/finisher fire
9. impact/explosion
10. recovery / finish pose

## Asset Breakdown

Body sheet:

- contains character body performance only.
- no full beam.
- no impact explosion.
- right-facing source art.
- fixed cells and baseline rules match the character pipeline.

Beam/projectile VFX sheet:

- contains VFX only.
- stable origin.
- clear direction.
- transparent RGBA.
- no body, UI, text, or impact explosion.

Impact VFX sheet:

- contains hit/explosion/aftermath only.
- does not duplicate beam body.
- should be timed to damage application.

Optional super flash:

- portrait flash, screen flash, aura burst, or UI overlay.
- keep it short and low-risk.

## Runtime Implementation Order

1. Add hidden feature flag or character-only branch.
2. Load assets with fallback-safe paths.
3. Add startup/rush row mapping.
4. Add hit-confirm starter.
5. On whiff, recover without cinematic.
6. On hit, lock both fighters.
7. Play body rows in order.
8. Puppet victim position and animation states.
9. Spawn VFX at the correct phase.
10. Apply damage once.
11. Release victim into knockdown.
12. Restore normal control.
13. Test P1/P2 and facing both directions.

## Victim Choreography

Do not leave the opponent standing idle during a cinematic.

Use existing victim animations:

- starter: medium/heavy hit reaction
- combo: medium/heavy hit reactions or airborne hit reactions
- launch: launch, airborne, falling, or hard hit
- charge: suspended/staggered airborne pose
- beam/fire: heavy hit, knockdown fall, or strongest available reaction
- end: knockdown/downed/hard knockdown

Fallback gracefully for legacy fighters that lack new-generation keys.

## LAMUH Crown Of No Gods Lessons

- A beam overlay on placeholder ultimate is not enough; it reads like regular gameplay.
- The opponent must travel during the cinematic.
- Add explicit anchors: attacker start, opponent start, carry point, launch point, beam target, beam origin.
- Victim animation must change with beats, not remain default hitstun.
- Transformation should happen at the beam escalation, not across the full combo unless approved.
- Ascended hair should enhance LAMUH's loc identity, not become generic spiky hair or a global tint.
- Beam origin must be stable and aligned to hands.

## Runtime Smoke Checklist

- whiff does not trigger full cinematic.
- hit confirms into cinematic.
- meter spend follows existing convention.
- damage applies once.
- beam or finisher spawns at intended phase.
- victim travels and animates.
- P1 facing right works.
- P1 facing left works.
- P2 facing right works.
- P2 facing left works.
- existing fighters' ultimates still work.
- no failed requests or console errors.

## Prompt Template

```text
Create the preproduction contract for [CHARACTER] ultimate [NAME].
Do not implement runtime or generate sheets.
Include hit/whiff behavior, asset contracts, victim choreography, and safe implementation order.
```

