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
import { colors, gradientMap } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { glareTexture } from '../lightMaterials';

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

// --- Oscilloscope and lamp: light swells, signal waves ---------------------------------

/**
 * A light that swells up and fades back when the object is activated, with a faint
 * glow while idle. Light only, no shape, so it takes the form of whatever it shines on.
 * `pulse` (beats per second) makes the swell beat in a steady rhythm, like a signal.
 */
export function LightSwell({
  id,
  position,
  color = colors.accentGold,
  idle = 0.15,
  peak = 3,
  distance = 2.5,
  pulse = 0,
}: {
  id: string;
  position: Vec3;
  color?: string;
  idle?: number;
  peak?: number;
  distance?: number;
  pulse?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const progress = useReaction(id, 2.4);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const beat = pulse && p !== null ? 0.6 + 0.4 * Math.cos(p * 2.4 * pulse * Math.PI * 2) : 1;
    light.current.intensity = idle + peak * swellOf(p) * beat;
  });
  return <pointLight ref={light} position={position} color={color} distance={distance} decay={2} />;
}

export const WAVES_SECONDS = 2.6;
const WAVES = 5;

/** One and a half periods of a sine wave, glowing green like an oscilloscope trace. */
function waveTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext('2d')!;
  g.lineCap = g.lineJoin = 'round';
  const trace = () => {
    g.beginPath();
    for (let x = 24; x <= 232; x += 4) {
      const y = 64 - Math.sin(((x - 24) / 208) * Math.PI * 3) * 34;
      if (x === 24) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };
  // A soft glow, then the bright trace on top.
  g.strokeStyle = 'rgba(120, 235, 150, 0.35)';
  g.lineWidth = 26;
  trace();
  g.strokeStyle = '#d9ffe0';
  g.lineWidth = 9;
  trace();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Small glowing sine waves that rise out of the oscilloscope screen one after another,
 * swaying and fading as they drift up: signals, for the frequency work behind it.
 * They're separate sprites in the air, so nothing is drawn on the model.
 */
export function SignalWaves({ id, position }: { id: string; position: Vec3 }) {
  const sprites = useRef<THREE.Sprite[]>([]);
  const texture = useMemo(() => waveTexture(), []);
  const progress = useReaction(id, WAVES_SECONDS);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    sprites.current.forEach((s, i) => {
      if (!s) return;
      const k = p === null ? -1 : (p * WAVES_SECONDS - 0.15 - i * 0.3) / 1.3;
      s.visible = k > 0 && k < 1;
      if (!s.visible) return;
      const side = i % 2 ? 1 : -1;
      s.position.set(
        position[0] + side * k * 0.18 + Math.sin(k * 5 + i) * 0.05,
        position[1] + 0.05 + k * 0.85,
        position[2] + k * 0.15,
      );
      const size = 0.26 * (0.55 + k * 0.6);
      s.scale.set(size, size / 2, 1);
      (s.material as THREE.SpriteMaterial).opacity = Math.min(1, k * 6) * (1 - k);
      (s.material as THREE.SpriteMaterial).rotation = Math.sin(k * 3 + i * 1.3) * 0.2;
    });
  });
  return (
    <group>
      {Array.from({ length: WAVES }, (_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) sprites.current[i] = el;
          }}
          visible={false}
          raycast={noHit}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

// --- Circuit board: parts fly in and lock on --------------------------------------------

const PARTS = 14;
/** Seconds over which the parts set off, one after another; each flight; locking in. */
const STAGGER = 1.3;
const FLIGHT = 0.7;
const LOCK = 0.15;
/** The whole reaction, in seconds. */
export const PARTS_SECONDS = STAGGER + FLIGHT + LOCK + 0.1;

const partMaterials = {
  chip: new THREE.MeshToonMaterial({ color: '#2a2c33', gradientMap }),
  capacitor: new THREE.MeshToonMaterial({ color: '#3f72b8', gradientMap }),
  capacitorGreen: new THREE.MeshToonMaterial({ color: '#3c8f5a', gradientMap }),
  resistor: new THREE.MeshToonMaterial({ color: '#d8bf8a', gradientMap }),
};
const partShapes = [
  { geometry: new THREE.BoxGeometry(0.11, 0.025, 0.11), material: partMaterials.chip },
  {
    geometry: new THREE.CylinderGeometry(0.022, 0.022, 0.07, 10),
    material: partMaterials.capacitor,
  },
  { geometry: new THREE.BoxGeometry(0.07, 0.02, 0.04), material: partMaterials.chip },
  {
    geometry: new THREE.CylinderGeometry(0.02, 0.02, 0.06, 10),
    material: partMaterials.capacitorGreen,
  },
  { geometry: new THREE.CapsuleGeometry(0.013, 0.06, 2, 8), material: partMaterials.resistor },
];

/** Small deterministic random, so the parts fly the same way every time. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Tiny electronic parts (chips, capacitors, resistors) swirl in from around the board and
 * land on its face one after another, each with a spark, then sink into it: an assembly
 * of many precise parts. They vanish as they lock in, so nothing stays drawn on the
 * model's uneven face.
 *
 * The face is given by its centre, its width and height, and how far it leans back
 * (radians, its top away from the viewer).
 */
export function PartsFlyIn({
  id,
  centre,
  size,
  tilt,
}: {
  id: string;
  centre: Vec3;
  size: [number, number];
  tilt: number;
}) {
  const parts = useRef<THREE.Mesh[]>([]);
  const sparks = useRef<THREE.Sprite[]>([]);
  const glare = useMemo(() => glareTexture(), []);
  const progress = useReaction(id, PARTS_SECONDS);

  const flights = useMemo(() => {
    const rand = random(17);
    const middle = new THREE.Vector3(...centre);
    const right = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3(0, Math.cos(tilt), -Math.sin(tilt));
    const out = new THREE.Vector3(0, Math.sin(tilt), Math.cos(tilt));
    return Array.from({ length: PARTS }, (_, i) => {
      const target = middle
        .clone()
        .addScaledVector(right, (rand() - 0.5) * size[0] * 0.85)
        .addScaledVector(up, (rand() - 0.5) * size[1] * 0.85)
        .addScaledVector(out, 0.03);
      // Set off from a ring around the board, in front of it.
      const a = rand() * Math.PI * 2;
      const r = 0.9 + rand() * 0.4;
      const start = middle
        .clone()
        .addScaledVector(right, Math.cos(a) * r)
        .addScaledVector(up, Math.sin(a) * r * 0.7)
        .addScaledVector(out, 0.5 + rand() * 0.4);
      // Curve sideways on the way, so they swirl in rather than fly straight.
      const swirl = new THREE.Vector3()
        .subVectors(target, start)
        .cross(out)
        .normalize()
        .multiplyScalar((rand() - 0.5) * 0.6);
      return {
        start,
        target,
        swirl,
        shape: partShapes[i % partShapes.length]!,
        tumble: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
        // Lying flat on the face, turned at random about its normal.
        flat: new THREE.Euler(Math.PI / 2 - tilt, rand() * Math.PI, 0),
        setOff: (i / PARTS) * STAGGER,
      };
    });
  }, [centre, size, tilt]);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const elapsed = p === null ? -1 : p * PARTS_SECONDS;
    flights.forEach((f, i) => {
      const part = parts.current[i];
      const spark = sparks.current[i];
      if (!part || !spark) return;
      const k = p === null ? -1 : (elapsed - f.setOff) / FLIGHT;
      const locked = (elapsed - f.setOff - FLIGHT) / LOCK;
      part.visible = k > 0 && locked < 1;
      if (part.visible) {
        const e = smoothstep(clamp01(k));
        part.position
          .lerpVectors(f.start, f.target, e)
          .addScaledVector(f.swirl, Math.sin(clamp01(k) * Math.PI));
        part.rotation.set(
          f.tumble.x * (1 - e) + f.flat.x * e,
          f.tumble.y * (1 - e) + f.flat.y * e,
          f.tumble.z * (1 - e),
        );
        // Pops into being, then sinks into the board once it has landed.
        part.scale.setScalar(k < 1 ? Math.min(1, k / 0.15) : 1 - clamp01(locked));
      }
      // A spark where it lands.
      const since = elapsed - f.setOff - FLIGHT;
      const flash = p === null ? 0 : Math.max(0, 1 - Math.abs(since - 0.04) / 0.14);
      spark.visible = flash > 0;
      spark.position.copy(f.target);
      spark.scale.setScalar(0.35 * flash);
    });
  });

  return (
    <group>
      {flights.map((f, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              if (el) parts.current[i] = el;
            }}
            geometry={f.shape.geometry}
            material={f.shape.material}
            visible={false}
            raycast={noHit}
          />
          <sprite
            ref={(el) => {
              if (el) sparks.current[i] = el;
            }}
            visible={false}
            raycast={noHit}
          >
            <spriteMaterial
              map={glare}
              color="#fff3c8"
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </group>
  );
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
