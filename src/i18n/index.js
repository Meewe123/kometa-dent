import ru from './ru.js';
import uz from './uz.js';

export const LANGS = Object.freeze(['ru', 'uz']);
export const DICTIONARIES = Object.freeze({ ru, uz });

/** Translation lookup. Throws on a missing key so typos fail at startup, not in production. */
export function t(lang, key) {
  const value = DICTIONARIES[lang]?.[key];
  if (value === undefined) throw new Error(`Missing translation "${key}" for "${lang}"`);
  return value;
}

export const serviceName = (id, lang = 'ru') => DICTIONARIES[lang][`service.${id}`] ?? String(id);
