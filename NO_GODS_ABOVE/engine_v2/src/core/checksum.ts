import { MatchState } from "./types";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) out[key] = stable((value as Record<string, unknown>)[key]);
    return out;
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stable(value));
}

export function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function checksumState(state: MatchState): string {
  const { checksums, matchId, matchConfig, throwInteraction, lastThrowEvent, presentationEventLedger, ...legacyCompatible } = state;
  const fighters = Object.fromEntries(Object.entries(legacyCompatible.fighters).map(([id, fighter]) => {
    const { victimClass, throwInstanceCounter, throwRotation, moveInstanceCounter, currentMoveInstance, turnStartingFacing, ...legacyFighter } = fighter;
    return [id, legacyFighter];
  }));
  const throwExtensionActive = !!throwInteraction || !!lastThrowEvent || presentationEventLedger.length > 0
    || Object.values(state.fighters).some((fighter) => fighter.throwInstanceCounter !== 0 || fighter.throwRotation !== 0 || fighter.victimClass !== "standard_humanoid");
  const projection: Record<string, unknown> = { ...legacyCompatible, fighters };
  // Preserve all pre-throw fixture checksums byte-for-byte. Once the additive throw system is
  // actually used, its complete deterministic state joins the checksum projection.
  if (throwExtensionActive) {
    projection.throwSystem = {
      matchId, throwInteraction, lastThrowEvent, presentationEventLedger,
      fighters: Object.fromEntries(Object.entries(state.fighters).map(([id, fighter]) => [id, {
        victimClass: fighter.victimClass, throwInstanceCounter: fighter.throwInstanceCounter, throwRotation: fighter.throwRotation,
        moveInstanceCounter: fighter.moveInstanceCounter, currentMoveInstance: fighter.currentMoveInstance
      }]))
    };
  }
  const turnExtensionActive = Object.values(state.fighters).some((fighter) => fighter.phase === "turn" || fighter.turnStartingFacing !== undefined);
  if (turnExtensionActive) {
    projection.turnSystem = {
      fighters: Object.fromEntries(Object.entries(state.fighters).map(([id, fighter]) => [id, {
        startingFacing: fighter.turnStartingFacing ?? null,
        gameplayFacing: fighter.facing,
        phase: fighter.phase,
        phaseTick: fighter.phaseTick
      }]))
    };
  }
  const projectileExtensionActive = state.projectileSpawnLedger !== undefined
    || Object.values(state.fighters).some((fighter) => fighter.currentAttack?.startsWith("legacy_celestial_palm_") || fighter.currentAttack === "legacy_ascend_step_heavy");
  if (projectileExtensionActive) {
    // Projectile entities/ledgers already join legacyCompatible above. Include the source instance
    // counters from startup onward too: they determine future release ids and contact ownership.
    projection.projectileSources = {
      matchId,
      fighters: Object.fromEntries(Object.entries(state.fighters).map(([id, fighter]) => [id, {
        moveInstanceCounter: fighter.moveInstanceCounter, currentMoveInstance: fighter.currentMoveInstance
      }]))
    };
  }
  const diveExtensionActive = Object.values(state.fighters).some((fighter) => fighter.airDiveUsed
    || fighter.currentAttack?.startsWith("legacy_radiant_dive_"));
  if (diveExtensionActive) {
    // The future single-contact event is already determined during windup. Include
    // its source counters now, including interrupted/RC'd dives before floor contact,
    // without changing the checksum representation of any pre-dive fixture.
    projection.diveSources = {
      matchId,
      fighters: Object.fromEntries(Object.entries(state.fighters).map(([id, fighter]) => [id, {
        moveInstanceCounter: fighter.moveInstanceCounter, currentMoveInstance: fighter.currentMoveInstance
      }]))
    };
  }
  if (Object.values(state.fighters).some(fighter => fighter.currentAttack === "legacy_divine_vanish_heavy")) {
    projection.divineCounterSources = { matchId, fighters: Object.fromEntries(Object.entries(state.fighters).map(([id, fighter]) => [id, {
      moveInstanceCounter: fighter.moveInstanceCounter, currentMoveInstance: fighter.currentMoveInstance
    }])) };
  }
  return fnv1a(stableStringify(projection));
}
