import * as THREE from 'three';
import { chapters } from '@/data/cv';
import type { IslandId, Vec3 } from '@/data/types';
import { layoutOf } from '@/data/world';

/**
 * Where each cable post stands on an island, towards each neighbour on the route, in that
 * island's units. Measured on the base models: about 0.7 in from the grass edge, on the
 * grass height there, turned along the rim where an object stood in the way.
 */
const POSTS: Partial<Record<IslandId, Partial<Record<IslandId, Vec3>>>> = {
  workshop: { grove: [2.34, -0.39, -1.88] },
  // Grove's Workshop post stands at the left between the noticeboard and the bins (view
  // -3.4, 0.9): from behind the trunk the cable ran through the big tree's crown.
  grove: { workshop: [-1.29, -0.33, 3.25], radio: [1.94, -0.28, -2.61] },
  radio: { grove: [-4.13, -0.28, 2.24], arena: [4.51, -0.29, 1.5] },
  arena: { radio: [-4.57, -0.11, -1.09], market: [4.44, -0.18, 1.54] },
  market: { arena: [-4.15, -0.18, -2.31] },
};

/** One stretch of cable between neighbouring career islands, with its two post spots. */
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
    const a = POSTS[from]?.[to];
    const b = POSTS[to]?.[from];
    if (!a || !b) throw new Error(`No cable posts measured between ${from} and ${to}`);
    return { from, to, a, b };
  });
})();

/** Name of the post on one island that holds the cable to another. */
export const postKey = (island: IslandId, towards: IslandId) => `${island}>${towards}`;

/** Where a post stands in the world when the islands are at rest. */
export function restPosition(island: IslandId, post: Vec3) {
  const layout = layoutOf(island);
  return new THREE.Vector3(...post)
    .multiplyScalar(layout.scale)
    .add(new THREE.Vector3(...layout.position));
}

/**
 * The posts on one island, each turned so its pulley (and the cable) faces the post
 * across the gap.
 */
export function postsOn(island: IslandId) {
  return SPANS.flatMap((s) => {
    const towards = s.from === island ? s.to : s.to === island ? s.from : null;
    if (!towards) return [];
    const [mine, theirs] = s.from === island ? [s.a, s.b] : [s.b, s.a];
    const d = restPosition(towards, theirs).sub(restPosition(island, mine));
    return [{ key: postKey(island, towards), position: mine, yaw: Math.atan2(-d.z, d.x) }];
  });
}

/**
 * The top of each post's pulley, by postKey. The posts live inside their islands (so they
 * bob and grow on hover with them); the cables read these to know where to hang.
 */
export const pulleys = new Map<string, THREE.Object3D>();
