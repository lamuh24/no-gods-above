const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {compileFromPath}=require('./production_contracts');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../..'),pub=path.join(root,'public'),base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const uri=p=>'repo://'+path.relative(repo,p).replaceAll('\\','/');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const old=read(path.join(pub,'lamuh-legacy-v2/divine-vanish-v3/manifest.json'));
const artPath=path.join(repo,'tools/nga-forge/review/lamuh-counter-launch-v4/normalization.report.json'),art=read(artPath).frames;
const fx=read(path.join(repo,'tools/nga-forge/review/lamuh-heavy-chain-fx-v1/normalization.report.json')).frames;
const attack=require('../dist/data/fighters').fighterDefinitions.lamuh_legacy_v2.attacks.legacy_divine_vanish_heavy;
const response=attack.strikeCounter.response,projectile=response.projectile;
assert(projectile,'Compile counter kick/projectile core before packaging');
const idle=old.stance.frames.at(-1),settle=old.stance.frames.at(-2);
const frames=[fx[0],...art,settle,idle].map((f,index)=>({...f,index,contact:index===3,visibleImpact:index===3}));
const exposureTicks=[5,5,2,3,4,3,10,5,6,4,8];
const manifest={schemaVersion:'1.0.0',candidateOnly:true,deployable:false,humanApproval:null,status:'awaiting_human_divine_counter_kick_ball_review',
 stance:{frames:[idle,art[7],idle].map((f,index)=>({...f,index,contact:false,visibleImpact:false})),exposureTicks:[2,30,8],durationTicks:40,contactFrame:null,visibleImpactCount:0},response:{frames,exposureTicks,durationTicks:55,contactFrame:3,visibleImpactCount:2,combatProfile:response},
 projectileFrames:fx.slice(2),projectileExposureTicks:[3,3],
 sockets:{kick:{x:1210,y:572},ball:{x:1085,y:636}},
 counterTrack:{...old.counterTrack,responseStartup:response.startup,responseActive:response.active,responseRecovery:response.recovery},
 notes:['Only Divine Vanish Heavy retaliation changed; stance40 and window6-17 unchanged.','Response55: aura-only0-4, kick12-14, long launch and charge, independent diagonal ball32, recovery ends54.','Kick28 plus ball44 nominal; standard unscaled-start route68 after normal scaling.','Kick velocity12,-18; delayed ball32,-6. Clear separation before shot; corners constrain available travel.','Fixed projectile trajectory; no homing, puppet target, victim teleport or renderer-owned damage.','Existing V3 and all other special source frames are preserved; new artwork awaits human motion approval.']};
assert.equal(exposureTicks.reduce((a,b)=>a+b,0),response.startup+response.active+response.recovery);
assert.equal(exposureTicks.slice(0,3).reduce((a,b)=>a+b,0),response.hitboxes[0].start);
assert.equal(exposureTicks.slice(0,7).reduce((a,b)=>a+b,0),projectile.releaseTick);
for(const f of [...frames,...manifest.stance.frames,...manifest.projectileFrames])assert.equal(hash(path.join(pub,f.publicPath)),f.sha256);
const out=path.join(base,'counter-launch-packages-v4'),approval=path.join(out,'records/human-review.pending.json'),metadata=path.join(out,'records/registration.json'),provPath=path.join(out,'records/provenance.json');
const template=read(path.join(base,'divine-vanish-packages/light/animation.package.json'));
const provenance={...template.provenance,references:[uri(artPath)],revisionChain:['DIVINE_COUNTER_V3_PRESERVED','USER_REQUESTED_RISING_KICK_DIAGONAL_AURA_BALL_V4'],humanApproval:{state:'pending',approvedAt:null,approvedBy:null}};
write(approval,{state:'pending',candidateOnly:true,deployable:false,approvedAt:null,approvedBy:null});write(metadata,manifest);write(provPath,provenance);
for(const mode of ['stance','kick','ball']){
 const s=mode==='stance'?manifest.stance:manifest.response;
 const d=mode==='stance'?attack:mode==='kick'?response:{startup:32,active:1,recovery:22,hitboxes:[projectile.hitbox]};
 const p=structuredClone(template),id='divine_counter_launch_'+mode;let cursor=0;
 p.id=id;p.simulationLength=s.durationTicks;p.provenance=provenance;
 p.sourceFrames=s.frames.map((f,i)=>({id:id+'_frame_'+i,sourceUri:uri(path.join(pub,f.publicPath)),width:2048,height:1536,sha256:f.sha256,approvalUri:uri(approval),metadataUri:uri(metadata),provenanceUri:uri(provPath)}));
 p.exposures=s.exposureTicks.map((duration,i)=>{const e={sourceFrameId:p.sourceFrames[i].id,start:cursor,duration};cursor+=duration;return e;});
 p.phases={anticipation:[],startup:[{start:0,end:d.startup-1}],active:d.active?[{start:d.startup,end:d.startup+d.active-1}]:[],impact:[],followThrough:[],recovery:[{start:d.startup+d.active,end:s.durationTicks-1}]};
 p.anchors=p.exposures.map(e=>({frame:e.start,sourceFrameId:e.sourceFrameId,root:{x:768,y:1360},feet:{x:768,y:1360},effect:{x:768,y:1360}}));
 p.groundingTrack=p.sourceFrames.map(f=>({sourceFrameId:f.id,root:{x:768,y:1360},nearFoot:{x:768,y:1360},farFoot:{x:768,y:1360},nearFootRole:'fixed_registration_not_foot_measurement',farFootRole:'fixed_registration_not_foot_measurement',projectedGroundPlaneY:1360,contractVersion:'fixed_root_candidate_v1'}));
 const h=d.hitboxes[0];p.combatTrack={startup:d.startup,active:d.active,recovery:d.recovery,damage:h?.damage||0,hitstop:h?.hitstop||0,hitstun:h?.hitstun||0,blockstun:h?.blockstun||0,boxes:mode==='kick'?Array.from({length:3},(_,i)=>({frame:12+i,kind:'hit',x:h.rect.x,y:h.rect.y,width:h.rect.w,height:h.rect.h})):[],cancelWindows:[],timingAuthorship:{...template.combatTrack.timingAuthorship,authoredTotalDuration:s.durationTicks}};
 if(mode==='stance')p.combatTrack.counterTrack=manifest.counterTrack;
 if(mode==='ball')p.combatTrack.projectileTrack={...projectile,owner:'deterministic_simulation',maxHits:1,independentAfterRelease:true,bodyHitboxes:false,attackId:attack.id,collisionRect:projectile.hitbox.rect,damage:projectile.hitbox.damage};
 p.transitionCompatibility=[{fromStates:mode==='stance'?['idle','walk_backward','crouch']:['divine_counter_launch_stance'],toState:id,condition:mode==='stance'?'grounded_back_special_heavy_input':'simulation_confirmed_body_strike_counter',addsGameplayFrames:false}];
 p.approvalRecords=[uri(approval)];p.validation.creativeWarnings=manifest.notes;p.gameplayTimingStatus={owner:'simulation',state:'sandbox_candidate_awaiting_combat_approval',authoritative:false,candidateValues:{startup:d.startup,active:d.active,recovery:d.recovery,damage:h?.damage||0},notes:manifest.notes};
 write(path.join(out,mode,'animation.package.json'),p);
}
const bundlePath=path.join(out,'counter-launch.bundle.json');write(bundlePath,{...read(path.join(base,'character.bundle.json')),id:'lamuh_counter_launch_v4',displayName:'Lamuh counter rising kick diagonal ball candidate',animationPackages:['stance/animation.package.json','kick/animation.package.json','ball/animation.package.json'],packageGroups:{counter_launch:['divine_counter_launch_stance','divine_counter_launch_kick','divine_counter_launch_ball']}});
write(path.join(root,'generated/manifests/lamuh_counter_launch_v4.candidate.runtime.json'),compileFromPath(bundlePath));
write(path.join(pub,'lamuh-legacy-v2/counter-launch-v4/manifest.json'),manifest);write(path.join(base,'counter-launch-v4/manifest.json'),manifest);
console.log('Counter launch V4 source hashes,55-tick delayed-shot timeline and three Forge tracks compiled');
