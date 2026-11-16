/** Building blocks shared by marketing pages. */
import { t, tl, pick } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { BUSINESS } from '../../config/business.js';
import { characterMedia } from '../../ui/character-media.js';

const BADGES = {
  available: ['badge--success', 'status.availableNow'],
  'on-request': ['badge--neutral', 'status.onRequest'],
  'coming-soon': ['badge--soon', 'status.comingSoon'],
};

export function availabilityBadge(status) {
  const [cls, key] = BADGES[status] ?? BADGES['on-request'];
  return `<span class="badge ${cls}" data-availability="${status}">${t(key)}</span>`;
}

export const btn = (label, href, variant = 'primary', size = 'lg', extra = '') =>
  `<a class="btn btn--${variant} ${size ? `btn--${size}` : ''}" href="${href}" ${extra}><span>${label}</span></a>`;

export const sectionHead = (title, intro = '', id = '') => `
  <header class="section-head" data-reveal>
    <h2 class="section-head__title" ${id ? `id="${id}"` : ''}>${title}</h2>
    ${intro ? `<p class="section-head__intro">${intro}</p>` : ''}
  </header>`;

export const pageHero = ({ eyebrow, title, description, actions = '', aside = '' }) => `
  <section class="site-section page-hero ${aside ? 'page-hero--split' : ''}">
    <div class="container page-hero__grid">
      <div class="page-hero__copy" data-reveal>
        <p class="eyebrow">${eyebrow}</p>
        <h1 class="page-hero__title">${title}</h1>
        <p class="page-hero__lead">${description}</p>
        ${actions ? `<div class="hero-b__actions">${actions}</div>` : ''}
      </div>
      ${aside ? `<div class="page-hero__aside" data-reveal="1">${aside}</div>` : ''}
    </div>
  </section>`;

/** Package cards with availability + quote CTA (no prices). */
export function packageCards({ only, compact = false } = {}) {
  const items = tl('packagesPage.items').filter((p) => !only || only.includes(p.id));
  return `
    <div class="packages ${compact ? 'packages--compact' : ''}">
      ${items.map((p, i) => `
        <article class="package-card" data-package="${p.id}" data-reveal="${i % 4}">
          <header class="package-card__head">
            <h3 class="package-card__title">${p.title}</h3>
            ${availabilityBadge(BUSINESS.packages[p.id])}
          </header>
          <p class="package-card__best"><span>${t('packagesPage.bestFor')}:</span> ${p.bestFor}</p>
          <ul class="package-card__list" role="list">${p.includes.map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
          <a class="btn btn--secondary btn--block" href="#/brief?package=${p.id}">${t('cta.getQuote')}</a>
        </article>`).join('')}
    </div>`;
}

/** Editorial row of talent portraits (placeholders until artwork exists). */
export function talentStrip(listings) {
  return `
    <div class="talent-strip">
      ${listings.map((l, i) => `
        <figure class="talent-strip__item talent-strip__item--${i}">
          ${characterMedia(l, { size: 'hero', label: i === 1 })}
          <figcaption><strong>${pick(l.name)}</strong><span>${pick(l.title)}</span></figcaption>
        </figure>`).join('')}
    </div>`;
}

export const slaText = () =>
  BUSINESS.responseHours && BUSINESS.submission.endpoint
    ? t('home.process.responseWithSla', { hours: BUSINESS.responseHours })
    : t('home.process.responseNoSla');
