# UI Asset Integration Audit - Master Pack 01

Date: 2026-06-01
Agent: Codex

This audit covers `no_gods_above_ui_master_pack_01.zip`. The pack was imported into `NO_GODS_ABOVE/assets/ui/` and `_pack_docs/`. Runtime integration stays fallback-safe: only files that exist and passed a basic alpha/readability review are referenced by CSS.

## Runtime Decisions

| Asset | Classification | Applied Where | Notes |
| --- | --- | --- | --- |
| `hud/hud_timer_medallion.png` | NEEDS_CLEANUP | HUD center timer/status frame | White backing alpha-cleaned, then applied through `--ui-timer-frame-art`. |
| `hud/hud_health_frame_p1.png` | NEEDS_CLEANUP | P1 health bar frame | White backing alpha-cleaned, then applied through `--ui-health-frame-p1-art`. |
| `hud/hud_health_frame_p2.png` | NEEDS_CLEANUP | P2 health bar frame | White backing alpha-cleaned, then applied through `--ui-health-frame-p2-art`. |
| `hud/hud_meter_frame_p1.png` | NEEDS_CLEANUP | P1 meter bar frame | White backing alpha-cleaned, then applied through `--ui-meter-frame-p1-art`. |
| `hud/hud_meter_frame_p2.png` | NEEDS_CLEANUP | P2 meter bar frame | White backing alpha-cleaned, then applied through `--ui-meter-frame-p2-art`. |
| `hud/hud_portrait_frame_p1.png` | NEEDS_CLEANUP | P1 HUD portrait frame | White backing alpha-cleaned, then applied through `--ui-portrait-frame-p1-art`. |
| `hud/hud_portrait_frame_p2.png` | NEEDS_CLEANUP | P2 HUD portrait frame | White backing alpha-cleaned, then applied through `--ui-portrait-frame-p2-art`. |
| `hud/hud_nameplate_p1.png` | NEEDS_CLEANUP | P1 HUD nameplate | White backing alpha-cleaned, then applied through `--ui-nameplate-p1-art`. |
| `hud/hud_nameplate_p2.png` | NEEDS_CLEANUP | P2 HUD nameplate | White backing alpha-cleaned, then applied through `--ui-nameplate-p2-art`. |
| `hud/hud_combo_badge.png` | NEEDS_CLEANUP | Combo counter badge | White backing alpha-cleaned, then applied through `--ui-combo-badge-art`. |
| `overlays/overlay_win_panel.png` | NEEDS_CLEANUP | Win/result overlay panel | White backing alpha-cleaned, then applied to result overlay background. |
| `overlays/overlay_rematch_panel.png` | NEEDS_CLEANUP | Rematch/select action prompt | White backing alpha-cleaned, then applied to `.match-flow-actions`. |
| `overlays/overlay_round_start.png` | REFERENCE_ONLY | Not applied | Cleaned candidate exists, but no round-start overlay is currently wired; avoid adding new flow. |
| `overlays/pause_panel_frame.png` | NEEDS_CLEANUP | Pause/help overlay panel | White backing alpha-cleaned, then applied to pause overlay only. |
| `overlays/controls_panel_frame.png` | REFERENCE_ONLY | Not applied | White backing alpha-cleaned, but visual review showed it competes with dense controls text. Keep fallback controls panels until this asset is simplified/regenerated. |
| `select/select_header_frame.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `select/select_card_frame.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `select/select_card_frame_selected.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `select/select_marker_p1.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `select/select_marker_p2.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `select/select_ready_banner.png` | REFERENCE_ONLY | Not applied | Missing from ZIP; master manifest marks `missing_source`. |
| `menu/menu_button_frame.png` | REFERENCE_ONLY | Not applied | Contains baked `CHARACTER SELECT` text and would duplicate live button text. |
| `menu/menu_button_frame_active.png` | REFERENCE_ONLY | Not applied | Contains baked `READY` text, not suitable for title/menu button hover. |
| `menu/title_panel_frame.png` | NEEDS_CLEANUP | Not applied | White backing alpha-cleaned, but tall vertical shape does not fit the current minimal title panel. |
| `accents/ui_divider_small.png` | REFERENCE_ONLY | Not applied | Preview-derived crop with background/text fragments; needs regeneration or manual cleanup. |
| `accents/ui_corner_ornament.png` | REFERENCE_ONLY | Not applied | Preview-derived crop with dark backing; too noisy for direct runtime use. |
| `accents/ui_glow_accent.png` | REFERENCE_ONLY | Not applied | Preview-derived crop with dark backing; too noisy for direct runtime use. |
| `accents/accent_pack_preview.png` | REFERENCE_ONLY | Not applied | Reference/catalog image only. |

## Cleanup Performed

Near-white generated backings were converted to transparent alpha on the HUD and overlay frame candidates listed as `NEEDS_CLEANUP`. No cropping was performed. Source ZIP remains in Downloads, and pack docs are preserved under `_pack_docs/`.

## Runtime Safety

- No missing select/menu/accent assets are referenced by runtime CSS.
- Existing CSS fallback layers remain behind the custom art.
- Character gameplay, sprite sheets, input, P1/P2 local versus, P2 meter/ultimate, and Seris VFX flags were not changed.
