/**
 * One shared requestAnimationFrame loop for the whole engine.
 * - Every animated character subscribes instead of running its own loop.
 * - The loop only runs while there are subscribers.
 * - It pauses completely while the tab is hidden and resumes without a
 *   giant time jump (dt is clamped).
 */
const subscribers = new Set();
let rafId = 0;
let last = 0;

function frame(now) {
  rafId = 0;
  const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20);
  last = now;
  for (const fn of subscribers) {
    try { fn(dt, now); } catch (err) { console.error('[ticker]', err); }
  }
  schedule();
}

function schedule() {
  if (rafId || subscribers.size === 0 || document.hidden) return;
  rafId = requestAnimationFrame(frame);
}

function start() {
  if (rafId) return;
  last = performance.now();
  schedule();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  } else {
    start();
  }
});

/** Subscribe fn(dt, now). Returns an unsubscribe function. */
export function addTick(fn) {
  subscribers.add(fn);
  start();
  return () => subscribers.delete(fn);
}

export const isTickerRunning = () => rafId !== 0;
