import fs from "node:fs/promises";
import path from "node:path";
import {
  type AgentConfig,
  type ValidationReport,
  characterRoot,
  ensureDir,
  loadCharacterSpec,
  summarizeCharacterSpec,
  timestampId,
  toolRoot,
  toRepoRelative,
  writeJson,
  writeText
} from "./report.js";

export interface VisualQaReport {
  characterId: string;
  clipId: string;
  sheetPath: string;
  generatedAt: string;
  adapter: "manual-placeholder";
  status: "manual_review_required";
  approved: false;
  checklist: Array<{
    id: string;
    label: string;
    required: boolean;
    status: "pending";
  }>;
  promptPath: string;
  notes: string[];
}

export interface VisualQaScoreReport {
  characterId: string;
  clipId: string;
  sheetPath: string;
  generatedAt: string;
  adapter: "heuristic-validation-score";
  score: number;
  status: "pass" | "warn" | "fail";
  humanReviewNeeded: boolean;
  identityDriftDetected: boolean;
  suspiciousOutput: boolean;
  summary: string;
  factors: string[];
  notes: string[];
}

export async function createVisualQaChecklist(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  sheetPath: string
): Promise<VisualQaReport> {
  const spec = await loadCharacterSpec(config, characterId);
  const qaDir = path.join(characterRoot(config, characterId), "visual_qa", clipId);
  await ensureDir(qaDir);
  const template = await fs.readFile(path.join(toolRoot(), "prompts", "visual_qa_prompt.md"), "utf8");
  const prompt = replaceTokens(template, {
    characterId,
    clipId,
    sheetPath: toRepoRelative(sheetPath),
    characterSpecSummary: summarizeCharacterSpec(spec)
  });
  const stamp = timestampId();
  const promptPath = path.join(qaDir, `${stamp}_${clipId}_visual_qa_prompt.md`);
  await writeText(promptPath, prompt);
  await writeText(path.join(qaDir, `latest_${clipId}_visual_qa_prompt.md`), prompt);

  const report: VisualQaReport = {
    characterId,
    clipId,
    sheetPath: toRepoRelative(sheetPath),
    generatedAt: new Date().toISOString(),
    adapter: "manual-placeholder",
    status: "manual_review_required",
    approved: false,
    checklist: [
      checklistItem("identity", "Same locked character identity"),
      checklistItem("style4", "Style 4 HD pixel anime fighter style"),
      checklistItem("pose", "Pose and motion match the requested clip"),
      checklistItem("facing", "Character faces right by default"),
      checklistItem("no_text", "No text, labels, borders, watermark, or UI marks"),
      checklistItem("no_background", "No background, floor, or frame grid"),
      checklistItem("no_cropping", "No cropped body parts, outfit pieces, weapons, or VFX"),
      checklistItem("body_readable", "Body remains readable in every frame"),
      checklistItem("vfx_supports_body", "VFX supports the move without replacing the body"),
      checklistItem("scale_center_baseline", "Scale, center, and baseline remain stable")
    ],
    promptPath: toRepoRelative(promptPath),
    notes: [
      "No multimodal visual model is connected yet.",
      "Technical pass does not equal live approval; visual review remains required."
    ]
  };

  await writeJson(path.join(qaDir, `${stamp}_${clipId}_visual_qa.json`), report);
  await writeJson(path.join(qaDir, `latest_${clipId}_visual_qa.json`), report);
  await writeText(path.join(qaDir, `${stamp}_${clipId}_visual_qa.md`), visualQaMarkdown(report));
  await writeText(path.join(qaDir, `latest_${clipId}_visual_qa.md`), visualQaMarkdown(report));

  return report;
}

export async function scoreVisualQa(
  config: AgentConfig,
  characterId: string,
  clipId: string,
  sheetPath: string,
  validation: ValidationReport
): Promise<VisualQaScoreReport> {
  const factors: string[] = [];
  let score = 92;
  let suspiciousOutput = false;

  if (validation.technicalStatus === "fail") {
    score = 0;
    factors.push("Technical validation failed.");
  }

  for (const issue of validation.issues) {
    switch (issue.code) {
      case "CROPPED_BOUNDS":
      case "EMPTY_FRAME":
      case "FRAME_BORDER_DETECTED":
      case "OPAQUE_FULL_BACKGROUND":
      case "NO_ALPHA_TRANSPARENCY":
      case "IMAGE_DECODE_FAILED":
      case "FRAME_COUNT_MISMATCH":
      case "DIMENSIONS_NOT_FRAME_MULTIPLE":
        suspiciousOutput = true;
        score -= 45;
        factors.push(`${issue.code}: ${issue.message}`);
        break;
      case "TEXT_LIKE_DARK_BAND":
        suspiciousOutput = true;
        score -= 25;
        factors.push(`${issue.code}: possible text/label artifact.`);
        break;
      case "DETACHED_COMPONENTS":
        suspiciousOutput = true;
        score -= 40;
        factors.push(`${issue.code}: detached body/VFX fragments require human review.`);
        break;
      case "BODY_TOO_LARGE":
      case "BODY_TOO_SMALL":
      case "SCALE_DRIFT":
        score -= 12;
        factors.push(`${issue.code}: scale/readability risk.`);
        break;
      case "BASELINE_DRIFT":
      case "CENTER_DRIFT":
        score -= 8;
        factors.push(`${issue.code}: anchor stability risk.`);
        break;
      case "POSSIBLE_DUPLICATE_FRAMES":
        score -= 4;
        factors.push(`${issue.code}: subtle or repeated motion; acceptable only with review.`);
        break;
      default:
        if (issue.severity === "warn") {
          score -= 5;
          factors.push(`${issue.code}: warning.`);
        }
        break;
    }
  }

  score = Math.max(0, Math.min(100, score));
  if (factors.length === 0) {
    factors.push("No measurable visual risk flags were emitted by validation.");
  }

  const status: VisualQaScoreReport["status"] =
    score >= 90 && !suspiciousOutput
      ? "pass"
      : score >= 75 && !suspiciousOutput
        ? "warn"
        : "fail";
  const report: VisualQaScoreReport = {
    characterId,
    clipId,
    sheetPath: toRepoRelative(sheetPath),
    generatedAt: new Date().toISOString(),
    adapter: "heuristic-validation-score",
    score,
    status,
    humanReviewNeeded: status !== "pass",
    identityDriftDetected: false,
    suspiciousOutput,
    summary:
      status === "pass"
        ? "Heuristic visual QA passed measurable preview risks."
        : "Heuristic visual QA found risk that should block auto preview approval.",
    factors,
    notes: [
      "This is a heuristic score derived from technical measurements and artifact flags.",
      "No multimodal identity-drift adapter is connected yet; live roster promotion still requires human approval.",
      "SpriteForge remains the approval gatekeeper even when SpriteBuilder or another provider generates the image."
    ]
  };

  const qaDir = path.join(characterRoot(config, characterId), "visual_qa", clipId);
  await ensureDir(qaDir);
  const stamp = timestampId();
  await writeJson(path.join(qaDir, `${stamp}_${clipId}_visual_qa_score.json`), report);
  await writeJson(path.join(qaDir, `latest_${clipId}_visual_qa_score.json`), report);
  await writeText(path.join(qaDir, `${stamp}_${clipId}_visual_qa_score.md`), visualQaScoreMarkdown(report));
  await writeText(path.join(qaDir, `latest_${clipId}_visual_qa_score.md`), visualQaScoreMarkdown(report));
  return report;
}

function checklistItem(id: string, label: string): VisualQaReport["checklist"][number] {
  return { id, label, required: true, status: "pending" };
}

function visualQaMarkdown(report: VisualQaReport): string {
  return `# SpriteForge Visual QA - ${report.characterId} / ${report.clipId}

Status: **${report.status}**
Approved: **no**
Sheet: \`${report.sheetPath}\`
Prompt: \`${report.promptPath}\`

## Checklist

${report.checklist.map((item) => `- [ ] ${item.label}`).join("\n")}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

function visualQaScoreMarkdown(report: VisualQaScoreReport): string {
  return `# SpriteForge Visual QA Score - ${report.characterId} / ${report.clipId}

Status: **${report.status}**
Score: **${report.score}**
Human review needed: **${report.humanReviewNeeded ? "yes" : "no"}**
Suspicious output: **${report.suspiciousOutput ? "yes" : "no"}**
Identity drift detected: **${report.identityDriftDetected ? "yes" : "no"}**
Sheet: \`${report.sheetPath}\`

## Summary

${report.summary}

## Factors

${report.factors.map((factor) => `- ${factor}`).join("\n")}

## Notes

${report.notes.map((note) => `- ${note}`).join("\n")}
`;
}

function replaceTokens(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? "");
}
