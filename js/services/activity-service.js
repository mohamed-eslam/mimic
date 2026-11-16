/**
 * Per-character interaction counters, stored locally.
 * Key `character-lab:activity` → { version: 1, characters: { [id]: { total, actions: {…}, lastPlayed } } }
 * Unsaved drafts are tracked under the id "draft" for the session only.
 */
import { createStorage } from './storage.js';

export const ACTIVITY_KEY = 'character-lab:activity';
const VERSION = 1;
const SESSION_ONLY = 'draft';

export function createActivityTracker({ key = ACTIVITY_KEY, storage = createStorage() } = {}) {
  let data = null;
  const session = { total: 0, actions: {}, lastPlayed: null };

  function load() {
    if (data) return data;
    data = { version: VERSION, characters: {} };
    try {
      const parsed = JSON.parse(storage.read(key) ?? 'null');
      if (parsed && parsed.version === VERSION && parsed.characters && typeof parsed.characters === 'object') {
        for (const [id, v] of Object.entries(parsed.characters)) {
          if (!v || typeof v !== 'object') continue;
          const actions = {};
          for (const [a, n] of Object.entries(v.actions ?? {})) if (Number.isInteger(n) && n > 0) actions[a] = n;
          data.characters[id] = {
            total: Object.values(actions).reduce((s, n) => s + n, 0),
            actions,
            lastPlayed: typeof v.lastPlayed === 'string' ? v.lastPlayed : null,
          };
        }
      }
    } catch { /* corrupt → start fresh, counters are non-critical */ }
    return data;
  }

  const entry = (id) => {
    if (id === SESSION_ONLY || !id) return session;
    const all = load().characters;
    return (all[id] ??= { total: 0, actions: {}, lastPlayed: null });
  };

  return {
    /** Count one interaction. Returns the updated summary. */
    record(id, action) {
      const e = entry(id);
      e.actions[action] = (e.actions[action] ?? 0) + 1;
      e.total += 1;
      e.lastPlayed = new Date().toISOString();
      if (e !== session) storage.write(key, JSON.stringify(load())); // failures are non-fatal
      return this.summary(id);
    },

    summary(id) {
      const e = id === SESSION_ONLY || !id ? session : load().characters[id] ?? { total: 0, actions: {}, lastPlayed: null };
      const favorite = Object.entries(e.actions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { total: e.total, actions: { ...e.actions }, favorite, lastPlayed: e.lastPlayed };
    },

    /** Drop counters of characters that no longer exist. */
    prune(existingIds) {
      const all = load().characters;
      let changed = false;
      for (const id of Object.keys(all)) if (!existingIds.includes(id)) { delete all[id]; changed = true; }
      if (changed) storage.write(key, JSON.stringify(data));
    },
  };
}

export const activity = createActivityTracker();
