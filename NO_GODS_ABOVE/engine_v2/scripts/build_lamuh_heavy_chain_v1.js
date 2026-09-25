const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {compileFromPath}=require('./production_contracts');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../..'),pub=path.join(root,'public'),base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri=p=>'repo://'+path.relative(repo,p).replaceAll('\\','/');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const review=read(path.join(pub,'lamuh-legacy-v2/review-data.json'));
const idle=review.movementModernization.states.idle.frames[0];
const light=read(path.join(repo,'tools/nga-forge/review/lamuh-forward-light-clean-v2/normalization.report.json')).frames;
const kick=read(path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-ascend-heavy-kick-chain-v1/normalization.report.json')).frames;
const heavy=read(path.join(pub,'lamuh-legacy-v2/ascend-heavy-clean-v2/manifest.json')).heavy.v2.frames;
const fx=read(path.join(repo,'tools/nga-forge/review/lamuh-heavy-chain-fx-v1/normalization.report.json')).frames;
const releaseReport=path.join(repo,'tools/nga-forge/review/lamuh-heavy-chain-release-v1/normalization.report.json');
assert(fs.existsSync(releaseReport),'Normalize empty-palm release before packaging');
const release=read(releaseReport).frames[0];
const seq=(frames,holds,contact)=>({frames:frames.map((f,index)=>({...f,index,contact:index===contact,visibleImpact:index===contact})),exposureTicks:holds,durationTicks:holds.reduce((a,b)=>a+b,0),contactFrame:contact});
const manifest={schemaVersion:'1.0.0',candidateOnly:true,deployable:false,humanApproval:null,status:'awaiting_human_heavy_punch_vanish_kick_ball_review',
 opener:seq([idle,...light,idle],[2,3,3,2,3,3,4,4,6],4),
 response:seq([light[3],light[4],light[5],fx[0],fx[1],kick[0],kick[1],kick[2],kick[3],kick[4],kick[5],heavy[5],heavy[6],release,heavy[8],heavy[9],idle],[4,3,3,3,3,4,2,3,3,3,2,1,2,4,5,6,13],7),
 projectileFrames:fx.slice(2),projectileExposureTicks:[3,3],
 sockets:{opener:{x:1175,y:860},kick:{x:1410,y:826},ball:{x:1020,y:948}},
 notes:['Only forward Heavy changed; Light/Medium/Divine source and combat preserved.','Unblocked genuine opener confirms sequence; block/whiff use30tick opener recovery.','Victim pause is simulation-owned hitstun, never a renderer freeze or arbitrary victim teleport.','Response vanish10-15, relocate14, kick22-24, real projectile36; end64.','World arena boundaries and legal side-switch fallback remain enforced.','New kick and aura sprite frames are human-review candidates.']};
const def=require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks.legacy_ascend_step_heavy;
const response=def.hitConfirm?.response;assert(response,'Compile Heavy hit-confirm core first');
manifest.combat={opener:def,response};
for(const [mode,d]of [['opener',def],['response',response]]){
 const s=manifest[mode];assert.equal(s.durationTicks,d.startup+d.active+d.recovery);let cursor=0;
 for(let i=0;i<s.frames.length;i++){const f=s.frames[i];assert.equal(hash(path.join(pub,f.publicPath)),f.sha256);if(f.contact)assert.equal(cursor,d.hitboxes[0].start);cursor+=s.exposureTicks[i];}
}
for(const f of manifest.projectileFrames)assert.equal(hash(path.join(pub,f.publicPath)),f.sha256);
const out=path.join(base,'heavy-chain-packages-v1'),approval=path.join(out,'records/human-review.pending.json'),metadata=path.join(out,'records/registration.json'),provenanceFile=path.join(out,'records/provenance.json');
const template=read(path.join(base,'divine-vanish-packages/light/animation.package.json'));
const provenance={...template.provenance,references:[uri(releaseReport)],revisionChain:['FORWARD_HEAVY_OLD_SOURCES_PRESERVED','HUMAN_REQUESTED_PUNCH_VANISH_KICK_PROJECTILE_V1'],humanApproval:{state:'pending',approvedAt:null,approvedBy:null}};
write(approval,{state:'pending',candidateOnly:true,deployable:false,approvedAt:null,approvedBy:null});write(metadata,manifest);write(provenanceFile,provenance);
const ballDefinition={startup:36,active:1,recovery:27,hitboxes:[response.projectile.hitbox],projectile:response.projectile};
for(const [mode,d]of [['opener',def],['response',response],['ball',ballDefinition]]){
 const s=manifest[mode==='ball'?'response':mode],p=structuredClone(template),id='ascend_heavy_chain_'+mode;let cursor=0;
 p.id=id;p.simulationLength=s.durationTicks;p.provenance=provenance;
 p.sourceFrames=s.frames.map((f,i)=>({id:id+'_frame_'+i,sourceUri:uri(path.join(pub,f.publicPath)),width:2048,height:1536,sha256:f.sha256,approvalUri:uri(approval),metadataUri:uri(metadata),provenanceUri:uri(provenanceFile)}));
 p.exposures=s.exposureTicks.map((duration,i)=>{const e={sourceFrameId:p.sourceFrames[i].id,start:cursor,duration};cursor+=duration;return e;});
 p.phases={anticipation:[],startup:[{start:0,end:d.startup-1}],active:[{start:d.startup,end:d.startup+d.active-1}],impact:[],followThrough:[],recovery:[{start:d.startup+d.active,end:s.durationTicks-1}]};
 p.anchors=p.exposures.map(e=>({frame:e.start,sourceFrameId:e.sourceFrameId,root:{x:768,y:1360},feet:{x:768,y:1360},effect:{x:768,y:1360}}));
 p.groundingTrack=p.sourceFrames.map(f=>({sourceFrameId:f.id,root:{x:768,y:1360},nearFoot:{x:768,y:1360},farFoot:{x:768,y:1360},nearFootRole:'fixed_registration_not_foot_measurement',farFootRole:'fixed_registration_not_foot_measurement',projectedGroundPlaneY:1360,contractVersion:'fixed_root_candidate_v1'}));
 const h=d.hitboxes[0];p.combatTrack={startup:d.startup,active:d.active,recovery:d.recovery,damage:h.damage,hitstop:h.hitstop,hitstun:h.hitstun,blockstun:h.blockstun,boxes:Array.from({length:h.end-h.start+1},(_,i)=>({frame:h.start+i,kind:'hit',x:h.rect.x,y:h.rect.y,width:h.rect.w,height:h.rect.h})),cancelWindows:[],timingAuthorship:{...template.combatTrack.timingAuthorship,authoredTotalDuration:s.durationTicks},hitConfirmTrack:mode==='opener'?{trigger:'unblocked_body_hit',response:'ascend_heavy_chain_response'}:undefined,projectileTrack:mode==='ball'?{...d.projectile,owner:'deterministic_simulation',maxHits:1,independentAfterRelease:true,bodyHitboxes:false,attackId:def.id,collisionRect:d.projectile.hitbox.rect,damage:d.projectile.hitbox.damage}:undefined};
 if(mode==='ball')p.combatTrack.boxes=[];
 p.transitionCompatibility=[{fromStates:mode==='opener'?['idle','walk_forward']:['ascend_heavy_chain_opener'],toState:id,condition:mode==='opener'?'forward_special_heavy':'genuine_unblocked_punch',addsGameplayFrames:false}];
 p.approvalRecords=[uri(approval)];p.validation.creativeWarnings=manifest.notes;p.gameplayTimingStatus={owner:'simulation',state:'sandbox_candidate_awaiting_combat_approval',authoritative:false,candidateValues:{startup:d.startup,active:d.active,recovery:d.recovery,damage:h.damage},notes:manifest.notes};
 write(path.join(out,mode,'animation.package.json'),p);
}
const bundlePath=path.join(out,'heavy-chain.bundle.json');write(bundlePath,{...read(path.join(base,'character.bundle.json')),id:'lamuh_heavy_chain_v1',displayName:'Lamuh Heavy punch vanish kick aura-ball candidate',animationPackages:['opener/animation.package.json','response/animation.package.json','ball/animation.package.json'],packageGroups:{heavy_chain:['ascend_heavy_chain_opener','ascend_heavy_chain_response','ascend_heavy_chain_ball']}});
write(path.join(root,'generated/manifests/lamuh_heavy_chain_v1.candidate.runtime.json'),compileFromPath(bundlePath));
write(path.join(pub,'lamuh-legacy-v2/heavy-chain-v1/manifest.json'),manifest);write(path.join(base,'heavy-chain-v1/manifest.json'),manifest);
console.log('Heavy chain source hashes, contacts and additive Forge bundle compiled');
