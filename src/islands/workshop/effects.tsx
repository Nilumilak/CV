/**
 * Code-made effects for the Workshop island (design: docs/plan/islands/workshop.md).
 * Pictures on model faces are single surfaces with a polygon offset, so they never z-fight.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReaction } from '@/objects/useReaction';

type Vec3 = [number, number, number];
const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Depth bias that keeps a code-made surface in front of the model face it sits on. */
const ON_SURFACE = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };

// --- Steam whistle: a puff of steam and the team in hard hats ---------------------------

const HAT_BLUE = '#3C7DD9';
const HAT_ORANGE = '#e8892c';

/**
 * The team: 5 blue hard hats (developers) above 15 orange ones (machine workers and
 * assemblers), in rows of five. They pop up one after another, hold, and fade.
 */
export function HardHats({ id, position }: { id: string; position: Vec3 }) {
  const hats = useRef<THREE.Group[]>([]);
  const progress = useReaction(id, 3.4);
  const layout = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        x: ((i % 5) - 2) * 0.3,
        y: 0.9 - Math.floor(i / 5) * 0.28,
        color: i < 5 ? HAT_BLUE : HAT_ORANGE,
      })),
    [],
  );
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < 20; i++) {
      const hat = hats.current[i];
      if (!hat) continue;
      const k = p === null ? 0 : smoothstep(clamp01((p - 0.08 - i * 0.025) / 0.1));
      const out = p === null ? 0 : smoothstep(clamp01((p - 0.85) / 0.15));
      const s = k * (1 - out);
      hat.visible = s > 0.001;
      hat.scale.setScalar(s);
      hat.position.set(layout[i].x, layout[i].y + (1 - k) * -0.2, 0);
    }
  });
  return (
    <group position={position}>
      {layout.map((h, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) hats.current[i] = el;
          }}
          visible={false}
        >
          {/* Dome and brim. */}
          <mesh raycast={noHit}>
            <sphereGeometry args={[0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshToonMaterial color={h.color} />
          </mesh>
          <mesh position-y={0.005} raycast={noHit}>
            <cylinderGeometry args={[0.14, 0.14, 0.015, 16]} />
            <meshToonMaterial color={h.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

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

// --- Oscilloscope: a sine wave draws across the screen --------------------------------

/**
 * The oscilloscope's screen: a flat trace when idle; when activated a sine wave sweeps in
 * from the left, then its frequency steps up twice (synthesizers, stabilizers), and it
 * settles back to a flat line.
 */
export function ScopeTrace({
  id,
  position,
  width,
  height,
  tilt = 0,
}: {
  id: string;
  position: Vec3;
  width: number;
  height: number;
  tilt?: number;
}) {
  const screen = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 3.6);
  const material = useMemo(() => scopeMaterial(), []);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const u = (screen.current.material as THREE.ShaderMaterial).uniforms;
    u.time.value = clock.elapsedTime;
    u.reveal.value = p === null ? 1 : clamp01(p / 0.3);
    u.amp.value =
      p === null ? 0 : smoothstep(clamp01(p / 0.1)) * (1 - smoothstep(clamp01((p - 0.88) / 0.12)));
    u.freq.value = p === null ? 1 : p < 0.4 ? 1.5 : p < 0.65 ? 3 : 5;
  });
  return (
    <mesh
      ref={screen}
      position={position}
      rotation-x={THREE.MathUtils.degToRad(-tilt)}
      material={material}
      raycast={noHit}
    >
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}

function scopeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      reveal: { value: 1 },
      amp: { value: 0 },
      freq: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform float reveal;
      uniform float amp;
      uniform float freq;
      varying vec2 vUv;
      void main() {
        vec3 bg = vec3(0.05, 0.16, 0.09);
        // Faint grid.
        vec2 g = abs(fract(vUv * vec2(8.0, 6.0)) - 0.5);
        float grid = 1.0 - smoothstep(0.46, 0.5, max(g.x, g.y));
        vec3 col = bg + vec3(0.03, 0.09, 0.05) * (1.0 - grid);
        // The trace, drawn up to the reveal point.
        float y = 0.5 + amp * 0.32 * sin(6.2832 * freq * vUv.x - time * 2.0);
        float d = abs(vUv.y - y);
        float line = (1.0 - smoothstep(0.012, 0.03, d)) * step(vUv.x, reveal);
        float glow = (1.0 - smoothstep(0.0, 0.09, d)) * 0.35 * step(vUv.x, reveal);
        col += vec3(0.45, 1.0, 0.55) * (line + glow);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    ...ON_SURFACE,
  });
}

// --- Circuit board: 100+ tiny parts light up in a wave -------------------------------

const PARTS = 120;

/**
 * Tiny lights spread over the board's face. When activated a wave sweeps across the board
 * from one corner and each part glows as it passes, then the board goes quiet again.
 */
export function BoardLights({
  id,
  centre,
  width,
  height,
  tilt = 0,
}: {
  id: string;
  /** Centre of the board's face, slightly in front of it. */
  centre: Vec3;
  width: number;
  height: number;
  tilt?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const progress = useReaction(id, 2.4);
  const { matrices, order } = useMemo(() => {
    const m = new THREE.Matrix4();
    const out: THREE.Matrix4[] = [];
    const ord: number[] = [];
    const cols = 12;
    for (let i = 0; i < PARTS; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const rows = Math.ceil(PARTS / cols);
      // A loose grid with a little jitter, like parts placed on a real board.
      const x = ((c + 0.5) / cols - 0.5) * width + Math.sin(i * 12.9) * 0.012;
      const y = ((r + 0.5) / rows - 0.5) * height + Math.cos(i * 7.3) * 0.012;
      out.push(m.clone().makeTranslation(x, y, 0));
      ord.push((c / cols + (rows - r) / rows) / 2); // wave from the top-left corner
    }
    return { matrices: out, order: ord };
  }, [width, height]);
  const color = useMemo(() => new THREE.Color(), []);
  const warm = useMemo(() => new THREE.Color('#ffe9a8'), []);
  const off = useMemo(() => new THREE.Color('#2f5a33'), []);

  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const im = mesh.current;
    im.visible = p !== null;
    if (p === null) return;
    const front = p * 1.5 - 0.15;
    for (let i = 0; i < PARTS; i++) {
      const lit = Math.max(0, 1 - Math.abs(front - order[i]) / 0.18);
      const settle = 1 - smoothstep(clamp01((p - 0.8) / 0.2));
      color.copy(off).lerp(warm, Math.max(lit, front > order[i] ? 0.35 * settle : 0));
      im.setColorAt(i, color);
    }
    im.instanceColor!.needsUpdate = true;
  });

  return (
    <group position={centre} rotation-x={THREE.MathUtils.degToRad(-tilt)}>
      <instancedMesh
        ref={(el) => {
          if (!el) return;
          mesh.current = el;
          matrices.forEach((m, i) => el.setMatrixAt(i, m));
          el.instanceMatrix.needsUpdate = true;
        }}
        args={[undefined, undefined, PARTS]}
        visible={false}
        raycast={noHit}
      >
        <circleGeometry args={[0.018, 8]} />
        <meshBasicMaterial toneMapped={false} {...ON_SURFACE} />
      </instancedMesh>
    </group>
  );
}

// --- Lectern: a sheet of Python unrolls -----------------------------------------------

/** A sheet of code unrolling down from the scroll, holding, then rolling back up. */
export function UnrollSheet({
  id,
  top,
  width = 0.42,
  length = 0.75,
  tilt = 0,
}: {
  id: string;
  /** Where the sheet hangs from (the scroll). */
  top: Vec3;
  width?: number;
  length?: number;
  tilt?: number;
}) {
  const sheet = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 2.8);
  const texture = useMemo(() => pythonSheetTexture(), []);
  const geometry = useMemo(() => {
    // Top edge at the origin, so scaling Y unrolls it downwards from the scroll.
    const g = new THREE.PlaneGeometry(width, length);
    g.translate(0, -length / 2, 0);
    return g;
  }, [width, length]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const g = sheet.current;
    g.visible = p !== null;
    if (p === null) return;
    const open = smoothstep(clamp01(p / 0.25)) * (1 - smoothstep(clamp01((p - 0.8) / 0.2)));
    g.scale.set(1, Math.max(open, 0.001), 1);
  });
  return (
    <group ref={sheet} position={top} rotation-x={THREE.MathUtils.degToRad(-tilt)} visible={false}>
      <mesh geometry={geometry} raycast={noHit}>
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function pythonSheetTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 456;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#fbf3e0';
  g.fillRect(0, 0, 256, 456);
  // Python-ish colours: keywords, names, strings, comments, with indentation.
  const lines: [number, string, number][] = [
    [0, '#7a4bb3', 70],
    [1, '#2e6fcf', 120],
    [1, '#4e8b3a', 90],
    [2, '#c9573e', 110],
    [2, '#2b2422', 80],
    [1, '#9a8f7d', 130],
    [0, '#7a4bb3', 60],
    [1, '#2e6fcf', 100],
    [2, '#c9573e', 120],
    [2, '#4e8b3a', 70],
    [1, '#2b2422', 110],
    [0, '#9a8f7d', 140],
    [0, '#7a4bb3', 80],
    [1, '#2e6fcf', 90],
    [1, '#c9573e', 115],
    [0, '#2b2422', 60],
  ];
  lines.forEach(([indent, color, w], i) => {
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(22 + indent * 20, 22 + i * 26, w, 11, 5);
    g.fill();
  });
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
