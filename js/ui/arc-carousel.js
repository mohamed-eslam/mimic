/**
 * Arc carousel — a row of tall character cards on the inside of a cylinder.
 *
 * Geometry (frame units; desktop frame 1440 wide, phones 640):
 *   centre Cx = F/2, normaliser R = F/2 − 14
 *   cards sit on a 196u pitch; each centre is pushed outward: x = Cx + t·(1 + 0.083·(t/R)²)
 *   d = |x − Cx| / R → width = 170 + 48·d²,  vertical centre = Yc − 12·d²
 *   each vertical edge has its own height: h = 280 + 92·q^2.6 (q = that edge's distance)
 *   → upright 170×280 cards in the middle, taller leaning cards at the edges.
 * Each card is drawn as a rounded quad (clip-path: path()) recomputed every frame.
 *
 * Motion: slow time-based drift (50u/s), drag 1:1 with pointer/touch, momentum after
 * release (velocity decays ~95%/s). Drift pauses while a card is hovered or focused,
 * when off-screen, when the tab is hidden, or via the pause button (WCAG 2.2.2).
 * Reduced motion: no drift (dragging still works). Focusing a card glides it to centre.
 */
import { prefersReducedMotion } from '../core/dom.js';
import { t } from '../i18n/index.js';

const PITCH = 196;
const SPEED = 50;       // units / second
const DECAY = 0.05;     // velocity keeps 5% per second (≈95% decay)
const RADIUS = 15;      // corner radius (units)

/** Rounded polygon path (px) through the given points. */
function roundedPath(pts, r) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[(i - 1 + n) % n], v = pts[i], q = pts[(i + 1) % n];
    const toward = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1]; const len = Math.hypot(dx, dy) || 1; const k = Math.min(r, len / 2) / len; return [b[0] + dx * k, b[1] + dy * k]; };
    const a = toward(p, v), b = toward(q, v);
    d += `${i ? 'L' : 'M'}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${v[0].toFixed(1)},${v[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} `;
  }
  return `${d}Z`;
}

export function mountArcCarousel(root) {
  const arc = root.querySelector('[data-arc]');
  if (!arc) return () => {};
  const track = arc.querySelector('[data-arc-track]');
  const cards = [...arc.querySelectorAll('[data-arc-card]')];
  const toggle = arc.parentElement?.querySelector('[data-arc-toggle]'); // sits in its own row under the band
  const N = cards.length;
  const SPAN = N * PITCH;
  const reduce = prefersReducedMotion();

  let F = 1440, u = 1, Yc = 200, offset = 0, velocity = 0;
  let userPaused = reduce, hovering = 0, focused = false, onScreen = true, target = null;
  let drag = null, suppressClick = false, raf = 0, last = performance.now();
  const dir = () => (document.documentElement.dir === 'rtl' ? 1 : -1); // drift toward reading start

  function measure() {
    const w = arc.clientWidth;
    F = w <= 820 ? 640 : 1440;
    u = w / F;
    const h = arc.clientHeight;
    Yc = h / u / 2 + 6;
  }

  function layout() {
    const Cx = F / 2, R = F / 2 - 14;
    cards.forEach((card, i) => {
      let tt = ((i * PITCH + offset) % SPAN + SPAN) % SPAN - SPAN / 2;
      const x = Cx + tt * (1 + 0.083 * (tt / R) ** 2);
      const d = Math.min(Math.abs(x - Cx) / R, 1); // beyond the frame edge the curve stops growing
      const w = 170 + 48 * d * d;
      const xl = x - w / 2, xr = x + w / 2;
      const ql = Math.min(Math.abs(xl - Cx) / R, 1), qr = Math.min(Math.abs(xr - Cx) / R, 1);
      const hl = 280 + 92 * ql ** 2.6, hr = 280 + 92 * qr ** 2.6;
      const H = Math.max(hl, hr), yc = Yc - 12 * d * d;
      const P = (ux, uy) => [ux * u, uy * u];
      const pts = [P(0, (H - hl) / 2), P(w, (H - hr) / 2), P(w, (H + hr) / 2), P(0, (H + hl) / 2)];
      // Off-screen cards stay focusable (keyboard reaches every character); the band clips them.
      card.style.width = `${w * u}px`;
      card.style.height = `${H * u}px`;
      card.style.transform = `translate3d(${xl * u}px, ${(yc - H / 2) * u}px, 0)`;
      card.style.clipPath = `path('${roundedPath(pts, RADIUS * u)}')`;
      card.style.zIndex = String(100 - Math.round(d * 50));
      card.dataset.t = tt.toFixed(1);
    });
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (target !== null) {                        // glide a focused card to the centre
      const step = (target - offset) * Math.min(1, dt * 6);
      offset += step;
      if (Math.abs(target - offset) < 0.5) { offset = target; target = null; }
    } else if (!drag) {
      if (velocity) {
        offset += velocity * dt;
        velocity *= DECAY ** dt;
        if (Math.abs(velocity) < 2) velocity = 0;
      } else if (!userPaused && !hovering && !focused && onScreen) {
        offset += dir() * SPEED * dt;
      }
    }
    layout();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Drag / fling ---------- */
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('[data-arc-toggle]')) return;
    drag = { x: e.clientX, last: e.clientX, t: performance.now(), moved: 0, id: e.pointerId };
    velocity = 0; target = null;
    arc.classList.add('is-dragging');
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.last;
    const now = performance.now();
    const du = dx / u;
    offset += du;
    const dt = Math.max((now - drag.t) / 1000, 0.001);
    velocity = 0.8 * (du / dt) + 0.2 * velocity;
    drag.last = e.clientX; drag.t = now; drag.moved += Math.abs(dx);
    if (drag.moved > 6 && !track.hasPointerCapture?.(e.pointerId)) track.setPointerCapture?.(e.pointerId);
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    suppressClick = drag.moved > 6;
    if (performance.now() - drag.t > 80) velocity = 0; // held still before release → no fling
    if (reduce) velocity = 0;
    drag = null;
    arc.classList.remove('is-dragging');
    track.releasePointerCapture?.(e.pointerId);
  };
  const onClick = (e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; } };

  /* ---------- Pauses ---------- */
  const enter = (e) => { if (e.pointerType === 'mouse' && e.target.closest('[data-arc-card]')) hovering = 1; };
  const leave = (e) => { if (e.pointerType === 'mouse' && !e.relatedTarget?.closest?.('[data-arc-card]')) hovering = 0; };
  const onFocusIn = (e) => {
    const card = e.target.closest('[data-arc-card]');
    if (!card || drag) return;
    focused = true;
    // Keyboard focus only: glide the card to the centre. (A mouse press also focuses the
    // link — gliding then would fight the drag.)
    if (card.matches(':focus-visible')) target = offset - parseFloat(card.dataset.t || '0');
  };
  const onFocusOut = (e) => { if (!arc.contains(e.relatedTarget)) focused = false; };
  const syncToggle = () => {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? t('media.playCarousel') : t('media.pauseCarousel'));
    toggle.classList.toggle('is-paused', userPaused);
  };
  const onToggle = () => { userPaused = !userPaused; syncToggle(); };

  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0 });
  const ro = new ResizeObserver(() => { measure(); layout(); });
  const onVis = () => { last = performance.now(); };

  measure(); layout(); syncToggle();
  arc.classList.add('is-ready');
  io.observe(arc); ro.observe(arc);
  track.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  track.addEventListener('click', onClick, true);
  track.addEventListener('pointerover', enter);
  track.addEventListener('pointerout', leave);
  arc.addEventListener('focusin', onFocusIn);
  arc.addEventListener('focusout', onFocusOut);
  toggle?.addEventListener('click', onToggle);
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame((n) => { last = n; frame(n); });

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect();
    track.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    track.removeEventListener('click', onClick, true);
    track.removeEventListener('pointerover', enter);
    track.removeEventListener('pointerout', leave);
    arc.removeEventListener('focusin', onFocusIn);
    arc.removeEventListener('focusout', onFocusOut);
    toggle?.removeEventListener('click', onToggle);
    document.removeEventListener('visibilitychange', onVis);
  };
}
