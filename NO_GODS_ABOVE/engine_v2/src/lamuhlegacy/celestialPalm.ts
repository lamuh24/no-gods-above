import { MatchState, ProjectileEvent, ProjectileState } from '../core/types';

export function drawKiOrb(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,facing:number,age:number){
  ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
  // A restrained, directional core, not a full-body flash. No renderer-owned travel.
  const gradient=ctx.createRadialGradient(2,0,1,0,0,r);
  gradient.addColorStop(0,'#fffced');gradient.addColorStop(.35,'#d4fbff');gradient.addColorStop(.72,'#41cbe0');gradient.addColorStop(1,'rgba(18,101,129,0)');
  ctx.fillStyle='rgba(44,195,220,.25)';ctx.beginPath();ctx.moveTo(-r*.2,-r*.75);ctx.quadraticCurveTo(-r*1.8,-r*.35,-r*2.7,0);ctx.quadraticCurveTo(-r*1.8,r*.35,-r*.2,r*.75);ctx.fill();
  ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(0,0,r*1.2,r,0,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle='#f1c66e';
  const turn=(age%12)/12*.6;ctx.beginPath();ctx.ellipse(0,0,r*.82,r*.92,turn,-1.2,1.2);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle='#fff5d6';ctx.beginPath();ctx.moveTo(-r*.6,-r*.3);ctx.quadraticCurveTo(r*.2,-r*.65,r*.7,0);ctx.stroke();ctx.restore();
}

export function drawCelestialProjectiles(ctx:CanvasRenderingContext2D,state:MatchState,worldX:(x:number)=>number,worldY:(y:number)=>number,worldScale:number,feedback:ProjectileEvent[],effects:boolean,drawAuraBall?:(p:ProjectileState)=>void){
  for(const p of state.projectiles||[])if(p.attackId!=='legacy_ascend_step_heavy'&&p.attackId!=='legacy_divine_vanish_heavy'&&p.attackId!=='legacy_aura_sweep_heavy'){
    if(drawAuraBall&&/^legacy_celestial_palm_(light|medium|heavy)$/.test(p.attackId))drawAuraBall(p);
    else drawKiOrb(ctx,worldX(p.x),worldY(p.y),p.hitbox.rect.h*.5*worldScale,p.facing,p.ageTicks);
  }
  if(!effects)return;
  for(const e of feedback){const age=state.tick-e.tick;if(age<0||age>10||!['hit','block'].includes(e.type))continue;
    const r=(e.attackId.endsWith('heavy')?30:21)*(1+age*.07),alpha=(1-age/11)**2;
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(worldX(e.x),worldY(e.y));ctx.strokeStyle=e.type==='block'?'#8be2ef':'#f3ce87';ctx.lineWidth=e.type==='block'?3:2;
    ctx.beginPath();ctx.ellipse(0,0,r*.4,r,0,-1.4,1.4);ctx.stroke();
    if(e.type==='hit'){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
    ctx.restore();
  }
}
