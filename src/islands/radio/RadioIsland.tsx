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
 * visitor's right). The focus camera looks from the front right, about 54° from +X,
 * so objects are spread across that view: tower and screen on the left, bunker at the
 * back in the middle, dish and containers on the right, robot in front.
 */
const SPOTS = {
  tower: [-3.5, 0.6],
  bunker: [-1.9, -1.1],
  dish: [0.7, -2.95],
  screen: [-0.1, 2.4],
  robot: [1.2, 2.1],
  containers: [2.0, 0],
  rocks1: [-3.6, -2.4],
  rocks2: [3.6, 1.8],
  rocks3: [-2.2, 3.6],
} as const satisfies Record<string, [number, number]>;

/** Turn that makes a model's front (+Z) face the focus camera. */
const FACE_CAMERA = 54;

const TOWER_HEIGHT = 9;

const ROCKS = [
  { spot: 'rocks1', size: 1.6, turn: 20 },
  { spot: 'rocks2', size: 1.3, turn: 140 },
  { spot: 'rocks3', size: 1.1, turn: 260 },
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
          <ScreenPicture id="radio-ui" position={[0, 1.42, 0.12]} width={1.3} height={0.82} />
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

      {ROCKS.map((r) => (
        <GeneratedModel
          key={r.spot}
          url={rockUrl}
          length={r.size}
          position={at(r.spot)}
          rotation-y={deg(r.turn)}
        />
      ))}
    </group>
  );
}
