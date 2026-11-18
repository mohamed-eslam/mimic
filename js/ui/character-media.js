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
import { icon } from './icons.js';
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

/** eager: above-the-fold (no lazy loading); priority: also hint the browser to fetch it first. */
function imageTag(src, alt, { eager = false, priority = false } = {}) {
  const load = eager ? `loading="eager"${priority ? ' fetchpriority="high"' : ''}` : 'loading="lazy"';
  return `<img class="cmedia__img" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" ${load} decoding="async">`;
}

/** Framing for supplied artwork: cover for full-bleed photos, contain for cutouts. */
const framing = (listing) => {
  const m = listing.media ?? {};
  return {
    cls: m.fit === 'cover' ? 'cmedia--photo' : '',
    style: m.fit === 'cover' && m.focus ? `style="--media-focus:${escapeHtml(m.focus)}"` : '',
  };
};

/**
 * Real talking-character clip layered over the portrait (`media.video`).
 * No src until ui/character-video.js decides to load it (visible, motion allowed):
 * preload="none", muted, inline, looping. Decorative — the <img> carries the alt text.
 * The detail view also gets a pause/play control (always available, even under
 * reduced motion, so visitors can opt in).
 */
function videoTag(listing, poster, size) {
  const video = listing.media?.video;
  if (!video) return '';
  const name = escapeHtml(pick(listing.name));
  const ctrl = size === 'detail'
    ? `<button type="button" class="cmedia__ctrl" data-video-toggle aria-pressed="false"
         data-label-pause="${escapeHtml(t('media.pause', { name: pick(listing.name) }))}" data-label-play="${escapeHtml(t('media.play', { name: pick(listing.name) }))}"
         aria-label="${escapeHtml(t('media.play', { name: pick(listing.name) }))}">${icon('pause', { className: 'cmedia__ctrl-pause' })}${icon('play', { className: 'cmedia__ctrl-play' })}</button>`
    : '';
  return `<video class="cmedia__video" data-src="${escapeHtml(video)}" poster="${escapeHtml(poster)}" muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1" data-character="${name}"></video>${ctrl}`;
}

/**
 * @param {object} listing  catalog entry
 * @param {{ size?: 'card'|'hero'|'detail'|'thumb', label?: boolean, src?: string, pose?: string, priority?: boolean }} [opts]
 */
export function characterMedia(listing, { size = 'card', label = true, src = null, pose = '', priority = false } = {}) {
  // Known main artwork renders immediately (no placeholder flash); poses still need their own files.
  const source = src ?? (pose ? null : listing.media?.image ?? null);
  const eager = size === 'hero' || size === 'detail';
  const inner = source
    ? imageTag(source, altText(listing), { eager, priority }) + (!pose && size !== 'thumb' ? videoTag(listing, source, size) : '')
    : placeholderSVG(t('media.placeholderFor', { name: pick(listing.name) }));
  const { cls, style } = source ? framing(listing) : { cls: '', style: '' };
  return `
    <div class="cmedia cmedia--${size} ${cls} ${source ? '' : 'cmedia--placeholder'}" data-media="${escapeHtml(listing.id ?? '')}" ${pose ? `data-pose="${pose}"` : ''} ${!pose && listing.media?.video && source ? 'data-has-video' : ''} ${style}>
      ${inner}
      ${!source && label ? `<span class="cmedia__tag">${t('media.placeholder')}</span>` : ''}
    </div>`;
}

/** Site-wide pause/play for autoplaying character motion (WCAG 2.2.2). Wired in ui/character-video.js. */
export const motionToggle = (cls = '') => `
  <button type="button" class="motion-toggle ${cls}" data-motion-toggle aria-pressed="true">
    ${icon('pause', { className: 'motion-toggle__pause' })}${icon('play', { className: 'motion-toggle__play' })}
    <span data-motion-label>${t('media.pauseAll')}</span>
  </button>`;

/** If supplied artwork fails to load, fall back to the labeled placeholder instead of a broken image. */
function guardImages(root) {
  root.querySelectorAll('.cmedia:not(.cmedia--placeholder) .cmedia__img').forEach((img) => {
    const slot = img.closest('.cmedia');
    const fail = () => {
      const listing = findListing(slot.dataset.media);
      if (!listing || !slot.isConnected) return;
      slot.classList.remove('cmedia--photo');
      slot.classList.add('cmedia--placeholder');
      slot.innerHTML = placeholderSVG(t('media.placeholderFor', { name: pick(listing.name) }));
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });
}

/** Swap placeholders inside `root` for discovered images (main image or a pose). */
export async function hydrateCharacterMedia(root) {
  guardImages(root);
  const slots = [...root.querySelectorAll('.cmedia--placeholder[data-media]')].filter((el) => el.dataset.media);
  await Promise.all(slots.map(async (slot) => {
    const listing = findListing(slot.dataset.media);
    if (!listing) return;
    const pose = slot.dataset.pose;
    const assets = await resolveAssets(listing, { full: Boolean(pose) });
    const src = pose ? assets.poses[pose] : assets.main;
    if (!src || !slot.isConnected) return;
    slot.classList.remove('cmedia--placeholder');
    if (!pose) {
      const { cls, style } = framing(listing);
      if (cls) slot.classList.add(cls);
      if (style) slot.style.setProperty('--media-focus', listing.media.focus);
    }
    slot.innerHTML = imageTag(src, altText(listing), { eager: slot.classList.contains('cmedia--hero') });
  }));
}
