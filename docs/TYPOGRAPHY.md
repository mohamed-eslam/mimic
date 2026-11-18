# MIMIC — Typography

Fonts: **Manrope** (English) · **IBM Plex Sans Arabic** (Arabic), loaded from Google Fonts in `index.html`
(weights 400 / 500 / 600 / 700 only). Font family tokens: `--font-latin`, `--font-arabic` (`css/tokens.css`).
Scale: role tokens (`--fs-*`, `--lh-*`, `--fw-*`) in `css/tokens.css`, mapped to components in `css/typography.css`.
All sizes are fluid with `clamp()` between 360px and 1440px — one scale for every page and both languages.

## Scale (measured in the browser)

| Role | Token | 360px | 768px | 1024px | 1440px | Used for |
| --- | --- | --- | --- | --- | --- | --- |
| Hero heading | `--fs-hero` | 30 | 36 | 40 | 46 | Homepage headline |
| Page heading | `--fs-h1` | 26 | 28 | 30 | 32 | Every inner page h1 |
| Section heading | `--fs-h2` | 23 | 25 | 26 | 28 | Section titles, panels |
| Dialog / step title | `--fs-title` | 19 | 20 | 21 | 22 | Character detail, wizard steps |
| Card title | `--fs-h3` | 17 | 17 | 18 | 18 | Every card |
| Small title | `--fs-h4` | 16 | 16 | 16 | 16 | Wizard labels |
| Lead | `--fs-lead` | 16 | 16 | 17 | 17 | Intros |
| Body | `--fs-body` | 15 | 15 | 16 | 16 | Running text |
| Card text | `--fs-body-sm` | 15 | 15 | 15 | 15 | Text inside cards |
| Small | `--fs-small` | 14 | 14 | 14 | 14 | Roles, descriptions, meta |
| Interface | `--fs-ui` | 14 | 14 | 14 | 14 | Navigation and ALL buttons |
| Input | `--fs-input` | 16 | 16 | 16 | 16 | Inputs (prevents iOS zoom) |
| Label | `--fs-label` | 13 | 13 | 13 | 13 | Filters, labels, eyebrows |
| Caption | `--fs-caption` | 12 | 12 | 12 | 12 | Badges, tags |

Legacy `--text-2xl / --text-3xl / --text-display` are aliases of `--fs-h2 / --fs-h1 / --fs-hero`.

## Weights

`--fw-heading`: **700** English · **600** Arabic (IBM Plex Sans Arabic reads heavier). Hero `--fw-display`: 700.
Base `h1–h4` take `--fw-heading`, so any heading outside the role list still follows the language.

## Line height

| Role | English (Manrope) | Arabic (IBM Plex Sans Arabic) |
| --- | --- | --- |
| Hero | 1.12 | 1.3 |
| Page / section heading | 1.18 / 1.22 | 1.35 / 1.4 |
| Titles / card titles | 1.3 / 1.35 | 1.45 / 1.5 |
| Lead / body | 1.6 / 1.65 | 1.75 / 1.75 |
| Buttons, inputs | 1.35 | 1.4 |

Arabic overrides live in `:root:lang(ar)` in `tokens.css`: same sizes, more line height, lighter heading weight, no letter-spacing.

## Measure

Hero lead text is capped at `--measure-lead` (38rem); headings use `text-wrap: balance`, leads `text-wrap: pretty`.

## Rhythm

`--flow-eyebrow` (12px) → heading → `--flow-heading` (16px) → text → `--flow-actions` (32px) → buttons.

## Adding new components

Use the role tokens (`font-size: var(--fs-h3); line-height: var(--lh-h3);`) — never raw pixel sizes.
If a new role is truly needed, add it to `tokens.css` (with an Arabic line-height override) and map it in `typography.css`.
