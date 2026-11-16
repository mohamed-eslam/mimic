import { t } from '../i18n/index.js';
/**
 * Hash router — works on any static server (Live Server, GitHub Pages…)
 * because the server only ever sees "/index.html".
 *
 * URLs look like  #/create  or  #/characters?tab=recent
 *
 * A page module default-exports:
 *   { render(ctx) => htmlString, mount?(root, ctx) => cleanupFn }
 */
export function createRouter({ routes, outlet, notFound, onChange, onBeforeRender }) {
  let current = null;   // { route, cleanup }
  let navToken = 0;     // guards against out-of-order async loads
  let firstRender = true;

  const normalize = (p) => {
    let path = p.startsWith('/') ? p : `/${p}`;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path.toLowerCase();
  };

  function parse() {
    const raw = location.hash.slice(1);
    if (raw && !raw.startsWith('/')) return null; // in-page anchor like #main — ignore
    const [path, search = ''] = (raw || '/').split('?');
    return { path: normalize(path), query: new URLSearchParams(search) };
  }

  async function resolve() {
    const parsed = parse();
    if (!parsed) return;
    const route = routes.find((r) => r.path === parsed.path) ?? notFound;
    if (route.redirect) {
      // Legacy path → keep the query string, replace history entry, resolve again
      const qs = parsed.query.toString();
      history.replaceState(null, '', `#${route.redirect}${qs ? `?${qs}` : ''}`);
      return resolve();
    }
    const token = ++navToken;

    let page;
    try {
      // Retry once: a dropped connection on a flaky network/dev server shouldn't 404 the page
      page = (await route.load().catch(() => new Promise((r) => setTimeout(r, 250)).then(route.load))).default;
    } catch (err) {
      console.error(`[router] failed to load "${route.path}"`, err);
      page = (await notFound.load()).default;
    }
    if (token !== navToken) return; // a newer navigation won

    try { current?.cleanup?.(); } catch (e) { console.error(e); }

    const ctx = { route, path: parsed.path, query: parsed.query, navigate };
    onBeforeRender?.(route, ctx); // e.g. switch layout first so pages measure the right width
    outlet.innerHTML = page.render(ctx);
    outlet.classList.remove('view--enter');
    void outlet.offsetWidth; // restart enter animation
    outlet.classList.add('view--enter');

    const cleanup = page.mount?.(outlet, ctx);
    current = { route, cleanup };

    document.title = route.path === '/' ? `MIMIC — ${t('brand.tagline')}` : `${route.title ?? route.label} · MIMIC`;
    onChange?.(route, ctx);

    if (!firstRender) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Move focus to the new page heading for screen-reader & keyboard users
      const heading = outlet.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    firstRender = false;
  }

  function navigate(path) {
    const target = `#${normalize(path)}`;
    if (location.hash === target) resolve();
    else location.hash = target;
  }

  function start() {
    window.addEventListener('hashchange', resolve);
    if (!location.hash || location.hash === '#') history.replaceState(null, '', '#/');
    resolve();
  }

  /** Re-render the current page (e.g. after a locale change). */
  const refresh = () => resolve();

  return { start, navigate, refresh, get current() { return current?.route; } };
}
