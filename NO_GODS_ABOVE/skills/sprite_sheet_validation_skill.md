# Sprite Sheet Validation Skill

Purpose: validate generated sprite sheets before they are wired into runtime.

Use this before importing any new character, VFX, UI atlas, or corrected row into live code.

## Required Inputs

- Expected file path.
- Expected atlas dimensions.
- Expected grid and cell size.
- Expected row names.
- Expected active frame counts.
- Expected baselineY and anchor mode.
- Whether inactive cells must be transparent or may use held poses.
- Source-art facing direction.

## Technical Validation Checklist

- Confirm PNG exists at the expected path.
- Confirm exact atlas width and height.
- Confirm exact grid and cell size.
- Confirm RGBA mode with alpha.
- Confirm transparent background.
- Confirm magenta/chroma/background cleanup.
- Confirm no row bleed or neighbor-cell bleed.
- Confirm no edge bleed unless intentionally allowed.
- Confirm no cropped hair, cloak, weapons, hands, feet, sandals, or VFX accents.
- Confirm inactive trailing cells are transparent or clean held poses.
- Confirm no duplicate body fragments.
- Confirm no detached artifacts unless the sheet is explicitly a detached VFX sheet.
- Confirm no text, UI, labels, debug marks, or grid lines.

## Measurement Audit

For each active frame, measure:

- opaque bounding box
- visible width and height
- top Y and bottom Y
- center X and center Y
- baseline delta from expected baselineY
- bottom-to-baseline distance
- edge contact
- empty-frame status
- extreme bounds caused by hair, cloak, aura, or weapons

Group the report by:

- sheet
- row
- animation key
- frame
- pass/warn/fail

## Visual Preview Outputs

Generate:

- full contact sheet
- row contact strips
- animated row GIFs or frame-strip playback
- before/after contact sheet if a sheet was modified
- scale comparison against approved reference characters when relevant

## Baseline And Scale Checks

- Compare grounded frames against baselineY.
- Check feet/sandals or grounded contact on every grounded row.
- Compare idle to walk, dash, crouch, normals, hit reactions, and get-up.
- Confirm body does not grow or shrink between sheets.
- Confirm body center does not drift unnaturally.
- Treat cloak/hair bounds separately from torso scale when judging size.

## Classification

Use one of these outcomes:

- `PASS`: safe to package or wire.
- `OFFSET_FIX`: art is good; runtime x/y/anchor tuning should fix it.
- `REPACK_FIX`: frame content is okay but must be recentered or repacked inside cells.
- `ROW_REGEN_RECOMMENDED`: row art is inconsistent enough that offsets will not fix it.
- `REFERENCE_ONLY`: usable as direction but not runtime-safe.

## Repair Order

1. Runtime offsets if supported.
2. Recenter/repack frames inside existing cells.
3. Row-specific anchor tuning.
4. Targeted row regeneration.
5. Full sheet regeneration only when the whole sheet fails.

## Do Not

- Do not wire a sheet because it is visually cool if it fails technical checks.
- Do not hide magenta by relying on canvas blend tricks.
- Do not crop away important motion to make the sheet fit.
- Do not animate padding cells as unique frames.
- Do not accept a sheet with row bleed into runtime.

## Prompt Template

```text
Validate [SHEET_PATH] against this contract:
[atlas/grid/cell/baseline/frame counts].
Generate contact sheet, row GIFs, measurement report, and classify each row PASS/OFFSET_FIX/REPACK_FIX/ROW_REGEN_RECOMMENDED.
Do not modify runtime.
```

