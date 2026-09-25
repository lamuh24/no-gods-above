import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(), engine=path.join(root,'NO_GODS_ABOVE/engine_v2'),pub=path.join(engine,'public');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const base=read(path.join(pub,'lamuh-legacy-v2/review-data.json'));
const report=read(path.join(root,'tools/nga-forge/review/lamuh-forward-light-clean-v2/normalization.report.json'));
const idle=structuredClone(base.movementModernization.states.idle.frames[0]);
const light=structuredClone(base.ascendStepFamily.variants.light);
light.status='CANDIDATE_AWAITING_HUMAN_REVIEW';light.humanApproval=null;
light.identityLock.humanApproval=null;
light.v2.frames=[idle,...report.frames.map(f=>({...f,publicPath:f.publicPath.replace('clean-v1/','clean-v2/')})),idle].map((f,index)=>({...f,index,contact:index===4,visibleImpact:index===4}));
light.v2.contactFrame=4;light.v2.contactPresentation={...light.v2.contactPresentation,publicPath:light.v2.frames[4].publicPath,sha256:light.v2.frames[4].sha256};
light.v2.rootPath=light.v2.frames.map(f=>f.root);
light.v2.singleActionContract={...light.v2.singleActionContract,contactFrame:4,poseProgression:light.v2.frames.map(f=>f.role)};
light.v2.placementPolicy='Fixed root, one authored camera scale; simulation unchanged';
light.v2.mobilityIdentity.auraFrames=[2,3,4,5];
light.v2.mobilityIdentity.strongestAuraFrame=4;
light.normalizationReport={path:'tools/nga-forge/review/lamuh-forward-light-clean-v2/normalization.report.json'};
delete light.hashLock;delete light.styleApproval;
const timings={A:[1,1,1,1,4,3,3,2,2],B:[1,1,2,1,4,3,3,3,2],C:[1,2,2,1,5,3,3,3,3]};
for(const [k,exposureTicks] of Object.entries(timings))light.timingCandidates[k]={...light.timingCandidates[k],exposureTicks,durationTicks:exposureTicks.reduce((a,b)=>a+b,0)};
const family={schemaVersion:'1.0.0',candidateOnly:true,deployable:false,humanApproval:null,scope:'Forward animation only; Divine assets and combat unchanged',variants:{light}};
family.variants.heavy=read(path.join(pub,'lamuh-legacy-v2/ascend-heavy-clean-v2/manifest.json')).heavy;
const mr=read(path.join(root,'tools/nga-forge/review/lamuh-forward-medium-connectors-v4/normalization.report.json'));
const medium=structuredClone(base.ascendStepFamily.variants.medium);
medium.status='CANDIDATE_AWAITING_HUMAN_REVIEW';medium.humanApproval=null;
medium.v2.frames=mr.frames;medium.v2.rootPath=mr.frames.map(f=>f.root);
medium.v2.contactPresentation={...medium.v2.contactPresentation,publicPath:mr.frames[medium.v2.contactFrame].publicPath,sha256:mr.frames[medium.v2.contactFrame].sha256};
medium.normalizationReport={path:'tools/nga-forge/review/lamuh-forward-medium-connectors-v4/normalization.report.json'};
delete medium.hashLock;delete medium.styleApproval;
family.variants.medium=medium;
for(const c of Object.values(family.variants))for(const f of c.v2.frames){const p=path.join(pub,f.publicPath);if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase()!==f.sha256.toUpperCase())throw Error('Candidate hash mismatch '+p);}
for(const f of light.v2.frames){const p=path.join(pub,f.publicPath);if(!fs.existsSync(p))throw Error(p);if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase()!==f.sha256.toUpperCase())throw Error('Hash mismatch '+p);}
const dest=path.join(pub,'lamuh-legacy-v2/forward-clean-v1');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(family,null,2));
const sourceDest=path.join(engine,'content-source/characters/lamuh-legacy-v2/forward-clean-v1');fs.mkdirSync(sourceDest,{recursive:true});fs.writeFileSync(path.join(sourceDest,'manifest.json'),JSON.stringify(family,null,2));
for(const [s,expected]of Object.entries({light:{total:20,contacts:[5]},medium:{total:48,contacts:[7,26]},heavy:{total:42,contacts:[24]}})){
 const c=family.variants[s],holds=c.timingCandidates.B.exposureTicks;let tick=0;const contacts=[];
 if(holds.length!==c.v2.frames.length)throw Error('Frame/exposure mismatch '+s);
 for(let i=0;i<holds.length;i++){if(c.v2.frames[i].contact)contacts.push(tick);tick+=holds[i];}
 if(tick!==expected.total||JSON.stringify(contacts)!==JSON.stringify(expected.contacts))throw Error('Contact timing mismatch '+s);
}
console.log('All three forward timelines and source hashes verified; candidate only');
console.log('Forward Light candidate: 9 slots, 20 ticks, contact 5..8, hashes verified');
