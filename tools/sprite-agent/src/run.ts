import { createStagePlan, formatPromptResult } from "./buildPrompt.js";
import { exportPreviewManifest } from "./exportManifest.js";
import { runGameSmokeTest } from "./gameSmokeTest.js";
import { generateManualPrompt } from "./generateSheet.js";
import { ingestReference } from "./ingestReference.js";
import { normalizeClip } from "./normalizeFrames.js";
import { resumeSpritePack, runSpritePack, verifySpritePack, type PackReport } from "./packRunner.js";
import { promotePreview, readQueueStatus, rejectPreviewApproval, runSpriteQueue } from "./queueRunner.js";
import { validateSpriteSheet } from "./validateTechnical.js";
import {
  characterStageClipIds,
  latestSheetInInbox,
  loadConfig,
  toRepoRelative
} from "./report.js";

type Args = Record<string, string | boolean>;

async function main(): Promise<void> {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || args.help) {
    printHelp();
    return;
  }

  switch (command) {
    case "ingest":
      await commandIngest(args);
      return;
    case "plan":
      await commandPlan(args);
      return;
    case "prompt":
      await commandPrompt(args);
      return;
    case "validate":
      await commandValidate(args);
      return;
    case "normalize":
      await commandNormalize(args);
      return;
    case "export":
      await commandExport(args);
      return;
    case "test":
      await commandTest(args);
      return;
    case "run":
      await commandRun(args);
      return;
    case "run-queue":
      await commandRunQueue(args);
      return;
    case "run-pack":
      await commandRunPack(args);
      return;
    case "verify-pack":
      await commandVerifyPack(args);
      return;
    case "resume-pack":
      await commandResumePack(args);
      return;
    case "status":
      await commandStatus(args);
      return;
    case "resume":
      await commandResume(args);
      return;
    case "promote-preview":
      await commandPromotePreview(args);
      return;
    case "reject-preview":
      await commandRejectPreview(args);
      return;
    default:
      throw new Error(`Unknown command "${command}". Run "npm run sprite-agent -- help".`);
  }
}

async function commandIngest(args: Args): Promise<void> {
  const result = await ingestReference({
    character: requiredString(args, "character"),
    reference: requiredString(args, "reference"),
    brief: optionalString(args, "brief")
  });
  console.log(`Character spec: ${toRepoRelative(result.specPath)}`);
  console.log(`Spec markdown: ${toRepoRelative(result.specMarkdownPath)}`);
  if (result.copiedReference) console.log(`Reference copied: ${toRepoRelative(result.copiedReference)}`);
  if (result.copiedBrief) console.log(`Brief copied: ${toRepoRelative(result.copiedBrief)}`);
}

async function commandPlan(args: Args): Promise<void> {
  const plan = await createStagePlan(requiredString(args, "character"), optionalString(args, "stage") ?? "style-test");
  console.log(`Planned ${plan.clips.length} clips for ${plan.characterId}/${plan.stage}.`);
}

async function commandPrompt(args: Args): Promise<void> {
  const result = await generateManualPrompt(
    requiredString(args, "character"),
    requiredString(args, "clip"),
    optionalString(args, "stage")
  );
  console.log(formatPromptResult(result));
}

async function commandValidate(args: Args): Promise<void> {
  const report = await validateSpriteSheet({
    character: requiredString(args, "character"),
    clip: requiredString(args, "clip"),
    sheet: requiredString(args, "sheet"),
    stage: optionalString(args, "stage")
  });
  console.log(`Validation status: ${report.overallStatus}`);
  console.log(`Technical status: ${report.technicalStatus}`);
  console.log(`Visual status: ${report.visualStatus}`);
  if (report.retryPrompt) console.log(`Retry prompt: ${report.retryPrompt}`);
}

async function commandNormalize(args: Args): Promise<void> {
  const report = await normalizeClip({
    character: requiredString(args, "character"),
    clip: requiredString(args, "clip"),
    sheet: optionalString(args, "sheet"),
    stage: optionalString(args, "stage")
  });
  console.log(`Normalized strip: ${report.normalizedSheet}`);
  console.log(`Frames: ${report.frameCount}`);
}

async function commandExport(args: Args): Promise<void> {
  const manifest = await exportPreviewManifest({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage")
  });
  console.log(`Exported ${manifest.clips.length} preview clip(s).`);
  console.log(`Missing clips: ${manifest.missingClips.length}`);
}

async function commandTest(args: Args): Promise<void> {
  const report = await runGameSmokeTest({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage")
  });
  console.log(`Game syntax: ${report.gameSyntaxCheck.passed ? "pass" : "fail"}`);
  console.log(`Manifest loads: ${report.manifestLoads ? "pass" : "fail"}`);
  console.log(`Clip frames advance: ${report.clipFramesAdvance ? "pass" : "fail"}`);
  console.log(`Baseline stable: ${report.baselineStable ? "pass" : "fail"}`);
  console.log(`Harness: ${report.harnessPath}`);
}

async function commandRun(args: Args): Promise<void> {
  const config = await loadConfig();
  const character = requiredString(args, "character");
  const stage = optionalString(args, "stage") ?? "mvp";
  await createStagePlan(character, stage);
  const clipIds = characterStageClipIds(config, character, stage);
  let prompted = 0;
  let validated = 0;
  let normalized = 0;

  for (const clipId of clipIds) {
    const sheet = await latestSheetInInbox(config, character, clipId, stage);
    if (!sheet) {
      await generateManualPrompt(character, clipId, stage);
      prompted += 1;
      continue;
    }
    const validation = await validateSpriteSheet({ character, clip: clipId, sheet, stage });
    validated += 1;
    if (validation.overallStatus !== "rejected") {
      try {
        await normalizeClip({ character, clip: clipId, sheet, stage });
        normalized += 1;
      } catch (error) {
        console.warn(`Normalize skipped for ${clipId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const manifest = await exportPreviewManifest({ character, stage });
  const smoke = await runGameSmokeTest({ character, stage });
  console.log(`Run complete for ${character}/${stage}.`);
  console.log(`Prompts written for missing clips: ${prompted}`);
  console.log(`Validated sheets: ${validated}`);
  console.log(`Normalized clips: ${normalized}`);
  console.log(`Preview manifest clips: ${manifest.clips.length}`);
  console.log(`Smoke issues: ${smoke.issues.length}`);
}

async function commandRunQueue(args: Args): Promise<void> {
  const report = await runSpriteQueue({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage"),
    clips: optionalClipList(args, "clips"),
    approvalPolicy: optionalString(args, "approval-policy") ?? "conservative",
    provider: optionalString(args, "provider"),
    dryRun: optionalBoolean(args, "dry-run"),
    skipApproved: optionalBoolean(args, "redo-approved") ? false : undefined
  });
  console.log(`Queue status: ${report.humanReviewNeeded ? "human review needed" : "ok"}`);
  console.log(`Attempted: ${report.clipsAttempted.join(", ") || "none"}`);
  console.log(`Approved for preview: ${report.clipsApprovedForPreview.join(", ") || "none"}`);
  console.log(`Failed: ${report.clipsFailed.join(", ") || "none"}`);
  console.log(`Waiting: ${report.clipsWaitingForGeneration.join(", ") || "none"}`);
  console.log(`Missing output: ${report.clipsMissingOutput.join(", ") || "none"}`);
  console.log(`Next action: ${report.nextAction}`);
  if (optionalBoolean(args, "dry-run")) {
    console.log("Dry-run notes:");
    for (const note of report.notes) {
      console.log(`- ${note}`);
    }
  }
}

async function commandRunPack(args: Args): Promise<void> {
  const report = await runSpritePack({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage") ?? "mvp",
    approvalPolicy: optionalString(args, "approval-policy") ?? "previewAuto",
    provider: optionalString(args, "provider"),
    skipApproved: optionalBoolean(args, "skip-approved") ? true : undefined,
    redoApproved: optionalBoolean(args, "redo-approved"),
    autoVerify: optionalBoolean(args, "auto-verify"),
    dryRun: optionalBoolean(args, "dry-run")
  });
  printPackSummary("Pack run", report);
}

async function commandVerifyPack(args: Args): Promise<void> {
  const report = await verifySpritePack({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage") ?? "mvp",
    approvalPolicy: optionalString(args, "approval-policy") ?? "previewAuto",
    provider: optionalString(args, "provider"),
    redoApproved: optionalBoolean(args, "redo-approved"),
    autoVerify: true
  });
  printPackSummary("Pack verify", report);
}

async function commandResumePack(args: Args): Promise<void> {
  const report = await resumeSpritePack({
    character: requiredString(args, "character"),
    stage: optionalString(args, "stage") ?? "mvp",
    approvalPolicy: optionalString(args, "approval-policy") ?? "previewAuto",
    provider: optionalString(args, "provider"),
    skipApproved: optionalBoolean(args, "skip-approved") ? true : undefined,
    redoApproved: optionalBoolean(args, "redo-approved"),
    autoVerify: true
  });
  printPackSummary("Pack resume", report);
}

async function commandStatus(args: Args): Promise<void> {
  const config = await loadConfig();
  const character = requiredString(args, "character");
  const status = await readQueueStatus(config, character);
  if (!status) {
    console.log(`No queue status found for ${character}.`);
    return;
  }
  console.log(`Queue: ${status.character}/${status.stage}`);
  console.log(`Overall status: ${status.overallStatus}`);
  console.log(`Approval policy: ${status.approvalPolicy}`);
  console.log(`Provider: ${status.provider}`);
  console.log(`Current clip: ${status.currentClip ?? "none"}`);
  console.log(`Completed: ${status.completedClips.join(", ") || "none"}`);
  console.log(`Approved preview: ${status.approvedPreviewClips.join(", ") || "none"}`);
  console.log(`Failed: ${status.failedClips.join(", ") || "none"}`);
  console.log(`Waiting: ${(status.waitingClips ?? []).join(", ") || "none"}`);
  console.log(`Missing output: ${(status.missingClips ?? []).join(", ") || "none"}`);
  console.log(`Quarantined: ${status.quarantinedOutputs.join(", ") || "none"}`);
  console.log(`Remaining: ${status.remainingClips.join(", ") || "none"}`);
  console.log(`Next action: ${status.nextAction}`);
}

function printPackSummary(label: string, report: PackReport): void {
  console.log(`${label} status: ${report.finalStatus}`);
  console.log(`Required clips: ${report.requiredClips.length}`);
  console.log(`Skipped approved: ${report.skippedApprovedClips.join(", ") || "none"}`);
  console.log(`Queued clips: ${report.queuedClips.join(", ") || "none"}`);
  console.log(`Failed/needs retry: ${report.failedClips.join(", ") || "none"}`);
  console.log(`Preview pack: ${report.previewPackPath ?? "not created"}`);
  console.log(`Next action: ${report.humanReviewReasons[0] ?? report.queueReport?.nextAction ?? "No action required."}`);
}

async function commandResume(args: Args): Promise<void> {
  const character = requiredString(args, "character");
  const report = await runSpriteQueue({
    character,
    approvalPolicy: optionalString(args, "approval-policy"),
    provider: optionalString(args, "provider"),
    resume: true
  });
  console.log(`Resume status: ${report.humanReviewNeeded ? "human review needed" : "ok"}`);
  console.log(`Attempted: ${report.clipsAttempted.join(", ") || "none"}`);
  console.log(`Approved for preview: ${report.clipsApprovedForPreview.join(", ") || "none"}`);
  console.log(`Failed: ${report.clipsFailed.join(", ") || "none"}`);
  console.log(`Waiting: ${report.clipsWaitingForGeneration.join(", ") || "none"}`);
  console.log(`Missing output: ${report.clipsMissingOutput.join(", ") || "none"}`);
  console.log(`Next action: ${report.nextAction}`);
}

async function commandPromotePreview(args: Args): Promise<void> {
  const clip = optionalString(args, "clip");
  const stage = optionalString(args, "stage");
  if (!clip && !stage) {
    throw new Error("promote-preview requires --clip or --stage.");
  }
  const result = await promotePreview({
    character: requiredString(args, "character"),
    clip,
    stage
  });
  console.log(`Approved preview clips: ${result.approvedClips.join(", ") || "none"}`);
  console.log(`Missing clips: ${result.missingClips.join(", ") || "none"}`);
  console.log(`Preview manifest: ${result.manifestPath}`);
  console.log(`Smoke report: ${result.smokeReportPath}`);
}

async function commandRejectPreview(args: Args): Promise<void> {
  const result = await rejectPreviewApproval({
    character: requiredString(args, "character"),
    clips: optionalClipList(args, "clips") ?? [requiredString(args, "clip")],
    stage: optionalString(args, "stage") ?? "mvp",
    reason: optionalString(args, "reason") ?? "Rejected by human visual review."
  });
  console.log(`Rejected preview clips: ${result.rejectedClips.join(", ") || "none"}`);
  console.log(`Quarantined outputs: ${result.quarantinedPaths.join(", ") || "none"}`);
  console.log(`Preview manifest: ${result.manifestPath}`);
  console.log(`Next action: ${result.nextAction}`);
}

function parseArgs(argv: string[]): { command: string | undefined; args: Args } {
  const [command, ...rest] = argv;
  const args: Args = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token?.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return { command, args };
}

function requiredString(args: Args, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing --${key}.`);
  }
  return value;
}

function optionalString(args: Args, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalClipList(args: Args, key: string): string[] | undefined {
  const value = optionalString(args, key);
  if (!value) {
    return undefined;
  }
  return value
    .split(",")
    .map((clip) => clip.trim())
    .filter(Boolean);
}

function optionalBoolean(args: Args, key: string): boolean {
  return args[key] === true;
}

function printHelp(): void {
  console.log(`SpriteForge Agent

Commands:
  npm run sprite-agent -- ingest --character lamuh --reference "path/to/reference.png" --brief "path/to/brief.md"
  npm run sprite-agent -- plan --character lamuh --stage style-test
  npm run sprite-agent -- prompt --character lamuh --clip neutral_light
  npm run sprite-agent -- validate --character lamuh --clip neutral_light --sheet "path/to/sheet.png"
  npm run sprite-agent -- normalize --character lamuh --clip neutral_light [--sheet "path/to/sheet.png"]
  npm run sprite-agent -- export --character lamuh [--stage mvp]
  npm run sprite-agent -- test --character lamuh [--stage mvp]
  npm run sprite-agent -- run --character lamuh --stage mvp
  npm run sprite-agent -- run-queue --character sable --stage mvp --approval-policy previewAuto
  npm run sprite-agent -- run-queue --character sable --clips crouch,block,hitstun,walk,jump --approval-policy previewAuto
  npm run sprite-agent -- run-queue --character sable --clips "crouch,block,hitstun,walk,jump,ground light,ground medium,ground heavy" --approval-policy previewAuto --provider spritebuilder
  npm run sprite-agent -- run-queue --character sable --clips "idle" --approval-policy previewAuto --provider spritebuilder --dry-run
  npm run sprite-agent -- run-pack --character sable --stage mvp --approval-policy previewAuto --skip-approved --auto-verify
  npm run sprite-agent -- run-pack --character sable --stage animator-rebuild-v2 --approval-policy previewAuto --skip-approved --auto-verify --dry-run
  npm run sprite-agent -- run-pack --character sable --stage animator-rebuild-v2 --approval-policy previewAuto --skip-approved --auto-verify
  npm run sprite-agent -- run-queue --character sable --stage animator-rebuild-v2 --clips "idle,walk_forward,walk_backward,jump,crouch,block,hit_stun,knockdown,getup" --approval-policy previewAuto --skip-approved
  npm run sprite-agent -- run-queue --character sable --stage animator-rebuild-v2 --clips "stand_light,stand_medium,stand_heavy,crouch_light,crouch_medium,crouch_heavy,jump_light,jump_medium,jump_heavy,forward_light,forward_medium,forward_heavy,back_light,back_medium,back_heavy" --approval-policy previewAuto --skip-approved
  npm run sprite-agent -- run-queue --character sable --stage animator-rebuild-v2 --clips "neutral_special_light,neutral_special_medium,neutral_special_heavy,forward_special_light,forward_special_medium,forward_special_heavy,back_special_light,back_special_medium,back_special_heavy,down_special_light,down_special_medium,down_special_heavy,up_special_light,up_special_medium,up_special_heavy" --approval-policy previewAuto --skip-approved
  npm run sprite-agent -- verify-pack --character sable --stage mvp
  npm run sprite-agent -- verify-pack --character sable --stage animator-rebuild-v2
  npm run sprite-agent -- resume-pack --character sable --stage animator-rebuild-v2
  npm run sprite-agent -- status --character sable
  npm run sprite-agent -- resume --character sable
  npm run sprite-agent -- promote-preview --character sable --clip idle
  npm run sprite-agent -- promote-preview --character sable --stage mvp
  npm run sprite-agent -- reject-preview --character sable --clips "forward_special_light,forward_special_medium" --reason "Rejected by human visual review."

All generated files stay under assets/characters/<character>/ by default.
Live roster wiring is intentionally disabled.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
