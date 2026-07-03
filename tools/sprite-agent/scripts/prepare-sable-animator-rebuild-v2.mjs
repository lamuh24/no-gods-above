import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const characterId = "sable";
const stage = "animator-rebuild-v2";
const rebuildId = "sable_style4_animator_rebuild_v2";
const characterRoot = path.join(repoRoot, "assets", "characters", characterId);
const rebuildRoot = path.join(characterRoot, "rebuilds", rebuildId);
const reportsRoot = path.join(characterRoot, "reports");
const manifestPath = path.join(characterRoot, "manifests", "preview_animation_clips_rebuild_v2.json");
const configPath = path.join(repoRoot, "tools", "sprite-agent", "agent.config.json");
const referencePath = "assets/characters/sable/references/sable_pixel_reference_style.png";
const styleLockPath = "assets/characters/sable/references/sable_pixel_style_redo_lock.md";

const baseRules = [
  "Use the exact Sable pixel-reference game style: finished crisp pixel-art fighter sprites, not painterly concept art.",
  "Sable is a Black woman with warm brown skin, stern focused face, silver eyes, short tight black coils with silver/lavender bead highlights, and silver earrings.",
  "Costume is a fitted dark navy/black bodysuit with angular gold/silver seam lines and compact black/violet/silver void-crystal forearm wraps.",
  "Keep the same face, hair volume, proportions, palette, suit paneling, body scale, and baseline across every clip.",
  "Right-facing side-view fighting-game sprite strip on transparent alpha only.",
  "No text, labels, watermarks, cell borders, frames, background, glow backdrop, green screen, or decorative UI.",
  "No weapons and no redesign. Void effects must be compact and attached unless the clip explicitly calls for projectile, anchor, rift, or vertical phase VFX.",
  "No leftover previous-frame debris. Each frame must contain only the current pose and intentional current-frame VFX.",
  "Keep the full character in every 448x448 frame. Do not crop hair, boots, hands, crystals, or VFX that is part of the move.",
  "Anchor the feet/body to baselineY 382. Movement should read through pose and timing, not by drifting off-cell."
];

const clipSpecs = [
  c("idle", "base", 8, 8, true, [], [], "Calm combat idle with subtle breathing, steady stance, and compact forearm crystal shimmer."),
  c("walk_forward", "base", 12, 10, true, [], [], "Grounded forward walk cycle, not a skip. Stable hip height, alternating foot contacts, controlled shoulder sway."),
  c("walk_backward", "base", 12, 10, true, [], [], "Backward guard walk with cautious retreat steps. Keep her facing right and grounded with no slide drift."),
  c("jump", "base", 12, 12, false, [], [], "Full jump arc readability inside a fixed cell: crouch preload, rise, apex, fall, and landing-ready recovery."),
  c("crouch", "base", 8, 8, true, [], [], "Loopable crouch stance with no placeholder effects. Low guard, stable head/shoulders, compact attached crystal flicker only."),
  c("block", "base", 8, 10, true, [], [], "Held blocking guard with forearms raised, compact void-crystal guard shimmer, no large shield blob."),
  c("hit_stun", "base", 8, 10, false, [], [], "Readable impact recoil and recovery while staying in frame; no duplicate frozen frames."),
  c("knockdown", "base", 8, 10, false, [], [], "Knockdown fall to ground with clear body silhouette and no excessive debris."),
  c("getup", "base", 8, 10, false, [], [], "Recovery from ground back to fighting stance, clean grounded timing."),
  c("stand_light", "normal", 8, 14, false, [3], [6], "Quick standing palm/forearm jab. Very compact VFX, snappy return to guard."),
  c("stand_medium", "normal", 10, 13, false, [4], [8], "Mid-commitment standing strike with larger reach than light but no special-move travel."),
  c("stand_heavy", "normal", 12, 12, false, [6], [10], "Strong standing heavy body-first strike with pronounced anticipation and recovery."),
  c("crouch_light", "normal", 8, 14, false, [3], [6], "Low crouching quick poke from crouch stance; no Ground Rift VFX."),
  c("crouch_medium", "normal", 10, 13, false, [4], [8], "Longer low crouching strike, grounded and readable, compact impact accent only."),
  c("crouch_heavy", "normal", 12, 12, false, [6], [10], "Heavy low sweep-like crouch normal with clear startup, active sweep, and recovery."),
  c("jump_light", "normal", 8, 14, false, [3], [6], "Quick air light strike, body readable at all times, compact attached crystals."),
  c("jump_medium", "normal", 10, 13, false, [4], [8], "Air medium strike with stronger silhouette and controlled midair pose changes."),
  c("jump_heavy", "normal", 12, 12, false, [6], [10], "Heavy air attack with big readable pose, no VFX swallowing the body."),
  c("forward_light", "normal", 8, 14, false, [3], [6], "Advancing light normal; pose implies forward pressure without Phase Lunge VFX."),
  c("forward_medium", "normal", 10, 13, false, [4], [8], "Advancing medium normal with longer commitment, still a normal and not a teleport."),
  c("forward_heavy", "normal", 12, 12, false, [6], [10], "Advancing heavy normal, broad body-first hit pose with compact impact shards."),
  c("back_light", "normal", 8, 14, false, [3], [6], "Retreating defensive light check. No anchor object or trap."),
  c("back_medium", "normal", 10, 13, false, [4], [8], "Retreating medium counter-poke with Sable facing the opponent."),
  c("back_heavy", "normal", 12, 12, false, [6], [10], "Heavy back normal / defensive launcher-like strike. No Void Anchor object."),
  c("neutral_special_light", "special", 14, 12, false, [6], [12], "Void Shard light: small fast shard formed at forearm and released forward, modest recoil."),
  c("neutral_special_medium", "special", 16, 12, false, [7], [14], "Void Shard medium: larger shard with longer startup and clearer charge, distinct from light."),
  c("neutral_special_heavy", "special", 18, 12, false, [8], [16], "Void Shard heavy: strongest shard charge and release, more commitment but still in frame."),
  c("forward_special_light", "special", 14, 12, false, [6], [12], "Phase Lunge light: short forward phase strike with restrained streaks and fast recovery."),
  c("forward_special_medium", "special", 16, 12, false, [7], [14], "Phase Lunge medium: longer phase lunge, more visible void trail, distinct startup."),
  c("forward_special_heavy", "special", 18, 12, false, [8], [16], "Phase Lunge heavy: largest commitment and strongest impact, body remains readable."),
  c("back_special_light", "special", 14, 12, false, [6], [12], "Void Anchor light: compact anchor crystal appears near Sable as a defensive trap cue."),
  c("back_special_medium", "special", 16, 12, false, [7], [14], "Void Anchor medium: larger anchor formation with longer charge and more shards."),
  c("back_special_heavy", "special", 18, 12, false, [8], [16], "Void Anchor heavy: most committed anchor placement, strong crystal silhouette, contained bounds."),
  c("down_special_light", "special", 14, 12, false, [6], [12], "Ground Rift light: small floor fracture pulse under/near Sable, compact and readable."),
  c("down_special_medium", "special", 16, 12, false, [7], [14], "Ground Rift medium: wider floor fracture with clearer buildup, not oversized."),
  c("down_special_heavy", "special", 18, 12, false, [8], [16], "Ground Rift heavy: strongest floor rupture, full body still visible above the effect."),
  c("up_special_light", "special", 14, 12, false, [6], [12], "Vertical Phase light: quick upward phase lift/strike, compact vertical shards."),
  c("up_special_medium", "special", 16, 12, false, [7], [14], "Vertical Phase medium: stronger upward phase motion and more crystal trail."),
  c("up_special_heavy", "special", 18, 12, false, [8], [16], "Vertical Phase heavy: most committed vertical phase burst, do not crop upper VFX or hair.")
];

function c(clipId, group, frameCount, fps, loop, hitFrames, cancelFrames, description) {
  return { clipId, group, frameCount, fps, loop, hitFrames, cancelFrames, description };
}

function rel(absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, "/");
}

function stamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function promptFor(spec) {
  const expectedStripWidth = spec.frameCount * 448;
  const timing = [
    `clipId: ${spec.clipId}`,
    `category: ${spec.group}`,
    `frameCount: ${spec.frameCount}`,
    `fps: ${spec.fps}`,
    `loop: ${spec.loop}`,
    `frameSize: 448x448`,
    `stripSize: ${expectedStripWidth}x448`,
    `baselineY: 382`,
    `hitFrames: ${spec.hitFrames.length ? spec.hitFrames.join(", ") : "none"}`,
    `cancelFrames: ${spec.cancelFrames.length ? spec.cancelFrames.join(", ") : "none"}`
  ].join("\n");

  return `# Sable Style 4 Animator Rebuild v2 Prompt - ${spec.clipId}

Create one complete transparent PNG or WEBP horizontal spritesheet for Sable.

${timing}

## Locked Identity

Reference: \`${referencePath}\`
Style lock: \`${styleLockPath}\`

${baseRules.map((rule) => `- ${rule}`).join("\n")}

## Clip Direction

${spec.description}

Use the old Sable preview clips only as reference for what failed: do not copy their artifacts, placeholder effects, off-cell drift, or mixed character styles. This rebuild should look like one animator drew the full pack at once from the locked pixel reference.

## Output Contract

- Exactly ${spec.frameCount} frames.
- Exactly ${expectedStripWidth}x448 pixels.
- Each frame is exactly 448x448 pixels.
- Character faces right.
- Transparent alpha background.
- No text, labels, borders, frame dividers, or background.
- Keep Sable fully inside every frame with stable baseline and scale.
`;
}

function planMarkdown(plan) {
  const rows = plan.clips
    .map((clip) => `| ${clip.clipId} | ${clip.frameCount} | ${clip.fps} | ${clip.promptPath} | ${clip.expectedOutputFolder} |`)
    .join("\n");
  return `# Sable Style 4 Animator Rebuild v2 Plan

Status: **${plan.status}**
Generated: ${plan.generatedAt}

This is a preview-only, isolated rebuild plan. It does not promote Sable to the live roster and does not overwrite the current approved preview pack.

## Commands

- Run pack: \`${plan.commands.runPack}\`
- Resume pack: \`${plan.commands.resumePack}\`
- Verify pack: \`${plan.commands.verifyPack}\`
- Status: \`${plan.commands.status}\`

## Existing Preview Clips For Reference Only

${plan.existingApprovedClips.map((clip) => `- ${clip}`).join("\n") || "- None detected."}

## Clips To Regenerate

${plan.clipsToRegenerate.map((clip) => `- ${clip}`).join("\n")}

## Clip Plan

| Clip | Frames | FPS | Prompt | Expected Output Folder |
| --- | ---: | ---: | --- | --- |
${rows}

## Guardrails

- Do not touch gameplay, balance, movesets, runtime behavior, live roster assets, or live promotion.
- Do not overwrite \`assets/characters/sable/preview_pack/sable_style4_mvp_preview_pack/\`.
- Generated art for this rebuild belongs under \`${plan.rebuildRoot}\` first.
- Current preview clips may be used as failure references only, not as source art to mix into the new pack.
`;
}

function auditMarkdown(audit) {
  return `# Sable Style 4 Animator Rebuild v2 Quality Audit

Final status: **${audit.finalStatus}**
Generated: ${audit.generatedAt}

## Missing Clips

${audit.missingClips.map((clip) => `- ${clip}`).join("\n")}

## Prior Preview Issues To Fix

${audit.priorPreviewIssues.map((issue) => `- ${issue}`).join("\n")}

## Clips With Special Similarity Risk

${audit.similarityRiskClips.map((clip) => `- ${clip}`).join("\n")}

## Timing Metadata

${audit.timingMetadataComplete ? "- Timing metadata is present for every rebuild clip." : "- Timing metadata is incomplete."}

## Notes

${audit.notes.map((note) => `- ${note}`).join("\n")}
`;
}

const config = await readJsonIfExists(configPath);
if (!config) {
  throw new Error(`Missing SpriteForge config at ${configPath}`);
}

const currentManifest = await readJsonIfExists(path.join(characterRoot, "manifests", "preview_animation_clips.json"));
const existingApprovedClips = Array.isArray(currentManifest?.clips)
  ? currentManifest.clips.map((clip) => clip.clipId).sort()
  : [];

const generatedAt = new Date().toISOString();
const runStamp = stamp();
const clips = [];
for (const spec of clipSpecs) {
  const promptDir = path.join(rebuildRoot, "prompts", spec.clipId);
  const outputDir = path.join(rebuildRoot, "generated", "inbox", spec.clipId);
  await fs.mkdir(outputDir, { recursive: true });
  const prompt = promptFor(spec);
  const latestPromptPath = path.join(promptDir, `latest_${spec.clipId}_prompt.md`);
  const stampedPromptPath = path.join(promptDir, `${runStamp}_${spec.clipId}_prompt.md`);
  await writeText(latestPromptPath, prompt);
  await writeText(stampedPromptPath, prompt);
  clips.push({
    ...spec,
    frameWidth: 448,
    frameHeight: 448,
    baselineY: 382,
    expectedStripWidth: spec.frameCount * 448,
    expectedStripHeight: 448,
    promptPath: rel(latestPromptPath),
    expectedOutputFolder: `${rel(outputDir)}/`
  });
}

const commands = {
  runPack: "npm.cmd run sprite-agent -- run-pack --character sable --stage animator-rebuild-v2 --approval-policy previewAuto --skip-approved --auto-verify",
  resumePack: "npm.cmd run sprite-agent -- resume-pack --character sable --stage animator-rebuild-v2",
  verifyPack: "npm.cmd run sprite-agent -- verify-pack --character sable --stage animator-rebuild-v2",
  status: "npm.cmd run sprite-agent -- status --character sable"
};

const plan = {
  schemaVersion: config.schemaVersion,
  tool: config.toolName,
  reportKind: "sable-style4-animator-rebuild-v2-plan",
  generatedAt,
  characterId,
  stage,
  status: "REBUILD_READY_FOR_GENERATION",
  previewOnly: true,
  liveRosterWiring: "disabled",
  rebuildRoot: `${rel(rebuildRoot)}/`,
  referencePath,
  styleLockPath,
  requiredClipCount: clipSpecs.length,
  existingApprovedClips,
  oldPreviewClipsReferenceOnly: existingApprovedClips,
  clipsToRegenerate: clipSpecs.map((clip) => clip.clipId),
  clips,
  commands,
  safety: {
    doNotTouchGameplay: true,
    doNotTouchLiveRosterAssets: true,
    doNotPromoteLive: true,
    doNotOverwriteCurrentPreviewPack: true
  }
};

const audit = {
  schemaVersion: config.schemaVersion,
  tool: config.toolName,
  reportKind: "sable-style4-animator-rebuild-v2-quality-audit",
  generatedAt,
  characterId,
  stage,
  finalStatus: "REBUILD_READY_FOR_GENERATION",
  missingClips: clipSpecs.map((clip) => clip.clipId),
  weakOrChoppyClips: [],
  clipsNotInPreviewGrid: clipSpecs.map((clip) => clip.clipId),
  similarityRiskClips: [
    "neutral_special_light",
    "neutral_special_medium",
    "neutral_special_heavy",
    "forward_special_light",
    "forward_special_medium",
    "forward_special_heavy",
    "back_special_light",
    "back_special_medium",
    "back_special_heavy",
    "down_special_light",
    "down_special_medium",
    "down_special_heavy",
    "up_special_light",
    "up_special_medium",
    "up_special_heavy"
  ],
  timingMetadataComplete: true,
  priorPreviewIssues: [
    "Walk read as a skip instead of a grounded walk cycle.",
    "Jump and several attack/special clips changed character style from the early state clips.",
    "Some VFX-heavy clips had oversized effects, body smearing, or previous-frame debris.",
    "Crouch had placeholder-like effects.",
    "Earlier pack lost detail deeper into the animation set.",
    "Back and crouch attack coverage was missing from the corrected playtest harness."
  ],
  notes: [
    "No generated art has been approved in this rebuild stage yet.",
    "The current approved preview pack remains the reference/fallback and is not overwritten.",
    "All 39 rebuild clips must be judged together for character consistency before any preview approval decision.",
    "If a provider is not configured, place generated sheets into the expected rebuild inbox folders and run resume-pack for this stage."
  ]
};

const manifestSeed = {
  schemaVersion: config.schemaVersion,
  manifestKind: "preview",
  generatedAt,
  characterId,
  stage,
  approvedForLiveRoster: false,
  liveRosterWiring: "disabled",
  spriteStandard: {
    frameWidth: 448,
    frameHeight: 448,
    baselineY: 382,
    facing: "right"
  },
  clips: [],
  missingClips: clipSpecs.map((clip) => clip.clipId),
  reports: {
    rebuildPlan: "assets/characters/sable/reports/sable_style4_animator_rebuild_v2_plan.json",
    qualityAudit: "assets/characters/sable/reports/sable_style4_animator_rebuild_v2_quality_audit.json"
  },
  notes: [
    "Preview-only rebuild manifest seed.",
    "Current approved preview_animation_clips.json is intentionally not overwritten by this prepare step.",
    "Live roster promotion remains disabled."
  ]
};

await writeJson(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_plan.json"), plan);
await writeText(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_plan.md"), planMarkdown(plan));
await writeJson(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_quality_audit.json"), audit);
await writeText(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_quality_audit.md"), auditMarkdown(audit));
await writeJson(manifestPath, manifestSeed);

console.log(`Prepared ${clipSpecs.length} Sable animator rebuild prompts.`);
console.log(`Plan: ${rel(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_plan.md"))}`);
console.log(`Quality audit: ${rel(path.join(reportsRoot, "sable_style4_animator_rebuild_v2_quality_audit.md"))}`);
console.log(`Manifest seed: ${rel(manifestPath)}`);
