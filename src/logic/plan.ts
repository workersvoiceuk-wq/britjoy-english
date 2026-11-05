/**
 * Study plan: a goal, the days of the week and minutes a day the learner commits
 * to, this week's progress and an estimated date to finish the current level.
 */
import { toDateKey } from './gamification';

export type PlanGoal = 'life' | 'work' | 'travel' | 'exam';
export interface StudyPlan {
  goal: PlanGoal;
  /** Days of the week, 0 = Monday … 6 = Sunday. */
  days: number[];
  minutes: number;
  createdAt: number;
}

/** A short lesson takes about this long. */
export const MINUTES_PER_LESSON = 5;

const DAY = 24 * 60 * 60 * 1000;
/** Monday-first weekday (0 = Monday). */
export const weekday = (d: Date) => (d.getDay() + 6) % 7;

/** This week, Monday to Sunday: planned and studied days. */
export function weekStatus(plan: StudyPlan | null, xpByDay: Record<string, number>, now: number) {
  const today = new Date(now);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weekday(today));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = toDateKey(date);
    return {
      date,
      planned: plan ? plan.days.includes(i) : false,
      studied: (xpByDay[key] ?? 0) > 0,
      isToday: key === toDateKey(today),
    };
  });
}

/** Estimated finishing date for the lessons left, following the plan. */
export function estimateFinish(plan: StudyPlan, lessonsLeft: number, now: number): Date | null {
  if (lessonsLeft <= 0) return null;
  const perWeek = Math.max(1, plan.days.length) * plan.minutes;
  const weeks = (lessonsLeft * MINUTES_PER_LESSON) / perWeek;
  return new Date(now + Math.ceil(weeks * 7) * DAY);
}
