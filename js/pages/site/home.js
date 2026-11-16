/**
 * Marketing homepage — answers: who it's for, what customers get, how they get
 * a character, what it's for, what's available now vs coming soon, how to contact us.
 */
import { disposer } from '../../core/dom.js';
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { revealOnScroll } from '../../ui/reveal.js';
import { hydrateCharacterMedia } from '../../ui/character-media.js';
import { BUSINESS } from '../../config/business.js';
import { findListing } from '../../data/catalog.js';
import { btn, sectionHead, availabilityBadge, packageCards, talentStrip, slaText } from './shared.js';

const OFFER_ICONS = { realistic: 'smile', ready: 'grid', custom: 'brief', avatar: 'image', agent: 'sparkle', campaign: 'megaphone', integration: 'code' };
const WAY_LINKS = { marketplace: '#/marketplace', custom: '#/brief', ai: '#/ai-generation' };
const WAY_STATUS = { marketplace: BUSINESS.offerings.marketplace, custom: BUSINESS.offerings.custom, ai: BUSINESS.offerings.aiGeneration };
const WAY_ICONS = { marketplace: 'grid', custom: 'brief', ai: 'sparkle' };

export default {
  render() {
    const hero = ['faisal', 'reem', 'karim'].map(findListing);
    const offer = tl('home.offer.items');
    const ways = tl('home.ways.items');
    const process = tl('home.process.items');

    return `
      <!-- Hero -->
      <section class="site-section hero-b" aria-labelledby="hero-title">
        <div class="container hero-b__grid">
          <div class="hero-b__copy" data-reveal>
            <p class="eyebrow">${t('home.hero.eyebrow')}</p>
            <h1 id="hero-title" class="hero-b__title">${t('home.hero.title')}</h1>
            <p class="hero-b__lead">${t('home.hero.description')}</p>
            <div class="hero-b__actions">
              ${btn(t('cta.exploreCharacters'), '#/marketplace', 'primary')}
              ${btn(t('cta.createCustom'), '#/brief', 'secondary')}
            </div>
            <a class="link-arrow" href="#/contact">${t('cta.talkToTeam')} ${icon('arrowRight', { className: 'flip-rtl' })}</a>
          </div>
          <figure class="hero-talent" data-reveal="1">
            ${talentStrip(hero)}
            <figcaption class="hero-talent__note">${icon('info', { size: 14 })} ${t('home.hero.visualNote')}</figcaption>
          </figure>
        </div>
      </section>

      <!-- Who it's for -->
      <section class="site-section site-section--tight" aria-labelledby="aud-title">
        <div class="container">
          ${sectionHead(t('home.audiences.title'), '', 'aud-title')}
          <div class="audiences">
            ${['business', 'creators'].map((k, i) => `
              <a class="audience-card audience-card--${k}" href="#/${k}" data-reveal="${i}">
                <span class="audience-card__icon">${icon(k === 'business' ? 'flag' : 'smile')}</span>
                <h3 class="audience-card__title">${t(`home.audiences.${k}.title`)}</h3>
                <p class="audience-card__text">${t(`home.audiences.${k}.text`)}</p>
                <span class="link-arrow">${t(`home.audiences.${k}.cta`)} ${icon('arrowRight', { className: 'flip-rtl' })}</span>
              </a>`).join('')}
          </div>
        </div>
      </section>

      <!-- What we provide -->
      <section class="site-section site-section--tinted" aria-labelledby="offer-title">
        <div class="container">
          ${sectionHead(t('home.offer.title'), '', 'offer-title')}
          <div class="offer-grid">
            ${offer.map((o, i) => `
              <article class="offer-item" data-reveal="${i % 4}">
                <span class="offer-item__icon">${icon(OFFER_ICONS[o.id])}</span>
                <div><h3>${o.title}</h3><p>${o.text}</p></div>
              </article>`).join('')}
          </div>
        </div>
      </section>

      <!-- Three ways -->
      <section class="site-section" aria-labelledby="ways-title">
        <div class="container">
          ${sectionHead(t('home.ways.title'), t('home.ways.intro'), 'ways-title')}
          <div class="ways">
            ${ways.map((w, i) => `
              <a class="way-card way-card--${w.id} ${WAY_STATUS[w.id] === 'coming-soon' ? 'is-soon' : ''}" href="${WAY_LINKS[w.id]}" data-reveal="${i}" data-way="${w.id}">
                <span class="way-card__icon">${icon(WAY_ICONS[w.id])}</span>
                ${availabilityBadge(WAY_STATUS[w.id])}
                <h3 class="way-card__title">${w.title}</h3>
                <p class="way-card__text">${w.text}</p>
                <span class="link-arrow">${w.cta} ${icon('arrowRight', { className: 'flip-rtl' })}</span>
              </a>`).join('')}
          </div>
        </div>
      </section>

      <!-- Integration -->
      <section class="site-section site-section--dark" aria-labelledby="int-title">
        <div class="container">
          <div class="int-band">
            <div class="int-band__copy" data-reveal>
              <h2 id="int-title" class="section-head__title">${t('home.integration.title')}</h2>
              <p class="int-band__text">${t('home.integration.text')}</p>
            </div>
            <div class="int-paths">
              <a class="int-path" href="#/integration" data-reveal="1">
                <span class="int-path__icon">${icon('download')}</span>
                <h3>${t('home.integration.assetsTitle')}</h3>
                <p>${t('home.integration.assetsText')}</p>
                <span class="link-arrow">${t('cta.getAssets')} ${icon('arrowRight', { className: 'flip-rtl' })}</span>
              </a>
              <a class="int-path int-path--primary" href="#/request-integration" data-reveal="2">
                <span class="int-path__icon">${icon('code')}</span>
                <h3>${t('home.integration.integrateTitle')}</h3>
                <p>${t('home.integration.integrateText')}</p>
                <span class="link-arrow">${t('cta.requestIntegration')} ${icon('arrowRight', { className: 'flip-rtl' })}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Packages -->
      <section class="site-section" aria-labelledby="pkg-title">
        <div class="container">
          ${sectionHead(t('home.packages.title'), t('home.packages.intro'), 'pkg-title')}
          ${packageCards({ compact: true })}
          <div class="center-cta"><a class="btn btn--secondary" href="#/packages">${t('cta.viewPackages')}</a></div>
        </div>
      </section>

      <!-- Uses -->
      <section class="site-section site-section--tinted" aria-labelledby="uses-title">
        <div class="container">
          ${sectionHead(t('home.uses.title'), '', 'uses-title')}
          <div class="uses-split">
            ${['business', 'creators'].map((k, i) => `
              <div class="uses-col" data-reveal="${i}">
                <h3>${t(`home.uses.${k}Title`)}</h3>
                <ul role="list">${tl(`home.uses.${k}`).map((u) => `<li>${icon('check')}<span>${u}</span></li>`).join('')}</ul>
              </div>`).join('')}
          </div>
        </div>
      </section>

      <!-- Process -->
      <section class="site-section" aria-labelledby="proc-title">
        <div class="container">
          ${sectionHead(t('home.process.title'), slaText(), 'proc-title')}
          <ol class="steps-b" role="list">
            ${process.map((s, i) => `
              <li class="step-b" data-reveal="${i}">
                <span class="step-b__num">${String(i + 1).padStart(2, '0')}</span>
                <h3 class="step-b__title">${s.title}</h3>
                <p class="step-b__text">${s.text}</p>
              </li>`).join('')}
          </ol>
        </div>
      </section>

      <!-- Availability -->
      <section class="site-section site-section--tinted" aria-labelledby="avail-title">
        <div class="container">
          ${sectionHead(t('home.availability.title'), '', 'avail-title')}
          <div class="avail">
            <div class="avail__col" data-reveal>
              <h3>${availabilityBadge('available')}</h3>
              <ul role="list">${tl('home.availability.nowItems').map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
            </div>
            <div class="avail__col avail__col--soon" data-reveal="1">
              <h3>${availabilityBadge('coming-soon')}</h3>
              <ul role="list">${tl('home.availability.soonItems').map((x) => `<li>${icon('sparkle')}<span>${x}</span></li>`).join('')}</ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="site-section final-cta" aria-labelledby="final-title">
        <div class="container final-cta__inner" data-reveal>
          <h2 id="final-title" class="final-cta__title">${t('home.final.title')}</h2>
          <p class="section-head__intro">${t('home.final.text')}</p>
          <div class="hero-b__actions">
            ${btn(t('cta.createCustom'), '#/brief', 'primary')}
            ${btn(t('cta.requestIntegration'), '#/request-integration', 'secondary')}
            ${btn(t('cta.talkToTeam'), '#/contact', 'ghost')}
          </div>
        </div>
      </section>`;
  },

  mount(root) {
    const d = disposer();
    d.add(revealOnScroll(root));
    hydrateCharacterMedia(root);
    return () => d.run();
  },
};
