const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),content=path.join(root,'content-source/characters/lamuh-legacy-v2');
const review=JSON.parse(fs.readFileSync(path.join(root,'public/lamuh-legacy-v2/review-data.json'),'utf8'));
const sha=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const definitions=[
  ['standing_light',review.standingLightClosure,[[1088,840]]],
  ['standing_medium',review.standingMediumClosure,[[1100,825]]],
  ['standing_heavy',review.standingHeavyClosure,[[1354,800]]],
  ['crouching_light',review.crouchingLightClosure,[[1130,1030]]],
  ['crouching_medium',review.crouchingMediumClosure,[[1238,1235]]],
  ['air_light',review.airLightClosure,[[1200,665]]],
  ['air_medium',review.airMediumClosure,[[1230,725]]],
  ['air_heavy',review.airHeavyClosure,[[795,1160]]],
  ['legacy_ascend_step_light',review.ascendStepFamily.variants.light,[[1088,840]]],
  ['legacy_ascend_step',review.ascendStepFamily.variants.medium,[[1238,1260],[1030,610]]],
  ['legacy_ascend_step_heavy',review.ascendStepFamily.variants.heavy,[[1270,825]]]
];
const attacks={};
for(const [id,move,points]of definitions){
  const indices=move.v2.contactFrames||[move.v2.contactFrame];
  attacks[id]=points.map(([x,y],i)=>{const frame=move.v2.frames[indices[i]];const bytes=fs.readFileSync(path.join(root,'public',frame.publicPath));if(sha(bytes)!==frame.sha256)throw Error(`Unreviewed source mutation: ${id}`);return {frame:frame.index,sourcePath:frame.publicPath,sha256:frame.sha256,x,y,root:frame.root};});
}
const sockets={schemaVersion:'1.0.0',candidateOnly:true,deployable:false,subject:'lamuh_quality_contact_sockets_v1',placement:'collision_triggered_authored_source_pixel_socket',notes:['No body recoloring, redraw or scale at impact.','Crouching Heavy decorative VFX remains disabled.','Sockets are candidate presentation data, not modified collision boxes.'],attacks};
const json=JSON.stringify(sockets,null,2)+'\n';
fs.writeFileSync(path.join(content,'quality-contact-sockets.v1.json'),json);
fs.writeFileSync(path.join(root,'public/lamuh-legacy-v2/quality-contact-sockets.v1.json'),json);
const locked=new Map();
const lock=(source)=>{if(!locked.has(source)){const bytes=fs.readFileSync(path.join(root,'public',source));locked.set(source,{path:source,sha256:sha(bytes)});}};
for(const [,move]of definitions)for(const frame of move.v2.frames)lock(frame.publicPath);
for(const frame of review.crouchingHeavyClosure.v2.frames)lock(frame.publicPath);
for(const state of Object.values(review.movementModernization.states))for(const frame of state.frames)lock(frame.publicPath);
for(const sequence of Object.values(review.throwAnimations.sequences))for(const frame of sequence.frames)lock(frame.publicPath);
const lockPath=path.join(content,'quality-preserved-art.lock.json');
const payload={candidateOnly:true,deployable:false,purpose:'Current movement, normal, special, throw source art remains byte-identical during quality pass',assets:[...locked.values()]};
if(fs.existsSync(lockPath)){if(fs.readFileSync(lockPath,'utf8')!==JSON.stringify(payload,null,2)+'\n')throw Error('Existing quality checkpoint changed; do not overwrite silently');}
else fs.writeFileSync(lockPath,JSON.stringify(payload,null,2)+'\n');
console.log(`PASS authored ${Object.values(attacks).flat().length} collision-triggered sockets; ${locked.size} preserved source frames hash-locked`);
