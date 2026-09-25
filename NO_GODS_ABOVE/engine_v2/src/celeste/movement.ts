import type {FighterState} from '../core/types';

export type SpriteChoice=[string,number,boolean,number?];
type Track={fighter:FighterState;tick:number;phase:string;phaseTick:number;facing:number;crouched:boolean;hitstop:number;segment:string;segmentTick:number;overlay?:{id:'turn'|'crouch_release';tick:number;facing:number};choice:SpriteChoice|null};

/** Cosmetic state only: never extends a combat state or changes its facing. */
export class MovementPresentation {
  private tracks=new Map<string,Track>();
  reset(){this.tracks.clear()}
  choose(f:FighterState,tick:number):SpriteChoice|null{
    let old=this.tracks.get(f.id);
    if(old&&(old.fighter!==f||tick<old.tick)){this.tracks.delete(f.id);old=undefined}
    if(old?.tick===tick)return old.choice;
    const elapsed=old?Math.max(0,tick-old.tick):0;
    const crouched=f.phase==='crouch'||f.crouchBlocking;
    let overlay=old?.overlay;
    // Immediate actions and walking always outrank an idle-only cosmetic transition.
    if(f.phase!=='idle'||f.blocking||f.health<=0)overlay=undefined;
    else if(old){
      if(old.facing!==f.facing)overlay={id:'turn',tick:0,facing:old.facing};
      else if(old.crouched)overlay={id:'crouch_release',tick:0,facing:f.facing};
      else if(overlay&&old.hitstop===0)overlay={...overlay,tick:overlay.tick+elapsed};
      if(overlay&&overlay.tick>=(overlay.id==='turn'?12:8))overlay=undefined;
    }
    let segment='',segmentTick=0,choice:SpriteChoice|null=null;
    if(overlay)choice=[overlay.id,overlay.tick,false,overlay.facing];
    else if(f.phase==='roman_cancel')choice=['roman_cancel',Math.max(0,4-f.romanCancelTicks-1),false];
    else if(f.phase==='burst')choice=['burst',Math.max(0,20-f.burstTicks),false];
    else if(f.phase==='air_recovery')choice=['air_recovery',Math.max(0,6-f.airRecoveryTicks),false];
    else if(f.phase==='jump'){
      if(f.recoveryEvent?.type==='air_tech'&&f.airTechInvuln>0){
        choice=['air_tech',Math.max(0,f.recoveryEvent.durationTicks-f.airTechInvuln),false];
      }else{
        segment=f.vy<-1?'jump_rise':f.vy>1?'jump_fall':'jump_apex';
        // Phase-clock deltas freeze with hitstop; a segment starts once, not once per render.
        if(old?.segment===segment&&old.phase==='jump')segmentTick=old.segmentTick+Math.max(0,f.phaseTick-old.phaseTick);
        choice=[segment,segmentTick,false];
      }
    }else if(['dash','backdash','air_dash_forward','air_dash_backward','jump_startup','landing','crouch','crouch_release','getup'].includes(f.phase)){
      choice=[f.phase,f.phaseTick,false];
    }else if(f.phase==='turn')choice=['turn',f.phaseTick,false,f.turnStartingFacing??f.facing];
    this.tracks.set(f.id,{fighter:f,tick,phase:f.phase,phaseTick:f.phaseTick,facing:f.facing,crouched,hitstop:f.hitstop,segment,segmentTick,overlay,choice});
    return choice;
  }
}
