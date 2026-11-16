/**
 * Character engine — public entry point.
 * Has no dependency on app pages, router or UI components.
 */
export { Character, DEFAULT_CHARACTER, RANGES, SIZE_RANGE, NEUTRAL_POSE, partPreview, accessoryPreview } from './character.js';
export { CharacterAnimator } from './animator.js';
export { derivePalette, isValidColor } from './color.js';
export { SHAPES, SHAPE_NAMES } from './geometry.js';
export { EYES, MOUTHS, EXPRESSIONS, ACCESSORIES, EYE_NAMES, MOUTH_NAMES, ACCESSORY_NAMES } from './parts.js';
export { PERSONALITIES, PERSONALITY_NAMES, DEFAULT_PERSONALITY, getPersonality } from './personalities.js';
export { ACTIONS, ACTION_NAMES } from './actions.js';
export { Spring } from './spring.js';
export { addTick } from './ticker.js';
