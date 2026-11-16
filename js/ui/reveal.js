/**
 * Scroll reveal: elements with [data-reveal] fade/slide in once visible.
 * Content is visible by default (no-JS, reduced motion) — the hidden start
 * state is only applied via the .reveal-ready class set here.
 */
import { prefersReducedMotion } from '../core/dom.js';

export function revealOnScroll(root) {
  const items = [...root.querySelectorAll('[data-reveal]')];
  if (!items.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return () => {};
  root.classList.add('reveal-ready');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-revealed');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach((el, i) => {
    el.style.setProperty('--reveal-delay', `${(Number(el.dataset.reveal) || 0) * 80}ms`);
    io.observe(el);
  });
  return () => { io.disconnect(); root.classList.remove('reveal-ready'); };
}
