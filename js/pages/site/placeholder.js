/**
 * Scaffold for pages planned in later phases. Honest by design: states that
 * the page is not built yet and lists what it will contain.
 *
 *   placeholderPage('pricing', { layout: 'site' })
 */
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';

export function placeholderPage(key, { layout = 'site', icon: ic = 'sparkle', primary } = {}) {
  return {
    render() {
      const sections = tl(`pages.${key}.sections`) ?? [];
      const backHref = layout === 'app' ? '#/app' : '#/';
      const backLabel = layout === 'app' ? t('workspaceNav.dashboard') : t('placeholder.backHome');
      return `
        <section class="${layout === 'app' ? '' : 'site-section'} scaffold">
          <div class="${layout === 'app' ? '' : 'container'} scaffold__inner">
            <span class="scaffold__icon">${icon(ic)}</span>
            <span class="badge badge--outline">${t('status.comingSoon')}</span>
            <h1 class="scaffold__title">${t(`pages.${key}.title`)}</h1>
            <p class="scaffold__lead">${t(`pages.${key}.description`)}</p>
            <div class="scaffold__plan">
              <h2 class="scaffold__plan-title">${t('placeholder.planned')}</h2>
              <ul role="list">${sections.map((s) => `<li>${icon('check')}<span>${s}</span></li>`).join('')}</ul>
              <p class="scaffold__note">${t('placeholder.inProgress')}</p>
            </div>
            <div class="scaffold__actions">
              ${primary ? `<a class="btn btn--primary" href="${primary.href}">${primary.label}</a>` : ''}
              <a class="btn btn--secondary" href="${backHref}">${backLabel}</a>
            </div>
          </div>
        </section>`;
    },
  };
}
