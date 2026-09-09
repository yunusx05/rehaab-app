const { test, expect } = require('@playwright/test');

const sizes = [
  { name: 'petit téléphone', width: 320, height: 568 },
  { name: 'téléphone courant', width: 390, height: 844 }
];

const expectNoHorizontalOverflow = async page => {
  const sizes = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
};

for (const size of sizes) {
  test(`${size.name} : navigation et écrans principaux`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.setViewportSize(size);
    await page.goto('/');

    await expect(page.locator('.title')).toHaveText('Rehaab.');
    await expect(page.locator('.block-btn')).toHaveCount(3);
    await expect(page.locator('.week-btn')).toHaveCount(4);
    await expectNoHorizontalOverflow(page);

    const navBox = await page.locator('.nav').boundingBox();
    const ctaBox = await page.locator('.cta').first().boundingBox();
    const weekActionsBox = await page.locator('.week-actions').boundingBox();
    expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(navBox.y);
    expect(weekActionsBox.y + weekActionsBox.height).toBeLessThanOrEqual(navBox.y);

    for (const selector of ['.block-btn', '.week-btn', '.nav-btn', '.week-actions .set-btn']) {
      const targets = await page.locator(selector).evaluateAll(elements =>
        elements.map(element => {
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height };
        })
      );
      expect(targets.every(target => target.width >= 44 && target.height >= 44)).toBe(true);
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const bottomNavBox = await page.locator('.nav').boundingBox();
    const lastSectionBox = await page.locator('.section').last().boundingBox();
    expect(lastSectionBox.y + lastSectionBox.height).toBeLessThanOrEqual(bottomNavBox.y);
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.locator('.session-row').first().click();
    await expect(page.locator('.workout-view')).toBeVisible();
    await expect(page.locator('.topbar-title')).toContainText('Séance');
    await page.locator('.ex-row').first().click();
    await expect(page.locator('.ex-card').first()).toHaveClass(/expanded/);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Nutrition' }).click();
    await expect(page.locator('.topbar-title')).toHaveText('Nutrition');
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Mesures' }).click();
    await expect(page.locator('.topbar-title')).toHaveText('Mensurations');
    await expect(page.locator('.meas-input')).toHaveCount(4);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Plus' }).click();
    await expect(page.locator('.topbar-title')).toHaveText('Plus');
    await expectNoHorizontalOverflow(page);

    expect(errors).toEqual([]);
  });
}
