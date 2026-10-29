import { useLayoutEffect, useState, type RefObject } from 'react';
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const origin = new THREE.Vector3();
const below = new THREE.Vector3();
const hit = new THREE.Vector3();

/** How high above the island the downward rays start, in island units. */
const RAY_START = 50;

/**
 * Finds the grass height under each point of an AI-generated island base, so objects
 * stand on the real surface instead of floating or sinking where the top is not flat.
 *
 * Points are [x, z] in the frame's local space. Heights come back in the same space.
 * Measured once after the base has loaded; until then every height is 0.
 */
export function useGroundHeights<K extends string>(
  frame: RefObject<THREE.Object3D | null>,
  base: RefObject<THREE.Object3D | null>,
  points: Record<K, [number, number]>,
): Record<K, number> {
  const [heights, setHeights] = useState<Record<K, number>>(() => zeros(points));

  useLayoutEffect(() => {
    const f = frame.current;
    const b = base.current;
    if (!f || !b) return;
    f.updateWorldMatrix(true, true);

    const result = zeros(points);
    for (const key of Object.keys(points) as K[]) {
      const [x, z] = points[key];
      f.localToWorld(origin.set(x, RAY_START, z));
      f.localToWorld(below.set(x, RAY_START - 1, z));
      raycaster.set(origin, below.sub(origin).normalize());
      const [first] = raycaster.intersectObject(b, true);
      if (first) result[key] = f.worldToLocal(hit.copy(first.point)).y;
    }
    setHeights(result);
    // Points are a constant table per island, so this runs once per base; keyed by their
    // values too, so moving a spot during development measures it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, base, JSON.stringify(points)]);

  return heights;
}

function zeros<K extends string>(points: Record<K, unknown>): Record<K, number> {
  return Object.fromEntries(Object.keys(points).map((k) => [k, 0])) as Record<K, number>;
}
