/**
 * My Characters — browse and manage saved characters.
 * Cards render the real Character engine from saved configuration data.
 */
import { html, qs, on, escapeHtml, disposer } from '../core/dom.js';
import { timeAgo, formatDate } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { button, pageHeader, emptyState } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { Character, PERSONALITIES } from '../engine/index.js';
import { toEngineOptions, displayName, NAME_MAX } from '../models/character-config.js';
import { characters, onExternalChange } from '../services/character-service.js';

const SORTS = {
  updated: { label: 'Recently edited', fn: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  created: { label: 'Newest first', fn: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  name: { label: 'Name A–Z', fn: (a, b) => displayName(a).localeCompare(displayName(b), undefined, { sensitivity: 'base' }) },
};

function card(c) {
  const p = PERSONALITIES[c.personality];
  const name = escapeHtml(displayName(c));
  return `
    <article class="char-card" data-id="${escapeHtml(c.id)}">
      <a class="char-card__preview" href="#/app/create?id=${encodeURIComponent(c.id)}" style="--stage-bg:${c.background}" aria-label="Edit ${name}">
        <div class="char-card__character" data-preview></div>
      </a>
      <div class="char-card__body">
        <div class="char-card__title-row">
          <h3 class="char-card__name" data-name title="${name}">${name}</h3>
          <button class="btn btn--ghost btn--sm btn--icon" type="button" data-action="rename" aria-label="Rename ${name}" title="Rename">${icon('edit')}</button>
        </div>
        <div class="char-card__meta">
          <span class="badge badge--neutral persona-badge" data-persona="${c.personality}">${p.emoji} ${p.label}</span>
          <time class="text-xs text-muted" datetime="${c.updatedAt}" title="Created ${formatDate(c.createdAt)}">Edited ${timeAgo(c.updatedAt)}</time>
        </div>
        <div class="char-card__actions">
          <a class="btn btn--primary btn--sm" href="#/app/create?id=${encodeURIComponent(c.id)}">${icon('wand')}<span>Edit</span></a>
          <a class="btn btn--secondary btn--sm btn--icon" href="#/app/personality?id=${encodeURIComponent(c.id)}" aria-label="Play with ${name}" title="Play">${icon('play')}</a>
          <button class="btn btn--secondary btn--sm btn--icon" type="button" data-action="duplicate" aria-label="Duplicate ${name}" title="Duplicate">${icon('copy')}</button>
          <button class="btn btn--ghost btn--sm btn--icon char-card__delete" type="button" data-action="delete" aria-label="Delete ${name}" title="Delete">${icon('trash')}</button>
        </div>
      </div>
    </article>`;
}

function notices(status) {
  const items = [];
  if (!status.persistent) items.push('Your browser is blocking local storage, so characters will only be kept until you close this tab.');
  if (status.message) items.push(status.message);
  if (status.dropped) items.push(`${status.dropped} saved character(s) were damaged and could not be loaded.`);
  return items.map((t) => `<div class="notice" role="status">${icon('warning')}<span>${escapeHtml(t)}</span></div>`).join('');
}

export default {
  render() {
    return html`
      ${pageHeader({
        eyebrow: `${icon('grid', { size: 14 })} Collection`,
        title: 'My Characters',
        description: '<span data-count>Loading your crew…</span>',
        actions: button({ label: 'New character', variant: 'primary', icon: 'plus', href: '#/app/create?new=1' }),
      })}
      <div data-notices></div>
      <div class="toolbar" data-toolbar hidden>
        <div class="input-group">
          ${icon('search')}
          <input class="input input--pill" type="search" data-search placeholder="Search by name" aria-label="Search characters" autocomplete="off">
        </div>
        <label class="visually-hidden" for="char-sort">Sort characters</label>
        <select class="select input--pill char-sort" id="char-sort" data-sort>
          ${Object.entries(SORTS).map(([k, s]) => `<option value="${k}">${s.label}</option>`)}
        </select>
      </div>
      <div data-collection aria-live="polite"></div>`;
  },

  mount(root) {
    const d = disposer();
    const view = { query: '', sort: 'updated' };
    let all = [];
    let previews = [];

    const collection = qs('[data-collection]', root);
    const toolbar = qs('[data-toolbar]', root);
    const count = qs('[data-count]', root);

    const clearPreviews = () => { previews.forEach((p) => p.destroy()); previews = []; };
    d.add(clearPreviews);

    function paint() {
      clearPreviews();
      qs('[data-notices]', root).innerHTML = notices(characters.status());
      count.textContent = all.length === 1 ? '1 saved character' : `${all.length} saved characters`;
      toolbar.hidden = all.length === 0;

      if (!all.length) {
        collection.innerHTML = emptyState({
          icon: 'sparkle',
          title: 'No characters yet',
          text: 'Design your first buddy in the Creator and save it — it will live here, even after you close the browser.',
          action: button({ label: 'Create your first character', variant: 'primary', icon: 'plus', href: '#/app/create?new=1' }),
        });
        return;
      }

      const q = view.query.trim().toLowerCase();
      const shown = all.filter((c) => !q || displayName(c).toLowerCase().includes(q)).sort(SORTS[view.sort].fn);
      if (!shown.length) {
        collection.innerHTML = emptyState({ icon: 'search', title: 'No matches', text: `No character is called “${escapeHtml(view.query)}”.` });
        return;
      }
      collection.innerHTML = `<div class="char-grid">${shown.map(card).join('')}</div>`;
      collection.querySelectorAll('.char-card').forEach((el) => {
        const c = shown.find((x) => x.id === el.dataset.id);
        previews.push(new Character(qs('[data-preview]', el), { ...toEngineOptions(c), label: displayName(c) }));
      });
    }

    async function refresh() {
      all = await characters.list();
      paint();
    }

    const run = async (fn, success) => {
      try {
        const result = await fn();
        await refresh();
        if (success) toast(success(result), { icon: 'check' });
        return result;
      } catch (err) {
        console.error(err);
        toast(err.message || 'Something went wrong', { icon: 'warning' });
        return null;
      }
    };

    /* ---------- actions ---------- */
    function startRename(cardEl) {
      const id = cardEl.dataset.id;
      const c = all.find((x) => x.id === id);
      const title = qs('[data-name]', cardEl);
      const input = document.createElement('input');
      input.className = 'input char-card__rename';
      input.value = c.name;
      input.maxLength = NAME_MAX;
      input.setAttribute('aria-label', 'Character name');
      title.replaceWith(input);
      input.focus();
      input.select();
      let done = false;
      const finish = async (commit) => {
        if (done) return;
        done = true;
        const value = input.value.trim();
        if (commit && value && value !== c.name) {
          await run(() => characters.rename(id, value), (r) => `Renamed to “${displayName(r)}”`);
        } else {
          if (commit && !value) toast('Name can’t be empty', { icon: 'warning' });
          paint();
        }
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      input.addEventListener('blur', () => finish(true));
    }

    d.add(on(root, 'click', '[data-action]', async (_, btn) => {
      const cardEl = btn.closest('.char-card');
      const id = cardEl?.dataset.id;
      const c = all.find((x) => x.id === id);
      if (!c) return;
      if (btn.dataset.action === 'rename') startRename(cardEl);
      if (btn.dataset.action === 'duplicate') await run(() => characters.duplicate(id), (r) => `Created “${displayName(r)}”`);
      if (btn.dataset.action === 'delete') {
        const ok = await confirmDialog({
          title: `Delete “${displayName(c)}”?`,
          message: 'This character will be removed from your collection. This can’t be undone.',
          confirmLabel: 'Delete',
          tone: 'danger',
          iconName: 'trash',
        });
        if (ok) await run(() => characters.remove(id), () => `Deleted “${displayName(c)}”`);
      }
    }));

    const search = qs('[data-search]', root);
    const onSearch = () => { view.query = search.value; paint(); };
    search.addEventListener('input', onSearch);
    d.add(() => search.removeEventListener('input', onSearch));
    const sort = qs('[data-sort]', root);
    const onSort = () => { view.sort = sort.value; paint(); };
    sort.addEventListener('change', onSort);
    d.add(() => sort.removeEventListener('change', onSort));

    d.add(onExternalChange(refresh)); // another tab saved/deleted
    refresh();
    return () => d.run();
  },
};
