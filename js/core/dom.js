/** Tiny DOM helpers shared across the app. */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Delegated event listener. Returns an unsubscribe function.
 * handler(event, matchedElement)
 */
export function on(root, type, selector, handler, options) {
  const listener = (event) => {
    const match = event.target.closest?.(selector);
    if (match && root.contains(match)) handler(event, match);
  };
  root.addEventListener(type, listener, options);
  return () => root.removeEventListener(type, listener, options);
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/**
 * Template tag that flattens arrays and drops null/false/undefined.
 * It does NOT escape — wrap user-provided strings with escapeHtml().
 */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    const val = Array.isArray(v) ? v.join('') : v == null || v === false ? '' : v;
    out += val + strings[i + 1];
  });
  return out;
}

/** Collects cleanup functions; call .run() to dispose all. */
export function disposer() {
  const fns = [];
  return {
    add(fn) { if (typeof fn === 'function') fns.push(fn); return fn; },
    run() { while (fns.length) { try { fns.pop()(); } catch (e) { console.error(e); } } },
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
