import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { ProviderRunResult } from "../providers.js";
import {
  type AgentConfig,
  type AnimationClip,
  type CharacterSpec,
  type SpriteBuilderProviderConfig,
  assertInside,
  characterRoot,
  clipConfigForStage,
  ensureDir,
  loadCharacterSpec,
  pathExists,
  repoRoot,
  timestampId,
  toRepoRelative,
  writeJson,
  writeText
} from "../report.js";

interface SpriteBuilderContext {
  character: string;
  clip: string;
  promptPath: string;
  outputDirectory: string;
  requestPath: string;
  frameCount: string;
  stripWidth: string;
  stripHeight: string;
  frameWidth: string;
  frameHeight: string;
  baselineY: string;
  facing: string;
  referencePaths: string;
  briefPaths: string;
  timestamp: string;
}

interface CommandSpec {
  executable: string;
  args: string[];
  usesShell: boolean;
}

interface SpawnSpec {
  executable: string;
  args: string[];
  usesShell: boolean;
}

interface SpriteBuilderRequest {
  schemaVersion: string;
  tool: string;
  provider: "spritebuilder";
  generatedAt: string;
  characterId: string;
  clipId: string;
  promptPath: string;
  outputDirectory: string;
  expected: {
    frameCount: number;
    stripWidth: number;
    stripHeight: number;
    frameWidth: number;
    frameHeight: number;
    baselineY: number;
    facing: "right" | "left";
    fps: number;
    loop: boolean;
    category: string;
  };
  references: Array<{ path: string; ingestedAt?: string; exists: boolean }>;
  briefs: Array<{ path: string; ingestedAt?: string; exists: boolean }>;
  safety: {
    outputScope: "provider-review-only";
    liveRosterWiring: "disabled";
    approvedForLiveRoster: false;
    doNotModifyGameplay: true;
    doNotOverwriteApprovedAssets: true;
  };
  notes: string[];
}

export async function runSpriteBuilderProvider(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  promptPath: string,
  options: { dryRun?: boolean; stage?: string } = {}
): Promise<ProviderRunResult> {
  const provider = config.providers?.spritebuilder as SpriteBuilderProviderConfig | undefined;
  if (!provider || provider.mode !== "local") {
    throw new Error("providers.spritebuilder is not configured.");
  }

  const root = characterRoot(config, characterId);
  const spec = await loadCharacterSpec(config, characterId);
  const clip = clipConfigForStage(config, clipId, options.stage);
  const stamp = timestampId();
  const outputDirectory = resolveTemplatePath(provider.outputDirectory, baseContext(characterId, clip, stamp));
  assertInside(root, outputDirectory);
  assertReviewOutputPath(root, outputDirectory);
  await ensureDir(outputDirectory);

  const requestPath = resolveRequestPath(provider.requestPath, outputDirectory, characterId, clipId, stamp);
  assertInside(root, requestPath);

  const references = await resolveCharacterAssetPaths(spec.references);
  const briefs = await resolveCharacterAssetPaths(spec.briefs);
  const context = buildContext({
    characterId,
    clip,
    promptPath,
    outputDirectory,
    requestPath,
    referencePaths: references.map((reference) => reference.path),
    briefPaths: briefs.map((brief) => brief.path),
    timestamp: stamp
  });
  const command = buildCommandSpec(provider, context);
  const validationMessages = await validateProviderRequest({
    config,
    provider,
    clip,
    promptPath,
    outputDirectory,
    requestPath
  });
  const request = await writeSpriteBuilderRequest({
    config,
    spec,
    clip,
    characterId,
    promptPath,
    outputDirectory,
    requestPath,
    references,
    briefs
  });
  const commandPreview = command ? formatCommandPreview(command) : "UNCONFIGURED";
  const expectedOutputPaths = [
    `${toRepoRelative(outputDirectory).replace(/\/$/, "")}/*.png`,
    `${toRepoRelative(outputDirectory).replace(/\/$/, "")}/*.webp`
  ];

  if (options.dryRun) {
    await writeDryRunReport({
      config,
      characterId,
      clipId,
      request,
      requestPath,
      commandPreview,
      expectedOutputPaths,
      validationMessages,
      configured: Boolean(command)
    });
    return {
      provider: "spritebuilder",
      promptPath,
      outputDirectory,
      sheetPath: null,
      generated: false,
      waitingForManualOutput: false,
      needsConfiguration: !command,
      dryRun: true,
      requestPath: toRepoRelative(requestPath),
      commandPreview,
      expectedOutputPaths,
      message: command
        ? `SpriteBuilder dry run complete. Request payload: ${toRepoRelative(requestPath)}. Command not executed.`
        : `SpriteBuilder dry run complete; provider command is not configured. Request payload: ${toRepoRelative(requestPath)}.`
    };
  }

  if (!command) {
    return {
      provider: "spritebuilder",
      promptPath,
      outputDirectory,
      sheetPath: await latestImageInDirectory(outputDirectory),
      generated: false,
      waitingForManualOutput: false,
      needsConfiguration: true,
      requestPath: toRepoRelative(requestPath),
      commandPreview,
      expectedOutputPaths,
      message:
        "SpriteBuilder provider is present but no executable/args or command has been configured. " +
        `Request payload written to ${toRepoRelative(requestPath)}.`
    };
  }

  await runCommand(command, provider, context);

  const sheetPath = await latestImageInDirectory(outputDirectory);
  return {
    provider: "spritebuilder",
    promptPath,
    outputDirectory,
    sheetPath,
    generated: true,
    waitingForManualOutput: !sheetPath,
    needsConfiguration: false,
    requestPath: toRepoRelative(requestPath),
    commandPreview,
    expectedOutputPaths,
    message: sheetPath
      ? `SpriteBuilder generated review output ${toRepoRelative(sheetPath)}.`
      : `SpriteBuilder command completed but no PNG/WEBP was found in ${toRepoRelative(outputDirectory)}.`
  };
}

async function writeSpriteBuilderRequest(options: {
  config: AgentConfig;
  spec: CharacterSpec;
  clip: AnimationClip;
  characterId: string;
  promptPath: string;
  outputDirectory: string;
  requestPath: string;
  references: SpriteBuilderRequest["references"];
  briefs: SpriteBuilderRequest["briefs"];
}): Promise<SpriteBuilderRequest> {
  const request: SpriteBuilderRequest = {
    schemaVersion: options.config.schemaVersion,
    tool: options.config.toolName,
    provider: "spritebuilder",
    generatedAt: new Date().toISOString(),
    characterId: options.characterId,
    clipId: options.clip.clipId,
    promptPath: toRepoRelative(options.promptPath),
    outputDirectory: toRepoRelative(options.outputDirectory),
    expected: {
      frameCount: options.clip.frameCount,
      stripWidth: options.clip.frameWidth * options.clip.frameCount,
      stripHeight: options.clip.frameHeight,
      frameWidth: options.clip.frameWidth,
      frameHeight: options.clip.frameHeight,
      baselineY: options.clip.baselineY,
      facing: options.clip.facing,
      fps: options.clip.fps,
      loop: options.clip.loop,
      category: options.clip.category
    },
    references: options.references,
    briefs: options.briefs,
    safety: {
      outputScope: "provider-review-only",
      liveRosterWiring: "disabled",
      approvedForLiveRoster: false,
      doNotModifyGameplay: true,
      doNotOverwriteApprovedAssets: true
    },
    notes: [
      "SpriteBuilder may generate or assemble the spritesheet, but SpriteForge remains the validator and approval gatekeeper.",
      "Write exactly one PNG or WEBP spritesheet into outputDirectory for this clip.",
      "The outputDirectory is a provider-review folder, not a live runtime asset folder.",
      "Use transparent alpha, no labels, no borders, no backgrounds, and preserve the locked character identity."
    ]
  };
  await writeJson(options.requestPath, request);
  return request;
}

function baseContext(characterId: string, clip: AnimationClip, stamp: string): SpriteBuilderContext {
  return {
    character: characterId,
    clip: clip.clipId,
    promptPath: "",
    outputDirectory: "",
    requestPath: "",
    frameCount: String(clip.frameCount),
    stripWidth: String(clip.frameWidth * clip.frameCount),
    stripHeight: String(clip.frameHeight),
    frameWidth: String(clip.frameWidth),
    frameHeight: String(clip.frameHeight),
    baselineY: String(clip.baselineY),
    facing: clip.facing,
    referencePaths: "",
    briefPaths: "",
    timestamp: stamp
  };
}

function buildContext(options: {
  characterId: string;
  clip: AnimationClip;
  promptPath: string;
  outputDirectory: string;
  requestPath: string;
  referencePaths: string[];
  briefPaths: string[];
  timestamp: string;
}): SpriteBuilderContext {
  return {
    character: options.characterId,
    clip: options.clip.clipId,
    promptPath: toRepoRelative(options.promptPath),
    outputDirectory: toRepoRelative(options.outputDirectory),
    requestPath: toRepoRelative(options.requestPath),
    frameCount: String(options.clip.frameCount),
    stripWidth: String(options.clip.frameWidth * options.clip.frameCount),
    stripHeight: String(options.clip.frameHeight),
    frameWidth: String(options.clip.frameWidth),
    frameHeight: String(options.clip.frameHeight),
    baselineY: String(options.clip.baselineY),
    facing: options.clip.facing,
    referencePaths: options.referencePaths.join(";"),
    briefPaths: options.briefPaths.join(";"),
    timestamp: options.timestamp
  };
}

function buildCommandSpec(provider: SpriteBuilderProviderConfig, context: SpriteBuilderContext): CommandSpec | null {
  if (provider.executable?.trim()) {
    const executable = replaceProviderTokens(provider.executable, context, false);
    const args = (provider.args?.length ? provider.args : ["--request", "<requestPath>"]).map((arg) =>
      replaceProviderTokens(arg, context, false)
    );
    return {
      executable,
      args,
      usesShell: provider.shell ?? shouldUseWindowsShell(executable)
    };
  }

  const command = provider.command?.trim();
  if (!command || command.includes("<configure command here>")) {
    return null;
  }
  const parsed = splitCommandLine(replaceProviderTokens(command, context, true));
  const executable = parsed.shift();
  if (!executable) {
    return null;
  }
  return {
    executable,
    args: parsed,
    usesShell: provider.shell ?? shouldUseWindowsShell(executable)
  };
}

async function validateProviderRequest(options: {
  config: AgentConfig;
  provider: SpriteBuilderProviderConfig;
  clip: AnimationClip;
  promptPath: string;
  outputDirectory: string;
  requestPath: string;
}): Promise<string[]> {
  const messages: string[] = [];
  if (!options.provider || options.provider.mode !== "local") {
    throw new Error("providers.spritebuilder must exist and use mode \"local\".");
  }
  if (!(await pathExists(options.promptPath))) {
    throw new Error(`SpriteBuilder prompt path does not exist: ${toRepoRelative(options.promptPath)}`);
  }
  if (!(await pathExists(options.outputDirectory))) {
    throw new Error(`SpriteBuilder output directory could not be created: ${toRepoRelative(options.outputDirectory)}`);
  }
  if (!options.clip.frameCount || options.clip.frameCount <= 0) {
    throw new Error(`SpriteBuilder clip ${options.clip.clipId} is missing a valid frame count.`);
  }
  if (!options.clip.frameWidth || !options.clip.frameHeight) {
    throw new Error(`SpriteBuilder clip ${options.clip.clipId} is missing frame size.`);
  }
  if (!options.clip.baselineY && options.clip.baselineY !== 0) {
    throw new Error(`SpriteBuilder clip ${options.clip.clipId} is missing baselineY.`);
  }
  messages.push(`Prompt exists: ${toRepoRelative(options.promptPath)}`);
  messages.push(`Output directory ready: ${toRepoRelative(options.outputDirectory)}`);
  messages.push(`Expected frames: ${options.clip.frameCount}`);
  messages.push(`Expected strip: ${options.clip.frameWidth * options.clip.frameCount}x${options.clip.frameHeight}`);
  messages.push(`Frame size: ${options.clip.frameWidth}x${options.clip.frameHeight}`);
  messages.push(`BaselineY: ${options.clip.baselineY}`);
  return messages;
}

async function runCommand(
  command: CommandSpec,
  provider: SpriteBuilderProviderConfig,
  context: SpriteBuilderContext
): Promise<void> {
  const env = {
    ...process.env,
    ...replaceEnvValues(provider.env ?? {}, context),
    SPRITEFORGE_CHARACTER: context.character,
    SPRITEFORGE_CLIP: context.clip,
    SPRITEFORGE_PROMPT_PATH: context.promptPath,
    SPRITEFORGE_OUTPUT_DIR: context.outputDirectory,
    SPRITEFORGE_REQUEST_PATH: context.requestPath,
    SPRITEFORGE_EXPECTED_FRAME_COUNT: context.frameCount,
    SPRITEFORGE_EXPECTED_STRIP_WIDTH: context.stripWidth,
    SPRITEFORGE_EXPECTED_STRIP_HEIGHT: context.stripHeight,
    SPRITEFORGE_FRAME_WIDTH: context.frameWidth,
    SPRITEFORGE_FRAME_HEIGHT: context.frameHeight,
    SPRITEFORGE_BASELINE_Y: context.baselineY,
    SPRITEFORGE_FACING: context.facing,
    SPRITEFORGE_REFERENCE_PATHS: context.referencePaths,
    SPRITEFORGE_BRIEF_PATHS: context.briefPaths
  };

  await new Promise<void>((resolve, reject) => {
    const spawnSpec = toSpawnSpec(command);
    const child = spawn(spawnSpec.executable, spawnSpec.args, {
      cwd: repoRoot(),
      env,
      shell: spawnSpec.usesShell,
      windowsHide: true,
      stdio: "inherit"
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`SpriteBuilder command timed out after ${provider.timeoutMs ?? 600000}ms.`));
    }, provider.timeoutMs ?? 600000);

    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`SpriteBuilder command failed with code ${code ?? "null"} signal ${signal ?? "none"}.`));
      }
    });
  });
}

function toSpawnSpec(command: CommandSpec): SpawnSpec {
  if (command.usesShell && process.platform === "win32") {
    return {
      executable: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", windowsCommandLine(command)],
      usesShell: false
    };
  }

  return command;
}

function windowsCommandLine(command: CommandSpec): string {
  return [command.executable, ...command.args].map(quoteWindowsCommandArg).join(" ");
}

function quoteWindowsCommandArg(value: string): string {
  if (value.length > 0 && !/[\s"&()<>^|%]/.test(value)) {
    return value;
  }

  const escaped = value
    .replace(/(\\*)"/g, '$1$1\\"')
    .replace(/(\\+)$/g, "$1$1")
    .replace(/%/g, "%%");
  return `"${escaped}"`;
}

async function resolveCharacterAssetPaths(
  entries: Array<{ path: string; ingestedAt?: string }> | undefined
): Promise<Array<{ path: string; ingestedAt?: string; exists: boolean }>> {
  const resolved: Array<{ path: string; ingestedAt?: string; exists: boolean }> = [];
  for (const entry of entries ?? []) {
    const absPath = path.resolve(repoRoot(), entry.path);
    resolved.push({
      path: toRepoRelative(absPath),
      ingestedAt: entry.ingestedAt,
      exists: await pathExists(absPath)
    });
  }
  return resolved;
}

async function latestImageInDirectory(dir: string): Promise<string | null> {
  if (!(await pathExists(dir))) {
    return null;
  }
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(png|webp)$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
  return files.at(-1) ?? null;
}

async function writeDryRunReport(options: {
  config: AgentConfig;
  characterId: string;
  clipId: string;
  request: SpriteBuilderRequest;
  requestPath: string;
  commandPreview: string;
  expectedOutputPaths: string[];
  validationMessages: string[];
  configured: boolean;
}): Promise<void> {
  const reportsDir = path.join(characterRoot(options.config, options.characterId), "reports", "spritebuilder_dry_run");
  await ensureDir(reportsDir);
  const report = {
    schemaVersion: options.config.schemaVersion,
    tool: options.config.toolName,
    generatedAt: new Date().toISOString(),
    characterId: options.characterId,
    clipId: options.clipId,
    dryRun: true,
    configured: options.configured,
    requestPath: toRepoRelative(options.requestPath),
    commandPreview: options.commandPreview,
    expectedOutputPaths: options.expectedOutputPaths,
    validationMessages: options.validationMessages,
    safety: {
      commandExecuted: false,
      manifestModified: false,
      liveRosterModified: false,
      generatedSpritesWritten: false
    },
    request: options.request
  };
  const base = `${timestampId()}_${options.clipId}_spritebuilder_dry_run`;
  await writeJson(path.join(reportsDir, `${base}.json`), report);
  await writeJson(path.join(reportsDir, "latest_spritebuilder_dry_run.json"), report);
  await writeText(path.join(reportsDir, `${base}.md`), dryRunMarkdown(report));
  await writeText(path.join(reportsDir, "latest_spritebuilder_dry_run.md"), dryRunMarkdown(report));
}

function dryRunMarkdown(report: {
  characterId: string;
  clipId: string;
  configured: boolean;
  requestPath: string;
  commandPreview: string;
  expectedOutputPaths: string[];
  validationMessages: string[];
}): string {
  return `# SpriteBuilder Dry Run

Character: \`${report.characterId}\`
Clip: \`${report.clipId}\`
Provider configured: **${report.configured ? "yes" : "no"}**
Request payload: \`${report.requestPath}\`
Command preview: \`${report.commandPreview}\`

## Expected Output Paths

${report.expectedOutputPaths.map((entry) => `- \`${entry}\``).join("\n")}

## Validation

${report.validationMessages.map((entry) => `- ${entry}`).join("\n")}

## Safety

- Command executed: no
- Manifest modified: no
- Live roster modified: no
- Generated sprites written: no
`;
}

function resolveTemplatePath(templatePath: string, context: SpriteBuilderContext): string {
  const replaced = replaceProviderTokens(templatePath, context, false);
  return path.isAbsolute(replaced) ? path.normalize(replaced) : path.resolve(repoRoot(), replaced);
}

function resolveRequestPath(
  requestPathTemplate: string | undefined,
  outputDirectory: string,
  characterId: string,
  clipId: string,
  stamp: string
): string {
  const context = {
    character: characterId,
    clip: clipId,
    promptPath: "",
    outputDirectory: toRepoRelative(outputDirectory),
    requestPath: "",
    frameCount: "",
    stripWidth: "",
    stripHeight: "",
    frameWidth: "",
    frameHeight: "",
    baselineY: "",
    facing: "",
    referencePaths: "",
    briefPaths: "",
    timestamp: stamp
  };
  const requestPath = requestPathTemplate
    ? replaceProviderTokens(requestPathTemplate, context, false)
    : path.join(toRepoRelative(outputDirectory), "spritebuilder_request.json");
  return path.isAbsolute(requestPath) ? path.normalize(requestPath) : path.resolve(repoRoot(), requestPath);
}

function replaceEnvValues(env: Record<string, string>, context: SpriteBuilderContext): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key, replaceProviderTokens(value, context, false)])
  );
}

function replaceProviderTokens(value: string, context: SpriteBuilderContext, quotePaths: boolean): string {
  return value
    .replace(/\{\{character\}\}|<character>/g, context.character)
    .replace(/\{\{clip\}\}|<clip>/g, context.clip)
    .replace(/\{\{promptPath\}\}|<promptPath>/g, maybeQuote(context.promptPath, quotePaths))
    .replace(/\{\{outputDirectory\}\}|<outputDirectory>/g, maybeQuote(context.outputDirectory, quotePaths))
    .replace(/\{\{requestPath\}\}|<requestPath>/g, maybeQuote(context.requestPath, quotePaths))
    .replace(/\{\{frameCount\}\}|<frameCount>/g, context.frameCount)
    .replace(/\{\{stripWidth\}\}|<stripWidth>/g, context.stripWidth)
    .replace(/\{\{stripHeight\}\}|<stripHeight>/g, context.stripHeight)
    .replace(/\{\{frameWidth\}\}|<frameWidth>/g, context.frameWidth)
    .replace(/\{\{frameHeight\}\}|<frameHeight>/g, context.frameHeight)
    .replace(/\{\{baselineY\}\}|<baselineY>/g, context.baselineY)
    .replace(/\{\{facing\}\}|<facing>/g, context.facing)
    .replace(/\{\{referencePaths\}\}|<referencePaths>/g, maybeQuote(context.referencePaths, quotePaths))
    .replace(/\{\{briefPaths\}\}|<briefPaths>/g, maybeQuote(context.briefPaths, quotePaths))
    .replace(/\{\{timestamp\}\}|<timestamp>/g, context.timestamp);
}

function assertReviewOutputPath(root: string, outputDirectory: string): void {
  const relative = path.relative(root, outputDirectory).replace(/\\/g, "/");
  if (!relative.startsWith("generated/provider_review/") && !relative.startsWith("generated/quarantine/")) {
    throw new Error(
      `SpriteBuilder output must stay in generated/provider_review or generated/quarantine, got ${relative}.`
    );
  }
}

function formatCommandPreview(command: CommandSpec): string {
  return [command.executable, ...command.args.map((arg) => maybeQuote(arg, true))].join(" ");
}

function splitCommandLine(command: string): string[] {
  const args: string[] = [];
  let current = "";
  let quote: string | null = null;
  let escaping = false;
  for (const char of command) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }
    if (!quote && /\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) {
    args.push(current);
  }
  return args;
}

function maybeQuote(value: string, quotePaths: boolean): string {
  if (!quotePaths || !value || !/\s/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '\\"')}"`;
}

function shouldUseWindowsShell(executable: string): boolean {
  return process.platform === "win32" && /\.(cmd|bat)$/i.test(executable);
}
