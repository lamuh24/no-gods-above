import fs from "node:fs/promises";
import path from "node:path";
import {
  type AgentConfig,
  type CharacterSpec,
  characterRoot,
  ensureDir,
  loadConfig,
  pathExists,
  readJson,
  resolveUserPath,
  slugify,
  summarizeCharacterSpec,
  timestampId,
  titleize,
  toRepoRelative,
  writeJson,
  writeText
} from "./report.js";

export interface BuildSpecOptions {
  character: string;
  reference?: string;
  brief?: string;
}

export interface BuildSpecResult {
  spec: CharacterSpec;
  specPath: string;
  specMarkdownPath: string;
  copiedReference?: string;
  copiedBrief?: string;
}

export async function buildCharacterSpec(options: BuildSpecOptions): Promise<BuildSpecResult> {
  const config = await loadConfig();
  const characterId = slugify(options.character);
  const root = characterRoot(config, characterId);
  const specDir = path.join(root, "spec");
  const specPath = path.join(specDir, "character_spec.json");
  const now = new Date().toISOString();
  const version = `v${timestampId()}`;

  await ensureDir(specDir);

  const existing = (await pathExists(specPath))
    ? await readJson<CharacterSpec>(specPath)
    : createDefaultSpec(config, characterId, now);

  const copiedReference = options.reference
    ? await copyReference(root, version, options.reference)
    : undefined;
  const copiedBrief = options.brief ? await copyBrief(root, version, options.brief) : undefined;

  const updated: CharacterSpec = {
    ...existing,
    lock: {
      status: existing.lock?.status ?? "draft_locked",
      createdAt: existing.lock?.createdAt ?? now,
      updatedAt: now,
      requiresHumanApproval: existing.lock?.requiresHumanApproval ?? true
    },
    references: copiedReference
      ? [...(existing.references ?? []), { path: toRepoRelative(copiedReference), ingestedAt: now }]
      : existing.references ?? [],
    briefs: copiedBrief
      ? [...(existing.briefs ?? []), { path: toRepoRelative(copiedBrief), ingestedAt: now }]
      : existing.briefs ?? []
  };

  if (copiedBrief && !existing.styleNotes.some((note) => note.includes("Brief source"))) {
    updated.styleNotes = [
      ...existing.styleNotes,
      `Brief source preserved at ${toRepoRelative(copiedBrief)}. Review and fold exact identity details into this spec before approval.`
    ];
  }

  const specMarkdownPath = path.join(specDir, "character_spec.md");
  await writeJson(specPath, updated);
  await writeText(specMarkdownPath, specMarkdown(updated));

  return { spec: updated, specPath, specMarkdownPath, copiedReference, copiedBrief };
}

function createDefaultSpec(config: AgentConfig, characterId: string, now: string): CharacterSpec {
  return {
    id: characterId,
    displayName: titleize(characterId),
    role: "draft fighter role - edit before approval",
    bodyType: "mature HD pixel anime fighter proportions; edit to the locked body type",
    skinTone: "locked from reference sheet; describe exact tone before approval",
    hair: "locked from reference sheet; describe shape, length, color, and behavior",
    face: "locked from reference sheet; describe recognizable facial identity",
    outfit: "locked from reference sheet; describe silhouette, layers, trim, and materials",
    accessories: [],
    vfx: "locked from reference sheet or brief; keep body readability first",
    forbidden: [
      "do not redesign the character",
      "do not change skin tone, face, hair identity, outfit silhouette, palette, or power language",
      "do not add text, labels, borders, backgrounds, watermarks, or frame grids",
      "do not crop body parts, clothing, weapons, or important VFX",
      "do not wire candidate sheets into the live roster automatically"
    ],
    palette: {
      primary: "edit from reference",
      secondary: "edit from reference",
      accent: "edit from reference",
      outline: "crisp dark outline"
    },
    spriteRules: {
      frameWidth: config.sprite.frameWidth,
      frameHeight: config.sprite.frameHeight,
      baselineY: config.sprite.baselineY,
      facing: config.sprite.facing,
      style: "Style 4 HD pixel anime fighter",
      transparentBackground: true,
      noText: true,
      noLabels: true,
      noFrameBorders: true,
      consistentScale: true
    },
    styleNotes: [
      "Draft lock created by SpriteForge Agent. A human should edit exact identity details before approving this spec.",
      "Candidate art remains preview-only until technical validation and visual approval both pass."
    ],
    lock: {
      status: "draft_locked",
      createdAt: now,
      updatedAt: now,
      requiresHumanApproval: true
    },
    references: [],
    briefs: []
  };
}

async function copyReference(root: string, version: string, inputPath: string): Promise<string> {
  const source = resolveUserPath(inputPath);
  if (!(await pathExists(source))) {
    throw new Error(`Reference image does not exist: ${source}`);
  }
  if (!/\.(png|webp|jpg|jpeg)$/i.test(source)) {
    throw new Error("Reference must be a PNG, WEBP, JPG, or JPEG image.");
  }
  const destDir = path.join(root, "references", version);
  await ensureDir(destDir);
  const dest = path.join(destDir, `reference${path.extname(source).toLowerCase()}`);
  await fs.copyFile(source, dest);
  return dest;
}

async function copyBrief(root: string, version: string, inputPath: string): Promise<string> {
  const source = resolveUserPath(inputPath);
  if (!(await pathExists(source))) {
    throw new Error(`Brief file does not exist: ${source}`);
  }
  const destDir = path.join(root, "briefs", version);
  await ensureDir(destDir);
  const dest = path.join(destDir, `brief${path.extname(source).toLowerCase() || ".md"}`);
  await fs.copyFile(source, dest);
  return dest;
}

function specMarkdown(spec: CharacterSpec): string {
  return `# SpriteForge Character Spec - ${spec.displayName}

Status: **${spec.lock?.status ?? "draft_locked"}**
Requires human approval: **${spec.lock?.requiresHumanApproval ? "yes" : "no"}**

## Identity Lock

${summarizeCharacterSpec(spec)}

## Sprite Rules

- Frame: ${spec.spriteRules.frameWidth}x${spec.spriteRules.frameHeight}
- BaselineY: ${spec.spriteRules.baselineY}
- Facing: ${spec.spriteRules.facing}
- Style: ${spec.spriteRules.style}
- Transparent background: required
- No text, labels, borders, or background

## References

${(spec.references ?? []).map((item) => `- ${item.path} (${item.ingestedAt})`).join("\n") || "- None yet."}

## Briefs

${(spec.briefs ?? []).map((item) => `- ${item.path} (${item.ingestedAt})`).join("\n") || "- None yet."}
`;
}
