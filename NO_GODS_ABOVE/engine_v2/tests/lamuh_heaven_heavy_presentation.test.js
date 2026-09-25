const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {heavyImpactOffset,sampleHeavyUppercutAura}=require('../dist/lamuhlegacy/heavenSplitter');
const {fighterDefinitions}=require('../dist/data/fighters');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../..');
const base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const publicFile=p=>path.join(root,'public',p);
const family=read(path.join(base,'heaven-splitter-family.candidate.v1.json'));
const h=family.variants.heavy;
const pack=read(path.join(base,'heaven-splitter-packages/heavy/animation.package.json'));
const historicalV3=read(path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1/heavy-authored-aura-v3.report.json'));
const cleanV2=read(path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-heaven-splitter-v1/heavy-v2.normalization.report.json'));
const redrawDir=path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4');
const redraw=read(path.join(redrawDir,'normalization.report.json'));
const attack=fighterDefinitions.lamuh_legacy_v2.attacks.legacy_heaven_splitter_heavy;
const approvalPath=path.join(base,'records/heaven-splitter-v4.approval.json');
const approval=read(approvalPath),approved='APPROVED_AS_PRODUCTION_BASELINE';
const approvalSha='E318A6F291EE386D96D68F07A8898538EE7FB928B69F92D74FDBB72885627632';
const fixedRoot={x:768,y:1360},canvas={width:2048,height:1536};
function assertPng(file,sha){
 const bytes=fs.readFileSync(file);
 assert.strictEqual(hash(file),sha,file+' hash');
 assert.strictEqual(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file+' PNG');
 assert.deepStrictEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20),bytes[24],bytes[25]],[2048,1536,8,6],file+' RGBA canvas');
}

// Current V4 is redrawn source art, not V3's pixel-preserving vector composite.
assert.strictEqual(h.v2.cinematicRevision.version,4);
assert.strictEqual(h.v2.cinematicRevision.artRedrawn,true);
assert.strictEqual(h.v2.cinematicRevision.pixelExactBodyPreservation,false);
assert.strictEqual(family.status,approved);
assert.strictEqual(family.candidateOnly,true);
assert.strictEqual(family.deployable,false);
assert.strictEqual(family.humanApproval.heavy,approved);
assert.strictEqual(hash(approvalPath),approvalSha,'Scoped V4 receipt is immutable');
assert.deepStrictEqual(h.approvalReceipt,{path:'records/heaven-splitter-v4.approval.json',sha256:approvalSha});
assert.strictEqual(approval.subject,'lamuh_legacy_v2.heaven_splitter.light_medium_heavy_v4');
assert.strictEqual(approval.approvalBoundary.runtimeArtPromotion,false);
assert.strictEqual(approval.approvalBoundary.combatBalanceFinal,false);
assert.strictEqual(approval.approvalBoundary.finalCharacterApproval,false);
assert.strictEqual(approval.approvalBoundary.deployable,false);
assert.deepStrictEqual(h.v2.frames.map(({publicPath,sha256})=>({publicPath,sha256})),approval.acceptedFrameHashes.heavy);
assert.deepStrictEqual(h.timingCandidates.B,approval.acceptedTiming.heavy);
assert.deepStrictEqual(attack,approval.acceptedCombat.heavy);
assert.strictEqual(h.v2.frames.length,14);
assert.strictEqual(h.v2.frames.filter(f=>f.visibleImpact).length,1);
assert.strictEqual(h.v2.gameplayHitCount,1);
assert.deepStrictEqual(h.v2.contactFrames,[5]);
assert.strictEqual(h.timingCandidates.B.durationTicks,53);
assert.deepStrictEqual(h.timingCandidates.B.phaseTicks,{startup:14,active:6,recovery:33});
assert.deepStrictEqual(h.timingCandidates.B.exposureTicks,historicalV3.exposureTicks,'V4 changes art only, not the 53-tick presentation rhythm');
assert.strictEqual(h.v2.contactFrame,5);
assert.deepStrictEqual([attack.startup,attack.active,attack.recovery],[14,6,33]);
assert.strictEqual(attack.hitboxes.length,1);
assert.strictEqual(attack.hitboxes[0].maxHits,1);
assert.strictEqual(attack.hitboxes[0].damage,80);
assert.strictEqual(pack.combatTrack.damage,80);
assert.strictEqual(pack.simulationLength,53);
assert.strictEqual(pack.combatTrack.projectileTrack,undefined,'Surrounding aura is not a projectile or another damaging release');
assert.deepStrictEqual(pack.combatTrack.selfMotionTrack.hop,attack.authoredHop);
assert.deepStrictEqual(pack.combatTrack.selfMotionTrack.rootMotion,attack.rootMotion);
assert.deepStrictEqual(h.v2.root,fixedRoot);
assert.deepStrictEqual(h.v2.canvas,canvas);
assert.strictEqual(h.v2.perFrameRescale,false);
assert.strictEqual(h.v2.visualRecentering,false);
assert(h.v2.rootPath.every(p=>p.x===768&&p.y===1360));
assert.strictEqual(h.v2.auraBakedIntoFrames,true);
const aura=h.v2.cinematicRevision.aura;
assert.strictEqual(aura.runtimeOverlay,false);
assert.strictEqual(aura.addsHits,false);
assert.strictEqual(aura.hitstopFreezes,true);
assert.deepStrictEqual(aura.sourcePoseIndices,[3,4,5,6,7,8]);
assert.strictEqual(aura.startTick,9);
assert.strictEqual(aura.endTickExclusive,35);
assert.strictEqual(h.timingCandidates.B.exposureTicks.slice(0,3).reduce((a,b)=>a+b,0),aura.startTick);
assert.strictEqual(h.timingCandidates.B.exposureTicks.slice(0,9).reduce((a,b)=>a+b,0),aura.endTickExclusive);
assert.strictEqual(aura.source,'repo://tools/nga-forge/review/lamuh-legacy-v2-heaven-heavy-aura-redraw-v4/normalization.report.json');
assert.match(aura.bodyOnlyComparison,/previous clean poses, not pixel-identical/);
assert.deepStrictEqual(pack.presentationTrack,[],'Baked aura must not also spawn a runtime overlay');
assert.strictEqual(h.v2.contactPresentation.bodyOnlyOnWhiff,false,'Embedded motion aura is present on whiff too; it is not a hit-confirm effect');
assert.strictEqual(h.v2.contactPresentation.bodyOnlyForAllOutcomes,false);
assert.strictEqual(h.v2.contactPresentation.vfxEnabled,false,'Do not add a separate contact-PNG effect');
assert.deepStrictEqual(h.v2.contactPresentation.allowedOutcomes,[]);
assert.deepStrictEqual(h.v2.frames[0].publicPath,h.v2.frames.at(-1).publicPath);
assert(h.v2.frames.some(f=>f.role.includes('connector'))&&h.v2.frames.some(f=>f.role.includes('landing compression')));
for(const candidate of Object.values(h.timingCandidates)){
 assert(candidate.exposureTicks.every(n=>Number.isInteger(n)&&n>0));
 assert.strictEqual(candidate.exposureTicks.reduce((a,b)=>a+b,0),candidate.durationTicks);
 assert.strictEqual(candidate.exposureTicks.slice(0,h.v2.contactFrame).reduce((a,b)=>a+b,0),candidate.phaseTicks.startup);
}
console.log('PASS scoped approved V4: redrawn 6-pose aura, fixed root, frozen 14/6/33 timing, 80 damage and one hit; no character/art promotion');

assert.strictEqual(redraw.version,4);
assert.strictEqual(redraw.artRedrawn,true);
assert.strictEqual(redraw.runtimeAuraOverlay,false);
assert.strictEqual(redraw.perFrameRescale,false);
assert.deepStrictEqual(redraw.root,fixedRoot);
assert.deepStrictEqual(redraw.canvas,canvas);
assert.strictEqual(redraw.sourceScale,cleanV2.families.release.scale,'The release camera scale stays fixed across the redrawn sheet');
assert.match(redraw.comparisonBoundary,/prior art, not exact body layer/);
assert.strictEqual(hash(path.join(redrawDir,'raw-aura-redraw.png')),redraw.rawIllustrationSha256);
assert.strictEqual(hash(path.join(redrawDir,'raw-aura-magenta.png')),redraw.sourceSha256);
assert.strictEqual(redraw.frames.length,6);
for(const [index,normalized] of redraw.frames.entries()){
 const active=h.v2.frames[index+3],clean=cleanV2.families.release.frames[index];
 assert.strictEqual(normalized.index,index);
 assert.strictEqual(active.publicPath,normalized.publicPath);
 assert.strictEqual(active.sha256,normalized.sha256);
 assert.strictEqual(active.artRedrawn,true);
 assert.strictEqual(active.auraBaked,true);
 assert.strictEqual(active.changedOpaqueBodyPixels,undefined,'Do not inherit the historical V3 pixel-identity claim into redrawn V4');
 assert.strictEqual(active.sourceScale,redraw.sourceScale);
 assert.deepStrictEqual(active.sourceRegistration,normalized.sourceRegistration);
 assert.deepStrictEqual(active.root,fixedRoot);
 assert.strictEqual(normalized.edgeContact,false);
 assert.strictEqual(normalized.magentaRemaining,0);
 assert(normalized.visibleBounds.minX>0&&normalized.visibleBounds.maxX<2047&&normalized.visibleBounds.minY>0&&normalized.visibleBounds.maxY<1535);
 assert.match(active.bodyOnlyComparison,/previous clean pose, not a pixel-identical VFX extraction/);
 assert.strictEqual(active.bodyOnlyPublicPath,clean.publicPath);
 assert.strictEqual(active.bodyOnlySha256,clean.sha256);
 assert.notStrictEqual(active.sha256,active.bodyOnlySha256,'V4 and previous clean art must not be falsely identified as the same image');
 assertPng(publicFile(active.bodyOnlyPublicPath),clean.sha256);
 assertPng(publicFile(active.publicPath),active.sha256);
 assertPng(path.join(base,'heaven-heavy-aura-redraw-frames-v4',path.basename(active.publicPath)),active.sha256);
 assert.strictEqual(hash(path.join(redrawDir,'extracted',path.basename(active.publicPath))),normalized.sourceSha256);
 const source=pack.sourceFrames[index+3];
 assert.strictEqual(source.sourceUri,'repo://NO_GODS_ABOVE/engine_v2/content-source/characters/lamuh-legacy-v2/heaven-heavy-aura-redraw-frames-v4/'+path.basename(active.publicPath));
 assert.strictEqual(source.sha256,active.sha256);
 assert.deepStrictEqual(pack.anchors[index+3].root,fixedRoot);
 assert.match(pack.anchors[index+3].groundingContract,/virtual_ground_no_airborne_foot_plant_claim/);
}
// Entry, weight sink, wind-back and landing remain previous clean body poses.
for(const [index,sourceIndex] of [[1,1],[2,2],[9,8],[10,9],[11,10],[12,11]]){
 const active=h.v2.frames[index],clean=cleanV2.families.windup.frames[sourceIndex];
 assert.strictEqual(active.publicPath,clean.publicPath);
 assert.strictEqual(active.sha256,clean.sha256);
 assertPng(publicFile(active.publicPath),clean.sha256);
}
assert.strictEqual(h.v2.frames[0].sha256,historicalV3.frames[0].bodyOnlySha256);
assert.strictEqual(h.v2.frames[13].sha256,historicalV3.frames[13].bodyOnlySha256);
assertPng(publicFile(h.v2.frames[0].publicPath),h.v2.frames[0].sha256);
console.log('PASS V4 raw/extracted/source/public hashes, constant release scale, fixed registration/bounds report and truthful previous-art comparison');

// Historical V3 audit ONLY. These old PNGs preserve opaque body pixels; V4 does not claim that.
assert.strictEqual(historicalV3.version,3);
assert.deepStrictEqual(historicalV3.frames.filter(f=>f.auraPixels>0).map(f=>f.index),[3,4,5,6,7]);
assert(historicalV3.frames.every(f=>f.changedOpaqueBodyPixels===0));
for(const f of historicalV3.frames){
 assertPng(publicFile(f.publicPath),f.sha256);
 assertPng(path.join(base,'heaven-heavy-aura-frames-v3',path.basename(f.publicPath)),f.sha256);
 assertPng(publicFile(f.bodyOnlyPublicPath),f.bodyOnlySha256);
}
const v3Rejection=read(path.join(base,'records/heaven-heavy-v3.aura-redraw-request.json'));
assert.strictEqual(v3Rejection.decision,'REJECTED_FOR_MOTION_REVISION');
assert.strictEqual(v3Rejection.previous.v2.cinematicRevision.version,3);
const old=JSON.parse(fs.readFileSync(path.join(base,'records/heaven-heavy-v1.extended-light.rejection.json')));
assert.strictEqual(old.decision,'REJECTED_FOR_MOTION_REVISION');
assert(old.previous.v2.frames.slice(1,-1).every(f=>f.publicPath.includes('/heaven-splitter-v1/')),'Rejected extended-Light baseline preserved');
console.log('PASS historical V3 body-preservation report and PNG hash receipts retained separately from active redrawn V4');

// Execute the actual renderer guard expressions, without a DOM or a duplicate test-only predicate.
// Full browser playback remains a separate smoke; this catches accidental double aura dispatch.
const sandbox=fs.readFileSync(path.join(root,'src/lamuhlegacy/sandbox.ts'),'utf8');
const review=fs.readFileSync(path.join(root,'src/lamuhlegacy/review.ts'),'utf8');
const sandboxGuard=sandbox.match(/^\s*if\((.+)\)drawHeavenArc\(context,fighter,/m);
const reviewGuard=review.match(/^\s*if\((.+)\)\{\s*\r?\n\s*\/\/ Review-only presentation sample:/m);
assert(sandboxGuard&&reviewGuard,'Locate the real Heaven aura dispatch guards');
for(const guard of [sandboxGuard[1],reviewGuard[1]]){
 const dispatch=record=>{
  let calls=0;
  vm.runInNewContext(`if (${guard}) drawHeavenArc();`,{record,checked:()=>true,silhouette:false,entry:{moveId:'heaven_splitter_heavy'},drawHeavenArc:()=>calls++},{timeout:1000});
  return calls;
 };
 for(const record of h.v2.frames)assert.strictEqual(dispatch(record),0,'No runtime aura on any current V4 frame, including entry and recovery');
 assert.strictEqual(dispatch({auraBaked:false}),1,'Negative control: unbaked art still reaches the existing overlay path');
}
console.log('PASS empty Forge presentation track and actual review/sandbox guards suppress runtime aura for every V4 pose');

for(const outcome of ['hit','block','juggle_rejected']){
 const state={tick:101,lastCombatEvent:{tick:100,attackId:'legacy_heaven_splitter_heavy',outcome}};
 for(let age=0;age<16;age++){
  state.tick=101+age;const before=JSON.stringify(state),offset=heavyImpactOffset(state);
  assert.strictEqual(JSON.stringify(state),before,'Camera cannot mutate simulation');
  assert(Math.abs(offset.x)<=6&&Math.abs(offset.y)<=6);
  if(outcome!=='hit'||age>=5)assert.deepStrictEqual(offset,{x:0,y:0});
 }
}
assert.deepStrictEqual(heavyImpactOffset({tick:101}),{x:0,y:0});
assert.deepStrictEqual(heavyImpactOffset({tick:101,lastCombatEvent:{tick:100,attackId:'legacy_heaven_splitter_medium',outcome:'hit'}}),{x:0,y:0});
console.log('PASS hit-only pure bounded camera, with no camera impulse on block, rejection or other moves');
// Historical procedural envelope retained for the V2/V3 authoring fallback, NOT V4's baked aura timing.
const actor={kind:'lamuh_legacy_v2',currentAttack:'legacy_heaven_splitter_heavy',phaseTick:14,attackFacing:1};
for(let tick=0;tick<54;tick++){
 actor.phaseTick=tick;const before=JSON.stringify(actor),aura=sampleHeavyUppercutAura(actor);
 assert.strictEqual(JSON.stringify(actor),before,'Aura cannot mutate fighter state');
 assert.deepStrictEqual(sampleHeavyUppercutAura(actor),aura,'Repeated frozen phase must produce identical aura');
 assert(aura.alpha>=0&&aura.alpha<=1);
 if(tick<9||tick>=30)assert.strictEqual(aura.alpha,0,'Historical procedural aura ends at tick30; active V4 baked poses extend through tick34');
 if(tick>=14&&tick<20)assert.strictEqual(aura.alpha,1,'One strong uppercut exposure');
 assert.deepStrictEqual(sampleHeavyUppercutAura({...actor,attackFacing:-1}),aura,'Facing only mirrors the draw, not its rhythm');
}
for(const currentAttack of [null,'legacy_heaven_splitter_light','legacy_heaven_splitter_medium'])assert.strictEqual(sampleHeavyUppercutAura({...actor,currentAttack}).alpha,0);
console.log('PASS historical procedural fallback: deterministic phase, mirrored rhythm and no state mutation (not active V4 aura timing)');
