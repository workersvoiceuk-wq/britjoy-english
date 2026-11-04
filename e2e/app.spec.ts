import { expect, test, type Page } from '@playwright/test';
import unit1 from '../src/data/courses/en-es/a1/unit-1.json' with { type: 'json' };

// Voice and sound off: tests must not depend on speech synthesis or audio.
async function start(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('britjoy-english-progress-v1')) {
      localStorage.setItem(
        'britjoy-english-progress-v1',
        JSON.stringify({ state: { uiLang: 'es', voiceOn: false, soundOn: false }, version: 3 }),
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
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await page.getByRole('button', { name: /Recursos recomendados/ }).click();
  await expect(page.getByText('British Council English Online')).toBeVisible();
  await expect(page.getByText('Busuu')).toBeVisible();
  await expect(page.getByText('British Council LearnEnglish')).toBeVisible();
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await expect(page.getByText('Voz de Britjoy')).toBeVisible();
  const res = await page.request.get('/privacidad.html');
  expect(res.ok()).toBeTruthy();
  expect(await res.text()).toContain('Tu progreso de aprendizaje se guarda solo en tu dispositivo');
});

test('running out of hearts ends the lesson', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'britjoy-english-progress-v1',
      JSON.stringify({ state: { placementDone: true, tab: 'english', hearts: 1, heartsSince: Date.now(), voiceOn: false, soundOn: false }, version: 2 }),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Hola \(disponible\)/ }).click();
  await page.locator('main button.tile', { hasText: 'Goodbye' }).first().click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Sin vidas' })).toBeVisible();
});

test('Modo IA tab explains it is not activated until the server is configured', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: /Modo IA/ }).click();
  await expect(page.getByText('El Modo IA todavía no está activado')).toBeVisible();
});

test('academy catalogue lists the courses and opens a course from its detail page', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: 'Cursos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo de cursos' })).toBeVisible();
  for (const title of ['Inglés general', 'Inglés para el día a día', 'Inglés para turistas', 'Vivir en el Reino Unido', 'IA con Britjoy']) {
    await expect(page.getByRole('button', { name: new RegExp(`${title}.*Ver curso`) })).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Inteligencia artificial' }).click();
  await expect(page.getByRole('button', { name: /Inglés para turistas.*Ver curso/ })).toHaveCount(0);
  await page.getByRole('button', { name: /IA con Britjoy.*Ver curso/ }).click();
  await expect(page.getByRole('heading', { name: 'Temario' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar el curso' }).click();
  await expect(page.getByRole('button', { name: /De ejemplos a patrones \(disponible\)/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Descargar para Android/ })).toHaveCount(0);
});

test('first launch asks which language you speak and switches the interface (RTL for Arabic)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('radiogroup')).toBeVisible();
  await page.getByRole('radio', { name: /English/ }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByText('Start from scratch (A1)').click();
  await expect(page.getByRole('button', { name: 'Courses', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('radio', { name: /العربية/ }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name: 'الدورات', exact: true })).toBeVisible();
});

test('Britjoy Plus: compares Free and Plus, shows prices and waits for the backend', async ({ page }) => {
  await start(page);
  await page.getByText('Empezar desde cero (A1)').click();
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await page.getByRole('button', { name: /Britjoy Plus y tu cuenta/ }).click();
  await expect(page.getByRole('heading', { name: /Britjoy Plus/ }).first()).toBeVisible();
  await expect(page.getByText('Vidas ilimitadas', { exact: true })).toBeVisible();
  await expect(page.getByText(/5,99\s£ al mes/)).toBeVisible();
  await expect(page.getByText(/Ahorra 33\s?%/)).toBeVisible();
  await expect(page.getByText('Los pagos todavía no están activados. ¡Muy pronto!')).toBeVisible();
  await expect(page.getByText('Las cuentas todavía no están activadas. ¡Muy pronto!')).toBeVisible();
  for (const button of await page.getByRole('button', { name: 'Elegir' }).all()) await expect(button).toBeDisabled();
});
