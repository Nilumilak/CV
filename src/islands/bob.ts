import type * as THREE from 'three';

/** How far an island rises and sinks, in island units. */
const BOB_HEIGHT = 0.45;
/** Radians per second: one full rise and fall takes about 18 seconds. */
const BOB_SPEED = 0.35;
/** Peak tilt that goes with the bob, in radians. */
const BOB_TILT = 0.012;

/**
 * Sets an island's slow float at a moment in time. Each island starts at its own point of
 * the wave (from its seed), so they never move in unison. Shared by the islands and by
 * the cable route, whose posts must move with them.
 */
export function applyBob(target: THREE.Object3D, seed: number, time: number) {
  const t = time * BOB_SPEED + seed * 2.4;
  target.position.y = Math.sin(t) * BOB_HEIGHT;
  // A faint sway that lags the bob, like something floating on air.
  target.rotation.x = Math.sin(t - 0.8) * BOB_TILT;
  target.rotation.z = Math.cos(t * 0.7) * BOB_TILT;
}
