# SpriteForge Visual QA Score - sable / jump

Status: **fail**
Score: **0**
Human review needed: **yes**
Suspicious output: **yes**
Identity drift detected: **no**
Sheet: `assets/characters/sable/rebuilds/sable_style4_full_rebuild_v3/generated/inbox/jump/vzzz-jump-redraw02-final/raw.png`

## Summary

Heuristic visual QA found risk that should block auto preview approval.

## Factors

- Technical validation failed.
- NO_ALPHA_TRANSPARENCY: Image has no meaningful transparency.
- OPAQUE_FULL_BACKGROUND: Opaque pixel ratio 1.000 suggests a full baked background.
- DIMENSIONS_NOT_FRAME_MULTIPLE: Sheet 2172x724 is not an exact multiple of 448x448.

## Notes

- This is a heuristic score derived from technical measurements and artifact flags.
- No multimodal identity-drift adapter is connected yet; live roster promotion still requires human approval.
- SpriteForge remains the approval gatekeeper even when SpriteBuilder or another provider generates the image.
