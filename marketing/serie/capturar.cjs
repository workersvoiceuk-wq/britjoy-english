// Captures real app screens (iPhone-size, 3x) for the social media series.
// Usage: npm run build && npx vite preview --port 4173 &  then  node marketing/serie/capturar.cjs
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'capturas');
const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const base = (extra = {}) => ({ state: { uiLang: 'es', placementDone: true, voiceOn: false, soundOn: false, xp: 245, streak: 6, lastActiveDate: today, hearts: 5, heartsSince: Date.now(), dailyGoal: 20, xpByDay: { [today]: 14 }, learnerName: 'Ana García', ...extra }, version: 3 });
const strip = (w) => w.toLowerCase().replace(/[.,?!]/g, '');

async function solve(page, ex) {
  if (ex.type === 'explain') return page.getByRole('button', { name: 'Continuar' }).click();
  if (ex.type === 'multipleChoice' || ((ex.type === 'listening' || ex.type === 'fillBlank') && ex.options)) {
    await page.locator('main button.tile', { hasText: ex.answer }).first().click();
  } else if (ex.type === 'typing' || ex.type === 'listening') {
    await page.locator('main textarea').fill(ex.answer);
  } else if (ex.type === 'fillBlank') {
    await page.locator('main input').fill(ex.answer);
  } else if (ex.type === 'wordBank') {
    for (const tok of ex.answer.split(' ')) {
      const word = ex.words.find((w) => strip(w) === strip(tok));
      await page.locator('main div.justify-center button.tile:not([disabled])').filter({ hasText: word }).first().click();
    }
  } else if (ex.type === 'matching') {
    for (const p of ex.pairs) {
      await page.locator('main button.tile', { hasText: new RegExp(`^${p.en.replace(/[?]/g, '\\?')}$`) }).click();
      await page.locator('main button.tile', { hasText: new RegExp(`^${p.es.replace(/[?()]/g, '\\$&')}$`) }).click();
    }
  }
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
  const open = async (state) => {
    await page.goto('http://localhost:4173/');
    await page.evaluate((s) => localStorage.setItem('britjoy-english-progress-v1', JSON.stringify(s)), state);
    await page.reload();
    await page.waitForTimeout(600);
  };

  // E2: language picker + placement
  await page.goto('http://localhost:4173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(500);
  await page.getByRole('radio', { name: /Español/ }).click(); await page.waitForTimeout(200);
  await shot('idioma');
  await page.getByRole('button', { name: 'Continuar' }).click(); await page.waitForTimeout(400);
  await shot('bienvenida');
  await page.getByText('Hacer el test').click(); await page.waitForTimeout(300);
  await page.locator('button.tile').first().click();
  await shot('test-nivel');

  // E1 / E8: academy
  await open(base({ tab: 'home', levels: { TUR: { xp: 40, completedLessons: { 'tur-01-antes-de-viajar': { stars: 3, bestXp: 20, completedAt: 1 }, 'tur-02-aeropuerto': { stars: 2, bestXp: 20, completedAt: 1 } } } } }));
  await shot('academia');
  await page.getByText('Catálogo de cursos').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await shot('catalogo');
  await page.getByText('Descarga la app').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await shot('descargas');
  await page.getByRole('button', { name: /Inglés para turistas.*Ver curso/ }).click(); await page.waitForTimeout(400);
  await shot('curso-detalle');

  // E3: a lesson
  await open(base({ tab: 'english', currentLevel: 'A1' }));
  await shot('camino-a1');
  await page.getByRole('button', { name: /Hola \(disponible\)/ }).click(); await page.waitForTimeout(600);
  await page.locator('main button.tile', { hasText: 'Hello' }).first().click();
  await shot('ejercicio');
  await page.getByRole('button', { name: 'Comprobar' }).click(); await page.waitForTimeout(500);
  await shot('correcto');

  // E4: Vivir en UK
  await open(base({ tab: 'life' }));
  await shot('vivir-uk');
  await page.getByRole('button', { name: /Registrarte en un GP \(disponible\)/ }).click(); await page.waitForTimeout(600);
  await shot('gp');

  // E5: tourists — museum lesson
  const tur = ['tur-01-antes-de-viajar','tur-02-aeropuerto','tur-03-frontera','tur-04-al-hotel','tur-05-metro','tur-06-alojamiento','tur-07-restaurantes','tur-08-compras'];
  await open(base({ tab: 'english', currentLevel: 'TUR', levels: { TUR: { xp: 0, completedLessons: Object.fromEntries(tur.map((i) => [i, { stars: 3, bestXp: 20, completedAt: 1 }])) } } }));
  await shot('turistas');
  await page.getByRole('button', { name: /Entrar en un museo \(disponible\)/ }).click(); await page.waitForTimeout(600);
  await shot('museo-1');
  await page.getByRole('button', { name: 'Continuar' }).click(); await page.waitForTimeout(400);
  await shot('museo-2');

  // E6: Día a día
  await open(base({ tab: 'english', currentLevel: 'DIA' }));
  await shot('dia-a-dia');
  await page.getByRole('button', { name: /Hola, soy Ana \(disponible\)/ }).click(); await page.waitForTimeout(600);
  await shot('capitulo-1');

  // E7: speaking exercise (end of tourist lesson 1), progress panel, certificate
  await open(base({ tab: 'english', currentLevel: 'TUR', levels: {} }));
  await page.getByRole('button', { name: /Pasaporte y ETA \(disponible\)/ }).click(); await page.waitForTimeout(500);
  const lesson = require('../../src/data/courses/turistas/01-antes-de-viajar.json').lessons[0];
  for (const ex of lesson.exercises.slice(0, -1)) await solve(page, ex);
  await page.waitForTimeout(500);
  await shot('hablar');
  const ia = ['ia-01-patterns','ia-02-train','ia-03-neuron','ia-04-validation','ia-05-bias','ia-06-language','ia-07-modo-ia'];
  await open(base({ tab: 'home', levels: { IA: { xp: 160, completedLessons: Object.fromEntries(ia.map((i) => [i, { stars: 3, bestXp: 20, completedAt: 1 }])) } } }));
  await page.getByText('Meta diaria').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await shot('progreso');
  await page.getByRole('button', { name: /IA con Britjoy.*Ver curso/ }).click();
  await page.getByRole('button', { name: /Ver certificado/ }).click(); await page.waitForTimeout(400);
  await page.locator('#certificate').screenshot({ path: path.join(OUT, 'certificado.png') });

  // E8: AI mode
  await open(base({ tab: 'ai' }));
  await shot('modo-ia');
  await browser.close();
  console.log('ok', fs.readdirSync(OUT).length, 'capturas');
})();
