import type {AttackDefinition,CombatTuning,MovementTuning,Rect,StrikeHitbox,ThrowDefinition} from '../core/types';

/** Main-roster conversion only. Standalone Celeste authoring remains at 110 units. */
export const CELESTE_NATIVE_BODY_UNITS=110;
export const CELESTE_BODY_UNITS=182;
export const CELESTE_SPATIAL_SCALE=CELESTE_BODY_UNITS/CELESTE_NATIVE_BODY_UNITS;
const s=CELESTE_SPATIAL_SCALE;
export function celesteRect(r:Rect):Rect{return {x:r.x*s,y:r.y*s,w:r.w*s,h:r.h*s}}
function hit(h:StrikeHitbox):StrikeHitbox{return {...h,rect:celesteRect(h.rect),knockbackX:h.knockbackX*s,knockbackY:h.knockbackY*s}}
export function scaleCelesteAttack(a:AttackDefinition):AttackDefinition{
 const out:AttackDefinition={...a,hitboxes:a.hitboxes.map(hit)};
 if(a.rootMotion)out.rootMotion={...a.rootMotion,velocity:a.rootMotion.velocity*s};
 if(a.rootMotionSegments)out.rootMotionSegments=a.rootMotionSegments.map(r=>({...r,velocity:r.velocity*s}));
 if(a.projectile){const p=a.projectile;out.projectile={...p,spawnOffset:{x:p.spawnOffset.x*s,y:p.spawnOffset.y*s},releaseSweepStartX:p.releaseSweepStartX*s,speed:p.speed*s,gravity:p.gravity*s,maxTravel:p.maxTravel*s,hitbox:hit(p.hitbox),...(p.initialVelocityY===undefined?{}:{initialVelocityY:p.initialVelocityY*s})};}
 return out;
}
export function scaleCelesteThrow(t:ThrowDefinition):ThrowDefinition{return {...t,range:t.range*s,heightTolerance:t.heightTolerance*s,track:t.track.map(p=>({...p,attackerOffsetX:p.attackerOffsetX*s,attackerOffsetY:p.attackerOffsetY*s,victimOffsetX:p.victimOffsetX*s,victimOffsetY:p.victimOffsetY*s}))}}
export function scaleCelesteMovement(m:MovementTuning):MovementTuning{
 return {...m,walkForward:m.walkForward*s,walkBackward:m.walkBackward*s,dashSpeed:m.dashSpeed*s,backdashSpeed:m.backdashSpeed*s,jumpVelocity:m.jumpVelocity*s,forwardJumpVelocityX:m.forwardJumpVelocityX*s,backJumpVelocityX:m.backJumpVelocityX*s,airControl:m.airControl*s,airDashForwardSpeed:m.airDashForwardSpeed*s,airDashBackwardSpeed:m.airDashBackwardSpeed*s,gravity:m.gravity*s};
}
export function scaleCelesteCombat(c:CombatTuning):CombatTuning{return {...c,airTechHorizontalSpeed:c.airTechHorizontalSpeed*s,airTechVerticalSpeed:c.airTechVerticalSpeed*s,burstPushback:c.burstPushback*s}}
