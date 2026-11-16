/**
 * Showcase cast — characters used ONLY in illustrative product scenes (homepage use cases).
 *
 * Milo and Nova are not marketplace listings: they are not for sale as-is, and their
 * scenes link to the custom-character request instead. Adam reuses his catalog artwork.
 * Image files keep their original names in assets/characters/ (see README there).
 */
import { findListing } from './catalog.js';

const file = (name) => `assets/characters/${encodeURIComponent(name)}`;

export const SHOWCASE = {
  adam: {
    name: findListing('adam')?.name ?? { en: 'Adam', ar: 'آدم' },
    image: findListing('adam')?.media?.image ?? null,
  },
  milo: {
    name: { en: 'Milo', ar: 'ميلو' },
    style: 'stylized-3d',
    image: file('magnific_premium-stylized-3d-egyptian-male-character_LwBXvCuswO.png'),
  },
  nova: {
    name: { en: 'Nova', ar: 'نوفا' },
    style: 'near-human',
    image: file('magnific_premium-photorealistic-nearhuman_bxT0XgK5Y2.png'),
  },
};
