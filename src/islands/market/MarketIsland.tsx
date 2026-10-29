import { useRef } from 'react';
import type * as THREE from 'three';
import balloonUrl from '@/assets/models/market/balloon.glb?url';
import bankUrl from '@/assets/models/market/bank.glb?url';

import fountainUrl from '@/assets/models/market/fountain.glb?url';
import housesUrl from '@/assets/models/market/houses.glb?url';
import baseUrl from '@/assets/models/market/island-base.glb?url';
import shackUrl from '@/assets/models/market/shack-glass.glb?url';
import signpostUrl from '@/assets/models/market/signpost.glb?url';
import tramUrl from '@/assets/models/market/tram.glb?url';
import windmillUrl from '@/assets/models/market/windmill.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Spin } from '@/objects/reactions';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { PercentTag } from '../arena/effects';
import { DoorGlow, Hover } from '../radio/effects';
import { useGroundHeights } from '../useGroundHeights';
import {
  KitDelivery,
  Bunting,
  CoinBurst,
  DustPuff,
  FloatUp,
  LaunchPad,
  Pole,
  Sails,
  TramLoop,
  WaterSparkles,
  WINDMILL_SECONDS,
} from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'market' as const };
};

/**
 * Where everything stands (design: docs/plan/islands/market.md, section 4).
 * A ring around the town square: the fountain with the tram loop sits in the middle of
 * the base's cobbled square, at the island's centre. Everything else stands about 4 m
 * out, spaced so no footprints touch: houses and bank side by side at the back, windmill
 * and balloon at the sides, signpost and shack at the front. Ring spots are written as
 * "across the view, towards the camera" (see ../layout.ts), so the back is away from
 * the focus camera.
 */
const SPOTS = {
  fountain: [0, 0],
  houses: view(-1.9, -3.3),
  bank: view(1.6, -3.3),
  windmill: view(-4.0, 0.3),
  balloon: view(3.8, -1.0),
  signpost: view(-2.6, 2.8),
  shack: view(2.6, 2.8),
  housesFront: view(-0.7, -2.3),
  pole: view(3.0, -2.0),
} satisfies Record<string, [number, number]>;

const TRAM_RADIUS = 1.4;
const POLE_HEIGHT = 2.6;
const HOUSES_HEIGHT = 4.2;
const BANK_HEIGHT = 3.6;

const WINDMILL_HEIGHT = 3.2;
/**
 * The end of the windmill's axle, where the sails turn, measured on the model at this
 * size (centred on the tower's foot): the axle sticks out of the cap towards the front.
 */
const WINDMILL_HUB: [number, number, number] = [0, 2.53, 1.7];
/**
 * Where the UI-kit pieces land, relative to the windmill (across, up, towards): the
 * houses, the bank, the fountain and the shack, every part of town built on the kit.
 */
const KIT_TARGETS: [number, number, number][] = [
  [2.1, 1.2, -3.6],
  [5.6, 1.2, -3.6],
  [4.0, 0.9, -0.3],
  [6.6, 0.8, 2.5],
];

/**
 * Market Town island (design: docs/plan/islands/market.md). Every model is AI-generated;
 * code places them, adds the tram track and bunting, and gives the six achievement
 * objects their reactions.
 */
export function MarketIsland() {
  const frame = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const y = useGroundHeights(frame, base, SPOTS);
  const at = (spot: keyof typeof SPOTS): [number, number, number] => [
    SPOTS[spot][0],
    y[spot],
    SPOTS[spot][1],
  ];
  const above = (spot: keyof typeof SPOTS, h: number): [number, number, number] => {
    const [x, g, z] = at(spot);
    return [x, g + h, z];
  };

  return (
    <group ref={frame}>
      <GeneratedModel ref={base} url={baseUrl} length={11} anchor="top" />

      {/* Back of the ring: houses and the bank landmark, side by side (not interactive). */}
      <GeneratedModel
        url={housesUrl}
        height={HOUSES_HEIGHT}
        position={at('houses')}
        rotation-y={deg(FACE_CAMERA)}
      />
      <GeneratedModel
        url={bankUrl}
        height={BANK_HEIGHT}
        position={at('bank')}
        rotation-y={deg(FACE_CAMERA - 22)}
      />

      {/* Bunting from the houses' front corner to the bank, and on to a pole on its right. */}
      <Pole position={at('pole')} height={POLE_HEIGHT} />
      <Bunting from={above('housesFront', 3)} to={above('bank', BANK_HEIGHT * 0.62)} flags={6} />
      <Bunting from={above('bank', BANK_HEIGHT * 0.62)} to={above('pole', POLE_HEIGHT)} />

      {/* The shared core: its sails face the camera; its UI-kit pieces fly out to the town. */}
      <group position={at('windmill')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('mone-packages')}>
          <GeneratedModel url={windmillUrl} height={WINDMILL_HEIGHT} centre="base" />
          <group position={WINDMILL_HUB}>
            <Sails id="mone-packages" />
          </group>
        </Interactable>
        <KitDelivery id="mone-packages" from={WINDMILL_HUB} targets={KIT_TARGETS} />
        <PercentTag
          id="mone-packages"
          position={[0, WINDMILL_HEIGHT + 0.9, 0]}
          text="shared UI kit · API core"
          delay={WINDMILL_SECONDS * 0.3}
        />
      </group>

      <group position={at('balloon')}>
        <LaunchPad position={[0, 0.07, 0]} />
        <Interactable {...interactive('mone-fsd')}>
          <FloatUp id="mone-fsd">
            <Hover height={0.12} speed={0.8}>
              <group position-y={0.35}>
                <GeneratedModel url={balloonUrl} height={3.2} rotation-y={deg(FACE_CAMERA)} />
              </group>
            </Hover>
          </FloatUp>
        </Interactable>
      </group>

      {/* Front row. */}
      <group position={at('signpost')}>
        <Interactable {...interactive('mone-account')}>
          <Spin id="mone-account" turns={1} seconds={1.4}>
            <GeneratedModel
              url={signpostUrl}
              height={2}
              centre="base"
              rotation-y={deg(FACE_CAMERA)}
            />
          </Spin>
        </Interactable>
      </group>

      <group position={at('fountain')}>
        <Interactable {...interactive('mone-pdl')}>
          <GeneratedModel url={fountainUrl} length={1.6} />
        </Interactable>
        <WaterSparkles position={[0, 0.5, 0]} />
        <CoinBurst id="mone-pdl" position={[0, 0.45, 0]} />
        <Interactable {...interactive('mone-bnpl')} lift={false}>
          {/* The stop is on the camera's side of the fountain. */}
          <TramLoop id="mone-bnpl" radius={TRAM_RADIUS} stopAngle={deg(FACE_CAMERA - 90)}>
            <GeneratedModel url={tramUrl} length={1.3} />
          </TramLoop>
        </Interactable>
      </group>

      <group position={at('shack')} rotation-y={deg(FACE_CAMERA - 20)}>
        <Interactable {...interactive('mone-nextjs')}>
          <GeneratedModel url={shackUrl} length={2.2} />
        </Interactable>
        <DustPuff id="mone-nextjs" position={[-0.4, 0, 0]} />
        <DoorGlow id="mone-nextjs" position={[0.5, 1.0, 0.4]} />
      </group>
    </group>
  );
}
