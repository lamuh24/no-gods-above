# Controller support

Scope: Engine V2 browser game, both local player seats, menus and tutorials. Keyboard mappings remain available alongside controllers. Uses standard browser Gamepad mapping (Xbox and PlayStation layouts); custom/nonstandard mappings are not included.

| Action | Xbox / PlayStation |
| --- | --- |
| Move / crouch | D-pad or left stick |
| Jump | Up or A / Cross |
| Light / Medium / Heavy | X / Square, Y / Triangle, B / Circle |
| Ground or air special | RT / R2 + attack |
| Dash | LB / L1 (or double tap a direction) |
| Block | RB / R1 |
| Throw | LT / L2 |
| Ultimate | View / Share |
| Burst / Roman cancel | L3 / R3 |
| Pause | Start / Options |
| Menu navigation | D-pad/stick; A confirms, B backs out; left/right changes focused settings |

Press a button after connecting a controller. The first connected standard controller gets P1, the second P2. Disconnecting P1 does not reassign P2. Disconnect or window blur releases gamepad inputs and pauses a local match. In online play, gamepad frames use the existing host/guest input route and guests cannot pause the host.

Tutorial instructions include controller equivalents, including the launcher, air normals and air-special finisher. No damage, balance, move definitions or animation assets changed.

## Validation

- TypeScript build and optimized production build.
- `node tests/controller_input.test.js`: deadzone, every action mapping, actual jump-to-air-special activation for Lamuh, Swahili and Celeste.
- `node scripts/controller_smoke.js <origin>`: virtual standard controllers through browser polling, title/mode navigation, independent P1/P2 movement, jump/air special, pause/resume, disconnect with stable P2 assignment, no page errors.
- Screenshot: controller-support.png.
- Real USB/Bluetooth hardware and a two-device online controller session remain untested. Browser automation uses virtual standard gamepads and is not a physical-device certification.

Skills applied: nga-engine-v2, local_versus_feature_skill, ui_asset_pack_integration_skill, git_checkpoint_safety_skill, deployment_readiness_skill.
