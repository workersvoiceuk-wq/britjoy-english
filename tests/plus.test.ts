import { describe, expect, it } from 'vitest';
import { isPlusActive, useAccount } from '../src/lib/backend';
import { PRICES, formatPrice, yearlySaving } from '../src/lib/plans';
import { useProgressStore } from '../src/store/useProgressStore';
import { MAX_HEARTS } from '../src/logic/gamification';

describe('Britjoy Plus', () => {
  it('is active only before its end date', () => {
    const now = Date.parse('2026-11-04T12:00:00Z');
    expect(isPlusActive(null, now)).toBe(false);
    expect(isPlusActive('2026-12-04T12:00:00Z', now)).toBe(true);
    expect(isPlusActive('2026-11-01T12:00:00Z', now)).toBe(false);
  });

  it('shows prices in the learner language and the yearly saving', () => {
    expect(formatPrice(4.99, 'en-GB', 'GBP')).toBe('£4.99');
    expect(formatPrice(4.99, 'es', 'GBP')).toMatch(/4,99/);
    expect(yearlySaving(4.99, 39.99)).toBe(33);
    expect(yearlySaving(5.99, 47.99)).toBe(33);
    expect(PRICES).toEqual({ plus_month: 5.99, plus_year: 47.99, credits_100: 2.99 });
    expect(yearlySaving(0, 10)).toBe(0);
    expect(PRICES.plus_year).toBeLessThan(PRICES.plus_month * 12);
  });

  it('gives unlimited hearts to Plus members only', () => {
    useProgressStore.setState({ hearts: MAX_HEARTS, heartsSince: Date.now() });
    useAccount.setState({ plusUntil: new Date(Date.now() + 86_400_000).toISOString() });
    useProgressStore.getState().loseHeart();
    expect(useProgressStore.getState().hearts).toBe(MAX_HEARTS);
    useAccount.setState({ plusUntil: null });
    useProgressStore.getState().loseHeart();
    expect(useProgressStore.getState().hearts).toBe(MAX_HEARTS - 1);
  });
});
