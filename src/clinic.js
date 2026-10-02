/**
 * Facts about the clinic used across pages, structured data and maps links.
 * Change them here and every page picks them up.
 */
export const CLINIC = Object.freeze({
  name: 'Kometa Dent',
  phone: '+998971255551',
  // No-break spaces keep the number on one line.
  phoneDisplay: '+998\u00a097\u00a0125\u00a055\u00a051',
  telegram: 'https://t.me/kometadent',
  instagram: 'https://instagram.com/kometadent',
  address: Object.freeze({
    street: 'ул. Махтумкули, 105',
    city: 'Ташкент',
    postalCode: '100123',
    country: 'UZ',
  }),
  mapQuery: 'Kometa Dent, улица Махтумкули 105, Ташкент',
});

const q = encodeURIComponent(CLINIC.mapQuery);
export const MAP_LINKS = Object.freeze({
  yandex: `https://yandex.uz/maps/?text=${q}`,
  google: `https://www.google.com/maps/search/?api=1&query=${q}`,
  twogis: `https://2gis.uz/tashkent/search/${q}`,
});
