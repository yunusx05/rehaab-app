const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    locale: 'fr-FR',
    colorScheme: 'dark'
  },
  webServer: {
    command: 'npm start -- --listen 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
