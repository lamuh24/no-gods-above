import fs from "node:fs/promises";
import path from "node:path";
import {
  type AgentConfig,
  type AnimationClip,
  characterRoot,
  characterStageClipIds,
  clipConfigForStage,
  ensureDir,
  loadCharacterSpec,
  loadConfig,
  manualProviderConfig,
  pathExists,
  summarizeCharacterSpec,
  timestampId,
  toolRoot,
  toRepoRelative,
  writeJson,
  writeText
} from "./report.js";

export interface StagePlan {
  characterId: string;
  stage: string;
  generatedAt: string;
  clips: AnimationClip[];
  manualLoop: string[];
  safety: {
    previewOnly: boolean;
    liveRosterWiring: "disabled";
  };
}

export interface PromptResult {
  prompt: string;
  promptPath: string;
  latestPromptPath: string;
  clip: AnimationClip;
}

export async function createStagePlan(characterId: string, stage: string): Promise<StagePlan> {
  const config = await loadConfig();
  await loadCharacterSpec(config, characterId);
  const clips = characterStageClipIds(config, characterId, stage).map((clipId) => clipConfigForStage(config, clipId, stage));
  const plan: StagePlan = {
    characterId,
    stage,
    generatedAt: new Date().toISOString(),
    clips,
    manualLoop: [
      "Generate prompts into prompts/outbox.",
      "Use a manual image provider.",
      "Drop generated PNG/WEBP sheets into generated/inbox/<clip>/.",
      "Run validate, normalize, export, and test.",
      "Keep results preview-only until explicitly approved."
    ],
    safety: {
      previewOnly: true,
      liveRosterWiring: "disabled"
    }
  };

  const root = characterRoot(config, characterId);
  const planBase = path.join(root, "plans", `${stage}_plan`);
  await writeJson(`${planBase}.json`, plan);
  await writeText(`${planBase}.md`, stagePlanMarkdown(plan));
  return plan;
}

export async function buildClipPrompt(characterId: string, clipId: string, stage?: string): Promise<string> {
  const config = await loadConfig();
  const spec = await loadCharacterSpec(config, characterId);
  const clip = clipConfigForStage(config, clipId, stage);
  const master = await fs.readFile(path.join(toolRoot(), "prompts", "style4_master_prompt.md"), "utf8");
  const clipTemplate = await fs.readFile(path.join(toolRoot(), "prompts", "clip_prompt_template.md"), "utf8");
  const characterSpecJson = JSON.stringify(spec, null, 2);
  const summary = summarizeCharacterSpec(spec);
  const styleLock = await loadOptionalStyleLock(config, characterId);
  const values: Record<string, string> = {
    characterId,
    displayName: spec.displayName,
    clipId,
    category: clip.category,
    frameCount: String(clip.frameCount),
    fps: String(clip.fps),
    loop: String(clip.loop),
    frameWidth: String(clip.frameWidth),
    frameHeight: String(clip.frameHeight),
    stripWidth: String(clip.frameWidth * clip.frameCount),
    facing: clip.facing,
    baselineY: String(clip.baselineY),
    characterSpecJson,
    characterSpecSummary: summary,
    styleLock,
    clipNotes: clip.notes.join("\n") || "No extra clip notes."
  };
  return `${replaceTokens(master, values)}\n\n---\n\n${replaceTokens(clipTemplate, values)}`;
}

async function loadOptionalStyleLock(config: AgentConfig, characterId: string): Promise<string> {
  const root = characterRoot(config, characterId);
  const candidates = [
    path.join(root, "references", `${characterId}_pixel_style_redo_lock.md`),
    path.join(root, "references", "pixel_style_redo_lock.md")
  ];
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return await fs.readFile(candidate, "utf8");
    }
  }
  return "No additional character-specific style redo lock file was found.";
}

export async function writeClipPrompt(characterId: string, clipId: string, stage?: string): Promise<PromptResult> {
  const config = await loadConfig();
  const clip = clipConfigForStage(config, clipId, stage);
  const prompt = await buildClipPrompt(characterId, clipId, stage);
  const manual = manualProviderConfig(config, stage);
  const outboxDir = path.join(characterRoot(config, characterId), manual.promptOutbox, clipId);
  const stamp = timestampId();
  const promptPath = path.join(outboxDir, `${stamp}_${clipId}_prompt.md`);
  const latestPromptPath = path.join(outboxDir, `latest_${clipId}_prompt.md`);
  await writeText(promptPath, prompt);
  await writeText(latestPromptPath, prompt);
  await ensureDir(path.join(characterRoot(config, characterId), manual.generatedInbox, clipId));
  return { prompt, promptPath, latestPromptPath, clip };
}

export async function writeRetryPrompt(
  config: AgentConfig,
  characterId: string,
  clip: AnimationClip,
  failureMessages: string[],
  stage?: string
): Promise<string> {
  const spec = await loadCharacterSpec(config, characterId);
  const template = await fs.readFile(path.join(toolRoot(), "prompts", "retry_prompt_template.md"), "utf8");
  const values: Record<string, string> = {
    characterId,
    clipId: clip.clipId,
    frameCount: String(clip.frameCount),
    failureBullets: failureMessages.map((message) => `- ${message}`).join("\n"),
    characterSpecSummary: summarizeCharacterSpec(spec)
  };
  const prompt = replaceTokens(template, values);
  const manual = manualProviderConfig(config, stage);
  const retryDir = path.join(characterRoot(config, characterId), manual.promptOutbox, "retry", clip.clipId);
  const retryPath = path.join(retryDir, `${timestampId()}_${clip.clipId}_retry.md`);
  await writeText(retryPath, prompt);
  await writeText(path.join(retryDir, `latest_${clip.clipId}_retry.md`), prompt);
  return retryPath;
}

export function stagePlanMarkdown(plan: StagePlan): string {
  const clips = plan.clips
    .map((clip) => `- ${clip.clipId}: ${clip.frameCount} frames, ${clip.fps} fps, ${clip.category}`)
    .join("\n");
  return `# SpriteForge Stage Plan - ${plan.characterId} / ${plan.stage}

Generated: ${plan.generatedAt}
Preview-only: yes
Live roster wiring: disabled

## Clips

${clips}

## Manual Loop

${plan.manualLoop.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`;
}

function replaceTokens(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? "");
}

export function formatPromptResult(result: PromptResult): string {
  return [
    `Prompt written: ${toRepoRelative(result.promptPath)}`,
    `Latest prompt: ${toRepoRelative(result.latestPromptPath)}`,
    `Expected strip width: ${result.clip.frameWidth * result.clip.frameCount}`,
    `Frame size: ${result.clip.frameWidth}x${result.clip.frameHeight}`
  ].join("\n");
}
