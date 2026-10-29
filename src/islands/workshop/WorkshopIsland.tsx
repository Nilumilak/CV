import { useRef } from 'react';
import type * as THREE from 'three';
import boardUrl from '@/assets/models/workshop/circuit-board.glb?url';
import factoryUrl from '@/assets/models/workshop/factory.glb?url';
import gearUrl from '@/assets/models/workshop/gear.glb?url';
import baseUrl from '@/assets/models/workshop/island-base.glb?url';
import lecternUrl from '@/assets/models/workshop/lectern.glb?url';
import whistleUrl from '@/assets/models/workshop/whistle.glb?url';
import benchUrl from '@/assets/models/workshop/workbench.glb?url';
import rockUrl from '@/assets/models/shared/rock-cluster.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Wobble } from '@/objects/reactions';
import { ChimneySmoke } from '../ambient';
import { PercentTag } from '../arena/effects';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { useGroundHeights } from '../useGroundHeights';
import { FlutterPages, LightSwell, LightSweep, SteamBurst, Turning } from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'workshop' as const };
};

/**
 * Where everything stands (design: docs/plan/islands/workshop.md, section 4), as "across
 * the view, towards the camera" (see ../layout.ts): the factory at the back with gears on
 * its right wall, the workbench on the left, the circuit board and the lectern in front,
 * the steam whistle on the right.
 */
const SPOTS = {
  factory: view(0, -3.0),
  bench: view(-3.0, 0.4),
  board: view(-1.2, 2.6),
  lectern: view(1.6, 2.6),
  whistle: view(3.6, 0.0),
  rocks1: view(-4.2, 2.6),
  rocks2: view(4.2, 2.4),
} satisfies Record<string, [number, number]>;

/** Model sizes; the positions of code-made parts below are measured on these sizes. */
const FACTORY_HEIGHT = 4.5;
const BENCH_HEIGHT = 1.2;
const BOARD_HEIGHT = 1.6;
const LECTERN_HEIGHT = 1.3;
const WHISTLE_HEIGHT = 1.2;

/**
 * The factory is turned so the camera sees its front and its plain right wall about
 * equally (both about 45° off the view), so the gears on that wall show.
 */
const FACTORY_TURN = 10;

/** Chimney tops, measured on the factory model at this size. */
const CHIMNEYS: [number, number, number][] = [
  [1.0, 4.45, -0.28],
  [-1.0, 4.45, -0.28],
];

/**
 * Three gears on the factory's right wall (x = +1.61 at this size), meshing: each turns
 * the other way from its neighbour, smaller ones faster.
 */
const GEARS = [
  { size: 1.4, z: -0.2, y: 2.0, speed: 0.35 },
  { size: 1.0, z: 0.65, y: 1.33, speed: -0.49 },
  { size: 0.8, z: -0.95, y: 1.45, speed: -0.61 },
];
/** The wall's surface; each gear's back face sits on it (anchor at the gear's bottom). */
const WALL_X = 1.63;

/**
 * Workshop island (design: docs/plan/islands/workshop.md). Every model is AI-generated;
 * code places them, adds chimney smoke and turning gears, and gives the four achievement
 * objects their reactions.
 */
export function WorkshopIsland() {
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

      {/* Back: the factory with smoking chimneys and gears turning on its right wall. */}
      <group position={at('factory')} rotation-y={deg(FACTORY_TURN)}>
        <GeneratedModel url={factoryUrl} height={FACTORY_HEIGHT} />
        {CHIMNEYS.map((c, i) => (
          <ChimneySmoke key={i} position={c} scale={0.7} />
        ))}
        {GEARS.map((g, i) => (
          // The gear model lies flat (axle up); turn it so the axle points out of the wall.
          <group key={i} position={[WALL_X, g.y, g.z]} rotation-z={-Math.PI / 2}>
            <Turning speed={g.speed}>
              <GeneratedModel url={gearUrl} length={g.size} anchor="bottom" centre="bounds" />
            </Turning>
          </group>
        ))}
      </group>

      <group position={at('bench')} rotation-y={deg(FACE_CAMERA + 20)}>
        <Interactable {...interactive('salyut-projects')}>
          <GeneratedModel url={benchUrl} height={BENCH_HEIGHT} />
        </Interactable>
        {/* Measured on the model: the screen and the desk lamp's shade. */}
        <LightSwell
          id="salyut-projects"
          position={[-0.143, 0.96, 0.35]}
          color="#a6f5b4"
          idle={0.2}
          peak={2.6}
          distance={1.8}
        />
        <LightSwell id="salyut-projects" position={[-0.59, 1.0, -0.2]} idle={0.3} peak={2.4} />
      </group>

      <group position={at('board')} rotation-y={deg(FACE_CAMERA + 10)}>
        <Interactable {...interactive('salyut-assemblies')}>
          <GeneratedModel url={boardUrl} height={BOARD_HEIGHT} />
        </Interactable>
        {/* A light passes across in front of the board's face (measured centre y 0.83). */}
        <LightSweep id="salyut-assemblies" from={[-0.55, 1.05, 0.5]} to={[0.55, 0.65, 0.5]} />
      </group>

      <group position={at('lectern')} rotation-y={deg(FACE_CAMERA - 10)}>
        <Interactable {...interactive('salyut-macros')}>
          <GeneratedModel url={lecternUrl} height={LECTERN_HEIGHT} />
        </Interactable>
        <FlutterPages id="salyut-macros" position={[-0.1, LECTERN_HEIGHT - 0.05, 0.3]} />
        <PercentTag
          id="salyut-macros"
          position={[0, LECTERN_HEIGHT + 0.5, 0]}
          text="faster, fewer errors"
        />
      </group>

      <group position={at('whistle')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('salyut-lead')}>
          <Wobble id="salyut-lead" angle={0.04} shakes={6} seconds={1}>
            <GeneratedModel url={whistleUrl} height={WHISTLE_HEIGHT} />
          </Wobble>
        </Interactable>
        <SteamBurst id="salyut-lead" position={[0, WHISTLE_HEIGHT, 0]} />
        <PercentTag
          id="salyut-lead"
          position={[0, WHISTLE_HEIGHT + 0.7, 0]}
          text="5 developers · 15 workers"
        />
      </group>

      <GeneratedModel url={rockUrl} length={1.3} position={at('rocks1')} rotation-y={deg(30)} />
      <GeneratedModel url={rockUrl} length={1.1} position={at('rocks2')} rotation-y={deg(190)} />
    </group>
  );
}
