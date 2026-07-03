# Retry Prompt: {{characterId}} / {{clipId}}

Regenerate `{{clipId}}` for `{{characterId}}`.

The previous sheet was rejected or needs retry because:

{{failureBullets}}

Keep the locked identity and Style 4 target exactly:

{{characterSpecSummary}}

Hard requirements:

- {{frameCount}} frames.
- 448x448 transparent canvas per frame.
- Character faces right.
- Feet align to baselineY 382.
- No background, text, labels, borders, watermark, or frame grid.
- No cropping.
- Stable scale and center across all frames.
- Preserve the exact character design.

Return only the corrected sprite sheet image.
