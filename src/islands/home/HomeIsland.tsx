import { useRef } from 'react';
import type * as THREE from 'three';
import baseUrl from '@/assets/models/home/island-base.glb?url';
import benchUrl from '@/assets/models/home/bench.glb?url';
import bookshelfUrl from '@/assets/models/home/bookshelf.glb?url';
import bushUrl from '@/assets/models/home/flower-bush.glb?url';
import catUrl from '@/assets/models/home/cat.glb?url';
import cottageUrl from '@/assets/models/home/cottage.glb?url';
import globeUrl from '@/assets/models/home/globe.glb?url';
import lanternUrl from '@/assets/models/home/lantern.glb?url';
import mailboxUrl from '@/assets/models/home/mailbox.glb?url';
import stoneUrl from '@/assets/models/home/stepping-stone.glb?url';
import stumpUrl from '@/assets/models/home/stump.glb?url';
import treeUrl from '@/assets/models/home/big-tree.glb?url';
import { Breathe, ChimneySmoke, LanternGlow, Sway } from '../ambient';
import { GeneratedModel } from '../GeneratedModel';
import { useGroundHeights } from '../useGroundHeights';
import { DeskWindow } from './DeskWindow';

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Where everything stands, in island units (+Z faces the overview camera, +X is the
 * visitor's right). Matches the placement table in docs/plan/islands/home.md.
 */
const SPOTS = {
  cottage: [0.2, -1.0],
  tree: [-2.7, -2.4],
  bookshelf: [-1.7, 0.3],
  bench: [2.6, 1.2],
  stump: [2.6, -1.2],
  lantern: [-0.1, 2.3],
  mailbox: [2.4, 3.4],
  stone1: [0.7, 0.9],
  stone2: [1.1, 1.7],
  stone3: [1.5, 2.5],
  stone4: [2.0, 3.1],
  bush1: [-3.7, 1.0],
  bush2: [-2.2, 3.4],
  bush3: [3.9, -0.4],
} as const satisfies Record<string, [number, number]>;

const STONES = [
  { spot: 'stone1', size: 0.75, turn: 10 },
  { spot: 'stone2', size: 0.65, turn: 75 },
  { spot: 'stone3', size: 0.8, turn: 140 },
  { spot: 'stone4', size: 0.7, turn: 220 },
] as const;

const BUSHES = [
  { spot: 'bush1', size: 1.3, turn: 0, phase: 0 },
  { spot: 'bush2', size: 1.0, turn: 120, phase: 2.1 },
  { spot: 'bush3', size: 1.15, turn: 240, phase: 4.2 },
] as const;

/** Island-unit sizes that the cat and globe sit on. Tuned from screenshots. */
const BENCH_SEAT_HEIGHT = 0.42;
const STUMP_HEIGHT = 0.6;

/**
 * Home island (design: docs/plan/islands/home.md). Every model is AI-generated;
 * code places them on the real grass surface and adds cosy idle motion.
 */
export function HomeIsland() {
  const frame = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const y = useGroundHeights(frame, base, SPOTS);
  const at = (spot: keyof typeof SPOTS): [number, number, number] => [
    SPOTS[spot][0],
    y[spot],
    SPOTS[spot][1],
  ];

  return (
    <group ref={frame}>
      <GeneratedModel ref={base} url={baseUrl} length={11.5} anchor="top" />

      <Sway amount={0.012} speed={0.5}>
        <GeneratedModel url={treeUrl} height={7} position={at('tree')} />
      </Sway>

      <GeneratedModel url={cottageUrl} height={5} position={at('cottage')} rotation-y={deg(17)}>
        <DeskWindow position={[0, 2.47, 1.18]} radius={0.55} />
        <ChimneySmoke position={[0.62, 4.75, -0.45]} scale={0.8} />
      </GeneratedModel>

      <GeneratedModel
        url={bookshelfUrl}
        height={1.4}
        position={at('bookshelf')}
        rotation-y={deg(17)}
      />

      <group position={at('bench')} rotation-y={deg(-23)}>
        <GeneratedModel url={benchUrl} length={1.6} />
        <group position={[0.15, BENCH_SEAT_HEIGHT, 0]} rotation-y={deg(30)}>
          <Breathe>
            <GeneratedModel url={catUrl} length={0.9} />
          </Breathe>
        </group>
      </group>

      <group position={at('stump')}>
        <GeneratedModel url={stumpUrl} height={STUMP_HEIGHT} />
        <GeneratedModel
          url={globeUrl}
          height={0.8}
          position={[0, STUMP_HEIGHT - 0.03, 0]}
          rotation-y={deg(-30)}
        />
      </group>

      <group position={at('lantern')}>
        <GeneratedModel url={lanternUrl} height={1.6} />
        <LanternGlow position={[0, 1.32, 0]} />
      </group>

      <GeneratedModel url={mailboxUrl} height={1.2} position={at('mailbox')} rotation-y={deg(35)} />

      {STONES.map((s) => (
        <GeneratedModel
          key={s.spot}
          url={stoneUrl}
          length={s.size}
          position={at(s.spot)}
          rotation-y={deg(s.turn)}
        />
      ))}

      {BUSHES.map((b) => (
        <group key={b.spot} position={at(b.spot)} rotation-y={deg(b.turn)}>
          <Sway amount={0.03} speed={0.9} phase={b.phase}>
            <GeneratedModel url={bushUrl} length={b.size} />
          </Sway>
        </group>
      ))}
    </group>
  );
}
