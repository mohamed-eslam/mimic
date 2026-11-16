# MIMIC — Typography

Fonts: **Manrope** (English) · **Alexandria** (Arabic), loaded from Google Fonts in `index.html`.
Scale: role tokens in `css/tokens.css` (`--fs-*`, `--lh-*`), applied to components in `css/typography.css`.
All sizes are fluid with `clamp()` between 360px and 1440px viewports — no per-breakpoint font overrides.

## Scale (measured in the browser)

| Role | Token | 360px | 768px | 1440px | Used for |
| --- | --- | --- | --- | --- | --- |
| Hero heading | `--fs-hero` | 32 | 38 | 48 | Homepage headline (max width `--measure-hero`: 18ch EN / 22ch AR) |
| Page title | `--fs-h1` | 28 | 33 | 40 | Inner page h1 |
| Section heading | `--fs-h2` | 24 | 27 | 32 | Section titles, final CTA |
| Title | `--fs-title` | 20 | 22 | 24 | Wizard steps, modal names, confirmations |
| Card title | `--fs-h3` | 18 | 19 | 20 | Cards, packages, offer items, process steps |
| Small title | `--fs-h4` | 16 | 16 | 17 | Wizard labels, review sections |
| Lead | `--fs-lead` | 16 | 17 | 18 | Intros and section descriptions |
| Body | `--fs-body` | 15 | 15 | 16 | Running text |
| Card text | `--fs-body-sm` | 15 | 15 | 15 | Text inside cards |
| Interface | `--fs-ui` | 14 | 14 | 14 | Navigation, buttons, text links |
| Large button | `--fs-ui-lg` | 15 | 15 | 15 | Section-level CTAs (`.btn--lg`) |
| Input | `--fs-input` | 16 | 16 | 16 | Inputs, selects, textareas (16px prevents iOS zoom) |
| Label | `--fs-label` | 14 | 14 | 14 | Eyebrows, labels, filters, hints, small buttons |
| Caption | `--fs-caption` | 13 | 13 | 13 | Badges, tags — the minimum size anywhere |

Arabic uses the same sizes as English; only line heights differ.

## Line height

| Role | English (Manrope) | Arabic (Alexandria) |
| --- | --- | --- |
| Hero | 1.15 | 1.45 |
| Page title / section heading | 1.18 / 1.22 | 1.45 / 1.5 |
| Titles / card titles | 1.3 / 1.35 | 1.55 |
| Lead | 1.6 | 1.8 |
| Body | 1.65 | 1.85 |
| Buttons, inputs | 1.35 | 1.5 |

## Actions

| Level | Class | Look | Use |
| --- | --- | --- | --- |
| Primary | `.btn--primary` | Filled brand green | One main action per area |
| Secondary | `.btn--secondary` | Outlined, neutral ink | Alternative action |
| Tertiary | `.btn--tertiary` / `.link-arrow` | Green text link, underlined | Low-emphasis action (e.g. talk to the team) |

Buttons use 14px text (15px for `.btn--lg`). Heights: 48px (`--control-h-lg`, section-level CTAs) · 44px (default, in-card) · 36px (small).
Primary carries quiet depth (top highlight + soft green shadow); secondary stays flat and outlined.
Hover: primary darkens; secondary gets a muted fill and stronger border; tertiary gets a soft tint and a thicker underline.
Focus: the shared 3px `:focus-visible` outline (light green on dark bands).

Arabic overrides live in `:root:lang(ar)` in `tokens.css`. Alexandria is wide with tall ascenders, so its display
sizes are slightly smaller and its line heights larger. Arabic display headings use weight 700 instead of 800.

## Measure

Hero lead text is capped at `--measure-lead` (38rem); headings use `text-wrap: balance`, leads `text-wrap: pretty`.

## Rhythm

`--flow-eyebrow` (12px) → heading → `--flow-heading` (16px) → text → `--flow-actions` (32px) → buttons.

## Adding new components

Use the role tokens (`font-size: var(--fs-h3); line-height: var(--lh-h3);`) — never raw pixel sizes.
If a new role is truly needed, add it to `tokens.css` (with an Arabic line-height override) and map it in `typography.css`.
