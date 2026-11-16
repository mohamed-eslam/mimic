/**
 * Color utilities for the character engine.
 * Derives a full, painterly shading palette from a single body color:
 * shadows shift toward violet, highlights toward warm white — this is what
 * keeps the character from looking flat.
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function parseHex(input) {
  if (typeof input !== 'string') return null;
  let hex = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const isValidColor = (c) => parseHex(c) !== null;

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

/** Rotate hue toward a target by up to `amount` degrees (shortest path). */
function shiftHue(h, target, amount) {
  const diff = ((target - h + 540) % 360) - 180;
  return h + clamp(diff, -amount, amount);
}

/**
 * @param {string} base hex color
 * @returns {{base, light, highlight, dark, deep, rim, cheek, ink}}
 */
export function derivePalette(base) {
  const rgb = parseHex(base) ?? parseHex('#b9a6ff');
  const { h, s, l } = rgbToHsl(rgb);
  const shadowHue = shiftHue(h, 262, 18);  // cool, violet-leaning shadows
  const lightHue = shiftHue(h, 48, 8);     // warm highlights

  return {
    base: hslToHex(h, s, l),
    light: hslToHex(lightHue, s * 0.95, l + (1 - l) * 0.45),
    highlight: hslToHex(lightHue, s * 0.6, l + (1 - l) * 0.82),
    dark: hslToHex(shadowHue, Math.min(1, s * 1.02 + 0.04), l * 0.72),
    deep: hslToHex(shadowHue, Math.min(1, s * 0.9 + 0.08), l * 0.45),
    rim: hslToHex(shiftHue(h, 200, 20), s * 0.8, l + (1 - l) * 0.55),
    cheek: hslToHex(shiftHue(h, 345, 60), 0.92, clamp(l * 0.92, 0.62, 0.74)),
  };
}
