import { useRef } from 'react';
import type * as THREE from 'three';
import boxUrl from '@/assets/models/grove/collection-box.glb?url';
import baseUrl from '@/assets/models/grove/island-base.glb?url';
import boardUrl from '@/assets/models/grove/noticeboard.glb?url';
import binsUrl from '@/assets/models/grove/recycling-bins.glb?url';
import saplingUrl from '@/assets/models/grove/sapling.glb?url';
import shrineUrl from '@/assets/models/grove/shrine.glb?url';
import treeUrl from '@/assets/models/grove/big-tree.glb?url';
import rockUrl from '@/assets/models/shared/rock-cluster.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Wobble } from '@/objects/reactions';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { CheckMarkPop } from '../radio/effects';
import { PercentTag } from '../arena/effects';
import { useGroundHeights } from '../useGroundHeights';
import {
  CoinDrop,
  FallingLeaves,
  Grow,
  Litter,
  Notes,
  Sway,
  Waterfall,
  type LitterPiece,
} from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'grove' as const };
};

/**
 * Where everything stands (design: docs/plan/islands/grove.md, section 4), as "across the
 * view, towards the camera" (see ../layout.ts): the big tree at the back with the shrine at
 * its foot, the noticeboard on the left, the collection box on the right, the recycling
 * bins front left, the saplings front right, and the waterfall off the right edge.
 */
const SPOTS = {
  tree: view(-0.6, -3.0),
  shrine: view(1.4, -2.3),
  board: view(-3.7, -0.4),
  box: view(3.0, -1.2),
  bins: view(-2.2, 2.4),
  sapling1: view(0.6, 2.4),
  sapling2: view(1.4, 2.2),
  sapling3: view(2.2, 2.5),
  sapling4: view(3.0, 2.2),
  waterfall: view(5.1, -0.4),
  rocks1: view(-4.4, 1.8),
  rocks2: view(4.0, 3.0),
} satisfies Record<string, [number, number]>;

const SAPLINGS = [
  { spot: 'sapling1', size: 0.75, turn: 0 },
  { spot: 'sapling2', size: 0.68, turn: 80 },
  { spot: 'sapling3', size: 0.8, turn: 160 },
  { spot: 'sapling4', size: 0.7, turn: 250 },
] as const;

/** Model sizes; the positions of code-made parts below are measured on these sizes. */
const TREE_HEIGHT = 6.5;
const BINS_HEIGHT = 1.1;
const BOX_HEIGHT = 1.2;
const BOARD_HEIGHT = 1.6;

/** The three bins' openings (lids measured at about 1.1 m), left to right: green, blue, yellow. */
const BIN_GREEN: [number, number, number] = [-0.85, BINS_HEIGHT, 0];
const BIN_BLUE: [number, number, number] = [0, BINS_HEIGHT, 0];
const BIN_YELLOW: [number, number, number] = [0.85, BINS_HEIGHT, 0];

/** Litter on the grass around the bins, each with the bin it belongs in. */
const LITTER: LitterPiece[] = [
  { kind: 'bottle', at: [-0.9, 0.06, 0.75], bin: BIN_GREEN },
  { kind: 'paper', at: [-0.1, 0.07, 0.8], bin: BIN_BLUE },
  { kind: 'can', at: [0.7, 0.06, 0.7], bin: BIN_YELLOW },
  { kind: 'paper', at: [1.45, 0.07, 0.25], bin: BIN_BLUE },
  { kind: 'bottle', at: [-1.5, 0.06, 0.2], bin: BIN_GREEN },
];

/** Outward direction at the waterfall's spot, so the water hangs off the rim. */
const WATERFALL_OUT: [number, number] = (() => {
  const [x, z] = SPOTS.waterfall;
  const length = Math.hypot(x, z);
  return [x / length, z / length];
})();

/**
 * Green Grove island (design: docs/plan/islands/grove.md). Every model is AI-generated;
 * code places them, adds the waterfall and falling leaves, and gives the four achievement
 * objects their reactions.
 */
export function GroveIsland() {
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
      <GeneratedModel ref={base} url={baseUrl} length={11} anchor="top" />

      {/* Back: the big tree (Home's tree, re-toned) with the shrine at its foot. */}
      <GeneratedModel
        url={treeUrl}
        height={TREE_HEIGHT}
        position={at('tree')}
        rotation-y={deg(FACE_CAMERA)}
      />
      <FallingLeaves centre={at('tree')} radius={2.4} height={TREE_HEIGHT * 0.75} />
      <GeneratedModel
        url={shrineUrl}
        height={1.2}
        position={at('shrine')}
        rotation-y={deg(FACE_CAMERA - 20)}
      />

      <Waterfall top={at('waterfall')} outward={WATERFALL_OUT} />

      <group position={at('board')} rotation-y={deg(FACE_CAMERA + 25)}>
        <Interactable {...interactive('eco-admin')}>
          <GeneratedModel url={boardUrl} height={BOARD_HEIGHT} />
          <Notes id="eco-admin" centre={[0, 1.12, 0.06]} width={0.7} height={0.5} />
        </Interactable>
      </group>

      <group position={at('box')} rotation-y={deg(FACE_CAMERA - 25)}>
        <Interactable {...interactive('eco-payments')}>
          <Wobble id="eco-payments" angle={0.03} shakes={3}>
            <GeneratedModel url={boxUrl} height={BOX_HEIGHT} />
          </Wobble>
        </Interactable>
        <CoinDrop id="eco-payments" slot={[0, BOX_HEIGHT - 0.05, 0.05]} />
        <CheckMarkPop id="eco-payments" position={[0, BOX_HEIGHT + 0.4, 0]} />
      </group>

      <group position={at('bins')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('eco-lead')}>
          <GeneratedModel url={binsUrl} height={BINS_HEIGHT} />
        </Interactable>
        <Litter id="eco-lead" pieces={LITTER} />
        <PercentTag id="eco-lead" position={[0, BINS_HEIGHT + 0.6, 0]} text="trash-free.ru" />
      </group>

      <Interactable {...interactive('eco-build')} lift={false}>
        {SAPLINGS.map((s, i) => (
          <group key={s.spot} position={at(s.spot)} rotation-y={deg(s.turn)}>
            <Grow id="eco-build" delay={i * 0.12}>
              <Sway phase={i * 1.7}>
                <GeneratedModel url={saplingUrl} height={s.size} />
              </Sway>
            </Grow>
          </group>
        ))}
      </Interactable>

      <GeneratedModel url={rockUrl} length={1.3} position={at('rocks1')} rotation-y={deg(60)} />
      <GeneratedModel url={rockUrl} length={1.0} position={at('rocks2')} rotation-y={deg(210)} />
    </group>
  );
}
