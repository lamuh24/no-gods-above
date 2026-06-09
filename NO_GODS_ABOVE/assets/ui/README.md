# No Gods Above UI Asset Hooks

This folder is reserved for future custom UI art for No Gods Above. These files are hook points for the current HTML/CSS UI and should not be required for the game to run. Missing UI assets must fall back to the existing CSS/HTML presentation without broken runtime image requests.

All UI assets should be transparent PNG unless a specific future art brief says otherwise. The target style is dark gothic anime fighter: crimson, black, dark metal, brass-gold trim, cursed cathedral / eclipse energy, sharp ornament, high readability.

## Folder Purpose

- `hud/` - In-match HUD frames, bars, portraits, timer, combo badge, and VS medallion.
- `overlays/` - Pause/help, win, rematch, round-start, and controls panel frames.
- `select/` - Character select header, card frames, P1/P2 markers, and ready banners.
- `menu/` - Title/menu button frames and title panel frames.
- `accents/` - Shared small dividers, corner ornaments, glow accents, and reusable trim pieces.

## Expected Assets

### HUD

- `assets/ui/hud/hud_timer_medallion.png` - Center HUD timer/status frame.
- `assets/ui/hud/hud_health_frame_p1.png` - P1 health bar frame.
- `assets/ui/hud/hud_health_frame_p2.png` - P2 health bar frame.
- `assets/ui/hud/hud_meter_frame_p1.png` - P1 meter bar frame.
- `assets/ui/hud/hud_meter_frame_p2.png` - P2 meter bar frame.
- `assets/ui/hud/hud_portrait_frame_p1.png` - P1 portrait frame.
- `assets/ui/hud/hud_portrait_frame_p2.png` - P2 portrait frame.
- `assets/ui/hud/hud_nameplate_p1.png` - P1 character nameplate frame.
- `assets/ui/hud/hud_nameplate_p2.png` - P2 character nameplate frame.
- `assets/ui/hud/hud_combo_badge.png` - Combo/hit counter badge.
- `assets/ui/hud/hud_vs_medallion.png` - Future center VS badge or matchup medallion.

### Overlays

- `assets/ui/overlays/overlay_win_panel.png` - Match result / winner panel.
- `assets/ui/overlays/overlay_rematch_panel.png` - Rematch prompt panel.
- `assets/ui/overlays/overlay_round_start.png` - Future round-start banner.
- `assets/ui/overlays/pause_panel_frame.png` - Pause/help overlay frame.
- `assets/ui/overlays/controls_panel_frame.png` - P1/P2 controls panel frame.

### Character Select

- `assets/ui/select/select_header_frame.png` - Character select title/header frame.
- `assets/ui/select/select_card_frame.png` - Default roster card frame.
- `assets/ui/select/select_card_frame_selected.png` - Hovered/selected/active roster card frame.
- `assets/ui/select/select_marker_p1.png` - P1 selected marker.
- `assets/ui/select/select_marker_p2.png` - P2 selected marker.
- `assets/ui/select/select_ready_banner.png` - Ready/locked-in banner for P1/P2 slots.

### Menu

- `assets/ui/menu/menu_button_frame.png` - Default title/menu button frame.
- `assets/ui/menu/menu_button_frame_active.png` - Hover/focus/active menu button frame.
- `assets/ui/menu/title_panel_frame.png` - Title screen panel frame.

### Accents

- `assets/ui/accents/ui_divider_small.png` - Small divider line or menu separator.
- `assets/ui/accents/ui_corner_ornament.png` - Reusable gothic corner ornament.
- `assets/ui/accents/ui_glow_accent.png` - Subtle glow accent for buttons, panels, or selected states.

## Runtime Rules

- Do not make the game request these missing PNG files until safe fallback handling is in place.
- Prefer wiring future art through CSS variables and existing frame classes instead of changing gameplay logic.
- Keep the DOM structure stable where possible: HUD panels, overlay panels, character cards, ready slots, and menu buttons should accept background-image swaps.
- If an asset is absent, the game should continue using CSS fallback styling and should not log failed image requests.

## UI Gap Fix Pack 01 Expected Hooks

The first master pack left a few gaps: character select PNGs were missing, menu button PNGs had baked text, the controls panel frame was too busy for dense controls, and the timer medallion may eventually need a more horizontal HUD variant. The next pack should target these text-free files:

### Character Select Gap Fixes

- `assets/ui/select/select_header_frame_textfree.png` - Text-free select header frame. Recommended `1200x180`.
- `assets/ui/select/select_card_frame_textfree.png` - Text-free default roster card frame. Recommended `360x520`.
- `assets/ui/select/select_card_frame_selected_textfree.png` - Text-free selected/hover/ready card frame. Recommended `360x520`.
- `assets/ui/select/select_marker_p1_textfree.png` - Text-free P1 marker backing. Recommended `180x96`.
- `assets/ui/select/select_marker_p2_textfree.png` - Text-free P2 marker backing. Recommended `180x96`.
- `assets/ui/select/select_ready_banner_textfree.png` - Text-free ready banner backing. Recommended `420x110`.

### Menu Gap Fixes

- `assets/ui/menu/menu_button_frame_textfree.png` - Text-free default menu button frame. Recommended `520x120`.
- `assets/ui/menu/menu_button_frame_active_textfree.png` - Text-free hover/focus/active menu button frame. Recommended `520x120`.
- `assets/ui/menu/title_panel_frame_textfree.png` - Text-free title support panel. Recommended `760x260`.

### Overlay Gap Fixes

- `assets/ui/overlays/controls_panel_frame_readable.png` - Readable pause/help controls panel frame with quiet center and light edge ornament. Recommended `1100x720` or `900x640`.

### Optional HUD Gap Fixes

- `assets/ui/hud/hud_timer_horizontal_frame.png` - Optional horizontal timer/status frame to replace or supplement the current medallion. Recommended `420x140` or `480x150`.

See `UI_GAP_FIX_PACK_01_HOOKS.md` for the more detailed hook map and integration notes.

## UI Gap Fix Pack 01 Integration Status

`no_gods_above_ui_gap_fix_pack_01.zip` has been imported. Originals are preserved in `select/`, `menu/`, `overlays/`, and `hud/`; pack docs are preserved under `_pack_docs/ui_gap_fix_pack_01/`; processed transparent runtime candidates are under `processed/`.

Applied processed assets:

- Character select header, default card frame, selected card frame, P1/P2 markers, and ready banner.
- Text-free title/menu button default and active frames.
- Readable controls panel frame for pause/help controls panels.
- Horizontal HUD timer/status frame.

Skipped at runtime:

- `title_panel_frame_textfree.png` because the cleaned asset is still too tall/vertical for the current minimal background-led title layout.

See `UI_GAP_FIX_PACK_01_AUDIT.md` for the audit table and cleanup notes.
