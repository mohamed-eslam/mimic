/** Wizard pages: Custom Character Brief and Integration Request. */
import { qs } from '../../core/dom.js';
import { t, getLocale, localizeSchema } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { mountWizard } from '../../ui/wizard.js';
import { isSubmissionConfigured } from '../../config/business.js';
import { customBriefSchema } from '../../content/brief-custom.js';
import { integrationSchema } from '../../content/brief-integration.js';
import { customBriefAr } from '../../content/ar/brief-custom.ar.js';
import { integrationAr } from '../../content/ar/brief-integration.ar.js';

/** Locale overlays: question logic stays in one schema, only the words change. */
const OVERLAYS = { 'custom-character': { ar: customBriefAr }, integration: { ar: integrationAr } };

function wizardPage({ schema, eyebrow, title, lead }) {
  return {
    render() {
      return `
        <section class="site-section site-section--compact">
          <div class="container">
            <header class="wizard-head">
              <p class="eyebrow">${eyebrow()}</p>
              <h1 class="wizard-head__title">${title()}</h1>
              <p class="wizard-head__lead">${lead()}</p>
              ${isSubmissionConfigured() ? '' : `<p class="notice notice--info wizard-head__demo" data-demo-mode>${icon('info')}<span>${t('wizard.demoMode')}</span></p>`}
            </header>
            <div data-wizard></div>
          </div>
        </section>`;
    },
    mount(root, ctx) {
      const localized = localizeSchema(schema, OVERLAYS[schema.id]?.[getLocale()]);
      const wizard = mountWizard(qs('[data-wizard]', root), localized, { query: ctx?.query });
      root.__wizard = wizard; // exposed for tests/debugging
      return () => wizard.destroy();
    },
  };
}

export const briefPage = wizardPage({
  schema: customBriefSchema,
  eyebrow: () => t('customPage.eyebrow'),
  title: () => t('nav.brief'),
  lead: () => t('wizard.briefLead'),
});

export const integrationRequestPage = wizardPage({
  schema: integrationSchema,
  eyebrow: () => t('integrationPage.eyebrow'),
  title: () => t('nav.integrationRequest'),
  lead: () => t('wizard.integrationLead'),
});
