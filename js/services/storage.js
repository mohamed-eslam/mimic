/**
 * Safe key/value storage over localStorage.
 *
 * - Detects when localStorage is unavailable (private mode, disabled
 *   cookies, sandboxed iframes) and falls back to in-memory storage so the
 *   app keeps working for the session.
 * - Never throws on read; write() reports failures (e.g. quota exceeded).
 */
function probe(store) {
  try {
    const k = '__character_lab_probe__';
    store.setItem(k, '1');
    store.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

/**
 * @param {Storage} [backend] defaults to window.localStorage
 * @returns {{ persistent: boolean, read(key): string|null, write(key, value): {ok:boolean, error?:string}, remove(key): void }}
 */
export function createStorage(backend) {
  let store = null;
  try { store = backend ?? window.localStorage; } catch { store = null; } // accessing localStorage itself can throw
  const persistent = Boolean(store) && probe(store);
  if (!persistent) store = memoryStorage();

  return {
    persistent,
    read(key) {
      try { return store.getItem(key); } catch { return null; }
    },
    write(key, value) {
      try {
        store.setItem(key, value);
        return { ok: true };
      } catch (err) {
        const quota = err?.name === 'QuotaExceededError' || err?.code === 22;
        return { ok: false, error: quota ? 'Storage is full' : 'Storage is unavailable' };
      }
    },
    remove(key) {
      try { store.removeItem(key); } catch { /* ignore */ }
    },
  };
}
