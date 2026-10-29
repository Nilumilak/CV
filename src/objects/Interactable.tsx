import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';
import { sound, type SoundCue } from '@/audio/sound';
import type { IslandId } from '@/data/types';
import { colors } from '@/materials/toon';
import { useWorld } from '@/store/useWorld';
import { tooltip } from './tooltip';

interface InteractableProps {
  id: string;
  island: IslandId;
  /** Hover hint, e.g. "Skills". */
  label: string;
  cue: SoundCue;
  /**
   * Whether hovering lifts (slightly enlarges) the object. Turn it off for a group spread
   * across the island, such as a row of saplings: the lift grows around the group origin,
   * which would slide every member sideways instead of lifting it.
   */
  lift?: boolean;
  children: ReactNode;
}

const GLOW = new THREE.Color(colors.accentGold);
/** Seconds the hover lift and glow take to settle. Slow enough to feel soft, not snappy. */
const HOVER_EASE = 0.3;
/** How strongly a hovered or hinted object glows gold. */
const GLOW_INTENSITY = 0.32;

type Glowing = THREE.Material & { emissive: THREE.Color; emissiveIntensity: number };
const canGlow = (m: THREE.Material): m is Glowing => 'emissive' in m;

/**
 * Makes an object on an island clickable. It works only on the focused island; in the
 * overview, the click falls through to the island and focuses it.
 *
 * Hover: a gold glow, a slight lift in scale, a pointer cursor and a hint.
 * The object also glows while its section is hovered in the panel.
 * Click: activates the object in the store. Reactions and the panel listen for that,
 * so the panel's "Show me" buttons play exactly the same thing.
 */
export function Interactable({ id, island, label, cue, lift = true, children }: InteractableProps) {
  const ref = useRef<THREE.Group>(null!);
  const glow = useRef(0);
  const glowingMeshes = useRef<THREE.Mesh[]>([]);
  const [hovered, setHovered] = useState(false);
  const enabled = useWorld((s) => s.focused === island);
  const hinted = useWorld((s) => s.hintObject === id);
  const activate = useWorld((s) => s.activateObject);
  const active = hovered && enabled;

  useCursor(active);

  // Own copies of the materials, so glowing one object never lights up another.
  useLayoutEffect(() => {
    const own: THREE.Material[] = [];
    const meshes: THREE.Mesh[] = [];
    ref.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      const copy = mesh.material.clone();
      mesh.material = copy;
      own.push(copy);
      if (canGlow(copy)) {
        copy.emissive.copy(GLOW);
        copy.emissiveIntensity = 0;
        meshes.push(mesh);
      }
    });
    glowingMeshes.current = meshes;
    return () => own.forEach((m) => m.dispose());
  }, []);

  // The sound follows activations, so clicks and "Show me" sound the same.
  useEffect(
    () =>
      useWorld.subscribe((s, prev) => {
        if (s.activeCount !== prev.activeCount && s.activeObject === id) sound.cue(cue, id);
      }),
    [id, cue],
  );

  useEffect(() => {
    if (!active) tooltip.hide(id);
  }, [active, id]);
  useEffect(() => () => tooltip.hide(id), [id]);

  useFrame((_, delta) => {
    easing.damp(glow, 'current', active || hinted ? GLOW_INTENSITY : 0, HOVER_EASE, delta);
    const meshes = glowingMeshes.current;
    for (let i = 0; i < meshes.length; i++) {
      (meshes[i].material as Glowing).emissiveIntensity = glow.current;
    }
    easing.damp3(ref.current.scale, active && lift ? 1.05 : 1, HOVER_EASE, delta);
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        if (!enabled) return;
        e.stopPropagation();
        setHovered(true);
        tooltip.show(id, label, e.nativeEvent.clientX, e.nativeEvent.clientY);
      }}
      onPointerMove={(e) => {
        if (enabled) tooltip.move(e.nativeEvent.clientX, e.nativeEvent.clientY);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (!enabled) return; // let the click reach the island and focus it
        e.stopPropagation();
        activate(id);
      }}
    >
      {children}
    </group>
  );
}
