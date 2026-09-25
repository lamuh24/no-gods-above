# Swahili Engine V2 Development Sandbox

Status: `preview-only`  
Asset class: `candidate-only`  
Deployable: `false`  
Production roster: `false`

This is an isolated internal playtest harness. It does not import or modify the legacy runtime, does not register Swahili in a production roster, and does not make the Last Tribunal graybox production art. A fixed 60 Hz TypeScript simulation owns fighter state, roots, bounds, pushboxes, hurtboxes, hitboxes, attack timing, hit resolution, health, and facing. Three.js reads serialized state for presentation only.

## Launch

From `NO_GODS_ABOVE/engine_v2/`:

```powershell
npm.cmd install
npm.cmd run dev -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/sandbox.html`.

## Controls

| Action | Keyboard | UI |
| --- | --- | --- |
| Move | `A` / `D` or Left / Right | - |
| Crouch | `S` or Down | - |
| Block | `O` | - |
| Standing Light / Medium | `U` / `I` | Standing Light / Standing Medium |
| Standing Heavy | `L` or `H` | - |
| Crouching Light / Medium / Heavy | Hold `S` + `U` / `I` / `L` | Crouching Light / Medium / Heavy |
| Command grab (includes opponent knockdown / recovery) | `K` | - |
| Jump/Fall/Landing V1 candidate review | `W` or Up | Soft / attack / hard landing buttons |
| Reset round | `R` | Reset round |
| Switch sides/facing | `F` | Switch sides |
| Cycle dummy block | `B` | Dummy block: off / standing / crouching |
| Diagnostic overlays | `F1` | Diagnostics |
| Slow motion | `Q` | Slow motion (0.25x) |
| Pause | `Esc` | Pause |
| Frame advance | `.` while paused | Frame advance |
| Force dummy reactions | - | Force light / heavy reaction |

The scenario selector provides 78 sandbox review setups, including soft, attack-recovery, hard, and mirrored Jump/Fall/Landing V1 presets.

## Animation coverage

Real approved or reviewable art is used for idle, crouch, the approved standing/crouching block entry-hold-release motion, the approved light/heavy reaction entry-hold-recovery motion, all Standing Heavy exposures, the five three-pose Ground Normals V1 candidates, the eight-role forward-walk candidate, five of eight backward-walk roles, the eight Jump/Fall/Landing V1 key-pose candidates, and the approved Knockdown / Recovery Motion V1 sequence.

The backward walk remains incomplete. These roles retain their timing slots, use an explicit diagnostic pose, report `UNKNOWN_MISSING_ROLE` for the support foot, and display a red warning:

- `first_passing`
- `first_up_late_swing`
- `opposite_foot_down_compression`

Jump/Fall/Landing V1 maps the exact candidate anticipation, takeoff, rising, apex, falling, soft-landing, attack-landing-recovery, and hard-landing-compatibility poses in the isolated sandbox. The pre-existing deterministic velocity, gravity, air steering, ceiling clamp, and landing detection own the trajectory; sprite pixels never move collision.

Knockdown / Recovery Motion V1 is approved for the current sandbox baseline. A successful command grab now hands its landed victim through `ground_impact -> impact_settle -> face_up_knockdown -> shoulder_roll_knee_draw -> face_up_roll_brace -> push_to_kneel -> neutral_get_up -> rise_to_stand -> idle`. The old heavy-hit downed proxy and 24-tick idle snap are removed. The sandbox simulation owns the 43-tick post-command-grab recovery cursor; artwork never controls collision, command-grab damage, launch distance, side switching, landing, or wake-up rules. The timing remains explicitly temporary and non-production balance.

Unsupported air attacks, specials, supers, and ultimates remain listed as missing rather than silently mapped to idle. Ground Normals V1 remains candidate-only and uses temporary sandbox combat values pending human live review.

No incomplete walk was packaged or marked production-ready.

## Temporary sandbox tuning

All values in this section are labeled `TEMPORARY_SANDBOX_VALUES_NOT_PRODUCTION_BALANCE` in runtime diagnostics.

- Health: `1000`
- Forward movement: `3.6` simulation units/tick
- Backward movement: `2.8` simulation units/tick
- Jump review velocity/gravity: unchanged at `-13` / `0.85` simulation units/tick
- Standing Heavy: damage `120`, hitstun `56`, blockstun `20`
- Standing Heavy hitbox: local `x 44, y -92, w 108, h 50`
- Hit knockback: `2.3` units/tick; block push: `0.575` units/tick
- Standing Heavy is mid, single-hit, zero chip, no cancels, and no root motion
- Ground Normals V1: five close-range single-hit attacks, three artwork poses each, no projectiles, with temporary sandbox-only timing, hitboxes, damage, stun, and pushback

The authoritative Standing Heavy timing is preserved without shortening: startup `0-23`, active `24-28`, recovery `29-74`, return to idle `75`; hitstop is `8` on hit, `5` on block, and `0` on whiff. Measured completion is tick `75` on whiff, `83` on hit, and `80` on block.

## Stage and camera findings

- The approved Last Tribunal graybox remains presentation-only. Sandbox authority uses floor `Y=0`, fighter plane `Z=0`, bounds `-420..420`, and spawns `-76/+76`.
- The approved mapping remains `0.02` world units per simulation unit with fighter sprite scale `0.0033`; default constrained perspective camera is `(0, 5.3, 20)` with the inherited `20..32` distance range.
- Center, both corners, side switch, mirrored facing, and the simulation-owned jump trajectory kept both roots within the constrained gameplay framing. The renderer reported zero root/shadow alignment drift in every capture.
- Corner tracking exposes more lateral architecture but keeps the fighter/body contrast band and floor relationship readable. The jump candidate remains within the graybox background coverage.
- Continuous rendering, renderer benchmarking, and texture changes left the authoritative checksum unchanged.

## Movement and animation findings

- Forward/back movement, reversal, clamping, pushbox separation, and automatic opponent-facing are deterministic.
- The forward candidate reads as a complete eight-role cycle, but the three V2 completion poses still require full-cycle human timing review before promotion.
- The backward candidate cannot be judged as a continuous gait until the three manual paintovers exist. The retained missing slots make the cadence gap obvious instead of disguising it.
- Root and support-foot diagnostics make foot sliding and baseline changes inspectable frame by frame. No rendered root or sprite geometry feeds movement.
- Hurtboxes use articulated, deterministic body-only profiles: head, torso/arms, and lower body, with a fourth narrow attack-arm box only during the extended Standing Heavy exposure. The largest body-part rectangle is `94 x 74` simulation units. Mounted scythe geometry, pistol barrels, coat flare, transparent canvas margins, and surrounding air are deliberately excluded. Mirroring transforms the same authored rectangles; rendered pixels never generate or resize gameplay collision.

## Standing Heavy feel

The move reads deliberately slow and committed at `1.25 s` before outcome hitstop. Hit and block versions visibly hold longer (`1.383 s` and `1.333 s` total attacker commitment), while whiff receives no freeze. The large mid hitbox is useful for the sandbox but must not be treated as balance approval.

One art-timing issue remains visible: first contact can occur at cursor `24`, while the approved exposure mapping is still on `standing_heavy_preparation`; the named impact pose begins at cursor `30`, already in recovery. This needs a human art/timing decision before a production Animation Package. The sandbox preserves the approved exposure plan rather than silently retiming it.

## Browser validation

Chromium/WebGL2 automation passed all 17 requested core scenarios plus 17 defense/reaction package scenarios, deterministic replay checks, input interaction, render-authority checks, body-only hurtbox bounds, and zero-console-error checks. The headless SwiftShader measurement recorded:

- `55` draw calls
- `6,976` triangles
- `130` loaded sprite textures, runtime sampled to a maximum `768 px`
- approximately `292.5 MiB` sprite texture upload estimate
- `2.41 ms` average renderer time across 90 benchmark frames

These numbers are diagnostic, not a hardware performance commitment. The current 292.5 MiB estimate exceeds the arena's 72 MB candidate ceiling because the isolated review harness loads the growing collection of full source-frame PNGs, including the recovery and Ground Normals V1 review frames. Atlas packing, compression, lower preview sampling resolution, or a revised profiled budget is required before this can approach a production package.

Evidence:

- `captures/capture_index.html`
- `captures/sandbox_browser_report.json`
- 34 scenario PNGs in `captures/`

## Remaining blockers

1. Paint and approve the three missing backward-walk gait roles.
2. Human-playtest forward-walk cadence, reversal, foot sliding, and backward fallback visibility.
3. Resolve Standing Heavy active-window versus impact-exposure timing before production packaging.
4. Approve or replace all temporary damage, stun, pushback, movement, and hitbox values.
5. Human-review Ground Normals V1 live timing, range, silhouettes, and transitions; then complete air attacks, specials, supers, and ultimates.
6. Profile the 130-source preview set on target browser/GPU classes and resolve its 292.5 MiB estimate against the 72 MB candidate ceiling through atlas packing, compression, sampling changes, or a human-approved profiled budget revision.
7. The Last Tribunal graybox and concept review gate remains separate; no final stage art is authorized by this sandbox.
