import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import postUrl from '@/assets/models/route/anchor-post.glb?url';
import gondolaUrl from '@/assets/models/route/gondola.glb?url';
import { chapters } from '@/data/cv';
import type { IslandId, Vec3 } from '@/data/types';
import { layoutOf } from '@/data/world';
import { applyBob } from '@/islands/bob';
import { GeneratedModel } from '@/islands/GeneratedModel';
import { glareTexture } from '@/islands/lightMaterials';
import { gradientMap } from '@/materials/toon';

// Start loading when this file loads, not mid-render: a load that starts during a render
// updates drei's progress store from inside it (a React warning).
useGLTF.preload(postUrl);
useGLTF.preload(gondolaUrl);

/**
 * Where each cable post stands on an island, towards each neighbour on the route, in that
 * island's units. Measured on the base models: about 0.7 in from the grass edge, on the
 * grass height there, turned along the rim where an object stood in the way.
 */
const POSTS: Partial<Record<IslandId, Partial<Record<IslandId, Vec3>>>> = {
  workshop: { grove: [2.34, -0.39, -1.88] },
  grove: { workshop: [-3.01, -0.29, 0.73], radio: [1.94, -0.28, -2.61] },
  radio: { grove: [-4.13, -0.28, 2.24], arena: [4.51, -0.29, 1.5] },
  arena: { radio: [-4.57, -0.11, -1.09], market: [4.44, -0.18, 1.54] },
  market: { arena: [-4.15, -0.18, -2.31] },
};

/** Post height in island units; the cable leaves from the pulley on its top. */
const POST_HEIGHT = 2.4;
/** The post's lantern, measured on the model at this height (its arm points along −X). */
const LANTERN: Vec3 = [-0.62, 1.42, 0];
/** How far each cable sags, as a share of its length. */
const SAG = 0.07;
const CABLE_RADIUS = 0.07;
const CABLE_SEGMENTS = 48;
const CABLE_SIDES = 6;

const GONDOLA_HEIGHT = 1.3;
/** Seconds to cross a span, and to wait at each end. */
const TRAVEL = 16;
const PAUSE = 3;
/** The gondolas stop short of the posts, as a share of the cable. */
const END = 0.1;

const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** A twisted-rope look: dark diagonal grooves on hemp. */
function ropeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#b08a5a';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#6f5235';
  g.lineWidth = 7;
  for (let i = -64; i < 128; i += 21) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 64, 64);
    g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** A tube whose vertices are rewritten every frame (see bendRope), with fixed indices and UVs. */
function ropeGeometry(length: number) {
  const rings = CABLE_SEGMENTS + 1;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(rings * (CABLE_SIDES + 1) * 3), 3),
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(rings * (CABLE_SIDES + 1) * 3), 3),
  );
  const uv = new Float32Array(rings * (CABLE_SIDES + 1) * 2);
  const index: number[] = [];
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j <= CABLE_SIDES; j++) {
      const k = i * (CABLE_SIDES + 1) + j;
      // About one twist per 0.4 units of rope.
      uv[k * 2] = (i / CABLE_SEGMENTS) * (length / 0.4);
      uv[k * 2 + 1] = j / CABLE_SIDES;
      if (i < CABLE_SEGMENTS && j < CABLE_SIDES) {
        const next = k + CABLE_SIDES + 1;
        index.push(k, next, k + 1, k + 1, next, next + 1);
      }
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return geometry;
}

const point = new THREE.Vector3();
const tangent = new THREE.Vector3();
const side = new THREE.Vector3();
const up = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/** Lays a rope tube along a sagging curve. */
function bendRope(geometry: THREE.BufferGeometry, curve: THREE.QuadraticBezierCurve3) {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const nor = geometry.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i <= CABLE_SEGMENTS; i++) {
    const s = i / CABLE_SEGMENTS;
    curve.getPoint(s, point);
    curve.getTangent(s, tangent);
    side.crossVectors(tangent, WORLD_UP).normalize();
    up.crossVectors(side, tangent).normalize();
    for (let j = 0; j <= CABLE_SIDES; j++) {
      const a = (j / CABLE_SIDES) * Math.PI * 2;
      const nx = side.x * Math.cos(a) + up.x * Math.sin(a);
      const ny = side.y * Math.cos(a) + up.y * Math.sin(a);
      const nz = side.z * Math.cos(a) + up.z * Math.sin(a);
      const k = i * (CABLE_SIDES + 1) + j;
      pos.setXYZ(
        k,
        point.x + nx * CABLE_RADIUS,
        point.y + ny * CABLE_RADIUS,
        point.z + nz * CABLE_RADIUS,
      );
      nor.setXYZ(k, nx, ny, nz);
    }
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  geometry.computeBoundingSphere();
}

/** Where a post stands in the world when the islands are at rest. */
function restPosition(island: IslandId, post: Vec3) {
  const layout = layoutOf(island);
  return new THREE.Vector3(...post)
    .multiplyScalar(layout.scale)
    .add(new THREE.Vector3(...layout.position));
}

/**
 * The cable route linking the career islands in timeline order: a wooden post with a
 * pulley and a lantern on each island's rim, a sagging rope between neighbours, and a
 * little gondola on each span gliding across and back. The posts float with their
 * islands (the same bob as Island.tsx), so the cables stay tied on.
 * The open-source Lighthouse sits off the route on purpose.
 */
export function Route() {
  const reduceMotion = useReducedMotion();

  const { islands, spans } = useMemo(() => {
    const stops = chapters.filter((c) => c.kind === 'job').map((c) => c.id as IslandId);
    const spans = stops.slice(1).map((to, i) => {
      const from = stops[i]!;
      const a = POSTS[from]?.[to];
      const b = POSTS[to]?.[from];
      if (!a || !b) throw new Error(`No cable posts measured between ${from} and ${to}`);
      return { from, to, a, b };
    });
    // Each post is turned so its pulley (and the rope) faces the post across the gap.
    const islands = stops.map((id) => ({
      id,
      layout: layoutOf(id),
      posts: spans.flatMap((s) => {
        const [here, there, mine, theirs] =
          s.from === id ? [s.from, s.to, s.a, s.b] : s.to === id ? [s.to, s.from, s.b, s.a] : [];
        if (!here || !there || !mine || !theirs) return [];
        const d = restPosition(there, theirs).sub(restPosition(here, mine));
        return [{ key: `${here}>${there}`, position: mine, yaw: Math.atan2(-d.z, d.x) }];
      }),
    }));
    return { islands, spans };
  }, []);

  const rope = useMemo(() => {
    const map = ropeTexture();
    return new THREE.MeshToonMaterial({ map, gradientMap });
  }, []);
  const glare = useMemo(() => glareTexture(), []);
  const geometries = useMemo(
    () =>
      spans.map((s) => ropeGeometry(restPosition(s.from, s.a).distanceTo(restPosition(s.to, s.b)))),
    [spans],
  );

  const bobs = useRef<Record<string, THREE.Group>>({});
  /** The top of each post's pulley, by "island>neighbour". */
  const pulleys = useRef<Record<string, THREE.Object3D>>({});
  const gondolas = useRef<THREE.Group[]>([]);
  const swings = useRef<THREE.Group[]>([]);
  const curves = useMemo(
    () =>
      spans.map(
        () =>
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
          ),
      ),
    [spans],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    for (const { id, layout } of islands) {
      const bob = bobs.current[id];
      if (bob && !reduceMotion) applyBob(bob, layout.seed, time);
    }
    spans.forEach((s, i) => {
      const a = pulleys.current[`${s.from}>${s.to}`];
      const b = pulleys.current[`${s.to}>${s.from}`];
      const curve = curves[i]!;
      if (!a || !b) return;
      a.getWorldPosition(curve.v0);
      b.getWorldPosition(curve.v2);
      curve.v1.lerpVectors(curve.v0, curve.v2, 0.5);
      // A quadratic curve dips half as far as its middle control point.
      curve.v1.y -= 2 * SAG * curve.v0.distanceTo(curve.v2);
      bendRope(geometries[i]!, curve);

      // Across, wait, back, wait; each span on its own schedule.
      const cycle = 2 * (TRAVEL + PAUSE);
      const t = reduceMotion ? PAUSE + TRAVEL / 2 : (time + i * 7.3) % cycle;
      const k =
        t < PAUSE
          ? 0
          : t < PAUSE + TRAVEL
            ? smoothstep((t - PAUSE) / TRAVEL)
            : t < 2 * PAUSE + TRAVEL
              ? 1
              : 1 - smoothstep((t - 2 * PAUSE - TRAVEL) / TRAVEL);
      const along = END + (1 - 2 * END) * k;
      const gondola = gondolas.current[i];
      const swing = swings.current[i];
      if (!gondola || !swing) return;
      curve.getPoint(along, gondola.position);
      curve.getTangent(along, tangent);
      // Wheels along the cable (the model's X); the cabin hangs straight down.
      gondola.rotation.y = Math.atan2(-tangent.z, tangent.x);
      swing.rotation.x = reduceMotion ? 0 : Math.sin(time * 1.1 + i) * 0.05;
    });
  });

  return (
    <group>
      {islands.map(({ id, layout, posts }) => (
        <group key={id} position={layout.position} scale={layout.scale}>
          <group
            ref={(el) => {
              if (el) bobs.current[id] = el;
            }}
          >
            {posts.map((p) => (
              <group key={p.key} position={p.position} rotation-y={p.yaw}>
                <GeneratedModel url={postUrl} height={POST_HEIGHT} centre="base" />
                <object3D
                  position={[0, POST_HEIGHT - 0.06, 0]}
                  ref={(el) => {
                    if (el) pulleys.current[p.key] = el;
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
          </group>
        </group>
      ))}

      {spans.map((s, i) => (
        <group key={`${s.from}>${s.to}`}>
          <mesh geometry={geometries[i]} material={rope} frustumCulled={false} raycast={noHit} />
          <group
            ref={(el) => {
              if (el) gondolas.current[i] = el;
            }}
          >
            <group
              ref={(el) => {
                if (el) swings.current[i] = el;
              }}
            >
              {/* Hung by the top of its pulley wheels, just on the cable. */}
              <GeneratedModel
                url={gondolaUrl}
                height={GONDOLA_HEIGHT}
                anchor="top"
                position-y={0.04}
              />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
