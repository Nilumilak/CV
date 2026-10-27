import { Suspense, lazy, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Leva } from 'leva';
import type { Mesh } from 'three';
import { gradientMap } from '@/materials/toon';
import { isDebug } from '@/debug/isDebug';

const Debug = lazy(() => import('@/debug/Debug'));

function Cube() {
  const ref = useRef<Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshToonMaterial color="#9BCB5A" gradientMap={gradientMap} />
    </mesh>
  );
}

export default function WorldCanvas() {
  return (
    <>
      <Leva hidden={!isDebug} />
      <Canvas flat dpr={[1, 2]} camera={{ fov: 45, position: [3, 2, 4] }} aria-hidden>
        <color attach="background" args={['#BFE7F7']} />
        <hemisphereLight args={['#BFE7F7', '#8A6A52', 0.8]} />
        <directionalLight position={[5, 8, 3]} intensity={2.2} color="#FFF1D6" />
        <Cube />
        <OrbitControls />
        {isDebug && (
          <Suspense fallback={null}>
            <Debug />
          </Suspense>
        )}
      </Canvas>
    </>
  );
}
