/**
 * Internationalization — English (default) and Arabic (RTL).
 *
 * - All UI copy lives in locales/en.js and locales/ar.js (same keys).
 *   Arabic is transcreated for Saudi & Egyptian audiences, not translated word by word.
 * - Missing Arabic keys fall back to English per key.
 * - The saved language is applied before first paint by the inline script in
 *   index.html (lang + dir), so pages never flash in the wrong direction.
 * - Layout CSS uses logical properties, so `dir="rtl"` mirrors the interface.
 *
 *   t('home.hero.title')            → string
 *   t('wizard.stepOf', { n, total }) → "{n}" placeholders are interpolated
 *   tl('home.offer.items')          → arrays / objects of copy
 *   pick({ en: 'Hi', ar: 'أهلًا' })  → value for the active locale (data files)
 */
import en from './locales/en.js';

export const LOCALE_KEY = 'character-lab:locale';

export const LOCALES = {
  en: { label: 'English', short: 'EN', dir: 'ltr', load: async () => en },
  ar: { label: 'العربية', short: 'عربي', dir: 'rtl', load: async () => (await import('./locales/ar.js')).default },
};

/** Locales selectable in the UI. */
export const ENABLED_LOCALES = ['en', 'ar'];

let current = 'en';
let dict = en;

const lookup = (obj, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);

export function t(key, params) {
  let value = lookup(dict, key);
  if (typeof value !== 'string') value = lookup(en, key);
  if (typeof value !== 'string') return key;
  return params ? value.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`)) : value;
}

export function tl(key) {
  const value = lookup(dict, key);
  return value !== undefined && typeof value !== 'string' ? value : lookup(en, key);
}

/** Locale-aware value from a data object like { en, ar } (falls back to English). */
export const pick = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value[current] ?? value.en : value);

/** Join a list with the locale's separator ("a, b" / "أ، ب"). */
export const joinList = (items) => items.join(current === 'ar' ? '، ' : ', ');

export const getLocale = () => current;
export const getDir = () => LOCALES[current].dir;
export const otherLocale = () => (current === 'ar' ? 'en' : 'ar');

/**
 * @param {string} code
 * @param {{ persist?: boolean, silent?: boolean }} [opts]
 */
export async function setLocale(code, { persist = true, silent = false } = {}) {
  const locale = LOCALES[code] ? code : 'en';
  dict = await LOCALES[locale].load();
  current = locale;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = LOCALES[locale].dir;
  if (persist) {
    try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* storage blocked */ }
  }
  if (!silent) window.dispatchEvent(new CustomEvent('i18n:change', { detail: { locale } }));
  return locale;
}

/** Start in the language chosen by the head script (?lang= or saved preference). */
export async function initI18n() {
  const fromHead = document.documentElement.lang;
  const code = ENABLED_LOCALES.includes(fromHead) ? fromHead : 'en';
  await setLocale(code, { persist: false, silent: true });
  return code;
}

/**
 * Apply a locale overlay to a wizard schema without duplicating its logic.
 * overlay = { steps: { [stepId]: { title, short, intro } },
 *             questions: { [qId]: { label, hint, placeholder, summaryLabel, options: { [value]: label | { label, desc } } } } }
 */
export function localizeSchema(schema, overlay) {
  if (!overlay) return schema;
  return {
    ...schema,
    title: overlay.title ?? schema.title,
    steps: schema.steps.map((step) => {
      const so = overlay.steps?.[step.id] ?? {};
      return {
        ...step,
        ...pickDefined(so, ['title', 'short', 'intro']),
        questions: step.questions?.map((q) => {
          const qo = overlay.questions?.[q.id];
          if (!qo) return q;
          return {
            ...q,
            ...pickDefined(qo, ['label', 'hint', 'placeholder', 'summaryLabel']),
            options: q.options?.map((o) => {
              const oo = qo.options?.[o.value];
              if (!oo) return o;
              return typeof oo === 'string' ? { ...o, label: oo } : { ...o, ...oo };
            }),
          };
        }),
      };
    }),
  };
}

const pickDefined = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
