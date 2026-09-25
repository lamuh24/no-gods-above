import type { MatchState, FighterId } from '../core/types';
import type { FallenCapitalShot } from '../stage/fallenCapital/camera';
import type { Presenter } from './presentation';
/** Preparation stays grounded; launch is fast and gravity slows ascent into the POV cut. */
export function paidJumpMotion(time:number) {
 const flight=Math.min(.635,Math.max(0,(time-3680)/1000));
 return {x:80*flight,y:-430*flight+325*flight*flight};
}
/** Measured sole/toe pivots, not PNG cell edges. Source artwork is never resized per pose. */
export function paidBodyPlacement(phase:number,index:number,width:number,height:number) {
 const scale=400/448;
 if(phase===1)return {x:-200,y:-416*scale,width:width*scale,height:height*scale};
 if(phase===2){
  // Rightmost planted boot: last pistol pose x344/y416; holster/load poses measured below.
  const toes=[354,354,340],soles=[390,392,388];
  const anchor=Math.min(2,index);
  return {x:(344-224-toes[anchor])*scale,y:-soles[anchor]*scale,width:width*scale,height:height*scale};
 }
 return {x:-200,y:-400,width:400,height:400};
}
/** Opt-in presentation rehearsal. No attack, health, meter, or core-state writes. */
export function createPaidRehearsal(app: HTMLElement, enabled: boolean, clearInputs: () => void, showControls = true) {
 let gameplay = false;
 let frame: HTMLIFrameElement | null = null;
 let close: HTMLButtonElement | null = null;
 let scrub: HTMLInputElement | null = null;
 let timeout: number | undefined;
 let lastPlaybackTime: number | undefined;
 let confirmedAttacker: FighterId | undefined;
 const tokenArt=new Image();if(enabled)tokenArt.src='/swahili-paid-review/contract-token-v1.png';
 const sealArt=new Image();if(enabled)sealArt.src='/swahili-paid-review/contract-seal-generated-v1.png';
 const button = document.createElement('button');
 button.textContent = 'Rehearse Paid in Full · cinematic only / no damage';
 button.id = 'paidRehearsal';
 button.style.cssText = 'padding:12px;margin:8px;color:#e4d4ad;background:#211815;border:1px solid #a77a36';
 function stop() { frame?.remove(); close?.remove();scrub?.remove(); frame=null;close=null;scrub=null;window.clearTimeout(timeout);clearInputs();button.disabled=false; }
 function start(owner?:FighterId, combat = false) {
  if(frame)return;
  if(!enabled)return;
  gameplay = combat;
  lastPlaybackTime = undefined;
  confirmedAttacker=owner;
  const host=app.querySelector<HTMLElement>('#tribunalStage') ?? app.querySelector<HTMLCanvasElement>('#stage')?.parentElement;
  if(!host)return;
  clearInputs();host.style.position='relative';button.disabled=true;
  frame=document.createElement('iframe');frame.title=combat?'Paid in Full ultimate':'Paid in Full cinematic rehearsal';frame.src='/swahili-paid-review/assembled-verdict-v8.html?embed=1&transparent-stage=2';
  frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;z-index:30;background:transparent;pointer-events:none;opacity:0';
  // Body frames are sampled onto the arena combat plane. Only the final screen cut overlays it.
  close=document.createElement('button');close.textContent='Exit rehearsal · no damage applied';close.style.cssText='position:absolute;right:12px;top:12px;z-index:31;padding:8px;background:#111;color:#eadfcf;border:1px solid #a77a36';close.onclick=stop;
  scrub=document.createElement('input');scrub.type='range';scrub.min='-650';scrub.max='7500';scrub.step='1';scrub.value='-650';scrub.setAttribute('aria-label','Cinematic frame scrub (pauses playback)');scrub.style.cssText='position:absolute;bottom:60px;left:25%;width:50%;z-index:32';
  scrub.oninput=()=>{window.clearTimeout(timeout);frame?.contentWindow?.postMessage({type:'paid-seek',time:Number(scrub!.value)},location.origin);};
  host.append(frame);if(!combat)host.append(close,scrub);timeout=window.setTimeout(stop,20000);
 }
 const message=(event:MessageEvent)=>{if(frame&&event.source===frame.contentWindow&&event.origin===location.origin&&event.data?.type==='swahili-paid-review-complete')stop();};
 if(enabled){if(showControls)app.querySelector('.match')?.prepend(button);button.onclick=()=>start();button.title='Press P in the arena to cast the hit-confirm seal. This button previews without a hit.';window.addEventListener('message',message);}
 function draw(ctx:CanvasRenderingContext2D,state:MatchState,presenters:Record<FighterId,Presenter>,world:{x:(v:number)=>number;y:(v:number)=>number},attacker:FighterId): FallenCapitalShot | undefined {
  if(!frame)return;
  attacker=confirmedAttacker??attacker;
  const data=(frame.contentWindow as unknown as {paidWorldFrame?:{image:HTMLImageElement;time:number;phase:number;index:number}})?.paidWorldFrame;
  if(!data)return;
  // Recover from a stalled player, but never cut off a sequence that is advancing.
  if(data.time !== lastPlaybackTime){lastPlaybackTime=data.time;window.clearTimeout(timeout);timeout=window.setTimeout(stop,20000);}
  const {time:t,phase}=data,defender:FighterId=attacker==='p1'?'p2':'p1';
  const enemyPOV=phase===3;
  const direction=state.fighters[attacker].facing,centre=(state.fighters.p1.x+state.fighters.p2.x)/2;
  const trajectory=paidJumpMotion(t);
  const ax=centre-90*direction+trajectory.x*direction,vx=centre+90*direction;
  const beats=[1575,1875,2165,2525,5325];
  const contact=beats.filter(b=>t>=b).at(-1),age=contact===undefined?Infinity:t-contact;
  const shotCount=beats.slice(0,4).filter(b=>t>=b).length;
  const ay=trajectory.y,vy=-shotCount*22;
  const victim={...state.fighters[defender],x:vx+direction*Math.max(0,1-age/170)*18,y:vy,
   facing:-direction as 1|-1,currentAttack:null,phase: t>=5325?'thrown' as const:shotCount?'hit_reaction' as const:'idle' as const,
   phaseTick:Math.floor(Math.max(0,age===Infinity?0:age)/16.667),hitReactionWeight:'heavy' as const,grounded:shotCount===0};
  const view={...state,throwInteraction:null,ultimateInteraction:undefined,fighters:{...state.fighters,[defender]:victim}};
  // Keep a fixed world-space artwork size. Camera movement affects stage AND both bodies.
  if(phase<4){
   // Generated metallic artwork replaces the rejected line rings and tethers completely.
   if(phase<3&&sealArt.complete&&sealArt.naturalWidth){ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(t+650)/180));
    const width=220,height=width*sealArt.naturalHeight/sealArt.naturalWidth;
    ctx.drawImage(sealArt,world.x(vx)-width/2,world.y(0)-height*.66,width,height);ctx.restore();}
   if(phase===-1){const body={...state.fighters[attacker],x:ax,y:0,phase:'idle' as const,currentAttack:null};presenters[attacker].draw(ctx,body,view,world);}
   else if(phase===0){ctx.save();ctx.translate(world.x(ax),world.y(-75));ctx.scale(direction,1);
    // Portrait-specific framing keeps its cropped waist below the lens; the original eight poses remain intact.
    ctx.drawImage(data.image,-85,-170,170,170);ctx.restore();}
   else {ctx.save();ctx.translate(world.x(ax),world.y(ay));ctx.scale(direction,1);
   const placement=paidBodyPlacement(phase,data.index,data.image.naturalWidth,data.image.naturalHeight);
   ctx.drawImage(data.image,placement.x,placement.y,placement.width,placement.height);ctx.restore();}
   // The rush is seen through the victim's eyes, never a two-character spectator shot.
   if(!enemyPOV&&phase!==0)presenters[defender].draw(ctx,victim,view,world);
   if(phase===-1&&tokenArt.complete&&tokenArt.naturalWidth){const size=56+Math.max(0,1-(t+650)/160)*35;
    ctx.save();ctx.globalAlpha=Math.min(1,(-t)/180);ctx.drawImage(tokenArt,world.x(vx)-size/2,world.y(-105)-size/2,size,size);ctx.restore();}
   if(!enemyPOV&&age<120){ctx.save();ctx.strokeStyle='#ffe6a0';ctx.lineWidth=3;ctx.globalAlpha=1-age/120;
    const x=world.x(victim.x),y=world.y(victim.y-100);ctx.beginPath();ctx.arc(x,y,12+age*.15,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*12,y+Math.sin(a)*12);ctx.lineTo(x+Math.cos(a)*40,y+Math.sin(a)*40);ctx.stroke();}ctx.restore();}
  }
  frame.style.opacity=phase>=4?'1':'0';
  const pull=Math.min(1,Math.max(0,(t-1310)/180)),ease=pull*pull*(3-2*pull),turn=Math.min(1,Math.max(0,(t-4800)/525));
  if(phase===-1)return {targetX:centre*.02,targetY:2.55,distance:13.5,orbitDegrees:0,phase:'paid-seal-capture'};
  if(phase===0)return {targetX:ax*.02,targetY:3.15,distance:5.2,eyeElevation:.3,orbitDegrees:0,phase:'paid-tie-closeup'};
  if(enemyPOV){const approach=Math.min(1,Math.max(0,(t-4315)/1000));
   return {targetX:ax*.02,targetY:-ay*.02+2.8,distance:12-approach*3.2,eyeElevation:3.2,orbitDegrees:-turn*12*direction,phase:'paid-enemy-pov'};}
  return {targetX:(ax+(centre-ax)*ease)*.02,targetY:3.15-.5*ease+Math.max(0,-ay-75)*.012,distance:5.2+ease*6.2,eyeElevation:.3+ease*1.45,orbitDegrees:-turn*12*direction,phase:'paid-rehearsal-world'};
 }
 return {get active(){return !!frame;},get visible(){return !!(frame?.contentWindow as any)?.paidWorldFrame;},get canCancel(){return !gameplay;},start,draw,stop,dispose(){stop();button.remove();window.removeEventListener('message',message);}};
}
