/**
 * Minimal reactive app store (in-memory).
 *
 * Holds the Creator's working draft so it survives navigation between pages.
 * Persistence is handled by services/character-service.js, not here.
 */
import { createCharacterConfig } from '../models/character-config.js';

const initialState = () => ({
  /** Character currently being edited in the Creator (shared config model). */
  draft: createCharacterConfig(),
  /** { id, snapshot } of the saved character the draft is editing, or null. */
  saved: null,
});

let state = initialState();
const listeners = new Set();

export const store = {
  get: () => state,
  set(patch) {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((fn) => fn(state));
  },
  setDraft(draft) {
    this.set({ draft });
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
