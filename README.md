# MIMIC

**Real Characters. Digital Possibilities.** MIMIC (formerly Character Lab) is Character-as-a-Service: realistic digital characters for brands and creators — ready-made, custom-designed, and integrated into websites, apps, chatbots and AI agents.

Built with HTML5, CSS3, vanilla ES modules and SVG. No frameworks, build step or backend.

## Preview

ES modules need an HTTP server (opening `index.html` as a file will not work):

- **VS Code:** right-click `index.html` → *Open with Live Server*
- **Terminal:** `python3 -m http.server 5500` → http://localhost:5500

| URL | What |
| --- | --- |
| `#/` | Homepage |
| `#/marketplace` | Character Marketplace (sample catalog, placeholders) |
| `#/brief` | Custom Character Brief (9-step wizard) |
| `#/request-integration` | Integration request wizard |
| `#/integration`, `#/packages`, `#/business`, `#/creators`, `#/custom`, `#/ai-generation`, `#/contact`, `#/solutions` | Service & audience pages |
| `#/app` | Character Studio demo (animated engine experiments) |
| `#/app/create` | Character Creator |
| `#/app/characters` | My Characters (saved in this browser) |
| `#/app/personality` | Personality Studio (interactive playground) |
| `?lang=ar#/` | Arabic / RTL preview (not yet exposed in the UI) |
| `#/design-system` | Component & token reference |

## Tests

Open `/tests/` through the same server. The suite runs in the browser and covers the engine, animation, storage, pages, layouts, i18n and RTL. It backs up and restores any saved characters it touches.

## Structure

```
index.html              App shell: site header/footer, workspace sidebar, drawer
assets/favicon.svg      Logo mark
css/
  tokens.css            Design tokens (brand colours, type, spacing, motion)
  base.css              Reset, typography, RTL helpers, .container
  components.css        Buttons, cards, tabs, inputs, sliders, dialogs…
  layout.css            Marketing + workspace layouts (logical properties)
  site.css              Marketing sections, scaffolds, dashboard
  pages.css             Workspace page layouts
  character.css         Character engine styles (self-contained)
js/
  main.js               Bootstrap: i18n → chrome → router
  config/routes.js      Route table = navigation source of truth
  core/                 router, store, dom helpers, formatting
  i18n/                 t() + locales/en.js, locales/ar.js (RTL-ready)
  engine/               Character renderer, animator, personalities, actions
  models/               Shared character configuration model
  services/             localStorage repositories (characters, activity)
  data/                 Local content (personality speech lines)
  ui/                   Components, chrome, logo, toasts, dialogs, particles, sound
  pages/site/           Marketing pages (homepage, scaffolds)
  pages/app/            Workspace pages (dashboard)
  pages/*.js            Creator, My Characters, Personality Studio, Photo Booth
tests/                  Browser test suite
```

## Going live — business configuration

`js/config/business.js` is the single place that aligns the site with real operations:

- `submission.endpoint` — URL receiving multipart POSTs (`type`, `payload` JSON, `references[]`). **Until it is set, the site runs in demo mode**: wizards and the contact form never claim a request was sent; customers can download their brief instead.
- `responseHours` — the "we'll contact you within N hours" promise, shown only after a confirmed delivery.
- `offerings` / `packages` — availability labels (`available`, `on-request`, `coming-soon`).

Requests follow the lifecycle in `js/models/request.js` (new → review → clarification → proposal → approval → production → delivery → completed); customers see a simplified status.

## Character imagery

All character visuals are labeled placeholders. Add licensed, photorealistic artwork per `assets/characters/README.md` and set `media.image` in `js/data/catalog.js`.

## Localization

All marketing and navigation copy lives in `js/i18n/locales/`. To enable Arabic in the UI, add `'ar'` to `ENABLED_LOCALES` in `js/i18n/index.js` and add a language switcher. Layout CSS uses logical properties, so `dir="rtl"` mirrors the interface.

## Brand assets

| File | Use |
| --- | --- |
| `assets/mimic.png` | Wordmark for light theme (dark letters, green period) |
| `assets/white_mimic.png` | Wordmark for dark theme and dark surfaces (footer) |

Rendered by `js/ui/brand.js` as plain `<img>` (no filters, height-only sizing). Internal storage keys keep the
`character-lab:` prefix so existing saved data keeps working.

**Still needed:** a square favicon / app icon for MIMIC, and (recommended) both wordmarks re-exported on an
identical canvas — the two PNGs currently frame the lettering differently, so the logo shifts slightly when the theme
changes. Smaller optimized exports (e.g. 2× header size, WebP) would cut ~750 KB of logo downloads.

## Themes & accessibility

Light (default) and dark themes are designed separately in `css/tokens.css`; without a saved choice the site follows
the OS preference. Accessibility rules live in `css/a11y.css`. Audit results and limitations: `docs/ACCESSIBILITY.md`.

## Missing character assets

All catalog characters still need artwork — run `CharacterLab.assetReport()` in the browser console for the exact list.
Per character (`assets/characters/<id>/`): `main.webp` plus `pose-<pose>.webp` for each declared pose and
`expression-<name>.webp` for each declared expression (see `js/data/catalog.js`).
