import {describe, expect, it} from 'vitest';
import {QUESTION_VIDEO_MANIFEST, resolveQuestionVideoHelp} from '../src/shared/question-videos/question-video-help.mjs';

// A synthetic mapping exercises country selection without adding lesson content.
const base = QUESTION_VIDEO_MANIFEST.concepts.find(c => c.courseId === 'conduccion')!;
const fixture = (country: string | null) => ({...QUESTION_VIDEO_MANIFEST, concepts: [
  {...base, conceptId: 'synthetic-country-case', country, mappings: [{courseId: 'conduccion', questionId: 'synthetic'}]},
]});
const query = {courseId: 'conduccion', questionId: 'synthetic'};

describe('question explanation country selection', () => {
  it('does not offer another country by default in the British driving course', () => {
    expect(resolveQuestionVideoHelp(query, fixture('CO'))).toBeNull();
    expect(resolveQuestionVideoHelp({...query, country: 'GB'}, fixture('CO'))).toBeNull();
  });
  it('retains an explicitly selected matching country', () => {
    expect(resolveQuestionVideoHelp({...query, country: 'CO'}, fixture('CO'))?.conceptId).toBe('synthetic-country-case');
    expect(resolveQuestionVideoHelp({...query, country: 'ES'}, fixture('CO'))).toBeNull();
  });
  it('keeps general content available across countries', () => {
    for (const country of [undefined, 'GB', 'ES', 'CO']) {
      expect(resolveQuestionVideoHelp({...query, country}, fixture(null))?.conceptId).toBe('synthetic-country-case');
    }
  });
  it('does not infer country from explanation or target language', () => {
    for (const locale of ['es', 'en']) {
      expect(resolveQuestionVideoHelp({...query, locale, targetLanguage: 'es'}, fixture('CO'))).toBeNull();
    }
  });
  it('preserves the existing British mapping and editorial states', () => {
    expect(resolveQuestionVideoHelp({courseId: 'conduccion', questionId: 'vum-conduccion-001'})?.conceptId).toBe('conduccion-gb-red-light');
    for (const c of QUESTION_VIDEO_MANIFEST.concepts) expect(c.status).not.toBe('ready');
  });
});
