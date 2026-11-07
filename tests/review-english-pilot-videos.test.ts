import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveQuestionVideoHelp } from '../src/shared/question-videos/question-video-help.mjs';
import { BRITJOY_REVIEW_VIDEO_MANIFEST } from '../src/shared/question-videos/britjoy-review-videos';

describe('BritJoy A2 review pilots', () => {
  for (const [lessonId, clip] of [['a2-u2-l1', 'britjoy-trabajo'], ['a2-u2-l2', 'britjoy-gp']]) {
    it(`maps the chapter and only the exact first exercise of ${lessonId}`, () => {
      const resolve = (questionId?: string) => resolveQuestionVideoHelp(
        { lessonId, questionId, targetLanguage: 'en' }, BRITJOY_REVIEW_VIDEO_MANIFEST,
      );
      expect(resolve()).toMatchObject({ conceptId: `${clip}-capitulo`, playable: true });
      expect(resolve(`${lessonId}:1`)).toMatchObject({ conceptId: `${clip}-pregunta`, playable: true });
      expect(resolve(`${lessonId}:2`)).toBeNull();
      for (const suffix of ['capitulo', 'pregunta']) {
        for (const extension of ['mp4', 'es.vtt', 'en.vtt']) {
          expect(existsSync(`public/videos/ingles-a2/${clip}-${suffix}.${extension}`)).toBe(true);
        }
      }
    });
  }
});
