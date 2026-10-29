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
import { Spin, Squash } from '@/objects/reactions';
import { PercentTag } from '../arena/effects';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { useGroundHeights } from '../useGroundHeights';
import {
  Beacon,
  DoorGlow,
  EyeGlow,
  Hover,
  ScreenPicture,
  SignalBurst,
  SignalRings,
  SlowTurn,
  TEST_RUN_SECONDS,
  TestCards,
  TestRun,
  THINK,
  ThinkAndHop,
  ThinkingBubble,
} from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'radio' as const };
};

/**
 * Where everything stands, as "across the view, towards the camera" (see ../layout.ts).
 * Matches the layout in docs/plan/islands/radio.md: back row tower, bunker, dish;
 * front row screen, robot, containers. Rocks sit at the side edges.
 */
const SPOTS = {
  tower: view(-2.5, -3),
  bunker: view(0, -3),
  dish: view(2.5, -3),
  screen: view(-2.2, 2.3),
  robot: view(0, 2.3),
  containers: view(2.6, 2.3),
  rocks1: view(-4, 0),
  rocks2: view(4, 0),
  rocks3: view(-0.9, 3.8),
} satisfies Record<string, [number, number]>;

const TOWER_HEIGHT = 9;

/** How far a rock is sunk into the ground, as a share of its size. */
const ROCK_SINK = 0.12;

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
        <DoorGlow id="radio-platform" position={[0, 0.5, 1.05]} />
      </group>

      <group position={at('dish')}>
        <Interactable {...interactive('radio-services')}>
          <SlowTurn>
            <Spin id="radio-services" turns={1} seconds={1.6}>
              <GeneratedModel url={dishUrl} height={2.2} centre="base" />
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
              <ThinkAndHop id="radio-llm">
                <GeneratedModel url={robotUrl} length={0.9} />
              </ThinkAndHop>
            </group>
          </Hover>
        </Interactable>
        {/* It thinks (bubble, eye glow), then sends test cards out: prompt in, tests out. */}
        <EyeGlow id="radio-llm" position={[0, 0.7, 0.45]} />
        <ThinkingBubble id="radio-llm" position={[0.3, 1.45, 0]} />
        <TestCards id="radio-llm" position={[0, 0.7, 0.2]} />
        <PercentTag
          id="radio-llm"
          position={[0, 1.6, 0]}
          text="prompt → tests"
          delay={THINK + 0.3}
        />
      </group>

      <group position={at('containers')} rotation-y={deg(FACE_CAMERA + 120)}>
        <Interactable {...interactive('radio-backend')}>
          <Squash id="radio-backend" to={0.92} seconds={0.5}>
            <GeneratedModel url={containersUrl} height={2} />
          </Squash>
        </Interactable>
        {/* Turned back to face the camera, so the row of ticks runs across the screen. */}
        <group rotation-y={deg(-120)}>
          <TestRun id="radio-backend" position={[0, 2.35, 0]} />
        </group>
        <PercentTag
          id="radio-backend"
          position={[0, 2.95, 0]}
          text="all tests pass"
          delay={TEST_RUN_SECONDS * 0.45}
        />
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
