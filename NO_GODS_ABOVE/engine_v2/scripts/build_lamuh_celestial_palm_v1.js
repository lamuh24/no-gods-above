const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {compileFromPath}=require('./production_contracts');
const root=path.resolve(__dirname,'..'), project=path.resolve(root,'../..'), repo=project;
const base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const uri=p=>'repo://'+path.relative(project,p).replaceAll('\\','/');
const report=read(path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-celestial-palm-v1/normalization.report.json'));
const reviewPath=path.join(root,'public/lamuh-legacy-v2/review-data.json'),review=read(reviewPath);
const acceptedPath=path.join(base,'records/celestial-palm-v1.approval.json');
if(fs.existsSync(acceptedPath)) {
 const accepted=read(acceptedPath), family=read(path.join(base,'celestial-palm-family.candidate.v1.json'));
 for(const closure of Object.values(family.variants))for(const frame of closure.v2.frames)if(hash(path.join(root,'public',frame.publicPath))!==frame.sha256)throw new Error('Accepted Celestial Palm source changed: '+frame.publicPath);
 // Approval closes this generator revision. Recompile its frozen packages without reopening
 // the review gate, rewriting accepted metadata, or replacing a later family's active gate.
 if(!accepted.approvalBoundary || accepted.approvalBoundary.deployable!==false)throw new Error('Missing scoped Palm approval boundary');
 write(path.join(root,'generated/manifests/lamuh_celestial_palm_v1.candidate.runtime.json'),compileFromPath(path.join(base,'celestial-palm-packages/celestial-palm.bundle.json')));
 console.log('Verified accepted Palm sources; recompiled candidate without reopening its gate.');
 process.exit(0);
}
const idle=review.movementModernization.states.idle.frames[0], p=report.families.palm.frames,h=report.families.heavy.frames;
const template=read(path.join(base,'moves/ascend-step-light/animation.package.json'));
const output=path.join(base,'celestial-palm-packages');
const pendingPath=path.join(output,'records/human-review.pending.json'),provenancePath=path.join(output,'records/provenance.json'),metadataPath=path.join(output,'records/registration.json');
const warnings=['Local candidate: body motion, scale, sleeve alpha, support-foot registration and projectile counterplay need human review.','L/M deliberately share the legacy straight-palm action with different exposure/reach; H uses a separate braced load/recoil.','A/C are visual review candidates only; B owns playable timing.','No source V1 pixels or previously accepted forward-special frame/timing was changed.'];
write(pendingPath,{state:'pending',approvedAt:null,approvedBy:null,candidateOnly:true,deployable:false,remainingReview:warnings});
const provenance={sourceType:'ai_assisted',tool:'Built-in imagegen and source-preserving normalization',createdAt:'2026-09-05T00:00:00Z',model:null,seed:null,promptHash:null,references:[uri(path.join(root,'public',idle.publicPath)),uri(path.join(root,'public/lamuh-legacy-v2/atlases/lamuh_sheet_5_specials_atlas.png'))],cleanupOperations:['edge_connected_tight_checker_key','audited_heavy_wide_pose_crop','one_scale_per_source','support_sandal_registration','approved_idle_endpoints_reused'],revisionChain:['V1_CELESTIAL_PALM','V2_NEUTRAL_FAMILY_CANDIDATE'],humanApproval:{state:'pending',approvedAt:null,approvedBy:null},licensingNotes:['Local Lamuh candidate only.']};
write(provenancePath,provenance);write(metadataPath,{root:report.root,canvas:report.canvas,registration:report.registration,perFrameRescale:false,sourceHashes:Object.fromEntries(Object.entries(report.families).map(([id,v])=>[id,v.sourceSha256])),warnings});
const makeFrames=(frames,roles)=>frames.map((f,index)=>({...f,index,role:roles[index],contact:index===2,visibleImpact:false}));
const variants={
 light:{frames:makeFrames([idle,p[1],p[2],p[3],p[5],p[6],idle],['idle entry','compact open-palm load','single ki release','same-palm carry','elbow recoil','guard return','approved idle endpoint']),exposures:[2,7,2,2,3,5,7],phase:[9,2,17],damage:34,hitstop:4,hitstun:18,blockstun:11,socket:{x:1205,y:765},scale:report.families.palm.scale},
 medium:{frames:makeFrames([idle,p[1],p[2],p[3],p[4],p[5],p[6],idle],['idle entry','loaded open-palm guard','single ki release','shoulder carry','coat follow-through','elbow recoil','guard return','approved idle endpoint']),exposures:[4,10,3,3,4,5,5,6],phase:[14,3,23],damage:48,hitstop:5,hitstun:23,blockstun:14,socket:{x:1205,y:765},scale:report.families.palm.scale},
 heavy:{frames:makeFrames([idle,h[2],h[3],h[4],h[5],p[6],idle],['idle entry','deep crossed-forearm coil','single braced-palm release','coat and hip follow-through','weight catch and recoil','guard return','approved idle endpoint']),exposures:[5,16,4,6,7,8,10],phase:[21,4,31],damage:68,hitstop:7,hitstun:29,blockstun:18,socket:{x:1331,y:844},scale:report.families.heavy.scale}
};
const baseTimeline={durationTicks:29,exposureTicks:[5,5,5,5,5,4],durationEvidence:'historical_v1_c032',exposureEvidence:'reconstructed; exact per-pose exposure not recoverable',contactTick:null,note:'Protected V1 six-pose Palm family. Reconstructed holds, not recovered exact timing. New strength variants are V2 authoring.'};
const family={schemaVersion:'1.0.0',status:'awaiting_human_celestial_palm_family_review',candidateOnly:true,deployable:false,variants:{},humanApproval:{family:null,light:null,medium:null,heavy:null},normalizationReport:uri(path.join(repo,'tools/nga-forge/review/lamuh-legacy-v2-celestial-palm-v1/normalization.report.json')),reviewNotes:warnings,contactSheets:[report.families.palm.contactSheetPublicPath,report.families.heavy.contactSheetPublicPath]};
for(const [strength,v] of Object.entries(variants)){
 const id='celestial_palm_'+strength,attackId='legacy_'+id,total=v.exposures.reduce((a,b)=>a+b,0);
 const timing={};for(const [candidate,delta] of [['A',-2],['B',0],['C',2]]){const exp=[...v.exposures];exp[1]+=delta;exp[exp.length-1]+=delta;timing[candidate]={label:candidate==='B'?'RECOMMENDED_GAMEPLAY_ALIGNED':candidate==='A'?'COMPACT_V2_VARIANT':'HEAVIER_V2_ALTERNATE',phaseTicks:{startup:v.phase[0]+delta,active:v.phase[1],recovery:v.phase[2]+delta},durationTicks:total+2*delta,exposureTicks:exp,preservesSourceFrameOrder:true,duplicateMeaninglessFrames:false};}
 const closure={status:family.status,candidateOnly:true,deployable:false,rendererAuthoritative:false,simulationAuthoritative:true,simulationHz:60,v1:{sourceFrameCount:6,historicalDurationTicks:29,reconstructedExposureTicks:baseTimeline.exposureTicks,exposureEvidence:baseTimeline.exposureEvidence,root:{x:224,y:382},visibleBounds:[],bodyCenters:[],contactFrame:2,exactContactTick:null,note:baseTimeline.note},v2:{canvas:report.canvas,root:report.root,rootPath:v.frames.map(f=>f.root),frames:v.frames,contactFrame:2,contactFrames:[2],contactPresentation:{publicPath:v.frames[2].publicPath,sha256:v.frames[2].sha256,bodyOnlyOnWhiff:true,bodyOnlyForAllOutcomes:true,vfxEnabled:false,allowedOutcomes:[],separationStatus:'simulation_owned_projectile_separate_from_opaque_body'},singleSequenceScale:v.scale,perFrameRescale:false,visualRecentering:false,placementPolicy:'fixed root; one scale per source; tracked support sandal; approved idle endpoints',visibleImpactCount:1,gameplayHitCount:1,releaseSocket:v.socket},timingCandidates:timing,recommendedTimingCandidate:'B',impactCandidates:{I1:{label:'COMPACT',hitstopTicks:v.hitstop-1,contactExposureDelta:0,recoilExposureDelta:0,recoveryExposureDelta:0},I2:{label:'AUTHORED',hitstopTicks:v.hitstop,contactExposureDelta:0,recoilExposureDelta:0,recoveryExposureDelta:0},I3:{label:'HEAVIER',hitstopTicks:v.hitstop+1,contactExposureDelta:0,recoilExposureDelta:0,recoveryExposureDelta:0}},recommendedImpactCandidate:'I2',unsupported:{counterHit:'UNSUPPORTED — not invented'}};
 closure.v1.visibleBounds=report.v1Frames.map(f=>f.visibleBounds);closure.v1.bodyCenters=report.v1Frames.map(f=>f.bodyCenter);
 family.variants[strength]=closure;
 const move={moveId:id,sourceFrameCount:6,authoredFrameCount:v.frames.length,contactSourceFrames:[2],v1Historical:baseTimeline,candidates:timing,recommendedCandidate:'B',humanReviewStatus:family.status,note:baseTimeline.note+' V2 body contact marker means projectile RELEASE, not guaranteed hit; collision owns impact.'};
 review.timingCandidates.moves=review.timingCandidates.moves.filter(x=>x.moveId!==id).concat(move);
 const pack=structuredClone(template);pack.id=id;pack.simulationLength=total;
 pack.sourceFrames=v.frames.map((frame,index)=>({id:id+'_frame_'+index,sourceUri:uri(path.join(root,'public',frame.publicPath)),width:2048,height:1536,sha256:frame.sha256,approvalUri:uri(pendingPath),provenanceUri:uri(provenancePath),metadataUri:uri(metadataPath)}));
 let cursor=0;pack.exposures=v.exposures.map((duration,index)=>{const e={sourceFrameId:pack.sourceFrames[index].id,start:cursor,duration};cursor+=duration;return e;});
 pack.phases={anticipation:[],startup:[{start:0,end:v.phase[0]-1}],active:[{start:v.phase[0],end:v.phase[0]+v.phase[1]-1}],impact:[],followThrough:[],recovery:[{start:v.phase[0]+v.phase[1],end:total-1}]};
 pack.anchors=pack.exposures.map((e,index)=>({frame:e.start,sourceFrameId:e.sourceFrameId,root:report.root,feet:{x:664,y:1360},nearFoot:{x:664,y:1360},farFoot:report.root,effect:v.socket,groundingContract:'support_sandal_registration_v1_far_foot_unmeasured'}));
 pack.groundingTrack=pack.sourceFrames.map(f=>({sourceFrameId:f.id,root:report.root,nearFoot:{x:664,y:1360},farFoot:report.root,nearFootRole:'screen_left_support_sandal',farFootRole:'unmeasured_registration_reference_not_support',projectedGroundPlaneY:1360,contractVersion:'support_sandal_registration_v1_far_foot_unmeasured'}));
 pack.combatTrack={startup:v.phase[0],active:v.phase[1],recovery:v.phase[2],damage:v.damage,hitstop:v.hitstop,hitstun:v.hitstun,blockstun:v.blockstun,boxes:[],cancelWindows:[],timingAuthorship:{...template.combatTrack.timingAuthorship,authoredTotalDuration:total,timingExceptions:[]},projectileContract:{owner:'deterministic_simulation',attackId,releaseTick:v.phase[0],maxHits:1,independentAfterRelease:true,bodyHitboxes:false}};
 const shotSize={light:26,medium:34,heavy:42}[strength];
 pack.combatTrack.projectileTrack={...pack.combatTrack.projectileContract,damage:v.damage,spawnOffset:{x:strength==='heavy'?130:100,y:strength==='heavy'?-119:-137},speed:{light:8,medium:10,heavy:12}[strength],gravity:.18,maxTravel:{light:300,medium:420,heavy:540}[strength],lifeTicks:90,collisionRect:{x:-shotSize/2,y:-shotSize/2,w:shotSize,h:shotSize}};
 delete pack.combatTrack.projectileContract;
 pack.combatTrack.projectileTrack.lifeTicks={light:48,medium:54,heavy:60}[strength];
 pack.presentationTrack=[{index:0,frame:v.phase[0],type:'spawn_vfx',eventIdTemplate:'{matchId}:{simulationFrame}:{fighterId}:{moveInstance}:{eventIndex}',payload:{socket:'palm_release',candidateOnly:true,requiresAuthoritativeProjectileSpawn:true}}];
 pack.presentationSockets=[{id:'palm_release',...v.socket,mirrorRule:'x_prime_equals_canvas_width_minus_x',eventTypes:['spawn_vfx']}];
 pack.approvalRecords=[uri(pendingPath)];pack.provenance=provenance;pack.validation={...pack.validation,creativeWarnings:warnings,humanApprovalRequired:true};
 pack.transitions=[];pack.transitionCompatibility=[{fromStates:['idle','walk_forward','walk_backward','crouch'],toState:id,condition:'neutral_special_input',addsGameplayFrames:false}];
 pack.gameplayTimingStatus={owner:'simulation',state:'sandbox_candidate_awaiting_combat_approval',authoritative:false,candidateValues:{startup:v.phase[0],active:v.phase[1],recovery:v.phase[2],damage:v.damage},notes:warnings};
 write(path.join(output,strength,'animation.package.json'),pack);
}
write(path.join(base,'celestial-palm-family.candidate.v1.json'),family);
write(path.join(root,'public/lamuh-legacy-v2/celestial-palm-v1/manifest.json'),family);
review.celestialPalmFamily=family;
review.ascendStepClosure.status=review.ascendStepFamily.status;
for(const closure of Object.values(review.ascendStepFamily.variants))closure.status=review.ascendStepFamily.status;
const first=read(path.join(base,'first-playable.bundle.json'));
for(const strength of Object.keys(variants)){const id='celestial_palm_'+strength;if(!first.coverage.specials.includes(id))first.coverage.specials.push(id);}
first.technicalStatus='FORWARD_SPECIALS_STARRED_CELESTIAL_PALM_LMH_PLAYABLE_CANDIDATE';
first.additiveForgeBundles=[{path:'celestial-palm-packages/celestial-palm.bundle.json',packageCount:3,role:'neutral_specials'}];
const closurePath=path.join(base,'records/first-playable-closure.pending.json'),pendingClosure=read(closurePath);
pendingClosure.humanReviewStatus=first.humanReviewStatus;
pendingClosure.forwardSpecialsProvisionalReceipt=review.ascendStepFamily.approvalReceipt;
pendingClosure.activeFamilyReview='celestial_palm_light_medium_heavy';
pendingClosure.currentReviewFocus={...pendingClosure.currentReviewFocus,...first.currentReviewGate};write(closurePath,pendingClosure);
write(path.join(base,'first-playable.bundle.json'),first);review.firstPlayable=first;write(reviewPath,review);
const bundle={...read(path.join(base,'character.bundle.json')),id:'lamuh_celestial_palm_v1',displayName:'Lamuh Celestial Palm candidate',promotionState:'candidate',animationPackages:['light','medium','heavy'].map(s=>s+'/animation.package.json'),packageGroups:{neutral_specials:Object.keys(variants).map(s=>'celestial_palm_'+s)}};
write(path.join(output,'celestial-palm.bundle.json'),bundle);
const compiled=compileFromPath(path.join(output,'celestial-palm.bundle.json'));
write(path.join(root,'generated/manifests/lamuh_celestial_palm_v1.candidate.runtime.json'),compiled);
const lockPath=path.join(base,'records/celestial-palm-v1.hash-lock.json');
write(lockPath,{candidateOnly:true,deployable:false,frames:Object.fromEntries(Object.entries(family.variants).map(([id,c])=>[id,c.v2.frames.map(f=>({publicPath:f.publicPath,sha256:f.sha256}))])),sourceSheetHashes:Object.fromEntries(Object.entries(report.families).map(([id,v])=>[id,v.sourceSha256]))});
console.log('Packaged Celestial Palm L/M/H; 28/40/56 independently authored ticks. Candidate only.');
