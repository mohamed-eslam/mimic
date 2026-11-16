/**
 * Character — renders one configurable blob mascot as layered SVG.
 *
 * Rendering is fully independent from page UI: give it a container and
 * options, then drive it through the public setters. Motion is NOT decided
 * here — an animator (see animator.js) computes a pose each frame and calls
 * applyPose(), which is the single place transforms are written. That keeps
 * breathing, squash, drag and eye tracking from fighting each other.
 *
 *   const c = new Character(el, { color: '#ffb0d1', shape: 'blob' });
 *   c.setEyes('sparkle').setMouth('open').setSize(1.1);
 *
 * Events (bubbling CustomEvents on c.el): character:change
 */
import { derivePalette, isValidColor } from './color.js';
import { VIEW, SHAPES, SHAPE_NAMES, buildShape, lerpShape, wobblePoints, pathFromPoints } from './geometry.js';
import {
  EYES, MOUTHS, EXPRESSIONS, ACCESSORIES, EYE_NAMES, MOUTH_NAMES, ACCESSORY_NAMES,
  drawEye, drawMouth, drawAccessory,
} from './parts.js';
import { addTick } from './ticker.js';

export const DEFAULT_CHARACTER = Object.freeze({
  color: '#b9a6ff',
  shape: 'round',
  eyes: 'classic',
  mouth: 'smile',
  cheeks: true,
  size: 1,
  width: 1,
  height: 1,
  eyeSize: 1,
  eyeSpacing: 1,
  accessory: 'none',
});

/** Numeric ranges accepted by the engine (values are clamped). */
export const RANGES = Object.freeze({
  size: { min: 0.6, max: 1.3 },
  width: { min: 0.8, max: 1.25 },
  height: { min: 0.8, max: 1.25 },
  eyeSize: { min: 0.7, max: 1.4 },
  eyeSpacing: { min: 0.75, max: 1.3 },
});
export const SIZE_RANGE = RANGES.size;

export const NEUTRAL_POSE = Object.freeze({
  x: 0, y: 0,              // body offset (view units)
  scaleX: 1, scaleY: 1,     // squash & breathing, anchored at the floor
  stretch: 0,               // directional stretch amount (0–~0.35)
  stretchAngle: 0,          // degrees
  tilt: 0,                  // degrees
  lookX: 0, lookY: 0,       // gaze, -1..1
  blink: 0,                 // 0 open → 1 closed
  wobble: 0,                // organic outline deformation amplitude
  wobbleTime: 0,
  shadow: 1,                // ground shadow scale (shrinks as body lifts)
});

const EYE_X = 27;
const CHEEK_X = 47;
const MOUTH_Y = 25;
const MORPH_MS = 560;

let uidSeq = 0;
const r = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function sanitize(input) {
  const out = { ...DEFAULT_CHARACTER };
  if (isValidColor(input.color)) out.color = input.color;
  if (SHAPES[input.shape]) out.shape = input.shape;
  if (EYES[input.eyes]) out.eyes = input.eyes;
  if (MOUTHS[input.mouth]) out.mouth = input.mouth;
  if (typeof input.cheeks === 'boolean') out.cheeks = input.cheeks;
  if (ACCESSORIES[input.accessory]) out.accessory = input.accessory;
  for (const [key, range] of Object.entries(RANGES)) {
    if (input[key] != null && Number.isFinite(+input[key])) out[key] = clamp(+input[key], range.min, range.max);
  }
  return out;
}

/** Write an attribute only when its value actually changes. */
function setAttr(el, name, value) {
  const key = `__${name}`;
  if (el[key] === value) return;
  el[key] = value;
  el.setAttribute(name, value);
}

export class Character {
  static SHAPES = SHAPE_NAMES.map((id) => ({ id, label: SHAPES[id].label }));
  static EYES = EYE_NAMES.map((id) => ({ id, label: EYES[id].label }));
  static MOUTHS = MOUTH_NAMES.map((id) => ({ id, label: MOUTHS[id].label }));
  static ACCESSORIES = ACCESSORY_NAMES.map((id) => ({ id, label: ACCESSORIES[id].label, slot: ACCESSORIES[id].slot }));
  static RANGES = RANGES;
  static SIZE = SIZE_RANGE;

  /**
   * @param {HTMLElement|null} target container to append into (optional)
   * @param {object} options color, shape, eyes, mouth, cheeks, size, label, className
   */
  constructor(target, options = {}) {
    this.uid = `clc${++uidSeq}`;
    this.state = sanitize({ ...DEFAULT_CHARACTER, ...options });
    this.label = options.label ?? 'Character';
    this.expression = null;
    this.animator = null;
    this.pose = { ...NEUTRAL_POSE };

    this._shape = this._buildShape(); // resting target
    this._current = this._shape;                 // what is drawn (may be mid-morph)
    this._morph = null;
    this._partsKey = '';
    this._untick = null;

    this.el = document.createElement('div');
    this.el.className = ['cl-char', options.className].filter(Boolean).join(' ');
    this.el.setAttribute('role', 'img');
    this.el.setAttribute('aria-label', this.label);
    this.el.innerHTML = this._template();
    this._collectRefs();

    this._applyColor();
    this._applyParts();
    this._applyAccessory();
    this._applySize();
    this._applyShapeMeta(this._current);
    this.applyPose();

    if (target) target.appendChild(this.el);
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  setColor(color) {
    if (!isValidColor(color) || color === this.state.color) return this;
    this.state.color = color;
    this._applyColor();
    return this._changed('color');
  }

  setShape(shape, { animate = true } = {}) {
    if (!SHAPES[shape] || shape === this.state.shape) return this;
    this.state.shape = shape;
    const from = this._current;
    this._shape = this._buildShape();
    if (animate && !reducedMotion()) {
      this._morph = { from, to: this._shape, start: performance.now() };
    } else {
      this._morph = null;
      this._current = this._shape;
      this._applyShapeMeta(this._current);
    }
    this._requestRender();
    return this._changed('shape');
  }

  setEyes(style) {
    if (!EYES[style] || style === this.state.eyes) return this;
    this.state.eyes = style;
    this._applyParts();
    return this._changed('eyes');
  }

  setMouth(style) {
    if (!MOUTHS[style] || style === this.state.mouth) return this;
    this.state.mouth = style;
    this._applyParts();
    return this._changed('mouth');
  }

  setCheeks(visible) {
    visible = Boolean(visible);
    if (visible === this.state.cheeks) return this;
    this.state.cheeks = visible;
    this._applyParts();
    return this._changed('cheeks');
  }

  /** @param {number} size overall scale factor, clamped to RANGES.size (1 = default) */
  setSize(size) {
    if (!this._setNumber('size', size)) return this;
    this._applySize();
    return this._changed('size');
  }

  /** Body proportions — multipliers of the shape's natural width / height. */
  setProportions({ width = this.state.width, height = this.state.height } = {}) {
    const w = this._setNumber('width', width);
    const h = this._setNumber('height', height);
    if (!w && !h) return this;
    // Rebuild instantly (sliders fire continuously; a morph would lag behind)
    this._shape = this._buildShape();
    if (this._morph) this._morph.to = this._shape;
    else { this._current = this._shape; this._applyShapeMeta(this._current); }
    this._requestRender();
    return this._changed('proportions');
  }

  setWidth(width) { return this.setProportions({ width }); }
  setHeight(height) { return this.setProportions({ height }); }

  setEyeSize(eyeSize) {
    if (!this._setNumber('eyeSize', eyeSize)) return this;
    this._applyAccessory();
    this._requestRender();
    return this._changed('eyeSize');
  }

  setEyeSpacing(eyeSpacing) {
    if (!this._setNumber('eyeSpacing', eyeSpacing)) return this;
    this._applyParts();
    this._applyAccessory();
    this._requestRender();
    return this._changed('eyeSpacing');
  }

  /** One accessory at a time: 'none' | 'partyHat' | 'beanie' | 'bow' | 'glasses' | 'shades' */
  setAccessory(name) {
    if (!ACCESSORIES[name] || name === this.state.accessory) return this;
    this.state.accessory = name;
    this._applyAccessory();
    this._applyShapeMeta(this._current);
    return this._changed('accessory');
  }

  /** Apply several properties at once. */
  update(partial = {}) {
    if ('color' in partial) this.setColor(partial.color);
    if ('shape' in partial) this.setShape(partial.shape, { animate: partial.animate !== false });
    if ('eyes' in partial) this.setEyes(partial.eyes);
    if ('mouth' in partial) this.setMouth(partial.mouth);
    if ('cheeks' in partial) this.setCheeks(partial.cheeks);
    if ('size' in partial) this.setSize(partial.size);
    if ('width' in partial || 'height' in partial) this.setProportions(partial);
    if ('eyeSize' in partial) this.setEyeSize(partial.eyeSize);
    if ('eyeSpacing' in partial) this.setEyeSpacing(partial.eyeSpacing);
    if ('accessory' in partial) this.setAccessory(partial.accessory);
    return this;
  }

  /**
   * Temporarily override eyes/mouth with a named expression
   * (happy, poked, grabbed, surprised, sleep) — null restores the user's choice.
   */
  setExpression(name) {
    const next = EXPRESSIONS[name] ? name : null;
    if (next === this.expression) return this;
    this.expression = next;
    this._applyParts();
    return this;
  }

  getState() {
    return { ...this.state };
  }

  /** Geometry info for animators (center/bounds in view units). */
  get geometry() {
    return this._current;
  }

  /**
   * Render a pose. The ONLY method that writes transforms.
   * Missing fields keep their previous value.
   */
  applyPose(partial = {}) {
    const p = Object.assign(this.pose, partial);

    let shapeMoved = false;
    if (this._morph) {
      const t = Math.min(1, (performance.now() - this._morph.start) / MORPH_MS);
      this._current = t >= 1 ? this._morph.to : lerpShape(this._morph.from, this._morph.to, easeOutBack(t));
      if (t >= 1) this._morph = null;
      shapeMoved = true;
    }
    const shape = this._current;
    if (shapeMoved) this._applyShapeMeta(shape);

    const d = pathFromPoints(wobblePoints(shape, p.wobble, p.wobbleTime));
    setAttr(this.refs.shape, 'd', d);

    const [cx, cy] = shape.center;
    const g = VIEW.ground;
    const s = Math.max(0, p.stretch);
    const along = 1 + s;
    const across = 1 / Math.sqrt(along); // keep volume roughly constant

    setAttr(
      this.refs.motion,
      'transform',
      `translate(${r(p.x)} ${r(p.y)}) ` +
        `translate(${r(cx)} ${r(cy)}) rotate(${r(p.tilt + p.stretchAngle)}) scale(${r(along)} ${r(across)}) rotate(${r(-p.stretchAngle)}) translate(${r(-cx)} ${r(-cy)}) ` +
        `translate(${r(cx)} ${g}) scale(${r(p.scaleX)} ${r(p.scaleY)}) translate(${r(-cx)} ${-g})`,
    );

    const f = shape.face;
    setAttr(this.refs.face, 'transform', `translate(${r(f.x + p.lookX * 3.2)} ${r(f.y + p.lookY * 2.6)}) scale(${r(f.scale)})`);

    const es = this.state.eyeSize;
    const eyeX = EYE_X * this.state.eyeSpacing;
    const blinkScale = r(es * (1 - 0.92 * clamp(p.blink, 0, 1)));
    this.refs.eyes.forEach((eye, i) => {
      const side = i === 0 ? -1 : 1;
      setAttr(eye, 'transform', `translate(${r(side * eyeX + p.lookX * 5)} ${r(p.lookY * 4.2)})`);
      setAttr(this.refs.eyeShapes[i], 'transform', `scale(${r(es)} ${blinkScale})`);
    });
    setAttr(this.refs.accFace, 'transform', `translate(${r(p.lookX * 4.6)} ${r(p.lookY * 3.8)})`);
    setAttr(this.refs.mouth, 'transform', `translate(${r(p.lookX * 2)} ${r(MOUTH_Y + p.lookY * 1.5)})`);
    setAttr(this.refs.cheeks, 'transform', `translate(${r(p.lookX * 2.2)} ${r(p.lookY * 1.4)})`);
    setAttr(this.refs.shine, 'transform', `translate(${r(-p.lookX * 2.5)} ${r(-p.lookY * 2)})`);

    const sh = clamp(p.shadow, 0.3, 1.4);
    setAttr(
      this.refs.shadow,
      'transform',
      `translate(${r(p.x)} 0) translate(${r(cx)} ${g}) scale(${r(sh * p.scaleX)} ${r(sh)}) translate(${r(-cx)} ${-g})`,
    );
    setAttr(this.refs.shadow, 'opacity', r(0.18 * clamp(sh, 0.3, 1)));
    return this;
  }

  /** Map a client (screen) point into the character's view coordinates. */
  clientToView(clientX, clientY) {
    const rect = this.refs.svg.getBoundingClientRect();
    const k = VIEW.w / (rect.width || 1);
    return [VIEW.x + (clientX - rect.left) * k, VIEW.y + (clientY - rect.top) * k];
  }

  /** View units per CSS pixel (for converting pointer deltas). */
  get unitsPerPixel() {
    const w = this.refs.svg.getBoundingClientRect().width || 1;
    return VIEW.w / w;
  }

  destroy() {
    this._untick?.();
    this.animator?.destroy();
    this.el.remove();
  }

  /* ------------------------------------------------------------------ */
  /* Internals                                                           */
  /* ------------------------------------------------------------------ */

  _buildShape() {
    return buildShape(this.state.shape, { width: this.state.width, height: this.state.height });
  }

  /** Clamp + assign a numeric state field; returns true if it changed. */
  _setNumber(key, value) {
    const range = RANGES[key];
    const next = clamp(Number.isFinite(+value) ? +value : DEFAULT_CHARACTER[key], range.min, range.max);
    if (next === this.state[key]) return false;
    this.state[key] = next;
    return true;
  }

  _applyAccessory() {
    const name = this.state.accessory;
    const def = ACCESSORIES[name];
    const markup = drawAccessory(name, {
      uid: this.uid,
      eyeX: Math.round(EYE_X * this.state.eyeSpacing * 100) / 100,
      eyeSize: this.state.eyeSize,
    });
    const face = def.slot === 'face';
    const key = `${name}|${face ? `${this.state.eyeSpacing}|${this.state.eyeSize}` : ''}`;
    if (key === this._accKey) return;
    this._accKey = key;
    this.refs.accFace.innerHTML = face ? markup : '';
    this.refs.accHead.innerHTML = face ? '' : markup;
    this.el.dataset.accessory = name;
  }

  _changed(prop) {
    this.el.dispatchEvent(
      new CustomEvent('character:change', { bubbles: true, detail: { prop, state: this.getState() } }),
    );
    return this;
  }

  /** Without an animator, run a short private loop only while morphing. */
  _requestRender() {
    if (this.animator?.running) return; // the animator renders every frame
    if (!this._morph) { this.applyPose(); return; }
    if (this._untick) return;
    this._untick = addTick(() => {
      this.applyPose();
      if (!this._morph) { this._untick(); this._untick = null; }
    });
  }

  _applyColor() {
    const pal = derivePalette(this.state.color);
    this.refs.stops.forEach((stop) => { stop.style.stopColor = pal[stop.dataset.c]; });
    this.refs.edge.style.stroke = pal.deep;
    this.el.style.setProperty('--cl-char-color', pal.base);
  }

  _applyParts() {
    const expr = this.expression ? EXPRESSIONS[this.expression] : null;
    const eyes = expr?.eyes ?? this.state.eyes;
    const mouth = expr?.mouth ?? this.state.mouth;
    const key = `${eyes}|${mouth}`;
    if (key !== this._partsKey) {
      this._partsKey = key;
      this.refs.eyeShapes[0].innerHTML = drawEye(eyes, -1, this.uid);
      this.refs.eyeShapes[1].innerHTML = drawEye(eyes, 1, this.uid);
      this.refs.mouth.innerHTML = drawMouth(mouth, this.uid);
    }
    this.refs.cheeks.style.display = this.state.cheeks ? '' : 'none';
    const cheekX = r(CHEEK_X + (this.state.eyeSpacing - 1) * EYE_X * 0.8);
    this.refs.cheekEls.forEach((c, i) => setAttr(c, 'cx', i === 0 ? -cheekX : cheekX));
    this.el.dataset.expression = this.expression ?? 'neutral';
  }

  _applySize() {
    const s = this.state.size;
    setAttr(this.refs.figure, 'transform', `translate(${VIEW.cx} ${VIEW.ground}) scale(${r(s)}) translate(${-VIEW.cx} ${-VIEW.ground})`);
  }

  /** Things positioned relative to the body silhouette (highlights, shadow, z's). */
  _applyShapeMeta(shape) {
    const { minX, maxX, minY, maxY } = shape.bounds;
    const w = maxX - minX;
    const h = maxY - minY;
    const soft = this.refs.hlSoft;
    setAttr(soft, 'cx', r(minX + w * 0.32));
    setAttr(soft, 'cy', r(minY + h * 0.25));
    setAttr(soft, 'rx', r(w * 0.22));
    setAttr(soft, 'ry', r(h * 0.15));
    setAttr(soft, 'transform', `rotate(-24 ${r(minX + w * 0.32)} ${r(minY + h * 0.25)})`);

    const gloss = this.refs.hlGloss;
    const gx = minX + w * 0.27;
    const gy = minY + h * 0.17;
    setAttr(gloss, 'cx', r(gx));
    setAttr(gloss, 'cy', r(gy));
    setAttr(gloss, 'rx', r(w * 0.06));
    setAttr(gloss, 'ry', r(h * 0.037));
    setAttr(gloss, 'transform', `rotate(-32 ${r(gx)} ${r(gy)})`);

    setAttr(this.refs.shadow, 'rx', r(w * 0.43));

    const acc = ACCESSORIES[this.state.accessory];
    if (acc.slot === 'head') {
      const k = w / 172;
      setAttr(this.refs.accHead, 'transform', `translate(${r(shape.face.x)} ${r(minY + h * acc.anchorY)}) scale(${r(k)})`);
    } else if (acc.slot === 'side') {
      setAttr(this.refs.accHead, 'transform', `translate(${r(shape.face.x + w * 0.27)} ${r(minY + h * 0.1)}) scale(${r(shape.face.scale)})`);
    }
    setAttr(this.refs.zzz, 'transform', `translate(${r(maxX - w * 0.12)} ${r(minY + 6)})`);
  }

  _collectRefs() {
    const $ = (sel) => this.el.querySelector(sel);
    this.refs = {
      svg: $('.cl-char__svg'),
      shape: $(`#${this.uid}-shape`),
      figure: $('.cl-char__figure'),
      motion: $('.cl-char__motion'),
      shadow: $('.cl-char__shadow'),
      shine: $('.cl-char__shine'),
      hlSoft: $('.cl-char__hl-soft'),
      hlGloss: $('.cl-char__hl-gloss'),
      edge: $('.cl-char__edge'),
      face: $('.cl-char__face'),
      cheeks: $('.cl-char__cheeks'),
      cheekEls: [...this.el.querySelectorAll('.cl-char__cheeks ellipse')],
      accHead: $('.cl-char__acc-head'),
      accFace: $('.cl-char__acc-face'),
      eyes: [...this.el.querySelectorAll('.cl-char__eye')],
      eyeShapes: [...this.el.querySelectorAll('.cl-char__eye-shape')],
      mouth: $('.cl-char__mouth'),
      zzz: $('.cl-char__zzz'),
      stops: [...this.el.querySelectorAll('stop[data-c]')],
    };
  }

  _template() {
    const u = this.uid;
    const stop = (offset, c, opacity = 1) => `<stop offset="${offset}" data-c="${c}" stop-opacity="${opacity}"/>`;
    return `
<svg class="cl-char__svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" aria-hidden="true" focusable="false">
  <defs>
    <path id="${u}-shape" d=""/>
    <clipPath id="${u}-clip"><use href="#${u}-shape"/></clipPath>
    <radialGradient id="${u}-body" cx="0.4" cy="0.32" r="0.78" fx="0.34" fy="0.24">
      ${stop(0, 'light')}${stop(0.5, 'base')}${stop(1, 'dark')}
    </radialGradient>
    <radialGradient id="${u}-ao" cx="0.52" cy="1.12" r="0.66">
      ${stop(0, 'deep', 0.55)}${stop(0.55, 'deep', 0.16)}${stop(1, 'deep', 0)}
    </radialGradient>
    <radialGradient id="${u}-rim" cx="0.16" cy="0.9" r="0.42">
      ${stop(0, 'rim', 0.55)}${stop(1, 'rim', 0)}
    </radialGradient>
    <radialGradient id="${u}-hl">
      ${stop(0, 'highlight', 0.95)}${stop(0.6, 'highlight', 0.35)}${stop(1, 'highlight', 0)}
    </radialGradient>
    <radialGradient id="${u}-cheek">
      ${stop(0, 'cheek', 0.85)}${stop(0.55, 'cheek', 0.45)}${stop(1, 'cheek', 0)}
    </radialGradient>
    <radialGradient id="${u}-iris" cx="0.5" cy="0.9" r="0.6">
      <stop offset="0" stop-color="#7d6bb8" stop-opacity="0.9"/><stop offset="1" stop-color="#7d6bb8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${u}-acc-shade" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.38"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2b2340" stop-opacity="0.18"/>
    </linearGradient>
    <filter id="${u}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="${u}-gloss" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <g class="cl-char__figure">
    <ellipse class="cl-char__shadow" cx="${VIEW.cx}" cy="${VIEW.ground + 1}" rx="76" ry="9" fill="#2b2340" filter="url(#${u}-blur)"/>
    <g class="cl-char__motion">
      <use class="cl-char__body" href="#${u}-shape" fill="url(#${u}-body)"/>
      <g clip-path="url(#${u}-clip)">
        <use href="#${u}-shape" fill="url(#${u}-ao)"/>
        <use href="#${u}-shape" fill="url(#${u}-rim)"/>
        <g class="cl-char__shine">
          <ellipse class="cl-char__hl-soft" fill="url(#${u}-hl)"/>
          <ellipse class="cl-char__hl-gloss" fill="#fff" opacity="0.9" filter="url(#${u}-gloss)"/>
        </g>
      </g>
      <use class="cl-char__edge" href="#${u}-shape" fill="none" stroke-width="1.5" stroke-opacity="0.14"/>
      <g class="cl-char__acc-head"></g>
      <g class="cl-char__face">
        <g class="cl-char__cheeks">
          <ellipse cx="-47" cy="15" rx="14" ry="8.5" fill="url(#${u}-cheek)"/>
          <ellipse cx="47" cy="15" rx="14" ry="8.5" fill="url(#${u}-cheek)"/>
        </g>
        <g class="cl-char__eye"><g class="cl-char__eye-shape"></g></g>
        <g class="cl-char__eye"><g class="cl-char__eye-shape"></g></g>
        <g class="cl-char__mouth"></g>
        <g class="cl-char__acc-face"></g>
      </g>
    </g>
    <g class="cl-char__zzz" aria-hidden="true"><text x="0" y="0">z</text><text x="12" y="-16">z</text><text x="26" y="-34">Z</text></g>
  </g>
</svg>`;
  }
}

/** Standalone SVG thumbnail of an accessory — for pickers. */
export function accessoryPreview(name) {
  const def = ACCESSORIES[name] ?? ACCESSORIES.none;
  if (!def.slot) {
    return `<svg viewBox="-24 -24 48 48" aria-hidden="true"><circle r="16" fill="none" stroke="#c4bed4" stroke-width="3"/><path d="M-11 11 11 -11" stroke="#c4bed4" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  const uid = `pv-acc-${name}`;
  const box = { head: '-72 -78 144 104', side: '-40 -30 80 64', face: '-58 -30 116 60' }[def.slot];
  const shadeDef = `<defs><linearGradient id="${uid}-acc-shade" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2b2340" stop-opacity=".18"/></linearGradient></defs>`;
  return `<svg viewBox="${box}" aria-hidden="true">${shadeDef}${drawAccessory(name, { uid, eyeX: 27, eyeSize: 1 })}</svg>`;
}

/**
 * Small standalone SVG of one face part — for pickers/thumbnails.
 * @param {'eyes'|'mouth'} kind
 */
export function partPreview(kind, style) {
  if (kind === 'eyes') {
    return `<svg viewBox="-46 -20 92 40" aria-hidden="true"><defs><radialGradient id="pv-iris" cx="0.5" cy="0.9" r="0.6"><stop offset="0" stop-color="#7d6bb8" stop-opacity=".9"/><stop offset="1" stop-color="#7d6bb8" stop-opacity="0"/></radialGradient></defs>
      <g transform="translate(-22 0)">${drawEye(style, -1, 'pv')}</g><g transform="translate(22 0)">${drawEye(style, 1, 'pv')}</g></svg>`;
  }
  return `<svg viewBox="-20 -12 40 32" aria-hidden="true">${drawMouth(style, 'pv')}</svg>`;
}
