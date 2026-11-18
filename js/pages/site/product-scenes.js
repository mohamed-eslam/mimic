/**
 * Product scenes for the homepage — small, static UI mockups that show a character
 * inside a product surface, plus the reusable visual-first card that frames them.
 *
 * Everything here is an ILLUSTRATION: static markup, no controls, no live AI, no
 * real integrations. Each visual is exposed to assistive tech as one labelled
 * image and marked "Illustrative example" on screen. Pieces marked `.sc-a` stagger
 * in when their card/scene is revealed (CSS in css/home.css; off under reduced motion).
 */
import { t, pick } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { SHOWCASE } from '../../data/showcase.js';

const s = (key) => t(`home.story.${key}`);
const step = (ms) => `style="--d:${ms}ms"`;

/** Decorative image (the surrounding visual carries the accessible label). */
const img = (src, cls) => (src ? `<img class="${cls}" src="${src}" alt="" loading="lazy" decoding="async">` : '');

/**
 * Visual frame: one labelled image for assistive tech. Product mockups carry an on-screen
 * "Illustrative example" tag; abstract artwork (art: true) doesn't need one.
 */
export const sceneFrame = (label, inner, cls = '', { art = false, photo = false } = {}) => `
  <div class="sc-visual ${art ? 'sc-visual--art' : ''} ${photo ? 'sc-visual--photo' : ''} ${cls}" role="img" aria-label="${label}">
    ${art || photo ? '' : `<span class="sc-demo" aria-hidden="true">${s('demo')}</span>`}
    <div class="sc-scene" aria-hidden="true">${inner}</div>
  </div>`;

/**
 * Reusable visual-first card.
 * @param {{ id: string, title: string, text: string, label: string, visual: string, cta?: string, art?: boolean, photo?: boolean }} c
 */
export const visualCard = (c, i = 0) => `
  <article class="vcard vcard--${c.id}" data-reveal="${i}">
    ${sceneFrame(c.label, c.visual, '', { art: Boolean(c.art), photo: Boolean(c.photo) })}
    <div class="vcard__body">
      <h3 class="vcard__title">${c.title}</h3>
      <p class="vcard__text">${c.text}</p>
      ${c.cta ?? ''}
    </div>
  </article>`;

/* ==========================================================================
   What we offer — abstract illustrations (SVG, monochrome tokens)
   One shared language: 320×220 canvas, 1.5 strokes, 12 radius tiles, four neutral
   tones (paper / soft / mid / ink). Idle: one quiet floating element per card.
   Hover / focus on the card adds the richer movement. Decorative: the frame carries
   the accessible label, so every SVG is aria-hidden.
   ========================================================================== */
const svg = (cls, body) =>
  `<svg class="art ${cls}" viewBox="0 0 320 220" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">${body}</svg>`;

/** Geometric avatar: head + shoulders inside a w×h tile at (x, y). */
const avatar = (x, y, tone) => `
  <circle class="art-${tone}" cx="${x + 48}" cy="${y + 44}" r="17"/>
  <path class="art-${tone}" d="M${x + 18} ${y + 94} a30 28 0 0 1 60 0 Z"/>`;
const tile = (x, y, tone, extra = '') => `
  <rect class="art-paper" x="${x}" y="${y}" width="96" height="124" rx="12"/>
  ${avatar(x, y, tone)}
  <rect class="art-soft" x="${x + 22}" y="${y + 102}" width="52" height="6" rx="3"/>
  <rect class="art-soft" x="${x + 32}" y="${y + 112}" width="32" height="5" rx="2.5"/>${extra}`;

/** 01 · Discover: a small collection of character identities. */
export function readyArt() {
  return svg('art--ready', `
    <g class="art-tile art-tile--l">${tile(46, 54, 'mid')}</g>
    <g class="art-tile art-tile--r">${tile(178, 54, 'soft-strong')}</g>
    <g class="art-tile art-tile--c">${tile(112, 40, 'ink')}
      <g class="art-float"><circle class="art-ink" cx="203" cy="44" r="10"/><path class="art-check" d="M198.5 44.2l3 3 5.5-6"/></g>
    </g>
    <g class="art-deco"><rect class="art-line-fill" x="26" y="26" width="34" height="12" rx="6"/><circle class="art-ink" cx="33" cy="32" r="2.5"/>
      <rect class="art-line-fill" x="262" y="186" width="34" height="12" rx="6"/><circle class="art-mid-dot" cx="289" cy="192" r="2.5"/></g>`);
}

/** 02 · Design: an abstract face built from modules, with guides and sliders. */
export function designArt() {
  return svg('art--design', `
    <circle class="art-ring" cx="160" cy="98" r="64"/>
    <path class="art-guide" d="M84 62 L112 80"/><path class="art-guide" d="M246 66 L214 84"/><path class="art-guide" d="M252 142 L218 124"/>
    <circle class="art-paper" cx="160" cy="98" r="52"/>
    <path class="art-ink" d="M110 92 Q160 30 210 92 Q186 76 160 84 Q134 76 110 92 Z"/>
    <circle class="art-ink" cx="143" cy="104" r="4.5"/><circle class="art-ink" cx="177" cy="104" r="4.5"/>
    <path class="art-stroke-ink" d="M146 124 Q160 134 174 124"/>
    <g class="art-float"><path class="art-soft-strong art-edge" d="M70 70 L84 46 L98 70 Z"/></g>
    <rect class="art-mid art-mod art-mod--sq" x="238" y="44" width="22" height="22" rx="6"/>
    <circle class="art-ink art-mod art-mod--dot" cx="256" cy="146" r="7"/>
    <g class="art-slider"><rect class="art-soft" x="100" y="180" width="120" height="4" rx="2"/><rect class="art-ink art-slider__fill" x="100" y="180" width="70" height="4" rx="2"/><circle class="art-knob art-knob--a" cx="170" cy="182" r="7"/></g>
    <g class="art-slider"><rect class="art-soft" x="100" y="200" width="120" height="4" rx="2"/><rect class="art-ink art-slider__fill art-slider__fill--b" x="100" y="200" width="38" height="4" rx="2"/><circle class="art-knob art-knob--b" cx="138" cy="202" r="7"/></g>`);
}

/** Supplied artwork image for a card's illustration area (decorative: the frame carries the label). */
export const cardImage = (src, w, h) =>
  `<img class="sc-photo" src="${src}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async">`;

/** 03 · Integrate: one character connected to web, app, chat and video. */
export function integrateArt() {
  const nodes = [
    { x: 62, y: 52, icon: '<rect class="art-stroke" x="50" y="42" width="24" height="20" rx="3"/><path class="art-stroke" d="M50 48h24"/><circle class="art-ink" cx="54" cy="45" r="1.2"/><circle class="art-ink" cx="58" cy="45" r="1.2"/>' },
    { x: 258, y: 52, icon: '<rect class="art-stroke" x="251" y="39" width="14" height="26" rx="4"/><path class="art-stroke" d="M256 61h4"/>' },
    { x: 62, y: 168, icon: '<path class="art-stroke" d="M50 160a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-9l-6 5v-5h-1a4 4 0 0 1-4-4z"/><circle class="art-ink" cx="57" cy="165" r="1.3"/><circle class="art-ink" cx="62" cy="165" r="1.3"/><circle class="art-ink" cx="67" cy="165" r="1.3"/>' },
    { x: 258, y: 168, icon: '<rect class="art-stroke" x="246" y="158" width="24" height="20" rx="4"/><path class="art-ink" d="M255.5 163.5v9l7.5-4.5z"/>' },
  ];
  const cx = 160, cy = 110;
  return svg('art--integrate', `
    ${nodes.map((n) => `<line class="art-link" x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}"/>`).join('')}
    ${nodes.map((n, i) => `<line class="art-pulse" style="--d:${i * 0.35}s" pathLength="100" x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}"/>`).join('')}
    ${nodes.map((n) => `<circle class="art-node" cx="${(cx + n.x) / 2}" cy="${(cy + n.y) / 2}" r="3"/>`).join('')}
    ${nodes.map((n) => `<rect class="art-paper" x="${n.x - 22}" y="${n.y - 22}" width="44" height="44" rx="12"/>${n.icon}`).join('')}
    <g class="art-float art-core">
      <rect class="art-ink" x="128" y="78" width="64" height="64" rx="16"/>
      <circle class="art-paper-fill" cx="160" cy="102" r="9"/>
      <path class="art-paper-fill" d="M144 132 a16 15 0 0 1 32 0 Z"/>
    </g>`);
}

/* ==========================================================================
   Characters in action
   ========================================================================== */

/** Chat widget with Adam (demo conversation, typing indicator). */
export function chatScene() {
  const adam = SHOWCASE.adam;
  return `
    <div class="sc-chat sc-a" ${step(0)}>
      <div class="sc-chat__head">
        <span class="sc-avatar">${img(adam.image, 'sc-avatar__img')}</span>
        <span class="sc-chat__who"><strong>${pick(adam.name)}</strong><small>${s('chatbot.role')}</small></span>
        <span class="sc-pill">${s('chatbot.status')}</span>
      </div>
      <div class="sc-chat__log">
        <p class="sc-msg sc-msg--bot sc-a" ${step(200)}>${s('chatbot.m1')}</p>
        <p class="sc-msg sc-msg--user sc-a" ${step(550)}>${s('chatbot.m2')}</p>
        <p class="sc-msg sc-msg--bot sc-a" ${step(950)}>${s('chatbot.m3')}</p>
        <p class="sc-typing sc-a" ${step(1300)}><span></span><span></span><span></span></p>
      </div>
      <div class="sc-chat__input">${icon('info', { size: 14 })}<span>${s('chatbot.input')}</span></div>
    </div>`;
}

/** Mobile onboarding with Milo + floating tip. */
export function appScene() {
  const milo = SHOWCASE.milo;
  return `
    <div class="sc-phone sc-a" ${step(0)}>
      <span class="sc-phone__notch"></span>
      <div class="sc-phone__screen">
        <span class="sc-phone__step">${s('inApp.step')}</span>
        <div class="sc-phone__hero">${img(milo.image, 'sc-phone__img')}</div>
        <span class="sc-dots"><i class="is-on"></i><i></i><i></i></span>
        <strong class="sc-phone__title">${s('inApp.hello')}</strong>
        <span class="sc-phone__body">${s('inApp.body')}</span>
        <span class="sc-btn">${s('inApp.button')}</span>
      </div>
    </div>
    <p class="sc-tip sc-a sc-float" ${step(600)}>${icon('sparkle', { size: 14 })}<span>${s('inApp.tip')}</span></p>`;
}

/** Presenter / video preview card with Nova (static image; controls are illustrative). */
export function presenterScene() {
  const nova = SHOWCASE.nova;
  return `
    <div class="sc-player sc-a" ${step(0)}>
      <div class="sc-player__frame">
        ${img(nova.image, 'sc-player__img')}
        <span class="sc-player__live sc-a" ${step(300)}><i></i>${s('presenter.live')}</span>
        <span class="sc-player__topic sc-a sc-float" ${step(600)}><strong>${s('presenter.topic')}</strong><small>${s('presenter.part')}</small></span>
      </div>
      <div class="sc-player__bar">
        <span class="sc-player__play">${icon('play', { size: 14 })}</span>
        <span class="sc-player__track"><i></i></span>
        <span class="sc-player__time">${s('presenter.time')}</span>
        <span class="sc-player__vol">${icon('volume', { size: 14 })}</span>
      </div>
    </div>`;
}

export const STORY_CHAPTERS = [
  { id: 'chatbot', key: 'chatbot', scene: chatScene },
  { id: 'app', key: 'inApp', scene: appScene },
  { id: 'presenter', key: 'presenter', scene: presenterScene },
];
