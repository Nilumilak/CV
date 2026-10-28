import { useRef } from 'react';
import type * as THREE from 'three';
import balloonUrl from '@/assets/models/market/balloon.glb?url';
import bankUrl from '@/assets/models/market/bank.glb?url';
import craneUrl from '@/assets/models/market/crane.glb?url';
import fountainUrl from '@/assets/models/market/fountain.glb?url';
import housesUrl from '@/assets/models/market/houses.glb?url';
import baseUrl from '@/assets/models/market/island-base.glb?url';
import shackUrl from '@/assets/models/market/shack-glass.glb?url';
import signpostUrl from '@/assets/models/market/signpost.glb?url';
import tramUrl from '@/assets/models/market/tram.glb?url';
import { islandObject, type IslandObjectId } from '@/data/islandObjects';
import { Interactable } from '@/objects/Interactable';
import { Spin, Wobble } from '@/objects/reactions';
import { GeneratedModel } from '../GeneratedModel';
import { deg, FACE_CAMERA, view } from '../layout';
import { DoorGlow, Hover } from '../radio/effects';
import { useGroundHeights } from '../useGroundHeights';
import {
  BlockStack,
  Bunting,
  CoinBurst,
  DustPuff,
  FloatUp,
  LaunchPad,
  Pole,
  TramLoop,
  WaterSparkles,
} from './effects';

/** Props for an object's Interactable, from the shared list in data/islandObjects.ts. */
const interactive = (id: IslandObjectId) => {
  const { label, cue } = islandObject(id);
  return { id, label, cue, island: 'market' as const };
};

/**
 * Where everything stands, as "across the view, towards the camera" (see ../layout.ts).
 * Matches docs/plan/islands/market.md: back row crane, bank (houses behind), balloon;
 * front row signpost, fountain with the tram loop, shack and glass building.
 */
const SPOTS = {
  houses: view(0, -4.4),
  bank: view(0, -3.2),
  crane: view(-2.9, -2.6),
  balloon: view(2.9, -2.6),
  signpost: view(-2.7, 2.2),
  fountain: view(0, 1.4),
  shack: view(2.7, 2.2),
  poleLeft: view(-1.7, -2.3),
  poleRight: view(1.7, -2.3),
} satisfies Record<string, [number, number]>;

const TRAM_RADIUS = 1.4;
const POLE_HEIGHT = 2.8;
const BANK_HEIGHT = 4;

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

      {/* Back row: landmark and backdrop (not interactive). */}
      <GeneratedModel
        url={housesUrl}
        height={5}
        position={at('houses')}
        rotation-y={deg(FACE_CAMERA)}
      />
      <GeneratedModel
        url={bankUrl}
        height={BANK_HEIGHT}
        position={at('bank')}
        rotation-y={deg(FACE_CAMERA)}
      />

      {/* Bunting from two poles up to the bank's roof, beside the bank, not in front of it. */}
      <Pole position={at('poleLeft')} height={POLE_HEIGHT} />
      <Pole position={at('poleRight')} height={POLE_HEIGHT} />
      <Bunting from={above('poleLeft', POLE_HEIGHT)} to={above('bank', BANK_HEIGHT * 0.62)} />
      <Bunting from={above('bank', BANK_HEIGHT * 0.62)} to={above('poleRight', POLE_HEIGHT)} />

      <group position={at('crane')} rotation-y={deg(FACE_CAMERA)}>
        <Interactable {...interactive('mone-packages')}>
          <Wobble id="mone-packages" angle={0.03} shakes={2}>
            <GeneratedModel url={craneUrl} height={4} />
          </Wobble>
        </Interactable>
        <BlockStack id="mone-packages" position={[0.9, 0, 0.6]} />
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
        <Interactable {...interactive('mone-bnpl')}>
          {/* The stop is on the camera's side of the fountain. */}
          <TramLoop id="mone-bnpl" radius={TRAM_RADIUS} stopAngle={deg(FACE_CAMERA - 90)}>
            <GeneratedModel url={tramUrl} length={1.0} rotation-y={deg(90)} />
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
