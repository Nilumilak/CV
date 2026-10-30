import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useWorld } from '@/store/useWorld';

/** Frames to render after the sky is ready, so shaders compile before the welcome fade. */
const SETTLE_FRAMES = 12;

/**
 * Moves the app from 'loading' to 'welcome' once the sky and cloud sea have loaded and the
 * scene has rendered a few frames. The Enter button appears then; the islands may still be
 * loading below the clouds (FlyIn waits for them in the cloud bank).
 */
export function LoadingReporter() {
  const frames = useRef(0);

  useFrame(() => {
    const { phase, skyReady, setPhase } = useWorld.getState();
    if (phase !== 'loading' || !skyReady) return;
    frames.current += 1;
    if (frames.current >= SETTLE_FRAMES) setPhase('welcome');
  });

  return null;
}
