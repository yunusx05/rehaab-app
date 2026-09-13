const { test, expect } = require('@playwright/test');

const sizes = [
  { name: 'petit téléphone', width: 320, height: 568 },
  { name: 'téléphone courant', width: 390, height: 844 },
  { name: 'bureau', width: 1440, height: 900 }
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
    await expect(page.getByRole('heading', { name: /À toi de jouer/i })).toBeVisible();
    await expect(page.locator('.training-hero img')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/accueil-${size.width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Trouver ma séance' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Propose-moi une séance' }).click();
    await expect(page.getByRole('button', { name: 'Démarrer la séance' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole('button', { name: 'Démarrer la séance' }).click();
    await expect(page.getByRole('button', { name: 'Échauffement effectué' })).toBeVisible();
    await page.getByRole('button', { name: 'Échauffement effectué' }).click();
    await expect(page.getByRole('button', { name: 'Terminé', exact: true })).toBeVisible();
    await expect(page.getByRole('timer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mettre en pause', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: `test-results/seance-${size.width}.png` });
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
  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mon profil.' })).toBeVisible();
  await page.getByRole('button', { name: /Mes douleurs du moment/ }).click();
  await expect(page.getByRole('heading', { name: 'Comment va ton corps ?' })).toBeVisible();
  await page.getByRole('button', { name: 'Genou' }).click();
  await page.getByRole('button', { name: 'Enregistrer le signalement' }).click();
  await expect(page.getByText(/Signalement enregistré/)).toBeVisible();
  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await page.getByText('Mes données & sauvegardes').click();
  await expect(page.getByRole('button', { name: 'Exporter toutes mes données' })).toBeVisible();
});

// iOS ignores SVG icons: the home-screen icon must be a PNG apple-touch-icon.
test('installation : icônes PNG déclarées et servies', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'apple-touch-icon.png');
  const manifest = await (await request.get('/manifest.json')).json();
  expect(manifest.icons.filter(icon => icon.type === 'image/png').map(icon => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const file of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
    const response = await request.get(`/${file}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  }
});
