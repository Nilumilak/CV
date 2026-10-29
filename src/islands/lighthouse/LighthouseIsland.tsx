import { useRef } from 'react';
import type * as THREE from 'three';
import baseUrl from '@/assets/models/lighthouse/island-base.glb?url';
import buoyPostUrl from '@/assets/models/lighthouse/lifebuoy-post.glb?url';
import lighthouseUrl from '@/assets/models/lighthouse/lighthouse.glb?url';
import boatUrl from '@/assets/models/lighthouse/sky-boat.glb?url';
import rockUrl from '@/assets/models/shared/rock-cluster.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Sway } from '../ambient';
import { PercentTag } from '../arena/effects';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { Hover } from '../radio/effects';
import { useGroundHeights } from '../useGroundHeights';
import { LighthouseBeam, Seagull } from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'lighthouse' as const };
};

/**
 * The base model's round grass top is off its middle, because the dock sticks out on one
 * side (+Z). Shifting it by this much puts the grass in the middle of the island; the dock
 * then runs out to the front left of the view, from about z = 3.9 to 6.6.
 */
const BASE_SHIFT = 1.14;

/**
 * Where everything stands (design: docs/plan/islands/lighthouse.md, section 4), as "across
 * the view, towards the camera" (see ../layout.ts). The grass reaches about 4.5 from the
 * middle.
 */
const SPOTS = {
  lighthouse: view(1.0, -1.2),
  buoyPost: view(-1.5, 3.0),
  rocks1: view(2.5, 1.5),
  rocks2: view(-2.4, -1.8),
} satisfies Record<string, [number, number]>;

const LIGHTHOUSE_HEIGHT = 6.5;
/** The middle of the lamp room, measured on the model at this height. */
const LAMP_Y = 4.35;

/** Moored just past the dock's far end (about z = 6.6), in open sky, its rail near the deck. */
const BOAT: [number, number, number] = [0, -1.1, 8.1];

/**
 * Lighthouse island (design: docs/plan/islands/lighthouse.md). Every model is AI-generated
 * (the rocks are shared); code places them, turns the lamp's beam, bobs the boat and flies
 * the seagull.
 */
export function LighthouseIsland() {
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
      <GeneratedModel
        ref={base}
        url={baseUrl}
        length={11}
        anchor="top"
        position={[0, 0, BASE_SHIFT]}
      />

      <group position={at('lighthouse')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('kafka-auth')}>
          <GeneratedModel url={lighthouseUrl} height={LIGHTHOUSE_HEIGHT} />
        </Interactable>
        <LighthouseBeam id="kafka-auth" position={[0, LAMP_Y, 0]} />
        <PercentTag
          id="kafka-auth"
          position={[0, LIGHTHOUSE_HEIGHT + 0.6, 0]}
          text="merged · in the release notes"
        />
      </group>
      <Seagull centre={[SPOTS.lighthouse[0], 7.2, SPOTS.lighthouse[1]]} radius={3.2} />

      <GeneratedModel
        url={buoyPostUrl}
        height={1.1}
        position={at('buoyPost')}
        rotation-y={deg(FACE_CAMERA)}
      />

      {/* The bow (with its lantern) points away from the island. */}
      <group position={BOAT} rotation-y={deg(90)}>
        <Hover height={0.1} speed={0.7}>
          <Sway amount={0.03} speed={0.5}>
            <GeneratedModel url={boatUrl} length={2.5} />
          </Sway>
        </Hover>
      </group>

      <GeneratedModel url={rockUrl} length={1.2} position={at('rocks1')} rotation-y={deg(40)} />
      <GeneratedModel url={rockUrl} length={1.0} position={at('rocks2')} rotation-y={deg(200)} />
    </group>
  );
}
