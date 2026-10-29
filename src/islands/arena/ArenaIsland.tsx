import { useRef } from 'react';
import type * as THREE from 'three';
import standsUrl from '@/assets/models/arena/display-stands.glb?url';
import baseUrl from '@/assets/models/arena/island-base.glb?url';
import shoeUrl from '@/assets/models/arena/winged-shoe.glb?url';
import scoreboardUrl from '@/assets/models/arena/scoreboard.glb?url';
import stadiumUrl from '@/assets/models/arena/stadium.glb?url';
import boothsUrl from '@/assets/models/arena/team-booths.glb?url';
import rockUrl from '@/assets/models/shared/rock-cluster.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';

import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { useGroundHeights } from '../useGroundHeights';
import {
  Floodlights,
  PercentTag,
  PHONE_SECONDS,
  ShedWeights,
  SHOE_SECONDS,
  ShoeDash,
  ScoreboardRows,
  StandScreen,
  TeamFlags,
  TinCanPhone,
} from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'arena' as const };
};

/**
 * Where everything stands (design: docs/plan/islands/arena.md, section 4).
 * A ring around the stadium: the stadium is the centre; the scoreboard stands behind it,
 * the team booths on the left, the display stands and the winged shoe in front. Ring spots are
 * "across the view, towards the camera" (see ../layout.ts).
 */
const SPOTS = {
  stadium: [0, 0],
  scoreboard: view(0, -4.1),
  booths: view(-4.0, -1.2),
  stands: view(2.6, 3.0),
  shoe: view(-2.5, 3.3),
  rocks1: view(4.2, -1.0),
  rocks2: view(-4.3, 1.6),
} satisfies Record<string, [number, number]>;

/** Model sizes; the screen, window and lamp positions below are measured on these sizes. */
const STADIUM_HEIGHT = 1.7;
const SCOREBOARD_HEIGHT = 3;
const STANDS_HEIGHT = 1.8;
/** At this size the shoe is about 1.55 long, toe along −X. */
const SHOE_HEIGHT = 0.75;
/** At this size the deck is about 2.4 long: it fits between the stadium and the rim. */
const BOOTHS_HEIGHT = 1.45;
/**
 * The tin cans, at the windows of the two booths that face each other, measured on the
 * model at this size: the blue booth stands back left on the deck, the red one front right.
 */
const CANS: [[number, number, number], [number, number, number]] = [
  [-0.42, 0.56, -0.14],
  [0.4, 0.56, 0.11],
];

/** The stadium's four lamp heads, measured on the model (its highest points), at this size. */
const FLOODLIGHT_LAMPS: [number, number, number][] = [
  [-1.61, 1.62, 1.4],
  [1.66, 1.62, -1.31],
  [1.96, 1.62, 0.95],
  [-1.48, 1.62, -1.35],
];
/** The middle of the pitch, where the lamps point. */
const PITCH: [number, number, number] = [0, 0.3, 0];

/**
 * Arena island (design: docs/plan/islands/arena.md). Every model is AI-generated; code
 * places them, adds the floodlights' glare and beams, and gives the four achievement
 * objects their reactions.
 */
export function ArenaIsland() {
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

      {/* Centre: the stadium landmark (not interactive), long side across the view. */}
      <group position={at('stadium')} rotation-y={deg(FACE_CAMERA)}>
        <GeneratedModel url={stadiumUrl} height={STADIUM_HEIGHT} />
        <Floodlights lamps={FLOODLIGHT_LAMPS} pitch={PITCH} />
      </group>

      <group position={at('scoreboard')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('olimp-virtual')}>
          <GeneratedModel url={scoreboardUrl} height={SCOREBOARD_HEIGHT} />
          <ScoreboardRows id="olimp-virtual" position={[0, 1.7, 0.22]} width={1.9} height={1.25} />
        </Interactable>
      </group>

      {/* The deck runs along the rim here (127°), so both ends stay on the grass. */}
      <group position={at('booths')} rotation-y={deg(127)}>
        <Interactable {...interactive('olimp-iframe')}>
          <GeneratedModel url={boothsUrl} height={BOOTHS_HEIGHT} />
        </Interactable>
        <TinCanPhone id="olimp-iframe" from={CANS[0]} to={CANS[1]} />
        <PercentTag
          id="olimp-iframe"
          position={[0, BOOTHS_HEIGHT + 0.5, 0]}
          text="postMessage"
          delay={PHONE_SECONDS * 0.35}
        />
      </group>

      <group position={at('stands')} rotation-y={deg(FACE_CAMERA - 120)}>
        <Interactable {...interactive('olimp-apps')}>
          <GeneratedModel url={standsUrl} height={STANDS_HEIGHT} />
          <StandScreen
            id="olimp-apps"
            kind="phone"
            delay={0}
            position={[-1.13, 1.0, 0.01]}
            width={0.55}
            height={1.19}
          />
          <StandScreen
            id="olimp-apps"
            kind="desktop"
            delay={0.12}
            // Measured on the model: the monitor leans back 18.6°, centre (0, 0.92, -0.03).
            position={[0.01, 0.915, 0.013]}
            tilt={18.6}
            width={0.92}
            height={0.56}
          />
        </Interactable>
        <TeamFlags id="olimp-apps" position={[0, 0.1, 0.55]} />
      </group>

      {/* Side-on to the camera, toe to the left: it dashes off left, away from the stadium. */}
      <group position={at('shoe')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('olimp-preact')}>
          <ShoeDash id="olimp-preact">
            <GeneratedModel url={shoeUrl} height={SHOE_HEIGHT} />
          </ShoeDash>
        </Interactable>
        <ShedWeights id="olimp-preact" top={SHOE_HEIGHT} />
        <PercentTag
          id="olimp-preact"
          position={[0, SHOE_HEIGHT + 0.7, 0]}
          text="−40% · faster"
          delay={SHOE_SECONDS * 0.3}
        />
      </group>

      <GeneratedModel url={rockUrl} length={1.4} position={at('rocks1')} rotation-y={deg(40)} />
      <GeneratedModel url={rockUrl} length={1.1} position={at('rocks2')} rotation-y={deg(200)} />
    </group>
  );
}
