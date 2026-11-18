/**
 * Character Marketplace — search, type categories, secondary filters (drawer),
 * image-first cards and a detail dialog.
 *
 * Filter state lives in the URL query (#/marketplace?q=…&kind=…&market=a,b…) so it
 * survives a language switch (the router re-renders the same hash) and can be shared.
 * Logic: AND across groups, OR within a group; search matches names and roles in
 * both languages (Arabic is normalised: diacritics, alef/yaa/taa-marbuta forms).
 */
import { qs, on, escapeHtml, disposer, prefersReducedMotion } from '../../core/dom.js';
import { t, pick, joinList } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { characterMedia, hydrateCharacterMedia, motionToggle } from '../../ui/character-media.js';
import { CATALOG, FILTERS, KINDS, findListing } from '../../data/catalog.js';
import { pageHero, btn } from './shared.js';

const GROUPS = ['presentation', 'style', 'useCase', 'market']; // secondary filters (drawer)
const label = (dim, value) => t(`catalog.values.${dim}.${value}`);
const kindCount = (kind) => CATALOG.filter((c) => c.kind === kind).length;

/* ---------- State ---------- */
const emptyState = () => ({ q: '', kind: null, ...Object.fromEntries(GROUPS.map((g) => [g, new Set()])) });

function readState(query) {
  const s = emptyState();
  if (!query) return s;
  s.q = (query.get('q') ?? '').slice(0, 80);
  const kind = query.get('kind');
  s.kind = KINDS.includes(kind) ? kind : null;
  GROUPS.forEach((g) => (query.get(g) ?? '').split(',').filter((v) => FILTERS[g].includes(v)).forEach((v) => s[g].add(v)));
  return s;
}

function writeState(s) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.kind) p.set('kind', s.kind);
  GROUPS.forEach((g) => { if (s[g].size) p.set(g, [...s[g]].join(',')); });
  const qs_ = p.toString();
  history.replaceState(null, '', `#/marketplace${qs_ ? `?${qs_}` : ''}`); // no hashchange → no re-render
}

const secondaryCount = (s) => GROUPS.reduce((n, g) => n + s[g].size, 0);
const isFiltered = (s) => Boolean(s.q || s.kind || secondaryCount(s));

/* ---------- Matching ---------- */
const norm = (v) => String(v ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[ً-ٰٟـ̀-ͯ]/g, '') // Arabic harakat, tatweel, Latin accents
  .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

const haystack = (c) => norm([
  c.name.en, c.name.ar, c.title.en, c.title.ar,
  label('kind', c.kind), label('market', c.market), label('style', c.style),
  ...c.useCases.map((u) => label('useCase', u)),
].join(' '));

function matches(c, s, { ignoreKind = false } = {}) {
  if (!ignoreKind && s.kind && c.kind !== s.kind) return false;
  if (s.presentation.size && !s.presentation.has(c.presentation)) return false;
  if (s.style.size && !s.style.has(c.style)) return false;
  if (s.market.size && !s.market.has(c.market)) return false;
  if (s.useCase.size && !c.useCases.some((u) => s.useCase.has(u))) return false;
  if (s.q) { const words = norm(s.q).split(/\s+/).filter(Boolean); const h = haystack(c); if (!words.every((w) => h.includes(w))) return false; }
  return true;
}

/* ---------- Views ---------- */
function card(c, i) {
  return `
    <li class="mcard" style="--i:${i}">
      <a class="mcard__link" href="#/marketplace?character=${c.id}" data-open="${c.id}">
        <span class="mcard__media">${characterMedia(c, { size: 'card' })}</span>
        <span class="mcard__body">
          <span class="mcard__kind">${escapeHtml(label('kind', c.kind))}</span>
          <strong class="mcard__name">${escapeHtml(pick(c.name))}</strong>
          <span class="mcard__role">${escapeHtml(pick(c.title))}</span>
          <span class="mcard__meta">${escapeHtml(label('market', c.market))}</span>
          <span class="mcard__cta">${t('marketplace.viewCharacter')} ${icon('arrowRight', { size: 14, className: 'flip-rtl' })}</span>
        </span>
      </a>
    </li>`;
}

const kindTabs = (s, counts) => `
  <button type="button" class="chip kind-tab" data-kind="" aria-pressed="${!s.kind}">${t('marketplace.allKinds')} <span class="kind-tab__n">${counts.all}</span></button>
  ${KINDS.map((k) => {
    const none = kindCount(k) === 0;
    return `<button type="button" class="chip kind-tab" data-kind="${k}" aria-pressed="${s.kind === k}" ${none ? `disabled title="${escapeHtml(t('marketplace.noneYet'))}"` : ''}>${escapeHtml(label('kinds', k))} <span class="kind-tab__n">${counts[k]}</span></button>`;
  }).join('')}`;

const drawerGroups = (s) => GROUPS.map((g) => `
  <fieldset class="fgroup">
    <legend class="fgroup__label">${t(`catalog.filters.${g}`)}</legend>
    <div class="fgroup__chips">
      ${FILTERS[g].map((v) => `<button type="button" class="chip" data-group="${g}" data-value="${v}" aria-pressed="${s[g].has(v)}">${escapeHtml(label(g, v))}</button>`).join('')}
    </div>
  </fieldset>`).join('');

function activeTokens(s) {
  const tokens = GROUPS.flatMap((g) => [...s[g]].map((v) => ({ g, v, text: label(g, v) })));
  return tokens.map(({ g, v, text }) =>
    `<button type="button" class="ftoken" data-remove-group="${g}" data-value="${v}" aria-label="${escapeHtml(t('marketplace.removeFilter', { label: text }))}">${escapeHtml(text)}${icon('close', { size: 12 })}</button>`).join('');
}

function detail(c) {
  const list = (items, ic, dim) => `<ul role="list">${items.map((x) => `<li>${icon(ic)}<span>${escapeHtml(t(`catalog.${dim}.${x}`))}</span></li>`).join('')}</ul>`;
  return `
    <div class="talent-detail">
      <div class="talent-detail__media">${characterMedia(c, { size: 'detail' })}</div>
      <div class="talent-detail__info">
        <div class="talent-detail__head">
          <div>
            <p class="talent-detail__badges"><span class="badge badge--neutral">${escapeHtml(label('kind', c.kind))}</span>${c.sample ? `<span class="badge badge--outline">${t('status.sample')}</span>` : ''}</p>
            <h2 class="talent-detail__name" id="talent-detail-title">${escapeHtml(pick(c.name))}</h2>
            <p class="talent-detail__title">${escapeHtml(pick(c.title))}</p>
          </div>
          <button type="button" class="btn btn--ghost btn--icon" data-close aria-label="${t('forms.close')}">${icon('close')}</button>
        </div>
        <p class="talent-detail__desc">${escapeHtml(pick(c.description))}</p>
        <dl class="talent-detail__meta">
          <div><dt>${t('catalog.filters.market')}</dt><dd>${label('market', c.market)}</dd></div>
          <div><dt>${t('catalog.filters.style')}</dt><dd>${label('style', c.style)}</dd></div>
          <div><dt>${t('catalog.personalityLabel')}</dt><dd>${joinList(c.personality.map((p) => t(`catalog.personality.${p}`)))}</dd></div>
        </dl>
        <section class="talent-detail__block">
          <h3>${t('marketplace.useCases')}</h3>
          <p class="talent-detail__tags">${c.useCases.map((u) => `<span>${escapeHtml(label('useCase', u))}</span>`).join('')}</p>
        </section>
        <dl class="talent-detail__facts">
          <div><dt>${t('marketplace.posesTitle')}</dt><dd>${joinList(c.poses.map((p) => t(`catalog.poses.${p}`)))}</dd></div>
          <div><dt>${t('marketplace.expressions')}</dt><dd>${joinList(c.expressions.map((e) => t(`catalog.expressions.${e}`)))}</dd></div>
        </dl>
        <div class="talent-detail__cols">
          <div><h3>${t('marketplace.customizable')}</h3>${list(c.customization.available, 'check', 'custom')}</div>
          <div><h3>${t('marketplace.fixed')}</h3>${list(c.customization.notAvailable, 'close', 'custom')}</div>
        </div>
        <p class="talent-detail__note">${icon('info', { size: 14 })}<span>${t('marketplace.licenseText')} ${t('marketplace.motionNote')}</span></p>
        <div class="talent-detail__paths">
          <a class="btn btn--primary" href="#/brief?character=${c.id}">${t('cta.requestPricing')}</a>
          <a class="btn btn--secondary" href="#/request-integration?character=${c.id}">${t('cta.requestIntegration')}</a>
        </div>
      </div>
    </div>`;
}

export default {
  render() {
    return `
      ${pageHero({ eyebrow: t('marketplace.eyebrow'), title: t('marketplace.title'), description: t('marketplace.description') })}
      <section class="container market" aria-labelledby="market-results">
        <div class="market-toolbar">
          <div class="market-toolbar__row">
            <div class="market-search">
              ${icon('search', { size: 16 })}
              <label class="visually-hidden" for="market-q">${t('marketplace.search')}</label>
              <input class="input market-search__input" id="market-q" type="search" data-search autocomplete="off" placeholder="${escapeHtml(t('marketplace.searchPlaceholder'))}">
            </div>
            <button type="button" class="btn btn--secondary market-more" data-more aria-haspopup="dialog" aria-controls="filter-drawer">
              ${icon('filter')}<span>${t('marketplace.moreFilters')}</span><span class="market-more__n" data-more-count hidden></span>
            </button>
          </div>
          <div class="kind-tabs" role="group" aria-label="${escapeHtml(t('marketplace.kindLabel'))}" data-kinds></div>
          <div class="market-active" data-active hidden></div>
        </div>
        <div class="market-meta">
          <p class="market-meta__count" id="market-results" data-count aria-live="polite"></p>
          <p class="market-meta__note">${icon('info', { size: 14 })}<span>${t('marketplace.sampleNote')}</span></p>
          ${CATALOG.some((c) => c.media?.video) ? motionToggle() : ''}
        </div>
        <ul class="mgrid" role="list" data-grid></ul>
        <div class="market-cta">
          <div><strong>${t('marketplace.alsoCustom')}</strong><span>${t('marketplace.customText')}</span></div>
          ${btn(t('cta.createCustom'), '#/brief', 'primary', '')}
        </div>
      </section>

      <dialog class="talent-dialog" aria-labelledby="talent-detail-title" data-dialog></dialog>

      <dialog class="filter-drawer" id="filter-drawer" aria-labelledby="filters-title" data-drawer>
        <div class="filter-drawer__head">
          <h2 id="filters-title" class="filter-drawer__title">${t('marketplace.filtersTitle')}</h2>
          <button type="button" class="btn btn--ghost btn--icon" data-drawer-close aria-label="${escapeHtml(t('marketplace.closeFilters'))}">${icon('close')}</button>
        </div>
        <div class="filter-drawer__body" data-drawer-body></div>
        <div class="filter-drawer__foot">
          <button type="button" class="btn btn--ghost" data-drawer-reset>${t('marketplace.resetAll')}</button>
          <button type="button" class="btn btn--primary" data-drawer-apply></button>
        </div>
      </dialog>`;
  },

  mount(root, ctx) {
    const d = disposer();
    const state = readState(ctx?.query);
    let pending = null; // drawer working copy (applied on "Show results")
    const grid = qs('[data-grid]', root);
    const dialog = qs('[data-dialog]', root);
    const drawer = qs('[data-drawer]', root);
    const search = qs('[data-search]', root);
    search.value = state.q;

    const cloneState = (s) => ({ ...s, ...Object.fromEntries(GROUPS.map((g) => [g, new Set(s[g])])) });

    const paint = ({ animate = true } = {}) => {
      const shown = CATALOG.filter((c) => matches(c, state));
      const counts = { all: CATALOG.filter((c) => matches(c, state, { ignoreKind: true })).length };
      KINDS.forEach((k) => { counts[k] = CATALOG.filter((c) => c.kind === k && matches(c, state, { ignoreKind: true })).length; });

      qs('[data-kinds]', root).innerHTML = kindTabs(state, counts);
      grid.classList.toggle('mgrid--animate', animate && !prefersReducedMotion());
      grid.innerHTML = shown.length ? shown.map(card).join('') : `
        <li class="market-empty">
          <span class="market-empty__icon">${icon('search')}</span>
          <strong>${t('marketplace.emptyTitle')}</strong>
          <p>${t('marketplace.empty')}</p>
          <div class="market-empty__actions">
            <button type="button" class="btn btn--secondary btn--sm" data-clear>${t('marketplace.clearAll')}</button>
            <a class="btn btn--tertiary btn--sm" href="#/brief">${t('cta.createCustom')}</a>
          </div>
        </li>`;
      qs('[data-count]', root).textContent = t('marketplace.showing', { n: shown.length, total: CATALOG.length });

      const n = secondaryCount(state);
      const badge = qs('[data-more-count]', root);
      badge.hidden = !n; badge.textContent = n;
      qs('[data-more]', root).classList.toggle('is-active', n > 0);

      const active = qs('[data-active]', root);
      active.hidden = !isFiltered(state);
      active.innerHTML = `${activeTokens(state)}<button type="button" class="btn btn--tertiary btn--sm" data-clear>${t('marketplace.clearAll')}</button>`;

      writeState(state);
      hydrateCharacterMedia(grid);
    };

    /* Search (debounced) */
    let timer = 0;
    d.add(on(root, 'input', '[data-search]', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = search.value.trim(); paint({ animate: false }); }, 140);
    }));
    d.add(() => clearTimeout(timer));

    /* Type categories */
    d.add(on(root, 'click', '[data-kind]', (_, b) => { if (b.disabled) return; state.kind = b.dataset.kind || null; paint(); }));

    /* Active tokens + clear */
    d.add(on(root, 'click', '[data-remove-group]', (_, b) => { state[b.dataset.removeGroup].delete(b.dataset.value); paint(); }));
    d.add(on(root, 'click', '[data-clear]', () => {
      Object.assign(state, emptyState()); search.value = ''; paint();
      search.focus();
    }));

    /* Drawer: works on a copy; Apply commits, Reset clears the copy, close discards */
    const drawerPaint = () => {
      qs('[data-drawer-body]', drawer).innerHTML = drawerGroups(pending);
      const n = CATALOG.filter((c) => matches(c, pending)).length;
      qs('[data-drawer-apply]', drawer).textContent = t('marketplace.apply', { n });
    };
    let drawerOpener = null;
    d.add(on(root, 'click', '[data-more]', (_, b) => {
      drawerOpener = b; pending = cloneState(state); drawerPaint();
      if (typeof drawer.showModal === 'function') drawer.showModal(); else drawer.setAttribute('open', '');
    }));
    d.add(on(drawer, 'click', '[data-group]', (_, chip) => {
      const set = pending[chip.dataset.group];
      set.has(chip.dataset.value) ? set.delete(chip.dataset.value) : set.add(chip.dataset.value);
      const focusKey = `${chip.dataset.group}:${chip.dataset.value}`;
      drawerPaint();
      drawer.querySelector(`[data-group="${focusKey.split(':')[0]}"][data-value="${focusKey.split(':')[1]}"]`)?.focus();
    }));
    d.add(on(drawer, 'click', '[data-drawer-reset]', () => { GROUPS.forEach((g) => pending[g].clear()); drawerPaint(); }));
    d.add(on(drawer, 'click', '[data-drawer-apply]', () => { GROUPS.forEach((g) => { state[g] = new Set(pending[g]); }); drawer.close(); paint(); }));
    d.add(on(drawer, 'click', '[data-drawer-close]', () => drawer.close()));
    const onDrawerClick = (e) => { if (e.target === drawer) drawer.close(); };
    const onDrawerClose = () => { pending = null; drawerOpener?.isConnected && drawerOpener.focus(); };
    drawer.addEventListener('click', onDrawerClick);
    drawer.addEventListener('close', onDrawerClose);
    d.add(() => { drawer.removeEventListener('click', onDrawerClick); drawer.removeEventListener('close', onDrawerClose); if (drawer.open) drawer.close(); });

    /* Detail dialog */
    let opener = null;
    const open = (id) => {
      const c = findListing(id);
      if (!c) return;
      opener = document.activeElement;
      dialog.innerHTML = detail(c);
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      hydrateCharacterMedia(dialog);
    };
    d.add(on(root, 'click', '[data-open]', (e, a) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab clicks follow the link
      e.preventDefault();
      open(a.dataset.open);
    }));
    d.add(on(dialog, 'click', '[data-close]', () => dialog.close()));
    const onClick = (e) => { if (e.target === dialog || e.target.closest('a')) dialog.close(); };
    const onClose = () => { if (opener?.isConnected && !location.hash.startsWith('#/brief') && !location.hash.startsWith('#/request')) opener.focus(); };
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    d.add(() => { dialog.removeEventListener('click', onClick); dialog.removeEventListener('close', onClose); if (dialog.open) dialog.close(); });

    paint({ animate: true });
    const preselect = ctx?.query?.get('character');
    if (preselect) open(preselect);
    return () => d.run();
  },
};
