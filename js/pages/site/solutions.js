/** "Find the Right Solution" — two questions → a recommended path. */
import { qs, on, disposer } from '../../core/dom.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';

const RESULT_LINKS = {
  ready: (seg) => ['#/marketplace', t('cta.exploreCharacters'), seg],
  custom: (seg) => [`#/brief?segment=${seg}`, t('cta.createCustom')],
  integrate: () => ['#/request-integration', t('cta.requestIntegration')],
  unsure: () => ['#/contact', t('cta.talkToTeam')],
};

export default {
  render() {
    const opt = (group, value, label, ic) => `
      <button type="button" class="wz-option" role="radio" aria-checked="false" data-group="${group}" data-value="${value}">
        <span class="wz-option__icon">${icon(ic)}</span><span class="wz-option__text"><span class="wz-option__label">${label}</span></span>
        <span class="wz-option__check" aria-hidden="true">${icon('check')}</span>
      </button>`;
    return `
      <section class="site-section">
        <div class="container finder">
          <p class="eyebrow">${t('nav.solutions')}</p>
          <h1 class="page-hero__title">${t('solutions.title')}</h1>
          <p class="page-hero__lead">${t('solutions.description')}</p>
          <fieldset class="finder__q"><legend>${t('solutions.whoTitle')}</legend>
            <div class="wz-options wz-options--cards" role="radiogroup">
              ${opt('who', 'business', t('solutions.whoBusiness'), 'flag')}${opt('who', 'individual', t('solutions.whoIndividual'), 'smile')}
            </div></fieldset>
          <fieldset class="finder__q"><legend>${t('solutions.howTitle')}</legend>
            <div class="wz-options wz-options--cards" role="radiogroup">
              ${opt('how', 'ready', t('solutions.howReady'), 'grid')}${opt('how', 'custom', t('solutions.howCustom'), 'brief')}
              ${opt('how', 'integrate', t('solutions.howIntegrate'), 'code')}${opt('how', 'unsure', t('solutions.howUnsure'), 'compass')}
            </div></fieldset>
          <div class="finder__result" data-result aria-live="polite"></div>
        </div>
      </section>`;
  },
  mount(root) {
    const d = disposer();
    const picks = {};
    d.add(on(root, 'click', '[data-group]', (_, b) => {
      picks[b.dataset.group] = b.dataset.value;
      root.querySelectorAll(`[data-group="${b.dataset.group}"]`).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      if (!picks.how) return;
      const seg = picks.who ?? 'business';
      const [href, label] = RESULT_LINKS[picks.how](seg);
      const r = `solutions.results.${picks.how}`;
      qs('[data-result]', root).innerHTML = `
        <div class="finder__card">
          <p class="eyebrow">${t('solutions.resultTitle')}</p>
          <h2>${t(`${r}.title`)}</h2><p>${t(`${r}.text`)}</p>
          <a class="btn btn--primary btn--lg" href="${href}">${label}</a>
        </div>`;
    }));
    return () => d.run();
  },
};
