# UI Asset Pack Integration Skill

Purpose: import and apply generated UI assets safely while preserving playable runtime fallback behavior.

Use this for HUD, title, menu, character select, overlays, controls panels, and future UI art packs.

## Folder Structure

Use:

```text
NO_GODS_ABOVE/assets/ui/
NO_GODS_ABOVE/assets/ui/hud/
NO_GODS_ABOVE/assets/ui/overlays/
NO_GODS_ABOVE/assets/ui/select/
NO_GODS_ABOVE/assets/ui/menu/
NO_GODS_ABOVE/assets/ui/accents/
NO_GODS_ABOVE/assets/ui/processed/
NO_GODS_ABOVE/assets/ui/_pack_docs/
```

Preserve source pack docs and manifests under `_pack_docs/`.

## Import Audit

Classify every asset:

- `DIRECT_USE`: clean alpha, no conflicting baked text, fits slot, improves readability.
- `NEEDS_CLEANUP`: promising but needs alpha cleanup, crop, or processing.
- `REFERENCE_ONLY`: useful design direction but not runtime-safe.

Never wire missing or skipped assets into runtime.

## Alpha Cleanup

- Do not overwrite originals.
- Put processed versions under `assets/ui/processed/...`.
- Confirm transparent RGBA.
- Confirm no white/solid preview backing remains.
- Confirm no broken image requests.

## Runtime Safety

- Keep CSS/HTML fallback for every image hook.
- Do not make UI depend hard on an unvalidated asset.
- Do not create `<img>` or CSS `url()` references for missing files.
- Prefer config-driven asset maps where possible.
- If an asset is absent, render existing CSS UI.

## HUD Integration

HUD art should be containers, not stickers.

Use:

- health shell
- health frame
- health fill clip
- health fill
- meter shell
- meter frame
- meter fill clip
- meter fill
- portrait shell/clip/image
- nameplate safe text region

Measure inner fill offsets and sizes from the actual frame art after scaling. Preserve fill readability.

## Debug Box Cleanup

Remove or restyle:

- yellow borders
- purple borders
- magenta outlines
- dashed debug boxes
- placeholder backgrounds
- visible wrapper rectangles
- default browser focus rings

Use coherent highlights:

- crimson
- deep red
- brass/gold
- ember
- dark steel
- subtle white text

## UI Systems To Test

- title/start screen
- start button/Enter behavior
- character select
- all cards and portraits
- P1/P2 ready/select clarity
- HUD health/meter/timer/combo
- pause/help
- win/rematch/select overlay
- return to select
- no failed requests
- no console errors

## Lessons

Master UI pack:

- HUD frames can work well if fills are clipped inside the art.
- Bad baked-text menu buttons should be skipped instead of forced.
- Busy controls frames can reduce readability.

Gap fix pack:

- Text-free select/menu assets are safer.
- Controls panels need readable interior space.
- Missing future hook assets should be documented, not requested at runtime.

## Prompt Template

```text
Import [UI PACK] and audit every asset as DIRECT_USE/NEEDS_CLEANUP/REFERENCE_ONLY.
Apply only assets that improve readability.
Keep fallback CSS/HTML and confirm no broken requests.
```

