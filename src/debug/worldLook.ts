import { create } from 'zustand';
import { colors } from '@/materials/toon';
import { FOG } from '@/world/sky';

/**
 * The sky, fog and light settings the scene renders with. Visitors always get these values;
 * with ?debug, the tuning panel (DebugControls) writes live changes into this store.
 * When a look is right, copy the values into materials/toon.ts and world/sky.ts.
 */
export interface WorldLook {
  top: string;
  horizon: string;
  bottom: string;
  exponent: number;
  fogNear: number;
  fogFar: number;
  sunIntensity: number;
  skyIntensity: number;
}

export const WORLD_LOOK: WorldLook = {
  top: colors.skyTop,
  horizon: colors.skyHorizon,
  bottom: colors.skyBottom,
  exponent: 3.2,
  fogNear: FOG.near,
  fogFar: FOG.far,
  sunIntensity: 2.4,
  skyIntensity: 1.1,
};

export const useWorldLook = create<WorldLook>(() => WORLD_LOOK);
