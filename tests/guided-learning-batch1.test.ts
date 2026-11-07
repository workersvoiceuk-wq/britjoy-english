import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ALL_LEVELS as LEVELS } from '../src/data/courses/en-es';
import { SPAIN_LEVELS } from '../src/data/courses/espana';
import { COLOMBIA_LEVELS } from '../src/data/courses/colombia';
import { LearningPath } from '../src/components/LearningPath';
import { ExplainCard } from '../src/components/exercises/ExplainCard';
import { LessonPrelude, LessonReflection } from '../src/components/LessonStory';
import { copyFor } from '../src/lib/copy';
import { explanationForExercise, objectiveForLesson } from '../src/logic/lessonStory';
import type { ExplainExercise, Lesson } from '../src/types';

const ROOT = path.resolve(__dirname, '..');
const INDEX_CSS = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');

function findLesson(lessonId: string): { levelId: string; lesson: Lesson } {
  for (const level of LEVELS) {
    for (const unit of level.units) {
      const hit = unit.lessons.find((l) => l.id === lessonId);
      if (hit) return { levelId: level.id, lesson: hit };
    }
  }
  throw new Error(`Lesson not found: ${lessonId}`);
}

describe('Phase 1 VUM Guided Learning + Demo Videos (mobile & desktop)', () => {
  it('shows upfront unit menu, clear course goal, preserved progress, and optional BritJoy Help on course entry', () => {
    const aiLevel = LEVELS.find((l) => l.id === 'IA')!;
    const firstLessonId = aiLevel.units[0].lessons[0].id;
    const html = renderToStaticMarkup(
      createElement(LearningPath, {
        level: aiLevel,
        completed: { [firstLessonId]: { stars: 3, bestXp: 25, completedAt: 1793923200000 } },
        onStart() {},
      }),
    );

    expect(html).toContain('data-unit-menu="true"');
    expect(html).toContain('data-course-objective="true"');
    expect(html).toContain(aiLevel.description);
    expect(html).toMatch(/1 \/ \d+ lecciones/);
    expect(html).toContain('href="#unit-1"');
    expect(html).toContain('🎬');
    // Non-urgent BritJoy coach is collapsed inside optional Help (aria-expanded="false")
    expect(html).toContain('data-britjoy-path-help="true"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Escuchar el consejo de Britjoy');

    // Urgent notice (e.g. out of hearts) remains immediately visible outside closed details
    const noticeHtml = renderToStaticMarkup(
      createElement(LearningPath, {
        level: aiLevel,
        completed: {},
        notice: 'Sin vidas disponibles',
        onStart() {},
      }),
    );
    expect(noticeHtml).toContain('Sin vidas disponibles');
    expect(noticeHtml).not.toContain('data-britjoy-path-help="true"');
  });

  it('wires the 4 verified 1-to-1 concept demo videos with matching countryCode, ES/EN WebVTT subtitles, and honest pending narration', () => {
    const expectedDemos = [
      { lessonId: 'ia-05-bias', videoSrc: 'videos/demos/ia-bias-demo-v1.mp4', country: 'GLOBAL' },
      { lessonId: 'ia-09-supervision', videoSrc: 'videos/demos/ia-cv-hoja-vida-v1.mp4', country: 'GLOBAL' },
      { lessonId: 'dia-01-presentaciones', videoSrc: 'videos/demos/ingles-name-demo-v1.mp4', country: 'GB' },
      { lessonId: 'tur-11-costumbres', videoSrc: 'videos/demos/ingles-coffee-demo-v1.mp4', country: 'GB' },
    ];

    for (const item of expectedDemos) {
      const { lesson } = findLesson(item.lessonId);
      const explain = lesson.exercises[0] as ExplainExercise;
      expect(explain.type).toBe('explain');
      expect(explain.video?.src).toBe(item.videoSrc);
      expect(explain.video?.countryCode).toBe(item.country);
      expect(explain.video?.narrationPending).toBe(true);
      expect(explain.video?.aspect).toBe('16/9');
      expect(explain.video?.tracks).toHaveLength(2);

      // Verify physical MP4 and valid WebVTT subtitle files on disk
      const mp4Path = path.join(ROOT, 'public', explain.video!.src);
      expect(fs.existsSync(mp4Path)).toBe(true);
      for (const tr of explain.video!.tracks!) {
        const vttPath = path.join(ROOT, 'public', tr.src);
        expect(fs.existsSync(vttPath)).toBe(true);
        const vttContent = fs.readFileSync(vttPath, 'utf8');
        expect(vttContent.startsWith('WEBVTT')).toBe(true);
      }

      // Render ExplainCard and verify mobile-legible captions + visual mechanism + pending narration badge
      const cardHtml = renderToStaticMarkup(
        createElement(ExplainCard, {
          exercise: explain,
          locked: false,
          correct: null,
          copy: copyFor('es', 'en'),
          onResponse() {},
        }),
      );
      expect(cardHtml).toContain('data-demo-video="true"');
      expect(cardHtml).toContain('data-mobile-captions="es"');
      expect(cardHtml).toContain('data-narration-pending="true"');
      expect(cardHtml).toContain('narración pendiente');
      expect(cardHtml).toContain('data-visual-mechanism="true"');
    }
  });

  it('renders step-by-step mobile captions for Spain and Colombia country explainer videos with faithful country codes', () => {
    for (const [levels, code] of [
      [SPAIN_LEVELS, 'ES'],
      [COLOMBIA_LEVELS, 'CO'],
    ] as const) {
      for (const level of levels) {
        const lesson = level.units[0].lessons[0];
        const explain = lesson.exercises[0] as ExplainExercise;
        expect(explain.video?.countryCode).toBe(code);
        expect(explain.video?.captionsSummary?.length).toBeGreaterThanOrEqual(2);
        const html = renderToStaticMarkup(
          createElement(ExplainCard, {
            exercise: explain,
            locked: false,
            correct: null,
            copy: copyFor(level.instructionLanguage, level.targetLanguage),
            onResponse() {},
          }),
        );
        expect(html).toContain(`data-mobile-captions="${level.instructionLanguage}"`);
      }
    }
  });

  it('displays clear lesson objective upfront, produces actionable explanations on graded tasks, and keeps mobile subtitle CSS rules', () => {
    const { lesson } = findLesson('ia-09-supervision');
    const goal = objectiveForLesson(lesson, 'es');
    expect(goal).toMatch(/revisión humana/i);

    const preludeHtml = renderToStaticMarkup(
      createElement(LessonPrelude, { lesson, locale: 'es', onExit() {}, onContinue() {} }),
    );
    expect(preludeHtml).toContain('data-lesson-objective="true"');
    expect(preludeHtml).toContain(goal);

    const reflectionHtml = renderToStaticMarkup(
      createElement(LessonReflection, {
        lesson,
        locale: 'es',
        prediction: 'Lo enviaría rápido',
        onExit() {},
        onFinish() {},
      }),
    );
    expect(reflectionHtml).toContain('Lo enviaría rápido');
    expect(reflectionHtml).toContain('for="lesson-reflection"');

    const gradedMc = lesson.exercises.find((e) => e.type === 'multipleChoice')!;
    const exp = explanationForExercise(lesson, gradedMc, gradedMc.answer, 'es');
    expect(exp.length).toBeGreaterThan(15);

    // Mobile & desktop WebVTT + caption CSS rules
    expect(INDEX_CSS).toContain('[data-demo-video] video::cue');
    expect(INDEX_CSS).toContain('clamp(15px, 4.1vw, 19px)');
    expect(INDEX_CSS).toContain('@media (max-width: 420px)');
  });
});
