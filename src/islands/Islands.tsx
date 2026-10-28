import { Suspense, type ReactNode } from 'react';
import type { IslandId } from '@/data/types';
import { ISLANDS } from '@/data/world';
import { HomeIsland } from './home/HomeIsland';
import { Island } from './Island';
import { LabelProjector } from './LabelProjector';
import { PlaceholderIsland } from './PlaceholderIsland';

/** Islands that have real art. The rest stay placeholders until their turn in Phase 4. */
const ART: Partial<Record<IslandId, (seed: number) => ReactNode>> = {
  home: (seed) => <HomeIsland seed={seed} />,
};

/** All islands from world.ts. Each real island loads in its own Suspense, showing its placeholder meanwhile. */
export function Islands() {
  return (
    <>
      {ISLANDS.map((layout) => {
        const art = ART[layout.id];
        return (
          <Island key={layout.id} layout={layout}>
            {art ? (
              <Suspense fallback={<PlaceholderIsland id={layout.id} seed={layout.seed} />}>
                {art(layout.seed)}
              </Suspense>
            ) : undefined}
          </Island>
        );
      })}
      <LabelProjector />
    </>
  );
}
