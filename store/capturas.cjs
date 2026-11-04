// Generates store screenshots from the real app (production build on http://localhost:4173).
// Usage: npm run build && npx vite preview --port 4173 &  then  node store/capturas.cjs
const { chromium } = require('@playwright/test');
const path = require('path');

const SIZES = {
  ios: { width: 440, height: 956, deviceScaleFactor: 3 },     // 1320 x 2868 (iPhone 6.9")
  android: { width: 360, height: 640, deviceScaleFactor: 3 }, // 1080 x 1920 (phone)
};

const seed = (extra = {}) => ({
  state: { placementDone: true, voiceOn: false, soundOn: false, xp: 245, streak: 6, lastActiveDate: new Date().toISOString().slice(0, 10), hearts: 5, heartsSince: Date.now(), ...extra },
  version: 2,
});

(async () => {
  const browser = await chromium.launch();
  for (const [store, vp] of Object.entries(SIZES)) {
    const out = (n) => path.join(__dirname, 'screenshots', store, n);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: true, hasTouch: true });
    const open = async (state) => {
      await page.goto('http://localhost:4173/');
      await page.evaluate((s) => localStorage.setItem('britjoy-english-progress-v1', JSON.stringify(s)), state);
      await page.reload();
      await page.waitForTimeout(500);
    };

    // 1. Welcome
    await page.goto('http://localhost:4173/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
    await page.screenshot({ path: out('1-bienvenida.png') });

    // 2. English path with progress
    await open(seed({ levels: { A1: { xp: 120, completedLessons: { 'a1-u1-l1': { stars: 3, bestXp: 23, completedAt: 1 }, 'a1-u1-l2': { stars: 2, bestXp: 18, completedAt: 1 } } } } }));
    await page.screenshot({ path: out('2-camino-ingles.png') });

    // 3. A lesson exercise with Britjoy
    await page.getByRole('button', { name: /Me llamo… \(disponible\)/ }).click();
    await page.waitForTimeout(600);
    await page.locator('main button.tile', { hasText: 'My name is Ana' }).click();
    await page.screenshot({ path: out('3-leccion.png') });
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: out('4-correccion.png') });

    // 5. Vivir en UK path
    await open(seed({ tab: 'life' }));
    await page.screenshot({ path: out('5-vivir-en-uk.png') });

    // 6. Share code lesson (Britjoy explains + video)
    await page.getByRole('button', { name: /Share code para trabajar \(disponible\)/ }).click();
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: out('6-share-code.png') });

    // 7. Resources
    await open(seed({ tab: 'resources' }));
    await page.screenshot({ path: out('7-recursos.png') });
    await page.close();
  }
  await browser.close();
  console.log('ok');
})();
