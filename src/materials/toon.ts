import * as THREE from 'three';

/** Palette tokens from docs/plan/art-direction.md. */
export const colors = {
  skyTop: '#2E6FCF',
  skyHorizon: '#BFE7F7',
  skyBottom: '#D3ECF7',
  sun: '#FFF1D6',
  cloudLight: '#FFFDF6',
  cloudShadow: '#AFC3E6',
  grassLight: '#9BCB5A',
  grassDark: '#4E8B3A',
  rockLight: '#D8B98C',
  rockDark: '#8A6A52',
  wood: '#9C6B43',
  roofRed: '#C9573E',
  accentGold: '#F3C25B',
  outline: '#3A2E2A',
} as const;

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

const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap });

/** Shared materials. Use these instead of creating new materials in components. */
export const palette = {
  grass: toon(colors.grassLight),
  grassDark: toon(colors.grassDark),
  rock: toon(colors.rockLight),
  rockDark: toon(colors.rockDark),
  wood: toon(colors.wood),
  roof: toon(colors.roofRed),
  gold: toon(colors.accentGold),
} as const;

export type PaletteKey = keyof typeof palette;
