/**
 * Tiny synthesized sound effects (Web Audio API) — no audio files needed.
 * Muted by default; the preference is remembered in localStorage.
 * The AudioContext is only created after the user un-mutes (a user gesture),
 * which satisfies browser autoplay policies.
 */
import { createStorage } from '../services/storage.js';

const PREF_KEY = 'character-lab:sound';
const prefs = createStorage();
let muted = prefs.read(PREF_KEY) !== 'on';
let ctx = null;
let lastPlay = 0;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** One enveloped oscillator note. */
function tone(ac, { type = 'sine', from, to = from, start = 0, dur = 0.15, gain = 0.12 }) {
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  poke: (ac, p) => tone(ac, { from: 620 * p, to: 300 * p, dur: 0.14 }),
  tickle: (ac, p) => [0, 0.07, 0.14, 0.21].forEach((s, i) => tone(ac, { type: 'triangle', from: (700 + i * 90) * p, to: (900 + i * 90) * p, start: s, dur: 0.06, gain: 0.08 })),
  jump: (ac, p) => tone(ac, { type: 'triangle', from: 260 * p, to: 820 * p, dur: 0.28, gain: 0.1 }),
  spin: (ac, p) => tone(ac, { type: 'sine', from: 300 * p, to: 1200 * p, dur: 0.5, gain: 0.07 }),
  dance: (ac, p) => [523, 659, 784, 1046].forEach((f, i) => tone(ac, { type: 'triangle', from: f * p, start: i * 0.12, dur: 0.11, gain: 0.07 })),
  sleep: (ac, p) => tone(ac, { from: 440 * p, to: 180 * p, dur: 0.6, gain: 0.08 }),
  wake: (ac, p) => [0, 0.1].forEach((s, i) => tone(ac, { type: 'triangle', from: (500 + i * 250) * p, to: (800 + i * 300) * p, start: s, dur: 0.12, gain: 0.09 })),
  drag: (ac, p) => tone(ac, { type: 'sine', from: 380 * p, to: 520 * p, dur: 0.12, gain: 0.06 }),
};

export const sound = {
  get muted() { return muted; },
  setMuted(value) {
    muted = Boolean(value);
    prefs.write(PREF_KEY, muted ? 'off' : 'on');
    if (!muted) audio(); // unlock inside the click gesture
  },
  /**
   * @param {string} name  sound id
   * @param {number} pitch multiplier (bigger characters sound lower)
   */
  play(name, pitch = 1) {
    if (muted || !SOUNDS[name]) return false;
    const now = performance.now();
    if (now - lastPlay < 45) return false; // rate-limit rapid clicking
    lastPlay = now;
    const ac = audio();
    if (!ac) return false;
    try { SOUNDS[name](ac, pitch); } catch { return false; }
    return true;
  },
};
