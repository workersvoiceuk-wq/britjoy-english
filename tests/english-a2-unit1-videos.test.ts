import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import unit from '../src/data/courses/en-es/a2/unit-1.json';
import clips from '../src/shared/question-videos/britjoy-review-video-clips.json';
import { resolveQuestionVideoHelp } from '../src/shared/question-videos/question-video-help.mjs';
import { BRITJOY_REVIEW_VIDEO_MANIFEST } from '../src/shared/question-videos/britjoy-review-videos';

// A2 unit 1 (Mi día a día, Ayer): one chapter demo per lesson and one review video per evaluable exercise.
describe('BritJoy English A2 unit 1 videos', () => {
  for (const { id: lessonId, exercises } of unit.lessons) {
    it(`maps a chapter video and every exercise of ${lessonId} to its own clip`, () => {
      const resolve = (questionId?: string) =>
        resolveQuestionVideoHelp({ lessonId, questionId, targetLanguage: 'en' }, BRITJOY_REVIEW_VIDEO_MANIFEST);
      const ids = [`${lessonId}-capitulo`];
      expect(resolve()).toMatchObject({ conceptId: `${lessonId}-capitulo`, playable: true });
      for (const [index, exercise] of exercises.entries()) {
        if (exercise.type === 'explain' || exercise.type === 'dialogue') continue;
        expect(resolve(`${lessonId}:${index}`)).toMatchObject({ conceptId: `${lessonId}-p${index}`, playable: true });
        ids.push(`${lessonId}-p${index}`);
      }
      for (const id of ids) {
        for (const ext of ['mp4', 'es.vtt', 'en.vtt']) expect(existsSync(`public/videos/ingles-a2/${id}.${ext}`), `${id}.${ext}`).toBe(true);
        const clip = clips.find((c) => c.id === id)!;
        expect(clip.cues.length).toBeGreaterThanOrEqual(3);
        for (const cue of clip.cues) expect(cue.text.every((t: string) => t.trim().length > 10)).toBe(true);
        for (const lang of ['es', 'en']) {
          const vtt = readFileSync(`public/videos/ingles-a2/${id}.${lang}.vtt`, 'utf8');
          expect(vtt.startsWith('WEBVTT')).toBe(true);
          expect((vtt.match(/-->/g) ?? []).length).toBe(clip.cues.length);
        }
      }
    });
  }

  it('registers all 18 unit 1 videos as referenced and present in the media audit', async () => {
    const { auditLevels } = await import('../scripts/audit-lesson-videos.mjs');
    const level = { id: 'A2', name: 'A2', track: 'english', units: [{ unit: unit.unit, lessons: unit.lessons.map(({ id }) => ({ id })) }] };
    const audit = auditLevels([level], { questionVideos: BRITJOY_REVIEW_VIDEO_MANIFEST.concepts });
    expect(audit.presentFiles.filter((p: string) => p.startsWith('videos/ingles-a2/a2-u1-'))).toHaveLength(18);
    expect(audit.missingFiles ?? []).toEqual([]);
    expect(audit.unreferencedFiles.filter((p: string) => p.startsWith('videos/ingles-a2/a2-u1-'))).toEqual([]);
  });

  it('keeps lesson IDs and the course data untouched (videos are mapped, not inserted into the lesson JSON)', () => {
    expect(unit.lessons.map((l) => l.id)).toEqual(['a2-u1-l1', 'a2-u1-l2']);
    expect(unit.lessons.every((l) => l.exercises.every((e) => !('video' in e)))).toBe(true);
  });
});
