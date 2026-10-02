import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';

import { SERVICE_IDS } from '../src/catalog.js';
import { DICTIONARIES } from '../src/i18n/index.js';
import { startApp } from './helpers.js';

describe('pages', () => {
  let app;
  before(async () => (app = await startApp()));
  after(() => app.close());

  it('serves the Russian page at / and the Uzbek page at /uz/', async () => {
    const ru = await app.request('/');
    assert.equal(ru.status, 200);
    const ruHtml = await ru.text();
    assert.match(ruHtml, /<html lang="ru">/);
    assert.ok(ruHtml.includes(DICTIONARIES.ru['hero.title']));

    const uz = await app.request('/uz/');
    assert.equal(uz.status, 200);
    const uzHtml = await uz.text();
    assert.match(uzHtml, /<html lang="uz">/);
    assert.ok(uzHtml.includes(DICTIONARIES.uz['hero.title']));
  });

  it('redirects /uz to /uz/', async () => {
    const res = await fetch(`${app.base}/uz`, { redirect: 'manual' });
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), '/uz/');
  });

  it('leaves no template tags unrendered', async () => {
    for (const path of ['/', '/uz/', '/admin', '/missing']) {
      const html = await (await app.request(path, { headers: { Accept: 'text/html' } })).text();
      assert.ok(!html.includes('{{'), `${path} contains "{{"`);
    }
  });

  it('offers every bookable service in the form', async () => {
    const html = await (await app.request('/')).text();
    for (const id of SERVICE_IDS) assert.ok(html.includes(`<option value="${id}">`), id);
  });

  it('links language versions for search engines', async () => {
    const html = await (await app.request('/')).text();
    assert.ok(html.includes('hreflang="uz" href="https://kometa.example/uz/"'));
    assert.ok(html.includes('rel="canonical" href="https://kometa.example/"'));
    assert.ok(html.includes('"@type":"Dentist"'));
  });

  it('versions CSS and JS for long-term caching', async () => {
    const html = await (await app.request('/')).text();
    const match = html.match(/href="(\/css\/site\.css\?v=[0-9a-f]{10})"/);
    assert.ok(match, 'versioned stylesheet link');
    const css = await app.request(match[1]);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('cache-control'), /immutable/);
  });

  it('sends a strict Content-Security-Policy', async () => {
    const csp = (await app.request('/')).headers.get('content-security-policy');
    assert.match(csp, /script-src 'self'/);
    assert.ok(!csp.includes('unsafe-inline'));
  });

  it('answers unknown pages with a real 404 page', async () => {
    const res = await app.request('/no-such-page', { headers: { Accept: 'text/html' } });
    assert.equal(res.status, 404);
    assert.ok((await res.text()).includes(DICTIONARIES.ru['notfound.title']));
    const uz = await app.request('/uz/no-such-page', { headers: { Accept: 'text/html' } });
    assert.ok((await uz.text()).includes(DICTIONARIES.uz['notfound.title']));
  });

  it('keeps the admin page out of search engines', async () => {
    const res = await app.request('/admin');
    assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
    const robots = await (await app.request('/robots.txt')).text();
    assert.match(robots, /Disallow: \/admin/);
    assert.match(robots, /Sitemap: https:\/\/kometa\.example\/sitemap\.xml/);
  });
});

describe('translations', () => {
  it('have the same keys in Russian and Uzbek', () => {
    const ru = Object.keys(DICTIONARIES.ru).sort();
    const uz = Object.keys(DICTIONARIES.uz).sort();
    assert.deepEqual(
      ru.filter((k) => !uz.includes(k)),
      [],
      'keys missing in uz',
    );
    assert.deepEqual(
      uz.filter((k) => !ru.includes(k)),
      [],
      'keys missing in ru',
    );
  });

  it('name every service in both languages', () => {
    for (const id of SERVICE_IDS) {
      assert.ok(DICTIONARIES.ru[`service.${id}`], `ru service.${id}`);
      assert.ok(DICTIONARIES.uz[`service.${id}`], `uz service.${id}`);
    }
  });

  it('write oʻ/gʻ with a typographic mark, not an ASCII apostrophe', () => {
    const offenders = Object.entries(DICTIONARIES.uz).filter(([, v]) =>
      /[a-z]['\u02bb\u02bc][a-z]/i.test(v),
    );
    assert.deepEqual(offenders, []);
  });

  it('are referenced by the templates or scripts', () => {
    const files = [
      ...fs
        .readdirSync('views')
        .filter((f) => f.endsWith('.html'))
        .map((f) => `views/${f}`),
      ...fs.readdirSync('views/partials').map((f) => `views/partials/${f}`),
      'src/views.js',
    ];
    const sources = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    const unused = Object.keys(DICTIONARIES.ru).filter(
      (key) =>
        !key.startsWith('js.') &&
        !key.startsWith('service.') &&
        !key.startsWith('meta.locale') &&
        !sources.includes(key),
    );
    assert.deepEqual(unused, []);
  });
});
