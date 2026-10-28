import { useRef } from 'react';
import type * as THREE from 'three';
import baseUrl from '@/assets/models/radio/island-base.glb?url';
import bunkerUrl from '@/assets/models/radio/bunker.glb?url';
import containersUrl from '@/assets/models/radio/containers.glb?url';
import dishUrl from '@/assets/models/radio/dish.glb?url';
import robotUrl from '@/assets/models/radio/robot.glb?url';
import screenUrl from '@/assets/models/radio/screen.glb?url';
import towerUrl from '@/assets/models/radio/tower.glb?url';
import rockUrl from '@/assets/models/shared/rock-cluster.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Hop, Spin, Wobble } from '@/objects/reactions';
import { GeneratedModel } from '../GeneratedModel';
import { useGroundHeights } from '../useGroundHeights';
import {
  Beacon,
  CheckMarkPop,
  DoorGlow,
  Hover,
  PoppingScroll,
  ScreenPicture,
  SignalBurst,
  SignalRings,
  SlowTurn,
} from './effects';

const deg = (d: number) => (d * Math.PI) / 180;

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'radio' as const };
};

/**
 * Where everything stands, in island units (+Z faces the overview camera, +X is the
 * visitor's right). Matches the layout in docs/plan/islands/radio.md.
 *
 * Two rows across the focus camera's view (it looks from the front right, about 54°
 * from +X, and about 19° down):
 * - back row, tall things: tower left, bunker middle, dish right;
 * - front row, about 5 m closer: screen left, robot middle, containers right.
 * Each front object has its own column, and the gap between the rows makes it show
 * below the back row on screen, so nothing hides anything. Rocks sit at the side edges.
 * The helper turns "across the view, towards the camera" into island x and z.
 */
const view = (across: number, towards: number): [number, number] => [
  +(0.59 * across + 0.8 * towards).toFixed(2),
  +(-0.8 * across + 0.59 * towards).toFixed(2),
];

const SPOTS = {
  tower: view(-2.5, -3),
  bunker: view(0, -3),
  dish: view(2.5, -3),
  screen: view(-2.2, 2.3),
  robot: view(0, 2.3),
  containers: view(2.2, 2.3),
  rocks1: view(-4, 0),
  rocks2: view(4, 0),
  rocks3: view(-0.9, 3.8),
  // Along the right and back rims, covering the base's bare grey patches there.
  rocks4: view(4.4, 1.6),
  rocks5: view(4.3, -1.5),
  rocks6: view(3.4, -3.3),
  rocks7: view(1.3, -4.3),
  rocks8: view(-1.4, -4.3),
  // The rest of the grey strip on the right side, down to the front-right corner.
  // Placeholders: other props may take these spots later.
  rocks9: view(3.7, 0.9),
  rocks10: view(3.6, 2.8),
  rocks11: view(2.9, 3.6),
} satisfies Record<string, [number, number]>;

/** Turn that makes a model's front (+Z) face the focus camera. */
const FACE_CAMERA = 54;

const TOWER_HEIGHT = 9;

/** How far a rock is sunk into the ground, as a share of its size. */
const ROCK_SINK = 0.12;

const ROCKS = [
  { spot: 'rocks1', size: 1.6, turn: 20 },
  { spot: 'rocks2', size: 1.3, turn: 140 },
  { spot: 'rocks3', size: 1.1, turn: 260 },
  { spot: 'rocks4', size: 1.5, turn: 80 },
  { spot: 'rocks5', size: 1.8, turn: 200 },
  { spot: 'rocks6', size: 1.4, turn: 310 },
  { spot: 'rocks7', size: 1.7, turn: 45 },
  { spot: 'rocks8', size: 1.3, turn: 170 },
  { spot: 'rocks9', size: 1.2, turn: 290 },
  { spot: 'rocks10', size: 1.5, turn: 15 },
  { spot: 'rocks11', size: 1.1, turn: 120 },
] as const;

/**
 * Radio Tower island (design: docs/plan/islands/radio.md). Every model is AI-generated;
 * code places them, adds the beacon and signal rings, and gives the five achievement
 * objects their reactions.
 */
export function RadioIsland() {
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

      <group position={at('tower')}>
        <GeneratedModel url={towerUrl} height={TOWER_HEIGHT} rotation-y={deg(FACE_CAMERA)} />
        <Beacon position={[0, TOWER_HEIGHT - 0.15, 0]} />
        <SignalRings position={[0, TOWER_HEIGHT + 0.1, 0]} />
      </group>

      <group position={at('bunker')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('radio-platform')}>
          <GeneratedModel url={bunkerUrl} length={3.2} />
        </Interactable>
        <DoorGlow id="radio-platform" position={[0, 0.5, 1.05]} width={0.6} height={0.85} />
      </group>

      <group position={at('dish')}>
        <Interactable {...interactive('radio-services')}>
          <SlowTurn>
            <Spin id="radio-services" turns={1} seconds={1.6}>
              <GeneratedModel url={dishUrl} height={2.2} />
            </Spin>
          </SlowTurn>
        </Interactable>
        <SignalBurst id="radio-services" position={[0, 1.9, 0]} />
      </group>

      <group position={at('screen')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('radio-ui')}>
          <GeneratedModel url={screenUrl} height={2.2} />
          <ScreenPicture id="radio-ui" position={[0, 1.36, -0.03]} width={1.52} height={1.1} />
        </Interactable>
      </group>

      <group position={at('robot')} rotation-y={deg(FACE_CAMERA - 20)}>
        <Interactable {...interactive('radio-llm')}>
          <Hover>
            <group position-y={0.25}>
              <Hop id="radio-llm">
                <GeneratedModel url={robotUrl} length={0.9} />
              </Hop>
            </group>
          </Hover>
        </Interactable>
        <PoppingScroll id="radio-llm" position={[0, 0.8, 0.2]} />
      </group>

      <group position={at('containers')} rotation-y={deg(FACE_CAMERA - 15)}>
        <Interactable {...interactive('radio-backend')}>
          <Wobble id="radio-backend" angle={0.04} shakes={3}>
            <GeneratedModel url={containersUrl} height={2} />
          </Wobble>
        </Interactable>
        <CheckMarkPop id="radio-backend" position={[0, 2.3, 0]} />
      </group>

      {ROCKS.map((r) => {
        const [x, ground, z] = at(r.spot);
        return (
          <GeneratedModel
            key={r.spot}
            url={rockUrl}
            length={r.size}
            // Sunk a little, so rocks on the uneven rim never show a gap underneath.
            position={[x, ground - ROCK_SINK * r.size, z]}
            rotation-y={deg(r.turn)}
          />
        );
      })}
    </group>
  );
}
