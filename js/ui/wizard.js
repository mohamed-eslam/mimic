/**
 * Schema-driven, step-by-step request wizard (custom brief, integration request…).
 *
 * Schema:
 *   { id, title, requestType(answers) → string, steps: [Step], prefill?(query) → answers }
 *   Step: { id, title, intro?, showIf?(a, ctx), questions: [Q] }  |  { id, title, type: 'review', questions?: [Q] }
 *         (a review step may carry its own questions, e.g. contact details, shown above the summary)
 *   Q: { id, type, label, hint?, summaryLabel?, required?, showIf?(a, ctx), advanced?,
 *        options?: [{ value, label, desc?, icon?, image? }], multiple?, max?, other?,  // choice types
 *        placeholder?, accept?, maxFiles?, tone? }
 *   Types: cards | chips | list | text | email | tel | url | textarea | select | colors | files | consent | note | readonly | section
 *   advanced: optional questions grouped under a collapsed "More details" disclosure at the end of the step
 *   image: a choice option rendered as a visual card (character style etc.)
 *
 * All interface text comes from the i18n dictionary (wizard.*); question text
 * comes from the (localized) schema. User-entered values are wrapped in <bdi>
 * so emails, URLs and Latin names render correctly inside Arabic text.
 */
import { escapeHtml, on } from '../core/dom.js';
import { icon } from './icons.js';
import { t, joinList } from '../i18n/index.js';
import { BUSINESS } from '../config/business.js';
import { submitLead, emailLink, downloadText } from '../services/lead-service.js';
import { createRequest, CUSTOMER_TIMELINE } from '../models/request.js';

const OTHER = '__other';
const CHOICE = new Set(['cards', 'chips', 'list']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LTR_TYPES = { email: 'email', tel: 'tel', url: 'url' };

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || v === false;
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const bdi = (v) => `<bdi>${escapeHtml(v)}</bdi>`;

export function mountWizard(root, schema, { query } = {}) {
  const draftKey = `character-lab:draft:${schema.id}`;
  const state = { step: 0, answers: {}, files: {}, errors: {}, result: null, sending: false, animate: true, moreOpen: {} };
  const objectUrls = new Set();
  const allQuestions = schema.steps.flatMap((s) => s.questions ?? []);

  /* ---------- persistence (answers only; files can't be stored) ---------- */
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (saved?.answers) Object.assign(state.answers, saved.answers);
  } catch { /* storage unavailable or corrupt → start fresh */ }
  if (schema.prefill && query) Object.assign(state.answers, schema.prefill(query, state.answers));
  const persist = () => {
    try { localStorage.setItem(draftKey, JSON.stringify({ answers: state.answers, savedAt: Date.now() })); } catch { /* ignore */ }
  };

  const ctx = () => ({ files: state.files, query });
  const visibleSteps = () => schema.steps.filter((s) => !s.showIf || s.showIf(state.answers, ctx()));
  const visibleQs = (step) => (step.questions ?? []).filter((q) => !q.showIf || q.showIf(state.answers, ctx()));
  const current = () => visibleSteps()[Math.min(state.step, visibleSteps().length - 1)];

  /* ---------- formatting ---------- */
  function optionLabel(q, v) {
    if (v === OTHER) return t('wizard.otherShort');
    return q.options?.find((o) => o.value === v)?.label ?? v;
  }
  function formatAnswer(q) {
    const a = state.answers;
    if (q.type === 'files') return (state.files[q.id] ?? []).map((f) => f.name).join(', ');
    if (q.type === 'colors') return arr(a[q.id]).join('  ');
    if (q.type === 'consent') return a[q.id] ? t('wizard.confirmed') : '';
    if (CHOICE.has(q.type) || q.type === 'select') {
      const vals = arr(a[q.id]);
      const parts = vals.filter((v) => v !== OTHER).map((v) => optionLabel(q, v));
      if (vals.includes(OTHER)) parts.push(`${t('wizard.otherShort')}: ${a[`${q.id}${OTHER}`] || t('wizard.otherNotDescribed')}`);
      return joinList(parts);
    }
    return a[q.id] ?? '';
  }
  const answeredRows = (step) => visibleQs(step).filter((q) => q.type !== 'note' && q.type !== 'section').map((q) => ({ q, value: formatAnswer(q) })).filter((r) => r.value);

  /** Structured plain-text brief for the operations team. */
  function briefText(ref) {
    const lines = [schema.title.toUpperCase(), ref ? t('wizard.reference', { ref }) : null, t('wizard.prepared', { date: new Date().toLocaleString() }), ''].filter((l) => l !== null);
    for (const step of visibleSteps()) {
      const rows = answeredRows(step); // review steps contribute their own questions (e.g. contact details)
      if (!rows.length) continue;
      lines.push(`== ${step.title} ==`);
      rows.forEach(({ q, value }) => lines.push(`- ${q.summaryLabel ?? q.label}: ${value}`));
      lines.push('');
    }
    if (state.answers.finalNotes) lines.push(`== ${t('wizard.finalNotesSection')} ==`, state.answers.finalNotes, '');
    return lines.join('\n');
  }

  /* ---------- validation ---------- */
  function validateStep(step) {
    const errors = {};
    for (const q of visibleQs(step)) {
      const v = state.answers[q.id];
      if (q.type === 'files') {
        if (q.required && !(state.files[q.id] ?? []).length) errors[q.id] = t('wizard.errors.files');
        continue;
      }
      if (q.required && isEmpty(v)) errors[q.id] = q.type === 'consent' ? t('wizard.errors.confirm') : CHOICE.has(q.type) ? t('wizard.errors.choose') : t('wizard.errors.required');
      else if (q.type === 'email' && v && !EMAIL_RE.test(v)) errors[q.id] = t('wizard.errors.email');
      else if (q.max && arr(v).length > q.max) errors[q.id] = t('wizard.errors.max', { n: q.max });
      if (arr(v).includes(OTHER) && !String(state.answers[`${q.id}${OTHER}`] ?? '').trim()) errors[`${q.id}${OTHER}`] = t('wizard.errors.describe');
    }
    return errors;
  }

  /* ---------- rendering ---------- */
  function renderQuestion(q) {
    const a = state.answers;
    const err = state.errors[q.id];
    const errId = `${q.id}-err`;
    // Inside "More details (optional)" every field is optional by context — no per-field tag.
    const label = `${escapeHtml(q.label)}${q.required ? ' <span class="wz-req" aria-hidden="true">*</span>' : q.advanced ? '' : ` <span class="wz-opt">${t('wizard.optional')}</span>`}`;

    if (q.type === 'section') return `<h3 class="wz-section">${escapeHtml(q.label)}</h3>`;
    const hint = q.hint ? `<p class="wz-hint">${escapeHtml(q.hint)}</p>` : '';
    const error = err ? `<p class="wz-error" id="${errId}" role="alert">${escapeHtml(err)}</p>` : '';
    // 3.3.1 / 4.1.2: invalid state + error text programmatically tied to the control
    const describedBy = err ? `aria-describedby="${errId}" aria-invalid="true"` : '';
    const req = q.required ? 'aria-required="true"' : '';

    if (q.type === 'readonly') {
      return `<div class="wz-fixed"><span>${escapeHtml(q.label)}</span><strong>${bdi(a[q.id] ?? '')}</strong></div>`;
    }
    if (q.type === 'note') {
      return `<div class="wz-note wz-note--${q.tone ?? 'info'}">${icon(q.tone === 'warning' ? 'warning' : 'info')}<p>${escapeHtml(q.label)}</p></div>`;
    }

    if (CHOICE.has(q.type)) {
      const opts = [...q.options, ...(q.other ? [{ value: OTHER, label: t('wizard.otherShort'), other: true }] : [])];
      const selected = arr(a[q.id]);
      const role = q.multiple ? 'checkbox' : 'radio';
      const otherErr = state.errors[`${q.id}${OTHER}`];
      const multiHint = q.multiple ? `<p class="wz-hint">${q.max ? t('wizard.chooseUpTo', { n: q.max }) : t('wizard.chooseAll')}${q.hint ? ` ${escapeHtml(q.hint)}` : ''}</p>` : hint;
      return `
        <fieldset class="wz-q" data-q="${q.id}">
          <legend class="wz-label">${label}</legend>
          ${multiHint}
          <div class="wz-options wz-options--${q.type} ${opts.some((o) => o.image) ? 'wz-options--visual' : ''}" role="${q.multiple ? 'group' : 'radiogroup'}" aria-label="${escapeHtml(q.label)}" ${q.multiple ? '' : req} ${describedBy}>
            ${opts.map((o) => `
              <button type="button" class="wz-option ${o.other ? 'wz-option--other' : ''}" role="${role}" ${o.other ? `aria-label="${escapeHtml(t('wizard.other'))}"` : ''} aria-checked="${selected.includes(o.value)}" data-q="${q.id}" data-value="${escapeHtml(o.value)}">
                ${o.other ? `<span class="wz-option__pen" aria-hidden="true">${icon('edit', { size: 14 })}</span>` : ''}${o.image ? `<span class="wz-option__media"><img src="${escapeHtml(o.image)}" alt="" loading="lazy" decoding="async"></span>` : o.icon ? `<span class="wz-option__icon">${icon(o.icon)}</span>` : ''}
                <span class="wz-option__text"><span class="wz-option__label">${escapeHtml(o.label)}</span>${o.desc ? `<span class="wz-option__desc">${escapeHtml(o.desc)}</span>` : ''}</span>
                <span class="wz-option__check" aria-hidden="true">${icon('check')}</span>
              </button>`).join('')}
          </div>
          ${selected.includes(OTHER) ? `
            <div class="wz-other">
              <label class="visually-hidden" for="${q.id}${OTHER}">${t('wizard.describe')}</label>
              <textarea class="textarea" id="${q.id}${OTHER}" data-field="${q.id}${OTHER}" rows="2" dir="auto" aria-required="true" placeholder="${escapeHtml(t('wizard.describePlaceholder'))}" ${otherErr ? `aria-invalid="true" aria-describedby="${q.id}${OTHER}-err"` : ''}>${escapeHtml(a[`${q.id}${OTHER}`] ?? '')}</textarea>
              ${otherErr ? `<p class="wz-error" id="${q.id}${OTHER}-err" role="alert">${escapeHtml(otherErr)}</p>` : ''}
            </div>` : ''}
          ${error}
        </fieldset>`;
    }

    const id = `wz-${q.id}`;
    if (q.type === 'textarea') {
      return `<div class="wz-q"><label class="wz-label" for="${id}">${label}</label>${hint}<textarea class="textarea" id="${id}" data-field="${q.id}" rows="${q.rows ?? 3}" dir="auto" placeholder="${escapeHtml(q.placeholder ?? '')}" ${req} ${describedBy}>${escapeHtml(a[q.id] ?? '')}</textarea>${error}</div>`;
    }
    if (q.type === 'select') {
      return `<div class="wz-q"><label class="wz-label" for="${id}">${label}</label>${hint}
        <select class="select" id="${id}" data-field="${q.id}" ${req} ${describedBy}><option value="">${t('wizard.select')}</option>
        ${q.options.map((o) => `<option value="${escapeHtml(o.value)}" ${a[q.id] === o.value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</select>${error}</div>`;
    }
    if (q.type === 'colors') {
      const colors = arr(a[q.id]);
      return `<div class="wz-q" data-q="${q.id}"><span class="wz-label">${label}</span>${hint}
        <div class="wz-colors">
          ${colors.map((c, i) => `<span class="wz-color"><input type="color" value="${escapeHtml(c)}" data-color="${q.id}" data-index="${i}" aria-label="${t('wizard.brandColor', { n: i + 1 })}"><button type="button" class="wz-color__remove" data-color-remove="${q.id}" data-index="${i}" aria-label="${t('wizard.removeColor', { n: i + 1 })}">${icon('close')}</button></span>`).join('')}
          ${colors.length < 4 ? `<button type="button" class="btn btn--secondary btn--sm" data-color-add="${q.id}">${icon('plus')}<span>${t('wizard.addColor')}</span></button>` : ''}
        </div>${error}</div>`;
    }
    if (q.type === 'files') {
      const files = state.files[q.id] ?? [];
      const max = q.maxFiles ?? BUSINESS.uploads.maxFiles;
      return `<div class="wz-q" data-q="${q.id}"><span class="wz-label">${label}</span>${hint}
        <label class="wz-drop ${files.length >= max ? 'is-full' : ''}">
          ${icon('image')}<span><strong>${t('wizard.chooseFiles')}</strong> · ${t('wizard.fileLimits', { max, mb: BUSINESS.uploads.maxFileMB })}</span>
          <input type="file" data-files="${q.id}" accept="${escapeHtml(q.accept ?? BUSINESS.uploads.accept)}" multiple ${files.length >= max ? 'disabled' : ''} class="visually-hidden" ${describedBy}>
        </label>
        ${files.length ? `<ul class="wz-files" role="list">${files.map((f, i) => `
          <li class="wz-file">${f.type.startsWith('image/') ? `<img src="${f.__url}" alt="">` : `<span class="wz-file__doc">${icon('brief')}</span>`}
            <span class="wz-file__name">${bdi(f.name)}</span>
            <button type="button" class="btn btn--ghost btn--icon btn--sm" data-file-remove="${q.id}" data-index="${i}" aria-label="${escapeHtml(t('wizard.remove', { name: f.name }))}">${icon('close')}</button></li>`).join('')}</ul>` : ''}
        <p class="wz-hint">${t('wizard.filesLocal')}</p>${error}</div>`;
    }
    if (q.type === 'consent') {
      return `<div class="wz-q wz-consent"><label class="wz-check"><input type="checkbox" data-field="${q.id}" ${a[q.id] ? 'checked' : ''} ${req} ${describedBy}><span>${escapeHtml(q.label)}${q.required ? ' <span class="wz-req" aria-hidden="true">*</span>' : ''}</span></label>${error}</div>`;
    }
    const type = LTR_TYPES[q.type] ?? 'text';
    const ltr = LTR_TYPES[q.type] ? 'dir="ltr"' : 'dir="auto"';
    const auto = LTR_TYPES[q.type] ?? 'off';
    return `<div class="wz-q"><label class="wz-label" for="${id}">${label}</label>${hint}<input class="input" id="${id}" type="${type}" ${ltr} data-field="${q.id}" value="${escapeHtml(a[q.id] ?? '')}" placeholder="${escapeHtml(q.placeholder ?? '')}" autocomplete="${auto}" ${req} ${describedBy}>${error}</div>`;
  }

  function renderReview(step) {
    const own = visibleQs(step);
    const sections = visibleSteps().filter((s) => s.type !== 'review').map((s, i) => {
      const rows = answeredRows(s);
      return `
        <section class="wz-review__section">
          <header><h3>${escapeHtml(s.title)}</h3><button type="button" class="btn btn--ghost btn--sm" data-goto="${i}">${icon('edit')}<span>${t('wizard.edit')}</span></button></header>
          ${rows.length ? `<dl>${rows.map(({ q, value }) => `<div><dt>${escapeHtml(q.summaryLabel ?? q.label)}</dt><dd>${bdi(value)}</dd></div>`).join('')}</dl>` : `<p class="wz-hint">${t('wizard.nothingAdded')}</p>`}
        </section>`;
    }).join('');
    return `
      <div class="wz-review">
        ${own.length ? `<div class="wz-review__form">${renderQuestions(step, own)}</div>` : ''}
        <p class="wz-review__intro">${t('wizard.reviewIntro')}</p>
        <div class="wz-review__doc"><h2 class="wz-review__title">${escapeHtml(schema.title)}</h2>${sections}</div>
        <div class="wz-q"><label class="wz-label" for="wz-finalNotes">${t('wizard.finalNotes')} <span class="wz-opt">${t('wizard.optional')}</span></label>
          <textarea class="textarea" id="wz-finalNotes" data-field="finalNotes" rows="3" dir="auto" placeholder="${escapeHtml(t('wizard.finalNotesPlaceholder'))}">${escapeHtml(state.answers.finalNotes ?? '')}</textarea></div>
        ${renderResultPanel()}
      </div>`;
  }

  function renderResultPanel() {
    const r = state.result;
    if (!r || r.status === 'sent') return '';
    if (r.status === 'not-configured') {
      const mail = emailLink(`${schema.title} — ${state.answers.contactName ?? ''}`, briefText());
      return `
        <div class="wz-result wz-result--info" role="status" data-result="not-configured">
          ${icon('info')}
          <div><h3>${t('submit.notConfiguredTitle')}</h3><p>${t('submit.notConfiguredText')}</p>
            <div class="cluster">
              <button type="button" class="btn btn--secondary" data-download>${icon('download')}<span>${t('submit.download')}</span></button>
              ${mail ? `<a class="btn btn--secondary" href="${mail}">${icon('chat')}<span>${t('submit.email')}</span></a>` : ''}
            </div>
            ${mail ? `<p class="wz-hint">${t('submit.emailNote')}</p>` : ''}
          </div>
        </div>`;
    }
    return `
      <div class="wz-result wz-result--error" role="alert" data-result="error">
        ${icon('warning')}<div><h3>${t('submit.errorTitle')}</h3><p>${t('submit.errorText')}</p></div>
      </div>`;
  }

  function renderSuccess() {
    const r = state.result;
    const sla = BUSINESS.responseHours ? t('submit.sentWithSla', { hours: BUSINESS.responseHours }) : t('submit.sentNoSla');
    root.innerHTML = `
      <div class="wz-success" data-result="sent">
        <span class="wz-success__icon">${icon('check')}</span>
        <h2>${t('submit.sentTitle')}</h2>
        <p class="wz-success__text">${sla}</p>
        ${r.reference ? `<p class="badge badge--neutral">${t('submit.reference', { ref: `<bdi>${escapeHtml(r.reference)}</bdi>` })}</p>` : ''}
        <div class="wz-timeline"><h3>${t('submit.statusTitle')}</h3>
          <ol role="list">${CUSTOMER_TIMELINE.map((s, i) => `<li class="${i === 0 ? 'is-current' : ''}"><span></span>${t(`status.timeline.${s.key}`)}</li>`).join('')}</ol>
        </div>
        <div class="cluster" style="justify-content:center"><a class="btn btn--primary" href="#/">${t('placeholder.backHome')}</a></div>
      </div>`;
  }

  function render() {
    if (state.result?.status === 'sent') return renderSuccess();
    const steps = visibleSteps();
    state.step = Math.min(state.step, steps.length - 1);
    const step = steps[state.step];
    const last = state.step === steps.length - 1;
    root.innerHTML = `
      <div class="wizard">
        <div class="wizard__main">
          <nav class="wz-progress" aria-label="${t('wizard.progress')}">
            <p class="visually-hidden">${t('wizard.stepOf', { n: state.step + 1, total: steps.length })}</p>
            <ol class="wz-progress__steps" role="list" style="--steps:${steps.length}">
              ${steps.map((s, i) => `<li class="${i < state.step ? 'is-done' : ''} ${i === state.step ? 'is-current' : ''}"><button type="button" class="wz-progress__step" data-goto="${i}" ${i > state.step ? 'disabled' : ''} ${i === state.step ? 'aria-current="step"' : ''}><span class="wz-progress__num" aria-hidden="true">${i < state.step ? icon('check', { size: 12 }) : i + 1}</span><span class="wz-progress__name">${escapeHtml(s.short ?? s.title)}</span></button></li>`).join('')}
            </ol>
          </nav>
          <section class="wz-step ${state.animate ? 'wz-step--enter' : ''}" aria-labelledby="wz-step-title">
            <h2 class="wz-step__title" id="wz-step-title" tabindex="-1">${escapeHtml(step.title)}</h2>
            ${step.intro ? `<p class="wz-step__intro">${escapeHtml(step.intro)}</p>` : ''}
            <div class="wz-step__body">${step.type === 'review' ? renderReview(step) : renderQuestions(step, visibleQs(step))}</div>
          </section>
          <div class="wz-nav">
            <button type="button" class="btn btn--secondary" data-back ${state.step === 0 ? 'disabled' : ''}>${icon('arrowRight', { className: 'flip-rtl-reverse' })}<span>${t('wizard.back')}</span></button>
            <button type="button" class="btn btn--ghost btn--sm wz-reset" data-reset>${t('wizard.startOver')}</button>
            ${last
              ? `<button type="button" class="btn btn--primary btn--lg" data-submit ${state.sending ? 'disabled' : ''}><span>${state.sending ? t('wizard.sending') : state.result?.status === 'error' ? t('submit.retry') : t('wizard.submit')}</span></button>`
              : `<button type="button" class="btn btn--primary" data-next><span>${t('wizard.next')}</span>${icon('arrowRight', { className: 'flip-rtl' })}</button>`}
          </div>
        </div>
      </div>`;
    state.animate = false;
  }

  /** Main questions, then optional ones folded into a "More details" disclosure. */
  function renderQuestions(step, qs) {
    const main = qs.filter((q) => !q.advanced);
    const extra = qs.filter((q) => q.advanced);
    if (!extra.length) return main.map(renderQuestion).join('');
    const filled = extra.filter((q) => q.type !== 'note' && q.type !== 'section' && formatAnswer(q)).length;
    const hasError = extra.some((q) => state.errors[q.id] || state.errors[`${q.id}${OTHER}`]);
    const open = hasError || (state.moreOpen[step.id] ?? filled > 0);
    return `${main.map(renderQuestion).join('')}
      <details class="wz-more" data-more="${escapeHtml(step.id)}" ${open ? 'open' : ''}>
        <summary class="wz-more__toggle"><span>${t('wizard.moreDetails')}</span>${filled ? `<span class="wz-more__count">${t('wizard.moreAdded', { n: filled })}</span>` : ''}${icon('arrowRight', { size: 16, className: 'wz-more__chev' })}</summary>
        <div class="wz-more__body">${extra.map(renderQuestion).join('')}</div>
      </details>`;
  }

  // The sidebar summary was removed (review step holds the full summary); kept for reference/tests.
  function renderSummary() {
    const blocks = visibleSteps().filter((s) => s.type !== 'review').map((s) => {
      const rows = answeredRows(s);
      if (!rows.length) return '';
      return `<div class="wz-summary__block"><h3>${escapeHtml(s.short ?? s.title)}</h3><ul role="list">${rows.map(({ q, value }) => `<li><span>${escapeHtml(q.summaryLabel ?? q.label)}</span>${bdi(value)}</li>`).join('')}</ul></div>`;
    }).join('');
    return blocks || `<p class="wz-hint">${t('wizard.summaryEmpty')}</p>`;
  }
  const refreshSummary = () => {};

  /** Re-render the current step body, keeping focus on the same control. */
  function rerenderKeepFocus() {
    const active = document.activeElement;
    const key = active?.dataset?.value !== undefined ? `[data-q="${active.dataset.q}"][data-value="${CSS.escape(active.dataset.value)}"]`
      : active?.dataset?.field ? `[data-field="${active.dataset.field}"]` : null;
    render();
    if (key) root.querySelector(key)?.focus();
  }

  function goTo(i, { focus = true } = {}) {
    state.step = i;
    state.errors = {};
    state.animate = true;
    render();
    if (focus) {
      root.querySelector('#wz-step-title')?.focus();
      root.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    }
  }

  function next() {
    state.errors = validateStep(current());
    if (Object.keys(state.errors).length) {
      render();
      root.querySelector('.wz-error')?.closest('.wz-q, .wz-other')?.querySelector('button, input, textarea, select')?.focus();
      return;
    }
    goTo(state.step + 1);
  }

  async function submit() {
    const steps = visibleSteps();
    for (let i = 0; i < steps.length; i++) {
      const errors = validateStep(steps[i]); // includes questions on the review step (contact details)
      if (Object.keys(errors).length) {
        goTo(i, { focus: false }); state.errors = errors; render();
        root.querySelector('.wz-error')?.closest('.wz-q, .wz-other')?.querySelector('button, input, textarea, select')?.focus();
        return;
      }
    }
    state.sending = true;
    render();
    const files = Object.values(state.files).flat();
    const attachments = Object.entries(state.files).flatMap(([q, list]) => list.map((f) => ({ question: q, name: f.name, size: f.size, type: f.type })));
    const request = createRequest({ type: schema.requestType(state.answers), answers: state.answers, brief: briefText(), attachments });
    const result = await submitLead(schema.leadType ?? 'brief', request, files, schema.deps);
    state.sending = false;
    state.result = { ...result, reference: result.reference ?? (result.status === 'sent' ? request.clientRef : undefined) };
    if (result.status === 'sent') {
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    }
    render();
    root.dispatchEvent(new CustomEvent('wizard:submitted', { bubbles: true, detail: { status: result.status, request } }));
  }

  /* ---------- events ---------- */
  const offs = [];
  offs.push(on(root, 'click', '.wz-option', (_, btn) => {
    const q = allQuestions.find((x) => x.id === btn.dataset.q);
    const v = btn.dataset.value;
    if (q.multiple) {
      const set = new Set(arr(state.answers[q.id]));
      if (set.has(v)) set.delete(v); else if (!q.max || set.size < q.max) set.add(v);
      state.answers[q.id] = [...set];
    } else {
      state.answers[q.id] = v;
    }
    delete state.errors[q.id];
    persist();
    rerenderKeepFocus();
  }));
  offs.push(on(root, 'keydown', '.wz-option[role="radio"]', (e, btn) => {
    const rtl = document.documentElement.dir === 'rtl';
    const delta = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const all = [...btn.parentElement.querySelectorAll('.wz-option')];
    all[(all.indexOf(btn) + delta + all.length) % all.length].focus();
  }));
  offs.push(on(root, 'input', '[data-field]', (e, el) => {
    const key = el.dataset.field;
    state.answers[key] = el.type === 'checkbox' ? el.checked : el.value;
    // Validation only when relevant: once the field has a value, drop its error in place.
    if (state.errors[key] && !isEmpty(state.answers[key])) {
      delete state.errors[key];
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
      root.querySelector(`#${CSS.escape(key)}-err`)?.remove();
    }
    persist();
    refreshSummary();
  }));
  offs.push(on(root, 'change', 'select[data-field], input[type="checkbox"][data-field]', () => rerenderKeepFocus()));
  offs.push(on(root, 'input', '[data-color]', (_, el) => {
    const list = arr(state.answers[el.dataset.color]);
    list[+el.dataset.index] = el.value;
    state.answers[el.dataset.color] = list;
    persist();
    refreshSummary();
  }));
  offs.push(on(root, 'click', '[data-color-add]', (_, b) => { state.answers[b.dataset.colorAdd] = [...arr(state.answers[b.dataset.colorAdd]), '#141413']; persist(); rerenderKeepFocus(); }));
  offs.push(on(root, 'click', '[data-color-remove]', (_, b) => { const l = arr(state.answers[b.dataset.colorRemove]); l.splice(+b.dataset.index, 1); state.answers[b.dataset.colorRemove] = l; persist(); render(); }));
  offs.push(on(root, 'change', '[data-files]', (_, input) => {
    const qid = input.dataset.files;
    const max = BUSINESS.uploads.maxFiles;
    const list = state.files[qid] ?? [];
    const rejected = [];
    for (const f of input.files) {
      if (list.length >= max) { rejected.push(`${f.name} (${t('wizard.limitReached')})`); continue; }
      if (f.size > BUSINESS.uploads.maxFileMB * 1024 * 1024) { rejected.push(`${f.name} (${t('wizard.tooLarge')})`); continue; }
      if (f.type.startsWith('image/')) { f.__url = URL.createObjectURL(f); objectUrls.add(f.__url); }
      list.push(f);
    }
    state.files[qid] = list;
    if (rejected.length) state.errors[qid] = t('wizard.notAdded', { list: rejected.join(', ') });
    else delete state.errors[qid];
    render();
  }));
  offs.push(on(root, 'click', '[data-file-remove]', (_, b) => {
    const list = state.files[b.dataset.fileRemove] ?? [];
    const [removed] = list.splice(+b.dataset.index, 1);
    if (removed?.__url) URL.revokeObjectURL(removed.__url);
    render();
  }));
  offs.push(on(root, 'toggle', '[data-more]', (_, d) => { state.moreOpen[d.dataset.more] = d.open; }, true));
  offs.push(on(root, 'click', '[data-goto]', (_, b) => goTo(+b.dataset.goto)));
  offs.push(on(root, 'click', '[data-back]', () => goTo(Math.max(0, state.step - 1))));
  offs.push(on(root, 'click', '[data-next]', () => next()));
  offs.push(on(root, 'click', '[data-submit]', () => submit()));
  offs.push(on(root, 'click', '[data-download]', () => downloadText(`${schema.id}-brief.txt`, briefText())));
  offs.push(on(root, 'click', '[data-reset]', () => {
    if (!window.confirm(t('wizard.startOverConfirm'))) return;
    state.answers = schema.prefill && query ? schema.prefill(query, {}) : {};
    state.files = {};
    state.result = null;
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    goTo(0);
  }));

  render();

  return {
    get state() { return state; },
    briefText,
    destroy() {
      offs.forEach((off) => off());
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}
