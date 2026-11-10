// Closing-challenge status of «Inglés para el día a día». Kept apart from the shared progress store on purpose: the
// store's DIA level counts only the 12 lesson IDs (dia-01-presentaciones … dia-12-opiniones), and "1 of 12" must stay
// exact. This file only records which level challenges were passed, on this device.
import type { LevelNo } from './levels';

export const CHALLENGES_KEY = 'vd-retos-v1';

type Store = Partial<Record<LevelNo, string>>;

function read(): Store {
  try {
    const raw = window.localStorage.getItem(CHALLENGES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

export const challengeDone = (no: LevelNo): boolean => typeof read()[no] === 'string';

export function markChallengeDone(no: LevelNo, now = new Date()): void {
  try {
    window.localStorage.setItem(CHALLENGES_KEY, JSON.stringify({ ...read(), [no]: now.toISOString() }));
  } catch {
    /* storage unavailable (private mode): the challenge still counts for this visit */
  }
}
