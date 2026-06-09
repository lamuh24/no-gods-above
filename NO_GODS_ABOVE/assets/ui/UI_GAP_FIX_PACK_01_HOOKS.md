# UI Gap Fix Pack 01 Hooks

Date: 2026-06-01
Agent: Codex

This document defines the expected file hooks for the next No Gods Above custom UI art pass. Do not generate these assets in Codex. These are future transparent PNG hook points only. Missing files must not be requested by runtime CSS or JavaScript until they exist, pass audit, and are intentionally wired.

## Runtime Safety

- Current fallback CSS/HTML behavior remains the source of truth while these assets are missing.
- Keep all new assets text-free. Runtime labels such as `P1`, `P2`, `READY`, `Character Select`, and control names should stay DOM-rendered for readability and localization/future remapping.
- Prefer transparent PNGs with ornament concentrated on edges and quiet readable center zones.
- When imported later, wire assets through existing CSS variables or new variables set to `none` by default. Do not hard-code missing `url(...)` paths.
- All assets should match the dark gothic anime fighter style: crimson, black, dark metal, brass-gold trim, cursed cathedral/eclipsed-divine-war tone.

## Expected Assets

| Asset | Path | Intended Use | Recommended Size / Aspect | Runtime Hook Readiness |
| --- | --- | --- | --- | --- |
| Character select header | `assets/ui/select/select_header_frame_textfree.png` | Header/title frame behind live select-screen text | `1200x180`, wide banner, about `20:3` | Ready as manifest hook; later map to select header/title frame CSS |
| Character select card | `assets/ui/select/select_card_frame_textfree.png` | Default roster card frame | `360x520`, portrait card, about `9:13` | Ready as manifest hook; later map to roster card frame CSS |
| Selected character card | `assets/ui/select/select_card_frame_selected_textfree.png` | Hovered/selected/ready roster card variant | `360x520`, same geometry as base card | Ready as manifest hook; later map to selected/ready card CSS |
| P1 marker | `assets/ui/select/select_marker_p1_textfree.png` | P1 badge/backing over selected cards/slot labels | `180x96`, badge, about `15:8` | Ready as manifest hook; runtime text remains DOM-rendered |
| P2 marker | `assets/ui/select/select_marker_p2_textfree.png` | P2 badge/backing over selected cards/slot labels | `180x96`, badge, matched to P1 with side/accent difference | Ready as manifest hook; runtime text remains DOM-rendered |
| Ready banner | `assets/ui/select/select_ready_banner_textfree.png` | Ready/locked-in banner backing for P1/P2 slots | `420x110`, wide banner, about `4:1` | Ready as manifest hook; later map to ready banner CSS |
| Menu button | `assets/ui/menu/menu_button_frame_textfree.png` | Default title/menu button frame behind dynamic button text | `520x120`, wide button, about `13:3` | Ready as manifest hook; later map to `--ui-menu-button-art` or button-specific variables |
| Active menu button | `assets/ui/menu/menu_button_frame_active_textfree.png` | Hover/focus/active title/menu button frame | `520x120`, same geometry as default button | Ready as manifest hook; later map to hover/focus button CSS |
| Title panel | `assets/ui/menu/title_panel_frame_textfree.png` | Subtle support panel for cleaned title screen | `760x260`, lower-center panel, about `3:1` | Ready as manifest hook; later map to `--ui-title-art` if it helps the background-led title layout |
| Readable controls panel | `assets/ui/overlays/controls_panel_frame_readable.png` | Pause/help controls frame for dense P1/P2 controls | `1100x720` or `900x640`, quiet center with light edge ornament | Ready as manifest hook; later map to `--ui-controls-panel-art` after readability audit |
| Horizontal timer frame | `assets/ui/hud/hud_timer_horizontal_frame.png` | Optional center HUD timer/status frame variant | `420x140` or `480x150`, horizontal crest | Ready as manifest hook; later map to `--ui-timer-frame-art` if it reads better than the current medallion |

## Integration Notes For The Next Pack

- Character select frames should fit the current card layout without forcing a layout redesign.
- Menu button frames must not contain baked button labels. The first master pack menu buttons were skipped for this reason.
- The readable controls panel should have a calmer center than `controls_panel_frame.png`; it needs to support dense key chips and two-column control lists.
- The horizontal timer frame is optional. The current timer medallion is live and fallback-safe, but a horizontal HUD variant may fit the match HUD better.
- After import, update `ui_asset_manifest.json` statuses from `missing` to `imported`, `integrated`, `reference_only`, or `needs_cleanup` based on audit.
