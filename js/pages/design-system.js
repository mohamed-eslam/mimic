import { html } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { button, pageHeader, tabs, slider, swatches, switchControl, emptyState } from '../ui/components.js';
import { enhance } from '../ui/behaviors.js';
import { BODY_COLORS } from '../models/character-config.js';

const COLORS = [
  ['Ink', '--ink-900'], ['Cream', '--cream-50'], ['Lavender', '--lavender-300'], ['Accent', '--lavender-600'],
  ['Peach', '--peach-300'], ['Mint', '--mint-300'], ['Sky', '--sky-300'], ['Butter', '--butter-300'], ['Pink', '--pink-300'],
];

export default {
  render() {
    return html`
      ${pageHeader({ eyebrow: 'Foundations', title: 'Design System', description: 'Tokens and components shared across MIMIC. Everything lives in css/tokens.css and js/ui/.' })}
      <div class="ds-grid">
        <section class="card">
          <h2 class="card__title">Color</h2>
          <div class="ds-colors">
            ${COLORS.map(([n, v]) => `<div class="ds-color"><span class="ds-color__chip" style="--c:var(${v})"></span><strong>${n}</strong><code>${v}</code></div>`)}
          </div>
        </section>
        <section class="card">
          <h2 class="card__title">Typography</h2>
          <p class="display" style="font-size:var(--text-3xl)">Fredoka display</p>
          <h3>Heading — Fredoka 600</h3>
          <p>Body — Plus Jakarta Sans. Friendly, legible and modern at every size.</p>
          <span class="eyebrow">Eyebrow label</span>
        </section>
        <section class="card">
          <h2 class="card__title">Buttons</h2>
          <div class="cluster">
            ${button({ label: 'Primary', variant: 'primary', icon: 'plus' })}
            ${button({ label: 'Accent', variant: 'accent' })}
            ${button({ label: 'Secondary' })}
            ${button({ label: 'Soft', variant: 'soft' })}
            ${button({ label: 'Ghost', variant: 'ghost' })}
            ${button({ label: 'Small', size: 'sm' })}
            ${button({ label: 'Shuffle', icon: 'shuffle', iconOnly: true })}
          </div>
        </section>
        <section class="card">
          <h2 class="card__title">Tabs, chips &amp; badges</h2>
          ${tabs({ id: 'ds-tabs', items: [{ id: 'a', label: 'Body' }, { id: 'b', label: 'Face' }, { id: 'c', label: 'Extras' }] })}
          <div class="cluster">
            <button class="chip" aria-pressed="true">${icon('star')} Selected</button>
            <button class="chip" aria-pressed="false">Chip</button>
            <span class="badge">Badge</span><span class="badge badge--mint">Mint</span><span class="badge badge--peach">Peach</span>
          </div>
        </section>
        <section class="card">
          <h2 class="card__title">Inputs</h2>
          <div class="field"><label class="label" for="ds-in">Text input</label><input id="ds-in" class="input" placeholder="Type something…"></div>
          <div class="input-group">${icon('search')}<input class="input input--pill" placeholder="Search" aria-label="Search"></div>
          ${slider({ field: 'ds-slider', label: 'Slider', min: 0, max: 1, value: 0.6 })}
          ${switchControl({ field: 'ds-switch', label: 'Switch', checked: true })}
          ${swatches({ field: 'ds-color', label: 'Swatches', colors: BODY_COLORS.slice(0, 6), value: BODY_COLORS[0].value })}
        </section>
        <section class="card">
          <h2 class="card__title">Empty state</h2>
          ${emptyState({ title: 'Nothing here yet', text: 'Empty states guide people to the next step.' })}
        </section>
      </div>`;
  },
  mount(root) {
    return enhance(root);
  },
};
