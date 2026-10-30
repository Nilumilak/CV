import { Suspense, useEffect, type ReactNode } from 'react';
import type { IslandId } from '@/data/types';
import { ISLANDS } from '@/data/world';
import { useWorld } from '@/store/useWorld';
import { RouteAnchors } from '@/world/RouteAnchors';
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

/** Each island's art. */
const ART: Record<IslandId, () => ReactNode> = {
  home: () => <HomeIsland />,
  radio: () => <RadioIsland />,
  market: () => <MarketIsland />,
  arena: () => <ArenaIsland />,
  grove: () => <GroveIsland />,
  workshop: () => <WorkshopIsland />,
  lighthouse: () => <LighthouseIsland />,
};

/** Mounts once its island's art has loaded (it sits inside the same Suspense) and says so. */
function Loaded({ id }: { id: IslandId }) {
  const markIslandLoaded = useWorld((s) => s.markIslandLoaded);
  useEffect(() => markIslandLoaded(id), [id, markIslandLoaded]);
  return null;
}

/** All islands from world.ts. Each loads in its own Suspense, showing a placeholder meanwhile. */
export function Islands() {
  return (
    <>
      {ISLANDS.map((layout) => (
        <Island key={layout.id} layout={layout}>
          <Suspense fallback={<PlaceholderIsland id={layout.id} seed={layout.seed} />}>
            {ART[layout.id]()}
            <Loaded id={layout.id} />
            {/* The route's ropes tie on here, so they float and grow on hover with the island. */}
            <RouteAnchors island={layout.id} />
          </Suspense>
        </Island>
      ))}
      <LabelProjector />
    </>
  );
}
