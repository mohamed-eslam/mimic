/** Toast notifications. toast('Saved!', { icon: 'check', duration: 2600 }) */
import { icon } from './icons.js';
import { escapeHtml } from '../core/dom.js';

let region;

function getRegion() {
  if (!region || !document.body.contains(region)) {
    region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
  }
  return region;
}

export function toast(message, { icon: ic = 'sparkle', duration = 2600 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast__icon">${icon(ic)}</span><span>${escapeHtml(message)}</span>`;
  const host = getRegion();
  host.appendChild(el);
  while (host.children.length > 3) host.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, duration);
  return el;
}
