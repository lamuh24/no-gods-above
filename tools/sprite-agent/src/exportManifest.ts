import path from "node:path";
import {
  type AnimationClip,
  characterRoot,
  characterStageClipIds,
  clipConfigForStage,
  latestVersionDir,
  loadConfig,
  manifestFileNameForStage,
  manifestPathForStage,
  normalizedRootForStage,
  pathExists,
  previewApprovalDirForStage,
  readJson,
  repoRoot,
  timestampId,
  toRepoRelative,
  writeJson,
  writeReportBundle
} from "./report.js";

export interface ExportOptions {
  character: string;
  stage?: string;
  includeUnapproved?: boolean;
}

export interface SpriteManifest {
  schemaVersion: string;
  manifestKind: "preview";
  generatedAt: string;
  characterId: string;
  stage?: string;
  approvedForLiveRoster: false;
  liveRosterWiring: "disabled";
  releaseStatus?: "wip_delayed";
  previewStatus?: "animation_rebuild_required";
  productionCandidate?: false;
  candidateArchiveStatus?: "failed_animation_quality_candidate";
  releaseDecisionReport?: string;
  restartPlan?: string;
  qualityDecision?: {
    decidedAt: string;
    decision: string;
    reason: string;
    recommendedRestartMethod: string;
  };
  spriteStandard: {
    frameWidth: number;
    frameHeight: number;
    baselineY: number;
    facing: "right" | "left";
  };
  clips: AnimationClip[];
  missingClips: string[];
  reports: {
    latestValidationReport?: string;
    latestNormalizationReport?: string;
  };
  notes: string[];
}

export async function exportPreviewManifest(options: ExportOptions): Promise<SpriteManifest> {
  const config = await loadConfig();
  const root = characterRoot(config, options.character);
  const requestedClipIds = options.stage
    ? characterStageClipIds(config, options.character, options.stage)
    : Object.keys(config.clips);
  const clips: AnimationClip[] = [];
  const missingClips: string[] = [];

  for (const clipId of requestedClipIds) {
    const normalizedClip = options.includeUnapproved
      ? await latestNormalizedClip(config, root, clipId, options.stage)
      : await approvedNormalizedClip(config, root, clipId, options.stage);
    if (normalizedClip) {
      clips.push(normalizedClip);
    } else if (options.stage) {
      missingClips.push(clipId);
    }
  }

  const reports = {
    latestValidationReport: (await pathExists(path.join(root, "reports", "latest_validation_report.json")))
      ? toRepoRelative(path.join(root, "reports", "latest_validation_report.json"))
      : undefined,
    latestNormalizationReport: (await pathExists(path.join(root, "reports", "latest_normalization_report.json")))
      ? toRepoRelative(path.join(root, "reports", "latest_normalization_report.json"))
      : undefined
  };

  const manifest: SpriteManifest = {
    schemaVersion: config.schemaVersion,
    manifestKind: "preview",
    generatedAt: new Date().toISOString(),
    characterId: options.character,
    stage: options.stage,
    approvedForLiveRoster: false,
    liveRosterWiring: "disabled",
    ...releaseReadinessStatus(options.character, options.stage),
    spriteStandard: {
      frameWidth: config.sprite.frameWidth,
      frameHeight: config.sprite.frameHeight,
      baselineY: config.sprite.baselineY,
      facing: config.sprite.facing
    },
    clips,
    missingClips,
    reports,
    notes: [
      "This manifest is preview-only and is not consumed by the live roster automatically.",
      "Do not wire these clips into NO_GODS_ABOVE/game.js until validation is approved and a separate runtime adapter/integration pass is requested.",
      "Existing production assets remain untouched."
    ]
  };

  const manifestsDir = path.join(root, "manifests");
  await writeJson(manifestPathForStage(config, options.character, options.stage), manifest);
  if (manifestFileNameForStage(config, options.stage) === "preview_animation_clips.json") {
    await writeJson(path.join(manifestsDir, "animation_clips.json"), manifest);
  }
  await writeReportBundle(
    config,
    options.character,
    `${timestampId()}_export_report`,
    manifest,
    manifestMarkdown(manifest),
    "latest_export_report"
  );

  return manifest;
}

function releaseReadinessStatus(character: string, stage?: string): Partial<SpriteManifest> {
  if (character !== "sable" || stage !== "animator-rebuild-v2") {
    return {};
  }
  return {
    releaseStatus: "wip_delayed",
    previewStatus: "animation_rebuild_required",
    productionCandidate: false,
    candidateArchiveStatus: "failed_animation_quality_candidate",
    releaseDecisionReport: "assets/characters/sable/reports/sable_release_delay_decision.md",
    restartPlan: "assets/characters/sable/reports/sable_key_pose_restart_plan.md",
    qualityDecision: {
      decidedAt: "2026-07-03",
      decision: "Do not ship the current Sable Style 4 animator-rebuild-v2 pack.",
      reason: "The current animation packs have missing, choppy, and inconsistent animations with insufficient fighting-game readability.",
      recommendedRestartMethod: "key poses -> in-betweens -> assembled spritesheet -> SpriteForge validation -> preview approval"
    }
  };
}

async function approvedNormalizedClip(
  config: Awaited<ReturnType<typeof loadConfig>>,
  root: string,
  clipId: string,
  stage?: string
): Promise<AnimationClip | null> {
  const approvalPath = path.join(previewApprovalDirForStage(config, path.basename(root), stage), `${clipId}_preview_approval.json`);
  if (await pathExists(approvalPath)) {
    const approval = await readJson<{
      approvedForPreview?: boolean;
      normalizedClip?: string;
      normalizedSheet?: string;
    }>(approvalPath);
    if (approval.approvedForPreview === true && approval.normalizedClip) {
      const approvedClip = await readNormalizedClipAt(
        config,
        clipId,
        path.resolve(repoRoot(), approval.normalizedClip),
        stage
      );
      if (approvedClip) {
        return approvedClip;
      }
    }
    return null;
  }

  const normalizedClip = await latestNormalizedClip(config, root, clipId, stage);
  if (normalizedClip && isClipMarkedPreviewApproved(normalizedClip)) {
    return normalizedClip;
  }
  return null;
}

function isClipMarkedPreviewApproved(clip: AnimationClip): boolean {
  return clip.approvedForPreview === true || clip.validationStatus === "approved";
}

async function latestNormalizedClip(
  config: Awaited<ReturnType<typeof loadConfig>>,
  root: string,
  clipId: string,
  stage?: string
): Promise<AnimationClip | null> {
  const clipDir = path.join(normalizedRootForStage(config, path.basename(root), stage), clipId);
  const versionDir = await latestVersionDir(clipDir);
  if (!versionDir) {
    return null;
  }
  const clipPath = path.join(versionDir, "animation_clip.json");
  return readNormalizedClipAt(config, clipId, clipPath, stage);
}

async function readNormalizedClipAt(
  config: Awaited<ReturnType<typeof loadConfig>>,
  clipId: string,
  clipPath: string,
  stage?: string
): Promise<AnimationClip | null> {
  if (!(await pathExists(clipPath))) {
    return null;
  }
  const clip = await readJson<AnimationClip>(clipPath);
  const base = clipConfigForStage(config, clipId, stage);
  const normalizedAbs = clip.normalizedSheet ? path.resolve(repoRoot(), clip.normalizedSheet) : null;
  if (!normalizedAbs || !(await pathExists(normalizedAbs))) {
    return {
      ...base,
      ...clip,
      notes: [
        ...base.notes,
        ...clip.notes,
        "Normalized sheet path was recorded but could not be verified from the repo root."
      ]
    };
  }
  return { ...base, ...clip, notes: [...base.notes, ...clip.notes] };
}

function manifestMarkdown(manifest: SpriteManifest): string {
  return `# SpriteForge Export Manifest

Character: \`${manifest.characterId}\`
Stage: \`${manifest.stage ?? "all-normalized"}\`
Generated: ${manifest.generatedAt}
Approved for live roster: **no**
Live roster wiring: **disabled**
${manifest.releaseStatus ? `Release status: **${manifest.releaseStatus}**
Preview status: **${manifest.previewStatus ?? "unknown"}**
Production candidate: **${manifest.productionCandidate === false ? "false" : "unknown"}**
Candidate archive status: **${manifest.candidateArchiveStatus ?? "unknown"}**
Release decision report: \`${manifest.releaseDecisionReport}\`
Restart plan: \`${manifest.restartPlan}\`
` : ""}

## Clips

${manifest.clips.map((clip) => `- ${clip.clipId}: ${clip.normalizedSheet ?? "missing normalized sheet"}`).join("\n") || "- No normalized clips found."}

## Missing Clips

${manifest.missingClips.map((clipId) => `- ${clipId}`).join("\n") || "- None for this export scope."}

## Notes

${manifest.notes.map((note) => `- ${note}`).join("\n")}
`;
}
