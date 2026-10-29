import { Suspense, type ReactNode } from 'react';
import type { IslandId } from '@/data/types';
import { ISLANDS } from '@/data/world';
import { RoutePosts } from '@/world/RoutePosts';
import { HomeIsland } from './home/HomeIsland';
import { ArenaIsland } from './arena/ArenaIsland';
import { GroveIsland } from './grove/GroveIsland';
import { MarketIsland } from './market/MarketIsland';
import { WorkshopIsland } from './workshop/WorkshopIsland';
import { RadioIsland } from './radio/RadioIsland';
import { LighthouseIsland } from './lighthouse/LighthouseIsland';
import { Island } from './Island';
import { LabelProjector } from './LabelProjector';
import { PlaceholderIsland } from './PlaceholderIsland';

/** Islands that have real art. The rest stay placeholders until their turn in Phase 4. */
const ART: Partial<Record<IslandId, (seed: number) => ReactNode>> = {
  home: () => <HomeIsland />,
  radio: () => <RadioIsland />,
  market: () => <MarketIsland />,
  arena: () => <ArenaIsland />,
  grove: () => <GroveIsland />,
  workshop: () => <WorkshopIsland />,
  lighthouse: () => <LighthouseIsland />,
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
                {/* The cable posts belong to the island: they float and grow on hover with it. */}
                <RoutePosts island={layout.id} />
              </Suspense>
            ) : undefined}
          </Island>
        );
      })}
      <LabelProjector />
    </>
  );
}
