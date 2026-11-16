/**
 * Dependency-free browser test suite.
 * Run: serve the project root and open /tests/ (or headless Chrome --dump-dom).
 */
import { Character, CharacterAnimator, PERSONALITIES, PERSONALITY_NAMES, ACCESSORY_NAMES } from '../js/engine/index.js';
import { sanitizeConfig, randomConfig, createCharacterConfig, FIELDS } from '../js/models/character-config.js';
import { createCharacterRepository, StorageError, STORAGE_KEY } from '../js/services/character-service.js';
import { createStorage } from '../js/services/storage.js';

const out = document.getElementById('results');
const results = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (ok, name, info = '') => {
  results.push({ ok, name });
  const line = document.createElement('div');
  line.className = ok ? 'pass' : 'fail';
  line.textContent = `${ok ? 'PASS' : 'FAIL'}  ${name}${info ? `  — ${info}` : ''}`;
  out.appendChild(line);
};
const check = (cond, name, info) => log(Boolean(cond), name, cond ? '' : info);

async function test(name, fn) {
  try { await fn(); } catch (err) { log(false, name, `threw: ${err.message}`); console.error(err); }
}

const pointer = (type, target, x, y, extra = {}) =>
  target.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, clientX: x, clientY: y, bubbles: true, cancelable: true, ...extra }));

const finitePose = (pose) => Object.values(pose).every((v) => Number.isFinite(v));

function sample(anim, ms, pick) {
  // Record a pose value every frame for `ms`
  return new Promise((resolve) => {
    const values = [];
    const t0 = performance.now();
    const loop = () => {
      values.push(pick(anim.character.pose, anim));
      if (performance.now() - t0 < ms) requestAnimationFrame(loop);
      else resolve(values);
    };
    requestAnimationFrame(loop);
  });
}

function makeCharacter(opts = {}, animOpts) {
  const host = document.getElementById('sandbox');
  host.innerHTML = '';
  const c = new Character(host, opts);
  const a = animOpts === false ? null : new CharacterAnimator(c, { sleepAfter: 0, ...animOpts });
  const rect = c.el.getBoundingClientRect();
  const center = [rect.left + rect.width / 2, rect.top + rect.height * 0.6];
  return { c, a, rect, center, destroy: () => c.destroy() };
}

/* ====================================================================== */
/* 1. Model                                                                */
/* ====================================================================== */
await test('model', async () => {
  const bad = sanitizeConfig({ shape: 'triangle', size: 99, color: 'red', name: 'x'.repeat(80), personality: 'grumpy', cheeks: 'false' });
  check(bad.shape === 'round', 'model: invalid shape falls back to default');
  check(bad.size === FIELDS.size.max, 'model: numbers are clamped');
  check(bad.color === FIELDS.color.default, 'model: invalid color rejected');
  check(bad.name.length === 24, 'model: name length capped');
  check(bad.personality === 'happy', 'model: invalid personality falls back');
  check(bad.cheeks === false, 'model: boolean strings parsed');
  const r = randomConfig();
  check(JSON.stringify(sanitizeConfig(r)) === JSON.stringify(r), 'model: randomConfig is always valid');
  check('personality' in createCharacterConfig(), 'model: personality stored in config');
});

/* ====================================================================== */
/* 2. Rendering engine                                                     */
/* ====================================================================== */
await test('render', async () => {
  const { c, destroy } = makeCharacter({}, false);
  const stop = () => c.el.querySelector('stop[data-c="base"]').style.stopColor;
  const before = stop();
  c.setColor('#ff9b9b');
  check(stop() !== before, 'render: setColor updates gradient');
  check(c.el.querySelectorAll('stop[data-c]').length >= 10, 'render: layered gradients (body, AO, rim, highlight, cheek)');

  const d0 = c.refs.shape.getAttribute('d');
  c.setShape('squishy');
  await wait(700);
  check(c.refs.shape.getAttribute('d') !== d0, 'render: setShape morphs body path');
  check(c.getState().shape === 'squishy', 'render: shape state updated');

  const eyes0 = c.refs.eyeShapes[0].innerHTML;
  c.setEyes('sparkle');
  check(c.refs.eyeShapes[0].innerHTML !== eyes0, 'render: setEyes swaps eye art');
  const mouth0 = c.refs.mouth.innerHTML;
  c.setMouth('open');
  check(c.refs.mouth.innerHTML !== mouth0, 'render: setMouth swaps mouth art');

  c.setSize(1.2);
  check(c.refs.figure.getAttribute('transform').includes('scale(1.2)'), 'render: setSize scales figure');
  c.setSize(5);
  check(c.getState().size === 1.3, 'render: size clamped to range');

  const d1 = c.refs.shape.getAttribute('d');
  c.setProportions({ width: 1.2, height: 0.85 });
  c.applyPose();
  check(c.refs.shape.getAttribute('d') !== d1, 'render: width/height proportions reshape body');

  c.setEyeSize(1.3);
  c.applyPose();
  check(c.refs.eyeShapes[0].getAttribute('transform').startsWith('scale(1.3'), 'render: eye size applied');
  const ex0 = c.refs.eyes[1].getAttribute('transform');
  c.setEyeSpacing(1.25);
  c.applyPose();
  check(c.refs.eyes[1].getAttribute('transform') !== ex0, 'render: eye spacing applied');

  c.setCheeks(false);
  check(c.refs.cheeks.style.display === 'none', 'render: cheeks toggle');

  for (const acc of ACCESSORY_NAMES.filter((a) => a !== 'none')) {
    c.setAccessory(acc);
    const markup = c.refs.accHead.innerHTML + c.refs.accFace.innerHTML;
    check(markup.length > 50 && c.el.dataset.accessory === acc, `render: accessory "${acc}" renders`);
  }
  c.setAccessory('none');
  check(!c.refs.accHead.innerHTML && !c.refs.accFace.innerHTML, 'render: only one accessory / none clears');

  c.setColor('nope');
  c.setShape('hexagon');
  check(c.getState().color === '#ff9b9b' && c.getState().shape === 'squishy', 'render: invalid values ignored');

  // Responsive: SVG follows container width
  document.getElementById('sandbox').style.width = '150px';
  const w = c.refs.svg.getBoundingClientRect().width;
  check(Math.abs(w - 150) < 1, 'render: scales with container (responsive)', `width ${w}`);
  document.getElementById('sandbox').style.width = '300px';

  // Multiple instances must not share gradient ids
  const other = new Character(null, {});
  check(other.uid !== c.uid, 'render: unique ids per instance');
  destroy();
});

/* ====================================================================== */
/* 3. Animation & interaction                                             */
/* ====================================================================== */
await test('idle', async () => {
  const { a, destroy } = makeCharacter({}, { personality: 'happy' });
  const sy = await sample(a, 2500, (p) => p.scaleY);
  const ys = await sample(a, 3000, (p) => p.y);
  check(Math.max(...sy) - Math.min(...sy) > 0.01, 'idle: breathing changes scale');
  check(Math.max(...ys) - Math.min(...ys) > 1, 'idle: floating changes height');
  const blinks = await sample(a, 7000, (p) => p.blink);
  check(Math.max(...blinks) > 0.5, 'idle: blinks within 7s');
  check(finitePose(a.character.pose), 'idle: pose is always finite');
  destroy();
});

await test('eyes', async () => {
  const { a, rect, destroy } = makeCharacter({}, { personality: 'curious', idle: false });
  pointer('pointermove', document.body, rect.right + 400, rect.top + rect.height / 2);
  await wait(700);
  const lx = a.character.pose.lookX;
  check(lx > 0.4, 'eyes: follow pointer to the right', `lookX=${lx.toFixed(2)}`);
  pointer('pointermove', document.body, rect.left - 400, rect.top + rect.height / 2);
  const track = await sample(a, 700, (p) => p.lookX);
  const monotonic = track.every((v, i) => i === 0 || v <= track[i - 1] + 0.02);
  check(track.at(-1) < -0.4 && monotonic, 'eyes: smooth interpolation (no jumps)');
  await wait(3600);
  check(Math.abs(a.character.pose.lookX) < 0.1, 'eyes: return to center after inactivity', `lookX=${a.character.pose.lookX.toFixed(2)}`);
  destroy();
});

await test('poke', async () => {
  const { a, c, center, destroy } = makeCharacter({}, { personality: 'happy', idle: false });
  const events = [];
  c.el.addEventListener('character:poke', () => events.push('poke'));
  pointer('pointerdown', c.el, ...center);
  await wait(250);
  check(c.pose.scaleY < 0.9 && c.pose.scaleX > 1.05, 'poke: press compresses body (squash)', `sy=${c.pose.scaleY.toFixed(2)}`);
  check(c.expression === 'poked', 'poke: face reacts while pressed');
  pointer('pointerup', c.el, ...center);
  const sy = await sample(a, 900, (p) => p.scaleY);
  check(Math.max(...sy) > 1.02, 'poke: bounces back past rest (stretch overshoot)');
  check(events.length === 1, 'poke: emits character:poke');
  check(['poked', 'excited'].includes(c.expression), 'poke: follow-up expression');
  await wait(1800);
  check(Math.abs(c.pose.scaleY - 1) < 0.02 && c.expression === null, 'poke: settles to rest + neutral face');
  // keyboard poke
  c.el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  check(events.length === 2, 'poke: keyboard (Enter) pokes');
  destroy();
});

await test('drag', async () => {
  const { a, c, center, destroy } = makeCharacter({}, { personality: 'happy', idle: false });
  pointer('pointerdown', c.el, ...center);
  for (let i = 1; i <= 10; i++) { pointer('pointermove', c.el, center[0] + i * 12, center[1] - i * 5); await wait(16); }
  await wait(120);
  check(c.pose.x > 40 && c.pose.y < -10, 'drag: character follows pointer', `x=${c.pose.x.toFixed(1)}`);
  check(c.expression === 'excited', 'drag: grabbed expression');
  pointer('pointermove', c.el, center[0] + 2000, center[1]);
  await wait(300);
  check(c.pose.x < 130, 'drag: elastic leash limits distance', `x=${c.pose.x.toFixed(1)}`);
  const stretchDuring = await sample(a, 200, (p) => p.stretch);
  check(Math.max(...stretchDuring) > 0.05, 'drag: body stretches toward pull');
  pointer('pointerup', c.el, center[0] + 2000, center[1]);
  const xs = await sample(a, 1500, (p) => p.x);
  check(Math.min(...xs) < -2, 'drag: spring release overshoots (wobble)', `min x=${Math.min(...xs).toFixed(1)}`);
  check(Math.abs(xs.at(-1)) < 2, 'drag: returns to rest', `x=${xs.at(-1).toFixed(2)}`);
  // jitter check: settled values must be stable
  const settled = await sample(a, 500, (p) => p.x);
  check(Math.max(...settled) - Math.min(...settled) < 0.05, 'drag: no jitter once settled');
  check(finitePose(c.pose), 'drag: pose finite');
  destroy();
});

await test('sleep', async () => {
  const { a, c, destroy } = makeCharacter({}, { personality: 'happy', sleepAfter: 1000 });
  await wait(1400);
  check(a.state === 'sleeping', 'sleep: sleeps after inactivity');
  check(c.expression === 'sleep' && c.el.classList.contains('is-sleeping'), 'sleep: eyes closed + zzz');
  await wait(1500);
  const rate = a.phase.breath;
  await wait(1000);
  const asleepRate = (a.phase.breath - rate) / (2 * Math.PI);
  check(asleepRate < 0.2, 'sleep: breathing slows', `${asleepRate.toFixed(2)} Hz`);
  const [x, y] = [c.el.getBoundingClientRect().left + 150, c.el.getBoundingClientRect().top + 180];
  pointer('pointerdown', c.el, x, y);
  pointer('pointerup', c.el, x, y);
  check(a.state === 'awake', 'sleep: interaction wakes it up');
  destroy();
});

await test('loop', async () => {
  const { a, destroy } = makeCharacter({}, {});
  check(a.running, 'loop: animator registered on shared ticker');
  a.destroy();
  check(!a.running, 'loop: destroy stops updates');
  destroy();
});

/* ====================================================================== */
/* 4. Personalities                                                        */
/* ====================================================================== */
await test('personality', async () => {
  check(PERSONALITY_NAMES.join() === 'happy,shy,sleepy,energetic,curious', 'personality: five personalities defined');
  const traitKeys = Object.keys(PERSONALITIES.happy.motion);
  const distinct = PERSONALITY_NAMES.every((a, i) => PERSONALITY_NAMES.slice(i + 1).every((b) =>
    traitKeys.some((k) => PERSONALITIES[a].motion[k] !== PERSONALITIES[b].motion[k])));
  check(distinct, 'personality: each has distinct motion traits');

  const { a, c, center, rect, destroy } = makeCharacter({}, { personality: 'happy' });
  // smooth transition
  a.setPersonality('sleepy');
  await wait(150);
  const mid = a.traits.breathRate;
  check(mid < PERSONALITIES.happy.motion.breathRate && mid > PERSONALITIES.sleepy.motion.breathRate, 'personality: traits blend smoothly', `mid=${mid.toFixed(3)}`);
  await wait(2000);
  check(Math.abs(a.traits.breathRate - PERSONALITIES.sleepy.motion.breathRate) < 0.01, 'personality: blend completes');
  check(c.el.dataset.personality === 'sleepy', 'personality: reflected on element');

  // energetic bounces
  a.setPersonality('energetic', { react: false });
  const hops = await sample(a, 3500, (_, an) => an.springs.hop.value);
  check(Math.min(...hops) < -3, 'personality: energetic bounces on its own');

  // shy avoids gaze when pointer is close, curious tracks it
  a.setPersonality('shy', { react: false });
  await wait(900);
  pointer('pointermove', document.body, rect.left + rect.width * 0.75, rect.top + rect.height / 2);
  await wait(800);
  check(c.pose.lookX < -0.1, 'personality: shy looks away when pointer is close', `lookX=${c.pose.lookX.toFixed(2)}`);
  a.setPersonality('curious', { react: false });
  pointer('pointermove', document.body, rect.left + rect.width * 0.75, rect.top + rect.height / 2);
  await wait(900);
  check(c.pose.lookX > 0.2, 'personality: curious looks at the pointer', `lookX=${c.pose.lookX.toFixed(2)}`);

  // switching mid-drag must not conflict
  pointer('pointerdown', c.el, ...center);
  for (let i = 1; i <= 6; i++) { pointer('pointermove', c.el, center[0] - i * 15, center[1]); await wait(16); }
  for (const p of PERSONALITY_NAMES) { a.setPersonality(p); await wait(60); }
  check(c.pose.x < -30, 'personality: switching mid-drag keeps the drag', `x=${c.pose.x.toFixed(1)}`);
  pointer('pointerup', c.el, center[0] - 90, center[1]);
  await wait(2500);
  check(Math.abs(c.pose.x) < 2 && finitePose(c.pose), 'personality: release still springs back after switches');
  check(!a.press && !c.el.classList.contains('is-dragging'), 'personality: no stuck drag state');

  // switching while asleep stays asleep, wake works
  a.sleep();
  a.setPersonality('happy');
  check(a.state === 'sleeping' && c.expression === 'sleep', 'personality: switching while asleep does not wake/override face');
  a.wake();
  check(a.state === 'awake', 'personality: wake after switch');
  destroy();
});

/* ====================================================================== */
/* 5. App: routes, layout, Creator controls                                */
/* ====================================================================== */
function loadApp(hash, width, search = '') {
  return new Promise((resolve) => {
    const f = document.createElement('iframe');
    f.style.width = `${width}px`;
    f.src = `../index.html${search}#${hash}`;
    f.onload = async () => { await wait(900); resolve(f); };
    document.getElementById('frames').appendChild(f);
  });
}

await test('layout', async () => {
  for (const width of [375, 820, 1440]) {
    for (const route of ['/', '/marketplace', '/creators', '/integration', '/packages', '/contact', '/brief', '/request-integration', '/app', '/app/create', '/app/characters', '/app/personality']) {
      const f = await loadApp(route, width);
      const doc = f.contentDocument;
      const over = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
      let culprit = '';
      if (over > 0) {
        const els = [...doc.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > doc.documentElement.clientWidth + 1);
        culprit = els.slice(-3).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`).join(' | ');
      }
      check(over <= 0, `layout: no horizontal overflow at ${width}px on ${route}`, `${over}px; ${culprit}`);
      f.remove();
    }
  }
});

await test('creator', async () => {
  const savedBackup = localStorage.getItem(STORAGE_KEY);
  const f = await loadApp('/create', 1440);
  const doc = f.contentDocument;
  const $ = (s) => doc.querySelector(s);
  const char = () => $('.creator__character .cl-char');
  const click = (s) => $(s).click();
  const setInput = (s, v) => { const el = $(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };

  check(char(), 'creator: live character rendered');
  check(char().matches('[data-interactive]'), 'creator: preview is animated & interactive');

  const d0 = char().querySelector('defs path').getAttribute('d');
  click('[data-field="shape"][data-value="blob"]');
  await wait(700);
  check(char().querySelector('defs path').getAttribute('d') !== d0, 'creator: shape option updates body');

  setInput('#ctl-size', 1.2);
  check(char().querySelector('.cl-char__figure').getAttribute('transform').includes('scale(1.2)'), 'creator: size slider');
  check($('[data-output="size"]').textContent === '120%', 'creator: slider value label');
  const d1 = char().querySelector('defs path').getAttribute('d');
  setInput('#ctl-width', 1.2); setInput('#ctl-height', 0.85);
  await wait(50);
  check(char().querySelector('defs path').getAttribute('d') !== d1, 'creator: width/height sliders');

  click('[data-tab="colors"]');
  check(!$('#creator-panel-colors').hidden && $('#creator-panel-body').hidden, 'creator: tabs switch panels');
  const stopColor = () => char().querySelector('stop[data-c="base"]').style.stopColor;
  const sc0 = stopColor();
  click('[data-field="color"][data-value="#9de2c0"]');
  check(stopColor() !== sc0, 'creator: preset body color');
  setInput('input[type="color"][data-field="color"]', '#123456');
  check(stopColor().replace(/\s/g, '') === 'rgb(18,52,86)', 'creator: custom color picker', stopColor());
  check($('[data-custom="color"]').getAttribute('aria-checked') === 'true', 'creator: custom swatch marked selected');
  click('[data-field="background"][data-value="#e3f7ec"]');
  check($('[data-stage]').style.getPropertyValue('--stage-bg').includes('#e3f7ec'), 'creator: background color');

  click('[data-tab="face"]');
  const eye0 = char().querySelector('.cl-char__eye-shape').innerHTML;
  click('[data-field="eyes"][data-value="dot"]');
  check(char().querySelector('.cl-char__eye-shape').innerHTML !== eye0, 'creator: eye style');
  setInput('#ctl-eyeSize', 1.3);
  await wait(60);
  check(/scale\(1\.3 /.test(char().querySelector('.cl-char__eye-shape').getAttribute('transform')), 'creator: eye size');
  const ex = char().querySelectorAll('.cl-char__eye')[1].getAttribute('transform');
  setInput('#ctl-eyeSpacing', 1.25);
  await wait(60);
  check(char().querySelectorAll('.cl-char__eye')[1].getAttribute('transform') !== ex, 'creator: eye spacing');
  const m0 = char().querySelector('.cl-char__mouth').innerHTML;
  click('[data-field="mouth"][data-value="cat"]');
  check(char().querySelector('.cl-char__mouth').innerHTML !== m0, 'creator: mouth expression');
  const cheeks = $('input[data-field="cheeks"]');
  cheeks.checked = false; cheeks.dispatchEvent(new Event('input', { bubbles: true }));
  check(char().querySelector('.cl-char__cheeks').style.display === 'none', 'creator: cheeks toggle');

  click('[data-tab="extras"]');
  click('[data-field="accessory"][data-value="partyHat"]');
  check(char().dataset.accessory === 'partyHat' && char().querySelector('.cl-char__acc-head').innerHTML, 'creator: hat accessory');
  click('[data-field="accessory"][data-value="glasses"]');
  check(char().dataset.accessory === 'glasses' && !char().querySelector('.cl-char__acc-head').innerHTML, 'creator: one accessory at a time');

  setInput('#ctl-name', 'Wobbles');
  check($('[data-nameplate]').textContent === 'Wobbles' && $('[data-name-preview]').textContent === 'Wobbles', 'creator: live name preview');
  click('[data-action="random-name"]');
  check($('#ctl-name').value && $('#ctl-name').value !== 'Wobbles' && $('[data-nameplate]').textContent === $('#ctl-name').value, 'creator: random name generator');

  click('[data-field="personality"][data-value="curious"]');
  check(char().dataset.personality === 'curious', 'creator: personality selection drives animator');
  check($('[data-specs]').textContent.includes('Curious'), 'creator: summary updates');

  click('[data-action="randomize"]');
  await wait(100);
  const name = $('#ctl-name').value;
  check(name && $('[data-nameplate]').textContent === name, 'creator: randomize updates controls + preview');
  const checkedShape = $('[data-field="shape"][aria-checked="true"]').dataset.value;
  check(checkedShape, 'creator: randomize syncs option controls');

  click('[data-action="save"]');
  await wait(100);
  check($('[data-save-status]').dataset.state === 'saved', 'creator: save callback + status');
  setInput('#ctl-size', 0.9);
  check($('[data-save-status]').textContent === 'Unsaved changes', 'creator: dirty tracking after save');

  click('[data-action="reset"]');
  await wait(100);
  check($('#ctl-name').value === 'Bloop' && char().dataset.accessory === 'none', 'creator: reset to defaults');

  // Interaction still works inside the Creator
  click('[data-field="personality"][data-value="energetic"]');
  const r = char().getBoundingClientRect();
  const cx = r.left + r.width / 2; const cy = r.top + r.height * 0.6;
  const P = (t, x, y) => char().dispatchEvent(new f.contentWindow.PointerEvent(t, { pointerId: 3, button: 0, clientX: x, clientY: y, bubbles: true }));
  P('pointerdown', cx, cy);
  for (let i = 1; i <= 6; i++) { P('pointermove', cx + i * 10, cy); await wait(16); }
  check(char().classList.contains('is-dragging'), 'creator: drag works in preview');
  P('pointerup', cx + 60, cy);
  check(!char().classList.contains('is-dragging'), 'creator: release works in preview');

  // The draft (with its personality) is playable in the Playground
  f.contentWindow.location.hash = '#/playground';
  await wait(900);
  const sel = doc.querySelector('[data-select]');
  sel.value = 'draft';
  sel.dispatchEvent(new Event('change'));
  await wait(200);
  check(doc.querySelector('.playground__character .cl-char')?.dataset.personality === 'energetic', 'playground: draft keeps personality from config');
  f.remove();
  if (savedBackup == null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, savedBackup);
});

/* ====================================================================== */
/* 6. Storage (My Characters)                                             */
/* ====================================================================== */
function fakeBackend(initial = {}, { failWrites = false, quota = false } = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      if (k.startsWith('__character_lab_probe__') && !failWrites) { data[k] = v; return; }
      if (failWrites) throw new Error('blocked');
      if (quota && !k.startsWith('__')) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }
      data[k] = String(v);
    },
    removeItem: (k) => { delete data[k]; },
  };
}
const repoWith = (backend, key = 'test:chars') => createCharacterRepository({ key, storage: createStorage(backend) });

await test('storage', async () => {
  const backend = fakeBackend();
  const repo = repoWith(backend);
  const a = await repo.save(createCharacterConfig({ name: 'Alpha', personality: 'shy', accessory: 'bow', color: '#9de2c0' }));
  check(typeof a.id === 'string' && a.id.length > 8, 'storage: save assigns a unique id');
  check(a.createdAt && a.createdAt === a.updatedAt, 'storage: created/updated dates set');

  const raw = JSON.parse(backend.data['test:chars']);
  const rec = raw.characters[0];
  check(raw.version === 1, 'storage: schema version written');
  check(rec.body?.shape && rec.colors?.body === '#9de2c0' && rec.face?.eyes && rec.accessory === 'bow' && rec.personality === 'shy' && rec.name === 'Alpha',
    'storage: record has name, body, colors, face, accessory, personality');
  check(!/<svg|<path|<div/i.test(backend.data['test:chars']), 'storage: no HTML/SVG markup saved');

  const reloaded = repoWith(backend);
  const list = await reloaded.list();
  check(list.length === 1 && list[0].name === 'Alpha' && list[0].personality === 'shy', 'storage: persists across reload');

  await wait(5);
  const updated = await reloaded.save({ ...list[0], color: '#ffb0d1' });
  check(updated.id === a.id && updated.createdAt === a.createdAt && updated.updatedAt > a.updatedAt, 'storage: explicit save updates same character');
  const b = await reloaded.save(createCharacterConfig({ name: 'Beta' }));
  check(b.id !== a.id && (await reloaded.count()) === 2, 'storage: new character never overwrites another');

  const copy = await reloaded.duplicate(a.id);
  check(copy.id !== a.id && copy.name === 'Alpha copy' && copy.color === '#ffb0d1' && copy.personality === 'shy', 'storage: duplicate copies config with new id/name');
  check((await reloaded.get(a.id)).name === 'Alpha', 'storage: duplicate leaves original untouched');

  const renamed = await reloaded.rename(copy.id, '  Gamma  ');
  check(renamed.name === 'Gamma', 'storage: rename (trimmed)');
  let threw = false;
  try { await reloaded.rename(copy.id, '   '); } catch (e) { threw = e instanceof StorageError; }
  check(threw && (await reloaded.get(copy.id)).name === 'Gamma', 'storage: empty rename rejected');

  await reloaded.remove(b.id);
  check(!(await reloaded.get(b.id)) && (await repoWith(backend).count()) === 2, 'storage: delete persists');
  threw = false;
  try { await reloaded.remove('missing'); } catch (e) { threw = e instanceof StorageError; }
  check(threw, 'storage: deleting a missing character errors safely');

  // corrupt JSON → backup + fresh start
  const corrupt = fakeBackend({ 'test:chars': '{not json' });
  const r1 = repoWith(corrupt);
  check((await r1.list()).length === 0 && r1.status().recovered, 'storage: corrupt JSON handled');
  check(Object.keys(corrupt.data).some((k) => k.startsWith('test:chars:backup-')), 'storage: corrupt data backed up, not destroyed');

  // invalid records are validated / repaired / skipped
  const messy = fakeBackend({ 'test:chars': JSON.stringify({ version: 1, characters: [
    {}, null, 'x',
    { id: 'ok1', name: 42, body: { shape: 'hexagon', size: 'big' }, colors: { body: 'javascript:alert(1)' }, personality: 'evil' },
    { id: 'ok1', name: 'dupe' },
  ] }) });
  const r2 = repoWith(messy);
  const fixed = await r2.list();
  check(fixed.length === 1 && fixed[0].shape === 'round' && fixed[0].size === 1 && fixed[0].color === FIELDS.color.default && fixed[0].personality === 'happy' && fixed[0].name === '',
    'storage: invalid fields repaired with defaults');
  check(r2.status().dropped === 4, 'storage: unusable records skipped', `dropped=${r2.status().dropped}`);

  // v0 (bare array) migration
  const v0 = fakeBackend({ 'test:chars': JSON.stringify([{ id: 'old', name: 'Oldie', body: { shape: 'blob' } }]) });
  const r3 = repoWith(v0);
  check((await r3.get('old'))?.shape === 'blob', 'storage: migrates v0 data');
  await r3.save({ ...(await r3.get('old')), name: 'Oldie 2' });
  check(JSON.parse(v0.data['test:chars']).version === 1, 'storage: migrated data rewritten with current version');

  // future version → read-only, never overwritten
  const futureRaw = JSON.stringify({ version: 99, characters: [{ id: 'f', name: 'Future' }] });
  const future = fakeBackend({ 'test:chars': futureRaw });
  const r4 = repoWith(future);
  threw = false;
  try { await r4.save(createCharacterConfig({ name: 'x' })); } catch (e) { threw = e instanceof StorageError; }
  check(r4.status().readOnly && threw && future.data['test:chars'] === futureRaw, 'storage: newer schema opened read-only, not overwritten');

  // quota exceeded → error + rollback
  const full = fakeBackend({}, { quota: true });
  const r5 = repoWith(full);
  threw = false;
  try { await r5.save(createCharacterConfig({ name: 'Too big' })); } catch (e) { threw = /full/i.test(e.message); }
  check(threw && (await r5.count()) === 0, 'storage: quota error reported and rolled back');

  // localStorage unavailable → in-memory fallback
  const blocked = repoWith(fakeBackend({}, { failWrites: true }));
  const m = await blocked.save(createCharacterConfig({ name: 'Mem' }));
  check(!blocked.status().persistent && (await blocked.get(m.id))?.name === 'Mem', 'storage: unavailable storage falls back to memory');
});

await test('my-characters e2e', async () => {
  const backup = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  try {
    const f = await loadApp('/characters', 1280);
    const win = f.contentWindow;
    const $ = (s) => f.contentDocument.querySelector(s);
    const $$ = (s) => [...f.contentDocument.querySelectorAll(s)];
    const go = async (hash) => { win.location.hash = hash; await wait(700); };
    const setInput = (s, v) => { const el = $(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    const cards = () => $$('.char-card');
    const cardNamed = (n) => cards().find((c) => c.querySelector('[data-name]')?.textContent === n);

    await wait(300);
    check($('.empty-state') && cards().length === 0, 'e2e: empty state with no saved characters');

    await go('#/create?new=1');
    setInput('#ctl-name', 'E2E Tester');
    $('[data-field="personality"][data-value="shy"]').click();
    $('[data-action="save"]').click();
    await wait(150);
    check($('[data-save-status]').dataset.state === 'saved', 'e2e: save from Creator');

    // Creating another new character must not overwrite the first
    await go('#/create?new=1');
    check($('#ctl-name').value === 'Bloop' && $('[data-save-status]').textContent === 'Not saved yet', 'e2e: "new" starts a fresh draft');
    setInput('#ctl-name', 'Second');
    $('[data-action="save"]').click();
    await wait(150);

    // Reload the whole app → data must persist
    win.location.hash = '#/characters';
    win.location.reload();
    await new Promise((r) => { f.onload = r; });
    await wait(900);
    check(cards().length === 2 && cardNamed('E2E Tester') && cardNamed('Second'), 'e2e: characters persist after browser refresh');
    check(cardNamed('E2E Tester').querySelector('.persona-badge').textContent.includes('Shy'), 'e2e: card shows personality');
    check(cardNamed('E2E Tester').querySelector('.cl-char svg'), 'e2e: card shows live Character preview');
    const editLink = cardNamed('E2E Tester').querySelector('.char-card__actions a');
    check(editLink && cardNamed('E2E Tester').querySelector('[data-action="duplicate"]') && cardNamed('E2E Tester').querySelector('[data-action="delete"]'), 'e2e: card has edit/duplicate/delete');

    // Duplicate
    cardNamed('E2E Tester').querySelector('[data-action="duplicate"]').click();
    await wait(200);
    check(cards().length === 3 && cardNamed('E2E Tester copy'), 'e2e: duplicate');

    // Rename (inline)
    cardNamed('E2E Tester copy').querySelector('[data-action="rename"]').click();
    const input = $('.char-card__rename');
    input.value = 'Renamed Copy';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await wait(200);
    check(cardNamed('Renamed Copy') && !cardNamed('E2E Tester copy'), 'e2e: rename');

    // Search
    setInput('[data-search]', 'renamed');
    check(cards().length === 1, 'e2e: search filters cards');
    setInput('[data-search]', '');

    // Edit → loads saved character, changes, explicit save updates only that one
    const copyColorBefore = cardNamed('Renamed Copy').querySelector('stop[data-c="base"]').style.stopColor;
    cardNamed('E2E Tester').querySelector('.char-card__actions a').click();
    await wait(800);
    check($('#ctl-name').value === 'E2E Tester' && $('[data-save-status]').textContent === 'All changes saved', 'e2e: edit loads saved character');
    check($('[data-field="personality"][aria-checked="true"]').dataset.value === 'shy', 'e2e: edit restores personality');
    $('[data-tab="colors"]').click();
    $('[data-field="color"][data-value="#ffdf78"]').click();
    check($('[data-save-status]').textContent === 'Unsaved changes', 'e2e: edits are not auto-saved');
    await go('#/characters');
    check(cards().length === 3, 'e2e: leaving without saving does not overwrite');
    await go('#/create?id=' + cardNamed('E2E Tester').dataset.id);
    check($('[data-save-status]').textContent === 'Unsaved changes', 'e2e: returning keeps unsaved edits of same character');
    $('[data-action="save"]').click();
    await wait(150);
    await go('#/characters');
    const tester = cardNamed('E2E Tester');
    check(cards().length === 3 && tester.querySelector('stop[data-c="base"]').style.stopColor !== copyColorBefore, 'e2e: explicit save updates the edited character');
    check(cardNamed('Renamed Copy').querySelector('stop[data-c="base"]').style.stopColor === copyColorBefore, 'e2e: other characters untouched');

    // Delete with confirmation (cancel first, then confirm)
    cardNamed('Second').querySelector('[data-action="delete"]').click();
    await wait(100);
    check($('dialog[open]'), 'e2e: delete asks for confirmation');
    $('dialog [data-dialog-cancel]').click();
    await wait(150);
    check(cards().length === 3, 'e2e: cancel keeps the character');
    cardNamed('Second').querySelector('[data-action="delete"]').click();
    await wait(100);
    $('dialog [data-dialog-confirm]').click();
    await wait(250);
    check(cards().length === 2 && !cardNamed('Second'), 'e2e: confirm deletes');

    win.location.reload();
    await new Promise((r) => { f.onload = r; });
    await wait(900);
    check(cards().length === 2 && !cardNamed('Second'), 'e2e: delete persists after refresh');

    // Corrupt storage → app still loads gracefully
    localStorage.setItem(STORAGE_KEY, '{{{broken');
    win.location.reload();
    await new Promise((r) => { f.onload = r; });
    await wait(900);
    check($('.notice') && $('.empty-state'), 'e2e: corrupt storage shows notice instead of crashing');
    f.remove();
  } finally {
    // restore the real collection of whoever runs the tests
    if (backup == null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
    Object.keys(localStorage).filter((k) => k.startsWith(`${STORAGE_KEY}:backup-`)).forEach((k) => localStorage.removeItem(k));
  }
});

/* ====================================================================== */
/* 7. Actions + Interactive Playground                                     */
/* ====================================================================== */
await test('actions', async () => {
  const { a, c, center, destroy } = makeCharacter({}, { personality: 'happy', idle: false });
  const ends = [];
  c.el.addEventListener('character:actionend', (e) => ends.push(e.detail.name));

  a.perform('jump');
  const ys = await sample(a, 1100, (p) => p.y);
  check(Math.min(...ys) < -50, 'actions: jump leaves the ground', `min y=${Math.min(...ys).toFixed(1)}`);
  a.perform('spin');
  const rots = await sample(a, 1100, (p) => p.tilt);
  check(Math.max(...rots) > 300, 'actions: spin does a full turn');
  await wait(400);
  check(Math.abs(c.pose.tilt) < 2, 'actions: spin unwinds to upright (no reverse spin)', `tilt=${c.pose.tilt.toFixed(1)}`);
  a.perform('dance');
  const xs = await sample(a, 1500, (p) => p.x);
  check(Math.max(...xs) > 10 && Math.min(...xs) < -10, 'actions: dance sways side to side');
  a.perform('tickle');
  check(c.expression === 'excited', 'actions: personality-specific face (happy tickle → excited)');
  const tk = await sample(a, 600, (p) => p.tilt);
  check(Math.max(...tk) - Math.min(...tk) > 4, 'actions: tickle wiggles');
  await wait(900);
  check(ends.includes('jump') && ends.includes('spin') && ends.includes('tickle'), 'actions: actionend events fire');

  // Each action is unique: compare motion signatures
  const sig = {};
  for (const name of ['tickle', 'jump', 'spin', 'dance']) {
    a.perform(name);
    const v = await sample(a, 500, (p) => [p.x, p.y, p.tilt]);
    sig[name] = v.reduce((m, [x, y, t]) => [Math.max(m[0], Math.abs(x)), Math.min(m[1], y), Math.max(m[2], Math.abs(t))], [0, 0, 0]).map((n) => Math.round(n));
    a.cancelAction();
    await wait(400);
  }
  check(new Set(Object.values(sig).map(String)).size === 4, 'actions: each action has a distinct motion', JSON.stringify(sig));

  // Rapid / overlapping interactions
  const names = ['poke', 'tickle', 'jump', 'spin', 'dance', 'sleep', 'wake'];
  for (let i = 0; i < 60; i++) {
    a.perform(names[i % names.length]);
    if (i % 9 === 0) { pointer('pointerdown', c.el, ...center); pointer('pointerup', c.el, ...center); }
    await wait(25);
  }
  check(finitePose(c.pose), 'actions: rapid mixed actions keep pose finite');
  a.wake();
  await wait(3200);
  check(!a.action && Math.abs(c.pose.tilt) < 2 && Math.abs(c.pose.x) < 2 && Math.abs(c.pose.y) < 8 && Math.abs(c.pose.scaleY - 1) < 0.08,
    'actions: everything settles after rapid clicking', `tilt=${c.pose.tilt.toFixed(1)} x=${c.pose.x.toFixed(1)} y=${c.pose.y.toFixed(1)}`);

  // Grabbing cancels an action cleanly
  a.perform('dance');
  await wait(200);
  pointer('pointerdown', c.el, ...center);
  check(!a.action, 'actions: grabbing cancels the action');
  pointer('pointerup', c.el, ...center);
  await wait(300);

  // Reduced motion: faces still react, but no big movement
  a._mq = { matches: true };
  a._applyMotionPreference();
  a.perform('jump');
  const rmY = await sample(a, 1000, (p) => p.y);
  check(Math.min(...rmY) > -3, 'actions: reduced motion removes movement', `min y=${Math.min(...rmY).toFixed(1)}`);
  destroy();
});

await test('playground e2e', async () => {
  const KEYS = [STORAGE_KEY, 'character-lab:activity', 'character-lab:sound'];
  const backup = Object.fromEntries(KEYS.map((k) => [k, localStorage.getItem(k)]));
  const restore = () => KEYS.forEach((k) => (backup[k] == null ? localStorage.removeItem(k) : localStorage.setItem(k, backup[k])));
  KEYS.forEach((k) => localStorage.removeItem(k));
  const repo = createCharacterRepository();
  const pip = await repo.save(createCharacterConfig({ name: 'Pip', personality: 'curious', color: '#a2ccff', accessory: 'beanie' }));
  const zed = await repo.save(createCharacterConfig({ name: 'Zed', personality: 'sleepy', shape: 'squishy' }));
  try {
    const f = await loadApp('/playground?id=' + pip.id, 1280);
    const win = f.contentWindow;
    const $ = (s) => f.contentDocument.querySelector(s);
    const $$ = (s) => [...f.contentDocument.querySelectorAll(s)];
    const charEl = () => $('.playground__character .cl-char');
    const total = () => Number($('[data-total]')?.textContent);
    await wait(500);

    check($$('[data-select] option').length === 3, 'playground: lists saved characters + draft');
    check($('[data-nameplate]').textContent.includes('Pip') && charEl().dataset.personality === 'curious' && charEl().dataset.accessory === 'beanie',
      'playground: loads appearance, personality and name');

    const sel = $('[data-select]');
    sel.value = zed.id;
    sel.dispatchEvent(new Event('change'));
    await wait(300);
    check($('[data-nameplate]').textContent.includes('Zed') && charEl().dataset.personality === 'sleepy', 'playground: switching character');
    check($$('.playground__character .cl-char').length === 1, 'playground: one character instance reused');

    for (const [i, id] of ['poke', 'tickle', 'jump', 'spin', 'dance'].entries()) {
      $(`[data-perform="${id}"]`).click();
      await wait(120);
      check(total() === i + 1, `playground: ${id} counted`);
    }
    $('[data-perform="sleep"]').click();
    await wait(100);
    check($('[data-status]').textContent.includes('Sleeping') && total() === 6, 'playground: sleep + counted');
    $('[data-perform="wake"]').click();
    await wait(100);
    check($('[data-status]').textContent.includes('Awake') && total() === 7, 'playground: wake + counted');
    $('[data-perform="wake"]').click();
    check(total() === 7, 'playground: wake while awake is a no-op (not counted)');

    // Direct poke on the character counts exactly once
    const r = charEl().getBoundingClientRect();
    const P = (t) => charEl().dispatchEvent(new win.PointerEvent(t, { pointerId: 9, button: 0, clientX: r.left + r.width / 2, clientY: r.top + r.height * 0.6, bubbles: true }));
    P('pointerdown'); P('pointerup');
    await wait(50);
    check(total() === 8, 'playground: direct poke counted once');

    // Rapid clicking
    const before = total();
    const ids = ['poke', 'tickle', 'jump', 'spin', 'dance'];
    for (let i = 0; i < 50; i++) { $(`[data-perform="${ids[i % 5]}"]`).click(); await wait(10); }
    await wait(50);
    check(total() === before + 50, 'playground: rapid clicks all counted', `${total() - before}`);
    check($$('.particle').length <= 40, 'playground: particles capped', `${$$('.particle').length}`);
    check($$('.speech').length === 1, 'playground: one speech bubble at a time');
    await wait(3500);
    check(!/NaN|Infinity/.test(charEl().querySelector('.cl-char__motion').getAttribute('transform')), 'playground: transforms valid after rapid clicks');

    // Bubbles come from the personality's predefined lines
    const { REACTIONS } = await import('../js/data/reactions.js');
    let seen = '';
    for (let i = 0; i < 6 && !seen; i++) {
      await wait(1500);
      $('[data-perform="jump"]').click();
      await wait(50);
      if (!$('[data-bubble]').hidden) seen = $('[data-bubble]').textContent;
    }
    check(seen && Object.values(REACTIONS.sleepy).flat().includes(seen), 'playground: speech bubble from personality lines', seen);

    for (const scene of ['night', 'sunny', 'garden', 'studio']) {
      $(`[data-field="pg-scene"][data-value="${scene}"]`).click();
      check($('[data-stage]').dataset.scene === scene, `playground: scene ${scene}`);
    }

    check($('[data-sound]').getAttribute('aria-pressed') === 'false', 'playground: sound muted by default');
    $('[data-sound]').click();
    check($('[data-sound]').getAttribute('aria-pressed') === 'true' && localStorage.getItem('character-lab:sound') === 'on', 'playground: mute toggle + saved preference');
    $('[data-sound]').click();

    // Counter persists per character after reload
    const zedTotal = total();
    win.location.hash = '#/playground?id=' + zed.id;
    win.location.reload();
    await new Promise((res) => { f.onload = res; });
    await wait(1000);
    check(Number(f.contentDocument.querySelector('[data-total]').textContent) === zedTotal, 'playground: interaction counter persists per character');
    const s2 = f.contentDocument.querySelector('[data-select]');
    s2.value = pip.id;
    s2.dispatchEvent(new Event('change'));
    await wait(200);
    check(Number(f.contentDocument.querySelector('[data-total]').textContent) === 0, 'playground: counters are per character');
    f.remove();
  } finally {
    restore();
  }
});

/* ====================================================================== */
/* 8. Brand foundation: IA, navigation, layouts, i18n, homepage            */
/* ====================================================================== */
await test('brand & navigation', async () => {
  const { t, tl, setLocale, getLocale } = await import('../js/i18n/index.js');
  const en = (await import('../js/i18n/locales/en.js')).default;
  const ar = (await import('../js/i18n/locales/ar.js')).default;
  const { routes } = await import('../js/config/routes.js');

  // i18n basics
  check(t('home.hero.title') === 'Real Characters. Digital Possibilities.', 'i18n: English copy');
  check(t('footer.rights', { year: 2030 }).includes('2030'), 'i18n: interpolation');
  check(t('does.not.exist') === 'does.not.exist', 'i18n: missing key returns key');
  // every Arabic key must exist in English (no orphan keys)
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const enKeys = new Set(keys(en));
  const orphans = keys(ar).filter((k) => !enKeys.has(k));
  check(orphans.length === 0, 'i18n: Arabic keys mirror English structure', orphans.join(', '));
  await setLocale('ar', { persist: false, silent: true });
  check(document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar' && t('nav.packages') === 'الباقات', 'i18n: Arabic sets RTL + translates');
  check(Array.isArray(tl('home.offer.items')) && tl('home.offer.items').length === 7, 'i18n: Arabic lists available');
  await setLocale('en', { persist: false, silent: true });
  check(getLocale() === 'en' && document.documentElement.dir === 'ltr', 'i18n: back to English');

  // IA: all required pages exist
  const paths = routes.map((r) => r.path);
  const required = ['/', '/marketplace', '/business', '/creators', '/custom', '/integration', '/packages', '/ai-generation', '/contact', '/solutions', '/brief', '/request-integration',
    '/app', '/app/create', '/app/characters', '/app/personality'];
  check(required.every((p) => paths.includes(p)), 'IA: marketing + workspace routes defined', required.filter((p) => !paths.includes(p)).join(', '));

  // Homepage (desktop)
  const f = await loadApp('/', 1440);
  const doc = f.contentDocument;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  check(doc.body.dataset.layout === 'site' && getComputedStyle($('.site-header')).display !== 'none' && getComputedStyle($('.sidebar')).display === 'none', 'layout: homepage uses marketing layout');
  check($('h1').textContent === 'Real Characters. Digital Possibilities.', 'home: hero headline');
  const ctas = $$('.hero-b__copy a').map((a) => a.textContent.trim());
  check(['Explore Characters', 'Create a Custom Character', 'Talk to Our Team'].every((c) => ctas.includes(c)), 'home: hero CTAs (explore, custom, talk to team)', ctas.join(' | '));
  const h2s = $$('main h2').map((h) => h.textContent);
  for (const title of ['Who MIMIC Is For.', 'What MIMIC Provides.', 'Three Ways to Get Your Character.', 'Need Help Bringing Your Character Into Your Product?', 'What You Can Order.', 'Where Your Character Works.', 'How a Custom Request Works.', 'Available Now — and What’s Next.']) {
    check(h2s.includes(title), `home: section "${title}"`);
  }
  check($$('.audience-card').length === 2, 'home: business + creator segments');
  check($('[data-way="ai"] [data-availability="coming-soon"]') && $('[data-way="marketplace"] [data-availability="available"]') && $('[data-way="custom"] [data-availability="available"]'),
    'home: AI generation labeled Coming soon; marketplace & custom available');
  check($('a[href="#/request-integration"]') && $$('.int-path').length === 2, 'home: integration section with assets vs integration paths');
  check($$('.package-card').length === 4 && !/\$\d|SAR|EGP/.test($('.packages').textContent) && $$('.package-card a').every((a) => a.textContent === 'Get a Quote'),
    'home: 4 packages, no invented prices, Get a Quote');
  check($$('.talent-strip .cmedia--placeholder').length === 3 && $('.hero-talent__note'), 'home: realistic imagery slots are labeled placeholders');
  check(!$('main .cl-char'), 'home: no cartoon mascot rendering on marketing page');
  check(!/testimonial|trusted by|customers love|\d+%|\d+k\+/i.test($('main').textContent), 'home: no invented testimonials or metrics');
  check(!$('main').textContent.includes('within 24 hours'), 'home: no 24h promise while submission is not connected');
  check($$('.site-nav__link').length === 6 && $('.site-footer') && $$('.site-footer__link').length >= 10, 'header nav + footer links');
  check($('.site-footer').textContent.includes('Coming soon'), 'footer: AI generation marked Coming soon');
  {
    const theme = doc.documentElement.dataset.theme;
    const headerLogo = $('.site-header .logo');
    const img = headerLogo?.querySelector('img');
    check(img && img.getAttribute('src') === (theme === 'dark' ? 'assets/white_mimic.png' : 'assets/mimic.png') && img.alt === 'MIMIC', 'logo: header uses the theme-correct MIMIC PNG with alt text');
    check(headerLogo.getAttribute('href') === '#/' && headerLogo.getAttribute('aria-label'), 'logo: header logo links home with an accessible name');
    check(!headerLogo.querySelector('svg') && !$('.logo__word'), 'logo: no recreated text or symbol next to the wordmark');
    check($('.site-footer .logo img').getAttribute('src') === 'assets/white_mimic.png', 'logo: footer (dark surface) uses the white wordmark');
    check(img.complete && img.naturalWidth === 2172 && Math.abs(img.getBoundingClientRect().width / img.getBoundingClientRect().height - 3) < 0.02, 'logo: PNG loaded, proportions preserved (3:1)');
    check(f.contentWindow.getComputedStyle(img).filter === 'none', 'logo: no CSS filters applied');
  }

  // Navigate into the workspace → layout switches
  f.contentWindow.location.hash = '#/app';
  await wait(700);
  check(doc.body.dataset.layout === 'app' && getComputedStyle($('.sidebar')).display !== 'none' && getComputedStyle($('.site-header')).display === 'none', 'layout: workspace uses sidebar layout');
  check($('.app-nav__link[aria-current="page"]')?.dataset.path === '/app', 'nav: active workspace item');
  check($$('.app-nav__link').length === 9, 'nav: 8 workspace pages + Photo Booth (labs)');
  f.contentWindow.location.hash = '#/app/integration';
  await wait(600);
  check($('h1').textContent === 'Integration Preview' && $('.scaffold .badge').textContent === 'Coming soon', 'scaffold: planned workspace pages are clearly labeled');
  f.contentWindow.location.hash = '#/pricing';
  await wait(700);
  check(f.contentWindow.location.hash === '#/packages', 'redirect: /pricing → /packages');

  // Legacy redirects keep the query string
  f.contentWindow.location.hash = '#/create?new=1';
  await wait(800);
  check(doc.querySelector('.creator') && f.contentWindow.location.hash === '#/app/create', 'redirect: /create → /app/create (query handled)');
  f.contentWindow.location.hash = '#/playground';
  await wait(800);
  check(f.contentWindow.location.hash === '#/app/personality' && $('h1').textContent === 'Personality Studio', 'redirect: /playground → Personality Studio');
  f.remove();

  // Mobile drawer
  const m = await loadApp('/', 375);
  const md = m.contentDocument;
  const toggle = md.querySelector('.site-header [data-menu-open]');
  check(getComputedStyle(toggle).display !== 'none' && getComputedStyle(md.querySelector('.site-nav')).display === 'none', 'mobile: menu button replaces nav');
  toggle.click();
  await wait(350);
  check(!md.querySelector('#drawer').hidden && toggle.getAttribute('aria-expanded') === 'true' && md.querySelectorAll('#drawer .drawer-nav__link').length === 6, 'mobile: drawer opens with site nav');
  md.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await wait(350);
  check(md.querySelector('#drawer').hidden && toggle.getAttribute('aria-expanded') === 'false', 'mobile: Escape closes drawer');
  m.remove();

  // RTL preview: no overflow, mirrored header
  for (const width of [375, 1280]) {
    const r = await loadApp('/', width, '?lang=ar');
    const rd = r.contentDocument;
    await wait(300);
    const over = rd.documentElement.scrollWidth - rd.documentElement.clientWidth;
    check(rd.documentElement.dir === 'rtl' && over <= 0, `rtl: Arabic preview without overflow at ${width}px`, `${over}px`);
    if (width === 1280) {
      const logoX = rd.querySelector('.site-header .logo').getBoundingClientRect().left;
      check(logoX > width / 2, 'rtl: header mirrored (logo on the right)');
    }
    r.remove();
  }
});

/* ====================================================================== */
/* 9. Business flows: marketplace, brief wizard, integration, submission    */
/* ====================================================================== */
await test('lead service', async () => {
  const { submitLead } = await import('../js/services/lead-service.js');
  let called = false;
  const r = await submitLead('brief', { a: 1 }, [], { config: { submission: { endpoint: '' } }, fetchImpl: async () => { called = true; } });
  check(r.status === 'not-configured' && !called, 'lead: no endpoint → nothing sent, no fake success');
  const ok = await submitLead('brief', { a: 1 }, [], { config: { submission: { endpoint: 'https://example.test' } }, fetchImpl: async () => new Response('{"reference":"R1"}', { status: 201 }) });
  check(ok.status === 'sent' && ok.reference === 'R1', 'lead: 2xx → sent with reference');
  const bad = await submitLead('brief', {}, [], { config: { submission: { endpoint: 'https://example.test' } }, fetchImpl: async () => new Response('', { status: 500 }) });
  check(bad.status === 'error', 'lead: 5xx → error (not success)');
  const net = await submitLead('brief', {}, [], { config: { submission: { endpoint: 'https://example.test' } }, fetchImpl: async () => { throw new TypeError('offline'); } });
  check(net.status === 'error', 'lead: network failure → error');
});

await test('marketplace', async () => {
  const { CATALOG } = await import('../js/data/catalog.js');
  const f = await loadApp('/marketplace', 1280);
  const doc = f.contentDocument;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  check($$('.talent-card').length === CATALOG.length, 'market: all catalog characters listed');
  check($$('.talent-card .cmedia--placeholder').length === CATALOG.length && $('.notice').textContent.includes('placeholders'), 'market: placeholders clearly labeled');
  check(!doc.querySelector('main .cl-char'), 'market: no cartoon characters');
  $('[data-filter="presentation"][data-value="female"]').click();
  const women = CATALOG.filter((c) => c.presentation === 'female').length;
  check($$('.talent-card').length === women && $('[data-count]').textContent.startsWith(String(women)), 'market: filter by gender presentation');
  $('[data-filter="market"][data-value="egyptian"]').click();
  check($$('.talent-card').length === CATALOG.filter((c) => c.presentation === 'female' && c.market === 'egyptian').length, 'market: filters combine');
  $('[data-reset]').click();
  check($$('.talent-card').length === CATALOG.length, 'market: reset filters');
  $('[data-open="faisal"]').click();
  await wait(200);
  const dlg = $('dialog[open]');
  check(dlg && dlg.textContent.includes('You can adjust') && dlg.textContent.includes('Stays as designed'), 'market: detail shows customizable vs fixed');
  check(dlg.querySelectorAll('.pose-strip__item').length === 3 && dlg.textContent.includes('Commercial license'), 'market: detail shows poses + licensing info');
  check(!/\$\d|SAR|EGP|per month/i.test(dlg.textContent), 'market: no invented prices or license terms');
  check(dlg.textContent.includes('lip-sync'), 'market: honest about static images (no implied lip-sync)');
  check(dlg.querySelector('a[href="#/brief?character=faisal"]') && dlg.querySelector('a[href="#/request-integration?character=faisal"]'), 'market: Get Character Assets + Request Integration paths');
  dlg.querySelector('a[href="#/brief?character=faisal"]').click();
  await wait(900);
  check($('.wz-fixed')?.textContent.includes('Faisal'), 'brief: selected marketplace character carried over');
  check(![...doc.querySelectorAll('.wz-progress__step')].some((b) => b.textContent === 'Appearance'), 'brief: appearance step skipped for ready-made character');
  f.remove();
  localStorage.removeItem('character-lab:draft:custom-character');
});

await test('brief wizard e2e', async () => {
  localStorage.removeItem('character-lab:draft:custom-character');
  const f = await loadApp('/brief?segment=individual', 1280);
  const doc = f.contentDocument;
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];
  const next = async () => { $('[data-next]').click(); await wait(60); };
  const title = () => $('.wz-step__title').textContent;
  const pick = (q, v) => doc.querySelector(`.wz-option[data-q="${q}"][data-value="${v}"]`).click();
  const type = (field, value) => { const el = doc.querySelector(`[data-field="${field}"]`); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };

  check($('[data-demo-mode]'), 'brief: demo mode clearly shown when submission is not connected');
  check($('.wz-option[data-q="who"][data-value="individual"]').getAttribute('aria-checked') === 'true', 'brief: prefilled from segment');
  check($$('.wz-option[data-q="who"]').length === 5 && $('.wz-option[data-q="who"][data-value="__other"]'), 'brief: 4 customer types + Other');
  await next();
  check(title() === 'What do you need?', 'brief: step 2');
  await next();
  check(title() === 'What do you need?' && $('.wz-error'), 'brief: required selection blocks Next');
  pick('needs', 'avatar'); pick('needs', 'social'); pick('needs', '__other');
  await wait(30);
  check($('[data-field="needs__other"]'), 'brief: Other reveals a describe field');
  await next();
  check($('.wz-error') && title() === 'What do you need?', 'brief: Other requires a description');
  type('needs__other', 'A presenter for my cooking channel');
  await next();
  check(title() === 'Character appearance', 'brief: appearance step');
  pick('likeness', 'yes');
  await wait(30);
  check($('.wz-note')?.textContent.includes('not guaranteed to be an exact replica'), 'brief: likeness disclaimer shown');
  pick('gender', 'woman'); pick('age', '30s');
  await next();
  check(title() === 'Personality & communication', 'brief: personality step');
  check(!$('[data-q="dialect"]'), 'brief: dialect hidden until Arabic chosen');
  pick('language', 'both');
  await wait(30);
  check($('.wz-option[data-q="dialect"][data-value="egyptian"]'), 'brief: dialect independent of appearance, shown for Arabic');
  pick('dialect', 'egyptian'); pick('traits', 'friendly');
  await next();
  check(title() === 'Brand identity' && $('[data-field="characterName"]') && !$('[data-field="brandName"]'), 'brief: individual identity questions (not business)');
  check($('[data-field="likenessConsent"]'), 'brief: likeness permission required');
  await next();
  check(title() === 'Brand identity' && $('.wz-error'), 'brief: cannot continue without permission');
  const consent = $('[data-field="likenessConsent"]');
  consent.checked = true; consent.dispatchEvent(new Event('input', { bubbles: true }));
  type('characterName', 'Mona');
  await next();
  check(title() === 'Required deliverables', 'brief: deliverables step');
  pick('deliverables', 'png'); pick('deliverables', 'social');
  await next();
  check(title() === 'Integration requirements', 'brief: integration step');
  check($$('.wz-option[data-q="integration"]').length === 7, 'brief: 6 integration answers + Other');
  pick('integration', 'website');
  await wait(30);
  check($('.wz-option[data-q="webPlatform"]'), 'brief: platform follow-up for website');
  pick('webPlatform', 'Shopify');
  await next();
  check(title() === 'Project details', 'brief: project details');
  pick('timeline', '2-4w'); type('contactName', 'Mona A.'); type('email', 'not-an-email'); pick('contactMethod', 'whatsapp');
  await next();
  check($('.wz-error')?.textContent.includes('valid email'), 'brief: email validated');
  type('email', 'mona@example.com');
  await next();
  check(title() === 'Review your brief', 'brief: review step (9 of 9)');
  check($('.wz-progress__label').textContent === 'Step 9 of 9', 'brief: progress indicator');
  const doc1 = $('.wz-review__doc').textContent;
  check(['Individual / Content Creator', 'Personal Digital Avatar', 'A presenter for my cooking channel', 'Egyptian Arabic', 'Shopify', 'mona@example.com', 'Confirmed'].every((x) => doc1.includes(x)), 'brief: structured brief built from answers');
  check($('[data-summary]').textContent.includes('Mona'), 'brief: live summary');
  // edit a section
  $$('.wz-review__section [data-goto]')[1].click();
  await wait(60);
  check(title() === 'What do you need?', 'brief: edit jumps back to section');
  pick('needs', 'presenter');
  for (let i = 0; i < 8 && title() !== 'Review your brief'; i++) await next();
  check($('.wz-review__doc').textContent.includes('Video Presenter'), 'brief: edits reflected in review');
  type('finalNotes', 'Launch in March');
  $('[data-submit]').click();
  await wait(200);
  check($('[data-result="not-configured"]') && !$('[data-result="sent"]') && !doc.body.textContent.includes('Your Request Has Been Received'), 'brief: no fake success without backend');
  check($('[data-download]'), 'brief: working handoff (download brief)');
  // draft survives reload
  f.contentWindow.location.reload();
  await new Promise((r) => { f.onload = r; });
  await wait(900);
  check(f.contentDocument.querySelector('.wz-option[data-q="who"][data-value="individual"]')?.getAttribute('aria-checked') === 'true'
    && f.contentDocument.querySelector('[data-summary]').textContent.includes('Mona'), 'brief: draft restored after refresh');
  f.remove();
  localStorage.removeItem('character-lab:draft:custom-character');
});

await test('integration wizard + success', async () => {
  const { mountWizard } = await import('../js/ui/wizard.js');
  const { integrationSchema } = await import('../js/content/brief-integration.js');
  localStorage.removeItem('character-lab:draft:integration-test');
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:0;top:0;width:900px;background:#fff;z-index:9';
  document.body.appendChild(host);
  let captured = null;
  let status = 200;
  const schema = {
    ...integrationSchema,
    id: 'integration-test',
    deps: {
      config: { submission: { endpoint: 'https://example.test/leads', timeoutMs: 2000 } },
      fetchImpl: async (url, opts) => { captured = opts; return new Response(status < 300 ? '{"reference":"CL-TEST1"}' : '', { status }); },
    },
  };
  const w = mountWizard(host, schema, { query: new URLSearchParams('platform=chatbot') });
  const $ = (s) => host.querySelector(s);
  const next = async () => { $('[data-next]').click(); await wait(40); };
  const pick = (q, v) => host.querySelector(`.wz-option[data-q="${q}"][data-value="${v}"]`).click();
  const type = (field, value) => { const el = host.querySelector(`[data-field="${field}"]`); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };

  check($('.wz-option[data-q="platform"][data-value="chatbot"]').getAttribute('aria-checked') === 'true', 'integration: platform prefilled');
  check($('.wz-option[data-q="platform"][data-value="unsure"]').textContent.includes('help me choose'), 'integration: “I’m not sure — help me choose” option');
  pick('platform', 'unsure'); pick('existing', 'none');
  await next();
  pick('team', 'none'); // technology left empty on purpose
  await next();
  check($('.wz-step__title').textContent === 'How should the character behave?', 'integration: technical knowledge not required');
  pick('placement', 'unsure'); pick('scope', 'conversational');
  await wait(20);
  check($('.wz-note')?.textContent.includes('doesn’t automatically provide your AI model'), 'integration: AI backend disclaimer');
  await next();
  pick('characterSource', 'none');
  await next();
  pick('timeline', 'flexible'); type('contactName', 'Omar'); type('email', 'omar@company.com'); pick('contactMethod', 'email');
  const c = $('[data-field="contactConsent"]'); c.checked = true; c.dispatchEvent(new Event('input', { bubbles: true }));
  await next();
  check($('.wz-step__title').textContent === 'Review your request', 'integration: review');

  status = 500;
  $('[data-submit]').click();
  await wait(150);
  check($('[data-result="error"]') && $('[data-submit]').textContent.includes('Try again') && !$('[data-result="sent"]'), 'submit: server error → retry, not success');
  status = 200;
  $('[data-submit]').click();
  await wait(150);
  check($('[data-result="sent"] h2')?.textContent === 'Your Request Has Been Received', 'submit: confirmation after real delivery');
  check($('[data-result="sent"]').textContent.includes('within 24 hours') && $('[data-result="sent"]').textContent.includes('CL-TEST1'), 'submit: configurable 24h promise + reference');
  check($('.wz-timeline li.is-current')?.textContent.includes('Received'), 'submit: simple customer status');
  const payload = JSON.parse(captured.body.get('payload'));
  check(payload.type === 'integration' && payload.status === 'new' && payload.routeTo.includes('development'), 'request model: type, status=new, routed to development');
  check(payload.brief.includes('== Where should your character live? ==') && payload.brief.includes('I’m not sure — help me choose'), 'request model: human-readable brief for operations');
  check(localStorage.getItem('character-lab:draft:integration-test') === null, 'submit: draft cleared after success');
  w.destroy();
  host.remove();
});

await test('pages: packages, AI, integration, creators, contact', async () => {
  const f = await loadApp('/packages', 1280);
  const doc = f.contentDocument;
  const $ = (s) => doc.querySelector(s);
  const go = async (h) => { f.contentWindow.location.hash = h; await wait(800); };
  check(doc.querySelectorAll('.package-card').length === 4 && doc.querySelectorAll('.service-line').length === 4, 'packages: 4 packages + 4 separately scoped services');
  check([...doc.querySelectorAll('[data-availability]')].every((b) => b.dataset.availability === 'on-request'), 'packages: availability from config (on request)');
  $('a[href="#/brief?package=creator"]').click();
  await wait(900);
  check($('.wz-fixed')?.textContent.includes('Content Creator Package'), 'packages: Get a Quote pre-fills the brief');
  localStorage.removeItem('character-lab:draft:custom-character');

  await go('#/ai-generation');
  check($('[data-availability="coming-soon"]') && !doc.querySelector('main input, main textarea, main [type="file"]'), 'AI: coming soon, no fake generation UI');
  check($('.soon__alt a[href="#/brief"]')?.textContent.includes('Request a Custom Character'), 'AI: available alternative offered');

  await go('#/integration');
  check(doc.querySelectorAll('.int-area').length === 4 && $('main').textContent.includes('don’t automatically provide your AI model'), 'integration page: 4 areas + backend disclaimer');
  check($('.int-option') && $('.int-option--primary a').textContent === 'Request Integration', 'integration page: assets vs integrate paths');

  await go('#/creators');
  check($('main').textContent.includes('not guaranteed to be an exact replica') && $('main').textContent.includes('permission'), 'creators: likeness explained + permission');

  await go('#/contact');
  const form = $('#contact-form');
  form.requestSubmit();
  await wait(50);
  check(!$('[data-form-error]').hidden, 'contact: validates required fields');
  form.querySelector('#cf-name').value = 'Sara';
  form.querySelector('#cf-email').value = 'sara@example.com';
  form.querySelector('#cf-message').value = 'Pricing for an AI agent character';
  form.requestSubmit();
  await wait(150);
  check($('[data-result="not-configured"]') && !$('[data-result="sent"]'), 'contact: honest not-connected state');
  f.remove();
});

/* ====================================================================== */
/* 10. Themes, language switching, accessibility basics                     */
/* ====================================================================== */
const PREF_KEYS = ['character-lab:theme', 'character-lab:locale'];
const prefBackup = Object.fromEntries(PREF_KEYS.map((k) => [k, localStorage.getItem(k)]));
const restorePrefs = () => PREF_KEYS.forEach((k) => (prefBackup[k] == null ? localStorage.removeItem(k) : localStorage.setItem(k, prefBackup[k])));
const reloadFrame = async (f) => { f.contentWindow.location.reload(); await new Promise((r) => { f.onload = r; }); await wait(900); };

function contrast(fg, bg) {
  const lum = (c) => {
    const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v = v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

await test('theme system', async () => {
  try {
    const html = await (await fetch('../index.html')).text();
    check(html.indexOf("localStorage.getItem('character-lab:theme')") > -1 && html.indexOf("character-lab:theme") < html.indexOf('css/tokens.css'), 'theme: applied by inline head script before stylesheets (no flash)');

    localStorage.removeItem('character-lab:theme');
    let f = await loadApp('/', 1280);
    const sys = f.contentWindow.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    check(f.contentDocument.documentElement.dataset.theme === sys, 'theme: follows system preference when no choice saved', sys);
    f.remove();

    localStorage.setItem('character-lab:theme', 'dark');
    f = await loadApp('/', 1280);
    const doc = f.contentDocument;
    check(doc.documentElement.dataset.theme === 'dark', 'theme: saved dark preference applied on load');
    const toggle = doc.querySelector('.site-header [data-theme-toggle]');
    check(toggle.getAttribute('aria-pressed') === 'true' && toggle.getAttribute('aria-label'), 'theme: toggle exposes name + pressed state');
    const cs = (sel) => f.contentWindow.getComputedStyle(doc.querySelector(sel));
    const darkPairs = [
      ['body text', cs('body').color, cs('body').backgroundColor, 4.5],
      ['muted text', cs('.hero-b__lead').color, cs('body').backgroundColor, 4.5],
      ['primary button', cs('.hero-b__actions .btn--primary').color, cs('.hero-b__actions .btn--primary').backgroundColor, 4.5],
    ];
    check(doc.querySelector('.site-header .logo img').getAttribute('src') === 'assets/white_mimic.png', 'logo: dark theme shows white wordmark');
    toggle.click();
    await wait(400);
    check(doc.documentElement.dataset.theme === 'light' && localStorage.getItem('character-lab:theme') === 'light' && toggle.getAttribute('aria-pressed') === 'false', 'theme: toggle switches + persists explicit choice');
    check(doc.querySelector('.site-header .logo img').getAttribute('src') === 'assets/mimic.png' && doc.querySelector('.site-footer .logo img').getAttribute('src') === 'assets/white_mimic.png', 'logo: switches to dark wordmark in light theme (footer stays white)');
    const lightPairs = [
      ['body text', cs('body').color, cs('body').backgroundColor, 4.5],
      ['muted text', cs('.hero-b__lead').color, cs('body').backgroundColor, 4.5],
      ['primary button', cs('.hero-b__actions .btn--primary').color, cs('.hero-b__actions .btn--primary').backgroundColor, 4.5],
    ];
    for (const [mode, pairs] of [['dark', darkPairs], ['light', lightPairs]]) {
      for (const [name, fg, bg, min] of pairs) {
        const ratio = contrast(fg, bg);
        check(ratio >= min, `contrast (${mode}): ${name} ≥ ${min}:1`, `${ratio.toFixed(2)}:1`);
      }
    }
    await reloadFrame(f);
    check(f.contentDocument.documentElement.dataset.theme === 'light', 'theme: choice survives reload');
    f.remove();
  } finally {
    restorePrefs();
  }
});

await test('language switching', async () => {
  try {
    localStorage.removeItem('character-lab:locale');
    const f = await loadApp('/', 1280);
    let doc = f.contentDocument;
    const sw = doc.querySelector('.site-header [data-locale-switch]');
    check(sw && sw.getAttribute('lang') === 'ar' && sw.textContent.includes('العربية'), 'lang: switcher offers Arabic (with lang attribute)');
    sw.focus();
    sw.click();
    await wait(900);
    doc = f.contentDocument;
    check(doc.documentElement.lang === 'ar' && doc.documentElement.dir === 'rtl', 'lang: html lang/dir switch to ar/rtl');
    check(/[؀-ۿ]/.test(doc.querySelector('main h1').textContent), 'lang: page re-rendered in Arabic');
    check(localStorage.getItem('character-lab:locale') === 'ar', 'lang: preference saved');
    check(doc.activeElement?.matches('[data-locale-switch]'), 'lang: focus returns to the language switch');
    const latinWords = (doc.querySelector('main').textContent.match(/[A-Za-z]{3,}/g) || []).filter((w) => !['Character', 'Lab', 'PNG', 'WebP'].includes(w));
    check(latinWords.length <= 3, 'lang: Arabic homepage has no untranslated English copy', latinWords.slice(0, 10).join(' '));

    f.contentWindow.location.hash = '#/brief';
    await wait(900);
    check(doc.querySelector('.wz-step__title').textContent === 'عرّفنا عليك' && doc.querySelector('.wz-option[data-value="business"]').textContent.includes('شركة'), 'lang: wizard questions & options in Arabic');
    doc.querySelector('[data-next]').click();
    await wait(80);
    check(doc.querySelector('.wz-error')?.textContent.includes('اختر إجابة'), 'lang: validation messages in Arabic');
    check(doc.querySelector('[role="radiogroup"][aria-invalid="true"]'), 'a11y: invalid group marked aria-invalid');
    check(doc.querySelector('[data-next]').textContent.includes('التالي') && doc.querySelector('.wz-progress__label').textContent.includes('الخطوة'), 'lang: wizard controls in Arabic');

    f.contentWindow.location.hash = '#/marketplace';
    await wait(900);
    check(doc.querySelector('[data-filter="market"][data-value="saudi"]').textContent === 'بطابع سعودي' && /[؀-ۿ]/.test(doc.querySelector('.talent-card__name').textContent), 'lang: catalog filters + character names localized');

    await reloadFrame(f);
    doc = f.contentDocument;
    check(doc.documentElement.dir === 'rtl' && /[؀-ۿ]/.test(doc.querySelector('main h1').textContent), 'lang: Arabic persists after reload (no LTR flash: dir set in head)');
    doc.querySelector('.site-header [data-locale-switch]').click();
    await wait(900);
    check(f.contentDocument.documentElement.dir === 'ltr' && f.contentDocument.querySelector('main h1').textContent === 'Realistic Characters, Ready for Your Brand.', 'lang: switch back to English');
    localStorage.removeItem('character-lab:draft:custom-character');
    f.remove();
  } finally {
    restorePrefs();
  }
});

await test('accessibility basics', async () => {
  for (const route of ['/', '/marketplace', '/brief', '/request-integration', '/contact']) {
    const f = await loadApp(route, 1280);
    const doc = f.contentDocument;
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim();
    const unnamedButtons = [...doc.querySelectorAll('button, a[href]')].filter((el) => el.offsetParent !== null && !name(el));
    check(unnamedButtons.length === 0, `a11y ${route}: every visible button/link has an accessible name`, unnamedButtons.map((b) => b.outerHTML.slice(0, 60)).join(' | '));
    const fields = [...doc.querySelectorAll('main input:not([type="hidden"]), main select, main textarea')];
    const unlabeled = fields.filter((el) => !(el.id && doc.querySelector(`label[for="${el.id}"]`)) && !el.closest('label') && !el.getAttribute('aria-label'));
    check(unlabeled.length === 0, `a11y ${route}: every form field has a label`, unlabeled.map((e) => e.outerHTML.slice(0, 60)).join(' | '));
    check(doc.querySelectorAll('main h1').length === 1, `a11y ${route}: exactly one h1`);
    check([...doc.querySelectorAll('img')].every((i) => i.hasAttribute('alt')), `a11y ${route}: images have alt`);
    f.remove();
  }
  localStorage.removeItem('character-lab:draft:custom-character');
  localStorage.removeItem('character-lab:draft:integration');
});

await test('assets', async () => {
  const { assetReport } = await import('../js/services/asset-service.js');
  const { CATALOG } = await import('../js/data/catalog.js');
  const report = await assetReport();
  check(report.length === CATALOG.length && report.every((r) => r.missing.includes('main.webp')), 'assets: missing images detected and reported (none provided yet)');
  check(CATALOG.every((c) => c.market && c.presentation && c.style && c.useCases.length && c.poses.length && c.customization), 'assets: every character has explicit metadata');
});

/* ====================================================================== */
const failed = results.filter((r) => !r.ok).length;
const summary = document.getElementById('summary');
summary.textContent = `${results.length - failed}/${results.length} passed`;
summary.dataset.status = failed ? 'failed' : 'passed';
summary.className = failed ? 'fail' : 'pass';
