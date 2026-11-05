import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { ALL_LEVELS, LEVELS } from '../src/data/courses/en-es';
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
    case 'explain':
    case 'dialogue':
      return { kind: 'text', value: 'ok' };
    case 'speak':
      return { kind: 'speech', transcript: ex.text };
    default:
      return { kind: 'text', value: ex.answer };
  }
}

const VALID_TYPES = ['explain', 'dialogue', 'speak', 'multipleChoice', 'wordBank', 'listening', 'matching', 'typing', 'fillBlank'];

describe('course content', () => {
  const lessons = ALL_LEVELS.flatMap((level) => level.units.flatMap((u) => u.lessons.map((lesson) => ({ level, unit: u, lesson }))));

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

  it('has 8–12 exercises per English lesson', () => {
    for (const { level, lesson } of lessons.filter((l) => l.level.track === 'english')) {
      expect(lesson.exercises.length, `${level.id} ${lesson.id}`).toBeGreaterThanOrEqual(8);
      expect(lesson.exercises.length, lesson.id).toBeLessThanOrEqual(12);
    }
  });

  it('Vivir en UK lessons explain first, then practise (5+ graded, 14 max)', () => {
    const life = lessons.filter((l) => l.level.track === 'life');
    expect(life.length).toBeGreaterThanOrEqual(15);
    for (const { lesson } of life) {
      expect(lesson.exercises[0].type, lesson.id).toBe('explain');
      const graded = lesson.exercises.filter((e) => e.type !== 'explain').length;
      expect(graded, lesson.id).toBeGreaterThanOrEqual(5);
      expect(lesson.exercises.length, lesson.id).toBeLessThanOrEqual(14);
    }
  });

  it('story courses: modules in order, each opening with a scene and including a mission', () => {
    for (const level of ALL_LEVELS.filter((l) => l.track === 'daily' || l.track === 'tourist')) {
      expect(level.units.length, level.id).toBeGreaterThan(0);
      level.units.forEach((u, i) => {
        expect(u.unit, `${level.id} module order`).toBe(`Módulo ${i + 1}`);
        for (const lesson of u.lessons) {
          expect(lesson.exercises[0].type, lesson.id).toBe('explain');
          const missions = lesson.exercises.filter((e) => e.type === 'explain' && e.title.includes('Misión'));
          expect(missions.length, `${lesson.id} needs a 🎯 Misión card`).toBeGreaterThanOrEqual(1);
          const graded = lesson.exercises.filter((e) => e.type !== 'explain').length;
          expect(graded, lesson.id).toBeGreaterThanOrEqual(5);
          expect(lesson.exercises.length, lesson.id).toBeLessThanOrEqual(14);
        }
      });
    }
  });

  it('IA course: 7 lessons, each opening with an idea and a challenge', () => {
    const ia = ALL_LEVELS.find((l) => l.id === 'IA')!;
    const ls = ia.units.flatMap((u) => u.lessons);
    expect(ls).toHaveLength(7);
    for (const lesson of ls) {
      expect(lesson.exercises[0].type, lesson.id).toBe('explain');
      expect(lesson.exercises.some((e) => e.type === 'explain' && e.title.includes('Reto')), lesson.id).toBe(true);
      expect(lesson.exercises.filter((e) => e.type !== 'explain').length, lesson.id).toBeGreaterThanOrEqual(5);
    }
  });

  it('every unit of Vivir en UK records when its facts were checked', () => {
    for (const level of ALL_LEVELS.filter((l) => l.track !== 'english')) {
      for (const u of level.units) expect(u.checked, u.unit).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
        if (ex.type === 'explain') {
          expect(ex.title.length, where).toBeGreaterThan(0);
          if (ex.link) expect(ex.link.url, where).toMatch(/^https:\/\//);
          if (ex.video) {
            expect(existsSync(`public/${ex.video.src}`), `${where}: missing ${ex.video.src}`).toBe(true);
            if (ex.video.poster) expect(existsSync(`public/${ex.video.poster}`), where).toBe(true);
          }
        }
        if (ex.type === 'matching') expect(ex.pairs.length, where).toBeGreaterThanOrEqual(3);
        if (ex.type === 'dialogue') {
          expect(ex.lines.length, where).toBeGreaterThanOrEqual(3);
          for (const line of ex.lines) expect(line.text && line.meaning && line.who, where).toBeTruthy();
        }
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
