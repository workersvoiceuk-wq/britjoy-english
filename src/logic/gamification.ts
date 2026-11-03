export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 30 * 60 * 1000;

export const XP_PER_LESSON = 10;
export const XP_PER_CORRECT = 1;
export const XP_PERFECT_BONUS = 5;

/**
 * Applies time-based heart regeneration.
 * `since` is the time from which the next heart is being counted.
 */
export function regenerateHearts(hearts: number, since: number, now: number): { hearts: number; since: number } {
  if (hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, since: now };
  const elapsed = Math.max(0, now - since);
  const gained = Math.floor(elapsed / HEART_REGEN_MS);
  if (gained === 0) return { hearts, since };
  const total = Math.min(MAX_HEARTS, hearts + gained);
  return { hearts: total, since: total >= MAX_HEARTS ? now : since + gained * HEART_REGEN_MS };
}

/** Milliseconds until the next heart, or 0 when full. */
export function msUntilNextHeart(hearts: number, since: number, now: number): number {
  if (hearts >= MAX_HEARTS) return 0;
  return Math.max(0, HEART_REGEN_MS - (now - since));
}

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayDiff(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Streak after practising today. */
export function nextStreak(streak: number, lastActiveDate: string | null, today: string): number {
  if (!lastActiveDate) return 1;
  const diff = dayDiff(lastActiveDate, today);
  if (diff <= 0) return Math.max(1, streak);
  if (diff === 1) return streak + 1;
  return 1;
}

/** Streak to display: it is broken if the last practice was before yesterday. */
export function visibleStreak(streak: number, lastActiveDate: string | null, today: string): number {
  if (!lastActiveDate) return 0;
  return dayDiff(lastActiveDate, today) <= 1 ? streak : 0;
}

export function lessonXp(correctCount: number, mistakes: number): number {
  return XP_PER_LESSON + correctCount * XP_PER_CORRECT + (mistakes === 0 ? XP_PERFECT_BONUS : 0);
}

export function lessonStars(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}
