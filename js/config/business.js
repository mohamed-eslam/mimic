/**
 * Business configuration — the ONE place to align the website with real operations.
 *
 * ⚠️  Everything customers are promised is driven from here. Only change a value
 *     when the operational process behind it actually exists.
 */
export const BUSINESS = {
  /**
   * Response-time promise shown after a request is delivered
   * ("Our team will review your request and contact you within {hours} hours").
   * It is ONLY shown when `submission` below is configured.
   */
  responseHours: 24,

  /**
   * Where briefs and contact requests are delivered.
   * - endpoint: URL that accepts a multipart POST (fields `type`, `payload` JSON, `references[]` files)
   *   and answers 2xx when the request is stored/queued for the team.
   *   e.g. a form service, CRM webhook, or your own API.
   * - email: optional. Offers an "email your brief" fallback (mailto) — the email client opens,
   *   but delivery cannot be confirmed, so no success state is shown for it.
   * With no endpoint, the site never claims a request was submitted.
   */
  submission: {
    endpoint: '',
    email: '',
    timeoutMs: 20000,
  },

  /** Ways to get a character. 'available' | 'coming-soon' */
  offerings: {
    marketplace: 'available',
    custom: 'available',
    aiGeneration: 'coming-soon',
  },

  /**
   * Creative packages (proposed product categories).
   * 'on-request'  → scope and availability confirmed by the team in a quote
   * 'available'   → standard, ready-to-sell offering
   * 'coming-soon' → not offered yet
   */
  packages: {
    essentials: 'on-request',
    creator: 'on-request',
    video: 'on-request',
    agent: 'on-request',
  },

  /** Reference upload limits for the brief builder. */
  uploads: {
    maxFiles: 6,
    maxFileMB: 10,
    accept: 'image/png,image/jpeg,image/webp',
  },
};

export const isSubmissionConfigured = () => Boolean(BUSINESS.submission.endpoint);
