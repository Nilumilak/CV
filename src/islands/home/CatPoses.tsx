import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
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
const SECONDS = 3.2;
/**
 * When the cat switches pose: to the stretch, to sitting, back to sleep. Each switch hides
 * behind a quick squash: it flattens, swaps, and springs back up in the new pose.
 */
const SWITCHES = [0.15, 1.3, 2.85];
const SQUASH = 0.14;
/** The head-tilt hop while it sits. */
const HOP = [1.6, 2.15] as const;

/**
 * The Home cat as a little flipbook of three models of the same cat: asleep (breathing
 * slowly), a big stretch, and sitting up. When activated it wakes and stretches, sits up
 * with a curious head-tilt hop, then curls back to sleep. Poses are [asleep, stretch, sit].
 */
export function CatPoses({ id, poses }: { id: string; poses: [CatPose, CatPose, CatPose] }) {
  const squash = useRef<THREE.Group>(null!);
  const hop = useRef<THREE.Group>(null!);
  const shown = useRef<THREE.Group[]>([]);
  const progress = useReaction(id, SECONDS);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const t = p === null ? -1 : p * SECONDS;
    // Which pose: asleep before the first switch and after the last.
    const pose = t < SWITCHES[0]! || t >= SWITCHES[2]! ? 0 : t < SWITCHES[1]! ? 1 : 2;
    shown.current.forEach((g, i) => {
      if (g) g.visible = i === pose;
    });

    // The squash around each switch: down to its lowest at the switch, then back.
    const near = Math.min(...SWITCHES.map((s) => Math.abs(t - s)));
    const f = p === null || near > SQUASH ? 0 : 1 - near / SQUASH;
    const k = f * f * (3 - 2 * f);
    squash.current.scale.set(1 + 0.18 * k, 1 - 0.35 * k, 1 + 0.18 * k);

    // A small hop with a curious head-tilt while it sits.
    const h = p === null ? -1 : (t - HOP[0]) / (HOP[1] - HOP[0]);
    const up = h > 0 && h < 1 ? Math.sin(h * Math.PI) : 0;
    hop.current.position.y = up * 0.12;
    hop.current.rotation.z = up * 0.18;
  });

  return (
    <group ref={squash}>
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
    </group>
  );
}
