import { describe, expect, it } from 'vitest';
import { QUESTION_VIDEO_MANIFEST, resolveQuestionVideoHelp } from '../src/shared/question-videos/question-video-help.mjs';
import unit1 from '../src/data/courses/en-es/a1/unit-1.json' with { type: 'json' };

// Review 6 Nov 2026: each explanation must explain THAT exercise. Lesson-wide mappings that showed an
// unrelated concept (Life in the UK test logistics → «individual liberty», licence/insurance → «red light»,
// scams → «confidentiality», English «dia-…» lessons → Spanish «ser») were removed.
describe('question-specific mappings in BritJoy English', () => {
  it('the morning-greeting help is on the two exercises that practise «Good morning»', () => {
    for (const i of [4, 5]) {
      expect(String((unit1.lessons[0].exercises[i] as { answer?: string }).answer)).toMatch(/good morning/i);
      expect(resolveQuestionVideoHelp({ targetLanguage: 'en', lessonId: 'a1-u1-l1', questionId: `a1-u1-l1:${i}` })?.conceptId).toBe('ingles-morning-greeting');
    }
    // «¿Cómo se dice hola?» → Hello is not the morning greeting
    expect(resolveQuestionVideoHelp({ targetLanguage: 'en', lessonId: 'a1-u1-l1', questionId: 'a1-u1-l1:0' })).toBeNull();
  });
  it('unrelated lesson-wide mappings no longer show a help panel', () => {
    for (const [lessonId, track, targetLanguage] of [['uk-vida-l1', 'life', 'en'], ['uk-conducir-l1', 'life', 'en'], ['uk-banco-l2', 'life', 'en'], ['ia-06-language', 'ai', 'en'], ['ia-07-modo-ia', 'ai', 'en'], ['dia-01-presentaciones', 'situaciones', 'en'], ['a1-u1-l3', '', 'en']])
      expect(resolveQuestionVideoHelp({ lessonId, track, targetLanguage }), lessonId).toBeNull();
  });
  it('every remaining BritJoy-side mapping points at an existing exercise', () => {
    const ids = QUESTION_VIDEO_MANIFEST.concepts.flatMap((c) => c.mappings.map((m) => m.questionId || m.lessonId)).filter((id): id is string => !!id && id.startsWith('a1-'));
    expect(ids).toEqual(['a1-u1-l1:4', 'a1-u1-l1:5']);
  });
});
