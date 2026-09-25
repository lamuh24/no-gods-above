/* Scoped human review receipt. Does not promote art or rewrite move content. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
const reviewPath = path.join(root, 'public/lamuh-legacy-v2/review-data.json');
const review = read(reviewPath);
const receiptPath = 'records/forward-special-family-v1.approval.json';
const status = 'APPROVED_FOR_CURRENT_PRODUCTION_BASELINE_WITH_POLISH_DEBT';
const receipt = {
  schemaVersion: '1.0.0', recordType: 'human_scoped_review', approvedAt: '2026-09-05',
  subject: 'lamuh_legacy_v2.forward_specials.light_medium_heavy',
  userInput: 'mark the forward specials and move onto the next set',
  decision: status, starredForRevisit: true,
  interpretation: 'Scoped provisional acceptance to proceed, with the forward family marked for later polish; not final motion or balance sign-off.',
  approvalScope: ['ascend_step_light', 'ascend_step', 'ascend_step_heavy'],
  retainedPolishDebt: ['Medium rising-heel contact height against standard-height victims', 'Medium support-hand/foot registration, tuck and landing continuity', 'Light/Heavy adult identity, release clarity and connected recovery in combined playtest'],
  acceptedFrameHashes: Object.fromEntries(Object.entries(review.ascendStepFamily.variants).map(([id, c]) => [id, c.v2.frames.map(f => ({ publicPath: f.publicPath, sha256: f.sha256 }))])),
  acceptedTiming: Object.fromEntries(Object.entries(review.ascendStepFamily.variants).map(([id, c]) => [id, c.timingCandidates.B])),
  approvalBoundary: { proceedToNextSpecialFamily: true, fullProductionApproval: false, combatBalanceFinal: false, reactionPackApproved: false, runtimeArtPromotion: false, deployable: false },
  candidateOnly: true, legacySourceRemainsImmutable: true
};
const target = path.join(source, receiptPath);
// Freeze the first receipt. Re-running may update references but cannot change what was accepted.
if (fs.existsSync(target)) {
  const prior = read(target);
  if (JSON.stringify(prior.acceptedFrameHashes) !== JSON.stringify(receipt.acceptedFrameHashes)) throw new Error('Forward art changed since scoped acceptance');
} else write(target, receipt);
const reference = { path: receiptPath, sha256: hash(target) };
const firstPath = path.join(source, 'first-playable.bundle.json');
const first = read(firstPath);
const mark = { subject: 'forward_special_family_light_medium_heavy', decision: status, reason: 'user_requested_mark_forward_specials_and_proceed', approvalReceipt: reference };
first.currentReviewGate.starredForRevisit = first.currentReviewGate.starredForRevisit.filter(x => x.subject !== mark.subject).concat(mark);
first.currentReviewGate.status = 'awaiting_human_celestial_palm_family_review';
first.currentReviewGate.focusDecisions = ['celestial_palm_light_medium_heavy_motion', 'celestial_palm_single_release_hit_parity', 'celestial_palm_body_scale_and_transition', 'celestial_palm_projectile_readability_and_counterplay'];
first.currentReviewGate.stopBoundary = 'human_review_required_before_next_family_or_candidate_promotion';
first.humanReviewStatus = first.currentReviewGate.status;
first.technicalStatus = 'FORWARD_SPECIALS_PROVISIONALLY_ACCEPTED_STARRED_NEUTRAL_FAMILY_IN_PROGRESS';
first.knownArtDebt = first.knownArtDebt.filter(x => !x.startsWith('Ascend Step Medium targeted'));
first.knownArtDebt.push('Forward special L/M/H family is provisionally accepted and starred; Medium rising-heel contact height and landing registration remain polish debt. No art promotion or final balance approval.');
write(firstPath, first);
review.firstPlayable = first;
review.humanReviewStatus = first.humanReviewStatus;
review.ascendStepFamily.status = status;
review.ascendStepFamily.humanApproval = { ...review.ascendStepFamily.humanApproval, family: status, light: status, medium: status, heavy: status };
review.ascendStepFamily.approvalReceipt = reference;
review.ascendStepFamily.starredForRevisit = true;
write(reviewPath, review);
console.log('Forward L/M/H scoped acceptance frozen and starred; next gate Celestial Palm. No frame or timing changed.');
