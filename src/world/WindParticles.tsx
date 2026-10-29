import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { gradientMap } from '@/materials/toon';
import { useWorld } from '@/store/useWorld';

/**
 * Leaves, petals and specks of light carried on the wind through the foreground, like the
 * breezy skies of a Ghibli film. They live in a box that travels with the camera (each one
 * wraps around inside it), so they are always near the viewer, never piled up on the
 * islands. They fade in once the visitor is in the world and are off with reduced motion.
 */

const LEAVES = 56;
const PETALS = 24;
const MOTES = 70;
/** Half sizes of the box around the camera the particles live in. */
const BOX = new THREE.Vector3(16, 9, 16);
/** The breeze: across the view from left to right, a little away and slightly down. */
const WIND = new THREE.Vector3(1, -0.06, -0.3).normalize();
/** Units per second at an ordinary moment; gusts add to it. */
const WIND_SPEED = 2.2;

const LEAF_COLOURS = ['#6fbf4f', '#8ccd55', '#a9d65e', '#5aa544', '#c5dc6a', '#9bcb5a'];
const PETAL_COLOURS = ['#f8d3dc', '#fbe9ee', '#fff6e6', '#f4c6d2'];

const noHit = () => null;
const smoothstep = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Small deterministic random, so the same flurry plays on every visit. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A slender leaf, pointed at both ends, one unit long. */
function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.quadraticCurveTo(0.3, -0.12, 0, 0.5);
  shape.quadraticCurveTo(-0.3, -0.12, 0, -0.5);
  const geometry = new THREE.ShapeGeometry(shape, 6);
  // A gentle curl along its length, so it catches the light as it turns.
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.12 * pos.getY(i) ** 2 - 0.1 * pos.getX(i) ** 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** A rounded petal, a little longer than wide. */
function petalGeometry() {
  const geometry = new THREE.CircleGeometry(0.5, 10);
  geometry.scale(0.7, 1, 1);
  return geometry;
}

/** A soft round speck for the motes. */
function moteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255, 250, 232, 1)');
  r.addColorStop(0.4, 'rgba(255, 240, 205, 0.5)');
  r.addColorStop(1, 'rgba(255, 236, 196, 0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface Flyer {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  /** Radians per second around each axis: tumbling. */
  spin: THREE.Vector3;
  /** How strongly the wind carries it, relative to the breeze. */
  speed: number;
  size: number;
  phase: number;
}

function flyers(seed: number, count: number, size: [number, number], speed: [number, number]) {
  const rand = random(seed);
  return Array.from({ length: count }, (): Flyer => ({
    position: new THREE.Vector3(
      (rand() * 2 - 1) * BOX.x,
      (rand() * 2 - 1) * BOX.y,
      (rand() * 2 - 1) * BOX.z,
    ),
    rotation: new THREE.Euler(rand() * 6.3, rand() * 6.3, rand() * 6.3),
    spin: new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).multiplyScalar(2.2),
    speed: speed[0] + rand() * (speed[1] - speed[0]),
    size: size[0] + rand() * (size[1] - size[0]),
    phase: rand() * 100,
  }));
}

const offset = new THREE.Vector3();
const dummy = new THREE.Object3D();

/**
 * Moves a particle with the wind, wraps it back into the box (centred a little in front of
 * the camera, so few are wasted behind it), and returns how visible it is there: hidden
 * right at the lens and fading at the box's edges, so nothing pops in or out.
 */
function drift(
  f: Flyer,
  centre: THREE.Vector3,
  camera: THREE.Vector3,
  time: number,
  step: number,
  bob: number,
): number {
  f.position.addScaledVector(WIND, step * f.speed);
  // A lazy rise and fall, and a little sideways wander, each on its own rhythm.
  f.position.y += Math.sin(time * 0.9 + f.phase) * bob;
  f.position.z += Math.cos(time * 0.6 + f.phase) * bob * 0.6;
  offset.subVectors(f.position, centre);
  for (const axis of ['x', 'y', 'z'] as const) {
    const half = BOX[axis];
    offset[axis] = ((((offset[axis] + half) % (2 * half)) + 2 * half) % (2 * half)) - half;
  }
  f.position.addVectors(centre, offset);
  const edge = Math.max(
    Math.abs(offset.x) / BOX.x,
    Math.abs(offset.y) / BOX.y,
    Math.abs(offset.z) / BOX.z,
  );
  const fromLens = f.position.distanceTo(camera);
  return smoothstep(1.2, 3.5, fromLens) * (1 - smoothstep(0.7, 1, edge));
}

/** How far ahead of the camera the box's centre sits. */
const AHEAD = 10;
const forward = new THREE.Vector3();
const centre = new THREE.Vector3();

export function WindParticles() {
  const reduceMotion = useReducedMotion();
  const leafMesh = useRef<THREE.InstancedMesh>(null!);
  const petalMesh = useRef<THREE.InstancedMesh>(null!);
  const points = useRef<THREE.Points>(null!);
  const fade = useRef(0);

  const parts = useMemo(
    () => ({
      leafGeometry: leafGeometry(),
      petalGeometry: petalGeometry(),
      material: new THREE.MeshToonMaterial({ gradientMap, side: THREE.DoubleSide }),
      moteTexture: moteTexture(),
      moteBuffer: new Float32Array(MOTES * 3),
    }),
    [],
  );
  /** Where every particle is and how it turns; changes every frame, so it lives in a ref. */
  const flight = useRef<{ leaves: Flyer[]; petals: Flyer[]; motes: Flyer[] } | null>(null);

  // Each leaf and petal keeps one colour from the palettes.
  const colour = new THREE.Color();
  const paint = (mesh: THREE.InstancedMesh | null, colours: string[], count: number) => {
    if (!mesh || mesh.instanceColor) return;
    const rand = random(count * 7 + 3);
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, colour.set(colours[Math.floor(rand() * colours.length)]!));
    }
    mesh.instanceColor!.needsUpdate = true;
  };

  useFrame(({ camera, clock }, delta) => {
    const time = clock.elapsedTime;
    const inWorld = useWorld.getState().phase === 'world' && !reduceMotion;
    // Fade in over about two seconds after the dive lands; out quickly otherwise.
    fade.current = THREE.MathUtils.damp(fade.current, inWorld ? 1 : 0, inWorld ? 1.2 : 4, delta);
    const visible = fade.current > 0.01;
    leafMesh.current.visible = petalMesh.current.visible = points.current.visible = visible;
    if (!visible) return;
    flight.current ??= {
      leaves: flyers(11, LEAVES, [0.38, 0.65], [0.75, 1.3]),
      petals: flyers(23, PETALS, [0.16, 0.28], [0.6, 1.1]),
      motes: flyers(37, MOTES, [1, 1], [0.25, 0.6]),
    };
    const { leaves, petals, motes } = flight.current;

    // Now and then a gust: everything rushes along and tumbles faster for a few seconds.
    const gust = 0.7 + 1.5 * Math.max(0, Math.sin(time * 0.21)) ** 3 + 0.2 * Math.sin(time * 0.83);
    const step = WIND_SPEED * gust * Math.min(delta, 0.1);
    const camPos = camera.position;
    centre.copy(camPos).addScaledVector(camera.getWorldDirection(forward), AHEAD);

    const place = (mesh: THREE.InstancedMesh, list: Flyer[]) => {
      list.forEach((f, i) => {
        const shown = drift(f, centre, camPos, time, step, 0.35 * Math.min(delta, 0.1));
        f.rotation.x += f.spin.x * delta * (0.6 + gust * 0.5);
        f.rotation.y += f.spin.y * delta * (0.6 + gust * 0.5);
        f.rotation.z += f.spin.z * delta * (0.6 + gust * 0.5);
        dummy.position.copy(f.position);
        dummy.rotation.copy(f.rotation);
        dummy.scale.setScalar(f.size * shown * fade.current);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(leafMesh.current, leaves);
    place(petalMesh.current, petals);

    // Motes drift slowly and hang about; they only fade at the box's edges.
    const attribute = points.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    motes.forEach((f, i) => {
      drift(f, centre, camPos, time, step * 0.5, 0.25 * Math.min(delta, 0.1));
      attribute.setXYZ(i, f.position.x, f.position.y, f.position.z);
    });
    attribute.needsUpdate = true;
    (points.current.material as THREE.PointsMaterial).opacity = 0.75 * fade.current;
  });

  return (
    <group>
      <instancedMesh
        ref={(el) => {
          leafMesh.current = el!;
          paint(el, LEAF_COLOURS, LEAVES);
        }}
        args={[parts.leafGeometry, parts.material, LEAVES]}
        frustumCulled={false}
        visible={false}
        raycast={noHit}
      />
      <instancedMesh
        ref={(el) => {
          petalMesh.current = el!;
          paint(el, PETAL_COLOURS, PETALS);
        }}
        args={[parts.petalGeometry, parts.material, PETALS]}
        frustumCulled={false}
        visible={false}
        raycast={noHit}
      />
      <points ref={points} frustumCulled={false} visible={false} raycast={noHit}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[parts.moteBuffer, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={parts.moteTexture}
          size={0.24}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#fff3d2"
        />
      </points>
    </group>
  );
}
