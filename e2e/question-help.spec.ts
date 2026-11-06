import { expect, test } from '@playwright/test';
import unit1 from '../src/data/courses/en-es/a1/unit-1.json' with { type: 'json' };

// Practice first (review of PR2): a question's explanation can contain its answer, so on exercises it is
// offered only after «Comprobar». Opening it writes nothing (no XP, no lesson completion), and no
// <video> is shown while every concept is still a draft.
const strip = (w: string) => w.toLowerCase().replace(/[.,?!]/g, '');
const KEY = 'britjoy-english-progress-v1';

test('exercise explanation only after checking; opening it writes nothing', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('britjoy-english-progress-v1'))
      localStorage.setItem('britjoy-english-progress-v1', JSON.stringify({ state: { uiLang: 'es', voiceOn: false, soundOn: false }, version: 3 }));
  });
  await page.goto('/');
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: /Hola \(disponible\)/ }).click();
  const help = page.locator('[data-question-video-help] button.qvh-trigger:visible');
  let offeredAfter = 0;
  for (const ex of unit1.lessons[0].exercises as any[]) {
    const explain = ex.type === 'explain' || ex.type === 'dialogue';
    // Exactly one exercise on screen (PR2 left stale exercises: ExerciseView and the help shared one React key).
    const tiles = ex.options?.length ?? (ex.type === 'matching' ? ex.pairs.length * 2 : ex.type === 'wordBank' ? ex.words.length : null);
    if (tiles !== null) await expect(page.locator('main button.tile'), `only the current ${ex.type} exercise is on screen`).toHaveCount(tiles);
    if (!explain) await expect(help, `before checking a ${ex.type} exercise`).toHaveCount(0);
    if (ex.type === 'multipleChoice' || (ex.type === 'listening' && ex.options)) {
      await page.locator('main button.tile', { hasText: ex.answer }).first().click();
    } else if (ex.type === 'typing' || ex.type === 'listening') {
      await page.locator('main textarea').fill(ex.answer);
    } else if (ex.type === 'wordBank') {
      for (const token of ex.answer.split(' ')) {
        const word = ex.words.find((w: string) => strip(w) === strip(token));
        await page.locator('main div.justify-center button.tile:not([disabled])').filter({ hasText: word }).first().click();
      }
    } else if (ex.type === 'matching') {
      for (const p of ex.pairs) {
        await page.locator('main button.tile', { hasText: new RegExp(`^${p.en}$`) }).click();
        await page.locator('main button.tile', { hasText: new RegExp(`^${p.es}$`) }).click();
      }
    }
    if (!explain) {
      await page.getByRole('button', { name: 'Comprobar' }).click();
      await expect(page.getByRole('status')).toContainText('¡Correcto!');
      if (await help.count()) {
        offeredAfter++;
        const before = await page.evaluate((k) => localStorage.getItem(k), KEY);
        await help.first().click();
        await expect(page.locator('.qvh-panel:visible')).toHaveCount(1);
        await expect(page.locator('.qvh-panel video')).toHaveCount(0);
        expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(before);
      }
    }
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  expect(offeredAfter).toBeGreaterThan(0);
});
