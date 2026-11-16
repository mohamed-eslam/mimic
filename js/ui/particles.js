/**
 * Lightweight DOM particle bursts (Web Animations API).
 * - Hard cap on live particles so rapid clicking can't flood the DOM.
 * - Disabled entirely for prefers-reduced-motion.
 */
import { prefersReducedMotion } from '../core/dom.js';

const MAX_LIVE = 40;

const KINDS = {
  hearts: { glyphs: ['♥', '♡'], colors: ['#f2709f', '#ffb0d1'], count: 6, spread: 70, rise: 90, size: [16, 24] },
  sparkles: { glyphs: ['✦', '✧', '•'], colors: ['#f4bf2a', '#a993ff', '#fff'], count: 8, spread: 110, rise: 60, size: [12, 20] },
  notes: { glyphs: ['♪', '♫'], colors: ['#7457ec', '#4cc493', '#ff9670'], count: 4, spread: 90, rise: 110, size: [18, 26] },
  giggles: { glyphs: ['ha', 'hi', 'he'], colors: ['#c2436f', '#7457ec'], count: 4, spread: 80, rise: 70, size: [13, 16], text: true },
  swirl: { glyphs: ['✦', '•', '✧'], colors: ['#5aa2f2', '#a993ff', '#9de2c0'], count: 10, spread: 120, rise: 20, size: [10, 18], ring: true },
  dust: { glyphs: ['•'], colors: ['rgba(43,35,64,.25)'], count: 6, spread: 90, rise: 8, size: [8, 14], ground: true },
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * @param {HTMLElement} layer positioned container (pointer-events: none)
 */
export function createParticles(layer) {
  let live = 0;

  /** Burst `kind` at (x, y) in layer coordinates. */
  function burst(kind, x, y) {
    const k = KINDS[kind];
    if (!k || prefersReducedMotion()) return 0;
    const n = Math.min(k.count, MAX_LIVE - live);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = `particle${k.text ? ' particle--text' : ''}`;
      el.textContent = pick(k.glyphs);
      el.style.color = pick(k.colors);
      el.style.fontSize = `${rand(...k.size)}px`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      layer.appendChild(el);
      live++;

      const angle = k.ring ? (i / n) * Math.PI * 2 : rand(-Math.PI * 0.85, -Math.PI * 0.15);
      const dist = rand(k.spread * 0.5, k.spread);
      const dx = Math.cos(angle) * dist;
      const dy = k.ground ? rand(-k.rise, 0) : Math.sin(angle) * dist * 0.6 - k.rise;
      const anim = el.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
          { transform: `translate(calc(-50% + ${dx * 0.4}px), calc(-50% + ${dy * 0.4}px)) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.8) rotate(${rand(-30, 30)}deg)`, opacity: 0 },
        ],
        { duration: rand(800, 1300), easing: 'cubic-bezier(.22,1,.36,1)', delay: rand(0, 120), fill: 'both' },
      );
      const done = () => { if (el.isConnected) { el.remove(); live--; } };
      anim.onfinish = done;
      anim.oncancel = done;
    }
    return n;
  }

  return {
    burst,
    get live() { return live; },
    clear() { layer.querySelectorAll('.particle').forEach((p) => p.remove()); live = 0; },
  };
}
