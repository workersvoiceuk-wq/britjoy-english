/**
 * Smart review (spaced repetition, Leitner boxes): the words and phrases of the
 * lessons a learner has completed come back just before they would be forgotten.
 * Strength 0–5; each correct answer moves an item up a box and waits longer.
 */
import type { Lesson } from '../types';

export interface ReviewItem {
  id: string;
  en: string;
  es: string;
}

export interface ReviewState {
  /** Box 0–5. */
  s: number;
  /** When it is due again (ms since epoch). */
  due: number;
}

const DAY = 24 * 60 * 60 * 1000;
/** Days to wait after reaching each box. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export const MAX_STRENGTH = INTERVAL_DAYS.length - 1;
/** New items introduced per session, so a review never feels endless. */
export const NEW_PER_SESSION = 8;
export const SESSION_SIZE = 12;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
export const itemId = (en: string) => norm(en).replace(/[^a-z0-9' ]/g, '').slice(0, 80);

/** Vocabulary of some lessons: phrases from explanations and matching pairs. */
export function vocabularyOf(lessons: Lesson[]): ReviewItem[] {
  const out = new Map<string, ReviewItem>();
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      const pairs = ex.type === 'explain' ? ex.phrases ?? [] : ex.type === 'matching' ? ex.pairs : [];
      for (const { en, es } of pairs) {
        if (!en?.trim() || !es?.trim() || en.length > 90) continue;
        const id = itemId(en);
        if (id && !out.has(id)) out.set(id, { id, en: en.trim(), es: es.trim() });
      }
    }
  }
  return [...out.values()];
}

export type Strength = 'weak' | 'medium' | 'strong';
export function strengthOf(state: ReviewState | undefined): Strength {
  const s = state?.s ?? 0;
  return s >= 4 ? 'strong' : s >= 2 ? 'medium' : 'weak';
}

/** Items to review now: those that are due, then a few new ones. */
export function dueItems(items: ReviewItem[], states: Record<string, ReviewState>, now: number): ReviewItem[] {
  const due = items.filter((i) => states[i.id] && states[i.id].due <= now).sort((a, b) => states[a.id].due - states[b.id].due);
  const fresh = items.filter((i) => !states[i.id]).slice(0, NEW_PER_SESSION);
  return [...due, ...fresh].slice(0, SESSION_SIZE);
}

/** New state after an answer. A wrong answer drops the item and brings it back today. */
export function grade(state: ReviewState | undefined, correct: boolean, now: number): ReviewState {
  const s = state?.s ?? 0;
  const next = correct ? Math.min(MAX_STRENGTH, s + 1) : Math.max(0, s - 2);
  return { s: next, due: now + (correct ? INTERVAL_DAYS[next] * DAY : 10 * 60 * 1000) };
}

/** A multiple-choice question: the Spanish meaning, and four English options. */
export function question(item: ReviewItem, pool: ReviewItem[], random: () => number = Math.random) {
  const others = pool.filter((p) => p.id !== item.id && norm(p.en) !== norm(item.en));
  const picked: string[] = [];
  while (picked.length < 3 && others.length > 0) {
    const [o] = others.splice(Math.floor(random() * others.length), 1);
    if (!picked.includes(o.en)) picked.push(o.en);
  }
  const options = [...picked, item.en];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { prompt: item.es, answer: item.en, options };
}
