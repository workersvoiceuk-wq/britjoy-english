import { expect, test, type Page } from '@playwright/test';
import sample from '../src/data/courses/dia-a-dia/01-presentaciones.json' with { type: 'json' };
import fs from 'node:fs';
import path from 'node:path';
import { FakeBackend, PREMIUM, USERS, signIn } from './fake-backend';

// «Inglés para el día a día» · tres niveles, motivo real del bloqueo, siguiente paso, reintento sin revelar la
// respuesta y ES/EN. Mismo servidor de prueba y mismas claves que vida-diaria.spec.ts: móvil 390 px y escritorio 1280 px.
// El estado de la captura: Presentaciones completado (1 de 12, 8 %) y el resto «sin acceso».
const KEY = 'britjoy-english-progress-v1';
const compras = PREMIUM ? JSON.parse(fs.readFileSync(path.join(PREMIUM, 'modules/02-compras.json'), 'utf8')) : null;
const DONE = { DIA: { completedLessons: { 'dia-01-presentaciones': { stars: 3, bestXp: 15, completedAt: 1762000000000 } }, xp: 15 } };

async function seed(page: Page, levels: Record<string, unknown> = {}, uiLang = 'es') {
  await page.addInitScript(([k, l, ui]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(k as string, JSON.stringify({ state: { uiLang: ui, voiceOn: false, soundOn: false, placementDone: true, levels: l }, version: 3 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, [KEY, levels, uiLang] as const);
}

async function noHorizontalScroll(page: Page) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(w);
}

test('visitante con Presentaciones completado: 1 de 12, tres niveles y el motivo real del bloqueo', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page, DONE);
  await page.goto('/vida-diaria/');
  await expect(page.getByText('1 de 12 módulos completados').first()).toBeVisible();
  await expect(page.getByText('8%').first()).toBeVisible();
  await expect(page.locator('[data-vd-level]')).toHaveCount(3);
  await expect(page.locator('[data-vd-module]')).toHaveCount(12);
  // Cada nivel: objetivo, avance propio y reto de cierre.
  for (const n of [1, 2, 3]) {
    const level = page.locator(`[data-vd-level="${n}"]`);
    await expect(level.locator('[data-vd-level-goal]')).not.toBeEmpty();
    await expect(level.locator(`[data-vd-level-progress="${n}"]`)).toHaveAttribute('aria-valuemax', '4');
    await expect(level.locator('[data-vd-module]')).toHaveCount(4);
    await expect(level.locator(`[data-vd-challenge="${n}"]`)).toHaveAttribute('data-vd-challenge-state', 'locked');
  }
  await expect(page.locator('[data-vd-level-progress="1"]')).toHaveAttribute('aria-valuenow', '1');
  await expect(page.locator('[data-vd-level-progress="2"]')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('[data-vd-module="01-presentaciones"]')).toHaveAttribute('data-vd-state', 'completed');
  await expect(page.locator('[data-vd-level="1"]')).toHaveAttribute('data-vd-level-state', 'current');

  // Compras no está «Unavailable»: dice por qué (sesión requerida) y Continuar muestra el mismo motivo.
  await expect(page.locator('[data-vd-module="02-compras"]')).toHaveAttribute('data-vd-reason', 'signed-out');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Requiere sesión');
  await expect(page.locator('[data-vd-level="1"] [data-vd-continue="blocked"]')).toHaveAttribute('data-vd-reason', 'signed-out');
  await expect(page.locator('[data-vd-level="1"] [data-vd-continue="blocked"]')).toContainText('iniciar sesión');
  await expect(page.locator('[data-vd-level="1"] [data-vd-continue="blocked"] a')).toHaveAttribute('href', '#/acceso');
  await noHorizontalScroll(page);

  // Enlace directo sin sesión: ni la práctica ni los medios.
  await page.goto('/vida-diaria/#/modulo/02-compras/practica');
  await expect(page.locator('[data-vd-paywall]')).toHaveAttribute('data-vd-reason', 'signed-out');
  await expect(page.locator('[data-vd-practice]')).toHaveCount(0);
  await page.goto('/vida-diaria/#/modulo/02-compras');
  await expect(page.locator('[data-vd-paywall]')).toBeVisible();
  await expect(page.locator('[data-vd-media]')).toHaveCount(0);
  await page.goto('/vida-diaria/#/nivel/1/reto');
  await expect(page.locator('[data-vd-challenge-page="1"]')).toContainText('Se abre al completar');
  expect(backend.log).toEqual([]);

  // El paso a «Cómo acceder» lleva al panel de acceso, donde está el inicio de sesión por email.
  await page.goto('/vida-diaria/#/acceso');
  await expect(page.locator('[data-vd-access="signed-out"]')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  // No hay botón de ChatGPT: el único acceso de este curso es el código por email.
  await expect(page.getByText(/ChatGPT/i)).toHaveCount(0);
});

test('ES/EN: títulos, objetivos, estados y botones cambian; el progreso y los IDs no', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page, DONE);
  await page.goto('/vida-diaria/');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Compras');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Shopping');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Ask prices, find products and ask for a refund.');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Sign-in required');
  await expect(page.locator('[data-vd-module="01-presentaciones"]')).toContainText('Completed');
  await expect(page.getByText('1 of 12 modules completed').first()).toBeVisible();
  await expect(page.locator('[data-vd-level="1"]')).toContainText('First steps');
  await expect(page.locator('[data-vd-level="3"]')).toContainText('Conversations with more independence');
  await expect(page.locator('[data-vd-level="1"] [data-vd-continue="blocked"]')).toContainText('sign in');
  await expect(page.locator('[data-vd-challenge="1"]')).toContainText('Closing challenge');
  await noHorizontalScroll(page);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Requiere sesión');
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY);
  expect(Object.keys(saved.state.levels.DIA.completedLessons)).toEqual(['dia-01-presentaciones']);
});

test('un fallo marca solo la opción elegida en rojo, no revela la correcta y permite reintentar; luego verde y avanzar', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page);
  await page.goto('/vida-diaria/#/modulo/01-presentaciones/practica');
  const exs = (sample as { lessons: Array<{ exercises: any[] }> }).lessons[0].exercises;
  const idx = exs.findIndex((e) => e.type === 'multipleChoice');
  for (let i = 0; i < idx; i++) {
    if (exs[i].type !== 'explain' && exs[i].type !== 'dialogue') throw new Error('se esperaban solo pantallas de explicación antes del primer ejercicio de elección');
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  const ex = exs[idx];
  const wrong = ex.options.find((o: string) => o !== ex.answer) as string;
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tile = (text: string) => page.locator('main button.tile', { hasText: new RegExp(`${esc(text)}$`) }).first();
  await tile(wrong).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('[data-vd-feedback="retry"]')).toBeVisible();
  await expect(page.locator('main .tile-wrong')).toHaveCount(1); // rojo: la elegida
  await expect(page.locator('main .tile-correct')).toHaveCount(0); // la correcta sigue sin revelarse
  await expect(page.locator('[data-vd-feedback="retry"]')).not.toContainText(ex.answer);
  await page.locator('[data-vd-retry]').click();
  await expect(page.locator('main .tile-wrong')).toHaveCount(0);
  await tile(ex.answer).click();
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('[data-vd-feedback="right"]')).toContainText('¡Correcto!');
  await expect(page.locator('main .tile-correct')).toHaveCount(1); // verde, con texto de confirmación
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('nivel 1 muestra las frases guía abiertas en la práctica (frases guiadas)', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page);
  await page.goto('/vida-diaria/#/modulo/01-presentaciones/practica');
  const exs = (sample as { lessons: Array<{ exercises: any[] }> }).lessons[0].exercises;
  const idx = exs.findIndex((e) => e.type !== 'explain' && e.type !== 'dialogue');
  for (let i = 0; i < idx; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  const guide = page.locator('[data-vd-guide-phrases="1"]');
  await expect(guide).toHaveAttribute('open', '');
  await expect(guide).toContainText('Frases guía');
  await expect(page.locator('[data-vd-context]')).toHaveCount(0);
});

test('cuenta de prueba con acceso: Compras se abre y Continuar lleva a ella', async ({ page }) => {
  test.skip(!compras, 'Necesita el paquete privado (VD_PREMIUM_DIR) con los módulos de pago.');
  const backend = new FakeBackend();
  await backend.install(page);
  await seed(page, DONE);
  await signIn(page, USERS.a);
  backend.subscribe(USERS.a.id);
  await page.goto('/vida-diaria/');
  await expect(page.locator('[data-vd-access="active"]')).toBeVisible();
  await expect(page.locator('[data-vd-module="02-compras"]')).toHaveAttribute('data-vd-state', 'open');
  await expect(page.locator('[data-vd-module="02-compras"]')).toContainText('Incluido');
  const next = page.locator('[data-vd-level="1"] [data-vd-continue="module"]');
  await expect(next).toHaveAttribute('data-vd-continue-target', '02-compras');
  await expect(next).toContainText('Continuar: Compras');
  await next.click();
  await expect(page).toHaveURL(/#\/modulo\/02-compras$/);
  await page.getByRole('link', { name: /Empezar la práctica/ }).click();
  await expect(page.locator('[data-vd-practice="dia-02-compras"]')).toBeVisible();
  // Nivel 2: con situación visible y sin frases abiertas.
  await page.goto('/vida-diaria/#/modulo/04-vivienda/practica');
  const exs = (JSON.parse(fs.readFileSync(path.join(PREMIUM!, 'modules/04-vivienda.json'), 'utf8')).lessons[0].exercises) as Array<{ type: string }>;
  const idx = exs.findIndex((e) => e.type !== 'explain' && e.type !== 'dialogue');
  for (let i = 0; i < idx; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.locator('[data-vd-context]')).toBeVisible();
  await expect(page.locator('[data-vd-guide-phrases="2"]')).not.toHaveAttribute('open', '');
});
