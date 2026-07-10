# Sable Animation Attempts Archive

Generated: 2026-07-08
Character: `sable`

## Decision

The old Sable MVP preview pack, animator-rebuild-v2 candidate, generated sheets, and quarantined outputs are preserved as history and technical reference only.

Animation status: `archived_failed_quality_candidate`
Approved for live roster: false
Production candidate: false

## Reason

Current Sable animation attempts are not release-ready because the animations are missing, choppy, inconsistent, and do not yet meet fighting-game readability standards. The rebuild-v2 pipeline proved useful technical workflow, but the resulting pack must not be promoted live.

## Preserved Roots

- `assets/characters/sable/preview_pack/sable_style4_mvp_preview_pack`
- `assets/characters/sable/preview_pack/sable_style4_animator-rebuild-v2_preview_pack`
- `assets/characters/sable/rebuilds/sable_style4_animator_rebuild_v2`
- `assets/characters/sable/generated`
- `assets/characters/sable/generated/quarantine`
- `assets/characters/sable/manifests/preview_animation_clips.json`
- `assets/characters/sable/manifests/preview_animation_clips_rebuild_v2.json`

## Future Restart

Use `sable_style4_specials_rebuild_v3` for the isolated preview-only 15-special restart. Future Sable animation production should use key poses -> in-betweens -> assembled spritesheet -> SpriteForge validation -> preview approval. Do not promote live until `GAME_READY`.
