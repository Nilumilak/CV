import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReaction } from '@/objects/useReaction';
import { Breathe } from '../ambient';
import { GeneratedModel } from '../GeneratedModel';

export interface CatPose {
  url: string;
  /** Height in world units; the poses differ, so each is sized to look like the same cat. */
  height: number;
  /** Turn in radians, e.g. to lay the long stretch along the bench. */
  turn?: number;
}

/** The wake-up, in seconds. */
const SECONDS = 3.4;
/**
 * When the cat switches pose: to the stretch, to sitting, back to sleep. Each switch hides
 * in a little cartoon puff of cloud that covers the cat just as the model changes.
 */
const SWITCHES = [0.3, 1.45, 3.0];
/** The puff swells over this long before a switch, and drifts apart and fades after it. */
const PUFF_IN = 0.18;
const PUFF_OUT = 0.5;
/** The head-tilt hop while it sits. */
const HOP = [1.75, 2.3] as const;

/** The puffs of one cloud, around the cat's middle: a ring, a few above, one in front. */
const PUFFS: { at: [number, number, number]; size: number }[] = [
  ...Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return {
      at: [Math.cos(a) * 0.36, 0.22 + (i % 2) * 0.08, Math.sin(a) * 0.3] as [
        number,
        number,
        number,
      ],
      size: 0.24 + (i % 3) * 0.04,
    };
  }),
  { at: [0, 0.5, 0], size: 0.28 },
  { at: [0.18, 0.42, 0.1], size: 0.22 },
  { at: [-0.18, 0.44, -0.08], size: 0.22 },
  { at: [0, 0.25, 0.28], size: 0.3 },
];
const puffGeometry = new THREE.IcosahedronGeometry(1, 2);
const noHit = () => null;

/**
 * The Home cat as a little flipbook of three models of the same cat: asleep (breathing
 * slowly), a big stretch, and sitting up. When activated it wakes and stretches, sits up
 * with a curious head-tilt hop, then curls back to sleep. Poses are [asleep, stretch, sit].
 */
export function CatPoses({ id, poses }: { id: string; poses: [CatPose, CatPose, CatPose] }) {
  const hop = useRef<THREE.Group>(null!);
  const shown = useRef<THREE.Group[]>([]);
  const puffs = useRef<THREE.Mesh[]>([]);
  const material = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: '#fffaf0',
        emissive: '#fff6e6',
        emissiveIntensity: 0.35,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  const progress = useReaction(id, SECONDS);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * SECONDS;
    // Which pose: asleep before the first switch and after the last.
    const pose = t < SWITCHES[0]! || t >= SWITCHES[2]! ? 0 : t < SWITCHES[1]! ? 1 : 2;
    shown.current.forEach((g, i) => {
      if (g) g.visible = i === pose;
    });

    // The cloud of the nearest switch: swells fast to cover the cat, then drifts apart.
    let swell = 0;
    let drift = 0;
    let fade = 1;
    if (p !== null) {
      for (const s of SWITCHES) {
        if (t > s - PUFF_IN && t <= s) {
          const k = (t - (s - PUFF_IN)) / PUFF_IN;
          swell = Math.sin(k * Math.PI * 0.5);
          break;
        }
        if (t > s && t < s + PUFF_OUT) {
          const k = (t - s) / PUFF_OUT;
          swell = 1;
          drift = k;
          fade = 1 - k * k;
          break;
        }
      }
    }
    puffs.current.forEach((puff, i) => {
      if (!puff) return;
      const { at, size } = PUFFS[i]!;
      puff.visible = swell > 0 && fade > 0;
      if (!puff.visible) return;
      // Out from the middle and a little up as it clears.
      puff.position.set(at[0] * (1 + drift * 0.8), at[1] + drift * 0.25, at[2] * (1 + drift * 0.8));
      puff.scale.setScalar(size * swell * (1 + drift * 0.3));
      // The puffs share one material, so they fade together.
      (puff.material as THREE.MeshToonMaterial).opacity = fade;
    });

    // A small hop with a curious head-tilt while it sits.
    const h = p === null ? -1 : (t - HOP[0]) / (HOP[1] - HOP[0]);
    const up = h > 0 && h < 1 ? Math.sin(h * Math.PI) : 0;
    hop.current.position.y = up * 0.12;
    hop.current.rotation.z = up * 0.18;
  });

  return (
    <group>
      <group ref={hop}>
        {poses.map((pose, i) => (
          <group
            key={pose.url}
            ref={(el) => {
              if (el) shown.current[i] = el;
            }}
            rotation-y={pose.turn ?? 0}
            visible={i === 0}
          >
            {i === 0 ? (
              <Breathe>
                <GeneratedModel url={pose.url} height={pose.height} />
              </Breathe>
            ) : (
              <GeneratedModel url={pose.url} height={pose.height} />
            )}
          </group>
        ))}
      </group>
      {PUFFS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          geometry={puffGeometry}
          material={material}
          visible={false}
          renderOrder={2}
          raycast={noHit}
        />
      ))}
    </group>
  );
}
