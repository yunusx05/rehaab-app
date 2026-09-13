/* Renders the PNG home-screen icons from the Rehaab mark in favicon.svg: iOS ignores SVG icons. */
const fs = require('node:fs');
const {chromium} = require('@playwright/test');

// The mark without its rounded frame, so iOS and Android can apply their own mask.
const mark = fs.readFileSync('favicon.svg', 'utf8').match(/<path[\s\S]*?\/>\s*<rect[\s\S]*?\/>/)[0];
const svg = (size, scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#080908"/><g transform="translate(32 32) scale(${scale}) translate(-35 -33.5)">${mark}</g></svg>`;
const icons = [
  {file: 'apple-touch-icon.png', size: 180, scale: 1},
  {file: 'icon-192.png', size: 192, scale: 1},
  {file: 'icon-512.png', size: 512, scale: 1},
  {file: 'icon-maskable-512.png', size: 512, scale: .8} // Keeps the mark inside the 80 % safe zone.
];

(async () => {
  const browser = await chromium.launch({channel: 'chrome'});
  const page = await browser.newPage();
  for (const {file, size, scale} of icons) {
    await page.setViewportSize({width: size, height: size});
    await page.setContent(`<body style="margin:0;background:#080908">${svg(size, scale)}</body>`);
    await page.screenshot({path: file, clip: {x: 0, y: 0, width: size, height: size}});
    console.log(file, size);
  }
  await browser.close();
})().catch(e => {console.error(e); process.exitCode = 1;});
