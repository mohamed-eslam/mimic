/**
 * Product scenes for the homepage — small, static UI mockups that show a character
 * inside a product surface, plus the reusable visual-first card that frames them.
 *
 * Everything here is an ILLUSTRATION: static markup, no controls, no live AI, no
 * real integrations. Each visual is exposed to assistive tech as one labelled
 * image and marked "Illustrative example" on screen. Pieces marked `.sc-a` stagger
 * in when their card/scene is revealed (CSS in css/home.css; off under reduced motion).
 */
import { t, pick, tl } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { SHOWCASE } from '../../data/showcase.js';
import { findListing } from '../../data/catalog.js';

const s = (key) => t(`home.story.${key}`);
const o = (key) => t(`home.offerCards.${key}`);
const step = (ms) => `style="--d:${ms}ms"`;

/** Decorative image (the surrounding visual carries the accessible label). */
const img = (src, cls) => (src ? `<img class="${cls}" src="${src}" alt="" loading="lazy" decoding="async">` : '');

/** Visual frame: one labelled image for assistive tech + on-screen "Illustrative example" tag. */
export const sceneFrame = (label, inner, cls = '') => `
  <div class="sc-visual ${cls}" role="img" aria-label="${label}">
    <span class="sc-demo" aria-hidden="true">${s('demo')}</span>
    <div class="sc-scene" aria-hidden="true">${inner}</div>
  </div>`;

/**
 * Reusable visual-first card.
 * @param {{ id: string, title: string, text: string, label: string, visual: string, cta?: string }} c
 */
export const visualCard = (c, i = 0) => `
  <article class="vcard vcard--${c.id}" data-reveal="${i}">
    ${sceneFrame(c.label, c.visual)}
    <div class="vcard__body">
      <h3 class="vcard__title">${c.title}</h3>
      <p class="vcard__text">${c.text}</p>
      ${c.cta ?? ''}
    </div>
  </article>`;

/* ==========================================================================
   What we offer
   ========================================================================== */

/** Mini catalog: search, filters and three real character thumbnails. */
export function catalogScene() {
  const cast = ['karim', 'reem', 'faisal'].map(findListing).filter(Boolean);
  const filters = tl('home.offerCards.ready.filters');
  return `
    <div class="sc-window sc-a" ${step(0)}>
      <div class="sc-search">${icon('search', { size: 14 })}<span>${o('ready.search')}</span></div>
      <div class="sc-chips">${filters.map((f, i) => `<span class="${i === 0 ? 'is-on' : ''}">${f}</span>`).join('')}</div>
      <div class="sc-thumbs">
        ${cast.map((l, i) => `
          <span class="sc-thumb sc-a" ${step(150 + i * 120)}>
            <span class="sc-thumb__img">${img(l.media?.image, '')}</span>
            <strong>${pick(l.name)}</strong>
          </span>`).join('')}
      </div>
    </div>`;
}

/** Guided brief: a style question with option chips. */
export function briefScene() {
  const opts = tl('home.offerCards.custom.options');
  return `
    <div class="sc-window sc-brief sc-a" ${step(0)}>
      <div class="sc-brief__top"><span>${o('custom.step')}</span><span class="sc-progress"><i style="inline-size:40%"></i></span></div>
      <strong class="sc-brief__q">${o('custom.question')}</strong>
      <div class="sc-options">
        ${opts.map((x, i) => `<span class="sc-option sc-a ${i === 0 ? 'is-on' : ''}" ${step(150 + i * 120)}>${i === 0 ? icon('check', { size: 14 }) : '<i></i>'}${x}</span>`).join('')}
      </div>
      <span class="sc-btn sc-a" ${step(550)}>${o('custom.next')}</span>
    </div>`;
}

/** Integration request: target surfaces + "scoped by our team". */
export function integrationScene() {
  const targets = tl('home.offerCards.integration.targets');
  const icons = ['globe', 'grid', 'chat', 'megaphone'];
  return `
    <div class="sc-window sc-a" ${step(0)}>
      <div class="sc-int__head">${icon('code', { size: 14 })}<strong>${o('integration.heading')}</strong></div>
      <ul class="sc-int__list">
        ${targets.map((x, i) => `<li class="sc-a" ${step(150 + i * 110)}><span class="sc-int__ic">${icon(icons[i], { size: 14 })}</span>${x}${i < 2 ? `<span class="sc-int__ok">${icon('check', { size: 12 })}</span>` : ''}</li>`).join('')}
      </ul>
      <p class="sc-int__foot sc-a" ${step(650)}>${icon('info', { size: 14 })}<span>${o('integration.scoped')}</span></p>
    </div>`;
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
