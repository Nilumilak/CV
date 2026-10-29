import { Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { CameraRig } from '@/camera/CameraRig';
import { FLY_IN_POINTS, OVERVIEW } from '@/data/world';
import { debugCamera, isDebug, skipIntro } from '@/debug/isDebug';
import { useWorldControls } from '@/debug/useWorldControls';
import { Islands } from '@/islands/Islands';
import { FlyIn } from '@/scenes/FlyIn';
import { WelcomeSun } from '@/scenes/WelcomeSun';
import { LoadingReporter } from '@/scenes/LoadingReporter';
import { useWorld } from '@/store/useWorld';
import { CloudLayers } from '@/world/CloudLayers';
import { Lighting } from '@/world/Lighting';
import { Route } from '@/world/Route';
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
          position: debugCamera.position ?? (skipIntro ? OVERVIEW.position : FLY_IN_POINTS[0]),
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        aria-hidden
        // Clicking empty sky returns to the overview.
        onPointerMissed={() => useWorld.getState().back()}
      >
        <fog attach="fog" args={[c.horizon, c.fogNear, c.fogFar]} />
        <SkyDome top={c.top} horizon={c.horizon} bottom={c.bottom} exponent={c.exponent} />
        <Lighting sunIntensity={c.sunIntensity} skyIntensity={c.skyIntensity} />
        <Suspense fallback={null}>
          <CloudLayers />
        </Suspense>
        <Islands />
        <Suspense fallback={null}>
          <Route />
        </Suspense>
        <WelcomeSun />
        <FlyIn />
        <CameraRig />
        <LoadingReporter />
        {isDebug && (
          <Suspense fallback={null}>
            <Debug />
          </Suspense>
        )}
      </Canvas>
    </>
  );
}
