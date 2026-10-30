import { useEffect } from 'react';
import { folder, Leva, useControls } from 'leva';
import { useWorldLook, WORLD_LOOK } from './worldLook';

/**
 * Live tuning for the sky, fog and light, shown only with ?debug. Loaded lazily, so the
 * panel's library never reaches visitors.
 */
export default function DebugControls() {
  const look = useControls({
    Sky: folder(
      {
        top: WORLD_LOOK.top,
        horizon: WORLD_LOOK.horizon,
        bottom: WORLD_LOOK.bottom,
        exponent: { value: WORLD_LOOK.exponent, min: 1, max: 8, step: 0.1 },
      },
      { collapsed: true },
    ),
    Fog: folder(
      {
        fogNear: { value: WORLD_LOOK.fogNear, min: 0, max: 300, step: 5 },
        fogFar: { value: WORLD_LOOK.fogFar, min: 100, max: 800, step: 10 },
      },
      { collapsed: true },
    ),
    Light: folder(
      {
        sunIntensity: { value: WORLD_LOOK.sunIntensity, min: 0, max: 6, step: 0.1 },
        skyIntensity: { value: WORLD_LOOK.skyIntensity, min: 0, max: 3, step: 0.05 },
      },
      { collapsed: true },
    ),
  });
  useEffect(() => useWorldLook.setState(look), [look]);
  return <Leva collapsed />;
}
