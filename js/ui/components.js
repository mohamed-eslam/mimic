/**
 * Reusable UI building blocks. Each returns an HTML string; interactive
 * behaviour is attached afterwards by ui/behaviors.js (enhance()).
 *
 * Controls that edit data share one convention: data-field="<key>" (+ data-value
 * for discrete options). behaviors.js turns any edit into a bubbling
 * `control:change` event { field, value }, so pages need a single listener.
 */
import { icon } from './icons.js';
import { escapeHtml, html } from '../core/dom.js';

export function button({ label, variant = 'secondary', size, icon: ic, iconRight, href, attrs = '', iconOnly = false, type = 'button' }) {
  const cls = ['btn', variant && `btn--${variant}`, size && `btn--${size}`, iconOnly && 'btn--icon'].filter(Boolean).join(' ');
  const inner = html`${ic ? icon(ic) : ''}${iconOnly ? `<span class="visually-hidden">${label}</span>` : `<span>${label}</span>`}${iconRight ? icon(iconRight) : ''}`;
  return href
    ? `<a class="${cls}" href="${href}" ${attrs}>${inner}</a>`
    : `<button class="${cls}" type="${type}" ${attrs}>${inner}</button>`;
}

export function pageHeader({ eyebrow, title, description, actions = '' }) {
  return html`
    <header class="page-header">
      <div class="page-header__text">
        ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
        <h1 class="page-header__title">${title}</h1>
        ${description ? `<p class="page-header__desc">${description}</p>` : ''}
      </div>
      ${actions ? `<div class="page-header__actions">${actions}</div>` : ''}
    </header>`;
}

export function emptyState({ icon: ic = 'sparkle', title, text, action = '' }) {
  return html`
    <div class="empty-state">
      <div class="empty-state__art">${icon(ic)}</div>
      <h2 class="empty-state__title">${title}</h2>
      <p class="empty-state__text">${text}</p>
      ${action}
    </div>`;
}

/**
 * Tabs. items: [{ id, label, icon? }]. Panels are linked by id: `${id}-panel-${item.id}`.
 * variant: '' | 'block' | 'vertical'
 */
export function tabs({ id, items, active = items[0].id, label = 'Tabs', variant = '' }) {
  return html`
    <div class="tabs ${variant ? `tabs--${variant}` : ''}" role="tablist" aria-label="${label}" data-tabs="${id}">
      <span class="tabs__indicator" aria-hidden="true"></span>
      ${items.map((t) => `
        <button class="tab" role="tab" type="button" id="${id}-tab-${t.id}" data-tab="${t.id}"
          aria-controls="${id}-panel-${t.id}" aria-selected="${t.id === active}" tabindex="${t.id === active ? 0 : -1}">
          ${t.icon ? icon(t.icon) : ''}<span>${t.label}</span>
        </button>`)}
    </div>`;
}

export function tabPanel({ id, tab, active, content, className = '' }) {
  return `<div class="tab-panel ${className}" role="tabpanel" id="${id}-panel-${tab}" aria-labelledby="${id}-tab-${tab}" ${active ? '' : 'hidden'}>${content}</div>`;
}

const FORMATS = {
  percent: (v) => `${Math.round(v * 100)}%`,
  number: (v) => String(v),
};

export function slider({ field, label, min, max, step = 0.01, value, format = 'percent', hint }) {
  const id = `ctl-${field}`;
  const fill = ((value - min) / (max - min)) * 100;
  return html`
    <div class="field">
      <div class="field__row">
        <label class="label" for="${id}">${label}</label>
        <output class="slider-value" for="${id}" data-output="${field}">${FORMATS[format](value)}</output>
      </div>
      <input class="slider" type="range" id="${id}" data-field="${field}" data-format="${format}"
        min="${min}" max="${max}" step="${step}" value="${value}" style="--fill:${fill}%">
      ${hint ? `<p class="hint">${hint}</p>` : ''}
    </div>`;
}

/** Visual radio group. options: [{ value, label, art? }] */
export function optionGrid({ field, label, options, value, min = 84 }) {
  return html`
    <div class="option-grid" role="radiogroup" aria-label="${label}" data-group="${field}" style="--option-min:${min}px">
      ${options.map((o) => `
        <button class="option" type="button" role="radio" data-field="${field}" data-value="${o.value}"
          aria-checked="${o.value === value}" tabindex="${o.value === value ? 0 : -1}">
          ${o.art !== undefined ? `<span class="option__art" data-art="${o.value}">${o.art}</span>` : ''}
          <span>${o.label}</span>
        </button>`)}
    </div>`;
}

/** Color swatches (+ optional custom picker). colors: [{ name, value }] */
export function swatches({ field, label, colors, value, custom = true }) {
  const isPreset = colors.some((c) => c.value === value);
  return html`
    <div class="swatches" role="radiogroup" aria-label="${label}" data-group="${field}">
      ${colors.map((c) => `
        <button class="swatch" type="button" role="radio" data-field="${field}" data-value="${c.value}"
          style="--swatch:${c.value}" aria-checked="${c.value === value}" tabindex="${c.value === value ? 0 : -1}"
          title="${c.name}"><span class="visually-hidden">${c.name}</span></button>`)}
      ${custom ? `
        <label class="swatch swatch--custom" role="radio" aria-checked="${!isPreset}" title="Custom color" data-custom="${field}">
          <span class="visually-hidden">Custom ${label.toLowerCase()}</span>
          <input type="color" data-field="${field}" value="${value}" aria-label="Pick a custom ${label.toLowerCase()}">
        </label>` : ''}
    </div>`;
}

export function switchControl({ field, label, checked }) {
  return html`
    <label class="switch">
      <input type="checkbox" role="switch" data-field="${field}" ${checked ? 'checked' : ''}>
      <span class="switch__track" aria-hidden="true"></span>
      <span class="label">${label}</span>
    </label>`;
}

export function textField({ field, label, value, placeholder = '', maxLength, attrs = '' }) {
  const id = `ctl-${field}`;
  return html`
    <div class="field">
      <label class="label" for="${id}">${label}</label>
      <input class="input" id="${id}" type="text" data-field="${field}" value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}" ${maxLength ? `maxlength="${maxLength}"` : ''} autocomplete="off" spellcheck="false" ${attrs}>
    </div>`;
}

export function placeholderFigure({ label = 'Coming soon', hint = '' } = {}) {
  return html`
    <div class="placeholder-figure">
      <svg viewBox="0 0 200 220" aria-hidden="true">
        <ellipse class="placeholder-figure__shadow" cx="100" cy="206" rx="64" ry="9"/>
        <path class="placeholder-figure__body" d="M100 26c52 0 80 40 80 92 0 52-30 80-80 80s-80-28-80-80c0-52 28-92 80-92z"/>
        <g class="placeholder-figure__icon" fill="none" stroke-width="5" stroke-linecap="round"><path d="M100 96v40M80 116h40"/></g>
      </svg>
      <span class="placeholder-figure__label">${label}</span>
      ${hint ? `<span class="text-sm text-muted">${hint}</span>` : ''}
    </div>`;
}

export const formatValue = (format, v) => (FORMATS[format] ?? FORMATS.number)(v);

/**
 * Personality picker (radio cards). personalities: [{ id, label, emoji, description }]
 * Emits control:change { field: 'personality', value } via behaviors.js.
 */
export function personalityPicker({ personalities, value, field = 'personality', compact = false }) {
  return html`
    <div class="persona-list ${compact ? 'persona-list--compact' : ''}" role="radiogroup" aria-label="Personality" data-group="${field}">
      ${personalities.map((p) => `
        <button class="persona" type="button" role="radio" data-field="${field}" data-value="${p.id}"
          data-persona="${p.id}" aria-checked="${p.id === value}" tabindex="${p.id === value ? 0 : -1}">
          <span class="persona__emoji" aria-hidden="true">${p.emoji}</span>
          <span class="persona__text">
            <span class="persona__label">${p.label}</span>
            ${compact ? '' : `<span class="persona__desc">${p.description}</span>`}
          </span>
        </button>`)}
    </div>`;
}
