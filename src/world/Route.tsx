import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { chapters } from '@/data/cv';
import { layoutOf } from '@/data/world';
import { colors } from '@/materials/toon';

/** How far each rope sags between two islands. */
const SAG = 2.5;

/**
 * Dashed rope linking the career islands in timeline order.
 * A placeholder for rope bridges or a tram cable in Phase 4.
 * The open-source Lighthouse sits off the route on purpose.
 */
export function Route() {
  const points = useMemo(() => {
    const stops = chapters
      .filter((c) => c.kind === 'job')
      .map((c) => new THREE.Vector3(...layoutOf(c.id).position).add(new THREE.Vector3(0, -0.4, 0)));
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      mid.y -= SAG;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      out.push(...curve.getPoints(24).slice(i === 0 ? 0 : 1));
    }
    return out;
  }, []);

  return (
    <Line
      points={points}
      color={colors.wood}
      lineWidth={2}
      dashed
      dashSize={0.8}
      gapSize={0.5}
      transparent
      opacity={0.8}
    />
  );
}
