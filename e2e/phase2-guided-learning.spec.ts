import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
]) {
  test(`Phase 2 pathway guide + single-task visual mechanism + gradual hint + 1st-miss option feedback + simulated contextual tutor (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      if (!localStorage.getItem('britjoy-english-progress-v1')) {
        localStorage.setItem(
          'britjoy-english-progress-v1',
          JSON.stringify({
            state: {
              uiLang: 'es',
              voiceOn: false,
              soundOn: false,
              placementDone: true,
              currentLevel: 'ELEC',
              tab: 'english',
              hearts: 5,
              levels: {},
            },
            version: 4,
          }),
        );
      }
    });

    await page.goto('/');

    // 1. Course entry: unit menu + clear objective + collapsible pathway guide with downloadable study sheet
    const unitMenu = page.locator('[data-unit-menu="true"]');
    await expect(unitMenu).toBeVisible();
    const pathwayGuide = page.locator('details[data-pathway-guide="electricidad"]');
    await expect(pathwayGuide).toBeVisible();
    await pathwayGuide.locator('summary').click();
    await expect(pathwayGuide.locator('[data-download-study-guide="true"]')).toBeVisible();
    await expect(pathwayGuide).toContainText('BS 7671');
    await expect(pathwayGuide).toContainText('REBT');
    await expect(pathwayGuide).toContainText('RETIE');

    // 2. Open electricity simulator theory lesson (elec-01-ohm-kirchhoff)
    await page.getByRole('button', { name: /Ohm, Kirchhoff y potencia en simulador \(disponible\)/ }).click();
    await expect(page.locator('[data-lesson-objective="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Explorar la lección', exact: true }).click();

    // Opening explain card -> advance to first single-task graded exercise
    await page.getByRole('button', { name: 'Continuar' }).click();

    // 3. Single visible task + honest visual mechanism + gradual hint + contextual simulated QA tutor (non-spoiler before try)
    await expect(page.locator('[data-honest-visual-demo="true"]')).toBeVisible();
    const hintDetails = page.locator('details[data-gradual-hint="true"]');
    await expect(hintDetails).toBeVisible();
    await hintDetails.locator('summary').click();
    await expect(hintDetails).toContainText('condición concreta');

    const helpDetails = page.locator('details[data-britjoy-help="true"]');
    await helpDetails.locator('summary').click();
    await page.locator('[data-tutor-sim-btn="true"]').click();
    const tutorQa = page.locator('[data-contextual-tutor-qa="true"]');
    await expect(tutorQa).toBeVisible();
    await expect(tutorQa.locator('[data-tutor-sim-badge="true"]')).toContainText('SIMULACIÓN DE QA');
    await expect(tutorQa).toContainText('No te doy la solución antes de que lo intentes');

    // 4. First wrong choice -> explains why that option fails WITHOUT revealing canonical answer -> Retry -> Right choice
    await page.locator('main button.tile', { hasText: '72 A, porque se multiplica' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('footer[data-feedback-state="wrong"]')).toBeVisible();
    await expect(page.locator('[data-revealed-answer="true"]')).toHaveCount(0);
    await expect(page.locator('main .tile-correct')).toHaveCount(0);
    await expect(page.locator('[data-feedback-explanation="true"]')).toContainText('V dividido entre R');

    await page.locator('[data-retry-exercise="true"]').click();
    await expect(page.locator('footer[data-feedback-state="idle"]')).toBeVisible();
    await page.locator('main button.tile', { hasText: '2 A, porque R_total' }).click();
    await page.getByRole('button', { name: 'Comprobar' }).click();
    await expect(page.locator('footer[data-feedback-state="right"]')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('¡Correcto!');
  });
}
