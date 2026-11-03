import type { LevelId } from '../types';

export interface PlacementAnswer {
  level: LevelId;
  correct: boolean;
}

/**
 * Suggests a starting level. Levels are walked in order; a level counts as
 * mastered when at least half of its questions were answered correctly. The
 * suggestion is the first level that is not mastered (or the last level).
 */
export function suggestLevel(levelOrder: LevelId[], answers: PlacementAnswer[]): LevelId {
  for (const level of levelOrder) {
    const forLevel = answers.filter((a) => a.level === level);
    if (forLevel.length === 0) continue;
    const right = forLevel.filter((a) => a.correct).length;
    if (right * 2 < forLevel.length) return level;
  }
  return levelOrder[levelOrder.length - 1];
}
