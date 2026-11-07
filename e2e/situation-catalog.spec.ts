import { expect, test, type Page } from '@playwright/test';
import transporte from '../src/data/courses/vivir-uk/transporte.json' with { type: 'json' };

// «Vivir en UK» is a situation/country catalogue, separate from the Life in the UK exam course: its detail page shows
// the situations pathway (not exam preparation), «ia» inside other course IDs does not pick the AI pathway, and a
// Vivir en UK lesson still offers its chapter video (now filed under vivir-uk), with wrong → right feedback and saved progress.
const KEY = 'britjoy-english-progress-v1';
const strip = (w: string) => w.toLowerCase().replace(/[.,?!]/g, '');
const endsWith = (t: string) => new RegExp(`${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

async function start(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('britjoy-english-progress-v1'))
      localStorage.setItem('britjoy-english-progress-v1', JSON.stringify({ state: { uiLang: 'es', voiceOn: false, soundOn: false }, version: 3 }));
  });
  await page.goto('/');
  await page.getByText('Empezar desde cero (A1)').click();
}

for (const vp of [{ name: 'mobile-390x844', width: 390, height: 844 }, { name: 'desktop-1280x800', width: 1280, height: 800 }]) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('catalogue: Vivir en UK shows the situations pathway, not the Life in the UK exam; Colombia is not AI', async ({ page }) => {
      await start(page);
      await page.getByRole('button', { name: 'Cursos', exact: true }).click();
      await page.getByRole('button', { name: /Vivir en el Reino Unido.*Ver curso/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Vivir en el Reino Unido' });
      await expect(dialog.locator('[data-pathway-guide="vivir-uk"]')).toHaveCount(1);
      await expect(dialog.locator('[data-pathway-guide="life-uk"]')).toHaveCount(0);
      await expect(dialog).toContainText('no es el curso de examen Life in the UK');
      await dialog.getByRole('button', { name: 'Cerrar' }).click();
      await page.getByRole('tab', { name: 'Vivir en Colombia' }).click();
      const colombia = page.getByRole('button', { name: /Vivir en Colombia · aprende inglés.*Ver curso/ });
      await colombia.click();
      await expect(page.getByRole('dialog').locator('[data-pathway-guide="ia"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width);
    });

    test('Vivir en UK lesson: chapter video plays, wrong then right answer, progress saved', async ({ page }) => {
      await start(page);
      await page.getByRole('button', { name: /Vivir en UK/ }).click();
      await page.getByRole('button', { name: /Pagar el viaje \(disponible\)/ }).click();
      await page.getByRole('button', { name: 'Explorar la lección', exact: true }).click();
      const lesson = transporte.lessons[0];
      let videoChecked = false;
      let wrongShown = false;
      for (const ex of lesson.exercises as any[]) {
        if (ex.type === 'explain') {
          const trigger = page.locator('[data-question-video-help] button.qvh-trigger:visible');
          if (!videoChecked && (await trigger.count())) {
            await trigger.first().click();
            const video = page.locator('.qvh-panel:visible video');
            await expect(video).toHaveCount(1);
            const src = await video.evaluate((v: HTMLVideoElement) => v.currentSrc || v.src);
            expect(src).toContain('videos/uk/uk-transporte-l1-capitulo.mp4');
            const dur = await video.evaluate((v: HTMLVideoElement) => new Promise<number>((r) => (v.readyState >= 1 ? r(v.duration) : v.addEventListener('loadedmetadata', () => r(v.duration)))));
            expect(dur).toBeGreaterThan(5);
            await expect(page.locator('.qvh-panel:visible track')).toHaveCount(2);
            videoChecked = true;
          }
          await page.getByRole('button', { name: 'Continuar' }).click();
          continue;
        }
        if (ex.type === 'multipleChoice' && !wrongShown) {
          const wrong = ex.options.find((o: string) => o !== ex.answer);
          await page.locator('main button.tile', { hasText: endsWith(wrong) }).first().click();
          await page.getByRole('button', { name: 'Comprobar' }).click();
          await expect(page.locator('[data-feedback-state="wrong"]')).toBeVisible();
          await page.locator('[data-retry-exercise="true"]').click();
          wrongShown = true;
        }
        if (ex.type === 'multipleChoice' || (ex.type === 'listening' && ex.options) || ex.type === 'fillBlank') {
          await page.locator('main button.tile', { hasText: endsWith(ex.answer) }).first().click();
        } else if (ex.type === 'wordBank') {
          for (const token of ex.answer.split(' ')) {
            const word = ex.words.find((w: string) => strip(w) === strip(token));
            await page.locator('main').getByRole('button', { name: word, exact: true }).last().click();
          }
        } else if (ex.type === 'matching') {
          for (const p of ex.pairs) {
            await page.locator('main button.tile', { hasText: p.en }).first().click();
            await page.locator('main button.tile', { hasText: p.es }).first().click();
          }
        }
        if (ex.type !== 'matching' || (await page.getByRole('button', { name: 'Comprobar' }).isVisible())) {
          await page.getByRole('button', { name: 'Comprobar' }).click();
        }
        await expect(page.getByRole('status')).toContainText('¡Correcto!');
        await page.getByRole('button', { name: 'Continuar' }).click();
      }
      expect(videoChecked).toBe(true);
      expect(wrongShown).toBe(true);
      // Reflection → finish, then the completion is in the saved progress and survives a reload.
      for (let i = 0; i < 4; i++) {
        const btn = page.getByRole('button', { name: /^(Continuar|Terminar|Finalizar|Ver resultado|Omitir)/ }).first();
        if (!(await btn.count())) break;
        await btn.click();
        if ((await page.evaluate((k) => localStorage.getItem(k) ?? '', KEY)).includes('uk-transporte-l1')) break;
      }
      await expect.poll(() => page.evaluate((k) => localStorage.getItem(k) ?? '', KEY)).toContain('uk-transporte-l1');
      await page.reload();
      expect(await page.evaluate((k) => localStorage.getItem(k) ?? '', KEY)).toContain('uk-transporte-l1');
    });
  });
}
