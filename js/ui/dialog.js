/**
 * Confirmation dialog using the native <dialog> element (focus trap, Esc to
 * close and backdrop handled by the browser).
 *
 *   if (await confirmDialog({ title: 'Delete?', confirmLabel: 'Delete', tone: 'danger' })) …
 */
import { escapeHtml } from '../core/dom.js';
import { icon } from './icons.js';

export function confirmDialog({ title, message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'default', iconName = 'info' }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = `dialog dialog--${tone}`;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.innerHTML = `
      <form method="dialog" class="dialog__body">
        <span class="dialog__icon">${icon(iconName)}</span>
        <h2 id="dialog-title" class="dialog__title">${escapeHtml(title)}</h2>
        ${message ? `<p class="dialog__text">${escapeHtml(message)}</p>` : ''}
        <div class="dialog__actions">
          <button class="btn btn--secondary" value="cancel" data-dialog-cancel>${escapeHtml(cancelLabel)}</button>
          <button class="btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}" value="confirm" data-dialog-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);

    const opener = document.activeElement;
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'confirm');
      dialog.remove();
      if (opener?.isConnected) opener.focus(); // return focus to the trigger
    }, { once: true });
    // Click on the backdrop cancels
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close('cancel'); });

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      dialog.querySelector('[data-dialog-cancel]').focus(); // safe default for destructive actions
    } else {
      // Very old browsers: fall back to the native confirm
      dialog.remove();
      resolve(window.confirm(`${title}\n\n${message}`));
    }
  });
}
