/** Formatting helpers. */
const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null;

/** "just now", "5 minutes ago", "yesterday", … */
export function timeAgo(iso, now = Date.now()) {
  const diff = (Date.parse(iso) - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'just now';
  const units = [['minute', 60], ['hour', 3600], ['day', 86400], ['week', 604800], ['month', 2629800], ['year', 31557600]];
  let unit = units[0];
  for (const u of units) if (abs >= u[1]) unit = u;
  const value = Math.round(diff / unit[1]);
  return rtf ? rtf.format(value, unit[0]) : `${Math.abs(value)} ${unit[0]}s ago`;
}

export function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return iso; }
}
