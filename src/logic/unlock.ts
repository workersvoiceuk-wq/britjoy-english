import type { LevelDefinition, LevelId, Unit } from '../types';

/** Share of the previous level's units that must be complete to unlock the next level. */
export const UNLOCK_THRESHOLD = 0.8;

export type CompletedLessons = Record<string, unknown>;

export function isUnitComplete(unit: Unit, completed: CompletedLessons): boolean {
  return unit.lessons.length > 0 && unit.lessons.every((lesson) => lesson.id in completed);
}

/** Fraction (0–1) of a level's units whose lessons are all complete. */
export function unitCompletionRatio(level: LevelDefinition, completed: CompletedLessons): number {
  if (level.units.length === 0) return 0;
  const done = level.units.filter((unit) => isUnitComplete(unit, completed)).length;
  return done / level.units.length;
}

/**
 * Level-unlocking rule:
 * - courses outside the A1–C2 ladder (Vivir en UK, día a día, turistas) are always unlocked;
 * - the first English level is always unlocked;
 * - any level at or below the placement-quiz result is unlocked;
 * - otherwise a level unlocks once at least 80% of the previous level's units are complete.
 */
export function isLevelUnlocked(
  levels: LevelDefinition[],
  levelId: LevelId,
  completedByLevel: Record<LevelId, CompletedLessons | undefined>,
  placementLevel?: LevelId | null,
): boolean {
  const target = levels.find((l) => l.id === levelId);
  // Courses outside the A1–C2 ladder (Vivir en UK, día a día, turistas) are always open.
  if (target && target.track !== 'english') return true;
  const english = levels.filter((l) => l.track === 'english');
  levels = english;
  const index = levels.findIndex((l) => l.id === levelId);
  if (index < 0) return false;
  if (index === 0) return true;
  if (placementLevel) {
    const placementIndex = levels.findIndex((l) => l.id === placementLevel);
    if (placementIndex >= index) return true;
  }
  const previous = levels[index - 1];
  return unitCompletionRatio(previous, completedByLevel[previous.id] ?? {}) >= UNLOCK_THRESHOLD;
}

/**
 * Lessons inside a level are played in order: a lesson is available when every
 * lesson before it (across all units of the level) is complete. Completed lessons
 * stay available for practice.
 */
export function isLessonUnlocked(level: LevelDefinition, lessonId: string, completed: CompletedLessons): boolean {
  // Survival topics (UK and Spain) are needed on demand (e.g. Council Tax today), so they are all open.
  if (level.track === 'life' || level.track === 'spain' || level.track === 'colombia') return level.units.some((u) => u.lessons.some((l) => l.id === lessonId));
  const ordered = level.units.flatMap((u) => u.lessons);
  const index = ordered.findIndex((l) => l.id === lessonId);
  if (index < 0) return false;
  return ordered.slice(0, index).every((l) => l.id in completed);
}

/** The first lesson in the level that has not been completed yet (or null when all are done). */
export function nextLessonId(level: LevelDefinition, completed: CompletedLessons): string | null {
  const next = level.units.flatMap((u) => u.lessons).find((l) => !(l.id in completed));
  return next ? next.id : null;
}
