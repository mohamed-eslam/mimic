/**
 * Route table — single source of truth for routing AND navigation.
 *
 * layout: 'site' → public marketing website (header + footer)
 *         'app'  → product workspace (sidebar)
 * nav:    'site' | 'app' | 'labs' | 'footer' — where the link appears
 * section: parent nav path — child pages light up their section in the header
 *          (e.g. Custom / Integration / Packages → "Services")
 * Labels come from i18n keys, so navigation follows the active locale.
 * Pages are lazy-loaded with dynamic import().
 */
import { t } from '../i18n/index.js';
import { placeholderPage } from '../pages/site/placeholder.js';


const route = (def) => ({
  ...def,
  get label() { return t(def.labelKey); },
  get short() { return def.shortKey ? t(def.shortKey) : t(def.labelKey); },
});
const scaffold = (key, opts) => () => Promise.resolve({ default: placeholderPage(key, opts) });

export const routes = [
  /* ---------- Public website ---------- */
  route({ path: '/', layout: 'site', nav: 'site', labelKey: 'nav.home', load: () => import('../pages/site/home.js') }),
  route({ path: '/marketplace', layout: 'site', nav: 'site', labelKey: 'nav.marketplace', shortKey: 'nav.marketplaceShort', load: () => import('../pages/site/marketplace.js') }),
  route({ path: '/services', layout: 'site', nav: 'site', labelKey: 'nav.services', load: () => import('../pages/site/services.js') }),
  route({ path: '/business', layout: 'site', section: '/services', labelKey: 'nav.business', shortKey: 'nav.businessShort', load: async () => ({ default: (await import('../pages/site/segment.js')).businessPage }) }),
  route({ path: '/creators', layout: 'site', section: '/services', labelKey: 'nav.creators', shortKey: 'nav.creatorsShort', load: async () => ({ default: (await import('../pages/site/segment.js')).creatorsPage }) }),
  route({ path: '/custom', layout: 'site', section: '/services', labelKey: 'nav.custom', load: async () => ({ default: (await import('../pages/site/info-pages.js')).customPage }) }),
  route({ path: '/integration', layout: 'site', section: '/services', labelKey: 'nav.integration', shortKey: 'nav.integrationShort', load: async () => ({ default: (await import('../pages/site/info-pages.js')).integrationPage }) }),
  route({ path: '/packages', layout: 'site', section: '/services', labelKey: 'nav.packages', load: async () => ({ default: (await import('../pages/site/info-pages.js')).packagesPage }) }),
  route({ path: '/ai-generation', layout: 'site', nav: 'footer', labelKey: 'nav.aiGeneration', soon: true, load: async () => ({ default: (await import('../pages/site/info-pages.js')).aiPage }) }),
  route({ path: '/solutions', layout: 'site', nav: 'footer', section: '/services', labelKey: 'nav.solutions', load: () => import('../pages/site/solutions.js') }),
  route({ path: '/contact', layout: 'site', nav: 'footer', labelKey: 'nav.contact', load: () => import('../pages/site/contact.js') }),
  route({ path: '/brief', layout: 'site', labelKey: 'nav.brief', load: async () => ({ default: (await import('../pages/site/request.js')).briefPage }) }),
  route({ path: '/request-integration', layout: 'site', labelKey: 'nav.integrationRequest', load: async () => ({ default: (await import('../pages/site/request.js')).integrationRequestPage }) }),

  /* ---------- Product workspace ---------- */
  route({ path: '/app', layout: 'app', nav: 'app', icon: 'dashboard', labelKey: 'workspaceNav.dashboard', load: () => import('../pages/app/dashboard.js') }),
  route({ path: '/app/discovery', layout: 'app', nav: 'app', icon: 'compass', labelKey: 'workspaceNav.discovery', soon: true, load: scaffold('discovery', { layout: 'app', icon: 'compass' }) }),
  route({ path: '/app/create', layout: 'app', nav: 'app', icon: 'wand', labelKey: 'workspaceNav.creator', load: () => import('../pages/creator.js') }),
  route({ path: '/app/characters', layout: 'app', nav: 'app', icon: 'grid', labelKey: 'workspaceNav.characters', load: () => import('../pages/characters.js') }),
  route({ path: '/app/personality', layout: 'app', nav: 'app', icon: 'smile', labelKey: 'workspaceNav.personality', load: () => import('../pages/playground.js') }),
  route({ path: '/app/integration', layout: 'app', nav: 'app', icon: 'plug', labelKey: 'workspaceNav.integration', soon: true, load: scaffold('integration', { layout: 'app', icon: 'plug' }) }),
  route({ path: '/app/requests', layout: 'app', nav: 'app', icon: 'inbox', labelKey: 'workspaceNav.requests', soon: true, load: scaffold('requests', { layout: 'app', icon: 'inbox' }) }),
  route({ path: '/app/settings', layout: 'app', nav: 'app', icon: 'settings', labelKey: 'workspaceNav.settings', soon: true, load: scaffold('settings', { layout: 'app', icon: 'settings' }) }),
  route({ path: '/app/photo-booth', layout: 'app', nav: 'labs', icon: 'camera', labelKey: 'workspaceNav.photoBooth', load: () => import('../pages/photobooth.js') }),
  route({ path: '/design-system', layout: 'app', labelKey: 'nav.home', title: 'Design System', load: () => import('../pages/design-system.js') }),

  /* ---------- Legacy paths (earlier builds) ---------- */
  { path: '/library', redirect: '/marketplace' },
  { path: '/pricing', redirect: '/packages' },
  { path: '/how-it-works', redirect: '/custom' },
  { path: '/create', redirect: '/app/create' },
  { path: '/playground', redirect: '/app/personality' },
  { path: '/characters', redirect: '/app/characters' },
  { path: '/photo-booth', redirect: '/app/photo-booth' },
];

export const notFoundRoute = route({
  path: '*',
  layout: 'site',
  labelKey: 'nav.home',
  title: 'Not found',
  load: () => import('../pages/not-found.js'),
});
