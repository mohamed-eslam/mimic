/**
 * Lead delivery (custom briefs, pricing & contact requests).
 *
 * Honesty rules:
 * - A request counts as "sent" ONLY when the configured endpoint answers 2xx.
 * - With no endpoint configured, submit() returns { status: 'not-configured' }
 *   and nothing is transmitted.
 * - Network errors/timeouts return { status: 'error' } so the UI can offer a retry.
 */
import { BUSINESS, isSubmissionConfigured } from '../config/business.js';

/**
 * @param {'brief'|'contact'} type
 * @param {object} payload  JSON-serialisable answers (no File objects)
 * @param {File[]} files    reference images (optional)
 * @param {{ fetchImpl?: typeof fetch, config?: typeof BUSINESS }} [deps] injectable for tests
 * @returns {Promise<{status:'sent'|'not-configured'|'error', reference?:string, message?:string}>}
 */
export async function submitLead(type, payload, files = [], deps = {}) {
  const config = deps.config ?? BUSINESS;
  const doFetch = deps.fetchImpl ?? globalThis.fetch;
  const configured = deps.config ? Boolean(config.submission.endpoint) : isSubmissionConfigured();
  if (!configured) return { status: 'not-configured' };

  const body = new FormData();
  body.append('type', type);
  body.append('payload', JSON.stringify({ ...payload, submittedAt: new Date().toISOString(), locale: document.documentElement.lang }));
  files.forEach((f) => body.append('references[]', f, f.name));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.submission.timeoutMs ?? 20000);
  try {
    const res = await doFetch(config.submission.endpoint, { method: 'POST', body, signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { status: 'error', message: `The server answered ${res.status}.` };
    let reference;
    try { reference = (await res.json())?.reference; } catch { /* non-JSON 2xx is still a delivery */ }
    return { status: 'sent', reference };
  } catch (err) {
    return { status: 'error', message: err?.name === 'AbortError' ? 'The request timed out.' : 'Network error.' };
  } finally {
    clearTimeout(timer);
  }
}

/** mailto: link with a plain-text brief (attachments must be added manually). */
export function emailLink(subject, text) {
  const to = BUSINESS.submission.email;
  if (!to) return null;
  const max = 1800; // keep within typical mailto URL limits
  const bodyText = text.length > max ? `${text.slice(0, max)}\n…(see attached brief file)` : text;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

/** Download text as a file (used to keep the brief when submission isn't connected). */
export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
