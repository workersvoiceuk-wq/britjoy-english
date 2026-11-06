import {describe, expect, it} from 'vitest';
import {COURSE_DEFAULT_COUNTRY, QUESTION_VIDEO_MANIFEST, resolveQuestionVideoHelp} from '../src/shared/question-videos/question-video-help.mjs';

// A synthetic mapping exercises country selection without adding lesson content.
const base = QUESTION_VIDEO_MANIFEST.concepts.find(c => c.courseId === 'conduccion')!;
const fixture = (country: string | null) => ({...QUESTION_VIDEO_MANIFEST, concepts: [
  {...base, conceptId: 'synthetic-country-case', country, mappings: [{courseId: 'conduccion', questionId: 'synthetic'}]},
]});
const query = {courseId: 'conduccion', questionId: 'synthetic'};

describe('question explanation country selection', () => {
  it('does not offer another country by default in the British driving course', () => {
    expect(COURSE_DEFAULT_COUNTRY.conduccion).toBe('GB');
    expect(COURSE_DEFAULT_COUNTRY.britjoy).toBe('GB');
    expect(resolveQuestionVideoHelp(query, fixture('CO'))).toBeNull();
    expect(resolveQuestionVideoHelp({...query, country: 'GB'}, fixture('CO'))).toBeNull();
    expect(resolveQuestionVideoHelp({courseId: 'conduccion', lessonId: 'margins', questionId: 'margins'})).toBeNull();
    expect(resolveQuestionVideoHelp({courseId: 'conduccion', lessonId: 'margins', questionId: 'margins', country: 'CO'})?.conceptId).toBe('conduccion-co-rain-margins');
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
  it('preserves the 28 reconciled concepts, unmaps the 6 mismatched guided lessons, and keeps qualitative rain advice', () => {
    expect(QUESTION_VIDEO_MANIFEST.concepts).toHaveLength(28);
    expect(resolveQuestionVideoHelp({courseId: 'conduccion', questionId: 'vum-conduccion-001'})?.conceptId).toBe('conduccion-gb-red-light');
    for (const [courseId, unit, wrongConcept] of [
      ['espanol', 'appointment', 'espanol-tener-que-infinitivo'],
      ['ingles', 'appointment', 'ingles-gp-appointment-time'],
      ['ingles', 'repeat', 'ingles-phone-reference-readback'],
      ['ia', 'validation', 'ia-model-hallucination'],
      ['ciberseguridad', 'verify', 'ciberseguridad-mfa-factors'],
      ['ciberseguridad', 'protect', 'ciberseguridad-password-policy-control'],
    ] as const) {
      expect(resolveQuestionVideoHelp({courseId, lessonId: unit, questionId: unit, locale: 'es'})?.conceptId ?? null).not.toBe(wrongConcept);
    }
    const rain = QUESTION_VIDEO_MANIFEST.concepts.find(c => c.conceptId === 'conduccion-co-rain-margins');
    expect(rain?.visualExample?.steps[1][2]).toBe('Ampliar margen de seguridad frontal / Increase your following distance');
    for (const c of QUESTION_VIDEO_MANIFEST.concepts) expect(c.status).not.toBe('ready');
  });
});
