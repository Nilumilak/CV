import * as THREE from 'three';
import { chapters } from '@/data/cv';
import type { IslandId, Vec3 } from '@/data/types';
import { layoutOf } from '@/data/world';

/**
 * Where each rope is tied to an island, towards each neighbour on the route, in that
 * island's units: on the rim straight towards the neighbour, just under the grass lip, so
 * nothing stands on the island's top. Measured on the base models.
 */
const ANCHORS: Partial<Record<IslandId, Partial<Record<IslandId, Vec3>>>> = {
  workshop: { grove: [3.04, -0.74, -2.03] },
  grove: { workshop: [-4.0, -0.64, 2.08], radio: [4.0, -0.68, -1.22] },
  radio: { grove: [-5.03, -0.59, 1.67], arena: [5.03, -0.64, 0.67] },
  arena: { radio: [-4.93, -0.31, -0.64], market: [4.14, -1.0, 1.29] },
  market: { arena: [-5.14, -0.33, -1.29] },
};

/** One rope between neighbouring career islands, with its two tie points. */
export interface Span {
  from: IslandId;
  to: IslandId;
  a: Vec3;
  b: Vec3;
}

/** The career islands in timeline order, linked one to the next. The Lighthouse is off it. */
export const SPANS: Span[] = (() => {
  const stops = chapters.filter((c) => c.kind === 'job').map((c) => c.id as IslandId);
  return stops.slice(1).map((to, i) => {
    const from = stops[i]!;
    const a = ANCHORS[from]?.[to];
    const b = ANCHORS[to]?.[from];
    if (!a || !b) throw new Error(`No rope anchors measured between ${from} and ${to}`);
    return { from, to, a, b };
  });
})();

/** Name of the tie point on one island that holds the rope to another. */
export const anchorKey = (island: IslandId, towards: IslandId) => `${island}>${towards}`;

/** Where a tie point is in the world when the islands are at rest. */
export function restPosition(island: IslandId, anchor: Vec3) {
  const layout = layoutOf(island);
  return new THREE.Vector3(...anchor)
    .multiplyScalar(layout.scale)
    .add(new THREE.Vector3(...layout.position));
}

/** The tie points on one island. */
export function anchorsOn(island: IslandId) {
  return SPANS.flatMap((s) => {
    if (s.from === island) return [{ key: anchorKey(island, s.to), position: s.a }];
    if (s.to === island) return [{ key: anchorKey(island, s.from), position: s.b }];
    return [];
  });
}

/**
 * Each tie point's object, by anchorKey. They live inside their islands (so they bob and
 * grow on hover with them); the ropes read these to know where to hang.
 */
export const anchors = new Map<string, THREE.Object3D>();
