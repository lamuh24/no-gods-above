import { FighterId } from "../core/types";
import { ActiveCinematic, CameraPose, CameraRigSnapshot, CinematicContext, StageMatchState, StageProductionContract, Vec3Tuple } from "./types";

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function smoothstep(value: number) { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); }
function clonePose(pose: CameraPose): CameraPose { return { position: [...pose.position] as Vec3Tuple, target: [...pose.target] as Vec3Tuple, mode: pose.mode, context: pose.context }; }
function blendPose(from: CameraPose, to: CameraPose, amount: number, mode: CameraPose["mode"], context: CinematicContext | null): CameraPose {
  return {
    position: from.position.map((value, index) => lerp(value, to.position[index], amount)) as Vec3Tuple,
    target: from.target.map((value, index) => lerp(value, to.target[index], amount)) as Vec3Tuple,
    mode,
    context
  };
}

interface ReturningState { startTick: number; from: CameraPose; }

export class StageCameraRig {
  private pose: CameraPose;
  private active: ActiveCinematic | null = null;
  private returning: ReturningState | null = null;
  private lastTick = -1;

  constructor(private readonly contract: StageProductionContract) {
    this.pose = { position: [...contract.camera.defaultPosition], target: [...contract.camera.defaultTarget], mode: "gameplay", context: null };
  }

  update(state: StageMatchState, aspect: number): CameraPose {
    const gameplay = this.gameplayPose(state, aspect);
    if (state.tick < this.lastTick) this.snapToGameplay(state, aspect);
    if (this.active) {
      const shot = this.contract.cinematicCameras.shots[this.active.context];
      const elapsed = state.tick - this.active.startTick;
      if (elapsed >= this.active.durationTicks) {
        const finalShot = this.cinematicPose(state, this.active, aspect);
        this.returning = { startTick: this.active.startTick + this.active.durationTicks, from: finalShot };
        this.active = null;
      } else {
        const target = this.cinematicPose(state, this.active, aspect);
        const entrance = smoothstep(elapsed / Math.min(8, Math.max(1, this.active.durationTicks / 3)));
        this.pose = blendPose(this.active.from, target, entrance, "cinematic", this.active.context);
        this.lastTick = state.tick;
        return clonePose(this.pose);
      }
    }
    if (this.returning) {
      const elapsed = state.tick - this.returning.startTick;
      const duration = this.contract.camera.returnToGameplay.ticks;
      if (elapsed >= duration) this.returning = null;
      else {
        this.pose = blendPose(this.returning.from, gameplay, smoothstep(elapsed / duration), "returning", null);
        this.lastTick = state.tick;
        return clonePose(this.pose);
      }
    }
    const tickDelta = this.lastTick < 0 ? 1 : Math.max(0, state.tick - this.lastTick);
    const alpha = tickDelta === 0 ? 0 : 1 - Math.pow(1 - this.contract.camera.framing.fixedTickSmoothingAlpha, tickDelta);
    this.pose = this.lastTick < 0 ? gameplay : blendPose(this.pose, gameplay, alpha, "gameplay", null);
    this.lastTick = state.tick;
    return clonePose(this.pose);
  }

  startCinematic(context: CinematicContext, attackerId: FighterId, state: StageMatchState, aspect: number, moveAuthoredDurationTicks?: number) {
    if (!this.contract.cinematicCameras.allowedContexts.includes(context)) throw new Error(`Cinematic context ${context} is not permitted by the stage contract`);
    const durationTicks = moveAuthoredDurationTicks ?? this.contract.cinematicCameras.shots[context].durationTicks;
    if (!Number.isInteger(durationTicks) || durationTicks <= 0) throw new Error("Cinematic duration must be a positive fixed-tick integer");
    this.update(state, aspect);
    this.returning = null;
    this.active = { context, attackerId, startTick: state.tick, durationTicks, from: clonePose(this.pose) };
  }

  abort(state: StageMatchState, rollback = false, aspect = 16 / 9) {
    if (rollback) {
      this.active = null;
      this.returning = null;
      this.snapToGameplay(state, aspect);
      return;
    }
    if (this.active) {
      this.returning = { startTick: state.tick, from: clonePose(this.pose) };
      this.active = null;
    }
  }

  snapToGameplay(state: StageMatchState, aspect: number) {
    this.active = null;
    this.returning = null;
    this.pose = this.gameplayPose(state, aspect);
    this.lastTick = state.tick;
    return clonePose(this.pose);
  }

  snapshot(): CameraRigSnapshot { return { pose: clonePose(this.pose), active: this.active ? { ...this.active, from: clonePose(this.active.from) } : null, lastTick: this.lastTick }; }

  private gameplayPose(state: StageMatchState, aspect: number): CameraPose {
    const scale = this.contract.combatPlane.simulationPixelsToWorldUnits;
    const roots = [state.fighters.p1, state.fighters.p2].map((fighter) => ({ x: fighter.x * scale, y: -fighter.y * scale }));
    const midpoint = (roots[0].x + roots[1].x) / 2;
    const separation = Math.abs(roots[0].x - roots[1].x);
    const highestRoot = Math.max(roots[0].y, roots[1].y);
    const verticalFov = this.contract.camera.fovDegrees * Math.PI / 180;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(0.5, aspect));
    const neededDistance = (separation / 2 + this.contract.camera.framing.fighterPaddingWorld) / Math.tan(horizontalFov / 2);
    const jumpDistance = this.contract.camera.zoom.minDistance + Math.max(0, highestRoot - 1) * 0.7;
    const distance = clamp(Math.max(neededDistance, jumpDistance), this.contract.camera.zoom.minDistance, this.contract.camera.zoom.maxDistance);
    const safe = this.contract.combatPlane.cameraSafeRegion;
    const targetX = clamp(midpoint, safe.left, safe.right);
    const targetY = this.contract.camera.framing.verticalRootBiasWorld + clamp(highestRoot * 0.42, 0, 1.8);
    return { position: [targetX, targetY + 2.3, distance], target: [targetX, targetY, 0], mode: "gameplay", context: null };
  }

  private cinematicPose(state: StageMatchState, active: ActiveCinematic, aspect: number): CameraPose {
    const gameplay = this.gameplayPose(state, aspect);
    const shot = this.contract.cinematicCameras.shots[active.context];
    const attacker = state.fighters[active.attackerId];
    const defender = state.fighters[active.attackerId === "p1" ? "p2" : "p1"];
    const scale = this.contract.combatPlane.simulationPixelsToWorldUnits;
    const centerX = (attacker.x + defender.x) * 0.5 * scale;
    const highestRoot = Math.max(-attacker.y * scale, -defender.y * scale);
    const authoredTargetY = Math.max(1.8, highestRoot * 0.35) + shot.targetOffset[1];
    const visibilitySafeTargetY = Math.min(authoredTargetY, gameplay.target[1] + 0.85);
    const target: Vec3Tuple = [centerX + shot.targetOffset[0] * attacker.facing, visibilitySafeTargetY, shot.targetOffset[2]];
    const separationDistance = Math.abs(attacker.x - defender.x) * scale + 7;
    const z = clamp(Math.max(shot.minDistance, gameplay.position[2] + shot.positionOffset[2], separationDistance), shot.minDistance, this.contract.camera.zoom.maxDistance);
    const position: Vec3Tuple = [target[0] + shot.positionOffset[0] * attacker.facing, target[1] + shot.positionOffset[1], z];
    return { position, target, mode: "cinematic", context: active.context };
  }
}
