import { createStagePlan, writeClipPrompt, type PromptResult } from "./buildPrompt.js";
import { characterStageClipIds, loadConfig } from "./report.js";

export async function generateManualPrompt(characterId: string, clipId: string, stage?: string): Promise<PromptResult> {
  return writeClipPrompt(characterId, clipId, stage);
}

export async function generateManualStagePrompts(characterId: string, stage: string): Promise<PromptResult[]> {
  const config = await loadConfig();
  await createStagePlan(characterId, stage);
  const clipIds = characterStageClipIds(config, characterId, stage);
  const results: PromptResult[] = [];
  for (const clipId of clipIds) {
    results.push(await writeClipPrompt(characterId, clipId, stage));
  }
  return results;
}
