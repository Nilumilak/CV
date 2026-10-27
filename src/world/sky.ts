import * as THREE from 'three';

/**
 * Sun direction shared by the sky shader and the directional light.
 * High and to the left, slightly towards the viewer, so islands show a lit side
 * from the overview camera and the sun is visible when looking left.
 */
export const SUN_DIRECTION = new THREE.Vector3(-0.62, 0.55, 0.35).normalize();

/** Fog starts and ends in world units from the camera. */
export const FOG = { near: 60, far: 280 } as const;
