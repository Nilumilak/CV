import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import deskUrl from '@/assets/textures/home/desk-window.webp?url';

interface DeskWindowProps {
  position: [number, number, number];
  radius: number;
}

/**
 * The painted lofi desk seen through the cottage's round window.
 * Unlit and slightly warm, so it reads as a lamp-lit room inside.
 */
export function DeskWindow({ position, radius }: DeskWindowProps) {
  const map = useTexture(deskUrl, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  return (
    <mesh position={position}>
      <circleGeometry args={[radius, 40]} />
      <meshBasicMaterial map={map} color="#ffe2b8" toneMapped={false} />
    </mesh>
  );
}
