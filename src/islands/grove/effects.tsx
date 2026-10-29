/**
 * Code-made effects for the Green Grove island (design: docs/plan/islands/grove.md).
 * Idle effects run on their own; reactions play when their object is activated.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';
import { colors } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { useWorld } from '@/store/useWorld';

type Vec3 = [number, number, number];
const noHit = () => null;
const TAU = Math.PI * 2;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Depth bias that keeps a code-made surface in front of the model face it sits on. */
const ON_SURFACE = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };

// --- Recycling bins: litter flies into the right bin --------------------------------

export interface LitterPiece {
  kind: 'can' | 'bottle' | 'paper';
  /** Where it lies on the grass. */
  at: Vec3;
  /** The opening of the bin it belongs in. */
  bin: Vec3;
}

const LITTER_LOOK = {
  can: { color: '#c9573e', make: () => new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10) },
  bottle: { color: '#5fae6b', make: () => new THREE.CylinderGeometry(0.045, 0.06, 0.22, 10) },
  paper: { color: '#f4efe4', make: () => new THREE.IcosahedronGeometry(0.08, 0) },
};

/**
 * Litter lying around the bins. When activated, each piece hops up and flies into its
 * bin one after another, disappears inside, and pops back onto the grass at the end so
 * the scene can play again.
 */
export function Litter({ id, pieces }: { id: string; pieces: LitterPiece[] }) {
  const meshes = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 2.6);
  const geometries = useMemo(() => pieces.map((p) => LITTER_LOOK[p.kind].make()), [pieces]);
  const from = useMemo(() => pieces.map((p) => new THREE.Vector3(...p.at)), [pieces]);
  const to = useMemo(() => pieces.map((p) => new THREE.Vector3(...p.bin)), [pieces]);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < pieces.length; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      if (p === null) {
        m.position.copy(from[i]);
        m.rotation.set(0, i * 1.3, pieces[i].kind === 'paper' ? 0 : Math.PI / 2);
        m.scale.setScalar(1);
        m.visible = true;
        continue;
      }
      // Each piece flies in its own slot, then everything pops back at the very end.
      const k = clamp01((p - i * 0.12) / 0.3);
      m.position.lerpVectors(from[i], to[i], smoothstep(k));
      m.position.y += Math.sin(k * Math.PI) * 0.7;
      m.rotation.x += 0.2;
      m.visible = k < 1 || p > 0.88;
      m.scale.setScalar(p > 0.88 ? smoothstep((p - 0.88) / 0.12) : 1);
      if (p > 0.88) m.position.copy(from[i]);
    }
  });

  return (
    <group>
      {pieces.map((piece, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
          geometry={geometries[i]}
          raycast={noHit}
        >
          <meshToonMaterial color={LITTER_LOOK[piece.kind].color} />
        </mesh>
      ))}
    </group>
  );
}

// --- Saplings: grow into small trees one by one ---------------------------------------

/** Grows to `to` times its size after `delay` (share of the reaction), holds, settles back. */
export function Grow({
  id,
  delay,
  to = 2,
  seconds = 3.2,
  children,
}: {
  id: string;
  delay: number;
  to?: number;
  seconds?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const progress = useReaction(id, seconds);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const up = p === null ? 0 : smoothstep(clamp01((p - delay) / 0.18));
    const down = p === null ? 0 : smoothstep(clamp01((p - 0.8) / 0.2));
    ref.current.scale.setScalar(1 + (to - 1) * up * (1 - down));
  });
  return <group ref={ref}>{children}</group>;
}

/** A gentle sway around the base, out of step per instance. */
export function Sway({ children, phase = 0 }: { children: ReactNode; phase?: number }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.9 + phase;
    ref.current.rotation.z = Math.sin(t) * 0.035;
    ref.current.rotation.x = Math.sin(t * 0.7 + 1.3) * 0.02;
  });
  return <group ref={ref}>{children}</group>;
}

// --- Collection box: coins drop into the slot -------------------------------------------

const COINS = 4;
const coinGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.016, 14);
const coinMaterial = new THREE.MeshBasicMaterial({ color: colors.accentGold });

/** A few coins appear above the slot and drop in one after another. */
export function CoinDrop({ id, slot }: { id: string; slot: Vec3 }) {
  const coins = useRef<THREE.Mesh[]>([]);
  const progress = useReaction(id, 1.8);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < COINS; i++) {
      const c = coins.current[i];
      if (!c) continue;
      const k = p === null ? -1 : (p - i * 0.15) / 0.35;
      c.visible = k > 0 && k < 1;
      if (!c.visible) continue;
      // Falls from above into the slot, standing on its edge, spinning a little.
      c.position.set(slot[0], slot[1] + 0.55 * (1 - k * k), slot[2]);
      c.rotation.set(Math.PI / 2, k * 6, 0);
    }
  });
  return (
    <group>
      {Array.from({ length: COINS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) coins.current[i] = el;
          }}
          geometry={coinGeometry}
          material={coinMaterial}
          visible={false}
          raycast={noHit}
        />
      ))}
    </group>
  );
}

// --- Noticeboard: notes shuffle and change colour --------------------------------------

const NOTE_COLORS = ['#fbe7a1', '#cfe8c4', '#f6c9b8', '#c9dcf2', '#f4efe4', '#e9d4f0'];

/**
 * Paper notes pinned on the board's face. Each activation moves every note to a new slot
 * and gives it a new colour, as if an administrator just rearranged the site's content.
 */
export function Notes({
  id,
  centre,
  width,
  height,
}: {
  id: string;
  /** Centre of the board's face, slightly in front of it. */
  centre: Vec3;
  width: number;
  height: number;
}) {
  const [round, setRound] = useState(0);
  const notes = useRef<THREE.Mesh[]>([]);
  const slots = useMemo(() => {
    const cols = 3;
    const rows = 2;
    return Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      return new THREE.Vector3(
        centre[0] + (c - (cols - 1) / 2) * (width / cols),
        centre[1] + ((rows - 1) / 2 - r) * (height / rows),
        centre[2],
      );
    });
  }, [centre, width, height]);
  const count = 5;
  /**
   * Note i's slot in a round. Multiplying by 5 (which shares no factor with the 6 slots)
   * gives every note its own slot; ×2 put two pairs of notes in the same place, where they
   * flickered as both tried to show. Each note also sits on its own thin layer, so they
   * never flicker while sliding past each other either.
   */
  const slotOf = (i: number, r: number) =>
    slots[(i * 5 + r * 2) % slots.length]!.clone().setZ(centre[2] + i * 0.004);
  // Made once: a fresh position on every render would snap the notes back to these.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const starts = useMemo(() => Array.from({ length: count }, (_, i) => slotOf(i, 0)), [slots]);
  const noteW = (width / 3) * 0.78;
  const noteH = (height / 2) * 0.72;

  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount !== prev.activeCount && s.activeObject === id) setRound((r) => r + 1);
      }),
    [id],
  );

  const target = useMemo(() => new THREE.Color(), []);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    for (let i = 0; i < count; i++) {
      const n = notes.current[i];
      if (!n) continue;
      // Each round shifts every note to another slot and another colour.
      easing.damp3(n.position, goal.copy(slotOf(i, round)), 0.25, delta);
      target.set(NOTE_COLORS[(i + round * 2) % NOTE_COLORS.length]);
      easing.dampC((n.material as THREE.MeshBasicMaterial).color, target, 0.3, delta);
      n.rotation.z = Math.sin(i * 2.3 + round) * 0.08;
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) notes.current[i] = el;
          }}
          position={starts[i]}
          raycast={noHit}
        >
          <planeGeometry args={[noteW, noteH]} />
          <meshBasicMaterial color={NOTE_COLORS[i]} {...ON_SURFACE} />
        </mesh>
      ))}
    </group>
  );
}

// --- Waterfall and falling leaves -----------------------------------------------------

/**
 * A soft white stream pouring from the rim into the clouds: a long plane whose water
 * texture scrolls downwards and fades out towards the bottom, with mist where it starts.
 */
export function Waterfall({
  top,
  outward,
  width = 0.9,
  drop = 9,
}: {
  /** Where the water leaves the rim. */
  top: Vec3;
  /** Direction away from the island centre (x, z). */
  outward: [number, number];
  width?: number;
  drop?: number;
}) {
  const water = useRef<THREE.Mesh>(null!);
  const material = useMemo(() => waterMaterial(), []);
  const mist = useMemo(() => mistTexture(), []);
  const turn = Math.atan2(outward[0], outward[1]);
  useFrame((_, delta) => {
    (water.current.material as THREE.ShaderMaterial).uniforms.time.value += delta;
  });
  return (
    <group position={top} rotation-y={turn}>
      {/* Hangs just outside the rim, facing outwards, curving slightly away as it falls. */}
      <mesh
        ref={water}
        position={[0, -drop / 2, 0.15]}
        rotation-x={0.06}
        material={material}
        raycast={noHit}
      >
        <planeGeometry args={[width, drop, 1, 1]} />
      </mesh>
      <sprite position={[0, 0.05, 0.2]} scale={[width * 1.8, 0.8, 1]} raycast={noHit}>
        <spriteMaterial map={mist} transparent depthWrite={false} opacity={0.75} />
      </sprite>
    </group>
  );
}

function waterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color('#eef8ff') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform vec3 color;
      varying vec2 vUv;
      float hash(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        // Vertical streaks that scroll down at slightly different speeds.
        float x = vUv.x * 9.0;
        float lane = floor(x);
        float speed = 0.55 + hash(lane) * 0.35;
        float v = fract(vUv.y * 2.5 + time * speed + hash(lane + 7.0));
        float streak = smoothstep(0.0, 0.25, v) * (1.0 - smoothstep(0.55, 1.0, v));
        float edges = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        // Strong at the rim (top, uv.y = 1), fading into the clouds below.
        float fade = smoothstep(0.0, 0.75, vUv.y);
        float a = (0.45 + 0.4 * streak) * edges * fade;
        gl_FragColor = vec4(color, a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function mistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0.9)');
  r.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cherry-blossom petals, matching the Grove's cherry tree. */
const LEAF_COLORS = ['#f6c3d2', '#f9d6e0', '#eeaec3', '#fbe6ec'];

/** A few petals drifting down from a tree's crown, swaying as they fall, in a loop. */
export function FallingLeaves({
  centre,
  radius = 2,
  height = 5,
  count = 12,
}: {
  centre: Vec3;
  radius?: number;
  height?: number;
  count?: number;
}) {
  const leaves = useRef<THREE.Mesh[]>([]);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * TAU + Math.sin(i * 12.9) * 0.6,
        r: radius * (0.35 + ((i * 0.37) % 0.65)),
        offset: (i * 0.618) % 1,
        speed: 0.07 + ((i * 0.13) % 0.05),
      })),
    [count, radius],
  );
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.12, 0.07), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const l = leaves.current[i];
      if (!l) continue;
      const s = seeds[i];
      const k = (t * s.speed + s.offset) % 1; // 0 = leaves the crown, 1 = reaches the grass
      l.position.set(
        centre[0] + Math.cos(s.angle) * s.r + Math.sin(t * 1.3 + i) * 0.25,
        centre[1] + height * (1 - k),
        centre[2] + Math.sin(s.angle) * s.r + Math.cos(t * 1.1 + i) * 0.25,
      );
      l.rotation.set(t * 1.7 + i, t * 1.1 + i * 2, t * 0.9);
      l.visible = k < 0.97;
    }
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) leaves.current[i] = el;
          }}
          geometry={geometry}
          raycast={noHit}
        >
          <meshBasicMaterial color={LEAF_COLORS[i % LEAF_COLORS.length]} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
