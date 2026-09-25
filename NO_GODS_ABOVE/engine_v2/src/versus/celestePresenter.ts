import { CELESTE_SPATIAL_SCALE as SIZE } from '../data/celesteSpatial';
import type { FighterState, MatchState, FighterId } from '../core/types';
import { CelesteSprites } from '../celeste/sprites';
import { ROSTER, WORLD_SCALE } from './roster';
import type { Presenter, WorldMap, CoverageRow } from './presentation';

/** Character-owned atlas presentation; simulation remains the source of motion. */
export class CelestePresenter implements Presenter {
 readonly character=ROSTER.celeste;
 private sprites=new CelesteSprites();
 private origin?:{fighter:FighterState;instance:number;x:number;y:number;facing:number};
 async preload(progress?:(done:number,total:number)=>void){progress?.(0,1);await this.sprites.load();progress?.(1,1)}
 draw(ctx:CanvasRenderingContext2D,f:FighterState,state:MatchState,world:WorldMap){
  let [id,t,loop,pf]=this.sprites.choose(f,state.tick);
  let facing=pf??(f.phase==='attack'||(f.phase==='landing'&&f.celesteLandingRecovery)?f.attackFacing:f.facing);
  const it=state.throwInteraction;
  if(it?.defender===f.id&&it.result==='connected'){
   id=it.released&&f.grounded&&Math.abs(f.throwRotation)<1?'knockdown':it.released?'hurt_air':'hurt_heavy';
   ctx.save();ctx.translate(world.x(f.x),world.y(f.y));ctx.rotate(f.throwRotation*Math.PI/180);
   this.sprites.draw(ctx,id,f.phaseTick,0,0,f.facing,WORLD_SCALE*SIZE);ctx.restore();return;
  }
  if(it?.attacker===f.id&&it.result!=='whiff'){
   const back=it.throwId==='back_throw';id=it.result==='connected'?(back?'reverse_waltz':'downbeat_dismissal'):(back?'reverse_reach':'downbeat_reach');
   t=it.tick;loop=false;facing=it.startingFacing;
  }
  if(id==='curtain_call'&&f.phase==='attack'){
   if(!this.origin||this.origin.fighter!==f||this.origin.instance!==f.currentMoveInstance)this.origin={fighter:f,instance:f.currentMoveInstance,x:f.x,y:f.y,facing};
   if(t>=4&&t<29){ctx.save();ctx.globalAlpha=t<11?.28:.55*Math.min(1,(29-t)/10);ctx.filter='grayscale(1) sepia(1) saturate(3) hue-rotate(160deg) brightness(1.3)';
    this.sprites.draw(ctx,id,Math.min(t,10),world.x(this.origin.x),world.y(this.origin.y),this.origin.facing,WORLD_SCALE*SIZE);ctx.restore();}
  }else this.origin=undefined;
  this.sprites.draw(ctx,id,t,world.x(f.x),world.y(f.y),facing,WORLD_SCALE*SIZE,loop);
 }
 drawProjectile(ctx:CanvasRenderingContext2D,p:any,world:WorldMap,scale:number){
  const trap=p.attackId.startsWith('encore_'),id=trap?'ti_note':'sol_note';
  ctx.save();ctx.translate(world.x(p.x),world.y(p.y));
  if(trap){ctx.globalAlpha=p.ageTicks<24?.48:1;const pulse=p.ageTicks<24?0:p.ageTicks<42?1:p.ageTicks<60?2:3;ctx.strokeStyle='#d8c9f0';ctx.lineWidth=1.6;for(let n=0;n<pulse;n++){ctx.beginPath();ctx.arc(0,0,(18+n*5)*scale*SIZE,0,Math.PI*2);ctx.stroke();}}
  if(p.attackId==='ovation_descant')ctx.rotate(p.facing*Math.PI/4);
  const size=p.attackId==='ovation_staccato'?.7:p.attackId==='ovation_fortissimo'?1.45:1;
  this.sprites.draw(ctx,id,p.ageTicks,0,0,p.facing,scale*size*SIZE,true);ctx.restore();return true;
 }
 drawEffects(ctx:CanvasRenderingContext2D,state:MatchState,world:WorldMap,scale:number,side?:FighterId){
  if(!side)return;const f=state.fighters[side];
  if(f.currentAttack==='octava'&&f.phase==='attack'&&f.phaseTick>=28&&f.phaseTick<46)
   this.sprites.drawEffectRect(ctx,'octava_beam',f.phaseTick,world.x(f.x+15*SIZE*f.attackFacing),world.y(f.y-140*SIZE),620*scale*SIZE,110*scale*SIZE,f.attackFacing);
  const e=state.lastProjectileEvent;
  if(e?.owner===side&&e.attackId.startsWith('encore_')&&['hit','block'].includes(e.type)&&state.tick-e.tick<=3)
   this.sprites.draw(ctx,'ti_note',60,world.x(e.x),world.y(e.y),f.attackFacing,scale*SIZE);
 }
 coverage():CoverageRow[]{return [{label:'Celeste',status:'animated',detail:'All 30 attacks; movement, defense and recovery. Accepted animation set; actual opponent in throws.'}]}
 moveList(){return [
  ['J / K / L','Standing normals'],['S + J / K / L','Crouching normals'],['Air J / K / L','Air normals'],
  ['I / Back + I','Downbeat Dismissal / Reverse Waltz'],
  ['U + J / K / L','Staccato / Procession / Fortissimo'],
  ['Forward + U + J / K / L','Quickstep Beat / Crescendo Slash / Curtain Call'],
  ['Back + U + J / K / L','Waltz Retreat / Reversal Measure / Broken Tempo'],
  ['S + U + J / K / L','Encore Near / Reach / Balcony'],
  ['W + U + J / K / L','Rising Note / Ascending Aria / Grand Crescendo'],
  ['Air U + J / K / L','Strobe Air Waltz / Ovation Descant / Finale Reprise'],
  ['P · 100 Tension','Octava: Seventh Symphony']
 ].map(([command,name])=>({command,name,animated:true}))}
}
