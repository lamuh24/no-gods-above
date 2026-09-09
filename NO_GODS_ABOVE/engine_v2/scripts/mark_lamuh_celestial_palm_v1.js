/* Freeze the exact family shown at the user's scoped pass; this is not a deployment/art-promotion command. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { stableJson } = require('./production_contracts');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'content-source/characters/lamuh-legacy-v2');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const decision = 'APPROVED_AS_PRODUCTION_BASELINE';
const nextGate = 'awaiting_human_heaven_splitter_family_review';
const focusDecisions = ['heaven_splitter_light_medium_heavy_anti_air_motion', 'heaven_splitter_body_scale_and_transition', 'heaven_splitter_single_hit_parity', 'heaven_splitter_counterplay'];
const receiptRelative = 'records/celestial-palm-v1.approval.json';

function acceptedSnapshot(family) {
  assert.deepEqual(Object.keys(family.variants).sort(), ['heavy', 'light', 'medium']);
  return {
    acceptedFrameHashes: Object.fromEntries(Object.entries(family.variants).map(([strength, variant]) => [strength,
      variant.v2.frames.map((frame) => {
        const file = path.resolve(root, 'public', frame.publicPath.replace(/^\//, ''));
        assert.ok(file.startsWith(path.join(root, 'public') + path.sep), 'Frame path escaped public root');
        assert.equal(hash(file), frame.sha256, `Accepted Palm frame hash mismatch: ${frame.publicPath}`);
        return { publicPath: frame.publicPath, sha256: frame.sha256 };
      })])),
    acceptedTiming: Object.fromEntries(Object.entries(family.variants).map(([strength, variant]) => {
      assert.equal(variant.recommendedTimingCandidate, 'B');
      return [strength, structuredClone(variant.timingCandidates.B)];
    }))
  };
}

function verifyFrozenAcceptance(prior, accepted) {
  assert.equal(prior.decision, decision);
  assert.equal(stableJson(prior.acceptedFrameHashes), stableJson(accepted.acceptedFrameHashes), 'Palm art changed since scoped acceptance');
  assert.equal(stableJson(prior.acceptedTiming), stableJson(accepted.acceptedTiming), 'Palm B timing changed since scoped acceptance');
}

function mark() {
  const reviewPath = path.join(root, 'public/lamuh-legacy-v2/review-data.json');
  const familyPath = path.join(source, 'celestial-palm-family.candidate.v1.json');
  const manifestPath = path.join(root, 'public/lamuh-legacy-v2/celestial-palm-v1/manifest.json');
  const review = read(reviewPath), family = read(familyPath), manifest = read(manifestPath);
  const accepted = acceptedSnapshot(review.celestialPalmFamily);
  assert.equal(stableJson(acceptedSnapshot(family)), stableJson(accepted));
  assert.equal(stableJson(acceptedSnapshot(manifest)), stableJson(accepted));
  const receiptPath = path.join(source, receiptRelative);
  const receipt = {
    schemaVersion: '1.0.0', recordType: 'human_scoped_review', approvedAt: '2026-09-05',
    subject: 'lamuh_legacy_v2.celestial_palm.light_medium_heavy',
    userInput: 'passes now move onto the next moveset', decision,
    interpretation: 'The shown Celestial Palm L/M/H current-review family passes for this scoped production baseline and work may proceed. This does not finalize every combat value or approve the whole fighter.',
    approvalScope: ['celestial_palm_light', 'celestial_palm_medium', 'celestial_palm_heavy'],
    acceptedProfile: 'B', ...accepted,
    approvalBoundary: { currentReviewFamilyApproved: true, proceedToNextSpecialFamily: true, rosterPromotion: false,
      runtimeArtPromotion: false, finalCharacterApproval: false, fullProductionApproval: false,
      combatBalanceFinal: false, reactionPackApproved: false, deployable: false },
    candidateOnly: true, legacySourceRemainsImmutable: true,
    nextHumanGate: nextGate
  };
  if (fs.existsSync(receiptPath)) {
    const prior = read(receiptPath);
    verifyFrozenAcceptance(prior, accepted);
  } else write(receiptPath, receipt);
  const reference = { path: receiptRelative, sha256: hash(receiptPath) };
  const applyFamilyStatus = (value) => {
    value.status = decision;
    value.humanApproval = { ...value.humanApproval, family: decision, light: decision, medium: decision, heavy: decision };
    value.approvalReceipt = reference;
    value.approvalScope = 'shown_current_review_family_and_B_profile_only';
    value.approvalBoundary = receipt.approvalBoundary;
    value.candidateOnly = true;
    value.deployable = false;
    for (const variant of Object.values(value.variants)) {
      variant.status = decision;
      variant.approvalReceipt = reference;
      variant.candidateOnly = true;
      variant.deployable = false;
    }
  };
  applyFamilyStatus(family);
  applyFamilyStatus(manifest);
  applyFamilyStatus(review.celestialPalmFamily);
  const firstPath = path.join(source, 'first-playable.bundle.json'), first = read(firstPath);
  const previousStars = stableJson(first.currentReviewGate.starredForRevisit);
  // Re-running this receipt may not move a later gate backwards.
  if ([nextGate, 'awaiting_human_celestial_palm_family_review'].includes(first.currentReviewGate.status)) {
    first.humanReviewStatus = nextGate;
    first.currentReviewGate = { ...first.currentReviewGate, status: nextGate, focusDecisions,
      activeMotionContract: 'heaven_splitter_light_medium_heavy_readable_anti_air_rising_strike_one_hit_each_connected_recovery_counterplay',
      stopBoundary: 'human_review_required_for_heaven_splitter_before_later_family_or_candidate_promotion' };
    first.technicalStatus = 'CELESTIAL_PALM_SCOPED_BASELINE_ACCEPTED_HEAVEN_SPLITTER_REVIEW_NEXT';
  }
  first.celestialPalmApproval = reference;
  assert.equal(stableJson(first.currentReviewGate.starredForRevisit), previousStars, 'Existing review stars changed');
  review.firstPlayable = first;
  review.humanReviewStatus = first.humanReviewStatus;
  for (const move of review.timingCandidates.moves) if (receipt.approvalScope.includes(move.moveId)) {
    move.humanReviewStatus = decision;
    move.approvalReceipt = reference;
  }
  const closurePath = path.join(source, 'records/first-playable-closure.pending.json'), closure = read(closurePath);
  closure.humanReviewStatus = first.humanReviewStatus;
  closure.currentReviewFocus = { ...closure.currentReviewFocus, ...first.currentReviewGate };
  closure.activeFamilyReview = first.humanReviewStatus === nextGate ? 'heaven_splitter_light_medium_heavy' : closure.activeFamilyReview;
  closure.celestialPalmApproval = reference;
  closure.completedFamilyReviews = { ...closure.completedFamilyReviews, celestialPalm: reference };
  // Historic Section E and its detailed Ascend repair evidence remain intact; the active gate above is separate.
  write(familyPath, family);
  write(manifestPath, manifest);
  write(firstPath, first);
  write(closurePath, closure);
  write(reviewPath, review);
  for (const file of [familyPath, manifestPath, reviewPath, firstPath, closurePath]) read(file);
  return { decision, receipt: reference, humanReviewStatus: first.humanReviewStatus, frozenFrameCount: Object.values(accepted.acceptedFrameHashes).reduce((sum, frames) => sum + frames.length, 0), deployable: false };
}

if (require.main === module) console.log(JSON.stringify(mark(), null, 2));
module.exports = { mark, acceptedSnapshot, verifyFrozenAcceptance, decision, nextGate, focusDecisions };
