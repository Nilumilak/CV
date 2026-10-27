import * as THREE from 'three';

/** Stepped gradient for MeshToonMaterial. Each value is one light band (0 to 255). */
export function createGradientMap(steps: number[] = [110, 190, 255]) {
  const tex = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const gradientMap = createGradientMap();
