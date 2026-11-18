/**
 * Application chrome: marketing header & footer, workspace sidebar, mobile
 * top bar and the shared mobile navigation drawer. Everything is generated
 * from the route table + i18n, so labels and links stay in one place.
 */
import { qs, qsa } from '../core/dom.js';
import { t, setLocale, otherLocale, LOCALES } from '../i18n/index.js';
import { icon } from './icons.js';
import { logo } from './brand.js';
import { getTheme, toggleTheme } from './theme.js';

let routesRef = [];
let layout = 'site';
let lastFocus = null;

const byNav = (nav) => routesRef.filter((r) => r.nav === nav);

/** Language switch + theme toggle (header, drawer, sidebar). */
function prefs(cls = '') {
  const other = otherLocale();
  const dark = getTheme() === 'dark';
  return `
    <div class="prefs ${cls}">
      <button type="button" class="pref-btn" data-locale-switch lang="${other}" dir="${LOCALES[other].dir}"
        aria-label="${t('prefs.switchTo')}: ${LOCALES[other].label}" title="${t('prefs.switchTo')}: ${LOCALES[other].label}">${icon('globe')}<span class="pref-btn__long" aria-hidden="true">${LOCALES[other].label}</span><span class="pref-btn__short" aria-hidden="true">${LOCALES[other].short}</span></button>
      <button type="button" class="pref-btn pref-btn--icon" data-theme-toggle aria-pressed="${dark}"
        aria-label="${t('prefs.darkMode')}" title="${dark ? t('prefs.lightMode') : t('prefs.darkMode')}">
        <span class="pref-btn__moon">${icon('moon')}</span><span class="pref-btn__sun">${icon('sun')}</span>
      </button>
    </div>`;
}
const link = (r, cls, inner) => `<a class="${cls}" href="#${r.path}" data-path="${r.path}">${inner ?? r.short}</a>`;

function siteHeader() {
  return `
    <div class="container site-header__inner">
      ${logo({ size: 'header', label: t('brand.homeLabel') })}
      <nav class="site-nav" aria-label="${t('nav.primary')}">
        <ul role="list">${byNav('site').map((r) => `<li>${link(r, 'site-nav__link')}</li>`).join('')}</ul>
      </nav>
      <div class="site-header__actions">
        ${prefs()}
        <a class="btn btn--primary btn--sm site-header__cta" href="#/brief">${t('cta.requestCharacter')}</a>
      </div>
      <button class="btn btn--secondary btn--icon menu-toggle" type="button" data-menu-open aria-controls="drawer" aria-expanded="false">
        ${icon('menu')}<span class="visually-hidden">${t('nav.menu')}</span>
      </button>
    </div>`;
}

function siteFooter() {
  const soon = (r) => (r.soon ? ` <span class="site-footer__soon">${t('status.comingSoon')}</span>` : '');
  const col = (title, items) => `
    <div class="site-footer__col">
      <h2 class="site-footer__heading">${title}</h2>
      <ul role="list">${items.map((r) => `<li>${link(r, 'site-footer__link', r.label + soon(r))}</li>`).join('')}</ul>
    </div>`;
  const find = (p) => routesRef.find((r) => r.path === p);
  return `
    <div class="container site-footer__inner">
      <div class="site-footer__brand">
        ${logo({ size: 'footer', variant: 'on-dark', label: t('brand.homeLabel') })}
        <p>${t('footer.description')}</p>
      </div>
      ${col(t('footer.product'), ['/marketplace', '/services', '/custom', '/packages', '/ai-generation'].map(find))}
      ${col(t('footer.solutions'), ['/business', '/creators', '/integration', '/solutions'].map(find))}
      ${col(t('footer.company'), ['/contact', '/brief', '/request-integration'].map(find))}
      <div class="site-footer__col">
        <h2 class="site-footer__heading">${t('footer.studio')}</h2>
        <ul role="list"><li><a class="site-footer__link" href="#/app" data-path="/app">${t('nav.openWorkspace')}</a></li></ul>
      </div>
    </div>
    <div class="container site-footer__bottom">
      <span>${t('footer.rights', { year: new Date().getFullYear() })}</span>
      <span>${t('footer.markets')}</span>
    </div>`;
}

function appNavList(cls = 'app-nav') {
  const item = (r) => `
    <li>
      <a class="${cls}__link" href="#${r.path}" data-path="${r.path}">
        <span class="${cls}__icon">${icon(r.icon)}</span>
        <span class="${cls}__label">${r.label}</span>
        ${r.soon ? `<span class="${cls}__soon" title="${t('status.comingSoon')}"><span class="visually-hidden">${t('status.comingSoon')}</span></span>` : ''}
      </a>
    </li>`;
  return `
    <ul class="${cls}__list" role="list">${byNav('app').map(item).join('')}</ul>
    <p class="${cls}__group">${t('nav.labs')}</p>
    <ul class="${cls}__list" role="list">${byNav('labs').map(item).join('')}</ul>`;
}

function sidebar() {
  return `
    <div class="sidebar__inner">
      ${logo({ size: 'sidebar', href: '#/app', label: t('brand.studioLabel') })}
      <nav class="app-nav" aria-label="${t('nav.workspace')}">
        <p class="app-nav__group">${t('nav.workspace')}</p>
        ${appNavList()}
      </nav>
      <div class="sidebar__footer">
        ${prefs('prefs--stack')}
        <span class="badge badge--outline">${t('status.demo')}</span>
        <a class="app-nav__back" href="#/">${icon('arrowRight', { className: 'flip-rtl-reverse' })}<span>${t('nav.backToSite')}</span></a>
      </div>
    </div>`;
}

function topbar() {
  return `
    ${logo({ size: 'header', href: '#/app', label: t('brand.studioLabel') })}
    <button class="btn btn--secondary btn--icon" type="button" data-menu-open aria-controls="drawer" aria-expanded="false">
      ${icon('menu')}<span class="visually-hidden">${t('nav.menu')}</span>
    </button>`;
}

function drawerContent() {
  const body = layout === 'app'
    ? `<nav class="drawer-nav" aria-label="${t('nav.workspace')}">${appNavList('drawer-nav')}</nav>
       <a class="btn btn--secondary btn--block" href="#/">${t('nav.backToSite')}</a>`
    : `<nav class="drawer-nav" aria-label="${t('nav.primary')}">
         <ul class="drawer-nav__list" role="list">${byNav('site').map((r) => `<li>${link(r, 'drawer-nav__link', r.short)}</li>`).join('')}</ul>
       </nav>
       <div class="drawer__actions">
         <a class="btn btn--primary btn--block btn--lg" href="#/brief">${t('cta.requestCharacter')}</a>
       </div>`;
  return `
    <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="${t('nav.menu')}">
      <div class="drawer__head">
        ${logo({ size: 'drawer', label: t('brand.homeLabel') })}
        <button class="btn btn--ghost btn--icon" type="button" data-menu-close>${icon('close')}<span class="visually-hidden">${t('nav.closeMenu')}</span></button>
      </div>
      ${prefs('prefs--drawer')}
      ${body}
    </div>`;
}

/* ---------- drawer behaviour ---------- */
export function openDrawer() {
  const drawer = qs('#drawer');
  lastFocus = document.activeElement;
  drawer.hidden = false;
  requestAnimationFrame(() => drawer.classList.add('is-open'));
  document.body.classList.add('drawer-open');
  qsa('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
  qs('.drawer__panel a, .drawer__panel button', drawer)?.focus();
}

export function closeDrawer({ restoreFocus = true } = {}) {
  const drawer = qs('#drawer');
  if (drawer.hidden) return;
  drawer.classList.remove('is-open');
  document.body.classList.remove('drawer-open');
  qsa('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  setTimeout(() => { drawer.hidden = true; }, 220);
  if (restoreFocus) lastFocus?.focus?.();
}

function bindOnce() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-locale-switch]')) { setLocale(otherLocale()); return; }
    if (e.target.closest('[data-theme-toggle]')) { toggleTheme(); return; }
    if (e.target.closest('[data-menu-open]')) openDrawer();
    else if (e.target.closest('[data-menu-close]') || e.target.id === 'drawer') closeDrawer();
    else if (e.target.closest('#drawer a')) closeDrawer({ restoreFocus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !qs('#drawer').hidden) closeDrawer();
    if (e.key === 'Tab' && !qs('#drawer').hidden) {
      // keep focus inside the open drawer
      const f = qsa('#drawer a, #drawer button');
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener('theme:change', ({ detail }) => {
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.setAttribute('aria-pressed', String(detail.theme === 'dark'));
      b.title = detail.theme === 'dark' ? t('prefs.lightMode') : t('prefs.darkMode');
    });
  });
  const onScroll = () => qs('.site-header')?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/** Build all chrome. Call again after a locale change. */
export function renderChrome(routes) {
  const first = !routesRef.length;
  routesRef = routes;
  qs('[data-chrome="site-header"]').innerHTML = siteHeader();
  qs('[data-chrome="site-footer"]').innerHTML = siteFooter();
  qs('[data-chrome="sidebar"]').innerHTML = sidebar();
  qs('[data-chrome="topbar"]').innerHTML = topbar();
  qs('#drawer').innerHTML = drawerContent();
  if (first) bindOnce();
}

/** Switch layout + highlight the active links. */
export function setRoute(route) {
  const next = route.layout ?? 'site';
  if (next !== layout) {
    layout = next;
    qs('#drawer').innerHTML = drawerContent();
  }
  document.body.dataset.layout = layout;
  closeDrawer({ restoreFocus: false });
  qsa('[data-path]').forEach((a) => {
    if (a.dataset.path === route.path) a.setAttribute('aria-current', 'page');
    // Parent section in the primary nav (e.g. Services while on Custom Design)
    else if (route.section && a.dataset.path === route.section && a.matches('.site-nav__link, .drawer-nav__link')) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}
