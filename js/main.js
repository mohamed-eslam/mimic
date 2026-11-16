/**
 * App bootstrap: i18n → chrome (header/footer/sidebar) → router.
 */
import { routes, notFoundRoute } from './config/routes.js';
import { createRouter } from './core/router.js';
import { qs } from './core/dom.js';
import { initI18n, setLocale, getLocale } from './i18n/index.js';
import { renderChrome, setRoute } from './ui/chrome.js';
import { assetReport } from './services/asset-service.js';

async function init() {
  await initI18n();
  renderChrome(routes);

  // The skip link targets #main, which must not be treated as a route
  qs('[data-skip-link]').addEventListener('click', (e) => {
    e.preventDefault();
    qs('#main').focus();
  });

  const router = createRouter({
    routes,
    notFound: notFoundRoute,
    outlet: qs('#view'),
    onBeforeRender: setRoute,
    onChange: setRoute,
  });

  // Locale switch → rebuild chrome and re-render the page
  window.addEventListener('i18n:change', async () => {
    const fromSwitch = document.activeElement?.matches?.('[data-locale-switch]');
    renderChrome(routes);
    if (router.current) setRoute(router.current);
    await router.refresh();
    // Keep keyboard/screen-reader users where they were: back on the (visible) language switch
    if (fromSwitch) [...document.querySelectorAll('[data-locale-switch]')].find((b) => b.offsetParent !== null)?.focus();
  });

  router.start();
  // Debug helpers: CharacterLab.assetReport() lists missing character images
  window.CharacterLab = { router, i18n: { setLocale, getLocale }, assetReport };
}

init();
