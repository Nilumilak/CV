import { colors } from '@/materials/toon';
import { SUN_DIRECTION } from './sky';

interface LightingProps {
  sunIntensity?: number;
  skyIntensity?: number;
}

const SUN_DISTANCE = 100;
const sunPosition = SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE).toArray();

/**
 * Warm sun from the same direction as the sun in the sky, plus a hemisphere fill:
 * sky-blue from above tints shadows cool, warm rock colour from below.
 * Shadows stay off until Phase 6 turns them on for the focused island only.
 */
export function Lighting({ sunIntensity = 2.4, skyIntensity = 1.1 }: LightingProps) {
  return (
    <>
      <hemisphereLight args={[colors.skyHorizon, colors.rockDark, skyIntensity]} />
      <directionalLight position={sunPosition} intensity={sunIntensity} color={colors.sun} />
    </>
  );
}
