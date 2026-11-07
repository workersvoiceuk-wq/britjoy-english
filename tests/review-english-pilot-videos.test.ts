import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { auditLevels } from '../scripts/audit-lesson-videos.mjs';
import unit from '../src/data/courses/en-es/a2/unit-2.json';
import { resolveQuestionVideoHelp } from '../src/shared/question-videos/question-video-help.mjs';
import { BRITJOY_REVIEW_VIDEO_MANIFEST } from '../src/shared/question-videos/britjoy-review-videos';

describe('BritJoy A2 review pilots', () => {
  const clips = ['britjoy-trabajo', 'britjoy-gp'];
  const lessons = unit.lessons.slice(0, clips.length);
  for (const [lessonNumber, { id: lessonId, exercises }] of lessons.entries()) {
    const clip = clips[lessonNumber];
    it(`maps the chapter and each exact exercise of ${lessonId}`, () => {
      const resolve = (questionId?: string) => resolveQuestionVideoHelp(
        { lessonId, questionId, targetLanguage: 'en' }, BRITJOY_REVIEW_VIDEO_MANIFEST,
      );
      const suffixes = ['capitulo'];
      expect(resolve()).toMatchObject({ conceptId: `${clip}-capitulo`, playable: true });
      for (const [index, exercise] of exercises.entries()) {
        if (exercise.type === 'explain') continue;
        const suffix = index === 1 ? 'pregunta' : `pregunta-${index}`;
        expect(resolve(`${lessonId}:${index}`)).toMatchObject({ conceptId: `${clip}-${suffix}`, playable: true });
        suffixes.push(suffix);
      }
      expect(resolve(`${lessonId}:99`)).toBeNull();
      for (const suffix of suffixes) {
        for (const extension of ['mp4', 'es.vtt', 'en.vtt']) {
          expect(existsSync(`public/videos/ingles-a2/${clip}-${suffix}.${extension}`)).toBe(true);
        }
      }
    });
  }

  it('registers all 16 A2 pilot videos as referenced and present in the media audit', () => {
    const level = { id: 'A2', name: 'A2', track: 'english', units: [{ unit: unit.unit, lessons: lessons.map(({ id }) => ({ id })) }] };
    const audit = auditLevels([level], { questionVideos: BRITJOY_REVIEW_VIDEO_MANIFEST.concepts });
    expect(audit.presentFiles.filter((path) => path.startsWith('videos/ingles-a2/'))).toHaveLength(16);
    expect(audit.unreferencedFiles.filter((path) => path.startsWith('videos/ingles-a2/'))).toEqual([]);
  });
});
