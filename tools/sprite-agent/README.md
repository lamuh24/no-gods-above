# SpriteForge Agent

Production-safe sprite workflow tooling for No Gods Above character sheets.

SpriteForge is intentionally isolated from the live game runtime. By default it writes all working files under:

```text
assets/characters/<character>/
```

It does not overwrite production assets, delete old assets, alter combat logic, or wire generated sheets into the public roster. Exports are preview manifests until a separate approved runtime integration pass happens.
The default working asset root is separate from `NO_GODS_ABOVE/assets/`.

## Manual Provider Loop

1. Upload or choose a character reference sheet.
2. Ingest the reference and optional brief.
3. Create a style-test prompt.
4. Generate the image externally in Gemini, Higgsfield, OpenAI, or another image tool.
5. Drop the result into `assets/characters/<character>/generated/inbox/<clip>/`.
6. Validate the generated sheet.
7. Normalize the accepted or fixable sheet.
8. Export the preview manifest.
9. Test in the hidden preview harness.
10. Approve only after technical validation and visual QA both pass.

## Autonomous Preview Queue

SpriteForge can run a preview-only clip queue without asking for human approval after every sheet. The queue still never promotes assets to the live roster.

Approval policies are configured in `agent.config.json`:

- `conservative`: no automatic preview approval; every clip needs human review.
- `previewAuto`: automatic preview approval only when strict technical status is `pass`, visual QA score is at least `85`, and the smoke test passes. Live approval remains false.
- `fullAutoPreview`: stricter preview automation with up to 5 retries, minimum visual QA score `90`, smoke required, and suspicious-output quarantine.

Queue status is written to:

```text
assets/characters/<character>/reports/spriteforge_queue_status.json
```

The latest batch report is written to:

```text
assets/characters/<character>/reports/latest_spriteforge_batch_report.json
assets/characters/<character>/reports/latest_spriteforge_batch_report.md
```

Queue commands:

```powershell
npm run sprite-agent -- run-queue --character sable --stage mvp --approval-policy previewAuto
npm run sprite-agent -- run-queue --character sable --clips crouch,block,hitstun,walk,jump --approval-policy previewAuto
npm run sprite-agent -- status --character sable
npm run sprite-agent -- resume --character sable
npm run sprite-agent -- promote-preview --character sable --clip idle
npm run sprite-agent -- promote-preview --character sable --stage mvp
```

`run-queue` writes or reuses the prompt, calls the configured provider, validates the generated sheet, normalizes safe outputs, exports the preview manifest, runs the smoke test, and marks the clip approved for preview only if every configured gate passes. It stops for configuration gaps, missing manual output, repeated failures, suspected unsafe output, severe crop/artifact failures, visual score failures, or smoke test failures.

`promote-preview` marks normalized preview clips as preview-approved metadata only. It does not write `NO_GODS_ABOVE/game.js`, does not touch the public roster, and does not set live approval.

## Sable Automated Preview Pack

Sable can run as a pack-level preview workflow so you do not have to approve each sheet one by one. The pack commands wrap the existing queue gates: prompt creation, provider output, technical validation, visual QA scoring, safe normalization, retry/quarantine behavior, preview manifest export, smoke tests, and preview-only approval metadata.

Run the Sable MVP pack without redoing already approved preview clips:

```powershell
npm.cmd run sprite-agent -- run-pack --character sable --stage mvp --approval-policy previewAuto --skip-approved --auto-verify
```

Verify the pack:

```powershell
npm.cmd run sprite-agent -- verify-pack --character sable --stage mvp
```

Resume a pack after dropping generated sheets into the expected inbox/provider-review folders:

```powershell
npm.cmd run sprite-agent -- resume-pack --character sable
```

Check queue state:

```powershell
npm.cmd run sprite-agent -- status --character sable
```

Pack behavior:

- `idle` is treated as already preview-approved and is skipped by default when `--skip-approved` is used.
- Approved preview clips are skipped unless `--redo-approved` is passed.
- Missing clips get prompts created or reused before the queue starts, so the manual provider path can prepare the full pack and then wait for art.
- If a real provider is selected with `--provider`, SpriteForge calls that provider through the existing provider contract.
- If no real generation provider is configured, SpriteForge does not fake generation. It writes/reuses prompts and waits for PNG/WEBP sheets in `generated/inbox/<clip>/` or provider-review output folders. Use `resume-pack` after placing files.
- Passing clips are approved for preview only. Live roster approval remains false and no `NO_GODS_ABOVE` runtime files are written.

Pack reports are written to:

```text
assets/characters/sable/reports/latest_spriteforge_pack_report.md
assets/characters/sable/reports/latest_spriteforge_pack_report.json
assets/characters/sable/reports/spriteforge_queue_status.json
assets/characters/sable/manifests/preview_animation_clips.json
```

When verification runs, SpriteForge also creates or refreshes:

```text
assets/characters/sable/preview_pack/sable_style4_mvp_preview_pack/
```

That folder contains approved normalized strips, `preview_animation_clips.json`, the latest pack report, queue status, and useful smoke/report summaries. Failed or suspicious provider outputs stay quarantined under:

```text
assets/characters/sable/generated/quarantine/<clip>/<version>/
```

`verify-pack` reports one of:

- `COMPLETE_PREVIEW_PACK`
- `PARTIAL_PREVIEW_PACK_NEEDS_RETRY`
- `FAILED_NEEDS_HUMAN`

It checks that every required Sable MVP clip is present in the preview manifest, has a normalized strip, keeps the expected frame dimensions and transparent background, is preview-approved, keeps live roster approval false, preserves the previously approved idle clip unless `--redo-approved` is passed, lists failed/quarantined clips, runs the game smoke test, and reports any dirty live roster files detected by git.

## Codex / ChatGPT Image Generation

Codex has a built-in image generation tool available to the assistant during an interactive agent turn. That built-in path does not require `OPENAI_API_KEY`, and prior project-bound sprite sources can be generated by Codex and then copied into this repo for manual SpriteForge validation.

That built-in tool is not exposed as a scriptable local CLI or Node API that `npm.cmd run sprite-agent` can call. Because SpriteForge providers run inside the repo process, there is currently no honest no-billing `codexImage` provider implementation for:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch" --approval-policy previewAuto --provider codexImage
```

The bundled image-generation fallback CLI under the Codex imagegen skill uses GPT Image models, but it requires `OPENAI_API_KEY` and network access. Do not wire that into SpriteForge unless API billing is explicitly configured later.

For now, use the manual provider path for Codex/ChatGPT-generated art:

1. Generate the image through the interactive Codex image tool.
2. Copy the selected PNG/WebP into `assets/characters/<character>/generated/inbox/<clip>/`.
3. Run SpriteForge validation/normalization/export from there.

## Optional SpriteBuilder Provider

SpriteBuilder is an optional generation adapter. It may generate or assemble the spritesheet, but SpriteForge remains the orchestrator, validator, normalizer, preview exporter, smoke tester, and approval gatekeeper.

This repo includes a tiny mock SpriteBuilder CLI at `tools/spritebuilder/` for provider-path testing only. By default it reads `spritebuilder_request.json` and writes clearly labeled JSON/TXT marker files, not PNG/WEBP spritesheets, so mock output cannot be normalized or treated as final art. The mock also has an explicit `--write-dev-png` mode for contract testing SpriteForge image discovery, validation, normalization, preview rejection, quarantine, and report paths. The SpriteForge adapter lives at `src/providers/spritebuilderProvider.ts` and remains configurable so you can point it at a real SpriteBuilder command without hardcoded absolute paths.

Configure `providers.spritebuilder` in `agent.config.json` when you know the local SpriteBuilder command. Prefer `executable` plus `args` on Windows because it works cleanly with `npm.cmd` and keeps arguments separate:

```json
"spritebuilder": {
  "mode": "local",
  "command": "<configure command here>",
  "executable": "npm.cmd",
  "args": ["--prefix", "tools/spritebuilder", "run", "generate", "--", "--request", "<requestPath>", "--write-dev-png"],
  "inputPromptPath": true,
  "outputDirectory": "assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/",
  "requestPath": "assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/spritebuilder_request.json",
  "timeoutMs": 600000
}
```

Configuration options:

- `executable`: preferred command executable, for example `npm.cmd` or `spritebuilder.cmd`.
- `args`: argument array passed to `executable`; tokens are expanded per clip.
- `command`: legacy single-string command fallback for simple local tools.
- `outputDirectory`: where SpriteBuilder must write PNG/WEBP output. SpriteForge enforces `generated/provider_review/` or `generated/quarantine/` so provider output never lands in live assets.
- `requestPath`: where SpriteForge writes the per-clip `spritebuilder_request.json` payload.
- `timeoutMs`: maximum command runtime per clip.
- `env`: optional extra environment variables with the same token expansion as `args`.

If SpriteBuilder is an npm workspace or folder, a typical Windows-safe shape is:

```json
"executable": "npm.cmd",
"args": [
  "--prefix",
  "tools/spritebuilder",
  "run",
  "generate",
  "--",
  "--request",
  "<requestPath>",
  "--write-dev-png"
]
```

Remove `--write-dev-png` to restore the mock's default marker-only behavior. With the flag enabled, the mock writes exactly one transparent RGBA PNG named `*_DEV_NOT_FINAL.png` plus `spritebuilder_result.json` in the provider-review output directory. The generated silhouette is intentionally placeholder test art and must not be treated as preview-approved or final art.

If your tool only accepts direct flags, you can use tokens in `args`:

```json
"executable": "spritebuilder.cmd",
"args": [
  "--prompt",
  "<promptPath>",
  "--character",
  "<character>",
  "--clip",
  "<clip>",
  "--out",
  "<outputDirectory>",
  "--frames",
  "<frameCount>",
  "--strip-width",
  "<stripWidth>",
  "--strip-height",
  "<stripHeight>",
  "--frame-width",
  "<frameWidth>",
  "--frame-height",
  "<frameHeight>",
  "--baseline-y",
  "<baselineY>",
  "--references",
  "<referencePaths>"
]
```

The adapter writes a request payload before invoking SpriteBuilder or during dry-run:

```text
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/spritebuilder_request.json
```

`spritebuilder_request.json` format:

- `promptPath`
- `characterId`
- `clipId`
- `outputDirectory`
- `expected.frameCount`
- `expected.stripWidth`
- `expected.stripHeight`
- `expected.frameWidth`
- `expected.frameHeight`
- `expected.baselineY`
- `expected.facing`
- `expected.fps`
- `expected.loop`
- `expected.category`
- `references[]`
- `briefs[]`
- `safety.outputScope = "provider-review-only"`
- `safety.liveRosterWiring = "disabled"`
- `safety.approvedForLiveRoster = false`

The command may use these tokens or environment variables. All paths are repo-relative and commands run from the repo root:

- `<character>` / `SPRITEFORGE_CHARACTER`
- `<clip>` / `SPRITEFORGE_CLIP`
- `<promptPath>` / `SPRITEFORGE_PROMPT_PATH`
- `<outputDirectory>` / `SPRITEFORGE_OUTPUT_DIR`
- `<requestPath>` / `SPRITEFORGE_REQUEST_PATH`
- `<frameCount>` / `SPRITEFORGE_EXPECTED_FRAME_COUNT`
- `<stripWidth>` / `SPRITEFORGE_EXPECTED_STRIP_WIDTH`
- `<stripHeight>` / `SPRITEFORGE_EXPECTED_STRIP_HEIGHT`
- `<frameWidth>` / `SPRITEFORGE_FRAME_WIDTH`
- `<frameHeight>` / `SPRITEFORGE_FRAME_HEIGHT`
- `<baselineY>` / `SPRITEFORGE_BASELINE_Y`
- `<facing>` / `SPRITEFORGE_FACING`
- `<referencePaths>` / `SPRITEFORGE_REFERENCE_PATHS`
- `<briefPaths>` / `SPRITEFORGE_BRIEF_PATHS`

The older single-string `command` field is still supported for simple tools:

```json
"command": "spritebuilder --prompt <promptPath> --out <outputDirectory>"
```

If no executable/args are configured and `command` is still the placeholder, `run-queue --provider spritebuilder` stops safely and reports the configuration gap after writing the request payload.

SpriteBuilder must write exactly one PNG or WEBP spritesheet into:

```text
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/
```

SpriteForge then validates, auto-fixes safe issues, retries according to the approval policy, normalizes passing clips, updates `preview_animation_clips.json`, runs smoke tests, and only auto-approves preview metadata. It never promotes generated sheets to the live roster automatically.

The checked-in mock SpriteBuilder intentionally writes no PNG/WEBP unless `--write-dev-png` is present. A marker-only queue run with the mock verifies request creation, command execution, and quarantine/review output paths, then SpriteForge stops safely because no spritesheet image exists. Mock outputs are labeled:

```text
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/mock_spritebuilder_output.json
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/MOCK_NOT_FINAL_<clip>.txt
```

Dev PNG mode writes these additional files:

```text
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/<character>_<clip>_<timestamp>_DEV_NOT_FINAL.png
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/spritebuilder_result.json
```

The dev PNG uses the requested `expected.stripWidth`, `expected.stripHeight`, `expected.frameWidth`, `expected.frameHeight`, `expected.frameCount`, and `expected.baselineY`. It is transparent except for simple placeholder silhouette shapes with frame-to-frame motion; it has no text, labels, borders, or background.

Dry-run checks the provider request without invoking SpriteBuilder, without modifying manifests, and without writing generated sprites:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "idle" --approval-policy previewAuto --provider spritebuilder --dry-run
```

Dry-run writes:

```text
assets/characters/<character>/generated/provider_review/spritebuilder/<clip>/<timestamp>/spritebuilder_request.json
assets/characters/<character>/reports/spritebuilder_dry_run/latest_spritebuilder_dry_run.json
assets/characters/<character>/reports/spritebuilder_dry_run/latest_spritebuilder_dry_run.md
```

Dry-run does not call SpriteBuilder, does not normalize clips, does not export manifests, does not run smoke tests, and does not update queue status.

Mock SpriteBuilder provider smoke:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch" --approval-policy previewAuto --provider spritebuilder
```

With the checked-in dev config, this command invokes `npm.cmd --prefix tools/spritebuilder run generate -- --request <requestPath> --write-dev-png` through the provider config and keeps all mock output under `generated/provider_review/`. The dev PNG is designed to exercise SpriteForge gates, not to pass as final art.

### Mock SpriteBuilder Dev Checkpoint

Marker-only mode is the mock default. Run the mock without `--write-dev-png` to create only:

```text
mock_spritebuilder_output.json
MOCK_NOT_FINAL_<clip>.txt
```

`DEV_NOT_FINAL` PNG mode is opt-in and exists only for SpriteForge provider contract testing. The current checked-in development config includes `--write-dev-png` so the mock writes one transparent placeholder spritesheet and `spritebuilder_result.json`. Remove `--write-dev-png` before configuring a real SpriteBuilder provider.

The `DEV_NOT_FINAL` placeholder should fail preview automation because it is deliberately non-final test art. A successful checkpoint proves SpriteForge discovers the PNG, validates it, normalizes it, runs smoke/report paths, rejects preview approval, and quarantines the provider output.

Dry-run:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "idle" --approval-policy previewAuto --provider spritebuilder --dry-run
```

Safe approved-clip smoke:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "idle" --approval-policy previewAuto --provider spritebuilder
```

If `idle` is already preview-approved, SpriteForge skips it instead of touching existing approved idle preview assets. To exercise the full DEV_NOT_FINAL image discovery, validation, normalization, rejection, and quarantine path, use an unapproved clip such as:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch" --approval-policy previewAuto --provider spritebuilder
```

Quarantined rejected mock PNGs go under:

```text
assets/characters/<character>/generated/quarantine/<clip>/<version>/
```

Never commit provider-review outputs, quarantined mock PNGs, quarantine reports, or `reports/spritebuilder_dry_run/` artifacts. Source prompts, manifests, approved assets, and intentional docs are not ignored by these mock-output rules.

## Commands

From the repo root:

```powershell
npm.cmd run sprite-agent -- ingest --character lamuh --reference "path/to/reference.png" --brief "path/to/brief.md"
npm.cmd run sprite-agent -- plan --character lamuh --stage style-test
npm.cmd run sprite-agent -- prompt --character lamuh --clip neutral_light
npm.cmd run sprite-agent -- validate --character lamuh --clip neutral_light --sheet "path/to/sheet.png"
npm.cmd run sprite-agent -- normalize --character lamuh --clip neutral_light
npm.cmd run sprite-agent -- export --character lamuh
npm.cmd run sprite-agent -- test --character lamuh
npm.cmd run sprite-agent -- run --character lamuh --stage mvp
```

Manual queue, with prompts written to the outbox and generated sheets dropped into the inbox by hand:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch,block,hitstun,walk,jump,ground light,ground medium,ground heavy" --approval-policy previewAuto
```

Sable automated pack:

```powershell
npm.cmd run sprite-agent -- run-pack --character sable --stage mvp --approval-policy previewAuto --skip-approved --auto-verify
npm.cmd run sprite-agent -- verify-pack --character sable --stage mvp
npm.cmd run sprite-agent -- resume-pack --character sable
npm.cmd run sprite-agent -- status --character sable
```

SpriteBuilder queue, using the configured optional provider:

```powershell
npm.cmd run sprite-agent -- run-queue --character sable --clips "crouch,block,hitstun,walk,jump,ground light,ground medium,ground heavy" --approval-policy previewAuto --provider spritebuilder
```

You can also run commands from this folder:

```powershell
npm.cmd run sprite-agent -- help
```

## Output Folders

```text
assets/characters/<character>/
  references/              copied reference sheets
  briefs/                  copied character briefs
  spec/                    locked draft character spec
  plans/                   stage clip plans
  prompts/outbox/<clip>/   manual generation prompts
  prompts/retry/<clip>/    retry prompts for rejected sheets
  generated/inbox/<clip>/  manual provider dropbox
  generated/provider_review/spritebuilder/<clip>/<v>/ SpriteBuilder request and first-review outputs
  generated/quarantine/<clip>/<v>/ failed or suspicious generated sheets
  visual_qa/<clip>/        manual visual QA checklists
  normalized/<clip>/<v>/   normalized strip, frames, reports
  manifests/               preview_animation_clips.json and gated animation_clips.json
  approvals/preview/       preview-only approval records
  preview_pack/<pack>/      verified preview pack copies and report bundle
  reports/                 latest JSON/Markdown validation, normalization, export, smoke, queue, and batch reports
  test/                    hidden preview harness
```

## Validation Gates

Technical validation checks:

- image exists
- PNG or WEBP decode
- exact 448x448 frame cell layout
- frame count
- alpha transparency
- no opaque full background
- non-empty frames
- no obvious frame borders
- no likely text-like dark bands
- cropped bounds
- configured character height range
- baseline drift from baselineY 382
- center drift from anchorX 224
- scale drift across frames
- simple perceptual duplicate frames

Visual QA is currently a structured manual checklist. The adapter is deliberately a placeholder so a future multimodal model can be added without changing the rest of the pipeline.

## Normalization

Normalization supports horizontal strips and grids made from 448x448 cells. It:

- conservatively clears edge-connected solid backgrounds when safe
- slices frames
- trims each frame to alpha bounds
- scales down into the safe box when oversized
- centers on anchorX 224
- aligns the bottom of the visible body to baselineY 382
- exports individual frames and a normalized horizontal strip

Normalization does not make a sheet live.

## Manifests

Export writes:

```text
assets/characters/<character>/manifests/preview_animation_clips.json
assets/characters/<character>/manifests/animation_clips.json
assets/characters/<character>/reports/latest_validation_report.json
assets/characters/<character>/reports/latest_validation_report.md
```

Both manifests are marked `approvedForLiveRoster: false`. The duplicate `animation_clips.json` filename exists for downstream tooling compatibility, not automatic runtime consumption.

## Game Smoke Test

`test` verifies:

- `NO_GODS_ABOVE/game.js` passes `node --check`
- preview manifest loads
- normalized strip dimensions match each clip
- clip frames can advance
- normalized frames stay near baseline

It also writes a hidden canvas preview harness at:

```text
assets/characters/<character>/test/sprite_agent_preview.html
```

Screenshot capture is skipped unless a future browser automation adapter is added.

## Sable MVP Queue

Sable is already a playable MVP fighter. SpriteForge must not redesign her gameplay, moveset, specials, balance, or runtime behavior.

The Sable-specific `mvp` queue in `agent.config.json` maps her locked move list to SpriteForge clip IDs:

- `idle` -> `idle`
- `crouch` -> `crouch`
- `block` -> `block`
- `hitstun` -> `hit_stun`
- `walk` -> `walk_forward`
- `jump` -> `jump`
- `ground_light`, `ground_medium`, `ground_heavy` -> `stand_light`, `stand_medium`, `stand_heavy`
- `air_light`, `air_medium`, `air_heavy` -> `jump_light`, `jump_medium`, `jump_heavy`
- `Void Shard` -> `neutral_special_light`
- `Forward Light/Medium/Heavy Phase Lunge` -> `forward_special_light`, `forward_special_medium`, `forward_special_heavy`
- `Void Anchor` -> `back_special_light`
- `Ground Rift` -> `down_special_light`
- `Vertical Phase` -> `up_special_light`

The current Sable idle normalized strip remains preview-approved and should not be regenerated unless explicitly requested.
