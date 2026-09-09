# Lamuh Legacy V2 style checkpoint

Status: **APPROVED_WITH_TARGETED_REPAIR — CANDIDATE ONLY — NOT DEPLOYABLE**

This checkpoint responds to the visual direction that Lamuh's V2 presentation must remove the legacy purple outline and match the new game's high-resolution 2.5D anime finish. It preserves the protected V1 Standing Heavy contact pose as motion reference; it does not replace any hash-locked source frame.

## Review asset

- Candidate: `tools/nga-forge/review/lamuh-legacy-v2-style-modernization-v1/standing-heavy-contact-style-candidate-v2.png`
- Motion reference: `engine_v2/content-source/characters/lamuh-legacy-v2/source-frames/standing_heavy/standing_heavy_03.png`
- Style reference: `tools/nga-forge/production/characters/swahili/source-frames/approved/standing-heavy-key-poses/standing_heavy_impact_v2.png`
- First generation: preserved as `standing-heavy-contact-style-candidate-v1.png`; rejected as technical source because it contained a baked checkerboard rather than transparency.
- Padding repair: preserved as `standing-heavy-contact-style-candidate-v3-padding-failed-alpha.png`; rejected because the expanded composition was opaque RGB.
- Follow-up extraction: preserved as `standing-heavy-contact-style-candidate-v4-alpha-repair-failed.png`; rejected because it remained opaque RGB. Candidate V2 therefore remains the only technically valid style checkpoint.

## Generation direction

Repaint the exact Lamuh high-kick contact pose as polished NGA V2 sprite artwork. Preserve his face, dark skin tone, short dark hair, white sleeveless open-front tunic, white pants, dark wraps and shoes, gold arm bands and restrained cyan energy. Preserve the body-driven arc, silhouette and contact mechanics. Use high-resolution 2.5D anime rendering, controlled cel shading, dark neutral ink separation, cathedral-shadow contrast and restrained brass/gold accents. Remove the purple or magenta outline. Use a genuinely transparent background with no checkerboard, ground, text, VFX clutter or costume redesign.

## Measured evidence

- Protected V1 source: 448 × 448; sampled legacy magenta-family pixels: 3.7161% of visible pixels.
- Candidate V2: 1536 × 1024; sampled magenta-family pixels: 0%; genuine alpha confirmed; corner alpha 0.
- Candidate visible bounds: approximately x=64–1498, y=0–994. The top edge requires normalization margin before any runtime packaging.

## Human decision

The user approved this exact visual direction on 2026-08-26. The decision is recorded as `APPROVED_WITH_TARGETED_REPAIR` because the accepted direction retains known padding, normalization and full-sequence consistency debt.

This approval unlocks targeted repair and a complete preservation-first Standing Heavy sequence candidate. It does not approve this single image as runtime art, approve the remaining motion set, clear the manual-art gate, approve the first-playable fighter, or authorize production/deployment. Every new frame must remain grounded in its corresponding protected V1 pose and pass cross-frame identity, contact-count and frame-scrub review.
