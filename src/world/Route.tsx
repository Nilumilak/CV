import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import gondolaUrl from '@/assets/models/route/gondola.glb?url';
import { GeneratedModel } from '@/islands/GeneratedModel';
import { gradientMap } from '@/materials/toon';
import { postKey, pulleys, restPosition, SPANS } from './routeSpans';

// Start loading when this file loads, not mid-render: a load that starts during a render
// updates drei's progress store from inside it (a React warning).
useGLTF.preload(gondolaUrl);

/** How far each cable sags, as a share of its length. */
const SAG = 0.07;
const CABLE_RADIUS = 0.07;
const CABLE_SEGMENTS = 48;
const CABLE_SIDES = 6;

const GONDOLA_HEIGHT = 1.3;
/**
 * How far the bottom of the gondola's pulley wheels is below its top, at this height
 * (measured). The cable runs in the wheels' grooves there, so the wheels ride on it.
 */
const WHEEL_DROP = 0.28;
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

/**
 * The cables linking the career islands in timeline order: a sagging rope from post to
 * post (the posts stand on the islands, see RoutePosts), and a little gondola on each span
 * gliding across and back. The rope follows the posts every frame, so it stays tied on as
 * the islands float and grow on hover.
 */
export function Route() {
  const reduceMotion = useReducedMotion();
  const rope = useMemo(() => new THREE.MeshToonMaterial({ map: ropeTexture(), gradientMap }), []);
  const geometries = useMemo(
    () =>
      SPANS.map((s) => ropeGeometry(restPosition(s.from, s.a).distanceTo(restPosition(s.to, s.b)))),
    [],
  );
  const curves = useMemo(
    () =>
      SPANS.map(
        () =>
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
          ),
      ),
    [],
  );
  const cables = useRef<THREE.Mesh[]>([]);
  const gondolas = useRef<THREE.Group[]>([]);
  const swings = useRef<THREE.Group[]>([]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    SPANS.forEach((s, i) => {
      const a = pulleys.get(postKey(s.from, s.to));
      const b = pulleys.get(postKey(s.to, s.from));
      const cable = cables.current[i];
      const gondola = gondolas.current[i];
      const swing = swings.current[i];
      // Hidden until both islands (and their posts) have loaded.
      const ready = !!a && !!b;
      if (cable) cable.visible = ready;
      if (gondola) gondola.visible = ready;
      if (!a || !b || !gondola || !swing) return;

      const curve = curves[i]!;
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
      curve.getPoint(along, gondola.position);
      curve.getTangent(along, tangent);
      // Wheels along the cable (the model's X); the cabin hangs straight down.
      gondola.rotation.y = Math.atan2(-tangent.z, tangent.x);
      swing.rotation.x = reduceMotion ? 0 : Math.sin(time * 1.1 + i) * 0.05;
    });
  });

  return (
    <group>
      {SPANS.map((s, i) => (
        <group key={postKey(s.from, s.to)}>
          <mesh
            ref={(el) => {
              if (el) cables.current[i] = el;
            }}
            geometry={geometries[i]}
            material={rope}
            visible={false}
            frustumCulled={false}
            raycast={noHit}
          />
          <group
            ref={(el) => {
              if (el) gondolas.current[i] = el;
            }}
            visible={false}
          >
            <group
              ref={(el) => {
                if (el) swings.current[i] = el;
              }}
            >
              {/* Its top sits above the cable by the wheels' depth, so the cable runs in their grooves. */}
              <GeneratedModel
                url={gondolaUrl}
                height={GONDOLA_HEIGHT}
                anchor="top"
                position-y={WHEEL_DROP - CABLE_RADIUS * 0.5}
              />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
