/**
 * Character Creator — customization studio.
 *
 * Desktop: controls (left) · live preview (center) · identity, personality & actions (right)
 * Tablet:  preview on top, controls + info side by side
 * Mobile:  pinned preview on top, controls, then info
 *
 * All edits flow through ONE path:  control:change → sanitizeField → store → engine.
 */
import { html, qs, qsa, escapeHtml, on, disposer } from '../core/dom.js';
import { store } from '../core/store.js';
import { icon } from '../ui/icons.js';
import {
  button, tabs, tabPanel, slider, optionGrid, swatches, switchControl, personalityPicker,
} from '../ui/components.js';
import { enhance, setControlValue } from '../ui/behaviors.js';
import { toast } from '../ui/toast.js';
import { createLiveCharacter } from '../ui/live-character.js';
import { Character, partPreview, accessoryPreview, PERSONALITIES, PERSONALITY_NAMES } from '../engine/index.js';
import {
  FIELDS, BODY_COLORS, BACKGROUND_COLORS, NAME_MAX,
  sanitizeField, sanitizeConfig, createCharacterConfig, randomConfig, randomName, describeConfig, displayName,
} from '../models/character-config.js';
import { characters, saveCharacter } from '../services/character-service.js';

/** Comparable fingerprint of a config (for unsaved-changes tracking). */
const snapshotOf = (config) => JSON.stringify(sanitizeConfig(config));

const TAB_ID = 'creator';
const TABS = [
  { id: 'body', label: 'Body', icon: 'body' },
  { id: 'colors', label: 'Colors', icon: 'palette' },
  { id: 'face', label: 'Face', icon: 'smile' },
  { id: 'extras', label: 'Extras', icon: 'hat' },
];

const personalityList = () => PERSONALITY_NAMES.map((id) => PERSONALITIES[id]);
const numberSlider = (field, c, hint) =>
  slider({ field, label: FIELDS[field].label, min: FIELDS[field].min, max: FIELDS[field].max, step: FIELDS[field].step, value: c[field], hint });
const options = (field, art) => FIELDS[field].options.map((value) => ({ value, label: FIELDS[field].labels[value], art: art?.(value) }));

function stageBackground(color) {
  return `radial-gradient(circle at 50% 110%, rgb(255 255 255 / 0.65), transparent 55%), ${color}`;
}

function specList(c) {
  return describeConfig(c)
    .map((row) => `
      <div class="spec-list__row">
        <dt>${row.label}</dt>
        <dd>${row.color ? `<span class="spec-dot" style="--dot:${row.color}"></span>` : ''}${escapeHtml(row.value)}</dd>
      </div>`)
    .join('');
}

/* ---------------------------------------------------------------------- */

function renderControls(c) {
  return html`
    <section class="panel creator__controls" aria-label="Customize character">
      ${tabs({ id: TAB_ID, items: TABS, label: 'Customization sections', variant: 'block' })}
      <div class="panel__body">
        ${tabPanel({ id: TAB_ID, tab: 'body', active: true, content: html`
          <div class="panel__section">
            <h3 class="panel__section-title">Shape</h3>
            ${optionGrid({ field: 'shape', label: 'Body shape', value: c.shape, min: 88, options: options('shape', () => '') })}
          </div>
          <div class="panel__section">
            <h3 class="panel__section-title">Size &amp; proportions</h3>
            ${numberSlider('size', c)}
            ${numberSlider('width', c)}
            ${numberSlider('height', c)}
          </div>` })}

        ${tabPanel({ id: TAB_ID, tab: 'colors', content: html`
          <div class="panel__section">
            <h3 class="panel__section-title">Body color</h3>
            ${swatches({ field: 'color', label: 'Body color', colors: BODY_COLORS, value: c.color })}
          </div>
          <div class="panel__section">
            <h3 class="panel__section-title">Background</h3>
            ${swatches({ field: 'background', label: 'Background color', colors: BACKGROUND_COLORS, value: c.background })}
          </div>` })}

        ${tabPanel({ id: TAB_ID, tab: 'face', content: html`
          <div class="panel__section">
            <h3 class="panel__section-title">Eyes</h3>
            ${optionGrid({ field: 'eyes', label: 'Eye style', value: c.eyes, min: 88, options: options('eyes', (v) => partPreview('eyes', v)) })}
            ${numberSlider('eyeSize', c)}
            ${numberSlider('eyeSpacing', c)}
          </div>
          <div class="panel__section">
            <h3 class="panel__section-title">Mouth</h3>
            ${optionGrid({ field: 'mouth', label: 'Mouth expression', value: c.mouth, min: 88, options: options('mouth', (v) => partPreview('mouth', v)) })}
          </div>
          <div class="panel__section">
            ${switchControl({ field: 'cheeks', label: 'Rosy cheeks', checked: c.cheeks })}
          </div>` })}

        ${tabPanel({ id: TAB_ID, tab: 'extras', content: html`
          <div class="panel__section">
            <h3 class="panel__section-title">Accessory <span class="badge badge--neutral">One at a time</span></h3>
            ${optionGrid({ field: 'accessory', label: 'Accessory', value: c.accessory, min: 88, options: options('accessory', accessoryPreview) })}
          </div>` })}
      </div>
    </section>`;
}

function renderStage(c) {
  const name = displayName(c);
  return html`
    <section class="creator__stage-wrap" aria-label="Live preview">
      <div class="stage creator__stage" data-stage style="--stage-bg:${stageBackground(c.background)}">
        <div class="stage__floor"></div>
        <div class="stage__toolbar">
          <span class="badge badge--mint">${icon('sparkle')} Live preview</span>
          <span class="badge badge--neutral">${icon('hand')} Poke or drag</span>
        </div>
        <div class="creator__character" data-character></div>
        <div class="stage__caption">
          <span class="nameplate glass ${c.name.trim() ? '' : 'is-placeholder'}" data-nameplate>${escapeHtml(name)}</span>
        </div>
      </div>
    </section>`;
}

function renderInfo(c) {
  return html`
    <aside class="creator__info" aria-label="Character details">
      <section class="panel">
        <div class="panel__header"><h2 class="panel__title">Identity</h2></div>
        <div class="panel__body">
          <p class="identity__preview" data-name-preview aria-live="polite">${escapeHtml(displayName(c))}</p>
          <div class="field">
            <label class="label" for="ctl-name">Character name</label>
            <div class="input-with-action">
              <input class="input" id="ctl-name" type="text" data-field="name" value="${escapeHtml(c.name)}"
                maxlength="${NAME_MAX}" placeholder="Give it a name…" autocomplete="off" spellcheck="false">
              ${button({ label: 'Random name', icon: 'shuffle', iconOnly: true, variant: 'soft', attrs: 'data-action="random-name" title="Random name"' })}
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2 class="panel__title">Personality</h2></div>
        <div class="panel__body">
          ${personalityPicker({ personalities: personalityList(), value: c.personality })}
        </div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2 class="panel__title">Summary</h2></div>
        <div class="panel__body"><dl class="spec-list" data-specs>${specList(c)}</dl></div>
      </section>

      <section class="panel">
        <div class="panel__body actions-stack">
          <div class="actions-stack__row">
            ${button({ label: 'Randomize', icon: 'shuffle', variant: 'soft', attrs: 'data-action="randomize"' })}
            ${button({ label: 'Reset', icon: 'reset', variant: 'secondary', attrs: 'data-action="reset"' })}
          </div>
          ${button({ label: 'Save Character', icon: 'save', variant: 'primary', size: 'lg', attrs: 'data-action="save"' })}
          ${button({ label: 'Save as new character', icon: 'copy', variant: 'ghost', size: 'sm', attrs: 'data-action="save-new" hidden' })}
          <p class="save-status" data-save-status data-state="draft">Not saved yet</p>
        </div>
      </section>
    </aside>`;
}

/* ---------------------------------------------------------------------- */

export default {
  render() {
    const c = store.get().draft;
    return html`
      <header class="page-header">
        <div class="page-header__text">
          <span class="eyebrow">${icon('wand', { size: 14 })} Character Creator</span>
          <h1 class="page-header__title">Design your character</h1>
          <span class="creator__mode" data-mode></span>
          <p class="page-header__desc">Every change updates the live preview instantly. Poke it to say hi.</p>
        </div>
      </header>
      <div class="creator">
        ${renderControls(c)}
        ${renderStage(c)}
        ${renderInfo(c)}
      </div>`;
  },

  /**
   * @param {HTMLElement} root
   * @param {object} ctx router context
   * @param {(config) => Promise<object>} [onSave] save callback (defaults to the localStorage repository)
   */
  mount(root, ctx, onSave = saveCharacter) {
    const d = disposer();
    let config = store.get().draft;
    // { id, snapshot } of the saved character this draft is editing (null = never saved)
    let saved = store.get().saved;

    const stage = qs('[data-stage]', root);
    const live = createLiveCharacter(qs('[data-character]', root), config);
    d.add(() => live.destroy());

    // Shape thumbnails are tiny static characters that follow the body color
    const thumbs = qsa('[data-group="shape"] [data-art]', root).map(
      (el) => new Character(el, { shape: el.dataset.art, color: config.color, label: `${el.dataset.art} shape` }),
    );
    d.add(() => thumbs.forEach((t) => t.destroy()));

    d.add(enhance(root));

    /* ---------- view updates ---------- */
    const nameplate = qs('[data-nameplate]', root);
    const namePreview = qs('[data-name-preview]', root);
    const specs = qs('[data-specs]', root);
    const status = qs('[data-save-status]', root);
    const saveBtn = qs('[data-action="save"]', root);
    const saveNewBtn = qs('[data-action="save-new"]', root);
    const modeEl = qs('[data-mode]', root);

    const renderName = () => {
      const name = displayName(config);
      nameplate.textContent = name;
      nameplate.classList.toggle('is-placeholder', !config.name.trim());
      namePreview.textContent = name;
    };
    const isEditingSaved = () => Boolean(saved && config.id && saved.id === config.id);
    const renderStatus = () => {
      const editing = isEditingSaved();
      const dirty = !editing || snapshotOf(config) !== saved.snapshot;
      status.dataset.state = editing && !dirty ? 'saved' : 'draft';
      status.textContent = !editing ? 'Not saved yet' : dirty ? 'Unsaved changes' : 'All changes saved';
      saveBtn.querySelector('span').textContent = editing ? 'Save Changes' : 'Save Character';
      saveNewBtn.hidden = !editing;
      modeEl.innerHTML = editing
        ? `<span class="badge badge--mint">${icon('edit')} Editing a saved character</span>`
        : `<span class="badge badge--neutral">${icon('sparkle')} New character</span>`;
    };
    const setSaved = (value) => {
      saved = value;
      store.set({ saved });
    };
    const renderDerived = (field) => {
      if (field === 'background' || field === '*') stage.style.setProperty('--stage-bg', stageBackground(config.background));
      if (field === 'color' || field === '*') thumbs.forEach((t) => t.setColor(config.color));
      if (field === 'name' || field === '*') renderName();
      specs.innerHTML = specList(config);
      renderStatus();
    };

    const commit = (next) => {
      config = next;
      store.setDraft(config);
    };

    /* ---------- single edit path ---------- */
    const onControl = (e) => {
      const { field, value } = e.detail;
      if (!(field in FIELDS)) return;
      commit({ ...config, [field]: sanitizeField(field, value) });
      live.apply(field, config);
      renderDerived(field);
    };
    root.addEventListener('control:change', onControl);
    d.add(() => root.removeEventListener('control:change', onControl));

    const replaceAll = (next, message, { react = true } = {}) => {
      commit(next);
      Object.keys(FIELDS).forEach((f) => setControlValue(root, f, config[f]));
      live.applyAll(config, { react });
      renderDerived('*');
      if (message) toast(message.text, { icon: message.icon });
    };

    /** Persist via the save callback. asNew=true always creates a new character. */
    const save = async (asNew) => {
      saveBtn.disabled = saveNewBtn.disabled = true;
      try {
        const updating = !asNew && isEditingSaved();
        const record = await onSave(asNew ? { ...config, id: undefined } : config);
        commit({ ...config, id: record.id });
        setSaved({ id: record.id, snapshot: snapshotOf(config) });
        renderStatus();
        const where = characters.status().persistent ? '' : ' (this session only — browser storage is unavailable)';
        toast(`${updating ? 'Updated' : 'Saved'} “${displayName(config)}”${where}`, { icon: 'check' });
        root.dispatchEvent(new CustomEvent('character:saved', { bubbles: true, detail: { record } }));
      } catch (err) {
        console.error(err);
        toast(err.message || 'Could not save — please try again', { icon: 'warning' });
      } finally {
        saveBtn.disabled = saveNewBtn.disabled = false;
      }
    };

    /* ---------- actions ---------- */
    d.add(on(root, 'click', '[data-action]', async (_, btn) => {
      switch (btn.dataset.action) {
        case 'random-name': {
          const name = randomName();
          commit({ ...config, name });
          setControlValue(root, 'name', name);
          live.apply('name', config);
          renderDerived('name');
          break;
        }
        case 'randomize': {
          const next = { ...randomConfig(), id: config.id };
          replaceAll(next, { text: `Meet ${displayName(next)}!`, icon: 'shuffle' });
          break;
        }
        case 'reset':
          replaceAll({ ...createCharacterConfig(), id: config.id }, { text: 'Character reset to defaults', icon: 'reset' });
          break;
        case 'save':
          await save(false);
          break;
        case 'save-new':
          await save(true);
          break;
      }
    }));

    /* ---------- route intent: #/app/create?id=… (edit) or #/app/create?new=1 ---------- */
    (async () => {
      const id = ctx?.query?.get('id');
      if (ctx?.query?.get('new')) {
        setSaved(null);
        replaceAll(createCharacterConfig(), null, { react: false });
      } else if (id && config.id !== id) {
        // Load the saved character (unless this draft already is it, possibly with unsaved edits)
        const record = await characters.get(id);
        if (record) {
          const loaded = sanitizeConfig(record);
          setSaved({ id: loaded.id, snapshot: snapshotOf(loaded) });
          replaceAll(loaded, null, { react: false });
        } else {
          toast('That character could not be found', { icon: 'warning' });
        }
      } else if (config.id && !(await characters.get(config.id))) {
        // The character being edited was deleted elsewhere → this draft is new again
        setSaved(null);
        commit({ ...config, id: undefined });
      }
      if (id || ctx?.query?.get('new')) history.replaceState(null, '', '#/app/create');
      renderStatus();
    })();

    renderStatus();
    return () => d.run();
  },
};
