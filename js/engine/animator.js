/**
 * CharacterAnimator — brings a Character to life.
 *
 * Behaviours: eye tracking, idle (breathing, floating, organic wobble,
 * random blinking), poke, drag & release, squash/stretch wobble physics,
 * sleep after inactivity, and personality-driven variation of all of these.
 *
 * Design rules
 * - One shared rAF loop (ticker.js), paused when the tab is hidden and
 *   skipped while the character is off-screen.
 * - Physics runs on springs at a fixed 120 Hz substep → frame-rate
 *   independent and jitter-free.
 * - Every behaviour only writes to springs / scalars. Once per frame the
 *   results are COMPOSED into a single pose and handed to
 *   character.applyPose(), so transforms never conflict.
 * - Personalities (personalities.js) are data. Their numeric traits are
 *   blended over time, so switching personality is smooth even mid-drag.
 * - prefers-reduced-motion: idle motion, stretch and overshoot are removed;
 *   interactions still respond, calmly.
 *
 *   const anim = new CharacterAnimator(character, { personality: 'curious' });
 *   anim.poke(); anim.sleep(); anim.wake(); anim.setPersonality('shy');
 *   anim.perform('jump' | 'spin' | 'dance' | 'tickle' | 'poke' | 'sleep' | 'wake');
 *
 * Events (bubbling on character.el): character:poke, character:dragstart,
 * character:dragend, character:sleep, character:wake, character:personality,
 * character:action { name }, character:actionend { name }
 */
import { addTick } from './ticker.js';
import { Spring } from './spring.js';
import { getPersonality, PERSONALITIES } from './personalities.js';
import { ACTIONS } from './actions.js';

const STEP = 1 / 120;
const MAX_STEPS = 10;
const TAU = Math.PI * 2;
const DRAG_THRESHOLD = 6;  // px before a press becomes a drag
const DRAG_REACH = 120;    // elastic leash length (view units)
const DRAG_REACH_DOWN = 26;
const EYE_IDLE_MS = 2600;  // eyes drift back to center after this long without pointer movement
const TRAIT_BLEND = 3.2;   // personality blend speed (1/s) — ~0.6s to settle

const DEFAULTS = {
  idle: true,
  trackEyes: true,
  interactive: true,
  blink: true,
  sleepAfter: 20000, // ms; 0 disables sleeping
  personality: 'happy',
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randIn = ([a, b]) => rand(a, b);

const SPRINGS = {
  x: { stiffness: 190, damping: 12 },
  y: { stiffness: 190, damping: 12 },
  squash: { stiffness: 420, damping: 15 },
  hop: { stiffness: 230, damping: 14 },
  stretchX: { stiffness: 300, damping: 22 },
  stretchY: { stiffness: 300, damping: 22 },
  tilt: { stiffness: 170, damping: 13 },
  lookX: { stiffness: 95, damping: 17 },
  lookY: { stiffness: 95, damping: 17 },
  sleepiness: { stiffness: 6, damping: 4.9 }, // slow, critically damped blend
  // Action channels: stiff + critically damped → follow keyframes closely,
  // but smooth out any jump when actions interrupt each other.
  actX: { stiffness: 900, damping: 60 },
  actY: { stiffness: 900, damping: 60 },
  actRot: { stiffness: 900, damping: 60 },
  actSx: { stiffness: 900, damping: 60 },
  actSy: { stiffness: 900, damping: 60 },
};
const ACTION_REST = { actX: 0, actY: 0, actRot: 0, actSx: 1, actSy: 1 };
const BODY_SPRINGS = ['x', 'y', 'squash', 'hop', 'tilt'];
const EYE_SPRINGS = ['lookX', 'lookY'];
const HELD = { stiffness: 700, damping: 48 };

export class CharacterAnimator {
  constructor(character, options = {}) {
    this.character = character;
    this.el = character.el;
    this.options = { ...DEFAULTS, ...options };
    character.animator = this;

    this.springs = Object.fromEntries(
      Object.entries(SPRINGS).map(([k, cfg]) => [k, new Spring(k === 'squash' || k === 'actSx' || k === 'actSy' ? 1 : 0, cfg)]),
    );

    // Personality: `traits` is the live blended set, `persona` the target
    this.persona = getPersonality(this.options.personality);
    this.traits = { ...this.persona.motion };

    const now = performance.now();
    const b = this.persona.behavior;
    this.mode = 'awake';
    this.phase = { breath: Math.random() * TAU, float: Math.random() * TAU, wobble: Math.random() * 10, sway: Math.random() * TAU };
    this.acc = 0;
    this.lastActivity = now;
    this.pointer = { x: 0, y: 0, active: false, lastMove: 0 };
    this.press = null;
    this.blink = { next: now + rand(1200, 3500), start: -1, double: false };
    this.glance = { next: now + randIn(b.glanceEvery), until: 0, x: 0, y: 0, forced: false };
    this.timers = {
      bounce: now + randIn(b.bounceEvery),
      idleExpr: now + randIn(b.idleExpressionEvery),
      headTilt: now + randIn(b.headTiltEvery),
    };
    this.headTilt = { until: 0, amount: 0 };
    this.action = null;
    this.exprQueue = [];
    this.exprUntil = 0;
    this.rect = null;
    this.rectDirty = true;
    this.onscreen = true;
    this.running = false;

    this._mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._applyMotionPreference();
    this.el.dataset.personality = this.persona.id;

    this._bind();
    this.start();
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  start() {
    if (this.running) return this;
    this.running = true;
    this._untick = addTick((dt, now) => this._tick(dt, now));
    return this;
  }

  stop() {
    this.running = false;
    this._untick?.();
    this._untick = null;
    return this;
  }

  get state() {
    return this.mode;
  }

  get personality() {
    return this.persona.id;
  }

  /**
   * Switch personality. Numeric traits blend smoothly; the character gives a
   * small signature reaction so the change is noticeable.
   */
  setPersonality(id, { react = true } = {}) {
    const next = PERSONALITIES[id];
    if (!next || next === this.persona) return this;
    this.persona = next;
    this.el.dataset.personality = next.id;

    // Reschedule discrete behaviours from the new personality's ranges
    const now = performance.now();
    const b = next.behavior;
    this.timers.bounce = now + randIn(b.bounceEvery);
    this.timers.idleExpr = now + randIn(b.idleExpressionEvery) + 1200;
    this.timers.headTilt = now + randIn(b.headTiltEvery);
    this.glance.next = now + randIn(b.glanceEvery);
    this.glance.forced = false;

    if (react && this.mode === 'awake' && !this.press) {
      this.springs.squash.velocity -= 3 * this.motion;
      this.springs.hop.velocity -= 110 * this.motion * Math.max(0.6, next.motion.reaction);
      this._expressions([[b.signature, 1200]]);
    }
    this._activity();
    this._emit('personality');
    return this;
  }

  /**
   * Perform a named action. Re-triggering or switching mid-action blends
   * smoothly (action springs), so rapid clicks are safe.
   */
  perform(name) {
    if (name === 'poke') return this.poke();
    if (name === 'sleep') return this.sleep();
    if (name === 'wake') return this.wake();
    const def = ACTIONS[name];
    if (!def || this.press) return this;
    this._activity();
    if (this.mode === 'sleeping') this.wake();
    this._wrapRotation();
    const tr = this.traits;
    this.action = {
      name,
      def,
      start: performance.now(),
      dur: def.duration / clamp(tr.springiness, 0.75, 1.3),
      amp: clamp(tr.reaction, 0.6, 1.4) * this.motion,
    };
    const face = this.persona.behavior.actions?.[name] ?? def.face;
    this._expressions([[face, this.action.dur + 250]]);
    this._emit('action', { name });
    return this;
  }

  /** Stop the current action (body eases back to rest). */
  cancelAction() {
    if (!this.action) return this;
    const { name } = this.action;
    this.action = null;
    this._wrapRotation();
    for (const [k, v] of Object.entries(ACTION_REST)) this.springs[k].target = v;
    this._emit('actionend', { name, cancelled: true });
    return this;
  }

  /** Programmatic poke (also used by keyboard). */
  poke() {
    this._activity();
    if (this.mode === 'sleeping') this.wake();
    const s = this.springs;
    const k = this.traits.reaction;
    s.squash.velocity -= (7 * this.motion + 2) * k;
    s.hop.velocity -= 170 * this.motion * k;
    this._expressions(this.persona.behavior.poke);
    this._emit('poke');
    return this;
  }

  sleep() {
    if (this.mode === 'sleeping') return this;
    this.cancelAction();
    this.mode = 'sleeping';
    this.springs.sleepiness.target = 1;
    this.springs.lookX.target = 0;
    this.springs.lookY.target = 0;
    this.exprQueue = [];
    this.exprUntil = 0;
    this.headTilt.until = 0;
    this.character.setExpression('sleep');
    this.el.classList.add('is-sleeping');
    this._emit('sleep');
    return this;
  }

  wake() {
    if (this.mode !== 'sleeping') return this;
    const now = performance.now();
    this.mode = 'awake';
    this.lastActivity = now;
    this.springs.sleepiness.target = 0;
    this.el.classList.remove('is-sleeping');
    // little startled hop
    this.springs.squash.velocity -= 4 * this.motion;
    this.springs.hop.velocity -= 150 * this.motion * this.traits.reaction;
    this._expressions(this.persona.behavior.wake);
    this.blink.next = now + 900;
    this.timers.idleExpr = now + randIn(this.persona.behavior.idleExpressionEvery) + 1500;
    this._emit('wake');
    return this;
  }

  setOptions(partial) {
    Object.assign(this.options, partial);
    if ('personality' in partial) this.setPersonality(partial.personality);
    return this;
  }

  destroy() {
    this.stop();
    this._unbind?.();
    this.el.classList.remove('is-sleeping', 'is-dragging', 'is-pressed');
    if (this.character.animator === this) this.character.animator = null;
  }

  /* ------------------------------------------------------------------ */
  /* Frame loop                                                          */
  /* ------------------------------------------------------------------ */

  _tick(dt, now) {
    if (!this.onscreen) return;
    this._blendTraits(dt);
    this._updateTargets(now);

    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this._step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0; // fell behind: drop time rather than spiral

    this.character.applyPose(this._composePose(now));
  }

  /** Ease every numeric trait toward the active personality, then retune springs. */
  _blendTraits(dt) {
    const t = 1 - Math.exp(-dt * TRAIT_BLEND);
    const target = this.persona.motion;
    for (const k in target) this.traits[k] += (target[k] - this.traits[k]) * t;
    this._tuneSprings();
  }

  _tuneSprings() {
    const reduce = this.motion === 0;
    const body = this.traits.springiness;
    const eyes = this.traits.gazeSpeed;
    for (const k of BODY_SPRINGS) {
      if (this.press?.dragging && (k === 'x' || k === 'y')) continue;
      this.springs[k].configure({ stiffness: SPRINGS[k].stiffness * body, damping: SPRINGS[k].damping * Math.sqrt(body) });
      if (reduce) this.springs[k].critical();
    }
    for (const k of EYE_SPRINGS) {
      this.springs[k].configure({ stiffness: SPRINGS[k].stiffness * eyes, damping: SPRINGS[k].damping * Math.sqrt(eyes) });
    }
  }

  /** Decide where every spring wants to go this frame. */
  _updateTargets(now) {
    const s = this.springs;
    const o = this.options;
    const tr = this.traits;
    const b = this.persona.behavior;
    const awake = this.mode === 'awake';

    // --- performed action keyframes → action springs ---
    const act = this.action;
    if (act) {
      const t = (now - act.start) / act.dur;
      if (t >= 1) {
        this.action = null;
        if (act.def.wrapRotation && s.actRot.value > 180) s.actRot.value -= 360; // finished a full turn: same pose, unwound
        for (const [k, v] of Object.entries(ACTION_REST)) s[k].target = v;
        this._emit('actionend', { name: act.name });
      } else {
        const f = act.def.frame(t, act.amp);
        s.actX.target = f.x ?? 0;
        s.actY.target = f.y ?? 0;
        s.actRot.target = f.rot ?? 0;
        s.actSx.target = f.sx ?? 1;
        s.actSy.target = f.sy ?? 1;
      }
    }

    // --- sleep ---
    if (awake && o.sleepAfter > 0 && !this.press && now - this.lastActivity > o.sleepAfter * tr.sleepScale) {
      this.sleep();
    }

    // --- expressions timeline ---
    if (this.exprQueue.length && now >= this.exprUntil) {
      const [name, ms] = this.exprQueue.shift();
      this.character.setExpression(name);
      this.exprUntil = now + ms;
    } else if (!this.exprQueue.length && this.exprUntil && now >= this.exprUntil && !this.press) {
      this.exprUntil = 0;
      this.glance.forced = false;
      this.character.setExpression(this.mode === 'sleeping' ? 'sleep' : null);
    }

    // --- personality idle behaviours (only when nothing else is happening) ---
    const calm = awake && !this.press && !this.exprUntil && o.idle;
    if (calm && b.idleExpression && now >= this.timers.idleExpr) {
      this._expressions([[b.idleExpression, b.idleExpressionMs]]);
      if (b.lookAway) {
        const side = Math.random() < 0.5 ? -1 : 1;
        Object.assign(this.glance, { x: side * 0.85, y: 0.45, until: now + b.idleExpressionMs, forced: true });
      }
      this.timers.idleExpr = now + randIn(b.idleExpressionEvery) + b.idleExpressionMs;
    }
    if (awake && !this.press && !this.action && o.idle && tr.bounce > 0.05 && now >= this.timers.bounce) {
      s.hop.velocity -= 120 * tr.bounce * this.motion;
      s.squash.velocity -= 2.2 * tr.bounce * this.motion;
      this.timers.bounce = now + randIn(b.bounceEvery);
    }
    if (awake && o.idle && tr.headTilt > 0.5 && now >= this.timers.headTilt) {
      this.headTilt = { until: now + rand(900, 1600), amount: (Math.random() < 0.5 ? -1 : 1) * tr.headTilt };
      this.timers.headTilt = now + randIn(b.headTiltEvery);
    }

    // --- gaze ---
    let lookX = 0;
    let lookY = 0;
    if (!awake || !o.trackEyes) {
      // eyes rest at center
    } else if (this.glance.forced && now < this.glance.until) {
      lookX = this.glance.x;
      lookY = this.glance.y;
    } else if (this.pointer.active && now - this.pointer.lastMove < EYE_IDLE_MS) {
      const r = this._getRect();
      if (r) {
        const dx = this.pointer.x - (r.left + r.width / 2);
        const dy = this.pointer.y - (r.top + r.height * 0.5);
        const reach = Math.max(r.width, 160) * 0.9;
        lookX = Math.tanh(dx / reach);
        lookY = Math.tanh(dy / reach) * 0.85;
        // Shy characters avert their eyes when the pointer gets close
        if (b.avoidGaze && !this.press && Math.hypot(dx, dy) < r.width * 0.75) {
          lookX = -Math.sign(dx || 1) * 0.8;
          lookY = 0.5;
        }
      }
    } else if (o.idle) {
      // No pointer: drift back to center with the occasional glance
      if (now >= this.glance.next) {
        Object.assign(this.glance, { x: rand(-0.55, 0.55), y: rand(-0.3, 0.25), until: now + rand(700, 1500), forced: false });
        this.glance.next = now + randIn(b.glanceEvery);
      }
      if (now < this.glance.until) { lookX = this.glance.x; lookY = this.glance.y; }
    }
    s.lookX.target = lookX * tr.gazeRange;
    s.lookY.target = lookY * tr.gazeRange;

    // --- stretch follows motion (squash & stretch) ---
    const m = this.motion;
    let vx = s.x.velocity * 0.0011;
    let vy = (s.y.velocity + s.hop.velocity) * 0.0011;
    if (this.press?.dragging) {
      vx += s.x.value * 0.0016;
      vy += s.y.value * 0.0016;
    }
    const mag = Math.hypot(vx, vy);
    const maxStretch = 0.32;
    if (mag > maxStretch) { vx *= maxStretch / mag; vy *= maxStretch / mag; }
    s.stretchX.target = vx * m;
    s.stretchY.target = vy * m;

    // --- tilt: motion lean + idle sway + curious lean/head tilts ---
    const idle = o.idle && awake ? 1 : 0;
    const sway = Math.sin(this.phase.sway) * tr.swayAmount * idle;
    const lean = s.lookX.value * tr.tiltBias * idle;
    const pulse = now < this.headTilt.until ? this.headTilt.amount : 0;
    const motionLean = s.x.velocity * 0.012 + (this.press?.dragging ? s.x.value * 0.06 : 0);
    s.tilt.target = clamp(motionLean + sway + lean + pulse, -16, 16) * m;
  }

  _step(dt) {
    for (const k in this.springs) this.springs[k].step(dt);
    const sl = clamp(this.springs.sleepiness.value, 0, 1);
    const tr = this.traits;
    // Asleep: slower and deeper whatever the personality
    this.phase.breath += dt * TAU * lerp(tr.breathRate, Math.min(tr.breathRate, 0.16), sl);
    this.phase.float += dt * TAU * lerp(tr.floatRate, 0.08, sl);
    this.phase.wobble += dt * lerp(1, 0.5, sl);
    this.phase.sway += dt * TAU * tr.swayRate;
  }

  /** Combine every behaviour into one pose. */
  _composePose(now) {
    const s = this.springs;
    const m = this.motion;
    const tr = this.traits;
    const idle = this.options.idle ? 1 : 0;
    const sl = clamp(s.sleepiness.value, 0, 1);

    // Breathing: volume-preserving vertical pulse anchored at the floor
    const breath = Math.sin(this.phase.breath) * lerp(tr.breathDepth, 0.042, sl) * m * idle;
    // Floating: hovers above its rest position, settles lower when asleep
    const float = -(0.5 + 0.5 * Math.sin(this.phase.float)) * lerp(tr.floatHeight, 1, sl) * m * idle;

    // Pulling downward squishes into the floor instead of sinking through it
    const down = Math.max(0, s.y.value);
    const press = s.squash.value * (1 - (down / DRAG_REACH_DOWN) * 0.16);
    const scaleY = press * (1 + breath) * s.actSy.value;
    const scaleX = (1 + (1 - press) * 0.9) * (1 - breath * 0.65) * s.actSx.value;

    const y = Math.min(s.y.value, 0) + s.hop.value + float + s.actY.value;
    const lift = Math.max(0, -y);

    const sx = s.stretchX.value;
    const sy = s.stretchY.value;

    // Blink
    let blink = 0;
    if (this.options.blink && this.mode === 'awake') {
      const b = this.persona.behavior;
      if (now >= this.blink.next && this.blink.start < 0) {
        this.blink.start = now;
        this.blink.double = Math.random() < b.doubleBlink;
      }
      if (this.blink.start >= 0) {
        const t = (now - this.blink.start) / tr.blinkMs;
        if (t < 1) blink = Math.sin(Math.PI * t);
        else if (this.blink.double && t > 1.35 && t < 2.35) blink = Math.sin(Math.PI * (t - 1.35));
        else if (t >= (this.blink.double ? 2.35 : 1)) {
          this.blink.start = -1;
          this.blink.next = now + randIn(b.blinkEvery);
        }
      }
    }

    // Jelly: idle undulation + extra wobble right after squash impacts
    const jiggle = Math.min(Math.abs(s.squash.velocity) * 0.0035, 0.03);
    const wobble = (lerp(tr.wobble, 0.008, sl) * idle + jiggle) * m;

    return {
      x: s.x.value + s.actX.value,
      y,
      scaleX,
      scaleY,
      stretch: Math.hypot(sx, sy),
      stretchAngle: (Math.atan2(sy, sx) * 180) / Math.PI,
      tilt: s.tilt.value + s.actRot.value,
      lookX: clamp(s.lookX.value, -1.2, 1.2),
      lookY: clamp(s.lookY.value, -1.2, 1.2),
      blink,
      wobble,
      wobbleTime: this.phase.wobble,
      shadow: 1 - Math.min(lift / 150, 0.5),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */

  _bind() {
    const el = this.el;
    const off = [];
    const listen = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      off.push(() => target.removeEventListener(type, fn, opts));
    };

    if (this.options.interactive) {
      el.dataset.interactive = '';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${this.character.label}. Poke or drag me!`);

      listen(el, 'pointerdown', (e) => this._onDown(e));
      listen(el, 'pointermove', (e) => this._onDrag(e));
      listen(el, 'pointerup', (e) => this._onUp(e));
      listen(el, 'pointercancel', (e) => this._onUp(e, true));
      listen(el, 'lostpointercapture', (e) => { if (this.press?.id === e.pointerId) this._onUp(e, true); });
      listen(el, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.poke(); }
      });
      listen(el, 'contextmenu', (e) => { if (this.press) e.preventDefault(); });
    }

    // Global activity + gaze
    listen(window, 'pointermove', (e) => this._onGlobalMove(e), { passive: true });
    listen(window, 'pointerdown', (e) => {
      this._onGlobalMove(e);
      this._activity();
      if (this.mode === 'sleeping' && !el.contains(e.target)) this.wake();
    }, { passive: true });
    listen(window, 'keydown', () => { this._activity(); if (this.mode === 'sleeping') this.wake(); });
    listen(window, 'wheel', () => this._activity(), { passive: true });
    listen(document.documentElement, 'pointerleave', () => { this.pointer.active = false; });
    listen(window, 'blur', () => { this.pointer.active = false; });
    listen(window, 'scroll', () => { this.rectDirty = true; }, { passive: true, capture: true });
    listen(window, 'resize', () => { this.rectDirty = true; });

    const onMotionPref = () => this._applyMotionPreference();
    const mq = this._mq; // capture: cleanup must target the same object we subscribed to
    if (mq?.addEventListener) {
      mq.addEventListener('change', onMotionPref);
      off.push(() => mq.removeEventListener('change', onMotionPref));
    }

    // Skip work while scrolled out of view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([entry]) => {
        this.onscreen = entry.isIntersecting;
        this.rectDirty = true;
      });
      io.observe(el);
      off.push(() => io.disconnect());
    }

    this._unbind = () => off.forEach((fn) => fn());
  }

  _onGlobalMove(e) {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.active = true;
    this.pointer.lastMove = performance.now();
    this.rectDirty = true;

    if (this.mode === 'sleeping') {
      // Only wake when the pointer comes close — far-away movement lets it nap
      const r = this._getRect();
      if (r) {
        const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (dist < r.width * 0.6) this.wake();
      }
    } else {
      this._activity();
    }
  }

  _onDown(e) {
    if (e.button !== 0 || this.press) return;
    e.preventDefault();
    try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic or already-released pointer */ }
    this._activity();
    if (this.mode === 'sleeping') this.wake();

    this.cancelAction();
    this.press = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      k: this.character.unitsPerPixel,
    };
    this.exprQueue = [];
    this.exprUntil = 0;
    this.glance.forced = false;
    this.springs.squash.target = 1 - 0.18 * clamp(this.traits.reaction, 0.6, 1.3);
    this.character.setExpression('poked');
    this.el.classList.add('is-pressed');
  }

  _onDrag(e) {
    const p = this.press;
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;

    if (!p.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      p.dragging = true;
      this.springs.squash.target = 1;
      this.springs.x.configure(HELD);
      this.springs.y.configure(HELD);
      this.character.setExpression(this.persona.behavior.drag);
      this.el.classList.add('is-dragging');
      this._emit('dragstart');
    }
    if (!p.dragging) return;

    // Elastic leash: follows 1:1 near the start, resists further away
    const ux = dx * p.k;
    const uy = dy * p.k;
    const dist = Math.hypot(ux, uy) || 1;
    const reach = uy > 0 ? lerp(DRAG_REACH, DRAG_REACH_DOWN, Math.min(1, uy / dist)) : DRAG_REACH;
    const eased = reach * Math.tanh(dist / reach);
    this.springs.x.target = (ux / dist) * eased;
    this.springs.y.target = (uy / dist) * eased;
    this._activity();
  }

  _onUp(e, cancelled = false) {
    const p = this.press;
    if (!p || e.pointerId !== p.id) return;
    this.press = null;
    this.el.classList.remove('is-pressed', 'is-dragging');
    try { if (this.el.hasPointerCapture(e.pointerId)) this.el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }

    const s = this.springs;
    this._tuneSprings(); // restore personality spring tuning after HELD
    s.x.target = 0;
    s.y.target = 0;
    s.squash.target = 1;
    const k = this.traits.reaction;

    if (p.dragging) {
      this._expressions(this.persona.behavior.release);
      this._emit('dragend');
    } else if (!cancelled) {
      // Released poke: spring overshoots into a stretch, then settles
      s.squash.velocity += 2.5 * this.motion * k;
      s.hop.velocity -= 190 * this.motion * k;
      // The squeeze was already shown while pressed; play the rest of the reaction
      const [, ...after] = this.persona.behavior.poke;
      this._expressions([['poked', 200], ...after]);
      this._emit('poke');
    } else {
      this.character.setExpression(null);
    }
    this._activity();
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  _activity() {
    this.lastActivity = performance.now();
  }

  _expressions(seq) {
    this.exprQueue = seq.slice();
    this.exprUntil = 0;
  }

  _getRect() {
    if (this.rectDirty || !this.rect) {
      this.rect = this.character.refs.svg.getBoundingClientRect();
      this.rectDirty = false;
    }
    return this.rect.width ? this.rect : null;
  }

  _applyMotionPreference() {
    this.motion = this._mq?.matches ? 0 : 1;
    for (const [k, cfg] of Object.entries(SPRINGS)) {
      if (this.press?.dragging && (k === 'x' || k === 'y')) continue;
      this.springs[k].configure(cfg);
      if (this.motion === 0) this.springs[k].critical();
    }
    if (this.traits) this._tuneSprings();
  }

  _wrapRotation() {
    const r = this.springs.actRot;
    r.value = ((((r.value + 180) % 360) + 360) % 360) - 180;
  }

  _emit(type, detail = {}) {
    this.el.dispatchEvent(new CustomEvent(`character:${type}`, { bubbles: true, detail: { animator: this, ...detail } }));
  }
}
