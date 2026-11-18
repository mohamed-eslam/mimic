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
import { mountArcCarousel } from '../../ui/arc-carousel.js';
import { characterMedia, hydrateCharacterMedia, motionToggle } from '../../ui/character-media.js';
import { BUSINESS } from '../../config/business.js';
import { findListing } from '../../data/catalog.js';
import { btn, sectionHead, availabilityBadge } from './shared.js';
import {
  visualCard, sceneFrame, cardImage, STORY_CHAPTERS,
} from './product-scenes.js';

/* Hero arc: every catalog character; index 5 starts in the centre (Reem). */
const HERO_CAST = ['lina', 'faisal', 'nova', 'salma', 'milo', 'reem', 'karim', 'nour', 'omar', 'adam'];
/* Showcase: four other characters (no repeats with the hero); Milo has a clip too. */
const SHOWCASE_CAST = ['milo', 'adam', 'lina', 'karim'];

const art = (file) => `assets/characters/${encodeURIComponent(file)}`;  // supplied images (original filenames)
const arrow = () => icon('arrowRight', { className: 'flip-rtl' });
const cast = (ids) => ids.map(findListing).filter(Boolean);

/* ---------- 01 · Hero ---------- */
function hero() {
  const people = cast(HERO_CAST);
  return `
    <section class="site-section hero-b hero-c" aria-labelledby="hero-title">
      <div class="container hero-c__inner">
        <div class="hero-c__copy" data-reveal>
          <p class="eyebrow eyebrow--pill">${t('home.hero.eyebrow')}</p>
          <h1 id="hero-title" class="hero-b__title">${t('home.hero.title')}</h1>
          <p class="hero-b__lead">${t('home.hero.description')}</p>
          <div class="hero-b__actions">
            <a class="btn btn--primary btn--lg" href="#/marketplace"><span>${t('cta.exploreCharacters')}</span>${icon('arrowRight', { className: 'flip-rtl btn__arrow' })}</a>
            ${btn(t('cta.createCustom'), '#/brief', 'secondary')}
          </div>
        </div>
        ${people.some((l) => !l.media?.image) ? `<p class="hero-talent__note hero-c__note">${icon('info', { size: 14 })} ${t('home.hero.visualNote')}</p>` : ''}
      </div>
      <div class="arc" data-arc data-reveal="1" role="group" aria-roledescription="carousel" aria-label="${t('home.hero.castLabel')}">
        <div class="arc__track" data-arc-track>
          ${people.map((l) => `
            <a class="arc__card" data-arc-card href="#/marketplace?character=${l.id}" draggable="false">
              ${characterMedia(l, { size: 'hero', label: false })}
              <span class="arc__label">${l.media?.video ? `<span class="arc__play" aria-hidden="true">${icon('play', { size: 14 })}</span>` : ''}<span>${pick(l.name)}</span></span>
            </a>`).join('')}
        </div>
      </div>
      <div class="container arc-controls">
        <button type="button" class="arc__toggle" data-arc-toggle aria-pressed="false" aria-label="${t('media.pauseCarousel')}">${icon('pause', { className: 'arc__toggle-pause' })}${icon('play', { className: 'arc__toggle-play' })}</button>
      </div>
    </section>`;
}

/* ---------- 02 · What we offer ---------- */
function offer() {
  const o = (k) => t(`home.offerCards.${k}`);
  const cards = [
    // Supplied artwork (assets/characters/; note the third file is named card-3.png)
    { id: 'ready', visual: cardImage(art('card1.png'), 1376, 768), photo: true, href: '#/marketplace', cta: t('cta.exploreCharacters') },
    { id: 'custom', visual: cardImage(art('card2.png'), 1376, 768), photo: true, href: '#/brief', cta: t('cta.createCustom') },
    { id: 'integration', visual: cardImage(art('card-3.png'), 1376, 768), photo: true, href: '#/request-integration', cta: t('cta.requestIntegration') },
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

/* ---------- 03 · Available now / coming next ---------- */
/**
 * Artwork for the two cards (supplied PNGs, original filenames kept; ~16:9, white background):
 *   Available Now → assets/characters/available.png     (three sculptural heads on stands)
 *   Coming Soon   → assets/characters/comming soon.png  (one head split into material layers)
 * White backgrounds melt into the card in light theme (multiply); framed panel in dark (css/home.css).
 * If a file is missing its container stays a clean reserved surface (no broken image).
 */
const STATUS_ART = {
  now: { src: art('available.png'), w: 2560, h: 1440 },
  soon: { src: art('comming soon.png'), w: 1376, h: 768 },
};

function statusCard({ id, badge, title, text, cta, artLabel, image }) {
  return `
    <article class="ed-card ed-card--${id}" data-reveal="${id === 'soon' ? 1 : 0}">
      <div class="ed-card__body">
        ${badge}
        <h3 class="ed-card__title">${title}</h3>
        <p class="ed-card__text">${text}</p>
        ${cta ?? ''}
      </div>
      <div class="ed-card__art" data-art-slot>
        <img class="ed-card__render" src="${image.src}" alt="${artLabel}" width="${image.w}" height="${image.h}" loading="lazy" decoding="async">
      </div>
    </article>`;
}

function status() {
  const c = (k) => t(`home.statusCards.${k}`);
  const soonLive = BUSINESS.offerings.aiGeneration === 'available'; // never claim it before it is
  return `
    <section class="site-section home-status" aria-labelledby="status-title">
      <div class="container">
        <header class="section-head" data-reveal>
          <h2 class="section-head__title" id="status-title">${c('title')}</h2>
          <p class="section-head__intro">${c('intro')}</p>
        </header>
        <div class="ed-grid">
          ${statusCard({
            id: 'now',
            badge: availabilityBadge('available'),
            title: c('nowTitle'), text: c('nowText'),
            cta: `<a class="link-arrow ed-card__cta" href="#/marketplace">${t('cta.exploreCharacters')} ${arrow()}</a>`,
            artLabel: c('nowArt'), image: STATUS_ART.now,
          })}
          ${statusCard({
            id: 'soon',
            badge: availabilityBadge(soonLive ? 'available' : 'coming-soon'),
            title: c('soonTitle'), text: c('soonText'),
            // A real information page exists (/ai-generation) — a quiet link, not a "start" action.
            cta: `<a class="link-arrow ed-card__cta" href="#/ai-generation">${tl('home.ways.items')[2].cta} ${arrow()}</a>`,
            artLabel: c('soonArt'), image: STATUS_ART.soon,
          })}
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
        <div class="center-cta">${btn(t('home.showcase.all'), '#/marketplace', 'secondary')}${people.some((l) => l.media?.video) ? motionToggle() : ''}</div>

        <div class="closing" data-reveal>
          <div class="closing__body">
            <h2 class="closing__title">${t('home.closing.title')}</h2>
            <p class="closing__text">${t('home.closing.text')}</p>
            ${btn(t('cta.requestCustom'), '#/brief', 'primary')}
          </div>
          <!-- Decorative artwork: assets/characters/create.png (2560×1440, white studio backdrop) -->
          <div class="closing__art">
            <img class="closing__img" src="${art('create.png')}" alt="" width="2560" height="1440" loading="lazy" decoding="async">
          </div>
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
    d.add(mountArcCarousel(root));
    root.querySelectorAll('[data-art-slot] img').forEach((img) => {
      const miss = () => img.closest('[data-art-slot]').classList.add('is-missing');
      if (img.complete && !img.naturalWidth) miss(); else img.addEventListener('error', miss, { once: true });
    });
    hydrateCharacterMedia(root);
    return () => d.run();
  },
};
