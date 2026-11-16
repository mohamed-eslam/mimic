/**
 * Character configuration — the shared data model.
 *
 * One plain, JSON-serialisable object describes a character everywhere:
 * the Creator edits it, the engine renders it (via toEngineOptions), and the
 * storage phase will persist it as-is (schema `version` allows migrations).
 *
 *   {
 *     version, id?, name,
 *     shape, size, width, height, color,      // body
 *     background,                              // stage / card backdrop
 *     eyes, eyeSize, eyeSpacing, mouth, cheeks,// face
 *     accessory,                               // one at a time
 *     personality                              // behaviour preset (animator)
 *   }
 */
import {
  DEFAULT_CHARACTER, RANGES, SHAPES, EYES, MOUTHS, ACCESSORIES,
  SHAPE_NAMES, EYE_NAMES, MOUTH_NAMES, ACCESSORY_NAMES, isValidColor,
  PERSONALITIES, PERSONALITY_NAMES, DEFAULT_PERSONALITY,
} from '../engine/index.js';

export const SCHEMA_VERSION = 1;
export const NAME_MAX = 24;

export const BODY_COLORS = [
  { name: 'Lavender', value: '#b9a6ff' },
  { name: 'Peach', value: '#ffb59a' },
  { name: 'Mint', value: '#9de2c0' },
  { name: 'Sky', value: '#a2ccff' },
  { name: 'Butter', value: '#ffdf78' },
  { name: 'Bubblegum', value: '#ffb0d1' },
  { name: 'Lilac', value: '#d7b8f3' },
  { name: 'Seafoam', value: '#8fd8d2' },
  { name: 'Coral', value: '#ff9b9b' },
  { name: 'Cloud', value: '#e9e4f5' },
];

export const BACKGROUND_COLORS = [
  { name: 'Lavender mist', value: '#efe9ff' },
  { name: 'Peach cream', value: '#fff0e6' },
  { name: 'Mint milk', value: '#e3f7ec' },
  { name: 'Sky', value: '#e4f0ff' },
  { name: 'Butter', value: '#fff6d6' },
  { name: 'Rose', value: '#ffe8f1' },
  { name: 'Fog', value: '#f1eff6' },
  { name: 'Dusk', value: '#d9d4f6' },
];

const enumField = (options, catalog, fallback) => ({
  type: 'enum',
  options,
  labels: Object.fromEntries(options.map((id) => [id, catalog[id].label])),
  default: fallback,
});
const numberField = (key, label, step = 0.01) => ({
  type: 'number', label, step, ...RANGES[key], default: DEFAULT_CHARACTER[key],
});

/** Field definitions: validation, defaults and labels in one place. */
export const FIELDS = {
  name: { type: 'text', label: 'Name', default: 'Bloop', maxLength: NAME_MAX },
  shape: { label: 'Shape', ...enumField(SHAPE_NAMES, SHAPES, DEFAULT_CHARACTER.shape) },
  size: numberField('size', 'Size'),
  width: numberField('width', 'Width'),
  height: numberField('height', 'Height'),
  color: { type: 'color', label: 'Body color', default: DEFAULT_CHARACTER.color },
  background: { type: 'color', label: 'Background', default: BACKGROUND_COLORS[0].value },
  eyes: { label: 'Eyes', ...enumField(EYE_NAMES, EYES, DEFAULT_CHARACTER.eyes) },
  eyeSize: numberField('eyeSize', 'Eye size'),
  eyeSpacing: numberField('eyeSpacing', 'Eye spacing'),
  mouth: { label: 'Mouth', ...enumField(MOUTH_NAMES, MOUTHS, DEFAULT_CHARACTER.mouth) },
  cheeks: { type: 'boolean', label: 'Cheeks', default: DEFAULT_CHARACTER.cheeks },
  accessory: { label: 'Accessory', ...enumField(ACCESSORY_NAMES, ACCESSORIES, DEFAULT_CHARACTER.accessory) },
  personality: { label: 'Personality', ...enumField(PERSONALITY_NAMES, PERSONALITIES, DEFAULT_PERSONALITY) },
};

const ENGINE_KEYS = ['shape', 'size', 'width', 'height', 'color', 'eyes', 'eyeSize', 'eyeSpacing', 'mouth', 'cheeks', 'accessory'];

const round2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Validate a single field value; returns the field default when invalid. */
export function sanitizeField(key, value) {
  const f = FIELDS[key];
  if (!f) return undefined;
  switch (f.type) {
    case 'text': {
      const s = String(value ?? '').replace(/\s+/g, ' ').slice(0, f.maxLength);
      return s;
    }
    case 'enum': return f.options.includes(value) ? value : f.default;
    case 'number': {
      const n = Number(value);
      return Number.isFinite(n) ? round2(clamp(n, f.min, f.max)) : f.default;
    }
    case 'color': return isValidColor(value) ? value.toLowerCase() : f.default;
    case 'boolean': return typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : f.default;
    default: return f.default;
  }
}

export function defaultConfig() {
  return Object.fromEntries([['version', SCHEMA_VERSION], ...Object.entries(FIELDS).map(([k, f]) => [k, f.default])]);
}

/** Full, valid config from any partial input (unknown keys dropped, id kept). */
export function sanitizeConfig(input = {}) {
  const out = { version: SCHEMA_VERSION };
  if (typeof input.id === 'string') out.id = input.id;
  for (const key of Object.keys(FIELDS)) {
    out[key] = key in input ? sanitizeField(key, input[key]) : FIELDS[key].default;
  }
  return out;
}

export const createCharacterConfig = (overrides = {}) => sanitizeConfig({ ...defaultConfig(), ...overrides });

/** Subset understood by the rendering engine (Character). */
export function toEngineOptions(config) {
  return Object.fromEntries(ENGINE_KEYS.map((k) => [k, config[k]]));
}

/** Subset understood by the CharacterAnimator. */
export function toAnimatorOptions(config) {
  return { personality: config.personality };
}

export const isEngineField = (key) => ENGINE_KEYS.includes(key);

export function displayName(config) {
  return config.name?.trim() || 'Unnamed buddy';
}

/* ---------- Randomisation ---------- */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (a, b) => round2(a + Math.random() * (b - a));

const NAME_CORE = ['Mochi', 'Bao', 'Puddin', 'Bloop', 'Gumdrop', 'Noodle', 'Tofu', 'Biscuit', 'Marsh', 'Dumpling',
  'Pebble', 'Sprout', 'Jelly', 'Bean', 'Muffin', 'Wobble', 'Boba', 'Peachy', 'Taro', 'Nimbus', 'Sesame', 'Pip', 'Dango', 'Yuzu'];
const NAME_PREFIX = ["Lil' ", 'Sir ', 'Captain ', 'Tiny ', 'Lady ', 'Professor ', 'Baby ', 'Big '];
const NAME_SUFFIX = [' Jr.', ' the Brave', ' Puff', ' McSquish', ' the Great', ' Bun'];

export function randomName() {
  let name = pick(NAME_CORE);
  if (Math.random() < 0.4) name = pick(NAME_PREFIX) + name;
  else if (Math.random() < 0.35) name += pick(NAME_SUFFIX);
  return name.slice(0, NAME_MAX);
}

export function randomConfig({ name } = {}) {
  const color = pick(BODY_COLORS).value;
  return sanitizeConfig({
    name: name ?? randomName(),
    shape: pick(SHAPE_NAMES),
    size: between(0.85, 1.12),
    width: between(0.9, 1.15),
    height: between(0.9, 1.12),
    color,
    background: pick(BACKGROUND_COLORS).value,
    eyes: pick(EYE_NAMES),
    eyeSize: between(0.85, 1.25),
    eyeSpacing: between(0.85, 1.15),
    mouth: pick(MOUTH_NAMES),
    cheeks: Math.random() < 0.8,
    accessory: Math.random() < 0.35 ? 'none' : pick(ACCESSORY_NAMES.filter((a) => a !== 'none')),
    personality: pick(PERSONALITY_NAMES),
  });
}

/** Human readable summary rows for info panels. */
export function describeConfig(c) {
  const pct = (v) => `${Math.round(v * 100)}%`;
  const colorName = (list, v) => list.find((x) => x.value === v)?.name ?? v.toUpperCase();
  return [
    { label: 'Shape', value: FIELDS.shape.labels[c.shape] },
    { label: 'Body color', value: colorName(BODY_COLORS, c.color), color: c.color },
    { label: 'Proportions', value: `${pct(c.width)} × ${pct(c.height)}` },
    { label: 'Size', value: pct(c.size) },
    { label: 'Eyes', value: FIELDS.eyes.labels[c.eyes] },
    { label: 'Mouth', value: FIELDS.mouth.labels[c.mouth] },
    { label: 'Accessory', value: FIELDS.accessory.labels[c.accessory] },
    { label: 'Personality', value: `${PERSONALITIES[c.personality].emoji} ${FIELDS.personality.labels[c.personality]}` },
  ];
}

/* ---------- Persistence mapping ----------
   Saved records group the flat config into readable sections. Only plain
   configuration data is stored — never HTML/SVG markup.

   {
     id, name,
     body:   { shape, size, width, height },
     colors: { body, background },
     face:   { eyes, eyeSize, eyeSpacing, mouth, cheeks },
     accessory, personality,
     createdAt, updatedAt   // ISO strings
   }
*/
export function toRecord(config, { createdAt, updatedAt }) {
  const c = sanitizeConfig(config);
  return {
    id: c.id,
    name: c.name,
    body: { shape: c.shape, size: c.size, width: c.width, height: c.height },
    colors: { body: c.color, background: c.background },
    face: { eyes: c.eyes, eyeSize: c.eyeSize, eyeSpacing: c.eyeSpacing, mouth: c.mouth, cheeks: c.cheeks },
    accessory: c.accessory,
    personality: c.personality,
    createdAt,
    updatedAt,
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const validDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/**
 * Validate a stored record. Returns { config, createdAt, updatedAt } or null
 * when the record is unusable (missing id). Bad individual fields are
 * repaired with defaults instead of discarding the whole character.
 */
export function fromRecord(record) {
  if (!isObj(record) || typeof record.id !== 'string' || !record.id.trim()) return null;
  const body = isObj(record.body) ? record.body : {};
  const colors = isObj(record.colors) ? record.colors : {};
  const face = isObj(record.face) ? record.face : {};
  const config = sanitizeConfig({
    id: record.id,
    name: typeof record.name === 'string' ? record.name : '',
    shape: body.shape, size: body.size, width: body.width, height: body.height,
    color: colors.body, background: colors.background,
    eyes: face.eyes, eyeSize: face.eyeSize, eyeSpacing: face.eyeSpacing, mouth: face.mouth, cheeks: face.cheeks,
    accessory: record.accessory,
    personality: record.personality,
  });
  const now = new Date().toISOString();
  const createdAt = validDate(record.createdAt) ? record.createdAt : now;
  const updatedAt = validDate(record.updatedAt) ? record.updatedAt : createdAt;
  return { config, createdAt, updatedAt };
}
