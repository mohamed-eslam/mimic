import { emptyState, button } from '../ui/components.js';

export default {
  render() {
    return `
      <div class="container site-section not-found">
        <div>
          <h1 class="visually-hidden">Page not found</h1>
          ${emptyState({
            icon: 'info',
            title: 'This page wandered off',
            text: 'We couldn’t find what you were looking for.',
            action: button({ label: 'Back home', variant: 'primary', icon: 'home', href: '#/' }),
          })}
        </div>
      </div>`;
  },
};
