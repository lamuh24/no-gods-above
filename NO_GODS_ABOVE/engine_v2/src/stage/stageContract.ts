import rawContract from "./stage_vertical_slice_v1.json";
import { StageProductionContract } from "./types";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid NGA stage contract: ${message}`);
}

export function validateStageContract(value: unknown): StageProductionContract {
  invariant(!!value && typeof value === "object" && !Array.isArray(value), "root must be an object");
  const candidate = value as Partial<StageProductionContract>;
  invariant(candidate.schemaVersion === "2.2.0-stage-contract", "schemaVersion mismatch");
  invariant(candidate.id === "stage_vertical_slice_v1", "unexpected vertical-slice id");
  invariant(candidate.authority?.gameplayPlane === "deterministic_2d", "2D gameplay plane must remain authoritative");
  invariant(candidate.authority?.renderingMayAffectGameplay === false, "rendering must not affect gameplay");
  invariant(candidate.combatPlane?.simulationPixelsToWorldUnits === 0.02, "simulation scale must match Engine V2 debug plane");
  invariant(candidate.combatPlane.worldBounds.left === candidate.combatPlane.simulationBounds.left * candidate.combatPlane.simulationPixelsToWorldUnits, "left world bound must map from simulation");
  invariant(candidate.combatPlane.worldBounds.right === candidate.combatPlane.simulationBounds.right * candidate.combatPlane.simulationPixelsToWorldUnits, "right world bound must map from simulation");
  invariant(candidate.collision?.renderGeometryAuthoritative === false, "render geometry cannot be authoritative");
  invariant(candidate.collision?.hazards === "prohibited", "test stage hazards must be prohibited");
  invariant(candidate.camera?.strategy === "constrained_perspective", "camera strategy mismatch");
  invariant(candidate.camera.zoom.minDistance < candidate.camera.zoom.maxDistance, "zoom limits invalid");
  invariant(candidate.spriteIntegration?.canonicalFacing === "authored_screen_right", "canonical facing mismatch");
  invariant(candidate.validation?.deterministicReplayRequired === true, "deterministic replay validation required");
  return candidate as StageProductionContract;
}

export const stageVerticalSliceContract = validateStageContract(rawContract);
