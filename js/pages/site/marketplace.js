/** Character Marketplace — realistic character catalog with filters and detail view. */
import { qs, on, escapeHtml, disposer } from '../../core/dom.js';
import { t, pick, joinList } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { characterMedia, hydrateCharacterMedia } from '../../ui/character-media.js';
import { CATALOG, FILTERS, findListing } from '../../data/catalog.js';
import { pageHero, btn } from './shared.js';

const label = (dim, value) => t(`catalog.values.${dim}.${value}`);

const matches = (c, f) =>
  (!f.market || c.market === f.market) &&
  (!f.style || c.style === f.style) &&
  (!f.presentation || c.presentation === f.presentation) &&
  (!f.useCase || c.useCases.includes(f.useCase));

function card(c) {
  const name = escapeHtml(pick(c.name));
  return `
    <article class="talent-card" data-id="${c.id}">
      <button type="button" class="talent-card__media" data-open="${c.id}" aria-label="${escapeHtml(t('cta.viewDetails'))}: ${name}">
        ${characterMedia(c)}
      </button>
      <div class="talent-card__body">
        <div class="talent-card__head">
          <h3 class="talent-card__name">${name}</h3>
          ${c.sample ? `<span class="badge badge--outline">${t('status.sample')}</span>` : ''}
        </div>
        <p class="talent-card__title">${escapeHtml(pick(c.title))}</p>
        <p class="talent-card__tags">${[label('market', c.market), label('style', c.style), label('useCase', c.useCases[0])].map((x) => `<span>${escapeHtml(x)}</span>`).join('')}</p>
        <button type="button" class="btn btn--secondary btn--sm btn--block" data-open="${c.id}">${t('cta.viewDetails')}</button>
      </div>
    </article>`;
}

function detail(c) {
  const list = (items, ic, dim) => `<ul role="list">${items.map((x) => `<li>${icon(ic)}<span>${escapeHtml(t(`catalog.${dim}.${x}`))}</span></li>`).join('')}</ul>`;
  return `
    <div class="talent-detail">
      <div class="talent-detail__media">${characterMedia(c, { size: 'detail' })}</div>
      <div class="talent-detail__info">
        <div class="talent-detail__head">
          <div>
            <h2 class="talent-detail__name" id="talent-detail-title">${escapeHtml(pick(c.name))}</h2>
            <p class="talent-detail__title">${escapeHtml(pick(c.title))}</p>
          </div>
          <button type="button" class="btn btn--ghost btn--icon" data-close aria-label="${t('forms.close')}">${icon('close')}</button>
        </div>
        ${c.sample ? `<p><span class="badge badge--outline">${t('status.sample')}</span></p>` : ''}
        <p>${escapeHtml(pick(c.description))}</p>
        <dl class="talent-detail__meta">
          <div><dt>${t('catalog.filters.market')}</dt><dd>${label('market', c.market)}</dd></div>
          <div><dt>${t('catalog.filters.style')}</dt><dd>${label('style', c.style)}</dd></div>
          <div><dt>${t('catalog.personalityLabel')}</dt><dd>${joinList(c.personality.map((p) => t(`catalog.personality.${p}`)))}</dd></div>
        </dl>
        <section class="talent-detail__block">
          <h3>${t('marketplace.posesTitle')}</h3>
          <div class="pose-strip">
            ${c.poses.map((p) => `<figure class="pose-strip__item">${characterMedia(c, { size: 'thumb', label: false, pose: p })}<figcaption>${t(`catalog.poses.${p}`)}</figcaption></figure>`).join('')}
          </div>
          <p class="talent-detail__note">${icon('info', { size: 14 })} ${t('marketplace.expressions')}: ${joinList(c.expressions.map((e) => t(`catalog.expressions.${e}`)))}</p>
        </section>
        <div class="talent-detail__cols">
          <div><h3>${t('marketplace.customizable')}</h3>${list(c.customization.available, 'check', 'custom')}</div>
          <div><h3>${t('marketplace.fixed')}</h3>${list(c.customization.notAvailable, 'close', 'custom')}</div>
        </div>
        <section class="talent-detail__block">
          <h3>${t('marketplace.useCases')}</h3>
          <p class="talent-card__tags">${c.useCases.map((u) => `<span>${escapeHtml(label('useCase', u))}</span>`).join('')}</p>
        </section>
        <div class="talent-detail__license">
          <h3>${icon('brief', { size: 16 })} ${t('marketplace.licenseTitle')}</h3>
          <p>${t('marketplace.licenseText')}</p>
        </div>
        <p class="talent-detail__note">${icon('info', { size: 14 })} ${t('marketplace.motionNote')}</p>
        <div class="talent-detail__paths">
          <a class="btn btn--primary" href="#/brief?character=${c.id}">${icon('brief')}<span>${t('cta.requestPricing')}</span></a>
          <a class="btn btn--secondary" href="#/request-integration?character=${c.id}">${icon('code')}<span>${t('cta.requestIntegration')}</span></a>
        </div>
      </div>
    </div>`;
}

export default {
  render() {
    const filterGroup = (key) => `
      <div class="filter" role="group" aria-label="${t(`catalog.filters.${key}`)}">
        <span class="filter__label">${t(`catalog.filters.${key}`)}</span>
        <div class="filter__chips">
          <button type="button" class="chip" aria-pressed="true" data-filter="${key}" data-value="">${t('marketplace.filters.all')}</button>
          ${FILTERS[key].map((o) => `<button type="button" class="chip" aria-pressed="false" data-filter="${key}" data-value="${o}">${escapeHtml(label(key, o))}</button>`).join('')}
        </div>
      </div>`;
    return `
      ${pageHero({ eyebrow: t('marketplace.eyebrow'), title: t('marketplace.title'), description: t('marketplace.description') })}
      <section class="container market">
        <div class="notice notice--info">${icon('info')}<span>${t('marketplace.sampleNote')}</span></div>
        <div class="filters">${Object.keys(FILTERS).map(filterGroup).join('')}</div>
        <div class="market__bar"><p class="market__count" data-count aria-live="polite"></p><button type="button" class="btn btn--ghost btn--sm" data-reset hidden>${t('marketplace.filters.reset')}</button></div>
        <div class="talent-grid" data-grid></div>
        <div class="market__custom">
          <p>${t('marketplace.alsoCustom')}</p>
          ${btn(t('cta.createCustom'), '#/brief', 'primary', '')}
        </div>
      </section>
      <dialog class="talent-dialog" aria-labelledby="talent-detail-title" data-dialog></dialog>`;
  },

  mount(root, ctx) {
    const d = disposer();
    const filters = {};
    const grid = qs('[data-grid]', root);
    const dialog = qs('[data-dialog]', root);

    const paint = () => {
      const shown = CATALOG.filter((c) => matches(c, filters));
      grid.innerHTML = shown.length
        ? shown.map(card).join('')
        : `<div class="market__empty"><p><strong>${t('marketplace.emptyTitle')}</strong></p><p>${t('marketplace.empty')}</p></div>`;
      qs('[data-count]', root).textContent = t('marketplace.results', { n: shown.length });
      qs('[data-reset]', root).hidden = !Object.values(filters).some(Boolean);
      hydrateCharacterMedia(grid);
    };

    const reset = () => {
      Object.keys(filters).forEach((k) => { filters[k] = null; });
      root.querySelectorAll('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(!c.dataset.value)));
      paint();
    };
    d.add(on(root, 'click', '[data-filter]', (_, chip) => {
      filters[chip.dataset.filter] = chip.dataset.value || null;
      root.querySelectorAll(`[data-filter="${chip.dataset.filter}"]`).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      paint();
    }));
    d.add(on(root, 'click', '[data-reset]', reset));

    let opener = null;
    const open = (id) => {
      const c = findListing(id);
      if (!c) return;
      opener = document.activeElement;
      dialog.innerHTML = detail(c);
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      hydrateCharacterMedia(dialog);
    };
    d.add(on(root, 'click', '[data-open]', (_, b) => open(b.dataset.open)));
    d.add(on(dialog, 'click', '[data-close]', () => dialog.close()));
    const onClick = (e) => { if (e.target === dialog || e.target.closest('a')) dialog.close(); };
    // Return focus to the control that opened the dialog (unless navigating away)
    const onClose = () => { if (opener?.isConnected && !location.hash.startsWith('#/brief') && !location.hash.startsWith('#/request')) opener.focus(); };
    dialog.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    d.add(() => { dialog.removeEventListener('click', onClick); dialog.removeEventListener('close', onClose); if (dialog.open) dialog.close(); });

    paint();
    const preselect = ctx?.query?.get('character');
    if (preselect) open(preselect);
    return () => d.run();
  },
};
