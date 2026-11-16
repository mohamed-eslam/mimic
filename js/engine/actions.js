/**
 * Performable actions (tickle, jump, spin, dance).
 *
 * Each action is a keyframe function of normalised time t (0→1) returning
 * additive offsets { x, y, rot, sx, sy }. The animator feeds these into
 * critically-damped "action" springs, so starting an action mid-way through
 * another (rapid clicking) blends instead of snapping.
 *
 * `amp` scales intensity (personality reaction × reduced-motion factor).
 */
const TAU = Math.PI * 2;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export const ACTIONS = {
  tickle: {
    label: 'Tickle',
    duration: 1100,
    face: 'happy',
    frame(t, amp) {
      const decay = 1 - t;
      const w = Math.sin(t * TAU * 9);
      return {
        x: Math.sin(t * TAU * 11) * 3 * amp * decay,
        rot: w * 7 * amp * decay,
        sy: 1 + w * 0.045 * amp * decay,
        sx: 1 - w * 0.035 * amp * decay,
      };
    },
  },

  jump: {
    label: 'Jump',
    duration: 1000,
    face: 'excited',
    frame(t, amp) {
      if (t < 0.18) { // anticipation crouch
        const u = Math.sin((t / 0.18) * (Math.PI / 2));
        return { sy: 1 - 0.2 * amp * u, sx: 1 + 0.15 * amp * u };
      }
      if (t < 0.78) { // airborne: stretch going up, squash coming down
        const u = (t - 0.18) / 0.6;
        const sy = 1 + 0.13 * amp * Math.cos(Math.PI * u);
        return { y: -95 * amp * Math.sin(Math.PI * u), sy, sx: 1 / Math.sqrt(sy) };
      }
      const u = (t - 0.78) / 0.22; // landing squash
      const s = Math.sin(Math.PI * u);
      return { sy: 1 - 0.16 * amp * s, sx: 1 + 0.12 * amp * s };
    },
  },

  spin: {
    label: 'Spin',
    duration: 950,
    face: 'surprised',
    // Rotation is not scaled by personality — a spin is always a full turn
    // (reduced motion passes amp 0 and the animator skips the turn).
    frame(t, amp) {
      const lift = Math.sin(Math.PI * t);
      return { rot: 360 * easeInOutCubic(t) * (amp > 0 ? 1 : 0), y: -26 * amp * lift, sy: 1 + 0.05 * amp * lift };
    },
    wrapRotation: true,
  },

  dance: {
    label: 'Dance',
    duration: 2600,
    face: 'happy',
    frame(t, amp) {
      const env = Math.min(1, t * 8, (1 - t) * 8);
      const sway = Math.sin(TAU * t * 2);
      const bop = Math.abs(Math.sin(Math.PI * t * 8));
      return {
        x: sway * 20 * amp * env,
        rot: sway * 10 * amp * env,
        y: -bop * 14 * amp * env,
        sy: 1 - 0.07 * amp * env * (1 - bop),
        sx: 1 + 0.05 * amp * env * (1 - bop),
      };
    },
  },
};

export const ACTION_NAMES = Object.keys(ACTIONS);
