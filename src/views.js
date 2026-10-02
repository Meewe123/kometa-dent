import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PRICED_SERVICES, SERVICES } from './catalog.js';
import { CLINIC, MAP_LINKS } from './clinic.js';
import { DICTIONARIES, LANGS } from './i18n/index.js';
import { BOOKING_WINDOW_DAYS, CLINIC_TIME_ZONE } from './schedule.js';
import { escapeHtml } from './telegram.js';

/** Base URL path of each language version. */
export const LANG_PATHS = Object.freeze({ ru: '/', uz: '/uz/' });

const PAGES = ['index', '404', 'admin'];

/** Serializes data for a <script type="application/json"> block, safe against "</script>". */
const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function formatPrice(amount, lang) {
  // Intl inserts a no-break space between thousands in both locales.
  const number = new Intl.NumberFormat('ru-RU').format(amount);
  return DICTIONARIES[lang]['prices.from'].replace('{price}', number);
}

/**
 * Tiny template engine for the HTML files in views/:
 *   {{t key}}        translation (trusted HTML from src/i18n)
 *   {{price id}}     formatted starting price of a service
 *   {{name}}         variable, HTML-escaped
 *   {{{name}}}       variable, inserted as-is (prebuilt HTML / JSON)
 *   {{> partial}}    include views/partials/partial.html
 *   {{#if name}}…{{/if}}   block shown when the variable is truthy
 * Unknown keys throw, so a typo breaks startup and tests instead of a page.
 */
export function renderTemplate(source, { lang, vars, partials }) {
  const dict = DICTIONARIES[lang];
  let html = source;

  for (let depth = 0; html.includes('{{>'); depth++) {
    if (depth > 5) throw new Error('Partials nested too deeply');
    html = html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
      if (!(name in partials)) throw new Error(`Unknown partial "${name}"`);
      return partials[name];
    });
  }

  html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, name, body) => {
    if (!(name in vars)) throw new Error(`Unknown variable "${name}" in #if`);
    return vars[name] ? body : '';
  });

  html = html.replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, name) => {
    if (!(name in vars)) throw new Error(`Unknown variable "${name}"`);
    return String(vars[name]);
  });

  return html.replace(/\{\{\s*(?:(t|price)\s+)?([\w.-]+)\s*\}\}/g, (_, helper, key) => {
    if (helper === 't') {
      if (!(key in dict)) throw new Error(`Missing translation "${key}" for "${lang}"`);
      return dict[key];
    }
    if (helper === 'price') {
      const service = SERVICES.find((s) => s.id === key);
      if (!service?.price) throw new Error(`No price for service "${key}"`);
      return formatPrice(service.price, lang);
    }
    if (!(key in vars)) throw new Error(`Unknown variable "${key}"`);
    return escapeHtml(vars[key]);
  });
}

function priceRows(lang) {
  const dict = DICTIONARIES[lang];
  return PRICED_SERVICES.map(
    ({ id }) => `
          <li class="price-row">
            <div class="price-row__main">
              <h3 class="price-row__name">${dict[`service.${id}`]}</h3>
              <p class="price-row__desc">${dict[`service.${id}.desc`]}</p>
            </div>
            <p class="price-row__price">${formatPrice(SERVICES.find((s) => s.id === id).price, lang)}</p>
            <a class="price-row__book link" href="#booking" data-service="${id}">${dict['prices.book']}<span class="visually-hidden">: ${dict[`service.${id}`]}</span></a>
          </li>`,
  ).join('');
}

function serviceOptions(lang) {
  const dict = DICTIONARIES[lang];
  return SERVICES.map(({ id }) => `<option value="${id}">${dict[`service.${id}`]}</option>`).join(
    '',
  );
}

function structuredData(config) {
  const prices = PRICED_SERVICES.map((s) => s.price);
  return safeJson({
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: CLINIC.name,
    url: `${config.siteUrl}/`,
    image: `${config.siteUrl}/img/og-ru.png`,
    telephone: CLINIC.phone,
    priceRange: `${Math.min(...prices)}–${Math.max(...prices)} UZS`,
    currenciesAccepted: 'UZS',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CLINIC.address.street,
      addressLocality: CLINIC.address.city,
      postalCode: CLINIC.address.postalCode,
      addressCountry: CLINIC.address.country,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [CLINIC.telegram, CLINIC.instagram],
  });
}

function clientStrings(lang) {
  return Object.fromEntries(
    Object.entries(DICTIONARIES[lang])
      .filter(([key]) => key.startsWith('js.') || key.startsWith('service.'))
      .filter(([key]) => !key.endsWith('.desc'))
      .map(([key, value]) => [key.replace(/^js\./, ''), value]),
  );
}

/**
 * Loads templates once at startup and renders every page in every language
 * into memory. Pages don't depend on the request, so serving one is a Map lookup.
 */
export function createViews({ config, rootDir }) {
  const viewsDir = path.join(rootDir, 'views');
  const publicDir = path.join(rootDir, 'public');
  const read = (file) => fs.readFileSync(file, 'utf8');

  const partials = Object.fromEntries(
    fs
      .readdirSync(path.join(viewsDir, 'partials'))
      .filter((f) => f.endsWith('.html'))
      .map((f) => [path.basename(f, '.html'), read(path.join(viewsDir, 'partials', f))]),
  );

  // Adds ?v=<content hash> to local CSS/JS so browsers can cache them for a year
  // and still get the new file right after a deploy.
  const versions = new Map();
  const versionAssets = (html) =>
    html.replace(/(href|src)="(\/(?:css|js)\/[\w.-]+)"/g, (_, attr, url) => {
      if (!versions.has(url)) {
        const hash = createHash('sha256')
          .update(read(path.join(publicDir, url)))
          .digest('hex');
        versions.set(url, hash.slice(0, 10));
      }
      return `${attr}="${url}?v=${versions.get(url)}"`;
    });

  const year = new Date().getFullYear();
  const cache = new Map();

  for (const lang of LANGS) {
    const vars = {
      lang,
      isRu: lang === 'ru',
      isUz: lang === 'uz',
      langPath: LANG_PATHS[lang],
      canonicalUrl: `${config.siteUrl}${LANG_PATHS[lang]}`,
      ruUrl: `${config.siteUrl}${LANG_PATHS.ru}`,
      uzUrl: `${config.siteUrl}${LANG_PATHS.uz}`,
      siteUrl: config.siteUrl,
      ogImage: `${config.siteUrl}/img/og-${lang}.png`,
      fontSubset: lang === 'ru' ? 'cyrillic' : 'latin',
      year,
      demo: config.demo,
      phone: CLINIC.phone,
      phoneDisplay: CLINIC.phoneDisplay,
      telegram: CLINIC.telegram,
      instagram: CLINIC.instagram,
      mapYandex: MAP_LINKS.yandex,
      mapGoogle: MAP_LINKS.google,
      map2gis: MAP_LINKS.twogis,
      priceRows: priceRows(lang),
      serviceOptions: serviceOptions(lang),
      structuredData: structuredData(config),
      clientData: safeJson({
        lang,
        demo: config.demo,
        timeZone: CLINIC_TIME_ZONE,
        bookingWindowDays: BOOKING_WINDOW_DAYS,
        strings: clientStrings(lang),
      }),
    };

    for (const page of PAGES) {
      if (page === 'admin' && lang !== 'ru') continue; // staff tool, Russian only
      const source = read(path.join(viewsDir, `${page}.html`));
      cache.set(`${page}:${lang}`, versionAssets(renderTemplate(source, { lang, vars, partials })));
    }
  }

  return {
    page(name, lang = 'ru') {
      const html = cache.get(`${name}:${lang}`);
      if (!html) throw new Error(`No page "${name}" for "${lang}"`);
      return html;
    },
  };
}
