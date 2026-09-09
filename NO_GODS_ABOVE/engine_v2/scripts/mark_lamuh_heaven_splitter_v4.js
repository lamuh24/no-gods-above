/* Record the live human pass without promoting art, the roster, or deployment. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {stableJson}=require('./production_contracts');
const {acceptedSnapshot}=require('./mark_lamuh_celestial_palm_v1');
const {fighterDefinitions}=require('../dist/data/fighters');
const root=path.resolve(__dirname,'..'),base=path.join(root,'content-source/characters/lamuh-legacy-v2');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const decision='APPROVED_AS_PRODUCTION_BASELINE',nextGate='awaiting_human_radiant_dive_family_review';
const receiptRelative='records/heaven-splitter-v4.approval.json';
function mark(){
 const reviewPath=path.join(root,'public/lamuh-legacy-v2/review-data.json'),review=read(reviewPath);
 const familyPath=path.join(base,'heaven-splitter-family.candidate.v1.json'),manifestPath=path.join(root,'public/lamuh-legacy-v2/heaven-splitter-v1/manifest.json');
 const family=read(familyPath),manifest=read(manifestPath),accepted=acceptedSnapshot(review.heavenSplitterFamily);
 assert.equal(family.heavyCinematicRevision.version,4);
 for(const value of [family,manifest])assert.equal(stableJson(acceptedSnapshot(value)),stableJson(accepted));
 const combat=Object.fromEntries(['light','medium','heavy'].map(s=>[s,structuredClone(fighterDefinitions.lamuh_legacy_v2.attacks['legacy_heaven_splitter_'+s])]));
 const receiptPath=path.join(base,receiptRelative);
 const receipt={schemaVersion:'1.0.0',recordType:'human_scoped_review',approvedAt:'2026-09-05',subject:'lamuh_legacy_v2.heaven_splitter.light_medium_heavy_v4',userInput:'passes onto the next moveset',decision,
  interpretation:'The shown Heaven Splitter current-review family, including the Heavy V4 surrounding-aura redraw, passes and work may proceed to the next family. This is not whole-character or final combat-balance approval.',
  approvalScope:['heaven_splitter_light','heaven_splitter_medium','heaven_splitter_heavy'],acceptedProfile:'B',...accepted,acceptedCombat:combat,
  approvalBoundary:{currentReviewFamilyApproved:true,proceedToNextSpecialFamily:true,rosterPromotion:false,runtimeArtPromotion:false,finalCharacterApproval:false,fullProductionApproval:false,combatBalanceFinal:false,reactionPackApproved:false,deployable:false},
  candidateOnly:true,legacySourceRemainsImmutable:true,nextHumanGate:nextGate};
 for(const variant of Object.values(review.heavenSplitterFamily.variants))for(const frame of variant.v2.frames)assert.equal(hash(path.join(root,'public',frame.publicPath)),frame.sha256,'Heaven approved source bytes changed: '+frame.publicPath);
 if(fs.existsSync(receiptPath)){const prior=read(receiptPath);assert.equal(stableJson(prior),stableJson(receipt),'Heaven approval scope or accepted snapshot changed');}else write(receiptPath,receipt);
 const reference={path:receiptRelative,sha256:hash(receiptPath)};
 for(const value of [family,manifest,review.heavenSplitterFamily]){
  value.status=decision;value.humanApproval={family:decision,light:decision,medium:decision,heavy:decision};value.approvalReceipt=reference;value.approvalScope='shown_current_review_family_and_B_profile_only';value.approvalBoundary=receipt.approvalBoundary;value.candidateOnly=true;value.deployable=false;
  value.heavyCinematicRevision.status=decision;
  for(const variant of Object.values(value.variants)){variant.status=decision;variant.approvalReceipt=reference;variant.candidateOnly=true;variant.deployable=false;}
 }
 const firstPath=path.join(base,'first-playable.bundle.json'),first=read(firstPath),stars=stableJson(first.currentReviewGate.starredForRevisit);
 if(first.currentReviewGate.status==='awaiting_human_heaven_splitter_family_review'){
  first.humanReviewStatus=nextGate;first.currentReviewGate={...first.currentReviewGate,status:nextGate,focusDecisions:['radiant_dive_airborne_entry_and_angle','radiant_dive_one_hit_and_landing','radiant_dive_adult_identity_and_scale','radiant_dive_counterplay'],activeMotionContract:'radiant_dive_single_descending_near_arm_strike_connected_landing',stopBoundary:'human_review_radiant_dive_before_later_family_or_promotion'};
  first.technicalStatus='HEAVEN_SPLITTER_V4_SCOPED_BASELINE_ACCEPTED_RADIANT_DIVE_NEXT';
 }
 first.heavenSplitterApproval=reference;assert.equal(stableJson(first.currentReviewGate.starredForRevisit),stars);
 review.firstPlayable=first;review.humanReviewStatus=first.humanReviewStatus;
 for(const move of review.timingCandidates.moves)if(receipt.approvalScope.includes(move.moveId)){move.humanReviewStatus=decision;move.approvalReceipt=reference;}
 const pendingPath=path.join(base,'records/first-playable-closure.pending.json'),pending=read(pendingPath);
 pending.humanReviewStatus=first.humanReviewStatus;pending.currentReviewFocus={...pending.currentReviewFocus,...first.currentReviewGate};pending.activeFamilyReview=first.humanReviewStatus===nextGate?'radiant_dive_light_medium_heavy':pending.activeFamilyReview;pending.heavenSplitterApproval=reference;pending.completedFamilyReviews={...pending.completedFamilyReviews,heavenSplitter:reference};
 for(const [p,v] of [[familyPath,family],[manifestPath,manifest],[firstPath,first],[pendingPath,pending],[reviewPath,review]]){write(p,v);read(p);}
 return {decision,receipt:reference,frozenFrameCount:Object.values(accepted.acceptedFrameHashes).reduce((n,a)=>n+a.length,0),nextGate:first.humanReviewStatus,deployable:false};
}
if(require.main===module)console.log(JSON.stringify(mark(),null,2));
module.exports={mark,decision,nextGate,receiptRelative};
