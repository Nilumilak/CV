import { useMemo } from 'react';
import type { IslandId } from '@/data/types';
import { anchors, anchorsOn } from './routeSpans';

/**
 * Invisible tie points for the route's ropes on one island's rim. Rendered inside the
 * island, so the ropes stay tied on as it floats and grows on hover.
 */
export function RouteAnchors({ island }: { island: IslandId }) {
  const points = useMemo(() => anchorsOn(island), [island]);
  return (
    <>
      {points.map((p) => (
        <object3D
          key={p.key}
          position={p.position}
          ref={(el) => {
            if (el) anchors.set(p.key, el);
            else anchors.delete(p.key);
          }}
        />
      ))}
    </>
  );
}
