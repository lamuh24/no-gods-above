# LAMUH Legacy Animation Manifest

Last updated: 2026-06-06
Agent: Codex

## Purpose

`lamuh_legacy` is the preserved old-art version of LAMUH. It exists so the original LAMUH sprite sheets and simpler special kit remain playable without letting redesigned `lamuh` fall back to old art during coverage-mode gameplay.

## Identity

- Character id: `lamuh_legacy`
- Display name: `LAMUH Legacy`
- Runtime role: classic/simple old LAMUH kit
- Active art style: original `assets/sprites/lamuh_final/*` sheets

## Runtime Sheets

| Profile sheet key | Runtime asset key | Atlas |
| --- | --- | --- |
| `coreMovement` | `lamuhFinalCoreMovement` | `assets/sprites/lamuh_final/lamuh_sheet_1_core_movement_atlas.png` |
| `airMovement` | `lamuhFinalAirMovement` | `assets/sprites/lamuh_final/lamuh_sheet_2_air_movement_atlas.png` |
| `groundNormals` | `lamuhFinalGroundNormals` | `assets/sprites/lamuh_final/lamuh_sheet_3_ground_normals_atlas.png` |
| `airNormals` | `lamuhFinalAirNormals` | `assets/sprites/lamuh_final/lamuh_sheet_4_air_normals_atlas.png` |
| `specials` | `lamuhFinalSpecials` | `assets/sprites/lamuh_final/lamuh_sheet_5_specials_atlas.png` |
| `defense` | `lamuhFinalDefense` | `assets/sprites/lamuh_final/lamuh_sheet_6_defense_hit_reactions_atlas.png` |
| `endStates` | `lamuhFinalEndStates` | `assets/sprites/lamuh_final/lamuh_sheet_7_knockdown_recovery_flavor_atlas.png` |
| `crownBody` | `lamuhCrownBody` | `assets/sprites/lamuh_final/lamuh_sheet_8_crown_of_no_gods_body_atlas.png` |

## Mapping Contract

- `buildLamuhLegacyPlayerAnimations(sheets)` owns the old player animation map.
- `buildLamuhLegacyEnemyAnimations(sheets)` mirrors the old player animation map for enemy aliases.
- `buildLamuhLegacyPlayerAttacks()` and `buildLamuhLegacyEnemyAttacks()` reuse a reduced classic move set and strip advanced redesigned LAMUH cancel targets.
- `chooseLamuhLegacySpecialMove()` routes Legacy directional specials before the redesigned `lamuh` advanced routing branch.

## Separation Rule

Do not use `lamuh_legacy` as a fallback source for redesigned `lamuh`. If `lamuh` shows old art, fix the `lamuh` profile/builder/alias that points at old sheets. If `lamuh_legacy` shows old art, that is expected.

Validation: `NO_GODS_ABOVE/scripts/smoke_lamuh_legacy_separation.js`.
