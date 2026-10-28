import { Suspense, lazy } from 'react';
import { useRoute } from '@/routing/useRoute';
import { ClassicCV } from '@/ui/ClassicCV';
import { Overlay } from '@/ui/Overlay';
import { hasWebGL } from '@/utils/webgl';

const WorldCanvas = lazy(() => import('@/scenes/WorldCanvas'));

/** Checked once: browsers do not gain WebGL while the page is open. */
const webgl = hasWebGL();

export default function App() {
  const route = useRoute();

  if (!webgl) return <ClassicCV noWebGL />;
  if (route.view === 'cv') return <ClassicCV />;

  return (
    <>
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <Overlay />
    </>
  );
}
