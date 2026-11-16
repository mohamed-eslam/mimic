/**
 * Character repository — saved characters in localStorage (MVP).
 *
 * Storage format (key `character-lab:characters`):
 *   { version: 1, characters: [ <record>, … ] }   // record shape: models/character-config.js → toRecord()
 *
 * Safety
 * - Every record is validated on load (fromRecord); unusable ones are skipped
 *   and counted, bad fields are repaired with defaults.
 * - Unreadable JSON is backed up under `<key>:backup-<timestamp>` before
 *   starting fresh — user data is never silently destroyed.
 * - Data written by a NEWER app version is opened read-only (never overwritten).
 * - Writes are transactional: if localStorage rejects a write (quota, private
 *   mode) the in-memory state is rolled back and a StorageError is thrown.
 * - When localStorage is unavailable, an in-memory fallback is used and
 *   status().persistent is false so the UI can warn the user.
 *
 * All methods are async so a remote backend can replace this later.
 */
import { createStorage } from './storage.js';
import { sanitizeConfig, sanitizeField, toRecord, fromRecord, displayName, NAME_MAX } from '../models/character-config.js';

export const STORAGE_KEY = 'character-lab:characters';
export const STORAGE_VERSION = 1;

/** Upgrades older payloads step by step: MIGRATIONS[n] turns version n into n+1. */
const MIGRATIONS = {
  // v0: a bare array of records, before the versioned envelope existed
  0: (data) => ({ version: 1, characters: Array.isArray(data) ? data : [] }),
};

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `char_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/** Strictly increasing ISO timestamps, so ordering is stable even within one millisecond. */
let lastStamp = 0;
const stamp = () => {
  lastStamp = Math.max(Date.now(), lastStamp + 1);
  return new Date(lastStamp).toISOString();
};

export function createCharacterRepository({ key = STORAGE_KEY, storage = createStorage() } = {}) {
  /** @type {Map<string, {config, createdAt, updatedAt}> | null} */
  let cache = null;
  const status = { persistent: storage.persistent, readOnly: false, dropped: 0, recovered: false, message: null };

  function backupRaw(raw, reason) {
    storage.write(`${key}:backup-${Date.now()}`, raw);
    status.recovered = true;
    status.message = reason;
  }

  function load() {
    if (cache) return cache;
    cache = new Map();
    status.dropped = 0;
    const raw = storage.read(key);
    if (raw == null) return cache;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      backupRaw(raw, 'Saved characters could not be read. A backup was kept and a fresh collection started.');
      return cache;
    }

    let version = Array.isArray(data) ? 0 : Number(data?.version);
    if (!Number.isInteger(version) || version < 0) {
      backupRaw(raw, 'Saved characters were in an unknown format. A backup was kept and a fresh collection started.');
      return cache;
    }
    if (version > STORAGE_VERSION) {
      status.readOnly = true;
      status.message = 'These characters were saved by a newer version of MIMIC. They are shown read-only.';
    }
    while (version < STORAGE_VERSION && MIGRATIONS[version]) {
      data = MIGRATIONS[version](data);
      version = data.version;
    }

    const list = Array.isArray(data?.characters) ? data.characters : [];
    for (const rec of list) {
      const entry = fromRecord(rec);
      if (!entry || cache.has(entry.config.id)) { status.dropped++; continue; }
      cache.set(entry.config.id, entry);
    }
    if (status.dropped) console.warn(`[characters] skipped ${status.dropped} invalid saved character(s)`);
    return cache;
  }

  function persist() {
    if (status.readOnly) throw new StorageError(status.message);
    const payload = { version: STORAGE_VERSION, characters: [...cache.values()].map((e) => toRecord(e.config, e)) };
    const res = storage.write(key, JSON.stringify(payload));
    if (!res.ok) throw new StorageError(`${res.error}. Your character was not saved.`);
  }

  /** Apply a change and persist it; roll back the in-memory state if the write fails. */
  function mutate(fn) {
    load();
    const snapshot = new Map(cache);
    try {
      const result = fn();
      persist();
      return result;
    } catch (err) {
      cache = snapshot;
      throw err;
    }
  }

  const toSaved = (e) => ({ ...structuredClone(e.config), createdAt: e.createdAt, updatedAt: e.updatedAt });
  const uniqueId = () => { let id; do id = makeId(); while (cache.has(id)); return id; };
  const requireEntry = (id) => {
    const e = load().get(id);
    if (!e) throw new StorageError('That character no longer exists.');
    return e;
  };

  return {
    key,
    status: () => { load(); return { ...status }; },

    /** Forget the cache (e.g. another tab changed storage). */
    reload() { cache = null; },

    async list() {
      return [...load().values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toSaved);
    },

    async get(id) {
      const e = load().get(id);
      return e ? toSaved(e) : null;
    },

    async count() {
      return load().size;
    },

    /**
     * Save a character. With an id that exists → update it (explicit edit + save);
     * otherwise → create a new character with a fresh id.
     */
    async save(config) {
      return mutate(() => {
        const clean = sanitizeConfig(config);
        const existing = clean.id ? cache.get(clean.id) : null;
        const now = stamp();
        const entry = existing
          ? { config: clean, createdAt: existing.createdAt, updatedAt: now }
          : { config: { ...clean, id: uniqueId() }, createdAt: now, updatedAt: now };
        cache.set(entry.config.id, entry);
        return toSaved(entry);
      });
    },

    async duplicate(id) {
      return mutate(() => {
        const src = requireEntry(id);
        const now = stamp();
        const name = `${displayName(src.config)} copy`.slice(0, NAME_MAX);
        const entry = { config: { ...structuredClone(src.config), id: uniqueId(), name }, createdAt: now, updatedAt: now };
        cache.set(entry.config.id, entry);
        return toSaved(entry);
      });
    },

    async rename(id, name) {
      return mutate(() => {
        const src = requireEntry(id);
        const clean = sanitizeField('name', name).trim();
        if (!clean) throw new StorageError('Name can’t be empty.');
        if (clean === src.config.name) return toSaved(src);
        const entry = { ...src, config: { ...src.config, name: clean }, updatedAt: stamp() };
        cache.set(id, entry);
        return toSaved(entry);
      });
    },

    async remove(id) {
      return mutate(() => {
        requireEntry(id);
        cache.delete(id);
        return true;
      });
    },
  };
}

/** App-wide repository instance. */
export const characters = createCharacterRepository();

/** Save callback used by the Creator. */
export const saveCharacter = (config) => characters.save(config);

/** Notify when another tab changes saved characters. Returns an unsubscribe fn. */
export function onExternalChange(fn) {
  const handler = (e) => {
    if (e.key === characters.key || e.key === null) {
      characters.reload();
      fn();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
