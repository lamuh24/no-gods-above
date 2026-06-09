# UI Gap Fix Pack 01 Audit

Date: 2026-06-01
Agent: Codex

Source pack: `C:\Users\qchee\Downloads\no_gods_above_ui_gap_fix_pack_01.zip`

The pack was imported into the expected `NO_GODS_ABOVE/assets/ui/` folders. Originals were preserved in their target folders, pack docs were preserved under `NO_GODS_ABOVE/assets/ui/_pack_docs/ui_gap_fix_pack_01/`, and alpha-cleaned runtime candidates were written under `NO_GODS_ABOVE/assets/ui/processed/`.

## Runtime Decisions

| Asset | Classification | Processed Runtime Asset | Applied Where | Notes |
| --- | --- | --- | --- | --- |
| `select/select_header_frame_textfree.png` | NEEDS_CLEANUP | `processed/select/select_header_frame_textfree.png` | Character select header | Raw PNG had opaque generated backing; cleaned version is text-free and improves select-screen identity without covering the roster. |
| `select/select_card_frame_textfree.png` | NEEDS_CLEANUP | `processed/select/select_card_frame_textfree.png` | Default roster cards | Raw PNG had opaque white center/backing; cleaned version works as a frame over existing card content. |
| `select/select_card_frame_selected_textfree.png` | NEEDS_CLEANUP | `processed/select/select_card_frame_selected_textfree.png` | Hover/focus/selected roster cards | Cleaned version gives selected cards a stronger framed state while keeping current card text readable. |
| `select/select_marker_p1_textfree.png` | NEEDS_CLEANUP | `processed/select/select_marker_p1_textfree.png` | P1 selection badge backing | Cleaned version is used behind DOM-rendered `P1` text. |
| `select/select_marker_p2_textfree.png` | NEEDS_CLEANUP | `processed/select/select_marker_p2_textfree.png` | P2 selection badge backing | Cleaned version is used behind DOM-rendered `P2` text. |
| `select/select_ready_banner_textfree.png` | NEEDS_CLEANUP | `processed/select/select_ready_banner_textfree.png` | Ready slot banner backing | Cleaned version adds framed ready state without baking `READY` text into the art. |
| `menu/menu_button_frame_textfree.png` | NEEDS_CLEANUP | `processed/menu/menu_button_frame_textfree.png` | Title/start button default state | Cleaned text-free asset replaces the previous skipped baked-text menu art. |
| `menu/menu_button_frame_active_textfree.png` | NEEDS_CLEANUP | `processed/menu/menu_button_frame_active_textfree.png` | Title/start button hover/focus state | Cleaned text-free asset is applied only on active button states. |
| `menu/title_panel_frame_textfree.png` | REFERENCE_ONLY | `processed/menu/title_panel_frame_textfree.png` | Not applied | Cleaned successfully, but the tall vertical shape fights the current minimal background-led title layout. |
| `overlays/controls_panel_frame_readable.png` | REFERENCE_ONLY | `processed/overlays/controls_panel_frame_readable.png` | Not applied after HUD composition pass | Cleaned version is calmer than the first pack controls panel, but playtest/layout review showed it still competes with dense controls text. Runtime now uses a simpler dark controls panel and keeps the processed PNG as a future art reference. |
| `hud/hud_timer_horizontal_frame.png` | NEEDS_CLEANUP | `processed/hud/hud_timer_horizontal_frame.png` | Center HUD timer/status frame | Cleaned version fits the horizontal HUD better than the earlier medallion while preserving fallback styling. |

## Cleanup Performed

All runtime-applied assets needed alpha cleanup because the imported PNGs were fully opaque and contained white or solid generated backing. Cleanup converted high-value low-saturation backing pixels to transparency while preserving dark metal, crimson, brass-gold, and blue accent shapes. Originals were not overwritten.

Generated review/support files:

- `ui_gap_fix_pack_01_contact.png` - original import contact sheet.
- `ui_gap_fix_pack_01_processed_contact.png` - processed transparent contact sheet.
- `ui_gap_fix_pack_01_cleanup_report.json` - alpha cleanup measurements.

## Runtime Safety

- No missing files are referenced by runtime CSS.
- Runtime uses processed assets only after import and cleanup.
- Existing CSS fallback gradients remain behind every new image layer.
- Dynamic UI text remains in HTML/DOM; no baked text is required.
- Gameplay, character sprites, P1/P2 local versus, P2 meter/ultimate, and Seris VFX flags were not changed.
