# MIMIC — Accessibility audit (WCAG 2.2 AA target)

Status: **targeting** WCAG 2.2 AA. This is not a compliance claim — see *Limitations*.
Audit date: 2026-11-15. Scope: public website (12 pages), English + Arabic, light + dark.

## Automated results (executed)

| Check | Tool / method | Result |
| --- | --- | --- |
| Rule-based scan — website | axe-core 4.10.2, tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` | **96 runs** (12 pages × EN/AR × light/dark × 1280px & 390px): **0 violations** |
| Rule-based scan — studio workspace | same | **72 runs** (9 `#/app/*` pages × EN/AR × light/dark × 1280px & 390px): **0 violations** (1 dark-mode empty-state contrast failure found and fixed) |
| Contrast of token pairs | Script (WCAG luminance formula) | 28/28 key pairs pass in both themes (text ≥ 4.5:1, controls/focus ≥ 3:1) |
| Focus visible / not obscured | Scripted Tab ×45 on 4 pages × 2 combos | Every focused element shows a ring; 1 intermittent "obscured" flag on `/brief` that could not be reproduced (20/20 targeted probes clean) — treated as a probe timing artifact, **not verified either way** |
| Reflow (1.4.10) | 320 CSS px (= 400% zoom) | No horizontal scroll on 24/24 page × language checks |
| Text spacing (1.4.12) | WCAG bookmarklet values injected | No overflow / clipping on 10/10 checks (after fix) |
| Behaviour | Browser test suite (`/tests/`) | 385/385 passing, incl. theme, language, labels, aria-invalid, dialogs |

axe "needs review" items (manually checked): select with SVG chevron background, empty textarea,
active nav link with inset underline — actual contrast 5.6:1 (light) / 7.7:1 (dark).

## Findings fixed in this pass

1. **Non-text contrast (1.4.11)** — proposed border colors (#D4DDD7 / #45564B) were 1.3:1 and 2.0–2.3:1.
   Split into decorative `--color-border` and control `--color-border-control` (3.4–4.3:1).
2. **Contrast (1.4.3)** — dark-mode link on the dark integration band was 3.31:1 → fixed light green (10:1+).
3. **Gradient backgrounds** made contrast unverifiable → replaced with solid surfaces.
4. **Focus visible (2.4.7)** — box-shadow rings replaced with a 3px outline (works in forced-colors mode).
5. **Focus not obscured (2.4.11)** — `scroll-padding` for the sticky header.
6. **Use of color (1.4.1)** — selected chips/options now also show a check mark; current nav item has an underline/bar.
7. **Error identification (3.3.1)** — field-level messages linked via `aria-describedby`, `aria-invalid`, icon + border, focus moved to the first invalid field; translated.
8. **Text spacing (1.4.12)** — header could not wrap → actions overflowed by 92px; fixed.
9. **Target size (2.5.8)** — small controls (color remove, progress steps) raised to ≥24px.
10. **Dialogs** — focus returns to the opener on close; native `<dialog>` traps focus; Escape closes.
11. **Language** — `lang`/`dir` set before first paint; language switch has `lang` attribute and full accessible name; focus restored after switching.
12. **Reduced motion** — floating imagery, scroll reveal, hover lifts and theme transitions disabled.
13. **Studio dark mode** — translucent-white "glass" (name plates, scene labels, sound button) and the empty-state
    panel put light text on light backgrounds in dark mode. axe could not see most of these (gradient backgrounds);
    found by visual review, fixed with designed dark variants.

## Remaining issues & limitations (not yet done)

- **No screen-reader testing executed** (VoiceOver, NVDA, TalkBack). Required before any compliance statement.
- **No real-device testing**; zoom was tested via viewport emulation, not browser zoom on devices.
- **Workspace "Character Studio" demo** (`#/app/*`): now scanned and contrast-fixed, but its page copy and the
  playground speech lines are still **English-only** (pending the decision whether to keep the studio).
- axe checks the **initial state** of each page; interactive states (open dialogs, wizard errors, playground actions)
  were covered by the functional test suite and visual review, not by a full axe pass per state.
- **Logo green period** is a bright green (part of the supplied artwork); logotypes are exempt from 1.4.3, but it does not match `--brand-green`.
- **Character images** are placeholders; alt text for real artwork must be reviewed when published.
- **Arabic copy** has not been reviewed by a native professional editor.

## Manual verification checklist (to run before launch)

- [ ] Keyboard only: complete the brief and integration wizards; open/close marketplace dialog; language + theme switches.
- [ ] Screen readers: VoiceOver (macOS/iOS), NVDA (Windows), TalkBack (Android) — EN and AR.
- [ ] Browser zoom 200% and 400% (Chrome, Safari, Firefox).
- [ ] Windows High Contrast / forced colors.
- [ ] Mobile reflow on a real phone, both orientations.
- [ ] Form errors announced and understandable in both languages.
- [ ] Focus order matches visual order in RTL.
