import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds } from '@react-three/drei';
import * as THREE from 'three';
import type { Vec3 } from '@/data/types';
import { colors } from '@/materials/toon';
import { createCloudTextureUrl } from './cloudTexture';

/** Clouds drift along +X and wrap around past this distance, where fog hides the jump. */
const WRAP_X = 230;

interface CumulusProps {
  seed: number;
  position: Vec3;
  /** Overall size: width, height, depth. */
  size: Vec3;
  segments?: number;
  /** Units per second along +X. */
  drift?: number;
}

/**
 * One Ghibli-style cumulus: a bright, puffy top over a flatter, cool-blue base.
 * Cloud puffs always face the camera, so lighting cannot shade them top to bottom.
 * Two stacked layers with different colours give that look instead.
 */
function Cumulus({ seed, position, size, segments = 8, drift = 0.25 }: CumulusProps) {
  const [w, h, d] = size;
  // drei spreads puffs over ±bounds, so bounds are half-sizes.
  // Puff diameter is about 0.7 × volume, so volume ≈ height makes neighbours overlap.
  const volume = h * 1.15;
  return (
    <Drifting position={position} speed={drift}>
      {/* Cool base: narrower, flatter, lower and a little behind, so only its bottom edge shows. */}
      <Cloud
        seed={seed}
        segments={Math.max(3, Math.round(segments * 0.45))}
        bounds={[w * 0.3, h * 0.06, d * 0.2]}
        volume={volume * 0.95}
        smallestVolume={0.75}
        position={[0, -h * 0.32, -d * 0.12]}
        color={colors.cloudShadow}
        speed={0.03}
        growth={1}
        fade={30}
      />
      {/* Bright, puffy top. */}
      <Cloud
        seed={seed + 100}
        segments={segments}
        bounds={[w * 0.36, h * 0.22, d * 0.25]}
        volume={volume}
        smallestVolume={0.6}
        position={[0, h * 0.05, 0]}
        color={colors.cloudLight}
        speed={0.05}
        growth={1.5}
        fade={30}
      />
    </Drifting>
  );
}

function Drifting({
  position,
  speed,
  children,
}: {
  position: Vec3;
  speed: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    const g = ref.current;
    g.position.x += speed * delta;
    if (g.position.x > WRAP_X) g.position.x -= WRAP_X * 2;
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/** Mid-level clouds between and behind the islands. */
const MID_CLOUDS: CumulusProps[] = [
  { seed: 11, position: [-62, 6, -48], size: [52, 18, 24] },
  { seed: 12, position: [58, 12, -58], size: [60, 22, 28] },
  { seed: 13, position: [4, 20, -82], size: [72, 24, 32] },
  { seed: 14, position: [-30, -14, 2], size: [36, 12, 20], segments: 6 },
  { seed: 15, position: [30, -12, 8], size: [40, 14, 20], segments: 6 },
  { seed: 16, position: [-95, 2, -20], size: [56, 20, 28] },
  { seed: 17, position: [100, 4, -24], size: [56, 20, 28] },
];

/** Big clouds near the horizon for depth. Fog softens them into the sky. */
const HORIZON_CLOUDS: CumulusProps[] = [
  { seed: 21, position: [-160, 24, -150], size: [140, 52, 60], segments: 11, drift: 0.15 },
  { seed: 22, position: [-20, 34, -210], size: [180, 60, 68], segments: 12, drift: 0.15 },
  { seed: 23, position: [150, 20, -170], size: [140, 48, 60], segments: 11, drift: 0.15 },
  { seed: 24, position: [-210, 14, -40], size: [120, 44, 60], segments: 10, drift: 0.15 },
  { seed: 25, position: [215, 16, -60], size: [120, 44, 60], segments: 10, drift: 0.15 },
];

/**
 * All clouds share one <Clouds> parent, so they render as a single instanced draw call.
 * Overdraw is the main cost: every puff is a large transparent quad. Keep the total under ~220.
 * Layers: 1. floor far below the islands, 2. mid clouds, 3. horizon clouds.
 * Fly-in wisps are added in Phase 3.
 */
export function CloudLayers() {
  const texture = useMemo(() => createCloudTextureUrl(), []);
  return (
    <Clouds texture={texture} material={THREE.MeshBasicMaterial} limit={260} frustumCulled={false}>
      {/* 1. Cloud floor: hides the void under the floating islands. */}
      <Cloud
        seed={1}
        position={[0, -46, -30]}
        bounds={[200, 4, 150]}
        segments={30}
        volume={80}
        smallestVolume={0.75}
        color={colors.cloudLight}
        speed={0.02}
        growth={4}
        fade={60}
      />
      <Cloud
        seed={2}
        position={[0, -54, -30]}
        bounds={[220, 3, 160]}
        segments={12}
        volume={90}
        smallestVolume={0.8}
        color={colors.cloudShadow}
        speed={0.02}
        fade={60}
      />

      {/* 2. Mid clouds */}
      {MID_CLOUDS.map((c) => (
        <Cumulus key={c.seed} {...c} />
      ))}

      {/* 3. Horizon clouds */}
      {HORIZON_CLOUDS.map((c) => (
        <Cumulus key={c.seed} {...c} />
      ))}
    </Clouds>
  );
}
