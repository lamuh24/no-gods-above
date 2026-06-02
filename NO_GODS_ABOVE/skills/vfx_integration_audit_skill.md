# VFX Integration Audit Skill

Purpose: keep VFX attached, readable, and character-appropriate instead of pasted on.

Use this before or after wiring any projectile, trail, burst, beam, impact, slash, phase, or aura asset.

## Move-Specific Anchor Audit

For each move, record:

- move key
- VFX asset path
- spawn frame/time
- x/y offset
- scale
- duration
- alpha
- whether it mirrors with facing
- whether it follows the character
- whether it stays world-anchored
- intended anchor point: hand, foot, torso, ground, previous position, beam origin, impact point
- whether the effect improves readability

Do not use one generic VFX offset for multiple moves unless they share the same body pose and timing.

## Anchor Guidelines

Celestial Palm:

- Anchor to palm or hand center.
- Projectile origin must not be too low.
- Test P1/P2 and facing left/right.

Ascend Step:

- Trail should sit behind the rushing body, not in front.
- Use short duration and body/previous-position anchoring.
- Disable if it floats away from the dash.

Heaven Splitter:

- Vertical burst should originate from the rising strike path or under LAMUH.
- Disable if it does not match the upward body motion.

Radiant Dive:

- Trail should follow the diagonal dive vector behind the foot/body path.
- Disable if the angle cannot match the sprite.

Divine Vanish:

- Preserve the purple phase/afterimage identity.
- Do not replace it with gold/cyan LAMUH VFX.
- Do not attach candidate pack gold/cyan overlays to this move.

## Classification

- `KEEP`: aligned and improves runtime readability.
- `OFFSET_FIX`: close enough; needs final x/y/scale/duration tuning.
- `DISABLE_FOR_NOW`: looks pasted on or hurts readability.
- `REFERENCE_ONLY`: useful visual idea, not runtime-ready.

## Seris Detached Chain Failure Lesson

- Detached chains, crescents, and tethers can create visual noise, duplicate bodies, and edge bleed.
- Keep detached VFX off regular gameplay unless it has clean assets, stable anchors, and explicit runtime support.
- Do not restore Seris Sheet 8 regular gameplay VFX casually.

## LAMUH Regular VFX Lesson

- Celestial Palm was closest because it had a clear hand/projectile relationship.
- Ascend Step, Heaven Splitter, and Radiant Dive candidate VFX needed move-specific anchoring; if they still look pasted on, disable them.
- Purple Divine Vanish is a separate identity and must remain separate from gold/cyan ki VFX.

## Preview Requirements

Capture or generate:

- P1 facing right.
- P1 facing left.
- P2 facing right.
- P2 facing left.
- active frame screenshot for each VFX.
- optional GIF when timing is the concern.

## Validation

- `node --check NO_GODS_ABOVE/game.js` if runtime code changes.
- `git diff --check`.
- Public or hidden smoke with console/network capture.
- Confirm no failed asset requests.
- Confirm no stale/generated/local path requests.
- Confirm no Seris Sheet 8/effects requests unless explicitly approved.

## Do Not

- Do not force a VFX asset into runtime because it exists.
- Do not make VFX hide the hit pose.
- Do not let mirrored effects spawn on the wrong side.
- Do not replace a character-specific identity effect with a generic palette.

## Prompt Template

```text
Audit current VFX hooks for [CHARACTER/MOVE LIST].
Report asset, timing, offset, scale, mirroring, follow/world behavior, and classify KEEP/OFFSET_FIX/DISABLE_FOR_NOW/REFERENCE_ONLY.
Do not remove VFX until the audit is complete.
```

