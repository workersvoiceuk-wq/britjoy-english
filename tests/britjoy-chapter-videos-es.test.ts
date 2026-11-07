import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS } from '../src/data/courses/en-es';
import clips from '../src/shared/question-videos/britjoy-review-video-clips.json';
import { resolveQuestionVideoHelp } from '../src/shared/question-videos/question-video-help.mjs';
import { BRITJOY_REVIEW_VIDEO_MANIFEST } from '../src/shared/question-videos/britjoy-review-videos';

// Vídeos de capítulo de Vivir en UK, IA y los bloques de ampliación: cada lección que no tenía vídeo en su tarjeta
// «Aprende» tiene ahora el suyo (animación VUM + captura, subtítulos ES/EN, locución original pendiente). El
// reproductor lo encuentra con el curso que deduce de la lección, igual que en la app.
const LEVELS = ['UK', 'IA', 'CIBER', 'ELEC', 'COND-GB', 'ES-MCER', 'IA-PRO', 'UK-HIST'];
type Lesson = { id: string; exercises: { type: string; video?: unknown }[] };
const levels = (ALL_LEVELS as unknown as { id: string; track?: string; targetLanguage?: string; units: { lessons: Lesson[] }[] }[]).filter((l) =>
  LEVELS.includes(l.id),
);

describe('BritJoy chapter videos: Vivir en UK, IA and deepening blocks', () => {
  it('covers the 8 levels', () => expect(levels.map((l) => l.id).sort()).toEqual([...LEVELS].sort()));
  for (const level of levels)
    for (const lesson of level.units.flatMap((u) => u.lessons)) {
      const own = lesson.exercises.some((e) => e.type === 'explain' && e.video);
      it(`${level.id} ${lesson.id}: has a chapter video${own ? ' (its own, kept)' : ''}`, () => {
        if (own) {
          expect(clips.some((c) => c.lessonId === lesson.id && !c.questionId)).toBe(false);
          return;
        }
        const resolved = resolveQuestionVideoHelp(
          { lessonId: lesson.id, track: level.track, targetLanguage: level.targetLanguage },
          BRITJOY_REVIEW_VIDEO_MANIFEST,
        );
        expect(resolved).toMatchObject({ conceptId: `${lesson.id}-capitulo`, playable: true });
        const clip = clips.find((c) => c.id === `${lesson.id}-capitulo`) as { folder: string; cues: { text: string[] }[] };
        expect(clip.folder).toBe(`videos/${level.id.toLowerCase()}`);
        expect(clip.cues.length).toBeGreaterThanOrEqual(3);
        for (const cue of clip.cues) expect(cue.text.every((t) => t.trim().length > 10)).toBe(true);
        for (const ext of ['mp4', 'es.vtt', 'en.vtt']) expect(existsSync(`public/${clip.folder}/${lesson.id}-capitulo.${ext}`), ext).toBe(true);
        for (const lang of ['es', 'en']) {
          const vtt = readFileSync(`public/${clip.folder}/${lesson.id}-capitulo.${lang}.vtt`, 'utf8');
          expect(vtt.startsWith('WEBVTT')).toBe(true);
          expect((vtt.match(/-->/g) ?? []).length).toBe(clip.cues.length);
        }
      });
    }
});
