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
