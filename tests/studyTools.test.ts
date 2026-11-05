import { describe, expect, it } from 'vitest';
import { INTERVAL_DAYS, NEW_PER_SESSION, dueItems, grade, question, strengthOf, vocabularyOf } from '../src/logic/review';
import { estimateFinish, weekStatus, type StudyPlan } from '../src/logic/plan';
import { LEVELS } from '../src/data/courses/en-es';

const DAY = 86_400_000;
const now = Date.parse('2026-11-05T12:00:00');

describe('smart review', () => {
  const lessons = LEVELS[0].units[0].lessons;
  const vocab = vocabularyOf(lessons);

  it('collects unique words and phrases from completed lessons', () => {
    expect(vocab.length).toBeGreaterThan(5);
    expect(new Set(vocab.map((v) => v.id)).size).toBe(vocab.length);
    for (const v of vocab) expect(v.en && v.es).toBeTruthy();
  });

  it('spaces repetitions: right answers wait longer, wrong ones come back today', () => {
    let s = grade(undefined, true, now);
    expect(s).toEqual({ s: 1, due: now + INTERVAL_DAYS[1] * DAY });
    s = grade(s, true, now);
    expect(s.s).toBe(2);
    expect(strengthOf(s)).toBe('medium');
    const wrong = grade({ s: 4, due: now }, false, now);
    expect(wrong.s).toBe(2);
    expect(wrong.due - now).toBeLessThan(DAY);
  });

  it('serves due items first and only a few new ones per session', () => {
    const states = { [vocab[3].id]: { s: 2, due: now - 1 } };
    const due = dueItems(vocab, states, now);
    expect(due[0].id).toBe(vocab[3].id);
    expect(due.length).toBeLessThanOrEqual(NEW_PER_SESSION + 1);
    const later = { [vocab[3].id]: { s: 2, due: now + DAY } };
    expect(dueItems(vocab, later, now).some((i) => i.id === vocab[3].id)).toBe(false);
  });

  it('builds a question with the right answer among four different options', () => {
    const q = question(vocab[0], vocab, () => 0.3);
    expect(q.options).toContain(vocab[0].en);
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(q.options.length).toBe(Math.min(4, vocab.length));
  });
});

describe('study plan', () => {
  const plan: StudyPlan = { goal: 'life', days: [0, 2, 4], minutes: 15, createdAt: now };

  it('marks planned and studied days of this week, Monday first', () => {
    const week = weekStatus(plan, { '2026-11-03': 12 }, now); // Tuesday studied; 5 Nov 2026 is a Thursday
    expect(week).toHaveLength(7);
    expect(week[0].planned).toBe(true);
    expect(week[1].studied).toBe(true);
    expect(week[3].isToday).toBe(true);
  });

  it('estimates the finishing date from minutes a week', () => {
    // 9 lessons × 5 min = 45 min; 3 days × 15 min = 45 min a week → one week
    expect(estimateFinish(plan, 9, now)?.getTime()).toBe(now + 7 * DAY);
    expect(estimateFinish(plan, 0, now)).toBeNull();
  });
});
