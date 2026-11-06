// Review-only contract shared by both apps. This is not an authorization server.
export const COURSE_IDS = Object.freeze(['ingles','espanol','britjoy','ia','conduccion','ciberseguridad','electricidad']);
export const PROPOSAL = Object.freeze({
  version: 1,
  status: 'review_only',
  basicCourseIds: Object.freeze(['ingles']),
  additionalCourseIds: Object.freeze(COURSE_IDS.filter(id => id !== 'ingles')),
  migrateExistingSubscribers: false,
  changePrices: false,
  enableCheckout: false,
  publish: false,
});

// The two repositories have different registries. Never delete existing routes
// or assume that britjoy-english currently contains only English.
export const REPOSITORIES = Object.freeze({
  english: 'workersvoiceuk-wq/britjoy-english',
  academy: 'workersvoiceuk-wq/lumi-uk-beta',
});

// Produces review blockers, not an approval. Each check needs evidence tied to
// the exact file hash. Technical QA cannot stand in for editorial approval.
export function releaseBlockers(asset) {
  if (!asset || typeof asset !== 'object') return ['missing_asset'];
  const errors = [];
  const sha = /^[a-f0-9]{64}$/;
  if (!COURSE_IDS.includes(asset.courseId)) errors.push('unknown_course');
  if (!Array.isArray(asset.questionIds) || !asset.questionIds.length || asset.questionIds.some(id => typeof id !== 'string' || !id.trim())) errors.push('missing_question_mapping');
  if (asset.questionMappingReviewed !== true) errors.push('question_mapping_unreviewed');
  if (!sha.test(asset.sha256 || '')) errors.push('missing_sha256');
  if (asset.width !== 720 || asset.height !== 1280 || asset.fps !== 24) errors.push('unexpected_format');
  if (!(Number.isFinite(asset.durationSeconds) && asset.durationSeconds > 0)) errors.push('invalid_duration');
  if (asset.kind === 'flow_clip' && asset.durationSeconds > 10.1) errors.push('flow_clip_too_long');
  if (!['flow_clip','edited_lesson'].includes(asset.kind)) errors.push('unknown_media_kind');
  for (const check of ['download','decode','speech','identity','continuity','subtitles','rights','teaching']) {
    const result = asset.checks?.[check];
    if (!result || result.status !== 'pass' || result.sha256 !== asset.sha256 || !result.evidence?.trim()) errors.push('unverified_' + check);
  }
  if (asset.presentation === 'real_recording' && asset.provenance?.kind !== 'original_recording') errors.push('mislabelled_real_recording');
  if (asset.provenance?.kind === 'flow_generation' && asset.presentation !== 'synthetic') errors.push('synthetic_disclosure_missing');
  if (asset.editorialApproval?.sha256 !== asset.sha256 || asset.editorialApproval?.approved !== true || !asset.editorialApproval?.reviewer?.trim()) errors.push('editorial_approval_missing');
  return errors;
}

// Proposal for the SERVER to implement later. Caller must supply server-verified
// entitlements; never call with localStorage, a client claim or an email match.
// This function is deliberately not wired into current account or billing code.
export function proposedAccess(courseId, verifiedEntitlements, now = Date.now()) {
  if (!COURSE_IDS.includes(courseId) || !Array.isArray(verifiedEntitlements) || !Number.isFinite(now)) return 'preview';
  return verifiedEntitlements.some(e => e?.status === 'active' && Number.isFinite(Date.parse(e.expiresAt)) && Date.parse(e.expiresAt) > now && (
    e.product === 'legacy_academy_all' ||
    e.product === 'academy_all' ||
    (e.product === 'english_basic' && courseId === 'ingles') ||
    (e.product === 'course' && e.courseId === courseId)
  )) ? 'full' : 'preview';
}
