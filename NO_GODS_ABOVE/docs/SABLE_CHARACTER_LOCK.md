# Sable Character Lock

## Identity

- Name: Sable
- Title: The Void Cartographer
- Role: Void / space-control fighter
- Ensemble position: Playable roster member, not the central protagonist.

## Gameplay Direction

Sable contrasts Lamuh. Lamuh is celestial pressure and forward aggression. Sable is void spacing, traps, evasive punishment, and lower direct damage.

## MVP Implementation

- Sable is selectable from character select.
- Sable can start a match against Lamuh.
- Required base states are mapped to a temporary Sable placeholder atlas: idle, walk, dash, crouch, jump, fall, block, hitstun, knockdown, getup, death, victory, intro, and select.
- Ground light, medium, and heavy are implemented.
- Air light, medium, and heavy are implemented.
- Sable follows the five-family special standard in `NO_GODS_ABOVE/docs/SPECIAL_MOVE_STANDARD.md`.
- Sable has seven practical MVP specials, not fifteen unique specials.
- Neutral, Back, Down, and Up are single-version specials. Their unused Light/Medium/Heavy compatibility slots intentionally alias to the base family move.
- Forward Special has meaningful Light/Medium/Heavy variants.
- Back special places a temporary Void Anchor trap. The anchor arms after a short delay, expires automatically, and disappears after triggering.

## Special Move Metadata

| Move | Input | Variant behavior | Unique? | Gameplay purpose | Current art status |
| --- | --- | --- | --- | --- | --- |
| Void Shard | Neutral Special | Single slow shard / pressure pulse. Neutral L/M/H and `special_1/2/3` are intentional aliases. | Yes | Space control and safe pressure at lower damage than Lamuh. | Placeholder body row and procedural projectile. |
| Short Phase Lunge | Forward + Light Special | Short, faster lunge. | Yes | Close whiff punish and combo routing. | Placeholder body row. |
| Far Phase Lunge | Forward + Medium Special | Longer approach with more recovery. | Yes | Midrange callout and spacing punish. | Placeholder body row. |
| Heavy Phase Lunge | Forward + Heavy Special | Farthest and strongest lunge with heavier recovery. | Yes | High-commitment punish / route ender. | Placeholder body row. |
| Void Anchor | Back Special | Single trap placement. Back L/M/H are intentional aliases. | Yes | Evasive punishment and lane control. | Placeholder body row and procedural anchor VFX. |
| Ground Rift | Down Special | Single ground snare. Down L/M/H are intentional aliases. | Yes | Stops grounded approach and creates small pop-up pressure. | Placeholder body row and procedural hit VFX. |
| Vertical Phase | Up Special | Single vertical phase step / anti-air. Up L/M/H are intentional aliases. | Yes | Anti-air and vertical escape without invincible spam. | Placeholder body row. |

Compatibility-only air special slots currently alias to Void Shard and are not counted as separate player-facing specials.

## Balance Guardrails

- Lower health and direct damage than Lamuh.
- Stronger emphasis on lane control and whiff punishment.
- Phase movement has recovery and is not invincible by default.
- Void Anchor is limited to one active anchor per owner, has an arm time, and removes itself on hit or expiration.
- Compatibility aliases must remain safe, documented, and non-player-facing until a future variant is intentionally designed.

## Placeholder Art

The current runtime art is temporary and intentionally labeled:

- `NO_GODS_ABOVE/assets/sprites/sable_placeholder/sable_mvp_placeholder_atlas.png`
- `NO_GODS_ABOVE/assets/sprites/portraits/sable_select.png`

These files are not final Sable art. Replace them only with validated transparent runtime atlases that follow `NO_GODS_ABOVE/docs/CHARACTER_SPRITE_PIPELINE.md`.
