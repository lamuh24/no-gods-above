# Sable Idle Preview Approval

APPROVED_FOR_PREVIEW_IDLE = true
APPROVED_FOR_LIVE_ROSTER = false

## Artifacts

- Source candidate: `assets/characters/sable/generated/inbox/idle/sable_idle_style4_generated_20260627-014254_v2.png`
- Normalized strip: `assets/characters/sable/normalized/idle/v20260627-015723/sable_idle_normalized_strip.png`
- Preview manifest: `assets/characters/sable/manifests/preview_animation_clips.json`
- Game smoke report: `assets/characters/sable/reports/latest_game_smoke_report.json`
- Preview harness: `assets/characters/sable/test/sprite_agent_preview.html`

## Review

- Transparent background preserved: yes
- 8 frames sliced correctly at 448x448: yes
- BaselineY 382 stable: yes, normalized frame bottom deltas are about -1px
- Preview manifest loads: yes
- Game smoke passes: yes
- Sable reads clearly at gameplay scale: yes, acceptable for first preview
- Alpha/VFX specks causing oversized bounds: no
- Idle staticness: acceptable for first preview; duplicate-frame warning is expected for a subtle loop

## Scope

No live roster wiring, gameplay, moveset, specials, balance, or runtime behavior changes were made.
