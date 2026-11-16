/** Content pages: Custom Design, Integration Services, Packages, AI Generation (coming soon). */
import { disposer } from '../../core/dom.js';
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { revealOnScroll } from '../../ui/reveal.js';
import { BUSINESS } from '../../config/business.js';
import { pageHero, sectionHead, packageCards, availabilityBadge, btn, slaText } from './shared.js';

const withReveal = (render) => ({
  render,
  mount(root) {
    const d = disposer();
    d.add(revealOnScroll(root));
    return () => d.run();
  },
});

export const customPage = withReveal(() => `
  ${pageHero({
    eyebrow: t('customPage.eyebrow'),
    title: t('customPage.title'),
    description: t('customPage.description'),
    actions: `${btn(t('cta.startBrief'), '#/brief', 'primary')}${btn(t('cta.talkToTeam'), '#/contact', 'secondary')}`,
    aside: `
      <div class="brief-preview">
        <p class="brief-preview__label">${availabilityBadge(BUSINESS.offerings.custom)}</p>
        <h2 class="brief-preview__title">${t('customPage.askTitle')}</h2>
        <ol role="list">${tl('customPage.ask').map((x, i) => `<li><span>${i + 1}</span>${x}</li>`).join('')}</ol>
        <p class="brief-preview__note">${t('customPage.noEssay')}</p>
      </div>`,
  })}
  <section class="site-section site-section--tinted">
    <div class="container">
      ${sectionHead(t('home.process.title'), slaText())}
      <ol class="steps-b" role="list">
        ${tl('home.process.items').map((s, i) => `<li class="step-b" data-reveal="${i}"><span class="step-b__num">${String(i + 1).padStart(2, '0')}</span><h3 class="step-b__title">${s.title}</h3><p class="step-b__text">${s.text}</p></li>`).join('')}
      </ol>
    </div>
  </section>`);

export const integrationPage = withReveal(() => {
  const p = 'integrationPage';
  const AREA_ICONS = { website: 'globe', mobile: 'layers', agent: 'sparkle', chatbot: 'chat' };
  return `
    ${pageHero({
      eyebrow: t(`${p}.eyebrow`),
      title: t(`${p}.title`),
      description: t(`${p}.description`),
      actions: `${btn(t('cta.requestIntegration'), '#/request-integration', 'primary')}${btn(t('cta.getAssets'), '#/brief?need=website', 'secondary')}`,
    })}
    <section class="site-section site-section--tight">
      <div class="container int-options">
        <article class="int-option" data-reveal>
          <span class="int-option__icon">${icon('download')}</span>
          <h2>${t(`${p}.pathA.title`)}</h2>
          <p>${t(`${p}.pathA.text`)}</p>
          <ul role="list">${tl(`${p}.pathA.items`).map((x) => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
          <a class="btn btn--secondary" href="#/marketplace">${t('cta.getAssets')}</a>
        </article>
        <article class="int-option int-option--primary" data-reveal="1">
          <span class="int-option__icon">${icon('code')}</span>
          <h2>${t(`${p}.pathB.title`)}</h2>
          <p>${t(`${p}.pathB.text`)}</p>
          <p class="int-option__hint">${t(`${p}.notSure`)}</p>
          <a class="btn btn--primary" href="#/request-integration">${t('cta.requestIntegration')}</a>
        </article>
      </div>
    </section>
    <section class="site-section site-section--tinted">
      <div class="container">
        <div class="int-areas">
          ${tl(`${p}.areas`).map((a, i) => `
            <article class="int-area" data-reveal="${i}">
              <header><span class="use-card__icon">${icon(AREA_ICONS[a.id])}</span><h3>${a.title}</h3></header>
              <ul role="list">${a.items.map((x) => `<li>${x}</li>`).join('')}</ul>
              <a class="link-arrow" href="#/request-integration?platform=${a.id === 'agent' ? 'ai-agent' : a.id}">${t('cta.requestIntegration')} ${icon('arrowRight', { className: 'flip-rtl' })}</a>
            </article>`).join('')}
        </div>
        <div class="notice notice--info int-disclaimer" data-reveal>
          ${icon('info')}<div><strong>${t(`${p}.disclaimerTitle`)}</strong><p>${t(`${p}.disclaimer`)}</p></div>
        </div>
      </div>
    </section>`;
});

export const packagesPage = withReveal(() => `
  ${pageHero({ eyebrow: t('packagesPage.eyebrow'), title: t('packagesPage.title'), description: t('packagesPage.description') })}
  <section class="container">
    ${packageCards()}
    <p class="packages__note">${icon('info', { size: 14 })} ${t('packagesPage.note')}</p>
  </section>
  <section class="site-section">
    <div class="container">
      ${sectionHead(t('packagesPage.servicesTitle'), t('packagesPage.servicesIntro'))}
      <div class="service-lines">
        ${tl('packagesPage.services').map((s, i) => `<article class="service-line" data-reveal="${i}"><h3>${s.title}</h3><p>${s.text}</p></article>`).join('')}
      </div>
      <div class="center-cta">${btn(t('cta.requestPricing'), '#/brief', 'primary')}${btn(t('cta.talkToTeam'), '#/contact', 'secondary')}</div>
    </div>
  </section>`);

export const aiPage = withReveal(() => `
  <section class="site-section">
    <div class="container soon">
      <div class="soon__copy" data-reveal>
        ${availabilityBadge(BUSINESS.offerings.aiGeneration)}
        <p class="eyebrow">${t('aiPage.eyebrow')}</p>
        <h1 class="page-hero__title">${t('aiPage.title')}</h1>
        <p class="page-hero__lead">${t('aiPage.description')}</p>
        <div class="soon__planned">
          <h2>${t('aiPage.plannedTitle')}</h2>
          <ul role="list">${tl('aiPage.planned').map((x) => `<li>${icon('sparkle')}<span>${x}</span></li>`).join('')}</ul>
        </div>
      </div>
      <aside class="soon__alt" data-reveal="1">
        <p>${t('aiPage.alternative')}</p>
        ${btn(t('cta.requestCustom'), '#/brief', 'primary')}
        ${btn(t('cta.exploreCharacters'), '#/marketplace', 'secondary')}
      </aside>
    </div>
  </section>`);
