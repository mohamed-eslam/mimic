/**
 * Scroll story — progressive enhancement for a list of chapters + a sticky stage.
 *
 * Markup contract:
 *   [data-story]                       wrapper
 *     [data-story-stage] [data-scene=id]   one scene per chapter (desktop stage)
 *     [data-chapter=id]                    chapters, each with its own inline visual
 *
 * Without JS, below `query`, or before mounting, chapters render as a plain vertical
 * sequence (each with its own visual) — nothing is hidden or scroll-locked.
 * When live, the chapter crossing the middle of the viewport becomes active and the
 * stage cross-fades to its scene. Scrolling is never intercepted (no hijacking).
 * Reduced motion keeps the behaviour but transitions collapse to 0ms via tokens.
 */
export function mountScrollStory(root, { query = '(min-width: 1100px)' } = {}) {
  const story = root.querySelector('[data-story]');
  if (!story || !('IntersectionObserver' in window)) return () => {};
  const chapters = [...story.querySelectorAll('[data-chapter]')];
  const scenes = [...story.querySelectorAll('[data-scene]')];
  if (!chapters.length || !scenes.length) return () => {};

  const mq = window.matchMedia(query);
  let io = null;

  const activate = (id) => {
    if (story.dataset.active === id) return;
    story.dataset.active = id;
    chapters.forEach((c) => c.classList.toggle('is-active', c.dataset.chapter === id));
    scenes.forEach((s) => {
      const on = s.dataset.scene === id;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', String(!on));
    });
  };

  const enable = () => {
    if (io) return;
    story.classList.add('is-live');
    activate(chapters[0].dataset.chapter);
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) activate(e.target.dataset.chapter); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    chapters.forEach((c) => io.observe(c));
  };

  const disable = () => {
    io?.disconnect();
    io = null;
    story.classList.remove('is-live');
    delete story.dataset.active;
    chapters.forEach((c) => c.classList.remove('is-active'));
    scenes.forEach((s) => { s.classList.remove('is-active'); s.removeAttribute('aria-hidden'); });
  };

  const sync = () => (mq.matches ? enable() : disable());
  sync();
  mq.addEventListener('change', sync);
  return () => { mq.removeEventListener('change', sync); disable(); };
}
