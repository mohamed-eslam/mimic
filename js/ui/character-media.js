/**
 * Character media slot for realistic, image-based characters.
 *
 * Renders a clearly labeled placeholder immediately, then `hydrateCharacterMedia()`
 * swaps in real images discovered in assets/characters/<id>/.
 * Images are contained (never cropped) and anchored to the bottom so faces and
 * clothing stay visible; transparent cutouts get a theme-aware drop shadow.
 * Motion is CSS-only (float / hover) — images are never presented as able to
 * talk, blink or lip-sync.
 */
import { escapeHtml } from '../core/dom.js';
import { t, pick } from '../i18n/index.js';
import { findListing } from '../data/catalog.js';
import { resolveAssets } from '../services/asset-service.js';

let seq = 0;

/** Neutral studio-portrait placeholder (abstract bust, no facial features). */
function placeholderSVG(label) {
  const id = `ph${++seq}`;
  return `
    <svg class="cmedia__ph" viewBox="0 0 300 400" role="img" aria-label="${escapeHtml(label)}" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--media-ph-a)"/><stop offset="1" style="stop-color:var(--media-ph-b)"/>
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="128" rx="54" ry="64" fill="url(#${id}-g)"/>
      <path d="M150 204c-34 0-52 12-52 12l-6 22C42 252 22 300 18 400h264c-4-100-24-148-74-162l-6-22s-18-12-52-12z" fill="url(#${id}-g)"/>
    </svg>`;
}

const altText = (listing) => `${pick(listing.name)} — ${pick(listing.title)}`;

function imageTag(src, alt, eager = false) {
  return `<img class="cmedia__img" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="(max-width: 719px) 50vw, 320px">`;
}

/**
 * @param {object} listing  catalog entry
 * @param {{ size?: 'card'|'hero'|'detail'|'thumb', label?: boolean, src?: string, pose?: string }} [opts]
 */
export function characterMedia(listing, { size = 'card', label = true, src = null, pose = '' } = {}) {
  const inner = src ? imageTag(src, altText(listing), size === 'hero') : placeholderSVG(t('media.placeholderFor', { name: pick(listing.name) }));
  return `
    <div class="cmedia cmedia--${size} ${src ? '' : 'cmedia--placeholder'}" data-media="${escapeHtml(listing.id ?? '')}" ${pose ? `data-pose="${pose}"` : ''}>
      ${inner}
      ${!src && label ? `<span class="cmedia__tag">${t('media.placeholder')}</span>` : ''}
    </div>`;
}

/** Swap placeholders inside `root` for discovered images (main image or a pose). */
export async function hydrateCharacterMedia(root) {
  const slots = [...root.querySelectorAll('.cmedia--placeholder[data-media]')].filter((el) => el.dataset.media);
  await Promise.all(slots.map(async (slot) => {
    const listing = findListing(slot.dataset.media);
    if (!listing) return;
    const pose = slot.dataset.pose;
    const assets = await resolveAssets(listing, { full: Boolean(pose) });
    const src = pose ? assets.poses[pose] : assets.main;
    if (!src || !slot.isConnected) return;
    slot.classList.remove('cmedia--placeholder');
    slot.innerHTML = imageTag(src, altText(listing), slot.classList.contains('cmedia--hero'));
  }));
}
