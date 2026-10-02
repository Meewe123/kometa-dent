/**
 * Services a patient can choose when booking. `price` is the starting price in
 * Uzbek sum and is shown in the price list; services without a price are only
 * offered in the booking form. Names live in src/i18n under `service.<id>`.
 */
export const SERVICES = Object.freeze([
  { id: 'caries', price: 150_000 },
  { id: 'implants', price: 2_500_000 },
  { id: 'whitening', price: 800_000 },
  { id: 'orthodontics', price: 1_200_000 },
  { id: 'veneers', price: 1_500_000 },
  { id: 'kids', price: 100_000 },
  { id: 'extraction' },
  { id: 'hygiene' },
  { id: 'prosthetics' },
  { id: 'consultation' },
  { id: 'emergency' },
]);

export const SERVICE_IDS = Object.freeze(SERVICES.map((s) => s.id));
export const PRICED_SERVICES = Object.freeze(SERVICES.filter((s) => s.price));
