import { Suspense, lazy } from 'react';
import { IslandLabels } from '@/islands/IslandLabel';

const WorldCanvas = lazy(() => import('@/scenes/WorldCanvas'));

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <IslandLabels />
    </>
  );
}
