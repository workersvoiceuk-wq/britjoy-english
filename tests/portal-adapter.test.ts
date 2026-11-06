import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BRITJOY_PROGRESS_KEY, summarizeBritjoy } from '../src/shared/portal/portal-adapter.mjs';
import { buildPortalCatalog } from '../src/shared/portal/portal-catalog';
import { STORAGE_KEY } from '../src/store/useProgressStore';
import { CATALOG } from '../src/data/catalog';

// Storage double that fails the test on any write.
const readOnly = (data: Record<string, string>) => ({
  getItem: (k: string) => (k in data ? data[k] : null),
  setItem: () => { throw new Error('write'); },
  removeItem: () => { throw new Error('write'); },
});
const catalog = buildPortalCatalog();
const general = catalog.courses.find((c) => c.id === 'ingles-a1-c2')!;
const a1 = general.levels.find((l) => l.id === 'A1')!;

describe('portal adapter (read-only)', () => {
  it('reads the app\'s own progress key', () => {
    expect(BRITJOY_PROGRESS_KEY).toBe(STORAGE_KEY);
  });
  it('counts completed lessons per level, gives the next one, writes nothing', () => {
    const stored = { state: { placementDone: true, currentLevel: 'A1', levels: { A1: { completedLessons: { [a1.lessons[0]]: { stars: 3 } }, xp: 10 } } }, version: 3 };
    const s = summarizeBritjoy(readOnly({ [BRITJOY_PROGRESS_KEY]: JSON.stringify(stored) }), catalog);
    expect(s.basic.lessonsDone).toBe(1);
    expect(s.basic.nextLesson).toBe(a1.lessons[1]);
    expect(s.basic.levels.map((l) => l.id)).toEqual(['A1', 'A2']);
    expect(s.currentLevel).toBe('A1');
    expect(s.started).toBe(true);
  });
  it('a new learner or broken data shows zero progress', () => {
    expect(summarizeBritjoy(readOnly({}), catalog).basic.lessonsDone).toBe(0);
    expect(summarizeBritjoy(readOnly({ [BRITJOY_PROGRESS_KEY]: '{oops' }), catalog).started).toBe(false);
  });
  it('the catalogue mirrors the app (same course and lesson IDs) and has no answers', () => {
    expect(catalog.courses.map((c) => c.id)).toEqual(CATALOG.map((c) => c.id));
    const text = JSON.stringify(catalog);
    expect(text).not.toMatch(/"answer"|"options"|"explanation"/);
  });
  it('the demonstration stays in review: not playable, written explanation instead, no URL', () => {
    const s = summarizeBritjoy(readOnly({}), catalog);
    expect(s.demo?.status).not.toBe('ready');
    expect(s.demo?.playable).toBe(false);
    expect(s.demo?.alternative).toBe('written-explanation');
    expect(JSON.stringify(catalog)).not.toMatch(/https?:|\.mp4|\.webm/);
  });
  it('public/portal-catalog.json is up to date (npx vite-node scripts/build-portal-catalog.ts)', () => {
    const file = JSON.parse(readFileSync(new URL('../public/portal-catalog.json', import.meta.url), 'utf8'));
    expect(file).toEqual(JSON.parse(JSON.stringify(catalog)));
  });
  it('the adapter has no write or XP calls', () => {
    const src = readFileSync(new URL('../src/shared/portal/portal-adapter.mjs', import.meta.url), 'utf8');
    expect(src).not.toMatch(/setItem|removeItem|addXp|completeLesson/);
  });
});
