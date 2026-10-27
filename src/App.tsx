import { Suspense, lazy } from 'react';

const WorldCanvas = lazy(() => import('@/scenes/WorldCanvas'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <WorldCanvas />
    </Suspense>
  );
}
