# Special Move Standard

## Core Rule

No Gods Above uses five core special families per character:

- Neutral Special
- Forward Special
- Back Special
- Down Special
- Up Special

The engine may keep directional strength slots such as `neutral_light_special`, `forward_medium_special`, or `up_heavy_special` for compatibility, but those slots are not a content requirement.

## Variant Rule

Light, Medium, and Heavy variants are optional. Add variants only when they improve gameplay clarity, routing, risk, or expression.

Recommended demo target:

- Most characters: 5 to 7 practical specials.
- Larger kits: 8 to 9 practical specials only when the character benefits.
- 15 unique specials: rare, never required, and never a checklist item.

Preferred pattern:

- Neutral Special: usually one version, or Light/Medium/Heavy only if it is the character's signature tool.
- Forward Special: often Light/Medium/Heavy because approach and combo routing benefit from distance/risk variants.
- Back Special: usually one version.
- Down Special: usually one version.
- Up Special: usually one version.

## Compatibility Aliases

Placeholder aliases are allowed when they are clearly labeled in code or docs. An alias must safely resolve to a real move and must not be presented as a unique player-facing special.

Valid states for validation:

- Required core special present: the family has a working move.
- Intentional alias: the compatibility slot resolves to a documented base move.
- Future variant TODO: the slot is reserved for later design but is not required for the current kit.
- Broken or missing move: the slot is referenced by input, AI, cancel routes, or docs but does not resolve safely.

Validation should fail broken or missing moves. It should not fail a character for intentionally aliasing unused Light/Medium/Heavy slots.

## Public Documentation

Steam, release, public roster, and player-facing docs should describe only real player-facing moves. Internal compatibility aliases can be listed in implementation docs, but they should not inflate the advertised move count.
