import { resolveAttackDefinition } from '../core/engine';
import { FighterState, MatchState } from '../core/types';

export function heavyImpactOffset(state:MatchState):{x:number;y:number} {
  const e=state.lastCombatEvent;
  if(!e||e.attackId!=='legacy_heaven_splitter_heavy'||e.outcome!=='hit')return {x:0,y:0};
  const age=state.tick-e.tick-1;
  // A short, non-random 6px maximum camera impulse; no zoom or body rescale.
  const pulses=[{x:3,y:5},{x:-2,y:-6},{x:2,y:3},{x:-1,y:-2},{x:0,y:1}];
  return age>=0&&age<pulses.length?pulses[age]:{x:0,y:0};
}

export function drawHeavenFocus(ctx:CanvasRenderingContext2D,f:FighterState,x:number,y:number) {
  if(f.currentAttack!=='legacy_heaven_splitter_heavy')return;
  const move=resolveAttackDefinition(f),t=f.phaseTick;
  const focus=t<move.startup?Math.min(1,t/8):Math.max(0,1-(t-move.startup)/16);
  if(focus<=0)return;
  ctx.save();
  const shade=ctx.createRadialGradient(x,y-165,72,x,y-165,530);
  shade.addColorStop(0,'rgba(4,12,20,0)');shade.addColorStop(1,`rgba(2,7,14,${.48*focus})`);
  ctx.fillStyle=shade;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  // Framing stays outside fighter bodies: no portrait replacement/cinematic lock.
  ctx.fillStyle=`rgba(1,5,10,${.65*focus})`;ctx.fillRect(0,0,ctx.canvas.width,14*focus);ctx.fillRect(0,ctx.canvas.height-14*focus,ctx.canvas.width,14*focus);
  if(t>=move.startup){
    ctx.lineWidth=1;ctx.strokeStyle=`rgba(149,212,235,${.17*focus})`;
    for(let i=0;i<9;i++){const sx=x+(i-4)*92;ctx.beginPath();ctx.moveTo(sx+f.attackFacing*30,45);ctx.lineTo(sx-f.attackFacing*42,218);ctx.stroke();}
  }
  ctx.restore();
}

// Authored local-pixel envelope for Heavy's body/fist only. No wall-clock phase,
// random particles, collision, or repeat impact; frozen phaseTick freezes the aura.
export function sampleHeavyUppercutAura(f:FighterState):{alpha:number;reach:number;flow:number} {
  if(f.currentAttack!=='legacy_heaven_splitter_heavy')return {alpha:0,reach:0,flow:0};
  const age=f.phaseTick-resolveAttackDefinition(f).startup;
  if(age < -5 || age >= 16)return {alpha:0,reach:0,flow:0};
  return {
    alpha:age<0 ? .12+(age+5)*.055 : age<6 ? 1 : (16-age)/10,
    reach:age<0 ? 218+(age+5)*17 : 324,
    flow:Math.sin((age+5)*.72)*4
  };
}

function drawHeavyUppercutAura(ctx:CanvasRenderingContext2D,f:FighterState,x:number,y:number) {
  const aura=sampleHeavyUppercutAura(f);
  if(aura.alpha<=0)return;
  ctx.save();ctx.translate(x,y);ctx.scale(f.attackFacing,1);ctx.globalAlpha=aura.alpha;
  const top=-aura.reach,flow=aura.flow;
  // Separate back layer: the opaque, untinted body is drawn afterwards.
  const glow=ctx.createRadialGradient(-9,-169,32,-9,-169,174);
  glow.addColorStop(0,'rgba(100,236,255,.04)');glow.addColorStop(.65,'rgba(37,179,221,.23)');glow.addColorStop(1,'rgba(28,151,204,0)');
  // Fill the complete radial support; a pose-height rectangle clips the charge
  // glow into a faint horizontal shelf when exported into the source sprite.
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(-9,-169,174,0,Math.PI*2);ctx.fill();
  const flame=ctx.createLinearGradient(0,-16,0,top);
  flame.addColorStop(0,'rgba(21,157,211,0)');flame.addColorStop(.3,'rgba(32,188,228,.24)');flame.addColorStop(.76,'rgba(71,221,246,.32)');flame.addColorStop(1,'rgba(217,254,255,.76)');
  ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(-35,-20);
  ctx.bezierCurveTo(-115,-62,-151,-136,-117+flow,-225);
  ctx.quadraticCurveTo(-116,-154,-94,-146);
  ctx.quadraticCurveTo(-101,-250,-47+flow,top+27);
  ctx.quadraticCurveTo(-65,-241,-43,-230);
  ctx.quadraticCurveTo(-13,top+21,36,top-8);
  ctx.quadraticCurveTo(30,top+41,49,top+53);
  ctx.quadraticCurveTo(81,top+31,80+flow,top+7);
  ctx.bezierCurveTo(107,-190,87,-104,35,-41);ctx.quadraticCurveTo(-2,-52,-35,-20);ctx.fill();
  // Two rising rim trails read as one surrounding aura, not a detached beam.
  ctx.lineCap='round';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(127,245,255,.8)';
  ctx.beginPath();ctx.moveTo(-52,-51);ctx.bezierCurveTo(-135,-107,-131,-188,-111+flow,-225);ctx.stroke();
  ctx.beginPath();ctx.moveTo(46,-84);ctx.bezierCurveTo(90,-151,99,top+63,80+flow,top+16);ctx.stroke();
  ctx.lineWidth=1.8;ctx.strokeStyle='rgba(255,212,111,.9)';
  ctx.beginPath();ctx.moveTo(-75,-102);ctx.quadraticCurveTo(-111,-160,-90,-214);ctx.stroke();
  ctx.beginPath();ctx.moveTo(64,-154);ctx.quadraticCurveTo(80,-220,60,top+40);ctx.stroke();
  // Crown hugs the raised fist; the trailing envelope tapers at the apex.
  if(f.phaseTick>=resolveAttackDefinition(f).startup){
    ctx.strokeStyle='rgba(224,255,255,.92)';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(39,-287,26,-2.65,.95);ctx.stroke();
  }
  ctx.restore();
}

// A single narrow ki uppercut arc, behind the unchanged body. Derived from the
// authoritative active window: hitstop freezes it; no renderer collision or clock.
export function drawHeavenArc(ctx:CanvasRenderingContext2D,f:FighterState,x:number,y:number) {
  if(!f.currentAttack?.startsWith('legacy_heaven_splitter_'))return;
  const move=resolveAttackDefinition(f),age=f.phaseTick-move.startup;
  if(f.currentAttack==='legacy_heaven_splitter_heavy'&&age<0&&f.phaseTick>=5){
    const strength=Math.min(1,(f.phaseTick-4)/9);
    ctx.save();ctx.translate(x,y);ctx.scale(f.attackFacing,1);ctx.strokeStyle=`rgba(94,224,248,${.35*strength})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,-1,31+12*strength,5,0,.1,Math.PI*1.9);ctx.stroke();ctx.restore();
  }
  if(f.currentAttack==='legacy_heaven_splitter_heavy'){
    drawHeavyUppercutAura(ctx,f,x,y);return;
  }
  if(age<0||age>=move.active+2)return;
  const fade=age<move.active?1:1-(age-move.active+1)/3;
  ctx.save();ctx.translate(x,y);ctx.scale(f.attackFacing,1);ctx.globalAlpha=.76*fade;
  const trail=ctx.createLinearGradient(0,-145,30,-302);trail.addColorStop(0,'rgba(60,204,232,0)');trail.addColorStop(.52,'rgba(70,213,242,.25)');trail.addColorStop(1,'rgba(221,253,255,.9)');
  ctx.fillStyle=trail;ctx.beginPath();ctx.moveTo(-13,-145);ctx.quadraticCurveTo(61,-211,29,-304);ctx.quadraticCurveTo(87,-227,9,-158);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e7c567';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(21,-176);ctx.quadraticCurveTo(67,-240,38,-292);ctx.stroke();
  // Compact fist crescent; later frames are follow-through, not another release.
  ctx.strokeStyle='#c9faff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(29,-289,18,-1.7,1.2);ctx.stroke();
  ctx.restore();
}
