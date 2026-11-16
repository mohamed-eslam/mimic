/** Contact / Request Pricing — routes visitors to the right flow, plus an honest message form. */
import { qs, escapeHtml, disposer } from '../../core/dom.js';
import { t, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { BUSINESS } from '../../config/business.js';
import { submitLead, emailLink } from '../../services/lead-service.js';
import { createRequest } from '../../models/request.js';
import { pageHero } from './shared.js';

const LINKS = { brief: '#/brief', integration: '#/request-integration', general: '#contact-form' };
const ICONS = { brief: 'brief', integration: 'code', general: 'chat' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default {
  render() {
    const f = (k) => t(`contactPage.form.${k}`);
    return `
      ${pageHero({ eyebrow: t('contactPage.eyebrow'), title: t('contactPage.title'), description: t('contactPage.description') })}
      <section class="container contact">
        <div class="contact__options">
          ${tl('contactPage.options').map((o) => `
            <a class="contact-option" href="${LINKS[o.id]}" ${o.id === 'general' ? 'data-scroll-form' : ''}>
              <span class="use-card__icon">${icon(ICONS[o.id])}</span>
              <h2>${o.title}</h2><p>${o.text}</p>
              <span class="link-arrow">${o.cta} ${icon('arrowRight', { className: 'flip-rtl' })}</span>
            </a>`).join('')}
        </div>
        <form class="contact-form panel" id="contact-form" novalidate>
          <h2 class="contact-form__title">${f('title')}</h2>
          <div class="contact-form__grid">
            <div class="field"><label class="label" for="cf-name">${f('name')} <span class="wz-req" aria-hidden="true">*</span></label><input class="input" id="cf-name" name="name" required aria-required="true" aria-describedby="cf-name-err" autocomplete="name" dir="auto"><p class="wz-error" id="cf-name-err" hidden></p></div>
            <div class="field"><label class="label" for="cf-email">${f('email')} <span class="wz-req" aria-hidden="true">*</span></label><input class="input" id="cf-email" name="email" type="email" dir="ltr" required aria-required="true" aria-describedby="cf-email-err" autocomplete="email"><p class="wz-error" id="cf-email-err" hidden></p></div>
            <div class="field"><label class="label" for="cf-company">${f('company')}</label><input class="input" id="cf-company" name="company" autocomplete="organization" dir="auto"></div>
            <div class="field"><label class="label" for="cf-topic">${f('topic')}</label>
              <select class="select" id="cf-topic" name="topic">${tl('contactPage.form.topics').map((x) => `<option>${escapeHtml(x)}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label class="label" for="cf-message">${f('message')} <span class="wz-req" aria-hidden="true">*</span></label><textarea class="textarea" id="cf-message" name="message" rows="5" required aria-required="true" aria-describedby="cf-message-err" dir="auto"></textarea><p class="wz-error" id="cf-message-err" hidden></p></div>
          <p class="wz-error" data-form-error role="alert" hidden></p>
          <div data-form-result></div>
          <button class="btn btn--primary btn--lg" type="submit">${f('send')}</button>
        </form>
      </section>`;
  },

  mount(root) {
    const d = disposer();
    const form = qs('#contact-form', root);
    const resultEl = qs('[data-form-result]', root);
    const errEl = qs('[data-form-error]', root);

    const scrollBtn = qs('[data-scroll-form]', root);
    const onScroll = (e) => { e.preventDefault(); form.scrollIntoView({ behavior: 'smooth' }); qs('#cf-name', root).focus({ preventScroll: true }); };
    scrollBtn.addEventListener('click', onScroll);
    d.add(() => scrollBtn.removeEventListener('click', onScroll));

    const onSubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      // Field-level errors (WCAG 3.3.1): message next to each field + aria-invalid
      const checks = [['name', !data.name.trim(), 'forms.missingName'], ['email', !EMAIL_RE.test(data.email), 'forms.missingEmail'], ['message', !data.message.trim(), 'forms.missingMessage']];
      let firstInvalid = null;
      for (const [field, invalid, key] of checks) {
        const input = form.querySelector(`[name="${field}"]`);
        const err = form.querySelector(`#cf-${field}-err`);
        input.setAttribute('aria-invalid', String(invalid));
        err.hidden = !invalid;
        err.textContent = invalid ? t(key) : '';
        if (invalid && !firstInvalid) firstInvalid = input;
      }
      errEl.hidden = !firstInvalid;
      errEl.textContent = firstInvalid ? t('forms.fixErrors') : '';
      if (firstInvalid) { firstInvalid.focus(); return; }

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      const request = createRequest({ type: 'contact', answers: data, brief: `${data.topic}\n\n${data.message}` });
      const r = await submitLead('contact', request);
      submitBtn.disabled = false;

      if (r.status === 'sent') {
        const sla = BUSINESS.responseHours ? t('submit.sentWithSla', { hours: BUSINESS.responseHours }) : t('submit.sentNoSla');
        form.innerHTML = `<div class="wz-success" data-result="sent"><span class="wz-success__icon">${icon('check')}</span><h2>${t('submit.sentTitle')}</h2><p class="wz-success__text">${sla}</p></div>`;
      } else if (r.status === 'not-configured') {
        const mail = emailLink(`MIMIC — ${data.topic}`, `${data.message}\n\n${data.name} · ${data.email}${data.company ? ` · ${data.company}` : ''}`);
        resultEl.innerHTML = `<div class="wz-result wz-result--info" role="status" data-result="not-configured">${icon('info')}<div><h3>${t('submit.notConfiguredTitle')}</h3><p>${t('forms.notSentMessage')}</p>${mail ? `<a class="btn btn--secondary" href="${mail}">${t('submit.email')}</a><p class="wz-hint">${t('submit.emailNote')}</p>` : ''}</div></div>`;
      } else {
        resultEl.innerHTML = `<div class="wz-result wz-result--error" role="alert" data-result="error">${icon('warning')}<div><h3>${t('submit.errorTitle')}</h3><p>${t('submit.errorText')}</p></div></div>`;
      }
    };
    form.addEventListener('submit', onSubmit);
    d.add(() => form.removeEventListener('submit', onSubmit));
    return () => d.run();
  },
};
