# Sprite Clip Prompt: {{characterId}} / {{clipId}}

Use the Style 4 HD pixel anime fighter standard plus the character-specific redo style lock. For Sable, the pixel reference style is the exact game target, and the whole MVP pack must maintain the same crisp pixel-art detail level.

Clip: `{{clipId}}`
Subject: `{{displayName}}` only
Category: `{{category}}`
Frame count: `{{frameCount}}`
FPS target: `{{fps}}`
Loop: `{{loop}}`
Canvas: `{{frameWidth}}x{{frameHeight}}` per frame
Facing: `{{facing}}`
BaselineY: `{{baselineY}}`

## Motion Direction

Create exactly {{frameCount}} frames for `{{clipId}}`.
Show {{displayName}} only. Do not include any other character, prop character, weapon, UI card, title, logo, or background scene.

The result must be:

- one horizontal strip sized `{{stripWidth}}x{{frameHeight}}`
- exactly {{frameCount}} equal cells, each `{{frameWidth}}x{{frameHeight}}`
- no grid layout, no second row, no stacked layout, and no visible cell borders

Every frame must keep the same character scale and identity. Do not include text, labels, borders, background, floor, props, or camera framing marks.

## Character Lock

{{characterSpecSummary}}

## Redo Style Lock

{{styleLock}}

## Clip Notes

{{clipNotes}}

## Output Requirement

Return only the sprite sheet image. No caption text inside the image.
