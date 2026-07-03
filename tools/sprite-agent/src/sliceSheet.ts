import sharp from "sharp";
import type { AgentConfig, ValidationIssue } from "./report.js";

export interface SheetLayout {
  mode: "horizontal-strip" | "grid";
  columns: number;
  rows: number;
  frameCount: number;
}

export function detectSheetLayout(
  config: AgentConfig,
  width: number,
  height: number,
  expectedFrameCount: number
): { layout?: SheetLayout; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const frameWidth = config.sprite.frameWidth;
  const frameHeight = config.sprite.frameHeight;

  if (width % frameWidth !== 0 || height % frameHeight !== 0) {
    issues.push({
      severity: "fail",
      code: "DIMENSIONS_NOT_FRAME_MULTIPLE",
      message: `Sheet ${width}x${height} is not an exact multiple of ${frameWidth}x${frameHeight}.`
    });
    return { issues };
  }

  const columns = width / frameWidth;
  const rows = height / frameHeight;
  const frameCount = columns * rows;
  const layout: SheetLayout = {
    mode: rows === 1 ? "horizontal-strip" : "grid",
    columns,
    rows,
    frameCount
  };

  if (frameCount !== expectedFrameCount) {
    issues.push({
      severity: "fail",
      code: "FRAME_COUNT_MISMATCH",
      message: `Expected ${expectedFrameCount} frames but found ${frameCount} cells.`
    });
  }

  return { layout, issues };
}

export async function extractFrameBuffers(
  sheetBuffer: Buffer,
  config: AgentConfig,
  layout: SheetLayout,
  maxFrames = layout.frameCount
): Promise<Buffer[]> {
  const frames: Buffer[] = [];
  const frameWidth = config.sprite.frameWidth;
  const frameHeight = config.sprite.frameHeight;
  const count = Math.min(maxFrames, layout.frameCount);

  for (let frameIndex = 0; frameIndex < count; frameIndex += 1) {
    const column = frameIndex % layout.columns;
    const row = Math.floor(frameIndex / layout.columns);
    const frame = await sharp(sheetBuffer)
      .extract({
        left: column * frameWidth,
        top: row * frameHeight,
        width: frameWidth,
        height: frameHeight
      })
      .png()
      .toBuffer();
    frames.push(frame);
  }

  return frames;
}
