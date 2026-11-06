import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_IDS, PROPOSAL, proposedAccess, releaseBlockers } from '../shared/academy-contract.mjs';
const now = Date.parse('2026-11-06T00:00:00Z');
const active = product => ({ product, status:'active', expiresAt:'2026-12-06T00:00:00Z' });
test('basic grants only English and preserves all seven IDs', () => {
  assert.equal(COURSE_IDS.length,7);
  for (const id of COURSE_IDS) assert.equal(proposedAccess(id,[active('english_basic')],now),id==='ingles'?'full':'preview');
});
test('legacy subscribers retain the seven-course scope', () => {
  for (const id of COURSE_IDS) assert.equal(proposedAccess(id,[active('legacy_academy_all')],now),'full');
  assert.equal(PROPOSAL.migrateExistingSubscribers,false);
  assert.equal(PROPOSAL.enableCheckout,false);
});
test('expired, cancelled, malformed and unknown grants fail closed', () => {
  for (const e of [{...active('academy_all'),expiresAt:'bad'}, {...active('academy_all'),expiresAt:'2026-11-05'}, {...active('academy_all'),status:'cancelled'},active('unrecognised')]) assert.equal(proposedAccess('ingles',[e],now),'preview');
  assert.equal(proposedAccess('unknown',[active('academy_all')],now),'preview');
  assert.equal(proposedAccess('ingles',null,now),'preview');
});
test('individual course grants do not leak into other courses', () => {
  const e = {...active('course'),courseId:'ia'};
  assert.equal(proposedAccess('ia',[e],now),'full');
  assert.equal(proposedAccess('electricidad',[e],now),'preview');
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
