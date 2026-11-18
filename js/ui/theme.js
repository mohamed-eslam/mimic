/**
 * Light / dark theme.
 * - Until the visitor chooses, the theme follows the OS (prefers-color-scheme)
 *   and keeps following it live.
 * - An explicit choice (toggle) is saved in localStorage and wins from then on.
 * - The initial theme is applied by the inline script in <head> → no flash.
 * - Switching adds a short-lived `theme-transition` class (disabled for reduced motion).
 */
export const THEME_KEY = 'character-lab:theme';
const META_COLORS = { light: '#F8F8F7', dark: '#111110' };
const systemQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

export const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function hasExplicitTheme() {
  try { return ['light', 'dark'].includes(localStorage.getItem(THEME_KEY)); } catch { return false; }
}

function apply(theme, animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transition');
    clearTimeout(apply.timer);
    apply.timer = setTimeout(() => root.classList.remove('theme-transition'), 320);
  }
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme]);
  window.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
}

/** Explicit choice: apply + remember. */
export function setTheme(theme, { animate = true } = {}) {
  const next = theme === 'dark' ? 'dark' : 'light';
  try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked: applies for this visit */ }
  apply(next, animate);
  return next;
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

/** Follow OS changes while the visitor hasn't chosen a theme. */
systemQuery?.addEventListener?.('change', (e) => {
  if (!hasExplicitTheme()) apply(e.matches ? 'dark' : 'light', true);
});
