import path from "node:path";
import { writeClipPrompt } from "./buildPrompt.js";
import { runSpriteBuilderProvider } from "./providers/spritebuilderProvider.js";
import {
  type AgentConfig,
  activeProviderName,
  characterRoot,
  ensureDir,
  latestSheetInInbox,
  manualProviderConfig,
  pathExists,
  resolveClipId,
  toRepoRelative
} from "./report.js";

export interface ProviderRunResult {
  provider: string;
  promptPath: string;
  outputDirectory: string;
  sheetPath: string | null;
  generated: boolean;
  waitingForManualOutput: boolean;
  needsConfiguration: boolean;
  dryRun?: boolean;
  requestPath?: string;
  commandPreview?: string;
  expectedOutputPaths?: string[];
  message: string;
}

export async function runGenerationProvider(options: {
  config: AgentConfig;
  characterId: string;
  clipId: string;
  stage?: string;
  providerOverride?: string;
  dryRun?: boolean;
}): Promise<ProviderRunResult> {
  const clipId = resolveClipId(options.config, options.clipId);
  const provider = activeProviderName(options.config, options.providerOverride);
  const promptPath = await ensureClipPrompt(options.config, options.characterId, clipId, options.stage);

  if (provider === "manual") {
    const manual = manualProviderConfig(options.config, options.stage);
    const outputDirectory = path.join(characterRoot(options.config, options.characterId), manual.generatedInbox, clipId);
    await ensureDir(outputDirectory);
    const sheetPath = await latestSheetInInbox(options.config, options.characterId, clipId, options.stage);
    return {
      provider,
      promptPath,
      outputDirectory,
      sheetPath,
      generated: false,
      waitingForManualOutput: !sheetPath,
      needsConfiguration: false,
      message: sheetPath
        ? `Manual provider found existing sheet ${toRepoRelative(sheetPath)}.`
        : `Manual provider wrote prompt and is waiting for a sheet in ${toRepoRelative(outputDirectory)}.`
    };
  }

  if (provider === "spritebuilder") {
    return runSpriteBuilderProvider(options.config, options.characterId, clipId, promptPath, {
      dryRun: options.dryRun ?? false,
      stage: options.stage
    });
  }

  throw new Error(`Unknown generation provider "${provider}". Configure providers.${provider} before using it.`);
}

export async function ensureClipPrompt(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  stage?: string
): Promise<string> {
  const manual = manualProviderConfig(config, stage);
  const latestPromptPath = path.join(
    characterRoot(config, characterId),
    manual.promptOutbox,
    clipId,
    `latest_${clipId}_prompt.md`
  );
  if (await pathExists(latestPromptPath)) {
    return latestPromptPath;
  }
  const prompt = await writeClipPrompt(characterId, clipId, stage);
  return prompt.latestPromptPath;
}
