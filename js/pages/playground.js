/**
 * Interactive Playground — play with saved characters (or the current draft).
 *
 * Feedback is event-driven: the animator emits character:* events for every
 * interaction (buttons, direct pokes, drags, keyboard), and this page reacts
 * to those events with counters, particles, sound and speech bubbles. That
 * way a poke is handled identically whether it came from a click on the
 * character or from the Poke button, and nothing is counted twice.
 */
import { html, qs, on, escapeHtml, disposer } from '../core/dom.js';
import { store } from '../core/store.js';
import { timeAgo } from '../core/format.js';
import { icon } from '../ui/icons.js';
import { button, pageHeader, switchControl } from '../ui/components.js';
import { enhance } from '../ui/behaviors.js';
import { createLiveCharacter } from '../ui/live-character.js';
import { createParticles } from '../ui/particles.js';
import { sound } from '../ui/sound.js';
import { PERSONALITIES } from '../engine/index.js';
import { sanitizeConfig, displayName } from '../models/character-config.js';
import { characters } from '../services/character-service.js';
import { activity } from '../services/activity-service.js';
import { pickLine } from '../data/reactions.js';

export const SCENES = [
  { id: 'studio', label: 'Soft Studio' },
  { id: 'night', label: 'Night Sky' },
  { id: 'sunny', label: 'Sunny Day' },
  { id: 'garden', label: 'Pastel Garden' },
];

const ACTIONS = [
  { id: 'poke', label: 'Poke', icon: 'hand' },
  { id: 'tickle', label: 'Tickle', icon: 'feather' },
  { id: 'jump', label: 'Jump', icon: 'arrowUp' },
  { id: 'spin', label: 'Spin', icon: 'rotate' },
  { id: 'dance', label: 'Dance', icon: 'music' },
  { id: 'sleep', label: 'Sleep', icon: 'moon' },
  { id: 'wake', label: 'Wake Up', icon: 'sun' },
];
const ACTION_LABEL = Object.fromEntries([...ACTIONS, { id: 'drag', label: 'Drag' }].map((a) => [a.id, a.label]));

const BUBBLE_MS = 2400;
const BUBBLE_COOLDOWN = 1400;
const DRAFT = 'draft';

export default {
  render() {
    return html`
      ${pageHeader({
        eyebrow: `${icon('smile', { size: 14 })} Personality Studio`,
        title: 'Personality Studio',
        description: 'See how each personality moves, reacts and speaks. Pick a character, choose a scene, then poke, drag or try the actions below.',
        actions: `<a class="btn btn--secondary" data-edit-link href="#/app/create">${icon('wand')}<span>Edit character</span></a>`,
      })}
      <div class="playground">
        <section class="playground__main" aria-label="Play area">
          <div class="stage playground__stage" data-scene="studio" data-stage>
            <div class="scene-decor" aria-hidden="true"></div>
            <div class="stage__floor"></div>
            <div class="stage__toolbar">
              <span class="nameplate nameplate--sm glass" data-nameplate>…</span>
              <div class="cluster" style="--cluster-gap: var(--space-2)">
                <span class="badge badge--mint" data-status>${icon('sun')} Awake</span>
                <button class="btn btn--secondary btn--sm btn--icon glass" type="button" data-sound aria-pressed="false"></button>
              </div>
            </div>
            <div class="playground__character" data-character></div>
            <div class="speech" data-bubble role="status" aria-live="polite" hidden></div>
            <div class="particle-layer" data-particles aria-hidden="true"></div>
          </div>
          <div class="action-bar" role="toolbar" aria-label="Actions">
            ${ACTIONS.map((a) => `
              <button class="action-btn" type="button" data-perform="${a.id}">
                <span class="action-btn__icon">${icon(a.icon)}</span><span>${a.label}</span>
              </button>`)}
          </div>
        </section>

        <aside class="playground__side">
          <section class="panel">
            <div class="panel__body">
              <div class="panel__section">
                <label class="panel__section-title" for="pg-character">Character</label>
                <select class="select" id="pg-character" data-select></select>
                <p class="persona-line" data-persona></p>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel__body">
              <div class="panel__section">
                <h3 class="panel__section-title">Scene</h3>
                <div class="scene-grid" role="radiogroup" aria-label="Scene" data-group="pg-scene">
                  ${SCENES.map((s, i) => `
                    <button class="scene-tile" type="button" role="radio" data-field="pg-scene" data-value="${s.id}" data-scene-preview="${s.id}"
                      aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${s.label}</span></button>`)}
                </div>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel__body">
              <div class="panel__section" data-activity aria-live="polite"></div>
            </div>
          </section>

          <section class="panel">
            <div class="panel__body">
              <div class="panel__section">
                <h3 class="panel__section-title">Behaviour</h3>
                ${switchControl({ field: 'pg-track', label: 'Eyes follow pointer', checked: true })}
                ${switchControl({ field: 'pg-idle', label: 'Idle animation', checked: true })}
              </div>
            </div>
          </section>
        </aside>
      </div>`;
  },

  mount(root, ctx) {
    const d = disposer();
    const $ = (s) => qs(s, root);
    const stage = $('[data-stage]');
    const select = $('[data-select]');
    const bubbleEl = $('[data-bubble]');
    const particles = createParticles($('[data-particles]'));
    d.add(() => particles.clear());
    d.add(enhance(root));

    let live = null;
    let currentId = DRAFT;
    let config = null;
    let bubble = { timer: 0, last: '', at: 0 };
    let manual = null;            // action triggered by a button (for sleep/wake counting)
    let danceTimer = 0;
    let chatterTimer = 0;
    let alive = true;
    d.add(() => {
      alive = false;
      clearTimeout(bubble.timer);
      clearInterval(danceTimer);
      clearTimeout(chatterTimer);
    });

    /* ---------- helpers ---------- */
    const charPoint = (fy = 0.35) => {
      const s = stage.getBoundingClientRect();
      const c = live.character.refs.svg.getBoundingClientRect();
      return [c.left - s.left + c.width / 2, c.top - s.top + c.height * fy];
    };
    const pitch = () => 1.15 - (config.size - 1) * 0.6;

    function say(event, chance = 1) {
      const now = performance.now();
      if (Math.random() > chance || now - bubble.at < BUBBLE_COOLDOWN) return;
      const line = pickLine(config.personality, event, bubble.last);
      if (!line) return;
      bubble.last = line;
      bubble.at = now;
      bubbleEl.textContent = line;
      bubbleEl.hidden = false;
      bubbleEl.classList.remove('is-in');
      void bubbleEl.offsetWidth;
      bubbleEl.classList.add('is-in');
      clearTimeout(bubble.timer);
      bubble.timer = setTimeout(() => { bubbleEl.hidden = true; }, BUBBLE_MS);
    }

    function count(action) {
      renderActivity(activity.record(currentId, action));
    }

    function renderActivity(sum = activity.summary(currentId)) {
      const chips = Object.entries(sum.actions)
        .sort((a, b) => b[1] - a[1])
        .map(([a, n]) => `<span class="badge badge--neutral">${ACTION_LABEL[a] ?? a} <strong>${n}</strong></span>`)
        .join('');
      $('[data-activity]').innerHTML = `
        <h3 class="panel__section-title">Activity ${currentId === DRAFT ? '<span class="badge badge--neutral">This session</span>' : ''}</h3>
        <div class="activity">
          <div class="activity__total"><strong data-total>${sum.total}</strong><span>interaction${sum.total === 1 ? '' : 's'}</span></div>
          <div class="activity__meta">
            ${sum.favorite ? `<span>Favourite: <strong>${ACTION_LABEL[sum.favorite] ?? sum.favorite}</strong></span>` : '<span class="text-muted">No interactions yet</span>'}
            ${sum.lastPlayed ? `<span class="text-xs text-muted">Last played ${timeAgo(sum.lastPlayed)}</span>` : ''}
          </div>
        </div>
        ${chips ? `<div class="cluster activity__chips" style="--cluster-gap: var(--space-1)">${chips}</div>` : ''}`;
    }

    function renderStatus() {
      const asleep = live.animator.state === 'sleeping';
      const el = $('[data-status]');
      el.className = `badge ${asleep ? '' : 'badge--mint'}`;
      el.innerHTML = `${icon(asleep ? 'moon' : 'sun')} ${asleep ? 'Sleeping' : 'Awake'}`;
    }

    function renderSound() {
      const btn = $('[data-sound]');
      btn.setAttribute('aria-pressed', String(!sound.muted));
      btn.setAttribute('aria-label', sound.muted ? 'Turn sound on' : 'Turn sound off');
      btn.title = sound.muted ? 'Sound off' : 'Sound on';
      btn.innerHTML = icon(sound.muted ? 'volumeOff' : 'volume');
    }

    function renderIdentity() {
      const p = PERSONALITIES[config.personality];
      $('[data-nameplate]').textContent = `${p.emoji} ${displayName(config)}`;
      $('[data-persona]').innerHTML = `<span class="badge badge--neutral">${p.emoji} ${p.label}</span> <span class="text-sm text-muted">${escapeHtml(p.description)}</span>`;
      $('[data-edit-link]').href = currentId === DRAFT ? '#/app/create' : `#/app/create?id=${encodeURIComponent(currentId)}`;
      live.character.el.setAttribute('aria-label', `${displayName(config)}. Poke or drag me!`);
    }

    function scheduleChatter() {
      clearTimeout(chatterTimer);
      chatterTimer = setTimeout(() => {
        if (!alive) return;
        if (live.animator.state === 'awake' && !live.animator.action && !live.animator.press) say('idle', 0.7);
        scheduleChatter();
      }, 14000 + Math.random() * 10000);
    }

    /* ---------- character events → feedback ---------- */
    function bindCharacter(el) {
      const handlers = {
        'character:poke': () => {
          count('poke');
          sound.play('poke', pitch());
          particles.burst(config.personality === 'shy' ? 'sparkles' : 'hearts', ...charPoint(0.3));
          say('poke', 0.55);
        },
        'character:action': (e) => {
          const { name } = e.detail;
          count(name);
          sound.play(name, pitch());
          if (name === 'tickle') particles.burst('giggles', ...charPoint(0.3));
          if (name === 'spin') particles.burst('swirl', ...charPoint(0.5));
          if (name === 'dance') {
            particles.burst('notes', ...charPoint(0.25));
            clearInterval(danceTimer);
            danceTimer = setInterval(() => particles.burst('notes', ...charPoint(0.25)), 700);
          } else clearInterval(danceTimer);
          say(name, 0.75);
        },
        'character:actionend': (e) => {
          if (e.detail.name === 'dance') clearInterval(danceTimer);
          if (e.detail.name === 'jump' && !e.detail.cancelled) particles.burst('dust', ...charPoint(0.95));
        },
        'character:dragend': () => {
          count('drag');
          sound.play('drag', pitch());
          say('drag', 0.5);
        },
        'character:sleep': () => {
          if (manual === 'sleep') count('sleep');
          sound.play('sleep', pitch());
          clearInterval(danceTimer);
          say('sleep', 0.8);
          renderStatus();
        },
        'character:wake': () => {
          if (manual === 'wake') count('wake');
          sound.play('wake', pitch());
          particles.burst('sparkles', ...charPoint(0.2));
          say('wake', 0.8);
          renderStatus();
        },
      };
      Object.entries(handlers).forEach(([t, fn]) => el.addEventListener(t, fn));
      return () => Object.entries(handlers).forEach(([t, fn]) => el.removeEventListener(t, fn));
    }

    /* ---------- loading characters ---------- */
    let unbindCharacter = null;
    async function load(id) {
      let next = null;
      if (id !== DRAFT) {
        const rec = await characters.get(id);
        if (rec) next = sanitizeConfig(rec);
      }
      if (!next) { id = DRAFT; next = store.get().draft; }
      if (!alive) return;
      currentId = id;
      config = next;
      store.set({ playgroundId: id });
      select.value = id;

      if (!live) {
        live = createLiveCharacter($('[data-character]'), config);
        unbindCharacter = bindCharacter(live.character.el);
        d.add(() => { unbindCharacter?.(); live.destroy(); });
      } else {
        live.animator.cancelAction();
        live.animator.wake();
        live.applyAll(config); // morphs to the new look + personality
      }
      bubble.at = 0;
      renderIdentity();
      renderActivity();
      renderStatus();
      say('greet', 0.9);
    }

    async function populate() {
      const saved = await characters.list();
      activity.prune(saved.map((c) => c.id));
      const draft = store.get().draft;
      select.innerHTML = [
        `<option value="${DRAFT}">✏️ Current draft — ${escapeHtml(displayName(draft))}</option>`,
        saved.length ? `<optgroup label="Saved characters">${saved.map((c) => `<option value="${escapeHtml(c.id)}">${PERSONALITIES[c.personality].emoji} ${escapeHtml(displayName(c))}</option>`).join('')}</optgroup>` : '',
      ].join('');
      const wanted = ctx?.query?.get('id') ?? store.get().playgroundId ?? saved[0]?.id ?? DRAFT;
      const exists = wanted === DRAFT || saved.some((c) => c.id === wanted);
      await load(exists ? wanted : saved[0]?.id ?? DRAFT);
      if (ctx?.query?.get('id')) history.replaceState(null, '', '#/app/personality');
    }

    /* ---------- UI events ---------- */
    const onSelect = () => load(select.value);
    select.addEventListener('change', onSelect);
    d.add(() => select.removeEventListener('change', onSelect));

    d.add(on(root, 'click', '[data-perform]', (_, btn) => {
      if (!live) return;
      const name = btn.dataset.perform;
      manual = name;
      live.animator.perform(name);
      manual = null;
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
    }));

    d.add(on(root, 'click', '[data-sound]', () => {
      sound.setMuted(!sound.muted);
      renderSound();
      sound.play('poke', 1.2);
    }));

    const onControl = (e) => {
      const { field, value } = e.detail;
      if (!live) return;
      if (field === 'pg-track') live.animator.setOptions({ trackEyes: value });
      if (field === 'pg-idle') live.animator.setOptions({ idle: value });
      if (field === 'pg-scene') stage.dataset.scene = value;
    };
    root.addEventListener('control:change', onControl);
    d.add(() => root.removeEventListener('control:change', onControl));

    renderSound();
    populate();
    scheduleChatter();
    return () => d.run();
  },
};
