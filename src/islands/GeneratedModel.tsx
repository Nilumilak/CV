import { forwardRef, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { paintedToon } from '@/materials/toon';

type GroupProps = Omit<ThreeElements['group'], 'children' | 'ref'>;

interface GeneratedModelProps extends GroupProps {
  url: string;
  /** Final height in world units (metres). */
  height?: number;
  /** Final size of the longest horizontal side, used when height is not given. */
  length?: number;
  /**
   * Which point of the model sits at the group origin.
   * 'bottom' (default): props standing on the ground. 'top': an island base whose grass is at y = 0.
   */
  anchor?: 'bottom' | 'top';
  /**
   * What sits on the vertical axis through the group origin.
   * 'bounds' (default): the middle of the whole model.
   * 'base': the middle of its foot, for models that turn around a post whose top leans
   * to one side (a dish turns around its post, not around the middle of the bowl).
   */
  centre?: 'bounds' | 'base';
  /** Extra objects in world units, relative to the model's anchor point (e.g. a window insert). */
  children?: ReactNode;
}

const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();

/** The bottom share of a model's height that counts as its foot, for centre="base". */
const FOOT_SLICE = 0.1;
const vertex = new THREE.Vector3();
const foot = new THREE.Box3();

/** Writes the X/Z middle of every vertex below `maxY` (the model's foot) into `out`. */
function footCentre(object: THREE.Object3D, maxY: number, out: THREE.Vector3) {
  foot.makeEmpty();
  object.updateMatrixWorld(true);
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      if (vertex.y <= maxY) foot.expandByPoint(vertex);
    }
  });
  if (foot.isEmpty()) return;
  out.x = (foot.min.x + foot.max.x) / 2;
  out.z = (foot.min.z + foot.max.z) / 2;
}

/** One toon material per source texture, shared by every copy of the same model. */
const materialCache = new WeakMap<THREE.Texture, THREE.Material>();
const sharedPaintedToon = (map: THREE.Texture | null) => {
  if (!map) return paintedToon(null);
  let material = materialCache.get(map);
  if (!material) {
    material = paintedToon(map);
    materialCache.set(map, material);
  }
  return material;
};

/**
 * An AI-generated model, normalised so it can be placed like real furniture:
 * scaled to a real-world size, centred on X/Z, resting on its anchor point,
 * and its painted texture wrapped in soft toon lighting.
 * Copies of the same model share geometry and material.
 */
export const GeneratedModel = forwardRef<THREE.Group, GeneratedModelProps>(function GeneratedModel(
  { url, height, length, anchor = 'bottom', centre = 'bounds', children, ...group },
  ref,
) {
  const { scene } = useGLTF(url);

  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as THREE.MeshStandardMaterial;
      mesh.material = sharedPaintedToon(original.map ?? null);
    });

    box.setFromObject(object);
    box.getSize(size);
    box.getCenter(center);
    if (centre === 'base') footCentre(object, box.min.y + size.y * FOOT_SLICE, center);
    const scale = height ? height / size.y : length ? length / Math.max(size.x, size.z) : 1;
    // Offset in the model's own units, applied before scaling.
    const y = anchor === 'top' ? -box.max.y : -box.min.y;
    const offset: [number, number, number] = [-center.x, y, -center.z];
    return { object, scale, offset };
  }, [scene, height, length, anchor, centre]);

  return (
    <group ref={ref} {...group}>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
      {children}
    </group>
  );
});
