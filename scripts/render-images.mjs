/**
 * Renders the Open Graph previews, app icons and README screenshots with the
 * site's own fonts and colours, so every image matches the design system.
 *
 *   npm run images
 *
 * Uses the Chromium that Playwright installs (npx playwright install chromium).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { CLINIC } from '../src/clinic.js';
import { DICTIONARIES } from '../src/i18n/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'public', 'img');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');
const PORT = 3299;

// Inlined as data URLs: a page created with setContent() may not load file:// fonts.
const font = (file) =>
  `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'public', 'fonts', file)).toString('base64')}`;
const MARK = 'M2 17.5c6.6-.6 11.6-2.3 16.4-5.6a6.5 6.5 0 1 1 1.5 11.6C14.3 22 8.8 19.6 2 17.5Z';

const baseCss = `
  @font-face { font-family: Literata; src: url(${font('literata-cyrillic.woff2')}); font-weight: 400 700; unicode-range: U+0400-045F; }
  @font-face { font-family: Literata; src: url(${font('literata-latin.woff2')}); font-weight: 400 700; unicode-range: U+0000-00FF, U+2000-206F; }
  @font-face { font-family: Golos; src: url(${font('golos-text-cyrillic.woff2')}); font-weight: 400 700; unicode-range: U+0400-045F; }
  @font-face { font-family: Golos; src: url(${font('golos-text-latin.woff2')}); font-weight: 400 700; unicode-range: U+0000-00FF, U+2000-206F; }
  * { margin: 0; box-sizing: border-box; }
  body { background: #f4f2ec; color: #16181b; font-family: Golos; }
`;

function ogHtml(lang) {
  const t = DICTIONARIES[lang];
  return `<!doctype html><meta charset="utf-8"><style>${baseCss}
    body { width: 1200px; height: 630px; padding: 64px 72px; display: grid; grid-template-columns: 1fr 300px; gap: 56px; }
    .brand { display: flex; align-items: center; gap: 12px; font: 600 34px/1 Literata; }
    .brand svg { width: 52px; height: 52px; fill: #b93d0e; }
    h1 { margin-top: 56px; font: 500 64px/1.04 Literata; letter-spacing: -0.02em; }
    .meta { position: absolute; left: 72px; bottom: 64px; font-size: 24px; color: #565b62; }
    .board { align-self: end; background: #16181b; color: #f4f2ec; padding: 32px; }
    .board p { color: #a3a7ad; font-size: 20px; }
    .board strong { display: block; margin-top: 8px; font: 500 96px/1 Golos; letter-spacing: -0.03em; }
    .board span { display: flex; align-items: center; gap: 10px; margin-top: 16px; font-size: 22px; }
    .board span::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: #ee7a45; }
  </style>
  <div>
    <div class="brand"><svg viewBox="0 0 32 32"><path d="${MARK}"/></svg>Kometa Dent</div>
    <h1>${t['hero.title']}</h1>
    <p class="meta">${t['contacts.address.value'].replace('<br>', ', ')} · ${CLINIC.phoneDisplay}</p>
  </div>
  <div class="board"><p>${t['status.label']}</p><strong>24/7</strong><span>${t['status.open']}</span></div>`;
}

const iconHtml = (size) => `<!doctype html><meta charset="utf-8"><style>${baseCss}
  body { width: ${size}px; height: ${size}px; display: grid; place-items: center; }
  svg { width: 62%; height: 62%; fill: #b93d0e; }
</style><svg viewBox="0 0 32 32"><path d="${MARK}"/></svg>`;

async function renderStatic(browser) {
  fs.mkdirSync(IMG, { recursive: true });
  const page = await browser.newPage();
  for (const lang of ['ru', 'uz']) {
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(ogHtml(lang), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(IMG, `og-${lang}.png`) });
  }
  for (const [name, size] of [
    ['apple-touch-icon', 180],
    ['icon-192', 192],
    ['icon-512', 512],
  ]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(iconHtml(size), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(IMG, `${name}.png`) });
  }
  await page.close();
}

async function renderScreenshots(browser) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = spawn(process.execPath, ['server.js', '--demo'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), LOG_LEVEL: 'warn' },
    stdio: 'inherit',
  });
  const base = `http://localhost:${PORT}`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const shot = async (name, url, { width, height, scheme = 'light', mobile = false, prepare }) => {
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme: scheme,
      deviceScaleFactor: 2,
      isMobile: mobile,
      hasTouch: mobile,
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + url, { waitUntil: 'networkidle' });
    if (prepare) await prepare(page);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    await page.close();
  };

  try {
    await shot('home-desktop', '/', { width: 1440, height: 900 });
    await shot('home-uz-dark', '/uz/', { width: 1440, height: 900, scheme: 'dark' });
    await shot('booking-mobile', '/', {
      width: 390,
      height: 844,
      mobile: true,
      prepare: async (page) => {
        await page.locator('#f-service').selectOption('implants');
        await page.locator('#booking-form input[name="date"]').nth(1).check();
        await page.locator('#booking-form input[name="time"][value="12:00"]').check();
        await page.locator('#booking-form .days').evaluate((el) => el.scrollIntoView());
        await page.evaluate(() => window.scrollBy(0, -72));
      },
    });
    await shot('admin', '/admin', {
      width: 1280,
      height: 800,
      prepare: async (page) => {
        await page.fill('#token', 'demo');
        await page.click('button[type=submit]');
        await page.locator('.row').first().waitFor();
      },
    });
  } finally {
    server.kill();
  }
}

const browser = await chromium.launch();
try {
  await renderStatic(browser);
  await renderScreenshots(browser);
  console.log('Images written to public/img and docs/screenshots');
} finally {
  await browser.close();
}
