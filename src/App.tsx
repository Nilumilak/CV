import { Suspense, lazy } from 'react';
import { Overlay } from '@/ui/Overlay';

const WorldCanvas = lazy(() => import('@/scenes/WorldCanvas'));

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <Overlay />
    </>
  );
}
