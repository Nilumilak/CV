import { useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { paintedToon } from '@/materials/toon';

type GroupProps = Omit<ThreeElements['group'], 'children'>;

interface GeneratedModelProps extends GroupProps {
  url: string;
  /** Final height in world units (metres). */
  height?: number;
  /** Final size of the longest horizontal side, used when height is not given. */
  length?: number;
  /** Extra objects in world units, relative to the model's base centre (e.g. a window insert). */
  children?: ReactNode;
}

const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();

/**
 * An AI-generated model, normalised so it can be placed like real furniture:
 * scaled to a real-world size, centred on X/Z, bottom resting at y = 0,
 * and its painted texture wrapped in soft toon lighting.
 */
export function GeneratedModel({ url, height, length, children, ...group }: GeneratedModelProps) {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      mesh.material = paintedToon(original.map ?? null);
    });

    box.setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
    const scale = height ? height / size.y : length ? length / Math.max(size.x, size.z) : 1;
    // Offset in the model's own units, applied before scaling.
    const offset: [number, number, number] = [-center.x, -box.min.y, -center.z];
    return { object, scale, offset };
  }, [scene, height, length]);

  return (
    <group {...group}>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
      {children}
    </group>
  );
}
