import type { LevelId } from '../types';

const preExpansion = {
  A1: ['a1-u1-l1','a1-u1-l2','a1-u1-l3','a1-u1-l4','a1-u1-l5','a1-u2-l1','a1-u2-l2','a1-u2-l3','a1-u2-l4','a1-u2-l5'],
  A2: ['a2-u1-l1','a2-u1-l2'],
  B1: ['b1-u1-l1','b1-u1-l2'],
  B2: ['b2-u1-l1','b2-u1-l2'],
  C1: ['c1-u1-l1','c1-u1-l2'],
  C2: ['c2-u1-l1','c2-u1-l2'],
} as const;

type HistoricLevels = Record<string, { completedLessons?: Record<string, { completedAt?: number }> } | undefined>;

/** Snapshot eligibility once, before the new A2/B2 units can change a returning learner's progress. */
export function preserveEnglishCompletion(levels: HistoricLevels = {}) {
  const completed = Object.entries(preExpansion).filter(([level, ids]) =>
    ids.every((id) => Boolean(levels[level]?.completedLessons?.[id])));
  const timestamps = completed.flatMap(([level, ids]) => ids.map((id) => levels[level]?.completedLessons?.[id]?.completedAt))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  return {
    legacyEnglishLevels: completed.map(([level]) => level as LevelId),
    legacyEnglishCertificate: completed.length === Object.keys(preExpansion).length,
    legacyEnglishCertificateAt: timestamps.length ? Math.max(...timestamps) : null,
  };
}
