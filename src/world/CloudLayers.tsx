import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import bankUrl from '@/assets/textures/clouds/bank.webp?url';
import puffUrl from '@/assets/textures/clouds/puff.webp?url';
import smallUrl from '@/assets/textures/clouds/small.webp?url';
import towerUrl from '@/assets/textures/clouds/tower.webp?url';
import type { Vec3 } from '@/data/types';
import { FLY_IN_CLOUD, FLY_IN_CLOUD_BAND } from '@/data/world';

/**
 * The four painted clouds (AI-made, soft-edged by scripts/cloud-sprite.mjs). All share one
 * light: a warm, sunlit top over cool blue-grey shading. So a puff must never rotate, or
 * its shading would turn upside down; sprites stay upright.
 */
const KINDS = { puff: puffUrl, bank: bankUrl, small: smallUrl, tower: towerUrl } as const;
type Kind = keyof typeof KINDS;

/** Clouds drift along +X and wrap around past this distance, where fog hides the jump. */
const WRAP_X = 230;

const noHit = () => null;

/** Small deterministic random, so the sky looks the same on every load. */
function random(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Puff {
  kind: Kind;
  /** Where the bottom middle of the painted cloud sits, relative to its cluster. */
  position: Vec3;
  width: number;
  /** Multiplies the painting's colours: white keeps them, bluish makes far layers recede. */
  tint?: string;
}

interface CumulusProps {
  seed: number;
  /** The middle of the cluster's base. */
  position: Vec3;
  /** Overall size: width, height, depth. */
  size: Vec3;
  /** Units per second along +X. */
  drift?: number;
  /** The kinds to draw from: the first one makes the big middle cloud. */
  kinds?: Kind[];
  tint?: string;
}

/**
 * A cluster of painted clouds: one big one in the middle, smaller ones beside it, all
 * standing on roughly the same base, a little in front of and behind each other.
 */
function cumulus({ seed, size, kinds = ['puff', 'small', 'puff'], tint }: CumulusProps) {
  const [w, , d] = size;
  const rand = random(seed);
  const [main, ...rest] = kinds;
  const puffs: Puff[] = [{ kind: main!, position: [0, 0, 0], width: w * 0.62, tint }];
  const sides = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < sides; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    puffs.push({
      kind: rest[i % rest.length] ?? main!,
      position: [
        side * w * (0.22 + rand() * 0.16),
        -size[1] * 0.04 * rand(),
        (rand() - 0.5) * d * 0.6,
      ],
      width: w * (0.3 + rand() * 0.18),
      tint,
    });
  }
  return puffs;
}

/** A wide layer of flat cloud banks, scattered over an area. */
function cloudField(
  seed: number,
  centre: Vec3,
  half: [number, number],
  count: number,
  width: number,
  tint?: string,
) {
  const rand = random(seed);
  return Array.from({ length: count }, (): Puff => ({
    kind: rand() < 0.7 ? 'bank' : 'puff',
    position: [
      centre[0] + (rand() * 2 - 1) * half[0],
      centre[1] + (rand() - 0.5) * 4,
      centre[2] + (rand() * 2 - 1) * half[1],
    ],
    width: width * (0.7 + rand() * 0.6),
    tint,
  }));
}

/** Mid-level clouds between and behind the islands. */
const MID_CLOUDS: CumulusProps[] = [
  { seed: 11, position: [-62, -2, -48], size: [52, 18, 24] },
  { seed: 12, position: [58, 2, -58], size: [60, 22, 28], kinds: ['tower', 'puff', 'small'] },
  { seed: 13, position: [4, 8, -82], size: [72, 24, 32], kinds: ['puff', 'bank', 'small'] },
  // Low in front, under the islands' level, so they never cover one.
  { seed: 14, position: [-34, -30, 0], size: [30, 10, 16], kinds: ['small', 'small'] },
  { seed: 15, position: [34, -28, 4], size: [32, 11, 16], kinds: ['small', 'bank'] },
  { seed: 16, position: [-95, -8, -20], size: [56, 20, 28], kinds: ['tower', 'puff'] },
  { seed: 17, position: [100, -6, -24], size: [56, 20, 28] },
];

/** Big clouds near the horizon for depth. Fog softens them into the sky. */
const HORIZON_CLOUDS = (
  [
    { seed: 21, position: [-160, 0, -150], size: [140, 52, 60], kinds: ['tower', 'bank', 'puff'] },
    { seed: 22, position: [-20, 6, -210], size: [180, 60, 68], kinds: ['puff', 'tower', 'bank'] },
    { seed: 23, position: [150, -2, -170], size: [140, 48, 60], kinds: ['tower', 'puff', 'bank'] },
    { seed: 24, position: [-210, -8, -40], size: [120, 44, 60], kinds: ['bank', 'puff'] },
    { seed: 25, position: [215, -6, -60], size: [120, 44, 60], kinds: ['puff', 'bank'] },
  ] satisfies CumulusProps[]
).map((c): CumulusProps => ({ ...c, drift: 0.15 }));

/** The sea of clouds under the welcome view, beside the dense cloud on the dive path. */
const FLY_IN_BAND: CumulusProps[] = [
  {
    seed: 32,
    position: [-75, FLY_IN_CLOUD_BAND.y - 10, FLY_IN_CLOUD_BAND.z + 20],
    size: [90, 14, 50],
    kinds: ['bank', 'puff', 'bank'],
    drift: 0.1,
  },
  {
    seed: 33,
    position: [75, FLY_IN_CLOUD_BAND.y - 8, FLY_IN_CLOUD_BAND.z - 10],
    size: [90, 14, 50],
    kinds: ['bank', 'small', 'bank'],
    drift: 0.1,
  },
];

/**
 * The dense cloud on the dive path, which hides the islands until the camera bursts out:
 * many big puffs filling its volume, so the camera flies in among them.
 */
function diveCloud(): Puff[] {
  const rand = random(31);
  const [w, h, d] = FLY_IN_CLOUD.size;
  return Array.from({ length: 14 }, (_, i): Puff => ({
    kind: (['puff', 'bank', 'puff', 'small'] as const)[i % 4],
    position: [(rand() - 0.5) * w, (rand() - 0.7) * h * 0.8, (rand() - 0.5) * d],
    width: w * (0.45 + rand() * 0.35),
  }));
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

/** Sky-blue haze for the lowest layer, so it recedes behind the islands. */
const FLOOR_TINT = '#dce8f6';

/**
 * Painted cloud layers: 1. a floor of cloud banks far below the islands, 2. mid clouds
 * between them, 3. big clouds near the horizon, 4. the sea the welcome view looks over and
 * the dive falls through. Every cloud is an upright sprite with one of four paintings;
 * fog softens the far ones into the sky.
 */
export function CloudLayers() {
  const textures = useTexture(KINDS, (loaded) => {
    for (const t of Object.values(loaded)) t.colorSpace = THREE.SRGBColorSpace;
  });
  const aspect = (kind: Kind) => {
    const image = textures[kind].image as { width: number; height: number };
    return image.height / image.width;
  };

  const layers = useMemo(
    () => ({
      // Only behind the islands (z ≤ −20): painted clouds stand upright, so in front they
      // would rise between the overview camera and the islands as walls.
      floor: [
        ...cloudField(1, [0, -58, -110], [210, 90], 26, 80, FLOOR_TINT),
        ...cloudField(2, [0, -66, -120], [230, 100], 10, 110, FLOOR_TINT),
      ],
      dive: diveCloud(),
    }),
    [],
  );

  const draw = (puffs: Puff[]) =>
    puffs.map((p, i) => {
      const width = p.width;
      return (
        <sprite
          key={i}
          position={p.position}
          center={[0.5, 0]}
          scale={[width, width * aspect(p.kind), 1]}
          raycast={noHit}
        >
          <spriteMaterial
            map={textures[p.kind]}
            color={p.tint ?? '#ffffff'}
            transparent
            depthWrite={false}
          />
        </sprite>
      );
    });

  return (
    <group>
      {/* 1. Cloud floor: hides the void under the floating islands. */}
      <Drifting position={[0, 0, 0]} speed={0.02}>
        {draw(layers.floor)}
      </Drifting>

      {/* 2. Mid clouds and 3. horizon clouds */}
      {[...MID_CLOUDS, ...HORIZON_CLOUDS].map((c) => (
        <Drifting key={c.seed} position={c.position} speed={c.drift ?? 0.25}>
          {draw(cumulus(c))}
        </Drifting>
      ))}

      {/* 4. The sea the fly-in dives through. Behind the overview camera, so only the intro sees it. */}
      <group position={FLY_IN_CLOUD.position}>{draw(layers.dive)}</group>
      {FLY_IN_BAND.map((c) => (
        <Drifting key={c.seed} position={c.position} speed={c.drift ?? 0.1}>
          {draw(cumulus(c))}
        </Drifting>
      ))}
    </group>
  );
}
