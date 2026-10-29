import { useRef } from 'react';
import type * as THREE from 'three';
import baseUrl from '@/assets/models/home/island-base.glb?url';
import benchUrl from '@/assets/models/home/bench.glb?url';
import bookshelfUrl from '@/assets/models/home/bookshelf.glb?url';
import daisyBushUrl from '@/assets/models/home/bush-daisy.glb?url';
import hydrangeaBushUrl from '@/assets/models/home/bush-hydrangea.glb?url';
import catUrl from '@/assets/models/home/cat.glb?url';
import cottageUrl from '@/assets/models/home/cottage.glb?url';
import globeUrl from '@/assets/models/home/globe.glb?url';
import lanternUrl from '@/assets/models/home/lantern.glb?url';
import mailboxUrl from '@/assets/models/home/mailbox.glb?url';
import stoneUrl from '@/assets/models/home/stepping-stone.glb?url';
import stumpUrl from '@/assets/models/home/stump.glb?url';
import treeUrl from '@/assets/models/home/big-tree.glb?url';
import { homeObject, type HomeObjectId } from '@/data/homeObjects';
import { Interactable } from '@/objects/Interactable';
import { Spin, Wobble } from '@/objects/reactions';
import {
  Breathe,
  ChimneySmoke,
  Fireflies,
  LanternGlow,
  PoppingLetter,
  SleepyZs,
  Snuggle,
  Sway,
} from '../ambient';
import { GeneratedModel } from '../GeneratedModel';
import { useGroundHeights } from '../useGroundHeights';

const deg = (d: number) => (d * Math.PI) / 180;

/** Props for an object's Interactable, from the shared list in data/homeObjects.ts. */
const interactive = (id: HomeObjectId) => {
  const { label, cue } = homeObject(id);
  return { id, label, cue, island: 'home' as const };
};

/**
 * Where everything stands, in island units (+Z faces the overview camera, +X is the
 * visitor's right). Matches the placement table in docs/plan/islands/home.md.
 * The focus camera looks from the front right, so objects are spread across that view
 * rather than lined up along it, where one would hide the next.
 */
const SPOTS = {
  cottage: [0.2, -1.0],
  tree: [-3, -1],
  bookshelf: [-1.4, 1],
  stump: [-1.6, 2.6],
  bench: [2.6, -1.0],
  lantern: [1, 2.8],
  mailbox: [3, 2.1],
  stone1: [0.8, 0.7],
  stone2: [1.2, 1.4],
  stone3: [1.8, 1.85],
  stone4: [2, 2.6],
  hydrangea: [-3.7, 1.6],
  daisy: [0.2, 4.0],
} as const satisfies Record<string, [number, number]>;

const STONES = [
  { spot: 'stone1', size: 0.75, turn: 10 },
  { spot: 'stone2', size: 0.65, turn: 75 },
  { spot: 'stone3', size: 0.8, turn: 140 },
  { spot: 'stone4', size: 0.7, turn: 220 },
] as const;

/** Flower bushes on the empty front-left grass, each swaying slightly out of step. */
const BUSHES = [
  { spot: 'hydrangea', url: hydrangeaBushUrl, length: 1.3, turn: 20, phase: 0 },
  { spot: 'daisy', url: daisyBushUrl, length: 1.0, turn: 110, phase: 2.1 },
] as const;

/** Island-unit sizes that the cat and globe sit on. The cat lies on the seat, not in it. */
const BENCH_SEAT_HEIGHT = 0.5;
const STUMP_HEIGHT = 0.6;

/**
 * Home island (design: docs/plan/islands/home.md). Every model is AI-generated;
 * code places them on the real grass surface and adds cosy idle motion.
 * Five objects open a panel section when clicked, each with a small reaction.
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
        <GeneratedModel url={treeUrl} height={5.6} position={at('tree')} rotation-y={deg(90)} />
      </Sway>

      <GeneratedModel url={cottageUrl} height={5} position={at('cottage')} rotation-y={deg(17)}>
        <ChimneySmoke position={[0.62, 4.75, -0.45]} scale={0.8} />
      </GeneratedModel>

      <group position={at('bookshelf')} rotation-y={deg(35)}>
        <Interactable {...interactive('home-bookshelf')}>
          <Wobble id="home-bookshelf" angle={0.05}>
            <GeneratedModel url={bookshelfUrl} height={1.4} />
          </Wobble>
        </Interactable>
      </group>

      <group position={at('bench')} rotation-y={deg(-30)}>
        <GeneratedModel url={benchUrl} length={1.6} />
        <group position={[0.15, BENCH_SEAT_HEIGHT, 0]} rotation-y={deg(30)}>
          {/* Asleep, and it stays asleep: poked, it takes a deep breath and z's float up. */}
          <Interactable {...interactive('home-cat')}>
            <Snuggle id="home-cat">
              <Breathe>
                <GeneratedModel url={catUrl} length={0.9} />
              </Breathe>
            </Snuggle>
          </Interactable>
          <SleepyZs id="home-cat" position={[0.15, 0.55, 0.1]} />
        </group>
      </group>

      <group position={at('stump')}>
        <GeneratedModel url={stumpUrl} height={STUMP_HEIGHT} />
        <group position={[0, STUMP_HEIGHT - 0.03, 0]}>
          <Interactable {...interactive('home-globe')}>
            <Spin id="home-globe">
              <GeneratedModel url={globeUrl} height={0.8} rotation-y={deg(30)} />
            </Spin>
          </Interactable>
        </group>
      </group>

      <group position={at('lantern')}>
        <Interactable {...interactive('home-lantern')}>
          <GeneratedModel url={lanternUrl} height={2.1} />
          <LanternGlow position={[0, 1.55, 0]} flareFor="home-lantern" />
        </Interactable>
        <Fireflies position={[0, 1.55, 0]} />
      </group>

      <group position={at('mailbox')} rotation-y={deg(-120)}>
        <Interactable {...interactive('home-mailbox')}>
          <Wobble id="home-mailbox" angle={0.06} shakes={5}>
            <GeneratedModel url={mailboxUrl} height={1.2} />
          </Wobble>
        </Interactable>
        <PoppingLetter id="home-mailbox" position={[0, 1.0, 0]} />
      </group>

      {BUSHES.map((b) => (
        <group key={b.spot} position={at(b.spot)} rotation-y={deg(b.turn)}>
          <Sway amount={0.015} speed={0.7} phase={b.phase}>
            <GeneratedModel url={b.url} length={b.length} />
          </Sway>
        </group>
      ))}

      {STONES.map((s) => (
        <GeneratedModel
          key={s.spot}
          url={stoneUrl}
          length={s.size}
          position={at(s.spot)}
          rotation-y={deg(s.turn)}
        />
      ))}
    </group>
  );
}
