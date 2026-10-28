import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLANDS } from '@/data/world';
import { labelElements } from './labelAnchors';

const projected = new THREE.Vector3();

/** Pixels at the top of the screen reserved for the top bar. */
const TOP_BAR_CLEARANCE = 84;

/**
 * Projects each island's label anchor to screen space and moves the DOM label there.
 * Writes styles directly every frame, so React never re-renders for camera motion.
 */
export function LabelProjector() {
  const anchors = useMemo(
    () =>
      ISLANDS.map((l) => ({
        id: l.id,
        world: new THREE.Vector3(...l.labelOffset)
          .multiplyScalar(l.scale)
          .add(new THREE.Vector3(...l.position)),
      })),
    [],
  );

  useFrame(({ camera, size }) => {
    for (const a of anchors) {
      const el = labelElements.get(a.id);
      if (!el) continue;
      projected.copy(a.world).project(camera);
      // Behind the camera, or far outside the view: hide.
      const visible = projected.z < 1 && Math.abs(projected.x) < 1.3 && Math.abs(projected.y) < 1.3;
      const x = (projected.x * 0.5 + 0.5) * size.width;
      // Keep labels out of the top bar strip.
      const y = Math.max((-projected.y * 0.5 + 0.5) * size.height, TOP_BAR_CLEARANCE);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      el.style.visibility = visible ? 'visible' : 'hidden';
      // Nearer labels draw on top.
      el.style.zIndex = String(Math.round((1 - projected.z) * 10000));
    }
  });

  return null;
}
