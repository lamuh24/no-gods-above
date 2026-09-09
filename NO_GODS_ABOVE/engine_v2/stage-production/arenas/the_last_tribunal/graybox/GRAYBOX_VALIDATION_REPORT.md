# The Last Tribunal Graybox Validation Report

Status: `production_arena_graybox_candidate`  
Deployable: `false`  
Gate: `awaiting_human_graybox_and_concept_approval`

## Scope

This is a deterministic presentation graybox, not final arena art. It uses simple court architecture, a flat matte floor, high oculus/eclipsed-sky geometry, gallery masses, sparse foreground silhouettes, procedural parallax layers, a flat fighter-shadow receiver, and placeholder haze. It imports no production roster entry and does not alter collision or combat state.

The capture run produced 28 scenarios with paired clean and diagnostic frames: 56 PNGs total. `capture_index.html` is the review index; `graybox_browser_report.json` is the machine-readable evidence.

## Human review answers

### Eclipse placement

The eclipse does not interfere with standard fighter silhouettes. Minimum measured eclipse-to-fighter-head separation was `0.4428` NDC during the high-jump scenario; standard, corner, and cinematic distances were larger. It remains prominent without sitting directly behind standard grounded heads.

### Swahili separation and brass competition

Swahili remains readable against the ink/violet backdrop through idle, both candidate walks, crouch, Standing Heavy, standing block, and light/heavy reactions. His warm gold trim and scythe remain brighter and more detailed than the subdued graybox brass (`#57482f`), so architecture does not merge with his costume accents.

His dark coat loses some internal value detail against the deepest background blocks, but face, shirt, outer silhouette, weapons, and gold accents remain readable. No emission mask is currently justified for Swahili.

### Floor and corners

The matte basalt floor reads as a stable ground plane through contact shadows, the dais edge, two low-contrast rings, and three sparse brass markers. It is not visually busy. Human review may choose to raise the floor one small value step, but additional marking density is not recommended.

Both corners are symmetric and readable. Measured foreground coverage of the gameplay-safe screen region peaks at `0.36%`, below the approved `4%` edge limit. Boundary pylons remain visible without defining gameplay walls.

### Jump framing

High jump remains contained and the background exposes only broad completed graybox masses: oculus, apse, columns, gallery blocks, and haze. No texture seam, empty sky hole, dense gallery detail, or foreground obstruction becomes visible.

### Cinematic visibility

Command grab, 73-tick move-authored super, ultimate, round finisher, 96-tick intro, and 105-tick victory tracks preserve both fighter identities under the browser screen-space gate. A bounded target-Y visibility correction was required because the original ultimate offset aimed above two grounded fighters and placed the root below the safe frame. The correction retains authored lateral/depth offsets, mirroring, deterministic identity, and arbitrary move-authored duration.

Ultimate and finisher roots remain close to the bottom of frame, but rendered feet and body silhouettes remain visible. Human camera-comfort review is still required before approval.

### VFX and optional masks

The large beam, projectile, hit sparks, and muzzle flashes remain distinct from the low-emission background. Fighter sprite render order preserves bodies over the graybox beam without changing hit or projectile authority.

The bright proxy remains separated without clipping. The darkest proxy benefits from a subtle cool neutral edge in the contrast study. Recommendation: no arena emission mask and no mandatory Swahili rim mask; retain an optional, tightly capped cool rim experiment for exceptionally dark costumes only.

## Browser measurements

Environment: Chromium `149.0.7827.55`, WebGL2 through ANGLE/Vulkan SwiftShader, `1280 x 720` browser viewport.

| Measurement | Result |
| --- | ---: |
| Clean draw calls | `27–42` |
| Clean triangles | `6,342–6,962` |
| Browser-reported texture objects at measured frame | `2` |
| Loaded review sprite sources | `8` |
| Conservative uncompressed RGBA upload ceiling | `72 MiB` |
| Forced-finish benchmark | `1.143 ms/frame` average over `180` frames |
| Real-time stage shadow casters | `0` |
| Console/page errors | `0` |

WebGL2 does not expose exact driver VRAM allocation. The `72 MiB` number is the conservative uncompressed ceiling for all eight `1536 x 1536 x RGBA8` review sources, not a claim about driver residency or compression. The browser reported two active texture objects in the measured frame. Hardware GPU, Firefox, Safari/WebKit, and integrated-GPU profiling remain open.

## Determinism and authority

- Fighter roots remain on presentation Z `0` with root reconstruction error `0`.
- Contact-shadow X error remains `0` in all 56 captures.
- Rendering cannot define the floor, walls, wall bounce, collision, hit detection, spacing, or match outcome.
- The 73-tick super proves that the arena's 42-tick value is a default/test value, not a global move limit.
- Event duration is a positive deterministic fixed-tick input and does not change event identity or rollback reconstruction.

## Open approval questions

1. Approve the simplified architectural density versus the richer generated concept board.
2. Approve the current oculus scale/height and cathedral-red banner placement.
3. Approve the very restrained floor value or request one controlled brightness step.
4. Approve the bounded cinematic target-Y visibility correction and bottom-frame comfort.
5. Decide whether to retain the optional dark-costume cool-rim experiment for the next material study.
6. Authorize the next art-development gate; final materials, textures, and arena art remain prohibited until then.
