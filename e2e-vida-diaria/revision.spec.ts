import { expect, test } from '@playwright/test';
import { API, FakeBackend, USERS } from './fake-backend';

test('la muestra alterna escena y capítulo, con subtítulos y la práctica en inglés en la misma ruta', async ({ page }) => {
  await page.goto('/vida-diaria/?lang=en#/modulo/01-presentaciones');
  const media = page.locator('[data-vd-media]');
  const video = media.locator('video');
  await expect(video).toHaveAttribute('src', /presentaciones-flow\.mp4$/);
  await media.getByRole('button', { name: 'Chapter animation' }).click();
  await expect(video).toHaveAttribute('src', /presentaciones-capitulo\.mp4$/);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeGreaterThan(60);
  await expect(video.locator('track')).toHaveCount(2);
  await media.getByRole('button', { name: 'Short scene' }).click();
  await expect(video).toHaveAttribute('src', /presentaciones-flow\.mp4$/);

  await page.goto('/vida-diaria/?lang=en#/modulo/01-presentaciones/practica');
  await expect(page.getByRole('heading', { name: 'Chapter 1 · A new home in London' })).toBeVisible();
  await page.getByRole('button', { name: 'Español' }).click();
  await expect(page).toHaveURL(/\/vida-diaria\/#\/modulo\/01-presentaciones\/practica$/);
  await expect(page.getByRole('heading', { name: 'Capítulo 1 · Una casa nueva en Londres' })).toBeVisible();
});

test('el código por correo conserva la sesión de prueba y no concede acceso por sí solo', async ({ page }) => {
  const backend = new FakeBackend();
  await backend.install(page);
  const user = { ...USERS.a, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const requests: string[] = [];
  const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4174', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
  await page.route(`${API}/auth/v1/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ headers, status: 204 });
    const path = new URL(req.url()).pathname;
    const payload = req.postDataJSON();
    expect(payload.email).toBe(user.email);
    if (path.endsWith('/otp')) {
      requests.push('otp');
      return route.fulfill({ headers, json: {} });
    }
    expect(path).toBe('/auth/v1/verify');
    expect(payload.token).toBe('123456');
    requests.push('verify');
    return route.fulfill({ headers, json: { access_token: `token-${user.id}`, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user } });
  });
  await page.route(`${API}/rest/v1/profiles**`, (route) => route.fulfill({ headers, json: { plus_until: null, credits: 0 } }));

  await page.goto('/vida-diaria/#/acceso');
  const form = page.locator('[data-vd-access] form');
  await form.locator('input[type=email]').fill(user.email);
  await form.locator('button[type=submit]').click();
  await form.locator('input[autocomplete=one-time-code]').fill('123456');
  await form.locator('button[type=submit]').click();
  await expect(page.locator('[data-vd-access]')).toHaveAttribute('data-vd-access', 'none');
  expect(requests).toEqual(['otp', 'verify']);
  await page.reload();
  await expect(page.locator('[data-vd-access]')).toHaveAttribute('data-vd-access', 'none');
  await page.goto('/vida-diaria/#/modulo/02-compras/practica');
  await expect(page.locator('[data-vd-paywall]')).toHaveAttribute('data-vd-reason', 'no-access');
});

test('el progreso histórico no abre un reto con módulos sin acceso', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('britjoy-english-progress-v1', JSON.stringify({
    version: 1,
    state: { levels: { DIA: { completedLessons: Object.fromEntries(
      ['01-presentaciones', '02-compras', '03-transporte', '11-social'].map((id) => [`dia-${id}`, { xp: 10, stars: 1 }]),
    ) } } },
  })));
  let contentRequests = 0;
  await page.route(`${API}/functions/v1/vida-diaria`, (route) => {
    contentRequests++;
    return route.abort();
  });
  await page.goto('/vida-diaria/#/nivel/1/reto');
  await expect(page.locator('[data-vd-paywall]')).toHaveAttribute('data-vd-reason', 'signed-out');
  expect(contentRequests).toBe(0);
});
