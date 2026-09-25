import type { AttackId, FighterState, MatchState } from "../core/types";

/**
 * Swahili gunfire VFX: 5H (double-tap), 2L, 2M (both pistols), Crossdraw (both shots), the air contract bullet, Golden
 * Injunction's double shot and Grounded Verdict's contract blast. Presentation only; it reads the simulation's
 * move clock, so effects hold during hitstop and replay identically.
 *
 * Muzzle positions and aim directions were measured from each firing frame against a sim-unit grid
 * (x forward from the root, y up is negative). A whiffed tracer only travels a little past the move's real
 * hitbox reach, so the bullet never visibly passes through a body it did not hit. Moves that already bake their blast into the art
 * keep that blast and only gain bullets; Ceiling Tax and Default Judgment are intentionally absent.
 */
/** `flash: false` when the frame already bakes its own muzzle blast; only the bullets are added. */
interface GunShot { attack: AttackId; fireTick: number; muzzle: { x: number; y: number }; dir: { x: number; y: number }; range: number; flash?: false;
  /** Fires on the move's damage tick: it hit a standing body even if that same hit knocks the victim down. */
  contact?: true; }
type World = { x: (x: number) => number; y: (y: number) => number };

const norm = (x: number, y: number) => { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; };
export const SWAHILI_GUN_SHOTS: GunShot[] = [
  // 5H: both pistols fire on the damage tick while the arms extend, then a double-tap from full extension.
  { attack: "standing_heavy", fireTick: 8, muzzle: { x: 92, y: -131 }, dir: { x: 1, y: 0 }, range: 180, contact: true },
  { attack: "standing_heavy", fireTick: 8, muzzle: { x: 55, y: -137 }, dir: { x: 1, y: 0 }, range: 180, contact: true },
  { attack: "standing_heavy", fireTick: 11, muzzle: { x: 113, y: -126 }, dir: { x: 1, y: 0 }, range: 180 },
  { attack: "standing_heavy", fireTick: 11, muzzle: { x: 78, y: -132 }, dir: { x: 1, y: 0 }, range: 180 },
  { attack: "crouching_light", fireTick: 4, muzzle: { x: 92, y: -100 }, dir: { x: 1, y: 0 }, range: 130, contact: true },
  { attack: "crouching_medium", fireTick: 6, muzzle: { x: 103, y: -117 }, dir: { x: 1, y: 0 }, range: 170, contact: true },
  { attack: "crouching_medium", fireTick: 6, muzzle: { x: -105, y: -114 }, dir: { x: -1, y: 0 }, range: 170, contact: true },
  { attack: "special_down_medium", fireTick: 25, muzzle: { x: 86, y: -122 }, dir: { x: 1, y: 0 }, range: 230, contact: true },
  { attack: "special_down_medium", fireTick: 40, muzzle: { x: 46, y: -90 }, dir: norm(0.88, 0.47), range: 240, contact: true },
  { attack: "special_air_light", fireTick: 7, muzzle: { x: 70, y: -82 }, dir: norm(0.75, 0.66), range: 180, contact: true },
  // Golden Injunction: the double shot from both stacked pistols, bullets out of the baked blast.
  { attack: "special_neutral_heavy", fireTick: 30, muzzle: { x: 10, y: -118 }, dir: { x: 1, y: 0 }, range: 300, flash: false, contact: true },
  { attack: "special_neutral_heavy", fireTick: 31, muzzle: { x: 12, y: -108 }, dir: { x: 1, y: 0 }, range: 300, flash: false, contact: true },
  // Grounded Verdict contract blast: both pistols fire on the damage tick (no baked flash on that frame),
  // then a second volley rides the art's own baked blast.
  { attack: "special_down_heavy", fireTick: 49, muzzle: { x: 49, y: -129 }, dir: { x: 1, y: 0 }, range: 240, contact: true },
  { attack: "special_down_heavy", fireTick: 49, muzzle: { x: 82, y: -125 }, dir: { x: 1, y: 0 }, range: 240, contact: true },
  { attack: "special_down_heavy", fireTick: 55, muzzle: { x: 46, y: -127 }, dir: { x: 1, y: 0 }, range: 240, flash: false },
  { attack: "special_down_heavy", fireTick: 56, muzzle: { x: 58, y: -121 }, dir: { x: 1, y: 0 }, range: 240, flash: false }
];

const FLASH_TICKS = 4, TRACER_TICKS = 6, SMOKE_TICKS = 18, CASING_TICKS = 16, BULLET_SPEED = 120;

/** Distance along the lane to the opponent's near body edge, or null when the lane misses the body. */
function impactDistance(origin: { x: number; y: number }, dir: { x: number; y: number }, range: number, target: FighterState, standing = false): number | null {
  const halfWidth = 28, side = Math.sign(dir.x || 1), near = target.x - side * halfWidth, far = target.x + side * halfWidth;
  if (Math.abs(dir.x) < 0.01) return null;
  // A downed or crouching body is shorter; bullets at chest height fly over it.
  const height = standing ? 182 : target.phase === "knockdown" || target.phase === "getup" ? 60 : target.phase === "crouch" || target.crouchBlocking ? 110 : 182;
  const inBody = (t: number) => { const y = origin.y + dir.y * t; return y >= target.y - height && y <= target.y + 4; };
  const tNear = (near - origin.x) / dir.x, tFar = (far - origin.x) / dir.x;
  // Point blank: the muzzle already sits inside the body outline, so the shot lands at the barrel.
  if (tNear <= 0 && tFar > 0) return inBody(0) ? 0 : null;
  if (tNear <= 0 || tNear > range) return null;
  return inBody(tNear) ? tNear : null;
}

export function drawSwahiliGunfire(context: CanvasRenderingContext2D, fighter: FighterState, state: MatchState, world: World, worldScale: number) {
  if (fighter.phase !== "attack" || !fighter.currentAttack) return;
  const opponent = state.fighters[fighter.id === "p1" ? "p2" : "p1"];
  const facing = fighter.attackFacing;
  for (const shot of SWAHILI_GUN_SHOTS) {
    if (shot.attack !== fighter.currentAttack) continue;
    const age = fighter.phaseTick - shot.fireTick;
    if (age < 0 || age > SMOKE_TICKS) continue;
    const origin = { x: fighter.x + shot.muzzle.x * facing, y: fighter.y + shot.muzzle.y };
    const dir = { x: shot.dir.x * facing, y: shot.dir.y };
    // The bullet never draws through a body in its lane; sparks only mark a real hit or block.
    const struck = fighter.attackConnected || fighter.attackBlocked;
    const bodyDistance = impactDistance(origin, dir, shot.range, opponent, !!shot.contact && fighter.attackConnected);
    const impact = struck ? bodyDistance : null;
    const travel = bodyDistance ?? shot.range;
    context.save();
    drawSmoke(context, origin, dir, age, world, worldScale);
    context.globalCompositeOperation = "lighter";
    if (age <= TRACER_TICKS) drawTracer(context, origin, dir, travel, age, world, worldScale);
    if (shot.flash !== false && age <= FLASH_TICKS) drawMuzzleFlash(context, origin, dir, age, world, worldScale);
    if (impact !== null && age <= 7) {
      // Sparks sit on the body as it is now: a blast that drops the victim bursts on the fallen torso.
      const bodyTop = opponent.phase === "knockdown" || opponent.phase === "getup" ? opponent.y - 40 : opponent.y - 182;
      drawImpact(context, { x: origin.x + dir.x * impact, y: Math.max(origin.y + dir.y * impact, bodyTop) }, dir, age, fighter.attackBlocked, world, worldScale);
    }
    context.globalCompositeOperation = "source-over";
    if (age <= CASING_TICKS && fighter.grounded) drawCasing(context, origin, facing, age, fighter.y, world, worldScale);
    context.restore();
  }
}

function drawMuzzleFlash(ctx: CanvasRenderingContext2D, origin: { x: number; y: number }, dir: { x: number; y: number }, age: number, world: World, scale: number) {
  const fade = 1 - age / (FLASH_TICKS + 1), px = world.x(origin.x), py = world.y(origin.y);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(dir.y, dir.x));
  const r = (age === 0 ? 17 : 13 - age * 2) * scale;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.9);
  glow.addColorStop(0, `rgba(255,252,236,${fade})`);
  glow.addColorStop(0.3, `rgba(255,214,120,${0.85 * fade})`);
  glow.addColorStop(0.7, `rgba(214,92,38,${0.45 * fade})`);
  glow.addColorStop(1, "rgba(120,20,10,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(r * 0.35, 0, r * 1.9, 0, Math.PI * 2); ctx.fill();
  // Forward-weighted star: the long spike reads as the shot leaving the barrel.
  const spikes: Array<[number, number, number]> = [[0, 42, 5], [0.55, 20, 3.4], [-0.55, 20, 3.4], [1.35, 11, 2.4], [-1.35, 11, 2.4], [Math.PI, 8, 2.4]];
  ctx.fillStyle = `rgba(255,236,176,${fade})`;
  for (const [angle, length, width] of spikes) {
    ctx.save(); ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -width * scale); ctx.lineTo(length * scale * (age === 0 ? 1 : 0.75), 0); ctx.lineTo(0, width * scale);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255,255,255,${fade})`;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawTracer(ctx: CanvasRenderingContext2D, origin: { x: number; y: number }, dir: { x: number; y: number }, travel: number, age: number, world: World, scale: number) {
  const head = Math.min(travel, BULLET_SPEED * (age + 1));
  const tail = Math.max(0, head - 90);
  const at = (d: number) => ({ x: world.x(origin.x + dir.x * d), y: world.y(origin.y + dir.y * d) });
  const lineFade = 1 - age / (TRACER_TICKS + 1);
  // Lingering lane: a thin brass line along the full path so the bullet's route stays readable.
  const start = at(0), end = at(head);
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(233,190,104,${0.35 * lineFade})`;
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  if (BULLET_SPEED * age > travel + 40) return;
  // Hot streak with a white head.
  const a = at(tail), b = at(head);
  const streak = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
  streak.addColorStop(0, "rgba(214,120,40,0)");
  streak.addColorStop(0.65, "rgba(255,206,110,0.9)");
  streak.addColorStop(1, "rgba(255,255,244,1)");
  ctx.strokeStyle = streak;
  ctx.lineWidth = 4.2 * scale;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,250,0.95)";
  ctx.beginPath(); ctx.arc(b.x, b.y, 3.2 * scale, 0, Math.PI * 2); ctx.fill();
}

function drawImpact(ctx: CanvasRenderingContext2D, point: { x: number; y: number }, dir: { x: number; y: number }, age: number, blocked: boolean, world: World, scale: number) {
  const px = world.x(point.x), py = world.y(point.y), fade = 1 - age / 8;
  const core = blocked ? "220,236,255" : "255,236,190", hot = blocked ? "150,190,255" : "236,96,44";
  const burst = ctx.createRadialGradient(px, py, 0, px, py, (16 + age * 3) * scale);
  burst.addColorStop(0, `rgba(${core},${fade})`);
  burst.addColorStop(0.5, `rgba(${hot},${0.55 * fade})`);
  burst.addColorStop(1, `rgba(${hot},0)`);
  ctx.fillStyle = burst;
  ctx.beginPath(); ctx.arc(px, py, (16 + age * 3) * scale, 0, Math.PI * 2); ctx.fill();
  // Shards spray back along the incoming lane and outward.
  const base = Math.atan2(-dir.y, -dir.x);
  ctx.strokeStyle = `rgba(${core},${fade})`;
  ctx.lineWidth = 2 * scale;
  for (let i = 0; i < 7; i++) {
    const angle = base + (i - 3) * 0.42, inner = (4 + age * 4) * scale, outer = inner + (10 - i % 3 * 3) * scale;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(angle) * inner, py + Math.sin(angle) * inner);
    ctx.lineTo(px + Math.cos(angle) * outer, py + Math.sin(angle) * outer);
    ctx.stroke();
  }
}

function drawSmoke(ctx: CanvasRenderingContext2D, origin: { x: number; y: number }, dir: { x: number; y: number }, age: number, world: World, scale: number) {
  if (age < 1) return;
  const life = age / SMOKE_TICKS;
  for (let i = 0; i < 3; i++) {
    const drift = 6 + i * 7;
    const x = origin.x + dir.x * drift + i * 2, y = origin.y - age * (0.9 + i * 0.25) - i * 3;
    const r = (5 + age * (0.9 + i * 0.3)) * scale;
    const alpha = 0.28 * (1 - life) * (1 - i * 0.22);
    const puff = ctx.createRadialGradient(world.x(x), world.y(y), 0, world.x(x), world.y(y), r);
    puff.addColorStop(0, `rgba(196,190,182,${alpha})`);
    puff.addColorStop(1, "rgba(120,114,108,0)");
    ctx.fillStyle = puff;
    ctx.beginPath(); ctx.arc(world.x(x), world.y(y), r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCasing(ctx: CanvasRenderingContext2D, origin: { x: number; y: number }, facing: 1 | -1, age: number, floorY: number, world: World, scale: number) {
  // A brass casing kicks up and back out of the ejection port, then drops to the floor.
  const t = age, vx = -2.2 * facing, vy = -5.5, gravity = 0.9;
  const x = origin.x - 18 * facing + vx * t;
  const y = Math.min(floorY - 2, origin.y + vy * t + 0.5 * gravity * t * t);
  ctx.save();
  ctx.translate(world.x(x), world.y(y));
  ctx.rotate(t * 0.9 * facing);
  ctx.fillStyle = `rgba(214,170,84,${1 - Math.max(0, t - 10) / 6})`;
  ctx.fillRect(-3 * scale, -1.3 * scale, 6 * scale, 2.6 * scale);
  ctx.restore();
}
