import type {FighterState} from '../core/types';
import {MovementPresentation,type SpriteChoice} from './movement';
type EffectRegion={polygon:number[][];mode:'gold'|'pink';featherRight?:number};
export type Clip={file:string;files?:string[];bases?:number[][];crops:number[][];ticks:number[];basis:number[];bodyHeight:number;label:string;key:'green'|'bluegray'|'alpha';edgeFeather?:number;masks?:Record<number,number[][]>;embeddedVictim?:boolean;victimOffsets?:number[][];effectRegions?:Record<number,EffectRegion[]>};
export class CelesteSprites {
  private movement=new MovementPresentation();
  resetPresentation(){this.movement.reset()}
  clips:Record<string,Clip>={};
  private images:Record<string,HTMLImageElement>={};
  private frames=new Map<string,HTMLCanvasElement>();
  private frameChecks:{id:string;frame:number;cornerAlpha:number;greenPixels:number;edgePixels:number}[]=[];
  async load(){
    this.clips=await (await fetch('/celeste/import.json')).json();
    await Promise.all([...new Set(Object.values(this.clips).flatMap(c=>[c.file,...(c.files??[])]))].map(file=>new Promise<void>((ok,no)=>{const im=new Image();this.images[file]=im;im.onload=()=>ok();im.onerror=()=>no(Error('Missing art: '+file));im.src='/celeste/'+file})));
    for(const[id,c]of Object.entries(this.clips))for(let i=0;i<c.crops.length;i++)this.prepare(id,i);
  }
  duration(id:string){return this.clips[id].ticks.reduce((a,b)=>a+b,0)}
  frameIndex(id:string,t:number,loop=false){const c=this.clips[id];let rem=loop?t%this.duration(id):Math.min(t,this.duration(id)-1);for(let i=0;i<c.ticks.length;i++){if(rem<c.ticks[i])return i;rem-=c.ticks[i]}return c.ticks.length-1}
  private prepare(id:string,i:number){
    const c=this.clips[id],im=this.images[c.files?.[i]??c.file],basis=c.bases?.[i]??c.basis,r=c.crops[i],a=document.createElement('canvas');a.width=Math.ceil(r[2]);a.height=Math.ceil(r[3]);const g=a.getContext('2d',{willReadFrequently:true})!;
    if(c.masks?.[i]){g.beginPath();c.masks[i].forEach(([x,y],n)=>g[n?'lineTo':'moveTo'](x-r[0],y-r[1]));g.closePath();g.clip()}
    g.drawImage(im,r[0]*im.width/basis[0],r[1]*im.height/basis[1],r[2]*im.width/basis[0],r[3]*im.height/basis[1],0,0,r[2],r[3]);
    // The authoring key is green, which never overlaps Celeste's costume or DO/RE/MI colors.
    // Preserve RGB inside the silhouette; only unmix green antialias pixels at its edge.
    const data=g.getImageData(0,0,a.width,a.height),p=data.data;
    const smooth=(lo:number,hi:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));return t*t*(3-2*t)};
    const regions=c.effectRegions?.[i]??[];
    const inside=(x:number,y:number,poly:number[][])=>{let hit=false;for(let j=0,k=poly.length-1;j<poly.length;k=j++){const u=poly[j],v=poly[k];if((u[1]>y)!==(v[1]>y)&&x<(v[0]-u[0])*(y-u[1])/(v[1]-u[1])+u[0])hit=!hit;}return hit};
    for(let n=0;n<p.length;n+=4){
      const px=n/4%a.width+r[0],py=Math.floor(n/4/a.width)+r[1];
      if(c.key==='alpha'){
        // New sheets have native transparency. Preserve their RGB and alpha;
        // feather only the outer crop gutter where neighboring glow tails meet.
        if(c.edgeFeather){const x=px-r[0],y=py-r[1];p[n+3]=Math.round(p[n+3]*smooth(0,c.edgeFeather,Math.min(x,y,a.width-1-x,a.height-1-y)));}
        continue;
      }
      const region=regions.find(v=>inside(px,py,v.polygon));
      if(region){
        // In explicitly authored effect-only space, gray backdrop mixed into bloom
        // must fade with chroma. Keep costume pixels outside these polygons untouched.
        const gold=smooth(0,65,p[n]-p[n+2]);
        const pink=region.mode==='pink'?smooth(0,65,p[n]-p[n+1]):0;
        const core=smooth(242,255,Math.min(p[n],p[n+1],p[n+2]));
        const edge=region.featherRight?smooth(0,region.featherRight,r[0]+r[2]-1-px):1;
        p[n+3]=Math.round(p[n+3]*Math.max(gold,pink,core)*edge);
        if(p[n+3]<8)p[n+3]=0;
        continue;
      }
      if(c.key==='bluegray'){const d=p[n+2]-p[n];if(d>4&&p[n+1]>=p[n]&&p[n+1]<=p[n+2]){const hue=240-60*(p[n+1]-p[n])/d;const band=smooth(194,199,hue)*(1-smooth(215,220,hue));p[n+3]=Math.round(p[n+3]*(1-band*smooth(4,12,d)));if(p[n+3]<12)p[n+3]=0;}continue;}
      const green=p[n+1],other=Math.max(p[n],p[n+2]),spill=green-other;if(spill>15){const alpha=1-Math.min(1,Math.max(0,(spill-15)/75));p[n+3]=Math.round(p[n+3]*alpha);p[n+1]=Math.min(green,other+5);if(p[n+3]<12)p[n+3]=0;}}
    let greenPixels=0,edgePixels=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const n=(y*a.width+x)*4;if(p[n+3]>30){if(p[n+1]>Math.max(p[n],p[n+2])+20)greenPixels++;if(x===0||y===0||x===a.width-1||y===a.height-1)edgePixels++;}}
    const cornerAlpha=[0,a.width-1,(a.height-1)*a.width,a.height*a.width-1].reduce((sum,n)=>sum+p[n*4+3],0);
    this.frameChecks.push({id,frame:i,cornerAlpha,greenPixels,edgePixels});g.putImageData(data,0,0);this.frames.set(id+':'+i,a);return a;
  }
  draw(ctx:CanvasRenderingContext2D,id:string,t:number,x:number,y:number,facing:number,pixelsPerSim:number,loop=false){
    const c=this.clips[id],i=this.frameIndex(id,t,loop),r=c.crops[i],frame=this.frames.get(id+':'+i)!;const s=pixelsPerSim*110/c.bodyHeight;
    ctx.save();ctx.translate(x,y);ctx.scale(facing*s,s);ctx.drawImage(frame,r[0]-r[4],r[1]-r[5]);ctx.restore();return i;
  }
  drawEffectRect(ctx:CanvasRenderingContext2D,id:string,t:number,x:number,y:number,w:number,h:number,facing:number){
    const frame=this.frames.get(id+':'+this.frameIndex(id,t,true));if(!frame)return;
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);ctx.drawImage(frame,0,0,w,h);ctx.restore();
  }
  choose(f:FighterState,simulationTick?:number):SpriteChoice{
    const movement=this.movement.choose(f,simulationTick??f.phaseTick);
    if(f.health<=0)return ['ko',0,false];
    if(f.phase==='landing'&&f.celesteLandingRecovery&&f.currentAttack&&this.clips[f.currentAttack])return [f.currentAttack,f.celesteLandedAttackTick??0,false];
    if(f.phase==='attack'&&f.currentAttack&&this.clips[f.currentAttack])return [f.currentAttack,f.phaseTick,false];
    if(f.phase==='hit_reaction')return [!f.grounded?'hurt_air':f.hitReactionWeight==='heavy'?'hurt_heavy':'hurt_light',f.phaseTick,false];
    if(f.phase==='thrown')return ['tumble',0,false];
    if(f.phase==='knockdown')return ['knockdown',0,false];
    if(f.phase==='getup')return ['getup',f.phaseTick,false];
    if(movement&&this.clips[movement[0]])return movement;
    if(f.phase==='walk_forward'||f.phase==='walk_backward')return [f.phase,f.phaseTick,true];
    if(f.phase==='block'||f.blocking)return [f.crouchBlocking?'crouch_block':'block',0,false];
    if(f.phase==='jump')return [f.vy<-1?'jump_rise':f.vy>1?'jump_fall':'jump_apex',0,false];
    if(f.phase==='air_recovery'||f.phase.startsWith('air_dash'))return ['jump_apex',0,false];
    if(f.phase==='dash')return ['walk_forward',f.phaseTick*2,true];
    if(f.phase==='backdash')return ['walk_backward',f.phaseTick*2,true];
    if(f.phase==='throw_startup'||f.phase==='throw_active')return ['standing_light',f.phaseTick,false];
    if(f.phase==='throw_whiff')return ['idle',0,false];
    if(f.phase==='turn')return ['idle',0,true];
    if(this.clips[f.phase])return [f.phase,f.phaseTick,['idle','walk_forward','walk_backward'].includes(f.phase)];
    return ['idle',0,true];
  }
  audit(){return Object.entries(this.clips).map(([id,c])=>({id,frames:c.crops.length,ticks:this.duration(id),bodyHeight:c.bodyHeight,loaded:this.frames.has(id+':'+(c.crops.length-1))}))}
  matteAudit(){return this.frameChecks}
}
