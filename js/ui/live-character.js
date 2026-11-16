/**
 * Glue between the shared character config model and the engine:
 * creates an animated Character from a config and applies field edits.
 * Pages use this so they never reach into engine internals.
 */
import { Character, CharacterAnimator } from '../engine/index.js';
import { toEngineOptions, toAnimatorOptions, isEngineField, displayName } from '../models/character-config.js';

export function createLiveCharacter(host, config, animatorOptions = {}) {
  const character = new Character(host, { ...toEngineOptions(config), label: displayName(config) });
  const animator = new CharacterAnimator(character, { ...toAnimatorOptions(config), ...animatorOptions });

  const setLabel = (cfg) => {
    character.label = displayName(cfg);
    character.el.setAttribute('aria-label', `${character.label}. Poke or drag me!`);
  };

  return {
    character,
    animator,

    /** Apply one edited field. `config` is the full, updated config. */
    apply(field, config) {
      if (field === 'width' || field === 'height') character.setProportions({ width: config.width, height: config.height });
      else if (isEngineField(field)) character.update({ [field]: config[field] });
      else if (field === 'personality') animator.setPersonality(config.personality);
      else if (field === 'name') setLabel(config);
    },

    /** Apply a whole config (reset / randomize / load). */
    applyAll(config, { react = true } = {}) {
      character.update(toEngineOptions(config));
      animator.setPersonality(config.personality, { react });
      setLabel(config);
    },

    destroy() {
      animator.destroy();
      character.destroy();
    },
  };
}
