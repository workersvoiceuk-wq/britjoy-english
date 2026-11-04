import { describe, expect, it } from 'vitest';
import { LANGUAGES, MESSAGES, isRtl, translate } from '../src/i18n';
import { es } from '../src/i18n/es';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('interface languages', () => {
  it('offers 10 languages, each with every key translated', () => {
    expect(LANGUAGES).toHaveLength(10);
    for (const { code } of LANGUAGES) {
      const msgs = MESSAGES[code];
      expect(Object.keys(msgs).sort(), code).toEqual(Object.keys(es).sort());
      for (const [k, v] of Object.entries(msgs)) {
        expect(v.trim().length, `${code} ${k}`).toBeGreaterThan(0);
        expect(placeholders(v), `${code} ${k} placeholders`).toEqual(placeholders(es[k as keyof typeof es]));
      }
    }
  });

  it('translates with variables and marks Arabic and Urdu as right-to-left', () => {
    expect(translate('en', 'academy.lessons', { n: 5 })).toBe('5 lessons');
    expect(translate('es', 'academy.progress', { done: 2, total: 10, pct: 20 })).toBe('2/10 lecciones · 20%');
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('ur')).toBe(true);
    expect(isRtl('pl')).toBe(false);
  });
});
