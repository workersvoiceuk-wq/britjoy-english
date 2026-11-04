import { describe, expect, it } from 'vitest';
import { isLessonUnlocked, isLevelUnlocked, nextLessonId, unitCompletionRatio } from '../src/logic/unlock';
import type { LevelDefinition, Unit } from '../src/types';

const unit = (level: string, n: number, lessons: number): Unit => ({
  level,
  unit: `Unit ${n}`,
  title: `Unit ${n}`,
  lessons: Array.from({ length: lessons }, (_, i) => ({
    id: `${level.toLowerCase()}-u${n}-l${i + 1}`,
    title: `L${i + 1}`,
    exercises: [],
  })),
});

const level = (id: string, units: Unit[]): LevelDefinition => ({
  id,
  track: id === 'UK' ? 'life' : 'english',
  name: id,
  description: '',
  accent: '#000',
  accentDark: '#000',
  accentLight: '#fff',
  instructionLanguage: 'es',
  units,
});

// A1 has 5 units of 2 lessons → 80% means 4 complete units.
const A1 = level('A1', [1, 2, 3, 4, 5].map((n) => unit('A1', n, 2)));
const A2 = level('A2', [unit('A2', 1, 2)]);
const B1 = level('B1', [unit('B1', 1, 2)]);
const LEVELS = [A1, A2, B1];

const completeUnits = (lvl: LevelDefinition, count: number) =>
  Object.fromEntries(lvl.units.slice(0, count).flatMap((u) => u.lessons.map((l) => [l.id, true])));

describe('level unlocking (80% of previous level units)', () => {
  it('always unlocks the first level', () => {
    expect(isLevelUnlocked(LEVELS, 'A1', {})).toBe(true);
  });

  it('keeps the next level locked below 80%', () => {
    expect(isLevelUnlocked(LEVELS, 'A2', { A1: completeUnits(A1, 3) })).toBe(false); // 60%
  });

  it('unlocks the next level at exactly 80%', () => {
    expect(unitCompletionRatio(A1, completeUnits(A1, 4))).toBeCloseTo(0.8);
    expect(isLevelUnlocked(LEVELS, 'A2', { A1: completeUnits(A1, 4) })).toBe(true);
  });

  it('does not count partially completed units', () => {
    const progress = { ...completeUnits(A1, 3), 'a1-u4-l1': true, 'a1-u5-l1': true };
    expect(isLevelUnlocked(LEVELS, 'A2', { A1: progress })).toBe(false);
  });

  it('only looks at the immediately previous level', () => {
    expect(isLevelUnlocked(LEVELS, 'B1', { A1: completeUnits(A1, 5) })).toBe(false);
    expect(isLevelUnlocked(LEVELS, 'B1', { A2: completeUnits(A2, 1) })).toBe(true);
  });

  it('unlocks every level up to the placement result', () => {
    expect(isLevelUnlocked(LEVELS, 'A2', {}, 'B1')).toBe(true);
    expect(isLevelUnlocked(LEVELS, 'B1', {}, 'B1')).toBe(true);
    expect(isLevelUnlocked(LEVELS, 'B1', {}, 'A2')).toBe(false);
  });

  it('returns false for unknown levels', () => {
    expect(isLevelUnlocked(LEVELS, 'Z9', {})).toBe(false);
  });
});

describe('Vivir en UK track', () => {
  const UK = level('UK', [unit('UK', 1, 3)]);
  it('is always unlocked and does not block English levels', () => {
    expect(isLevelUnlocked([...LEVELS, UK], 'UK', {})).toBe(true);
    expect(isLevelUnlocked([...LEVELS, UK], 'A2', { A1: completeUnits(A1, 4) })).toBe(true);
  });
  it('lets any lesson be taken in any order', () => {
    expect(isLessonUnlocked(UK, 'uk-u1-l3', {})).toBe(true);
    expect(isLessonUnlocked(UK, 'nope', {})).toBe(false);
  });
});

describe('lesson unlocking inside a level', () => {
  it('unlocks lessons in order across units', () => {
    expect(isLessonUnlocked(A1, 'a1-u1-l1', {})).toBe(true);
    expect(isLessonUnlocked(A1, 'a1-u1-l2', {})).toBe(false);
    expect(isLessonUnlocked(A1, 'a1-u2-l1', { 'a1-u1-l1': true, 'a1-u1-l2': true })).toBe(true);
  });
  it('finds the next lesson to play', () => {
    expect(nextLessonId(A1, { 'a1-u1-l1': true })).toBe('a1-u1-l2');
    expect(nextLessonId(A2, completeUnits(A2, 1))).toBeNull();
  });
});
