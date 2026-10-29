import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import postUrl from '@/assets/models/route/anchor-post.glb?url';
import type { IslandId, Vec3 } from '@/data/types';
import { GeneratedModel } from '@/islands/GeneratedModel';
import { glareTexture } from '@/islands/lightMaterials';
import { postsOn, pulleys } from './routeSpans';

// Start loading when this file loads, not mid-render: a load that starts during a render
// updates drei's progress store from inside it (a React warning).
useGLTF.preload(postUrl);

/** Post height in island units; the cable leaves from the pulley on its top. */
const POST_HEIGHT = 2.4;
/** The post's lantern, measured on the model at this height (its arm points along −X). */
const LANTERN: Vec3 = [-0.62, 1.42, 0];

const noHit = () => null;

/**
 * The cable posts standing on one island's rim, each with a pulley and a softly glowing
 * lantern. Rendered inside the island, so they float and grow on hover with it.
 */
export function RoutePosts({ island }: { island: IslandId }) {
  const posts = useMemo(() => postsOn(island), [island]);
  const glare = useMemo(() => glareTexture(), []);
  return (
    <>
      {posts.map((p) => (
        <group key={p.key} position={p.position} rotation-y={p.yaw}>
          <GeneratedModel url={postUrl} height={POST_HEIGHT} centre="base" />
          <object3D
            position={[0, POST_HEIGHT - 0.06, 0]}
            ref={(el) => {
              if (el) pulleys.set(p.key, el);
              else pulleys.delete(p.key);
            }}
          />
          <sprite position={LANTERN} scale={0.7} raycast={noHit}>
            <spriteMaterial
              map={glare}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </>
  );
}
