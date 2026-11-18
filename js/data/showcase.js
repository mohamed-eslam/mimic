/**
 * Showcase cast — the characters used in the homepage's illustrative product scenes.
 *
 * Adam, Milo and Nova are catalog listings; this module only picks what the homepage
 * scenes need (name + portrait), so artwork lives in one place (js/data/catalog.js).
 */
import { findListing } from './catalog.js';

/** Name + portrait from the catalog (single source of truth for artwork). */
const fromCatalog = (id) => {
  const l = findListing(id);
  return { name: l?.name ?? { en: id, ar: id }, image: l?.media?.image ?? null };
};

export const SHOWCASE = {
  adam: fromCatalog('adam'),
  milo: fromCatalog('milo'),
  nova: fromCatalog('nova'),
};
