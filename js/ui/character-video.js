/**
 * Character video manager — one instance for the whole site (started in main.js).
 *
 * Default trigger (per product decision):
 *  - devices with a mouse/trackpad → a clip plays while its card is HOVERED or keyboard-
 *    FOCUSED, and fades back to the portrait when the pointer/focus leaves;
 *  - touch-only devices (no hover) → a clip plays while it is VISIBLE on screen.
 *
 * Every `video.cmedia__video` (rendered by ui/character-media.js) is:
 *  - loaded lazily: no src until it is about to play (preload="none" before that);
 *  - played muted + inline + looped only while visible, paused when it leaves;
 *  - capped: at most MAX videos play at once (most-visible first) to keep devices smooth;
 *  - revealed over its portrait only once frames are actually playing (portrait = poster
 *    and fallback, so a blocked autoplay or a failed load simply keeps the image).
 *
 * Motion is OFF when: prefers-reduced-motion, Save-Data / reduced-data, or the visitor
 * pressed a "pause character motion" toggle ([data-motion-toggle], persisted). In the
 * detail view each video also has its own pause/play button ([data-video-toggle]); an
 * explicit "play" there works even under reduced motion (the visitor opted in).
 */
import { t } from '../i18n/index.js';

const STORE = 'character-lab:motion';
const VISIBLE = 0.35; // share of the media that must be on screen to play
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqSmall = window.matchMedia('(max-width: 719px)');
const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const hoverMode = () => mqHover.matches;
/* Element whose hover/focus drives a clip: the card link, hero figure, showcase tile or portrait. */
const cardOf = (el) => el?.closest?.('a') ?? el?.closest?.('figure') ?? el?.closest?.('.cmedia') ?? null; // whole card first
const hoverRoot = (v) => cardOf(v);
const engaged = new Set(); // hover roots currently hovered or focus-within
const MAX = () => (mqSmall.matches ? 2 : 4);

const ratio = new Map(); // video → current intersection ratio
let userPaused = readPaused();
let io = null;
let loader = null;

function readPaused() { try { return localStorage.getItem(STORE) === 'paused'; } catch { return false; } }
function savePaused(v) { try { v ? localStorage.setItem(STORE, 'paused') : localStorage.removeItem(STORE); } catch { /* storage blocked: session only */ } }

const saveData = () => Boolean(navigator.connection?.saveData) || window.matchMedia('(prefers-reduced-data: reduce)').matches;
const motionAllowed = () => !mqReduce.matches && !userPaused && !saveData();

/** Per-video opt-in/opt-out from the detail control: 'play' | 'pause' | undefined */
const choice = (v) => v.dataset.userChoice;
const wantsToPlay = (v) => choice(v) === 'play'
  || (choice(v) !== 'pause' && motionAllowed() && (!hoverMode() || engaged.has(hoverRoot(v))));

function load(v) {
  if (v.getAttribute('src') || !v.dataset.src) return;
  v.src = v.dataset.src;
  v.preload = 'auto';
}

function show(v, on) {
  v.closest('.cmedia')?.classList.toggle('is-playing', on);
}

async function play(v) {
  load(v);
  try {
    await v.play();
  } catch {
    // Autoplay blocked or media failed: keep the portrait, never retry in a loop.
    show(v, false);
  }
}

function pause(v) {
  if (!v.paused) v.pause();
  // Keep the last frame visible when paused deliberately in the detail view; otherwise
  // fall back to the crisp portrait.
  if (choice(v) !== 'pause') show(v, false);
}

/** Decide which videos play: visible + allowed, most visible first, capped at MAX. */
function schedule() {
  const candidates = [...ratio.entries()]
    .filter(([v, r]) => v.isConnected && r >= VISIBLE && wantsToPlay(v))
    .sort((a, b) => (choice(b[0]) === 'play') - (choice(a[0]) === 'play') || b[1] - a[1])
    .slice(0, MAX())
    .map(([v]) => v);
  const keep = new Set(candidates);
  ratio.forEach((_, v) => { if (!keep.has(v)) pause(v); });
  candidates.forEach((v) => { if (v.paused) play(v); });
  syncControls();
}

function syncControls() {
  document.querySelectorAll('[data-video-toggle]').forEach((b) => {
    const v = b.parentElement?.querySelector('.cmedia__video');
    if (!v) return;
    const playing = !v.paused && !v.ended && v.readyState > 2;
    const active = playing || (wantsToPlay(v) && (ratio.get(v) ?? 0) >= VISIBLE);
    b.setAttribute('aria-pressed', String(active));
    b.setAttribute('aria-label', active ? b.dataset.labelPause : b.dataset.labelPlay);
    b.classList.toggle('is-playing', active);
  });
  document.querySelectorAll('[data-motion-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(!userPaused));
    b.querySelector('[data-motion-label]').textContent = userPaused ? t('media.playAll') : t('media.pauseAll');
    b.classList.toggle('is-paused', userPaused);
    b.hidden = mqReduce.matches || hoverMode(); // only touch devices autoplay; elsewhere motion is user-started
  });
}

function register(v) {
  if (ratio.has(v)) return;
  ratio.set(v, 0);
  v.addEventListener('playing', () => show(v, true));
  v.addEventListener('pause', () => syncControls());
  v.addEventListener('error', () => { show(v, false); ratio.delete(v); io?.unobserve(v); });
  io.observe(v);
  loader.observe(v);
}

function scan(root) {
  if (root.nodeType !== 1) return;
  if (root.matches?.('video.cmedia__video')) register(root);
  root.querySelectorAll?.('video.cmedia__video').forEach(register);
  if (root.querySelector?.('[data-motion-toggle], [data-video-toggle]')) syncControls();
}

export function initCharacterVideos() {
  if (io || !('IntersectionObserver' in window)) return;
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => ratio.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
    schedule();
  }, { threshold: [0, 0.2, VISIBLE, 0.6, 0.9] });
  // Start fetching a little before a video scrolls in (only when it will actually play).
  loader = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && wantsToPlay(e.target)) load(e.target); });
  }, { rootMargin: '200px 0px' });

  new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach(scan);
      m.removedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        ratio.forEach((_, v) => { if (!v.isConnected) { ratio.delete(v); io.unobserve(v); loader.unobserve(v); } });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);

  /* Hover / keyboard focus engage a card's clip (hover mode only matters on mouse devices) */
  const engage = (target, on) => {
    const v = cardOf(target)?.querySelector?.('video.cmedia__video');
    if (!v || !ratio.has(v)) return;
    const root = hoverRoot(v);
    if (on) engaged.add(root); else engaged.delete(root);
    if (on && wantsToPlay(v)) load(v); // never fetch a clip that won't play (reduced motion, paused, Save-Data)
    schedule();
  };
  document.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') engage(e.target, true); });
  document.addEventListener('pointerout', (e) => {
    const root = cardOf(e.target);
    if (root && !root.contains(e.relatedTarget)) engage(e.target, false);
  });
  document.addEventListener('focusin', (e) => engage(e.target, true));
  document.addEventListener('focusout', (e) => {
    const root = cardOf(e.target);
    if (root && !root.contains(e.relatedTarget)) engage(e.target, false);
  });

  document.addEventListener('click', (e) => {
    const all = e.target.closest('[data-motion-toggle]');
    if (all) {
      userPaused = !userPaused;
      savePaused(userPaused);
      ratio.forEach((_, v) => { delete v.dataset.userChoice; });
      schedule();
      return;
    }
    const one = e.target.closest('[data-video-toggle]');
    if (one) {
      e.preventDefault();
      const v = one.parentElement.querySelector('.cmedia__video');
      if (!v) return;
      const isPlaying = !v.paused && !v.ended;
      v.dataset.userChoice = isPlaying ? 'pause' : 'play';
      if (isPlaying) { v.pause(); } else { play(v); }
      schedule();
    }
  });

  const onPref = () => schedule();
  mqReduce.addEventListener('change', onPref);
  mqSmall.addEventListener('change', onPref);
  mqHover.addEventListener('change', onPref);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ratio.forEach((_, v) => { if (!v.paused) v.pause(); });
    else schedule();
  });
  window.addEventListener('i18n:change', () => setTimeout(syncControls));
}
