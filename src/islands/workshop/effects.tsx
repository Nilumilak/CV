/**
 * Code-made effects for the Workshop island (design: docs/plan/islands/workshop.md).
 *
 * Reactions here use only motion and light: nothing is drawn on a model's surface. The
 * generated models' faces are not flat, so a flat picture laid over one floats and cuts
 * through it (the first oscilloscope trace, board lights and unrolling sheet all did).
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';

type Vec3 = [number, number, number];
const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Rises over the first third, eases back over the rest. */
const swellOf = (p: number | null) =>
  p === null ? 0 : p < 1 / 3 ? smoothstep(p * 3) : smoothstep((1 - p) * 1.5);

// --- Steam whistle ------------------------------------------------------------------

const PUFFS = 6;
const puffMaterial = new THREE.MeshBasicMaterial({
  color: '#f6f3ec',
  transparent: true,
  depthWrite: false,
});

/** A quick puff of steam from a whistle's mouth, rising and fading. */
export function SteamBurst({ id, position }: { id: string; position: Vec3 }) {
  const puffs = useRef<THREE.Mesh[]>([]);
  const materials = useMemo(() => Array.from({ length: PUFFS }, () => puffMaterial.clone()), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.16, 10, 8), []);
  const progress = useReaction(id, 1.6);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < PUFFS; i++) {
      const puff = puffs.current[i];
      if (!puff) continue;
      const k = p === null ? -1 : (p - i * 0.06) / 0.7;
      puff.visible = k > 0 && k < 1;
      if (!puff.visible) continue;
      puff.position.set(Math.sin(i * 2.1) * 0.15 * k, k * 1.3, Math.cos(i * 1.7) * 0.12 * k);
      puff.scale.setScalar(0.6 + k * 1.8);
      (puff.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8;
    }
  });
  return (
    <group position={position}>
      {materials.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          geometry={geometry}
          material={m}
          visible={false}
          renderOrder={2}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

// --- Oscilloscope and lamp: light swells ---------------------------------------------

/**
 * A light that swells up and fades back when the object is activated, with a faint
 * glow while idle. Light only, no shape, so it takes the form of whatever it shines on.
 */
export function LightSwell({
  id,
  position,
  color = colors.accentGold,
  idle = 0.15,
  peak = 3,
  distance = 2.5,
}: {
  id: string;
  position: Vec3;
  color?: string;
  idle?: number;
  peak?: number;
  distance?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const progress = useReaction(id, 2.4);
  useFrame(({ clock }) => {
    light.current.intensity = idle + peak * swellOf(progress(clock.elapsedTime));
  });
  return <pointLight ref={light} position={position} color={color} distance={distance} decay={2} />;
}

// --- Circuit board: a light sweeps across it ------------------------------------------

/**
 * A soft light that passes across in front of a surface, from one side to the other,
 * catching the real chips and traces of the model as it goes.
 */
export function LightSweep({
  id,
  from,
  to,
  color = '#fff1c4',
  peak = 4,
}: {
  id: string;
  from: Vec3;
  to: Vec3;
  color?: string;
  peak?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const progress = useReaction(id, 2.2);
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const l = light.current;
    l.intensity = p === null ? 0 : peak * Math.sin(p * Math.PI);
    if (p !== null) l.position.lerpVectors(a, b, smoothstep(p));
  });
  return <pointLight ref={light} color={color} intensity={0} distance={1.6} decay={2} />;
}

// --- Lectern: loose pages flutter up ---------------------------------------------------

const PAGES = 4;
const pageGeometry = new THREE.PlaneGeometry(0.2, 0.26);
const pageMaterial = new THREE.MeshToonMaterial({ color: '#fbf3e0', side: THREE.DoubleSide });

/**
 * A few loose pages lift out of the scroll, flutter up and around, and drift back down
 * into it, shrinking away as they land.
 */
export function FlutterPages({ id, position }: { id: string; position: Vec3 }) {
  const pages = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 2.6);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < PAGES; i++) {
      const page = pages.current[i];
      if (!page) continue;
      const k = p === null ? -1 : clamp01((p - i * 0.08) / 0.75);
      page.visible = k > 0 && k < 1;
      if (!page.visible) continue;
      const a = i * 1.6 + k * 2.4;
      page.position.set(
        position[0] + Math.cos(a) * 0.35 * Math.sin(k * Math.PI),
        position[1] + Math.sin(k * Math.PI) * (0.7 + i * 0.12),
        position[2] + Math.sin(a) * 0.3 * Math.sin(k * Math.PI),
      );
      page.rotation.set(Math.sin(k * 7 + i) * 0.8, k * 4 + i, Math.cos(k * 5 + i) * 0.5);
      page.scale.setScalar(Math.min(1, k * 6, (1 - k) * 5));
    }
  });
  return (
    <group>
      {Array.from({ length: PAGES }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) pages.current[i] = el;
          }}
          geometry={pageGeometry}
          material={pageMaterial}
          visible={false}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

// --- Gears on the factory wall --------------------------------------------------------

/** Turns its children steadily around their local Y axis (a gear's axle). */
export function Turning({ speed, children }: { speed: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * speed;
  });
  return <group ref={ref}>{children}</group>;
}
