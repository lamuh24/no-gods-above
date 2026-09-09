# Engine V2 Prototype Input Mapping

The platform input layer lives outside the deterministic simulation. Browser keyboard/gamepad state is normalized into `InputFrame` before the fixed 60 Hz simulation tick.

## Keyboard defaults

- Move: `A/D` or arrow left/right
- Crouch: `S` or arrow down
- Jump: `W` or arrow up
- Light: `J` (`5L`/`2L` while grounded, `j.J` while airborne)
- Medium: `K` (`5M`/`2M` while grounded, `j.K` while airborne)
- Heavy: `L` (`5H`/`2H` while grounded, `j.L` while airborne)
- Special: `U`
- Throw placeholder: `I`
- Block: `O`
- Burst placeholder: `P`
- Pause: `Escape`

## Debug-only keyboard controls

- Collision overlays: `F1`
- Frame step: `.` while paused
- Reset: `R`
- Live/replay mode: `M`

No combat key also triggers a debug action. `U` (Special), `I` (Throw), and `P` (Burst) are reserved inputs only; the HUD marks them inactive and the gameplay kernel does not pretend those mechanics exist yet.

The aerial cancel graph is intentionally acyclic: `j.J -> j.K` or `j.L`, and `j.K -> j.L`. Reverse cancels are rejected. Each jump has a temporary three-aerial-normal budget; this is not a double jump, air dash, or additional mobility action.

## Standard gamepad defaults

- Left stick / D-pad: directions
- Face bottom: Light
- Face right: Medium
- Face left: Heavy
- Face top: Special
- Left shoulder: Block
- Right shoulder: Throw placeholder
- Back/select: Burst placeholder
- Start: Pause

Analog dead zone defaults to `0.35`. Physical controller behavior still needs local manual verification; automated coverage uses mocked standard gamepad data.
