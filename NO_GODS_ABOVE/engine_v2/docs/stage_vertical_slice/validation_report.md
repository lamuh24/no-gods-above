# Stage Vertical Slice V1 Validation Report

Status: **STAGE_PIPELINE_VERTICAL_SLICE_APPROVED**  
Production-arena brief status: **APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1**  
Production-arena milestone: **GRAYBOX CANDIDATE / AWAITING HUMAN GRAYBOX AND CONCEPT APPROVAL**  
Legacy runtime integration: **NONE**

## Proved

- Gameplay remains on the serialized deterministic 2D plane. Camera, sprite, shadows, floor, lights, and geometry are downstream reads only.
- The browser creates an explicit WebGL2 context.
- The constrained perspective camera frames center play, both corners, and a fighter at the current simulation ceiling.
- Side switches use the unordered fighter pair and do not cut or invert gameplay.
- P1 uses authored screen-right source art and P2 uses runtime horizontal mirroring.
- Approved Swahili idle textures and two preview-only walk poses load from exact SHA-256-locked source files with no errors.
- Grounded sprite root reconstruction error is `0`; shadow X alignment error is `0` in every capture.
- Throw and ultimate camera tests keep both fighters visible and the camera returns to gameplay framing after the fixed 12-tick blend.
- Rollback abort snaps to gameplay framing without writing simulation state.
- Identical state/tick/camera-event sequences produce identical camera poses.

## Browser evidence

The latest `npm run smoke:stage` pass produced nine `1050 x 900` viewport captures with zero console/page errors:

- `center_stage.png`
- `p1_authored.png`
- `p2_mirrored.png`
- `left_corner.png`
- `right_corner.png`
- `jump_framing.png`
- `cinematic_throw.png`
- `cinematic_ultimate.png`
- `cinematic_return.png`

The browser smoke also asserts both fighter roots and sprite tops remain inside the screen-space safe frame for center, corners, and jump tests.

## Performance snapshot

| Metric | Measured | Budget | Result |
| --- | ---: | ---: | --- |
| Draw calls | 20 | 80 | PASS |
| Triangles | 222 | 60,000 | PASS |
| Renderer textures | 7 | 16 | PASS |
| Hash-locked Swahili textures | 6 / 6 loaded | 6 expected | PASS |
| WebGL baseline | WebGL2 | WebGL2 | PASS |

This is a small test scene, so these numbers prove headroom for the vertical slice only; they are not a final production-stage budget certificate.

## Automated validation

- `node scripts/validate_stage_contract.js` — PASS; schema parses, 2D authority and wall mapping agree, hazards are prohibited, and all six sprite source hashes match.
- `npm test` — PASS; all existing Engine V2 tests plus seven focused stage pipeline tests.
- `npm run build` — PASS; TypeScript and Vite production build. Existing non-blocking debug bundle size warning remains.
- `npm run smoke:stage` — PASS; nine captures, zero browser errors, screen-space framing assertions, root/shadow checks, and performance budgets.
- `npm run smoke:browser` — PASS; the pre-existing gameplay/browser regression remains green with stable renderer resources, no camera escape, no console errors, and replay checksum `7d56f13c`.
- `npm run validate` — PASS; 8 character contracts, 3 legacy stage contracts, 13 production schemas, parity smoke, content compile check, all existing Engine V2 tests, focused stage tests, and the production-arena planning gate.

## Exact blockers before production-arena art begins

The Last Tribunal brief has received human approval as `APPROVED_AS_PRODUCTION_ARENA_BRIEF_V1`. That approval authorized concept and graybox work, which now exists as the separate `production_arena_graybox_candidate` package.

1. A human must approve or revise the concept board and simplified architectural density used by the deterministic graybox.
2. A human must approve the current oculus scale/height, cathedral-red banner placement, restrained floor value, and subdued brass treatment.
3. A human must approve the bounded cinematic target-Y visibility correction and confirm bottom-frame comfort for ultimate and finisher views.
4. A human must decide whether an optional, tightly capped cool rim for exceptionally dark costumes advances to material study. Swahili currently requires neither an emission mask nor a mandatory rim mask.
5. The browser/device matrix must run on physical discrete and integrated GPUs plus Firefox and Safari/WebKit. Current graybox profiling is Chromium WebGL2 through SwiftShader; WebGL2 does not expose exact driver texture residency.
6. The `72 MiB` stage-texture ceiling remains a candidate maximum pending physical-device profiling; it is not a globally binding per-arena allocation.
7. Final materials, production textures, production VFX certification, production roster integration, runtime integration, and deployment require later explicit approvals.

No `game.js`, combat tuning, input routing, networking, Forge architecture, public roster, commit, push, PR, or deployment change is part of this result.
