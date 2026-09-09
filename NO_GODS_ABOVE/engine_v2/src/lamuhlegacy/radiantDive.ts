import { currentAuthoredDive, resolveAttackDefinition } from '../core/engine';
import { FighterState, MatchState } from '../core/types';

// Presentation samples explicit simulation stages. Air height never comes from art.
// Source slots: chamber, connector, contact, gather, catch, settle, idle.
export function radiantDiveFrame(fighter: FighterState, state: MatchState): number | null {
  const dive = currentAuthoredDive(fighter, state);
  if (!dive) return null;
  const attack = resolveAttackDefinition(fighter);
  if (!attack) return null;
  if (dive.stage === 'windup') return dive.stageTick < Math.ceil(attack.startup * .6) ? 0 : 1;
  if (dive.stage === 'strike') return 2;
  if (dive.stage === 'gather') return 3;
  const fraction = dive.stageTick / dive.landingRecoveryTicks;
  return fraction < .4 ? 4 : fraction < .8 ? 5 : 6;
}
