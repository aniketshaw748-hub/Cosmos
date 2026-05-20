import * as THREE from 'three';

/** Global multiplier converting relative orbit speeds into radians/second. */
export const ORBIT_SPEED_SCALE = 0.12;

/** Global multiplier for self-rotation speed (spin speeds are real-relative). */
export const SPIN_SCALE = 0.3;

/** Largest per-frame delta we trust — guards against tab-refocus time jumps. */
export const MAX_DELTA = 0.1;

/** Degrees to radians. */
export function deg(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Position on a flat circular orbit (XZ plane) at the given angle. */
export function orbitPoint(
  radius: number,
  angle: number,
  target: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  return target.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}
