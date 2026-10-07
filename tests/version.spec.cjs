const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');

// Profil affiche REHAAB_VERSION : si elle diverge du cache du service worker, la comparaison téléphone/ordi ment.
test('la version affichée correspond au cache du service worker', () => {
  const root = path.join(__dirname, '..');
  const version = /REHAAB_VERSION='([^']+)'/.exec(fs.readFileSync(path.join(root, 'index.html'), 'utf8'))[1];
  const cache = /const CACHE = 'rehaab-([^']+)'/.exec(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'))[1];
  expect(cache).toBe(version);
});
