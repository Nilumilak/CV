import { Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva } from 'leva';
import { OVERVIEW } from '@/data/world';
import { debugCamera, isDebug } from '@/debug/isDebug';
import { useWorldControls } from '@/debug/useWorldControls';
import { Islands } from '@/islands/Islands';
import { CloudLayers } from '@/world/CloudLayers';
import { Lighting } from '@/world/Lighting';
import { SkyDome } from '@/world/SkyDome';

const Debug = lazy(() => import('@/debug/Debug'));

export default function WorldCanvas() {
  const c = useWorldControls();
  return (
    <>
      <Leva hidden={!isDebug} collapsed />
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 1200,
          position: debugCamera.position ?? OVERVIEW.position,
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden
      >
        <fog attach="fog" args={[c.horizon, c.fogNear, c.fogFar]} />
        <SkyDome top={c.top} horizon={c.horizon} bottom={c.bottom} exponent={c.exponent} />
        <Lighting sunIntensity={c.sunIntensity} skyIntensity={c.skyIntensity} />
        <Suspense fallback={null}>
          <CloudLayers />
        </Suspense>
        <Islands />
        <OrbitControls target={debugCamera.target ?? OVERVIEW.target} maxDistance={300} />
        {isDebug && (
          <Suspense fallback={null}>
            <Debug />
          </Suspense>
        )}
      </Canvas>
    </>
  );
}
