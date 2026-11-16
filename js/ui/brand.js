/**
 * MIMIC wordmark — uses the supplied PNG artwork directly (no recreation in text,
 * CSS or another font; no filters; original 3:1 proportions preserved).
 *
 *   assets/mimic.png        dark wordmark + green period  → light theme
 *   assets/white_mimic.png  white wordmark + green period → dark theme / dark surfaces
 *
 * `variant: 'auto'` follows the active theme (src swapped on `theme:change`, so only the
 * needed file is downloaded). `variant: 'on-dark'` always uses the white version
 * (e.g. the footer, which is dark in both themes).
 */
import { getTheme } from './theme.js';

export const LOGO_FILES = {
  light: 'assets/mimic.png',
  dark: 'assets/white_mimic.png',
};
const INTRINSIC = { width: 2172, height: 724 }; // both files share this canvas size

const srcFor = (variant) => (variant === 'on-dark' || getTheme() === 'dark' ? LOGO_FILES.dark : LOGO_FILES.light);

/**
 * @param {{ href?: string|null, label?: string, alt?: string, variant?: 'auto'|'on-dark', size?: 'header'|'footer'|'sidebar'|'drawer' }} opts
 */
export function logo({ href = '#/', label = 'MIMIC', alt = 'MIMIC', variant = 'auto', size = 'header' } = {}) {
  const img = `<img class="logo__img logo__img--${size}" src="${srcFor(variant)}" data-logo="${variant}"
    alt="${alt}" width="${INTRINSIC.width}" height="${INTRINSIC.height}" decoding="async" ${size === 'header' ? 'fetchpriority="high"' : ''}>`;
  return href ? `<a class="logo" href="${href}" aria-label="${label}">${img}</a>` : `<span class="logo">${img}</span>`;
}

/** Swap theme-following logos when the theme changes. */
window.addEventListener('theme:change', () => {
  document.querySelectorAll('img[data-logo="auto"]').forEach((img) => {
    const next = srcFor('auto');
    if (img.getAttribute('src') !== next) img.setAttribute('src', next);
  });
});
