import fs from "node:fs/promises";
import path from "node:path";
import { writeRetryPrompt } from "./buildPrompt.js";
import { exportPreviewManifest } from "./exportManifest.js";
import { runGameSmokeTest, type GameSmokeReport } from "./gameSmokeTest.js";
import { normalizeClip, type NormalizationReport } from "./normalizeFrames.js";
import { runGenerationProvider } from "./providers.js";
import {
  type AgentConfig,
  type AnimationClip,
  type ApprovalPolicyConfig,
  type ValidationReport,
  activeProviderName,
  approvalPolicy,
  assertInside,
  characterRoot,
  characterStageClipIds,
  clipConfigForStage,
  ensureDir,
  latestVersionDir,
  loadCharacterSpec,
  loadConfig,
  manifestPathForStage,
  normalizedRootForStage,
  pathExists,
  previewApprovalDirForStage,
  quarantineRootForStage,
  readJson,
  readJsonIfExists,
  reportDirForStage,
  repoRoot,
  resolveClipList,
  timestampId,
  toRepoRelative,
  writeJson,
  writeText
} from "./report.js";
import { validateSpriteSheet } from "./validateTechnical.js";
import { scoreVisualQa, type VisualQaScoreReport } from "./validateVisual.js";

export interface QueueStatus {
  schemaVersion: string;
  tool: string;
  updatedAt: string;
  character: string;
  stage: string;
  approvalPolicy: string;
  provider: string;
  currentClip: string | null;
  requestedClips: string[];
  completedClips: string[];
  failedClips: string[];
  waitingClips: string[];
  missingClips: string[];
  retriedClips: Record<string, number>;
  quarantinedOutputs: string[];
  approvedPreviewClips: string[];
  approvedLiveClips: string[];
  latestManifest: string | null;
  latestSmokeReport: string | null;
  nextAction: string;
  overallStatus:
    | "idle"
    | "running"
    | "waiting_for_generation"
    | "blocked"
    | "failed"
    | "manual_review_required"
    | "complete";
  remainingClips: string[];
  failureReasons: Record<string, string>;
}

export interface BatchReport {
  schemaVersion: string;
  tool: string;
  generatedAt: string;
  character: string;
  stage: string;
  approvalPolicy: string;
  provider: string;
  autoApprovePreview: boolean;
  autoApproveLive: false;
  clipsAttempted: string[];
  clipsSkippedApproved: string[];
  clipsApprovedForPreview: string[];
  clipsFailed: string[];
  clipsWaitingForGeneration: string[];
  clipsMissingOutput: string[];
  clipsRetried: string[];
  quarantinedOutputs: string[];
  retryCountByClip: Record<string, number>;
  validationSummary: Record<string, string>;
  visualQaSummary: Record<string, { score: number; status: string; summary: string }>;
  smokeTestSummary: Record<string, string>;
  remainingClips: string[];
  humanReviewNeeded: boolean;
  nextAction: string;
  notes: string[];
}

interface RunQueueOptions {
  character: string;
  stage?: string;
  clips?: string[];
  approvalPolicy?: string;
  provider?: string;
  resume?: boolean;
  dryRun?: boolean;
  skipApproved?: boolean;
}

interface GateResult {
  passed: boolean;
  retryable: boolean;
  stopImmediately: boolean;
  reason: string;
}

export async function runSpriteQueue(options: RunQueueOptions): Promise<BatchReport> {
  const config = await loadConfig();
  const dryRun = options.dryRun ?? false;
  const previous = options.resume ? await readQueueStatus(config, options.character) : null;
  const stage = options.stage ?? previous?.stage ?? (options.clips?.length ? "custom" : "mvp");
  const policyName = options.approvalPolicy ?? previous?.approvalPolicy ?? "conservative";
  const policy = approvalPolicy(config, policyName);
  const provider = activeProviderName(config, options.provider ?? previous?.provider);
  const skipApproved = options.skipApproved ?? true;
  const spec = await loadCharacterSpec(config, options.character);
  const briefLoaded = await loadLatestBrief(config, options.character, spec.briefs);
  const requestedClips = resolveRequestedClips(config, {
    character: options.character,
    stage,
    clips: options.clips,
    previous
  });
  const status = initialQueueStatus(config, {
    character: options.character,
    stage,
    policyName,
    provider,
    requestedClips,
    previous: options.resume ? previous : null
  });
  const batch: BatchReport = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    generatedAt: new Date().toISOString(),
    character: options.character,
    stage,
    approvalPolicy: policyName,
    provider,
    autoApprovePreview: policy.autoApprovePreview,
    autoApproveLive: false,
    clipsAttempted: [],
    clipsSkippedApproved: [],
    clipsApprovedForPreview: [...status.approvedPreviewClips],
    clipsFailed: [],
    clipsWaitingForGeneration: [...status.waitingClips],
    clipsMissingOutput: [...status.missingClips],
    clipsRetried: Object.keys(status.retriedClips),
    quarantinedOutputs: [...status.quarantinedOutputs],
    retryCountByClip: { ...status.retriedClips },
    validationSummary: {},
    visualQaSummary: {},
    smokeTestSummary: {},
    remainingClips: [...requestedClips],
    humanReviewNeeded: false,
    nextAction: "Run queue.",
    notes: [
      "Preview queue is isolated from live roster wiring.",
      "AUTO_APPROVE_LIVE is always false.",
      dryRun
        ? "Dry run enabled: provider request is prepared, but generation, manifests, normalization, smoke tests, queue status, and approvals are not modified."
        : "Dry run disabled: queue may call the configured provider.",
      briefLoaded
        ? "Character spec and latest brief were loaded before queue execution."
        : "Character spec loaded; no readable brief file was found."
    ]
  };

  if (!dryRun) {
    await writeQueueStatus(config, status);
  }

  for (const clipId of requestedClips) {
    status.remainingClips = requestedClips.filter(
      (candidate) => candidate !== clipId && !status.completedClips.includes(candidate)
    );

    if (!dryRun && skipApproved && await isClipPreviewApproved(config, options.character, clipId, stage)) {
      addUnique(status.completedClips, clipId);
      addUnique(status.approvedPreviewClips, clipId);
      addUnique(batch.clipsSkippedApproved, clipId);
      addUnique(batch.clipsApprovedForPreview, clipId);
      batch.remainingClips = unresolvedQueueClips(requestedClips, status);
      status.currentClip = null;
      status.nextAction = `Skipped ${clipId}; it is already approved for preview.`;
      status.overallStatus = "running";
      await writeQueueStatus(config, status);
      continue;
    }

    status.currentClip = clipId;
    status.overallStatus = "running";
    status.nextAction = `Processing ${clipId}.`;
    if (!dryRun) {
      await writeQueueStatus(config, status);
    }
    addUnique(batch.clipsAttempted, clipId);

    const outcome = await processClip({
      config,
      character: options.character,
      stage,
      clipId,
      policyName,
      provider,
      status,
      batch,
      dryRun
    });
    batch.retryCountByClip = { ...status.retriedClips };
    batch.clipsWaitingForGeneration = [...status.waitingClips];
    batch.clipsMissingOutput = [...status.missingClips];
    batch.clipsRetried = Object.keys(status.retriedClips);
    batch.quarantinedOutputs = [...status.quarantinedOutputs];
    batch.remainingClips = unresolvedQueueClips(requestedClips, status);
    if (!dryRun) {
      await writeQueueStatus(config, status);
      await writeBatchReport(config, options.character, batch);
    }

    if (outcome !== "continue") {
      return batch;
    }
  }

  const unresolved = unresolvedQueueClips(requestedClips, status);
  status.currentClip = null;
  status.remainingClips = unresolved;
  if (unresolved.length === 0) {
    status.overallStatus = "complete";
    status.nextAction = "Queue complete. Preview clips remain blocked from live roster promotion.";
    if (!dryRun) {
      batch.humanReviewNeeded = false;
    }
  } else if (status.failedClips.length > 0) {
    status.overallStatus = batch.humanReviewNeeded ? "manual_review_required" : "failed";
    status.nextAction = `Batch finished with ${status.failedClips.length} failed clip(s) and ${status.waitingClips.length} waiting/missing clip(s). Fix failed clips or drop replacements, then resume.`;
  } else {
    status.overallStatus = "waiting_for_generation";
    status.nextAction = `Batch prepared prompts and is waiting for generated output for ${status.waitingClips.length || unresolved.length} clip(s). Drop sheets into their rebuild inbox folders, then resume.`;
  }
  batch.clipsWaitingForGeneration = [...status.waitingClips];
  batch.clipsMissingOutput = [...status.missingClips];
  batch.clipsRetried = Object.keys(status.retriedClips);
  batch.quarantinedOutputs = [...status.quarantinedOutputs];
  batch.remainingClips = unresolved;
  batch.nextAction = dryRun
    ? "Dry run complete. Configure SpriteBuilder if needed, then run without --dry-run."
    : status.nextAction;
  if (!dryRun) {
    await writeQueueStatus(config, status);
    await writeBatchReport(config, options.character, batch);
  }
  return batch;
}

export async function readQueueStatus(config: AgentConfig, character: string): Promise<QueueStatus | null> {
  return readJsonIfExists<QueueStatus>(queueStatusPath(config, character));
}

export async function promotePreview(options: {
  character: string;
  clip?: string;
  stage?: string;
}): Promise<{ approvedClips: string[]; missingClips: string[]; manifestPath: string; smokeReportPath: string }> {
  const config = await loadConfig();
  const clips = options.clip
    ? resolveClipList(config, [options.clip])
    : characterStageClipIds(config, options.character, options.stage ?? "mvp");
  const missingClips: string[] = [];
  const approvedClips: string[] = [];

  for (const clipId of clips) {
    const clipPath = await latestNormalizedClipPath(config, options.character, clipId, options.stage);
    if (!clipPath) {
      missingClips.push(clipId);
      continue;
    }
    approvedClips.push(clipId);
  }

  await exportPreviewManifest({ character: options.character, stage: options.stage });
  const smoke = await runGameSmokeTest({ character: options.character, stage: options.stage });
  if (smoke.issues.length > 0 || !smoke.gameSyntaxCheck.passed || !smoke.manifestLoads || !smoke.clipFramesAdvance || !smoke.baselineStable) {
    throw new Error(`Preview promotion smoke test failed: ${smoke.issues.join("; ") || smoke.gameSyntaxCheck.message}`);
  }

  for (const clipId of approvedClips) {
    await markPreviewApproved(config, options.character, clipId, "manual-promote-preview", options.stage);
  }
  await exportPreviewManifest({ character: options.character, stage: options.stage });

  const status = (await readQueueStatus(config, options.character)) ?? initialQueueStatus(config, {
    character: options.character,
    stage: options.stage ?? "custom",
    policyName: "manual-promote-preview",
    provider: activeProviderName(config),
    requestedClips: clips,
    previous: null
  });
  for (const clipId of approvedClips) {
    addUnique(status.completedClips, clipId);
    addUnique(status.approvedPreviewClips, clipId);
  }
  status.currentClip = null;
  status.latestManifest = toRepoRelative(manifestPathForStage(config, options.character, options.stage));
  status.latestSmokeReport = toRepoRelative(path.join(characterRoot(config, options.character), "reports", "latest_game_smoke_report.json"));
  status.overallStatus = missingClips.length > 0 ? "manual_review_required" : "complete";
  status.nextAction = missingClips.length > 0
    ? `Missing normalized clips for preview promotion: ${missingClips.join(", ")}.`
    : "Preview promotion complete. Live roster approval remains false.";
  await writeQueueStatus(config, status);

  return {
    approvedClips,
    missingClips,
    manifestPath: toRepoRelative(manifestPathForStage(config, options.character, options.stage)),
    smokeReportPath: status.latestSmokeReport ?? toRepoRelative(path.join(characterRoot(config, options.character), "reports", "latest_game_smoke_report.json"))
  };
}

export async function rejectPreviewApproval(options: {
  character: string;
  clips: string[];
  stage?: string;
  reason: string;
}): Promise<{
  rejectedClips: string[];
  quarantinedPaths: string[];
  manifestPath: string;
  nextAction: string;
}> {
  const config = await loadConfig();
  const clips = resolveClipList(config, options.clips);
  const root = characterRoot(config, options.character);
  const rejectedClips: string[] = [];
  const quarantinedPaths: string[] = [];
  const stamp = timestampId();
  const revokedDir = path.join(previewApprovalDirForStage(config, options.character, options.stage), "revoked", stamp);
  const rejectionDir = path.join(root, "reports", "manual_review_rejections");
  await ensureDir(revokedDir);
  await ensureDir(rejectionDir);

  for (const clipId of clips) {
    const clipPath = await latestNormalizedClipPath(config, options.character, clipId, options.stage);
    let sourceSheet: string | undefined;
    let normalizedSheet: string | undefined;
    if (clipPath) {
      const clip = await readJson<AnimationClip>(clipPath);
      sourceSheet = clip.sourceSheet;
      normalizedSheet = clip.normalizedSheet;
      await writeJson(clipPath, {
        ...clip,
        validationStatus: "manual_review_required",
        approvedForPreview: false,
        approvedForLiveRoster: false,
        approvalPolicy: "human-rejected",
        notes: [
          ...clip.notes,
          `Human review rejected this preview candidate: ${options.reason}`
        ]
      });
    }

    const approvalBase = path.join(previewApprovalDirForStage(config, options.character, options.stage), `${clipId}_preview_approval`);
    for (const ext of [".json", ".md"]) {
      const approvalPath = `${approvalBase}${ext}`;
      if (await pathExists(approvalPath)) {
        const dest = path.join(revokedDir, `${clipId}_preview_approval${ext}`);
        assertInside(root, approvalPath);
        assertInside(root, dest);
        await fs.rename(approvalPath, dest);
      }
    }

    if (sourceSheet) {
      const quarantined = await quarantineSourceDirectory(config, options.character, options.stage, clipId, sourceSheet, options.reason, stamp);
      if (quarantined) {
        quarantinedPaths.push(quarantined);
      }
    }

    const rejection = {
      schemaVersion: config.schemaVersion,
      tool: config.toolName,
      characterId: options.character,
      clipId,
      rejectedAt: new Date().toISOString(),
      reason: options.reason,
      sourceSheet,
      normalizedSheet,
      approvedForPreview: false,
      approvedForLiveRoster: false,
      liveRosterAffected: false
    };
    await writeJson(path.join(rejectionDir, `${stamp}_${clipId}_preview_rejection.json`), rejection);
    await writeText(path.join(rejectionDir, `${stamp}_${clipId}_preview_rejection.md`), previewRejectionMarkdown(rejection));
    rejectedClips.push(clipId);
  }

  await exportPreviewManifest({ character: options.character, stage: options.stage ?? "mvp" });
  const status = (await readQueueStatus(config, options.character)) ?? initialQueueStatus(config, {
    character: options.character,
    stage: options.stage ?? "mvp",
    policyName: "previewAuto",
    provider: activeProviderName(config),
    requestedClips: characterStageClipIds(config, options.character, options.stage ?? "mvp"),
    previous: null
  });
  status.completedClips = status.completedClips.filter((clipId) => !rejectedClips.includes(clipId));
  status.approvedPreviewClips = status.approvedPreviewClips.filter((clipId) => !rejectedClips.includes(clipId));
  for (const clipId of rejectedClips) {
    addUnique(status.failedClips, clipId);
    status.failureReasons[clipId] = options.reason;
  }
  status.quarantinedOutputs = [...new Set([...status.quarantinedOutputs, ...quarantinedPaths])];
  const pending = [
    ...rejectedClips,
    status.currentClip,
    ...status.remainingClips
  ].filter((clipId): clipId is string => Boolean(clipId));
  status.currentClip = rejectedClips[0] ?? status.currentClip;
  status.remainingClips = [...new Set(pending.filter((clipId) => clipId !== status.currentClip))];
  status.latestManifest = toRepoRelative(manifestPathForStage(config, options.character, options.stage));
  status.overallStatus = "waiting_for_generation";
  status.nextAction = `${rejectedClips.join(", ")} rejected by human review. Regenerate starting with ${status.currentClip}; drop replacement output into generated/inbox/${status.currentClip}/ and run resume.`;
  await writeQueueStatus(config, status);

  return {
    rejectedClips,
    quarantinedPaths,
    manifestPath: toRepoRelative(manifestPathForStage(config, options.character, options.stage)),
    nextAction: status.nextAction
  };
}

async function processClip(options: {
  config: AgentConfig;
  character: string;
  stage: string;
  clipId: string;
  policyName: string;
  provider: string;
  status: QueueStatus;
  batch: BatchReport;
  dryRun: boolean;
}): Promise<"continue" | "stop"> {
  const policy = approvalPolicy(options.config, options.policyName);
  const clip = clipConfigForStage(options.config, options.clipId, options.stage);
  const retryCount = options.status.retriedClips[options.clipId] ?? 0;
  const providerResult = await runGenerationProvider({
    config: options.config,
    characterId: options.character,
    clipId: options.clipId,
    stage: options.stage,
    providerOverride: options.provider,
    dryRun: options.dryRun
  });

  if (providerResult.dryRun) {
    options.batch.validationSummary[options.clipId] = providerResult.needsConfiguration
      ? "dry-run passed request validation; provider command not configured"
      : "dry-run passed request validation";
    options.batch.visualQaSummary[options.clipId] = {
      score: 0,
      status: "not_run",
      summary: "Dry run only; visual QA was not run."
    };
    options.batch.smokeTestSummary[options.clipId] = "not run (dry-run)";
    if (providerResult.needsConfiguration) {
      options.batch.humanReviewNeeded = true;
    }
    options.batch.notes.push(providerResult.message);
    if (providerResult.requestPath) {
      options.batch.notes.push(`SpriteBuilder request payload: ${providerResult.requestPath}`);
    }
    if (providerResult.commandPreview) {
      options.batch.notes.push(`SpriteBuilder command preview: ${providerResult.commandPreview}`);
    }
    if (providerResult.expectedOutputPaths?.length) {
      options.batch.notes.push(`Expected SpriteBuilder outputs: ${providerResult.expectedOutputPaths.join(", ")}`);
    }
    options.status.currentClip = null;
    options.status.overallStatus = "complete";
    options.status.nextAction = providerResult.needsConfiguration
      ? "Dry run complete; configure providers.spritebuilder.executable/args or command before running for real."
      : "Dry run complete; command was not executed.";
    options.batch.nextAction = options.status.nextAction;
    return "continue";
  }

  if (providerResult.needsConfiguration) {
    options.status.overallStatus = "blocked";
    options.status.nextAction = `Configure providers.spritebuilder.command or switch to manual provider. ${providerResult.message}`;
    options.batch.humanReviewNeeded = true;
    options.batch.nextAction = options.status.nextAction;
    return "stop";
  }

  if (!providerResult.sheetPath) {
    addUnique(options.status.waitingClips, options.clipId);
    addUnique(options.status.missingClips, options.clipId);
    removeValue(options.status.failedClips, options.clipId);
    options.batch.validationSummary[options.clipId] = "waiting_for_generation";
    options.batch.visualQaSummary[options.clipId] = {
      score: 0,
      status: "not_run",
      summary: "No generated sheet was available for this clip."
    };
    options.batch.smokeTestSummary[options.clipId] = "not run (waiting for generation)";
    options.status.overallStatus = "waiting_for_generation";
    options.status.nextAction = `${providerResult.message} Resume with npm run sprite-agent -- resume-pack --character ${options.character} --stage ${options.stage}.`;
    options.batch.nextAction = options.status.nextAction;
    return "continue";
  }

  let rawSheet = providerResult.sheetPath;
  let validation = await validateSpriteSheet({ character: options.character, clip: options.clipId, sheet: rawSheet, stage: options.stage });
  let normalized: NormalizationReport | null = null;
  let gateValidation: ValidationReport = validation;
  let visual: VisualQaScoreReport | null = null;
  let smoke: GameSmokeReport | null = null;
  let failureReason = "";

  if (canNormalize(validation)) {
    try {
      normalized = await normalizeClip({ character: options.character, clip: options.clipId, sheet: rawSheet, stage: options.stage });
      rawSheet = normalized.normalizedSheet;
      gateValidation = await validateSpriteSheet({
        character: options.character,
        clip: options.clipId,
        sheet: normalized.normalizedSheet,
        stage: options.stage
      });
    } catch (error) {
      failureReason = error instanceof Error ? error.message : String(error);
    }
  } else {
    failureReason = validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
  }

  visual = await scoreVisualQa(
    options.config,
    options.character,
    options.clipId,
    normalized ? path.resolve(repoRoot(), normalized.normalizedSheet) : providerResult.sheetPath,
    gateValidation
  );
  options.batch.validationSummary[options.clipId] = `${gateValidation.overallStatus}/${gateValidation.technicalStatus}`;
  options.batch.visualQaSummary[options.clipId] = {
    score: visual.score,
    status: visual.status,
    summary: visual.summary
  };

  if (normalized) {
    await exportPreviewManifest({
      character: options.character,
      stage: options.stage === "custom" ? undefined : options.stage,
      includeUnapproved: true
    });
    smoke = await runGameSmokeTest({
      character: options.character,
      stage: options.stage === "custom" ? undefined : options.stage
    });
    options.status.latestManifest = toRepoRelative(manifestPathForStage(options.config, options.character, options.stage));
    options.status.latestSmokeReport = toRepoRelative(path.join(characterRoot(options.config, options.character), "reports", "latest_game_smoke_report.json"));
    options.batch.smokeTestSummary[options.clipId] = smoke.issues.length
      ? `fail: ${smoke.issues.join("; ")}`
      : "pass";
  } else {
    options.batch.smokeTestSummary[options.clipId] = "not run";
  }

  const gate = evaluateGate({
    policy,
    validation: gateValidation,
    visual,
    smoke,
    normalized,
    failureReason
  });

  if (gate.passed) {
    await markPreviewApproved(options.config, options.character, options.clipId, options.policyName, options.stage);
    await exportPreviewManifest({
      character: options.character,
      stage: options.stage === "custom" ? undefined : options.stage
    });
    removeValue(options.status.failedClips, options.clipId);
    removeValue(options.status.waitingClips, options.clipId);
    removeValue(options.status.missingClips, options.clipId);
    delete options.status.failureReasons[options.clipId];
    addUnique(options.status.completedClips, options.clipId);
    addUnique(options.status.approvedPreviewClips, options.clipId);
    addUnique(options.batch.clipsApprovedForPreview, options.clipId);
    options.status.currentClip = null;
    options.status.overallStatus = "running";
    options.status.nextAction = `${options.clipId} approved for preview; continuing.`;
    return "continue";
  }

  if (gate.stopImmediately || retryCount >= policy.maxRetriesPerClip) {
    const quarantined = await quarantineOutput(options.config, options.character, options.stage, options.clipId, providerResult.sheetPath, gate.reason);
    if (quarantined) {
      addUnique(options.status.quarantinedOutputs, quarantined);
      addUnique(options.batch.quarantinedOutputs, quarantined);
    }
    removeValue(options.status.waitingClips, options.clipId);
    removeValue(options.status.missingClips, options.clipId);
    addUnique(options.status.failedClips, options.clipId);
    addUnique(options.batch.clipsFailed, options.clipId);
    options.status.failureReasons[options.clipId] = gate.reason;
    const sharedBlocker = isSharedBatchBlocker(smoke);
    options.status.overallStatus = sharedBlocker ? "manual_review_required" : "failed";
    options.status.nextAction = sharedBlocker
      ? `${options.clipId} stopped the batch because shared smoke/runtime loading failed: ${gate.reason}`
      : `${options.clipId} failed and was isolated from the rest of the batch: ${gate.reason}`;
    options.batch.humanReviewNeeded = true;
    options.batch.nextAction = options.status.nextAction;
    return sharedBlocker ? "stop" : "continue";
  }

  options.status.retriedClips[options.clipId] = retryCount + 1;
  options.batch.retryCountByClip[options.clipId] = retryCount + 1;
  addUnique(options.batch.clipsRetried, options.clipId);
  const retryPath = await writeRetryPrompt(
    options.config,
    options.character,
    clip,
    [gate.reason || failureReason || "Preview gates failed."],
    options.stage
  );
  const quarantined = await quarantineOutput(options.config, options.character, options.stage, options.clipId, providerResult.sheetPath, gate.reason);
  if (quarantined) {
    addUnique(options.status.quarantinedOutputs, quarantined);
    addUnique(options.batch.quarantinedOutputs, quarantined);
  }

  if (options.provider === "manual") {
    addUnique(options.status.waitingClips, options.clipId);
    removeValue(options.status.missingClips, options.clipId);
    options.status.overallStatus = "waiting_for_generation";
    options.status.nextAction = `${options.clipId} needs a regenerated sheet. Retry prompt: ${retryPath}. Drop the replacement into the ${options.stage} inbox for ${options.clipId} and run resume-pack.`;
    options.batch.nextAction = options.status.nextAction;
    return "continue";
  }

  options.status.nextAction = `${options.clipId} retry ${retryCount + 1}/${policy.maxRetriesPerClip}.`;
  return processClip(options);
}

function evaluateGate(options: {
  policy: Required<ApprovalPolicyConfig>;
  validation: ValidationReport;
  visual: VisualQaScoreReport;
  smoke: GameSmokeReport | null;
  normalized: NormalizationReport | null;
  failureReason: string;
}): GateResult {
  const blockers: string[] = [];
  const severe = hasSevereIssue(options.validation);

  if (!options.normalized) {
    blockers.push(`Normalization failed: ${options.failureReason || "no normalized output"}`);
  }
  if (!technicalMeets(options.validation.technicalStatus, options.policy.minTechnicalStatus)) {
    blockers.push(`Technical status ${options.validation.technicalStatus} is below required ${options.policy.minTechnicalStatus}.`);
  }
  if (options.visual.identityDriftDetected) {
    blockers.push("Identity drift detected.");
  }
  if (options.visual.score < options.policy.minVisualScore) {
    blockers.push(`Visual score ${options.visual.score} is below required ${options.policy.minVisualScore}.`);
  }
  if (options.policy.quarantineSuspiciousOutputs && options.visual.suspiciousOutput) {
    blockers.push("Suspicious output flagged by visual QA.");
  }
  if (options.policy.requireSmokeTestPass) {
    if (!options.smoke) {
      blockers.push("Smoke test did not run.");
    } else if (
      options.smoke.issues.length > 0 ||
      !options.smoke.gameSyntaxCheck.passed ||
      !options.smoke.manifestLoads ||
      !options.smoke.clipFramesAdvance ||
      !options.smoke.baselineStable
    ) {
      blockers.push(`Smoke test failed: ${options.smoke.issues.join("; ") || options.smoke.gameSyntaxCheck.message}`);
    }
  }
  if (options.policy.requireHumanReviewEveryClip) {
    blockers.push("Approval policy requires human review for every clip.");
  }
  if (!options.policy.autoApprovePreview) {
    blockers.push("Approval policy does not allow automatic preview approval.");
  }

  if (blockers.length === 0) {
    return { passed: true, retryable: false, stopImmediately: false, reason: "Preview gates passed." };
  }

  const reason = blockers.join(" ");
  const stopImmediately =
    severe ||
    options.visual.identityDriftDetected ||
    Boolean(options.smoke && (
      options.smoke.issues.length > 0 ||
      !options.smoke.gameSyntaxCheck.passed ||
      !options.smoke.manifestLoads ||
      !options.smoke.clipFramesAdvance ||
      !options.smoke.baselineStable
    ));
  return { passed: false, retryable: !stopImmediately, stopImmediately, reason };
}

function canNormalize(validation: ValidationReport): boolean {
  return validation.technicalStatus !== "fail" || validation.autoFixRecommended;
}

function isSharedBatchBlocker(smoke: GameSmokeReport | null): boolean {
  return Boolean(smoke && (!smoke.gameSyntaxCheck.passed || !smoke.manifestLoads));
}

function hasSevereIssue(validation: ValidationReport): boolean {
  return validation.issues.some((issue) =>
    ["CROPPED_BOUNDS", "EMPTY_FRAME", "FRAME_BORDER_DETECTED", "IMAGE_DECODE_FAILED", "FRAME_COUNT_MISMATCH", "DIMENSIONS_NOT_FRAME_MULTIPLE"].includes(issue.code)
  );
}

function technicalMeets(actual: "pass" | "warn" | "fail", minimum: "pass" | "warn" | "fail"): boolean {
  const rank = { fail: 0, warn: 1, pass: 2 };
  return rank[actual] >= rank[minimum];
}

async function markPreviewApproved(
  config: AgentConfig,
  character: string,
  clipId: string,
  policyName: string,
  stage?: string
): Promise<void> {
  const clipPath = await latestNormalizedClipPath(config, character, clipId, stage);
  if (!clipPath) {
    throw new Error(`Cannot approve ${character}/${clipId}; no normalized animation_clip.json found.`);
  }
  const clip = await readJson<AnimationClip>(clipPath);
  const approvedAt = new Date().toISOString();
  const approvedClip: AnimationClip = {
    ...clip,
    validationStatus: "approved",
    approvedForPreview: true,
    approvedForLiveRoster: false,
    approvedAt,
    approvalPolicy: policyName
  };
  await writeJson(clipPath, approvedClip);

  const approval = {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    characterId: character,
    clipId,
    approvedAt,
    approvalPolicy: policyName,
    approvedForPreview: true,
    approvedForLiveRoster: false,
    normalizedClip: toRepoRelative(clipPath),
    normalizedSheet: approvedClip.normalizedSheet,
    flags: {
      AUTO_APPROVE_PREVIEW: policyName !== "manual-promote-preview",
      AUTO_APPROVE_LIVE: false,
      APPROVED_FOR_PREVIEW: true,
      APPROVED_FOR_LIVE_ROSTER: false
    },
    notes: [
      "Preview approval only.",
      "Live roster promotion remains disabled and requires explicit human approval."
    ]
  };
  const approvalsDir = previewApprovalDirForStage(config, character, stage);
  await writeJson(path.join(approvalsDir, `${clipId}_preview_approval.json`), approval);
  await writeText(path.join(approvalsDir, `${clipId}_preview_approval.md`), previewApprovalMarkdown(approval));
}

export async function isClipPreviewApproved(
  config: AgentConfig,
  character: string,
  clipId: string,
  stage?: string
): Promise<boolean> {
  const approvalPath = path.join(previewApprovalDirForStage(config, character, stage), `${clipId}_preview_approval.json`);
  const approval = await readJsonIfExists<{ approvedForPreview?: boolean }>(approvalPath);
  if (approval?.approvedForPreview) {
    return true;
  }

  if (!stage) {
    const legacyPath = path.join(characterRoot(config, character), "reports", `${character}_${clipId}_preview_approval.json`);
    const legacy = await readJsonIfExists<{ flags?: Record<string, boolean> }>(legacyPath);
    if (legacy?.flags && Object.entries(legacy.flags).some(([key, value]) => key.startsWith("APPROVED_FOR_PREVIEW") && value)) {
      return true;
    }
  }

  const clipPath = await latestNormalizedClipPath(config, character, clipId, stage);
  if (!clipPath) {
    return false;
  }
  const clip = await readJsonIfExists<AnimationClip>(clipPath);
  return clip?.approvedForPreview === true || clip?.validationStatus === "approved";
}

export async function latestNormalizedClipPath(
  config: AgentConfig,
  character: string,
  clipId: string,
  stage?: string
): Promise<string | null> {
  const clipDir = path.join(normalizedRootForStage(config, character, stage), clipId);
  const versionDir = await latestVersionDir(clipDir);
  if (!versionDir) {
    return null;
  }
  const clipPath = path.join(versionDir, "animation_clip.json");
  return (await pathExists(clipPath)) ? clipPath : null;
}

async function quarantineOutput(
  config: AgentConfig,
  character: string,
  stage: string,
  clipId: string,
  sourcePath: string,
  reason: string
): Promise<string | null> {
  if (!(await pathExists(sourcePath))) {
    return null;
  }
  const root = characterRoot(config, character);
  const quarantineRoot = quarantineRootForStage(config, character, stage);
  const quarantineDir = path.join(quarantineRoot, clipId, `v${timestampId()}-${Date.now()}`);
  await ensureDir(quarantineDir);
  const dest = path.join(quarantineDir, path.basename(sourcePath));
  const sourceInsideRoot = isInside(root, sourcePath);
  const sourceInQuarantine = isInside(quarantineRoot, sourcePath);
  if (sourceInsideRoot && !sourceInQuarantine) {
    await fs.rename(sourcePath, dest);
  } else {
    await fs.copyFile(sourcePath, dest);
  }
  await writeJson(path.join(quarantineDir, "quarantine_report.json"), {
    character,
    clipId,
    sourcePath: toRepoRelative(sourcePath),
    quarantinedPath: toRepoRelative(dest),
    reason,
    stage,
    liveRosterAffected: false
  });
  return toRepoRelative(dest);
}

async function quarantineSourceDirectory(
  config: AgentConfig,
  character: string,
  stage: string | undefined,
  clipId: string,
  sourceSheet: string,
  reason: string,
  stamp: string
): Promise<string | null> {
  const root = characterRoot(config, character);
  const sourcePath = path.resolve(repoRoot(), sourceSheet);
  if (!(await pathExists(sourcePath))) {
    return null;
  }

  assertInside(root, sourcePath);
  const inboxSegment = `${path.sep}generated${path.sep}inbox${path.sep}${clipId}${path.sep}`;
  const sourceDir = sourcePath.includes(inboxSegment) ? path.dirname(sourcePath) : sourcePath;
  const destDir = path.join(quarantineRootForStage(config, character, stage), clipId, `v${stamp}-human-rejected-${path.basename(sourceDir)}`);
  assertInside(root, destDir);
  await ensureDir(path.dirname(destDir));
  await fs.rename(sourceDir, destDir);
  await writeJson(path.join(destDir, "quarantine_report.json"), {
    character,
    clipId,
    sourcePath: toRepoRelative(sourceDir),
    quarantinedPath: toRepoRelative(destDir),
    reason,
    liveRosterAffected: false
  });
  return toRepoRelative(destDir);
}

function resolveRequestedClips(
  config: AgentConfig,
  options: { character: string; stage: string; clips?: string[]; previous: QueueStatus | null }
): string[] {
  if (options.clips?.length) {
    return resolveClipList(config, options.clips);
  }
  if (options.previous?.currentClip) {
    return resolveClipList(config, [
      options.previous.currentClip,
      ...options.previous.remainingClips,
      ...(options.previous.waitingClips ?? []),
      ...(options.previous.failedClips ?? [])
    ]);
  }
  if (options.previous?.remainingClips.length) {
    return resolveClipList(config, [
      ...options.previous.remainingClips,
      ...(options.previous.waitingClips ?? []),
      ...(options.previous.failedClips ?? [])
    ]);
  }
  if ((options.previous?.waitingClips?.length ?? 0) > 0 || (options.previous?.failedClips.length ?? 0) > 0) {
    return resolveClipList(config, [
      ...(options.previous?.waitingClips ?? []),
      ...(options.previous?.failedClips ?? [])
    ]);
  }
  return characterStageClipIds(config, options.character, options.stage);
}

function initialQueueStatus(
  config: AgentConfig,
  options: {
    character: string;
    stage: string;
    policyName: string;
    provider: string;
    requestedClips: string[];
    previous: QueueStatus | null;
  }
): QueueStatus {
  return {
    schemaVersion: config.schemaVersion,
    tool: config.toolName,
    updatedAt: new Date().toISOString(),
    character: options.character,
    stage: options.stage,
    approvalPolicy: options.policyName,
    provider: options.provider,
    currentClip: options.previous?.currentClip ?? null,
    requestedClips: options.requestedClips,
    completedClips: [...(options.previous?.completedClips ?? [])],
    failedClips: [...(options.previous?.failedClips ?? [])],
    waitingClips: [...(options.previous?.waitingClips ?? [])],
    missingClips: [...(options.previous?.missingClips ?? [])],
    retriedClips: { ...(options.previous?.retriedClips ?? {}) },
    quarantinedOutputs: [...(options.previous?.quarantinedOutputs ?? [])],
    approvedPreviewClips: [...(options.previous?.approvedPreviewClips ?? [])],
    approvedLiveClips: [],
    latestManifest: options.previous?.latestManifest ?? null,
    latestSmokeReport: options.previous?.latestSmokeReport ?? null,
    nextAction: "Queue initialized.",
    overallStatus: "idle",
    remainingClips: [...options.requestedClips],
    failureReasons: { ...(options.previous?.failureReasons ?? {}) }
  };
}

function unresolvedQueueClips(requestedClips: string[], status: QueueStatus): string[] {
  const unresolved = requestedClips.filter((clipId) => !status.completedClips.includes(clipId));
  return [...new Set([
    ...unresolved,
    ...status.waitingClips,
    ...status.failedClips
  ])];
}

async function loadLatestBrief(
  config: AgentConfig,
  character: string,
  briefs: Array<{ path: string; ingestedAt: string }> | undefined
): Promise<boolean> {
  const candidates = [
    briefs?.at(-1)?.path,
    `assets/characters/${character}/references/${character}_brief.md`
  ].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    const absPath = path.resolve(repoRoot(), candidate);
    if (await pathExists(absPath)) {
      await fs.readFile(absPath, "utf8");
      return true;
    }
  }
  return false;
}

async function writeQueueStatus(config: AgentConfig, status: QueueStatus): Promise<void> {
  status.updatedAt = new Date().toISOString();
  await writeJson(queueStatusPath(config, status.character), status);
  const stageReportsDir = reportDirForStage(config, status.character, status.stage);
  await writeJson(path.join(stageReportsDir, "queue_status.json"), status);
}

async function writeBatchReport(config: AgentConfig, character: string, report: BatchReport): Promise<void> {
  const reportsDir = path.join(characterRoot(config, character), "reports");
  await writeJson(path.join(reportsDir, "latest_spriteforge_batch_report.json"), report);
  await writeText(path.join(reportsDir, "latest_spriteforge_batch_report.md"), batchMarkdown(report));
  const stageReportsDir = reportDirForStage(config, character, report.stage);
  await writeJson(path.join(stageReportsDir, "latest_batch_report.json"), report);
  await writeText(path.join(stageReportsDir, "latest_batch_report.md"), batchMarkdown(report));
}

function queueStatusPath(config: AgentConfig, character: string): string {
  return path.join(characterRoot(config, character), "reports", "spriteforge_queue_status.json");
}

function batchMarkdown(report: BatchReport): string {
  return `# SpriteForge Batch Report

Character: \`${report.character}\`
Stage: \`${report.stage}\`
Approval policy: \`${report.approvalPolicy}\`
Provider: \`${report.provider}\`
Generated: ${report.generatedAt}
Auto-approve preview: **${report.autoApprovePreview ? "true" : "false"}**
Auto-approve live: **false**
Human review needed: **${report.humanReviewNeeded ? "yes" : "no"}**

## Clips Attempted

${report.clipsAttempted.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Skipped Approved Clips

${report.clipsSkippedApproved.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Approved For Preview

${report.clipsApprovedForPreview.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Failed Clips

${report.clipsFailed.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Waiting For Generation

${report.clipsWaitingForGeneration.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Missing Output

${report.clipsMissingOutput.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Retried Clips

${report.clipsRetried.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Quarantined Outputs

${report.quarantinedOutputs.map((item) => `- ${item}`).join("\n") || "- None."}

## Retry Count

${Object.entries(report.retryCountByClip).map(([clip, count]) => `- ${clip}: ${count}`).join("\n") || "- None."}

## Validation Summary

${Object.entries(report.validationSummary).map(([clip, summary]) => `- ${clip}: ${summary}`).join("\n") || "- None."}

## Visual QA Summary

${Object.entries(report.visualQaSummary).map(([clip, qa]) => `- ${clip}: ${qa.status}, score ${qa.score} (${qa.summary})`).join("\n") || "- None."}

## Smoke Test Summary

${Object.entries(report.smokeTestSummary).map(([clip, summary]) => `- ${clip}: ${summary}`).join("\n") || "- None."}

## Remaining Clips

${report.remainingClips.map((clip) => `- ${clip}`).join("\n") || "- None."}

## Next Action

${report.nextAction}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

function previewApprovalMarkdown(approval: {
  characterId: string;
  clipId: string;
  approvedAt: string;
  approvalPolicy: string;
  approvedForPreview: boolean;
  approvedForLiveRoster: boolean;
  normalizedSheet?: string;
  notes: string[];
}): string {
  return `# SpriteForge Preview Approval

Character: \`${approval.characterId}\`
Clip: \`${approval.clipId}\`
Approved at: ${approval.approvedAt}
Approval policy: \`${approval.approvalPolicy}\`
Approved for preview: **${approval.approvedForPreview ? "true" : "false"}**
Approved for live roster: **${approval.approvedForLiveRoster ? "true" : "false"}**
Normalized sheet: \`${approval.normalizedSheet ?? "unknown"}\`

## Notes

${approval.notes.map((note) => `- ${note}`).join("\n")}
`;
}

function previewRejectionMarkdown(rejection: {
  characterId: string;
  clipId: string;
  rejectedAt: string;
  reason: string;
  sourceSheet?: string;
  normalizedSheet?: string;
  approvedForPreview: boolean;
  approvedForLiveRoster: boolean;
}): string {
  return `# SpriteForge Preview Rejection

Character: \`${rejection.characterId}\`
Clip: \`${rejection.clipId}\`
Rejected at: ${rejection.rejectedAt}
Reason: ${rejection.reason}
Approved for preview: **${rejection.approvedForPreview ? "true" : "false"}**
Approved for live roster: **${rejection.approvedForLiveRoster ? "true" : "false"}**
Source sheet: \`${rejection.sourceSheet ?? "unknown"}\`
Normalized sheet: \`${rejection.normalizedSheet ?? "unknown"}\`

## Notes

- Human visual review overrides technical validation.
- The candidate remains preview-only and must not be promoted to live roster.
`;
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function removeValue(values: string[], value: string): void {
  const index = values.indexOf(value);
  if (index >= 0) {
    values.splice(index, 1);
  }
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}
