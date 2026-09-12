const { test, expect } = require('@playwright/test');

const sizes = [
  { name: 'petit téléphone', width: 320, height: 568 },
  { name: 'téléphone courant', width: 390, height: 844 }
];

const expectNoHorizontalOverflow = async page => {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
};

for (const size of sizes) {
  test(`${size.name} : parcours personnel sans erreur`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(size);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('.brand')).toHaveText('Rehaab.');
    await expect(page.getByRole('heading', { name: 'Un cap. De la liberté.' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'C’est parti' }).click();
    await expect(page.getByRole('heading', { name: /Qu’est-ce qui te ferait du bien/ })).toBeVisible();
    await page.getByRole('button', { name: 'Trouver ma séance' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Propose-moi une séance' }).click();
    await expect(page.getByRole('button', { name: 'Cette séance me va' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Cette séance me va' }).click();
    await expect(page.getByRole('button', { name: 'Échauffement effectué' })).toBeVisible();
    await page.getByRole('button', { name: 'Échauffement effectué' }).click();
    await expect(page.getByRole('button', { name: /Valider cette série/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test('profil, douleur et export restent accessibles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'C’est parti' }).click();
  await page.getByRole('button', { name: 'Profil' }).click();
  await expect(page.getByRole('heading', { name: 'Mon profil.' })).toBeVisible();
  await page.getByRole('button', { name: /Mes douleurs du moment/ }).click();
  await expect(page.getByRole('heading', { name: 'Comment va ton corps ?' })).toBeVisible();
  await page.getByRole('button', { name: 'Genou' }).click();
  await page.getByRole('button', { name: 'Enregistrer le signalement' }).click();
  await expect(page.getByText(/Signalement enregistré/)).toBeVisible();
  await page.getByRole('button', { name: 'Profil' }).click();
  await page.getByText('Mes données & sauvegardes').click();
  await expect(page.getByRole('button', { name: 'Exporter toutes mes données' })).toBeVisible();
});
