/**
 * Character asset discovery.
 *
 * A static site can't list a folder, so assets are discovered by convention:
 * for each catalog character we probe the expected file names
 * (see data/catalog.js → expectedAssets) with lightweight HEAD requests and
 * cache what exists. Pages render placeholders immediately and swap in real
 * images as soon as they're found.
 *
 * Dev helper (browser console):  await CharacterLab.assetReport()
 */
import { CATALOG, expectedAssets } from '../data/catalog.js';

const cache = new Map(); // url → Promise<boolean>

function exists(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
      .catch(() => false));
  }
  return cache.get(url);
}

async function firstExisting(folder, names) {
  for (const name of names) if (await exists(folder + name)) return folder + name;
  return null;
}

/** { main, poses: { [pose]: url|null }, expressions: { [expr]: url|null } } */
const resolved = new Map();

export async function resolveAssets(listing, { full = false } = {}) {
  const key = `${listing.id}:${full}`;
  if (resolved.has(key)) return resolved.get(key);
  const exp = expectedAssets(listing);
  // Explicit artwork (catalog `media.image`) wins; otherwise probe the folder convention.
  const explicit = listing.media?.image && (await exists(listing.media.image)) ? listing.media.image : null;
  const result = { main: explicit ?? await firstExisting(listing.folder, exp.main), poses: {}, expressions: {} };
  if (full) {
    await Promise.all([
      ...Object.entries(exp.poses).map(async ([p, names]) => { result.poses[p] = await firstExisting(listing.folder, names); }),
      ...Object.entries(exp.expressions).map(async ([e, names]) => { result.expressions[e] = await firstExisting(listing.folder, names); }),
    ]);
  }
  resolved.set(key, result);
  return result;
}

/** Main images for the whole catalog: { [id]: url|null } */
export async function resolveCatalogImages() {
  const entries = await Promise.all(CATALOG.map(async (c) => [c.id, (await resolveAssets(c)).main]));
  return Object.fromEntries(entries);
}

/** Missing-asset report for the team (console + README guidance). */
export async function assetReport() {
  const rows = [];
  for (const c of CATALOG) {
    const a = await resolveAssets(c, { full: true });
    const missing = [];
    if (!a.main) missing.push('main.webp (or media.image)');
    Object.entries(a.poses).forEach(([p, url]) => { if (!url) missing.push(`pose-${p}.webp`); });
    Object.entries(a.expressions).forEach(([e, url]) => { if (!url) missing.push(`expression-${e}.webp`); });
    rows.push({ id: c.id, folder: c.folder, missing: missing.join(', ') || '—' });
  }
  console.table(rows);
  return rows;
}
