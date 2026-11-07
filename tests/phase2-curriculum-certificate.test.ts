import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/data/catalog';
import { ALL_LEVELS } from '../src/data/courses/en-es';
import { AMPLIACION_LEVELS } from '../src/data/courses/ampliacion';
import { PATHWAYS_BY_DOMAIN, pathwayForLevel } from '../src/data/coursePathways';
import { Certificate, resolveCertificateCompletionDate } from '../src/components/Certificate';
import { CoursePathwayBox } from '../src/components/CoursePathwayBox';
import {
  feedbackForAttempt,
  gradualHintForExercise,
  honestVisualMechanismForExercise,
  simulateContextualTutorReply,
} from '../src/logic/lessonStory';
import type { MultipleChoiceExercise } from '../src/types';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 2 curriculum expansion, real certificate timestamp, and contextual single-task learning', () => {
  it('resolves the real stored max(completedAt) timestamp in Certificate and displays the private non-identity disclaimer', () => {
    const iaCourse = CATALOG.find((c) => c.id === 'ia-con-britjoy')!;
    const earlierTs = Date.UTC(2025, 4, 10, 12, 0, 0); // 10 May 2025
    const realCompletionTs = Date.UTC(2025, 8, 19, 15, 30, 0); // 19 Sep 2025

    const levels = {
      IA: {
        xp: 45,
        completedLessons: {
          'ia-01-patterns': { stars: 3 as const, bestXp: 15, completedAt: earlierTs },
          'ia-02-train': { stars: 3 as const, bestXp: 15, completedAt: realCompletionTs },
        },
      },
    };

    const resolved = resolveCertificateCompletionDate(iaCourse, levels, Date.UTC(2026, 10, 7));
    expect(resolved.getTime()).toBe(realCompletionTs);

    // Fallback works cleanly when no completedAt exists yet
    const fallback = resolveCertificateCompletionDate(iaCourse, {}, Date.UTC(2026, 10, 7));
    expect(fallback.getTime()).toBe(Date.UTC(2026, 10, 7));

    const htmlEs = renderToStaticMarkup(
      createElement(Certificate, { course: iaCourse, onClose() {}, levelsOverride: levels, langOverride: 'es' }),
    );
    expect(htmlEs).toContain('2025');
    expect(htmlEs).not.toContain('2026');
    expect(htmlEs).toContain('data-private-cert-disclaimer="true"');
    expect(htmlEs).toMatch(/no acredita identidad/i);

    const htmlEn = renderToStaticMarkup(
      createElement(Certificate, { course: iaCourse, onClose() {}, levelsOverride: levels, langOverride: 'en' }),
    );
    expect(htmlEn).toContain('2025');
    expect(htmlEn).toMatch(/does not verify legal identity/i);
  });

  it('explains why the chosen wrong option fails on 1st attempt without leaking the right answer, then reveals on 2nd attempt', () => {
    const elec = ALL_LEVELS.find((l) => l.id === 'ELEC')!;
    const lesson = elec.units[0].lessons[0];
    const mc = lesson.exercises.find((e): e is MultipleChoiceExercise => e.type === 'multipleChoice')!;
    const wrongChoice = mc.options.find((o) => o !== mc.answer)!;

    // 1st wrong try (attemptNumber = 0): specific failure explanation + gradual hint, withholdAnswer = true
    const miss1 = feedbackForAttempt({
      lesson,
      exercise: mc,
      response: { kind: 'text', value: wrongChoice },
      result: { correct: false, correctAnswer: mc.answer },
      locale: 'es',
      attemptNumber: 0,
    });
    expect(miss1.withholdAnswer).toBe(true);
    expect(miss1.explanation).toContain('Pista gradual');
    expect(miss1.explanation).not.toContain(mc.answer);

    // 2nd wrong try (attemptNumber = 1): withholdAnswer = false (reveals canonical answer)
    const miss2 = feedbackForAttempt({
      lesson,
      exercise: mc,
      response: { kind: 'text', value: wrongChoice },
      result: { correct: false, correctAnswer: mc.answer },
      locale: 'es',
      attemptNumber: 1,
    });
    expect(miss2.withholdAnswer).toBe(false);
  });

  it('covers all 7 domains in coursePathways, ships downloadable ES/EN study guide, and registers 6 new progressive courses + A2/B2 units', () => {
    expect(Object.keys(PATHWAYS_BY_DOMAIN)).toEqual([
      'ingles',
      'espanol',
      'ia',
      'ciberseguridad',
      'electricidad',
      'life-uk',
      'conduccion-gb',
    ]);
    const guideFile = path.join(ROOT, 'public', 'resources', 'guia-7-cursos-vum-es-en.md');
    expect(fs.existsSync(guideFile)).toBe(true);
    expect(fs.readFileSync(guideFile, 'utf8')).toContain('no acredita identidad');

    expect(AMPLIACION_LEVELS.map((l) => l.id)).toEqual(['ES-MCER', 'IA-PRO', 'CIBER', 'ELEC', 'UK-HIST', 'COND-GB']);
    for (const lvl of AMPLIACION_LEVELS) {
      const pw = pathwayForLevel(lvl);
      const boxHtml = renderToStaticMarkup(createElement(CoursePathwayBox, { pathway: pw, locale: lvl.instructionLanguage, collapsible: true }));
      expect(boxHtml).toContain(`data-pathway-guide="${pw.domain}"`);
      expect(boxHtml).toContain('data-download-study-guide="true"');
      for (const src of pw.sources) {
        expect(src.url).toMatch(/^https:\/\//);
      }
    }

    const a2 = ALL_LEVELS.find((l) => l.id === 'A2')!;
    const b2 = ALL_LEVELS.find((l) => l.id === 'B2')!;
    expect(a2.units.some((u) => u.lessons.some((l) => l.id === 'a2-u2-l1'))).toBe(true);
    expect(b2.units.some((u) => u.lessons.some((l) => l.id === 'b2-u2-l1'))).toBe(true);
  });

  it('provides honest visual mechanisms and simulated contextual tutor QA that guides without solving before an attempt', () => {
    const b2 = ALL_LEVELS.find((l) => l.id === 'B2')!;
    const lesson = b2.units[1].lessons[0]; // b2-u2-l1
    const mc = lesson.exercises.find((e): e is MultipleChoiceExercise => e.type === 'multipleChoice')!;

    const hint = gradualHintForExercise(lesson, mc, 'en');
    expect(hint.toLowerCase()).not.toContain(mc.answer.toLowerCase());

    const mech = honestVisualMechanismForExercise(lesson, mc, 'en');
    expect(mech.steps).toHaveLength(3);
    expect(mech.hasLessonDemoVideo).toBe(false);
    expect(mech.mediaStatus).toMatch(/no empty video buttons/i);

    const beforeTry = simulateContextualTutorReply({
      courseId: b2.id,
      courseName: b2.name,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      prompt: mc.prompt,
      chosenOption: mc.options[1],
      attempted: false,
      lesson,
      exercise: mc,
      locale: 'en',
    });
    expect(beforeTry.badge).toMatch(/QA SIMULATION/i);
    expect(beforeTry.reply).toMatch(/won’t give away the answer before you try/i);
    expect(beforeTry.reply.toLowerCase()).not.toContain(mc.answer.toLowerCase());
  });
});
