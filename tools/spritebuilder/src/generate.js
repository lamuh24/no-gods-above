import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..", "..");

function usage() {
  console.error(
    "Usage: npm.cmd --prefix tools/spritebuilder run generate -- --request <spritebuilder_request.json> [--write-dev-png]",
  );
}

function parseArgs(argv) {
  const requestIndex = argv.indexOf("--request");
  if (requestIndex === -1 || !argv[requestIndex + 1]) {
    usage();
    process.exit(2);
  }

  return {
    requestPath: argv[requestIndex + 1],
    writeDevPng: argv.includes("--write-dev-png"),
  };
}

function asRepoRelative(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty repo-relative path.`);
  }

  if (path.isAbsolute(value)) {
    throw new Error(`${fieldName} must not be an absolute path.`);
  }

  const normalized = value.replace(/\\/g, "/");
  if (normalized.includes("..")) {
    throw new Error(`${fieldName} must not contain '..'.`);
  }

  return normalized.replace(/^\/+/, "");
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value;
}

function requireFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
  return value;
}

function validateRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new Error("request payload must be a JSON object.");
  }

  if (request.provider !== "spritebuilder") {
    throw new Error("provider must be 'spritebuilder'.");
  }

  const characterId = requireString(request.characterId, "characterId");
  const clipId = requireString(request.clipId, "clipId");
  const promptPath = asRepoRelative(request.promptPath, "promptPath");
  const outputDirectory = asRepoRelative(request.outputDirectory, "outputDirectory");
  const expected = request.expected ?? {};

  requireFiniteNumber(expected.frameCount, "expected.frameCount");
  requireFiniteNumber(expected.stripWidth, "expected.stripWidth");
  requireFiniteNumber(expected.stripHeight, "expected.stripHeight");
  requireFiniteNumber(expected.frameWidth, "expected.frameWidth");
  requireFiniteNumber(expected.frameHeight, "expected.frameHeight");
  requireFiniteNumber(expected.baselineY, "expected.baselineY");

  const safety = request.safety ?? {};
  if (safety.liveRosterWiring !== "disabled") {
    throw new Error("safety.liveRosterWiring must be 'disabled'.");
  }
  if (safety.approvedForLiveRoster !== false) {
    throw new Error("safety.approvedForLiveRoster must be false.");
  }

  const characterOutputPrefix = `assets/characters/${characterId}/generated/`;
  const allowedReviewPrefix = `${characterOutputPrefix}provider_review/`;
  const allowedQuarantinePrefix = `${characterOutputPrefix}quarantine/`;
  if (!outputDirectory.startsWith(allowedReviewPrefix) && !outputDirectory.startsWith(allowedQuarantinePrefix)) {
    throw new Error(
      `outputDirectory must stay in ${allowedReviewPrefix} or ${allowedQuarantinePrefix}.`,
    );
  }

  const blockedPrefixes = [
    "NO_GODS_ABOVE/",
    "assets/sprites/",
    "assets/characters/live/",
  ];
  for (const blockedPrefix of blockedPrefixes) {
    if (outputDirectory.startsWith(blockedPrefix)) {
      throw new Error(`outputDirectory must not target live asset folder ${blockedPrefix}.`);
    }
  }

  return {
    characterId,
    clipId,
    promptPath,
    outputDirectory,
    expected: {
      frameCount: expected.frameCount,
      stripWidth: expected.stripWidth,
      stripHeight: expected.stripHeight,
      frameWidth: expected.frameWidth,
      frameHeight: expected.frameHeight,
      baselineY: expected.baselineY,
    },
    referencePaths: Array.isArray(request.referencePaths)
      ? request.referencePaths.map((entry, index) => asRepoRelative(entry, `referencePaths[${index}]`))
      : [],
  };
}

async function main() {
  const { requestPath, writeDevPng } = parseArgs(process.argv.slice(2));
  const requestAbs = path.isAbsolute(requestPath)
    ? path.normalize(requestPath)
    : path.resolve(repoRoot, requestPath);

  const raw = await readFile(requestAbs, "utf8");
  const request = JSON.parse(raw);
  const validated = validateRequest(request);
  const outputAbs = path.resolve(repoRoot, validated.outputDirectory);

  await mkdir(outputAbs, { recursive: true });

  const createdAt = new Date().toISOString();
  const report = {
    mock: true,
    notFinalArt: true,
    provider: "spritebuilder",
    createdAt,
    requestPath: path.relative(repoRoot, requestAbs).replace(/\\/g, "/"),
    characterId: validated.characterId,
    clipId: validated.clipId,
    promptPath: validated.promptPath,
    outputDirectory: validated.outputDirectory,
    expected: validated.expected,
    referencePaths: validated.referencePaths,
    devPng: writeDevPng,
    safety: {
      quarantineOnly: true,
      writesFinalSpritesheet: false,
      approvedForLiveRoster: false,
      note: writeDevPng
        ? "DEV_NOT_FINAL PNG output for SpriteForge provider contract testing only. Do not treat as final art."
        : "Mock SpriteBuilder output for integration testing only. Do not treat as final art.",
    },
  };

  await writeFile(
    path.join(outputAbs, "mock_spritebuilder_output.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  const safeClip = validated.clipId.replace(/[^a-z0-9_-]+/gi, "_");
  await writeFile(
    path.join(outputAbs, `MOCK_NOT_FINAL_${safeClip}.txt`),
    [
      "MOCK SPRITEBUILDER OUTPUT - NOT FINAL ART",
      `createdAt=${createdAt}`,
      `characterId=${validated.characterId}`,
      `clipId=${validated.clipId}`,
      `outputDirectory=${validated.outputDirectory}`,
      "",
      "This file exists only to test the SpriteForge/SpriteBuilder provider path.",
      writeDevPng
        ? "This run was allowed to write a DEV_NOT_FINAL PNG for validation-path testing only."
        : "It is intentionally not a PNG/WEBP spritesheet and must never be promoted to live assets.",
      "",
    ].join("\n"),
    "utf8",
  );

  if (writeDevPng) {
    const outputPath = await writeDevPngSpritesheet({
      outputAbs,
      requestAbs,
      requestRel: path.relative(repoRoot, requestAbs).replace(/\\/g, "/"),
      outputDirectory: validated.outputDirectory,
      characterId: validated.characterId,
      clipId: validated.clipId,
      expected: validated.expected,
    });
    console.log(`Mock SpriteBuilder wrote DEV_NOT_FINAL PNG to ${outputPath}`);
    return;
  }

  console.log(`Mock SpriteBuilder wrote marker-only test output to ${validated.outputDirectory}`);
}

async function writeDevPngSpritesheet(options) {
  const existingImages = (await readdir(options.outputAbs)).filter((entry) => /\.(png|webp)$/i.test(entry));
  if (existingImages.length > 0) {
    throw new Error(
      `Refusing to write dev PNG because outputDirectory already contains image output: ${existingImages.join(", ")}`,
    );
  }

  const stripWidth = Math.trunc(options.expected.stripWidth);
  const stripHeight = Math.trunc(options.expected.stripHeight);
  const frameWidth = Math.trunc(options.expected.frameWidth);
  const frameHeight = Math.trunc(options.expected.frameHeight);
  const frameCount = Math.trunc(options.expected.frameCount);
  const baselineY = Math.trunc(options.expected.baselineY);

  if (stripWidth !== frameWidth * frameCount) {
    throw new Error("expected.stripWidth must equal expected.frameWidth * expected.frameCount.");
  }
  if (stripHeight !== frameHeight) {
    throw new Error("expected.stripHeight must equal expected.frameHeight for a horizontal strip.");
  }

  const pngBuffer = renderDevSpritesheet({
    stripWidth,
    stripHeight,
    frameWidth,
    frameHeight,
    frameCount,
    baselineY,
  });

  const createdAt = new Date().toISOString();
  const outputTimestamp = safeName(path.basename(options.outputDirectory.replace(/\/$/, "")));
  const safeCharacter = safeName(options.characterId);
  const safeClip = safeName(options.clipId);
  const fileName = `${safeCharacter}_${safeClip}_${outputTimestamp}_DEV_NOT_FINAL.png`;
  const outputAbs = path.join(options.outputAbs, fileName);
  await writeFile(outputAbs, pngBuffer);

  const outputPath = path.relative(repoRoot, outputAbs).replace(/\\/g, "/");
  const result = {
    status: "ok",
    outputPath,
    requestPath: options.requestRel,
    character: options.characterId,
    clip: options.clipId,
    createdAt,
    devPng: true,
    notFinalArt: true,
  };
  await writeFile(path.join(options.outputAbs, "spritebuilder_result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return outputPath;
}

function renderDevSpritesheet(options) {
  const pixels = Buffer.alloc(options.stripWidth * options.stripHeight * 4, 0);
  for (let frameIndex = 0; frameIndex < options.frameCount; frameIndex += 1) {
    drawDevFrame(pixels, options, frameIndex);
  }
  return encodePngRgba(options.stripWidth, options.stripHeight, pixels);
}

function drawDevFrame(pixels, options, frameIndex) {
  const frameLeft = frameIndex * options.frameWidth;
  const phase = options.frameCount <= 1 ? 0 : frameIndex / (options.frameCount - 1);
  const wave = Math.sin(phase * Math.PI * 2);
  const sway = Math.round(wave * Math.min(16, options.frameWidth * 0.035));
  const footSpread = Math.round(options.frameWidth * 0.09);
  const baseline = clamp(options.baselineY, 48, options.frameHeight - 12);
  const bodyHeight = clamp(Math.round(options.frameHeight * 0.34), 96, 158);
  const centerX = frameLeft + Math.round(options.frameWidth / 2) + sway;
  const headY = baseline - bodyHeight + Math.round(options.frameHeight * 0.045);
  const torsoY = baseline - Math.round(bodyHeight * 0.48);
  const crouchLift = Math.round((1 - Math.cos(phase * Math.PI * 2)) * 5);
  const pose = frameIndex % 8;
  const leftGuard = [
    [-52, 34],
    [-68, 44],
    [-58, 56],
    [-34, 44],
    [-24, 30],
    [-42, 22],
    [-66, 28],
    [-72, 38],
  ][pose];
  const rightGuard = [
    [56, 28],
    [34, 24],
    [28, 40],
    [50, 54],
    [70, 44],
    [62, 28],
    [42, 20],
    [30, 34],
  ][pose];

  const body = [22, 28, 46, 230];
  const shadow = [7, 9, 18, 235];
  const silver = [178, 196, 215, 210];
  const voidAccent = [91, 71, 180, 190];

  drawCapsuleLine(pixels, options, centerX - 20, torsoY + 26, centerX - footSpread, baseline, 9, shadow);
  drawCapsuleLine(pixels, options, centerX + 20, torsoY + 26, centerX + footSpread, baseline, 9, shadow);
  drawCapsuleLine(
    pixels,
    options,
    centerX - 22,
    torsoY - 6 + crouchLift,
    centerX + leftGuard[0],
    torsoY + leftGuard[1],
    9,
    body,
  );
  drawCapsuleLine(
    pixels,
    options,
    centerX + 22,
    torsoY - 6,
    centerX + rightGuard[0],
    torsoY + rightGuard[1] + crouchLift,
    9,
    body,
  );
  drawEllipse(pixels, options, centerX, torsoY, 31, 48, body);
  drawEllipse(pixels, options, centerX, headY, 19, 22, shadow);
  drawEllipse(pixels, options, centerX - 8, headY - 6, 7, 8, body);
  drawCapsuleLine(
    pixels,
    options,
    centerX + leftGuard[0] + 4,
    torsoY + leftGuard[1] - 2,
    centerX + leftGuard[0] - 18,
    torsoY + leftGuard[1] + 8,
    5,
    silver,
  );
  drawCapsuleLine(
    pixels,
    options,
    centerX + rightGuard[0] - 4,
    torsoY + rightGuard[1],
    centerX + rightGuard[0] + 18,
    torsoY + rightGuard[1] + 10,
    5,
    silver,
  );
  drawEllipse(pixels, options, centerX + leftGuard[0] - 20, torsoY + leftGuard[1] + 8, 10 + (pose % 3) * 3, 7, voidAccent);
  drawEllipse(pixels, options, centerX + rightGuard[0] + 20, torsoY + rightGuard[1] + 10, 8, 9 + ((pose + 1) % 3) * 3, voidAccent);
}

function drawEllipse(pixels, options, cx, cy, rx, ry, color) {
  const minX = Math.floor(cx - rx);
  const maxX = Math.ceil(cx + rx);
  const minY = Math.floor(cy - ry);
  const maxY = Math.ceil(cy + ry);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setPixel(pixels, options.stripWidth, options.stripHeight, x, y, color);
      }
    }
  }
}

function drawCapsuleLine(pixels, options, x1, y1, x2, y2, radius, color) {
  const minX = Math.floor(Math.min(x1, x2) - radius);
  const maxX = Math.ceil(Math.max(x1, x2) + radius);
  const minY = Math.floor(Math.min(y1, y2) - radius);
  const maxY = Math.ceil(Math.max(y1, y2) + radius);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = clamp(((x - x1) * dx + (y - y1) * dy) / lenSq, 0, 1);
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const distX = x - px;
      const distY = y - py;
      if (distX * distX + distY * distY <= radius * radius) {
        setPixel(pixels, options.stripWidth, options.stripHeight, x, y, color);
      }
    }
  }
}

function setPixel(pixels, width, height, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const offset = (Math.trunc(y) * width + Math.trunc(x)) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function encodePngRgba(width, height, rgba) {
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdrData(width, height)),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdrData(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "mock";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

main().catch((error) => {
  console.error(`Mock SpriteBuilder failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
