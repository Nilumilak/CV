/**
 * Code-made effects for the Lighthouse island (design: docs/plan/islands/lighthouse.md).
 * Motion and light only, nothing drawn on a model's surface.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { gradientMap } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';
import { beamShader, glareTexture } from '../lightMaterials';

type Vec3 = [number, number, number];
const noHit = () => null;
const smoothstep = (x: number) => x * x * (3 - 2 * x);
/** The same angle brought into −π..π, so a turn always takes the short way round. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

// --- The lamp and its beam -------------------------------------------------------------

const BEAM_LENGTH = 7;
const IDLE_TURN = 0.45; // radians per second
const BEAM_IDLE = 0.32;
const BEAM_PEAK = 0.55;

/**
 * Two soft light beams back to back, turning slowly round the lamp, with a warm glare at
 * the lamp itself. When the lighthouse is activated the beams swing round to shine at the
 * camera and the lamp flares up, then they go back to turning.
 */
export function LighthouseBeam({ id, position }: { id: string; position: Vec3 }) {
  const frame = useRef<THREE.Group>(null!);
  const turn = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  /** One of the two beams; both share its material. */
  const beam = useRef<THREE.Mesh>(null!);
  const glare = useRef<THREE.Sprite>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const yaw = useRef(0);
  const camera = useMemo(() => new THREE.Vector3(), []);
  const glareMap = useMemo(() => glareTexture(), []);
  const material = useMemo(() => beamShader(), []);
  const reduceMotion = useReducedMotion();
  const progress = useReaction(id, 3.4);

  useFrame((state, delta) => {
    const p = progress(state.clock.elapsedTime);
    // How strongly the beam is held on the camera: swings in, holds, swings back out.
    const hold =
      p === null ? 0 : p < 0.3 ? smoothstep(p / 0.3) : p < 0.7 ? 1 : smoothstep((1 - p) / 0.3);
    // A flash as the beam reaches the camera.
    const flash = p === null ? 0 : Math.max(0, 1 - Math.abs(p - 0.32) / 0.12);

    if (!reduceMotion) yaw.current += delta * IDLE_TURN * (1 - hold);

    // Where the camera is, seen from the lamp.
    frame.current.worldToLocal(camera.copy(state.camera.position));
    const toCamera = Math.atan2(-camera.z, camera.x);
    const upToCamera = Math.atan2(camera.y, Math.hypot(camera.x, camera.z));
    turn.current.rotation.y = yaw.current + wrap(toCamera - yaw.current) * hold;
    tilt.current.rotation.z = upToCamera * hold;

    const beamMaterial = beam.current.material as THREE.ShaderMaterial;
    beamMaterial.uniforms.strength!.value = BEAM_IDLE + (BEAM_PEAK - BEAM_IDLE) * hold;
    glare.current.scale.setScalar(1.6 + 2.4 * hold + 2.5 * flash);
    light.current.intensity = 0.8 + 3 * hold + 4 * flash;
  });

  return (
    <group ref={frame} position={position}>
      <group ref={turn}>
        <group ref={tilt}>
          {[0, Math.PI].map((side) => (
            <group key={side} rotation-y={side}>
              {/* The cylinder's narrow +Y end sits at the lamp; the beam runs out along +X. */}
              <mesh
                ref={side === 0 ? beam : undefined}
                position={[BEAM_LENGTH / 2, 0, 0]}
                rotation-z={Math.PI / 2}
                material={material}
                renderOrder={3}
                raycast={noHit}
              >
                <cylinderGeometry args={[0.18, 1.5, BEAM_LENGTH, 24, 1, true]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <sprite ref={glare} raycast={noHit}>
        <spriteMaterial
          map={glareMap}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <pointLight ref={light} color="#ffe6b0" distance={6} decay={2} />
    </group>
  );
}

// --- Seagull ---------------------------------------------------------------------------

const gullWhite = new THREE.MeshToonMaterial({ color: '#fbfaf6', gradientMap });
const gullBeak = new THREE.MeshToonMaterial({ color: '#f0a63a', gradientMap });
/** Wings and tail are coloured per vertex: grey, with dark tips on the wings. */
const gullFeathers = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });

const FEATHER_GREY = new THREE.Color('#aab3bb');
const WING_TIP = new THREE.Color('#3f454b');

/**
 * A thin, soft-edged plate from an outline drawn in "outwards, forwards" coordinates,
 * laid flat with forwards along −Z (the way the gull flies). Vertices past `tipFrom`
 * (outwards) fade to the dark wingtip colour.
 */
function featherPlate(outline: [number, number][][], tipFrom = Infinity) {
  const shape = new THREE.Shape();
  shape.moveTo(...outline[0]![0]!);
  for (const [control, end] of outline.slice(1)) shape.quadraticCurveTo(...control!, ...end!);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.01,
    bevelSegments: 1,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -0.006);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.getAttribute('position');
  const colour = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const tip = THREE.MathUtils.clamp((Math.abs(pos.getX(i)) - tipFrom) / 0.1, 0, 1);
    c.copy(FEATHER_GREY)
      .lerp(WING_TIP, tip)
      .toArray(colour, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colour, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A gull's wing, from the body outwards: broad at the root, a slight forward bend at the
 * elbow, then swept back to a pointed tip. `side` is +1 for the left wing (+X), −1 for the
 * right.
 */
function wingGeometry(side: 1 | -1) {
  const p = (x: number, y: number): [number, number] => [side * x, y];
  return featherPlate(
    [
      [p(0, 0.09)],
      [p(0.24, 0.17), p(0.42, 0.1)], // leading edge, out to the elbow
      [p(0.6, 0.03), p(0.76, -0.15)], // swept back to the tip
      [p(0.52, -0.1), p(0.38, -0.05)], // trailing edge, back in to the elbow
      [p(0.18, -0.15), p(0, -0.11)], // and to the body
    ],
    0.56,
  );
}

const leftWing = wingGeometry(1);
const rightWing = wingGeometry(-1);
/** A small fan-shaped tail, spreading backwards. */
const tail = featherPlate([
  [[-0.05, 0]],
  [
    [0, 0.02],
    [0.05, 0],
  ],
  [
    [0.09, -0.08],
    [0.07, -0.15],
  ],
  [
    [0, -0.12],
    [-0.07, -0.15],
  ],
  [
    [-0.09, -0.08],
    [-0.05, 0],
  ],
]);

/**
 * A seagull made of a few simple shapes, gliding in slow circles round a point and
 * flapping now and then. It flies towards its local −Z.
 */
export function Seagull({
  centre,
  radius,
  speed = 0.35,
  phase = 0,
}: {
  centre: Vec3;
  radius: number;
  speed?: number;
  phase?: number;
}) {
  const orbit = useRef<THREE.Group>(null!);
  const bird = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const reduceMotion = useReducedMotion();

  useFrame(({ clock }) => {
    const t = reduceMotion ? 0 : clock.elapsedTime + phase;
    orbit.current.rotation.y = t * speed;
    bird.current.position.y = Math.sin(t * 0.5) * 0.3;
    // Glides most of the time; every few seconds, a short burst of flapping.
    const burst = Math.max(0, Math.sin(t * 0.55)) ** 4;
    const flap = Math.sin(t * 9) * (0.08 + 0.55 * burst) + 0.12;
    left.current.rotation.z = flap;
    right.current.rotation.z = -flap;
  });

  return (
    <group position={centre}>
      <group ref={orbit}>
        {/* Banked a little into the turn. */}
        <group ref={bird} position={[radius, 0, 0]} rotation-z={0.25}>
          <mesh material={gullWhite} scale={[0.13, 0.12, 0.34]} raycast={noHit}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
          <mesh material={gullWhite} position={[0, 0.07, -0.3]} raycast={noHit}>
            <sphereGeometry args={[0.09, 10, 8]} />
          </mesh>
          <mesh
            material={gullBeak}
            position={[0, 0.06, -0.42]}
            rotation-x={-Math.PI / 2}
            raycast={noHit}
          >
            <coneGeometry args={[0.03, 0.1, 6]} />
          </mesh>
          <mesh geometry={tail} material={gullFeathers} position={[0, 0.03, 0.3]} raycast={noHit} />
          {/* Wings hinge at the body's sides. */}
          <group ref={left} position={[0.08, 0.04, 0]}>
            <mesh geometry={leftWing} material={gullFeathers} raycast={noHit} />
          </group>
          <group ref={right} position={[-0.08, 0.04, 0]}>
            <mesh geometry={rightWing} material={gullFeathers} raycast={noHit} />
          </group>
        </group>
      </group>
    </group>
  );
}
