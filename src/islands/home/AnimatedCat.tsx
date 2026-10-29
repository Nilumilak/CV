import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { paintedToon } from '@/materials/toon';
import { useReaction } from '@/objects/useReaction';

/** The stroll on click, in seconds: one loop round the cat's spot, then back to idle. */
const STROLL_SECONDS = 4.5;
/** How far from its spot the cat walks, in world units. */
const STROLL_RADIUS = 0.45;
/** The walk clip is one stride; this speeds it up to match the stroll. */
const WALK_SPEED = 1.4;

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const axis = new THREE.Vector3();
const turn = new THREE.Quaternion();
const parentTurn = new THREE.Quaternion();

/**
 * Turns a bone by `angle` around an axis given in world space, on top of its rest pose.
 * The rig's bones each have their own local axes; going through the world keeps "swish the
 * tail sideways" and "nod the head" meaning the same for every bone.
 */
function bend(bone: THREE.Bone, rest: THREE.Quaternion, worldAxis: THREE.Vector3, angle: number) {
  bone.parent!.getWorldQuaternion(parentTurn);
  axis.copy(worldAxis).applyQuaternion(parentTurn.invert());
  bone.quaternion.copy(turn.setFromAxisAngle(axis, angle)).multiply(rest);
}

/**
 * The Home cat: the same chubby tabby, standing, rigged as a quadruped on meshy.ai with a
 * walk cycle. Idle is made in code on its bones: it breathes, swishes its tail and now and
 * then turns its head to look around. When activated it strolls a loop round its spot with
 * the walk, then settles back where it started.
 */
export function AnimatedCat({ url, id, height }: { url: string; id: string; height: number }) {
  const { scene, animations } = useGLTF(url);
  const reduceMotion = useReducedMotion();
  const stroll = useRef<THREE.Group>(null!);
  const progress = useReaction(id, STROLL_SECONDS);

  const cat = useMemo(() => {
    // A skinned model needs a skeleton-aware copy; a plain clone would leave the copy's
    // mesh bound to the original's bones.
    const object = cloneSkinned(scene);
    object.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      mesh.material = paintedToon(original.map ?? null);
      mesh.frustumCulled = false;
    });
    // Size and seat it in its rest pose: feet on the ground, centred.
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object, true);
    const scale = height / (box.max.y - box.min.y);
    const centre = box.getCenter(new THREE.Vector3());
    const bones = new Map<string, THREE.Bone>();
    object.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
    });
    const rest = new Map([...bones].map(([name, bone]) => [name, bone.quaternion.clone()]));
    return {
      object,
      scale,
      offset: new THREE.Vector3(-centre.x, -box.min.y, -centre.z),
      bones,
      rest,
    };
  }, [scene, height]);

  const mixer = useMemo(() => new THREE.AnimationMixer(cat.object), [cat]);
  const walk = useMemo(() => {
    const clip = animations[0];
    if (!clip) return null;
    const action = mixer.clipAction(clip);
    action.setEffectiveTimeScale(WALK_SPEED).play();
    action.setEffectiveWeight(0);
    return action;
  }, [mixer, animations]);
  useEffect(() => () => void mixer.stopAllAction(), [mixer]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const p = progress(t);
    // Walk in for the stroll, out again at the end; the rest of the time the rest pose,
    // with the idle motion added on top.
    const walking = p === null ? 0 : Math.min(1, p / 0.08, (1 - p) / 0.1);
    walk?.setEffectiveWeight(walking);
    if (walking > 0) {
      mixer.update(delta);
    } else {
      for (const [name, bone] of cat.bones) bone.quaternion.copy(cat.rest.get(name)!);
    }

    // The stroll: once round a circle that starts and ends at the cat's spot, facing the
    // way it walks (its nose is +Z).
    const g = stroll.current;
    if (p === null) {
      g.position.set(0, 0, 0);
      g.rotation.y = 0;
    } else {
      const a = smoothstep(p) * Math.PI * 2;
      g.position.set(Math.sin(a) * STROLL_RADIUS, 0, (1 - Math.cos(a)) * STROLL_RADIUS);
      g.rotation.y = a;
    }

    if (reduceMotion || walking > 0) return;
    // Idle: a slow tail swish, a breath, and a look around now and then.
    const tail = ['tailstart', 'tail1', 'tail2', 'tail3'];
    tail.forEach((name, i) => {
      const bone = cat.bones.get(name);
      if (bone) bend(bone, cat.rest.get(name)!, WORLD_UP, Math.sin(t * 1.6 - i * 0.6) * 0.18);
    });
    const look = Math.max(0, Math.sin(t * 0.35)) ** 3;
    const head = cat.bones.get('head');
    if (head) bend(head, cat.rest.get('head')!, WORLD_UP, Math.sin(t * 0.6) * 0.5 * look);
    const chest = cat.bones.get('chest');
    if (chest) chest.scale.setScalar(1 + Math.sin(t * 1.8) * 0.015);
  });

  return (
    <group ref={stroll}>
      <group scale={cat.scale}>
        <primitive object={cat.object} position={cat.offset} />
      </group>
    </group>
  );
}

const smoothstep = (x: number) => x * x * (3 - 2 * x);
