import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/data/catalog';
import { LEVELS, findLesson } from '../src/data/courses/en-es';
import { feedbackForAttempt, gradualHintForExercise, mentionsExerciseAnswer } from '../src/logic/lessonStory';
import { preserveEnglishCompletion } from '../src/logic/legacyEnglish';
import { isLevelUnlocked } from '../src/logic/unlock';

describe('Phase 2 review regressions', () => {
  it('scans the rendered hints and first-miss feedback of all catalogue exercises in ES and EN', () => {
    let exercises = 0;
    let optionLanguages = 0;
    const rawCandidates = new Set<string>();
    const levels = new Map(CATALOG.flatMap(c => c.levels.map(level => [level.id, level] as const)));
    for (const level of levels.values()) for (const unit of level.units) for (const lesson of unit.lessons) {
      for (const [index, exercise] of lesson.exercises.entries()) {
        if (exercise.type === 'explain' || exercise.type === 'dialogue') continue;
        exercises++;
        if (exercise.gradualHint && mentionsExerciseAnswer(exercise.gradualHint, exercise)) rawCandidates.add(lesson.id + '/' + index + '/hint');
        for (const locale of ['es','en'] as const) {
          const hint = gradualHintForExercise(lesson, exercise, locale);
          expect(mentionsExerciseAnswer(hint, exercise), lesson.id + '/' + index + '/' + locale).toBe(false);
          if (!('options' in exercise) || !Array.isArray(exercise.options) || !('answer' in exercise) || typeof exercise.answer !== 'string') continue;
          for (const value of exercise.options.filter(o => typeof o === 'string' && o !== exercise.answer)) {
            if (typeof value !== 'string') continue;
            const raw = exercise.optionExplanations?.[value];
            if (raw && mentionsExerciseAnswer(raw, exercise)) rawCandidates.add(lesson.id + '/' + index + '/wrong');
            const args = { lesson, exercise, response: {kind:'text' as const,value}, result: {correct:false,correctAnswer:exercise.answer}, locale };
            const first = feedbackForAttempt({...args,attemptNumber:0});
            expect(first.withholdAnswer).toBe(true);
            expect(mentionsExerciseAnswer(first.explanation,exercise),lesson.id + '/' + index + '/' + locale).toBe(false);
            expect(feedbackForAttempt({...args,attemptNumber:1}).withholdAnswer).toBe(false);
            optionLanguages++;
          }
        }
      }
    }
    expect(exercises).toBeGreaterThan(100);
    expect(optionLanguages).toBeGreaterThan(1000);
    console.log(JSON.stringify({exercises,optionLanguages,rawCandidates:[...rawCandidates]},null,2));
  });

  it.each([
    ['a2-u2-l2','since','from',/inicio|horario/i,/schedule|interval/i],
    ['cond-gb-02-movilidad-ucl','Reach','Lane',/carril/i,/strip of road/i],
  ])('provides a bilingual reason for the identified leak in %s', (lessonId, answer, chosen, es, en) => {
    const lesson = findLesson(lessonId)!.lesson;
    const exercise = lesson.exercises.find(e => 'answer' in e && e.answer === answer)!;
    for (const [locale, criterion] of [['es',es],['en',en]] as const) {
      const feedback = feedbackForAttempt({lesson,exercise,response:{kind:'text',value:chosen},result:{correct:false,correctAnswer:answer},locale,attemptNumber:0});
      expect(feedback.explanation).toMatch(criterion);
      expect(mentionsExerciseAnswer(feedback.explanation,exercise)).toBe(false);
    }
  });

  it('preserves unlocked A2/B2 successor levels and the old course certificate without counting new lessons as done', () => {
    const old = Object.fromEntries(LEVELS.map(level => [level.id,{
      completedLessons:Object.fromEntries(level.units.flatMap((unit,index) =>
        index > 0 && ['A2','B2'].includes(level.id) ? [] : unit.lessons.map(lesson => [lesson.id,{completedAt:1600000000000}])))
    }]));
    const saved = preserveEnglishCompletion(old);
    expect(saved.legacyEnglishCertificate).toBe(true);
    expect(saved.legacyEnglishCertificateAt).toBe(1600000000000);
    const completed = Object.fromEntries(Object.entries(old).map(([id,level])=>[id,level.completedLessons]));
    for (const successor of ['B1','C1']) {
      expect(isLevelUnlocked(LEVELS,successor,completed,null)).toBe(false);
      expect(isLevelUnlocked(LEVELS,successor,completed,null,saved.legacyEnglishLevels)).toBe(true);
    }
    expect(completed.A2['a2-u2-l1']).toBeUndefined();
    expect(completed.B2['b2-u2-l1']).toBeUndefined();
    expect(preserveEnglishCompletion({A2:old.A2,B2:old.B2}).legacyEnglishCertificate).toBe(false);
  });
});
