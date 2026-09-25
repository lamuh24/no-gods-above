import type { FighterState, MatchState } from '../core/types';
import { exposureFrame } from './common';
import { PreparedFrames } from './quality';
import { crownBallGrowth } from './crownCharge';

export type CrownFrame = { publicPath:string; root:{x:number;y:number}; role:string };
type Sequence = { frames:CrownFrame[]; exposureTicks:number[] };
export type CrownManifest = { sequences:Record<'starter'|'confirm'|'elbow'|'knee'|'charge'|'beam'|'recovery',Sequence>; auraFrames:CrownFrame[]; beamFrames:CrownFrame[]; beamLengthPixels:number;
 chargeBall:{frames:CrownFrame[];sourceDiameterPixels:number;startTick:number;releaseTick:number;minDiameter:number;maxDiameter:number;handSockets:Record<string,{x:number;y:number;direction:number}>} };
const starts = {confirm:0,elbow:18,knee:42,charge:66,beam:166,recovery:202};
const chargeBallImages=new Map<string,HTMLImageElement>();
export async function loadCrown():Promise<CrownManifest|null> {
  try {
    const response=await fetch('/lamuh-legacy-v2/ultimate-v1/manifest.json',{cache:'no-store'});
    if(!response.ok)return null;
    const manifest=await response.json() as CrownManifest;
    if(!Number.isFinite(manifest.beamLengthPixels)||manifest.beamLengthPixels<=0)throw new Error('Crown beamLengthPixels must describe normalized source-art reach');
    for(const key of ['starter',...Object.keys(starts)] as (keyof CrownManifest['sequences'])[]) {
      const sequence=manifest.sequences?.[key];
      if(!sequence?.frames.length || sequence.frames.length!==sequence.exposureTicks.length || sequence.exposureTicks.some(t=>!Number.isInteger(t)||t<=0))throw new Error(`Invalid Crown sequence ${key}`);
    }
    // The ultimate enlarges these effects past ordinary projectile size. Keep
    // their native pixels rather than magnifying the normal .30 frame cache.
    for(const f of manifest.chargeBall?.frames||[]){if(!chargeBallImages.has(f.publicPath)){const image=new Image();image.src=f.publicPath;await image.decode();chargeBallImages.set(f.publicPath,image);}}
    return manifest;
  } catch(error) { console.warn('Crown candidate artwork unavailable',error);return null; }
}
export const crownPaths=(manifest:CrownManifest|null)=>manifest?[...Object.values(manifest.sequences).flatMap(s=>s.frames.map(f=>f.publicPath)),...manifest.auraFrames.map(f=>f.publicPath),...manifest.beamFrames.map(f=>f.publicPath),...(manifest.chargeBall?.frames||[]).map(f=>f.publicPath)]:[];
export function crownVisual(manifest:CrownManifest|null,state:MatchState,fighter:FighterState) {
  if(!manifest)return null;
  const interaction=state.ultimateInteraction;
  const phase=interaction?.attacker===fighter.id?interaction.phase:fighter.currentAttack==='legacy_crown_of_no_gods'?'starter':null;
  if(!phase)return null;
  const localTick=phase==='starter'?fighter.phaseTick:Math.max(0,interaction!.tick-starts[phase]);
  const sequence=manifest.sequences[phase],index=exposureFrame(sequence.exposureTicks,localTick);
  return {phase,localTick,index,record:sequence.frames[index]};
}
// Camera is presentation only. Both bodies use the same affine camera; never scale
// the attacker independently or rotate a flat fighter to impersonate an orbit.
export function crownCamera(state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number) {
  const shot=state.ultimateInteraction;
  if(!shot)return {zoom:1,x:0,y:0,letterbox:0};
  const a=state.fighters[shot.attacker],v=state.fighters[shot.defender];
  const orbMargin=shot.phase==='charge'?120+270*Math.pow(Math.max(0,(shot.tick-66)/99),1.15):120;
  const left=Math.min(worldX(a.x)-orbMargin,worldX(v.x)-120),right=Math.max(worldX(a.x)+orbMargin,worldX(v.x)+140);
  const top=Math.min(worldY(a.y),worldY(v.y))-300,bottom=Math.max(worldY(a.y),worldY(v.y))+20;
  const charge=shot.phase==='charge'?(shot.tick-66)/100:0;
  const settle=shot.phase==='recovery'?Math.max(0,1-(shot.tick-202)/38):1;
  const fit=Math.min(1.08+charge*.06,960/(right-left),490/(bottom-top));
  const zoom=1+(fit-1)*settle;
  const pan=shot.phase==='charge'?Math.sin(charge*Math.PI*2)*12*shot.facing:0;
  return {zoom,x:(560-(left+right)/2*zoom+pan)*settle,y:(320-(top+bottom)/2*zoom)*settle,letterbox:24*settle};
}
export function drawCrownAura(ctx:CanvasRenderingContext2D,frames:PreparedFrames,manifest:CrownManifest|null,state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number) {
  const shot=state.ultimateInteraction;
  if(!shot||!manifest?.auraFrames.length||shot.tick<66||shot.tick>=218)return;
  const a=state.fighters[shot.attacker],f=manifest.auraFrames[Math.floor((shot.tick-66)/5)%manifest.auraFrames.length];
  ctx.save();ctx.globalAlpha=shot.tick>=202?Math.max(0,(218-shot.tick)/16):Math.min(1,(shot.tick-66)/12);
  frames.draw(ctx,f.publicPath,f.root,worldX(a.x),worldY(a.y),shot.facing);ctx.restore();
}
export function drawCrownBeam(ctx:CanvasRenderingContext2D,frames:PreparedFrames,manifest:CrownManifest|null,state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number) {
  const shot=state.ultimateInteraction;
  if(!shot||shot.phase!=='beam'||!manifest?.beamFrames.length)return;
  const local=shot.tick-166,f=manifest.beamFrames[Math.min(manifest.beamFrames.length-1,Math.floor(local/Math.max(1,36/manifest.beamFrames.length)))];
  const x=worldX(shot.beamOrigin.x),y=worldY(shot.beamOrigin.y),tx=worldX(shot.beamTarget.x),ty=worldY(shot.beamTarget.y);
  // Beam-only art is authored along +X. Manifest length is SOURCE pixels; the
  // cache presents at .30. No fixture dimensions leak into generic systems.
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(ty-y,tx-x));ctx.scale(Math.max(.1,Math.hypot(tx-x,ty-y)/(manifest.beamLengthPixels*.3)),1);
  ctx.globalAlpha=local>29?(36-local)/7:1;frames.draw(ctx,f.publicPath,f.root,0,0,1);ctx.restore();
}
export function drawCrownChargeBall(ctx:CanvasRenderingContext2D,frames:PreparedFrames,manifest:CrownManifest|null,state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number) {
  const shot=state.ultimateInteraction,ball=manifest?.chargeBall;
  if(!shot||!ball)return;
  const growth=crownBallGrowth(shot.tick,ball.startTick,ball.releaseTick,ball.minDiameter,ball.maxDiameter);
  if(!growth)return;
  const a=state.fighters[shot.attacker],visual=crownVisual(manifest,state,a);
  const socket=visual&&ball.handSockets[visual.record.publicPath.split('/').at(-1)!];
  if(!growth.released&&!socket)return;
  const direction=(socket?.direction??1)*shot.facing;
  const x=growth.released?worldX(shot.beamOrigin.x):worldX(a.x)+(socket!.x-visual!.record.root.x)*.3*shot.facing+direction*growth.diameter*.35;
  const y=growth.released?worldY(shot.beamOrigin.y):worldY(a.y)+(socket!.y-visual!.record.root.y)*.3;
  const f=ball.frames[Math.floor((shot.tick-ball.startTick)/6)%ball.frames.length],scale=growth.diameter/(ball.sourceDiameterPixels*.3);
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=growth.alpha;
  const original=chargeBallImages.get(f.publicPath),facing=growth.released?shot.facing:-direction as 1|-1;
  if(original){ctx.scale(facing,1);ctx.imageSmoothingQuality='high';ctx.drawImage(original,-f.root.x*.3,-f.root.y*.3,original.naturalWidth*.3,original.naturalHeight*.3);}
  else frames.draw(ctx,f.publicPath,f.root,0,0,facing);
  ctx.restore();
}
export function drawCrownContacts(ctx:CanvasRenderingContext2D,state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number) {
  const shot=state.ultimateInteraction;if(!shot)return;
  // One non-looping accent per authoritative damage beat. Redraw/pause does not
  // emit an event or mutate the ledger, and no whiff can synthesize a contact.
  const beat=[0,24,50,178].find(t=>shot.damageLedger.includes(t)&&shot.tick>=t&&shot.tick<t+8);
  if(beat===undefined)return;
  const age=shot.tick-beat,progress=age/8,v=state.fighters[shot.defender];
  const radius=(beat===178?54:24)*(1+progress),x=worldX(v.x),y=worldY(v.y-70);
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=(1-progress)**2;
  ctx.strokeStyle='#d3faff';ctx.lineWidth=beat===178?4:2;ctx.beginPath();ctx.ellipse(0,0,radius*.65,radius,-.3*shot.facing,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){const angle=i*Math.PI/3+.2,inner=radius*.3;ctx.fillStyle=i%2?'#fff5d5':'#e3bc59';ctx.beginPath();ctx.moveTo(Math.cos(angle-.1)*inner,Math.sin(angle-.1)*inner);ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);ctx.lineTo(Math.cos(angle+.1)*inner,Math.sin(angle+.1)*inner);ctx.closePath();ctx.fill();}ctx.restore();
}
export function drawCrownBars(ctx:CanvasRenderingContext2D,state:MatchState,height:number) {
  if(!state.ultimateInteraction)return;
  ctx.save();ctx.fillStyle='rgba(2,6,12,.94)';ctx.fillRect(0,0,1120,height);ctx.fillRect(0,620-height,1120,height);
  ctx.fillStyle='#e5dba9';ctx.font='600 12px system-ui';ctx.fillText('CROWN OF NO GODS · CELESTIAL CANDIDATE',20,17);ctx.restore();
}
