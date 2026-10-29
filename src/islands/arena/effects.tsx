/**
 * Code-made effects for the Arena island (design: docs/plan/islands/arena.md).
 * Screen and scoreboard pictures are single surfaces with a polygon offset, so they never
 * z-fight with the faces of the models they sit on (see ScreenPicture on Radio).
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors, palette } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { beamShader, glareTexture } from '../lightMaterials';

type Vec3 = [number, number, number];
const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Depth bias that keeps a picture in front of the model face it is placed on. */
const PICTURE_OFFSET = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 };

/**
 * One screen of the display stands. Dimmed when idle; when activated it lights up after
 * `delay` (share of the reaction), stays lit, and dims again at the end.
 */
export function StandScreen({
  id,
  kind,
  delay,
  position,
  tilt = 0,
  width,
  height,
}: {
  id: string;
  kind: 'phone' | 'desktop' | 'gate';
  delay: number;
  position: Vec3;
  /** Degrees the screen leans back (faces upward), to match the model's screen. */
  tilt?: number;
  width: number;
  height: number;
}) {
  const screen = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 3.2);
  const texture = useMemo(() => appTexture(kind), [kind]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const lit =
      p === null
        ? 0
        : smoothstep(clamp01((p - delay) / 0.12)) * smoothstep(clamp01((1 - p) / 0.15));
    (screen.current.material as THREE.MeshBasicMaterial).color.setScalar(0.45 + 0.55 * lit);
  });
  return (
    <mesh
      ref={screen}
      position={position}
      rotation-x={THREE.MathUtils.degToRad(-tilt)}
      raycast={noHit}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} {...PICTURE_OFFSET} />
    </mesh>
  );
}

const FLAG_COLORS = [colors.accentGold, '#3C7DD9', colors.roofRed, '#5fbf5a', '#fbf3e0', '#6fb3d9'];

/** Six little team flags on poles that pop up one after another, then go down again. */
export function TeamFlags({
  id,
  position,
  spacing = 0.32,
}: {
  id: string;
  position: Vec3;
  spacing?: number;
}) {
  const flags = useRef<THREE.Group[]>([]);
  const progress = useReaction(id, 3.2);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    for (let i = 0; i < 6; i++) {
      const flag = flags.current[i];
      if (!flag) continue;
      const k =
        p === null
          ? 0
          : smoothstep(clamp01((p - 0.35 - i * 0.06) / 0.1)) * smoothstep(clamp01((1 - p) / 0.12));
      flag.visible = k > 0.001;
      flag.scale.set(1, k, 1);
    }
  });
  return (
    <group position={position}>
      {FLAG_COLORS.map((color, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) flags.current[i] = el;
          }}
          position={[(i - 2.5) * spacing, 0, 0]}
          visible={false}
        >
          <mesh position={[0, 0.35, 0]} material={palette.wood} raycast={noHit}>
            <cylinderGeometry args={[0.015, 0.02, 0.7, 6]} />
          </mesh>
          <mesh position={[0.1, 0.6, 0]} raycast={noHit}>
            <planeGeometry args={[0.2, 0.14]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * A gold tag (e.g. "−40%") that pops up above an object, rises a little and fades. Always
 * faces the camera. Its width follows the text, at a constant height.
 */
export function PercentTag({
  id,
  position,
  text = '−40%',
}: {
  id: string;
  position: Vec3;
  text?: string;
}) {
  const sprite = useRef<THREE.Sprite>(null!);
  const progress = useReaction(id, 1.6);
  const { texture, aspect } = useMemo(() => tagTexture(text), [text]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const s = sprite.current;
    s.visible = p !== null;
    if (p === null) return;
    const pop = p < 0.15 ? Math.sin((p / 0.15) * Math.PI * 0.75) * 1.2 : 1;
    s.scale.set(0.45 * aspect * pop, 0.45 * pop, 1);
    s.position.set(position[0], position[1] + p * 0.5, position[2]);
    (s.material as THREE.SpriteMaterial).opacity = p > 0.75 ? (1 - p) / 0.25 : 1;
  });
  return (
    <sprite ref={sprite} visible={false} raycast={noHit}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/** Rows of scores on the scoreboard. When activated they whizz past fast and slow to a stop. */
export function ScoreboardRows({
  id,
  position,
  width,
  height,
}: {
  id: string;
  position: Vec3;
  width: number;
  height: number;
}) {
  const board = useRef<THREE.Mesh>(null!);
  const progress = useReaction(id, 2.6);
  const texture = useMemo(() => rowsTexture(), []);
  useFrame(({ clock }, delta) => {
    const p = progress(clock.elapsedTime);
    // Speed in screen-heights per second: ramps up, cruises, eases down to a stop.
    const speed = p === null ? 0 : 9 * Math.sin(p * Math.PI) ** 1.5;
    const map = (board.current.material as THREE.MeshBasicMaterial).map!;
    map.offset.y = (map.offset.y + speed * delta * map.repeat.y) % 1;
  });
  return (
    <mesh ref={board} position={position} raycast={noHit}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} {...PICTURE_OFFSET} />
    </mesh>
  );
}

/** A glowing ball (a message) that flies in an arc from one window to the other and back. */
export function MessageBall({ id, from, to }: { id: string; from: Vec3; to: Vec3 }) {
  const ball = useRef<THREE.Group>(null!);
  const progress = useReaction(id, 2.4);
  const a = useMemo(() => new THREE.Vector3(...from), [from]);
  const b = useMemo(() => new THREE.Vector3(...to), [to]);
  useFrame(({ clock }) => {
    const p = progress(clock.elapsedTime);
    const g = ball.current;
    g.visible = p !== null;
    if (p === null) return;
    // There and back: 0 → 0.5 goes a → b, 0.5 → 1 comes back.
    const k = smoothstep(p < 0.5 ? p * 2 : (1 - p) * 2);
    g.position.lerpVectors(a, b, k);
    g.position.y += Math.sin(k * Math.PI) * 0.35;
  });
  return (
    <group ref={ball} visible={false}>
      <mesh raycast={noHit}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshBasicMaterial color="#fff1c4" />
      </mesh>
      <pointLight color={colors.accentGold} intensity={1.5} distance={2} decay={2} />
    </group>
  );
}

// --- Canvas drawings -------------------------------------------------------------

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

const BLUE = '#3C7DD9';

/** A simple app screen: mobile, desktop or a login gate. No real content. */
function appTexture(kind: 'phone' | 'desktop' | 'gate') {
  const [w, h] = kind === 'phone' ? [200, 400] : kind === 'desktop' ? [400, 260] : [260, 320];
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#f4f7fb';
    g.fillRect(0, 0, w, h);
    g.fillStyle = BLUE;
    g.fillRect(0, 0, w, kind === 'phone' ? 46 : 36);
    if (kind === 'gate') {
      // Login: avatar, two fields, a button.
      g.fillStyle = '#cdd9ec';
      g.beginPath();
      g.arc(w / 2, 100, 32, 0, Math.PI * 2);
      g.fill();
      box(g, 40, 160, w - 80, 30, 8);
      box(g, 40, 205, w - 80, 30, 8);
      g.fillStyle = colors.accentGold;
      box(g, 70, 255, w - 140, 34, 17);
      return;
    }
    // A list of events with odds buttons.
    const rows = kind === 'phone' ? 6 : 4;
    const top = kind === 'phone' ? 66 : 54;
    const rowH = kind === 'phone' ? 52 : 46;
    for (let r = 0; r < rows; r++) {
      const y = top + r * rowH;
      g.fillStyle = '#dfe7f3';
      box(g, 14, y, w - 28, rowH - 10, 8);
      g.fillStyle = '#9fb3d1';
      box(g, 26, y + 10, w * 0.35, 10, 5);
      g.fillStyle = r % 2 ? colors.accentGold : BLUE;
      for (let b = 0; b < (kind === 'phone' ? 2 : 3); b++)
        box(g, w - 30 - (b + 1) * 46, y + 8, 40, rowH - 26, 6);
    }
  });
}

/** Long strip of score rows; the scoreboard shows a window of it and scrolls through. */
function rowsTexture() {
  const W = 320,
    ROW = 40,
    ROWS = 48;
  const texture = canvasTexture(W, ROW * ROWS, (g) => {
    g.fillStyle = '#1d3557';
    g.fillRect(0, 0, W, ROW * ROWS);
    for (let r = 0; r < ROWS; r++) {
      const y = r * ROW;
      g.fillStyle = r % 2 ? '#24406a' : '#1d3557';
      g.fillRect(0, y, W, ROW);
      g.fillStyle = '#f3c25b';
      box(g, 14, y + 12, 22, 16, 4);
      g.fillStyle = '#d9e4f5';
      box(g, 48, y + 14, 90 + ((r * 37) % 70), 12, 6);
      g.fillStyle = '#fff6d8';
      box(g, W - 76, y + 10, 26, 20, 4);
      box(g, W - 44, y + 10, 26, 20, 4);
    }
  });
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.y = 8 / ROWS; // 8 rows visible at a time
  return texture;
}

/** A gold rounded tag with the text in dark ink. */
/** A gold rounded tag sized to its text; returns the texture and its width ÷ height. */
function tagTexture(text: string) {
  const font = 'bold 64px Fredoka, Nunito, system-ui, sans-serif';
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const w = Math.max(256, Math.ceil(measure.measureText(text).width) + 90);
  const texture = canvasTexture(w, 128, (g) => {
    g.fillStyle = colors.accentGold;
    box(g, 6, 6, w - 12, 116, 40);
    g.fillStyle = '#2b2422';
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, 68);
  });
  return { texture, aspect: w / 128 };
}

/**
 * Stadium floodlights as light, not objects: a soft glare at each lamp head, a faint beam
 * falling to the pitch, and one gentle light that brightens the pitch. Nothing has a hard
 * edge: the glare fades out from its centre, and the beams fade along their length and
 * towards their sides.
 */
export function Floodlights({
  lamps,
  pitch,
  beamReach = 0.6,
}: {
  lamps: Vec3[];
  /** Where the lamps point: the middle of the pitch. */
  pitch: Vec3;
  /** How far each beam reaches towards the pitch, as a share of the way. */
  beamReach?: number;
}) {
  const glare = useMemo(() => glareTexture(), []);
  const beams = useMemo(
    () =>
      lamps.map((lamp) => {
        const from = new THREE.Vector3(...lamp);
        const to = from.clone().lerp(new THREE.Vector3(...pitch), beamReach);
        const length = from.distanceTo(to);
        const middle = from.clone().add(to).multiplyScalar(0.5);
        // The cylinder's +Y end is the narrow lamp end.
        const up = from.clone().sub(to).normalize();
        const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
        return { length, middle: middle.toArray() as Vec3, turn };
      }),
    [lamps, pitch, beamReach],
  );
  const beamMaterial = useMemo(() => beamShader(), []);

  return (
    <group>
      {lamps.map((lamp, i) => (
        <sprite key={`glare-${i}`} position={lamp} scale={0.9} raycast={noHit}>
          <spriteMaterial
            map={glare}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
      {beams.map((b, i) => (
        <mesh
          key={`beam-${i}`}
          position={b.middle}
          quaternion={b.turn}
          material={beamMaterial}
          renderOrder={3}
          raycast={noHit}
        >
          <cylinderGeometry args={[0.1, 0.85, b.length, 24, 1, true]} />
        </mesh>
      ))}
      <pointLight
        position={[pitch[0], pitch[1] + 1.6, pitch[2]]}
        color="#fff4dc"
        intensity={1.2}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}
