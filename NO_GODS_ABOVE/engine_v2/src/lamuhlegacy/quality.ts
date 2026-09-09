import { fighterDefinitions } from "../data/fighters";
import { resolveAttackDefinition, fighterExtendedHurtboxes } from "../core/engine";
import { FighterState, MatchState, Rect } from "../core/types";

export interface ReactionFrame {
  index: number; role: string; publicPath: string; sha256: string;
  root: { x: number; y: number };
  visibleBounds: { minX: number; minY: number; maxX: number; maxY: number };
  bodyCenter: { x: number; y: number };
}
export interface ReactionPack {
  candidateOnly: true; deployable: false;
  canvas: { width: number; height: number };
  frames: ReactionFrame[];
  sequences: Record<string, { indices: number[]; exposureTicks: number[] }>;
}

// One-shot state selection: held damage/down poses never replay their entry on a long stun.
export function reactionFrameIndex(f: FighterState): number | null {
  if (f.phase === "hit_reaction") {
    if (!f.grounded) return f.vy < -4 ? 4 : f.vy < 4 ? 5 : 6;
    const impactHold = f.hitReactionWeight === "light" ? 4 : 6;
    return f.phaseTick <= impactHold ? f.hitReactionWeight === "light" ? 0 : 1
      : f.hitstun <= 4 ? 3 : 2;
  }
  if (f.phase === "knockdown") return !f.grounded || f.phaseTick < 4 ? 6 : 7;
  if (f.phase === "getup") {
    const duration = fighterDefinitions[f.kind].combat.getupTicks;
    const progress = Math.min(.999, f.phaseTick / Math.max(1, duration));
    return [8, 9, 10, 11][Math.floor(progress * 4)];
  }
  if (f.phase === "thrown") return 4;
  if (f.phase === "air_recovery") return 5;
  return null;
}

export interface ContactCue {
  id: string; tick: number; x: number; y: number; facing: 1 | -1;
  kind: "hit" | "block"; strength: "light" | "medium" | "heavy";
  attackId: string; duration: number; radius: number;
  attackerRoot: {x:number;y:number}; hitOrdinal:number; contactSocketIndex?:number;
}
export interface ContactSocket { frame:number; sourcePath:string; sha256:string; x:number; y:number; root:{x:number;y:number}; }
export interface ContactSocketPack { candidateOnly:true; deployable:false; attacks:Record<string,ContactSocket[]>; }

export function contactScreenAnchor(cue:ContactCue,sockets:ContactSocketPack,worldX:(x:number)=>number,worldY:(y:number)=>number){
  const socket=sockets.attacks[cue.attackId]?.[cue.contactSocketIndex ?? cue.hitOrdinal-1];
  // Collision decides WHETHER there is feedback. Explicit source-art sockets decide WHERE.
  // This is a Lamuh sandbox presentation adapter, not a generic fixture-size assumption.
  return socket?{x:worldX(cue.attackerRoot.x)+(socket.x-socket.root.x)*.3*cue.facing,y:worldY(cue.attackerRoot.y)+(socket.y-socket.root.y)*.3}
    :{x:worldX(cue.x),y:worldY(cue.y)};
}
const worldRect = (f: FighterState, r: Rect, facing: 1 | -1): Rect => ({
  x: f.x + (facing === 1 ? r.x : -r.x-r.w), y: f.y+r.y, w: r.w, h: r.h
});

// Derived solely from the authoritative contact and authored collision intersection.
// A whiff, redraw, held input, or expired lastCombatEvent cannot manufacture an impact.
export function contactCue(state: MatchState): ContactCue | null {
  const event = state.lastCombatEvent;
  if (!event || event.outcome === "juggle_rejected" || event.tick !== state.tick - 1) return null;
  const a=state.fighters[event.attacker], d=state.fighters[event.defender];
  const chainOpener=event.attackId==='legacy_ascend_step_heavy' && a.ascendHeavyResponse?.triggerTick===event.tick;
  const attack=chainOpener?fighterDefinitions[a.kind].attacks.legacy_ascend_step_heavy:resolveAttackDefinition(a,event.attackId);
  const hit=chainOpener?attack.hitboxes[0]:attack.hitboxes.find((box) => a.phaseTick >= box.start && a.phaseTick <= box.end);
  if (!hit) return null;
  const strike=worldRect(a,hit.rect,a.attackFacing);
  const hurtboxes = d.crouchBlocking || d.phase === "crouch" ? fighterDefinitions[d.kind].crouchingHurtboxes : fighterDefinitions[d.kind].standingHurtboxes;
  const targetRects=attack.targetHurtboxProfile==='extended'?fighterExtendedHurtboxes(d):hurtboxes.map(rect=>worldRect(d,rect,d.facing));
  const intersections=targetRects.map((r) => ({
    l:Math.max(strike.x,r.x),r:Math.min(strike.x+strike.w,r.x+r.w),t:Math.max(strike.y,r.y),b:Math.min(strike.y+strike.h,r.y+r.h)
  })).filter((r) => r.l<=r.r && r.t<=r.b);
  const contact=intersections[0];
  if (!contact) return null;
  const strength=hit.damage<=32 ? "light" : hit.damage<60 ? "medium" : "heavy";
  const eventMoveInstance=chainOpener?a.ascendHeavyResponse!.sourceMoveInstance:a.currentMoveInstance;
  const eventPrefix=`${state.matchId}:${event.tick}:${a.id}:${eventMoveInstance}:`;
  const id=[...state.presentationEventLedger].reverse().find((entry) => entry.startsWith(eventPrefix)) || `${eventPrefix}contact-${event.hitOrdinal}`;
  return {id,tick:event.tick,x:(contact.l+contact.r)/2,y:(contact.t+contact.b)/2,facing:a.attackFacing,kind:event.outcome,attackerRoot:{x:a.x,y:a.y},hitOrdinal:event.hitOrdinal,
    strength,attackId:event.attackId,contactSocketIndex:event.attackId==='legacy_ascend_step_heavy'?(chainOpener?0:1):event.attackId==='legacy_divine_vanish_heavy'?0:undefined,duration:strength==="heavy"?12:strength==="medium"?9:7,radius:strength==="heavy"?31:strength==="medium"?22:15};
}

export function drawContactCue(ctx: CanvasRenderingContext2D,cue:ContactCue,age:number,x:number,y:number) {
  // Down Heavy's explicitly rejected decorative VFX stays disabled.
  if (cue.attackId === "crouching_heavy" || age<0 || age>=cue.duration) return;
  const t=age/cue.duration, radius=cue.radius*(.65+1.1*t), fade=(1-t)*(1-t);
  ctx.save();ctx.translate(x,y);ctx.scale(cue.facing,1);ctx.globalAlpha=fade;
  if(cue.kind==="block") {
    ctx.scale(.48,1);ctx.lineWidth=3;ctx.strokeStyle="#9becff";
    ctx.beginPath();ctx.arc(0,0,radius*1.1,-1.25,1.25);ctx.stroke();
    ctx.lineWidth=1;ctx.strokeStyle="#effdff";
    ctx.beginPath();ctx.arc(-5,0,radius*.9,-1.1,1.1);ctx.stroke();
  } else {
    if(cue.attackId==='legacy_heaven_splitter_heavy') {
      // One confirmed-hit shock ring. It expands once, never pulses/retriggers
      // through the held contact frame and never swaps/tints Lamuh's body.
      ctx.strokeStyle='#a9f1ff';ctx.lineWidth=3*(1-t)+.5;
      ctx.beginPath();ctx.ellipse(0,0,12+42*t,8+29*t,-.65,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#efcd73';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(0,0,17+46*t,10+32*t,-.65,-1.9,.8);ctx.stroke();
    }
    // Directional, tapered ink wedges leave negative space around the striking limb.
    for(let i=0;i<5;i++) {
      const angle=-1.1+i*.55, reach=radius*(i%2 ? 1 : 1.35);
      const inner=radius*.24;
      ctx.fillStyle=i%2 ? "#fff5ce" : "#f8bf65";
      ctx.beginPath();ctx.moveTo(Math.cos(angle-.16)*inner,Math.sin(angle-.16)*inner);
      ctx.lineTo(Math.cos(angle)*reach,Math.sin(angle)*reach);
      ctx.lineTo(Math.cos(angle+.12)*inner,Math.sin(angle+.12)*inner);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle="#fff9e7";ctx.beginPath();ctx.ellipse(0,0,4*(1-t)+1,8*(1-t)+2,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

// Several hundred 2048x1536 sources saturate the renderer's decoded-image cache, and an
// HTMLImageElement never releases its decode on demand: once saturated, every later frame
// fails with an EncodingError on a PNG that decodes correctly in isolation, and the whole
// playtest load aborts. Decode through an ImageBitmap instead and close it immediately after
// the downscale, which frees that memory deterministically. The 2D-canvas 0.3 downscale and
// its smoothing settings are unchanged, so prepared pixels stay identical.
async function decodeFrameSource(source: string, attempt = 0): Promise<ImageBitmap> {
  try {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${source}`);
    return await createImageBitmap(await response.blob());
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 80 * (attempt + 1)));
    return decodeFrameSource(source, attempt + 1);
  }
}

// Decode once at the actual presentation resolution; draw a complete frame synchronously.
// The 2048x1536 source PNGs remain authoritative. This cache never changes body proportions.
export class PreparedFrames {
  private images=new Map<string,HTMLCanvasElement>();
  // Presentation downscale. 0.3 is the Lamuh sandbox's long-standing value and stays
  // the default; the versus playtest passes its own so every fighter is drawn to one
  // shared body height instead of a per-page constant.
  constructor(private readonly scale=.3) {}
  async load(sources:Iterable<string>) {
    const paths=[...new Set(sources)];
    for(let i=0;i<paths.length;i+=4) await Promise.all(paths.slice(i,i+4).map(async (source) => {
      if(this.images.has(source))return;
      const image=await decodeFrameSource(source);
      const canvas=document.createElement("canvas");canvas.width=Math.round(image.width*this.scale);canvas.height=Math.round(image.height*this.scale);
      const ctx=canvas.getContext("2d")!;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(image,0,0,canvas.width,canvas.height);
      this.images.set(source,canvas);image.close();
    }));
  }
  draw(ctx:CanvasRenderingContext2D,source:string,root:{x:number;y:number},x:number,y:number,facing:1|-1,rotation=0) {
    const image=this.images.get(source);if(!image)throw new Error(`Unprepared Lamuh frame: ${source}`);
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.scale(facing,1);
    ctx.drawImage(image,-root.x*this.scale,-root.y*this.scale);ctx.restore();
  }
  has(source:string){return this.images.has(source);}
  get count(){return this.images.size;}
}
