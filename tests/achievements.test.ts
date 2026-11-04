import { describe, expect, it } from 'vitest';
import { achievements } from '../src/logic/achievements';

describe('achievements', () => {
  it('starts with nothing earned', () => {
    expect(achievements({ xp: 0, streak: 0, levels: {} }, 0).filter((a) => a.earned)).toHaveLength(0);
  });
  it('unlocks from real progress', () => {
    const earned = achievements(
      { xp: 120, streak: 3, levels: { A1: { completedLessons: { a: { stars: 3 }, b: { stars: 2 } } } } },
      0,
    )
      .filter((a) => a.earned)
      .map((a) => a.id);
    expect(earned).toEqual(['first-lesson', 'perfect', 'streak-3', 'xp-100']);
  });
});
