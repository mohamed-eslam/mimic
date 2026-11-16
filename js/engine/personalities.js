/**
 * Personalities — pure configuration consumed by the ONE CharacterAnimator.
 *
 * `motion` holds numeric traits. When the personality changes, the animator
 * blends every numeric trait toward the new values over ~0.6s, so switching
 * never pops. `behavior` holds discrete choices (expressions, timing ranges)
 * that apply from the next scheduled event onward.
 *
 * To add a personality: add an entry here. No engine code changes needed.
 */

/** Numeric traits (all blendable). */
const BASE_MOTION = {
  breathRate: 0.28,     // Hz
  breathDepth: 0.02,    // fraction of body height
  floatRate: 0.18,      // Hz
  floatHeight: 5,       // view units
  wobble: 0.014,        // organic outline jelly
  swayAmount: 1,        // degrees of idle rocking
  swayRate: 0.2,        // Hz
  gazeRange: 1,         // how far eyes travel (×)
  gazeSpeed: 1,         // eye spring stiffness (×)
  tiltBias: 0,          // degrees of body lean toward where it is looking
  headTilt: 0,          // degrees of occasional curious head tilts
  blinkMs: 150,         // single blink duration
  reaction: 1,          // poke / hop strength (×)
  springiness: 1,       // body spring stiffness (×) → faster/slower reactions
  bounce: 0,            // idle hop strength (0 = never)
  sleepScale: 1,        // × sleepAfter
};

const BASE_BEHAVIOR = {
  blinkEvery: [2200, 6000],
  doubleBlink: 0.2,
  glanceEvery: [3500, 8000],
  bounceEvery: [2500, 4500],
  headTiltEvery: [3500, 7000],
  idleExpression: null,        // expression shown now and then while idle
  idleExpressionEvery: [4000, 8000],
  idleExpressionMs: 1200,
  lookAway: false,             // look away during idle expressions
  avoidGaze: false,            // looks away when the pointer gets close
  poke: [['poked', 380], ['happy', 850]],
  release: [['surprised', 260], ['happy', 900]],
  drag: 'grabbed',
  wake: [['surprised', 650], ['happy', 700]],
  signature: 'happy',          // shown when this personality is selected
  actions: {},                 // per-action face overrides (see actions.js)
};

const define = (id, def) => ({
  id,
  label: def.label,
  emoji: def.emoji,
  description: def.description,
  motion: { ...BASE_MOTION, ...def.motion },
  behavior: { ...BASE_BEHAVIOR, ...def.behavior },
});

export const PERSONALITIES = {
  happy: define('happy', {
    label: 'Happy',
    emoji: '😊',
    description: 'Smiles a lot, bounces gently and gets excited when you play.',
    motion: { breathRate: 0.3, floatRate: 0.22, floatHeight: 6, wobble: 0.016, swayAmount: 1.6, swayRate: 0.25, reaction: 1.15, bounce: 0.75 },
    behavior: {
      bounceEvery: [2600, 4600],
      idleExpression: 'cheerful',
      idleExpressionEvery: [2500, 5500],
      idleExpressionMs: 1600,
      doubleBlink: 0.25,
      poke: [['poked', 240], ['excited', 1100]],
      release: [['excited', 1100]],
      drag: 'excited',
      signature: 'excited',
      actions: { tickle: 'excited', jump: 'excited', spin: 'excited', dance: 'excited' },
    },
  }),

  shy: define('shy', {
    label: 'Shy',
    emoji: '🙈',
    description: 'Moves softly, peeks at you, then looks away when you get close.',
    motion: { breathRate: 0.24, breathDepth: 0.014, floatRate: 0.13, floatHeight: 2.2, wobble: 0.008, swayAmount: 0.6, gazeRange: 0.45, gazeSpeed: 0.6, reaction: 0.6, springiness: 0.85 },
    behavior: {
      doubleBlink: 0.35,
      idleExpression: 'bashful',
      idleExpressionEvery: [3500, 7000],
      idleExpressionMs: 1900,
      lookAway: true,
      avoidGaze: true,
      poke: [['poked', 300], ['bashful', 1600]],
      release: [['bashful', 1400]],
      drag: 'surprised',
      wake: [['surprised', 500], ['bashful', 1200]],
      signature: 'bashful',
      actions: { tickle: 'bashful', jump: 'surprised', spin: 'poked', dance: 'bashful' },
    },
  }),

  sleepy: define('sleepy', {
    label: 'Sleepy',
    emoji: '😴',
    description: 'Breathes slowly, blinks heavily and dozes off quickly.',
    motion: { breathRate: 0.14, breathDepth: 0.04, floatRate: 0.08, floatHeight: 1.5, wobble: 0.01, swayAmount: 0.9, swayRate: 0.1, gazeRange: 0.6, gazeSpeed: 0.45, blinkMs: 300, reaction: 0.7, springiness: 0.7, sleepScale: 0.5 },
    behavior: {
      blinkEvery: [1100, 2600],
      doubleBlink: 0.45,
      glanceEvery: [6000, 11000],
      idleExpression: 'drowsy',
      idleExpressionEvery: [2000, 4500],
      idleExpressionMs: 2800,
      poke: [['surprised', 420], ['drowsy', 1500]],
      release: [['yawn', 900], ['drowsy', 1200]],
      drag: 'surprised',
      wake: [['yawn', 1100], ['drowsy', 1400]],
      signature: 'yawn',
      actions: { tickle: 'cheerful', jump: 'yawn', spin: 'poked', dance: 'drowsy' },
    },
  }),

  energetic: define('energetic', {
    label: 'Energetic',
    emoji: '⚡',
    description: 'Never sits still: big bounces, fast reactions, lots of wiggle.',
    motion: { breathRate: 0.45, breathDepth: 0.028, floatRate: 0.4, floatHeight: 7, wobble: 0.024, swayAmount: 3, swayRate: 0.6, gazeRange: 1.15, gazeSpeed: 1.8, blinkMs: 110, reaction: 1.5, springiness: 1.35, bounce: 1.25, sleepScale: 1.5 },
    behavior: {
      blinkEvery: [2500, 6000],
      doubleBlink: 0.1,
      glanceEvery: [1500, 3200],
      bounceEvery: [1200, 2400],
      idleExpression: 'excited',
      idleExpressionEvery: [2200, 4500],
      idleExpressionMs: 1000,
      poke: [['poked', 160], ['excited', 900]],
      release: [['excited', 900]],
      drag: 'excited',
      signature: 'excited',
      actions: { tickle: 'excited', jump: 'excited', spin: 'excited', dance: 'excited' },
    },
  }),

  curious: define('curious', {
    label: 'Curious',
    emoji: '🔍',
    description: 'Follows everything with its eyes, tilts its head and is easily amazed.',
    motion: { gazeRange: 1.2, gazeSpeed: 1.5, tiltBias: 7, headTilt: 9, reaction: 1, springiness: 1.1, swayAmount: 0.8 },
    behavior: {
      glanceEvery: [1500, 3500],
      headTiltEvery: [2500, 5000],
      idleExpression: 'surprised',
      idleExpressionEvery: [4500, 8500],
      idleExpressionMs: 700,
      poke: [['surprised', 520], ['happy', 800]],
      release: [['surprised', 400], ['happy', 700]],
      drag: 'surprised',
      signature: 'surprised',
      actions: { tickle: 'happy', jump: 'surprised', spin: 'surprised', dance: 'happy' },
    },
  }),
};

export const PERSONALITY_NAMES = Object.keys(PERSONALITIES);
export const DEFAULT_PERSONALITY = 'happy';
export const getPersonality = (id) => PERSONALITIES[id] ?? PERSONALITIES[DEFAULT_PERSONALITY];
