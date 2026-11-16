import { html, qs, disposer } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { pageHeader, tabs, tabPanel, placeholderFigure } from '../ui/components.js';
import { enhance } from '../ui/behaviors.js';
import { toast } from '../ui/toast.js';

/** Photo Booth — layout & capture flow scaffold; real capture lands in a later phase. */
const BACKDROPS = [
  ['meadow', 'linear-gradient(180deg, var(--sky-100) 0 55%, var(--mint-200) 55%)'],
  ['sunset', 'linear-gradient(180deg, var(--pink-100), var(--peach-200))'],
  ['night', 'linear-gradient(180deg, #d9d4f6, #b7b0e8)'],
  ['studio', 'linear-gradient(180deg, var(--ink-50), var(--ink-100))'],
  ['lemon', 'linear-gradient(160deg, var(--butter-100), var(--mint-100))'],
];

const tileGrid = (field, items) => `
  <div class="tile-grid" role="radiogroup" aria-label="${field}" data-group="${field}">
    ${items.map(([id, bg, label], i) => `
      <button class="tile" type="button" role="radio" data-field="${field}" data-value="${id}"
        aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" ${bg ? `style="--tile-bg:${bg}"` : ''}>${label ?? id}</button>`).join('')}
  </div>`;

export default {
  render() {
    return html`
      ${pageHeader({
        eyebrow: `${icon('camera', { size: 14 })} Photo Booth`,
        title: 'Strike a pose',
        description: 'Pick a backdrop, add stickers and snap a picture of your character.',
      })}
      <div class="booth">
        <div>
          <div class="stage booth__frame" data-scene="meadow" data-stage>
            <div class="stage__floor"></div>
            ${placeholderFigure({ label: 'Your character goes here', hint: 'Photo capture arrives in a later phase' })}
            <div class="booth__countdown" data-countdown></div>
            <div class="booth__flash" data-flash></div>
          </div>
          <div class="booth__controls">
            <button class="shutter" type="button" data-shutter aria-label="Take photo"></button>
          </div>
        </div>
        <aside class="panel">
          <div class="panel__body">
            ${tabs({ id: 'booth', label: 'Booth options', variant: 'block', items: [
              { id: 'backdrops', label: 'Backdrops', icon: 'image' },
              { id: 'stickers', label: 'Stickers', icon: 'sticker' },
              { id: 'filters', label: 'Filters', icon: 'filter' },
            ] })}
            ${tabPanel({ id: 'booth', tab: 'backdrops', active: true, content: tileGrid('booth-scene', BACKDROPS) })}
            ${tabPanel({ id: 'booth', tab: 'stickers', content: tileGrid('booth-sticker', [['none'], ['stars'], ['hearts'], ['clouds'], ['sparkles'], ['confetti']]) })}
            ${tabPanel({ id: 'booth', tab: 'filters', content: tileGrid('booth-filter', [['none', '', 'Original'], ['soft', '', 'Soft'], ['warm', '', 'Warm'], ['cool', '', 'Cool'], ['mono', '', 'Mono'], ['dream', '', 'Dream']]) })}
          </div>
        </aside>
      </div>`;
  },

  mount(root) {
    const d = disposer();
    d.add(enhance(root));
    const stage = qs('[data-stage]', root);
    const FILTERS = { none: '', soft: 'saturate(.85) brightness(1.04)', warm: 'sepia(.25) saturate(1.2)', cool: 'hue-rotate(-15deg) saturate(1.1)', mono: 'grayscale(1)', dream: 'saturate(1.3) contrast(.92) brightness(1.06)' };

    const onControl = (e) => {
      const { field, value } = e.detail;
      if (field === 'booth-scene') stage.dataset.scene = value;
      if (field === 'booth-filter') stage.style.filter = FILTERS[value] ?? '';
    };
    root.addEventListener('control:change', onControl);
    d.add(() => root.removeEventListener('control:change', onControl));

    let timer = 0;
    const shutter = qs('[data-shutter]', root);
    const countdown = qs('[data-countdown]', root);
    const flash = qs('[data-flash]', root);
    const onShutter = () => {
      if (timer) return;
      let n = 3;
      const tick = () => {
        if (n > 0) {
          countdown.innerHTML = `<span>${n}</span>`;
          n -= 1;
          timer = setTimeout(tick, 800);
        } else {
          countdown.innerHTML = '';
          flash.classList.remove('is-on');
          void flash.offsetWidth;
          flash.classList.add('is-on');
          toast('Snap! Saving photos arrives in a later phase', { icon: 'camera' });
          timer = 0;
        }
      };
      tick();
    };
    shutter.addEventListener('click', onShutter);
    d.add(() => { shutter.removeEventListener('click', onShutter); clearTimeout(timer); });
    return () => d.run();
  },
};
