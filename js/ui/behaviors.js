/**
 * Progressive behaviour for components rendered by ui/components.js.
 * enhance(root) wires everything inside root and returns a cleanup function.
 *
 * Emits a bubbling `control:change` CustomEvent { field, value } for every
 * data-field control, and `tabs:change` { tabs, tab } for tab lists.
 */
import { on, qsa } from '../core/dom.js';
import { formatValue } from './components.js';

const emit = (el, field, value) =>
  el.dispatchEvent(new CustomEvent('control:change', { bubbles: true, detail: { field, value } }));

/* ---------- Tabs ---------- */
function positionIndicator(list) {
  const active = list.querySelector('[role="tab"][aria-selected="true"]');
  const ind = list.querySelector('.tabs__indicator');
  if (!active || !ind) return;
  list.style.setProperty('--tab-x', `${active.offsetLeft}px`);
  list.style.setProperty('--tab-w', `${active.offsetWidth}px`);
  list.style.setProperty('--tab-y', `${active.offsetTop}px`);
  list.style.setProperty('--tab-h', `${active.offsetHeight}px`);
}

export function selectTab(tab, { focus = false } = {}) {
  const list = tab.closest('[role="tablist"]');
  qsa('[role="tab"]', list).forEach((t) => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  });
  positionIndicator(list);
  if (focus) tab.focus();
  tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  list.dispatchEvent(new CustomEvent('tabs:change', { bubbles: true, detail: { tabs: list.dataset.tabs, tab: tab.dataset.tab } }));
}

function enhanceTabs(root) {
  const lists = qsa('[role="tablist"]', root);
  lists.forEach(positionIndicator);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => lists.forEach(positionIndicator)) : null;
  lists.forEach((l) => ro?.observe(l));
  // Fonts loading late shift tab widths
  document.fonts?.ready.then(() => lists.forEach(positionIndicator));

  const offClick = on(root, 'click', '[role="tab"]', (_, tab) => selectTab(tab));
  const offKey = on(root, 'keydown', '[role="tab"]', (e, tab) => {
    const tabsEls = qsa('[role="tab"]', tab.closest('[role="tablist"]'));
    const i = tabsEls.indexOf(tab);
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabsEls.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(tabsEls[(next + tabsEls.length) % tabsEls.length], { focus: true });
  });
  return () => { offClick(); offKey(); ro?.disconnect(); };
}

/* ---------- Radio groups (options, swatches) ---------- */
function setRadio(group, value) {
  let matched = false;
  qsa('[role="radio"]', group).forEach((r) => {
    const isCustom = r.hasAttribute('data-custom');
    const checked = !isCustom && r.dataset.value === value;
    matched ||= checked;
    r.setAttribute('aria-checked', String(checked));
    r.tabIndex = checked ? 0 : -1;
  });
  const custom = group.querySelector('[data-custom]');
  if (custom) {
    custom.setAttribute('aria-checked', String(!matched));
    custom.tabIndex = matched ? -1 : 0;
    const input = custom.querySelector('input');
    if (input && value && /^#[0-9a-f]{6}$/i.test(value)) input.value = value;
  }
}

function enhanceRadios(root) {
  const offClick = on(root, 'click', '[role="radio"][data-value]', (_, radio) => {
    const group = radio.closest('[role="radiogroup"]');
    setRadio(group, radio.dataset.value);
    emit(radio, radio.dataset.field, radio.dataset.value);
  });
  const offKey = on(root, 'keydown', '[role="radio"]', (e, radio) => {
    const radios = qsa('[role="radio"][data-value]', radio.closest('[role="radiogroup"]'));
    const i = radios.indexOf(radio);
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (delta === undefined || i < 0) return;
    e.preventDefault();
    const next = radios[(i + delta + radios.length) % radios.length];
    next.focus();
    next.click();
  });
  return () => { offClick(); offKey(); };
}

/* ---------- Inputs: sliders, color, text, switch ---------- */
function paintSlider(input) {
  const min = +input.min || 0;
  const max = +input.max || 100;
  input.style.setProperty('--fill', `${((+input.value - min) / (max - min)) * 100}%`);
  const out = input.closest('.field')?.querySelector(`[data-output="${input.dataset.field}"]`);
  if (out) out.textContent = formatValue(input.dataset.format, +input.value);
}

function enhanceInputs(root) {
  return on(root, 'input', 'input[data-field]', (_, input) => {
    const { field } = input.dataset;
    if (input.type === 'range') {
      paintSlider(input);
      emit(input, field, +input.value);
    } else if (input.type === 'checkbox') {
      emit(input, field, input.checked);
    } else if (input.type === 'color') {
      setRadio(input.closest('[role="radiogroup"]'), input.value);
      emit(input, field, input.value);
    } else {
      emit(input, field, input.value);
    }
  });
}

/** Reflect a value back into whatever control edits `field` (after reset / randomize). */
export function setControlValue(root, field, value) {
  qsa(`[role="radiogroup"][data-group="${field}"]`, root).forEach((g) => setRadio(g, value));
  qsa(`input[data-field="${field}"]`, root).forEach((input) => {
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else if (input.type === 'range') { input.value = value; paintSlider(input); }
    else if (input.type === 'color') { if (/^#[0-9a-f]{6}$/i.test(value)) input.value = value; }
    else if (document.activeElement !== input) input.value = value;
  });
}

export function enhance(root) {
  const offs = [enhanceTabs(root), enhanceRadios(root), enhanceInputs(root)];
  return () => offs.forEach((off) => off());
}
