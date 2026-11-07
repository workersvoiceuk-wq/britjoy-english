import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
]) {
  test(`Phase 1 guided learning + demo video + subtitles + retry + transfer (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      if (!localStorage.getItem('britjoy-english-progress-v1')) {
        const completedLessons: Record<string, { stars: number; bestXp: number; completedAt: number }> = {};
        for (const id of [
          'ia-01-patterns',
          'ia-02-train',
          'ia-03-neuron',
          'ia-04-validation',
          'ia-05-bias',
          'ia-06-language',
          'ia-07-modo-ia',
          'ia-08-tareas',
        ]) {
          completedLessons[id] = { stars: 3, bestXp: 15, completedAt: 1793923200000 };
        }
        localStorage.setItem(
          'britjoy-english-progress-v1',
          JSON.stringify({
            state: {
              uiLang: 'es',
              voiceOn: false,
              soundOn: false,
              placementDone: true,
              currentLevel: 'IA',
              tab: 'home',
              hearts: 5,
              levels: {
                IA: {
                  xp: 120,
                  completedLessons,
                },
              },
            },
            version: 4,
          }),
        );
      }
    });

    await page.goto('/');

    // Enter course from Continue / Learn navigation
    await page.getByRole('button', { name: /IA con Britjoy 8\/15 lecciones/ }).click();

    // 1. Unit menu upfront + clear course objective + preserved progress + optional BritJoy Help
    const unitMenu = page.locator('[data-unit-menu="true"]');
    await expect(unitMenu).toBeVisible();
    await expect(unitMenu.locator('[data-course-objective="true"]')).toBeVisible();
    await expect(unitMenu).toContainText('8 / 15 lecciones');
    await expect(page.locator('[data-britjoy-path-help="true"]')).toHaveAttribute('aria-expanded', 'false');

    // Jump to Bloque 2 via unit menu and open ia-09-supervision (CV human-in-the-loop demo)
    await unitMenu.getByRole('link', { name: /Bloque 2/ }).click();
    await page.getByRole('button', { name: /Humano al mando: revisar antes de enviar \(disponible\)/ }).click();

    // 2. Clear lesson objective upfront before watching demo
    await expect(page.locator('[data-lesson-objective="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Explorar la lección', exact: true }).click();

    // 3. Demo video + mobile-legible ES/EN subtitles + pending narration + visual mechanism + optional BritJoy Help
    await expect(page.locator('[data-demo-video="true"] video')).toBeVisible();
    const captionBar = page.locator('[data-mobile-captions="es"]');
    await expect(captionBar).toBeVisible();
    await captionBar.locator('[data-sub-lang="en"]').click();
    await expect(page.locator('[data-mobile-captions="en"]')).toBeVisible();
    await expect(page.locator('[data-narration-pending="true"]')).toContainText('narración pendiente');
    await expect(page.locator('[data-visual-mechanism="true"]')).toBeVisible();
    await expect(page.locator('details[data-britjoy-help="true"]')).not.toHaveAttribute('open', '');

    // Advance past the two explain cards to the graded task
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 4. Task -> wrong answer (red + explanation + Retry) -> retry -> right answer (green + explanation)
    await page.locator('main button.tile', { hasText: 'Dejar que el sistema responda' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('footer[data-feedback-state="wrong"]')).toBeVisible();
    await expect(page.locator('[data-feedback-explanation="true"]')).toBeVisible();
    const retryBtn = page.locator('[data-retry-exercise="true"]');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    await expect(page.locator('footer[data-feedback-state="idle"]')).toBeVisible();
    await page.locator('main button.tile', { hasText: 'Revisar hechos, tono y destinatario' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('footer[data-feedback-state="right"]')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('¡Correcto!');
    await expect(page.locator('[data-feedback-explanation="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Finish remaining exercises to reach transfer ("otro caso") & verify conserved progress
    await page.locator('main button.tile', { hasText: 'Borrar el cargo inventado' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    for (const [en, es] of [
      ['human in the loop', 'persona al mando'],
      ['shift supervisor', 'encargado de turno'],
      ['fact check', 'comprobación de hechos'],
      ['press send', 'pulsar enviar'],
    ]) {
      await page.locator('main button.tile', { hasText: new RegExp(`^${en}$`) }).click();
      await page.locator('main button.tile', { hasText: new RegExp(`^${es}$`) }).click();
    }
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    for (const w of ['Check', 'the', 'facts', 'before', 'you', 'press', 'send.']) {
      await page.locator('main div.justify-center button.tile:not([disabled])').filter({ hasText: new RegExp(`^${w.replace('.', '\\.')}$`) }).first().click();
    }
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.locator('main button.tile', { hasText: 'Check the facts before you press send' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.locator('main button.tile', { hasText: /^loop$/ }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 5. Another case (transfer reflection) -> completion -> preserved progress (9 / 15)
    await expect(page.getByRole('heading', { name: '¿Qué cambió en tu idea?', exact: true })).toBeVisible();
    await page.locator('#lesson-reflection').fill('En una carta de presentación revisaría fechas, empresa y nivel real de inglés antes de enviarla.');
    await page.getByRole('button', { name: 'Terminar y ver resultado' }).click();
    await expect(page.getByRole('heading', { name: '¡Lección completada!' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.locator('[data-unit-menu="true"]')).toContainText('9 / 15 lecciones');
  });
}

