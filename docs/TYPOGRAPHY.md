# MIMIC — Typography

Fonts: **Manrope** (English) · **Alexandria** (Arabic), loaded from Google Fonts in `index.html`.
Scale: role tokens in `css/tokens.css` (`--fs-*`, `--lh-*`), applied to components in `css/typography.css`.
All sizes are fluid with `clamp()` between 360px and 1440px viewports — no per-breakpoint font overrides.

## Scale (measured in the browser)

| Role | Token | 360px | 768px | 1440px | Used for |
| --- | --- | --- | --- | --- | --- |
| Hero heading | `--fs-hero` | 38 (AR 36) | 52 (AR 48) | 72 (AR 68) | Homepage headline |
| Page title | `--fs-h1` | 34 (AR 32) | 42 (AR 39) | 52 (AR 48) | Inner page h1 |
| Section heading | `--fs-h2` | 27 | 33 | 44 | Section titles, final CTA |
| Title | `--fs-title` | 22 | 25 | 30 | Wizard steps, modal names, confirmations |
| Card title | `--fs-h3` | 18 | 21 | 24 | Cards, packages, character names |
| Small card title | `--fs-h4` | 17 | 19 | 20 | Offer items, steps, question labels |
| Lead | `--fs-lead` | 17 | 19 | 20 | Intros and section descriptions |
| Body | `--fs-body` | 16 | 17 | 18 | Running text |
| Card text | `--fs-body-sm` | 16 | 16 | 17 | Text inside cards |
| Interface | `--fs-ui` | 16 | 16 | 16 | Navigation, buttons, inputs (16px also prevents iOS zoom) |
| Label | `--fs-label` | 14 | 14 | 14 | Eyebrows, labels, filters, hints, small buttons |
| Caption | `--fs-caption` | 13 | 13 | 13 | Badges, tags — the minimum size anywhere |

## Line height

| Role | English (Manrope) | Arabic (Alexandria) |
| --- | --- | --- |
| Hero | 1.08 | 1.35 |
| Page title / section heading | 1.12 / 1.15 | 1.4 |
| Titles / card titles | 1.2 / 1.25 | 1.45 / 1.5 |
| Lead | 1.6 | 1.8 |
| Body | 1.65 | 1.85 |
| Buttons, inputs | 1.35 | 1.5 |

Arabic overrides live in `:root:lang(ar)` in `tokens.css`. Alexandria is wide with tall ascenders, so its display
sizes are slightly smaller and its line heights larger. Arabic display headings use weight 700 instead of 800.

## Rhythm

`--flow-eyebrow` (12px) → heading → `--flow-heading` (16px) → text → `--flow-actions` (32px) → buttons.

## Adding new components

Use the role tokens (`font-size: var(--fs-h3); line-height: var(--lh-h3);`) — never raw pixel sizes.
If a new role is truly needed, add it to `tokens.css` (with an Arabic line-height override) and map it in `typography.css`.
