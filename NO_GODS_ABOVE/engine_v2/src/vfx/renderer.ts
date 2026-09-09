import { VfxFrameSample, VfxPoint, VfxPrimitive } from "./types";

export type VfxLabBackground = "cathedral" | "neutral" | "checker";

export interface VfxRenderOptions {
  readonly background: VfxLabBackground;
  readonly showAnchors: boolean;
  readonly anchors: Readonly<Record<string, VfxPoint>>;
}

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;

function radialGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
  outer: string
) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.42, outer);
  gradient.addColorStop(1, "transparent");
  return gradient;
}

export class VfxCanvasRenderer {
  readonly logicalSize = { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT } as const;
  private readonly context: CanvasRenderingContext2D;
  private devicePixelRatio = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D is unavailable for the VFX lab");
    this.context = context;
    this.resize();
  }

  resize(): void {
    this.devicePixelRatio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(LOGICAL_WIDTH * this.devicePixelRatio);
    this.canvas.height = Math.floor(LOGICAL_HEIGHT * this.devicePixelRatio);
    this.canvas.style.aspectRatio = `${LOGICAL_WIDTH} / ${LOGICAL_HEIGHT}`;
  }

  render(frame: VfxFrameSample, options: VfxRenderOptions): void {
    const context = this.context;
    context.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    context.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawBackground(options.background);

    context.save();
    context.translate(frame.cameraShake[0], frame.cameraShake[1]);
    for (const primitive of frame.primitives) this.drawPrimitive(primitive);
    context.restore();

    if (options.showAnchors) this.drawAnchors(options.anchors);
    this.drawSafeFrame();
  }

  private drawBackground(background: VfxLabBackground): void {
    const context = this.context;
    if (background === "checker") {
      context.fillStyle = "#d9d5cc";
      context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      const size = 30;
      context.fillStyle = "#b9b5ad";
      for (let y = 0; y < LOGICAL_HEIGHT; y += size) {
        for (let x = 0; x < LOGICAL_WIDTH; x += size) {
          if ((x / size + y / size) % 2 === 0) context.fillRect(x, y, size, size);
        }
      }
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    if (background === "neutral") {
      gradient.addColorStop(0, "#161923");
      gradient.addColorStop(1, "#07090d");
    } else {
      gradient.addColorStop(0, "#090b15");
      gradient.addColorStop(0.58, "#171321");
      gradient.addColorStop(1, "#08080d");
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    context.save();
    context.globalAlpha = background === "cathedral" ? 0.32 : 0.16;
    context.strokeStyle = background === "cathedral" ? "#7b2734" : "#364052";
    context.lineWidth = 1;
    for (let x = 0; x <= LOGICAL_WIDTH; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, LOGICAL_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= LOGICAL_HEIGHT; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(LOGICAL_WIDTH, y);
      context.stroke();
    }
    context.restore();

    if (background === "cathedral") {
      context.save();
      context.strokeStyle = "rgba(171, 57, 62, 0.2)";
      context.lineWidth = 3;
      for (const x of [170, 480, 790]) {
        context.beginPath();
        context.moveTo(x - 112, LOGICAL_HEIGHT);
        context.lineTo(x - 112, 220);
        context.arc(x, 220, 112, Math.PI, 0);
        context.lineTo(x + 112, LOGICAL_HEIGHT);
        context.stroke();
      }
      const floor = context.createLinearGradient(0, 390, 0, LOGICAL_HEIGHT);
      floor.addColorStop(0, "rgba(101, 32, 39, 0.08)");
      floor.addColorStop(1, "rgba(2, 2, 5, 0.72)");
      context.fillStyle = floor;
      context.fillRect(0, 390, LOGICAL_WIDTH, LOGICAL_HEIGHT - 390);
      context.restore();
    }
  }

  private drawPrimitive(primitive: VfxPrimitive): void {
    const context = this.context;
    context.save();
    context.globalAlpha = Math.max(0, Math.min(1, primitive.alpha));
    context.globalCompositeOperation = primitive.blend;
    context.translate(primitive.x, primitive.y);
    context.rotate(primitive.rotation);

    if (primitive.kind === "flash") this.drawFlash(primitive);
    else if (primitive.kind === "smoke") this.drawSmoke(primitive);
    else if (primitive.kind === "spark") this.drawSpark(primitive);
    else if (primitive.kind === "ring") this.drawRing(primitive);
    else if (primitive.kind === "beam") this.drawBeam(primitive);
    else if (primitive.kind === "projectile") this.drawProjectile(primitive);
    else if (primitive.kind === "trail") this.drawTrail(primitive);
    else this.drawDebris(primitive);

    context.restore();
  }

  private drawFlash(primitive: VfxPrimitive): void {
    const context = this.context;
    context.save();
    context.rotate(-primitive.rotation);
    context.fillStyle = radialGradient(context, 0, 0, primitive.size * 1.5, primitive.color, primitive.secondaryColor);
    context.fillRect(-primitive.size * 1.6, -primitive.size * 1.6, primitive.size * 3.2, primitive.size * 3.2);
    context.restore();

    const cone = context.createLinearGradient(-primitive.width * 0.35, 0, primitive.length, 0);
    cone.addColorStop(0, primitive.color);
    cone.addColorStop(0.28, primitive.secondaryColor);
    cone.addColorStop(1, "transparent");
    context.fillStyle = cone;
    context.beginPath();
    context.moveTo(-primitive.width * 0.42, -primitive.width * 0.34);
    context.lineTo(primitive.length, 0);
    context.lineTo(-primitive.width * 0.42, primitive.width * 0.34);
    context.lineTo(primitive.width * 0.2, 0);
    context.closePath();
    context.fill();

    context.beginPath();
    const points = 8;
    for (let index = 0; index < points * 2; index += 1) {
      const angle = index * Math.PI / points;
      const radius = index % 2 === 0 ? primitive.width * 1.35 : primitive.width * 0.48;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fillStyle = primitive.color;
    context.fill();
  }

  private drawSmoke(primitive: VfxPrimitive): void {
    const context = this.context;
    context.rotate(-primitive.rotation);
    context.fillStyle = radialGradient(context, 0, 0, primitive.size, primitive.color, primitive.secondaryColor);
    context.beginPath();
    context.arc(0, 0, primitive.size, 0, Math.PI * 2);
    context.fill();
  }

  private drawSpark(primitive: VfxPrimitive): void {
    const context = this.context;
    const gradient = context.createLinearGradient(-primitive.length, 0, primitive.length * 0.18, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.38, primitive.secondaryColor);
    gradient.addColorStop(1, primitive.color);
    context.strokeStyle = gradient;
    context.lineWidth = primitive.width;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-primitive.length, 0);
    context.lineTo(primitive.length * 0.18, 0);
    context.stroke();
  }

  private drawRing(primitive: VfxPrimitive): void {
    const context = this.context;
    context.scale(1, 0.72);
    context.strokeStyle = primitive.color;
    context.shadowColor = primitive.secondaryColor;
    context.shadowBlur = primitive.width * 2.4;
    context.lineWidth = Math.max(0.8, primitive.width);
    context.beginPath();
    context.arc(0, 0, primitive.size, 0, Math.PI * 2);
    context.stroke();
    context.shadowBlur = 0;
    context.globalAlpha *= 0.42;
    context.lineWidth = Math.max(0.5, primitive.width * 0.35);
    context.beginPath();
    context.arc(0, 0, primitive.size * 1.13, 0, Math.PI * 2);
    context.stroke();
  }

  private drawBeam(primitive: VfxPrimitive): void {
    const context = this.context;
    const gradient = context.createLinearGradient(0, 0, primitive.length, 0);
    gradient.addColorStop(0, primitive.color);
    gradient.addColorStop(0.5, primitive.secondaryColor);
    gradient.addColorStop(1, "transparent");
    context.strokeStyle = gradient;
    context.lineWidth = primitive.width;
    context.lineCap = "round";
    context.shadowColor = primitive.color;
    context.shadowBlur = primitive.width * 1.8;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(primitive.length, 0);
    context.stroke();
  }

  private drawProjectile(primitive: VfxPrimitive): void {
    const context = this.context;
    context.rotate(-primitive.rotation);
    context.fillStyle = radialGradient(context, 0, 0, primitive.size * 1.8, primitive.color, primitive.secondaryColor);
    context.beginPath();
    context.arc(0, 0, primitive.size * 1.8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = primitive.color;
    context.beginPath();
    context.arc(0, 0, primitive.size * 0.38, 0, Math.PI * 2);
    context.fill();
  }

  private drawTrail(primitive: VfxPrimitive): void {
    const context = this.context;
    const gradient = context.createLinearGradient(-primitive.length, 0, primitive.length * 0.2, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.7, primitive.secondaryColor);
    gradient.addColorStop(1, primitive.color);
    context.strokeStyle = gradient;
    context.lineWidth = primitive.width;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(-primitive.length, 0);
    context.quadraticCurveTo(-primitive.length * 0.28, primitive.size * 0.22, primitive.length * 0.15, 0);
    context.stroke();
  }

  private drawDebris(primitive: VfxPrimitive): void {
    const context = this.context;
    const gradient = context.createLinearGradient(-primitive.length / 2, 0, primitive.length / 2, 0);
    gradient.addColorStop(0, primitive.secondaryColor);
    gradient.addColorStop(1, primitive.color);
    context.fillStyle = gradient;
    context.fillRect(-primitive.length / 2, -primitive.width / 2, primitive.length, primitive.width);
  }

  private drawAnchors(anchors: Readonly<Record<string, VfxPoint>>): void {
    const context = this.context;
    context.save();
    context.font = "600 11px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.textAlign = "center";
    for (const [id, point] of Object.entries(anchors)) {
      context.strokeStyle = "rgba(103, 235, 255, 0.9)";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(point.x, point.y, 10, 0, Math.PI * 2);
      context.moveTo(point.x - 16, point.y);
      context.lineTo(point.x + 16, point.y);
      context.moveTo(point.x, point.y - 16);
      context.lineTo(point.x, point.y + 16);
      context.stroke();
      context.fillStyle = "rgba(8, 12, 20, 0.84)";
      context.fillRect(point.x - 54, point.y + 20, 108, 20);
      context.fillStyle = "#9cf7ff";
      context.fillText(id, point.x, point.y + 34);
    }
    context.restore();
  }

  private drawSafeFrame(): void {
    const context = this.context;
    context.save();
    context.strokeStyle = "rgba(224, 188, 104, 0.2)";
    context.setLineDash([7, 8]);
    context.strokeRect(24.5, 24.5, LOGICAL_WIDTH - 49, LOGICAL_HEIGHT - 49);
    context.restore();
  }
}
