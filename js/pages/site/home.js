/**
 * Marketing homepage — five sections, visual-first:
 *   01 Hero · 02 What we offer · 03 Available now / coming soon
 *   04 Characters in action (scroll story) · 05 Character showcase + final CTA
 *
 * Inner pages, catalog data and older homepage copy are untouched; the homepage
 * simply no longer renders the earlier sections (audiences, ways, packages, uses…).
 */
import { disposer } from '../../core/dom.js';
import { t, tl, pick } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { revealOnScroll } from '../../ui/reveal.js';
import { mountScrollStory } from '../../ui/scroll-story.js';
import { characterMedia, hydrateCharacterMedia } from '../../ui/character-media.js';
import { BUSINESS } from '../../config/business.js';
import { findListing } from '../../data/catalog.js';
import { btn, sectionHead, availabilityBadge } from './shared.js';
import {
  visualCard, sceneFrame, catalogScene, briefScene, integrationScene, STORY_CHAPTERS,
} from './product-scenes.js';

/* Hero: three verified portraits, centre one is the focal point. */
const HERO_CAST = ['reem', 'adam', 'lina'];
const FOCAL = 1;
/* Showcase: four other marketplace characters (no repeats with the hero). */
const SHOWCASE_CAST = ['faisal', 'karim', 'salma', 'omar'];

const arrow = () => icon('arrowRight', { className: 'flip-rtl' });
const cast = (ids) => ids.map(findListing).filter(Boolean);

/* ---------- 01 · Hero ---------- */
function hero() {
  const people = cast(HERO_CAST);
  return `
    <section class="site-section hero-b hero-c" aria-labelledby="hero-title">
      <div class="container hero-c__inner">
        <div class="hero-c__copy" data-reveal>
          <p class="eyebrow hero-c__eyebrow"><span class="hero-c__dot" aria-hidden="true"></span>${t('home.hero.eyebrow')}</p>
          <h1 id="hero-title" class="hero-b__title">${t('home.hero.title')}</h1>
          <p class="hero-b__lead">${t('home.hero.description')}</p>
          <div class="hero-b__actions">
            <a class="btn btn--primary btn--lg" href="#/marketplace"><span>${t('cta.exploreCharacters')}</span>${icon('arrowRight', { className: 'flip-rtl btn__arrow' })}</a>
            ${btn(t('cta.createCustom'), '#/brief', 'secondary')}
          </div>
        </div>
        <div class="hero-stage" data-reveal="1">
          <div class="hero-stage__cast">
            ${people.map((l, i) => `
              <figure class="cast-card ${i === FOCAL ? 'is-focal' : ''}">
                ${characterMedia(l, { size: 'hero', label: i === FOCAL, priority: i === FOCAL })}
                <figcaption class="cast-card__cap"><strong>${pick(l.name)}</strong><span>${pick(l.title)}</span></figcaption>
              </figure>`).join('')}
          </div>
        </div>
        ${people.some((l) => !l.media?.image) ? `<p class="hero-talent__note hero-c__note">${icon('info', { size: 14 })} ${t('home.hero.visualNote')}</p>` : ''}
      </div>
    </section>`;
}

/* ---------- 02 · What we offer ---------- */
function offer() {
  const o = (k) => t(`home.offerCards.${k}`);
  const cards = [
    { id: 'ready', visual: catalogScene(), href: '#/marketplace', cta: t('cta.exploreCharacters') },
    { id: 'custom', visual: briefScene(), href: '#/brief', cta: t('cta.createCustom') },
    { id: 'integration', visual: integrationScene(), href: '#/request-integration', cta: t('cta.requestIntegration') },
  ].map((c) => ({
    ...c,
    title: o(`${c.id}.title`),
    text: o(`${c.id}.text`),
    label: o(`${c.id}.label`),
    cta: `<a class="link-arrow vcard__cta" href="${c.href}">${c.cta} ${arrow()}</a>`,
  }));
  return `
    <section class="site-section home-offer" aria-labelledby="offer-title">
      <div class="container">
        ${sectionHead(o('title'), '', 'offer-title')}
        <div class="vcard-grid">${cards.map(visualCard).join('')}</div>
      </div>
    </section>`;
}

/* ---------- 03 · Available now / coming soon ---------- */
function status() {
  const soonLive = BUSINESS.offerings.aiGeneration === 'available'; // never claim it before it is
  return `
    <section class="site-section site-section--tight home-status" aria-labelledby="status-title">
      <div class="container">
        <div class="status-split" data-reveal>
          <div class="status-split__now">
            ${availabilityBadge('available')}
            <h2 id="status-title" class="status-split__title">${t('home.availability.title')}</h2>
            <ul class="status-split__list" role="list">
              ${tl('home.status.now').map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}
            </ul>
          </div>
          <div class="status-split__soon">
            ${availabilityBadge(soonLive ? 'available' : 'coming-soon')}
            <h3 class="status-split__soon-title">${icon('sparkle')}<span>${t('home.status.soon')}</span></h3>
            <p>${t('home.status.soonText')}</p>
            <a class="link-arrow" href="#/ai-generation">${tl('home.ways.items')[2].cta} ${arrow()}</a>
          </div>
        </div>
      </div>
    </section>`;
}

/* ---------- 04 · Characters in action (scroll story) ---------- */
function story() {
  const s = (k) => t(`home.story.${k}`);
  return `
    <section class="site-section home-story" aria-labelledby="story-title">
      <div class="container">
        ${sectionHead(s('title'), s('intro'), 'story-title')}
        <div class="story" data-story>
          <div class="story__stage" data-story-stage>
            <div class="story__sticky">
              ${STORY_CHAPTERS.map((c) => `
                <div class="story__scene" data-scene="${c.id}">${sceneFrame(s(`${c.key}.label`), c.scene(), 'sc-visual--stage')}</div>`).join('')}
            </div>
          </div>
          <ol class="story__chapters" role="list">
            ${STORY_CHAPTERS.map((c, i) => `
              <li class="story__chapter" data-chapter="${c.id}" data-reveal>
                <div class="story__visual">${sceneFrame(s(`${c.key}.label`), c.scene())}</div>
                <div class="story__copy">
                  <span class="story__kicker"><span class="story__num">${String(i + 1).padStart(2, '0')}</span>${s(`${c.key}.kicker`)}</span>
                  <h3 class="story__title">${s(`${c.key}.title`)}</h3>
                  <p class="story__text">${s(`${c.key}.text`)}</p>
                </div>
              </li>`).join('')}
          </ol>
        </div>
        <p class="story__note" data-reveal>${icon('info', { size: 14 })}<span>${s('note')}</span>
          <a class="link-arrow" href="#/request-integration">${t('cta.requestIntegration')} ${arrow()}</a></p>
      </div>
    </section>`;
}

/* ---------- 05 · Showcase + final CTA ---------- */
function showcase() {
  const people = cast(SHOWCASE_CAST);
  return `
    <section class="site-section home-showcase" aria-labelledby="showcase-title">
      <div class="container">
        ${sectionHead(t('home.showcase.title'), t('home.showcase.intro'), 'showcase-title')}
        <ul class="char-row" role="list">
          ${people.map((l, i) => `
            <li class="char-tile" data-reveal="${i}">
              <a class="char-tile__link" href="#/marketplace?character=${l.id}">
                ${characterMedia(l, { size: 'card' })}
                <span class="char-tile__name">${pick(l.name)}</span>
                <span class="char-tile__type">${pick(l.title)}</span>
              </a>
            </li>`).join('')}
        </ul>
        <div class="center-cta">${btn(t('home.showcase.all'), '#/marketplace', 'secondary')}</div>

        <div class="closing" data-reveal>
          <h2 class="closing__title">${t('home.closing.title')}</h2>
          <p class="closing__text">${t('home.closing.text')}</p>
          ${btn(t('cta.createCustom'), '#/brief', 'primary')}
        </div>
      </div>
    </section>`;
}

export default {
  render() {
    return hero() + offer() + status() + story() + showcase();
  },

  mount(root) {
    const d = disposer();
    d.add(revealOnScroll(root));
    d.add(mountScrollStory(root));
    hydrateCharacterMedia(root);
    return () => d.run();
  },
};
