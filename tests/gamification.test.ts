import { describe, expect, it } from 'vitest';
import {
  HEART_REGEN_MS,
  MAX_HEARTS,
  lessonStars,
  lessonXp,
  msUntilNextHeart,
  nextStreak,
  regenerateHearts,
  visibleStreak,
} from '../src/logic/gamification';
import { suggestLevel } from '../src/logic/placement';

describe('hearts', () => {
  it('regenerates one heart every 30 minutes, up to the maximum', () => {
    expect(regenerateHearts(2, 0, HEART_REGEN_MS - 1).hearts).toBe(2);
    expect(regenerateHearts(2, 0, HEART_REGEN_MS).hearts).toBe(3);
    expect(regenerateHearts(2, 0, HEART_REGEN_MS * 2.5)).toEqual({ hearts: 4, since: HEART_REGEN_MS * 2 });
    expect(regenerateHearts(0, 0, HEART_REGEN_MS * 50).hearts).toBe(MAX_HEARTS);
  });
  it('reports time until the next heart', () => {
    expect(msUntilNextHeart(3, 0, 10 * 60 * 1000)).toBe(20 * 60 * 1000);
    expect(msUntilNextHeart(MAX_HEARTS, 0, 0)).toBe(0);
  });
});

describe('streak', () => {
  it('starts, continues, holds and resets', () => {
    expect(nextStreak(0, null, '2026-01-10')).toBe(1);
    expect(nextStreak(4, '2026-01-09', '2026-01-10')).toBe(5);
    expect(nextStreak(4, '2026-01-10', '2026-01-10')).toBe(4);
    expect(nextStreak(4, '2026-01-07', '2026-01-10')).toBe(1);
    expect(nextStreak(9, '2025-12-31', '2026-01-01')).toBe(10);
  });
  it('shows a broken streak as 0', () => {
    expect(visibleStreak(4, '2026-01-09', '2026-01-10')).toBe(4);
    expect(visibleStreak(4, '2026-01-08', '2026-01-10')).toBe(0);
  });
});

describe('xp and stars', () => {
  it('rewards correct answers and perfect lessons', () => {
    expect(lessonXp(8, 0)).toBe(23);
    expect(lessonXp(6, 2)).toBe(16);
    expect(lessonStars(0)).toBe(3);
    expect(lessonStars(2)).toBe(2);
    expect(lessonStars(5)).toBe(1);
  });
});

describe('placement', () => {
  const order = ['A1', 'A2', 'B1'];
  it('suggests the first level not mastered', () => {
    expect(
      suggestLevel(order, [
        { level: 'A1', correct: true },
        { level: 'A1', correct: true },
        { level: 'A2', correct: false },
        { level: 'A2', correct: false },
        { level: 'B1', correct: true },
      ]),
    ).toBe('A2');
  });
  it('suggests A1 when A1 is not mastered and the top level when all are', () => {
    expect(suggestLevel(order, [{ level: 'A1', correct: false }, { level: 'A1', correct: false }])).toBe('A1');
    expect(suggestLevel(order, order.map((level) => ({ level, correct: true })))).toBe('B1');
  });
});
