/**
 * Body geometry. Every shape is a ring of POINT_COUNT points generated from
 * a polar radius function, so any two shapes can be morphed point-to-point
 * and the animator can deform the outline organically at runtime.
 *
 * Coordinate space: the character's SVG viewBox. The body rests on GROUND.
 */

export const VIEW = { x: -30, y: -50, w: 300, h: 300, cx: 120, ground: 214 };
export const POINT_COUNT = 28;

const TAU = Math.PI * 2;
// angle 0 = right, positive = clockwise on screen (y points down), so sin(t) > 0 is the bottom half
const ANGLES = Array.from({ length: POINT_COUNT }, (_, i) => (i / POINT_COUNT) * TAU - Math.PI / 2);

export const SHAPES = {
  round: {
    label: 'Round',
    R: 86,
    sx: 1,
    sy: 0.97,
    // a touch heavier at the bottom so it reads as sitting, not floating
    radius: (t) => 1 + 0.035 * Math.sin(t),
    flatten: 6,
  },
  blob: {
    label: 'Organic Blob',
    R: 86,
    sx: 1.03,
    sy: 0.99,
    radius: (t) =>
      1 + 0.062 * Math.cos(3 * t + 0.55) + 0.04 * Math.cos(2 * t - 1.2) + 0.035 * Math.sin(t) + 0.02 * Math.cos(5 * t + 2),
    flatten: 10,
  },
  squishy: {
    label: 'Squishy',
    R: 88,
    sx: 1.22,
    sy: 0.78,
    // dumpling: wide, low, with a soft flat seat
    radius: (t) => 1 + 0.06 * Math.sin(t) - 0.035 * Math.cos(2 * t),
    flatten: 22,
  },
};

export const SHAPE_NAMES = Object.keys(SHAPES);

/**
 * Build a shape's resting geometry.
 * width/height are proportion multipliers (1 = default).
 * @returns {{points:number[][], angles:number[], bounds, center:number[], face:{x,y,scale}}}
 */
export function buildShape(name, { width = 1, height = 1 } = {}) {
  const def = SHAPES[name] ?? SHAPES.round;
  let pts = ANGLES.map((t) => {
    const r = def.R * def.radius(t);
    return [Math.cos(t) * r * def.sx * width, Math.sin(t) * r * def.sy * height];
  });

  // Soft-flatten the underside so the body sits on the floor (smooth, no corners)
  const maxY0 = Math.max(...pts.map((p) => p[1]));
  if (def.flatten > 0) {
    const k = def.flatten * height;
    const band = maxY0 - k * 1.6;
    pts = pts.map(([x, y]) => [x, y > band ? band + k * Math.tanh((y - band) / k) : y]);
  }

  // Rest the body on the ground line, centered horizontally
  const maxY = Math.max(...pts.map((p) => p[1]));
  const offY = VIEW.ground - maxY;
  pts = pts.map(([x, y]) => [VIEW.cx + x, y + offY]);

  return withMeta(pts);
}

function withMeta(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  return {
    points,
    angles: ANGLES,
    bounds,
    center: [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2],
    face: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: bounds.minY + h * 0.5,
      scale: Math.min(1.15, Math.max(0.82, Math.sqrt(w * h) / 172)),
    },
  };
}

/** Interpolate two built shapes (same point count). */
export function lerpShape(a, b, t) {
  const points = a.points.map((p, i) => [p[0] + (b.points[i][0] - p[0]) * t, p[1] + (b.points[i][1] - p[1]) * t]);
  return withMeta(points);
}

/**
 * Apply a gentle radial "jelly" deformation for organic idle movement.
 * The underside is weighted down so the character stays planted.
 */
export function wobblePoints(shape, amp, time) {
  if (amp <= 0.0001) return shape.points;
  const [cx, cy] = shape.center;
  return shape.points.map(([x, y], i) => {
    const t = shape.angles[i];
    const weight = 1 - 0.85 * Math.max(0, Math.sin(t));
    const d = 1 + amp * weight * (0.6 * Math.sin(2 * t + time * 1.7) + 0.4 * Math.sin(3 * t - time * 1.1));
    return [cx + (x - cx) * d, cy + (y - cy) * d];
  });
}

/** Closed Catmull-Rom spline → smooth cubic Bézier path. */
export function pathFromPoints(points) {
  const n = points.length;
  const f = (v) => Math.round(v * 100) / 100;
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}
