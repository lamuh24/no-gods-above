import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type IssueSeverity = "info" | "warn" | "fail";
export type OverallStatus =
  | "technical_pass"
  | "needs_autofix"
  | "manual_review_required"
  | "rejected"
  | "approved";

export interface AgentConfig {
  toolName: string;
  schemaVersion: string;
  assetRoot: string;
  approvalPolicies?: Record<string, ApprovalPolicyConfig>;
  providers?: ProviderRegistryConfig;
  provider?: {
    active: string;
    manual: {
      promptOutbox: string;
      generatedInbox: string;
    };
  };
  sprite: {
    frameWidth: number;
    frameHeight: number;
    baselineY: number;
    facing: "right" | "left";
    anchorX: number;
    safeBox: {
      maxWidth: number;
      maxHeight: number;
      minHeight: number;
    };
    allowScaleUp: boolean;
  };
  validation: {
    maxBaselineDriftPx: number;
    maxCenterDriftPx: number;
    maxScaleDriftPx: number;
    cropMarginPx: number;
    minOpaquePixels: number;
    alphaOpaqueThreshold: number;
    opaqueBackgroundRatio: number;
    edgeBorderOpaqueRatio: number;
    solidBackgroundColorDistance: number;
    duplicateHashMaxDistance: number;
  };
  clipDefaults: Partial<AnimationClip>;
  clips: Record<string, Partial<AnimationClip>>;
  stageClipOverrides?: Record<string, Record<string, Partial<AnimationClip>>>;
  clipAliases?: Record<string, string>;
  stages: Record<string, string[]>;
  characterQueues?: Record<string, Record<string, string[]>>;
  stageManualPaths?: Record<string, StageManualPathConfig>;
  stageManifestFiles?: Record<string, string>;
  stageNormalizedDirs?: Record<string, string>;
  stageApprovalDirs?: Record<string, string>;
  stageReportDirs?: Record<string, string>;
  game: {
    gameRoot: string;
    previewHarnessFile: string;
  };
}

export interface ApprovalPolicyConfig {
  autoApprovePreview: boolean;
  autoApproveLive: boolean;
  requireHumanReviewEveryClip: boolean;
  maxRetriesPerClip?: number;
  minTechnicalStatus?: "pass" | "warn" | "fail";
  minVisualScore?: number;
  requireSmokeTestPass?: boolean;
  quarantineSuspiciousOutputs?: boolean;
}

export interface ProviderRegistryConfig {
  active: string;
  manual: ManualProviderConfig;
  spritebuilder?: SpriteBuilderProviderConfig;
  [providerName: string]: unknown;
}

export interface ManualProviderConfig {
  mode: "outbox";
  promptOutbox: string;
  generatedInbox: string;
}

export interface StageManualPathConfig {
  promptOutbox?: string;
  generatedInbox?: string;
}

export interface SpriteBuilderProviderConfig {
  mode: "local";
  command?: string;
  executable?: string;
  args?: string[];
  shell?: boolean;
  inputPromptPath?: boolean;
  outputDirectory: string;
  requestPath?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface CharacterSpec {
  id: string;
  displayName: string;
  role: string;
  bodyType: string;
  skinTone: string;
  hair: string;
  face: string;
  outfit: string;
  accessories: string[];
  vfx: string;
  forbidden: string[];
  palette: Record<string, string>;
  spriteRules: {
    frameWidth: number;
    frameHeight: number;
    baselineY: number;
    facing: "right" | "left";
    style: string;
    [key: string]: unknown;
  };
  styleNotes: string[];
  lock?: {
    status: "draft_locked" | "approved_locked";
    createdAt: string;
    updatedAt: string;
    requiresHumanApproval: boolean;
  };
  references?: Array<{ path: string; ingestedAt: string }>;
  briefs?: Array<{ path: string; ingestedAt: string }>;
  [key: string]: unknown;
}

export interface AnimationClip {
  clipId: string;
  category: string;
  frameCount: number;
  fps: number;
  loop: boolean;
  frameWidth: number;
  frameHeight: number;
  baselineY: number;
  facing: "right" | "left";
  sourceSheet?: string;
  normalizedSheet?: string;
  frameOrder: number[];
  hitFrames: number[];
  cancelFrames: number[];
  notes: string[];
  validationStatus?: OverallStatus;
  approvedForPreview?: boolean;
  approvedForLiveRoster?: false;
  approvedAt?: string;
  approvalPolicy?: string;
}

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  frameIndex?: number;
  [key: string]: unknown;
}

export interface FrameMeasurement {
  frameIndex: number;
  empty: boolean;
  opaquePixels: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  };
  baselineDeltaPx?: number;
  centerDeltaPx?: number;
  edgeContact?: boolean;
  edgeOpaqueRatio?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  averageHash?: string;
  textLikeDarkBand?: boolean;
  detachedComponents?: Array<{
    pixels: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
      right: number;
      bottom: number;
    };
  }>;
}

export interface DuplicateFrame {
  frameA: number;
  frameB: number;
  hammingDistance: number;
}

export interface ValidationReport {
  schemaVersion: string;
  tool: string;
  generatedAt: string;
  characterId: string;
  clipId: string;
  sourceSheet: string;
  normalizedSheet?: string;
  expected: AnimationClip;
  layout?: {
    mode: "horizontal-strip" | "grid";
    columns: number;
    rows: number;
    frameCount: number;
  };
  overallStatus: OverallStatus;
  technicalStatus: "pass" | "warn" | "fail";
  visualStatus: "not_run" | "manual_review_required" | "approved" | "rejected";
  approvedForLiveRoster: boolean;
  issues: ValidationIssue[];
  frameMeasurements: FrameMeasurement[];
  duplicateFrames: DuplicateFrame[];
  autoFixRecommended: boolean;
  retryPrompt?: string;
}

export function toolRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function repoRoot(): string {
  return path.resolve(toolRoot(), "../..");
}

export async function loadConfig(): Promise<AgentConfig> {
  return readJson<AgentConfig>(path.join(toolRoot(), "agent.config.json"));
}

export function characterRoot(config: AgentConfig, characterId: string): string {
  return path.join(toolRoot(), config.assetRoot, slugify(characterId));
}

export function gameRoot(config: AgentConfig): string {
  return path.resolve(toolRoot(), config.game.gameRoot);
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  return readJson<T>(filePath);
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath: string, value: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

export function timestampId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw new Error(`Invalid empty slug from "${value}"`);
  }
  return slug;
}

export function titleize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveUserPath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }
  const repoCandidate = path.resolve(repoRoot(), inputPath);
  if (existsSync(repoCandidate)) {
    return repoCandidate;
  }
  return path.resolve(process.cwd(), inputPath);
}

export function toToolRelative(absPath: string): string {
  return path.relative(toolRoot(), absPath).replace(/\\/g, "/");
}

export function toRepoRelative(absPath: string): string {
  return path.relative(repoRoot(), absPath).replace(/\\/g, "/");
}

export function clipConfig(config: AgentConfig, clipId: string): AnimationClip {
  return buildClipConfig(config, clipId, config.clips[clipId] ?? {});
}

export function clipConfigForStage(config: AgentConfig, clipId: string, stage?: string): AnimationClip {
  const base = config.clips[clipId] ?? {};
  const stageOverride = stage ? (config.stageClipOverrides?.[stage]?.[clipId] ?? {}) : {};
  return buildClipConfig(config, clipId, { ...base, ...stageOverride });
}

function buildClipConfig(config: AgentConfig, clipId: string, specific: Partial<AnimationClip>): AnimationClip {
  const defaults = config.clipDefaults;
  const frameCount = numberValue(specific.frameCount, defaults.frameCount, 6);
  return {
    clipId,
    category: stringValue(specific.category, defaults.category, "movement"),
    frameCount,
    fps: numberValue(specific.fps, defaults.fps, 12),
    loop: booleanValue(specific.loop, defaults.loop, false),
    frameWidth: config.sprite.frameWidth,
    frameHeight: config.sprite.frameHeight,
    baselineY: config.sprite.baselineY,
    facing: config.sprite.facing,
    sourceSheet: specific.sourceSheet,
    normalizedSheet: specific.normalizedSheet,
    frameOrder: Array.from({ length: frameCount }, (_, index) => index),
    hitFrames: arrayValue(specific.hitFrames, defaults.hitFrames),
    cancelFrames: arrayValue(specific.cancelFrames, defaults.cancelFrames),
    notes: arrayValue(specific.notes, defaults.notes)
  };
}

export function manualProviderConfig(config: AgentConfig, stage?: string): ManualProviderConfig {
  const base = config.providers?.manual
    ? config.providers.manual
    : config.provider?.manual
      ? {
          mode: "outbox" as const,
          promptOutbox: config.provider.manual.promptOutbox,
          generatedInbox: config.provider.manual.generatedInbox
        }
      : {
          mode: "outbox" as const,
          promptOutbox: "prompts/outbox",
          generatedInbox: "generated/inbox"
        };
  const stagePaths = stage ? config.stageManualPaths?.[stage] : undefined;
  return {
    mode: "outbox",
    promptOutbox: stagePaths?.promptOutbox ?? base.promptOutbox,
    generatedInbox: stagePaths?.generatedInbox ?? base.generatedInbox
  };
}

export function manifestFileNameForStage(config: AgentConfig, stage?: string): string {
  return (stage ? config.stageManifestFiles?.[stage] : undefined) ?? "preview_animation_clips.json";
}

export function manifestPathForStage(config: AgentConfig, characterId: string, stage?: string): string {
  return path.join(characterRoot(config, characterId), "manifests", manifestFileNameForStage(config, stage));
}

export function normalizedRootForStage(config: AgentConfig, characterId: string, stage?: string): string {
  return path.join(characterRoot(config, characterId), config.stageNormalizedDirs?.[stage ?? ""] ?? "normalized");
}

export function previewApprovalDirForStage(config: AgentConfig, characterId: string, stage?: string): string {
  return path.join(characterRoot(config, characterId), config.stageApprovalDirs?.[stage ?? ""] ?? "approvals/preview");
}

export function reportDirForStage(config: AgentConfig, characterId: string, stage?: string): string {
  return path.join(characterRoot(config, characterId), config.stageReportDirs?.[stage ?? ""] ?? "reports");
}

export function quarantineRootForStage(config: AgentConfig, characterId: string, stage?: string): string {
  const manual = manualProviderConfig(config, stage);
  const generatedRoot = path.dirname(manual.generatedInbox);
  return path.join(characterRoot(config, characterId), generatedRoot, "quarantine");
}

export function activeProviderName(config: AgentConfig, override?: string): string {
  const selected = override?.trim() || config.providers?.active || config.provider?.active || "manual";
  return selected;
}

export function approvalPolicy(config: AgentConfig, policyName: string): Required<ApprovalPolicyConfig> {
  const policy = config.approvalPolicies?.[policyName];
  if (!policy) {
    throw new Error(
      `Unknown approval policy "${policyName}". Available policies: ${Object.keys(config.approvalPolicies ?? {}).join(", ")}`
    );
  }
  return {
    autoApprovePreview: policy.autoApprovePreview,
    autoApproveLive: false,
    requireHumanReviewEveryClip: policy.requireHumanReviewEveryClip,
    maxRetriesPerClip: policy.maxRetriesPerClip ?? 0,
    minTechnicalStatus: policy.minTechnicalStatus ?? "pass",
    minVisualScore: policy.minVisualScore ?? 100,
    requireSmokeTestPass: policy.requireSmokeTestPass ?? true,
    quarantineSuspiciousOutputs: policy.quarantineSuspiciousOutputs ?? false
  };
}

export function stageClipIds(config: AgentConfig, stage: string): string[] {
  const clips = config.stages[stage];
  if (!clips) {
    throw new Error(`Unknown stage "${stage}". Available stages: ${Object.keys(config.stages).join(", ")}`);
  }
  return clips;
}

export function characterStageClipIds(config: AgentConfig, characterId: string, stage: string): string[] {
  const characterQueue = config.characterQueues?.[slugify(characterId)]?.[stage];
  return characterQueue ? characterQueue.map((clipId) => resolveClipId(config, clipId)) : stageClipIds(config, stage);
}

export function resolveClipId(config: AgentConfig, inputClipId: string): string {
  const trimmed = inputClipId.trim();
  if (config.clips[trimmed]) {
    return trimmed;
  }
  const normalized = normalizeClipKey(trimmed);
  const alias = config.clipAliases?.[trimmed] ?? config.clipAliases?.[normalized];
  if (alias) {
    if (!config.clips[alias]) {
      throw new Error(`Clip alias "${inputClipId}" points to unknown clip "${alias}".`);
    }
    return alias;
  }
  if (config.clips[normalized]) {
    return normalized;
  }
  throw new Error(`Unknown clip "${inputClipId}". Available clips: ${Object.keys(config.clips).join(", ")}`);
}

export function resolveClipList(config: AgentConfig, clips: string[]): string[] {
  const resolved: string[] = [];
  const seen = new Set<string>();
  for (const clip of clips) {
    const clipId = resolveClipId(config, clip);
    if (!seen.has(clipId)) {
      seen.add(clipId);
      resolved.push(clipId);
    }
  }
  return resolved;
}

export function normalizeClipKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function loadCharacterSpec(config: AgentConfig, characterId: string): Promise<CharacterSpec> {
  const specPath = path.join(characterRoot(config, characterId), "spec", "character_spec.json");
  if (!(await pathExists(specPath))) {
    throw new Error(`Missing character spec: ${toRepoRelative(specPath)}. Run ingest first.`);
  }
  return readJson<CharacterSpec>(specPath);
}

export function summarizeCharacterSpec(spec: CharacterSpec): string {
  const palette = Object.entries(spec.palette ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
  return [
    `Display name: ${spec.displayName}`,
    `Role: ${spec.role}`,
    `Body type: ${spec.bodyType}`,
    `Skin tone: ${spec.skinTone}`,
    `Hair: ${spec.hair}`,
    `Face: ${spec.face}`,
    `Outfit: ${spec.outfit}`,
    `Accessories: ${spec.accessories.join(", ") || "none"}`,
    `VFX: ${spec.vfx}`,
    `Forbidden: ${spec.forbidden.join(", ") || "none"}`,
    `Palette: ${palette || "not specified"}`,
    `Style notes: ${spec.styleNotes.join("; ")}`
  ].join("\n");
}

export async function writeReportBundle(
  config: AgentConfig,
  characterId: string,
  basename: string,
  jsonValue: unknown,
  markdown: string,
  latestBaseName?: string
): Promise<{ jsonPath: string; markdownPath: string }> {
  const reportsDir = path.join(characterRoot(config, characterId), "reports");
  const jsonPath = path.join(reportsDir, `${basename}.json`);
  const markdownPath = path.join(reportsDir, `${basename}.md`);
  await writeJson(jsonPath, jsonValue);
  await writeText(markdownPath, markdown);
  if (latestBaseName) {
    await writeJson(path.join(reportsDir, `${latestBaseName}.json`), jsonValue);
    await writeText(path.join(reportsDir, `${latestBaseName}.md`), markdown);
  }
  return { jsonPath, markdownPath };
}

export function validationMarkdown(report: ValidationReport): string {
  const issues = report.issues.length
    ? report.issues
        .map((issue) => {
          const frame = issue.frameIndex === undefined ? "" : ` frame=${issue.frameIndex}`;
          return `- ${issue.severity.toUpperCase()} ${issue.code}${frame}: ${issue.message}`;
        })
        .join("\n")
    : "- No technical issues detected.";

  const duplicates = report.duplicateFrames.length
    ? report.duplicateFrames
        .map((dup) => `- frame ${dup.frameA} and ${dup.frameB}: hash distance ${dup.hammingDistance}`)
        .join("\n")
    : "- None detected.";

  const frames = report.frameMeasurements
    .map((frame) => {
      const bbox = frame.bbox
        ? `${frame.bbox.x},${frame.bbox.y} ${frame.bbox.width}x${frame.bbox.height}`
        : "empty";
      return `| ${frame.frameIndex} | ${frame.empty ? "yes" : "no"} | ${frame.opaquePixels} | ${bbox} | ${frame.baselineDeltaPx ?? ""} | ${frame.centerDeltaPx ?? ""} |`;
    })
    .join("\n");

  return `# SpriteForge Validation Report

Character: \`${report.characterId}\`
Clip: \`${report.clipId}\`
Source: \`${report.sourceSheet}\`
Generated: ${report.generatedAt}

Overall status: **${report.overallStatus}**
Technical status: **${report.technicalStatus}**
Visual status: **${report.visualStatus}**
Approved for live roster: **${report.approvedForLiveRoster ? "yes" : "no"}**

## Issues

${issues}

## Duplicate Frame Check

${duplicates}

## Frame Measurements

| Frame | Empty | Opaque Pixels | BBox | Baseline Delta | Center Delta |
| --- | --- | ---: | --- | ---: | ---: |
${frames}
`;
}

export function listMarkdown(title: string, lines: string[]): string {
  return `# ${title}\n\n${lines.map((line) => `- ${line}`).join("\n")}\n`;
}

async function latestFileInDir(dir: string, predicate: (fileName: string) => boolean): Promise<string | null> {
  if (!(await pathExists(dir))) {
    return null;
  }
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
  return files.at(-1) ?? null;
}

export async function latestVersionDir(parentDir: string): Promise<string | null> {
  if (!(await pathExists(parentDir))) {
    return null;
  }
  const entries = await fs.readdir(parentDir, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parentDir, entry.name))
    .sort();
  return dirs.at(-1) ?? null;
}

export async function latestSheetInInbox(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  stage?: string
): Promise<string | null> {
  const manual = manualProviderConfig(config, stage);
  const clipDir = path.join(characterRoot(config, characterId), manual.generatedInbox, clipId);
  const versionDir = await latestVersionDir(clipDir);
  if (versionDir) {
    return latestFileInDir(versionDir, (name) => /\.(png|webp)$/i.test(name));
  }
  return latestFileInDir(clipDir, (name) => /\.(png|webp)$/i.test(name));
}

export function assertInside(parent: string, child: string): void {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`);
  }
}

function numberValue(...values: Array<unknown>): number {
  for (const value of values) {
    if (typeof value === "number") {
      return value;
    }
  }
  throw new Error("Missing numeric config value");
}

function stringValue(...values: Array<unknown>): string {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }
  throw new Error("Missing string config value");
}

function booleanValue(...values: Array<unknown>): boolean {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  throw new Error("Missing boolean config value");
}

function arrayValue<T>(...values: Array<unknown>): T[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return [];
}
