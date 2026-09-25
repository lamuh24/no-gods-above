# No Gods Above Controller Support

## Status
- First-pass local controller support uses the browser Gamepad API.
- Keyboard P1/P2 local versus remains supported and unchanged.
- Controller support is local only. Online multiplayer is not part of this pass.
- Phone-as-controller support now lets a phone browser pair as P2 for Local Versus.

## Supported Controllers
- Xbox controllers using the standard browser gamepad mapping.
- PlayStation DualShock / DualSense controllers using the standard browser gamepad mapping.
- Generic controllers when the browser exposes a standard-compatible mapping.

Browser support varies. Some controllers are not visible to the page until a button is pressed once after page load.

## Controller Status
- The title screen and character select show a small controller status line.
- If a controller is detected, it should read something like `Inputs: P1 Keyboard | P2 Controller 1 Xbox One Game Controller`.
- If the line still says no controller is detected, the browser has not exposed the controller to `navigator.getGamepads()` yet.

## Assignment
- No controller connected: keyboard P1 controls P1 and keyboard P2 controls P2.
- One controller connected: the controller controls P2 by default, so keyboard P1 can fight controller P2.
- Two controllers connected: controller 1 controls P1 and controller 2 controls P2.
- One paired phone: the phone controls P2 by default, so keyboard P1 can fight phone P2.
- When a player has an assigned controller, that player's keyboard combat controls are ignored during the match to avoid accidental duplicated control.
- Keyboard menu/title/select controls remain active.
- Character select shows a small controller status readout.

For one connected controller, press View/Share on the title screen or character select to toggle it between P1 and P2. Hold the special modifier and press View/Share on character select to open the controls panel.

## Default Mapping

### Movement
- Left stick or D-pad left/right: move.
- Left stick or D-pad up: jump.
- Left stick or D-pad down: crouch / low guard context.
- Guarding still follows the existing fighting-game behavior: hold away or crouch as the current combat system expects.

### Attacks
- Xbox X / PlayStation Square: Light.
- Xbox A / PlayStation Cross: Medium.
- Xbox B / PlayStation Circle: Heavy.

### Specials
- Hold Xbox Y / PlayStation Triangle, LB/L1, or LT/L2 as the special modifier.
- While holding the special modifier:
  - X / Square routes Special 1.
  - A / Cross routes Special 2.
  - B / Circle routes Special 3.

LAMUH directional specials use the same facing-relative resolver as keyboard:
- Neutral + special: Celestial Palm.
- Forward + special: Ascend Step.
- Down + special: Heaven Splitter.
- Back + special: Divine Vanish.
- Airborne + special: Radiant Dive.

Divine Vanish keeps its current purple phase identity.

### Mobility And Ultimate
- RB/R1: dash.
- Special modifier + RB/R1: super dash where supported by the current kit.
- RT/R2: ultimate.

### Menu
- Start/Menu/Options: start from title, confirm ready/start on select, pause/resume in match.
- View/Share: toggle one-controller P1/P2 assignment on title/select; pause/help in match.
- B/Circle: cancel/back on character select or match flow overlays.

## Xbox Browser Fallback Mapping
When the browser reports a blank or non-standard mapping for an Xbox-like controller, the runtime still reads the common Xbox layout:
- Button 0: A
- Button 1: B
- Button 2: X
- Button 3: Y
- Button 4: LB
- Button 5: RB
- Button 6: LT
- Button 7: RT
- Button 8: View / Back
- Button 9: Menu / Start
- Button 12: D-pad up
- Button 13: D-pad down
- Button 14: D-pad left
- Button 15: D-pad right
- Axis 0: left stick X
- Axis 1: left stick Y

The runtime also checks axes 6/7 as a fallback D-pad source for controllers/drivers that expose the D-pad as axes instead of buttons.

## Character Select
- D-pad or left stick cycles through fighter cards.
- A/Cross confirms or readies.
- B/Circle backs out or unreadies.
- Start begins once the current select flow is ready.
- View/Share toggles one connected controller between P1 and P2.

Mouse and keyboard select behavior remains available.

## Phone Controller
- From Local Versus, choose `Pair Phone`.
- The host opens a P2 controller room and shows a room code plus a controller link.
- On iPhone or Android, open the controller link or `controller.html`, enter the room code, and connect.
- The phone controller drives P2 movement, jump, light/medium/heavy, special hold + attack, dash/superdash, grab, ultimate, confirm, back, pause, rematch, and character select.
- The desktop Electron shell starts a small read-only local HTTP server for `controller.html`; the pairing screen uses that LAN URL when available.
- The web build uses same-origin `controller.html` when hosted, with `https://no-gods-above.netlify.app/controller.html` as the file/localhost fallback.

## Known Limitations
- No controller remapping UI yet.
- No controller button icons yet.
- No rumble/vibration yet.
- Controller assignment is automatic by connection count, with a one-controller P1/P2 toggle.
- Browser Gamepad API behavior can differ between Chrome, Edge, Firefox, Xbox pads, PlayStation pads, and Bluetooth vs wired mode.

## Manual Xbox Test Steps
Use Chrome or Edge first.

1. Plug in the Xbox controller before or immediately after opening the game.
2. Open the game normally.
3. Press any controller button once after the page loads.
4. Check the title/select controller status text.
5. Confirm the status line shows the controller as P2 if only one controller is connected.
6. Press Start/Menu or A to enter character select.
7. Use D-pad or left stick to move through character cards.
8. Press View/Share if you want the one controller to control P1 instead.
9. Press A to ready/confirm and start a match.
10. In match, test movement, jump, crouch, RB dash, X/A/B attacks, Y+attack specials, and RT ultimate.

## Troubleshooting
- Press a controller button after page load; many browsers hide gamepads until a user gesture.
- Refresh the page after plugging in the controller.
- Try Chrome or Edge before Firefox.
- Try wired USB if Bluetooth does not expose the controller.
- Update Xbox controller firmware through the Xbox Accessories app if Windows sees the device but the browser does not.
- If the status line never changes after pressing a controller button, the browser is probably not exposing the device.
- If the controller appears in the status line but inputs do not work, retest on Chrome/Edge wired first and then inspect the Gamepad API mapping in browser dev tools.

## Pre-Deploy Smoke Checklist
- Keyboard P1 vs keyboard P2 still works.
- One controller defaults to P2 while keyboard P1 controls P1.
- One controller can be toggled to P1 while keyboard P2 controls P2.
- Two connected controllers can control P1/P2.
- P1 and P2 can move, jump, crouch, dash, attack, use specials, and use ultimate.
- LAMUH directional specials work from controller directions.
- Character select still works with keyboard/mouse.
- Character select works with controller navigation.
- Rematch, return to select, and pause still work.
- No console errors.
- No failed asset requests.
- Seris Sheet 8 regular gameplay VFX remains disabled.

## Future Improvements
- Manual controller assignment / join screen.
- Full remapping UI.
- Controller-specific button icons.
- Rumble on heavy hits, ultimates, and KO.
- Better disconnected-controller messaging.
