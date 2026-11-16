/**
 * Damped harmonic spring. Integrated with semi-implicit Euler at a fixed
 * small timestep by the animator, which keeps it stable (no jitter or
 * explosion) regardless of the display's frame rate.
 */
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 26, mass = 1 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  step(dt) {
    const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += (force / this.mass) * dt;
    this.value += this.velocity * dt;
    if (this.settled) {
      this.value = this.target;
      this.velocity = 0;
    }
  }

  get settled() {
    return Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-3;
  }

  /** Change stiffness/damping on the fly (e.g. "held" vs "released"). */
  configure({ stiffness = this.stiffness, damping = this.damping } = {}) {
    this.stiffness = stiffness;
    this.damping = damping;
    return this;
  }

  /** Damping ratio 1 → no overshoot. Used for reduced motion. */
  critical() {
    this.damping = 2 * Math.sqrt(this.stiffness * this.mass);
    return this;
  }

  snap(value = this.target) {
    this.value = this.target = value;
    this.velocity = 0;
  }
}
