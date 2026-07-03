import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { exportPreviewManifest, type SpriteManifest } from "./exportManifest.js";
import { runGameSmokeTest, type GameSmokeReport } from "./gameSmokeTest.js";
import { ensureClipPrompt } from "./providers.js";
import {
  type BatchReport,
  type QueueStatus,
  isClipPreviewApproved,
  latestNormalizedClipPath,
  readQueueStatus,
  runSpriteQueue
} from "./queueRunner.js";
import {
  type AgentConfig,
  type AnimationClip,
  activeProviderName,
  approvalPolicy,
  characterRoot,
  characterStageClipIds,
  clipConfigForStage,
  ensureDir,
  loadCharacterSpec,
  loadConfig,
  manualProviderConfig,
  manifestPathForStage,
  pathExists,
  readJson,
  readJsonIfExists,
  reportDirForStage,
  repoRoot,
  toRepoRelative,
  writeJson,
  writeText
} from "./report.js";

const execFileAsync = promisify(execFile);

export type PackFinalStatus =
  | "COMPLETE_PREVIEW_PACK"
  | "PARTIAL_PREVIEW_PACK_NEEDS_RETRY"
  | "FAILED_NEEDS_HUMAN"
  | "REBUILD_PREVIEW_COMPLETE"
  | "REBUILD_PARTIAL_WAITING_FOR_ART"
  | "REBUILD_FAILED_NEEDS_HUMAN";

export interface PromptPreparation {
  clipId: string;
  promptPath: string;
  manualInbox: string;
}

export interface PackClipCheck {
  clipId: string;
  required: boolean;
  approvedForPreview: boolean;
  approvedForLiveRoster: false;
  inPreviewManifest: boolean;
  normalizedClip: string | null;
  normalizedSheet: string | null;
  expectedFrameCount: number;
  expectedFrameWidth: number;
  expectedFrameHeight: number;
  expectedStripWidth: number;
  expectedStripHeight: number;
  image?: {
    width: number | null;
    height: number | null;
    hasAlpha: boolean;
    transparentPixelRatio: number | null;
    transparentCorners: boolean;
    dimensionsPass: boolean;
    transparencyPass: boolean;
  };
  issues: string[];
}

export interface PackReport {
  schemaVersion: string;
  tool: string;
  reportKind: "spriteforge-preview-pack";
  generatedAt: string;
  character: string;
  stage: string;
  approvalPolicy: string;
  provider: string;
  skipApproved: boolean;
  redoApproved: boolean;
  autoVerify: boolean;
  requiredClips: string[];
  skippedApprovedClips: string[];
  queuedClips: string[];
  promptPreparation: PromptPreparation[];
  queueReport?: BatchReport;
  queueStatus?: QueueStatus | null;
  clipChecks: PackClipCheck[];
  previewManifest: string | null;
  previewPackPath: string | null;
  packagedFiles: string[];
  smokeReport: string | null;
  smokePassed: boolean | null;
  idleApprovedClipPreserved: boolean | null;
  failedClips: string[];
  quarantinedOutputs: string[];
  liveRosterModifiedFiles: string[];
  finalStatus: PackFinalStatus;
  humanReviewReasons: string[];
  notes: string[];
}

export interface RunPackOptions {
  character: string;
  stage?: string;
  approvalPolicy?: string;
  provider?: string;
  skipApproved?: boolean;
  redoApproved?: boolean;
  autoVerify?: boolean;
  dryRun?: boolean;
  resume?: boolean;
}

export interface VerifyPackOptions {
  character: string;
  stage?: string;
  approvalPolicy?: string;
  provider?: string;
  redoApproved?: boolean;
  autoVerify?: boolean;
  queueReport?: BatchReport;
  promptPreparation?: PromptPreparation[];
  skippedApprovedClips?: string[];
  queuedClips?: string[];
}

export async function runSpritePack(options: RunPackOptions): Promise<PackReport> {
  const config = await loadConfig();
  const character = options.character;
  const stage = options.stage ?? "mvp";
  const policyName = options.approvalPolicy ?? "previewAuto";
  approvalPolicy(config, policyName);
  await loadCharacterSpec(config, character);

  const provider = activeProviderName(config, options.provider);
  const skipApproved = options.redoApproved ? false : (options.skipApproved ?? true);
  const requiredClips = characterStageClipIds(config, character, stage);
  const skippedApprovedClips: string[] = [];
  const queuedClips: string[] = [];

  for (const clipId of requiredClips) {
    if (skipApproved && await isClipPreviewApproved(config, character, clipId, stage)) {
      skippedApprovedClips.push(clipId);
    } else {
      queuedClips.push(clipId);
    }
  }

  const promptPreparation = await preparePackPrompts(config, character, queuedClips, stage);
  let queueReport: BatchReport | undefined;

  if (queuedClips.length > 0) {
    queueReport = await runSpriteQueue({
      character,
      stage,
      clips: requiredClips,
      approvalPolicy: policyName,
      provider,
      resume: options.resume ?? false,
      skipApproved,
      dryRun: options.dryRun ?? false
    });
  } else {
    await writeAllApprovedQueueStatus(config, {
      character,
      stage,
      policyName,
      provider,
      requiredClips,
      approvedClips: skippedApprovedClips
    });
  }

  const canAutoVerify =
    options.autoVerify === true &&
    options.dryRun !== true &&
    (queuedClips.length === 0 ||
      (queueReport !== undefined &&
        !queueReport.humanReviewNeeded &&
        queueReport.clipsFailed.length === 0 &&
        queueReport.remainingClips.length === 0));

  if (canAutoVerify) {
    return verifySpritePack({
      character,
      stage,
      approvalPolicy: policyName,
      provider,
      redoApproved: options.redoApproved ?? false,
      autoVerify: true,
      queueReport,
      promptPreparation,
      skippedApprovedClips,
      queuedClips
    });
  }

  const queueStatus = await readQueueStatus(config, character);
  const report = await buildBasePackReport(config, {
    character,
    stage,
    policyName,
    provider,
    skipApproved,
    redoApproved: options.redoApproved ?? false,
    autoVerify: options.autoVerify ?? false,
    requiredClips,
    skippedApprovedClips,
    queuedClips,
    promptPreparation,
    queueReport,
    queueStatus,
    finalStatus: queueReport?.humanReviewNeeded ? "FAILED_NEEDS_HUMAN" : "PARTIAL_PREVIEW_PACK_NEEDS_RETRY",
    humanReviewReasons: queueReport?.humanReviewNeeded
      ? [queueReport.nextAction]
      : [`Waiting for provider output or verification for: ${queuedClips.join(", ") || "none"}.`]
  });
  await writePackReport(config, character, report);
  return report;
}

export async function resumeSpritePack(options: RunPackOptions): Promise<PackReport> {
  return runSpritePack({
    ...options,
    stage: options.stage ?? "mvp",
    approvalPolicy: options.approvalPolicy ?? "previewAuto",
    skipApproved: options.skipApproved ?? true,
    resume: true
  });
}

export async function verifySpritePack(options: VerifyPackOptions): Promise<PackReport> {
  const config = await loadConfig();
  const character = options.character;
  const stage = options.stage ?? "mvp";
  const policyName = options.approvalPolicy ?? "previewAuto";
  approvalPolicy(config, policyName);
  await loadCharacterSpec(config, character);

  const provider = activeProviderName(config, options.provider);
  const requiredClips = characterStageClipIds(config, character, stage);
  const manifest = await exportPreviewManifest({ character, stage });
  const queueStatus = await readQueueStatus(config, character);
  const clipChecks = await verifyRequiredClips(config, character, stage, requiredClips, manifest);
  const smoke = await runGameSmokeTest({ character, stage });
  const liveRosterModifiedFiles = await liveRosterStatus();
  const quarantinedOutputs = unique([
    ...(queueStatus?.quarantinedOutputs ?? []),
    ...(await listQuarantineOutputs(config, character))
  ]);
  const idleApprovedClipPreserved = await checkIdlePreserved(config, character, stage, options.redoApproved ?? false);
  const failedClips = unique([
    ...(queueStatus?.failedClips ?? []),
    ...clipChecks.filter((check) => check.issues.length > 0).map((check) => check.clipId)
  ]);
  const humanReviewReasons = packHumanReviewReasons({
    stage,
    clipChecks,
    smoke,
    liveRosterModifiedFiles,
    idleApprovedClipPreserved,
    queueStatus
  });
  const finalStatus = finalStatusFor({
    stage,
    clipChecks,
    smoke,
    liveRosterModifiedFiles,
    idleApprovedClipPreserved,
    queueStatus
  });

  let report = await buildBasePackReport(config, {
    character,
    stage,
    policyName,
    provider,
    skipApproved: !(options.redoApproved ?? false),
    redoApproved: options.redoApproved ?? false,
    autoVerify: options.autoVerify ?? false,
    requiredClips,
    skippedApprovedClips: options.skippedApprovedClips ?? [],
    queuedClips: options.queuedClips ?? [],
    promptPreparation: options.promptPreparation ?? [],
    queueReport: options.queueReport,
    queueStatus,
    finalStatus,
    humanReviewReasons
  });
  report = {
    ...report,
    clipChecks,
    previewManifest: toRepoRelative(manifestPathForStage(config, character, stage)),
    smokeReport: toRepoRelative(path.join(characterRoot(config, character), "reports", "latest_game_smoke_report.json")),
    smokePassed: smokePasses(smoke),
    idleApprovedClipPreserved,
    failedClips,
    quarantinedOutputs,
    liveRosterModifiedFiles
  };

  let reportPaths = await writePackReport(config, character, report);
  const packagedFiles = await writePreviewPack(config, character, stage, report, reportPaths);
  report = {
    ...report,
    previewPackPath: toRepoRelative(previewPackDir(config, character, stage)),
    packagedFiles
  };
  reportPaths = await writePackReport(config, character, report);
  await copyPackReportToPackDir(config, character, stage, reportPaths);
  return report;
}

async function preparePackPrompts(
  config: AgentConfig,
  character: string,
  clipIds: string[],
  stage: string
): Promise<PromptPreparation[]> {
  const manual = manualProviderConfig(config, stage);
  const root = characterRoot(config, character);
  const prepared: PromptPreparation[] = [];
  for (const clipId of clipIds) {
    const promptPath = await ensureClipPrompt(config, character, clipId, stage);
    const manualInbox = path.join(root, manual.generatedInbox, clipId);
    await ensureDir(manualInbox);
    prepared.push({
      clipId,
      promptPath: toRepoRelative(promptPath),
      manualInbox: toRepoRelative(manualInbox)
    });
  }
  return prepared;
}

async function buildBasePackReport(
  config: AgentConfig,
  options: {
    character: string;
    stage: string;
    policyName: string;
    provider: string;
    skipApproved: boolean;
    redoApproved: boolean;
    autoVerify: boolean;
    requiredClips: string[];
    skippedApprovedClips: string[];
    queuedClips: string[];
    promptPreparation: PromptPreparation[];
    queueReport?: BatchReport;
    queueStatus?: QueueStatus | null;
    finalStatus: PackFinalStatus;
    humanReviewReasons: string[];
  }
): Promise<PackReport> {
  return {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    reportKind: "spriteforge-preview-pack",
    generatedAt: new Date().toISOString(),
    character: options.character,
    stage: options.stage,
    approvalPolicy: options.policyName,
    provider: options.provider,
    skipApproved: options.skipApproved,
    redoApproved: options.redoApproved,
    autoVerify: options.autoVerify,
    requiredClips: options.requiredClips,
    skippedApprovedClips: options.skippedApprovedClips,
    queuedClips: options.queuedClips,
    promptPreparation: options.promptPreparation,
    queueReport: options.queueReport,
    queueStatus: options.queueStatus,
    clipChecks: [],
    previewManifest: await manifestPathIfExists(config, options.character, options.stage),
    previewPackPath: null,
    packagedFiles: [],
    smokeReport: null,
    smokePassed: null,
    idleApprovedClipPreserved: null,
    failedClips: options.queueStatus?.failedClips ?? [],
    quarantinedOutputs: options.queueStatus?.quarantinedOutputs ?? [],
    liveRosterModifiedFiles: [],
    finalStatus: options.finalStatus,
    humanReviewReasons: options.humanReviewReasons,
    notes: [
      "SpriteForge pack output is preview-only.",
      "No generated strip is promoted to the live roster automatically.",
      "Built-in Codex/ChatGPT image generation is not script-callable from the local npm SpriteForge process; use manual inbox output or a configured provider.",
      options.redoApproved
        ? "Redo-approved mode was requested; approved preview clips may be regenerated."
        : "Approved preview clips are skipped unless --redo-approved is passed."
    ]
  };
}

async function verifyRequiredClips(
  config: AgentConfig,
  character: string,
  stage: string,
  requiredClips: string[],
  manifest: SpriteManifest
): Promise<PackClipCheck[]> {
  const manifestByClip = new Map(manifest.clips.map((clip) => [clip.clipId, clip]));
  const checks: PackClipCheck[] = [];
  for (const clipId of requiredClips) {
    const expected = clipConfigForStage(config, clipId, stage);
    const manifestClip = manifestByClip.get(clipId);
    const normalizedClipPath = await latestNormalizedClipPath(config, character, clipId, stage);
    const normalizedClip = normalizedClipPath
      ? await readJsonIfExists<AnimationClip>(normalizedClipPath)
      : null;
    const normalizedSheet = normalizedClip?.normalizedSheet ?? manifestClip?.normalizedSheet ?? null;
    const approvedForPreview = await isClipPreviewApproved(config, character, clipId, stage);
    const issues: string[] = [];

    if (!manifestClip) {
      issues.push("Missing from preview_animation_clips.json.");
    }
    if (!approvedForPreview) {
      issues.push("Clip is not approved for preview.");
    }
    if (!normalizedClipPath) {
      issues.push("No normalized animation_clip.json found.");
    }
    if (!normalizedSheet) {
      issues.push("No normalized strip path recorded.");
    }
    if ((expected.category === "normal" || expected.category === "special") && expected.hitFrames.length === 0) {
      issues.push("Attack clip is missing hit/startup frame metadata.");
    }
    if ((expected.category === "normal" || expected.category === "special") && expected.cancelFrames.length === 0) {
      issues.push("Attack clip is missing recovery/cancel frame metadata.");
    }

    const image = normalizedSheet
      ? await verifyNormalizedImage(path.resolve(repoRoot(), normalizedSheet), expected)
      : undefined;
    if (image) {
      if (!image.dimensionsPass) {
        issues.push(`Normalized strip dimensions are ${image.width}x${image.height}, expected ${expected.frameWidth * expected.frameCount}x${expected.frameHeight}.`);
      }
      if (!image.transparencyPass) {
        issues.push("Normalized strip does not have a transparent background.");
      }
    } else if (normalizedSheet) {
      issues.push(`Normalized strip file does not exist: ${normalizedSheet}.`);
    }

    checks.push({
      clipId,
      required: true,
      approvedForPreview,
      approvedForLiveRoster: false,
      inPreviewManifest: Boolean(manifestClip),
      normalizedClip: normalizedClipPath ? toRepoRelative(normalizedClipPath) : null,
      normalizedSheet,
      expectedFrameCount: expected.frameCount,
      expectedFrameWidth: expected.frameWidth,
      expectedFrameHeight: expected.frameHeight,
      expectedStripWidth: expected.frameWidth * expected.frameCount,
      expectedStripHeight: expected.frameHeight,
      image,
      issues
    });
  }
  return checks;
}

async function verifyNormalizedImage(
  sheetPath: string,
  expected: AnimationClip
): Promise<PackClipCheck["image"] | undefined> {
  if (!(await pathExists(sheetPath))) {
    return undefined;
  }
  const image = sharp(sheetPath, { failOn: "none" });
  const metadata = await image.metadata();
  const expectedWidth = expected.frameWidth * expected.frameCount;
  const expectedHeight = expected.frameHeight;
  const alpha = await alphaStats(sheetPath);
  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    hasAlpha: metadata.hasAlpha === true,
    transparentPixelRatio: alpha.transparentPixelRatio,
    transparentCorners: alpha.transparentCorners,
    dimensionsPass: metadata.width === expectedWidth && metadata.height === expectedHeight,
    transparencyPass: metadata.hasAlpha === true && alpha.transparentPixelRatio > 0.05 && alpha.transparentCorners
  };
}

async function alphaStats(sheetPath: string): Promise<{
  transparentPixelRatio: number;
  transparentCorners: boolean;
}> {
  const { data, info } = await sharp(sheetPath, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  let transparentPixels = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if ((data[offset] ?? 255) < 24) {
      transparentPixels += 1;
    }
  }
  const cornerCoords = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1]
  ] as const;
  const transparentCorners = cornerCoords.every(([x, y]) => {
    const offset = ((y * info.width + x) * 4) + 3;
    return (data[offset] ?? 255) < 24;
  });
  return {
    transparentPixelRatio: pixelCount > 0 ? transparentPixels / pixelCount : 0,
    transparentCorners
  };
}

async function writePreviewPack(
  config: AgentConfig,
  character: string,
  stage: string,
  report: PackReport,
  reportPaths: { jsonPath: string; markdownPath: string }
): Promise<string[]> {
  const packDir = previewPackDir(config, character, stage);
  const stripsDir = path.join(packDir, "strips");
  const reportsDir = path.join(packDir, "reports");
  await ensureDir(stripsDir);
  await ensureDir(reportsDir);

  const packagedFiles: string[] = [];
  for (const check of report.clipChecks) {
    if (!check.approvedForPreview || !check.normalizedSheet) {
      continue;
    }
    const source = path.resolve(repoRoot(), check.normalizedSheet);
    if (!(await pathExists(source))) {
      continue;
    }
    const dest = path.join(stripsDir, `${check.clipId}.png`);
    await fs.copyFile(source, dest);
    packagedFiles.push(toRepoRelative(dest));
  }

  const manifestPath = manifestPathForStage(config, character, stage);
  if (await pathExists(manifestPath)) {
    const dest = path.join(packDir, path.basename(manifestPath));
    await fs.copyFile(manifestPath, dest);
    packagedFiles.push(toRepoRelative(dest));
  }
  await copyIfExists(path.join(characterRoot(config, character), "reports", "latest_game_smoke_report.json"), path.join(reportsDir, "latest_game_smoke_report.json"), packagedFiles);
  await copyIfExists(path.join(characterRoot(config, character), "reports", "spriteforge_queue_status.json"), path.join(reportsDir, "spriteforge_queue_status.json"), packagedFiles);
  await copyIfExists(reportPaths.jsonPath, path.join(reportsDir, "latest_spriteforge_pack_report.json"), packagedFiles);
  await copyIfExists(reportPaths.markdownPath, path.join(reportsDir, "latest_spriteforge_pack_report.md"), packagedFiles);
  return packagedFiles;
}

async function copyPackReportToPackDir(
  config: AgentConfig,
  character: string,
  stage: string,
  reportPaths: { jsonPath: string; markdownPath: string }
): Promise<void> {
  const reportsDir = path.join(previewPackDir(config, character, stage), "reports");
  await ensureDir(reportsDir);
  await fs.copyFile(reportPaths.jsonPath, path.join(reportsDir, "latest_spriteforge_pack_report.json"));
  await fs.copyFile(reportPaths.markdownPath, path.join(reportsDir, "latest_spriteforge_pack_report.md"));
}

async function copyIfExists(source: string, dest: string, packagedFiles: string[]): Promise<void> {
  if (!(await pathExists(source))) {
    return;
  }
  await ensureDir(path.dirname(dest));
  await fs.copyFile(source, dest);
  packagedFiles.push(toRepoRelative(dest));
}

function previewPackDir(config: AgentConfig, character: string, stage: string): string {
  return path.join(characterRoot(config, character), "preview_pack", `${character}_style4_${stage}_preview_pack`);
}

async function writePackReport(
  config: AgentConfig,
  character: string,
  report: PackReport
): Promise<{ jsonPath: string; markdownPath: string }> {
  const reportsDir = path.join(characterRoot(config, character), "reports");
  const jsonPath = path.join(reportsDir, "latest_spriteforge_pack_report.json");
  const markdownPath = path.join(reportsDir, "latest_spriteforge_pack_report.md");
  await writeJson(jsonPath, report);
  await writeText(markdownPath, packMarkdown(report));
  return { jsonPath, markdownPath };
}

function packMarkdown(report: PackReport): string {
  const checks = report.clipChecks.length
    ? report.clipChecks.map((check) => {
      const status = check.issues.length ? `needs retry (${check.issues.join("; ")})` : "pass";
      return `- ${check.clipId}: ${status}`;
    }).join("\n")
    : "- Verification not run yet.";
  return `# SpriteForge Preview Pack Report

Character: \`${report.character}\`
Stage: \`${report.stage}\`
Generated: ${report.generatedAt}
Final status: **${report.finalStatus}**
Approval policy: \`${report.approvalPolicy}\`
Provider: \`${report.provider}\`
Skip approved: **${report.skipApproved ? "true" : "false"}**
Redo approved: **${report.redoApproved ? "true" : "false"}**
Auto-verify: **${report.autoVerify ? "true" : "false"}**
Approved for live roster: **false**

## Required Clips

${report.requiredClips.map((clip) => `- ${clip}`).join("\n")}

## Skipped Approved

${report.skippedApprovedClips.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Queued Clips

${report.queuedClips.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Prompt Preparation

${report.promptPreparation.map((item) => `- ${item.clipId}: ${item.promptPath} -> ${item.manualInbox}`).join("\n") || "- None."}

## Verification

${checks}

## Failed Or Needs Retry

${report.failedClips.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Quarantine

${report.quarantinedOutputs.map((item) => `- ${item}`).join("\n") || "- None."}

## Live Roster Modified Files

${report.liveRosterModifiedFiles.map((item) => `- ${item}`).join("\n") || "- None detected by verify-pack."}

## Human Review Reasons

${report.humanReviewReasons.map((reason) => `- ${reason}`).join("\n") || "- None."}

## Preview Pack

${report.previewPackPath ?? "Not created yet."}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

async function writeAllApprovedQueueStatus(
  config: AgentConfig,
  options: {
    character: string;
    stage: string;
    policyName: string;
    provider: string;
    requiredClips: string[];
    approvedClips: string[];
  }
): Promise<void> {
  const status: QueueStatus = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    updatedAt: new Date().toISOString(),
    character: options.character,
    stage: options.stage,
    approvalPolicy: options.policyName,
    provider: options.provider,
    currentClip: null,
    requestedClips: options.requiredClips,
    completedClips: options.approvedClips,
    failedClips: [],
    waitingClips: [],
    missingClips: [],
    retriedClips: {},
    quarantinedOutputs: [],
    approvedPreviewClips: options.approvedClips,
    approvedLiveClips: [],
    latestManifest: null,
    latestSmokeReport: null,
    nextAction: "Pack queue complete; all required clips were already approved for preview.",
    overallStatus: "complete",
    remainingClips: [],
    failureReasons: {}
  };
  await writeJson(path.join(characterRoot(config, options.character), "reports", "spriteforge_queue_status.json"), status);
  await writeJson(path.join(reportDirForStage(config, options.character, options.stage), "queue_status.json"), status);
}

async function manifestPathIfExists(config: AgentConfig, character: string, stage: string): Promise<string | null> {
  const manifestPath = manifestPathForStage(config, character, stage);
  return (await pathExists(manifestPath)) ? toRepoRelative(manifestPath) : null;
}

function smokePasses(smoke: GameSmokeReport): boolean {
  return smoke.gameSyntaxCheck.passed &&
    smoke.manifestLoads &&
    smoke.clipFramesAdvance &&
    smoke.baselineStable &&
    smoke.issues.length === 0;
}

function packHumanReviewReasons(options: {
  stage: string;
  clipChecks: PackClipCheck[];
  smoke: GameSmokeReport;
  liveRosterModifiedFiles: string[];
  idleApprovedClipPreserved: boolean;
  queueStatus: QueueStatus | null;
}): string[] {
  const reasons: string[] = [];
  for (const check of options.clipChecks) {
    for (const issue of check.issues) {
      reasons.push(`${check.clipId}: ${issue}`);
    }
  }
  if (!smokePasses(options.smoke)) {
    reasons.push(`Smoke test failed: ${options.smoke.issues.join("; ") || options.smoke.gameSyntaxCheck.message}`);
  }
  if (options.stage !== "animator-rebuild-v2" && options.liveRosterModifiedFiles.length > 0) {
    reasons.push(`Live roster files have git changes: ${options.liveRosterModifiedFiles.join(", ")}`);
  }
  if (!options.idleApprovedClipPreserved) {
    reasons.push("Idle preview approval did not match the previously approved normalized strip.");
  }
  for (const [clip, reason] of Object.entries(options.queueStatus?.failureReasons ?? {})) {
    reasons.push(`${clip}: ${reason}`);
  }
  return unique(reasons);
}

function finalStatusFor(options: {
  stage: string;
  clipChecks: PackClipCheck[];
  smoke: GameSmokeReport;
  liveRosterModifiedFiles: string[];
  idleApprovedClipPreserved: boolean;
  queueStatus: QueueStatus | null;
}): PackFinalStatus {
  const allClipsPass = options.clipChecks.every((check) => check.issues.length === 0);
  const hardFailure =
    !smokePasses(options.smoke) ||
    (options.stage !== "animator-rebuild-v2" && options.liveRosterModifiedFiles.length > 0) ||
    !options.idleApprovedClipPreserved ||
    (options.stage === "animator-rebuild-v2" && (options.queueStatus?.failedClips.length ?? 0) > 0) ||
    Object.values(options.queueStatus?.failureReasons ?? {}).some((reason) => /identity drift|smoke test failed|manual review/i.test(reason));
  if (allClipsPass && !hardFailure) {
    return options.stage === "animator-rebuild-v2" ? "REBUILD_PREVIEW_COMPLETE" : "COMPLETE_PREVIEW_PACK";
  }
  if (options.stage === "animator-rebuild-v2") {
    return hardFailure ? "REBUILD_FAILED_NEEDS_HUMAN" : "REBUILD_PARTIAL_WAITING_FOR_ART";
  }
  return hardFailure ? "FAILED_NEEDS_HUMAN" : "PARTIAL_PREVIEW_PACK_NEEDS_RETRY";
}

async function checkIdlePreserved(
  config: AgentConfig,
  character: string,
  stage: string,
  redoApproved: boolean
): Promise<boolean> {
  if (redoApproved || stage !== "mvp") {
    return true;
  }
  const approvedSheet = await readApprovedNormalizedSheet(config, character, "idle");
  if (!approvedSheet) {
    return false;
  }
  const latestClipPath = await latestNormalizedClipPath(config, character, "idle");
  if (!latestClipPath) {
    return false;
  }
  const latestClip = await readJsonIfExists<AnimationClip>(latestClipPath);
  return latestClip?.normalizedSheet === approvedSheet;
}

async function readApprovedNormalizedSheet(config: AgentConfig, character: string, clipId: string): Promise<string | null> {
  const root = characterRoot(config, character);
  const approval = await readJsonIfExists<{ normalizedSheet?: string }>(
    path.join(root, "approvals", "preview", `${clipId}_preview_approval.json`)
  );
  if (approval?.normalizedSheet) {
    return approval.normalizedSheet;
  }
  const legacy = await readJsonIfExists<{ normalizedSheet?: string }>(
    path.join(root, "reports", `${character}_${clipId}_preview_approval.json`)
  );
  return legacy?.normalizedSheet ?? null;
}

async function liveRosterStatus(): Promise<string[]> {
  const targets = [
    "NO_GODS_ABOVE/game.js",
    "NO_GODS_ABOVE/index.html",
    "NO_GODS_ABOVE/style.css",
    "NO_GODS_ABOVE/assets/sprites"
  ];
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short", "--", ...targets], {
      cwd: repoRoot(),
      windowsHide: true
    });
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    return [`git status check failed: ${error instanceof Error ? error.message : String(error)}`];
  }
}

async function listQuarantineOutputs(config: AgentConfig, character: string): Promise<string[]> {
  const quarantineRoot = path.join(characterRoot(config, character), "generated", "quarantine");
  if (!(await pathExists(quarantineRoot))) {
    return [];
  }
  const outputs: string[] = [];
  await collectFiles(quarantineRoot, outputs, (fileName) => /\.(png|webp|json)$/i.test(fileName));
  return outputs.map((filePath) => toRepoRelative(filePath)).sort();
}

async function collectFiles(
  dir: string,
  outputs: string[],
  predicate: (fileName: string) => boolean
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, outputs, predicate);
    } else if (entry.isFile() && predicate(entry.name)) {
      outputs.push(fullPath);
    }
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
