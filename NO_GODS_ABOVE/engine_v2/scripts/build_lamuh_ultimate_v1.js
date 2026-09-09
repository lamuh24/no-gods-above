const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {compileFromPath}=require('./production_contracts');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../..'),pub=path.join(root,'public');
const base=path.join(root,'content-source/characters/lamuh-legacy-v2'),review=path.join(repo,'tools/nga-forge/review/lamuh-ultimate-v1');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri=p=>'repo://'+path.relative(repo,p).replaceAll('\\','/');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const reports=Object.fromEntries(['combo','charge','vfx'].map(k=>[k,read(path.join(review,k+'-normalization.json'))]));
assert.equal(reports.combo.frames.length,8);assert.equal(reports.charge.frames.length,6);assert.equal(reports.vfx.frames.length,4);
const sourceDir=path.join(base,'ultimate-frames-v1');
const origin=new Map(Object.entries(reports).flatMap(([k,r])=>r.frames.map(f=>[f.publicPath,uri(path.join(review,k+'-normalization.json'))])));
const idlePath='/lamuh-legacy-v2/movement-v2/idle-00.png';
const idle={publicPath:idlePath,sha256:hash(path.join(pub,idlePath)),root:{x:768,y:1360},role:'exact approved movement idle'};
const c=reports.combo.frames,q=reports.charge.frames;
const plans={
 starter:[[c[0],c[1],c[2],c[3],c[0],idle],[10,8,4,8,10,12]],
 confirm:[[c[2],c[3]],[8,10]],elbow:[[c[3],c[4],c[5]],[6,6,12]],knee:[[c[5],c[6],c[7]],[8,8,8]],
 charge:[[c[7],q[0]],[12,88]],
 beam:[[q[5]],[36]],recovery:[[q[5],q[0],c[7],c[0],idle],[6,6,8,8,10]]
};
const sequences=Object.fromEntries(Object.entries(plans).map(([k,[frames,exposureTicks]])=>[k,{
 frames:frames.map((f,index)=>({...f,index,sourcePoseIndex:f.index??0,sourceNormalizationUri:origin.get(f.publicPath)??null,
  sourceOrigin:origin.has(f.publicPath)?'normalized_candidate_art':'exact_existing_movement_idle',exposureTicks:exposureTicks[index]})),
 exposureTicks,durationTicks:exposureTicks.reduce((a,b)=>a+b,0)}]));
const attack=require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks.legacy_crown_of_no_gods;
const phaseStarts={confirm:0,elbow:18,knee:42,charge:66,beam:166,recovery:202};
assert.equal(sequences.starter.durationTicks,attack.startup+attack.active+attack.recovery);
assert.equal(Object.entries(sequences).filter(([k])=>k!=='starter').reduce((n,[,s])=>n+s.durationTicks,0),240);
// Normalized beam is horizontally authored. Renderer uses this source reach,
// not collision geometry; final source registration remains independently inspectable.
const beamLengthPixels=900;
const chargeBall={frames:read(path.join(pub,'lamuh-legacy-v2/counter-launch-v4/manifest.json')).projectileFrames,
 sourceDiameterPixels:193,startTick:66,releaseTick:166,minDiameter:24,maxDiameter:240,
 handSockets:{'combo-07.png':{x:625,y:988,direction:-1},'charge-00.png':{x:656,y:982,direction:-1},
 'charge-01.png':{x:730,y:993,direction:-1},'charge-02.png':{x:872,y:986,direction:1},
 'charge-03.png':{x:679,y:953,direction:-1},'charge-04.png':{x:711,y:967,direction:-1}},
 policy:'presentation-only monotonic growth; authored per-view cupped-hand sockets; consumed into beam on release'};
const manifest={schemaVersion:'1.0.0',candidateOnly:true,deployable:false,humanApproval:null,status:'awaiting_human_ultimate_motion_review',
 sequences,chargeBall,auraFrames:reports.vfx.frames.slice(0,2),beamFrames:reports.vfx.frames.slice(2).map(f=>({...f,root:{x:768,y:1124},beamAnchorNote:'actual source beam center registration'})),beamLengthPixels,
 combatProfile:attack,confirmedInteraction:{owner:'deterministic_simulation',sourceUri:uri(path.join(root,'src/core/engine.ts')),
 phaseStarts,durationTicks:240,contacts:[{phase:'starter',tick:18,damage:40},{phase:'confirmed',tick:24,damage:50},{phase:'confirmed',tick:50,damage:60},{phase:'confirmed',tick:178,damage:130}],
 damagePolicy:'existing_combo_entry_scaling',visibleImpactCount:4,beamReleaseTick:166,transformation:'ultimate_charge_only_reverts_in_recovery'},
 notes:['User approved concept, not this final motion candidate.','Charge holds a planted pose; the actual Tribunal PerspectiveCamera orbits the fixed combat plane. Previous angle cycling was rejected as character spinning.',
 'Body and aura/beam are separate source layers; rendering never applies damage.','Individual source frames remain truth; generated atlases are deployment artifacts only.',
 'Starter spend100 with ordinary16hit/5block meter gain; no confirmed followup meter gain.'],
 promptProvenance:uri(path.join(review,'README.md'))};
for(const f of [...Object.values(sequences).flatMap(s=>s.frames),...manifest.auraFrames,...manifest.beamFrames,...chargeBall.frames]){
 assert.equal(hash(path.join(pub,f.publicPath)),f.sha256);
 if(origin.has(f.publicPath))assert.equal(hash(path.join(sourceDir,path.basename(f.publicPath))),f.sha256,'source/public parity');
}
const out=path.join(base,'ultimate-packages-v1'),approval=path.join(out,'records/human-review.pending.json'),metadata=path.join(out,'records/registration.json'),provPath=path.join(out,'records/provenance.json');
const template=read(path.join(base,'divine-vanish-packages/light/animation.package.json'));
const provenance={...template.provenance,createdAt:'2026-09-08',references:Object.keys(reports).map(k=>uri(path.join(review,k+'-normalization.json'))),
 cleanupOperations:['alpha_preserving_normalization','source_hash_lock','fixed_root_registration','exact_idle_reuse'],revisionChain:['USER_APPROVED_CELESTIAL_CROWN_CONCEPT','ULTIMATE_V1_MOTION_CANDIDATE'],humanApproval:{state:'pending',approvedAt:null,approvedBy:null},promptProvenance:manifest.promptProvenance};
write(approval,{state:'pending',candidateOnly:true,deployable:false,approvedAt:null,approvedBy:null});write(metadata,manifest);write(provPath,provenance);
for(const [key,s] of Object.entries(sequences)){
 const p=structuredClone(template),id='crown_'+key;p.id=id;p.simulationLength=s.durationTicks;p.provenance=provenance;
 p.sourceFrames=s.frames.map((f,i)=>({id:id+'_'+i,sourceUri:uri(origin.has(f.publicPath)?path.join(sourceDir,path.basename(f.publicPath)):path.join(pub,f.publicPath)),width:2048,height:1536,sha256:f.sha256,approvalUri:uri(approval),metadataUri:uri(metadata),provenanceUri:uri(provPath)}));
 let cursor=0;p.exposures=s.exposureTicks.map((duration,i)=>{const e={sourceFrameId:p.sourceFrames[i].id,start:cursor,duration};cursor+=duration;return e;});
 p.phases={anticipation:[],startup:[],active:[],impact:[],followThrough:[],recovery:[{start:0,end:s.durationTicks-1}]};
 p.anchors=p.exposures.map(e=>({frame:e.start,sourceFrameId:e.sourceFrameId,root:{x:768,y:1360},feet:{x:768,y:1360},effect:{x:768,y:1360}}));
 p.groundingTrack=p.sourceFrames.map(f=>({sourceFrameId:f.id,root:{x:768,y:1360},nearFoot:{x:768,y:1360},farFoot:{x:768,y:1360},nearFootRole:'fixed_registration_not_foot_measurement',farFootRole:'fixed_registration_not_foot_measurement',projectedGroundPlaneY:1360,contractVersion:'fixed_root_candidate_v1'}));
 p.combatTrack={startup:0,active:0,recovery:s.durationTicks,damage:0,hitstop:0,hitstun:0,blockstun:0,boxes:[],cancelWindows:[],timingAuthorship:{...template.combatTrack.timingAuthorship,authoredTotalDuration:s.durationTicks}};
 if(key==='starter'){const h=attack.hitboxes[0];Object.assign(p.combatTrack,{startup:attack.startup,active:attack.active,recovery:attack.recovery,damage:h.damage,hitstop:h.hitstop,hitstun:h.hitstun,blockstun:h.blockstun,boxes:Array.from({length:attack.active},(_,i)=>({frame:attack.startup+i,kind:'hit',x:h.rect.x,y:h.rect.y,width:h.rect.w,height:h.rect.h}))});
 p.phases={...p.phases,startup:[{start:0,end:17}],active:[{start:18,end:21}],recovery:[{start:22,end:51}]};}
 p.confirmedInteractionReference=manifest.confirmedInteraction;p.presentationTrack=[];p.transitions=[];p.landing=[];p.interruptPoses=[];
 p.entryPose={...p.entryPose,id:key+'_entry'};p.exitPose={...p.exitPose,id:key+'_exit'};
 p.transitionCompatibility=[{fromStates:['attack'],toState:id,condition:'simulation_owns_crown_'+key,addsGameplayFrames:false}];
 p.gameplayTimingStatus={owner:'simulation',state:'sandbox_candidate_awaiting_combat_approval',authoritative:false,candidateValues:{duration:s.durationTicks},notes:manifest.notes};
 p.approvalRecords=[uri(approval)];p.validation.creativeWarnings=manifest.notes;
 write(path.join(out,key,'animation.package.json'),p);
}
const bundlePath=path.join(out,'ultimate.bundle.json');
const characterTemplate=read(path.join(base,'character.bundle.json'));
write(bundlePath,{...characterTemplate,poseLibrary:[...characterTemplate.poseLibrary,...Object.keys(sequences).flatMap(k=>['entry','exit'].map(edge=>({...template.entryPose,id:k+'_'+edge})))],id:'lamuh_ultimate_v1',displayName:'Lamuh celestial ultimate candidate',animationPackages:Object.keys(sequences).map(k=>k+'/animation.package.json'),packageGroups:{ultimate:Object.keys(sequences).map(k=>'crown_'+k)}});
write(path.join(root,'generated/manifests/lamuh_ultimate_v1.candidate.runtime.json'),compileFromPath(bundlePath));
write(path.join(pub,'lamuh-legacy-v2/ultimate-v1/manifest.json'),manifest);write(path.join(base,'ultimate-v1/manifest.json'),manifest);
console.log('Crown 52-tick starter, 240-tick confirmed sequence, source hashes and seven Forge packages compiled.');
