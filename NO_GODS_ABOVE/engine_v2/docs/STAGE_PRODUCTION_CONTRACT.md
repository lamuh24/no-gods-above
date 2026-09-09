# NGA Stage Production Contract V1

Status: `STAGE_PIPELINE_VERTICAL_SLICE_APPROVED`  
Vertical slice: `stage_vertical_slice_v1`  
Canonical machine-readable contract: `src/stage/stage_vertical_slice_v1.json`

## Non-negotiable authority boundary

NGA combat remains an authoritative deterministic 2D simulation. The Stage V1 system is a downstream presentation consumer. Three.js geometry, camera perspective, lights, painted planes, shadows, parallax, fog, and cinematic shots cannot write fighter positions, collision, hit detection, movement distance, jump arcs, wall positions, gameplay spacing, or match outcome.

The render mapping is:

`serialized 2D root (simulation pixels) -> fixed scale -> world-space presentation root`

No inverse mapping from rendered geometry to combat state is permitted.

## 1. Combat plane

| Field | V1 value |
| --- | --- |
| World origin | `(0, 0, 0)` |
| Floor / baseline | World `Y = 0` |
| Simulation bounds | `-420` to `420` |
| Presentation bounds | `-8.4` to `8.4` world units |
| Wall-bounce anchors | Simulation `-420`, `420` |
| Camera-safe center region | World `X -7.8` to `7.8`, `Y 0` to `5.4` |
| Simulation pixels to world | `0.02` |
| Swahili source pixels to world | `0.0033` |
| Fighter world scale | `1.0` |

The combat plane is flat. Rendered ramps, stairs, debris, or depth geometry may appear only as presentation and may not alter the floor, walls, corners, jumps, or spacing. The V1 test stage has no platforms and no hazards.

## 2. Gameplay camera

V1 uses a constrained perspective camera rather than orthographic rendering. A narrow `28°` vertical FOV provides real 3D depth while keeping sprite scale changes controlled. Near/far planes are `0.1` and `100`; gameplay dolly distance is clamped to `20-32` world units.

The camera reads only simulation tick, serialized P1/P2 roots, immutable stage contract values, and rollback-safe presentation camera events. It frames the unordered fighter pair, so side switches never cut, orbit, flip source art, or change gameplay facing. Horizontal distance is derived from fighter separation; vertical target rise is derived from serialized jump height. Fixed-tick smoothing uses alpha `0.18`, making identical state/tick sequences produce identical camera poses.

At corners, the camera follows the fighter-pair midpoint within the camera-safe center region. Environment art must provide overscan beyond deterministic walls. A fighter may never be clipped merely to keep the projected viewport inside the wall coordinates.

## 3. Sprite integration

- Swahili source canvases are `1536 x 1536` with source root `(768, 1408)`.
- The source root maps exactly to the serialized fighter root; grounded root maps to world `Y = 0`.
- Source art is authored facing screen-right. P1 uses the authored texture; runtime P2/facing-left uses a lossless horizontal transform about the root.
- Billboards are vertical-axis locked and yaw-only. Camera pitch is never applied to the feet or root.
- Both fighters share the combat plane at `Z = 0`; tiny deterministic Z/render-order tie breaks exist only for transparent overlap sorting.
- Textures use sRGB, mipmapped linear sampling, linear magnification, up to 4x anisotropy, real alpha, `alphaTest 0.035`, depth test/write, and no premultiplied alpha.
- Approved source alpha is trusted. Runtime blend tricks may not hide chroma, halos, or damaged edges.
- Dynamic elliptical contact shadows stay centered on serialized root X. They fade and contract with serialized jump height but never affect collision.
- Optional rim/emission masks must share the same canvas, root, and mirroring contract. No approved Swahili masks exist in this slice.

The anti-cardboard treatment is deliberately restrained: real 3D depth behind the plane, shared key/fill color treatment, contact shadow, atmospheric separation, correct root perspective, and yaw-only billboarding. The sprite is never tilted to fake volume.

## 4. Stage art direction

Use 3D geometry for the flat floor, silhouette-defining architecture, boundary landmarks, and major depth masses. Use painted planes for far skies, distant silhouettes, haze, and low-frequency backdrop shapes.

V1 lighting is one warm key from world `(6, 10, 8)` plus a cool low-intensity fill. The palette is ink blue-black, cathedral red, muted brass, and warm fighter highlights. Fog and contrast loss increase into negative Z. Foreground framing sits outside the combat-safe region and may not hide fighters, projectiles, hit sparks, or readable silhouettes.

Keep a low-detail dark value band behind fighter roots. Avoid emissive white, high-frequency edges, signs, particles, strobing lights, or moving foreground elements in the active combat lane. The test stage uses procedural placeholder geometry and painted gradients only; it is not arena art.

## 5. Grounding

Grounded fighter root and projected contact plane are both world `Y = 0`. Root reconstruction tolerance is effectively zero in the vertical slice and validation reports `0` error. Shadow X must equal serialized root X. Visual penetration/floating tolerance for later authored assets is `0.02` world units.

Competitive combat surfaces must remain flat. If final art contains slopes or steps, they must sit outside the combat lane or be visually reconciled to the flat authoritative floor. Render geometry may never move a fighter root.

## 6. Collision contract

Floor, left/right walls, corner detection, and wall-bounce anchors come only from serialized match state. Fighter pushboxes resolve against simulation boundaries `-420` and `420`. The 3D pylons and floor marks are correspondence cues, not colliders.

Stage hazards are prohibited in V1. A future hazard must be an explicitly authored deterministic gameplay system with replay, rollback, balance, collision, and visibility validation; stage art alone can never create one.

## 7. Cinematic camera contract

Allowed contexts are throw, command grab, super, ultimate, round finisher, intro, and victory. Every context has a bounded duration, minimum distance, mirrored lateral offset, and target offset in the machine-readable contract.

- Attacker and defender roots remain visible with safety margin for combat cinematics.
- Lateral position offset is multiplied by attacker facing; source animation frames are not mirrored or spliced inside authored clips.
- Normal interruption enters the same fixed 12-tick `smoothstep` return.
- Rollback invalidation discards the presentation event immediately and recomputes gameplay framing from restored serialized state.
- Camera state never pauses, advances, or edits gameplay. Freeze/hitstop behavior must be driven by simulation/presentation-event policy, not by the camera.

The vertical slice exposes direct throw and ultimate camera buttons for contract testing. The combat kernel does not yet emit these production presentation events.

## 8. Validation contract

Required gates cover combat-plane authority, baseline/root mapping, sprite scale, authored/mirrored facing, center/corner/jump framing, foot grounding, shadow alignment, wall correspondence, combat-distance readability, VFX contrast, WebGL2, performance, deterministic replay camera poses, and visual regression captures.

Vertical-slice budgets are:

- 60 fps target
- 80 draw calls maximum
- 60,000 triangles maximum
- 16 textures maximum
- 96 MB estimated texture memory maximum

Required captures are P1 authored, P2 mirrored, center stage, left corner, right corner, jump framing, throw camera, ultimate camera, and return-to-gameplay camera.

## Vertical-slice asset boundary

The slice loads the four exact frames approved as `APPROVED_AS_IDLE_FOUNDATION_V1`. It also loads exactly two structurally valid, candidate-acceptable walk poses for scale/grounding checks: `walk_forward_contact` and `walk_backward_rearward_contact`.

Those walk poses remain `candidate_acceptable_preview_only`. They are not an approved walk cycle, Animation Package, atlas, runtime roster integration, or gameplay timing source. The current Swahili walk V2 remains incomplete and blocked on three manual paint-overs.

## Implementation map

- Contract/schema: `src/stage/stage_vertical_slice_v1.json`, `schemas/production/stage-production.schema.json`
- Deterministic presentation camera: `src/stage/cameraRig.ts`
- WebGL2 3D stage and sprite grounding: `src/stage/stagePresentation.ts`
- Hash-locked source imports: `src/stage/spriteSources.ts`
- Debug-renderer seam: `src/debug/debugRenderer.ts`
- Contract/hash validation: `scripts/validate_stage_contract.js`
- Deterministic tests: `tests/stage_pipeline.test.js`
- Browser capture smoke: `scripts/stage_vertical_slice_smoke.js`
- Evidence: `docs/stage_vertical_slice/`
