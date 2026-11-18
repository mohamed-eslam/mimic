/**
 * Services hub (/services) — the "Services" entry of the primary navigation.
 * Built only from existing copy and components: the three service cards from the
 * homepage ("What we offer") plus links to the existing service pages.
 */
import { disposer } from '../../core/dom.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { revealOnScroll } from '../../ui/reveal.js';
import { pageHero } from './shared.js';
import { visualCard, readyArt, designArt, integrateArt } from './product-scenes.js';

const arrow = () => icon('arrowRight', { className: 'flip-rtl' });

/* Existing pages reachable from here (all routes already exist). */
const MORE = [
  { path: '/packages', key: 'nav.packages', icon: 'layers' },
  { path: '/business', key: 'nav.business', icon: 'flag' },
  { path: '/creators', key: 'nav.creators', icon: 'smile' },
  { path: '/solutions', key: 'nav.solutions', icon: 'compass' },
];

export default {
  render() {
    const o = (k) => t(`home.offerCards.${k}`);
    const cards = [
      { id: 'ready', visual: readyArt(), art: true, href: '#/marketplace', cta: t('cta.exploreCharacters') },
      { id: 'custom', visual: designArt(), art: true, href: '#/custom', cta: t('nav.custom') },
      { id: 'integration', visual: integrateArt(), art: true, href: '#/integration', cta: t('nav.integration') },
    ].map((c) => ({
      ...c,
      title: o(`${c.id}.title`),
      text: o(`${c.id}.text`),
      label: o(c.id === 'custom' ? 'custom.abstractLabel' : `${c.id}.label`), // this page keeps the abstract face
      cta: `<a class="link-arrow vcard__cta" href="${c.href}">${c.cta} ${arrow()}</a>`,
    }));
    return `
      ${pageHero({ eyebrow: t('nav.services'), title: o('title'), description: t('home.ways.intro') })}
      <section class="container services" aria-label="${t('nav.services')}">
        <div class="vcard-grid">${cards.map(visualCard).join('')}</div>
        <nav class="services-more" aria-label="${t('footer.solutions')}" data-reveal>
          <ul role="list">
            ${MORE.map((m) => `<li><a class="services-more__link" href="#${m.path}"><span class="services-more__ic">${icon(m.icon)}</span><span>${t(m.key)}</span>${arrow()}</a></li>`).join('')}
          </ul>
        </nav>
      </section>`;
  },

  mount(root) {
    const d = disposer();
    d.add(revealOnScroll(root));
    return () => d.run();
  },
};
