import { expect, test, type Page } from '@playwright/test';
import unit1 from '../src/data/courses/en-es/a1/unit-1.json' with { type: 'json' };

// Voice and sound off: tests must not depend on speech synthesis or audio.
async function start(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('britjoy-english-progress-v1')) {
      localStorage.setItem(
        'britjoy-english-progress-v1',
        JSON.stringify({ state: { voiceOn: false, soundOn: false }, version: 2 }),
      );
    }
  });
  await page.goto('/');
}

const strip = (w: string) => w.toLowerCase().replace(/[.,?!]/g, '');

test('first launch: placement can be skipped and the A1 path appears', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('heading', { name: 'Britjoy English' })).toBeVisible();
  await page.getByText('Empezar desde cero (A1)').click();
  await expect(page.getByText('Saludos y presentaciones')).toBeVisible();
  await expect(page.getByRole('button', { name: /Hola \(disponible\)/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /¿Cómo estás\? \(bloqueada\)/ })).toBeDisabled();
});

test('a full A1 lesson can be completed and progress is saved', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: /Hola \(disponible\)/ }).click();

  for (const ex of unit1.lessons[0].exercises as any[]) {
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
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.getByRole('status')).toContainText('¡Correcto!');
    await page.getByRole('button', { name: 'Continuar' }).click();
  }

  await expect(page.getByText('¡Lección completada!')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('button', { name: /Hola \(completada\)/ })).toBeVisible();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('britjoy-english-progress-v1')!));
  expect(saved.state.levels.A1.completedLessons['a1-u1-l1'].stars).toBe(3);
  expect(saved.state.xp).toBeGreaterThan(0);

  await page.reload();
  await expect(page.getByRole('button', { name: /Hola \(completada\)/ })).toBeVisible();
});

test('Vivir en UK: every topic is open and the share code video loads', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: /Vivir en UK/ }).click();
  for (const title of ['Pagar el viaje', 'Pedir cita con el GP', '¿Puedo pedirlo?', 'Descuentos', 'Share code para trabajar']) {
    await expect(page.getByRole('button', { name: new RegExp(`${title.replace(/[?¿]/g, '.')} \\(disponible\\)`) })).toBeEnabled();
  }
  await page.getByRole('button', { name: /Share code para trabajar \(disponible\)/ }).click();
  const duration = await page.locator('video').evaluate(
    (v: HTMLVideoElement) =>
      new Promise<number>((resolve) => (v.readyState >= 1 ? resolve(v.duration) : v.addEventListener('loadedmetadata', () => resolve(v.duration)))),
  );
  expect(duration).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Pasos 1 a 7: entrar en tu cuenta')).toBeVisible();
});

test('resources, settings and privacy policy', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: /Recursos/ }).click();
  await expect(page.getByText('British Council English Online')).toBeVisible();
  await expect(page.getByText('Busuu')).toBeVisible();
  await expect(page.getByText('British Council LearnEnglish')).toBeVisible();
  await page.getByRole('button', { name: /Ajustes/ }).click();
  await expect(page.getByText('Voz de Britjoy')).toBeVisible();
  const res = await page.request.get('/privacidad.html');
  expect(res.ok()).toBeTruthy();
  expect(await res.text()).toContain('No recogemos datos personales');
});

test('running out of hearts ends the lesson', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'britjoy-english-progress-v1',
      JSON.stringify({ state: { placementDone: true, hearts: 1, heartsSince: Date.now(), voiceOn: false, soundOn: false }, version: 2 }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Hola \(disponible\)/ }).click();
  await page.locator('main button.tile', { hasText: 'Goodbye' }).first().click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Sin vidas' })).toBeVisible();
});
