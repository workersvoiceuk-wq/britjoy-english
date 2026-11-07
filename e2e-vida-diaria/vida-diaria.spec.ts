import { expect, test, type Page } from '@playwright/test';
import sample from '../src/data/courses/dia-a-dia/01-presentaciones.json' with { type: 'json' };
import fs from 'node:fs';
import path from 'node:path';
import { FakeBackend, PREMIUM, USERS, signIn } from './fake-backend';

// Paid module 02 comes from the private package; without it the paid-content checks are skipped (and say so).
const compras = PREMIUM ? JSON.parse(fs.readFileSync(path.join(PREMIUM, 'modules/02-compras.json'), 'utf8')) : null;

// «Inglés para el día a día» (/vida-diaria/): muestra sin cuenta, respuestas (fallo → feedback por opción → pista →
// reintento → respuesta → repaso de fallos), progreso con los IDs de siempre, compra de prueba con eventos firmados,
// cancelación, caducidad, cuenta distinta y enlaces del catálogo general. Móvil 390 px y escritorio 1280 px.
const KEY = 'britjoy-english-progress-v1';
const strip = (w: string) => w.toLowerCase().replace(/[.,?!]/g, '');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tile = (page: Page, text: string) => page.locator('main button.tile', { hasText: new RegExp(`${esc(text)}$`) }).first();

async function seed(page: Page, levels: Record<string, unknown> = {}) {
  await page.addInitScript(([k, l]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(k as string, JSON.stringify({ state: { uiLang: 'es', voiceOn: false, soundOn: false, placementDone: true, levels: l }, version: 3 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, [KEY, levels] as const);
}

async function answer(page: Page, ex: any) {
  if (ex.type === 'multipleChoice' || ((ex.type === 'listening' || ex.type === 'fillBlank') && ex.options)) await tile(page, ex.answer).click();
  else if (ex.type === 'typing' || ex.type === 'listening' || ex.type === 'fillBlank') await page.locator('main textarea, main input').first().fill(ex.answer);
  else if (ex.type === 'wordBank') {
    for (const token of ex.answer.split(' ')) await page.locator('main').getByRole('button', { name: ex.words.find((w: string) => strip(w) === strip(token)), exact: true }).last().click();
  } else if (ex.type === 'matching') {
    for (const p of ex.pairs) {
      await page.locator('main button.tile', { hasText: new RegExp(`^${esc(p.en)}$`) }).click();
      await page.locator('main button.tile', { hasText: new RegExp(`^${esc(p.es)}$`) }).click();
    }
  }
}

async function noHorizontalScroll(page: Page) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(w);
}

test('muestra gratis sin cuenta: módulo 1 con vídeo, fallo → feedback y pista → reintento → repaso → progreso guardado', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page);
  await page.goto('/vida-diaria/');
  await expect(page.getByRole('heading', { name: 'Inglés para el día a día', level: 1 })).toBeVisible();
  await expect(page.locator('[data-vd-module]')).toHaveCount(12);
  await expect(page.locator('[data-vd-module="01-presentaciones"]')).toHaveAttribute('data-vd-state', 'sample');
  await expect(page.locator('[data-vd-state="locked"]')).toHaveCount(11);
  await expect(page.locator('[data-vd-access="signed-out"]')).toBeVisible();
  await expect(page.getByText('£19.99 al mes').first()).toBeVisible();
  await page.locator('[data-vd-guide] summary').click();
  await expect(page.locator('[data-vd-guide]')).toContainText('un ejercicio por pantalla');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'English for everyday life', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).click();
  await noHorizontalScroll(page);

  // Módulo de pago sin acceso: candado, sin contenido.
  await page.locator('[data-vd-module="02-compras"]').click();
  await expect(page.locator('[data-vd-paywall]')).toBeVisible();
  await expect(page.locator('[data-vd-media]')).toHaveCount(0);
  await page.goto('/vida-diaria/#/modulo/02-compras/practica');
  await expect(page.locator('[data-vd-paywall]')).toBeVisible();
  if (compras) await expect(page.getByText(compras.lessons[0].exercises[0].title as string)).toHaveCount(0);

  // Módulo 1: objetivo, vídeo con controles, subtítulos ES/EN y transcripción.
  await page.goto('/vida-diaria/#/modulo/01-presentaciones');
  await expect(page.locator('[data-vd-objective]')).toContainText(sample.lessons[0].tip);
  // The realistic Google Flow clip (vertical 720×1280) replaces the chapter animation.
  await expect(page.locator('[data-vd-media]')).toHaveAttribute('data-vd-media-source', 'flow');
  const video = page.locator('[data-vd-media] video');
  await expect(video).toHaveAttribute('src', /dia-01-presentaciones-flow\.mp4$/);
  const [dur, w, h] = await video.evaluate((v: HTMLVideoElement) => new Promise<number[]>((r) => { const go = () => r([v.duration, v.videoWidth, v.videoHeight]); return v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go); }));
  expect(dur).toBeGreaterThan(5);
  expect([w, h]).toEqual([720, 1280]);
  await expect(page.locator('[data-vd-media] track')).toHaveCount(2);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-vd-transcript] summary').click();
  await expect(page.locator('[data-vd-transcript] li').nth(1)).toContainText("Hi, I'm Ana. Nice to meet you.");
  await noHorizontalScroll(page);
  await page.getByRole('link', { name: /Empezar la práctica/ }).click();

  const exs = sample.lessons[0].exercises as any[];
  let missedOnce = false;
  for (const ex of exs) {
    if (ex.type === 'explain') { await page.getByRole('button', { name: 'Continuar' }).click(); continue; }
    if (ex.type === 'speak') { await page.getByRole('button', { name: 'Saltar este ejercicio' }).click(); continue; }
    if (ex.type === 'multipleChoice' && !missedOnce) {
      const wrong = ex.options.filter((o: string) => o !== ex.answer);
      await page.getByRole('button', { name: /Ver una pista/ }).click();
      await expect(page.locator('[data-vd-hint="1"]')).toBeVisible();
      await tile(page, wrong[0]).click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
      const fb = page.locator('[data-vd-feedback="retry"]');
      await expect(fb).toBeVisible();
      await expect(fb.locator('[data-vd-option-feedback]')).toContainText(wrong[0]);
      await expect(fb).not.toContainText(ex.answer);
      await page.locator('[data-vd-retry]').click();
      await expect(page.locator('[data-vd-hint="2"]')).toBeVisible();
      await expect(page.locator('[data-vd-hint="2"]')).not.toContainText(ex.answer);
      await tile(page, wrong[1]).click();
      await page.getByRole('button', { name: 'Comprobar' }).click();
      await expect(page.locator('[data-vd-feedback="answer"]')).toContainText(ex.answer);
      await expect(page.locator('[data-vd-feedback="answer"]')).toContainText('Lo repasarás al final');
      await page.getByRole('button', { name: 'Continuar' }).click();
      missedOnce = true;
      continue;
    }
    await answer(page, ex);
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('[data-vd-feedback="right"]')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  // Repaso de fallos: vuelve el ejercicio fallado.
  await expect(page.locator('[data-vd-review]')).toBeVisible();
  await answer(page, exs.find((e) => e.type === 'multipleChoice'));
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('[data-vd-feedback="right"]')).toBeVisible();
  await page.keyboard.press('Enter'); // teclado: Enter continúa
  await expect(page.locator('[data-vd-result]')).toContainText('¡Módulo completado!');
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(saved.state.levels.DIA.completedLessons['dia-01-presentaciones'].stars).toBeGreaterThanOrEqual(1);
  await page.reload();
  await page.goto('/vida-diaria/#/');
  await expect(page.locator('[data-vd-module="01-presentaciones"]')).toHaveAttribute('data-vd-state', 'completed');
  expect(backend.log).toEqual([]); // la muestra no necesita servidor ni pago
  // Acceso anónimo al contenido de pago: rechazado por la función (sin sesión → 401), y la web no tiene esos archivos.
  const anon = await page.evaluate(async () => {
    const r = await fetch('http://127.0.0.1:54399/functions/v1/vida-diaria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'module', module: '02-compras' }) });
    const v = await fetch('../videos/vida-diaria/dia-02-compras-flow.mp4');
    return [r.status, v.headers.get('content-type') ?? ''] as const;
  });
  expect(anon[0]).toBe(401);
  // Static hosting answers unknown paths with the HTML shell (SPA fallback); what matters is that no MP4 exists.
  expect(anon[1]).not.toContain('video/');
});

test('compra de prueba, cancelación, caducidad y cuenta distinta (servidor con eventos firmados)', async ({ page, browser }) => {
  test.skip(!compras, 'Necesita el paquete privado (VD_PREMIUM_DIR) con los módulos de pago.');
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page);
  await signIn(page, USERS.a);
  await page.goto('/vida-diaria/');
  await expect(page.locator('[data-vd-access="none"]')).toBeVisible();
  await page.getByRole('button', { name: /Suscribirme/ }).click();
  await expect(page).toHaveURL(/vida-diaria\/(\?pago=ok)?#?\/?$/);
  await expect(page.locator('[data-vd-access="active"]')).toBeVisible();
  expect(backend.log).toEqual([`invoice.paid ${USERS.a.id} active`, `customer.subscription.created ${USERS.a.id} active`]);
  expect(backend.sessionsCreated).toBe(1);
  await expect(page.locator('[data-vd-module="02-compras"]')).toHaveAttribute('data-vd-state', 'open');

  // Módulo de pago: vídeo servido por la función (memoria, no URL pública) y lección cargada del servidor.
  await page.locator('[data-vd-module="02-compras"]').click();
  await expect(page.locator('[data-vd-media="02-compras"]')).toHaveAttribute('data-vd-media-source', 'flow');
  const video = page.locator('[data-vd-media="02-compras"] video');
  await expect(video).toHaveAttribute('src', /^blob:/);
  const [dur, w, h] = await video.evaluate((v: HTMLVideoElement) => new Promise<number[]>((r) => { const go = () => r([v.duration, v.videoWidth, v.videoHeight]); return v.readyState >= 1 ? go() : v.addEventListener('loadedmetadata', go); }));
  expect(dur).toBeGreaterThan(5);
  expect([w, h]).toEqual([720, 1280]);
  await expect(page.locator('[data-vd-media="02-compras"] track')).toHaveCount(2);
  await page.getByRole('link', { name: /Empezar la práctica/ }).click();
  await expect(page.locator('[data-vd-practice="dia-02-compras"]')).toBeVisible();
  await expect(page.getByText((compras!.lessons[0].exercises[0] as { title: string }).title).first()).toBeVisible();

  // Cancelación al final del periodo: conserva el acceso hasta esa fecha.
  await page.goto('/vida-diaria/#/');
  const portal = page.waitForResponse((res) => res.url().endsWith('/functions/v1/vida-diaria') && res.request().postDataJSON()?.action === 'portal');
  await page.getByRole('button', { name: 'Gestionar o cancelar la suscripción' }).click();
  expect((await portal).ok()).toBe(true);
  expect(backend.portalCustomers).toEqual([`cus_e2e_${USERS.a.id}`]);
  const end = backend.row(USERS.a.id)!.access_until!;
  backend.now += 86_400;
  backend.deliver('customer.subscription.updated', USERS.a.id, { cancel: true, end: Math.floor(Date.parse(end) / 1000) });
  await page.goto('/vida-diaria/#/');
  await page.reload();
  await expect(page.locator('[data-vd-access="active"]')).toContainText('Has cancelado');
  await expect(page.locator('[data-vd-module="05-salud"]')).toHaveAttribute('data-vd-state', 'open');

  // Caducidad: pasado el periodo pagado, los módulos de pago se cierran y se puede volver a suscribir.
  backend.now = Math.floor(Date.parse(end) / 1000) + 60;
  await page.reload();
  await expect(page.locator('[data-vd-access="expired"]')).toContainText('Tu suscripción ha terminado');
  await expect(page.locator('[data-vd-module="05-salud"]')).toHaveAttribute('data-vd-state', 'locked');
  await page.goto('/vida-diaria/#/modulo/05-salud/practica');
  await expect(page.locator('[data-vd-paywall]')).toBeVisible();

  // Cuenta distinta mientras A vuelve a estar activa: B no ve nada de pago.
  backend.now = Math.floor(Date.now() / 1000);
  backend.deliver('invoice.paid', USERS.a.id, { end: backend.now + 30 * 86_400 });
  backend.deliver('customer.subscription.updated', USERS.a.id, { end: backend.now + 30 * 86_400 });
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const pb = await other.newPage();
  await backend.install(pb);
  await seed(pb);
  await signIn(pb, USERS.b);
  await pb.goto('/vida-diaria/');
  await expect(pb.locator('[data-vd-access="none"]')).toBeVisible();
  await expect(pb.locator('[data-vd-state="locked"]')).toHaveCount(11);
  await pb.goto('/vida-diaria/#/modulo/02-compras/practica');
  await expect(pb.locator('[data-vd-paywall]')).toBeVisible();
  await other.close();
  await page.goto('/vida-diaria/#/');
  await page.reload();
  await expect(page.locator('[data-vd-module="02-compras"]')).toHaveAttribute('data-vd-state', 'open');
});

test('catálogo general: ficha y enlace antiguo llevan al curso; el progreso anterior (IDs DIA) se conserva', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page, { DIA: { completedLessons: { 'dia-03-transporte': { stars: 3, bestXp: 15, completedAt: 1762000000000 } }, xp: 15 } });
  await page.goto('/?curso=dia-a-dia');
  await expect(page).toHaveURL(/\/vida-diaria\/$/);
  await expect(page.locator('[data-vd-module="03-transporte"]')).toHaveAttribute('data-vd-state', 'completed');
  await page.goto('/');
  await page.getByRole('button', { name: 'Cursos', exact: true }).click();
  await page.getByRole('button', { name: /Inglés para el día a día.*Ver curso/ }).click();
  await expect(page.getByRole('dialog')).toContainText('12 módulos');
  await expect(page.getByRole('dialog')).toContainText('Módulo 1 gratis · £19.99/mes');
  await page.getByRole('dialog').getByRole('button', { name: /(Empezar|Continuar) el curso/ }).click();
  await expect(page).toHaveURL(/\/vida-diaria\/$/);
  // Las demás fichas siguen abriendo la app general.
  await page.goto('/');
  await page.getByRole('button', { name: 'Cursos', exact: true }).click();
  await page.getByRole('button', { name: /IA con Britjoy.*Ver curso/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /(Empezar|Continuar) el curso/ }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4174\/$/);
});
