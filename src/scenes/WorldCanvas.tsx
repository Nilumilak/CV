import { Suspense, lazy, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva } from 'leva';
import type { Mesh } from 'three';
import { colors, palette } from '@/materials/toon';
import { debugCamera, isDebug } from '@/debug/isDebug';
import { SkyDome } from '@/world/SkyDome';
import { FOG } from '@/world/sky';

const Debug = lazy(() => import('@/debug/Debug'));

/** Temporary scale reference until islands arrive in Phase 2. */
function Cube() {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref} scale={4} material={palette.grass}>
      <boxGeometry />
    </mesh>
  );
}

export default function WorldCanvas() {
  return (
    <>
      <Leva hidden={!isDebug} collapsed />
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.1, far: 1200, position: debugCamera.position ?? [0, 12, 48] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden
      >
        <fog attach="fog" args={[colors.skyHorizon, FOG.near, FOG.far]} />
        <SkyDome />
        <hemisphereLight args={[colors.skyHorizon, colors.rockDark, 0.8]} />
        <directionalLight position={[5, 8, 3]} intensity={2.2} color={colors.sun} />
        <Cube />
        <OrbitControls target={debugCamera.target ?? [0, 0, 0]} maxDistance={300} />
        {isDebug && (
          <Suspense fallback={null}>
            <Debug />
          </Suspense>
        )}
      </Canvas>
    </>
  );
}
