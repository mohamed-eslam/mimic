/** Audience landing pages: For Business / For Creators. */
import { disposer } from '../../core/dom.js';
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { revealOnScroll } from '../../ui/reveal.js';
import { hydrateCharacterMedia } from '../../ui/character-media.js';
import { findListing } from '../../data/catalog.js';
import { pageHero, sectionHead, packageCards, talentStrip, btn } from './shared.js';

const CONFIG = {
  business: { segment: 'business', talent: ['nour', 'faisal', 'adam'], packages: ['essentials', 'agent', 'video'] },
  creators: { segment: 'individual', talent: ['salma', 'lina', 'karim'], packages: ['creator', 'video'] },
};

export function segmentPage(key) {
  const cfg = CONFIG[key];
  const k = `segments.${key}`;
  return {
    render() {
      return `
        ${pageHero({
          eyebrow: t(`${k}.eyebrow`),
          title: t(`${k}.title`),
          description: t(`${k}.description`),
          actions: `${btn(t(`${k}.cta`), `#/brief?segment=${cfg.segment}`, 'primary')}${key === 'business' ? btn(t('cta.exploreCharacters'), '#/marketplace', 'secondary') : btn(t('cta.talkToTeam'), '#/contact', 'secondary')}`,
          aside: talentStrip(cfg.talent.map(findListing)),
        })}
        <section class="site-section site-section--tinted">
          <div class="container">
            ${sectionHead(t(`${k}.needsTitle`))}
            <div class="needs">
              ${tl(`${k}.needs`).map((n, i) => `<article class="use-card" data-reveal="${i}"><h3 class="use-card__title">${n.title}</h3><p class="use-card__text">${n.text}</p></article>`).join('')}
            </div>
          </div>
        </section>
        ${key === 'creators' ? `
          <section class="site-section">
            <div class="container">
              <div class="likeness" data-reveal>
                <span class="likeness__icon">${icon('image')}</span>
                <div>
                  <h2 class="likeness__title">${t(`${k}.likenessTitle`)}</h2>
                  <p>${t(`${k}.likenessText`)}</p>
                  <p class="likeness__consent">${icon('check', { size: 16 })} ${t(`${k}.likenessConsent`)}</p>
                </div>
              </div>
            </div>
          </section>` : `
          <section class="site-section">
            <div class="container">
              <div class="int-cta" data-reveal>
                <div><h2 class="section-head__title">${t('home.integration.title')}</h2><p>${t('home.integration.text')}</p></div>
                ${btn(t('cta.requestIntegration'), '#/request-integration', 'primary')}
              </div>
            </div>
          </section>`}
        <section class="site-section site-section--tinted">
          <div class="container">
            ${sectionHead(t('home.packages.title'), t('home.packages.intro'))}
            ${packageCards({ only: cfg.packages })}
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
}

export const businessPage = segmentPage('business');
export const creatorsPage = segmentPage('creators');
