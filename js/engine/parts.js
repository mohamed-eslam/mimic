/**
 * Face parts. Each part is drawn around its own origin (0,0) so the
 * character can position, scale and animate it independently.
 */

const INK = '#2b2340';
const MOUTH_IN = '#6b2a45';
const TONGUE = '#ff8fb1';

const stroke = (d, w = 4.5) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---------- Eyes ----------
   Each entry: (side: -1 left | 1 right, uid) => svg markup */
export const EYES = {
  classic: {
    label: 'Classic',
    draw: () =>
      `<ellipse rx="9.5" ry="12.5" fill="${INK}"/>` +
      `<ellipse cx="3" cy="-5" rx="3.6" ry="4" fill="#fff"/>` +
      `<circle cx="-3.2" cy="5" r="1.7" fill="#fff" opacity=".85"/>`,
  },
  sparkle: {
    label: 'Sparkle',
    draw: (side, uid) =>
      `<ellipse rx="12" ry="14.5" fill="${INK}"/>` +
      `<ellipse rx="12" ry="14.5" fill="url(#${uid}-iris)"/>` +
      `<ellipse cx="4" cy="-5.5" rx="4.6" ry="5.2" fill="#fff"/>` +
      `<circle cx="-4.2" cy="5.8" r="2.4" fill="#fff"/>` +
      `<path d="M-5 -7.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fff" opacity=".9"/>`,
  },
  happy: {
    label: 'Happy',
    draw: () => stroke('M-10 4 Q0 -9 10 4', 5),
  },
  sleepy: {
    label: 'Sleepy',
    draw: () =>
      `<path d="M-10 -1 H10 A10 10.5 0 0 1 -10 -1 Z" fill="${INK}"/>` +
      `<circle cx="3.6" cy="3.2" r="2.2" fill="#fff"/>` +
      stroke('M-12.5 -2.5 Q0 -5.5 12.5 -2.5', 3.5),
  },
  dot: {
    label: 'Dot',
    draw: () => `<circle r="6.8" fill="${INK}"/><circle cx="2.2" cy="-2.4" r="2.1" fill="#fff"/>`,
  },
};

/** Expression-only eyes (not user-selectable). */
const EXPRESSION_EYES = {
  closed: () => stroke('M-10 0 Q0 8 10 0', 4.5),
  squeeze: (side) => stroke(side < 0 ? 'M-7 -7 L6 0 L-7 7' : 'M7 -7 L-6 0 L7 7', 4.5),
  wide: () =>
    `<ellipse rx="11" ry="14" fill="${INK}"/>` +
    `<circle cx="3.5" cy="-5" r="4.6" fill="#fff"/>` +
    `<circle cx="-3.6" cy="5.6" r="2" fill="#fff"/>`,
};

/* ---------- Mouths ---------- */
export const MOUTHS = {
  smile: { label: 'Smile', draw: () => stroke('M-11 -2 Q0 10 11 -2') },
  open: {
    label: 'Open',
    draw: () =>
      `<path d="M-12 -3 Q0 0 12 -3 Q11 13 0 13.5 Q-11 13 -12 -3Z" fill="${MOUTH_IN}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M-6.5 10.6 Q0 5 6.5 10.6 Q0 13.6 -6.5 10.6Z" fill="${TONGUE}"/>`,
  },
  cat: { label: 'Cat', draw: () => stroke('M-11 -1 Q-5.5 7 0 0 Q5.5 7 11 -1') },
  surprised: {
    label: 'Surprised',
    draw: () => `<ellipse cy="3" rx="5.5" ry="6.5" fill="${MOUTH_IN}" stroke="${INK}" stroke-width="2.5"/>`,
  },
  tiny: { label: 'Tiny', draw: () => stroke('M-4.5 0 Q0 4 4.5 0', 4) },
};

const EXPRESSION_MOUTHS = {
  wobbly: () => stroke('M-10 2 Q-5 -3 0 2 Q5 7 10 2', 4),
  sleep: () => `<ellipse cy="2" rx="3.4" ry="2.8" fill="${MOUTH_IN}"/>`,
};

/**
 * Expressions temporarily override the configured eyes/mouth.
 * Used by the animator (poke, sleep…) without touching the user's choices.
 */
export const EXPRESSIONS = {
  happy: { eyes: 'happy', mouth: 'open' },
  poked: { eyes: 'squeeze', mouth: 'wobbly' },
  grabbed: { eyes: 'wide', mouth: 'surprised' },
  surprised: { eyes: 'wide', mouth: 'surprised' },
  sleep: { eyes: 'closed', mouth: 'sleep' },
  // personality expressions (partial overrides keep the user's other choices)
  cheerful: { mouth: 'open' },
  excited: { eyes: 'sparkle', mouth: 'open' },
  bashful: { eyes: 'happy', mouth: 'tiny' },
  drowsy: { eyes: 'sleepy', mouth: 'tiny' },
  yawn: { eyes: 'closed', mouth: 'surprised' },
};

/* ---------- Accessories ----------
   slot 'head' → drawn on the body, origin at the top-center of the head
   slot 'side' → origin at the top-right "shoulder" of the head
   slot 'face' → drawn in the face layer, origin at the eye line center
   draw(opts) gets { uid, eyeX, eyeSize } so face accessories line up with the eyes. */
const shade = (d, uid) => `<path d="${d}" fill="url(#${uid}-acc-shade)"/>`;

export const ACCESSORIES = {
  none: { label: 'None', slot: null, draw: () => '' },
  partyHat: {
    label: 'Party Hat',
    slot: 'head',
    anchorY: 0.05,
    draw: ({ uid }) => {
      const cone = 'M-24 6 L-1 -60 Q1 -63 3 -60 L24 6 Q0 14 -24 6Z';
      return (
        `<g transform="rotate(-10)">` +
        `<path d="${cone}" fill="#a2ccff"/>` +
        `<clipPath id="${uid}-cone"><path d="${cone}"/></clipPath>` +
        `<g clip-path="url(#${uid}-cone)" fill="#fff6d4">` +
        `<circle cx="-8" cy="-6" r="4.5"/><circle cx="9" cy="-18" r="4"/><circle cx="-2" cy="-34" r="3.5"/><circle cx="4" cy="-48" r="2.6"/><circle cx="13" cy="0" r="3.5"/>` +
        `</g>` +
        shade(cone, uid) +
        `<path d="M-24 6 Q0 14 24 6" fill="none" stroke="#ffb0d1" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="1" cy="-62" r="8" fill="#ffb0d1"/><circle cx="-1.5" cy="-64.5" r="2.6" fill="#fff" opacity=".7"/>` +
        `</g>`
      );
    },
  },
  beanie: {
    label: 'Beanie',
    slot: 'head',
    anchorY: 0.17,
    draw: ({ uid }) => {
      const dome = 'M-62 10 Q-64 -34 0 -38 Q64 -34 62 10 Z';
      return (
        `<path d="${dome}" fill="#ff9670"/>` +
        `<path d="M-30 -30 Q-33 -12 -31 6 M0 -38 V6 M30 -30 Q33 -12 31 6" fill="none" stroke="#d8603b" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>` +
        shade(dome, uid) +
        `<rect x="-66" y="0" width="132" height="18" rx="9" fill="#ffbf9f"/>` +
        `<path d="M-56 9 H56" stroke="#ff9670" stroke-opacity=".4" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>` +
        `<circle cx="0" cy="-42" r="11" fill="#fff6d4"/><circle cx="-3" cy="-45" r="3.5" fill="#fff"/>`
      );
    },
  },
  bow: {
    label: 'Bow',
    slot: 'side',
    draw: ({ uid }) => {
      const loops = 'M0 0 C-10 -16 -32 -14 -30 2 C-28 16 -10 12 0 0Z M0 0 C10 -16 32 -14 30 2 C28 16 10 12 0 0Z';
      return (
        `<g transform="rotate(16)">` +
        `<path d="M-4 4 L-12 22 L-4 18 L0 24 L2 6Z M4 4 L12 22 L4 18 L0 24 L-2 6Z" fill="#f2709f"/>` +
        `<path d="${loops}" fill="#ff8fb1"/>` +
        shade(loops, uid) +
        `<path d="M-6 -2 C-12 -8 -20 -8 -22 -2 M6 -2 C12 -8 20 -8 22 -2" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/>` +
        `<rect x="-7" y="-7" width="14" height="14" rx="5" fill="#f2709f"/>` +
        `</g>`
      );
    },
  },
  glasses: {
    label: 'Glasses',
    slot: 'face',
    draw: ({ eyeX, eyeSize }) => {
      const rr = 14 + 4 * eyeSize;
      const lens = (x) =>
        `<circle cx="${x}" r="${rr}" fill="#fff" fill-opacity=".22" stroke="${INK}" stroke-width="3.5"/>` +
        `<path d="M${x - rr * 0.55} ${-rr * 0.35} Q${x - rr * 0.3} ${-rr * 0.7} ${x} ${-rr * 0.72}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`;
      return (
        lens(-eyeX) + lens(eyeX) +
        `<path d="M${-eyeX + rr} -2 Q0 -9 ${eyeX - rr} -2" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`
      );
    },
  },
  shades: {
    label: 'Shades',
    slot: 'face',
    draw: ({ eyeX, eyeSize }) => {
      const w = 17 + 4 * eyeSize;
      const h = 12 + 3 * eyeSize;
      const lens = (x) =>
        `<path d="M${x - w} ${-h * 0.8} Q${x} ${-h * 1.1} ${x + w} ${-h * 0.8} Q${x + w * 0.9} ${h * 1.1} ${x} ${h} Q${x - w * 0.9} ${h * 1.1} ${x - w} ${-h * 0.8}Z" fill="${INK}"/>` +
        `<path d="M${x - w * 0.55} ${-h * 0.35} L${x - w * 0.15} ${-h * 0.62}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      return (
        lens(-eyeX) + lens(eyeX) +
        `<path d="M${-eyeX + w * 0.9} ${-h * 0.6} Q0 ${-h * 1.05} ${eyeX - w * 0.9} ${-h * 0.6}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
      );
    },
  },
};

export const ACCESSORY_NAMES = Object.keys(ACCESSORIES);

export function drawAccessory(name, opts) {
  return (ACCESSORIES[name] ?? ACCESSORIES.none).draw(opts);
}

export function drawEye(style, side, uid) {
  if (EXPRESSION_EYES[style]) return EXPRESSION_EYES[style](side, uid);
  return (EYES[style] ?? EYES.classic).draw(side, uid);
}

export function drawMouth(style, uid) {
  if (EXPRESSION_MOUTHS[style]) return EXPRESSION_MOUTHS[style](uid);
  return (MOUTHS[style] ?? MOUTHS.smile).draw(uid);
}

export const EYE_NAMES = Object.keys(EYES);
export const MOUTH_NAMES = Object.keys(MOUTHS);
