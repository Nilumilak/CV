import { folder, useControls } from 'leva';
import { colors } from '@/materials/toon';
import { FOG } from '@/world/sky';

/**
 * Live tuning for the sky, fog and light. The panel only shows with ?debug.
 * When a look is right, copy the values into materials/toon.ts and world/sky.ts.
 */
export function useWorldControls() {
  return useControls({
    Sky: folder(
      {
        top: colors.skyTop,
        horizon: colors.skyHorizon,
        bottom: colors.skyBottom,
        exponent: { value: 3.2, min: 1, max: 8, step: 0.1 },
      },
      { collapsed: true },
    ),
    Fog: folder(
      {
        fogNear: { value: FOG.near, min: 0, max: 300, step: 5 },
        fogFar: { value: FOG.far, min: 100, max: 800, step: 10 },
      },
      { collapsed: true },
    ),
    Light: folder(
      {
        sunIntensity: { value: 2.4, min: 0, max: 6, step: 0.1 },
        skyIntensity: { value: 1.1, min: 0, max: 3, step: 0.05 },
      },
      { collapsed: true },
    ),
  });
}
