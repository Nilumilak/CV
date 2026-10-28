import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { useWorld } from '@/store/useWorld';

/** Frames to wait before trusting "nothing is loading": loaders may not have started yet. */
const SETTLE_FRAMES = 12;

/**
 * Moves the app from 'loading' to 'welcome' once the scene has rendered a few frames
 * and drei's loading manager reports no pending assets. The Enter button appears then.
 */
export function LoadingReporter() {
  const { active } = useProgress();
  const frames = useRef(0);

  useFrame(() => {
    const { phase, setPhase } = useWorld.getState();
    if (phase !== 'loading') return;
    frames.current = active ? 0 : frames.current + 1;
    if (frames.current >= SETTLE_FRAMES) setPhase('welcome');
  });

  return null;
}
