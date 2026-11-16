/** Workspace dashboard — entry point to the tools that work in this demo. */
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { characters } from '../../services/character-service.js';
import { qs } from '../../core/dom.js';

const TOOL_ICONS = { '/app/create': 'wand', '/app/characters': 'grid', '/app/personality': 'smile' };
const UPCOMING = [
  ['/app/discovery', 'discovery', 'compass'],
  ['/app/integration', 'integration', 'plug'],
  ['/app/requests', 'requests', 'inbox'],
  ['/app/settings', 'settings', 'settings'],
];

export default {
  render() {
    const tools = tl('dashboard.tools');
    return `
      <header class="page-header">
        <div class="page-header__text">
          <span class="eyebrow">${icon('dashboard', { size: 14 })} ${t('workspaceNav.dashboard')}</span>
          <h1 class="page-header__title">${t('dashboard.welcome')}</h1>
          <p class="page-header__desc">${t('dashboard.intro')}</p>
        </div>
        <div class="page-header__actions"><a class="btn btn--primary" href="#/app/create?new=1">${icon('plus')}<span>${t('cta.createCharacter')}</span></a></div>
      </header>
      <div class="dash-grid">
        ${tools.map((tool) => `
          <a class="card card--interactive dash-tool" href="#${tool.route}">
            <span class="icon-bubble">${icon(TOOL_ICONS[tool.route])}</span>
            <h2 class="card__title">${tool.title}</h2>
            <p class="card__text">${tool.text}</p>
            ${tool.route === '/app/characters' ? '<span class="badge badge--neutral" data-char-count>…</span>' : ''}
          </a>`).join('')}
      </div>
      <h2 class="dash-subtitle">${t('dashboard.upcoming')}</h2>
      <div class="dash-upcoming">
        ${UPCOMING.map(([href, key, ic]) => `
          <a class="dash-upcoming__item" href="#${href}">${icon(ic)}<span>${t(`workspaceNav.${key}`)}</span><span class="badge badge--outline">${t('status.comingSoon')}</span></a>`).join('')}
      </div>`;
  },
  mount(root) {
    characters.count().then((n) => {
      const el = qs('[data-char-count]', root);
      if (el) el.textContent = n === 1 ? '1 saved' : `${n} saved`;
    });
  },
};
