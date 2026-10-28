import { useMemo } from 'react';
import * as THREE from 'three';
import type { IslandId } from '@/data/types';
import { palette } from '@/materials/toon';

const ROCK_RADIUS = 5;
const ROCK_DEPTH = 7;

/**
 * Upside-down rocky cone with a flat top at y = 0.
 * Vertices are displaced by a function of their position, not a random number per vertex:
 * cone geometry repeats vertices along its seam, and per-vertex randomness would tear it open.
 */
function useRockGeometry(seed: number) {
  return useMemo(() => {
    const geo = new THREE.ConeGeometry(ROCK_RADIUS, ROCK_DEPTH, 28, 10);
    geo.rotateX(Math.PI); // tip points down
    geo.translate(0, -ROCK_DEPTH / 2, 0); // flat top at y = 0
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      if (y > -0.01) continue; // keep the top rim clean
      const n =
        Math.sin(x * 1.3 + seed) * Math.cos(z * 1.7 + seed * 2) + Math.sin(y * 2.1 + seed * 0.5);
      const k = 1 + n * 0.13;
      p.setXYZ(i, x * k, y, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }, [seed]);
}

/** Simple shapes that hint at each island's theme until real art arrives in Phase 4. */
function ThemeHint({ id }: { id: IslandId }) {
  switch (id) {
    case 'home':
      return (
        <group>
          <mesh position={[1.2, 1, 0.8]} material={palette.wood}>
            <boxGeometry args={[2.4, 2, 2]} />
          </mesh>
          <mesh position={[1.2, 2.6, 0.8]} rotation-y={Math.PI / 4} material={palette.roof}>
            <coneGeometry args={[2.1, 1.3, 4]} />
          </mesh>
          <Tree position={[-2, 0, -1]} scale={1.6} />
        </group>
      );
    case 'workshop':
      return (
        <group>
          <mesh position={[0, 1.2, 0]} material={palette.roof}>
            <boxGeometry args={[3.6, 2.4, 2.4]} />
          </mesh>
          {[-1, 0.8].map((x) => (
            <mesh key={x} position={[x, 3.4, -0.6]} material={palette.rockDark}>
              <cylinderGeometry args={[0.3, 0.35, 2.2, 10]} />
            </mesh>
          ))}
          <mesh position={[2.4, 1.6, 1.3]} rotation-y={Math.PI / 2} material={palette.gold}>
            <torusGeometry args={[1, 0.3, 8, 12]} />
          </mesh>
        </group>
      );
    case 'grove':
      return (
        <group>
          <Tree position={[0, 0, 0]} scale={2.2} />
          <Tree position={[2.6, 0, 1.4]} scale={1.1} />
          <Tree position={[-2.4, 0, 1.6]} scale={1.2} />
        </group>
      );
    case 'radio':
      return (
        <group>
          <mesh position={[-0.6, 3.5, -0.6]} material={palette.rockDark}>
            <cylinderGeometry args={[0.15, 0.5, 7, 6]} />
          </mesh>
          <mesh position={[-0.6, 7.2, -0.6]} material={palette.gold}>
            <sphereGeometry args={[0.35, 12, 8]} />
          </mesh>
          <mesh position={[2, 1.4, 1]} rotation={[-0.6, 0.6, 0]} material={palette.rock}>
            <sphereGeometry args={[1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[1.8, 0.7, -1.6]} material={palette.grassDark}>
            <boxGeometry args={[2.4, 1.4, 1.6]} />
          </mesh>
        </group>
      );
    case 'arena':
      return (
        <group>
          <mesh position={[0, 0.6, 0]} rotation-x={Math.PI / 2} material={palette.rock}>
            <torusGeometry args={[2.8, 0.6, 8, 24]} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[Math.cos(i * 1.57 + 0.78) * 3.6, 2, Math.sin(i * 1.57 + 0.78) * 3.6]}
              material={palette.gold}
            >
              <cylinderGeometry args={[0.12, 0.12, 4, 6]} />
            </mesh>
          ))}
        </group>
      );
    case 'market':
      return (
        <group>
          {[
            [0, 1.5, 0, 2.6, 3],
            [1.8, 3.6, -0.6, 1.8, 2],
            [-1.6, 1, 1.4, 1.8, 2],
            [0.2, 4.6, 0.4, 1.6, 2.4],
          ].map(([x, y, z, s, h], i) => (
            <mesh key={i} position={[x, y, z]} material={i % 2 ? palette.roof : palette.wood}>
              <boxGeometry args={[s, h, s]} />
            </mesh>
          ))}
          <mesh position={[0.2, 6.2, 0.4]} material={palette.gold}>
            <sphereGeometry args={[0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
      );
    case 'lighthouse':
      return (
        <group>
          <mesh position={[0, 2.5, 0]} material={palette.rock}>
            <cylinderGeometry args={[0.7, 1.1, 5, 12]} />
          </mesh>
          <mesh position={[0, 5.4, 0]} material={palette.roof}>
            <coneGeometry args={[0.9, 1, 12]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={palette.gold}>
            <cylinderGeometry args={[0.6, 0.6, 0.6, 12]} />
          </mesh>
        </group>
      );
  }
}

function Tree(props: { position: [number, number, number]; scale: number }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.6, 0]} material={palette.wood}>
        <cylinderGeometry args={[0.15, 0.22, 1.2, 6]} />
      </mesh>
      <mesh position={[0, 1.8, 0]} material={palette.grassDark}>
        <coneGeometry args={[0.9, 2, 8]} />
      </mesh>
    </group>
  );
}

interface PlaceholderIslandProps {
  id: IslandId;
  seed: number;
}

export function PlaceholderIsland({ id, seed }: PlaceholderIslandProps) {
  const rock = useRockGeometry(seed);
  return (
    <group>
      <mesh geometry={rock} material={palette.rock} />
      <mesh position={[0, 0.2, 0]} material={palette.grass}>
        <cylinderGeometry args={[ROCK_RADIUS * 1.03, ROCK_RADIUS * 0.97, 0.5, 28]} />
      </mesh>
      <group position={[0, 0.45, 0]}>
        <ThemeHint id={id} />
      </group>
    </group>
  );
}
