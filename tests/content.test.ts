import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/courses/en-es';
import placement from '../src/data/placement.json';
import { checkAnswer, normalizeText, tokenize } from '../src/logic/answer';
import type { Exercise, ExerciseResponse } from '../src/types';

/** The response a perfect learner would give, used to prove every exercise is solvable. */
function perfectResponse(ex: Exercise): ExerciseResponse {
  switch (ex.type) {
    case 'wordBank':
      return { kind: 'tokens', value: ex.answer.split(' ') };
    case 'matching':
      return { kind: 'matching', mismatches: 0 };
    default:
      return { kind: 'text', value: ex.answer };
  }
}

const VALID_TYPES = ['multipleChoice', 'wordBank', 'listening', 'matching', 'typing', 'fillBlank'];

describe('course content', () => {
  const lessons = LEVELS.flatMap((level) => level.units.flatMap((u) => u.lessons.map((lesson) => ({ level, unit: u, lesson }))));

  it('has every CEFR level with at least one unit of two lessons', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    for (const level of LEVELS) {
      expect(level.units.length).toBeGreaterThan(0);
      expect(level.units[0].lessons.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('uses unique lesson ids that match their level', () => {
    const ids = lessons.map((l) => l.lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { level, unit, lesson } of lessons) {
      expect(unit.level).toBe(level.id);
      expect(lesson.id.startsWith(level.id.toLowerCase() + '-')).toBe(true);
    }
  });

  it('has 8–12 exercises per lesson', () => {
    for (const { lesson } of lessons) {
      expect(lesson.exercises.length, lesson.id).toBeGreaterThanOrEqual(8);
      expect(lesson.exercises.length, lesson.id).toBeLessThanOrEqual(12);
    }
  });

  for (const { lesson } of lessons) {
    it(`${lesson.id}: every exercise is well-formed and solvable`, () => {
      lesson.exercises.forEach((ex, i) => {
        const where = `${lesson.id} #${i + 1} (${ex.type})`;
        expect(VALID_TYPES, where).toContain(ex.type);
        if ('options' in ex && ex.options) {
          expect(ex.options.map(normalizeText), where).toContain(normalizeText(ex.answer));
          expect(new Set(ex.options).size, `${where} duplicate options`).toBe(ex.options.length);
        }
        if (ex.type === 'wordBank') {
          // Every answer token must be available as a tile (respecting duplicates).
          const pool = ex.words.flatMap(tokenize);
          for (const token of tokenize(ex.answer)) {
            const at = pool.indexOf(token);
            expect(at, `${where}: missing tile "${token}"`).toBeGreaterThanOrEqual(0);
            pool.splice(at, 1);
          }
          expect(ex.words.length, `${where}: needs distractors`).toBeGreaterThan(tokenize(ex.answer).length);
        }
        if (ex.type === 'fillBlank') expect(ex.sentence, where).toContain('___');
        if (ex.type === 'matching') expect(ex.pairs.length, where).toBeGreaterThanOrEqual(3);
        expect(checkAnswer(ex, perfectResponse(ex)).correct, where).toBe(true);
      });
    });
  }

  it('placement quiz has 10 questions covering all levels', () => {
    expect(placement.questions).toHaveLength(10);
    expect(new Set(placement.questions.map((q) => q.level))).toEqual(new Set(LEVELS.map((l) => l.id)));
    for (const q of placement.questions) expect(q.options).toContain(q.answer);
  });
});
