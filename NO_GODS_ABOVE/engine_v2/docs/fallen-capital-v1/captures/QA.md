# Fallen Capital V1 independent stage QA

Local playable stage review completed 2026-09-13/14. This is a stage implementation pass, not whole-roster animation approval, release approval, or a deployment receipt.

## Verified

- `npm run build:sim` succeeds.
- `node tests/fallen_capital_camera.test.js` passes 288 independent projected body corners across center, left/right corner, full-width separation, and ceiling cases. Each case covers gameplay plus five cinematic times; framing is deterministic, does not mutate serialized state, and is invariant when player ordering is exchanged.
- `node scripts/fallen_capital_smoke.js` passes against `http://127.0.0.1:4175/versus-playtest.html?arena=fallen-capital&autostart=1`. Actual Lamuh/Swahili presenters load. Both players land heavy hits via input queues; actual jump stays in frame; actual projectile spawns and is rendered by its owner presenter; the hit-confirmed ultimate reaches charge and beam, with screen-space bars and bounded orbit.
- Repeated calls to the actual renderer leave the complete serialized match state unchanged. Disposal is idempotent and removes the owned canvas. Returning to selection and swapping Lamuh/Swahili loads exactly one new arena canvas.
- Center, real jump/projectile/beam, synthetic left/right corner and max-width ceiling, and swapped-player screenshots are retained here. Spatial fixtures are explicitly synthetic and are separate from the input-driven combat checks.
- Training-grid selection works. A separate fault-injection page intentionally aborts the background image; the application removes the failed arena, shows the training grid, and keeps simulation input working without an uncaught error.
- Normal run has zero console/page errors and zero failed HTTP/asset requests. Expected asset failure is isolated in the fault test.

## Visual critique and repair result

First-pass review found blank gray backdrop strips during corner tracking and the actual ultimate orbit, plus flat primitive piers. The builder repaired backdrop tracking and replaced the pier facades with detailed transparent stone art. The same cases were recaptured and visually inspected after repair: the gray strips are gone, piers match the painted ruins, fighters remain unobstructed, and the actual beam is legible. The fallen statue, ruined capital, broken halo, stone fighting lane, and restrained brass inlay retain the approved concept's composition.

Minor remaining cosmetic limitation: dark peripheral rubble is visibly low-poly at the corners. The backdrop and pier facades are layered images with restrained camera motion, not fully reconstructed 3D architecture. Existing character art remains the current playable candidate work.

## Resource and timing observation

`performance-report.json` records one short headless system-Chrome observation on this machine: 84 RAF intervals, median 8.1 ms and p95 15.3 ms. Renderer counts stayed at 27 geometries, 6 textures, 28 draw calls, and 2,414 triangles throughout the sample. This is a limited resource-stability and frame-delivery observation; it does not establish a hardware-independent FPS guarantee or long-session leak proof.

## Existing regression outside stage ownership

`node tests/versus_playtest_body_envelope_v1.test.js` fails at line 85: it expects the legacy hurtboxes to remain shorter. This test imports core/envelope code rather than the new stage modules; no character/core edits were made by this QA task. The failure is retained as a separate outstanding repository check, not hidden by the passing stage tests.

## Scope and instructions used

QA changed only the new smoke script, new camera test, and this capture directory. Read and applied `.agents/skills/nga-engine-v2/SKILL.md` with its stage-pipeline and validation-gates references. Also read `NO_GODS_ABOVE/skills/deployment_readiness_skill.md` for existing smoke conventions; no deployment was requested or performed by QA.

The first broad browser run overlapped Vite hot reload and failed swapped-player reentry. It was not accepted as evidence. The complete stable rerun passed and its final `smoke-report.json` is the retained result.
