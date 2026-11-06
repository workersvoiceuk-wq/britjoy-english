import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_IDS, PROPOSAL, proposedAccess, releaseBlockers } from '../shared/academy-contract.mjs';
const now = Date.parse('2026-11-06T00:00:00Z');
const USER = 'user_verified_1';
const active = product => ({ product, status:'active', expiresAt:'2026-12-06T00:00:00Z', userId: USER });
test('basic grants only English and preserves all seven IDs', () => {
  assert.equal(COURSE_IDS.length,7);
  for (const id of COURSE_IDS) assert.equal(proposedAccess(id,[active('english_basic')],now,USER),id==='ingles'?'full':'preview');
});
test('legacy subscribers retain the seven-course scope', () => {
  for (const id of COURSE_IDS) assert.equal(proposedAccess(id,[active('legacy_academy_all')],now,USER),'full');
  assert.equal(PROPOSAL.migrateExistingSubscribers,false);
  assert.equal(PROPOSAL.enableCheckout,false);
});
test('expired, cancelled, malformed and unknown grants fail closed', () => {
  for (const e of [{...active('academy_all'),expiresAt:'bad'}, {...active('academy_all'),expiresAt:'2026-11-05'}, {...active('academy_all'),status:'cancelled'},active('unrecognised')]) assert.equal(proposedAccess('ingles',[e],now,USER),'preview');
  assert.equal(proposedAccess('unknown',[active('academy_all')],now,USER),'preview');
  assert.equal(proposedAccess('ingles',null,now,USER),'preview');
});
test('individual course grants do not leak into other courses', () => {
  const e = {...active('course'),courseId:'ia'};
  assert.equal(proposedAccess('ia',[e],now,USER),'full');
  assert.equal(proposedAccess('electricidad',[e],now,USER),'preview');
});
function reviewed(){
  const sha256='a'.repeat(64);
  const checks=Object.fromEntries(['download','decode','speech','identity','continuity','subtitles','rights','teaching'].map(k=>[k,{status:'pass',sha256,evidence:'review reference '+k}]));
  return {courseId:'ia',questionIds:['reviewed-question-id'],questionMappingReviewed:true,sha256,width:720,height:1280,fps:24,durationSeconds:9,kind:'flow_clip',presentation:'synthetic',provenance:{kind:'flow_generation'},checks,editorialApproval:{approved:true,sha256,reviewer:'Oscar'}};
}
test('technical QA alone never approves a clip', () => {
  const asset=reviewed();delete asset.editorialApproval;
  assert.ok(releaseBlockers(asset).includes('editorial_approval_missing'));
});
test('modified media invalidates every hash-bound review', () => {
  const asset=reviewed();asset.sha256='b'.repeat(64);
  assert.ok(releaseBlockers(asset).includes('unverified_decode'));
  assert.ok(releaseBlockers(asset).includes('editorial_approval_missing'));
});
test('synthetic footage cannot masquerade as a real capture', () => {
  const asset=reviewed();asset.presentation='real_recording';
  assert.ok(releaseBlockers(asset).includes('mislabelled_real_recording'));
  assert.ok(releaseBlockers(asset).includes('synthetic_disclosure_missing'));
});
test('exact mapping and clip length are required but edited lessons may be longer', () => {
  const asset=reviewed();assert.deepEqual(releaseBlockers(asset),[]);
  asset.durationSeconds=44;assert.ok(releaseBlockers(asset).includes('flow_clip_too_long'));
  asset.kind='edited_lesson';assert.deepEqual(releaseBlockers(asset),[]);
  asset.questionIds=[];assert.ok(releaseBlockers(asset).includes('missing_question_mapping'));
});

// Review 6 Nov 2026 (Claude): existing rights, verified identity and evidence robustness.
test('a past_due Academy subscriber keeps access until the paid period ends, as the live server does', () => {
  const e = {...active('legacy_academy_all'), status:'past_due'};
  for (const id of COURSE_IDS) assert.equal(proposedAccess(id,[e],now,USER),'full');
  assert.equal(proposedAccess('ia',[{...e,expiresAt:'2026-11-05T23:59:59Z'}],now,USER),'preview');
  for (const status of ['canceled','unpaid','incomplete_expired','paused']) assert.equal(proposedAccess('ia',[{...e,status}],now,USER),'preview',status);
});
test('access needs the server-verified user ID: no session, another user or an email claim never grants', () => {
  const e = active('academy_all');
  assert.equal(proposedAccess('ia',[e],now),'preview','no verified session');
  assert.equal(proposedAccess('ia',[e],now,'   '),'preview');
  assert.equal(proposedAccess('ia',[e],now,'someone_else'),'preview');
  const {userId, ...byEmail} = e; assert.equal(proposedAccess('ia',[{...byEmail,email:'learner@example.com'}],now,'learner@example.com'),'preview','email-keyed claim');
});
test('evidence must be real text; a number or object neither crashes nor counts', () => {
  const asset=reviewed();asset.checks.speech={...asset.checks.speech,evidence:42};
  assert.ok(releaseBlockers(asset).includes('unverified_speech'));
  asset.editorialApproval.reviewer=7;assert.ok(releaseBlockers(asset).includes('editorial_approval_missing'));
});
test('a clip without a known provenance is blocked (rights need an origin)', () => {
  const asset=reviewed();delete asset.provenance;asset.presentation='synthetic';
  assert.ok(releaseBlockers(asset).includes('missing_provenance'));
  asset.provenance={kind:'original_recording'};asset.presentation='real_recording';assert.deepEqual(releaseBlockers(asset),[]);
});
test('a mapping to an exercise ID that does not exist is blocked when the course IDs are given', () => {
  const asset=reviewed();
  assert.ok(releaseBlockers(asset,{knownQuestionIds:['vum-ia-001']}).includes('unknown_question_id'));
  asset.questionIds=['vum-ia-001'];assert.deepEqual(releaseBlockers(asset,{knownQuestionIds:['vum-ia-001','vum-ia-002']}),[]);
});
test('the contract stays review-only and is not wired into accounts or billing', () => {
  assert.equal(PROPOSAL.status,'review_only');assert.equal(PROPOSAL.changePrices,false);assert.equal(PROPOSAL.publish,false);
});
